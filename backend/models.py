from __future__ import annotations

import uuid
from datetime import datetime, date, time

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Index,
    Integer, String, Text, Time, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


def _meeting_code() -> str:
    """Generate a human-friendly 9-digit code formatted as XXX-XXX-XXX."""
    raw = str(abs(hash(uuid.uuid4().hex)))[:9].zfill(9)
    return f"{raw[:3]}-{raw[3:6]}-{raw[6:9]}"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    # Hex colour shown in the avatar circle (e.g. "#2D8CFF")
    avatar_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#2D8CFF")
    # Two-letter initials derived from the name at seed time
    initials: Mapped[str] = mapped_column(String(8), nullable=False, default="AM")
    # Hashed password — None for legacy seed users
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    hosted_meetings: Mapped[list["Meeting"]] = relationship(back_populates="host")
    participations: Mapped[list["Participant"]] = relationship(back_populates="user")


# ---------------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------------
class Meeting(Base):
    """Core meeting record.

    Relationship decisions
    ----------------------
    * host_id → users: every meeting has exactly one authoritative host.
      We CASCADE-delete meetings when the host user is removed so orphaned
      rooms never accumulate.
    * One-to-one with ScheduledMeeting (optional): only "scheduled" type
      meetings carry scheduling metadata; instant meetings don't need it.
    * One-to-one with MeetingLink: we generate one canonical invite token
      per meeting.  Using the meeting_code itself as the join URL works for
      most cases but a separate token lets us invalidate/rotate links
      independently of the code (useful for security).
    * One-to-many with Participant: cascade-deletes keep participants from
      outliving their meeting.
    """
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_code: Mapped[str] = mapped_column(
        String(11), unique=True, index=True, default=_meeting_code, nullable=False
    )
    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # "instant" | "scheduled"
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="instant")
    # "scheduled" | "active" | "ended"
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    host: Mapped["User"] = relationship(back_populates="hosted_meetings")
    scheduled: Mapped["ScheduledMeeting | None"] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", uselist=False
    )
    participants: Mapped[list["Participant"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    invite_link: Mapped["MeetingLink | None"] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", uselist=False
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Scheduled Meetings
# ---------------------------------------------------------------------------
class ScheduledMeeting(Base):
    """Extra metadata that only applies to meetings created via "Schedule".

    Why a separate table?
    ---------------------
    Instant meetings have no scheduling data, so flattening these columns
    into `meetings` would leave them NULL for the majority of rows.  A
    separate 1:1 table keeps `meetings` lean and makes it trivially clear
    which records are scheduled vs instant.
    """
    __tablename__ = "scheduled_meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    scheduled_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")

    meeting: Mapped["Meeting"] = relationship(back_populates="scheduled")


# ---------------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------------
class Participant(Base):
    """One row per user–meeting join event.

    user_id is nullable to support unauthenticated guests who join via an
    invite link.  is_host is denormalised here (vs. checking host_id on
    Meeting) so that the participants list endpoint can be rendered without
    a join to the meetings table.
    """
    __tablename__ = "participants"
    __table_args__ = (
        Index("ix_participants_meeting_active", "meeting_id", "left_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_host: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_muted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_video_on: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
    user: Mapped["User | None"] = relationship(back_populates="participations")


# ---------------------------------------------------------------------------
# Meeting Links  (invite tokens)
# ---------------------------------------------------------------------------
class MeetingLink(Base):
    """Stores the invite token for a meeting.

    Design note: we store a separate invite_token (opaque URL-safe string)
    rather than exposing the numeric meeting ID in invite URLs.  This means
    invite links can be revoked/rotated by issuing a new token without
    changing the meeting_code used in the UI.  The meeting_code is still
    human-shareable ("123-456-789"); the token is for programmatic link
    sharing.
    """
    __tablename__ = "meeting_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    invite_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="invite_link")


# ---------------------------------------------------------------------------
# Chat Messages
# ---------------------------------------------------------------------------
class ChatMessage(Base):
    """In-meeting chat messages.  Polled by the frontend every few seconds.

    We store sender_name as a plain string rather than a FK so guests
    (unauthenticated participants) can also send messages.
    """
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_name: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="chat_messages")

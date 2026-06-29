from __future__ import annotations

import secrets
from datetime import datetime, date, time

from fastapi import HTTPException
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload

from backend.models import ChatMessage, Meeting, MeetingLink, Participant, ScheduledMeeting, User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _invite_link(meeting_code: str) -> str:
    """Canonical frontend invite URL.  Clients can override the origin via
    the NEXT_PUBLIC_APP_URL env var; this default works for local dev."""
    return f"http://localhost:3000/join/{meeting_code}"


def _meeting_to_summary(meeting: Meeting) -> dict:
    scheduled = meeting.scheduled
    link = meeting.invite_link
    return {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "type": meeting.type,
        "status": meeting.status,
        "invite_link": _invite_link(meeting.meeting_code),
        "scheduled_date": scheduled.scheduled_date if scheduled else None,
        "scheduled_time": scheduled.scheduled_time if scheduled else None,
        "duration_minutes": scheduled.duration_minutes if scheduled else None,
        "description": scheduled.description if scheduled else None,
        "timezone": scheduled.timezone if scheduled else None,
        "started_at": meeting.started_at,
        "ended_at": meeting.ended_at,
        "created_at": meeting.created_at,
        "host": {
            "id": meeting.host.id,
            "name": meeting.host.name,
            "email": meeting.host.email,
            "avatar_color": meeting.host.avatar_color,
            "initials": meeting.host.initials,
        } if meeting.host else None,
    }


def _load_meeting(db: Session, meeting_code: str) -> Meeting:
    """Load a meeting with all common relationships pre-fetched."""
    meeting = db.scalar(
        select(Meeting)
        .options(
            selectinload(Meeting.host),
            selectinload(Meeting.scheduled),
            selectinload(Meeting.invite_link),
        )
        .where(Meeting.meeting_code == meeting_code)
    )
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting '{meeting_code}' not found")
    return meeting


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
def get_default_user(db: Session) -> User:
    """Return whichever user exists — prefers the seed user but falls back
    to the first registered user so new sign-ups work immediately."""
    user = db.scalar(select(User).where(User.email == "alex.morgan@zoomclone.local"))
    if user:
        return user
    user = db.scalar(select(User).order_by(User.id.asc()).limit(1))
    if not user:
        raise HTTPException(status_code=500, detail="No users exist yet — please register.")
    return user


def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) == 0:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


AVATAR_COLORS = [
    "#2D8CFF", "#059669", "#D97706", "#7C3AED",
    "#DB2777", "#0891B2", "#EA580C", "#16A34A",
]


def register_user(db: Session, name: str, email: str, password: str) -> User:
    import hashlib, random
    if get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    color = AVATAR_COLORS[random.randint(0, len(AVATAR_COLORS) - 1)]
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    user = User(
        name=name,
        email=email,
        avatar_color=color,
        initials=_initials(name),
        password_hash=pw_hash,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    import hashlib
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="No account found with that email.")
    # Legacy seed users have no password — allow any password for them
    if user.password_hash is not None:
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        if pw_hash != user.password_hash:
            raise HTTPException(status_code=401, detail="Incorrect password.")
    return user


def update_user_profile(
    db: Session, user_id: int,
    name: str | None, email: str | None, avatar_color: str | None,
) -> User:
    user = get_user_by_id(db, user_id)
    if name is not None:
        user.name = name
        user.initials = _initials(name)
    if email is not None:
        existing = get_user_by_email(db, email)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="That email is already taken.")
        user.email = email
    if avatar_color is not None:
        user.avatar_color = avatar_color
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Meetings – create
# ---------------------------------------------------------------------------
def create_instant_meeting(db: Session, user_id: int | None = None) -> dict:
    host = get_user_by_id(db, user_id) if user_id else get_default_user(db)
    meeting = Meeting(
        host_id=host.id,
        title="Instant Meeting",
        type="instant",
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(meeting)
    db.flush()  # populate meeting.id

    db.add(MeetingLink(meeting_id=meeting.id, invite_token=secrets.token_urlsafe(16)))
    db.add(Participant(
        meeting_id=meeting.id,
        user_id=host.id,
        display_name=host.name,
        is_host=True,
        is_muted=False,
        is_video_on=True,
    ))
    db.commit()
    db.refresh(meeting)

    # Reload with relationships
    meeting = _load_meeting(db, meeting.meeting_code)
    return {"meeting": meeting, "host": host}


def create_scheduled_meeting(
    db: Session,
    title: str,
    description: str,
    scheduled_date: date,
    scheduled_time: time,
    duration_minutes: int,
    timezone: str,
    user_id: int | None = None,
) -> Meeting:
    host = get_user_by_id(db, user_id) if user_id else get_default_user(db)
    meeting = Meeting(host_id=host.id, title=title, type="scheduled", status="scheduled")
    db.add(meeting)
    db.flush()

    db.add(MeetingLink(meeting_id=meeting.id, invite_token=secrets.token_urlsafe(16)))
    db.add(ScheduledMeeting(
        meeting_id=meeting.id,
        scheduled_date=scheduled_date,
        scheduled_time=scheduled_time,
        duration_minutes=duration_minutes,
        description=description,
        timezone=timezone,
    ))
    db.commit()

    return _load_meeting(db, meeting.meeting_code)


# ---------------------------------------------------------------------------
# Meetings – read
# ---------------------------------------------------------------------------
def get_meeting_by_code(db: Session, meeting_code: str) -> Meeting:
    return _load_meeting(db, meeting_code)


def list_upcoming(db: Session) -> list[dict]:
    meetings = db.scalars(
        select(Meeting)
        .options(
            selectinload(Meeting.host),
            selectinload(Meeting.scheduled),
            selectinload(Meeting.invite_link),
        )
        .join(ScheduledMeeting, ScheduledMeeting.meeting_id == Meeting.id)
        .where(Meeting.status == "scheduled")
        .order_by(ScheduledMeeting.scheduled_date.asc(), ScheduledMeeting.scheduled_time.asc())
    ).all()
    return [_meeting_to_summary(m) for m in meetings]


def list_recent(db: Session) -> list[dict]:
    meetings = db.scalars(
        select(Meeting)
        .options(
            selectinload(Meeting.host),
            selectinload(Meeting.scheduled),
            selectinload(Meeting.invite_link),
        )
        .where(Meeting.status == "ended")
        .order_by(desc(Meeting.ended_at))
        .limit(20)
    ).all()
    return [_meeting_to_summary(m) for m in meetings]


# ---------------------------------------------------------------------------
# Meetings – mutate
# ---------------------------------------------------------------------------
def join_meeting(db: Session, meeting: Meeting, display_name: str, is_muted: bool, is_video_on: bool) -> Participant:
    # Activate a scheduled meeting on first join
    if meeting.status == "scheduled":
        meeting.status = "active"
    if meeting.started_at is None:
        meeting.started_at = datetime.utcnow()

    participant = Participant(
        meeting_id=meeting.id,
        display_name=display_name,
        is_host=False,
        is_muted=is_muted,
        is_video_on=is_video_on,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def leave_meeting(db: Session, meeting: Meeting, participant_id: int) -> Participant:
    participant = db.scalar(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.meeting_id == meeting.id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    participant.left_at = datetime.utcnow()
    db.commit()
    db.refresh(participant)
    return participant


def end_meeting(db: Session, meeting: Meeting) -> Meeting:
    meeting.status = "ended"
    meeting.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------------
def list_participants(db: Session, meeting: Meeting) -> list[Participant]:
    return db.scalars(
        select(Participant)
        .where(Participant.meeting_id == meeting.id, Participant.left_at.is_(None))
        .order_by(Participant.is_host.desc(), Participant.joined_at.asc())
    ).all()


def update_participant(
    db: Session,
    meeting: Meeting,
    participant_id: int,
    is_muted: bool | None = None,
    is_video_on: bool | None = None,
    display_name: str | None = None,
) -> Participant:
    participant = db.scalar(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.meeting_id == meeting.id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    if is_muted is not None:
        participant.is_muted = is_muted
    if is_video_on is not None:
        participant.is_video_on = is_video_on
    if display_name is not None:
        participant.display_name = display_name
    db.commit()
    db.refresh(participant)
    return participant


def mute_participant(db: Session, meeting: Meeting, participant_id: int) -> Participant:
    return update_participant(db, meeting, participant_id, is_muted=True, is_video_on=None, display_name=None)


def remove_participant(db: Session, meeting: Meeting, participant_id: int) -> None:
    participant = db.scalar(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.meeting_id == meeting.id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    db.delete(participant)
    db.commit()


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
def get_chat_messages(db: Session, meeting: Meeting) -> list[ChatMessage]:
    return db.scalars(
        select(ChatMessage)
        .where(ChatMessage.meeting_id == meeting.id)
        .order_by(ChatMessage.sent_at.asc())
    ).all()


def post_chat_message(db: Session, meeting: Meeting, sender_name: str, message: str) -> ChatMessage:
    msg = ChatMessage(meeting_id=meeting.id, sender_name=sender_name, message=message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

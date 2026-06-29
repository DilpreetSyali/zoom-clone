from __future__ import annotations

from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared base – enables orm_mode / from_attributes globally
# ---------------------------------------------------------------------------
class ORMModel(BaseModel):
    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class UserOut(ORMModel):
    id: int
    name: str
    email: Optional[str] = None
    avatar_color: str
    initials: str


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    user: UserOut
    token: str  # simple user-id token for this prototype


class UpdateProfileIn(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[str] = Field(default=None, min_length=3, max_length=255)
    avatar_color: Optional[str] = None


# ---------------------------------------------------------------------------
# Meetings – shared summary shape used for lists + detail
# ---------------------------------------------------------------------------
class MeetingSummary(ORMModel):
    id: int
    meeting_code: str
    title: str
    type: str
    status: str
    invite_link: str
    # Scheduling fields (None for instant meetings)
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    timezone: Optional[str] = None
    # Timestamps
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    host: Optional[UserOut] = None


# ---------------------------------------------------------------------------
# Create: instant meeting
# ---------------------------------------------------------------------------
class InstantMeetingResponse(ORMModel):
    id: int
    meeting_code: str
    title: str
    type: str
    status: str
    invite_link: str
    host: UserOut


# ---------------------------------------------------------------------------
# Create: scheduled meeting
# ---------------------------------------------------------------------------
class ScheduleMeetingIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int = Field(default=30, ge=5, le=600)
    timezone: str = "UTC"


class ScheduleMeetingResponse(ORMModel):
    id: int
    meeting_code: str
    title: str
    type: str
    status: str
    invite_link: str
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int
    description: str
    timezone: str


# ---------------------------------------------------------------------------
# Join / Leave
# ---------------------------------------------------------------------------
class JoinMeetingIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    is_muted: bool = False
    is_video_on: bool = True


class LeaveMeetingIn(BaseModel):
    participant_id: int


class JoinMeetingResponse(BaseModel):
    participant_id: int
    meeting: MeetingSummary


class LeaveMeetingResponse(BaseModel):
    ok: bool


# ---------------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------------
class ParticipantOut(ORMModel):
    id: int
    meeting_id: int
    user_id: Optional[int] = None
    display_name: str
    joined_at: datetime
    left_at: Optional[datetime] = None
    is_host: bool
    is_muted: bool
    is_video_on: bool


class ParticipantUpdateIn(BaseModel):
    is_muted: Optional[bool] = None
    is_video_on: Optional[bool] = None
    display_name: Optional[str] = None


class MuteResponse(BaseModel):
    ok: bool


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
class ChatMessageIn(BaseModel):
    sender_name: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageOut(ORMModel):
    id: int
    meeting_id: int
    sender_name: str
    message: str
    sent_at: datetime

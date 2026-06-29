from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.crud import (
    create_instant_meeting,
    create_scheduled_meeting,
    end_meeting,
    get_default_user,
    get_meeting_by_code,
    join_meeting,
    leave_meeting,
    list_recent,
    list_upcoming,
    _meeting_to_summary,
)
from backend.database import get_db
from backend.schemas import (
    InstantMeetingResponse,
    JoinMeetingIn,
    JoinMeetingResponse,
    LeaveMeetingIn,
    LeaveMeetingResponse,
    MeetingSummary,
    ScheduleMeetingIn,
    ScheduleMeetingResponse,
    UserOut,
)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
@router.post("/instant", response_model=InstantMeetingResponse)
def instant_meeting(db: Session = Depends(get_db)):
    result = create_instant_meeting(db)
    meeting = result["meeting"]
    host = result["host"]
    return {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "type": meeting.type,
        "status": meeting.status,
        "invite_link": f"http://localhost:3000/join/{meeting.meeting_code}",
        "host": {
            "id": host.id,
            "name": host.name,
            "email": host.email,
            "avatar_color": host.avatar_color,
            "initials": host.initials,
        },
    }


@router.post("/schedule", response_model=ScheduleMeetingResponse)
def schedule_meeting(payload: ScheduleMeetingIn, db: Session = Depends(get_db)):
    meeting = create_scheduled_meeting(
        db,
        title=payload.title,
        description=payload.description,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        duration_minutes=payload.duration_minutes,
        timezone=payload.timezone,
    )
    s = meeting.scheduled
    return {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "type": meeting.type,
        "status": meeting.status,
        "invite_link": f"http://localhost:3000/join/{meeting.meeting_code}",
        "scheduled_date": s.scheduled_date,
        "scheduled_time": s.scheduled_time,
        "duration_minutes": s.duration_minutes,
        "description": s.description,
        "timezone": s.timezone,
    }


# ---------------------------------------------------------------------------
# Lists
# ---------------------------------------------------------------------------
@router.get("/upcoming", response_model=list[MeetingSummary])
def upcoming_meetings(db: Session = Depends(get_db)):
    return list_upcoming(db)


@router.get("/recent", response_model=list[MeetingSummary])
def recent_meetings(db: Session = Depends(get_db)):
    return list_recent(db)


# ---------------------------------------------------------------------------
# Single meeting  (must come AFTER /upcoming and /recent to avoid clash)
# ---------------------------------------------------------------------------
@router.get("/{meeting_code}", response_model=MeetingSummary)
def get_meeting(meeting_code: str, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    return _meeting_to_summary(meeting)


# ---------------------------------------------------------------------------
# Join / Leave / End
# ---------------------------------------------------------------------------
@router.post("/{meeting_code}/join", response_model=JoinMeetingResponse)
def join(meeting_code: str, payload: JoinMeetingIn, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    participant = join_meeting(
        db,
        meeting,
        payload.display_name,
        payload.is_muted,
        payload.is_video_on,
    )
    # Re-fetch meeting so status updates are reflected
    meeting = get_meeting_by_code(db, meeting_code)
    return {
        "participant_id": participant.id,
        "meeting": _meeting_to_summary(meeting),
    }


@router.post("/{meeting_code}/leave", response_model=LeaveMeetingResponse)
def leave(meeting_code: str, payload: LeaveMeetingIn, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    leave_meeting(db, meeting, payload.participant_id)
    return {"ok": True}


@router.delete("/{meeting_code}")
def end(meeting_code: str, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    end_meeting(db, meeting)
    return {"ok": True}

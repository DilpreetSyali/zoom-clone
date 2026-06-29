from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.crud import (
    get_chat_messages,
    get_meeting_by_code,
    list_participants,
    mute_participant,
    post_chat_message,
    remove_participant,
    update_participant,
)
from backend.database import get_db
from backend.schemas import (
    ChatMessageIn,
    ChatMessageOut,
    MuteResponse,
    ParticipantOut,
    ParticipantUpdateIn,
)

router = APIRouter(prefix="/api/meetings", tags=["participants"])


# ---------------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------------
@router.get("/{meeting_code}/participants", response_model=list[ParticipantOut])
def get_participants(meeting_code: str, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    return list_participants(db, meeting)


@router.patch(
    "/{meeting_code}/participants/{participant_id}",
    response_model=ParticipantOut,
)
def patch_participant(
    meeting_code: str,
    participant_id: int,
    payload: ParticipantUpdateIn,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_by_code(db, meeting_code)
    return update_participant(
        db,
        meeting,
        participant_id,
        is_muted=payload.is_muted,
        is_video_on=payload.is_video_on,
        display_name=payload.display_name,
    )


@router.post(
    "/{meeting_code}/participants/{participant_id}/mute",
    response_model=MuteResponse,
)
def mute(meeting_code: str, participant_id: int, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    mute_participant(db, meeting, participant_id)
    return {"ok": True}


@router.delete("/{meeting_code}/participants/{participant_id}")
def remove(meeting_code: str, participant_id: int, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    remove_participant(db, meeting, participant_id)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
@router.get("/{meeting_code}/chat", response_model=list[ChatMessageOut])
def get_chat(meeting_code: str, db: Session = Depends(get_db)):
    meeting = get_meeting_by_code(db, meeting_code)
    return get_chat_messages(db, meeting)


@router.post("/{meeting_code}/chat", response_model=ChatMessageOut)
def send_chat(
    meeting_code: str,
    payload: ChatMessageIn,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_by_code(db, meeting_code)
    return post_chat_message(db, meeting, payload.sender_name, payload.message)

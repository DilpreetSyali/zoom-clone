from __future__ import annotations

import secrets
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select

try:
    from backend.database import Base, SessionLocal, engine
    from backend.models import Meeting, MeetingLink, Participant, ScheduledMeeting, User
except ImportError:
    from database import Base, SessionLocal, engine
    from models import Meeting, MeetingLink, Participant, ScheduledMeeting, User


def seed_if_empty() -> None:
    """Populate the database with one default user + sample meetings.

    Safe to call on every startup — exits immediately if the users table
    already has rows.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(User.id).limit(1)) is not None:
            return  # already seeded

        print("🌱  Seeding database...")

        # ------------------------------------------------------------------
        # Default user
        # ------------------------------------------------------------------
        user = User(
            name="Alex Morgan",
            email="alex.morgan@zoomclone.local",
            avatar_color="#2D8CFF",
            initials="AM",
        )
        db.add(user)
        db.flush()  # get user.id

        # ------------------------------------------------------------------
        # Upcoming scheduled meetings (future dates)
        # ------------------------------------------------------------------
        now = datetime.utcnow()
        today = now.date()

        upcoming = [
            (
                "Sprint Planning",
                "Q3 sprint kickoff — review backlog and assign story points",
                today + timedelta(days=1),
                time(9, 30),
                60,
                "UTC",
            ),
            (
                "Client Demo Call",
                "Live product demo for Acme Corp stakeholders",
                today + timedelta(days=3),
                time(14, 0),
                45,
                "UTC",
            ),
            (
                "Product Sync",
                "Cross-functional alignment on roadmap priorities",
                today + timedelta(days=5),
                time(16, 15),
                30,
                "UTC",
            ),
        ]

        for title, desc, sdate, stime, duration, tz in upcoming:
            m = Meeting(
                host_id=user.id,
                title=title,
                type="scheduled",
                status="scheduled",
            )
            db.add(m)
            db.flush()
            db.add(MeetingLink(meeting_id=m.id, invite_token=secrets.token_urlsafe(16)))
            db.add(ScheduledMeeting(
                meeting_id=m.id,
                scheduled_date=sdate,
                scheduled_time=stime,
                duration_minutes=duration,
                description=desc,
                timezone=tz,
            ))

        # ------------------------------------------------------------------
        # Recent / past meetings (ended status)
        # ------------------------------------------------------------------
        past = [
            ("Weekly Retro",          now - timedelta(days=2, hours=1),   now - timedelta(days=2)),
            ("Design Review",         now - timedelta(days=4, minutes=45), now - timedelta(days=4, minutes=5)),
            ("Engineering Standup",   now - timedelta(days=1, minutes=20), now - timedelta(days=1, minutes=5)),
            ("Onboarding Session",    now - timedelta(days=7, hours=2),    now - timedelta(days=7, hours=1)),
        ]

        for title, started, ended in past:
            m = Meeting(
                host_id=user.id,
                title=title,
                type="instant",
                status="ended",
                started_at=started,
                ended_at=ended,
            )
            db.add(m)
            db.flush()
            db.add(MeetingLink(meeting_id=m.id, invite_token=secrets.token_urlsafe(16)))
            db.add(Participant(
                meeting_id=m.id,
                user_id=user.id,
                display_name=user.name,
                is_host=True,
                is_muted=False,
                is_video_on=True,
            ))

        db.commit()
        print("✅  Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()

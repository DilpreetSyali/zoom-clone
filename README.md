# Zoom Clone

A production-quality full-stack video conferencing web application inspired by Zoom, built with Next.js 14, FastAPI, and PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| Database | PostgreSQL 15+ via SQLAlchemy 2.0 ORM |
| Styling | Tailwind CSS + CSS custom properties (Zoom design tokens) |
| State | React `useState` / `useEffect` + polling (no extra state lib needed) |
| Real-time media | Browser `getUserMedia` API — local camera/mic preview |

---

## Project Structure

```
Zoom-Clone/
├── backend/
│   ├── main.py           # FastAPI app + startup hooks
│   ├── database.py       # SQLAlchemy engine + session factory
│   ├── models.py         # ORM table definitions (5 tables)
│   ├── schemas.py        # Pydantic request/response models
│   ├── crud.py           # All database operations (no raw SQL in routes)
│   ├── seed.py           # One-time seeding (1 user + 7 meetings)
│   ├── requirements.txt
│   └── routers/
│       ├── meetings.py      # /api/meetings/* routes
│       ├── participants.py  # participants + chat routes
│       └── users.py         # /api/users/me
└── frontend/
    ├── app/
    │   ├── page.tsx              # Dashboard
    │   ├── join/[code]/page.tsx  # Pre-join lobby
    │   └── meeting/[code]/page.tsx # Meeting room
    ├── components/
    │   ├── dashboard/   # Navbar, ActionButtons, MeetingCard, modals
    │   ├── meeting/     # VideoGrid, VideoTile, ControlBar, ChatPanel, ParticipantsPanel
    │   └── shared/      # Avatar, Modal
    ├── lib/
    │   ├── api.ts        # Centralised API client
    │   ├── utils.ts      # Pure helpers (formatting, colours)
    │   └── useLocalMedia.ts # getUserMedia hook
    └── types/index.ts    # TypeScript interfaces mirroring Pydantic schemas
```

---

## Database Schema

### `users`
Represents an authenticated user. Only one default user ("Alex Morgan") exists in this prototype; real auth is out of scope.

### `meetings`
Core meeting record. `meeting_code` (e.g. `123-456-789`) is the human-shareable identifier used throughout the UI and URLs. `type` distinguishes instant vs scheduled; `status` tracks the lifecycle.

**Why a separate `scheduled_meetings` table?**  
Instant meetings have no scheduling data. Putting those columns on `meetings` would leave them NULL for the majority of rows. The 1:1 optional table keeps `meetings` lean and makes the data model self-documenting.

### `scheduled_meetings`
Extra metadata for scheduled meetings: date, time, duration, description, timezone.

### `participants`
One row per join event. `user_id` is nullable to support unauthenticated guests. `is_host` is denormalised here so the participants-list endpoint doesn't need a join back to `meetings`.

### `meeting_links`
Stores a random `invite_token` per meeting. The token is used in invite URLs (`/join/{meeting_code}`) rather than exposing the numeric `id`. This lets tokens be rotated/invalidated independently of the meeting code.

### `chat_messages`
In-meeting chat, polled every 3 seconds from the frontend. `sender_name` is a plain string (not a FK) so guests can also chat.

**Indexes:**
- `meetings.meeting_code` — unique, indexed (every API request uses this)
- `meeting_links.invite_token` — unique, indexed
- `participants.(meeting_id, left_at)` — composite index for active-participant queries
- `chat_messages.meeting_id` — for per-meeting message retrieval
- `scheduled_meetings.scheduled_date` — for upcoming-meetings ordering

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | Return the default logged-in user |
| POST | `/api/meetings/instant` | Create an instant meeting |
| POST | `/api/meetings/schedule` | Schedule a future meeting |
| GET | `/api/meetings/upcoming` | List scheduled meetings (ordered by date) |
| GET | `/api/meetings/recent` | List ended meetings |
| GET | `/api/meetings/{code}` | Validate + fetch meeting metadata |
| POST | `/api/meetings/{code}/join` | Join as a participant |
| POST | `/api/meetings/{code}/leave` | Mark participant as left |
| DELETE | `/api/meetings/{code}` | End meeting (host action) |
| GET | `/api/meetings/{code}/participants` | List active participants |
| PATCH | `/api/meetings/{code}/participants/{id}` | Update mute/video state |
| POST | `/api/meetings/{code}/participants/{id}/mute` | Host-mute a participant |
| DELETE | `/api/meetings/{code}/participants/{id}` | Remove a participant |
| GET | `/api/meetings/{code}/chat` | Fetch chat messages |
| POST | `/api/meetings/{code}/chat` | Send a chat message |

Interactive docs at **http://localhost:8000/docs** when the backend is running.

---

## Setup & Running

### Prerequisites
- Python 3.11+ with pip (Anaconda or system Python)
- Node.js 18+ with npm
- PostgreSQL 15+ running locally

### 1. Database
```bash
# Connect to Postgres and create the database
psql -U <your_pg_user> -d postgres -c "CREATE DATABASE zoom_clone;"
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt

# Set your Postgres user if different from the default (Dell)
# Edit backend/database.py and change the DATABASE_URL, or:
set DATABASE_URL=postgresql+psycopg2://<user>@localhost:5432/zoom_clone

# Start the API server (auto-seeds on first run)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# ✅ Visit http://localhost:8000/docs for Swagger UI
```

To run the seed script manually:
```bash
python backend/seed.py
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# ✅ Visit http://localhost:3000
```

---

## Assumptions & Scope

- **No real WebRTC peer connections.** Local camera/mic preview works fully (getUserMedia), but remote participants' video streams are not transmitted. This requires a WebRTC signalling server (e.g. mediasoup, LiveKit, or a TURN/STUN server) which is explicitly out of scope. Remote participants show avatar tiles instead of video.

- **No authentication.** A single seed user ("Alex Morgan") acts as the logged-in user for all sessions. Production would require JWT/OAuth2 + proper session management.

- **Chat is polled, not pushed.** Messages are fetched every 3 seconds. Production would use WebSockets or Server-Sent Events for real-time delivery.

- **Participant state is polled.** The participants list refreshes every 3 seconds. This simulates live presence without requiring a WebSocket connection.

- **Invite links use `meeting_code`, not `invite_token`.** The `meeting_links` table stores a separate token for future link invalidation support, but the current invite URL format uses the human-readable code (`/join/123-456-789`) for simplicity. Both are in the database and the architecture supports rotation.

- **Single-region SQLite → PostgreSQL.** The default connection targets PostgreSQL on localhost. Change `DATABASE_URL` for any other Postgres instance.

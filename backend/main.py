from __future__ import annotations

import sys
from pathlib import Path

# Make `backend` importable regardless of how the process is launched
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
from backend.routers.meetings import router as meetings_router
from backend.routers.participants import router as participants_router
from backend.routers.users import router as users_router
from backend.routers.auth import router as auth_router
from backend.seed import seed_if_empty

app = FastAPI(
    title="Zoom Clone API",
    version="1.0.0",
    description="Full-stack Zoom clone — FastAPI + PostgreSQL backend",
)

# Allow the Next.js dev server (port 3000) and any origin in dev.
# In production, lock this down to your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_if_empty()


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(meetings_router)
app.include_router(participants_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import AuthResponse, LoginIn, RegisterIn, UpdateProfileIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token(user_id: int) -> str:
    """Minimal token = 'uid:<id>' — good enough for a prototype."""
    return f"uid:{user_id}"


def _uid_from_token(token: str) -> int:
    try:
        prefix, uid = token.split(":", 1)
        if prefix != "uid":
            raise ValueError
        return int(uid)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid or missing token.")


def get_current_user_id(authorization: str = Header(default="")) -> int:
    """Extract user ID from 'Bearer uid:<id>' header."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return _uid_from_token(token)


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    user = crud.register_user(db, name=body.name, email=body.email, password=body.password)
    return AuthResponse(user=UserOut.model_validate(user), token=_token(user.id))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, email=body.email, password=body.password)
    return AuthResponse(user=UserOut.model_validate(user), token=_token(user.id))


@router.get("/me", response_model=UserOut)
def get_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return crud.get_user_by_id(db, user_id)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UpdateProfileIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return crud.update_user_profile(
        db, user_id,
        name=body.name,
        email=body.email,
        avatar_color=body.avatar_color,
    )

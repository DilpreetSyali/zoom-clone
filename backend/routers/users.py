from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.crud import get_default_user
from backend.database import get_db
from backend.schemas import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


from pydantic import BaseModel

class AuthIn(BaseModel):
    email: str
    password: str

class SignupIn(BaseModel):
    name: str
    email: str
    password: str

@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db)):
    user = get_default_user(db)
    return user

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    from backend.crud import get_user_by_id
    return get_user_by_id(db, user_id)

@router.post("/signup", response_model=UserOut)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    from backend.crud import register_user
    return register_user(db, data.name, data.email, data.password)

@router.post("/login", response_model=UserOut)
def login(data: AuthIn, db: Session = Depends(get_db)):
    from backend.crud import authenticate_user
    return authenticate_user(db, data.email, data.password)

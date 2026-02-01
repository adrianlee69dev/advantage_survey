from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    ANSWERER = "answerer"


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

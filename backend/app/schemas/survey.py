from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.question import QuestionResponse


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None


class SurveyResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: Optional[str]
    is_published: bool
    created_at: datetime
    questions: list[QuestionResponse] = []

    class Config:
        from_attributes = True


class SurveyListResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: Optional[str]
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SurveyShareRequest(BaseModel):
    admin_id: UUID

from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, model_validator

from app.schemas.question import QuestionType


class AnswerCreate(BaseModel):
    question_id: UUID
    text_value: Optional[str] = None
    bool_value: Optional[bool] = None
    rank_value: Optional[int] = None

    @model_validator(mode="after")
    def validate_answer_value(self):
        values_provided = sum([
            self.text_value is not None,
            self.bool_value is not None,
            self.rank_value is not None,
        ])
        if values_provided != 1:
            raise ValueError("Exactly one answer value must be provided")
        return self


class AnswerResponse(BaseModel):
    id: UUID
    question_id: UUID
    text_value: Optional[str]
    bool_value: Optional[bool]
    rank_value: Optional[int]

    class Config:
        from_attributes = True


class ResponseCreate(BaseModel):
    answers: list[AnswerCreate]


class ResponseResponse(BaseModel):
    id: UUID
    survey_id: UUID
    answerer_id: UUID
    submitted_at: datetime
    answers: list[AnswerResponse] = []

    class Config:
        from_attributes = True


class ResponseListResponse(BaseModel):
    id: UUID
    survey_id: UUID
    answerer_id: UUID
    submitted_at: datetime

    class Config:
        from_attributes = True


class QuestionAggregate(BaseModel):
    question_id: UUID
    question_text: str
    question_type: QuestionType
    total_responses: int
    # For true/false
    true_count: Optional[int] = None
    false_count: Optional[int] = None
    true_percentage: Optional[float] = None
    # For rank
    average_rank: Optional[float] = None
    rank_distribution: Optional[dict[int, int]] = None
    # For text
    text_responses: Optional[list[str]] = None


class AggregateResponse(BaseModel):
    survey_id: UUID
    total_responses: int
    questions: list[QuestionAggregate]

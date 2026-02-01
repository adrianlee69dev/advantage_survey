from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, model_validator


class QuestionType(str, Enum):
    RANK = "rank"
    TRUE_FALSE = "true_false"
    TEXT = "text"


class QuestionCreate(BaseModel):
    text: str
    type: QuestionType
    rank_max: Optional[int] = None
    order_index: Optional[int] = 0

    @model_validator(mode="after")
    def validate_rank_max(self):
        if self.type == QuestionType.RANK and (self.rank_max is None or self.rank_max < 2):
            raise ValueError("rank_max must be provided and >= 2 for rank type questions")
        if self.type != QuestionType.RANK and self.rank_max is not None:
            raise ValueError("rank_max should only be provided for rank type questions")
        return self


class QuestionResponse(BaseModel):
    id: UUID
    survey_id: UUID
    text: str
    type: QuestionType
    rank_max: Optional[int]
    order_index: int

    class Config:
        from_attributes = True

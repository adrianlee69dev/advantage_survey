from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_survey_with_access
from app.models.user import User, UserRole
from app.models.survey import Survey
from app.schemas.response import (
    ResponseCreate,
    ResponseResponse,
    ResponseListResponse,
    AggregateResponse,
)
from app.services.survey_service import SurveyService
from app.services.response_service import ResponseService

router = APIRouter(prefix="/api/surveys/{survey_id}/responses", tags=["responses"])


@router.post("", response_model=ResponseResponse, status_code=status.HTTP_201_CREATED)
async def submit_response(
    survey_id: UUID,
    response_data: ResponseCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a response to a survey (Answerer only)."""
    if user.role != UserRole.ANSWERER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only answerers can submit responses",
        )

    survey_service = SurveyService(db)
    survey = await survey_service.get_survey_by_id(survey_id)

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    if not survey.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Survey is not published",
        )

    # Validate answers match questions
    questions = await survey_service.get_questions(survey_id)
    question_ids = {q.id for q in questions}
    answer_question_ids = {a.question_id for a in response_data.answers}

    if answer_question_ids != question_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answers must be provided for all questions",
        )

    response_service = ResponseService(db)
    response = await response_service.create_response(
        survey_id=survey_id,
        answerer_id=user.id,
        answers=[a.model_dump() for a in response_data.answers],
    )
    return response


@router.get("", response_model=list[ResponseListResponse])
async def list_responses(
    survey: Survey = Depends(get_survey_with_access),
    db: AsyncSession = Depends(get_db),
):
    """List all responses for a survey (Admin with access only)."""
    service = ResponseService(db)
    responses = await service.list_responses_for_survey(survey.id)
    return responses


@router.get("/me", response_model=list[ResponseResponse])
async def get_my_responses(
    survey_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's responses for a survey."""
    survey_service = SurveyService(db)
    survey = await survey_service.get_survey_by_id(survey_id)

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    response_service = ResponseService(db)
    responses = await response_service.list_user_responses_for_survey(survey_id, user.id)
    return responses


@router.get("/aggregate", response_model=AggregateResponse)
async def get_aggregate_responses(
    survey: Survey = Depends(get_survey_with_access),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated response statistics (Admin with access only)."""
    service = ResponseService(db)
    return await service.get_aggregates(survey.id)


@router.get("/{response_id}", response_model=ResponseResponse)
async def get_response(
    response_id: UUID,
    survey: Survey = Depends(get_survey_with_access),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific response (Admin with access only)."""
    service = ResponseService(db)
    response = await service.get_response_by_id(response_id)

    if not response or response.survey_id != survey.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found",
        )

    return response

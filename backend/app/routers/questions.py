from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_owned_survey, get_current_user
from app.models.user import User, UserRole
from app.models.survey import Survey
from app.schemas.question import QuestionCreate, QuestionResponse
from app.services.survey_service import SurveyService

router = APIRouter(prefix="/api/surveys/{survey_id}/questions", tags=["questions"])


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    question_data: QuestionCreate,
    survey: Survey = Depends(get_owned_survey),
    db: AsyncSession = Depends(get_db),
):
    """Add a question to a survey (Owner only, survey must not have responses)."""
    service = SurveyService(db)

    # Check if survey has responses
    if await service.survey_has_responses(survey.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify survey with existing responses",
        )

    question = await service.add_question(
        survey_id=survey.id,
        text=question_data.text,
        question_type=question_data.type,
        rank_max=question_data.rank_max,
        order_index=question_data.order_index,
    )
    return question


@router.get("", response_model=list[QuestionResponse])
async def get_questions(
    survey_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get questions for a survey."""
    service = SurveyService(db)
    survey = await service.get_survey_by_id(survey_id)

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    # Answerers can only see published surveys
    if user.role == UserRole.ANSWERER and not survey.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Survey not available",
        )

    # Admins need access
    if user.role == UserRole.ADMIN:
        admin_surveys = await service.list_surveys_for_admin(user.id)
        if survey.id not in [s.id for s in admin_surveys]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this survey",
            )

    questions = await service.get_questions(survey_id)
    return questions

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import (
    get_current_user,
    require_admin,
    get_survey_with_access,
    get_owned_survey,
)
from app.models.user import User, UserRole
from app.models.survey import Survey
from app.schemas.survey import (
    SurveyCreate,
    SurveyResponse,
    SurveyListResponse,
    SurveyShareRequest,
)
from app.services.survey_service import SurveyService

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


@router.post("", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
async def create_survey(
    survey_data: SurveyCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new survey (Admin only)."""
    service = SurveyService(db)
    survey = await service.create_survey(
        owner_id=user.id,
        title=survey_data.title,
        description=survey_data.description,
    )
    return survey


@router.get("", response_model=list[SurveyListResponse])
async def list_surveys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List surveys available to the current user."""
    service = SurveyService(db)

    if user.role == UserRole.ADMIN:
        surveys = await service.list_surveys_for_admin(user.id)
    else:
        surveys = await service.list_published_surveys()

    return surveys


@router.get("/{survey_id}", response_model=SurveyResponse)
async def get_survey(
    survey_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get survey details."""
    service = SurveyService(db)
    survey = await service.get_survey_by_id(survey_id)

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    # Answerers can only see published surveys
    if user.role == UserRole.ANSWERER:
        if not survey.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Survey not available",
            )
        return survey

    # Admins need to own or have access
    if user.role == UserRole.ADMIN:
        admin_surveys = await service.list_surveys_for_admin(user.id)
        if survey.id not in [s.id for s in admin_surveys]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this survey",
            )

    return survey


@router.patch("/{survey_id}/publish", response_model=SurveyResponse)
async def publish_survey(
    survey: Survey = Depends(get_owned_survey),
    db: AsyncSession = Depends(get_db),
):
    """Publish a survey (Owner only)."""
    service = SurveyService(db)
    return await service.publish_survey(survey)


@router.post("/{survey_id}/share", status_code=status.HTTP_201_CREATED)
async def share_survey(
    share_data: SurveyShareRequest,
    survey: Survey = Depends(get_owned_survey),
    db: AsyncSession = Depends(get_db),
):
    """Share survey access with another admin (Owner only)."""
    service = SurveyService(db)

    try:
        await service.share_survey(survey.id, share_data.admin_id)
        return {"message": "Survey access granted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

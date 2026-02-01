from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.survey import Survey, SurveyAccess


async def get_current_user(
    x_user_id: Annotated[str, Header()],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user from X-User-ID header."""
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


async def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    """Require the current user to be an admin."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def require_answerer(
    user: User = Depends(get_current_user),
) -> User:
    """Require the current user to be an answerer."""
    if user.role != UserRole.ANSWERER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Answerer access required",
        )
    return user


async def get_survey_with_access(
    survey_id: UUID,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Survey:
    """Get a survey, ensuring the admin has access (owner or shared)."""
    result = await db.execute(select(Survey).where(Survey.id == survey_id))
    survey = result.scalar_one_or_none()

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    # Check if user is owner
    if survey.owner_id == user.id:
        return survey

    # Check if user has shared access
    access_result = await db.execute(
        select(SurveyAccess).where(
            SurveyAccess.survey_id == survey_id,
            SurveyAccess.admin_id == user.id,
        )
    )
    access = access_result.scalar_one_or_none()

    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this survey",
        )

    return survey


async def get_owned_survey(
    survey_id: UUID,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Survey:
    """Get a survey, ensuring the admin owns it."""
    result = await db.execute(select(Survey).where(Survey.id == survey_id))
    survey = result.scalar_one_or_none()

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    if survey.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the survey owner can perform this action",
        )

    return survey

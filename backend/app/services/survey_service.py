from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.survey import Survey, SurveyAccess
from app.models.question import Question
from app.models.user import User, UserRole


class SurveyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_survey(self, owner_id: UUID, title: str, description: str | None) -> Survey:
        survey = Survey(owner_id=owner_id, title=title, description=description)
        self.db.add(survey)
        await self.db.commit()
        # Re-fetch with eagerly loaded questions to avoid lazy loading issues
        return await self.get_survey_by_id(survey.id)

    async def get_survey_by_id(self, survey_id: UUID) -> Survey | None:
        result = await self.db.execute(
            select(Survey)
            .options(selectinload(Survey.questions))
            .where(Survey.id == survey_id)
        )
        return result.scalar_one_or_none()

    async def list_surveys_for_admin(self, admin_id: UUID) -> list[Survey]:
        """List surveys that an admin owns or has access to."""
        # Get owned surveys
        owned_result = await self.db.execute(
            select(Survey).where(Survey.owner_id == admin_id)
        )
        owned = list(owned_result.scalars().all())

        # Get shared surveys
        shared_result = await self.db.execute(
            select(Survey)
            .join(SurveyAccess, Survey.id == SurveyAccess.survey_id)
            .where(SurveyAccess.admin_id == admin_id)
        )
        shared = list(shared_result.scalars().all())

        # Combine and deduplicate
        all_surveys = {s.id: s for s in owned + shared}
        return list(all_surveys.values())

    async def list_published_surveys(self) -> list[Survey]:
        """List all published surveys (for answerers)."""
        result = await self.db.execute(
            select(Survey).where(Survey.is_published == True)
        )
        return list(result.scalars().all())

    async def publish_survey(self, survey: Survey) -> Survey:
        survey.is_published = True
        await self.db.commit()
        # Re-fetch with eagerly loaded questions to avoid lazy loading issues
        return await self.get_survey_by_id(survey.id)

    async def share_survey(self, survey_id: UUID, admin_id: UUID) -> SurveyAccess:
        # Check if the user is an admin
        result = await self.db.execute(select(User).where(User.id == admin_id))
        user = result.scalar_one_or_none()

        if not user or user.role != UserRole.ADMIN:
            raise ValueError("Can only share with admin users")

        # Check if access already exists
        existing = await self.db.execute(
            select(SurveyAccess).where(
                SurveyAccess.survey_id == survey_id,
                SurveyAccess.admin_id == admin_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Access already granted")

        access = SurveyAccess(survey_id=survey_id, admin_id=admin_id)
        self.db.add(access)
        await self.db.commit()
        await self.db.refresh(access)
        return access

    async def add_question(
        self,
        survey_id: UUID,
        text: str,
        question_type: str,
        rank_max: int | None,
        order_index: int,
    ) -> Question:
        question = Question(
            survey_id=survey_id,
            text=text,
            type=question_type,
            rank_max=rank_max,
            order_index=order_index,
        )
        self.db.add(question)
        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def get_questions(self, survey_id: UUID) -> list[Question]:
        result = await self.db.execute(
            select(Question)
            .where(Question.survey_id == survey_id)
            .order_by(Question.order_index)
        )
        return list(result.scalars().all())

    async def survey_has_responses(self, survey_id: UUID) -> bool:
        from app.models.response import Response
        result = await self.db.execute(
            select(Response).where(Response.survey_id == survey_id).limit(1)
        )
        return result.scalar_one_or_none() is not None

from uuid import UUID
from collections import defaultdict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.response import Response, Answer
from app.models.question import Question, QuestionType
from app.schemas.response import QuestionAggregate, AggregateResponse


class ResponseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_response(
        self,
        survey_id: UUID,
        answerer_id: UUID,
        answers: list[dict],
    ) -> Response:
        response = Response(survey_id=survey_id, answerer_id=answerer_id)
        self.db.add(response)
        await self.db.flush()

        for answer_data in answers:
            answer = Answer(
                response_id=response.id,
                question_id=answer_data["question_id"],
                text_value=answer_data.get("text_value"),
                bool_value=answer_data.get("bool_value"),
                rank_value=answer_data.get("rank_value"),
            )
            self.db.add(answer)

        await self.db.commit()
        await self.db.refresh(response)

        # Reload with answers
        result = await self.db.execute(
            select(Response)
            .options(selectinload(Response.answers))
            .where(Response.id == response.id)
        )
        return result.scalar_one()

    async def get_response_by_id(self, response_id: UUID) -> Response | None:
        result = await self.db.execute(
            select(Response)
            .options(selectinload(Response.answers))
            .where(Response.id == response_id)
        )
        return result.scalar_one_or_none()

    async def list_responses_for_survey(self, survey_id: UUID) -> list[Response]:
        result = await self.db.execute(
            select(Response)
            .options(selectinload(Response.answers))
            .where(Response.survey_id == survey_id)
            .order_by(Response.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def list_user_responses_for_survey(
        self, survey_id: UUID, user_id: UUID
    ) -> list[Response]:
        result = await self.db.execute(
            select(Response)
            .options(selectinload(Response.answers))
            .where(Response.survey_id == survey_id, Response.answerer_id == user_id)
            .order_by(Response.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def get_aggregates(self, survey_id: UUID) -> AggregateResponse:
        # Get all questions for the survey
        questions_result = await self.db.execute(
            select(Question)
            .where(Question.survey_id == survey_id)
            .order_by(Question.order_index)
        )
        questions = list(questions_result.scalars().all())

        # Get all responses
        responses_result = await self.db.execute(
            select(Response)
            .options(selectinload(Response.answers))
            .where(Response.survey_id == survey_id)
        )
        responses = list(responses_result.scalars().all())
        total_responses = len(responses)

        # Build question aggregates
        question_aggregates = []
        for question in questions:
            # Get all answers for this question
            answers = []
            for response in responses:
                for answer in response.answers:
                    if answer.question_id == question.id:
                        answers.append(answer)

            aggregate = QuestionAggregate(
                question_id=question.id,
                question_text=question.text,
                question_type=question.type,
                total_responses=len(answers),
            )

            if question.type == QuestionType.TRUE_FALSE:
                true_count = sum(1 for a in answers if a.bool_value is True)
                false_count = sum(1 for a in answers if a.bool_value is False)
                aggregate.true_count = true_count
                aggregate.false_count = false_count
                if len(answers) > 0:
                    aggregate.true_percentage = round(true_count / len(answers) * 100, 2)

            elif question.type == QuestionType.RANK:
                rank_values = [a.rank_value for a in answers if a.rank_value is not None]
                if rank_values:
                    aggregate.average_rank = round(sum(rank_values) / len(rank_values), 2)
                    # Build distribution
                    distribution = defaultdict(int)
                    for v in rank_values:
                        distribution[v] += 1
                    aggregate.rank_distribution = dict(distribution)

            elif question.type == QuestionType.TEXT:
                aggregate.text_responses = [
                    a.text_value for a in answers if a.text_value is not None
                ]

            question_aggregates.append(aggregate)

        return AggregateResponse(
            survey_id=survey_id,
            total_responses=total_responses,
            questions=question_aggregates,
        )

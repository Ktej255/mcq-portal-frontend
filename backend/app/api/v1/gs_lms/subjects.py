"""GET /gs-lms/subjects — which GS subjects students can open.

A subject is open once it has at least one reviewed leaf topic with reviewed
MCQs. This is computed live, so importing a subject's content with
``--review-status REVIEWED`` (or reviewing it in the admin) is all it takes
for the subject to appear unlocked in the sidebar.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import GsLmsMcqQuestion, GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.db.session import get_db

router = APIRouter()


class GsSubjectAvailability(BaseModel):
    slug: str
    name: str
    available: bool
    topics: int
    topics_with_mcqs: int


@router.get("/subjects", response_model=list[GsSubjectAvailability])
def list_subjects(db: Session = Depends(get_db)) -> list[GsSubjectAvailability]:
    reviewed = GsReviewStatusEnum.REVIEWED
    topics = dict(
        db.query(GsLmsSyllabusNode.subject_id, func.count(GsLmsSyllabusNode.id))
        .filter(
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == reviewed,
        )
        .group_by(GsLmsSyllabusNode.subject_id)
        .all()
    )
    with_mcqs = dict(
        db.query(GsLmsSyllabusNode.subject_id, func.count(func.distinct(GsLmsSyllabusNode.id)))
        .join(GsLmsMcqQuestion, GsLmsMcqQuestion.syllabus_node_id == GsLmsSyllabusNode.id)
        .filter(
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == reviewed,
            GsLmsMcqQuestion.review_status == reviewed,
        )
        .group_by(GsLmsSyllabusNode.subject_id)
        .all()
    )
    return [
        GsSubjectAvailability(
            slug=s.slug,
            name=s.name,
            available=with_mcqs.get(s.id, 0) > 0,
            topics=topics.get(s.id, 0),
            topics_with_mcqs=with_mcqs.get(s.id, 0),
        )
        for s in db.query(GsSubject).order_by(GsSubject.display_order, GsSubject.id)
    ]

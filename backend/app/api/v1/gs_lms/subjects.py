"""GET /gs-lms/subjects — which GS subjects students can open.

A subject is open once it has at least one reviewed leaf topic with reviewed
MCQs. This is computed live, so importing a subject's content with
``--review-status REVIEWED`` (or reviewing it in the admin) is all it takes
for the subject to appear unlocked in the sidebar.

Subjects belong to an exam (``upsc``, ``neet``, ``jee``). ``GET /subjects``
lists the subjects of the exam given by ``?exam=`` (default: the student's
exam, else UPSC). ``GET /exams`` lists the active exams.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.exam_profiles import PROFILES, exam_code_of
from app.core.gs_lms.exams import active_exams, find_exam, scope_subjects_to_exam, student_exam_code
from app.core.gs_lms.models import GsLmsMcqQuestion, GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.db.session import get_db
from app.models.domain import User

router = APIRouter()


class GsExamOut(BaseModel):
    code: str
    name: str
    display_order: int
    content_level_label: Optional[str] = None


class GsSubjectAvailability(BaseModel):
    slug: str
    name: str
    # Exam code of the subject. Omitted for UPSC subjects (absent = "upsc") so
    # the UPSC response keeps exactly its pre-exam shape.
    exam: Optional[str] = None
    available: bool
    topics: int
    topics_with_mcqs: int


@router.get("/exams", response_model=list[GsExamOut])
def list_exams(db: Session = Depends(get_db)) -> list[GsExamOut]:
    """Active exams, in display order."""
    return [
        GsExamOut(
            code=e.code,
            name=e.name,
            display_order=e.display_order,
            content_level_label=PROFILES[e.code].content_level_label if e.code in PROFILES else None,
        )
        for e in active_exams(db)
    ]


@router.get("/subjects", response_model=list[GsSubjectAvailability], response_model_exclude_none=True)
def list_subjects(
    exam: Optional[str] = Query(None, description="Exam code; default: the student's exam, else upsc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GsSubjectAvailability]:
    if exam:
        row = find_exam(db, exam)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exam '{exam}' not found")
        exam_code = row.code
    else:
        exam_code = student_exam_code(db, current_user.id)
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
            exam=exam_code_of(s) if exam_code_of(s) not in (None, "upsc") else None,
            available=with_mcqs.get(s.id, 0) > 0,
            topics=topics.get(s.id, 0),
            topics_with_mcqs=with_mcqs.get(s.id, 0),
        )
        for s in scope_subjects_to_exam(db.query(GsSubject), exam_code).order_by(GsSubject.display_order, GsSubject.id)
    ]

"""Exam lookups for the GS LMS: which exams exist, which exam a student
prepares for, and how to scope a subject query to an exam.

Behaviour per exam lives in ``exam_profiles``; this module only reads the
``gs_exams`` catalogue and the learner profile.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Query, Session

from app.core.gs.models import GsExam, GsSubject
from app.core.gs_lms.exam_profiles import DEFAULT_EXAM_CODE, normalize_exam_code
from app.core.gs_lms.models import GsLmsLearnerProfile


def active_exams(db: Session) -> list[GsExam]:
    return (
        db.query(GsExam)
        .filter(GsExam.is_active == True)  # noqa: E712
        .order_by(GsExam.display_order, GsExam.id)
        .all()
    )


def find_exam(db: Session, code: Optional[str]) -> Optional[GsExam]:
    return db.query(GsExam).filter(GsExam.code == normalize_exam_code(code)).one_or_none()


def student_exam_code(db: Session, student_id: int) -> str:
    """The exam code on the student's learner profile; ``upsc`` when unset."""
    code = (
        db.query(GsLmsLearnerProfile.exam_code)
        .filter(GsLmsLearnerProfile.student_id == student_id)
        .scalar()
    )
    return normalize_exam_code(code) if code else DEFAULT_EXAM_CODE


def scope_subjects_to_exam(query: Query, exam_code: Optional[str]) -> Query:
    """Restrict a ``GsSubject`` query to one exam (no-op when ``exam_code`` is None)."""
    if exam_code is None:
        return query
    return query.join(GsExam, GsExam.id == GsSubject.exam_id).filter(
        GsExam.code == normalize_exam_code(exam_code)
    )


__all__ = ["active_exams", "find_exam", "student_exam_code", "scope_subjects_to_exam"]

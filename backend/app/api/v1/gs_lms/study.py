"""Single-page study flow: search -> study card -> explain -> next.

Mounted at /gs-lms/study (not under /{subject_slug}); registered before the
slug routers so "study" is never read as a subject slug.

* GET  /study/search?q=&subject=            ranked hits; logs weak/empty searches
* GET  /study/concepts/{concept_id}         study card (version, no key points)
* POST /study/concepts/{concept_id}/explain grade the student's explanation
* GET  /study/next?subject=                 where to continue

Only REVIEWED content is served. Locked topics answer 423 like other guarded
routes. Key points are revealed only as ``missed_points`` after an attempt.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import ai_rate_limit, get_current_user
from app.api.v1.gs_lms.concept_versions import ConceptVersionBriefOut, ConceptVersionOut, _brief, _version_out
from app.api.v1.gs_lms.dependencies import ensure_leaf_unlocked
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.content_requests import record_if_unanswered
from app.core.gs_lms.exams import student_exam_code
from app.core.gs_lms.mastery import CONCEPT_PASS_THRESHOLD, record_attempt
from app.core.gs_lms.models import GsLmsConcept, GsLmsNodeTypeEnum, GsLmsSyllabusNode, GsLmsVersionLevelEnum
from app.core.gs_lms.student_models import GsLmsConceptMastery
from app.core.gs_lms.study_flow import NextStep, next_after_concept, next_for_student
from app.core.gs_lms.study_search import MAX_QUERY_CHARS, search
from app.core.gs_lms.understanding import grade_explanation
from app.core.gs_lms.versions import pick_version, rank_versions
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/study")


class NextOut(BaseModel):
    type: str
    subject_slug: Optional[str] = None
    leaf_id: Optional[int] = None
    concept_id: Optional[int] = None
    checkpoint_id: Optional[int] = None
    label: str = ""


class HitOut(BaseModel):
    kind: str
    subject_slug: str
    subject_name: str
    leaf_id: int
    leaf_title: str
    concept_id: Optional[int] = None
    concept_title: Optional[str] = None
    start_concept_id: Optional[int] = None
    breadcrumb: list[str]
    score: float
    matched_terms: list[str]


class MasteryOut(BaseModel):
    status: str = "NOT_STARTED"
    best_score: float = 0.0
    last_score: Optional[float] = None
    attempts: int = 0
    passed: bool = False


class StudyCardOut(BaseModel):
    subject_slug: str
    subject_name: str
    leaf_id: int
    leaf_title: str
    breadcrumb: list[str]
    concept_id: int
    concept_title: str
    position: int
    total_concepts: int
    version: Optional[ConceptVersionOut] = None
    alternatives: list[ConceptVersionBriefOut] = []
    key_points_count: int
    mastery: MasteryOut
    next: Optional[NextOut] = None


class ExplainIn(BaseModel):
    text: str = Field(..., min_length=10, max_length=4000)


class ExplainOut(BaseModel):
    score: float
    passed: bool
    covered_points: list[str]
    missed_points: list[str]
    attempts: int
    status: str
    suggested_version: Optional[int] = None
    next: Optional[NextOut] = None


def _next_out(step: Optional[NextStep]) -> Optional[NextOut]:
    return None if step is None else NextOut(**step.__dict__)


def _mastery_out(row: Optional[GsLmsConceptMastery]) -> MasteryOut:
    if row is None:
        return MasteryOut()
    st = getattr(row.status, "value", row.status)
    return MasteryOut(
        status=st, best_score=row.score or 0.0, last_score=row.last_score,
        attempts=row.attempts or 0, passed=st == "PASSED",
    )


def _breadcrumb(db: Session, leaf: GsLmsSyllabusNode) -> Optional[list[str]]:
    """mega > sub > leaf titles, or None when any ancestor is not REVIEWED."""
    titles = [leaf.title]
    node = leaf
    seen = {leaf.id}
    while node.parent_id is not None:
        node = db.get(GsLmsSyllabusNode, node.parent_id)
        if node is None or node.id in seen or node.review_status != GsReviewStatusEnum.REVIEWED:
            return None
        seen.add(node.id)
        titles.append(node.title)
    return list(reversed(titles))


def _load(db: Session, user: User, concept_id: int):
    """(concept, leaf, subject, breadcrumb) for a REVIEWED concept; 404 / 423."""
    concept = db.get(GsLmsConcept, concept_id)
    leaf = db.get(GsLmsSyllabusNode, concept.syllabus_node_id) if concept else None
    if (
        concept is None
        or concept.review_status != GsReviewStatusEnum.REVIEWED
        or leaf is None
        or leaf.review_status != GsReviewStatusEnum.REVIEWED
        or leaf.node_type != GsLmsNodeTypeEnum.LEAF_TOPIC
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    crumb = _breadcrumb(db, leaf)
    subject = db.get(GsSubject, leaf.subject_id)
    if crumb is None or subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    ensure_leaf_unlocked(db, user, subject, leaf.id)
    return concept, leaf, subject, crumb


@router.get("/search")
def study_search(
    q: str = Query(..., min_length=1, max_length=MAX_QUERY_CHARS),
    subject: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Ranked matches; searches with no (or only a weak) match are logged as content requests."""
    if subject and db.query(GsSubject.id).filter(GsSubject.slug == subject).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject '{subject}' not found")
    hits = search(db, q, subject_slug=subject, exam_code=student_exam_code(db, current_user.id))
    record_if_unanswered(db, current_user.id, q, hits, subject)
    db.commit()
    data = [
        HitOut(**{k: v for k, v in h.__dict__.items() if not k.startswith("_")}) for h in hits
    ]
    return StandardResponse(success=True, message="Search results", data=data)


@router.get("/next")
def study_next(
    subject: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if subject and db.query(GsSubject.id).filter(GsSubject.slug == subject).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject '{subject}' not found")
    step = next_for_student(db, current_user, subject, student_exam_code(db, current_user.id))
    return StandardResponse(success=True, message="Next step", data=_next_out(step))


@router.get("/concepts/{concept_id}")
def study_card(
    concept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    concept, leaf, subject, crumb = _load(db, current_user, concept_id)
    ranked = rank_versions(db, current_user.id, concept.id)
    siblings = (
        db.query(GsLmsConcept.id)
        .filter(
            GsLmsConcept.syllabus_node_id == leaf.id,
            GsLmsConcept.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsConcept.display_order, GsLmsConcept.id)
        .all()
    )
    ids = [r[0] for r in siblings]
    row = (
        db.query(GsLmsConceptMastery)
        .filter(GsLmsConceptMastery.student_id == current_user.id, GsLmsConceptMastery.concept_id == concept.id)
        .one_or_none()
    )
    card = StudyCardOut(
        subject_slug=subject.slug, subject_name=subject.name, leaf_id=leaf.id, leaf_title=leaf.title,
        breadcrumb=crumb, concept_id=concept.id, concept_title=concept.title,
        position=ids.index(concept.id) + 1, total_concepts=len(ids),
        version=_version_out(ranked[0]) if ranked else None,
        alternatives=[_brief(v) for v in ranked[1:]],
        key_points_count=len([k for k in (concept.key_points or []) if isinstance(k, str) and k.strip()]),
        mastery=_mastery_out(row),
        next=_next_out(next_after_concept(db, current_user, subject, concept)),
    )
    return StandardResponse(success=True, message="Study card", data=card)


@router.post("/concepts/{concept_id}/explain", dependencies=[Depends(ai_rate_limit)])
def study_explain(
    concept_id: int,
    body: ExplainIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    concept, leaf, subject, _ = _load(db, current_user, concept_id)
    grade = grade_explanation(body.text, concept.key_points)
    row = record_attempt(db, current_user.id, concept.id, grade.score)
    db.commit()
    passed = grade.score >= CONCEPT_PASS_THRESHOLD
    suggested = None
    if not passed:
        picked = pick_version(db, current_user.id, concept.id)
        if picked is not None and picked.level == GsLmsVersionLevelEnum.BASIC:
            suggested = picked.id
    out = ExplainOut(
        score=grade.score, passed=passed, covered_points=grade.covered, missed_points=grade.missed,
        attempts=row.attempts, status=getattr(row.status, "value", row.status),
        suggested_version=suggested,
        next=_next_out(next_after_concept(db, current_user, subject, concept)),
    )
    return StandardResponse(success=True, message="Explanation checked", data=out)

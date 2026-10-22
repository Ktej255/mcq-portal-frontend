"""Concept versions, books and the learner profile for the GS LMS.

Routes (all auth-gated at the package router):
* GET /{subject}/concepts/{concept_id}/version — the version picked for the
  current student (see ``app.core.gs_lms.versions``) plus alternatives.
* GET /{subject}/concepts/{concept_id}/versions/{version_id} — one specific
  REVIEWED version.
* GET /profile, PUT /profile — the student's learner profile.
* GET /books?subject=<slug> — books with their chapters.

Only REVIEWED concepts and versions are served. The version routes return 423
when the concept's topic is locked for the student, like other guarded routes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.v1.gs_lms.dependencies import ensure_leaf_unlocked, resolve_subject
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsBook,
    GsLmsConcept,
    GsLmsConceptVersion,
    GsLmsLearnerProfile,
    GsLmsNodeTypeEnum,
    GsLmsStudyPathEnum,
    GsLmsSyllabusNode,
    GsLmsVersionLevelEnum,
    GsLmsVersionStyleEnum,
)
from app.core.gs_lms.versions import rank_versions
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

# Subject-scoped routes (mounted under /{subject_slug}) and global ones.
router = APIRouter()
global_router = APIRouter()


class ConceptVersionOut(BaseModel):
    id: int
    concept_id: int
    level: str
    style: str
    source: str
    title: str
    blocks: list[Any] = []
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class ConceptVersionBriefOut(BaseModel):
    id: int
    level: str
    style: str
    source: str
    title: str


class PickedVersionOut(BaseModel):
    concept_id: int
    version: ConceptVersionOut
    alternatives: list[ConceptVersionBriefOut] = []


class LearnerProfileIn(BaseModel):
    """Full replacement of the profile; omitted fields become empty."""
    preferred_style: Optional[GsLmsVersionStyleEnum] = None
    preferred_level: Optional[GsLmsVersionLevelEnum] = None
    study_path: Optional[GsLmsStudyPathEnum] = None
    book_ids: list[int] = []


class LearnerProfileOut(BaseModel):
    preferred_style: Optional[str] = None
    preferred_level: Optional[str] = None
    study_path: Optional[str] = None
    book_ids: list[int] = []
    updated_at: Optional[str] = None


class BookChapterOut(BaseModel):
    number: int
    title: str


class BookOut(BaseModel):
    id: int
    slug: str
    title: str
    author: str
    edition: str
    publisher: Optional[str] = None
    exam_tag: str
    subject_slug: Optional[str] = None
    chapters: list[BookChapterOut] = []


def _version_out(v: GsLmsConceptVersion) -> ConceptVersionOut:
    return ConceptVersionOut(
        id=v.id,
        concept_id=v.concept_id,
        level=v.level.value,
        style=v.style.value,
        source=v.source.value,
        title=v.title,
        blocks=v.blocks or [],
        video_url=v.video_url,
        duration_minutes=v.duration_minutes,
    )


def _brief(v: GsLmsConceptVersion) -> ConceptVersionBriefOut:
    return ConceptVersionBriefOut(
        id=v.id, level=v.level.value, style=v.style.value, source=v.source.value, title=v.title
    )


def _guarded_concept(
    db: Session, user: User, subject: GsSubject, concept_id: int
) -> GsLmsConcept:
    """The REVIEWED concept of a leaf in this subject; 404 if absent, 423 if its topic is locked."""
    concept = (
        db.query(GsLmsConcept)
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsConcept.syllabus_node_id)
        .filter(
            GsLmsConcept.id == concept_id,
            GsLmsConcept.review_status == GsReviewStatusEnum.REVIEWED,
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
        )
        .one_or_none()
    )
    if concept is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    ensure_leaf_unlocked(db, user, subject, concept.syllabus_node_id)
    return concept


@router.get("/concepts/{concept_id}/version")
def get_picked_version(
    concept_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """The version of the concept best suited to the current student."""
    concept = _guarded_concept(db, current_user, subject, concept_id)
    ranked = rank_versions(db, current_user.id, concept.id)
    if not ranked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No version available for this concept")
    return StandardResponse(
        success=True,
        message="Concept version",
        data=PickedVersionOut(
            concept_id=concept.id,
            version=_version_out(ranked[0]),
            alternatives=[_brief(v) for v in ranked[1:]],
        ),
    )


@router.get("/concepts/{concept_id}/versions/{version_id}")
def get_specific_version(
    concept_id: int,
    version_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """One specific REVIEWED version of the concept."""
    concept = _guarded_concept(db, current_user, subject, concept_id)
    version = (
        db.query(GsLmsConceptVersion)
        .filter(
            GsLmsConceptVersion.id == version_id,
            GsLmsConceptVersion.concept_id == concept.id,
            GsLmsConceptVersion.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .one_or_none()
    )
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
    return StandardResponse(success=True, message="Concept version", data=_version_out(version))


def _profile_out(profile: Optional[GsLmsLearnerProfile]) -> LearnerProfileOut:
    if profile is None:
        return LearnerProfileOut()
    return LearnerProfileOut(
        preferred_style=profile.preferred_style.value if profile.preferred_style else None,
        preferred_level=profile.preferred_level.value if profile.preferred_level else None,
        study_path=profile.study_path.value if profile.study_path else None,
        book_ids=[b for b in (profile.book_ids or []) if isinstance(b, int)],
        updated_at=profile.updated_at.isoformat() if isinstance(profile.updated_at, datetime) else None,
    )


@global_router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    profile = (
        db.query(GsLmsLearnerProfile)
        .filter(GsLmsLearnerProfile.student_id == current_user.id)
        .one_or_none()
    )
    return StandardResponse(success=True, message="Learner profile", data=_profile_out(profile))


@global_router.put("/profile")
def put_profile(
    body: LearnerProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Replace the student's profile. Enum values are validated by the schema
    (422); every book id must exist (422)."""
    book_ids = sorted(set(body.book_ids))
    if book_ids:
        found = {i for (i,) in db.query(GsLmsBook.id).filter(GsLmsBook.id.in_(book_ids)).all()}
        missing = [i for i in book_ids if i not in found]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown book id(s): {missing}",
            )
    profile = (
        db.query(GsLmsLearnerProfile)
        .filter(GsLmsLearnerProfile.student_id == current_user.id)
        .one_or_none()
    )
    if profile is None:
        profile = GsLmsLearnerProfile(student_id=current_user.id, created_by=str(current_user.id))
        db.add(profile)
    profile.preferred_style = body.preferred_style
    profile.preferred_level = body.preferred_level
    profile.study_path = body.study_path
    profile.book_ids = book_ids
    profile.updated_by = str(current_user.id)
    db.commit()
    db.refresh(profile)
    return StandardResponse(success=True, message="Learner profile saved", data=_profile_out(profile))


@global_router.get("/books")
def list_books(
    subject: Optional[str] = Query(None, description="Only books for this subject slug"),
    db: Session = Depends(get_db),
) -> Any:
    query = db.query(GsLmsBook)
    if subject:
        query = query.filter(GsLmsBook.subject_slug == subject)
    books = query.order_by(GsLmsBook.title, GsLmsBook.edition, GsLmsBook.id).all()
    return StandardResponse(
        success=True,
        message="Books",
        data=[
            BookOut(
                id=b.id,
                slug=b.slug,
                title=b.title,
                author=b.author,
                edition=b.edition,
                publisher=b.publisher,
                exam_tag=b.exam_tag,
                subject_slug=b.subject_slug,
                chapters=[BookChapterOut(number=c.number, title=c.title) for c in b.chapters],
            )
            for b in books
        ],
    )

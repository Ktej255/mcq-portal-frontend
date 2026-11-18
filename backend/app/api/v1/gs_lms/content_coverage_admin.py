"""Operator content-coverage audit for the GS LMS.

The learner-facing app already refuses to fake coverage: a topic serves only
REVIEWED sections, readiness demand counts only REVIEWED PYQs, and the MCQ Lab
opens only with a complete 15-question reviewed bank. This endpoint mirrors
those exact gates for operators, so the "coverage gap on our side" message a
learner sees can be traced to a specific topic and a specific missing asset.

Mounted at ``/api/v1/admin/gs-lms/content-coverage`` and gated by
``get_current_admin`` at the router level. Read-only: authoring and review
gates stay in their existing tools.

Gate sources (keep these aligned):

* ``content._get_reviewed_sections`` — REVIEWED sections only.
* ``readiness_service.rebuild_demand_weights`` — REVIEWED leaf + REVIEWED PYQ.
* ``mcq_lab.get_mcq_lab_questions`` — 15 REVIEWED questions minimum.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.mcq_lab_scoring import TOTAL_MCQ_LAB_QUESTIONS
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.db.session import get_db
from app.schemas.common import StandardResponse

router = APIRouter(dependencies=[Depends(get_current_admin)])

# Canonical display order, identical to content._get_reviewed_sections. The
# enum declaration order differs (ADVANCED is declared before NCERT_LEVEL), so
# spell the funnel order out rather than deriving it from the enum.
CANONICAL_SECTIONS: tuple[str, ...] = (
    GsLmsSectionLabelEnum.BASIC.value,
    GsLmsSectionLabelEnum.NCERT_LEVEL.value,
    GsLmsSectionLabelEnum.ADVANCED.value,
    GsLmsSectionLabelEnum.CURRENT_AFFAIRS.value,
    GsLmsSectionLabelEnum.EXAMINER_TRAPS.value,
)

# Stable blocker codes. The UI owns the learner-facing wording so the API
# stays machine-readable and testable.
BLOCKER_TOPIC_UNREVIEWED = "TOPIC_UNREVIEWED"
BLOCKER_CONTENT_MISSING = "CONTENT_MISSING"
BLOCKER_SECTION_GAP = "SECTION_GAP"
BLOCKER_UNREVIEWED_SECTIONS = "UNREVIEWED_SECTIONS"
BLOCKER_DEMAND_UNMAPPED = "DEMAND_UNMAPPED"
BLOCKER_MCQ_LAB_SHORT = "MCQ_LAB_SHORT"


class TopicCoverageOut(BaseModel):
    node_id: int
    title: str
    display_order: int
    topic_reviewed: bool
    sections_reviewed: int
    sections_expected: int
    missing_sections: list[str]
    sections_unreviewed: int
    prelims_pyqs_reviewed: int
    mains_pyqs_reviewed: int
    pyqs_reviewed: int
    mcqs_reviewed: int
    mcq_lab_min: int
    mcq_types: dict[str, int]
    content_open: bool
    demand_measured: bool
    lab_open: bool
    full_depth: bool
    learner_ready: bool
    blockers: list[str]


class CoverageTotalsOut(BaseModel):
    topics: int
    topics_hidden: int
    learner_ready: int
    content_open: int
    demand_measured: int
    lab_open: int
    full_depth: int
    sections_reviewed: int
    sections_expected: int
    pyqs_reviewed: int
    mcqs_reviewed: int
    blocker_counts: dict[str, int]


class ContentCoverageOut(BaseModel):
    subject: str
    subject_name: str
    generated_at: datetime
    mcq_lab_min: int
    canonical_sections: list[str]
    totals: CoverageTotalsOut
    topics: list[TopicCoverageOut]


def _enum_value(value: Any) -> str:
    return value.value if hasattr(value, "value") else str(value)


@router.get(
    "/{subject_slug}",
    response_model=StandardResponse[ContentCoverageOut],
)
def get_content_coverage(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
) -> Any:
    """Per-topic coverage of every learner-facing gate, plus subject totals."""
    leaves = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
        )
        .order_by(GsLmsSyllabusNode.display_order, GsLmsSyllabusNode.id)
        .all()
    )
    leaf_ids = [node.id for node in leaves]

    reviewed_labels: dict[int, set[str]] = defaultdict(set)
    reviewed_section_rows: dict[int, int] = defaultdict(int)
    unreviewed_section_rows: dict[int, int] = defaultdict(int)
    prelims_pyqs: dict[int, int] = defaultdict(int)
    mains_pyqs: dict[int, int] = defaultdict(int)
    reviewed_mcqs: dict[int, int] = defaultdict(int)
    mcq_types: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    if leaf_ids:
        section_rows = (
            db.query(
                GsLmsContentSection.syllabus_node_id,
                GsLmsContentSection.section_label,
                GsLmsContentSection.review_status,
                func.count(GsLmsContentSection.id),
            )
            .filter(GsLmsContentSection.syllabus_node_id.in_(leaf_ids))
            .group_by(
                GsLmsContentSection.syllabus_node_id,
                GsLmsContentSection.section_label,
                GsLmsContentSection.review_status,
            )
            .all()
        )
        for node_id, label, review_status, count in section_rows:
            if review_status == GsReviewStatusEnum.REVIEWED:
                reviewed_section_rows[node_id] += count
                reviewed_labels[node_id].add(_enum_value(label))
            else:
                unreviewed_section_rows[node_id] += count

        pyq_rows = (
            db.query(
                GsLmsPyq.syllabus_node_id,
                GsLmsPyq.exam_type,
                func.count(GsLmsPyq.id),
            )
            .filter(
                GsLmsPyq.syllabus_node_id.in_(leaf_ids),
                GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .group_by(GsLmsPyq.syllabus_node_id, GsLmsPyq.exam_type)
            .all()
        )
        for node_id, exam_type, count in pyq_rows:
            if _enum_value(exam_type) == "PRELIMS":
                prelims_pyqs[node_id] += count
            else:
                mains_pyqs[node_id] += count

        mcq_rows = (
            db.query(
                GsLmsMcqQuestion.syllabus_node_id,
                GsLmsMcqQuestion.question_type,
                func.count(GsLmsMcqQuestion.id),
            )
            .filter(
                GsLmsMcqQuestion.syllabus_node_id.in_(leaf_ids),
                GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .group_by(
                GsLmsMcqQuestion.syllabus_node_id,
                GsLmsMcqQuestion.question_type,
            )
            .all()
        )
        for node_id, question_type, count in mcq_rows:
            reviewed_mcqs[node_id] += count
            mcq_types[node_id][_enum_value(question_type)] += count

    topics: list[TopicCoverageOut] = []
    blocker_counts: dict[str, int] = defaultdict(int)
    totals = {
        "topics": len(leaves),
        "topics_hidden": 0,
        "learner_ready": 0,
        "content_open": 0,
        "demand_measured": 0,
        "lab_open": 0,
        "full_depth": 0,
        "sections_reviewed": 0,
        "sections_expected": 0,
        "pyqs_reviewed": 0,
        "mcqs_reviewed": 0,
    }

    for node in leaves:
        topic_reviewed = node.review_status == GsReviewStatusEnum.REVIEWED
        reviewed_labels_for_node = reviewed_labels.get(node.id, set())
        sections_reviewed = reviewed_section_rows.get(node.id, 0)
        sections_unreviewed = unreviewed_section_rows.get(node.id, 0)
        missing_sections = [
            label for label in CANONICAL_SECTIONS if label not in reviewed_labels_for_node
        ]
        pre = prelims_pyqs.get(node.id, 0)
        mains = mains_pyqs.get(node.id, 0)
        pyqs_reviewed = pre + mains
        mcqs_reviewed = reviewed_mcqs.get(node.id, 0)

        content_open = topic_reviewed and sections_reviewed > 0
        demand_measured = topic_reviewed and pyqs_reviewed > 0
        lab_open = topic_reviewed and mcqs_reviewed >= TOTAL_MCQ_LAB_QUESTIONS
        full_depth = topic_reviewed and not missing_sections
        learner_ready = content_open and demand_measured and lab_open and full_depth

        blockers: list[str] = []
        if not topic_reviewed:
            blockers.append(BLOCKER_TOPIC_UNREVIEWED)
        if not content_open:
            blockers.append(BLOCKER_CONTENT_MISSING)
        if topic_reviewed and missing_sections:
            blockers.append(BLOCKER_SECTION_GAP)
        if sections_unreviewed > 0:
            blockers.append(BLOCKER_UNREVIEWED_SECTIONS)
        if not demand_measured:
            blockers.append(BLOCKER_DEMAND_UNMAPPED)
        if not lab_open:
            blockers.append(BLOCKER_MCQ_LAB_SHORT)

        topics.append(
            TopicCoverageOut(
                node_id=node.id,
                title=node.title,
                display_order=node.display_order,
                topic_reviewed=topic_reviewed,
                sections_reviewed=sections_reviewed,
                sections_expected=len(CANONICAL_SECTIONS),
                missing_sections=missing_sections,
                sections_unreviewed=sections_unreviewed,
                prelims_pyqs_reviewed=pre,
                mains_pyqs_reviewed=mains,
                pyqs_reviewed=pyqs_reviewed,
                mcqs_reviewed=mcqs_reviewed,
                mcq_lab_min=TOTAL_MCQ_LAB_QUESTIONS,
                mcq_types=dict(sorted(mcq_types.get(node.id, {}).items())),
                content_open=content_open,
                demand_measured=demand_measured,
                lab_open=lab_open,
                full_depth=full_depth,
                learner_ready=learner_ready,
                blockers=blockers,
            )
        )

        for blocker in blockers:
            blocker_counts[blocker] += 1
        if not topic_reviewed:
            totals["topics_hidden"] += 1
        totals["learner_ready"] += int(learner_ready)
        totals["content_open"] += int(content_open)
        totals["demand_measured"] += int(demand_measured)
        totals["lab_open"] += int(lab_open)
        totals["full_depth"] += int(full_depth)
        totals["sections_reviewed"] += sections_reviewed
        totals["sections_expected"] += len(CANONICAL_SECTIONS)
        totals["pyqs_reviewed"] += pyqs_reviewed
        totals["mcqs_reviewed"] += mcqs_reviewed

    payload = ContentCoverageOut(
        subject=subject.slug,
        subject_name=subject.name,
        generated_at=datetime.now(timezone.utc),
        mcq_lab_min=TOTAL_MCQ_LAB_QUESTIONS,
        canonical_sections=list(CANONICAL_SECTIONS),
        totals=CoverageTotalsOut(
            **totals,
            blocker_counts=dict(sorted(blocker_counts.items())),
        ),
        topics=topics,
    )
    return StandardResponse(
        success=True,
        message="Content coverage retrieved",
        data=payload,
    )

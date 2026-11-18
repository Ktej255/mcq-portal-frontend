"""Syllabus tree endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms/{subject_slug}; auth-gated at the package router):
* GET /syllabus — Full tree with per-student completion status
* GET /syllabus/{node_id} — Single node with children

Design properties enforced:
* Property 19 (review-gate): only REVIEWED nodes are returned to students.
* Property 2 (completion accuracy): annotates each node correctly —
  boolean for leaf nodes, percentage for non-leaf nodes.
* Requirement 11.2: bridges to existing GsDayLesson via day_lesson_id FK.

Requirements traced: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 10.3, 11.2
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.schemas.common import StandardResponse
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsNodeTypeEnum,
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsPyq,
)
from app.core.gs_lms.student_models import (
    GsLmsDiscussionSession,
    GsLmsDiscussionStatusEnum,
)
from app.core.gs_lms.beta_scope import beta_scope_enabled, compute_loop_ready_ids
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.api.v1.gs_lms.content import (
    _compute_skippable_section_ids,
    _compute_skippable_section_labels,
    _get_learner_level,
    _get_student_progress,
    _is_topic_completed,
)
from app.api.v1.gs_lms.schemas import (
    GsLmsSyllabusNodeOut,
    GsLmsSyllabusTreeOut,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_completed_leaf_ids(
    db: Session, student_id: int, subject_id: int
) -> set[int]:
    """Return subject-scoped leaf topics completed under the canonical policy.

    Completion is based on reviewed content sections and excludes sections that
    the learner may skip according to their level and latest discussion match.
    The reviewed section and discussion state are batch-loaded for the subject
    to avoid one query per syllabus leaf.
    """
    leaf_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    leaf_ids = [node.id for node in leaf_nodes]
    if not leaf_ids:
        return set()

    sections_by_node: dict[int, list[GsLmsContentSection]] = defaultdict(list)
    reviewed_sections = (
        db.query(GsLmsContentSection)
        .filter(
            GsLmsContentSection.syllabus_node_id.in_(leaf_ids),
            GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    for section in reviewed_sections:
        sections_by_node[section.syllabus_node_id].append(section)

    all_section_ids = [
        section.id
        for sections in sections_by_node.values()
        for section in sections
    ]
    progress_map = _get_student_progress(db, student_id, all_section_ids)
    learner_level = _get_learner_level(db, student_id)

    latest_match_by_node: dict[int, float | None] = {}
    sessions = (
        db.query(GsLmsDiscussionSession)
        .filter(
            GsLmsDiscussionSession.student_id == student_id,
            GsLmsDiscussionSession.syllabus_node_id.in_(leaf_ids),
            GsLmsDiscussionSession.status == GsLmsDiscussionStatusEnum.COMPLETED,
        )
        .order_by(GsLmsDiscussionSession.completed_at.desc())
        .all()
    )
    for session in sessions:
        latest_match_by_node.setdefault(
            session.syllabus_node_id, session.match_percentage
        )

    completed_leaf_ids: set[int] = set()
    for node_id, sections in sections_by_node.items():
        section_ids = [section.id for section in sections]
        skippable_labels = _compute_skippable_section_labels(
            learner_level, latest_match_by_node.get(node_id)
        )
        skippable_ids = _compute_skippable_section_ids(
            sections, skippable_labels
        )
        if _is_topic_completed(progress_map, section_ids, skippable_ids):
            completed_leaf_ids.add(node_id)

    return completed_leaf_ids


def _compute_completion(
    node: GsLmsSyllabusNode,
    children_out: list[GsLmsSyllabusNodeOut],
    completed_leaf_ids: set[int],
) -> tuple[float | None, bool | None]:
    """Compute completion using canonical leaf state and child rollups.

    Returns (completion_percent, completed_bool):
    - For leaf nodes: (None, bool)
    - For non-leaf nodes: (float 0-100, None)
    """
    if node.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
        return (None, node.id in completed_leaf_ids)

    # Non-leaf: percentage = completed children / total children * 100
    total_children = len(children_out)
    if total_children == 0:
        return (0.0, None)
    completed_children = sum(
        1
        for child in children_out
        if (child.completed is True)
        or (child.completion_percent is not None and child.completion_percent >= 100.0)
    )
    percent = (completed_children / total_children) * 100.0
    return (percent, None)


def _review_status_value(node: GsLmsSyllabusNode) -> str:
    rs = node.review_status
    return rs.value if hasattr(rs, "value") else str(rs)


def _node_type_value(node: GsLmsSyllabusNode) -> str:
    nt = node.node_type
    return nt.value if hasattr(nt, "value") else str(nt)


def _build_mcq_counts(db: Session, subject_id: int) -> dict[int, int]:
    """Count REVIEWED standalone practice MCQs per syllabus node.

    The practice selector must not offer a topic with zero questions: starting
    such a session fails with 422. Surfacing the count in the tree lets the UI
    present a coverage gap instead of a broken button.
    """
    rows = (
        db.query(
            GsLmsMcqQuestion.syllabus_node_id,
            func.count(GsLmsMcqQuestion.id),
        )
        .join(
            GsLmsSyllabusNode,
            GsLmsSyllabusNode.id == GsLmsMcqQuestion.syllabus_node_id,
        )
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .group_by(GsLmsMcqQuestion.syllabus_node_id)
        .all()
    )
    return {node_id: count for node_id, count in rows}


def _build_pyq_counts(db: Session, subject_id: int) -> dict[int, tuple[int, int]]:
    """Count REVIEWED Prelims and Mains PYQs per leaf in one query.

    The tree shows the raw evidence behind demand ("3P · 2M"); the weighted
    share stays on the topic strip and readiness dashboard. Locked leaves are
    included because the map should still say whether a future topic is
    demanded by UPSC, not hide the evidence until it opens.
    """
    counts: dict[int, tuple[int, int]] = defaultdict(lambda: (0, 0))
    rows = (
        db.query(
            GsLmsPyq.syllabus_node_id,
            GsLmsPyq.exam_type,
            func.count(GsLmsPyq.id),
        )
        .join(
            GsLmsSyllabusNode,
            GsLmsSyllabusNode.id == GsLmsPyq.syllabus_node_id,
        )
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .group_by(GsLmsPyq.syllabus_node_id, GsLmsPyq.exam_type)
        .all()
    )
    for node_id, exam_type, total in rows:
        raw_type = exam_type.value if hasattr(exam_type, "value") else str(exam_type)
        prelims, mains = counts[node_id]
        if raw_type.upper() == "PRELIMS":
            prelims += int(total)
        else:
            mains += int(total)
        counts[node_id] = (prelims, mains)
    return dict(counts)


def _build_node_out(
    node: GsLmsSyllabusNode,
    completed_leaf_ids: set[int],
    mcq_counts: dict[int, int],
    beta_ready_ids: set[int] | None = None,
    pyq_counts: dict[int, tuple[int, int]] | None = None,
) -> GsLmsSyllabusNodeOut:
    """Recursively build a GsLmsSyllabusNodeOut from a reviewed node.

    Only includes children that are also REVIEWED (Property 19).
    """
    # Filter children to only REVIEWED nodes, sorted by display_order.
    reviewed_children = sorted(
        [c for c in node.children if c.review_status == GsReviewStatusEnum.REVIEWED],
        key=lambda n: (n.display_order, n.id),
    )
    children_out = [
        _build_node_out(
            c, completed_leaf_ids, mcq_counts, beta_ready_ids, pyq_counts
        )
        for c in reviewed_children
    ]

    completion_percent, completed = _compute_completion(
        node, children_out, completed_leaf_ids
    )

    beta_ready: bool | None = None
    if beta_ready_ids is not None and node.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
        beta_ready = node.id in beta_ready_ids

    prelims_pyqs, mains_pyqs = (
        pyq_counts.get(node.id, (0, 0)) if pyq_counts else (0, 0)
    )

    return GsLmsSyllabusNodeOut(
        node_id=node.id,
        title=node.title,
        node_type=_node_type_value(node),
        weight=node.weight,
        display_order=node.display_order,
        review_status=_review_status_value(node),
        completion_percent=completion_percent,
        completed=completed,
        mcq_count=mcq_counts.get(node.id, 0),
        prelims_pyq_count=prelims_pyqs,
        mains_pyq_count=mains_pyqs,
        beta_ready=beta_ready,
        day_lesson_id=node.day_lesson_id,
        ordering_justification=node.ordering_justification,
        children=children_out,
    )


def _count_nodes(nodes: list[GsLmsSyllabusNodeOut]) -> int:
    """Recursively count all nodes in the tree."""
    count = 0
    for node in nodes:
        count += 1
        count += _count_nodes(node.children)
    return count


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/syllabus")
def get_syllabus_tree(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return the full syllabus tree with per-student completion.

    Only REVIEWED nodes are included (Property 19 / Requirement 10.3).
    Each node is annotated with completion status for the requesting student.
    """
    # Query all REVIEWED root nodes (parent_id IS NULL) for this subject.
    root_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.parent_id == None,  # noqa: E711
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsSyllabusNode.display_order, GsLmsSyllabusNode.id)
        .all()
    )

    # Build subject-scoped, learner-aware completion state in bounded queries.
    completed_leaf_ids = _build_completed_leaf_ids(
        db, current_user.id, subject.id
    )
    mcq_counts = _build_mcq_counts(db, subject.id)
    pyq_counts = _build_pyq_counts(db, subject.id)
    beta_ready_ids = (
        compute_loop_ready_ids(db, subject.id) if beta_scope_enabled() else None
    )

    tree = [
        _build_node_out(
            node, completed_leaf_ids, mcq_counts, beta_ready_ids, pyq_counts
        )
        for node in root_nodes
    ]
    total_nodes = _count_nodes(tree)

    data = GsLmsSyllabusTreeOut(
        subject_id=subject.id,
        subject_name=subject.name,
        total_nodes=total_nodes,
        tree=tree,
    )
    return StandardResponse(
        success=True,
        message=f"{subject.name} syllabus tree retrieved",
        data=data,
    )


@router.get("/syllabus/{node_id}")
def get_syllabus_node(
    node_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return a single syllabus node with its children.

    Only returns the node if it is REVIEWED (Property 19).
    Children are also filtered to only REVIEWED nodes.
    """
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.id == node_id,
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .one_or_none()
    )
    if node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    completed_leaf_ids = _build_completed_leaf_ids(
        db, current_user.id, subject.id
    )
    mcq_counts = _build_mcq_counts(db, subject.id)
    pyq_counts = _build_pyq_counts(db, subject.id)
    beta_ready_ids = (
        compute_loop_ready_ids(db, subject.id) if beta_scope_enabled() else None
    )
    data = _build_node_out(
        node, completed_leaf_ids, mcq_counts, beta_ready_ids, pyq_counts
    )

    return StandardResponse(
        success=True,
        message="Syllabus node retrieved",
        data=data,
    )

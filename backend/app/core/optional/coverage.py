"""Weighted syllabus-tree coverage computation for the Optional platform
(Task 11.1 — Phase 1G, R12.1 / R12.2 / R12.4).

Treats a subject's official syllabus as a weighted tree and turns a student's
tracked activity (read completion, practice pass, recall threshold — the
``ProgressEvent`` rows) into a covered% / remaining% gap figure (design
"Gap/progress" section).

The math is split into a **pure** function (:func:`compute_coverage_math`) that
operates on plain ``{node_id: weight}`` + a covered-id set, and a thin DB
wrapper (:func:`compute_subject_coverage`) that builds those inputs from the
ORM. The pure function is what the Property-2 test pins:

    * ``0 ≤ covered% ≤ 100`` and ``covered% + remaining% = 100`` (exactly);
    * ``covered% = Σ weight(covered) / Σ weight(all)`` (design **Property 2**).

Weighting fallback: the canonical design normalises node weights to sum to 1.0,
but authored content may not have weights assigned yet (all zero). When the
universe's total weight is ``0`` we fall back to **equal weighting** (each node
counts as 1) so coverage is still bounded, exact, and meaningful rather than a
divide-by-zero — the equal-weight case still satisfies Property 2 with an
effective per-node weight of 1.

Isolation (Requirement 2 / design Property 9): nothing here imports from or
references GS Geography (``/upsc/geography``) modules.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from decimal import Decimal
from numbers import Real
from typing import Dict, Iterable, List, Mapping, Set

from sqlalchemy.orm import Session

from app.core.optional.models import OptionalSubject, SyllabusNode
from app.core.optional.student_models import ProgressEvent, ProgressEventTypeEnum


# Event types that mark a syllabus node as "covered" (design Gap/progress).
# Every tracked-activity type counts: recording one against a node covers it.
QUALIFYING_EVENT_TYPES: tuple[ProgressEventTypeEnum, ...] = (
    ProgressEventTypeEnum.READ_COMPLETE,
    ProgressEventTypeEnum.PRACTICE_PASS,
    ProgressEventTypeEnum.RECALL_THRESHOLD,
)


@dataclass(frozen=True)
class CoverageMath:
    """The pure coverage result for a node-weight universe + covered set.

    Invariants (design Property 2), guaranteed by :func:`compute_coverage_math`:
        * ``0 ≤ covered_percent ≤ 100``;
        * ``covered_percent + remaining_percent == 100`` exactly;
        * ``covered_percent == Σ weight(covered) / Σ weight(all) × 100`` (or the
          equal-weight fallback when all weights are 0).
    """

    total_weight: float
    covered_weight: float
    covered_percent: float
    remaining_percent: float
    total_nodes: int
    covered_nodes: int


class CoverageIntegrityError(ValueError):
    """Raised when authored syllabus coverage weights are not trustworthy.

    This is intentionally a typed error so API boundaries can return a
    sanitized retryable response without exposing authored values or internal
    exception details to students.
    """

    retryable = True

    def __init__(self, *, node_id: object = None, reason: str = "invalid weight") -> None:
        super().__init__("Coverage data contains an invalid node weight")
        self.node_id = node_id
        self.reason = reason


def _validated_node_weights(node_weights: Mapping[int, float]) -> Dict[int, float]:
    """Validate and normalize weights without correcting authored data."""
    validated: Dict[int, float] = {}
    for node_id, raw_weight in node_weights.items():
        # Strings, booleans, None, and arbitrary objects must not be silently
        # coerced into authored weights. Decimal is accepted as a numeric value
        # because ORM/test boundaries may supply it even though the model uses
        # Float.
        if isinstance(raw_weight, (bool, str, bytes, bytearray)) or not isinstance(
            raw_weight, (Real, Decimal)
        ):
            raise CoverageIntegrityError(node_id=node_id)
        try:
            weight = float(raw_weight)
        except (TypeError, ValueError, OverflowError) as exc:
            raise CoverageIntegrityError(node_id=node_id) from exc
        if not math.isfinite(weight) or weight < 0.0:
            raise CoverageIntegrityError(node_id=node_id)
        validated[node_id] = weight
    return validated


def compute_coverage_math(
    node_weights: Mapping[int, float],
    covered_ids: Iterable[int],
) -> CoverageMath:
    """Compute coverage over a node-weight universe (pure, design Property 2).

    ``node_weights`` is the coverage universe ``{node_id: weight}``; ``covered_ids``
    is the set of node ids with a qualifying tracked activity. Only ids present
    in the universe count toward the numerator (a stray covered id outside the
    universe is ignored), so ``covered ⊆ universe`` always holds.
    """
    validated_weights = _validated_node_weights(node_weights)
    universe: Set[int] = set(validated_weights.keys())
    covered: Set[int] = universe & set(covered_ids)
    total_nodes = len(universe)
    covered_nodes = len(covered)

    # Empty syllabus → nothing covered; remaining is the whole (empty) 100%.
    if total_nodes == 0:
        return CoverageMath(0.0, 0.0, 0.0, 100.0, 0, 0)

    try:
        total_weight = math.fsum(validated_weights.values())
    except (OverflowError, ValueError) as exc:
        raise CoverageIntegrityError(reason="invalid total weight") from exc
    if not math.isfinite(total_weight):
        raise CoverageIntegrityError(reason="invalid total weight")

    if total_weight > 0:
        covered_weight = math.fsum(validated_weights[i] for i in covered)
        if not math.isfinite(covered_weight):
            raise CoverageIntegrityError(reason="invalid covered weight")
        raw_percent = covered_weight / total_weight * 100.0
        reported_total_weight = total_weight
    else:
        # Equal-weight fallback (weights not authored): each node counts as 1.
        covered_weight = float(covered_nodes)
        raw_percent = covered_nodes / total_nodes * 100.0
        reported_total_weight = float(total_nodes)

    if not math.isfinite(raw_percent):
        raise CoverageIntegrityError(reason="invalid coverage percentage")

    # Clamp for safety, then round so that covered + remaining == 100 exactly.
    covered_percent = round(max(0.0, min(100.0, raw_percent)), 4)
    remaining_percent = round(100.0 - covered_percent, 4)

    return CoverageMath(
        total_weight=reported_total_weight,
        covered_weight=covered_weight,
        covered_percent=covered_percent,
        remaining_percent=remaining_percent,
        total_nodes=total_nodes,
        covered_nodes=covered_nodes,
    )


def collect_subject_nodes(subject: OptionalSubject) -> List[SyllabusNode]:
    """Return every syllabus node belonging to ``subject`` (all tree levels).

    Walks papers → sections → top-level nodes → descendants via the ORM
    relationships, mirroring the traversal used by the content/practice layers
    so the coverage universe is exactly the subject's syllabus tree.
    """
    nodes: List[SyllabusNode] = []

    def _walk(node: SyllabusNode) -> None:
        nodes.append(node)
        for child in node.children:
            _walk(child)

    for paper in subject.papers:
        for section in paper.sections:
            for node in section.syllabus_nodes:
                if node.parent_id is None:
                    _walk(node)
    return nodes


def subject_node_ids(subject: OptionalSubject) -> Set[int]:
    """Set of all syllabus-node ids for the subject (membership checks)."""
    return {n.id for n in collect_subject_nodes(subject)}


def covered_node_ids(
    db: Session, *, subject_id: int, student_id: int
) -> Set[int]:
    """Distinct syllabus-node ids the student has a qualifying activity for.

    Ownership (design Property 10 / R15.4): filtered to the requesting student.
    """
    rows = (
        db.query(ProgressEvent.syllabus_node_id)
        .filter(
            ProgressEvent.subject_id == subject_id,
            ProgressEvent.student_id == student_id,
            ProgressEvent.event_type.in_(QUALIFYING_EVENT_TYPES),
        )
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


def compute_subject_coverage(
    db: Session, *, subject: OptionalSubject, student_id: int
) -> CoverageMath:
    """Compute the student's coverage for the subject from the DB (R12.4)."""
    nodes = collect_subject_nodes(subject)
    node_weights: Dict[int, float] = {n.id: n.weight for n in nodes}
    covered = covered_node_ids(db, subject_id=subject.id, student_id=student_id)
    return compute_coverage_math(node_weights, covered)


def compute_paper_coverage(
    db: Session, *, subject: OptionalSubject, student_id: int
) -> List[tuple]:
    """Per-paper coverage breakdown for the gap panel.

    Returns a list of ``(paper, CoverageMath)`` ordered by the paper's
    ``display_order`` so the UI can show covered% per Paper I / Paper II.
    """
    covered = covered_node_ids(db, subject_id=subject.id, student_id=student_id)

    def _paper_nodes(paper) -> List[SyllabusNode]:
        out: List[SyllabusNode] = []

        def _walk(node: SyllabusNode) -> None:
            out.append(node)
            for child in node.children:
                _walk(child)

        for section in paper.sections:
            for node in section.syllabus_nodes:
                if node.parent_id is None:
                    _walk(node)
        return out

    results: List[tuple] = []
    for paper in sorted(subject.papers, key=lambda p: (p.display_order, p.id)):
        weights = {n.id: n.weight for n in _paper_nodes(paper)}
        results.append((paper, compute_coverage_math(weights, covered)))
    return results


__all__ = [
    "QUALIFYING_EVENT_TYPES",
    "CoverageMath",
    "CoverageIntegrityError",
    "compute_coverage_math",
    "collect_subject_nodes",
    "subject_node_ids",
    "covered_node_ids",
    "compute_subject_coverage",
    "compute_paper_coverage",
]

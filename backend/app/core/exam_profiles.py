"""Exam profile configuration for pure scoring and readiness engines.

Phase 0 extraction from ``EXAM_PORTABILITY_AUDIT.md``: centralises the
exam-specific marking, weighting, depth, and lab-distribution constants
previously embedded in ``readiness.py``, ``mains_outcome.py``, and
``mcq_lab_scoring.py``.

No database schema or runtime behaviour changes for UPSC: all existing engine
entry points default to ``UPSC_CSE_PROFILE``.
"""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping


@dataclass(frozen=True)
class ExamProfile:
    """Immutable scoring and readiness configuration for one examination."""

    exam_id: str
    display_name: str

    # Readiness demand & evidence parameters
    demand_prior: float
    recency_half_life_years: float
    prelims_exam_weight: float
    mains_exam_weight: float
    prior_strength: float
    recall_pseudo_observations: float
    block_questions: int
    block_marks: float
    correct_marks: float
    wrong_marks: float
    band_suppression_assessed_share: float
    z_80: float
    depth_weights: Mapping[str, float]

    # Written / Mains outcome parameters
    marks_per_written_paper: int
    min_distinct_written_questions: int
    band_padding_pct: float

    # MCQ Lab & weakness tracking parameters
    mcq_lab_type_distribution: Mapping[str, int]
    total_mcq_lab_questions: int
    weakness_threshold: float
    weakness_min_attempts: int
    recovery_threshold: float
    recovery_window: int

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "depth_weights",
            MappingProxyType(dict(self.depth_weights)),
        )
        object.__setattr__(
            self,
            "mcq_lab_type_distribution",
            MappingProxyType(dict(self.mcq_lab_type_distribution)),
        )


DEFAULT_EXAM_ID = "upsc_cse"

UPSC_CSE_PROFILE = ExamProfile(
    exam_id=DEFAULT_EXAM_ID,
    display_name="UPSC Civil Services Examination",
    demand_prior=0.25,
    recency_half_life_years=6.0,
    prelims_exam_weight=1.0,
    mains_exam_weight=0.15,
    prior_strength=6.0,
    recall_pseudo_observations=4.0,
    block_questions=20,
    block_marks=40.0,
    correct_marks=2.0,
    wrong_marks=2.0 / 3.0,
    band_suppression_assessed_share=0.25,
    z_80=1.28,
    depth_weights={
        "BASIC": 0.10,
        "NCERT_LEVEL": 0.20,
        "ADVANCED": 0.30,
        "CURRENT_AFFAIRS": 0.15,
        "EXAMINER_TRAPS": 0.25,
    },
    marks_per_written_paper=250,
    min_distinct_written_questions=3,
    band_padding_pct=5.0,
    mcq_lab_type_distribution={
        "STATEMENT_BASED": 4,
        "ASSERTION_REASON": 2,
        "MATCH_THE_FOLLOWING": 2,
        "CAUSE_EFFECT": 2,
        "CHRONOLOGICAL": 2,
        "FACTUAL": 2,
        "MAP_BASED": 1,
    },
    total_mcq_lab_questions=15,
    weakness_threshold=0.5,
    weakness_min_attempts=3,
    recovery_threshold=0.7,
    recovery_window=5,
)

_EXAM_PROFILES: dict[str, ExamProfile] = {
    UPSC_CSE_PROFILE.exam_id: UPSC_CSE_PROFILE,
}


def get_exam_profile(exam_id: str = DEFAULT_EXAM_ID) -> ExamProfile:
    """Return the registered ``ExamProfile`` for ``exam_id``.

    Raises:
        ValueError: If ``exam_id`` is not a registered profile.
    """
    profile = _EXAM_PROFILES.get(exam_id)
    if profile is None:
        raise ValueError(f"Unknown exam profile: {exam_id!r}")
    return profile


def list_exam_profiles() -> tuple[ExamProfile, ...]:
    """Return all registered exam profiles."""
    return tuple(_EXAM_PROFILES.values())


__all__ = [
    "DEFAULT_EXAM_ID",
    "ExamProfile",
    "UPSC_CSE_PROFILE",
    "get_exam_profile",
    "list_exam_profiles",
]

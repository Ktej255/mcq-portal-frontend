"""Exam profiles: what the GS LMS learning engine does for each exam.

The engine itself is exam-neutral. Everything that differs between UPSC, NEET
and JEE lives here as data, in a code registry keyed by ``GsExam.code``:

* the student-facing name of the content levels,
* which content section labels exist,
* which of the 14 funnel steps are shown (disabled steps are skipped by the
  server; stored rows are never renumbered),
* which PYQ exam types and MCQ question types a content file may use,
* the marking scheme per answer format (single / multi / numerical), applied by
  ``app.core.gs_lms.scoring`` in the MCQ lab and checkpoints,
* the progression constants (recall pass mark, mastery mark, checkpoints),
* whether descriptive answer writing is offered.

A subject can override a few of these through ``GsSubject.config``::

    {"exam_overrides": {
        "enabled_funnel_steps": [1, 2, 3, ...],   # list of ints 1..14
        "section_labels": ["BASIC", "ADVANCED"],  # subset of the exam's labels
        "progression": {"checkpoint_every": 4},   # any ProgressionRules field
        "marking_paper": "JEE_ADVANCED"           # a key of the exam's format_marking
    }}

Unknown keys are ignored; invalid values fall back to the exam's own value, so
a typo in a config never blocks a student.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields, replace
from typing import Any, Mapping, Optional

from sqlalchemy.exc import SQLAlchemyError

DEFAULT_EXAM_CODE = "upsc"
ALL_FUNNEL_STEPS: frozenset[int] = frozenset(range(1, 15))

# Every section label the engine knows, in GsLmsSectionLabelEnum order.
ALL_SECTION_LABELS = ("BASIC", "ADVANCED", "NCERT_LEVEL", "CURRENT_AFFAIRS", "EXAMINER_TRAPS")


ANSWER_FORMATS = ("single", "multi", "numerical")


@dataclass(frozen=True)
class MarkingScheme:
    """Marks per question of one answer format.

    ``partial_per_correct_option`` only applies to multi-correct questions: when
    the student chose only correct options but not all of them, each chosen
    option earns this many marks (JEE Advanced 2023 style: +1 per correct option
    chosen). ``None`` = no partial credit (a subset counts as wrong).
    """

    correct: float
    wrong: float
    unattempted: float = 0.0
    partial_per_correct_option: Optional[float] = None

    def to_public(self) -> dict[str, Any]:
        out: dict[str, Any] = {"correct": self.correct, "wrong": self.wrong, "unattempted": self.unattempted}
        if self.partial_per_correct_option is not None:
            out["partial_per_correct_option"] = self.partial_per_correct_option
        return out


@dataclass(frozen=True)
class ProgressionRules:
    """Progression constants. Defaults equal the values in
    ``app.core.gs_lms.progression`` (UPSC today); a test pins that."""

    recall_pass_score: float = 0.5
    recall_max_attempts: int = 3
    topic_mcq_pass: float = 0.6
    checkpoint_every: int = 3
    checkpoint_min_leaves: int = 2
    checkpoint_questions: int = 10
    checkpoint_pass: float = 0.6


@dataclass(frozen=True)
class ExamProfile:
    code: str
    name: str
    # What the student sees for the content levels (BASIC / NCERT_LEVEL / ADVANCED ...).
    content_level_label: str
    section_labels: tuple[str, ...]
    enabled_funnel_steps: frozenset[int]
    pyq_exam_types: tuple[str, ...]
    question_types: tuple[str, ...]
    # Question types that are valid in a file but not yet served by the MCQ lab.
    unsupported_question_types: tuple[str, ...] = ()
    # One scheme per PYQ exam type (and "default" for MCQ lab questions).
    marking: Mapping[str, MarkingScheme] = field(default_factory=dict)
    # Marks per answer format, per paper: {"default": {"single": ...}, "JEE_ADVANCED": {...}}.
    # "default" is what the MCQ lab and checkpoints use unless a subject picks
    # another paper with ``config["exam_overrides"]["marking_paper"]``.
    format_marking: Mapping[str, Mapping[str, MarkingScheme]] = field(default_factory=dict)
    marking_paper: str = "default"
    progression: ProgressionRules = field(default_factory=ProgressionRules)
    answer_writing_enabled: bool = False

    @property
    def disabled_funnel_steps(self) -> frozenset[int]:
        return ALL_FUNNEL_STEPS - self.enabled_funnel_steps

    @property
    def default_marking(self) -> MarkingScheme:
        return self.marking["default"]

    def scheme_for(self, answer_format: str) -> MarkingScheme:
        """The marking scheme for an answer format in the active paper; a
        format the paper does not list falls back to its single-answer scheme."""
        paper = self.format_marking.get(self.marking_paper) or self.format_marking.get("default") or {}
        scheme = paper.get(answer_format) or paper.get("single")
        return scheme if scheme is not None else self.default_marking

    def supports_question_type(self, question_type: str) -> bool:
        return question_type in self.question_types and question_type not in self.unsupported_question_types

    def to_public(self) -> dict[str, Any]:
        """The JSON shape served to the admin studio and the API."""
        return {
            "code": self.code,
            "name": self.name,
            "content_level_label": self.content_level_label,
            "section_labels": list(self.section_labels),
            "enabled_funnel_steps": sorted(self.enabled_funnel_steps),
            "pyq_exam_types": list(self.pyq_exam_types),
            "question_types": list(self.question_types),
            "unsupported_question_types": list(self.unsupported_question_types),
            "marking": {k: {"correct": v.correct, "wrong": v.wrong, "unattempted": v.unattempted}
                        for k, v in self.marking.items()},
            "format_marking": {paper: {fmt: sc.to_public() for fmt, sc in formats.items()}
                               for paper, formats in self.format_marking.items()},
            "answer_writing_enabled": self.answer_writing_enabled,
        }


_UPSC_QUESTION_TYPES = (
    "STATEMENT_BASED", "MATCH_THE_FOLLOWING", "ASSERTION_REASON", "MAP_BASED",
    "CAUSE_EFFECT", "CHRONOLOGICAL", "FACTUAL",
)
# NEET is single-correct only. JEE adds multi-correct and numerical-answer questions.
_NEET_QUESTION_TYPES = ("FACTUAL", "ASSERTION_REASON", "STATEMENT_BASED", "MATCH_THE_FOLLOWING")
_JEE_QUESTION_TYPES = _NEET_QUESTION_TYPES + ("NUMERICAL", "MULTI_CORRECT")
_SCIENCE_SECTIONS = ("BASIC", "ADVANCED", "NCERT_LEVEL", "EXAMINER_TRAPS")
# No current affairs (8, 9) and no mains practice (13).
_SCIENCE_STEPS = ALL_FUNNEL_STEPS - {8, 9, 13}

_NEET_JEE_MARKING = MarkingScheme(correct=4, wrong=-1, unattempted=0)

# --- Marks per answer format -------------------------------------------------
# UPSC: +2 / -0.66 (the existing values).
_UPSC_FORMAT_MARKING = {"default": {"single": MarkingScheme(2, -0.66, 0)}}
# NEET: single-correct only, +4 / -1 / 0.
_NEET_FORMAT_MARKING = {"default": {"single": MarkingScheme(4, -1, 0)}}
# JEE Main: single +4 / -1; numerical +4 / -1.
# TODO verify against the current NTA information bulletin before launch; NTA
# has changed numerical negative marking before (it has been 0 in some years).
_JEE_MAIN_FORMATS = {
    "single": MarkingScheme(4, -1, 0),
    "numerical": MarkingScheme(4, -1, 0),
}
# JEE Advanced: varies by year: configure per paper. The values below follow the
# 2023-style paper and must be checked against the paper being modelled.
#   * multi-correct: +4 all correct options (and nothing else); partial credit
#     of +1 per correct option when ONLY correct options were chosen (so +3 for
#     3 of 4, +2 for 2, +1 for 1); -2 if any wrong option is chosen; 0 unanswered.
#   * single: +3 / -1 (varies by year: configure per paper)
#   * numerical: +3 / 0 (varies by year: configure per paper)
_JEE_ADVANCED_FORMATS = {
    "single": MarkingScheme(3, -1, 0),
    "multi": MarkingScheme(4, -2, 0, partial_per_correct_option=1),
    "numerical": MarkingScheme(3, 0, 0),
}
_JEE_FORMAT_MARKING = {
    "default": {
        **_JEE_MAIN_FORMATS,
        # JEE Main has no multi-correct; a multi-correct question in a Main-style
        # subject uses the Advanced scheme so it is never silently unmarked.
        "multi": _JEE_ADVANCED_FORMATS["multi"],
    },
    "JEE_MAIN": _JEE_MAIN_FORMATS,
    "JEE_ADVANCED": _JEE_ADVANCED_FORMATS,
}

PROFILES: dict[str, ExamProfile] = {
    "upsc": ExamProfile(
        code="upsc",
        name="UPSC",
        content_level_label="Basic / NCERT / Advanced",
        section_labels=ALL_SECTION_LABELS,
        enabled_funnel_steps=ALL_FUNNEL_STEPS,
        pyq_exam_types=("PRELIMS", "MAINS"),
        question_types=_UPSC_QUESTION_TYPES,
        marking={
            "default": MarkingScheme(2, -0.66, 0),
            "PRELIMS": MarkingScheme(2, -0.66, 0),
        },
        format_marking=_UPSC_FORMAT_MARKING,
        answer_writing_enabled=True,
    ),
    "neet": ExamProfile(
        code="neet",
        name="NEET",
        content_level_label="Basics / NCERT / Beyond NCERT",
        section_labels=_SCIENCE_SECTIONS,
        enabled_funnel_steps=_SCIENCE_STEPS,
        pyq_exam_types=("NEET",),
        question_types=_NEET_QUESTION_TYPES,
        marking={"default": _NEET_JEE_MARKING, "NEET": _NEET_JEE_MARKING},
        format_marking=_NEET_FORMAT_MARKING,
    ),
    "jee": ExamProfile(
        code="jee",
        name="JEE",
        content_level_label="Basics / NCERT / Advanced problems",
        section_labels=_SCIENCE_SECTIONS,
        enabled_funnel_steps=_SCIENCE_STEPS,
        pyq_exam_types=("JEE_MAIN", "JEE_ADVANCED"),
        question_types=_JEE_QUESTION_TYPES,
        marking={"default": _NEET_JEE_MARKING, "JEE_MAIN": _NEET_JEE_MARKING},
        format_marking=_JEE_FORMAT_MARKING,
    ),
}


class UnknownExamError(ValueError):
    """An exam code with no registered profile."""


def normalize_exam_code(code: Optional[str]) -> str:
    return (code or DEFAULT_EXAM_CODE).strip().lower()


def get_profile(code: Optional[str]) -> ExamProfile:
    """The profile for an exam code (``None``/blank = UPSC); raises UnknownExamError."""
    key = normalize_exam_code(code)
    try:
        return PROFILES[key]
    except KeyError:
        raise UnknownExamError(f"Unknown exam {code!r}; known exams: {sorted(PROFILES)}") from None


def is_known_exam(code: Optional[str]) -> bool:
    return normalize_exam_code(code) in PROFILES


def _override_steps(value: Any) -> Optional[frozenset[int]]:
    if isinstance(value, list) and value and all(isinstance(i, int) and not isinstance(i, bool) and 1 <= i <= 14 for i in value):
        return frozenset(value)
    return None


def _override_progression(base: ProgressionRules, value: Any) -> ProgressionRules:
    if not isinstance(value, dict):
        return base
    changes = {}
    for f in fields(ProgressionRules):
        if f.name in value:
            new = value[f.name]
            old = getattr(base, f.name)
            if isinstance(new, bool) or not isinstance(new, (int, float)) or new <= 0:
                continue
            changes[f.name] = int(new) if isinstance(old, int) else float(new)
    return replace(base, **changes) if changes else base


def apply_overrides(profile: ExamProfile, config: Optional[Mapping[str, Any]]) -> ExamProfile:
    """The profile with a subject's ``config["exam_overrides"]`` applied."""
    overrides = (config or {}).get("exam_overrides") if isinstance(config, Mapping) else None
    if not isinstance(overrides, dict):
        return profile
    changes: dict[str, Any] = {}
    steps = _override_steps(overrides.get("enabled_funnel_steps"))
    # The final step must stay enabled: completing it is what completes a topic.
    if steps is not None and 14 in steps:
        changes["enabled_funnel_steps"] = steps
    labels = overrides.get("section_labels")
    if isinstance(labels, list) and labels and all(l in profile.section_labels for l in labels):
        changes["section_labels"] = tuple(labels)
    paper = overrides.get("marking_paper")
    if isinstance(paper, str) and paper in profile.format_marking:
        changes["marking_paper"] = paper
    progression = _override_progression(profile.progression, overrides.get("progression"))
    if progression is not profile.progression:
        changes["progression"] = progression
    return replace(profile, **changes) if changes else profile


def exam_code_of(subject: Any) -> Optional[str]:
    """The code of a ``GsSubject``'s exam, or None when it cannot be read.

    A catalogue lookup failure (e.g. a partial schema without ``gs_exams``)
    must never break a student's session, so it reads as "no exam" (= UPSC).
    """
    try:
        exam = getattr(subject, "exam", None)
        return exam.code if exam is not None else None
    except SQLAlchemyError:
        return None


def profile_for_subject(subject: Any) -> ExamProfile:
    """The effective profile of a ``GsSubject`` (exam profile + config overrides).

    A subject whose exam has no registered profile falls back to UPSC rather
    than failing, so unknown catalogue rows never break a student's session.
    """
    code = exam_code_of(subject)
    try:
        base = get_profile(code)
    except UnknownExamError:
        base = PROFILES[DEFAULT_EXAM_CODE]
    return apply_overrides(base, getattr(subject, "config", None))


__all__ = [
    "ALL_FUNNEL_STEPS", "ALL_SECTION_LABELS", "ANSWER_FORMATS", "DEFAULT_EXAM_CODE", "ExamProfile",
    "MarkingScheme", "PROFILES", "ProgressionRules", "UnknownExamError",
    "apply_overrides", "exam_code_of", "get_profile", "is_known_exam", "normalize_exam_code",
    "profile_for_subject",
]

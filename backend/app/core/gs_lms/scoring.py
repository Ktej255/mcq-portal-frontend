"""Answer formats, correctness and marks for topic MCQs (GsLmsMcqQuestion).

Pure functions, no I/O. The MCQ lab and checkpoint endpoints route every
grading decision through here so the three answer formats behave the same
everywhere:

* ``single``    — one option (A-D). UPSC, NEET and every legacy question.
* ``multi``     — one or more options (A-D); correct only when the chosen set
                  equals the correct set (``correct_options``).
* ``numerical`` — a number; correct when it is within a tolerance of
                  ``numeric_answer``.

Correctness (``is_correct``) is all-or-nothing and drives accuracy, mastery and
the pass marks. ``marks_for`` is the separate, exam-specific marks a student
would earn in the real paper (negative marking, partial credit). Pass/fail
thresholds stay accuracy based (see docs/EXAMS.md).
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any, Iterable, Optional, Sequence

from app.core.gs_lms.exam_profiles import ANSWER_FORMATS, MarkingScheme

SINGLE, MULTI, NUMERICAL = ANSWER_FORMATS
OPTION_LABELS = ("A", "B", "C", "D")

# Numerical answers match after rounding to 2 decimals, i.e. within half a cent.
MIN_NUMERIC_TOLERANCE = 0.005
_EPS = 1e-9


@dataclass(frozen=True)
class Response:
    """What a student submitted for one question. Unanswered = all fields empty."""

    option: Optional[str] = None
    options: Optional[Sequence[str]] = None
    numeric: Any = None


def _qtype(question: Any) -> str:
    value = getattr(question, "question_type", None)
    return str(getattr(value, "value", value) or "")


def answer_format_of(question: Any) -> str:
    """``single`` | ``multi`` | ``numerical`` (anything legacy or unknown = single)."""
    qtype = _qtype(question)
    if qtype == "NUMERICAL":
        return NUMERICAL
    if qtype == "MULTI_CORRECT":
        return MULTI
    return SINGLE


# --- parsing ------------------------------------------------------------------


def _label(value: Any) -> str:
    return str(value).strip().upper() if isinstance(value, (str, int)) and not isinstance(value, bool) else ""


def parse_labels(value: Any) -> list[str]:
    """Option labels from a list or a joined string such as ``"A,C"``, ``"A;C"`` or ``"AC"``.

    Sorted and de-duplicated. Anything that is not a label stays in the list
    (upper-cased) so it can be recognised as a wrong option rather than ignored.
    """
    if value is None:
        return []
    if isinstance(value, str):
        parts = [p for p in re.split(r"[\s,;|/]+", value.strip()) if p]
        if len(parts) == 1 and len(parts[0]) > 1 and set(parts[0].upper()) <= set(OPTION_LABELS):
            parts = list(parts[0])
    elif isinstance(value, (list, tuple, set, frozenset)):
        parts = [p for p in value]
    else:
        return []
    return sorted({lab for lab in (_label(p) for p in parts) if lab})


def parse_number(value: Any) -> Optional[float]:
    """A finite float, or None for anything else (strings that are not numbers, NaN, inf, bools)."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value.strip().replace(",", "")) if isinstance(value, str) else float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return number if math.isfinite(number) else None


def format_number(value: float) -> str:
    """Compact text of a number: 12.5 -> "12.5", 3.0 -> "3", -2.0 -> "-2"."""
    return f"{value:.10g}"


def correct_labels(question: Any) -> list[str]:
    """The correct option labels of a multi-correct question (``correct_options``,
    else the joined ``correct_option`` such as "A,C")."""
    labels = parse_labels(getattr(question, "correct_options", None))
    return labels or parse_labels(getattr(question, "correct_option", None))


def correct_number(question: Any) -> Optional[float]:
    number = parse_number(getattr(question, "numeric_answer", None))
    return number if number is not None else parse_number(getattr(question, "correct_option", None))


def tolerance_of(question: Any) -> float:
    tol = parse_number(getattr(question, "numeric_tolerance", None))
    return max(tol if tol is not None else 0.0, MIN_NUMERIC_TOLERANCE)


# --- answered / correct -------------------------------------------------------


def is_answered(question: Any, response: Optional[Response]) -> bool:
    """Whether the student gave an answer of the question's format. Garbage
    (a non-numeric text for a numerical question) still counts as an answer."""
    if response is None:
        return False
    fmt = answer_format_of(question)
    if fmt == MULTI:
        return bool(parse_labels(response.options)) or bool(_label(response.option))
    if fmt == NUMERICAL:
        return response.numeric is not None and str(response.numeric).strip() != ""
    return bool(_label(response.option))


def _chosen_multi(response: Response) -> list[str]:
    chosen = parse_labels(response.options)
    if not chosen and _label(response.option):
        chosen = parse_labels(response.option)
    return chosen


def is_correct(question: Any, response: Optional[Response]) -> bool:
    if not is_answered(question, response):
        return False
    assert response is not None
    fmt = answer_format_of(question)
    if fmt == MULTI:
        return _chosen_multi(response) == correct_labels(question)
    if fmt == NUMERICAL:
        given, answer = parse_number(response.numeric), correct_number(question)
        if given is None or answer is None:
            return False
        return abs(given - answer) <= tolerance_of(question) + _EPS
    return _label(response.option) == _label(getattr(question, "correct_option", None))


# --- marks --------------------------------------------------------------------


def marks_for(question: Any, response: Optional[Response], scheme: MarkingScheme) -> float:
    """Marks the answer earns under ``scheme`` (the scheme of the question's format).

    Unanswered earns ``scheme.unattempted``. Multi-correct (JEE Advanced style):
    all correct options and nothing else earns ``correct``; only correct options
    but not all earns ``partial_per_correct_option`` per option chosen (if the
    scheme has partial credit); any wrong option earns ``wrong``.
    """
    if not is_answered(question, response):
        return round(scheme.unattempted, 2)
    assert response is not None
    if is_correct(question, response):
        return round(scheme.correct, 2)
    if answer_format_of(question) == MULTI and scheme.partial_per_correct_option is not None:
        chosen, correct = set(_chosen_multi(response)), set(correct_labels(question))
        if chosen and chosen < correct:  # proper subset of the correct options, no wrong option
            return round(len(chosen) * scheme.partial_per_correct_option, 2)
    return round(scheme.wrong, 2)


def max_marks(scheme: MarkingScheme) -> float:
    return round(scheme.correct, 2)


# --- storing and reading back an answer ----------------------------------------


def response_text(question: Any, response: Optional[Response]) -> str:
    """The answer as stored in a text column: "B", "A,C" (sorted) or "12.5"; "" = unanswered.

    A garbage numeric answer is stored as given (trimmed) so the result screen can show it."""
    if not is_answered(question, response):
        return ""
    assert response is not None
    fmt = answer_format_of(question)
    if fmt == MULTI:
        return ",".join(_chosen_multi(response))
    if fmt == NUMERICAL:
        number = parse_number(response.numeric)
        return format_number(number) if number is not None else str(response.numeric).strip()[:30]
    return str(response.option).strip()


def response_from_text(question: Any, text: Optional[str]) -> Optional[Response]:
    """Inverse of ``response_text``."""
    if text is None or not str(text).strip():
        return None
    fmt = answer_format_of(question)
    if fmt == MULTI:
        return Response(options=parse_labels(text))
    if fmt == NUMERICAL:
        return Response(numeric=text)
    return Response(option=text)


def correct_answer_text(question: Any) -> str:
    """The stored correct answer as text ("B", "A,C", "12.5"). Never sent before submission."""
    fmt = answer_format_of(question)
    if fmt == MULTI:
        return ",".join(correct_labels(question))
    if fmt == NUMERICAL:
        number = correct_number(question)
        return format_number(number) if number is not None else str(getattr(question, "correct_option", "") or "")
    return str(getattr(question, "correct_option", "") or "")


def stored_correct_option(answer_format: str, *, correct_option: Any = None, correct_options: Any = None, numeric_answer: Any = None) -> str:
    """The value for the NOT NULL ``correct_option`` column of a question."""
    if answer_format == MULTI:
        return ",".join(parse_labels(correct_options))
    if answer_format == NUMERICAL:
        number = parse_number(numeric_answer)
        return format_number(number) if number is not None else ""
    return str(correct_option or "").strip().upper()


# --- result blocks -------------------------------------------------------------


def include_marks(exam_code: Optional[str], formats: Iterable[str]) -> bool:
    """Whether a result should carry marks keys. A UPSC result made only of
    single-answer questions is left exactly as it was before marks existed."""
    return (exam_code or "upsc").lower() != "upsc" or any(f != SINGLE for f in formats)


def marking_scheme_used(profile: Any, formats: Iterable[str]) -> dict[str, dict[str, Any]]:
    """{format: scheme} for the formats present in a result, in a JSON-ready shape."""
    return {fmt: profile.scheme_for(fmt).to_public() for fmt in sorted(set(formats), key=ANSWER_FORMATS.index)}


@dataclass(frozen=True)
class Graded:
    """One question graded under an exam profile."""

    answer_format: str
    correct: bool
    marks: float
    max_marks: float
    chosen_text: str
    correct_text: str


def grade(question: Any, response: Optional[Response], profile: Any) -> Graded:
    """Correctness and marks of one answer under ``profile`` (an ExamProfile)."""
    fmt = answer_format_of(question)
    scheme = profile.scheme_for(fmt)
    return Graded(
        answer_format=fmt,
        correct=is_correct(question, response),
        marks=marks_for(question, response, scheme),
        max_marks=max_marks(scheme),
        chosen_text=response_text(question, response),
        correct_text=correct_answer_text(question),
    )


def marks_summary(profile: Any, graded: Sequence[Graded]) -> dict[str, Any]:
    """The overall marks keys of a result: total, maximum and the scheme used."""
    return {
        "marks_total": round(sum(g.marks for g in graded), 2),
        "marks_max": round(sum(g.max_marks for g in graded), 2),
        "marking_scheme": marking_scheme_used(profile, [g.answer_format for g in graded]),
    }


__all__ = [
    "Graded", "grade", "marks_summary",
    "ANSWER_FORMATS", "MIN_NUMERIC_TOLERANCE", "MULTI", "NUMERICAL", "OPTION_LABELS", "Response", "SINGLE",
    "answer_format_of", "correct_answer_text", "correct_labels", "correct_number", "format_number",
    "include_marks", "is_answered", "is_correct", "marking_scheme_used", "marks_for", "max_marks",
    "parse_labels", "parse_number", "response_from_text", "response_text", "stored_correct_option", "tolerance_of",
]

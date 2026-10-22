"""Understanding grader for the GS LMS: how much of a concept did the student
actually explain?

``grade_explanation(text, key_points)`` is pure and deterministic (no AI call,
no database), so it is free to run on every discussion turn and easy to
replace later with a smarter grader that returns the same ``ExplanationGrade``.

A key point counts as covered when the student's text contains enough of its
meaningful words. Both sides are lowercased, stripped of punctuation, cleaned
of common stopwords and lightly stemmed (``declared``/``declares`` both become
``declar``). Coverage = |key point words found in the text| / |key point words|,
and it must reach ``COVERAGE_THRESHOLD`` (0.6). Numbers and years are facts, not
wording: every number in a key point must appear in the text exactly (1757 is
not 1857), however many other words match.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Share of a key point's meaningful words the student must use to cover it.
COVERAGE_THRESHOLD = 0.6

_STOPWORDS = frozenset(
    """
    a an the and or but nor of in on at to for from by with without into onto
    as is are was were be been being am it its this that these those there
    their they them he she his her we our you your i me my
    do does did has have had having not no so than then also very can could
    will would shall should may might must which who whom whose what when where
    while about over under between among through during per via such any each
    """.split()
)

_WORD = re.compile(r"[a-z0-9]+")
# Suffixes removed (longest first), always leaving a stem of at least 3 letters.
_SUFFIXES = ("ing", "ed", "ly", "es", "s")


@dataclass(frozen=True)
class KeyPointResult:
    key_point: str
    coverage: float  # 0..1, share of the key point's words found in the text
    covered: bool


@dataclass(frozen=True)
class ExplanationGrade:
    results: list[KeyPointResult] = field(default_factory=list)
    covered: list[str] = field(default_factory=list)
    missed: list[str] = field(default_factory=list)
    # Fraction of key points covered (0..1); 0.0 when there are no key points.
    score: float = 0.0


def _stem(word: str) -> str:
    if word.isdigit():
        return word
    for suffix in _SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            if suffix == "s" and word.endswith("ss"):
                break
            word = word[: -len(suffix)]
            break
    # Fold a trailing "e" so state/states and make/making share a stem.
    if word.endswith("e") and len(word) > 3:
        word = word[:-1]
    return word


def tokenize(text: str | None, *, keep_stopwords: bool = False) -> set[str]:
    """The meaningful, stemmed words of ``text`` (numbers kept as written)."""
    words = _WORD.findall((text or "").lower())
    if not keep_stopwords:
        words = [w for w in words if w not in _STOPWORDS]
    return {_stem(w) for w in words}


def _grade_key_point(key_point: str, text: str, text_tokens: set[str]) -> KeyPointResult:
    kp_tokens = tokenize(key_point)
    if not kp_tokens:
        # A phrase made only of stopwords still has to be gradeable: compare
        # all of its words with all of the text's words.
        kp_tokens = tokenize(key_point, keep_stopwords=True)
        text_tokens = tokenize(text, keep_stopwords=True)
    if not kp_tokens:
        return KeyPointResult(key_point, 0.0, False)
    coverage = len(kp_tokens & text_tokens) / len(kp_tokens)
    numbers = {t for t in kp_tokens if t.isdigit()}
    covered = coverage >= COVERAGE_THRESHOLD and numbers <= text_tokens
    return KeyPointResult(key_point, coverage, covered)


def grade_explanation(text: str | None, key_points: list[str] | None) -> ExplanationGrade:
    """Grade a student's explanation against a concept's key points."""
    points = [kp for kp in (key_points or []) if isinstance(kp, str) and kp.strip()]
    if not points:
        return ExplanationGrade()
    text_tokens = tokenize(text)
    results = [_grade_key_point(kp, text or "", text_tokens) for kp in points]
    covered = [r.key_point for r in results if r.covered]
    missed = [r.key_point for r in results if not r.covered]
    return ExplanationGrade(
        results=results, covered=covered, missed=missed, score=len(covered) / len(results)
    )


__all__ = ["COVERAGE_THRESHOLD", "KeyPointResult", "ExplanationGrade", "tokenize", "grade_explanation"]

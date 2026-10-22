"""Compare a student's recent handwriting with their own usual handwriting.

Pure functions over plain rows, so they can be unit-tested with synthetic
numbers. See ``docs/WELLBEING.md`` for the rules and limits.

* Baseline: the earliest usable samples, until there are at least
  ``BASELINE_MIN_SAMPLES`` of them spanning at least ``BASELINE_MIN_DAYS`` days.
* Recent window: the last ``RECENT_MAX`` samples after the baseline
  (at least ``RECENT_MIN``).
* A feature "changed" when the robust z-score of the recent median against the
  baseline is at least ``Z_CHANGED`` AND at least ``CONSISTENT_SAMPLES`` of the
  recent samples individually moved the same way (``Z_SAMPLE``).
* Overall status is "changed" only when ``MIN_CHANGED_FEATURES`` features
  changed. One odd page, or one odd feature, never triggers it.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Sequence

import numpy as np

from app.core.wellbeing.handwriting_features import ALGORITHM_VERSION

BASELINE_MIN_SAMPLES = 5
BASELINE_MIN_DAYS = 7
RECENT_MIN = 3
RECENT_MAX = 5
Z_CHANGED = 2.5
Z_SAMPLE = 2.0
CONSISTENT_SAMPLES = 3
MIN_CHANGED_FEATURES = 2
MAD_SCALE = 1.4826
REL_SPREAD_FLOOR = 0.05  # spread is at least 5% of the baseline median

# Smallest spread (in the feature's own unit) treated as real variation, so a
# very steady baseline does not make tiny differences look huge.
MIN_SPREAD = {
    "slant_deg": 2.0,
    "letter_height_rel": 0.004,
    "line_spacing_rel": 0.15,
    "baseline_slope_deg": 0.5,
    "baseline_wobble": 0.03,
    "stroke_width_rel": 0.03,
    "word_gap_rel": 0.1,
}
TREND_FEATURES = tuple(MIN_SPREAD)

# (phrase when the value went up, phrase when it went down)
DIRECTION_WORDS = {
    "slant_deg": ("leaning more to the right", "leaning more to the left"),
    "letter_height_rel": ("bigger letters", "smaller letters"),
    "line_spacing_rel": ("wider line spacing", "tighter line spacing"),
    "baseline_slope_deg": ("lines drifting up or down more", "lines running flatter"),
    "baseline_wobble": ("less straight lines", "straighter lines"),
    "stroke_width_rel": ("thicker strokes", "thinner strokes"),
    "word_gap_rel": ("wider gaps between words", "tighter gaps between words"),
}

MSG_STEADY = "Your handwriting looks like your usual handwriting."
MSG_CHANGED = (
    "Your last few answers look different from your usual handwriting ({features}). "
    "This sometimes happens when people are tired, rushed or under pressure. "
    "If that sounds like you, a short break or a lighter day can help."
)
DISCLAIMER = (
    "This is not a medical or psychological test. It only compares your recent "
    "handwriting with your own earlier handwriting, and photos, pens and paper can "
    "change the result. If you are feeling low or stressed for a while, talk to "
    "someone you trust or a professional."
)
LIMITATIONS = (
    "Measured with simple image rules (no AI): letter size, slant, line spacing, "
    "line straightness and stroke thickness. Your 'usual' is your first few weeks "
    "of pages. A different pen, paper, lighting, camera angle or answer length can "
    "move the numbers."
)


@dataclass
class TrendSample:
    captured_at: datetime
    features: Dict[str, Optional[float]]
    usable: bool = True
    algorithm_version: str = ALGORITHM_VERSION


def _value(sample: TrendSample, name: str) -> Optional[float]:
    v = sample.features.get(name)
    return float(v) if isinstance(v, (int, float)) and np.isfinite(v) else None


def split_baseline(samples: Sequence[TrendSample]) -> int:
    """Number of earliest samples that form the baseline, or 0 if not yet complete."""
    for k in range(BASELINE_MIN_SAMPLES, len(samples) + 1):
        if samples[k - 1].captured_at - samples[0].captured_at >= timedelta(days=BASELINE_MIN_DAYS):
            return k
    return 0


def _spread(name: str, values: List[float], med: float) -> float:
    mad = float(np.median(np.abs(np.asarray(values) - med)))
    return max(MAD_SCALE * mad, MIN_SPREAD[name], REL_SPREAD_FLOOR * abs(med))


def _compare_feature(
    name: str, baseline: Sequence[TrendSample], recent: Sequence[TrendSample]
) -> Optional[Dict[str, Any]]:
    base = [v for v in (_value(s, name) for s in baseline) if v is not None]
    rec = [v for v in (_value(s, name) for s in recent) if v is not None]
    if len(base) < BASELINE_MIN_SAMPLES or len(rec) < RECENT_MIN:
        return None
    med = float(np.median(base))
    spread = _spread(name, base, med)
    z = (float(np.median(rec)) - med) / spread
    sign = 1.0 if z > 0 else -1.0
    holding = sum(1 for v in rec if sign * (v - med) / spread >= Z_SAMPLE)
    changed = abs(z) >= Z_CHANGED and holding >= CONSISTENT_SAMPLES
    return {
        "feature": name,
        "z": round(z, 2),
        "changed": changed,
        "samples_holding": holding,
        "direction": ("up" if z > 0 else "down"),
        "phrase": DIRECTION_WORDS[name][0 if z > 0 else 1],
    }


def compute_trend(
    samples: Sequence[TrendSample], algorithm_version: str = ALGORITHM_VERSION
) -> Dict[str, Any]:
    """Status, plain-words changes and per-feature series for one student."""
    same = sorted(
        (s for s in samples if s.algorithm_version == algorithm_version), key=lambda s: s.captured_at
    )
    usable = [s for s in same if s.usable]
    result: Dict[str, Any] = {
        "status": "not_enough_data",
        "message": "",
        "needs_more_samples": 0,
        "days_needed": 0,
        "changed_features": [],
        "recent_count": 0,
        "samples_total": len(same),
        "samples_usable": len(usable),
        "series": {
            f: [
                {"captured_at": s.captured_at, "value": v}
                for s in usable
                if (v := _value(s, f)) is not None
            ]
            for f in TREND_FEATURES
        },
        "disclaimer": DISCLAIMER,
        "limitations": LIMITATIONS,
    }

    k = split_baseline(usable)
    if k == 0:
        need = max(BASELINE_MIN_SAMPLES - len(usable), 0)
        days = 0
        if usable:
            span = (usable[-1].captured_at - usable[0].captured_at).total_seconds() / 86400
            days = max(int(np.ceil(BASELINE_MIN_DAYS - span)), 0)
        else:
            days = BASELINE_MIN_DAYS
        result.update(needs_more_samples=need, days_needed=days)
        result["message"] = (
            "We are still learning what your usual handwriting looks like. "
            + (f"Upload about {need} more page{'s' if need != 1 else ''}" if need else "Keep writing")
            + (f", spread over at least {days} more day{'s' if days != 1 else ''}." if days else ".")
        )
        return result

    rest = usable[k:]
    if len(rest) < RECENT_MIN:
        need = RECENT_MIN - len(rest)
        result.update(needs_more_samples=need)
        result["message"] = (
            f"Your usual handwriting is set. Upload {need} more page{'s' if need != 1 else ''} "
            "and we can compare."
        )
        return result

    recent = rest[-RECENT_MAX:]
    result["recent_count"] = len(recent)
    baseline = usable[:k]
    comparisons = [c for c in (_compare_feature(f, baseline, recent) for f in TREND_FEATURES) if c]
    changed = [c for c in comparisons if c["changed"]]
    if len(changed) >= MIN_CHANGED_FEATURES:
        changed.sort(key=lambda c: -abs(c["z"]))
        result["status"] = "changed"
        result["changed_features"] = changed
        result["message"] = MSG_CHANGED.format(features=", ".join(c["phrase"] for c in changed))
    else:
        result["status"] = "steady"
        result["message"] = MSG_STEADY
    return result

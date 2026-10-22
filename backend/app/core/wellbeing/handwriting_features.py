"""Simple, deterministic handwriting measurements from one page photo.

numpy + Pillow only; no AI calls. Used for the opt-in "handwriting trend"
(see ``handwriting_trend`` and ``docs/WELLBEING.md``). These numbers describe
how a page looks (size, slant, spacing, line straightness, stroke thickness).
They say nothing about the writer's character or health.

Pipeline: load -> EXIF-transpose -> grayscale -> downscale (<=1600 px) ->
even out lighting -> Otsu threshold (ink = dark) -> drop specks -> find text
lines from the row-ink profile -> measure.

Scale handling: every feature except ``letter_height_rel`` is a ratio of two
lengths measured on the same page (usually the median line height), so the
distance of the phone does not matter. ``letter_height_rel`` is the median line
height divided by the page *width* in the photo: comparable between photos of
the same paper size framed similarly, and the one feature a very different
framing (or paper size) can move. Margins are cropped by 2% first.
"""
from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ALGORITHM_VERSION = "hw-v1"

MAX_SIDE = 1600
MAX_PIXELS = 100_000_000  # refuse absurd decode sizes before allocating
MIN_SIDE_PX = 400  # shorter side of the original photo
MIN_LINES = 3
MIN_INK_FRACTION = 0.003
MAX_INK_FRACTION = 0.35
MIN_CONTRAST = 0.25  # (paper - ink) / 255 after lighting correction
MIN_LAPLACIAN_VAR = 30.0  # below this the page is too blurry
QUALITY_THRESHOLD = 0.6  # samples below this are stored but not used for trends

# Penalty multipliers per reason; each is below QUALITY_THRESHOLD so any single
# problem makes the sample unusable.
_PENALTY = {
    "image_too_small": 0.4,
    "too_few_lines": 0.4,
    "no_lines": 0.1,
    "too_little_ink": 0.2,
    "too_much_ink": 0.3,
    "low_contrast": 0.5,
    "too_blurry": 0.5,
    "analysis_failed": 0.0,
}

FEATURE_NAMES = (
    "slant_deg",
    "letter_height_rel",
    "line_spacing_rel",
    "baseline_slope_deg",
    "baseline_wobble",
    "stroke_width_rel",
    "word_gap_rel",
    "ink_density",
    "lines_detected",
)


class HandwritingImageError(ValueError):
    """The bytes are not an image we can read."""


@dataclass
class HandwritingFeatures:
    features: Dict[str, Optional[float]]
    quality: float
    reasons: List[str] = field(default_factory=list)
    algorithm_version: str = ALGORITHM_VERSION

    @property
    def usable(self) -> bool:
        return self.quality >= QUALITY_THRESHOLD


# ---------------------------------------------------------------------------
# Loading and binarisation
# ---------------------------------------------------------------------------
def _load_gray(data: bytes) -> tuple[Image.Image, tuple[int, int]]:
    try:
        img = Image.open(io.BytesIO(data))
        original_size = img.size
        if original_size[0] * original_size[1] > MAX_PIXELS:
            raise HandwritingImageError("image too large")
        if img.format == "JPEG":
            img.draft("L", (MAX_SIDE, MAX_SIDE))  # cheap DCT-level downscale
        img.load()
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(bg, img)
        gray = img.convert("L")
    except HandwritingImageError:
        raise
    except Exception as exc:  # noqa: BLE001 - any decode failure is "not an image"
        raise HandwritingImageError(type(exc).__name__) from None
    if max(gray.size) > MAX_SIDE:
        scale = MAX_SIDE / max(gray.size)
        gray = gray.resize(
            (max(1, round(gray.width * scale)), max(1, round(gray.height * scale))),
            Image.BILINEAR,
        )
    return gray, original_size


def _even_lighting(gray: Image.Image) -> np.ndarray:
    """Divide by a blurred 'paper' estimate so shadows do not become ink."""
    w, h = gray.size
    small = gray.resize((max(1, w // 4), max(1, h // 4)), Image.BILINEAR)
    bg = small.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(6))
    bg = bg.resize((w, h), Image.BILINEAR)
    g = np.asarray(gray, dtype=np.float32)
    b = np.maximum(np.asarray(bg, dtype=np.float32), 1.0)
    return np.clip(g * 255.0 / b, 0, 255).astype(np.uint8)


def _otsu(img: np.ndarray) -> int:
    hist = np.bincount(img.ravel(), minlength=256).astype(np.float64)
    total = hist.sum()
    if total == 0:
        return 128
    levels = np.arange(256)
    w0 = np.cumsum(hist)
    w1 = total - w0
    m = np.cumsum(hist * levels)
    with np.errstate(divide="ignore", invalid="ignore"):
        mu0 = m / w0
        mu1 = (m[-1] - m) / w1
        between = w0 * w1 * (mu0 - mu1) ** 2
    between = np.nan_to_num(between)
    return int(np.argmax(between))


def _box_sum(a: np.ndarray, k: int) -> np.ndarray:
    pad = k // 2
    p = np.pad(a.astype(np.int32), pad)
    c = np.cumsum(np.cumsum(p, axis=0), axis=1)
    c = np.pad(c, ((1, 0), (1, 0)))
    h, w = a.shape
    return c[k : k + h, k : k + w] - c[0:h, k : k + w] - c[k : k + h, 0:w] + c[0:h, 0:w]


def _binarise(norm: np.ndarray) -> tuple[np.ndarray, float]:
    """Return (ink mask, contrast 0..1). Flat images have no ink."""
    if norm.size == 0 or float(norm.std()) < 12.0:
        return np.zeros(norm.shape, dtype=bool), 0.0
    thr = _otsu(norm)
    ink = norm <= thr
    if ink.all() or not ink.any():
        return np.zeros(norm.shape, dtype=bool), 0.0
    contrast = (float(norm[~ink].mean()) - float(norm[ink].mean())) / 255.0
    if norm.shape[0] >= 5 and norm.shape[1] >= 5:
        ink &= _box_sum(ink, 5) >= 4  # drop specks
    return ink, contrast


# ---------------------------------------------------------------------------
# Lines and measurements
# ---------------------------------------------------------------------------
def _runs(mask: np.ndarray) -> List[tuple[int, int]]:
    """[start, end) of each True run in a 1-D bool array."""
    p = np.concatenate(([0], mask.astype(np.int8), [0]))
    d = np.diff(p)
    return list(zip(np.flatnonzero(d == 1).tolist(), np.flatnonzero(d == -1).tolist()))


def _find_lines(ink: np.ndarray) -> List[tuple[int, int]]:
    h = ink.shape[0]
    prof = ink.sum(axis=1).astype(np.float64)
    k = max(3, int(h * 0.006)) | 1
    smooth = np.convolve(prof, np.ones(k) / k, mode="same")
    pos = smooth[smooth > 0]
    if pos.size == 0:
        return []
    thr = 0.3 * float(np.percentile(pos, 90))
    min_h = max(5, int(h * 0.006))
    return [(a, b) for a, b in _runs(smooth > thr) if b - a >= min_h]


def _best_slant(ink: np.ndarray, bands: List[tuple[int, int]]) -> Optional[float]:
    """Shear angle (deg, + = leaning right) that makes strokes most vertical.

    Each line is sheared about its own centre and scored on its own column
    profile (sum of squares), so stems on different lines cannot line up by
    accident.
    """
    groups = []
    total = 0
    for a, b in bands:
        ys, xs = np.nonzero(ink[a:b])
        if ys.size:
            groups.append(((ys - ys.mean()).astype(np.float64), xs.astype(np.float64)))
            total += ys.size
    if total < 200:
        return None
    if total > 150_000:  # deterministic thinning keeps big photos fast
        step = total // 150_000 + 1
        groups = [(y[::step], x[::step]) for y, x in groups]

    def score(angle: float) -> float:
        t = math.tan(math.radians(angle))
        out = 0.0
        for ys, xs in groups:
            xp = np.round(xs + ys * t).astype(np.int64)
            counts = np.bincount(xp - xp.min())
            out += float((counts.astype(np.float64) ** 2).sum())
        return out

    coarse = max(range(-45, 46, 3), key=score)
    fine = [coarse + d * 0.5 for d in range(-6, 7)]
    return float(max(fine, key=score))


def _baseline_stats(band: np.ndarray, line_h: float) -> Optional[tuple[float, float]]:
    """(slope in degrees, wobble relative to line height) for one line."""
    has = band.any(axis=0)
    cols = np.flatnonzero(has)
    if cols.size < 40:
        return None
    bottoms = (band.shape[0] - 1 - np.argmax(band[::-1], axis=0))[cols].astype(np.float64)
    x = cols.astype(np.float64)
    keep = np.ones(x.size, dtype=bool)
    # Trim the points below the fit (descenders, dots) a couple of times.
    for _ in range(2):
        coef = np.polyfit(x[keep], bottoms[keep], 1)
        resid = bottoms - np.polyval(coef, x)
        keep &= resid <= np.percentile(resid[keep], 70)
        if keep.sum() < 10:
            return None
    coef = np.polyfit(x[keep], bottoms[keep], 1)
    resid = bottoms[keep] - np.polyval(coef, x[keep])
    return math.degrees(math.atan(coef[0])), float(resid.std() / line_h)


def _run_lengths(band: np.ndarray) -> np.ndarray:
    padded = np.pad(band, ((0, 0), (1, 1))).astype(np.int8).ravel()
    d = np.diff(padded)
    starts = np.flatnonzero(d == 1)
    ends = np.flatnonzero(d == -1)
    return (ends - starts).astype(np.float64)


def _median(values: List[float]) -> Optional[float]:
    return float(np.median(values)) if values else None


def _measure(ink: np.ndarray, bands: List[tuple[int, int]], width: int) -> Dict[str, Optional[float]]:
    heights = [b - a for a, b in bands]
    line_h = float(np.median(heights))
    feats: Dict[str, Optional[float]] = {n: None for n in FEATURE_NAMES}
    feats["lines_detected"] = float(len(bands))
    feats["letter_height_rel"] = line_h / max(width, 1)

    if len(bands) >= 2:
        centres = []
        for a, b in bands:
            p = ink[a:b].sum(axis=1).astype(np.float64)
            centres.append(a + float((p * np.arange(b - a)).sum() / max(p.sum(), 1.0)))
        feats["line_spacing_rel"] = float(np.median(np.diff(centres))) / line_h

    feats["slant_deg"] = _best_slant(ink, bands)

    slopes, wobbles, runs, gaps = [], [], [], []
    ink_px = 0
    col_min, col_max = ink.shape[1], 0
    for a, b in bands:
        band = ink[a:b]
        ink_px += int(band.sum())
        stats = _baseline_stats(band, line_h)
        if stats:
            slopes.append(abs(stats[0]))
            wobbles.append(stats[1])
        r = _run_lengths(band)
        runs.extend(r[r <= line_h].tolist())
        cols = np.flatnonzero(band.any(axis=0))
        if cols.size:
            col_min, col_max = min(col_min, int(cols[0])), max(col_max, int(cols[-1]))
            for s, e in _runs(~band.any(axis=0)[cols[0] : cols[-1] + 1]):
                if e - s >= 0.25 * line_h:
                    gaps.append(float(e - s))
    if slopes:
        feats["baseline_slope_deg"] = float(np.mean(slopes))
        feats["baseline_wobble"] = _median(wobbles)
    if runs:
        feats["stroke_width_rel"] = float(np.median(runs)) / line_h
    if gaps:
        feats["word_gap_rel"] = float(np.median(gaps)) / line_h
    if col_max > col_min:
        feats["ink_density"] = ink_px / float((col_max - col_min + 1) * sum(heights))
    return feats


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def extract_features(data: bytes) -> HandwritingFeatures:
    """Measure one photo. Raises ``HandwritingImageError`` for non-images only."""
    gray, original = _load_gray(data)
    reasons: List[str] = []
    feats: Dict[str, Optional[float]] = {n: None for n in FEATURE_NAMES}
    feats["lines_detected"] = 0.0
    try:
        if min(original) < MIN_SIDE_PX:
            reasons.append("image_too_small")
        mx, my = int(gray.width * 0.02), int(gray.height * 0.02)
        if gray.width - 2 * mx >= 8 and gray.height - 2 * my >= 8:
            gray = gray.crop((mx, my, gray.width - mx, gray.height - my))
        norm = _even_lighting(gray)
        ink, contrast = _binarise(norm)

        fraction = float(ink.mean()) if ink.size else 0.0
        if fraction < MIN_INK_FRACTION:
            reasons.append("too_little_ink")
        elif fraction > MAX_INK_FRACTION:
            reasons.append("too_much_ink")
        if contrast < MIN_CONTRAST:
            reasons.append("low_contrast")
        g = norm.astype(np.float32)
        if g.shape[0] >= 3 and g.shape[1] >= 3:
            lap = (
                4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]
            )
            if float(lap.var()) < MIN_LAPLACIAN_VAR:
                reasons.append("too_blurry")

        bands = _find_lines(ink) if "too_little_ink" not in reasons else []
        if not bands:
            reasons.append("no_lines")
        else:
            feats = _measure(ink, bands, ink.shape[1])
            if len(bands) < MIN_LINES:
                reasons.append("too_few_lines")
    except Exception:  # noqa: BLE001 - odd pixels must never crash the caller
        reasons.append("analysis_failed")

    quality = 1.0
    for r in dict.fromkeys(reasons):
        quality *= _PENALTY[r]
    out = {k: (None if v is None else round(float(v), 5)) for k, v in feats.items()}
    return HandwritingFeatures(
        features=out, quality=round(quality, 3), reasons=list(dict.fromkeys(reasons))
    )

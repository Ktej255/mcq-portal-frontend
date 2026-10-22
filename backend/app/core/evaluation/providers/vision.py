"""Vision-grading helpers for the evaluation core (R13).

When the active model supports vision, answer-sheet images are attached to the
inference request so diagrams/maps are graded directly (R13.1). When the active
model does NOT support vision, callers should instead merge a textual
description of any detected diagram into the answer content (R13.2); this module
exposes the predicate and the attach helper so the engine stays declarative.

Subject-neutral.
"""
from __future__ import annotations

from typing import List, Optional

from app.core.inference.contracts import InferenceRequest, sniff_image_mime
from app.core.evaluation.providers.config import ProviderConfig


def should_use_vision(config: ProviderConfig, images: List[bytes]) -> bool:
    """True when there are images AND the configured model supports vision."""
    return bool(images) and config.supports_vision


# Cap on pages sent to the model in one grading call (cost / payload size).
MAX_VISION_PAGES = 8


def apply_vision(
    request: InferenceRequest,
    images: List[bytes],
    config: ProviderConfig,
    *,
    mime_type: Optional[str] = None,
) -> InferenceRequest:
    """Attach the answer-sheet pages (in order, up to ``MAX_VISION_PAGES``).

    ``request.images`` carries every attached page; ``request.image`` keeps the
    first page so single-image providers behave as before. Returns the same
    request for chaining.
    """
    if should_use_vision(config, images):
        pages = images[:MAX_VISION_PAGES]
        request.image = pages[0]
        request.images = list(pages)
        request.image_mime_type = mime_type or sniff_image_mime(pages[0])
    return request


__all__ = ["should_use_vision", "apply_vision", "MAX_VISION_PAGES"]

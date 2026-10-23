"""Is real AI answer checking configured? (no silent mocks in production)

The OCR and evaluation providers default to deterministic MOCKS that return
fake text and fake scores. Those are only acceptable when
``settings.ALLOW_MOCK_AI`` is on (dev/test/e2e). This module answers, without
calling any model, whether the resolved providers are real, mock-but-allowed,
or unusable. Subject-neutral; imports no domain.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from app.core.config import settings
from app.core.evaluation.providers.config import active_provider_key

NOT_SET_UP_DETAIL = "Answer checking is not set up yet"


def ocr_provider_key() -> str:
    return (os.environ.get("OPTIONAL_OCR_PROVIDER") or "mock").strip().lower()


def optional_evaluation_provider_key() -> str:
    return (os.environ.get("OPTIONAL_EVAL_PROVIDER") or "mock").strip().lower()


def _gemini_key_present() -> bool:
    return bool(
        settings.GOOGLE_API_KEY
        or os.environ.get("GOOGLE_API_KEY")
        or settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY")
    )


def _usable(key: str) -> bool:
    """True when a provider key is not a mock and (for Gemini) has an API key."""
    if key == "mock":
        return bool(settings.ALLOW_MOCK_AI)
    if key in ("gemini", "gemini-vision", "gateway"):
        return _gemini_key_present()
    # OpenAI-compatible / other env-configured providers carry their own config.
    return True


def is_available(key: str) -> bool:
    return _usable((key or "mock").strip().lower())


def is_mock(key: str) -> bool:
    return (key or "mock").strip().lower() == "mock"


@dataclass(frozen=True)
class AiCapabilities:
    ocr_live: bool
    evaluation_live: bool
    mock_in_use: bool
    ocr_provider: str
    evaluation_provider: str


def gs_capabilities() -> AiCapabilities:
    ocr, ev = ocr_provider_key(), active_provider_key()
    return AiCapabilities(
        ocr_live=is_available(ocr),
        evaluation_live=is_available(ev),
        mock_in_use=is_mock(ocr) or is_mock(ev),
        ocr_provider=ocr,
        evaluation_provider=ev,
    )


__all__ = [
    "NOT_SET_UP_DETAIL",
    "AiCapabilities",
    "gs_capabilities",
    "is_available",
    "is_mock",
    "ocr_provider_key",
    "optional_evaluation_provider_key",
]

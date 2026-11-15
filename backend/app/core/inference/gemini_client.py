"""One place that knows how to reach Gemini.

Every Gemini caller in the backend gets its key, model name and client from
here, so there is a single key name to set, a single model to update when
Google retires one, and a time limit on every call.
"""

from __future__ import annotations

import os
from typing import Optional

from google import genai
from google.genai import types

from app.core.config import settings


def gemini_api_key() -> Optional[str]:
    """The configured key, or None. Environment wins so a rotated key applies at once."""
    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return settings.gemini_api_key


def gemini_model() -> str:
    return (
        os.environ.get("GEMINI_MODEL", "").strip()
        or os.environ.get("GEMINI_MODEL_ID", "").strip()
        or settings.GEMINI_MODEL
    )


def gemini_timeout_seconds() -> float:
    return max(1.0, float(settings.AI_REQUEST_TIMEOUT_SECONDS))


def build_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """A client whose every request is abandoned after the configured time limit."""
    key = api_key or gemini_api_key()
    if not key:
        raise ValueError("GEMINI_API_KEY is required to call Gemini")
    return genai.Client(
        api_key=key,
        # The SDK takes the timeout in milliseconds.
        http_options=types.HttpOptions(timeout=int(gemini_timeout_seconds() * 1000)),
    )

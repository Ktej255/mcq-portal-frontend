"""Speech-to-Text provider for the GS LMS Interactive Learning Funnel.

Provides a domain-local STT abstraction for recall check audio transcription.
The interface mirrors the Optional platform's SttProvider protocol without
importing from it (domain isolation). In production, both domains use the same
underlying STT backend (Whisper/Gemini) configured via environment variables.

A mock implementation is provided for development and testing.

Requirements: 5.2, 5.6 (STT_Engine for recall checks)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
import hashlib


# ---------------------------------------------------------------------------
# Data Types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SttSegment:
    """A timed segment from the transcription."""
    text: str
    start: float
    end: float
    confidence: float


@dataclass(frozen=True)
class SttResult:
    """Result of a speech-to-text transcription."""
    text: str
    confidence: float  # 0.0–1.0
    segments: List[SttSegment] = field(default_factory=list)
    provider: str = "unknown"


# ---------------------------------------------------------------------------
# Abstract Provider
# ---------------------------------------------------------------------------

class SttProviderUnavailableError(RuntimeError):
    """Raised when no real GS LMS speech provider is configured."""


class GsLmsSttProvider(ABC):
    """Abstract speech-to-text provider for GS LMS recall checks."""

    name: str = "abstract"

    @abstractmethod
    def transcribe(
        self,
        audio: bytes,
        *,
        vocabulary_hint: Optional[List[str]] = None,
        mime_type: Optional[str] = None,
    ) -> SttResult:
        """Transcribe audio bytes to text."""
        raise NotImplementedError


class UnavailableGsLmsSttProvider(GsLmsSttProvider):
    """Explicit fail-closed boundary until a real provider is wired.

    The GS LMS audio route must not turn a deterministic placeholder transcript
    into a persisted recall result. Tests and approved runtime wiring can still
    replace this provider through :func:`set_stt_provider`.
    """

    name = "unavailable"

    def transcribe(
        self,
        audio: bytes,
        *,
        vocabulary_hint: Optional[List[str]] = None,
        mime_type: Optional[str] = None,
    ) -> SttResult:
        raise SttProviderUnavailableError(
            "GS LMS speech transcription is not configured"
        )


# ---------------------------------------------------------------------------
# Mock Provider (deterministic, for dev/testing)
# ---------------------------------------------------------------------------

class MockGsLmsSttProvider(GsLmsSttProvider):
    """Deterministic mock STT provider for development and testing.

    Produces predictable output based on audio bytes hash so that tests
    are repeatable. Includes vocabulary_hint in the output when provided.
    """

    name = "mock-gs-lms"

    def transcribe(
        self,
        audio: bytes,
        *,
        vocabulary_hint: Optional[List[str]] = None,
        mime_type: Optional[str] = None,
    ) -> SttResult:
        # Generate deterministic text from audio hash
        audio_hash = hashlib.md5(audio).hexdigest()[:8] if audio else "empty"

        if vocabulary_hint:
            text = f"The student discussed {', '.join(vocabulary_hint[:3])} and related concepts."
        else:
            text = f"The student explained key concepts about the topic. (hash: {audio_hash})"

        return SttResult(
            text=text,
            confidence=0.85,
            segments=[
                SttSegment(
                    text=text,
                    start=0.0,
                    end=float(len(audio) / 16000) if audio else 1.0,
                    confidence=0.85,
                )
            ],
            provider=self.name,
        )


# ---------------------------------------------------------------------------
# Provider Instance (module-level, overridable for testing or approved wiring)
# ---------------------------------------------------------------------------

# Do not default to the deterministic mock: doing so would fabricate a
# successful transcript and allow a persisted recall result without audio STT.
_default_provider: GsLmsSttProvider = UnavailableGsLmsSttProvider()


def get_stt_provider() -> GsLmsSttProvider:
    """Return the active STT provider.

    GS LMS audio recall is fail-closed until a real provider is wired. The
    deterministic mock remains available only through explicit
    ``set_stt_provider(MockGsLmsSttProvider())`` injection for tests or an
    approved non-production integration.
    """
    return _default_provider


def set_stt_provider(provider: GsLmsSttProvider) -> None:
    """Override the STT provider (useful for testing or config-driven swap)."""
    global _default_provider
    _default_provider = provider


# ---------------------------------------------------------------------------
# Confidence threshold
# ---------------------------------------------------------------------------

STT_CONFIDENCE_THRESHOLD = 0.6  # Below this, student should review/re-record


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

__all__ = [
    "SttSegment",
    "SttResult",
    "SttProviderUnavailableError",
    "GsLmsSttProvider",
    "UnavailableGsLmsSttProvider",
    "MockGsLmsSttProvider",
    "get_stt_provider",
    "set_stt_provider",
    "STT_CONFIDENCE_THRESHOLD",
]

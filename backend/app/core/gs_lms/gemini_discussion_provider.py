"""Gemini provider for the GS LMS discussion engine.

Provider failures are surfaced as typed retryable unavailability. There is no
silent deterministic fallback and no fabricated AI response.
"""

from __future__ import annotations

import logging
import os

import google.generativeai as genai

from app.core.gs_lms.discussion import (
    AIResponseProvider,
    DiscussionProviderUnavailableError,
    MockAIResponseProvider,
    clear_default_provider,
    set_default_provider,
)

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are a Socratic tutor for UPSC Geography. Given the topic, prior conversation, "
    "and the student's latest message, ask a probing counter-question that tests depth "
    "of understanding. Keep responses concise (2-3 sentences max)."
)


class GeminiAIResponseProvider:
    """Concrete AIResponseProvider backed by Gemini."""

    provider_id = "gemini"
    is_mock = False

    def __init__(self, model_name: str = "gemini-1.5-flash"):
        from app.core.config import settings
        api_key = os.environ.get("GOOGLE_API_KEY", "") or (settings.GOOGLE_API_KEY or "")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is required for GeminiAIResponseProvider")
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(
            model_name,
            system_instruction=_SYSTEM_INSTRUCTION,
        )

    def generate_response(
        self,
        topic_title: str,
        transcript: list[dict],
        student_message: str,
        concepts_missed: list[str] | None = None,
        match_percentage: float | None = None,
    ) -> str:
        """Generate a Gemini-powered Socratic counter-question."""
        prompt = self._build_prompt(
            topic_title, transcript, student_message,
            concepts_missed=concepts_missed,
            match_percentage=match_percentage,
        )
        try:
            response = self._model.generate_content(prompt)
            text = response.text
            if not isinstance(text, str) or not text.strip():
                raise ValueError("Gemini returned an empty response")
            return text
        except Exception as exc:
            logger.error(
                "Gemini discussion call failed; provider=%s error_type=%s",
                self.provider_id,
                type(exc).__name__,
            )
            raise DiscussionProviderUnavailableError(self.provider_id) from exc

    def _build_prompt(
        self,
        topic_title: str,
        transcript: list[dict],
        student_message: str,
        concepts_missed: list[str] | None = None,
        match_percentage: float | None = None,
    ) -> str:
        """Assemble the prompt sent to the Gemini SDK.

        When concepts_missed is provided, appends targeted Socratic guidance
        so the AI asks about specific uncovered concepts.
        """
        lines = [f"Topic: {topic_title}", "", "Conversation so far:"]
        for turn in transcript:
            role = turn.get("role", "unknown").capitalize()
            content = turn.get("content", "")
            lines.append(f"  {role}: {content}")
        lines.append(f"\nStudent's latest message: {student_message}")

        # Enhanced prompt for targeting missed concepts (Requirement 2.6)
        if concepts_missed:
            lines.append(
                f"\n\nThe student has explained some concepts well, but has NOT yet "
                f"covered these key concepts: {', '.join(concepts_missed)}. "
                "Ask a focused Socratic question about ONE of the missed concepts "
                "to guide the student toward explaining it."
            )
            if match_percentage is not None:
                displayed_percentage = (
                    match_percentage * 100
                    if 0.0 <= match_percentage <= 1.0
                    else match_percentage
                )
                lines.append(
                    f"(Current concept coverage: {displayed_percentage:.0f}%. "
                    "The gate opens at 80%.)"
                )
        else:
            lines.append("\nRespond with a Socratic counter-question:")

        return "\n".join(lines)


def register_discussion_provider() -> None:
    """Register exactly the explicitly configured runtime provider at startup."""
    from app.core.config import settings

    selection = settings.GS_LMS_DISCUSSION_PROVIDER
    if selection == "mock":
        if (
            settings.APP_ENVIRONMENT not in {"development", "test", "local"}
            or not settings.ENABLE_GS_LMS_DISCUSSION_MOCK
        ):
            clear_default_provider("deterministic-mock")
            logger.error(
                "Deterministic discussion provider denied by runtime policy; environment=%s",
                settings.APP_ENVIRONMENT,
            )
            return
        set_default_provider(MockAIResponseProvider())
        logger.warning("Discussion engine: explicit deterministic mock registered")
        return

    if selection != "gemini":
        clear_default_provider(selection)
        logger.error("Unsupported GS LMS discussion provider selection")
        return

    api_key = os.environ.get("GOOGLE_API_KEY", "") or (settings.GOOGLE_API_KEY or "")
    if not api_key:
        clear_default_provider("gemini")
        logger.warning("Gemini discussion provider is not configured")
        return

    try:
        set_default_provider(GeminiAIResponseProvider())
        logger.info("Discussion engine: Gemini provider registered")
    except Exception:
        clear_default_provider("gemini")
        logger.exception("Failed to initialize Gemini discussion provider")

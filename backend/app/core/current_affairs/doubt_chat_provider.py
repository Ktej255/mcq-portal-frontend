"""Provider boundary for Current Affairs doubt chat.

All inference runs through the existing gateway. Deterministic output is
fail-closed outside explicitly enabled local, development, or test runtimes.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Mapping, Optional, Sequence

from app.core.config import settings
from app.core.inference.contracts import InferenceRequest

logger = logging.getLogger(__name__)
_NON_PRODUCTION_ENVIRONMENTS = {"development", "test", "local"}


class DoubtChatProviderUnavailableError(RuntimeError):
    """Typed retryable failure that is safe for API translation."""

    def __init__(self, provider: str) -> None:
        super().__init__("Current Affairs doubt-chat provider is unavailable")
        self.provider = provider
        self.retryable = True


@dataclass(frozen=True)
class GeneratedDoubtResponse:
    text: str
    provider: str
    is_mock: bool


class GatewayDoubtChatProvider:
    """Small text provider backed only by the shared inference gateway."""

    def __init__(self, gateway_provider: str, *, is_mock: bool = False) -> None:
        self.gateway_provider = gateway_provider
        self.provider_id = "deterministic-mock" if is_mock else gateway_provider
        self.is_mock = is_mock

    def generate(
        self,
        item_context: Mapping[str, Any],
        question: str,
        history: Sequence[Mapping[str, Any]],
    ) -> GeneratedDoubtResponse:
        request = InferenceRequest(
            prompt=_build_prompt(item_context, question, history),
            temperature=0.2,
            max_tokens=1000,
        )
        try:
            from app.core.inference.gateway import InferenceGateway

            response = InferenceGateway.get_provider(self.gateway_provider).generate(request)
            text = getattr(response, "text", None)
            if not isinstance(text, str) or not text.strip():
                raise ValueError("empty provider response")
            response_provider = getattr(response, "provider", None)
            return GeneratedDoubtResponse(
                text=text.strip(),
                provider=str(response_provider or self.provider_id),
                is_mock=self.is_mock,
            )
        except Exception as exc:
            logger.error(
                "Current Affairs doubt-chat provider failure; provider=%s exception_type=%s",
                self.provider_id,
                type(exc).__name__,
            )
            raise DoubtChatProviderUnavailableError(self.provider_id) from exc


def _build_prompt(
    item_context: Mapping[str, Any],
    question: str,
    history: Sequence[Mapping[str, Any]],
) -> str:
    safe_history = [
        {"role": entry.get("role"), "content": entry.get("content")}
        for entry in history
    ]
    context_json = json.dumps(item_context, ensure_ascii=True, default=str)
    history_json = json.dumps(safe_history, ensure_ascii=True, default=str)
    return (
        "You are a UPSC Current Affairs tutor. Answer only the student's doubt "
        "using the supplied published-item context. Be accurate, concise, and "
        "explicit when the context is insufficient. Do not invent facts.\n\n"
        f"ITEM_CONTEXT:\n{context_json}\n\n"
        f"CONVERSATION:\n{history_json}\n\n"
        f"STUDENT_QUESTION:\n{question}"
    )


_PROVIDERS: dict[str, GatewayDoubtChatProvider] = {}


def get_doubt_chat_provider(
    name: Optional[str] = None,
) -> GatewayDoubtChatProvider:
    """Resolve an approved provider, checking mock policy before cache access."""
    resolved = (name or settings.CURRENT_AFFAIRS_DOUBT_CHAT_PROVIDER).strip().lower()

    if resolved == "mock" and (
        settings.APP_ENVIRONMENT not in _NON_PRODUCTION_ENVIRONMENTS
        or not settings.ENABLE_CURRENT_AFFAIRS_DOUBT_CHAT_MOCK
    ):
        raise DoubtChatProviderUnavailableError("deterministic-mock")

    if resolved in _PROVIDERS:
        return _PROVIDERS[resolved]

    if resolved in {"gemini", "gateway"}:
        provider = GatewayDoubtChatProvider("gemini")
    elif resolved == "mock":
        provider = GatewayDoubtChatProvider("mock", is_mock=True)
    else:
        raise DoubtChatProviderUnavailableError(resolved or "unconfigured")

    _PROVIDERS[resolved] = provider
    return provider


__all__ = [
    "DoubtChatProviderUnavailableError",
    "GeneratedDoubtResponse",
    "GatewayDoubtChatProvider",
    "get_doubt_chat_provider",
]
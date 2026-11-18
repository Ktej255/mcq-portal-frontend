"""Config-driven provider registry for the evaluation core (R3).

Replaces the hard-coded ``if name == "gemini" ... elif name == "mock"`` branching
in :class:`app.core.inference.gateway.InferenceGateway` with a registry keyed by
provider key and fed by :class:`ProviderConfig`. Resolving the active model is a
configuration lookup, so a new model (e.g. a self-hosted GLM-class OSS model via
an OpenAI-compatible endpoint) is reachable by configuration without editing the
resolution path (R3.1, R3.4, R3.7).

Subject-neutral: imports only the core + the existing inference layer.
"""
from __future__ import annotations

from typing import Callable, Dict, Optional

from app.core.inference.contracts import IInferenceProvider
from app.core.evaluation.providers.config import (
    ConfigurationError,
    ProviderConfig,
    active_provider_key,
    load_provider_config,
    mock_provider_enabled,
)
from app.core.evaluation.providers.openai_compatible import OpenAICompatibleProvider

ProviderFactory = Callable[[ProviderConfig], IInferenceProvider]


class ProviderRegistry:
    """Resolves a provider key → constructed :class:`IInferenceProvider`.

    Resolution is purely config-driven: there is no branching on hard-coded
    provider names. Built-in keys (mock, gemini) are registered explicitly; any
    other key with a ``base_url`` in its config is served by the OpenAI-compatible
    provider, so OSS endpoints need no code (R3.7).
    """

    def __init__(self) -> None:
        self._factories: Dict[str, ProviderFactory] = {}
        self._cache: Dict[str, IInferenceProvider] = {}
        # Built-in mock resolution is policy-gated. A public registration is
        # an explicit test/dev injection and intentionally replaces that
        # built-in entry without changing the provider/schema contracts.
        self._builtin_keys: set[str] = set()
        self._register_builtins()

    def _register_builtin(self, key: str, factory: ProviderFactory) -> None:
        normalized = key.strip().lower()
        self._factories[normalized] = factory
        self._builtin_keys.add(normalized)
        self._cache.pop(normalized, None)

    def _ensure_runtime_policy(self, key: str) -> None:
        if key == "mock" and key in self._builtin_keys and not mock_provider_enabled():
            raise ConfigurationError(
                "Evaluation provider 'mock' is disabled outside an explicitly "
                "enabled non-production runtime. Set APP_ENVIRONMENT to "
                "development, test, or local and ENABLE_OPTIONAL_EVAL_MOCK=true."
            )

    # -- registration -------------------------------------------------------
    def register(self, key: str, factory: ProviderFactory) -> None:
        """Register an explicitly injected provider factory under ``key``.

        Explicit registration remains available to hermetic tests and local
        development. It replaces a built-in entry, so the built-in mock policy
        does not turn dependency injection into an accidental production
        fallback.
        """
        normalized = key.strip().lower()
        self._factories[normalized] = factory
        self._builtin_keys.discard(normalized)
        self._cache.pop(normalized, None)

    def _register_builtins(self) -> None:
        # Built-ins route through the existing inference gateway providers so
        # behavior is unchanged for gemini. The "mock" key uses an
        # evaluation-aware mock that returns a complete report as JSON (so the
        # engine's offline path mirrors the old MockEvaluationProvider).
        def _gateway_factory(name: str) -> ProviderFactory:
            def _factory(_config: ProviderConfig) -> IInferenceProvider:
                from app.core.inference.gateway import InferenceGateway

                return InferenceGateway.get_provider(name)

            return _factory

        def _mock_factory(_config: ProviderConfig) -> IInferenceProvider:
            from app.core.evaluation.providers.evaluation import (
                MockEvaluationInferenceProvider,
            )

            return MockEvaluationInferenceProvider()

        self._register_builtin("mock", _mock_factory)
        self._register_builtin("gemini", _gateway_factory("gemini"))

    # -- resolution ---------------------------------------------------------
    def resolve_config(self, key: Optional[str] = None) -> ProviderConfig:
        """Load the :class:`ProviderConfig` for ``key`` (or the active key)."""
        resolved_key = (key or active_provider_key()).strip().lower()
        self._ensure_runtime_policy(resolved_key)
        return load_provider_config(resolved_key)

    def resolve(self, key: Optional[str] = None) -> IInferenceProvider:
        """Resolve ``key`` (or the active key) to a provider (R3.1, R3.3).

        Raises :class:`ConfigurationError` naming the key when it cannot be
        resolved (R3.5); the underlying config loader raises naming a missing
        required value (R3.6).
        """
        resolved_key = (key or active_provider_key()).strip().lower()
        self._ensure_runtime_policy(resolved_key)
        if resolved_key in self._cache:
            return self._cache[resolved_key]

        config = load_provider_config(resolved_key)

        factory = self._factories.get(resolved_key)
        if factory is not None:
            provider = factory(config)
        elif config.base_url:
            # Any env-configured key with an endpoint is OpenAI-compatible.
            provider = OpenAICompatibleProvider(config)
        else:
            raise ConfigurationError(
                f"Cannot resolve evaluation provider '{resolved_key}': no "
                f"registered factory and no base_url in its configuration."
            )

        self._cache[resolved_key] = provider
        return provider

    def clear_cache(self) -> None:
        """Drop cached provider instances (e.g. after a config change)."""
        self._cache.clear()


# Process-wide default registry.
_DEFAULT_REGISTRY: Optional[ProviderRegistry] = None


def get_default_registry() -> ProviderRegistry:
    """Return the process-wide default registry (lazily constructed)."""
    global _DEFAULT_REGISTRY
    if _DEFAULT_REGISTRY is None:
        _DEFAULT_REGISTRY = ProviderRegistry()
    return _DEFAULT_REGISTRY


__all__ = ["ProviderRegistry", "ProviderFactory", "get_default_registry"]

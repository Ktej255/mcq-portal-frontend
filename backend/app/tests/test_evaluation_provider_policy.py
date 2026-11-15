"""Regression coverage for the shared evaluation provider default policy."""

import pytest

from app.core.config import settings
from app.core.evaluation.providers.config import (
    ConfigurationError,
    active_provider_key,
)
from app.core.evaluation.providers.evaluation import MockEvaluationInferenceProvider
from app.core.evaluation.providers.registry import ProviderRegistry


def test_shared_evaluation_defaults_to_live_provider(monkeypatch):
    monkeypatch.delenv("EVALUATION_PROVIDER", raising=False)
    monkeypatch.delenv("OPTIONAL_EVAL_PROVIDER", raising=False)
    assert active_provider_key() == "gemini"
    assert ProviderRegistry().resolve_config().key == "gemini"


def test_shared_evaluation_honors_explicit_non_mock_provider(monkeypatch):
    monkeypatch.setenv("EVALUATION_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_MODEL_ID", "test-model")
    assert active_provider_key() == "gemini"
    assert ProviderRegistry().resolve_config().key == "gemini"


def test_shared_builtin_mock_fails_closed_outside_enabled_nonproduction(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_EVAL_MOCK", True)

    with pytest.raises(ConfigurationError, match="mock.*disabled"):
        ProviderRegistry().resolve("mock")


def test_shared_builtin_mock_requires_explicit_nonproduction_enablement(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_EVAL_MOCK", True)

    provider = ProviderRegistry().resolve("mock")

    assert isinstance(provider, MockEvaluationInferenceProvider)


def test_shared_registry_preserves_explicit_injected_mock_for_tests():
    sentinel = object()
    registry = ProviderRegistry()
    registry.register("mock", lambda _config: sentinel)

    assert registry.resolve("mock") is sentinel

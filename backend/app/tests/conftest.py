"""Hermetic defaults for the test suite.

The developer's ``.env`` is loaded by pydantic settings, so a local machine that
points optional providers at Gemini would otherwise make tests call the real
network (and fail on an unavailable model) instead of exercising the
deterministic providers. Production policy stays fail-closed; tests opt into
the mock providers explicitly here, which is exactly what the policy requires.

Tests that assert production denial monkeypatch these attributes themselves,
so this fixture does not weaken policy coverage.
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _hermetic_optional_providers(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "APP_ENVIRONMENT", "test", raising=False)
    monkeypatch.setattr(settings, "OPTIONAL_OCR_PROVIDER", "mock", raising=False)
    monkeypatch.setattr(settings, "OPTIONAL_STT_PROVIDER", "mock", raising=False)
    monkeypatch.setattr(settings, "OPTIONAL_RECALL_PROVIDER", "mock", raising=False)
    monkeypatch.setattr(settings, "OPTIONAL_EVAL_PROVIDER", "mock", raising=False)
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_OCR_MOCK", True, raising=False)
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_STT_MOCK", True, raising=False)
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_RECALL_MOCK", True, raising=False)
    monkeypatch.setattr(settings, "ENABLE_OPTIONAL_EVAL_MOCK", True, raising=False)

    from app.core.evaluation.providers import evaluation as eval_providers
    from app.core.evaluation.providers import ocr as ocr_providers
    from app.core.optional.providers import recall as recall_providers
    from app.core.optional.providers import stt as stt_providers

    eval_providers._PROVIDERS.clear()
    ocr_providers._PROVIDERS.clear()
    recall_providers._PROVIDERS.clear()
    stt_providers._PROVIDERS.clear()

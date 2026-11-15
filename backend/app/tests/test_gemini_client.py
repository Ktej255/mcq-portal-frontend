"""Every Gemini caller shares one key name, one model setting and a time limit."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.core.inference import gemini_client
from app.core.inference.contracts import InferenceRequest
from app.core.inference.gemini_provider import GeminiProvider


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_MODEL", "GEMINI_MODEL_ID"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)


def test_either_key_name_configures_gemini(monkeypatch):
    assert gemini_client.gemini_api_key() is None
    monkeypatch.setenv("GOOGLE_API_KEY", "older-name")
    assert gemini_client.gemini_api_key() == "older-name"
    monkeypatch.setenv("GEMINI_API_KEY", "one-name")
    assert gemini_client.gemini_api_key() == "one-name"


def test_settings_key_is_used_when_the_environment_has_none(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "from-settings")
    assert settings.gemini_api_key == "from-settings"
    assert gemini_client.gemini_api_key() == "from-settings"


def test_model_is_a_setting_and_not_a_retired_default(monkeypatch):
    assert gemini_client.gemini_model() == settings.GEMINI_MODEL
    assert "1.5" not in settings.GEMINI_MODEL and "2.0" not in settings.GEMINI_MODEL
    monkeypatch.setenv("GEMINI_MODEL", "some-newer-model")
    assert gemini_client.gemini_model() == "some-newer-model"


def test_client_refuses_to_start_without_a_key():
    with pytest.raises(ValueError):
        gemini_client.build_gemini_client()


def test_every_call_carries_the_time_limit(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "AI_REQUEST_TIMEOUT_SECONDS", 12.0)
    client = gemini_client.build_gemini_client()
    # The SDK keeps the limit in milliseconds.
    assert client._api_client._http_options.timeout == 12_000


class _FakeModels:
    def __init__(self, text):
        self.text = text
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(text=self.text)


def _provider(monkeypatch, text="An answer"):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    provider = GeminiProvider()
    fake = _FakeModels(text)
    provider.client = SimpleNamespace(models=fake)
    return provider, fake


def test_text_request_goes_to_the_configured_model(monkeypatch):
    provider, fake = _provider(monkeypatch)
    response = provider.generate(
        InferenceRequest(prompt="Explain monsoons", system_instruction="Be brief", max_tokens=50)
    )

    call = fake.calls[0]
    assert response.text == "An answer" and response.provider == "google/gemini"
    assert call["model"] == settings.GEMINI_MODEL
    assert call["contents"] == ["Explain monsoons"]
    assert call["config"].system_instruction == "Be brief"
    assert call["config"].max_output_tokens == 50


def test_image_request_sends_the_image_alongside_the_prompt(monkeypatch):
    provider, fake = _provider(monkeypatch)
    response = provider.generate(
        InferenceRequest(prompt="Read this", image=b"png-bytes", image_mime_type="image/jpeg")
    )

    part = fake.calls[0]["contents"][1]
    assert response.provider == "google/gemini-vision"
    assert part.inline_data.data == b"png-bytes" and part.inline_data.mime_type == "image/jpeg"


def test_audio_request_sends_the_audio_alongside_the_prompt(monkeypatch):
    provider, fake = _provider(monkeypatch)
    response = provider.generate(InferenceRequest(prompt="Transcribe", audio=b"wav-bytes"))

    part = fake.calls[0]["contents"][1]
    assert response.provider == "google/gemini-audio"
    assert part.inline_data.mime_type == "audio/wav"


def test_empty_reply_is_an_error_not_an_answer(monkeypatch):
    provider, _ = _provider(monkeypatch, text=None)
    with pytest.raises(ValueError):
        provider.generate(InferenceRequest(prompt="Anything"))

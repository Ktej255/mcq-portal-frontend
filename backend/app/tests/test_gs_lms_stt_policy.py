"""Focused policy tests for the GS LMS STT and recall boundary."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1.gs_lms import recall as recall_route
from app.core.gs_lms import stt_provider
from app.core.gs_lms.funnel_models import GsLmsRecallAttempt
from app.core.gs_lms.models import GsLmsContentSection, GsLmsSyllabusNode


class _Query:
    def __init__(self, value):
        self.value = value

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.value

    def count(self):
        return 0


class _RecallDb:
    def __init__(self):
        self.node = SimpleNamespace(id=7)
        self.section = SimpleNamespace(
            blocks=[{"type": "text", "text": "**plate tectonics**"}],
            title="Plate tectonics",
        )
        self.added = []
        self.commit_calls = 0
        self.rollback_calls = 0

    def query(self, model):
        if model is GsLmsSyllabusNode:
            return _Query(self.node)
        if model is GsLmsContentSection:
            return _Query(self.section)
        if model is GsLmsRecallAttempt:
            return _Query(None)
        raise AssertionError(f"unexpected query model: {model!r}")

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


class _Audio:
    content_type = "audio/webm"

    async def read(self):
        return b"hermetic-audio"


class _BlankTranscriptProvider(stt_provider.GsLmsSttProvider):
    name = "blank-test"

    def transcribe(self, audio, *, vocabulary_hint=None, mime_type=None):
        return stt_provider.SttResult(
            text="   ",
            confidence=0.9,
            provider=self.name,
        )


def _submit_audio(provider, db):
    original_get_provider = recall_route.get_stt_provider
    recall_route.get_stt_provider = lambda: provider
    try:
        return asyncio.run(
            recall_route.submit_recall_audio(
                node_id=7,
                section_label="BASIC",
                audio=_Audio(),
                subject=SimpleNamespace(id=3),
                current_user=SimpleNamespace(id=11),
                db=db,
            )
        )
    finally:
        recall_route.get_stt_provider = original_get_provider


def test_default_gs_lms_provider_is_explicitly_unavailable():
    provider = stt_provider.get_stt_provider()

    assert isinstance(provider, stt_provider.UnavailableGsLmsSttProvider)
    assert provider.name == "unavailable"
    with pytest.raises(stt_provider.SttProviderUnavailableError):
        provider.transcribe(b"audio")


def test_mock_provider_requires_explicit_injection_and_preserves_label(monkeypatch):
    unavailable = stt_provider.UnavailableGsLmsSttProvider()
    try:
        monkeypatch.setattr(stt_provider, "_default_provider", unavailable)

        assert isinstance(stt_provider.get_stt_provider(), stt_provider.UnavailableGsLmsSttProvider)

        mock = stt_provider.MockGsLmsSttProvider()
        stt_provider.set_stt_provider(mock)
        result = stt_provider.get_stt_provider().transcribe(b"audio")

        assert stt_provider.get_stt_provider() is mock
        assert result.provider == mock.name == "mock-gs-lms"
        assert result.text
    finally:
        stt_provider.set_stt_provider(unavailable)


@pytest.mark.parametrize(
    "provider",
    [
        stt_provider.UnavailableGsLmsSttProvider(),
        _BlankTranscriptProvider(),
    ],
    ids=["unavailable", "blank-transcript"],
)
def test_unusable_stt_output_cannot_be_persisted_as_recall(provider):
    db = _RecallDb()

    with pytest.raises(HTTPException) as error:
        _submit_audio(provider, db)

    assert error.value.status_code == 503
    assert error.value.detail == (
        "Speech transcription is temporarily unavailable. Please retry or type your recall."
    )
    assert db.added == []
    assert db.commit_calls == 0
    assert db.rollback_calls == 1

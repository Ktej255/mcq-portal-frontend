"""Phase E1: honest answer pipeline (no silent mocks, per-page OCR, retention).

Covers the 503 behaviour when only mock AI is available, the capabilities
route, per-page OCR failure/retry, submit gating, image deletion + retention,
MediaStore.delete, Gemini provider config mapping and multi-image vision.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.session import Base

import app.models.domain as domain_models  # noqa: F401
import app.core.gs.models as gs_models  # noqa: F401
import app.core.gs_lms.models as gs_lms_models  # noqa: F401
import app.core.gs_lms.student_models as gs_lms_student_models  # noqa: F401

from app.core.gs_lms.models import GsLmsAnswerSheetImage, GsLmsAnswerAttempt
from app.core.storage.media_store import InMemoryMediaStore, LocalMediaStore
from app.core.evaluation.providers.ocr import OcrResult

BASE = "/api/v1/gs-lms/geography"


class _FakeUser:
    def __init__(self, uid, role=""):
        self.id = uid
        self.role = role


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    prefixes = ("gs_lms_", "gs_subjects", "users", "job_execution_registry")
    Base.metadata.create_all(
        engine,
        tables=[t for n, t in Base.metadata.tables.items() if n.startswith(prefixes)],
    )
    s = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    yield s
    s.close()
    engine.dispose()


@pytest.fixture()
def client(db_session, monkeypatch, tmp_path):
    monkeypatch.setenv("MEDIA_STORE_BACKEND", "local")
    monkeypatch.setenv("MEDIA_STORE_DIR", str(tmp_path))
    from app.api.dependencies import get_current_user
    from app.db.session import get_db
    import app.main as main

    def _override_db():
        yield db_session

    main.app.dependency_overrides[get_db] = _override_db
    main.app.dependency_overrides[get_current_user] = lambda: _FakeUser(1)
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


@pytest.fixture()
def no_mock_ai(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_MOCK_AI", False)


class _GoodOcr:
    name = "test"

    def extract(self, image, *, mime_type=None):
        return OcrResult(text=f"text:{image.decode()}", confidence=0.9, provider="test")


class _FailingOcr:
    name = "test"

    def extract(self, image, *, mime_type=None):
        raise RuntimeError("backend down")


def _use_ocr(monkeypatch, provider):
    monkeypatch.setattr(
        "app.core.evaluation.providers.ocr.get_ocr_provider", lambda name=None: provider
    )


def _new_attempt(client) -> int:
    r = client.post(f"{BASE}/answers/handwritten", json={"question_text": "Q?"})
    assert r.status_code == 200
    return r.json()["data"]["attempt_id"]


def _upload(client, attempt_id, order, content=b"img", **data):
    return client.post(
        f"{BASE}/answers/{attempt_id}/pages",
        files={"image": (f"p{order}.png", content, "image/png")},
        data={"page_order": str(order), **data},
    )


# ---------------------------------------------------------------------------
# 1. No silent mocks
# ---------------------------------------------------------------------------
def test_capabilities_reports_mock_when_allowed(client):
    d = client.get(f"{BASE}/answers/capabilities").json()["data"]
    assert d["ocr_live"] is True and d["evaluation_live"] is True
    assert d["mock_in_use"] is True


def test_capabilities_not_live_without_real_provider(client, no_mock_ai):
    d = client.get(f"{BASE}/answers/capabilities").json()["data"]
    assert d["ocr_live"] is False and d["evaluation_live"] is False
    assert d["message"] == "Answer checking is not set up yet"


def test_typed_answer_503_when_only_mock(client, no_mock_ai):
    r = client.post(f"{BASE}/answers/typed", json={"raw_text": "an answer " * 10})
    assert r.status_code == 503
    assert "not set up yet" in r.json()["detail"]
    assert client.app.dependency_overrides  # sanity


def test_page_ocr_503_when_only_mock_and_nothing_stored(client, db_session, monkeypatch):
    attempt_id = _new_attempt(client)
    monkeypatch.setattr(settings, "ALLOW_MOCK_AI", False)
    r = _upload(client, attempt_id, 1)
    assert r.status_code == 503
    assert db_session.query(GsLmsAnswerSheetImage).count() == 0


def test_page_with_client_text_needs_no_ocr(client, no_mock_ai):
    attempt_id = _new_attempt(client)
    r = _upload(client, attempt_id, 1, ocr_text="typed by student")
    assert r.status_code == 200
    assert r.json()["data"]["ocr_status"] == "skipped"


def test_submit_503_when_only_mock(client, monkeypatch):
    attempt_id = _new_attempt(client)
    assert _upload(client, attempt_id, 1).status_code == 200
    monkeypatch.setattr(settings, "ALLOW_MOCK_AI", False)
    r = client.post(f"{BASE}/answers/{attempt_id}/submit")
    assert r.status_code == 503


def test_optional_ocr_and_answers_503_when_only_mock(client, no_mock_ai):
    r = client.post(
        "/api/v1/optional/ocr", files={"image": ("a.png", b"x", "image/png")}
    )
    assert r.status_code == 503
    r = client.post(
        "/api/v1/optional/geography/answers",
        json={"mode": "TYPED", "raw_text": "some answer"},
    )
    assert r.status_code == 503


# ---------------------------------------------------------------------------
# 3. Per-page OCR, failure, retry, submit gate
# ---------------------------------------------------------------------------
def test_ocr_failure_keeps_page_and_blocks_submit_until_retry(client, db_session, monkeypatch):
    attempt_id = _new_attempt(client)
    _use_ocr(monkeypatch, _FailingOcr())
    up = _upload(client, attempt_id, 1, content=b"one")
    assert up.status_code == 200
    d = up.json()["data"]
    assert d["ocr_status"] == "failed" and d["retry_possible"] is True
    assert db_session.query(GsLmsAnswerSheetImage).count() == 1

    sub = client.post(f"{BASE}/answers/{attempt_id}/submit")
    assert sub.status_code == 409
    assert "Page 1" in sub.json()["detail"]

    _use_ocr(monkeypatch, _GoodOcr())
    retry = client.post(f"{BASE}/answers/{attempt_id}/pages/1/retry-ocr")
    assert retry.status_code == 200
    assert retry.json()["data"]["ocr_status"] == "ok"

    sub = client.post(f"{BASE}/answers/{attempt_id}/submit")
    assert sub.status_code == 200


def test_retry_with_typed_text_clears_failed_page(client, monkeypatch):
    attempt_id = _new_attempt(client)
    _use_ocr(monkeypatch, _FailingOcr())
    _upload(client, attempt_id, 1)
    r = client.post(
        f"{BASE}/answers/{attempt_id}/pages/1/retry-ocr", data={"ocr_text": "typed"}
    )
    assert r.json()["data"]["ocr_status"] == "skipped"
    assert client.post(f"{BASE}/answers/{attempt_id}/submit").status_code == 200


def test_raw_text_rebuilt_in_page_order(client, db_session, monkeypatch):
    attempt_id = _new_attempt(client)
    _use_ocr(monkeypatch, _GoodOcr())
    _upload(client, attempt_id, 2, content=b"two")
    _upload(client, attempt_id, 1, content=b"one")
    attempt = db_session.query(GsLmsAnswerAttempt).get(attempt_id)
    assert attempt.raw_text == "text:one\ntext:two"
    assert attempt.ocr_confidence == 0.9


def test_reupload_replaces_page(client, db_session, monkeypatch):
    attempt_id = _new_attempt(client)
    _use_ocr(monkeypatch, _GoodOcr())
    _upload(client, attempt_id, 1, content=b"old")
    _upload(client, attempt_id, 1, content=b"new")
    assert db_session.query(GsLmsAnswerSheetImage).count() == 1
    attempt = db_session.query(GsLmsAnswerAttempt).get(attempt_id)
    assert attempt.raw_text == "text:new"


def test_pages_route_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 2)
    attempt_id = _new_attempt(client)  # 1 hit (handwritten has ai_rate_limit)
    assert _upload(client, attempt_id, 1, ocr_text="a").status_code == 200  # 2nd
    assert _upload(client, attempt_id, 2, ocr_text="b").status_code == 429


# ---------------------------------------------------------------------------
# 5. Deletion + retention
# ---------------------------------------------------------------------------
def test_delete_images_keeps_text_and_report(client, db_session, monkeypatch):
    attempt_id = _new_attempt(client)
    _use_ocr(monkeypatch, _GoodOcr())
    _upload(client, attempt_id, 1, content=b"one")
    assert client.post(f"{BASE}/answers/{attempt_id}/submit").status_code == 200

    r = client.delete(f"{BASE}/answers/{attempt_id}/pages")
    assert r.status_code == 200 and r.json()["data"]["deleted_pages"] == 1

    row = db_session.query(GsLmsAnswerSheetImage).one()
    assert row.media_ref is None and row.deleted_at is not None
    assert row.ocr_text == "text:one"
    assert client.get(f"{BASE}/answers/{attempt_id}/pages/1").status_code == 404
    assert client.get(f"{BASE}/answers/{attempt_id}/report").status_code == 200
    pages = client.get(f"{BASE}/answers/{attempt_id}/pages").json()["data"]["pages"]
    assert pages[0]["has_image"] is False


def test_delete_images_other_student_404(client, monkeypatch):
    attempt_id = _new_attempt(client)
    from app.api.dependencies import get_current_user
    import app.main as main

    main.app.dependency_overrides[get_current_user] = lambda: _FakeUser(999)
    assert client.delete(f"{BASE}/answers/{attempt_id}/pages").status_code == 404


def test_retention_purges_only_expired(db_session, tmp_path):
    from app.core.gs_lms.answer_retention import purge_expired_images

    store = LocalMediaStore(str(tmp_path))
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    keys = {}
    for order, age in ((1, 200), (2, 10)):
        ref = store.put(b"x", content_type="image/png", owner_id=1, attempt_id=1, page_order=order)
        keys[order] = ref.key
        db_session.add(
            GsLmsAnswerSheetImage(
                attempt_id=1, student_id=1, media_ref=ref.key, page_order=order,
                uploaded_at=now - timedelta(days=age), ocr_text=f"t{order}",
            )
        )
    db_session.commit()

    dry = purge_expired_images(db_session, store, retention_days=180, dry_run=True)
    assert dry == {"expired": 1, "deleted": 0, "failed": 0}
    assert (tmp_path / keys[1]).exists()

    done = purge_expired_images(db_session, store, retention_days=180)
    assert done["deleted"] == 1
    assert not (tmp_path / keys[1]).exists() and (tmp_path / keys[2]).exists()
    rows = {r.page_order: r for r in db_session.query(GsLmsAnswerSheetImage).all()}
    assert rows[1].media_ref is None and rows[1].deleted_at is not None
    assert rows[1].ocr_text == "t1"
    assert rows[2].media_ref == keys[2]


def test_media_store_delete_is_idempotent(tmp_path):
    for store in (InMemoryMediaStore(), LocalMediaStore(str(tmp_path))):
        ref = store.put(b"x", content_type="image/png", owner_id=1, attempt_id=1, page_order=1)
        store.delete(ref.key)
        store.delete(ref.key)  # missing object is fine
        with pytest.raises(Exception):
            store.open(ref.key, requester_id=1, is_evaluator=False, owner_id=1)


def test_s3_store_delete_calls_delete_object():
    from app.core.storage.s3_media_store import S3MediaStore

    calls = []
    store = S3MediaStore(bucket="b")
    store._client = SimpleNamespace(delete_object=lambda **kw: calls.append(kw))
    store.delete("k1")
    assert calls == [{"Bucket": "b", "Key": "k1"}]


# ---------------------------------------------------------------------------
# 2. Gemini provider config
# ---------------------------------------------------------------------------
class _FakeModel:
    instances: list = []

    def __init__(self, model_name, **kwargs):
        self.model_name = model_name
        self.kwargs = kwargs
        self.calls = []
        _FakeModel.instances.append(self)

    def generate_content(self, contents, **kwargs):
        self.calls.append((contents, kwargs))
        return SimpleNamespace(text="{}")


@pytest.fixture()
def fake_genai(monkeypatch):
    import app.core.inference.gemini_provider as gp

    _FakeModel.instances = []
    configured = {}
    monkeypatch.setattr(gp.genai, "GenerativeModel", _FakeModel)
    monkeypatch.setattr(gp.genai, "configure", lambda **kw: configured.update(kw))
    return configured


def test_gemini_provider_model_key_and_request_mapping(fake_genai, monkeypatch):
    from app.core.inference.contracts import InferenceRequest
    from app.core.inference.gemini_provider import GeminiProvider

    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "fallback-key")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(settings, "GEMINI_TIMEOUT_SECONDS", 12.0)

    provider = GeminiProvider()
    assert provider.model_name == settings.GEMINI_MODEL_ID == "gemini-2.5-flash"
    assert fake_genai["api_key"] == "fallback-key"

    provider.generate(
        InferenceRequest(
            prompt="p",
            system_instruction="be strict",
            temperature=0.1,
            response_mime_type="application/json",
        )
    )
    model = _FakeModel.instances[-1]
    assert model.kwargs == {"system_instruction": "be strict"}
    contents, kwargs = model.calls[0]
    assert contents == "p"
    assert kwargs["generation_config"] == {
        "temperature": 0.1,
        "response_mime_type": "application/json",
    }
    assert kwargs["request_options"] == {"timeout": 12.0}


def test_gemini_google_key_wins_over_gemini_key(fake_genai, monkeypatch):
    from app.core.inference.gemini_provider import GeminiProvider

    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "google-key")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "other")
    GeminiProvider()
    assert fake_genai["api_key"] == "google-key"


def test_gemini_sends_all_images_in_order(fake_genai, monkeypatch):
    from app.core.inference.contracts import InferenceRequest
    from app.core.inference.gemini_provider import GeminiProvider

    jpeg = b"\xff\xd8\xff\xe0rest"
    png = b"\x89PNG\r\n\x1a\nrest"
    GeminiProvider().generate(InferenceRequest(prompt="p", images=[jpeg, png]))
    contents, _ = _FakeModel.instances[-1].calls[0]
    assert contents[0] == "p"
    assert [c["data"] for c in contents[1:]] == [jpeg, png]
    assert [c["mime_type"] for c in contents[1:]] == ["image/jpeg", "image/png"]


# ---------------------------------------------------------------------------
# 4. Vision grading attaches all pages (capped), single-image callers intact
# ---------------------------------------------------------------------------
def test_apply_vision_attaches_pages_in_order_with_cap():
    from app.core.evaluation.providers.config import ProviderConfig
    from app.core.evaluation.providers.vision import MAX_VISION_PAGES, apply_vision
    from app.core.inference.contracts import InferenceRequest

    cfg = ProviderConfig(key="x", model_id="m", supports_vision=True)
    pages = [bytes([i]) for i in range(12)]
    req = apply_vision(InferenceRequest(prompt="p"), pages, cfg)
    assert req.images == pages[:MAX_VISION_PAGES]
    assert req.image == pages[0]

    no_vision = ProviderConfig(key="x", model_id="m", supports_vision=False)
    req = apply_vision(InferenceRequest(prompt="p"), pages, no_vision)
    assert req.images is None and req.image is None


def test_openai_compatible_sends_every_page():
    from app.core.evaluation.providers.config import ProviderConfig
    from app.core.evaluation.providers.openai_compatible import OpenAICompatibleProvider
    from app.core.inference.contracts import InferenceRequest

    cfg = ProviderConfig(
        key="oss", model_id="m", base_url="http://x/v1", supports_vision=True
    )
    msgs = OpenAICompatibleProvider(cfg)._build_messages(
        InferenceRequest(prompt="p", images=[b"a", b"b"], image=b"a")
    )
    content = msgs[-1]["content"]
    assert [c["type"] for c in content] == ["text", "image_url", "image_url"]


# ---------------------------------------------------------------------------
# 7. Pillow: PNG -> JPEG in the mobile PDF assembler
# ---------------------------------------------------------------------------
def test_assemble_pdf_converts_png():
    import io

    from PIL import Image

    from app.api.v1.mains_upload import _assemble_pdf

    buf = io.BytesIO()
    Image.new("RGBA", (40, 30), (255, 0, 0, 128)).save(buf, format="PNG")
    pdf = _assemble_pdf([buf.getvalue()])
    assert pdf.startswith(b"%PDF-1.4")
    assert b"/DCTDecode" in pdf and b"/Width 40" in pdf and b"/Height 30" in pdf

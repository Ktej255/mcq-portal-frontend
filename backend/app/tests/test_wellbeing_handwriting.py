"""Opt-in handwriting trend: feature extraction, trend rules, storage and API."""
from __future__ import annotations

import io
import math
import random
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFilter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base

import app.models.domain as domain_models  # noqa: F401
import app.core.gs.models as gs_models  # noqa: F401
import app.core.gs_lms.models as gs_lms_models  # noqa: F401
import app.core.gs_lms.student_models as gs_lms_student_models  # noqa: F401
import app.core.wellbeing.models as wb_models  # noqa: F401

from app.core.wellbeing import handwriting_trend as trend
from app.core.wellbeing import service as wb_service
from app.core.wellbeing.handwriting_features import (
    ALGORITHM_VERSION,
    HandwritingImageError,
    extract_features,
)
from app.core.wellbeing.models import HandwritingSample, WellbeingConsent
from app.core.gs_lms.models import GsLmsAnswerSheetImage


# ---------------------------------------------------------------------------
# Synthetic pages
# ---------------------------------------------------------------------------
def page(
    slant=0.0, size=34, spacing=None, stroke=3, lines=8, words=6, W=1200, H=1600,
    seed=1, blur=0.0, fmt="PNG",
) -> bytes:
    """Rows of stem-and-bowl glyphs; ``slant`` shears the page (deg, + = right)."""
    rng = random.Random(seed)
    spacing = spacing or int(size * 2.2)
    img = Image.new("L", (W, H), 235)
    d = ImageDraw.Draw(img)
    y = 150
    for _ in range(lines):
        x = 120
        for _ in range(words):
            for _ in range(rng.randint(3, 6)):
                d.line([(x, y), (x, y + size)], fill=20, width=stroke)
                d.ellipse([x, y + size * 0.35, x + size * 0.45, y + size], outline=20, width=stroke)
                x += int(size * 0.7)
            x += int(size * 0.9)
            if x > W - 250:
                break
        y += spacing
    if slant:
        t = math.tan(math.radians(slant))
        img = img.transform(
            img.size, Image.AFFINE, (1, t, -H / 2 * t, 0, 1, 0),
            resample=Image.BILINEAR, fillcolor=235,
        )
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    buf = io.BytesIO()
    img.convert("RGB").save(buf, fmt)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# 1. Feature extraction
# ---------------------------------------------------------------------------
def test_good_page_is_usable_with_all_features():
    r = extract_features(page())
    assert r.usable and r.quality == 1.0 and r.reasons == []
    assert r.algorithm_version == ALGORITHM_VERSION
    assert r.features["lines_detected"] == 8
    for name in ("slant_deg", "letter_height_rel", "line_spacing_rel", "baseline_slope_deg",
                 "baseline_wobble", "stroke_width_rel", "word_gap_rel", "ink_density"):
        assert r.features[name] is not None


def test_more_shear_gives_larger_absolute_slant():
    slants = [extract_features(page(slant=s)).features["slant_deg"] for s in (0, 10, 20)]
    assert slants[0] < slants[1] < slants[2]
    left = extract_features(page(slant=-15)).features["slant_deg"]
    assert left < -10 and abs(left) > abs(slants[0])


def test_bigger_letters_larger_letter_height():
    small = extract_features(page(size=24)).features["letter_height_rel"]
    big = extract_features(page(size=48)).features["letter_height_rel"]
    assert big > small * 1.5


def test_wider_stroke_larger_stroke_width():
    thin = extract_features(page(stroke=2)).features["stroke_width_rel"]
    thick = extract_features(page(stroke=7)).features["stroke_width_rel"]
    assert thick > thin * 2


def test_more_line_spacing_larger_line_spacing():
    tight = extract_features(page(spacing=62)).features["line_spacing_rel"]
    wide = extract_features(page(spacing=110)).features["line_spacing_rel"]
    assert wide > tight * 1.4


def test_features_are_scale_normalised():
    a = extract_features(page(W=1200, H=1600)).features
    b = extract_features(page(W=1200, H=1600)).features  # deterministic
    assert a == b
    # same page photographed at half the pixel size: ratios stay close
    img = Image.open(io.BytesIO(page())).resize((600, 800), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    h = extract_features(buf.getvalue()).features
    assert h["line_spacing_rel"] == pytest.approx(a["line_spacing_rel"], rel=0.15)
    assert h["letter_height_rel"] == pytest.approx(a["letter_height_rel"], rel=0.2)


@pytest.mark.parametrize(
    "make,reason",
    [
        (lambda: Image.new("L", (1000, 1400), 240), "too_little_ink"),
        (lambda: Image.new("L", (1000, 1400), 0), "low_contrast"),
        (lambda: Image.new("L", (30, 30), 200), "image_too_small"),
        (lambda: Image.new("L", (1, 1), 0), "image_too_small"),
    ],
)
def test_bad_images_are_flagged_not_crashed(make, reason):
    buf = io.BytesIO()
    make().save(buf, "PNG")
    r = extract_features(buf.getvalue())
    assert not r.usable and reason in r.reasons


def test_random_noise_is_unusable():
    rng = random.Random(3)
    img = Image.new("L", (1000, 1400))
    img.putdata([rng.choice((0, 255)) for _ in range(1000 * 1400)])
    buf = io.BytesIO()
    img.save(buf, "PNG")
    assert not extract_features(buf.getvalue()).usable


def test_few_lines_and_blur_lower_quality():
    few = extract_features(page(lines=2))
    assert not few.usable and "too_few_lines" in few.reasons
    blurry = extract_features(page(blur=6))
    assert not blurry.usable and "too_blurry" in blurry.reasons


def test_page_with_alpha_and_jpeg_work():
    assert extract_features(page(fmt="JPEG")).usable


@pytest.mark.parametrize("data", [b"", b"not an image", b"\x89PNG\r\n\x1a\n garbage", b"\xff\xd8\xff"])
def test_garbage_bytes_raise_specific_error(data):
    with pytest.raises(HandwritingImageError):
        extract_features(data)


# ---------------------------------------------------------------------------
# 2. Trend rules (synthetic feature rows)
# ---------------------------------------------------------------------------
T0 = datetime(2026, 1, 1, 9)
BASE = {
    "slant_deg": 8.0, "letter_height_rel": 0.03, "line_spacing_rel": 2.0,
    "baseline_slope_deg": 1.0, "baseline_wobble": 0.1, "stroke_width_rel": 0.12,
    "word_gap_rel": 1.0,
}


def _jitter(rng, feats, scale=0.02):
    return {k: v * (1 + rng.uniform(-scale, scale)) for k, v in feats.items()}


def _series(n, start_day=0, step_days=2, shift=None, seed=0, scale=0.02):
    rng = random.Random(seed)
    out = []
    for i in range(n):
        f = _jitter(rng, BASE, scale)
        if shift:
            f = {k: v + shift.get(k, 0.0) for k, v in f.items()}
        out.append(trend.TrendSample(T0 + timedelta(days=start_day + i * step_days), f))
    return out


BIG_SHIFT = {"letter_height_rel": -0.012, "stroke_width_rel": -0.09, "slant_deg": 8.0}


def test_not_enough_data_reports_what_is_missing():
    r = trend.compute_trend(_series(3))
    assert r["status"] == "not_enough_data"
    assert r["needs_more_samples"] == 2 and r["days_needed"] > 0
    r = trend.compute_trend([])
    assert r["status"] == "not_enough_data" and r["needs_more_samples"] == 5


def test_five_samples_in_one_day_still_need_a_week():
    s = [trend.TrendSample(T0 + timedelta(hours=i), BASE) for i in range(8)]
    r = trend.compute_trend(s)
    assert r["status"] == "not_enough_data" and r["days_needed"] >= 6


def test_baseline_set_but_too_few_recent():
    r = trend.compute_trend(_series(5 + 1))
    assert r["status"] == "not_enough_data" and r["needs_more_samples"] == 2


def test_steady_with_noise():
    r = trend.compute_trend(_series(14, seed=4, scale=0.03))
    assert r["status"] == "steady"
    assert r["message"] == "Your handwriting looks like your usual handwriting."
    assert r["changed_features"] == []
    assert set(r["series"]) == set(trend.TREND_FEATURES)


def test_real_change_in_several_features_is_reported_in_plain_words():
    s = _series(6, seed=1) + _series(5, start_day=30, shift=BIG_SHIFT, seed=2)
    r = trend.compute_trend(s)
    assert r["status"] == "changed"
    phrases = [c["phrase"] for c in r["changed_features"]]
    assert "smaller letters" in phrases and "thinner strokes" in phrases
    assert r["message"].startswith("Your last few answers look different from your usual handwriting (")
    assert "tired, rushed or under pressure" in r["message"]


def test_one_changed_feature_is_not_enough():
    s = _series(6, seed=1) + _series(5, start_day=30, shift={"letter_height_rel": -0.015}, seed=2)
    r = trend.compute_trend(s)
    assert r["status"] == "steady"


def test_single_outlier_sample_does_not_trigger():
    s = _series(6, seed=1) + _series(5, start_day=30, seed=2)
    s[-1] = trend.TrendSample(s[-1].captured_at, {k: v + BIG_SHIFT.get(k, 0) for k, v in BASE.items()})
    assert trend.compute_trend(s)["status"] == "steady"


def test_change_in_only_two_recent_samples_is_not_consistent():
    s = _series(6, seed=1) + _series(5, start_day=30, seed=2)
    for i in (-1, -2):
        s[i] = trend.TrendSample(s[i].captured_at, {k: v + BIG_SHIFT.get(k, 0) for k, v in BASE.items()})
    assert trend.compute_trend(s)["status"] == "steady"


def test_unusable_and_other_version_samples_are_ignored():
    s = _series(6, seed=1) + _series(5, start_day=30, shift=BIG_SHIFT, seed=2)
    for x in s[-5:]:
        x.usable = False
    r = trend.compute_trend(s)
    assert r["samples_total"] == 11 and r["samples_usable"] == 6
    s2 = _series(12, seed=1)
    for x in s2:
        x.algorithm_version = "old"
    assert trend.compute_trend(s2)["samples_total"] == 0


def test_flat_baseline_does_not_divide_by_zero():
    flat = [trend.TrendSample(T0 + timedelta(days=2 * i), dict(BASE)) for i in range(8)]
    r = trend.compute_trend(flat)
    assert r["status"] == "steady"


# ---------------------------------------------------------------------------
# 3. Storage + API
# ---------------------------------------------------------------------------
BASE_URL = "/api/v1/gs-lms"
HW = f"{BASE_URL}/wellbeing/handwriting"


class _User:
    def __init__(self, uid):
        self.id, self.role = uid, ""


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:", future=True,
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    prefixes = ("gs_lms_", "gs_subjects", "gs_wellbeing", "users", "job_execution_registry")
    Base.metadata.create_all(
        engine, tables=[t for n, t in Base.metadata.tables.items() if n.startswith(prefixes)]
    )
    s = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    yield s
    s.close()
    engine.dispose()


@pytest.fixture()
def who():
    return {"user": _User(1)}


@pytest.fixture()
def client(db_session, who, tmp_path, monkeypatch):
    monkeypatch.setenv("MEDIA_STORE_BACKEND", "local")
    monkeypatch.setenv("MEDIA_STORE_DIR", str(tmp_path))
    from app.api.dependencies import get_current_user
    from app.db.session import get_db
    import app.main as main

    def _db():
        yield db_session

    main.app.dependency_overrides[get_db] = _db
    main.app.dependency_overrides[get_current_user] = lambda: who["user"]
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def _upload(client, order=1, content=None, attempt_id=None):
    if attempt_id is None:
        r = client.post(f"{BASE_URL}/geography/answers/handwritten", json={"question_text": "Q?"})
        attempt_id = r.json()["data"]["attempt_id"]
    r = client.post(
        f"{BASE_URL}/geography/answers/{attempt_id}/pages",
        files={"image": ("p.png", content or page(), "image/png")},
        data={"page_order": str(order), "ocr_text": "typed text"},
    )
    return attempt_id, r


def _samples(db, uid=1):
    return db.query(HandwritingSample).filter_by(user_id=uid).all()


def test_default_is_off_and_upload_creates_nothing(client, db_session):
    d = client.get(HW).json()["data"]
    assert d["consent"] is False and d["status"] == "off" and d["disclaimer"]
    _, r = _upload(client)
    assert r.status_code == 200
    assert _samples(db_session) == []


def test_consent_on_creates_sample_and_retake_replaces_it(client, db_session):
    assert client.put(f"{HW}/consent", json={"consent": True}).json()["data"]["consent"] is True
    attempt_id, r = _upload(client)
    assert r.status_code == 200
    rows = _samples(db_session)
    assert len(rows) == 1 and rows[0].usable and rows[0].features["lines_detected"] == 8
    assert rows[0].algorithm_version == ALGORITHM_VERSION
    _upload(client, content=page(size=50), attempt_id=attempt_id)  # retake of page 1
    rows = _samples(db_session)
    assert len(rows) == 1 and rows[0].features["letter_height_rel"] > 0.04
    d = client.get(HW).json()["data"]
    assert d["samples_total"] == 1 and d["status"] == "not_enough_data"
    assert d["series"]["letter_height_rel"][0]["captured_at"].endswith("Z")


def test_upload_succeeds_when_extraction_raises(client, db_session, monkeypatch):
    client.put(f"{HW}/consent", json={"consent": True})

    def boom(_):
        raise RuntimeError("secret image text")

    monkeypatch.setattr("app.core.wellbeing.service.extract_features", boom)
    _, r = _upload(client)
    assert r.status_code == 200 and _samples(db_session) == []


def test_upload_succeeds_when_saving_the_sample_fails(client, db_session, monkeypatch):
    client.put(f"{HW}/consent", json={"consent": True})

    def boom(*a, **k):
        raise RuntimeError("db down")

    monkeypatch.setattr("app.core.wellbeing.service.upsert_sample", boom)
    _, r = _upload(client)
    assert r.status_code == 200 and r.json()["data"]["page_order"] == 1


def test_non_image_upload_with_consent_is_still_stored(client, db_session):
    client.put(f"{HW}/consent", json={"consent": True})
    _, r = _upload(client, content=b"not really an image")
    assert r.status_code == 200 and _samples(db_session) == []


def test_withdrawing_consent_deletes_samples(client, db_session):
    client.put(f"{HW}/consent", json={"consent": True})
    _upload(client)
    assert len(_samples(db_session)) == 1
    d = client.put(f"{HW}/consent", json={"consent": False}).json()["data"]
    assert d["consent"] is False and d["status"] == "off"
    assert _samples(db_session) == []
    assert db_session.query(WellbeingConsent).one().handwriting_consented_at is None


def test_delete_data_keeps_consent(client, db_session):
    client.put(f"{HW}/consent", json={"consent": True})
    _upload(client)
    r = client.delete(f"{HW}/data").json()["data"]
    assert r["deleted_samples"] == 1 and r["consent"] is True
    assert _samples(db_session) == []
    _upload(client, order=2)  # still opted in
    assert len(_samples(db_session)) == 1


def test_other_student_sees_nothing_and_cannot_delete(client, db_session, who):
    client.put(f"{HW}/consent", json={"consent": True})
    _upload(client)
    who["user"] = _User(2)
    d = client.get(HW).json()["data"]
    assert d["consent"] is False and d["samples_total"] == 0
    client.put(f"{HW}/consent", json={"consent": True})
    d = client.get(HW).json()["data"]
    assert d["samples_total"] == 0
    client.delete(f"{HW}/data")
    client.put(f"{HW}/consent", json={"consent": False})
    assert len(_samples(db_session, 1)) == 1


def test_samples_survive_image_deletion(client, db_session):
    client.put(f"{HW}/consent", json={"consent": True})
    attempt_id, _ = _upload(client)
    assert client.delete(f"{BASE_URL}/geography/answers/{attempt_id}/pages").status_code == 200
    assert len(_samples(db_session)) == 1


def test_consent_backfills_recent_stored_images(client, db_session):
    attempt_id, _ = _upload(client)  # uploaded before opting in
    assert _samples(db_session) == []
    d = client.put(f"{HW}/consent", json={"consent": True}).json()["data"]
    rows = _samples(db_session)
    assert len(rows) == 1 and d["samples_total"] == 1
    img = db_session.query(GsLmsAnswerSheetImage).one()
    assert rows[0].answer_image_id == img.id
    # idempotent
    counts = wb_service.backfill_user(db_session, __import__(
        "app.core.gs_lms.evaluation.service", fromlist=["x"]).get_media_store(), 1)
    assert counts["candidates"] == 0


def test_backfill_cli_skips_users_without_consent(db_session, monkeypatch, capsys, tmp_path):
    from app.core.wellbeing import backfill as cli
    import app.db.session as sess

    monkeypatch.setenv("MEDIA_STORE_BACKEND", "memory")
    monkeypatch.setattr(sess, "SessionLocal", lambda: db_session)
    monkeypatch.setattr(db_session, "close", lambda: None)
    db_session.add(WellbeingConsent(user_id=7, handwriting_insights=False))
    db_session.commit()
    assert cli.main(["--dry-run"]) == 0
    assert "students=0" in capsys.readouterr().out

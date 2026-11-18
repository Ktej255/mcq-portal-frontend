"""Hermetic tests for the Current Affairs authoring seeder.

The seeder is the only path that turns authored JSON into CA rows, so these
tests pin the two promises the content file makes to reviewers: nothing reaches
a learner without a human publishing it, and nothing enters the review queue
without a citation and a valid taxonomy. Runs entirely on in-memory SQLite.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.core.current_affairs import ca_models

BACKEND_ROOT = Path(__file__).resolve().parents[2]
SEEDER_PATH = BACKEND_ROOT / "scripts" / "seed_current_affairs.py"
CONTENT_PATH = BACKEND_ROOT / "content" / "current_affairs" / "items.json"


def _load_seeder():
    spec = importlib.util.spec_from_file_location("seed_current_affairs", SEEDER_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


seeder = _load_seeder()

TABLES = [
    ca_models.CAItem.__table__,
    ca_models.CAMcq.__table__,
    ca_models.CAMainsQuestion.__table__,
    ca_models.CAAuditLog.__table__,
]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _content_document() -> dict:
    return json.loads(CONTENT_PATH.read_text(encoding="utf-8"))


def _valid_item() -> dict:
    return _content_document()["items"][0]


def test_authored_content_file_is_valid_and_cited():
    document = _content_document()
    items = document["items"]
    assert items, "the content file must carry at least one authored item"
    errors = [error for index, item in enumerate(items) for error in seeder.validate_item(item, index)]
    assert errors == []
    for item in items:
        source_blocks = [block for block in item["content_blocks"] if block.get("type") == "source"]
        assert any("http" in block["text"] for block in source_blocks)


def test_seeding_writes_drafts_with_mcqs_and_mains(db):
    result = seeder.seed_items(db, [_valid_item()])
    assert result["blocked"] == []
    assert len(result["created"]) == 1

    items = list(db.scalars(select(ca_models.CAItem)))
    assert len(items) == 1
    assert items[0].review_status == "DRAFT"
    assert items[0].is_deleted is False
    assert items[0].created_by == "seed_current_affairs"

    mcqs = list(db.scalars(select(ca_models.CAMcq).where(ca_models.CAMcq.ca_item_id == items[0].id)))
    mains = list(db.scalars(select(ca_models.CAMainsQuestion).where(ca_models.CAMainsQuestion.ca_item_id == items[0].id)))
    assert mcqs and mains
    assert all(mcq.options and mcq.correct_answer for mcq in mcqs)
    assert all(10 <= question.marks <= 15 and 150 <= question.word_limit <= 250 for question in mains)


def test_seeding_is_idempotent(db):
    item = _valid_item()
    first = seeder.seed_items(db, [item])
    second = seeder.seed_items(db, [item])
    assert len(first["created"]) == 1
    assert second["created"] == []
    assert len(second["skipped"]) == 1
    assert len(list(db.scalars(select(ca_models.CAItem)))) == 1


def test_invalid_taxonomy_is_blocked_and_nothing_is_written(db):
    item = dict(_valid_item())
    item["subject"] = "polity-governance"
    item["gs_paper"] = "GS9"

    errors = seeder.validate_item(item, 0)
    assert any("subject" in error for error in errors)
    assert any("gs_paper" in error for error in errors)

    result = seeder.seed_items(db, [item])
    assert result["created"] == []
    assert result["blocked"]
    assert list(db.scalars(select(ca_models.CAItem))) == []


def test_answer_must_match_an_option_label(db):
    item = json.loads(json.dumps(_valid_item()))
    item["mcqs"][0]["correct_answer"] = "E"

    errors = seeder.validate_item(item, 0)
    assert any("correct_answer" in error for error in errors)
    assert seeder.seed_items(db, [item])["created"] == []


def test_uncited_and_self_publishing_items_are_rejected(db):
    uncited = json.loads(json.dumps(_valid_item()))
    uncited["content_blocks"] = [block for block in uncited["content_blocks"] if block.get("type") != "source"]
    assert any("source block" in error for error in seeder.validate_item(uncited, 0))

    self_publishing = json.loads(json.dumps(_valid_item()))
    self_publishing["review_status"] = "PUBLISHED"
    assert any("review_status" in error for error in seeder.validate_item(self_publishing, 0))

    assert seeder.seed_items(db, [uncited, self_publishing])["created"] == []
    assert list(db.scalars(select(ca_models.CAItem))) == []

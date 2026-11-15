"""Focused regression for subject ownership on persisted recall reads."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.v1.gs_lms.recall import get_recall_attempt
from app.core.gs.models import GsSubject
from app.models.domain import RoleEnum


class FakeUser:
    id = 1
    email = "recall@test.local"
    role = RoleEnum.STUDENT


class MissingNodeQuery:
    def filter(self, *args, **kwargs):
        return self

    def one_or_none(self):
        return None


class MissingNodeDb:
    def query(self, model):
        return MissingNodeQuery()


def test_recall_read_rejects_node_owned_by_another_subject():
    geography = GsSubject(id=1, slug="geography", name="Geography", display_order=1)
    with pytest.raises(HTTPException) as error:
        get_recall_attempt(
            100, "BASIC", subject=geography, current_user=FakeUser(), db=MissingNodeDb()
        )
    assert error.value.status_code == 404
    assert error.value.detail == "Topic node not found"

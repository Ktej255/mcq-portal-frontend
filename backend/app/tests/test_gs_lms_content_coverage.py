"""Operator content-coverage audit for the GS LMS.

The audit must mirror the learner's real gates:

* only REVIEWED sections are served,
* only REVIEWED PYQs on REVIEWED topics measure demand,
* the MCQ Lab opens at 15 REVIEWED questions.

It must also stay admin-only and distinguish a hidden (unreviewed) topic from
a topic that is live but shallow.
"""

from __future__ import annotations

from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsExamTypeEnum,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User

ADMIN_ID = 1
STUDENT_ID = 2
SUBJECT_ID = 1
COMPLETE_NODE = 1
LEGACY_NODE = 2
HIDDEN_NODE = 3

COVERAGE_URL = "/api/v1/admin/gs-lms/content-coverage/geography"


def _user(user_id: int, role: RoleEnum) -> User:
    return User(
        id=user_id,
        google_uid=f"coverage-{user_id}",
        email=f"coverage-{user_id}@test.local",
        full_name="Coverage Tester",
        role=role,
    )


def _section(
    node_id: int,
    label: GsLmsSectionLabelEnum,
    order: int,
    *,
    reviewed: bool = True,
) -> GsLmsContentSection:
    return GsLmsContentSection(
        syllabus_node_id=node_id,
        section_label=label,
        title=f"{label.value.title()} section",
        blocks=[{"type": "paragraph", "content": "Body"}],
        display_order=order,
        authored=True,
        review_status=(
            GsReviewStatusEnum.REVIEWED
            if reviewed
            else GsReviewStatusEnum.UNREVIEWED
        ),
    )


def _pyq(
    node_id: int,
    exam_type: GsLmsExamTypeEnum,
    *,
    reviewed: bool = True,
) -> GsLmsPyq:
    return GsLmsPyq(
        subject_id=SUBJECT_ID,
        syllabus_node_id=node_id,
        exam_type=exam_type,
        year=2024,
        question_text="Previous year question",
        answer_text="Answer",
        review_status=(
            GsReviewStatusEnum.REVIEWED
            if reviewed
            else GsReviewStatusEnum.UNREVIEWED
        ),
    )


def _mcq(
    node_id: int,
    order: int,
    question_type: GsLmsQuestionTypeEnum,
    *,
    reviewed: bool = True,
) -> GsLmsMcqQuestion:
    return GsLmsMcqQuestion(
        syllabus_node_id=node_id,
        question_text=f"Question {order}",
        options=[
            {"label": "A", "text": "Correct"},
            {"label": "B", "text": "Incorrect"},
        ],
        correct_option="A",
        explanation="Because.",
        question_type=question_type,
        display_order=order,
        review_status=(
            GsReviewStatusEnum.REVIEWED
            if reviewed
            else GsReviewStatusEnum.UNREVIEWED
        ),
    )


@pytest.fixture()
def coverage_db() -> Iterator[Session]:
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name
        in {
            "institutions",
            "users",
            "gs_subjects",
            "gs_day_lessons",
            "gs_lms_syllabus_nodes",
            "gs_lms_content_sections",
            "gs_lms_pyqs",
            "gs_lms_mcq_questions",
        }
    ]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestSession()
    try:
        db.add_all([_user(ADMIN_ID, RoleEnum.ADMIN), _user(STUDENT_ID, RoleEnum.STUDENT)])
        db.add(GsSubject(id=SUBJECT_ID, slug="geography", name="GS Geography", display_order=1))
        db.add_all(
            [
                GsLmsSyllabusNode(
                    id=COMPLETE_NODE,
                    subject_id=SUBJECT_ID,
                    title="Complete Topic",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=1.0,
                    display_order=1,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsSyllabusNode(
                    id=LEGACY_NODE,
                    subject_id=SUBJECT_ID,
                    title="Legacy Four-Section Topic",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=1.0,
                    display_order=2,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsSyllabusNode(
                    id=HIDDEN_NODE,
                    subject_id=SUBJECT_ID,
                    title="Hidden Draft Topic",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=1.0,
                    display_order=3,
                    review_status=GsReviewStatusEnum.UNREVIEWED,
                ),
            ]
        )
        db.flush()

        # Complete topic: five reviewed sections, measured demand, full lab.
        for order, label in enumerate(GsLmsSectionLabelEnum, start=1):
            db.add(_section(COMPLETE_NODE, label, order))
        db.add_all(
            [
                _pyq(COMPLETE_NODE, GsLmsExamTypeEnum.PRELIMS),
                _pyq(COMPLETE_NODE, GsLmsExamTypeEnum.PRELIMS),
                _pyq(COMPLETE_NODE, GsLmsExamTypeEnum.MAINS),
                _pyq(COMPLETE_NODE, GsLmsExamTypeEnum.PRELIMS, reviewed=False),
            ]
        )
        lab_mix = (
            [GsLmsQuestionTypeEnum.STATEMENT_BASED] * 4
            + [GsLmsQuestionTypeEnum.ASSERTION_REASON] * 2
            + [GsLmsQuestionTypeEnum.MATCH_THE_FOLLOWING] * 2
            + [GsLmsQuestionTypeEnum.CAUSE_EFFECT] * 2
            + [GsLmsQuestionTypeEnum.CHRONOLOGICAL] * 2
            + [GsLmsQuestionTypeEnum.FACTUAL] * 2
            + [GsLmsQuestionTypeEnum.MAP_BASED]
        )
        assert len(lab_mix) == 15
        for order, question_type in enumerate(lab_mix, start=1):
            db.add(_mcq(COMPLETE_NODE, order, question_type))

        # Legacy topic: four reviewed sections, a draft current-affairs
        # section, no demand mapping, and a short lab bank.
        for order, label in enumerate(
            [
                GsLmsSectionLabelEnum.BASIC,
                GsLmsSectionLabelEnum.NCERT_LEVEL,
                GsLmsSectionLabelEnum.ADVANCED,
                GsLmsSectionLabelEnum.EXAMINER_TRAPS,
            ],
            start=1,
        ):
            db.add(_section(LEGACY_NODE, label, order))
        db.add(
            _section(
                LEGACY_NODE,
                GsLmsSectionLabelEnum.CURRENT_AFFAIRS,
                5,
                reviewed=False,
            )
        )
        db.add_all(
            [
                _mcq(LEGACY_NODE, 1, GsLmsQuestionTypeEnum.FACTUAL),
                _mcq(LEGACY_NODE, 2, GsLmsQuestionTypeEnum.FACTUAL),
            ]
        )

        # Hidden topic: has assets, but the learner cannot see it at all.
        db.add(_section(HIDDEN_NODE, GsLmsSectionLabelEnum.BASIC, 1))
        db.add(_pyq(HIDDEN_NODE, GsLmsExamTypeEnum.PRELIMS))
        for order in range(1, 16):
            db.add(_mcq(HIDDEN_NODE, order, GsLmsQuestionTypeEnum.FACTUAL))

        db.commit()
    finally:
        db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestSession
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def _client_as(role: RoleEnum) -> TestClient:
    user = _user(ADMIN_ID if role == RoleEnum.ADMIN else STUDENT_ID, role)
    app.dependency_overrides[get_current_user] = lambda: user
    return TestClient(app)


def test_students_cannot_read_operator_coverage(coverage_db) -> None:
    client = _client_as(RoleEnum.STUDENT)
    try:
        response = client.get(COVERAGE_URL)
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403


def test_coverage_mirrors_each_learner_gate(coverage_db) -> None:
    client = _client_as(RoleEnum.ADMIN)
    try:
        response = client.get(COVERAGE_URL)
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["subject"] == "geography"
    assert data["mcq_lab_min"] == 15
    assert data["canonical_sections"] == [
        "BASIC",
        "NCERT_LEVEL",
        "ADVANCED",
        "CURRENT_AFFAIRS",
        "EXAMINER_TRAPS",
    ]

    topics = {row["node_id"]: row for row in data["topics"]}
    complete = topics[COMPLETE_NODE]
    assert complete["learner_ready"] is True
    assert complete["blockers"] == []
    assert complete["sections_reviewed"] == 5
    assert complete["missing_sections"] == []
    # The unreviewed PYQ must not count toward demand.
    assert complete["pyqs_reviewed"] == 3
    assert complete["prelims_pyqs_reviewed"] == 2
    assert complete["mains_pyqs_reviewed"] == 1
    assert complete["mcqs_reviewed"] == 15
    assert complete["mcq_types"] == {
        "ASSERTION_REASON": 2,
        "CAUSE_EFFECT": 2,
        "CHRONOLOGICAL": 2,
        "FACTUAL": 2,
        "MAP_BASED": 1,
        "MATCH_THE_FOLLOWING": 2,
        "STATEMENT_BASED": 4,
    }

    legacy = topics[LEGACY_NODE]
    assert legacy["learner_ready"] is False
    assert legacy["content_open"] is True
    assert legacy["full_depth"] is False
    assert legacy["missing_sections"] == ["CURRENT_AFFAIRS"]
    assert legacy["sections_unreviewed"] == 1
    assert legacy["demand_measured"] is False
    assert legacy["lab_open"] is False
    assert legacy["mcqs_reviewed"] == 2
    assert set(legacy["blockers"]) == {
        "SECTION_GAP",
        "UNREVIEWED_SECTIONS",
        "DEMAND_UNMAPPED",
        "MCQ_LAB_SHORT",
    }

    hidden = topics[HIDDEN_NODE]
    assert hidden["topic_reviewed"] is False
    assert hidden["content_open"] is False
    assert hidden["learner_ready"] is False
    assert "TOPIC_UNREVIEWED" in hidden["blockers"]
    assert "CONTENT_MISSING" in hidden["blockers"]

    totals = data["totals"]
    assert totals["topics"] == 3
    assert totals["topics_hidden"] == 1
    assert totals["learner_ready"] == 1
    assert totals["content_open"] == 2
    assert totals["demand_measured"] == 1
    assert totals["lab_open"] == 1
    assert totals["full_depth"] == 1
    assert totals["sections_reviewed"] == 10
    assert totals["sections_expected"] == 15
    assert totals["pyqs_reviewed"] == 4
    assert totals["mcqs_reviewed"] == 32
    assert totals["blocker_counts"] == {
        "DEMAND_UNMAPPED": 2,
        "MCQ_LAB_SHORT": 2,
        "SECTION_GAP": 1,
        "TOPIC_UNREVIEWED": 1,
        "CONTENT_MISSING": 1,
        "UNREVIEWED_SECTIONS": 1,
    }


def test_unknown_subject_is_404(coverage_db) -> None:
    client = _client_as(RoleEnum.ADMIN)
    try:
        response = client.get("/api/v1/admin/gs-lms/content-coverage/astrology")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 404

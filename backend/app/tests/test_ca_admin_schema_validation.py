"""The admin Current Affairs API must refuse the taxonomy the learner surfaces cannot use.

The one soft-deleted ``polity-governance`` / ``GS-II`` row in the local database got
there because ``subject``, ``gs_paper``, ``exam_relevance`` and ``source_authority``
were free strings on the create/update schemas, and because a malformed
``publish_date`` reached ``date.fromisoformat`` inside the handler (a 500 rather than
a rejection). These tests pin the schema-level rules, and pin that they agree with
the same enums the authoring seeder validates against.
"""

from __future__ import annotations

import pytest

from app.api.v1.admin.ca_items import (
    CAItemCreateIn,
    CAItemUpdateIn,
    MCQCreateIn,
    MainsCreateIn,
    _TAXONOMY_ENUMS,
)
from app.core.current_affairs.ca_engine import (
    CASubject,
    ExamRelevance,
    GSPaper,
    SourceAuthority,
)


def _payload(**overrides):
    base = {
        "title": "Repo rate moves to 5.50 per cent",
        "publish_date": "2026-10-07",
        "subject": "economy",
        "gs_paper": "GS3",
        "exam_relevance": "both",
        "source_authority": "official",
        "content_blocks": [{"type": "paragraph", "text": "The MPC raised the repo rate."}],
    }
    base.update(overrides)
    return base


def test_the_api_lock_matches_the_seeder_enums():
    assert _TAXONOMY_ENUMS == {
        "subject": CASubject,
        "gs_paper": GSPaper,
        "exam_relevance": ExamRelevance,
        "source_authority": SourceAuthority,
    }


def test_a_valid_authored_shape_is_accepted():
    item = CAItemCreateIn(**_payload())
    assert item.subject == "economy"
    assert item.source_authority == "official"


@pytest.mark.parametrize(
    "field, bad_value",
    [
        ("subject", "polity-governance"),
        ("subject", "Geography"),
        ("gs_paper", "GS-II"),
        ("gs_paper", "GS9"),
        ("exam_relevance", "interview"),
        ("source_authority", "blog"),
    ],
)
def test_invalid_taxonomy_is_rejected_before_it_can_be_written(field, bad_value):
    with pytest.raises(ValueError) as excinfo:
        CAItemCreateIn(**_payload(**{field: bad_value}))
    assert field in str(excinfo.value)


def test_secondary_subjects_use_the_same_taxonomy():
    CAItemCreateIn(**_payload(secondary_subjects=["polity", "environment"]))
    with pytest.raises(ValueError):
        CAItemCreateIn(**_payload(secondary_subjects=["polity-governance"]))


def test_a_non_iso_publish_date_is_a_validation_error_not_a_crash():
    with pytest.raises(ValueError):
        CAItemCreateIn(**_payload(publish_date="07/10/2026"))
    with pytest.raises(ValueError):
        CAItemUpdateIn(publish_date="last Tuesday")


def test_update_schemas_refuse_an_unknown_subject():
    with pytest.raises(ValueError):
        CAItemUpdateIn(subject="economics")
    assert CAItemUpdateIn(subject="economy").subject == "economy"


def test_the_legacy_row_could_not_be_created_today():
    """The exact combination found in the database stays un-writable."""
    with pytest.raises(ValueError):
        CAItemCreateIn(
            **_payload(title="Legacy artifact", subject="polity-governance", gs_paper="GS-II")
        )


def test_mcq_correct_answer_must_match_an_option_label():
    good = {
        "question_text": "Which body decides the policy repo rate?",
        "question_type": "DIRECT_RECALL",
        "options": [
            {"label": "A", "text": "The Central Board of Directors"},
            {"label": "B", "text": "The Monetary Policy Committee"},
        ],
        "correct_answer": "B",
    }
    MCQCreateIn(**good)
    with pytest.raises(ValueError):
        MCQCreateIn(**{**good, "correct_answer": "E"})
    with pytest.raises(ValueError):
        MCQCreateIn(**{**good, "options": [{"label": "A", "text": ""}]})
    with pytest.raises(ValueError):
        MCQCreateIn(
            **{
                **good,
                "options": [
                    {"label": "A", "text": "First"},
                    {"label": "a", "text": "Duplicate label"},
                ],
            }
        )


def test_mains_paper_and_limits_are_validated():
    MainsCreateIn(question_text="Discuss transmission.", gs_paper="GS3", marks=15, word_limit=250)
    with pytest.raises(ValueError):
        MainsCreateIn(question_text="x", gs_paper="GS-II", marks=10, word_limit=150)
    with pytest.raises(ValueError):
        MainsCreateIn(question_text="x", gs_paper="GS3", marks=20, word_limit=150)

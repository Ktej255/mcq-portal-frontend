"""Operator endpoint to load the reviewed Geography content.

A new database has the tables and no content. Loading it used to need a
developer with the database password running a script. This lets an operator
do it from the admin console once the backend is deployed.

Admin-only. Safe to run again: content is matched and updated in place and
no learner row is deleted (see ``app.core.gs_lms.content_loader``).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.content_loader import GEOGRAPHY_SLUG, load_geography_content
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(get_current_admin)])


def _geography_counts(db: Session) -> dict:
    """What a student can currently see for Geography."""
    subject = db.query(GsSubject).filter(GsSubject.slug == GEOGRAPHY_SLUG).one_or_none()
    if subject is None:
        return {"loaded": False, "topics": 0, "topics_visible": 0, "sections": 0, "mcqs": 0, "pyqs": 0}

    nodes = db.query(GsLmsSyllabusNode.id).filter(GsLmsSyllabusNode.subject_id == subject.id)
    leaf = nodes.filter(GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC)
    node_ids = nodes.subquery()

    def count(model, column):
        return db.query(func.count(model.id)).filter(column.in_(db.query(node_ids.c.id))).scalar() or 0

    sections = count(GsLmsContentSection, GsLmsContentSection.syllabus_node_id)
    return {
        "loaded": sections > 0,
        "topics": leaf.count(),
        "topics_visible": leaf.filter(
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED
        ).count(),
        "sections": sections,
        "mcqs": count(GsLmsMcqQuestion, GsLmsMcqQuestion.syllabus_node_id),
        "pyqs": count(GsLmsPyq, GsLmsPyq.syllabus_node_id),
    }


@router.get("", response_model=StandardResponse[dict])
def geography_content_status(db: Session = Depends(get_db)):
    return StandardResponse(success=True, message="Geography content status", data=_geography_counts(db))


@router.post("", response_model=StandardResponse[dict])
def load_geography(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    logger.info("Geography content load started by admin id=%s", admin.id)
    try:
        result = load_geography_content(db)
        db.commit()
    except Exception as exc:
        db.rollback()
        # Type only: driver messages can carry connection details.
        logger.error("Geography content load failed (%s); rolled back", type(exc).__name__)
        raise HTTPException(
            status_code=500,
            detail={
                "code": "CONTENT_LOAD_FAILED",
                "message": "The content could not be loaded. Nothing was changed.",
            },
        ) from None
    logger.info("Geography content load finished: %s", result)
    return StandardResponse(
        success=True,
        message="Geography content loaded.",
        data={"result": result, "status": _geography_counts(db)},
    )

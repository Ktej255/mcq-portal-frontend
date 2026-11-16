"""Tables for the opt-in handwriting trend (student-only data).

Consent lives in its own small table rather than on ``GsLmsLearnerProfile``:
``PUT /gs-lms/profile`` replaces the whole profile, so a consent flag there
could be switched off by an unrelated settings save, and a profile row would
have to be created just to hold a flag.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)

from app.db.session import Base


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC like the rest


class WellbeingConsent(Base):
    __tablename__ = "gs_wellbeing_consents"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    handwriting_insights = Column(Boolean, nullable=False, default=False)
    handwriting_consented_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=_now, onupdate=_now)


class HandwritingSample(Base):
    """Numbers measured from one page photo. Never holds the image or its text."""

    __tablename__ = "gs_wellbeing_handwriting_samples"
    __table_args__ = (
        UniqueConstraint("answer_image_id", "algorithm_version", name="uq_wellbeing_hw_image_algo"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    answer_image_id = Column(
        Integer, ForeignKey("gs_lms_answer_sheet_images.id", ondelete="SET NULL"), nullable=True
    )
    captured_at = Column(DateTime, nullable=False, index=True)
    algorithm_version = Column(String(32), nullable=False)
    quality = Column(Float, nullable=False)
    usable = Column(Boolean, nullable=False, default=False)
    features = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=_now)

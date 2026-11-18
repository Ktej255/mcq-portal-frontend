"""Readiness, demand, release, and beta-access persistence.

These tables turn the GS LMS from an accuracy-only practice tracker into a
revision operating system:

* ``gs_lms_demand_weights`` caches the PYQ-derived demand model per topic.
* ``gs_lms_readiness_snapshots`` records one honest readiness estimate per
  learner, subject, and day for trends and operator review.
* ``gs_lms_content_releases`` records which reviewed content is actually
  public, with founder approval.
* ``gs_lms_beta_access`` grants cohort access independently of a public
  payment subscription (used for comps and support accounts).

All tables register on the shared declarative ``Base`` and use the
``gs_lms_`` prefix. Domain isolation is preserved: nothing here imports from
the Optional Subjects platform.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.governance import InstitutionalAuditMixin
from app.db.session import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GsLmsDemandWeight(Base, InstitutionalAuditMixin):
    """Cached demand weight for one reviewed leaf topic.

    ``demand_share`` is the normalised share of the subject's demand and is
    the only value used in gap and readiness arithmetic. ``demand_score`` is a
    display-only 0-100 score where the highest-demand topic is 100.
    """

    __tablename__ = "gs_lms_demand_weights"
    __table_args__ = (
        UniqueConstraint(
            "syllabus_node_id", name="uq_gs_lms_demand_weight_node"
        ),
        Index("ix_gs_lms_demand_subject", "subject_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("gs_subjects.id"), nullable=False, index=True
    )
    syllabus_node_id = Column(
        Integer,
        ForeignKey("gs_lms_syllabus_nodes.id"),
        nullable=False,
        index=True,
    )
    demand_share = Column(Float, nullable=False, default=0.0)
    demand_score = Column(Float, nullable=False, default=0.0)
    pyq_count = Column(Integer, nullable=False, default=0)
    weighted_pyq = Column(Float, nullable=False, default=0.0)
    distinct_years = Column(Integer, nullable=False, default=0)
    last_pyq_year = Column(Integer, nullable=True)
    demand_confidence = Column(Float, nullable=False, default=0.0)
    components = Column(JSON, nullable=True)
    computed_at = Column(DateTime, nullable=False, default=_utcnow)

    subject = relationship("GsSubject")
    syllabus_node = relationship("GsLmsSyllabusNode")


class GsLmsReadinessSnapshot(Base, InstitutionalAuditMixin):
    """One readiness estimate per learner, subject, and day.

    The payload keeps the topic-level rows and assumptions used at computation
    time so a learner, operator, or auditor can reproduce the headline later.
    """

    __tablename__ = "gs_lms_readiness_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "subject_id",
            "snapshot_date",
            name="uq_gs_lms_readiness_snapshot_day",
        ),
        Index(
            "ix_gs_lms_readiness_student_subject_time",
            "student_id",
            "subject_id",
            "computed_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    subject_id = Column(
        Integer, ForeignKey("gs_subjects.id"), nullable=False, index=True
    )
    snapshot_date = Column(Date, nullable=False, index=True)
    computed_at = Column(DateTime, nullable=False, default=_utcnow)
    readiness_score = Column(Float, nullable=False, default=0.0)
    band = Column(String(32), nullable=False, default="INSUFFICIENT_EVIDENCE")
    projected_correct_low = Column(Float, nullable=True)
    projected_correct_expected = Column(Float, nullable=True)
    projected_correct_high = Column(Float, nullable=True)
    projected_net_low = Column(Float, nullable=True)
    projected_net_expected = Column(Float, nullable=True)
    projected_net_high = Column(Float, nullable=True)
    confidence_level = Column(String(16), nullable=False, default="LOW")
    assessed_demand_pct = Column(Float, nullable=False, default=0.0)
    coverage_pct = Column(Float, nullable=False, default=0.0)
    depth_pct = Column(Float, nullable=False, default=0.0)
    payload = Column(JSON, nullable=True)

    student = relationship("User")
    subject = relationship("GsSubject")


class GsLmsContentRelease(Base, InstitutionalAuditMixin):
    """Versioned, founder-approved public content manifest."""

    __tablename__ = "gs_lms_content_releases"
    __table_args__ = (
        UniqueConstraint(
            "subject_id", "version", name="uq_gs_lms_content_release_version"
        ),
        Index("ix_gs_lms_content_release_subject_status", "subject_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("gs_subjects.id"), nullable=False, index=True
    )
    version = Column(String(64), nullable=False)
    status = Column(String(16), nullable=False, default="DRAFT")
    scope = Column(JSON, nullable=True)
    approved_by = Column(String(256), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    subject = relationship("GsSubject")


class GsLmsBetaAccess(Base, InstitutionalAuditMixin):
    """Cohort access that is independent of public payment subscriptions."""

    __tablename__ = "gs_lms_beta_access"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_gs_lms_beta_access_user"),
        Index("ix_gs_lms_beta_access_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    access_type = Column(String(16), nullable=False, default="COMP")
    starts_at = Column(DateTime, nullable=False, default=_utcnow)
    ends_at = Column(DateTime, nullable=True)
    status = Column(String(16), nullable=False, default="ACTIVE")
    reason = Column(String(256), nullable=True)
    created_by = Column(String(256), nullable=True)

    student = relationship("User")


__all__ = [
    "GsLmsDemandWeight",
    "GsLmsReadinessSnapshot",
    "GsLmsContentRelease",
    "GsLmsBetaAccess",
]

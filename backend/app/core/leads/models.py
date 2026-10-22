"""Marketing leads captured on the public site (e.g. the free diagnostic).

Kept in the main database so every lead survives even when the team email
notification is not configured or fails.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Index, Integer, String

from app.db.session import Base


class MarketingLead(Base):
    __tablename__ = "marketing_leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=True)
    email = Column(String(254), nullable=False)
    phone = Column(String(32), nullable=True)
    source = Column(String(40), nullable=False, default="diagnostic")
    # Diagnostic answers: attempt year, stage, hours/day, optional, focus subjects.
    answers = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (Index("ix_marketing_leads_email_source", "email", "source"),)

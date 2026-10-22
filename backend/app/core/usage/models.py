"""Per-user daily usage counters (e.g. MCQs answered today) for plan limits."""

from __future__ import annotations

from sqlalchemy import Column, Date, ForeignKey, Integer, String, UniqueConstraint

from app.db.session import Base


class DailyUsage(Base):
    __tablename__ = "daily_usage"
    __table_args__ = (UniqueConstraint("user_id", "usage_date", "metric", name="uq_daily_usage"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Calendar day in India time, so "per day" matches the student's day.
    usage_date = Column(Date, nullable=False)
    metric = Column(String(40), nullable=False)
    count = Column(Integer, nullable=False, default=0)

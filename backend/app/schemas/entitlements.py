from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Entitlements(BaseModel):
    tier: str
    label: str
    daily_mcq_limit: Optional[int] = None
    daily_ai_minutes: Optional[int] = None
    weak_topic_runs: Optional[int] = None
    optional_subjects: bool
    mains_upload: bool
    unlimited_tests: bool
    all_subjects: bool

    # Filled in by /entitlements/me only (not the public catalogue).
    source: Optional[str] = None  # "admin" | "subscription" | "trial" | "open" | "expired"
    paywall_enabled: Optional[bool] = None
    trial_ends_at: Optional[datetime] = None
    trial_days_left: Optional[int] = None
    mcqs_used_today: Optional[int] = None

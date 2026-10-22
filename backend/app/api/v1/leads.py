"""
Marketing lead capture.

POST /api/v1/leads   Public. Saves a lead from the site (free diagnostic). The
                     same email + source within 24 hours updates the existing
                     row instead of adding a duplicate. Limited per client IP.
GET  /api/v1/leads   Admin only. Newest leads first, paginated.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.core.leads.models import MarketingLead
from app.db.session import get_db
from app.models.domain import User

router = APIRouter()

# Per-IP limit on the public endpoint: enough for a real visitor retrying,
# too few to fill the table with junk.
LEAD_LIMIT_PER_HOUR = 10
_DEDUPE_WINDOW = timedelta(hours=24)
_lock = threading.Lock()
_hits: "defaultdict[str, deque[float]]" = defaultdict(deque)


def reset_lead_rate_limits() -> None:
    """Clear per-IP counters (used by tests)."""
    with _lock:
        _hits.clear()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    with _lock:
        hits = _hits[ip]
        while hits and hits[0] <= now - 3600:
            hits.popleft()
        if len(hits) >= LEAD_LIMIT_PER_HOUR:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many submissions. Try again later.")
        hits.append(now)


class LeadIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=32)
    source: str = Field(default="diagnostic", max_length=40)
    answers: Dict[str, Any] = Field(default_factory=dict)


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    email: str
    phone: Optional[str]
    source: str
    answers: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class LeadPage(BaseModel):
    items: List[LeadOut]
    total: int


def _clean_answers(answers: Dict[str, Any]) -> Dict[str, Any]:
    # Keep the payload small: short scalar values and short string lists only.
    clean: Dict[str, Any] = {}
    for key, value in list(answers.items())[:20]:
        key = str(key)[:40]
        if isinstance(value, (str, int, float, bool)) or value is None:
            clean[key] = value if not isinstance(value, str) else value[:200]
        elif isinstance(value, list):
            clean[key] = [str(v)[:80] for v in value[:20]]
    return clean


@router.post("", status_code=status.HTTP_201_CREATED)
def capture_lead(data: LeadIn, request: Request, db: Session = Depends(get_db)) -> Dict[str, Any]:
    _check_rate_limit(_client_ip(request))

    email = data.email.lower()
    since = datetime.now(timezone.utc) - _DEDUPE_WINDOW
    lead = (
        db.query(MarketingLead)
        .filter(MarketingLead.email == email, MarketingLead.source == data.source, MarketingLead.created_at >= since)
        .order_by(MarketingLead.created_at.desc())
        .first()
    )
    if lead is None:
        lead = MarketingLead(email=email, source=data.source)
        db.add(lead)

    lead.name = (data.name or "").strip() or lead.name
    lead.phone = (data.phone or "").strip() or lead.phone
    lead.answers = _clean_answers(data.answers) or lead.answers
    db.commit()
    db.refresh(lead)
    return {"ok": True, "id": lead.id}


@router.get("", response_model=LeadPage)
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> LeadPage:
    query = db.query(MarketingLead)
    total = query.count()
    rows = (
        query.order_by(MarketingLead.created_at.desc(), MarketingLead.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return LeadPage(items=[LeadOut.model_validate(r) for r in rows], total=total)

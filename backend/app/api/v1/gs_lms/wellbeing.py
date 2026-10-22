"""Opt-in handwriting trend for the student (GS LMS).

Routes (not under a subject; auth-gated at the package router, no paywall):
* GET    /wellbeing/handwriting          — consent, status, message, series
* PUT    /wellbeing/handwriting/consent  — opt in / out (out deletes the samples)
* DELETE /wellbeing/handwriting/data     — delete the samples, keep the consent

Only the signed-in student's own rows are ever read; there is no admin view.
The rules live in ``app.core.wellbeing``.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.gs_lms.evaluation.service import get_media_store
from app.core.wellbeing import service
from app.core.wellbeing.handwriting_trend import DISCLAIMER
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/wellbeing/handwriting")


class ConsentIn(BaseModel):
    consent: bool


def _iso(dt: Any) -> Any:
    return dt.isoformat() + "Z" if dt is not None else None


def _view(db: Session, user_id: int) -> dict:
    consent = service.get_consent(db, user_id)
    on = bool(consent and consent.handwriting_insights)
    out = {
        "consent": on,
        "consented_at": _iso(consent.handwriting_consented_at) if on else None,
        "disclaimer": DISCLAIMER,
    }
    if not on:
        out.update(
            status="off",
            message="Handwriting insights are off.",
            needs_more_samples=0,
            days_needed=0,
            changed_features=[],
            recent_count=0,
            series={},
            samples_total=0,
            samples_usable=0,
            limitations="",
        )
        return out
    trend = service.trend_for_user(db, user_id)
    trend["series"] = {
        f: [{"captured_at": _iso(p["captured_at"]), "value": p["value"]} for p in pts]
        for f, pts in trend["series"].items()
    }
    out.update(trend)
    return out


@router.get("")
def get_handwriting_insights(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    return StandardResponse(
        success=True, message="Handwriting insights", data=_view(db, current_user.id)
    )


@router.put("/consent")
def put_handwriting_consent(
    body: ConsentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Opt in or out. Opting in reads at most the 20 newest stored images."""
    already = service.has_consent(db, current_user.id)
    service.set_consent(db, current_user.id, body.consent)
    if body.consent and not already:
        try:
            service.backfill_user(
                db,
                get_media_store(),
                current_user.id,
                limit=service.CONSENT_BACKFILL_MAX_IMAGES,
                max_seconds=service.CONSENT_BACKFILL_MAX_SECONDS,
            )
        except Exception:  # noqa: BLE001 - the consent itself is already saved
            db.rollback()
    return StandardResponse(
        success=True,
        message="Handwriting insights turned on" if body.consent else "Handwriting insights turned off; your data was deleted",
        data=_view(db, current_user.id),
    )


@router.delete("/data")
def delete_handwriting_data(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    n = service.delete_samples(db, current_user.id)
    data = _view(db, current_user.id)
    data["deleted_samples"] = n
    return StandardResponse(success=True, message="Handwriting data deleted", data=data)

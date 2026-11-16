"""Admin: what students searched for that the GS LMS could not answer.

GET   /admin/gs-lms/content-requests?status=&limit=   most-asked first
PATCH /admin/gs-lms/content-requests/{id}             set status / note

Admin-only through the admin package router (get_current_admin).
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.gs_lms.models import GsLmsContentRequest, GsLmsContentRequestStatusEnum
from app.db.session import get_db
from app.schemas.common import StandardResponse

router = APIRouter()


class ContentRequestOut(BaseModel):
    id: int
    normalized_query: str
    sample_query: str
    subject_slug: Optional[str] = None
    request_count: int
    distinct_students: int
    first_requested_at: Optional[str] = None
    last_requested_at: Optional[str] = None
    status: str
    note: Optional[str] = None


class ContentRequestPatch(BaseModel):
    status: Optional[GsLmsContentRequestStatusEnum] = None
    note: Optional[str] = None


def _out(r: GsLmsContentRequest) -> ContentRequestOut:
    return ContentRequestOut(
        id=r.id, normalized_query=r.normalized_query, sample_query=r.sample_query,
        subject_slug=r.subject_slug, request_count=r.request_count, distinct_students=r.distinct_students,
        first_requested_at=r.first_requested_at.isoformat() if r.first_requested_at else None,
        last_requested_at=r.last_requested_at.isoformat() if r.last_requested_at else None,
        status=r.status.value, note=r.note,
    )


@router.get("/content-requests")
def list_content_requests(
    status_: Optional[GsLmsContentRequestStatusEnum] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Any:
    q = db.query(GsLmsContentRequest)
    if status_ is not None:
        q = q.filter(GsLmsContentRequest.status == status_)
    rows = (
        q.order_by(
            GsLmsContentRequest.distinct_students.desc(),
            GsLmsContentRequest.request_count.desc(),
            GsLmsContentRequest.id,
        )
        .limit(limit)
        .all()
    )
    return StandardResponse(success=True, message="Content requests", data=[_out(r) for r in rows])


@router.patch("/content-requests/{request_id}")
def patch_content_request(
    request_id: int, body: ContentRequestPatch, db: Session = Depends(get_db)
) -> Any:
    row = db.get(GsLmsContentRequest, request_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content request not found")
    fields = body.model_dump(exclude_unset=True) if hasattr(body, "model_dump") else body.dict(exclude_unset=True)
    if "status" in fields and body.status is not None:
        row.status = body.status
    if "note" in fields:
        row.note = body.note
    db.commit()
    db.refresh(row)
    return StandardResponse(success=True, message="Content request updated", data=_out(row))

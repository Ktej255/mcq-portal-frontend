"""Admin Content studio: see what is live, check and import a content file, approve topics.

GET  /admin/gs-lms/content/subjects                        readiness per subject
GET  /admin/gs-lms/content/subjects/{slug}                 readiness per topic
GET  /admin/gs-lms/content/subjects/{slug}/worklist.csv    the same, for a spreadsheet
POST /admin/gs-lms/content/check                           check an uploaded JSON file (writes nothing)
POST /admin/gs-lms/content/import                          import it as draft (UNREVIEWED)
GET  /admin/gs-lms/content/imports?subject=&limit=         recent imports
POST /admin/gs-lms/content/topics/{node_id}/review         approve / un-approve one topic
POST /admin/gs-lms/content/nodes/{node_id}/review          the same for a sub- or mega-topic (every topic under it)

Admin-only through the admin package router (get_current_admin).
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms import content_studio as studio
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.importer import derive_concepts_for_subject, import_gs_subject
from app.core.gs_lms.models import (
    GsLmsContentImport,
    GsLmsNodeTypeEnum,
    GsLmsSyllabusNode,
)
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter()

MAX_UPLOAD_BYTES = 15 * 1024 * 1024


class ReviewBody(BaseModel):
    status: Literal["REVIEWED", "UNREVIEWED"]
    include: list[Literal["topic", "mcqs", "concepts", "versions", "pyqs"]] = list(studio.REVIEW_PARTS)
    # Bulk approve skips topics with gaps unless this is false. Ignored for one topic.
    only_ready: bool = True


def _subject_or_404(db: Session, slug: str) -> GsSubject:
    subject = db.query(GsSubject).filter(GsSubject.slug == slug).one_or_none()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject


# ---------------------------------------------------------------------------
# Readiness
# ---------------------------------------------------------------------------

@router.get("/content/subjects")
def list_subject_readiness(db: Session = Depends(get_db)) -> Any:
    subjects = db.query(GsSubject).order_by(GsSubject.display_order, GsSubject.id).all()
    return StandardResponse(
        success=True, message="Content readiness", data=[studio.subject_readiness(db, s) for s in subjects]
    )


@router.get("/content/subjects/{slug}")
def subject_readiness_detail(slug: str, db: Session = Depends(get_db)) -> Any:
    subject = _subject_or_404(db, slug)
    return StandardResponse(
        success=True,
        message="Content readiness",
        data={"subject": studio.subject_readiness(db, subject), "topics": studio.subject_topics(db, subject)},
    )


@router.get("/content/subjects/{slug}/worklist.csv")
def subject_worklist(slug: str, db: Session = Depends(get_db)) -> Response:
    subject = _subject_or_404(db, slug)
    return Response(
        content=studio.worklist_csv(db, subject),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{subject.slug}-worklist.csv"'},
    )


# ---------------------------------------------------------------------------
# Upload: check, then import as draft
# ---------------------------------------------------------------------------

async def _read_json_upload(file: UploadFile) -> tuple[bytes, dict[str, Any]]:
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"That file is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )
    try:
        data = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"That file is not valid JSON ({exc}). Save it as a .json text file and try again.",
        )
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file must be one JSON object with a subject_slug and a tree.",
        )
    return raw, data


def _find_subject(db: Session, data: dict[str, Any]) -> Optional[GsSubject]:
    slug, subject_id = data.get("subject_slug"), data.get("subject_id")
    query = db.query(GsSubject)
    if isinstance(slug, str) and slug:
        return query.filter(GsSubject.slug == slug).one_or_none()
    if isinstance(subject_id, int) and not isinstance(subject_id, bool):
        return query.filter(GsSubject.id == subject_id).one_or_none()
    return None


def _check_payload(db: Session, data: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
    report = check_subject_content(data)
    subject = _find_subject(db, data)
    errors = list(report.errors)
    if subject is None and not any("subject_slug" in e for e in errors):
        errors.append(
            f'Subject {data.get("subject_slug") or data.get("subject_id")!r} does not exist yet '
            "(it must be one of the subjects already set up)."
        )
    reviewed_now = 0
    if subject is not None:
        reviewed_now = (
            db.query(GsLmsSyllabusNode)
            .filter(
                GsLmsSyllabusNode.subject_id == subject.id,
                GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
                GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .count()
        )
    payload = {
        "subject_slug": subject.slug if subject else data.get("subject_slug"),
        "subject_name": subject.name if subject else None,
        "summary": report.summary(),
        "errors": errors,
        "gaps": list(report.gaps),
        "ok_to_import": not errors,
        "ready": report.ready and not errors,
        # Importing again keeps approvals of unchanged rows; edited rows go back to draft.
        "approved_topics_now": reviewed_now,
    }
    return report, payload


@router.post("/content/check")
async def check_content_file(file: UploadFile = File(...), db: Session = Depends(get_db)) -> Any:
    _, data = await _read_json_upload(file)
    _, payload = _check_payload(db, data)
    return StandardResponse(success=True, message="Checked. Nothing was saved.", data=payload)


@router.post("/content/import")
async def import_content_file(
    file: UploadFile = File(...),
    derive_concepts: bool = Form(False),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    raw, data = await _read_json_upload(file)
    _, check = _check_payload(db, data)
    if check["errors"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "The file has errors, so nothing was imported.", "errors": check["errors"]},
        )
    subject = _find_subject(db, data)
    approved_before = check["approved_topics_now"]
    try:
        result = import_gs_subject(db, data, review_status="UNREVIEWED")
        if derive_concepts:
            result["concepts_derived"] = derive_concepts_for_subject(db, subject.id)
        status_json = dict(subject.completeness_status) if isinstance(subject.completeness_status, dict) else {}
        status_json["imported_at"] = datetime.now(timezone.utc).isoformat()
        subject.completeness_status = status_json
        result["approved_topics_before"] = approved_before
        db.add(
            GsLmsContentImport(
                subject_id=subject.id,
                uploaded_by=getattr(admin, "id", None),
                filename=(file.filename or "content.json")[:255],
                sha256=hashlib.sha256(raw).hexdigest(),
                summary=check["summary"],
                result=result,
            )
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        db.rollback()
        raise
    return StandardResponse(success=True, message="Imported as draft", data={**check, "result": result})


def _import_out(row: GsLmsContentImport, slug: str, uploader: Optional[str]) -> dict[str, Any]:
    return {
        "id": row.id,
        "subject_slug": slug,
        "uploaded_by": row.uploaded_by,
        "uploaded_by_name": uploader,
        "filename": row.filename,
        "sha256": row.sha256,
        "summary": row.summary,
        "result": row.result,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("/content/imports")
def list_imports(
    subject: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Any:
    q = db.query(GsLmsContentImport, GsSubject.slug).join(GsSubject, GsSubject.id == GsLmsContentImport.subject_id)
    if subject:
        q = q.filter(GsSubject.slug == subject)
    rows = q.order_by(GsLmsContentImport.created_at.desc(), GsLmsContentImport.id.desc()).limit(limit).all()
    names = {
        u.id: (u.full_name or u.email)
        for u in db.query(User).filter(User.id.in_({r.uploaded_by for r, _ in rows if r.uploaded_by}))
    } if rows else {}
    return StandardResponse(
        success=True, message="Recent imports",
        data=[_import_out(r, slug, names.get(r.uploaded_by)) for r, slug in rows],
    )


# ---------------------------------------------------------------------------
# Approve / un-approve
# ---------------------------------------------------------------------------

def _review(db: Session, node_id: int, body: ReviewBody, admin: User, *, leaf_only: bool) -> Any:
    node = db.get(GsLmsSyllabusNode, node_id)
    if node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    is_leaf = node.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC
    if leaf_only and not is_leaf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That is a group of topics. Use the bulk approve for it.",
        )
    try:
        result = studio.set_review(
            db, node_id, body.status, include=body.include,
            user_id=getattr(admin, "id", None), only_ready=body.only_ready and not is_leaf,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    verb = "Approved" if body.status == "REVIEWED" else "Moved back to draft:"
    return StandardResponse(success=True, message=f"{verb} {result['topics']} topic(s)", data=result)


@router.post("/content/topics/{node_id}/review")
def review_topic(
    node_id: int, body: ReviewBody, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
) -> Any:
    return _review(db, node_id, body, admin, leaf_only=True)


@router.post("/content/nodes/{node_id}/review")
def review_node(
    node_id: int, body: ReviewBody, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
) -> Any:
    return _review(db, node_id, body, admin, leaf_only=False)

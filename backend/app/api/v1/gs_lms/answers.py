"""Answer-writing + evaluation endpoints for the GS LMS Platform (R9–R18).

Mounted under ``/api/v1/gs-lms/{subject_slug}`` (auth-gated at the package
router). Routes:

* ``POST /answers/typed``            — submit a typed answer; evaluate (R10, R15)
* ``POST /answers/handwritten``      — create a handwritten attempt (R11)
* ``POST /answers/{id}/pages``       — upload a page image (R11, R12)
* ``POST /answers/{id}/pages/{n}/retry-ocr`` — re-run OCR for a failed page
* ``GET  /answers/{id}/pages``       — list stored pages + per-page OCR status
* ``DELETE /answers/{id}/pages``     — student deletes own page images
* ``GET  /answers/capabilities``     — is real OCR / answer checking set up?
* ``POST /answers/{id}/submit``      — confidence-gate + evaluate (R12, R14, R15)
* ``GET  /answers/{id}/status``      — poll the evaluation job (R15)
* ``GET  /answers/{id}/report``      — ownership-scoped report read (R16, R17)
* ``POST /answers/{id}/override``    — evaluator override + audit (R16)
* ``GET  /answers/{id}/pages/{n}``   — access-controlled image fetch (R17)

Isolation: imports the shared evaluation core + GS modules ONLY — never the
Optional domain (Requirement 2 / Property 9).
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import (
    ai_rate_limit,
    get_current_user,
    require_access,
    require_gs_evaluation_available,
    require_ocr_available,
)
from app.core.evaluation.providers import readiness
from app.schemas.common import StandardResponse
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsAnswerModeEnum,
    GsLmsAnswerSheetImage,
    GsLmsEvaluationReport,
    GsLmsExamTypeEnum,
    GsLmsPaperEnum,
    GsLmsPyq,
)
from app.core.gs_lms.evaluation import service as eval_service
from app.api.v1.gs_lms.answer_schemas import (
    GsAnswerAckOut,
    GsAnswerCapabilitiesOut,
    GsAnswerPagesOut,
    GsAnswerStatusOut,
    GsAnswerSubmitIn,
    GsEvaluationReportOut,
    GsEvaluationSectionOut,
    GsOverrideIn,
    GsPageInfoOut,
    GsPageUploadOut,
    GsPagesDeletedOut,
)

router = APIRouter()
logger = logging.getLogger(__name__)

_ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
_MAX_IMAGE_BYTES = int(os.environ.get("GS_ANSWER_IMAGE_MAX_BYTES", str(10 * 1024 * 1024)))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _is_evaluator(user: User) -> bool:
    """Whether the user may override reports (R16.2/R16.6).

    Recognizes common admin/evaluator role markers defensively.
    """
    role = (getattr(user, "role", "") or "").upper()
    if role in {"ADMIN", "EVALUATOR", "FOUNDER", "STAFF"}:
        return True
    return bool(
        getattr(user, "is_admin", False)
        or getattr(user, "is_superuser", False)
        or getattr(user, "is_staff", False)
    )


def _compose_typed_text(payload: GsAnswerSubmitIn) -> str:
    parts = []
    if payload.intro_text and payload.intro_text.strip():
        parts.append(f"Introduction:\n{payload.intro_text.strip()}")
    if payload.body_text and payload.body_text.strip():
        parts.append(f"Body:\n{payload.body_text.strip()}")
    if payload.conclusion_text and payload.conclusion_text.strip():
        parts.append(f"Conclusion:\n{payload.conclusion_text.strip()}")
    if parts:
        return "\n\n".join(parts)
    if payload.raw_text and payload.raw_text.strip():
        return payload.raw_text.strip()
    return ""


def _resolve_pyq_context(
    db: Session, payload_pyq_id: Optional[int]
) -> tuple[Optional[GsLmsPyq], Optional[GsLmsPaperEnum], Optional[int]]:
    if payload_pyq_id is None:
        return None, None, None
    pyq = db.query(GsLmsPyq).filter(GsLmsPyq.id == payload_pyq_id).one_or_none()
    if pyq is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="PYQ not found")
    # Descriptive answer submission is offered only for MAINS PYQs (R9.3/R9.4).
    if pyq.exam_type != GsLmsExamTypeEnum.MAINS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Descriptive answers are only accepted for MAINS questions.",
        )
    return pyq, pyq.gs_paper, pyq.marks


def _paper_enum(value: Optional[str]) -> Optional[GsLmsPaperEnum]:
    if not value:
        return None
    try:
        return GsLmsPaperEnum(value.strip().upper())
    except ValueError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="gs_paper must be one of GS1, GS2, GS3, GS4",
        )


def _report_out(report: GsLmsEvaluationReport) -> GsEvaluationReportOut:
    sections = {}
    for name, value in (report.sections or {}).items():
        if isinstance(value, dict):
            sections[name] = GsEvaluationSectionOut(
                feedback=str(value.get("feedback", "")),
                score=value.get("score"),
            )
    return GsEvaluationReportOut(
        report_id=report.id,
        attempt_id=report.attempt_id,
        sections=sections,
        incomplete_sections=list(report.incomplete_sections or []),
        is_complete=report.is_complete,
        overall_score=report.overall_score,
        marks_awarded=report.marks_awarded,
        max_marks=report.max_marks,
        word_count=getattr(report.attempt, "word_count", None) if report.attempt else None,
        word_limit=getattr(report.attempt, "word_limit", None) if report.attempt else None,
        value_addition=report.value_addition,
        factual_accuracy=report.factual_accuracy,
        overridden=report.overridden_by is not None,
    )


def _own_attempt_or_404(db: Session, attempt_id: int, user: User) -> GsLmsAnswerAttempt:
    attempt = (
        db.query(GsLmsAnswerAttempt)
        .filter(
            GsLmsAnswerAttempt.id == attempt_id,
            GsLmsAnswerAttempt.student_id == user.id,
        )
        .one_or_none()
    )
    if attempt is None:
        # No existence leak for another student's attempt (R17.2).
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Answer attempt not found")
    return attempt


def _page_out(attempt: GsLmsAnswerAttempt, sheet: GsLmsAnswerSheetImage, total: int) -> GsPageUploadOut:
    failed = sheet.ocr_status == "failed"
    return GsPageUploadOut(
        attempt_id=attempt.id,
        image_id=sheet.id,
        page_order=sheet.page_order,
        total_pages=total,
        ocr_status=sheet.ocr_status,
        ocr_text=sheet.ocr_text,
        ocr_confidence=sheet.ocr_confidence,
        retry_possible=failed and bool(sheet.media_ref),
        message=(
            "Page saved, but its handwriting could not be read. "
            "Retry reading it, or type the text for this page."
            if failed
            else None
        ),
    )


def _run_page_ocr(sheet: GsLmsAnswerSheetImage, data: bytes, content_type: Optional[str]) -> None:
    """Run OCR for one page and record the outcome on the row (never raises)."""
    from app.core.evaluation.providers.ocr import get_ocr_provider

    try:
        result = get_ocr_provider().extract(data, mime_type=content_type)
    except Exception as exc:  # noqa: BLE001 - recorded on the page, retry possible
        # Log the error type and ids only: never the image, text or any key.
        logger.warning(
            "OCR failed for answer sheet image id=%s attempt=%s: %s",
            sheet.id, sheet.attempt_id, type(exc).__name__,
        )
        sheet.ocr_status = "failed"
        sheet.ocr_text = None
        sheet.ocr_confidence = None
        return
    sheet.ocr_status = "ok"
    sheet.ocr_text = result.text
    sheet.ocr_confidence = result.confidence


async def _record_handwriting_sample(
    db: Session, user_id: int, image_id: int, data: bytes
) -> None:
    """Opt-in handwriting trend: measure the page if the student agreed.

    Runs after the upload is committed and never raises or changes the response.
    """
    try:
        from app.core.wellbeing import service as wellbeing

        if not wellbeing.has_consent(db, user_id):
            return
        result = await run_in_threadpool(wellbeing.safe_extract, data)
        wellbeing.record_sample(db, user_id=user_id, answer_image_id=image_id, result=result)
    except Exception as exc:  # noqa: BLE001 - must never fail the upload
        logger.warning("handwriting trend skipped: %s", type(exc).__name__)
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass


def _rebuild_attempt_text(db: Session, attempt: GsLmsAnswerAttempt) -> None:
    """Rebuild ``raw_text`` / ``ocr_confidence`` from the pages in page order."""
    db.flush()
    pages = (
        db.query(GsLmsAnswerSheetImage)
        .filter(GsLmsAnswerSheetImage.attempt_id == attempt.id)
        .order_by(GsLmsAnswerSheetImage.page_order)
        .all()
    )
    texts = [p.ocr_text.strip() for p in pages if p.ocr_text and p.ocr_text.strip()]
    if texts:
        attempt.raw_text = "\n".join(texts)
    confidences = [p.ocr_confidence for p in pages if p.ocr_confidence is not None]
    if confidences:
        attempt.ocr_confidence = min(confidences)


def _page_or_404(db: Session, attempt_id: int, page_order: int) -> GsLmsAnswerSheetImage:
    sheet = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.attempt_id == attempt_id,
            GsLmsAnswerSheetImage.page_order == page_order,
        )
        .first()
    )
    if sheet is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Page not found")
    return sheet


def _enforce_cost_gates(db: Session, student_id: int, text: str) -> None:
    if eval_service.rate_limit_exceeded(db, student_id):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily evaluation limit reached; please try again later.",
        )
    if eval_service.token_budget_exceeded(text):
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Answer exceeds the maximum size for evaluation.",
        )


# ---------------------------------------------------------------------------
# Capabilities: is real answer checking set up? (cheap, no model call)
# ---------------------------------------------------------------------------
@router.get("/answers/capabilities")
def get_answer_capabilities(current_user: User = Depends(get_current_user)) -> Any:
    caps = readiness.gs_capabilities()
    live = caps.ocr_live and caps.evaluation_live
    return StandardResponse(
        success=True,
        message="Capabilities retrieved",
        data=GsAnswerCapabilitiesOut(
            ocr_live=caps.ocr_live,
            evaluation_live=caps.evaluation_live,
            mock_in_use=caps.mock_in_use,
            message=None if live else readiness.NOT_SET_UP_DETAIL,
        ),
    )


# ---------------------------------------------------------------------------
# Typed submission (R10)
# ---------------------------------------------------------------------------
@router.post("/answers/typed", dependencies=[Depends(ai_rate_limit)])
def submit_typed_answer(
    payload: GsAnswerSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # No fake scores: refuse before saving anything when no real evaluator is set up.
    require_gs_evaluation_available()

    text = _compose_typed_text(payload)
    if not text:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="No answer text was provided."
        )

    pyq, pyq_paper, pyq_marks = _resolve_pyq_context(db, payload.pyq_id)
    gs_paper = pyq_paper or _paper_enum(payload.gs_paper)
    max_marks = payload.max_marks if payload.max_marks is not None else pyq_marks

    _enforce_cost_gates(db, current_user.id, text)

    attempt = GsLmsAnswerAttempt(
        student_id=current_user.id,
        pyq_id=payload.pyq_id,
        gs_paper=gs_paper,
        question_text=payload.question_text or (pyq.question_text if pyq else None),
        max_marks=max_marks,
        mode=GsLmsAnswerModeEnum.TYPED,
        status=GsLmsAnswerAttemptStatusEnum.SUBMITTED,
        raw_text=text,
        review_acknowledged=True,
    )
    db.add(attempt)
    db.flush()

    job = eval_service.evaluate_attempt_job(db, attempt)
    db.commit()
    db.refresh(attempt)

    return StandardResponse(
        success=True,
        message="Answer submitted for evaluation",
        data=GsAnswerAckOut(
            attempt_id=attempt.id,
            status=_job_status_label(job.status),
        ),
    )


# ---------------------------------------------------------------------------
# Handwritten attempt + page upload (R11, R12)
# ---------------------------------------------------------------------------
@router.post("/answers/handwritten", dependencies=[Depends(require_access("mains_upload")), Depends(ai_rate_limit)])
def create_handwritten_attempt(
    payload: GsAnswerSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    pyq, pyq_paper, pyq_marks = _resolve_pyq_context(db, payload.pyq_id)
    attempt = GsLmsAnswerAttempt(
        student_id=current_user.id,
        pyq_id=payload.pyq_id,
        gs_paper=pyq_paper or _paper_enum(payload.gs_paper),
        question_text=payload.question_text or (pyq.question_text if pyq else None),
        max_marks=payload.max_marks if payload.max_marks is not None else pyq_marks,
        mode=GsLmsAnswerModeEnum.HANDWRITTEN,
        status=GsLmsAnswerAttemptStatusEnum.DRAFT,
        raw_text=payload.raw_text,
        review_acknowledged=False,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return StandardResponse(
        success=True,
        message="Handwritten attempt created; upload pages then submit.",
        data=GsAnswerAckOut(attempt_id=attempt.id, status="draft"),
    )


@router.post(
    "/answers/{attempt_id}/pages",
    dependencies=[Depends(require_access("mains_upload")), Depends(ai_rate_limit)],
)
async def upload_answer_page(
    attempt_id: int,
    image: UploadFile = File(..., description="Handwritten answer page image"),
    page_order: int = Form(...),
    ocr_confidence: Optional[float] = Form(default=None),
    ocr_text: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    attempt = _own_attempt_or_404(db, attempt_id, current_user)

    ext = os.path.splitext(image.filename or "")[1].lower()
    if ext not in _ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported image type '{ext}'.",
        )
    data = await image.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the maximum allowed size.",
        )

    # Server-side OCR is needed unless the client supplied the text. Never fall
    # back to fake mock OCR text: refuse before storing anything.
    client_text = bool(ocr_text and ocr_text.strip())
    if not client_text:
        require_ocr_available()

    store = eval_service.get_media_store()
    ref = store.put(
        data,
        content_type=image.content_type or "application/octet-stream",
        owner_id=current_user.id,
        attempt_id=attempt.id,
        page_order=page_order,
    )

    # Re-uploading a page number replaces that page (a retake).
    sheet = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.attempt_id == attempt.id,
            GsLmsAnswerSheetImage.page_order == page_order,
        )
        .first()
    )
    old_ref = sheet.media_ref if sheet is not None else None
    if sheet is None:
        sheet = GsLmsAnswerSheetImage(
            attempt_id=attempt.id,
            student_id=current_user.id,
            media_ref=ref.key,
            page_order=page_order,
            content_type=image.content_type,
        )
        db.add(sheet)
    else:
        sheet.media_ref = ref.key
        sheet.content_type = image.content_type
        sheet.deleted_at = None

    if client_text:
        sheet.ocr_status = "skipped"
        sheet.ocr_text = ocr_text.strip()
        sheet.ocr_confidence = ocr_confidence
    else:
        await run_in_threadpool(_run_page_ocr, sheet, data, image.content_type)
    db.flush()  # assigns sheet.id for logging / response

    _rebuild_attempt_text(db, attempt)
    total = (
        db.query(GsLmsAnswerSheetImage)
        .filter(GsLmsAnswerSheetImage.attempt_id == attempt.id)
        .count()
    )
    db.commit()
    db.refresh(sheet)

    if old_ref and old_ref != ref.key:
        try:
            store.delete(old_ref)
        except Exception:  # noqa: BLE001 - orphaned object is retention's job
            pass

    await _record_handwriting_sample(db, current_user.id, sheet.id, data)

    failed = sheet.ocr_status == "failed"
    return StandardResponse(
        success=True,
        message=(
            "Page saved, but its handwriting could not be read" if failed else "Page uploaded"
        ),
        data=_page_out(attempt, sheet, total),
    )


@router.get("/answers/{attempt_id}/pages")
def list_answer_pages(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    _own_attempt_or_404(db, attempt_id, current_user)
    rows = (
        db.query(GsLmsAnswerSheetImage)
        .filter(GsLmsAnswerSheetImage.attempt_id == attempt_id)
        .order_by(GsLmsAnswerSheetImage.page_order)
        .all()
    )
    return StandardResponse(
        success=True,
        message="Pages retrieved",
        data=GsAnswerPagesOut(
            attempt_id=attempt_id,
            pages=[
                GsPageInfoOut(
                    page_order=r.page_order,
                    ocr_status=r.ocr_status,
                    ocr_confidence=r.ocr_confidence,
                    has_image=bool(r.media_ref),
                )
                for r in rows
            ],
        ),
    )


@router.post(
    "/answers/{attempt_id}/pages/{page_order}/retry-ocr",
    dependencies=[Depends(require_access("mains_upload")), Depends(ai_rate_limit)],
)
def retry_page_ocr(
    attempt_id: int,
    page_order: int,
    ocr_text: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Re-run OCR on a stored page, or accept text the student typed for it."""
    attempt = _own_attempt_or_404(db, attempt_id, current_user)
    if attempt.status != GsLmsAnswerAttemptStatusEnum.DRAFT:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="This answer has already been submitted."
        )
    sheet = _page_or_404(db, attempt_id, page_order)

    if ocr_text and ocr_text.strip():
        sheet.ocr_status = "skipped"
        sheet.ocr_text = ocr_text.strip()
        sheet.ocr_confidence = None
    else:
        if not sheet.media_ref:
            raise HTTPException(
                status.HTTP_409_CONFLICT, detail="The image for this page was deleted."
            )
        require_ocr_available()
        try:
            data = eval_service.get_media_store().open(
                sheet.media_ref,
                requester_id=current_user.id,
                is_evaluator=False,
                owner_id=attempt.student_id,
            )
        except Exception:  # noqa: BLE001
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Page not found")
        _run_page_ocr(sheet, data, sheet.content_type)

    _rebuild_attempt_text(db, attempt)
    total = (
        db.query(GsLmsAnswerSheetImage)
        .filter(GsLmsAnswerSheetImage.attempt_id == attempt.id)
        .count()
    )
    db.commit()
    db.refresh(sheet)
    return StandardResponse(
        success=True,
        message=(
            "Page still could not be read" if sheet.ocr_status == "failed" else "Page read"
        ),
        data=_page_out(attempt, sheet, total),
    )


@router.delete("/answers/{attempt_id}/pages")
def delete_answer_page_images(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete the student's own stored page images. Text and report are kept."""
    _own_attempt_or_404(db, attempt_id, current_user)
    rows = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.attempt_id == attempt_id,
            GsLmsAnswerSheetImage.media_ref.isnot(None),
        )
        .all()
    )
    store = eval_service.get_media_store()
    deleted = 0
    now = datetime.now(timezone.utc)
    for row in rows:
        try:
            store.delete(row.media_ref)
        except Exception:  # noqa: BLE001
            db.commit()  # keep the pages already removed
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                detail="Could not delete all images; please try again.",
            )
        row.media_ref = None
        row.deleted_at = now
        deleted += 1
    db.commit()
    return StandardResponse(
        success=True,
        message="Images deleted",
        data=GsPagesDeletedOut(attempt_id=attempt_id, deleted_pages=deleted),
    )


@router.post("/answers/{attempt_id}/submit", dependencies=[Depends(ai_rate_limit)])
def submit_attempt(
    attempt_id: int,
    acknowledge_review: bool = Form(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # No fake scores: refuse when no real evaluator is set up.
    require_gs_evaluation_available()

    attempt = _own_attempt_or_404(db, attempt_id, current_user)

    # A page whose handwriting could not be read must be retried (or its text
    # typed) before submitting, otherwise the evaluator would grade partial text.
    failed_pages = (
        db.query(GsLmsAnswerSheetImage.page_order)
        .filter(
            GsLmsAnswerSheetImage.attempt_id == attempt.id,
            GsLmsAnswerSheetImage.ocr_status == "failed",
        )
        .order_by(GsLmsAnswerSheetImage.page_order)
        .all()
    )
    if failed_pages:
        nums = ", ".join(str(r[0]) for r in failed_pages)
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=(
                f"Page {nums} could not be read. Retry reading it or type its "
                "text before submitting."
            ),
        )

    if attempt.mode == GsLmsAnswerModeEnum.HANDWRITTEN and not (attempt.raw_text or "").strip():
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="No readable text yet. Upload a page or type the text before submitting.",
        )

    if acknowledge_review:
        attempt.review_acknowledged = True
        db.flush()

    # Confidence gate (R14): low-confidence, unreviewed handwriting waits.
    if eval_service.confidence_gate_blocks(attempt):
        db.commit()
        return StandardResponse(
            success=True,
            message="Low-confidence extraction; please review and resubmit.",
            data=GsAnswerAckOut(
                attempt_id=attempt.id,
                status="review_required",
                review_required=True,
                message="Review the extracted text, then resubmit with acknowledgement.",
            ),
        )

    _enforce_cost_gates(db, current_user.id, attempt.raw_text or "")
    job = eval_service.evaluate_attempt_job(db, attempt)
    db.commit()
    return StandardResponse(
        success=True,
        message="Answer submitted for evaluation",
        data=GsAnswerAckOut(attempt_id=attempt.id, status=_job_status_label(job.status)),
    )


# ---------------------------------------------------------------------------
# Status / report (R15, R16, R17)
# ---------------------------------------------------------------------------
def _job_status_label(raw: str) -> str:
    return {
        "STARTED": "in_progress",
        "COMPLETED": "completed",
        "DEGRADED": "degraded",
        "FAILED": "failed",
    }.get(raw, "in_progress")


@router.get("/answers/{attempt_id}/status")
def get_attempt_status(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    attempt = _own_attempt_or_404(db, attempt_id, current_user)
    job = eval_service.latest_job_for_attempt(db, attempt_id)
    report = (
        db.query(GsLmsEvaluationReport)
        .filter(GsLmsEvaluationReport.attempt_id == attempt_id)
        .one_or_none()
    )
    status_label = _job_status_label(job.status) if job else "in_progress"
    if eval_service.confidence_gate_blocks(attempt):
        status_label = "review_required"
    return StandardResponse(
        success=True,
        message="Status retrieved",
        data=GsAnswerStatusOut(
            attempt_id=attempt_id,
            status=status_label,
            report=_report_out(report) if report else None,
        ),
    )


@router.get("/answers/{attempt_id}/report")
def get_attempt_report(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    _own_attempt_or_404(db, attempt_id, current_user)
    report = (
        db.query(GsLmsEvaluationReport)
        .filter(GsLmsEvaluationReport.attempt_id == attempt_id)
        .one_or_none()
    )
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No report for this attempt")
    return StandardResponse(
        success=True, message="Report retrieved", data=_report_out(report)
    )


@router.post("/answers/{attempt_id}/override")
def override_report(
    attempt_id: int,
    payload: GsOverrideIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if not _is_evaluator(current_user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Evaluator role required")

    report = (
        db.query(GsLmsEvaluationReport)
        .filter(GsLmsEvaluationReport.attempt_id == attempt_id)
        .one_or_none()
    )
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No report for this attempt")

    # Preserve the original machine report exactly once (R16.1/R16.4/R16.5).
    if report.original_report is None:
        report.original_report = {
            "sections": report.sections,
            "incomplete_sections": report.incomplete_sections,
            "overall_score": report.overall_score,
            "marks_awarded": report.marks_awarded,
        }

    report.sections = {
        name: {"feedback": sec.feedback, "score": sec.score}
        for name, sec in payload.sections.items()
    }
    report.incomplete_sections = list(payload.incomplete_sections)
    if payload.overall_score is not None:
        report.overall_score = payload.overall_score
    if payload.marks_awarded is not None:
        report.marks_awarded = payload.marks_awarded
    report.overridden_by = current_user.id
    report.overridden_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return StandardResponse(
        success=True, message="Report overridden", data=_report_out(report)
    )


@router.get("/answers/{attempt_id}/pages/{page_order}")
def fetch_answer_page(
    attempt_id: int,
    page_order: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    attempt = (
        db.query(GsLmsAnswerAttempt)
        .filter(GsLmsAnswerAttempt.id == attempt_id)
        .one_or_none()
    )
    if attempt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Answer attempt not found")

    is_evaluator = _is_evaluator(current_user)
    if attempt.student_id != current_user.id and not is_evaluator:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Answer attempt not found")

    sheet = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.attempt_id == attempt_id,
            GsLmsAnswerSheetImage.page_order == page_order,
        )
        .one_or_none()
    )
    if sheet is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Page not found")

    if not sheet.media_ref:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Page image was deleted")

    store = eval_service.get_media_store()
    try:
        data = store.open(
            sheet.media_ref,
            requester_id=current_user.id,
            is_evaluator=is_evaluator,
            owner_id=attempt.student_id,
        )
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Page not found")

    return Response(content=data, media_type=sheet.content_type or "application/octet-stream")

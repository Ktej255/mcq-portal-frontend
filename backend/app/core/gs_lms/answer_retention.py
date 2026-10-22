"""Delete old answer-sheet images (retention).

Usage (run daily from a scheduler, e.g. an ECS scheduled task)::

    python -m app.core.gs_lms.answer_retention [--dry-run] [--days N]

Images older than ``settings.ANSWER_IMAGE_RETENTION_DAYS`` (default 180) are
removed from the configured MediaStore and their ``media_ref`` is cleared
(``deleted_at`` is set). The extracted text, OCR status and the evaluation
report are kept. Logs counts only, never keys or content.
"""
from __future__ import annotations

import argparse
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.gs_lms.models import GsLmsAnswerSheetImage
from app.core.storage.media_store import MediaStore

logger = logging.getLogger(__name__)


def purge_expired_images(
    db: Session,
    store: MediaStore,
    *,
    retention_days: Optional[int] = None,
    now: Optional[datetime] = None,
    dry_run: bool = False,
) -> Dict[str, int]:
    """Delete images older than the retention period. Returns counts."""
    days = settings.ANSWER_IMAGE_RETENTION_DAYS if retention_days is None else retention_days
    current = now or datetime.now(timezone.utc)
    # uploaded_at is stored naive-UTC on SQLite; compare naive UTC.
    cutoff = (current - timedelta(days=days)).replace(tzinfo=None)

    rows = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.media_ref.isnot(None),
            GsLmsAnswerSheetImage.uploaded_at < cutoff,
        )
        .all()
    )
    counts = {"expired": len(rows), "deleted": 0, "failed": 0}
    if dry_run:
        return counts

    for row in rows:
        try:
            store.delete(row.media_ref)
        except Exception as exc:  # noqa: BLE001 - keep going, retry next run
            counts["failed"] += 1
            logger.warning(
                "retention: could not delete image id=%s: %s", row.id, type(exc).__name__
            )
            continue
        row.media_ref = None
        row.deleted_at = current.replace(tzinfo=None)
        counts["deleted"] += 1
    db.commit()
    return counts


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Delete expired answer-sheet images.")
    parser.add_argument("--dry-run", action="store_true", help="count only, delete nothing")
    parser.add_argument("--days", type=int, default=None, help="override retention days")
    args = parser.parse_args(argv)

    from app.core.gs_lms.evaluation.service import get_media_store
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        counts = purge_expired_images(
            db, get_media_store(), retention_days=args.days, dry_run=args.dry_run
        )
    finally:
        db.close()
    prefix = "[dry-run] " if args.dry_run else ""
    print(
        f"{prefix}expired={counts['expired']} deleted={counts['deleted']} failed={counts['failed']}"
    )
    return 1 if counts["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())

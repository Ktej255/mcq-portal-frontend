"""Extract handwriting measurements from stored images for consenting students.

Usage (run by ops when the algorithm version changes, or after a gap)::

    python -m app.core.wellbeing.backfill [--user-id N] [--dry-run]

Only students who opted in are processed. Images that already have a sample for
the current algorithm version are skipped. Prints counts only.
"""
from __future__ import annotations

import argparse
from typing import Optional

from app.core.wellbeing import service
from app.core.wellbeing.models import WellbeingConsent


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Backfill handwriting measurements.")
    parser.add_argument("--user-id", type=int, default=None, help="only this student")
    parser.add_argument("--dry-run", action="store_true", help="count only, write nothing")
    args = parser.parse_args(argv)

    from app.core.gs_lms.evaluation.service import get_media_store
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        q = db.query(WellbeingConsent.user_id).filter(WellbeingConsent.handwriting_insights.is_(True))
        if args.user_id is not None:
            q = q.filter(WellbeingConsent.user_id == args.user_id)
        user_ids = [r[0] for r in q.all()]
        store = get_media_store()
        totals = {"students": len(user_ids), "candidates": 0, "saved": 0, "failed": 0}
        for uid in user_ids:
            counts = service.backfill_user(db, store, uid, dry_run=args.dry_run)
            for k in ("candidates", "saved", "failed"):
                totals[k] += counts[k]
    finally:
        db.close()
    prefix = "[dry-run] " if args.dry_run else ""
    print(
        f"{prefix}students={totals['students']} candidates={totals['candidates']} "
        f"saved={totals['saved']} failed={totals['failed']}"
    )
    return 1 if totals["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())

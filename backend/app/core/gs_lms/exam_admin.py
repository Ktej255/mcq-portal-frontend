"""Owner CLI for the NEET / JEE exams (no migration needed).

    python -m app.core.gs_lms.exam_admin seed-subjects --exam neet
    python -m app.core.gs_lms.exam_admin activate --exam neet
    python -m app.core.gs_lms.exam_admin deactivate --exam neet
    python -m app.core.gs_lms.exam_admin status

``seed-subjects`` creates the standard subjects of an exam if they are
missing (and the exam row itself, inactive, if the table has none yet). It
never changes an existing subject. ``activate`` / ``deactivate`` flip
``gs_exams.is_active``; UPSC cannot be deactivated. Everything is idempotent.

Seeded subjects have no content, so they stay closed ("Soon") until topics
are imported and reviewed (``GET /gs-lms/subjects`` computes ``available``
live); activating an exam is what makes it visible and pickable.
"""

from __future__ import annotations

import argparse
import sys
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.gs.models import GsExam, GsSubject
from app.core.gs_lms.exam_profiles import DEFAULT_EXAM_CODE, PROFILES, normalize_exam_code

# (slug, display name, description). Slugs are globally unique, hence the exam prefix.
STANDARD_SUBJECTS: dict[str, list[tuple[str, str, str]]] = {
    "neet": [
        ("neet-physics", "Physics", "NEET Physics"),
        ("neet-chemistry", "Chemistry", "NEET Chemistry"),
        ("neet-biology", "Biology", "NEET Biology"),
    ],
    "jee": [
        ("jee-physics", "Physics", "JEE Physics"),
        ("jee-chemistry", "Chemistry", "JEE Chemistry"),
        ("jee-maths", "Mathematics", "JEE Mathematics"),
    ],
}

_EXAM_ORDER = {"upsc": 0, "neet": 1, "jee": 2}


class ExamAdminError(ValueError):
    """A request the CLI refuses (unknown exam, deactivating UPSC, slug clash)."""


def _check_code(code: str) -> str:
    key = normalize_exam_code(code)
    if key not in PROFILES:
        raise ExamAdminError(f"Unknown exam {code!r}; known exams: {sorted(PROFILES)}")
    return key


def ensure_exam(db: Session, code: str) -> GsExam:
    """The ``gs_exams`` row for ``code``; created (inactive, except UPSC) if missing."""
    key = _check_code(code)
    exam = db.query(GsExam).filter(GsExam.code == key).one_or_none()
    if exam is None:
        exam = GsExam(
            code=key,
            name=PROFILES[key].name,
            display_order=_EXAM_ORDER.get(key, len(_EXAM_ORDER)),
            is_active=key == DEFAULT_EXAM_CODE,
        )
        db.add(exam)
        db.flush()
    return exam


def seed_subjects(db: Session, code: str) -> list[str]:
    """Create the exam's standard subjects that are missing. Returns the slugs created."""
    key = _check_code(code)
    if key not in STANDARD_SUBJECTS:
        raise ExamAdminError(f"No standard subjects to seed for {key!r} (UPSC subjects come from the main seed).")
    exam = ensure_exam(db, key)
    created: list[str] = []
    for order, (slug, name, description) in enumerate(STANDARD_SUBJECTS[key], start=1):
        existing = db.query(GsSubject).filter(GsSubject.slug == slug).one_or_none()
        if existing is not None:
            if existing.exam_id != exam.id:
                raise ExamAdminError(f"Subject {slug!r} already exists under a different exam; not touching it.")
            continue
        # Explicit id: databases seeded with fixed ids can have a sequence behind max(id).
        next_id = (db.query(func.max(GsSubject.id)).scalar() or 0) + 1
        db.add(GsSubject(
            id=next_id, slug=slug, name=name, description=description,
            display_order=order, exam_id=exam.id, is_complete=False,
        ))
        db.flush()
        created.append(slug)
    return created


def set_active(db: Session, code: str, active: bool) -> bool:
    """Switch an exam on or off. Returns True when the flag changed."""
    key = _check_code(code)
    if key == DEFAULT_EXAM_CODE and not active:
        raise ExamAdminError("UPSC cannot be deactivated.")
    exam = ensure_exam(db, key)
    if exam.is_active == active:
        return False
    exam.is_active = active
    db.flush()
    return True


def status(db: Session) -> list[dict]:
    rows = []
    for exam in db.query(GsExam).order_by(GsExam.display_order, GsExam.id):
        subjects = db.query(GsSubject).filter(GsSubject.exam_id == exam.id).order_by(GsSubject.display_order).all()
        rows.append({"code": exam.code, "active": bool(exam.is_active), "subjects": [s.slug for s in subjects]})
    return rows


def main(argv: Optional[list[str]] = None) -> int:  # pragma: no cover - thin CLI wrapper
    parser = argparse.ArgumentParser(description="Seed and activate the NEET / JEE exams.")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, help_text in (
        ("seed-subjects", "Create the exam's standard subjects if missing."),
        ("activate", "Make the exam visible and pickable for students."),
        ("deactivate", "Hide the exam again (UPSC is refused)."),
    ):
        p = sub.add_parser(name, help=help_text)
        p.add_argument("--exam", required=True, choices=sorted(PROFILES))
    sub.add_parser("status", help="List exams, their state and subjects.")
    args = parser.parse_args(argv)

    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        if args.command == "seed-subjects":
            created = seed_subjects(db, args.exam)
            print(f"{args.exam}: created {created}" if created else f"{args.exam}: subjects already present")
        elif args.command in ("activate", "deactivate"):
            changed = set_active(db, args.exam, args.command == "activate")
            state = "active" if args.command == "activate" else "inactive"
            print(f"{args.exam}: now {state}" if changed else f"{args.exam}: already {state}")
        else:
            for row in status(db):
                print(f"{row['code']:<5} {'active' if row['active'] else 'inactive':<9} {', '.join(row['subjects']) or '-'}")
        db.commit()
    except ExamAdminError as exc:
        db.rollback()
        print(f"error: {exc}", file=sys.stderr)
        return 2
    finally:
        db.close()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())

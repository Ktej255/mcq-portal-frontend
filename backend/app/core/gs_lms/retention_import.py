"""Import retention question banks (converter output) into the GS LMS.

    python -m app.core.gs_lms.retention_import --dir app/core/gs_lms/data/retention \
        [--subjects polity-governance history] [--review-status REVIEWED] \
        [--book-map path.json] [--dry-run]

* Questions are matched by the converter's stable ``id`` (stored as
  ``external_id``), so running twice gives the same database state.
* A question without an ``ok`` answer status, or without a correct option, is
  always stored UNREVIEWED, whatever ``--review-status`` says.
* Without ``--review-status`` new questions are UNREVIEWED and questions that
  already exist keep their current status.
* Book mapping: ``retention_book_map.json`` maps (subject slug, book label) to
  a book slug. A question is tied to a chapter only when that book exists and
  has a chapter numbered like the question's source chapter; otherwise it is
  left unmapped (and counted).

Functions flush but never commit; the CLI commits (or rolls back on --dry-run).
"""

from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import GsLmsBook, GsLmsBookChapter, GsLmsRetentionQuestion

DEFAULT_RETENTION_DIR = Path(__file__).resolve().parent / "data" / "retention"
DEFAULT_BOOK_MAP_PATH = Path(__file__).resolve().parent / "data" / "retention_book_map.json"
_ACTOR = "gs-lms-retention-import"
_LABELS = {"A", "B", "C", "D"}


def load_book_map(path: Optional[Path | str] = None) -> dict[str, dict[str, Optional[str]]]:
    """{subject_slug: {book label: book slug or None}}; underscore keys are notes."""
    p = Path(path) if path else DEFAULT_BOOK_MAP_PATH
    if not p.exists():
        return {}
    raw = json.loads(p.read_text(encoding="utf-8"))
    return {
        subject: dict(books)
        for subject, books in raw.items()
        if not subject.startswith("_") and isinstance(books, dict)
    }


def _is_verified(q: dict[str, Any]) -> bool:
    return q.get("answer_status") == "ok" and q.get("correct_option") in _LABELS


def _valid(q: dict[str, Any]) -> bool:
    options = q.get("options")
    return bool(
        q.get("id")
        and (q.get("question_text") or "").strip()
        and isinstance(options, list)
        and len(options) >= 2
        and all(isinstance(o, dict) and "label" in o and "text" in o for o in options)
    )


class _ChapterLookup:
    """Resolves (subject, book label, chapter number) -> chapter id, with caching."""

    def __init__(self, db: Session, book_map: dict[str, dict[str, Optional[str]]]):
        self.db, self.book_map = db, book_map
        self._chapters: dict[str, dict[int, int]] = {}

    def _book_chapters(self, book_slug: str) -> dict[int, int]:
        if book_slug not in self._chapters:
            book = self.db.query(GsLmsBook).filter(GsLmsBook.slug == book_slug).one_or_none()
            self._chapters[book_slug] = (
                {c.number: c.id for c in book.chapters} if book is not None else {}
            )
        return self._chapters[book_slug]

    def chapter_id(self, subject: str, book: Optional[str], chapter: Optional[int]) -> Optional[int]:
        if not book or chapter is None:
            return None
        slug = (self.book_map.get(subject) or {}).get(book)
        if not slug:
            return None
        return self._book_chapters(slug).get(int(chapter))


def import_retention_questions(
    db: Session,
    questions: list[dict[str, Any]],
    subject_slug: str,
    *,
    review_status: Optional[str] = None,
    book_map: Optional[dict[str, dict[str, Optional[str]]]] = None,
    lookup: Optional[_ChapterLookup] = None,
) -> dict[str, int]:
    """Upsert one subject's questions. Returns created/updated/skipped/mapped/unmapped."""
    stats = {"created": 0, "updated": 0, "skipped": 0, "mapped": 0, "unmapped": 0, "forced_unreviewed": 0}
    lookup = lookup or _ChapterLookup(db, book_map if book_map is not None else load_book_map())
    wanted = GsReviewStatusEnum(review_status) if review_status else None

    ids = [q["id"] for q in questions if isinstance(q, dict) and q.get("id")]
    existing: dict[str, GsLmsRetentionQuestion] = {}
    for i in range(0, len(ids), 500):  # chunked: keeps the IN list small
        for r in (
            db.query(GsLmsRetentionQuestion)
            .filter(GsLmsRetentionQuestion.external_id.in_(ids[i:i + 500]))
            .all()
        ):
            existing[r.external_id] = r

    for q in questions:
        if not isinstance(q, dict) or not _valid(q):
            stats["skipped"] += 1
            continue
        ref = q.get("source_ref") or {}
        pyq = q.get("pyq") or {}
        chapter_no = ref.get("chapter")
        chapter_id = lookup.chapter_id(subject_slug, ref.get("book"), chapter_no)
        stats["mapped" if chapter_id else "unmapped"] += 1

        row = existing.get(q["id"])
        if row is None:
            status = wanted or GsReviewStatusEnum.UNREVIEWED
        else:
            status = wanted or row.review_status
        if not _is_verified(q) and status != GsReviewStatusEnum.UNREVIEWED:
            status = GsReviewStatusEnum.UNREVIEWED
            stats["forced_unreviewed"] += 1

        values = dict(
            subject_slug=subject_slug,
            question_text=q["question_text"].strip(),
            options=[{"label": str(o["label"]), "text": str(o["text"])} for o in q["options"]],
            correct_option=q.get("correct_option") if q.get("correct_option") in _LABELS else None,
            explanation=q.get("explanation") or None,
            explanation_quality=q.get("explanation_quality") or "missing",
            answer_status=q.get("answer_status") or "unverified",
            question_type=q.get("question_type") or "FACTUAL",
            difficulty=q.get("difficulty"),
            is_pyq=bool(q.get("is_pyq")),
            pyq_year=pyq.get("year") if pyq else None,
            source_book=ref.get("book"),
            source_chapter=int(chapter_no) if isinstance(chapter_no, (int, float)) else None,
            book_chapter_id=chapter_id,
            review_status=status,
            updated_by=_ACTOR,
        )
        if row is None:
            row = GsLmsRetentionQuestion(external_id=q["id"], created_by=_ACTOR, **values)
            db.add(row)
            existing[q["id"]] = row
            stats["created"] += 1
        else:
            for k, v in values.items():
                setattr(row, k, v)
            stats["updated"] += 1
    db.flush()
    return stats


def load_retention_files(directory: Path | str, subjects: Optional[list[str]] = None) -> "OrderedDict[str, list[dict]]":
    """Question lists per subject slug; split files (-partN) are merged."""
    out: "OrderedDict[str, list[dict]]" = OrderedDict()
    for path in sorted(Path(directory).glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "questions" not in data:
            continue
        slug = data.get("subject_slug") or path.stem
        if subjects and slug not in subjects:
            continue
        out.setdefault(slug, []).extend(data["questions"])
    return out


def import_directory(
    db: Session,
    directory: Path | str,
    *,
    subjects: Optional[list[str]] = None,
    review_status: Optional[str] = None,
    book_map: Optional[dict[str, dict[str, Optional[str]]]] = None,
) -> "OrderedDict[str, dict[str, int]]":
    book_map = book_map if book_map is not None else load_book_map()
    lookup = _ChapterLookup(db, book_map)
    results: "OrderedDict[str, dict[str, int]]" = OrderedDict()
    for slug, questions in load_retention_files(directory, subjects).items():
        results[slug] = import_retention_questions(
            db, questions, slug, review_status=review_status, book_map=book_map, lookup=lookup
        )
    return results


def format_summary(results: dict[str, dict[str, int]]) -> str:
    cols = ["created", "updated", "skipped", "mapped", "unmapped", "forced_unreviewed"]
    lines = [f"{'subject':<26}" + "".join(f"{c:>18}" for c in cols)]
    total = {c: 0 for c in cols}
    for slug, s in results.items():
        lines.append(f"{slug:<26}" + "".join(f"{s[c]:>18}" for c in cols))
        for c in cols:
            total[c] += s[c]
    lines.append(f"{'TOTAL':<26}" + "".join(f"{total[c]:>18}" for c in cols))
    return "\n".join(lines)


def main() -> None:  # pragma: no cover - CLI entrypoint
    import argparse

    parser = argparse.ArgumentParser(description="Import retention question banks.")
    parser.add_argument("--dir", default=str(DEFAULT_RETENTION_DIR), help="Folder with the <subject>[-partN].json files.")
    parser.add_argument("--subjects", nargs="*", default=None, help="Only these subject slugs.")
    parser.add_argument(
        "--review-status", default=None, choices=["UNREVIEWED", "REVIEWED"],
        help="Status to stamp (default: new questions UNREVIEWED, existing ones keep theirs). "
             "Unverified questions are always UNREVIEWED.",
    )
    parser.add_argument("--book-map", default=None, help="Book map JSON (default: data/retention_book_map.json).")
    parser.add_argument("--dry-run", action="store_true", help="Do everything, then roll back.")
    args = parser.parse_args()

    import app.models.domain  # noqa: F401  (registers User and the other models)
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        results = import_directory(
            session, args.dir, subjects=args.subjects, review_status=args.review_status,
            book_map=load_book_map(args.book_map),
        )
        if args.dry_run:
            session.rollback()
        else:
            session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    print(("=== DRY RUN (nothing saved) ===" if args.dry_run else "=== Retention import complete ==="))
    print(format_summary(results))


if __name__ == "__main__":  # pragma: no cover
    main()

#!/usr/bin/env python3
"""Convert the Eduecosystem question bank into UPSC Command retention-check JSON.

Reads (read-only):
  * the SQLite export ``eduecosystem_v2.db`` -- ONLY the tables ``bank_questions``,
    ``question_banks`` and ``question_bank_questions``.  No other table (in
    particular nothing user-related) is ever queried.
  * the Eduecosystem frontend TypeScript data files, for PYQ files (with year) and
    as an answer-recovery index for DB rows whose answer column is empty.

Writes per-subject JSON files + REPORT.md under the output directory.  See README.md.

    python convert.py --db eduecosystem_v2.db --frontend-root /path/to/eduecosystem-frontend/frontend \
        --out ../../app/core/gs_lms/data/retention
"""

from __future__ import annotations

import argparse
import collections
import datetime as _dt
import hashlib
import json
import math
import os
import re
import sqlite3
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tsparse  # noqa: E402

SUBJECT_SLUGS = [
    "geography",
    "polity-governance",
    "economy",
    "history",
    "science-tech",
    "environment",
    "international-relations",
    "internal-security-society",
    "art-culture",
    "csat",
]

# directory name in the Eduecosystem frontend -> our slug
DIR_TO_SLUG = {
    "geography": "geography",
    "polity": "polity-governance",
    "economy": "economy",
    "history": "history",
    "science-tech": "science-tech",
    "environment": "environment",
    "international-relations": "international-relations",
    "security": "internal-security-society",
    "society": "internal-security-society",
    "art-culture": "art-culture",
    "csat": "csat",
}

MAX_FILE_BYTES = 6 * 1024 * 1024
LABELS = ["A", "B", "C", "D"]

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "app" / "core" / "gs_lms" / "data" / "retention"

# --------------------------------------------------------------------------- text helpers

_QUOTE_MAP = str.maketrans(
    {"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}
)


def clean_text(s: Any) -> str:
    """Tidy display text: unescape doubly-escaped sequences, normalise newlines/space."""
    if s is None:
        return ""
    s = str(s)
    s = s.replace("\\n", "\n").replace('\\"', '"').replace("\\'", "'")
    s = s.replace("\r\n", "\n").replace("\r", "\n").replace(" ", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def normalise(s: Any) -> str:
    """Canonical form used for dedupe keys and hashing.

    Case/punctuation/whitespace-insensitive, but keeps arithmetic symbols (+ * / = < > % ^)
    so that questions or options differing only by an operator stay distinct.
    """
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", str(s)).translate(_QUOTE_MAP).casefold()
    s = s.replace("\\n", " ").replace('\\"', '"')
    s = re.sub(r"[^\w+*/=<>%^]+", " ", s, flags=re.UNICODE).replace("_", " ")
    return re.sub(r"\s+", " ", s).strip()


def question_id(text: str) -> str:
    """Stable id derived from the normalised question text."""
    return "ee_" + hashlib.sha256(normalise(text).encode("utf-8")).hexdigest()[:16]


# --------------------------------------------------------------------------- raw model


@dataclass
class Raw:
    text: str
    options: list  # list[str]
    answer: dict | None = None  # {"text":..} | {"index":n} | {"letter":..,"text":..} | None
    explanation: str = ""
    difficulty: str | None = None
    subject: str | None = None
    bank_title: str | None = None
    file: str | None = None  # repo-relative path
    book: str | None = None
    chapter: int | None = None
    is_pyq: bool = False  # came from a TS PYQ file with a year
    year: int | None = None
    from_pyq_file: bool = False  # source file is a *pyq* file (DB or TS)
    origin: str = "db"  # "db" | "ts-pyq"
    ref_id: str | None = None
    ordinal: int = 0


@dataclass
class Dropped(Exception):
    reason: str


# --------------------------------------------------------------------------- validation rules

_PLACEHOLDER_RE = re.compile(r"placeholder question|to be injected|\(actual question|lorem ipsum", re.I)
_DUMP_Q_RE = re.compile(r"(?<![\w])Q\s?\d{1,3}\s*[.):](?=\s)")
_PLACEHOLDER_EXPL_RE = re.compile(
    r"coming soon|to be updated|to be added|to be injected|\btbd\b|^n/?a\.?$|no explanation|"
    r"explanation (?:is )?(?:not )?(?:available|provided|pending)|^none\.?$",
    re.I,
)
_ITEM1_RE = re.compile(r"(?<![\w.])\(?(?:1|i|a)[.)]\s*\S", re.I)
_ITEM2_RE = re.compile(r"(?<![\w.])\(?(?:2|ii|b)[.)]\s*\S", re.I)
_NUMBERED_RE = re.compile(r"(?<![\w.])\(?[1-9][.)]\s*\S")
_STATEMENT_WORDS_RE = re.compile(r"statement[\s-]*(?:i|1|ii|2)\b|assertion|\(a\)|\(r\)|\breason\b", re.I)
_GIVEN_ABOVE_RE = re.compile(
    r"given above|above statements\b|statements? (?:above|given)|above pairs\b|"
    r"(?:using|select the correct answer using) the (?:codes?|code given)|which of the (?:above )?statements?",
    re.I,
)
# options such as "1 and 2 only", "1, 2 and 3", "Both 1 and 2", "Neither 1 nor 2", "3 only"
_CODE_WORDS = {"and", "or", "nor", "only", "both", "neither", "either", "all", "of", "these", "the", "above"}
_NUMWORD_OPTION_RE = re.compile(r"^\s*(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|none|all)\s*$", re.I)
_LABEL_PREFIX_RE = re.compile(r"^\s*\(?([A-Da-d])[.)]\s+(?=\S)")
_COUNT_OPTION_RE = re.compile(r"^\s*(?:only\s+)?(?:one|two|three|four|all\s+(?:four|three|two)|none)(?:\s+of\s+(?:them|the\s+above))?(?:\s+only)?\s*$", re.I)
_ORDER_DEP_OPTION_RE = re.compile(
    r"\b(?:above|both|neither|none of|all of|any of|either|statement[\s-]*(?:i|ii|1|2)\b|a and r|r is|"
    r"all the|none the|more than one)\b|^\s*\(?[a-d]\)?\s*(?:and|&|,)\s*\(?[a-d]\)?\s*$|^\s*\(?[a-d]\)?\s*$",
    re.I,
)
_SEQUENCE_OPTION_RE = re.compile(r"^\s*[A-Da-d1-4](?:\s*[-–>,→]\s*[A-Da-d1-4]){2,}\s*$")
_NUMERIC_ONLY_RE = re.compile(r"^\s*[-+]?[\d,]*\.?\d+\s*(?:%|[A-Za-z]{0,6})?\s*$")


def has_numbered_items(text: str) -> bool:
    """True if the stem contains a numbered/lettered list (1. 2. ...) or Statement-I style items."""
    if _STATEMENT_WORDS_RE.search(text):
        return True
    return bool(_ITEM1_RE.search(text) and _ITEM2_RE.search(text)) or len(_NUMBERED_RE.findall(text)) >= 2


def is_code_option(o: str) -> bool:
    toks = re.findall(r"[A-Za-z]+|\d+", o.lower())
    if not toks or re.search(r"[/.%]", o):
        return False
    if not all((t.isdigit() and len(t) == 1) or t in _CODE_WORDS for t in toks):
        return False
    # a bare number or fraction ("5", "1/3") is an answer value, not a statement code
    return any(t.isdigit() for t in toks) and ("," in o or any(t in _CODE_WORDS for t in toks))


def is_code_options(options: list) -> bool:
    return sum(1 for o in options if is_code_option(o)) >= 3


def strip_option_labels(options: list) -> list:
    """Remove embedded '(a) ' / 'A. ' prefixes when all four options carry them in order."""
    m = [_LABEL_PREFIX_RE.match(o) for o in options]
    if len(options) == 4 and all(m) and [x.group(1).upper() for x in m] == LABELS:
        return [o[x.end():].strip() for o, x in zip(options, m)]
    return options


def is_broken_statement_stem(text: str, options: list) -> bool:
    """Statement-type question whose numbered statements were lost in an earlier parse."""
    if has_numbered_items(text):
        return False
    if _GIVEN_ABOVE_RE.search(text):
        return True
    if is_code_options(options):
        return True
    low = text.lower()
    if "statements" in low and sum(1 for o in options if _COUNT_OPTION_RE.match(o)) >= 3:
        return True
    return False


def is_order_dependent(options: list) -> bool:
    """Options whose meaning depends on their position/the other options: never reorder these."""
    if is_code_options(options):
        return True
    if any(_COUNT_OPTION_RE.match(o) for o in options):
        return True
    if sum(1 for o in options if _NUMWORD_OPTION_RE.match(o)) >= 3:
        return True
    if any(_ORDER_DEP_OPTION_RE.search(o) for o in options):
        return True
    if any(_SEQUENCE_OPTION_RE.match(o) for o in options):
        return True
    if all(_NUMERIC_ONLY_RE.match(o) for o in options):
        return True
    return False


def resolve_answer(options: list, answer: dict | None) -> int | None:
    """Map an answer spec (text / index / letter) to a 0-based option index.

    Returns None when ``answer`` is missing/empty.  Raises Dropped for out-of-range
    indices or answers that are not among the options.
    """
    if not answer:
        return None
    n = len(options)
    if "index" in answer and answer["index"] is not None:
        idx = answer["index"]
        if not isinstance(idx, int) or idx < 0 or idx >= n:
            raise Dropped("answer_index_out_of_range")
        return idx
    text = answer.get("text")
    if text is None or not str(text).strip():
        return None
    t = str(text).strip()
    # 1. exact text, 2. normalised text
    for i, o in enumerate(options):
        if o == t:
            return i
    nt = normalise(t)
    hits = [i for i, o in enumerate(options) if normalise(o) == nt]
    if len(hits) == 1:
        return hits[0]
    # 3. letter ("B", "b", "(b)", "Option B")
    m = re.fullmatch(r"(?i)\s*(?:option\s*)?\(?([a-d])\)?[.)]?\s*", t)
    if m:
        return "abcd".index(m.group(1).lower())
    raise Dropped("answer_not_in_options")


def explanation_quality(explanation: str, correct_text: str | None) -> tuple[str, str]:
    """Return (quality, explanation_to_store).  Junk explanations are blanked."""
    e = clean_text(explanation)
    if not e:
        return "missing", ""
    if _PLACEHOLDER_EXPL_RE.search(e) and len(e) < 80:
        return "missing", ""
    ne = normalise(e)
    na = normalise(correct_text or "")
    if na:
        stripped = re.sub(r"^(?:the )?(?:correct )?(?:answer|option|choice)(?: is)?(?: [a-d]\b)?\s*", "", ne).strip()
        if ne == na or stripped == na:
            return "missing", ""
    if len(e) < 25:
        return "missing", ""
    if len(e) < 60:
        return "short", e
    return "ok", e


def normalise_difficulty(d: Any) -> str | None:
    if not d:
        return None
    d = str(d).strip().lower()
    if d in ("easy", "low", "simple", "l1", "level 1"):
        return "easy"
    if d in ("medium", "moderate", "mid", "average", "l2", "level 2"):
        return "medium"
    if d in ("hard", "tough", "difficult", "high", "very tough", "l3", "level 3"):
        return "hard"
    return None


# --------------------------------------------------------------------------- question type

_AR_RE = re.compile(r"\bassertion\b|\breason\s*\(r\)|statement[\s-]*(?:i|1)\b.*statement[\s-]*(?:ii|2)\b", re.I | re.S)
_MATCH_RE = re.compile(r"\bmatch(?:ed|es|ing)?\b|list[\s-]*(?:i|1)\b|column[\s-]*(?:i|1)\b|\bpairs?\b", re.I)
_CHRONO_RE = re.compile(
    r"chronological|correct sequence|correct order|arrange .{0,60}(?:order|sequence)|earliest to (?:the )?latest|"
    r"order of (?:occurrence|their)|sequence of (?:the )?(?:above|following)",
    re.I,
)
_MAP_RE = re.compile(
    r"north to south|south to north|east to west|west to east|from north|from south|\bmap\b|\blocated\b", re.I
)
_CAUSE_RE = re.compile(r"\bbecause\b|\bdue to\b|\bconsequences?\b|\bas a result\b|\bowing to\b|\bleads? to\b", re.I)


def infer_question_type(text: str, options: Iterable[str] = ()) -> str:
    """Rule-based classification.  Precedence is intentional: the more specific
    formats (assertion-reason, match, chronological) win over the generic
    statement-based test."""
    opts = " ".join(options)
    if _AR_RE.search(text) or re.search(r"explanation of a\b|correct explanation", opts, re.I):
        return "ASSERTION_REASON"
    if _MATCH_RE.search(text):
        return "MATCH_THE_FOLLOWING"
    if _CHRONO_RE.search(text):
        return "CHRONOLOGICAL"
    low = text.lower()
    if has_numbered_items(text) and (
        "correct" in low or "statement" in low or is_code_options(list(options))
    ):
        return "STATEMENT_BASED"
    if _MAP_RE.search(text):
        return "MAP_BASED"
    if _CAUSE_RE.search(text):
        return "CAUSE_EFFECT"
    return "FACTUAL"


# --------------------------------------------------------------------------- rebalancing


def option_permutation(key_text: str, n: int = 4) -> list[int]:
    """Deterministic Fisher-Yates permutation seeded by sha256 of the normalised text."""
    digest = hashlib.sha256(("perm|" + normalise(key_text)).encode("utf-8")).digest()
    perm = list(range(n))
    for i in range(n - 1, 0, -1):
        r = int.from_bytes(digest[2 * i : 2 * i + 2], "big") % (i + 1)
        perm[i], perm[r] = perm[r], perm[i]
    return perm


def rebalance_options(text: str, options: list, correct_idx: int) -> tuple[list, int]:
    """Reorder options deterministically; returns (new_options, new_correct_idx).

    Questions whose options are order dependent (code combinations, 'all of the above',
    sequences, assertion-reason...) are returned unchanged.
    """
    if is_order_dependent(options):
        return list(options), correct_idx
    perm = option_permutation(text, len(options))
    new_opts = [options[p] for p in perm]
    return new_opts, perm.index(correct_idx)


# --------------------------------------------------------------------------- provenance helpers


def to_repo_rel(path: str | None) -> str | None:
    """Windows / absolute path -> 'frontend/src/components/...' repo-relative POSIX path."""
    if not path:
        return None
    p = path.replace("\\", "/")
    m = re.search(r"(?:^|/)(frontend/src/.*)$", p)
    if m:
        return m.group(1)
    m = re.search(r"(?:^|/)(src/components/.*)$", p)
    if m:
        return "frontend/" + m.group(1)
    return p.lstrip("/")


def subject_from_path(rel: str | None) -> str | None:
    if not rel:
        return None
    for frag, slug in _FIXED_SUBJECT_FILES.items():
        if rel.endswith(frag):
            return slug
    m = re.search(r"components/(?:upsc/subjects|batch1(?:-1)?)/([^/]+)/", rel)
    if m:
        return DIR_TO_SLUG.get(m.group(1))
    return None


def chapter_from(rel: str | None, title: str | None) -> int | None:
    for src in (rel, title):
        if not src:
            continue
        base = src.rsplit("/", 1)[-1] if src is rel else src
        m = re.search(r"(?i)chapter[\s_-]*(\d{1,3})", base) or re.search(r"(?i)(?<![a-z])ch[\s_-]*(\d{1,3})(?!\d)", base)
        if m:
            return int(m.group(1))
        if src is rel:
            m = re.search(r"(?i)/chapter[\s_-]*(\d{1,3})/", src)
            if m:
                return int(m.group(1))
    return None


def book_from(rel: str | None, title: str | None, subject: str | None) -> str | None:
    low = (rel or "").lower()
    t = (title or "").lower()
    if subject == "history":
        if "/modern/" in low or t.startswith("modern") or re.match(r"chapter\d+mcqs", t) and "modern" in low:
            return "Spectrum"
        if "/ancient/" in low or t.startswith("ancient") or re.match(r"ch\d+_l\d", t):
            return "RS Sharma"
        if "/medieval/" in low or t.startswith("medieval") or t.startswith("mcqs for chapter") or t.startswith("chapter "):
            return "Satish Chandra"
        return None
    if subject == "polity-governance":
        if re.search(r"/polity/data/(?:mcqs/|chapters/)?chapter\d+", low):
            return "Laxmikanth"
        return None
    if subject == "geography":
        if "savinder" in low or "savindra" in low:
            return "Savindra Singh"
        m = re.search(r"ncert-class(11|12)", low)
        if m:
            return f"NCERT Class {m.group(1)} Geography"
        if "ncert" in low:
            return "NCERT Class 11/12 Geography"
    return None


# The only DB bank without a subject folder is the polity & current-affairs weekly test paper.
_FIXED_SUBJECT_FILES = {"batch1-1/data/saturday-test-data.ts": "polity-governance"}


# --------------------------------------------------------------------------- sources


def open_db_readonly(path: str) -> sqlite3.Connection:
    return sqlite3.connect(f"file:{path}?mode=ro", uri=True)


_DB_SQL = """
SELECT q.id, q.text, q.options, q.correct_answer, q.explanation, q.tags, q.difficulty,
       b.title, b.description
FROM bank_questions q
LEFT JOIN question_bank_questions j ON j.question_id = q.id
LEFT JOIN question_banks b ON b.id = j.question_bank_id
ORDER BY q.id, b.id
"""


def load_db_raws(conn: sqlite3.Connection) -> list[Raw]:
    """Read question rows (three question tables only) into Raw records."""
    raws: list[Raw] = []
    seen: set[int] = set()
    for qid, text, options, correct, expl, tags, diff, btitle, bdesc in conn.execute(_DB_SQL):
        if qid in seen:  # a question linked to several banks: keep the first link only
            continue
        seen.add(qid)
        try:
            opts_raw = json.loads(options) if isinstance(options, str) else (options or [])
        except ValueError:
            opts_raw = []
        answer: dict | None = None
        opts: list = []
        flagged = None
        for k, o in enumerate(opts_raw if isinstance(opts_raw, list) else []):
            if isinstance(o, dict):
                opts.append(str(o.get("text", "")))
                if o.get("isCorrect") is True:
                    flagged = k if flagged is None else -1
            else:
                opts.append("" if o is None else str(o))
        if correct is not None and str(correct).strip():
            answer = {"text": str(correct)}
        elif flagged is not None and flagged >= 0:
            answer = {"index": flagged}
        rel = None
        if bdesc:
            m = re.search(r"from frontend \((.*)\)\.?\s*$", bdesc, re.S)
            rel = to_repo_rel(m.group(1)) if m else None
        subject = subject_from_path(rel)
        title = btitle
        tag_title = None
        if btitle is None and tags and str(tags).startswith("Medieval History"):
            subject = "history"
            tag_title = str(tags)
            title = tag_title
        if subject is None and btitle and re.match(r"(?i)(mcqs for )?chapter \d+", btitle) and "frontend" not in (bdesc or ""):
            subject = "history"  # the 20 'MCQs for Chapter N' banks are the medieval-history (Satish Chandra) set
        raws.append(
            Raw(
                text=text or "",
                options=opts,
                answer=answer,
                explanation=expl or "",
                difficulty=diff,
                subject=subject,
                bank_title=title,
                file=rel,
                chapter=chapter_from(rel, title),
                from_pyq_file=bool(rel and re.search(r"pyq", rel, re.I)),
                origin="db",
                ref_id=str(qid),
                ordinal=len(raws),
            )
        )
    for r in raws:
        r.book = book_from(r.file, r.bank_title, r.subject)
    return raws


def _components_dirs(frontend_root: Path) -> list[tuple[Path, str]]:
    """Return [(dir, label)] of TS roots, newest first (upsc/subjects is the superset)."""
    for base in (frontend_root / "src" / "components", frontend_root / "components", frontend_root):
        if (base / "upsc" / "subjects").is_dir() or (base / "batch1").is_dir():
            out = []
            for sub in ("upsc/subjects", "batch1", "batch1-1"):
                if (base / sub).is_dir():
                    out.append((base / sub, sub))
            return out
    return []


def _rel_from_components(path: Path) -> str:
    s = path.as_posix()
    i = s.find("/src/components/")
    return "frontend" + s[i:] if i >= 0 else s


def _subject_dir(path: Path, root: Path) -> str | None:
    parts = path.relative_to(root).parts
    return parts[0] if parts else None


def load_ts_pyq_raws(frontend_root: Path) -> list[Raw]:
    """PYQ files (``*pyq*.ts``) with year.  upsc/subjects wins over batch1 for the same file."""
    seen_files: set[tuple[str, str]] = set()
    raws: list[Raw] = []
    for root, label in _components_dirs(frontend_root):
        for f in sorted(root.rglob("*pyq*.ts")):
            sdir = _subject_dir(f, root)
            subject = DIR_TO_SLUG.get(sdir or "")
            if subject is None:
                continue
            key = (subject, f.name)
            if key in seen_files:
                continue
            seen_files.add(key)
            src = f.read_text(encoding="utf-8", errors="replace")
            rel = _rel_from_components(f)
            for q in tsparse.extract_questions(src):
                exam = (q.get("exam") or "").upper()
                if "MAINS" in exam:
                    continue
                raws.append(
                    Raw(
                        text=q["question"],
                        options=q["options"],
                        answer=q["answer"],
                        explanation=q["explanation"],
                        difficulty=q["difficulty"],
                        subject=subject,
                        bank_title=q.get("export_name"),
                        file=rel,
                        book=None,
                        chapter=None,
                        is_pyq=q["year"] is not None,
                        year=q["year"],
                        from_pyq_file=True,
                        origin="ts-pyq",
                        ref_id=q.get("id"),
                        ordinal=len(raws),
                    )
                )
    return raws


def build_recovery_index(frontend_root: Path) -> dict[str, list[str]]:
    """normalised question text -> list of correct-option texts found in any TS data file."""
    index: dict[str, list[str]] = collections.defaultdict(list)
    for root, _ in _components_dirs(frontend_root):
        for f in root.rglob("*.ts"):
            try:
                src = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if "question" not in src or "options" not in src:
                continue
            for q in tsparse.extract_questions(src):
                if "answer to be updated" in (q["explanation"] or "").lower():
                    continue  # known-bad placeholder answers (economy PYQs)
                try:
                    idx = resolve_answer(q["options"], q["answer"])
                except Dropped:
                    continue
                if idx is None:
                    continue
                index[normalise(q["question"])].append(q["options"][idx])
    return index


# --------------------------------------------------------------------------- core pipeline


@dataclass
class Cand:
    raw: Raw
    reason: str | None = None  # drop reason when invalid
    options: list = field(default_factory=list)
    idx: int | None = None  # index of correct option in options (original order)
    unverified: bool = False
    explanation: str = ""
    quality: str = "missing"
    recovered: bool = False

    @property
    def valid(self) -> bool:
        return self.reason is None

    def rank(self) -> tuple:
        q = {"ok": 2, "short": 1, "missing": 0}[self.quality]
        return (
            self.valid,
            self.raw.is_pyq,
            self.valid and not self.unverified,
            q,
            self.raw.chapter is not None,
            -self.raw.ordinal,
        )


def _is_economy_unverified_pyq(raw: Raw) -> bool:
    expl = (raw.explanation or "").lower()
    return (raw.from_pyq_file and raw.subject == "economy") or "answer to be updated" in expl


def validate(raw: Raw, recovery: dict[str, list[str]] | None = None) -> Cand:
    """Apply all drop rules to one raw row and compute its answer/explanation state."""
    cand = Cand(raw=raw)
    text = clean_text(raw.text)
    raw_options = [clean_text(o) for o in raw.options]
    options = strip_option_labels(raw_options)
    cand.options = options

    def drop(reason: str) -> Cand:
        cand.reason = reason
        return cand

    if not text:
        return drop("empty_text")
    if _PLACEHOLDER_RE.search(text):
        return drop("placeholder")
    if (re.search(r"\bAnswer\s*:", text) and re.search(r"\bExplanation\s*:", text)) or _DUMP_Q_RE.search(text):
        return drop("parse_dump")
    if len(options) != 4:
        return drop("options_count_not_4")
    if any(not o for o in options):
        return drop("empty_option")
    if len({normalise(o) for o in options}) != 4:
        return drop("duplicate_options")
    if is_broken_statement_stem(text, options):
        return drop("broken_statement_stem")

    answer = raw.answer
    if options is not raw_options and answer and answer.get("text"):
        m = _LABEL_PREFIX_RE.match(clean_text(answer["text"]))
        if m:
            answer = {"text": clean_text(answer["text"])[m.end():].strip()}
    try:
        idx = resolve_answer(options, answer)
    except Dropped as d:
        return drop(d.reason)

    forced_unverified = "answer to be updated" in (raw.explanation or "").lower()
    if forced_unverified:
        idx = None  # the stored index (always 0) is a placeholder, not a real answer
    if idx is None:
        # try to recover the answer text from other copies of this question (TS data files)
        found = recovery.get(normalise(text)) if recovery else None
        if found:
            cands = {normalise(a): a for a in found}
            hit = [i for i, o in enumerate(options) if normalise(o) in cands]
            if len(cands) == 1 and len(hit) == 1 and not forced_unverified:
                idx = hit[0]
                cand.recovered = True
        if idx is None:
            if _is_economy_unverified_pyq(raw):
                cand.unverified = True
            else:
                return drop("no_answer")
    cand.idx = idx
    if cand.unverified:
        cand.quality, cand.explanation = explanation_quality(raw.explanation, None)
    else:
        cand.quality, cand.explanation = explanation_quality(raw.explanation, options[idx])
    return cand


def _merge_into(winner: Cand, others: list[Cand]) -> None:
    """Fill gaps of the chosen candidate from its (same-text) duplicates."""
    w = winner.raw
    for o in others:
        if o is winner:
            continue
        r = o.raw
        if w.chapter is None and r.chapter is not None:
            w.chapter = r.chapter
            if w.book is None:
                w.book = r.book
        if w.book is None and r.book:
            w.book = r.book
        if w.difficulty is None and r.difficulty:
            w.difficulty = r.difficulty
        if winner.unverified and o.valid and not o.unverified and o.idx is not None:
            wanted = normalise(o.options[o.idx])
            hits = [i for i, x in enumerate(winner.options) if normalise(x) == wanted]
            if len(hits) == 1:
                winner.idx, winner.unverified = hits[0], False
                if o.quality != "missing":
                    winner.explanation, winner.quality = o.explanation, o.quality
                else:
                    winner.quality = o.quality
                    winner.explanation = ""
        if winner.quality == "missing" and o.valid and o.quality != "missing" and not winner.unverified:
            if o.idx is not None and normalise(o.options[o.idx]) == normalise(winner.options[winner.idx]):
                winner.explanation, winner.quality = o.explanation, o.quality


def build_record(c: Cand) -> dict:
    r = c.raw
    text = clean_text(r.text)
    opts, idx = c.options, c.idx
    if idx is not None:
        new_opts, new_idx = rebalance_options(text, opts, idx)
        correct_option = LABELS[new_idx]
    else:
        new_opts, new_idx = list(opts), None
        correct_option = None
    return {
        "id": question_id(text),
        "question_text": text,
        "options": [{"label": LABELS[i], "text": o} for i, o in enumerate(new_opts)],
        "correct_option": correct_option,
        "explanation": c.explanation,
        "explanation_quality": c.quality,
        "answer_status": "unverified" if c.unverified or idx is None else "ok",
        "question_type": infer_question_type(text, new_opts),
        "difficulty": normalise_difficulty(r.difficulty),
        "source_ref": {
            "bank_title": r.bank_title,
            "file": r.file,
            "book": r.book,
            "chapter": r.chapter,
        },
        "is_pyq": bool(r.is_pyq),
        "pyq": {"exam": "PRELIMS", "year": r.year} if r.is_pyq else None,
    }


def empty_stats() -> dict:
    return {
        "input_rows": 0,
        "unique": 0,
        "duplicates_removed": 0,
        "dropped": collections.Counter(),
        "kept": 0,
        "pyqs": 0,
        "unverified": 0,
        "recovered_answers": 0,
        "not_reordered": 0,
        "explanation_quality": collections.Counter(),
        "answer_before": collections.Counter(),
        "answer_after": collections.Counter(),
        "question_type": collections.Counter(),
    }


def process(raws: list[Raw], recovery: dict[str, list[str]] | None = None, subjects: set[str] | None = None):
    """Run the whole pipeline.  Returns ({slug: [records]}, {slug: stats})."""
    groups: dict[str, dict[str, list[Cand]]] = collections.defaultdict(lambda: collections.defaultdict(list))
    stats: dict[str, dict] = collections.defaultdict(empty_stats)
    for raw in raws:
        subj = raw.subject
        if subj is None:
            subj = "unassigned"
        if subjects and subj not in subjects:
            continue
        stats[subj]["input_rows"] += 1
        cand = validate(raw, recovery) if subj != "unassigned" else Cand(raw=raw, reason="subject_unknown")
        groups[subj][normalise(clean_text(raw.text)) or f"__empty{raw.ordinal}"].append(cand)

    out: dict[str, list[dict]] = {}
    for subj, by_key in groups.items():
        st = stats[subj]
        records: list[dict] = []
        for key, cands in by_key.items():
            st["unique"] += 1
            st["duplicates_removed"] += len(cands) - 1
            best = max(cands, key=lambda c: c.rank())
            if not best.valid:
                st["dropped"][best.reason] += 1
                continue
            _merge_into(best, cands)
            rec = build_record(best)
            if best.recovered:
                st["recovered_answers"] += 1
            if best.idx is not None:
                st["answer_before"][LABELS[best.idx]] += 1
                st["answer_after"][rec["correct_option"]] += 1
                if is_order_dependent(best.options):
                    st["not_reordered"] += 1
            else:
                st["unverified"] += 1
            st["kept"] += 1
            st["pyqs"] += int(rec["is_pyq"])
            st["explanation_quality"][rec["explanation_quality"]] += 1
            st["question_type"][rec["question_type"]] += 1
            records.append(rec)
        records.sort(key=lambda r: (r["source_ref"]["file"] or "", r["source_ref"]["chapter"] or 0, r["id"]))
        out[subj] = records
    return out, dict(stats)


# --------------------------------------------------------------------------- output


def _dump_line(rec: dict) -> str:
    return json.dumps(rec, ensure_ascii=False, separators=(",", ":"))


def write_subject_files(out_dir: Path, slug: str, records: list[dict], generated_at: str) -> list[tuple[str, int]]:
    """Write <slug>.json (or <slug>-partN.json when > ~6 MB).  Returns [(filename, bytes)]."""
    lines = [_dump_line(r) for r in records]
    sizes = [len(l.encode("utf-8")) + 2 for l in lines]
    total = sum(sizes)
    nparts = max(1, math.ceil(total / MAX_FILE_BYTES))
    # remove stale files of this subject
    for old in list(out_dir.glob(f"{slug}.json")) + list(out_dir.glob(f"{slug}-part*.json")):
        old.unlink()
    written: list[tuple[str, int]] = []
    per = math.ceil(len(lines) / nparts) if lines else 0
    for p in range(nparts):
        chunk = lines[p * per : (p + 1) * per] if nparts > 1 else lines
        name = f"{slug}.json" if nparts == 1 else f"{slug}-part{p + 1}.json"
        head = {"source": "eduecosystem", "generated_at": generated_at, "subject_slug": slug}
        if nparts > 1:
            head.update({"part": p + 1, "parts": nparts})
        head_json = json.dumps(head, ensure_ascii=False)[:-1]
        body = f'{head_json},"questions":[\n' + ",\n".join(chunk) + "\n]}\n"
        (out_dir / name).write_text(body, encoding="utf-8")
        written.append((name, len(body.encode("utf-8"))))
    return written


def _dist(counter: collections.Counter) -> str:
    total = sum(counter.get(l, 0) for l in LABELS)
    if not total:
        return "-"
    return " / ".join(f"{l} {counter.get(l, 0)} ({100 * counter.get(l, 0) / total:.0f}%)" for l in LABELS)


def render_report(stats: dict[str, dict], generated_at: str, files: dict[str, list[tuple[str, int]]]) -> str:
    L: list[str] = []
    L.append("# Eduecosystem import report\n")
    L.append(f"Generated: {generated_at}  \nGenerator: `backend/scripts/eduecosystem_import/convert.py`\n")
    L.append("## Summary\n")
    L.append("| Subject | Input rows | Unique | Dropped | Kept | PYQs | Unverified answers | Output files |")
    L.append("|---|---:|---:|---:|---:|---:|---:|---|")
    tot = collections.Counter()
    for slug in sorted(stats):
        s = stats[slug]
        dropped = sum(s["dropped"].values())
        fl = ", ".join(f"{n} ({b / 1e6:.2f} MB)" for n, b in files.get(slug, [])) or "-"
        L.append(f"| {slug} | {s['input_rows']} | {s['unique']} | {dropped} | {s['kept']} | {s['pyqs']} | {s['unverified']} | {fl} |")
        tot.update({"in": s["input_rows"], "u": s["unique"], "d": dropped, "k": s["kept"], "p": s["pyqs"], "v": s["unverified"]})
    L.append(f"| **total** | {tot['in']} | {tot['u']} | {tot['d']} | {tot['k']} | {tot['p']} | {tot['v']} | |")
    L.append("")
    L.append(
        "Unique = distinct normalised question texts within the subject (duplicates across banks are merged). "
        "Dropped counts are over unique questions. Answer distributions cover kept questions with a known answer.\n"
    )
    for slug in sorted(stats):
        s = stats[slug]
        L.append(f"## {slug}\n")
        L.append(f"- Input rows: {s['input_rows']}; duplicates merged: {s['duplicates_removed']}; unique: {s['unique']}")
        L.append(f"- Kept: {s['kept']} (PYQs: {s['pyqs']}; unverified answers: {s['unverified']}; answers recovered from TS data: {s['recovered_answers']})")
        L.append("- Dropped by reason: " + (", ".join(f"{k} {v}" for k, v in s["dropped"].most_common()) or "none"))
        eq = s["explanation_quality"]
        L.append(f"- Explanation quality: ok {eq.get('ok', 0)}, short {eq.get('short', 0)}, missing {eq.get('missing', 0)}")
        L.append(f"- Answer position before rebalancing: {_dist(s['answer_before'])}")
        L.append(f"- Answer position after rebalancing:  {_dist(s['answer_after'])}")
        L.append(f"- Left in original order (order-dependent options): {s['not_reordered']}")
        L.append("- Question types: " + ", ".join(f"{k} {v}" for k, v in s["question_type"].most_common()))
        L.append("")
    return "\n".join(L)


# --------------------------------------------------------------------------- CLI


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", required=True, help="path to eduecosystem_v2.db (opened read-only)")
    ap.add_argument("--frontend-root", required=True, help="the Eduecosystem 'frontend' directory (contains src/components)")
    ap.add_argument("--out", default=str(DEFAULT_OUT), help="output directory (default: gs_lms/data/retention)")
    ap.add_argument("--subjects", default=None, help="comma-separated subject slugs to convert (default: all)")
    ap.add_argument("--dry-run", action="store_true", help="compute and print the summary; write nothing")
    args = ap.parse_args(argv)

    subjects = None
    if args.subjects:
        subjects = {s.strip() for s in args.subjects.split(",") if s.strip()}
        bad = subjects - set(SUBJECT_SLUGS)
        if bad:
            ap.error(f"unknown subject slug(s): {sorted(bad)}; valid: {SUBJECT_SLUGS}")

    frontend_root = Path(args.frontend_root)
    conn = open_db_readonly(args.db)
    try:
        raws = load_db_raws(conn)
    finally:
        conn.close()
    n_db = len(raws)
    pyq_raws = load_ts_pyq_raws(frontend_root)
    for r in pyq_raws:
        r.ordinal = len(raws)
        raws.append(r)
    print(f"loaded {n_db} DB rows and {len(pyq_raws)} TS PYQ rows", file=sys.stderr)
    recovery = build_recovery_index(frontend_root)
    print(f"answer-recovery index: {len(recovery)} distinct questions", file=sys.stderr)

    records, stats = process(raws, recovery, subjects)
    generated_at = _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()
    files: dict[str, list[tuple[str, int]]] = {}
    out_dir = Path(args.out)
    if not args.dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)
    for slug in sorted(records):
        if slug not in SUBJECT_SLUGS:
            continue
        if not args.dry_run:
            files[slug] = write_subject_files(out_dir, slug, records[slug], generated_at)
    report_stats = {k: v for k, v in stats.items() if k in SUBJECT_SLUGS}
    if "unassigned" in stats:
        report_stats["unassigned"] = stats["unassigned"]
    report = render_report(report_stats, generated_at, files)
    if args.dry_run:
        print(report)
    else:
        if subjects is None:
            (out_dir / "REPORT.md").write_text(report + "\n", encoding="utf-8")
        else:
            print(report)
        for slug, fl in files.items():
            for name, size in fl:
                print(f"wrote {out_dir / name} ({size / 1e6:.2f} MB)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Match questions from a question bank to the leaf topics of a GS subject file.

Deterministic and offline (no AI): every leaf topic becomes a TF-IDF "document"
made from its title, its parent titles, its concept checklist, its section text
and the MCQs it already has. Each bank question is scored against every topic by
cosine similarity. The result is a spreadsheet (CSV) the team reviews; only rows
marked as approved are turned into a *supplement* file that the importer merges
into the subject before checking and importing it.

    python -m app.core.gs_lms.bank_matcher --subject-file S.json --bank B.json --out matches.csv
    python -m app.core.gs_lms.bank_matcher apply --csv matches.csv --bank B.json \\
        --subject-file S.json --out supplement.json
    python -m app.core.gs_lms.bank_matcher calibrate --subject-file S.json

Bank questions may come from paid books. Never commit a matches file, a
supplement or the bank itself; the default output folders are git-ignored.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Optional

import numpy as np

from app.core.gs_lms.content_tree import (
    TopicIndex,
    collect_text,
    iter_leaves,
    mcq_option_texts,
    normalise_question,
)
from app.core.gs_lms.models import GsLmsQuestionTypeEnum

# --- thresholds ------------------------------------------------------------
# A bank question is suggested as "add" when its best topic scores at least
# T1 (absolute similarity) and beats the second-best topic by at least T2.
# Chosen from the Geography score distribution; see docs/CONTENT_PIPELINE.md.
T1_SCORE = 0.06
T2_MARGIN = 0.03

MCQS_PER_TOPIC = 15
DEFAULT_CAP_PER_TOPIC = 25

SUPPLEMENTS_DIR = Path(__file__).resolve().parent / "data" / "supplements"

CSV_COLUMNS = [
    "bank_question_id",
    "question_preview",
    "best_topic_title",
    "best_score",
    "margin",
    "second_topic_title",
    "suggested_action",
    "reason",
    "other_candidates",
    "approved",
]

# Field weights when building a topic document / a question text.
W_TITLE = 3
W_ANCESTOR = 1
W_CHECKLIST = 2
W_SECTIONS = 1
W_MCQS = 1
W_QUESTION = 2

_STOPWORDS = frozenset(
    """a an the of in on at to for from by with and or nor but as is are was were be been being it its this that these
    those which who whom what when where why how into than then there their they he she his her not no also can may
    will would should could has have had do does did if so such any all each other about over under between
    during after before while""".split()
)
# Wording that appears in almost every MCQ and says nothing about the topic.
_MCQ_BOILERPLATE = frozenset(
    """consider following statement statements correct incorrect given above below select answer using code codes true
    false assertion reason match list both neither only one two three four option options right wrong""".split()
)
_DROP = _STOPWORDS | _MCQ_BOILERPLATE
_TOKEN = re.compile(r"[a-z0-9]+")


# --- text -> terms ---------------------------------------------------------


def _stem(word: str) -> str:
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 3 and word.endswith("s") and not word.endswith(("ss", "us", "is")):
        return word[:-1]
    return word


def tokenize(text: str) -> list[str]:
    """Lower-case words (accents removed, plurals trimmed). Numbers and years are kept."""
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch)).lower()
    return [_stem(t) for t in _TOKEN.findall(text) if t not in _DROP]


def term_counts(text: str, weight: int = 1) -> Counter:
    """Word unigrams and bigrams of ``text`` with each count multiplied by ``weight``."""
    tokens = tokenize(text)
    counts: Counter = Counter(tokens)
    counts.update(f"{a} {b}" for a, b in zip(tokens, tokens[1:]))
    if weight != 1:
        for key in counts:
            counts[key] *= weight
    return counts


# --- topic model -----------------------------------------------------------


def _leaf_document(leaf: dict[str, Any], ancestors: Iterable[str], include_mcqs: bool) -> Counter:
    doc: Counter = Counter()
    doc.update(term_counts(str(leaf.get("title") or ""), W_TITLE))
    for title in ancestors:
        doc.update(term_counts(title, W_ANCESTOR))
    for item in leaf.get("concept_checklist") or []:
        if isinstance(item, str):
            doc.update(term_counts(item, W_CHECKLIST))
    for concept in leaf.get("concepts") or []:
        if isinstance(concept, dict):
            doc.update(term_counts(" ".join(collect_text([concept.get("title"), concept.get("key_points")])), W_CHECKLIST))
    for section in leaf.get("content_sections") or []:
        if isinstance(section, dict):
            doc.update(term_counts(" ".join(collect_text(section.get("blocks"))), W_SECTIONS))
    if include_mcqs:
        for mcq in leaf.get("mcq_questions") or []:
            if isinstance(mcq, dict):
                text = " ".join([str(mcq.get("question_text") or ""), *mcq_option_texts(mcq), str(mcq.get("explanation") or "")])
                doc.update(term_counts(text, W_MCQS))
    return doc


class TopicModel:
    """TF-IDF vectors for the leaf topics of one subject file."""

    def __init__(self, subject_data: dict[str, Any], *, include_mcqs: bool = True):
        self.leaves: list[dict[str, Any]] = []
        # Titles used by more than one leaf: supplements match topics by title, so only
        # the first such topic can be a target. The rest are listed for the summary.
        self.duplicate_titles: list[str] = []
        docs: list[Counter] = []
        seen_titles: set[str] = set()
        for leaf, ancestors in iter_leaves(subject_data.get("tree") or []):
            title = str(leaf.get("title") or "")
            if title in seen_titles:
                self.duplicate_titles.append(title)
                continue
            seen_titles.add(title)
            self.leaves.append(leaf)
            docs.append(_leaf_document(leaf, ancestors, include_mcqs))
        self.titles = [str(leaf.get("title") or "") for leaf in self.leaves]
        n = len(docs)
        df: Counter = Counter()
        for doc in docs:
            df.update(doc.keys())
        self.vocab = {term: i for i, term in enumerate(sorted(df))}
        self.idf = np.zeros(len(self.vocab), dtype=np.float32)
        for term, i in self.vocab.items():
            self.idf[i] = math.log((1 + n) / (1 + df[term])) + 1.0
        self.idf_unknown = math.log(1 + n) + 1.0
        self.matrix = np.zeros((n, len(self.vocab)), dtype=np.float32)
        for row, doc in enumerate(docs):
            for term, count in doc.items():
                j = self.vocab[term]
                self.matrix[row, j] = (1.0 + math.log(count)) * self.idf[j]
        norms = np.linalg.norm(self.matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.matrix /= norms

    def scores(self, counts: Counter) -> np.ndarray:
        """Cosine similarity of a term-count bag to every topic (zeros when nothing overlaps)."""
        idx: list[int] = []
        vals: list[float] = []
        norm_sq = 0.0
        for term, count in counts.items():
            tf = 1.0 + math.log(count)
            j = self.vocab.get(term)
            if j is None:
                norm_sq += (tf * self.idf_unknown) ** 2
            else:
                w = tf * float(self.idf[j])
                norm_sq += w * w
                idx.append(j)
                vals.append(w)
        if not idx or norm_sq == 0:
            return np.zeros(len(self.leaves), dtype=np.float32)
        sims = self.matrix[:, idx] @ np.asarray(vals, dtype=np.float32)
        return sims / math.sqrt(norm_sq)


# --- bank questions --------------------------------------------------------


def bank_option_texts(question: dict[str, Any]) -> list[str]:
    return mcq_option_texts(question)


def question_counts(question: dict[str, Any]) -> Counter:
    counts = term_counts(str(question.get("question_text") or ""), W_QUESTION)
    counts.update(term_counts(" ".join(bank_option_texts(question)), 1))
    counts.update(term_counts(str(question.get("explanation") or ""), 1))
    return counts


def convert_bank_options(question: dict[str, Any]) -> Optional[tuple[list[dict[str, str]], str]]:
    """The bank question's options as subject-format MCQ options (labels A-D) and its
    correct option letter, or None when the question cannot be used as it stands."""
    raw = question.get("options")
    if not isinstance(raw, list) or len(raw) != 4:
        return None
    labels, texts = [], []
    for i, opt in enumerate(raw):
        if isinstance(opt, dict):
            labels.append(str(opt.get("label") or "ABCD"[i]).strip().upper())
            texts.append(str(opt.get("text") or "").strip())
        elif isinstance(opt, str):
            labels.append("ABCD"[i])
            texts.append(opt.strip())
        else:
            return None
    if not all(texts):
        return None
    correct = str(question.get("correct_option") or "").strip().upper()
    if correct not in labels:
        return None
    new_correct = "ABCD"[labels.index(correct)]
    return [{"label": "ABCD"[i], "text": t} for i, t in enumerate(texts)], new_correct


def _bank_problem(question: dict[str, Any]) -> Optional[str]:
    """Why a bank question must be skipped regardless of topic, or None."""
    status = question.get("answer_status")
    if status is not None and status != "ok":
        return f"answer status is {status!r}, not ok"
    if not str(question.get("question_text") or "").strip():
        return "no question text"
    if convert_bank_options(question) is None:
        return "options or correct answer are not usable"
    return None


# --- matching --------------------------------------------------------------


@dataclass
class MatchRow:
    bank_question_id: str
    question_preview: str
    best_topic_title: str
    best_score: float
    margin: float
    second_topic_title: str
    suggested_action: str
    reason: str = ""
    other_candidates: str = ""
    approved: str = ""

    def as_csv(self) -> list[Any]:
        return [
            self.bank_question_id,
            self.question_preview,
            self.best_topic_title,
            f"{self.best_score:.3f}",
            f"{self.margin:.3f}",
            self.second_topic_title,
            self.suggested_action,
            self.reason,
            self.other_candidates,
            self.approved,
        ]


@dataclass
class MatchResult:
    rows: list[MatchRow] = field(default_factory=list)
    existing_counts: dict[str, int] = field(default_factory=dict)  # topic title -> MCQs already in the file
    topic_order: list[str] = field(default_factory=list)
    duplicate_titles: list[str] = field(default_factory=list)

    def action_counts(self) -> Counter:
        return Counter(r.suggested_action for r in self.rows)

    def projected(self) -> dict[str, int]:
        add = Counter(r.best_topic_title for r in self.rows if r.suggested_action == "add")
        return {t: self.existing_counts.get(t, 0) + add[t] for t in self.topic_order}


def _preview(text: str) -> str:
    return " ".join(str(text or "").split())[:120]


def existing_question_keys(subject_data: dict[str, Any]) -> set[str]:
    keys: set[str] = set()
    for leaf, _ in iter_leaves(subject_data.get("tree") or []):
        for mcq in leaf.get("mcq_questions") or []:
            if isinstance(mcq, dict):
                keys.add(normalise_question(mcq.get("question_text")))
    keys.discard("")
    return keys


def match_bank(
    subject_data: dict[str, Any],
    bank: dict[str, Any],
    *,
    top: int = 3,
    t1: float = T1_SCORE,
    t2: float = T2_MARGIN,
) -> MatchResult:
    """Score every bank question against every leaf topic and suggest an action for each."""
    model = TopicModel(subject_data)
    if not model.leaves:
        raise ValueError("The subject file has no leaf topics to match against.")
    top = max(2, top)
    existing = existing_question_keys(subject_data)
    duplicates = set(model.duplicate_titles)
    seen_in_bank: set[str] = set()
    result = MatchResult(topic_order=list(model.titles), duplicate_titles=list(model.duplicate_titles))
    for title, leaf in zip(model.titles, model.leaves):
        result.existing_counts[title] = len([m for m in leaf.get("mcq_questions") or [] if isinstance(m, dict)])

    for q in bank.get("questions") or []:
        scores = model.scores(question_counts(q))
        order = np.argsort(-scores, kind="stable")
        best = int(order[0])
        second = int(order[1]) if len(order) > 1 else best
        best_score = float(scores[best])
        margin = best_score - float(scores[second]) if len(order) > 1 else best_score
        key = normalise_question(q.get("question_text"))
        reason = ""
        problem = _bank_problem(q)
        if problem:
            action, reason = "skip", problem
        elif key in existing:
            action, reason = "skip", "already a question in the subject file"
        elif key in seen_in_bank:
            action, reason = "skip", "same question appears earlier in the bank"
        elif model.titles[best] in duplicates:
            action, reason = "check", "two topics share this title; rename one before using it"
        elif best_score >= t1 and margin >= t2:
            action = "add"
        else:
            action = "check"
            reason = "low score" if best_score < t1 else "close to another topic"
        seen_in_bank.add(key)
        others = [f"{model.titles[int(i)]} ({scores[int(i)]:.2f})" for i in order[2:top]]
        result.rows.append(
            MatchRow(
                bank_question_id=str(q.get("id") or ""),
                question_preview=_preview(q.get("question_text")),
                best_topic_title=model.titles[best],
                best_score=best_score,
                margin=margin,
                second_topic_title=model.titles[second] if len(order) > 1 else "",
                suggested_action=action,
                reason=reason,
                other_candidates="; ".join(others),
            )
        )
    return result


def write_matches_csv(result: MatchResult, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(CSV_COLUMNS)
        for row in result.rows:
            writer.writerow(row.as_csv())


def format_summary(result: MatchResult, *, max_topic_lines: int = 40) -> str:
    counts = result.action_counts()
    lines = [
        f"Bank questions: {len(result.rows)}  (add: {counts['add']}, check: {counts['check']}, skip: {counts['skip']})"
    ]
    reasons = Counter(r.reason for r in result.rows if r.suggested_action == "skip")
    for reason, n in reasons.most_common():
        lines.append(f"  skipped, {reason}: {n}")
    for title in result.duplicate_titles:
        lines.append(f'  note: more than one topic is titled "{title}"; only the first is a match target (rename one to tell them apart)')
    projected = result.projected()
    full = sum(1 for t in result.topic_order if projected[t] >= MCQS_PER_TOPIC)
    lines.append(
        f"Topics that would have {MCQS_PER_TOPIC}+ MCQs if every 'add' row is approved: {full} of {len(result.topic_order)}"
    )
    short = [(t, projected[t]) for t in result.topic_order if projected[t] < MCQS_PER_TOPIC]
    if short:
        lines.append(f"Topics still short of {MCQS_PER_TOPIC} (existing + add):")
        for t, n in sorted(short, key=lambda x: x[1])[:max_topic_lines]:
            lines.append(f"  {n:>3}/{MCQS_PER_TOPIC}  (has {result.existing_counts.get(t, 0)})  {t}")
        if len(short) > max_topic_lines:
            lines.append(f"  … and {len(short) - max_topic_lines} more")
    return "\n".join(lines)


def write_topics_csv(result: MatchResult, path: Path) -> None:
    projected = result.projected()
    adds = Counter(r.best_topic_title for r in result.rows if r.suggested_action == "add")
    checks = Counter(r.best_topic_title for r in result.rows if r.suggested_action == "check")
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["topic_title", "existing_mcqs", "add_rows", "check_rows", "projected_if_add_approved", "target"])
        for t in result.topic_order:
            writer.writerow([t, result.existing_counts.get(t, 0), adds[t], checks[t], projected[t], MCQS_PER_TOPIC])


# --- calibration -----------------------------------------------------------


def calibrate(subject_data: dict[str, Any]) -> list[tuple[float, float, bool]]:
    """Score the subject's own MCQs against topics built *without* any MCQs.

    Returns ``(best_score, margin, matched_own_topic)`` per MCQ: a labelled sample
    for choosing thresholds."""
    model = TopicModel(subject_data, include_mcqs=False)
    out: list[tuple[float, float, bool]] = []
    for i, leaf in enumerate(model.leaves):
        for mcq in leaf.get("mcq_questions") or []:
            if not isinstance(mcq, dict):
                continue
            scores = model.scores(question_counts(mcq))
            order = np.argsort(-scores, kind="stable")
            best = int(order[0])
            margin = float(scores[best] - scores[order[1]]) if len(order) > 1 else float(scores[best])
            out.append((float(scores[best]), margin, best == i))
    return out


def format_calibration(sample: list[tuple[float, float, bool]]) -> str:
    if not sample:
        return "The subject file has no MCQs to calibrate on."
    n = len(sample)
    lines = [
        f"Calibration on {n} existing MCQs (topic text only, the MCQs themselves left out):",
        f"  top-1 topic correct overall: {sum(c for _, _, c in sample) / n:.1%}",
        "  T1 (score)  T2 (margin)   kept     precision   share of questions kept",
    ]
    for t1 in (0.10, 0.15, 0.20, 0.25, 0.30):
        for t2 in (0.0, 0.03, 0.05, 0.08):
            kept = [c for s, m, c in sample if s >= t1 and m >= t2]
            if kept:
                lines.append(f"  {t1:>9.2f}  {t2:>11.2f}  {len(kept):>5}   {sum(kept) / len(kept):>9.1%}   {len(kept) / n:>9.1%}")
    return "\n".join(lines)


# --- apply -----------------------------------------------------------------

_YES = {"yes", "y", "true", "1", "ok", "approve", "approved"}
_NO = {"", "no", "n", "false", "0", "skip", "reject", "rejected"}


def read_bank(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def apply_reviewed_csv(
    csv_path: Path,
    bank: dict[str, Any],
    subject_data: dict[str, Any],
    *,
    cap: int = DEFAULT_CAP_PER_TOPIC,
) -> tuple[dict[str, Any], list[str], list[str]]:
    """Turn the approved rows of a reviewed CSV into a supplement.

    Returns ``(supplement, problems, notes)``. When ``problems`` is not empty the
    supplement must not be used: each problem names the CSV row to fix."""
    index = TopicIndex(subject_data.get("tree") or [])
    bank_by_id = {str(q.get("id")): q for q in bank.get("questions") or []}
    existing_keys = existing_question_keys(subject_data)
    existing_counts = {id(leaf): len([m for m in leaf.get("mcq_questions") or [] if isinstance(m, dict)]) for leaf in index.leaves}
    problems: list[str] = []
    notes: list[str] = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        header = [h.strip() for h in (reader.fieldnames or [])]
        missing = [c for c in ("bank_question_id", "best_topic_title", "approved") if c not in header]
        if missing:
            return {}, [f"The CSV is missing the column(s): {', '.join(missing)}. Use the file the matcher wrote."], notes
        rows = [{(k or "").strip(): (v or "").strip() for k, v in r.items()} for r in reader]

    chosen: list[tuple[float, int, dict[str, Any], dict[str, Any], dict[str, Any]]] = []
    for n, row in enumerate(rows, start=2):  # row 1 is the header
        answer = row["approved"]
        if answer.casefold() in _NO:
            continue
        title = row["best_topic_title"] if answer.casefold() in _YES else answer
        leaf, why = index.find(title)
        if leaf is None:
            what = "the topic in best_topic_title" if answer.casefold() in _YES else f'the corrected topic "{answer}"'
            problems.append(f"Row {n}: {what} cannot be used: {why}")
            continue
        qid = row["bank_question_id"]
        question = bank_by_id.get(qid)
        if question is None:
            problems.append(f'Row {n}: question "{qid}" is not in the bank file you gave. Use the bank the CSV was made from.')
            continue
        bad = _bank_problem(question)
        if bad:
            notes.append(f"Row {n}: left out, {bad}.")
            continue
        try:
            score = float(row.get("best_score") or 0)
        except ValueError:
            score = 0.0
        chosen.append((score, n, row, question, leaf))

    # Best-scoring rows first, so the cap keeps the most clearly on-topic questions.
    chosen.sort(key=lambda item: (-item[0], item[1]))
    by_topic: dict[int, list[dict[str, Any]]] = {}
    seen = set(existing_keys)
    for _score, n, _row, question, leaf in chosen:
        key = normalise_question(question.get("question_text"))
        if key in seen:
            notes.append(f"Row {n}: left out, the question is already in the subject (or chosen twice).")
            continue
        slot = by_topic.setdefault(id(leaf), [])
        if existing_counts[id(leaf)] + len(slot) >= cap:
            notes.append(f'Row {n}: left out, topic "{leaf["title"]}" already has {cap} MCQs (the limit).')
            continue
        options, correct = convert_bank_options(question)  # type: ignore[misc]
        qtype = question.get("question_type")
        slot.append(
            {
                "question_text": str(question["question_text"]).strip(),
                "options": options,
                "correct_option": correct,
                "explanation": str(question.get("explanation") or "").strip(),
                "question_type": qtype if qtype in {e.value for e in GsLmsQuestionTypeEnum} else "FACTUAL",
                "bank_id": str(question.get("id")),
            }
        )
        seen.add(key)

    supplement = {
        "subject_slug": subject_data.get("subject_slug") or bank.get("subject_slug"),
        "kind": "mcq_supplement",
        "topics": [
            {"title": leaf["title"], "mcq_questions": by_topic[id(leaf)]}
            for leaf in index.leaves
            if by_topic.get(id(leaf))
        ],
    }
    return supplement, problems, notes


# --- CLI -------------------------------------------------------------------


def _load_json(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _cmd_match(args: argparse.Namespace) -> int:
    subject = _load_json(args.subject_file)
    bank = _load_json(args.bank)
    result = match_bank(subject, bank, top=args.top, t1=args.t1, t2=args.t2)
    out = Path(args.out)
    write_matches_csv(result, out)
    topics_out = out.with_name(out.stem + "_topics.csv")
    write_topics_csv(result, topics_out)
    print(format_summary(result))
    print(f"\nWrote {out} and {topics_out}.")
    print("These files contain bank questions: keep them out of git (the default folders are ignored).")
    return 0


def _cmd_apply(args: argparse.Namespace) -> int:
    subject = _load_json(args.subject_file)
    bank = _load_json(args.bank)
    supplement, problems, notes = apply_reviewed_csv(Path(args.csv), bank, subject, cap=args.cap)
    for note in notes:
        print(f"note: {note}")
    if problems:
        print(f"\n{len(problems)} problem(s) in the reviewed CSV. Nothing was written:")
        for p in problems:
            print(f"  - {p}")
        return 1
    slug = supplement.get("subject_slug") or "subject"
    out = Path(args.out) if args.out else SUPPLEMENTS_DIR / f"{slug}_mcqs.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(supplement, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(t["mcq_questions"]) for t in supplement["topics"])
    print(f"Wrote {total} MCQs for {len(supplement['topics'])} topics to {out}.")
    print("The supplement contains bank questions: keep it out of git. Import it with --supplement.")
    return 0


def _cmd_calibrate(args: argparse.Namespace) -> int:
    print(format_calibration(calibrate(_load_json(args.subject_file))))
    return 0


def main(argv: Optional[list[str]] = None) -> int:  # pragma: no cover - thin CLI wrapper
    argv = list(sys.argv[1:] if argv is None else argv)
    command = "match"
    if argv and argv[0] in ("match", "apply", "calibrate"):
        command = argv.pop(0)

    parser = argparse.ArgumentParser(prog=f"python -m app.core.gs_lms.bank_matcher {command if command != 'match' else ''}".strip())
    parser.add_argument("--subject-file", required=True, help="Subject content JSON.")
    if command == "calibrate":
        handler = _cmd_calibrate
    elif command == "apply":
        parser.add_argument("--csv", required=True, help="The reviewed matches CSV.")
        parser.add_argument("--bank", required=True, help="The bank JSON the CSV was made from.")
        parser.add_argument("--out", default=None, help="Supplement JSON to write (default: data/supplements/<subject>_mcqs.json).")
        parser.add_argument("--cap", type=int, default=DEFAULT_CAP_PER_TOPIC, help="Most MCQs one topic may have in total.")
        handler = _cmd_apply
    else:
        parser.add_argument("--bank", required=True, help="Question bank JSON.")
        parser.add_argument("--out", required=True, help="Matches CSV to write.")
        parser.add_argument("--top", type=int, default=3, help="How many candidate topics to list per question.")
        parser.add_argument("--t1", type=float, default=T1_SCORE, help="Minimum score for 'add'.")
        parser.add_argument("--t2", type=float, default=T2_MARGIN, help="Minimum margin over the second topic for 'add'.")
        handler = _cmd_match
    return handler(parser.parse_args(argv))


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())

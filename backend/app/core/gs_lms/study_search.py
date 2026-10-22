"""Find the ready-made study content that matches what a student typed.

``search(db, query)`` is index-free: it loads the REVIEWED leaf topics and
concepts (a handful of batched queries, never one per row) and scores them in
Python. Nothing is generated; only REVIEWED content is ever returned.

Scoring. Query and content are tokenised with ``understanding.tokenize``
(lowercase, stopwords removed, light stemming). Each query token is worth the
weight of the best field it appears in:

    concept title x3, leaf topic title x3, concept key points x2,
    mega / sub topic titles x1, titles of book chapters linked to the
    leaf's concepts x1.

The sum is divided by ``3 * number of query tokens``, so a score is 0..1 (1.0
means every query word is in a title). Numbers and years are facts: when the
query has any, every one must appear exactly in the candidate's text
(1757 never matches 1857), otherwise the candidate is dropped. Hits need a
score of at least ``SEARCH_MIN_SCORE``; scores below ``SEARCH_GOOD_SCORE`` are
"weak" and the caller logs them as a content request.

Two kinds of hit:
* ``concept``: a concept whose own title or key points match (the leaf title
  and the other fields only add to its score);
* ``topic``: a leaf topic matched through its title, its mega / sub topics or
  its concepts' book chapters. ``start_concept_id`` is the first reviewed
  concept to open it with.

Ties sort by subject display order, then node display order. This module only
reads; it never writes or commits.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsBookChapter,
    GsLmsConcept,
    GsLmsConceptBookRef,
    GsLmsNodeTypeEnum,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.understanding import tokenize

# Hits below this score are not returned.
SEARCH_MIN_SCORE = 0.5
# Best score below this (or no hit at all) counts as a content request.
SEARCH_GOOD_SCORE = 0.7
# Longest query the API accepts.
MAX_QUERY_CHARS = 200

W_CONCEPT_TITLE = 3.0
W_LEAF_TITLE = 3.0
W_KEY_POINTS = 2.0
W_ANCESTOR_TITLE = 1.0
W_CHAPTER_TITLE = 1.0
_MAX_WEIGHT = 3.0

_WORD = re.compile(r"[a-z0-9]+")


@dataclass
class SearchHit:
    kind: str  # "concept" | "topic"
    subject_slug: str
    subject_name: str
    leaf_id: int
    leaf_title: str
    concept_id: Optional[int]
    concept_title: Optional[str]
    breadcrumb: list[str]
    score: float
    matched_terms: list[str]
    start_concept_id: Optional[int] = None
    # Sort helpers (not part of the API shape).
    _order: tuple = field(default=(), repr=False, compare=False)


def query_tokens(query: str | None) -> set[str]:
    return tokenize(query)


def _display_terms(query: str, matched: set[str]) -> list[str]:
    """The words of the query (as typed, lowercased) whose stem matched."""
    seen: list[str] = []
    for word in _WORD.findall((query or "").lower()):
        stems = tokenize(word)
        if stems and stems <= matched and word not in seen:
            seen.append(word)
    return seen


def _score(
    q: set[str], fields: list[tuple[float, set[str]]], required_numbers: set[str]
) -> tuple[float, set[str], bool]:
    """(score, matched query tokens, has_numbers) for one candidate.

    ``fields`` is a list of (weight, token set). A candidate lacking any of
    ``required_numbers`` scores 0.
    """
    all_tokens: set[str] = set()
    for _, toks in fields:
        all_tokens |= toks
    if not required_numbers <= all_tokens:
        return 0.0, set(), False
    total = 0.0
    matched: set[str] = set()
    for token in q:
        best = max((w for w, toks in fields if token in toks), default=0.0)
        if best:
            total += best
            matched.add(token)
    return total / (_MAX_WEIGHT * len(q)), matched, True


def search(
    db: Session, query: str, subject_slug: Optional[str] = None, limit: int = 10
) -> list[SearchHit]:
    """Ranked hits for ``query`` over REVIEWED leaves and concepts."""
    q = query_tokens(query)
    if not q or limit <= 0:
        return []
    numbers = {t for t in q if t.isdigit()}

    subjects_q = db.query(GsSubject)
    if subject_slug:
        subjects_q = subjects_q.filter(GsSubject.slug == subject_slug)
    subjects = {s.id: s for s in subjects_q.all()}
    if not subjects:
        return []

    nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id.in_(list(subjects)),
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    by_id = {n.id: n for n in nodes}

    def reachable_chain(node: GsLmsSyllabusNode) -> Optional[list[GsLmsSyllabusNode]]:
        """root..node, or None when an ancestor is missing / not REVIEWED."""
        chain = [node]
        seen = {node.id}
        while chain[-1].parent_id is not None:
            parent = by_id.get(chain[-1].parent_id)
            if parent is None or parent.id in seen:
                return None
            chain.append(parent)
            seen.add(parent.id)
        return list(reversed(chain))

    leaves: dict[int, list[GsLmsSyllabusNode]] = {}
    for node in nodes:
        if node.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
            chain = reachable_chain(node)
            if chain is not None:
                leaves[node.id] = chain
    if not leaves:
        return []

    concepts = (
        db.query(GsLmsConcept)
        .filter(
            GsLmsConcept.syllabus_node_id.in_(list(leaves)),
            GsLmsConcept.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsConcept.display_order, GsLmsConcept.id)
        .all()
    )
    concepts_by_leaf: dict[int, list[GsLmsConcept]] = {}
    for c in concepts:
        concepts_by_leaf.setdefault(c.syllabus_node_id, []).append(c)

    chapter_titles: dict[int, list[str]] = {}  # concept id -> chapter titles
    if concepts:
        for concept_id, title in (
            db.query(GsLmsConceptBookRef.concept_id, GsLmsBookChapter.title)
            .join(GsLmsBookChapter, GsLmsBookChapter.id == GsLmsConceptBookRef.chapter_id)
            .filter(GsLmsConceptBookRef.concept_id.in_([c.id for c in concepts]))
            .all()
        ):
            chapter_titles.setdefault(concept_id, []).append(title)

    hits: list[SearchHit] = []
    for leaf_id, chain in leaves.items():
        leaf = chain[-1]
        subject = subjects[leaf.subject_id]
        leaf_concepts = concepts_by_leaf.get(leaf_id, [])
        leaf_tokens = tokenize(leaf.title)
        ancestor_tokens: set[str] = set()
        for a in chain[:-1]:
            ancestor_tokens |= tokenize(a.title)
        chapter_tokens: set[str] = set()
        for c in leaf_concepts:
            for t in chapter_titles.get(c.id, []):
                chapter_tokens |= tokenize(t)
        context = [
            (W_LEAF_TITLE, leaf_tokens),
            (W_ANCESTOR_TITLE, ancestor_tokens),
            (W_CHAPTER_TITLE, chapter_tokens),
        ]
        breadcrumb = [n.title for n in chain]
        base_order = (subject.display_order or 0, subject.id, leaf.display_order or 0, leaf.id)
        start_id = leaf_concepts[0].id if leaf_concepts else None

        # Concept hits: need evidence in the concept's own title / key points.
        for c in leaf_concepts:
            title_tokens = tokenize(c.title)
            kp_tokens: set[str] = set()
            for kp in c.key_points or []:
                if isinstance(kp, str):
                    kp_tokens |= tokenize(kp)
            own = title_tokens | kp_tokens
            if not (q & own):
                continue
            score, matched, ok = _score(
                q,
                [(W_CONCEPT_TITLE, title_tokens), (W_KEY_POINTS, kp_tokens), *context],
                numbers,
            )
            if ok and score >= SEARCH_MIN_SCORE:
                hits.append(SearchHit(
                    kind="concept", subject_slug=subject.slug, subject_name=subject.name,
                    leaf_id=leaf_id, leaf_title=leaf.title, concept_id=c.id,
                    concept_title=c.title, breadcrumb=breadcrumb, score=round(score, 4),
                    matched_terms=_display_terms(query, matched), start_concept_id=c.id,
                    _order=(*base_order, 0, c.display_order or 0, c.id),
                ))

        # Topic hit: the leaf, its mega / sub topics and its chapters.
        score, matched, ok = _score(q, context, numbers)
        if ok and score >= SEARCH_MIN_SCORE:
            hits.append(SearchHit(
                kind="topic", subject_slug=subject.slug, subject_name=subject.name,
                leaf_id=leaf_id, leaf_title=leaf.title, concept_id=None,
                concept_title=None, breadcrumb=breadcrumb, score=round(score, 4),
                matched_terms=_display_terms(query, matched), start_concept_id=start_id,
                _order=(*base_order, 1, 0, 0),
            ))

    hits.sort(key=lambda h: (-h.score, *h._order))
    return hits[:limit]


__all__ = [
    "SEARCH_MIN_SCORE", "SEARCH_GOOD_SCORE", "MAX_QUERY_CHARS", "SearchHit",
    "query_tokens", "search",
]

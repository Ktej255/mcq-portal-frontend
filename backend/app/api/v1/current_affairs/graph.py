"""CA Knowledge Graph endpoint — published items plus the links between them.

GET /current-affairs/graph?subject=&gs_paper=&date_from=&date_to=

Nodes are the newest published CA items matching the filters (capped at
MAX_GRAPH_ITEMS) and the syllabus topics they link to. Edges come from data the
CMS already stores: causality links, consecutive items in a thread, and
CA-to-syllabus links. Shape matches GraphNodeOut / GraphEdgeOut in the
frontend's caService.
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.current_affairs.ca_engine import ReviewStatus
from app.core.current_affairs.ca_models import (
    CACausalityLink,
    CAItem,
    CAStudentProgress,
    CASyllabusLink,
    CAThread,
    CAThreadItem,
)
from app.core.gs_lms.models import GsLmsSyllabusNode
from app.db.session import get_db
from app.models.domain import User

router = APIRouter()

MAX_GRAPH_ITEMS = 150


class GraphNodeOut(BaseModel):
    id: str
    node_type: str  # "ca_item" | "syllabus_node"
    label: str
    subject: str
    relevance_score: int
    publish_date: Optional[str]
    is_completed: bool


class GraphEdgeOut(BaseModel):
    id: str
    source: str
    target: str
    edge_type: str  # "thread" | "causality" | "syllabus_link"
    label: Optional[str]


class GraphOut(BaseModel):
    nodes: List[GraphNodeOut]
    edges: List[GraphEdgeOut]


def _item_key(item_id: int) -> str:
    return f"ca-{item_id}"


@router.get("/graph", response_model=GraphOut)
def get_graph(
    subject: Optional[str] = Query(None),
    gs_paper: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GraphOut:
    query = db.query(CAItem).filter(
        CAItem.review_status == ReviewStatus.PUBLISHED,
        CAItem.is_deleted == False,  # noqa: E712
    )
    if subject:
        query = query.filter(CAItem.subject == subject)
    if gs_paper:
        query = query.filter(CAItem.gs_paper == gs_paper)
    if date_from:
        query = query.filter(CAItem.publish_date >= date_from)
    if date_to:
        query = query.filter(CAItem.publish_date <= date_to)
    items = query.order_by(CAItem.publish_date.desc(), CAItem.id.desc()).limit(MAX_GRAPH_ITEMS).all()
    if not items:
        return GraphOut(nodes=[], edges=[])

    item_ids = [item.id for item in items]
    completed = {
        row.ca_item_id
        for row in db.query(CAStudentProgress.ca_item_id).filter(
            CAStudentProgress.student_id == current_user.id,
            CAStudentProgress.ca_item_id.in_(item_ids),
            CAStudentProgress.is_completed == True,  # noqa: E712
        )
    }

    nodes = [
        GraphNodeOut(
            id=_item_key(item.id),
            node_type="ca_item",
            label=item.title,
            subject=item.subject,
            relevance_score=item.relevance_score,
            publish_date=item.publish_date.isoformat() if item.publish_date else None,
            is_completed=item.id in completed,
        )
        for item in items
    ]
    edges: List[GraphEdgeOut] = []

    # Causality links between items that are both on the graph.
    for link in db.query(CACausalityLink).filter(
        CACausalityLink.source_item_id.in_(item_ids),
        CACausalityLink.target_item_id.in_(item_ids),
    ):
        edges.append(
            GraphEdgeOut(
                id=f"cause-{link.id}",
                source=_item_key(link.source_item_id),
                target=_item_key(link.target_item_id),
                edge_type="causality",
                label=link.impact_type,
            )
        )

    # Threads: connect consecutive items (by sequence order) that are on the graph.
    rows = (
        db.query(CAThreadItem, CAThread.title)
        .join(CAThread, CAThread.id == CAThreadItem.thread_id)
        .filter(CAThreadItem.item_id.in_(item_ids))
        .order_by(CAThreadItem.thread_id, CAThreadItem.sequence_order)
        .all()
    )
    previous: dict[int, int] = {}
    for thread_item, thread_title in rows:
        prev_item = previous.get(thread_item.thread_id)
        if prev_item is not None:
            edges.append(
                GraphEdgeOut(
                    id=f"thread-{thread_item.thread_id}-{prev_item}-{thread_item.item_id}",
                    source=_item_key(prev_item),
                    target=_item_key(thread_item.item_id),
                    edge_type="thread",
                    label=thread_title,
                )
            )
        previous[thread_item.thread_id] = thread_item.item_id

    # Syllabus topics the items link to.
    subject_by_item = {item.id: item.subject for item in items}
    seen_topics: set[int] = set()
    for link, topic in (
        db.query(CASyllabusLink, GsLmsSyllabusNode)
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == CASyllabusLink.syllabus_node_id)
        .filter(CASyllabusLink.ca_item_id.in_(item_ids))
    ):
        topic_key = f"syl-{topic.id}"
        if topic.id not in seen_topics:
            seen_topics.add(topic.id)
            nodes.append(
                GraphNodeOut(
                    id=topic_key,
                    node_type="syllabus_node",
                    label=topic.title,
                    subject=subject_by_item.get(link.ca_item_id, ""),
                    relevance_score=3,
                    publish_date=None,
                    is_completed=False,
                )
            )
        edges.append(
            GraphEdgeOut(
                id=f"syl-{link.id}",
                source=_item_key(link.ca_item_id),
                target=topic_key,
                edge_type="syllabus_link",
                label=link.link_type,
            )
        )

    return GraphOut(nodes=nodes, edges=edges)

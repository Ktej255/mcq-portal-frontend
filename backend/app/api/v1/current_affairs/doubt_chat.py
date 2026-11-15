"""CA Doubt Chat endpoints — AI-powered freeform Q&A per item.

Students can ask doubts about any CA item's content and get
context-aware AI responses.

Requirements: Enhancement 4 (AI Q&A Doubt Clearing)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import ai_rate_limit, get_current_user
from app.core.current_affairs.ca_models import CAItem, CADoubtChat
from app.core.current_affairs.doubt_chat_provider import (
    DoubtChatProviderUnavailableError,
    get_doubt_chat_provider,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatMessageIn(BaseModel):
    message: str = Field(..., min_length=5, max_length=2000)


class ChatMessageOut(BaseModel):
    role: str  # "student" or "ai"
    content: str
    timestamp: str
    provider: Optional[str] = None
    is_mock: Optional[bool] = None


class ChatSessionOut(BaseModel):
    item_id: int
    item_title: str
    messages: List[ChatMessageOut]
    total_messages: int


def _message_out(message: dict) -> ChatMessageOut:
    """Expose provenance when present while preserving historical JSON rows."""
    return ChatMessageOut(
        role=message["role"],
        content=message["content"],
        timestamp=message.get("timestamp", ""),
        provider=message.get("provider"),
        is_mock=message.get("is_mock"),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/items/{item_id}/doubt-chat", response_model=ChatSessionOut)
def get_doubt_chat(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the doubt chat session for a CA item (creates if not exists)."""
    item = db.query(CAItem).filter(
        CAItem.id == item_id,
        CAItem.review_status == "PUBLISHED",
        CAItem.is_deleted == False,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    chat = db.query(CADoubtChat).filter(
        CADoubtChat.student_id == current_user.id,
        CADoubtChat.ca_item_id == item_id,
    ).first()

    messages = chat.messages if chat else []

    return ChatSessionOut(
        item_id=item_id,
        item_title=item.title,
        messages=[_message_out(message) for message in messages],
        total_messages=len(messages),
    )


@router.post("/items/{item_id}/doubt-chat", response_model=ChatSessionOut, dependencies=[Depends(ai_rate_limit)])
def send_doubt_message(
    item_id: int,
    body: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist the student and real provider messages as one successful unit."""
    item = db.query(CAItem).filter(
        CAItem.id == item_id,
        CAItem.review_status == "PUBLISHED",
        CAItem.is_deleted == False,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    chat = db.query(CADoubtChat).filter(
        CADoubtChat.student_id == current_user.id,
        CADoubtChat.ca_item_id == item_id,
    ).first()
    prior_messages = list(chat.messages or []) if chat else []
    now = datetime.now(timezone.utc)
    student_message = {
        "role": "student",
        "content": body.message,
        "timestamp": now.isoformat(),
    }
    pending_history = [*prior_messages, student_message]

    try:
        provider = get_doubt_chat_provider()
        generated = provider.generate(
            {
                "title": item.title,
                "subject": item.subject,
                "gs_paper": item.gs_paper,
                "content_blocks": item.content_blocks,
                "so_what_analysis": item.so_what_analysis,
            },
            body.message,
            pending_history,
        )
    except DoubtChatProviderUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "CA_DOUBT_CHAT_PROVIDER_UNAVAILABLE",
                "message": "AI doubt chat is temporarily unavailable. Please retry.",
                "retryable": True,
                "provider": exc.provider,
            },
        ) from exc

    ai_message = {
        "role": "ai",
        "content": generated.text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "provider": generated.provider,
        "is_mock": generated.is_mock,
    }
    messages = [*pending_history, ai_message]

    try:
        if chat is None:
            chat = CADoubtChat(
                student_id=current_user.id,
                ca_item_id=item_id,
                messages=messages,
                total_messages=len(messages),
            )
            db.add(chat)
        else:
            chat.messages = messages
            chat.total_messages = len(messages)
        chat.last_message_at = now
        db.commit()
    except Exception:
        db.rollback()
        raise

    return ChatSessionOut(
        item_id=item_id,
        item_title=item.title,
        messages=[_message_out(message) for message in messages],
        total_messages=len(messages),
    )

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import User, RoleEnum
from app.core.clerk import verify_token
from app.core.config import settings

import threading
import time
from collections import defaultdict, deque
from typing import Optional

security = HTTPBearer(auto_error=False)

import logging
logger = logging.getLogger(__name__)

def get_current_user(db: Session = Depends(get_db), auth: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    auth_provided = bool(auth)
    logger.info(f"FORENSIC | get_current_user check | Auth provided: {auth_provided}")
    
    if not auth:
        logger.warning("FORENSIC | No auth credentials provided in request headers")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated: No Bearer token found in headers",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials: Token verification failed",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token_cred = auth.credentials.strip() if auth.credentials else ""
        if token_cred.startswith("MOCK_TOKEN"):
            # SECURITY: the MOCK_TOKEN bypass is a dev/test/e2e affordance only.
            # It is honored ONLY when explicitly enabled (settings.ALLOW_MOCK_AUTH),
            # which defaults to False, so production can never be impersonated via
            # a static token string. When disabled, a MOCK_TOKEN is just an
            # invalid credential and is rejected like any other bad token (401).
            if not settings.ALLOW_MOCK_AUTH:
                logger.warning(
                    "FORENSIC | MOCK_TOKEN presented but ALLOW_MOCK_AUTH is "
                    "disabled — rejecting as invalid credential"
                )
                raise credentials_exception
            logger.warning("FORENSIC | Using MOCK_TOKEN bypass")
            
            # Support MOCK_TOKEN_<google_uid> for persona simulation
            if "_" in token_cred:
                target_uid = token_cred.split("_", 1)[1]
                user = db.query(User).filter(User.google_uid == target_uid).first()
                if user:
                    return user
            
            # Default fallback for legacy MOCK_TOKEN
            user = db.query(User).filter(User.google_uid == "dev-validator-id").first()
            if not user:
                user = User(
                    google_uid="dev-validator-id",
                    email="validator@upsc.local",
                    full_name="Institutional Validator",
                    role=RoleEnum.ADMIN
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
        decoded_token = verify_token(auth.credentials)
    except Exception as e:
        logger.error(f"FORENSIC | Token verification exception: {str(e)}")
        raise credentials_exception

    google_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    name = decoded_token.get("name")
    picture = decoded_token.get("picture")
    
    logger.debug("FORENSIC | Token decoded | UID: %s", google_uid)

    if not google_uid or not email:
        logger.error("FORENSIC | Token missing UID or Email claims")
        raise credentials_exception

    user = db.query(User).filter(User.google_uid == google_uid).first()
    
    # Check if user should be an admin based on email
    is_bootstrap_admin = email in settings.ADMIN_EMAILS
    
    # Auto-create user on first login
    if not user:
        logger.info(f"FORENSIC | User not found in DB, auto-creating account for {email}")
        user = User(
            google_uid=google_uid,
            email=email,
            full_name=name,
            profile_picture=picture,
            role=RoleEnum.ADMIN if is_bootstrap_admin else RoleEnum.STUDENT
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif is_bootstrap_admin and user.role != RoleEnum.ADMIN:
        logger.info(f"FORENSIC | Elevating user {email} to ADMIN based on allowlist")
        user.role = RoleEnum.ADMIN
        db.commit()
        db.refresh(user)
    else:
        logger.info(f"FORENSIC | User found in DB | Role: {user.role}")
        
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    logger.debug("FORENSIC | get_current_admin check | User id: %s | Role: %s", current_user.id, current_user.role)
    if current_user.role != "ADMIN" and current_user.role != RoleEnum.ADMIN:
        logger.warning(f"FORENSIC | ACCESS DENIED | User {current_user.email} attempted admin access with role {current_user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin privileges required. Your current role is {current_user.role}"
        )
    return current_user


# ---------------------------------------------------------------------------
# Per-user rate limit for AI-backed endpoints (Gemini discussion, OCR,
# transcription, evaluation). Attach with
# ``dependencies=[Depends(ai_rate_limit)]``. Counts live in process memory (a
# sliding window per user for the last minute and the last day), which suits
# the single ECS task this service runs as; move the store to Redis or
# Postgres before running several tasks.
# ---------------------------------------------------------------------------

_AI_MINUTE = 60
_AI_DAY = 24 * 60 * 60
_ai_lock = threading.Lock()
_ai_hits: "defaultdict[int, deque[float]]" = defaultdict(deque)


def reset_ai_rate_limits() -> None:
    """Clear all AI rate-limit counters (used by tests)."""
    with _ai_lock:
        _ai_hits.clear()


def ai_rate_limit(current_user: User = Depends(get_current_user)) -> None:
    now = time.time()
    with _ai_lock:
        hits = _ai_hits[current_user.id]
        while hits and hits[0] <= now - _AI_DAY:
            hits.popleft()

        recent = [t for t in hits if t > now - _AI_MINUTE]
        if len(recent) >= settings.AI_RATE_LIMIT_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many AI requests. Please wait a minute and try again.",
                headers={"Retry-After": str(max(1, int(recent[0] + _AI_MINUTE - now) + 1))},
            )
        if len(hits) >= settings.AI_RATE_LIMIT_PER_DAY:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily AI limit reached. It resets within 24 hours.",
                headers={"Retry-After": str(max(1, int(hits[0] + _AI_DAY - now) + 1))},
            )

        hits.append(now)

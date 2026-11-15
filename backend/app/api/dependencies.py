from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import User, RoleEnum
from app.core.clerk import verify_token
from app.core.config import settings
from app.core.usage.models import DailyUsage

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

security = HTTPBearer(auto_error=False)

import logging
logger = logging.getLogger(__name__)

def get_current_user(db: Session = Depends(get_db), auth: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    logger.info("Authentication check; bearer credentials present=%s", bool(auth))

    if not auth:
        logger.warning("Authentication rejected because no bearer credentials were provided")
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

    token_cred = auth.credentials.strip() if auth.credentials else ""
    try:
        if token_cred.startswith("MOCK_TOKEN"):
            # SECURITY: this bypass remains available only when explicitly enabled.
            if (
                not settings.ALLOW_MOCK_AUTH
                or settings.APP_ENVIRONMENT not in {"development", "test", "local"}
            ):
                logger.warning("Mock authentication rejected because it is disabled or not allowed in this environment")
                raise credentials_exception

            logger.warning("Using explicitly enabled local mock authentication")
            if token_cred == "MOCK_TOKEN":
                target_uid = None
            elif token_cred.startswith("MOCK_TOKEN_"):
                target_uid = token_cred[len("MOCK_TOKEN_"):].strip()
                if not target_uid:
                    logger.warning("Mock authentication rejected because the persona is empty")
                    raise credentials_exception

                user = db.query(User).filter(User.google_uid == target_uid).first()
                if user:
                    return user

                logger.warning("Mock authentication rejected because the persona does not exist")
                raise credentials_exception
            else:
                logger.warning("Mock authentication rejected because the token format is invalid")
                raise credentials_exception

            # Only the exact unscoped MOCK_TOKEN may provision the explicit
            # local validator. Persona tokens must resolve an existing user and
            # can never fall through to this ADMIN account.
            user = db.query(User).filter(User.google_uid == "dev-validator-id").first()
            if not user:
                user = User(
                    google_uid="dev-validator-id",
                    # Reserved documentation domain: clearly fictitious, and the
                    # only kind of address UserResponse's EmailStr will serialise
                    # (RFC 2606 `.local` domains are rejected on the way out).
                    email="validator@example.com",
                    full_name="Institutional Validator",
                    role=RoleEnum.ADMIN,
                )
                db.add(user)
                try:
                    db.commit()
                    db.refresh(user)
                except IntegrityError:
                    db.rollback()
                    user = db.query(User).filter(User.google_uid == "dev-validator-id").first()
                    if not user:
                        raise credentials_exception
            return user

        decoded_token = verify_token(token_cred)
    except HTTPException:
        logger.warning("Authentication credential verification failed")
        raise credentials_exception
    except Exception:
        logger.warning("Authentication credential verification failed")
        raise credentials_exception

    clerk_sub = decoded_token.get("sub")
    email = decoded_token.get("email")
    name = decoded_token.get("name")
    picture = decoded_token.get("picture")

    if not isinstance(clerk_sub, str) or not clerk_sub.strip() or not isinstance(email, str) or not email.strip():
        logger.warning("Verified credential omitted a required identity claim")
        raise credentials_exception

    clerk_sub = clerk_sub.strip()
    email = email.strip()
    display_name = (
        name.strip()
        if isinstance(name, str) and name.strip() and name.strip() != clerk_sub
        else None
    )
    profile_picture = (
        picture.strip() if isinstance(picture, str) and picture.strip() else None
    )
    is_bootstrap_admin = email in settings.ADMIN_EMAILS

    def reconciliation_required() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Login reconciliation required: this email is already linked to "
                "a different external identity. No account changes were made."
            ),
        )

    def refresh_mutable_fields(existing_user: User) -> User:
        email_owner = (
            db.query(User)
            .filter(User.email == email, User.id != existing_user.id)
            .first()
        )
        if email_owner:
            db.rollback()
            raise reconciliation_required()

        changed = False
        candidate_updates = [("email", email)]
        if display_name is not None:
            candidate_updates.append(("full_name", display_name))
        if profile_picture is not None:
            candidate_updates.append(("profile_picture", profile_picture))

        for attribute, value in candidate_updates:
            if getattr(existing_user, attribute) != value:
                setattr(existing_user, attribute, value)
                changed = True
        if is_bootstrap_admin and existing_user.role != RoleEnum.ADMIN:
            existing_user.role = RoleEnum.ADMIN
            changed = True

        if changed:
            try:
                db.commit()
                db.refresh(existing_user)
            except IntegrityError:
                db.rollback()
                raise reconciliation_required()
        return existing_user

    # Clerk's canonical subject remains stored in the legacy google_uid column so
    # existing User.id foreign keys remain stable.
    user = db.query(User).filter(User.google_uid == clerk_sub).first()
    if user:
        return refresh_mutable_fields(user)

    email_owner = db.query(User).filter(User.email == email).first()
    if email_owner:
        db.rollback()
        raise reconciliation_required()

    user = User(
        google_uid=clerk_sub,
        email=email,
        full_name=display_name,
        profile_picture=profile_picture,
        role=RoleEnum.ADMIN if is_bootstrap_admin else RoleEnum.STUDENT,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        # A concurrent first login for this same Clerk subject may have won.
        db.rollback()
        concurrent_user = db.query(User).filter(User.google_uid == clerk_sub).first()
        if concurrent_user:
            return refresh_mutable_fields(concurrent_user)
        raise reconciliation_required()

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    logger.info("Admin authorization check for local user id=%s role=%s", current_user.id, current_user.role)
    if current_user.role != "ADMIN" and current_user.role != RoleEnum.ADMIN:
        logger.warning("Admin authorization denied for local user id=%s", current_user.id)
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


# ---------------------------------------------------------------------------
# Plan access (paywall). While settings.PAYWALL_ENABLED is off, the
# dependencies below do nothing at all (no checks, no DB queries, no counting),
# so behaviour is exactly as before until the paywall is switched on.
#
# Order: admins get everything, then an active subscription's tier, then the
# free trial (full access for TRIAL_DAYS from sign-up, or from
# PAYWALL_LAUNCH_DATE for older accounts), otherwise "expired".
# Limits per tier live in app.core.entitlements (they match the pricing page).
# ---------------------------------------------------------------------------

UPGRADE_PATH = "/upsc/pricing"
_INDIA = ZoneInfo("Asia/Kolkata")


@dataclass
class Access:
    tier: str  # whose limits apply
    source: str  # "admin" | "subscription" | "trial" | "open" | "expired"
    trial_ends_at: Optional[datetime]
    entitlements: dict


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def trial_ends_at(user: User) -> datetime:
    start = _as_utc(user.created_at) or datetime.now(timezone.utc)
    if settings.PAYWALL_LAUNCH_DATE:
        launch = datetime.combine(settings.PAYWALL_LAUNCH_DATE, datetime.min.time(), tzinfo=_INDIA)
        start = max(start, launch.astimezone(timezone.utc))
    return start + timedelta(days=settings.TRIAL_DAYS)


def resolve_access(user: User, db: Session) -> Access:
    from app.core.entitlements import get_entitlements, normalize_tier
    from app.core.payments.models import Subscription

    if user.role == RoleEnum.ADMIN or user.role == "ADMIN":
        return Access("ultimate", "admin", None, get_entitlements("ultimate"))

    now = datetime.now(timezone.utc)
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.google_uid, Subscription.status == "active")
        .order_by(Subscription.end_date.desc())
        .first()
    )
    if sub is not None and (_as_utc(sub.end_date) or now) > now:
        tier = normalize_tier(sub.plan_tier)
        return Access(tier, "subscription", None, get_entitlements(tier))

    ends = trial_ends_at(user)
    if not settings.PAYWALL_ENABLED:
        return Access("ultimate", "open", None, get_entitlements("ultimate"))
    if now < ends:
        return Access("ultimate", "trial", ends, get_entitlements("ultimate"))
    return Access("free", "expired", ends, get_entitlements("free"))


def _upgrade_required(reason: str, message: str, required_tier: Optional[str] = None, feature: Optional[str] = None):
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail={
            "code": "upgrade_required",
            "reason": reason,
            "message": message,
            "feature": feature,
            "required_tier": required_tier,
            "upgrade_path": UPGRADE_PATH,
        },
    )


def _lowest_tier_with(feature: str) -> Optional[str]:
    from app.core.entitlements import ENTITLEMENTS, TIER_ORDER

    return next((t for t in TIER_ORDER if ENTITLEMENTS[t].get(feature)), None)


_FEATURE_NAMES = {
    "optional_subjects": "Optional subjects",
    "mains_upload": "Mains answer uploads",
}


def _enforce(access: Access, feature: Optional[str] = None) -> None:
    if not settings.PAYWALL_ENABLED or access.source == "admin":
        return
    if access.source == "expired":
        _upgrade_required(
            "trial_expired",
            f"Your {settings.TRIAL_DAYS}-day free trial has ended. Choose a plan to keep learning.",
        )
    if feature and not access.entitlements.get(feature):
        from app.core.entitlements import TIER_LABEL

        tier = _lowest_tier_with(feature)
        name = _FEATURE_NAMES.get(feature, "This feature")
        label = TIER_LABEL.get(tier, "a higher") if tier else "a higher"
        _upgrade_required("feature", f"{name} are included from the {label} plan.", tier, feature)


def require_access(feature: Optional[str] = None):
    """Dependency factory: an active trial or plan, plus ``feature`` if given."""

    def dependency(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> Optional[Access]:
        if not settings.PAYWALL_ENABLED:
            return None
        access = resolve_access(current_user, db)
        _enforce(access, feature)
        return access

    return dependency


def _today_in_india():
    return datetime.now(_INDIA).date()


def mcqs_answered_today(db: Session, user: User) -> int:

    row = (
        db.query(DailyUsage)
        .filter(DailyUsage.user_id == user.id, DailyUsage.usage_date == _today_in_india(), DailyUsage.metric == "mcq_answers")
        .one_or_none()
    )
    return row.count if row else 0


def consume_mcq_quota(db: Session, user: User, count: int = 1) -> None:
    """Count ``count`` MCQ answers for today; 402 if that would pass the plan's daily limit."""
    from app.core.entitlements import TIER_LABEL, TIER_ORDER, ENTITLEMENTS

    if count <= 0 or not settings.PAYWALL_ENABLED:
        return
    access = resolve_access(user, db)
    _enforce(access)

    today = _today_in_india()
    row = (
        db.query(DailyUsage)
        .filter(DailyUsage.user_id == user.id, DailyUsage.usage_date == today, DailyUsage.metric == "mcq_answers")
        .one_or_none()
    )
    used = row.count if row else 0

    limit = access.entitlements.get("daily_mcq_limit")
    if access.source != "admin" and limit is not None and used + count > limit:
        better = next(
            (t for t in TIER_ORDER[TIER_ORDER.index(access.tier) + 1:]
             if ENTITLEMENTS[t]["daily_mcq_limit"] is None or ENTITLEMENTS[t]["daily_mcq_limit"] > limit),
            None,
        )
        _upgrade_required(
            "mcq_limit",
            f"You've used today's {limit} MCQs on the {TIER_LABEL[access.tier]} plan. "
            "Upgrade for more, or come back tomorrow.",
            better,
            "daily_mcq_limit",
        )

    if row is None:
        row = DailyUsage(user_id=user.id, usage_date=today, metric="mcq_answers", count=0)
        db.add(row)
    row.count = used + count
    db.commit()


def mcq_quota(count: int = 1):
    """Dependency factory: consume ``count`` MCQ answers before the endpoint runs."""

    def dependency(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> None:
        consume_mcq_quota(db, current_user, count)

    return dependency

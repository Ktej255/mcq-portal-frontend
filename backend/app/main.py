from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    # --- Startup ---
    # Private-beta guardrail: authentication alone must not open the GS LMS in
    # production. Refuse to start instead of serving a paid cohort where any
    # signed-in account can read every topic, practice set, and plan.
    if (
        settings.APP_ENVIRONMENT == "production"
        and not settings.GS_LMS_ENFORCE_ACCESS
    ):
        raise RuntimeError(
            "GS LMS cohort access enforcement must be enabled in production. "
            "Set GS_LMS_ENFORCE_ACCESS=true before starting the API."
        )

    # Paid-beta scope: the cohort is sold a set of loop-ready topics. Serving
    # an unscoped curriculum would offer topics that dead-end at a missing
    # MCQ Lab. Production refuses to start unless the scope is enforced.
    if (
        settings.APP_ENVIRONMENT == "production"
        and not settings.GS_LMS_BETA_SCOPE
    ):
        raise RuntimeError(
            "GS LMS paid-beta topic scope must be enforced in production. "
            "Set GS_LMS_BETA_SCOPE=true before starting the API."
        )

    # Provider registration belongs to application lifecycle, never import time.
    from app.core.gs_lms.gemini_discussion_provider import register_discussion_provider

    register_discussion_provider()

    # Register Cashfree payment service
    from app.core.payments.config import cashfree_config

    if cashfree_config.is_configured:
        try:
            from app.core.payments.service import CashfreePaymentService

            app.state.payment_service = CashfreePaymentService(cashfree_config)
            logger.info("Cashfree payment service initialized successfully")
        except Exception as e:
            logger.critical(
                "Failed to initialize Cashfree payment service: %s. "
                "Payment endpoints will return HTTP 503.",
                str(e),
            )
            app.state.payment_service = None
    else:
        logger.critical(
            "Cashfree credentials not configured. "
            "All payment endpoints will return HTTP 503."
        )
        app.state.payment_service = None

    yield

    # --- Shutdown ---
    # Clean up payment service if needed
    app.state.payment_service = None


app = FastAPI(
    title="MCQ Intelligence Portal",
    description="Institutional MCQ OS for high-stakes examinations.",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure credentialed CORS from the explicit, validated origin allowlist.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    # Only this project's own Vercel preview deployments, not every *.vercel.app site.
    allow_origin_regex=r"https://[a-z0-9-]+-ktej255-gmailcoms-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
# Note: app.api.v1.admin is a package (admin/ dir with CA CMS routes).
# Legacy admin CRUD routes (subjects/topics/questions) live in admin_legacy.py.
from app.api.v1 import auth, admin_legacy, tests, reports, dashboard, revision, attempts, simulation, mains_upload
from app.api.v1 import optional
from app.api.v1 import gs_lms
from app.api.v1.gs_lms import access_admin as gs_lms_access_admin
from app.api.v1.gs_lms import content_coverage_admin as gs_lms_content_coverage
from app.api.v1 import profile
from app.api.v1 import payments
from app.api.v1 import engagement
from app.api.v1 import entitlements
from app.api.v1 import leads
from app.api.dependencies import require_access

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_legacy.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(tests.router, prefix="/api/v1/tests", tags=["tests"], dependencies=[Depends(require_access())])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(revision.router, prefix="/api/v1/revision", tags=["revision"], dependencies=[Depends(require_access())])
app.include_router(attempts.router, prefix="/api/v1/attempts", tags=["attempts"], dependencies=[Depends(require_access())])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["simulation"], dependencies=[Depends(require_access())])
app.include_router(mains_upload.router, prefix="/api/v1/mains-upload", tags=["mains-upload"], dependencies=[Depends(require_access("mains_upload"))])
app.include_router(optional.router, prefix="/api/v1/optional", tags=["optional"], dependencies=[Depends(require_access("optional_subjects"))])
app.include_router(gs_lms.router, prefix="/api/v1/gs-lms", tags=["gs-lms"], dependencies=[Depends(require_access())])

# Beta cohort access administration. Kept under /admin so it can never be
# confused with the public /gs-lms/{subject_slug} surface. Admin-gated at the
# router level; see app/api/v1/gs_lms/access_admin.py.
app.include_router(
    gs_lms_access_admin.router,
    prefix="/api/v1/admin/gs-lms/beta-access",
    tags=["gs-lms-admin"],
)

# Read-only operator coverage audit: the exact review gates the learner hits,
# expressed per topic so a coverage gap can be traced to a missing asset.
app.include_router(
    gs_lms_content_coverage.router,
    prefix="/api/v1/admin/gs-lms/content-coverage",
    tags=["gs-lms-admin"],
)

# Internal content preview is omitted unless explicitly enabled and remains
# admin-only even in an enabled development environment.
if (
    settings.APP_ENVIRONMENT in {"development", "test", "local"}
    and settings.ENABLE_DEV_PREVIEW_ROUTES
):
    from app.api.dependencies import get_current_admin
    from app.api.v1.gs_lms.preview import router as gs_lms_preview_router

    app.include_router(
        gs_lms_preview_router,
        prefix="/api/v1/gs-lms",
        tags=["gs-lms-preview"],
        dependencies=[Depends(get_current_admin)],
    )
app.include_router(profile.router, prefix="/api/v1/student", tags=["student-profile"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(engagement.router, prefix="/api/v1/engagement", tags=["engagement"])
app.include_router(entitlements.router, prefix="/api/v1/entitlements", tags=["entitlements"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])

# Current Affairs Platform & Admin CMS routers
from app.api.v1.current_affairs import router as ca_router
from app.api.v1.admin import router as ca_admin_router

app.include_router(ca_router, prefix="/api/v1/current-affairs", tags=["current-affairs"], dependencies=[Depends(require_access())])
app.include_router(ca_admin_router, prefix="/api/v1/admin", tags=["admin-cms"])



@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "MCQ Intelligence Portal API",
        "timestamp": time.time(),
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "clock": time.time()}

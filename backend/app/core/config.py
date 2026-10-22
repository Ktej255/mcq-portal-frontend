from datetime import date, datetime
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, List, Union, Any, ClassVar

class Settings(BaseSettings):
    PROJECT_NAME: str = "MCQ Intelligence Portal"
    
    # DB Configuration
    # No password here: set DATABASE_URL (with credentials) in the environment or .env.
    DATABASE_URL: Optional[str] = "postgresql://localhost:5432/mcq_portal"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if isinstance(v, str):
            # Strip literal quotes that sometimes get injected by shell/GCP
            v = v.strip("'").strip('"')
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql://", 1)
        return v

    # CORS Configuration
    DEFAULT_CORS_ORIGINS: ClassVar[List[str]] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        # Vercel deployments
        "https://mcq-portal-frontend-yo5i.vercel.app",
        "https://mcq-portal-frontend.vercel.app",
        "https://upsc-command.vercel.app",
        # Production custom domains (add yours here)
        "https://saritclasses.com",
        "https://www.saritclasses.com",
        "https://app.saritclasses.com",
    ]
    BACKEND_CORS_ORIGINS: Any = DEFAULT_CORS_ORIGINS.copy()

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[str, List[str]]:
        if isinstance(v, str):
            if v.strip() == "*":
                return "*"
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    values = parsed if isinstance(parsed, list) else [parsed]
                    return list(dict.fromkeys([*cls.DEFAULT_CORS_ORIGINS, *[str(i).strip() for i in values if str(i).strip()]]))
                except:
                    pass
            values = [i.strip() for i in v.split(",") if i.strip()]
            return list(dict.fromkeys([*cls.DEFAULT_CORS_ORIGINS, *values]))
        if isinstance(v, list):
            return list(dict.fromkeys([*cls.DEFAULT_CORS_ORIGINS, *v]))
        return cls.DEFAULT_CORS_ORIGINS.copy()

    # Clerk Auth Settings
    CLERK_JWT_KEY: Optional[str] = None
    CLERK_JWKS_URL: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    # Gemini model + timeout used by every Gemini-backed AI feature. The key is
    # read from GOOGLE_API_KEY, falling back to GEMINI_API_KEY.
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL_ID: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 60.0

    # GS LMS learning loop. GS_LMS_ENFORCE_PROGRESSION is the MASTER switch for all
    # new rules (step-1 discussion gate, recall gates, step-12 MCQ requirement,
    # topic order lock, checkpoint blocking). Off (default) = old behaviour: step
    # order only. GS_LMS_ENFORCE_ORDER is a sub-switch for the order lock/checkpoint
    # blocking; it only matters when the master switch is on (admins always exempt).
    GS_LMS_ENFORCE_PROGRESSION: bool = False
    GS_LMS_ENFORCE_ORDER: bool = True
    # Topics whose step 14 was completed before this moment count as mastered
    # regardless of MCQ score (grandfathering when the switch is turned on).
    GS_LMS_PROGRESSION_START: Optional[datetime] = None
    ADMIN_EMAILS: List[str] = ["sarit.kumar.dev@gmail.com"] # Add bootstrap admin
    SCHEMA_CHECK_STRICT: bool = False

    # Security: the `MOCK_TOKEN` auth bypass in `get_current_user` is a
    # dev/test/e2e affordance ONLY. It is gated behind this flag and defaults to
    # OFF so it can never be honored in production. Enable it explicitly (e.g.
    # `ALLOW_MOCK_AUTH=true` in an untracked local `.env` or a CI/e2e env) to run
    # Playwright/local flows that authenticate via `Bearer MOCK_TOKEN[_<uid>]`.
    # When off, a `MOCK_TOKEN` is treated as an invalid credential (401).
    ALLOW_MOCK_AUTH: bool = False

    # Security/honesty: the AI providers (OCR + answer evaluation) default to a
    # deterministic MOCK that returns fake text and fake scores. That is a
    # dev/test/e2e affordance ONLY. It is gated behind this flag and defaults to
    # OFF so a production deploy that forgot to configure a real provider says
    # "Answer checking is not set up yet" (503) instead of showing fake results
    # as real. Enable it explicitly (e.g. `ALLOW_MOCK_AI=true` in an untracked
    # local `.env` or a CI/e2e env).
    ALLOW_MOCK_AI: bool = False

    # Student answer images are deleted after this many days by
    # `python -m app.core.gs_lms.answer_retention`. The extracted text and the
    # evaluation report are kept.
    ANSWER_IMAGE_RETENTION_DAYS: int = 180

    # Per-user caps on AI-backed endpoints (Gemini discussion, OCR,
    # transcription, evaluation) so one account can't run up the AI bill.
    AI_RATE_LIMIT_PER_MINUTE: int = 30
    AI_RATE_LIMIT_PER_DAY: int = 500

    # Paywall. Off by default so deploying the code changes nothing until it is
    # switched on (after Cashfree is confirmed live). When on, a student needs a
    # free trial or an active subscription for learning features, and paid plans
    # get the limits in app.core.entitlements.
    PAYWALL_ENABLED: bool = False
    TRIAL_DAYS: int = 7
    # Students who signed up before this date get their trial counted from it,
    # so switching the paywall on does not lock out existing students.
    PAYWALL_LAUNCH_DATE: Optional[date] = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

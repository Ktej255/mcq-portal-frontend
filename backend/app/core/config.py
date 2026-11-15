from datetime import date
import json
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, List, Union, ClassVar

class Settings(BaseSettings):
    PROJECT_NAME: str = "MCQ Intelligence Portal"
    
    # Runtime environment defaults to production so development-only surfaces
    # and deterministic providers fail closed unless explicitly identified as
    # local development or test execution.
    APP_ENVIRONMENT: str = "production"

    @field_validator("APP_ENVIRONMENT", mode="before")
    @classmethod
    def validate_app_environment(cls, value: object) -> str:
        environment = str(value).strip().lower()
        if environment not in {"production", "staging", "development", "test", "local"}:
            raise ValueError(
                "APP_ENVIRONMENT must be production, staging, development, test, or local"
            )
        return environment

    # DB Configuration
    # No password here: set DATABASE_URL (with credentials) in the environment or .env.
    # On Supabase use the pooled connection string (Project Settings > Database).
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
        # Production custom domains (add yours here)
        "https://saritclasses.com",
        "https://www.saritclasses.com",
        "https://app.saritclasses.com",
    ]
    BACKEND_CORS_ORIGINS: List[str] = DEFAULT_CORS_ORIGINS.copy()

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            raw = v.strip()
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError as exc:
                    raise ValueError("BACKEND_CORS_ORIGINS must be a JSON list or comma-separated origins") from exc
                if not isinstance(parsed, list):
                    raise ValueError("BACKEND_CORS_ORIGINS JSON value must be a list")
                values = parsed
            else:
                values = [item.strip() for item in raw.split(",") if item.strip()]
        elif isinstance(v, list):
            values = v
        else:
            raise ValueError("BACKEND_CORS_ORIGINS must be a list or string")

        normalized: List[str] = []
        for value in values:
            if not isinstance(value, str):
                raise ValueError("CORS origins must be strings")
            origin = value.strip()
            if origin == "*":
                raise ValueError("Wildcard CORS origin is invalid when credentials are enabled")
            parsed = urlsplit(origin)
            try:
                parsed.port
            except ValueError as exc:
                raise ValueError(f"Malformed CORS origin: {origin!r}") from exc
            hostname = parsed.hostname.lower() if parsed.hostname else ""
            hostname_labels = hostname.split(".")
            if (
                parsed.scheme.lower() not in {"http", "https"}
                or not hostname
                or any(char.isspace() for char in origin)
                or "*" in hostname
                or hostname.endswith(".vercel.app")
                or any(
                    label == "preview"
                    or label.startswith("preview-")
                    or label.endswith("-preview")
                    for label in hostname_labels
                )
                or parsed.netloc.endswith(":")
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path not in {"", "/"}
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(f"Invalid HTTP(S) CORS origin: {origin!r}")
            clean = f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"
            if clean not in normalized:
                normalized.append(clean)
        return normalized

    # Clerk Auth Settings
    CLERK_JWT_KEY: Optional[str] = None
    CLERK_JWKS_URL: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # GS LMS discussion runtime. Gemini is the non-fabricating default; the
    # deterministic provider requires both explicit selection and enablement.
    GS_LMS_DISCUSSION_PROVIDER: str = "gemini"
    ENABLE_GS_LMS_DISCUSSION_MOCK: bool = False

    # Current Affairs doubt chat uses the shared inference gateway. Gemini is
    # the real default; deterministic responses are separately opt-in.
    CURRENT_AFFAIRS_DOUBT_CHAT_PROVIDER: str = "gemini"
    ENABLE_CURRENT_AFFAIRS_DOUBT_CHAT_MOCK: bool = False

    # Optional answer-input providers fail closed to real backends. A
    # deterministic provider is available only when an operator explicitly
    # selects it, explicitly enables it, and identifies a non-production
    # runtime through APP_ENVIRONMENT.
    OPTIONAL_STT_PROVIDER: str = "gemini"
    ENABLE_OPTIONAL_STT_MOCK: bool = False
    OPTIONAL_OCR_PROVIDER: str = "gemini-vision"
    ENABLE_OPTIONAL_OCR_MOCK: bool = False
    OPTIONAL_RECALL_PROVIDER: str = "gemini"
    ENABLE_OPTIONAL_RECALL_MOCK: bool = False
    OPTIONAL_EVAL_PROVIDER: str = "gemini"
    ENABLE_OPTIONAL_EVAL_MOCK: bool = False

    @field_validator("GS_LMS_DISCUSSION_PROVIDER", mode="before")
    @classmethod
    def validate_gs_lms_discussion_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "mock"}:
            raise ValueError("GS_LMS_DISCUSSION_PROVIDER must be 'gemini' or 'mock'")
        return selection

    @field_validator("CURRENT_AFFAIRS_DOUBT_CHAT_PROVIDER", mode="before")
    @classmethod
    def validate_current_affairs_doubt_chat_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "gateway", "mock"}:
            raise ValueError(
                "CURRENT_AFFAIRS_DOUBT_CHAT_PROVIDER must be 'gemini', 'gateway', or 'mock'"
            )
        return selection

    @field_validator("OPTIONAL_STT_PROVIDER", mode="before")
    @classmethod
    def validate_optional_stt_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "whisper", "mock"}:
            raise ValueError(
                "OPTIONAL_STT_PROVIDER must be 'gemini', 'whisper', or 'mock'"
            )
        return selection

    @field_validator("OPTIONAL_OCR_PROVIDER", mode="before")
    @classmethod
    def validate_optional_ocr_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "gemini-vision", "mock"}:
            raise ValueError(
                "OPTIONAL_OCR_PROVIDER must be 'gemini-vision', 'gemini', or 'mock'"
            )
        return selection

    @field_validator("OPTIONAL_RECALL_PROVIDER", mode="before")
    @classmethod
    def validate_optional_recall_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "gateway", "mock"}:
            raise ValueError(
                "OPTIONAL_RECALL_PROVIDER must be 'gemini', 'gateway', or 'mock'"
            )
        return selection

    @field_validator("OPTIONAL_EVAL_PROVIDER", mode="before")
    @classmethod
    def validate_optional_eval_provider(cls, value: object) -> str:
        selection = str(value).strip().lower()
        if selection not in {"gemini", "gateway", "mock"}:
            raise ValueError(
                "OPTIONAL_EVAL_PROVIDER must be 'gemini', 'gateway', or 'mock'"
            )
        return selection
    
    ADMIN_EMAILS: List[str] = [
        "sarit.kumar.dev@gmail.com",
        "ktej255@gmail.com",
    ]  # Exact-address bootstrap admins only; never a domain wildcard.
    SCHEMA_CHECK_STRICT: bool = False

    # Security: the `MOCK_TOKEN` auth bypass in `get_current_user` is a
    # dev/test/e2e affordance ONLY. It is gated behind this flag and defaults to
    # OFF so it can never be honored in production. Enable it explicitly (e.g.
    # `ALLOW_MOCK_AUTH=true` in an untracked local `.env` or a CI/e2e env) to run
    # Playwright/local flows that authenticate via `Bearer MOCK_TOKEN[_<uid>]`.
    # When off, a `MOCK_TOKEN` is treated as an invalid credential (401).
    ALLOW_MOCK_AUTH: bool = False

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
    # Internal content-preview endpoints are omitted entirely unless an operator
    # explicitly enables them. Even when enabled, the router is admin-gated.
    ENABLE_DEV_PREVIEW_ROUTES: bool = False

    # GS LMS cohort access enforcement. When enabled, a student must have an
    # active `gs_lms_beta_access` grant (or an active paid tier with
    # `all_subjects`) to use any /api/v1/gs-lms route. ADMIN and EDUCATOR roles
    # always pass. Disabled by default so existing local datasets keep working;
    # production startup refuses to boot unless this is `true`.
    GS_LMS_ENFORCE_ACCESS: bool = False

    # Paid-beta topic scope. When enabled, learners may only enter topics that
    # pass every gate (five reviewed sections, reviewed PYQ demand, and a
    # complete 15-question reviewed MCQ Lab). The syllabus stays visible as a
    # map but locked topics cannot be opened. Disabled by default so content
    # mechanics tests and authoring tools can build partial topics; production
    # startup refuses to boot unless this is `true`.
    GS_LMS_BETA_SCOPE: bool = False

    # Per-attempt MCQ variation: shuffles options and may invert "correct /
    # incorrect" wording for each attempt. Off by default because the exam
    # screen loads the original question from `tests/{id}/questions`; with
    # variation on, the saved answer would be remapped away from the option the
    # student actually clicked. Turn on only once the exam screen reads
    # `attempts/{id}/questions` and the review screens show the varied form.
    MCQ_VARIATION_ENABLED: bool = False

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

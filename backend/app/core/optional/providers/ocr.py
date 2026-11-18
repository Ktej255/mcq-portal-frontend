"""Optional-platform handwriting OCR provider policy shim.

The implementation lives in the shared evaluation core, but Optional owns its
runtime selector policy here: Gemini Vision is the fail-closed default and the
deterministic provider requires explicit non-production selection plus an
explicit enable flag. Existing imports and the shared provider cache remain
compatible.
"""
from __future__ import annotations

import os
from typing import Optional

from app.core.evaluation.providers.ocr import (  # noqa: F401  (re-export)
    GeminiVisionOcrProvider,
    MockOcrProvider,
    OcrBlock,
    OcrNotConfiguredError,
    OcrProvider,
    OcrResult,
    get_ocr_provider as _get_shared_ocr_provider,
    _PROVIDERS,
)


def get_ocr_provider(name: Optional[str] = None) -> OcrProvider:
    """Return Optional's explicitly selected, policy-approved OCR provider.

    ``name`` remains available for direct test/provider selection. Policy is
    evaluated before the shared cache is consulted, so a previously-created
    mock cannot bypass a production or staging denial.
    """
    from app.core.config import settings

    resolved = (
        name
        or os.environ.get("OPTIONAL_OCR_PROVIDER")
        or settings.OPTIONAL_OCR_PROVIDER
    ).strip().lower()

    if resolved == "mock" and (
        settings.APP_ENVIRONMENT not in {"development", "test", "local"}
        or not settings.ENABLE_OPTIONAL_OCR_MOCK
    ):
        raise OcrNotConfiguredError(
            "Deterministic OCR is disabled by runtime policy. Configure a real "
            "vision provider, or use manual entry, re-upload, and retry later."
        )

    return _get_shared_ocr_provider(resolved)


__all__ = [
    "OcrProvider",
    "OcrResult",
    "OcrBlock",
    "OcrNotConfiguredError",
    "MockOcrProvider",
    "GeminiVisionOcrProvider",
    "get_ocr_provider",
    "_PROVIDERS",
]

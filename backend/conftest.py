"""Root conftest: ensures 'backend/' is on sys.path so `import app` works."""
import sys
from pathlib import Path

# Add the backend directory to sys.path so that `from app.xxx import ...` resolves.
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import os

# The test suite exercises the deterministic mock OCR/evaluation providers.
# Production keeps ALLOW_MOCK_AI off (answer endpoints return 503 instead of
# fake results); tests that check that behaviour switch it off explicitly.
os.environ.setdefault("ALLOW_MOCK_AI", "true")

import pytest


@pytest.fixture(autouse=True)
def _reset_ai_rate_limits():
    """Each test starts with fresh per-user AI rate-limit counters."""
    from app.api.dependencies import reset_ai_rate_limits

    reset_ai_rate_limits()
    yield

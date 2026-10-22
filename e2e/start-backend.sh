#!/usr/bin/env bash
# Starts a throwaway FastAPI backend for the Playwright tests: a fresh SQLite
# database seeded with the Geography content and the e2e test students, local
# mock sign-in allowed, and the paywall switched on.
#
#   E2E_PYTHON        Python with backend/requirements.txt installed (default: python)
#   E2E_DB_FILE       SQLite file to (re)create (default: $TMPDIR/upsc-command-e2e.db)
#   E2E_BACKEND_PORT  Port to serve on (default: 8099)
set -euo pipefail

cd "$(dirname "$0")/../backend"

PYTHON="${E2E_PYTHON:-python}"
DB_FILE="${E2E_DB_FILE:-${TMPDIR:-/tmp}/upsc-command-e2e.db}"
rm -f "$DB_FILE"

export DATABASE_URL="sqlite:///$DB_FILE"
export ALLOW_MOCK_AUTH=true
export PAYWALL_ENABLED=true
export TRIAL_DAYS=7

"$PYTHON" scripts/e2e_seed.py
exec "$PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port "${E2E_BACKEND_PORT:-8099}"

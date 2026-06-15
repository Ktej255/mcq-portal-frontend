# Verified Environment Variables

## Local Staging

Backend local DB:

- `DATABASE_URL=sqlite:///./production.db`

Frontend local staging:

- Expected: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1`
- Current `.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, which is not the variable read by `frontend/src/env.ts`.

## Known Missing Frontend Runtime Values

Browser console reports these missing Firebase variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Production Blocker

Production backend is blocked by suspended GCP consumer project. Production env cannot be verified until Cloud Run access is restored or a replacement backend target is approved.

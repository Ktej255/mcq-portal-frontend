# Verified Deployment Checklist

## Local Evidence Completed

- Backend `/health`: local 200 OK on `http://127.0.0.1:8000/health`
- Frontend build: `npm run build` passed
- Alembic current: `b29e6d8c4a12 (head)`
- Browser mock login: `/login?token=MOCK_TOKEN` reaches dashboard locally
- Dashboard APIs: local browser returned 200 for dashboard/revision/report endpoints
- Answer persistence trace: attempt 18 preserved Q1=A, Q2=C, Q3=A across reload
- Controlled report math: attempts 19, 20, 21 matched DB/API scoring

## Required Before Production Claim

- Production Cloud Run project unsuspended
- Production backend `/health` returns 200
- Production frontend API env points to the restored backend
- Browser E2E completed against production
- Firebase production env values present
- Environment Batch 1 question 42 replaced or batch count adjusted

## Do Not Claim

Do not claim stable, production-ready, or fully verified until production browser, API, DB, and deployment checks pass.

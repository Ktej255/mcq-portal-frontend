# Running the backend on Supabase + Vercel (no AWS)

The portal has two parts:

| Part | What it is | Where it runs |
| --- | --- | --- |
| Frontend | Next.js app at the repo root | Vercel project (existing) |
| Backend | FastAPI app in `backend/` | A second Vercel project, root directory `backend` |
| Database | Postgres used by the backend (SQLAlchemy + Alembic) | Supabase Postgres |
| Answer-sheet images | Private files written by the backend | Supabase Storage (S3 protocol) |

Supabase stores the data. It cannot run the Python server itself, so the
FastAPI app runs on Vercel's Python runtime (`backend/vercel.json`,
entrypoint `backend/app/main.py`).

The live site's `/api/v1/*` calls are proxied by `next.config.ts` to
`NEXT_PUBLIC_API_BASE_URL`. That variable still points at the old AWS load
balancer, which no longer exists. That is why the site returns
`502 DNS_HOSTNAME_EMPTY`. There are no AWS hostnames in the code.

## 1. Supabase (portal project)

1. **Database URL**: Dashboard > Connect > *Transaction pooler*. Copy the URI
   (port `6543`) and add `?sslmode=require`.
2. **Create the tables**: from your laptop, with that URL in `backend/.env`:

   ```bash
   cd backend
   python -m alembic upgrade head
   ```

   If the Supabase database already has the old schema, check
   `python -m alembic current` first. There is one migration head
   (`m1e2r3g4e5a6`), which merges main's leads/daily-usage chain with the
   laptop's readiness chain.
3. **Storage**: Storage > New bucket `answer-images`, **private**.
   Storage > S3 Connection: enable it, then create an access key. Note the
   endpoint (`https://<ref>.storage.supabase.co/storage/v1/s3`) and region.

## 2. Backend Vercel project

Create a new Vercel project from this GitHub repo with **Root Directory =
`backend`**. Vercel detects FastAPI. Set the environment variables listed in
`backend/.env.example`. At minimum:

- `APP_ENVIRONMENT=production`
- `DATABASE_URL` (Supabase pooler URI from step 1)
- `MEDIA_STORE_BACKEND=s3`, `MEDIA_STORE_S3_BUCKET`,
  `MEDIA_STORE_S3_ENDPOINT_URL`, `MEDIA_STORE_S3_REGION`,
  `MEDIA_STORE_S3_ACCESS_KEY_ID`, `MEDIA_STORE_S3_SECRET_ACCESS_KEY`
- `CLERK_JWKS_URL` (or `CLERK_JWT_KEY`)
- `GS_LMS_ENFORCE_ACCESS=true` and `GS_LMS_BETA_SCOPE=true`. Production
  refuses to start without these.
- `GOOGLE_API_KEY`, the Cashfree keys, and `RESEND_API_KEY`, as before
- `BACKEND_CORS_ORIGINS`: your real frontend domains

After it deploys, open `https://<backend-project>.vercel.app/docs` to check that it answers.

## 3. Frontend Vercel project

Set `NEXT_PUBLIC_API_BASE_URL` (and `NEXT_PUBLIC_API_URL`, if set) to the
backend project's URL, for example `https://<backend-project>.vercel.app`, then
redeploy. The rewrite accepts a URL with or without a trailing `/api/v1`.

## Removed

`backend/buildspec.yml` and `backend/deploy/aws/` (CodeBuild/ECS) were
deleted. `backend/Dockerfile` stays for anyone who wants to run the backend
in a container.

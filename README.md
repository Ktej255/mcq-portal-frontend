# UPSC Command (Sarit Classes)

One repository for the whole product:

| Path | What | Deploys to |
| --- | --- | --- |
| `/` (root) | Next.js frontend (`src/`, `public/`, `package.json`) | Vercel — https://upsc-command.vercel.app |
| `backend/` | FastAPI backend (MCQs, GS/Optional LMS, tests, reports, payments, AI) | AWS ECS via CodeBuild (`backend/buildspec.yml`) |

The frontend stays at the repo root so the Vercel project builds without any settings
change. `backend/` is excluded from Vercel uploads, ESLint and TypeScript.

The backend was imported from `Ktej255/mcq-portal-backend` (commit `23fd91a`) as files
only. Its git history, local databases and files containing live credentials were left
out on purpose. Secrets belong in AWS Secrets Manager; see
`backend/task-definition.example.json`.

Backend quick start (Python 3.11, same as production):

```bash
cd backend
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=sqlite:///./local.db uvicorn app.main:app --reload --port 8000
pytest -q
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

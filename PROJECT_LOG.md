# Sarit Learn — UPSC Command · Project Log

A chronological, single-source-of-truth record of work on this project so any
agent or teammate can quickly understand **what exists, what changed, and what's
next**. Keep this file updated when you ship something.

- **Frontend:** `Ktej255/mcq-portal-frontend` (Next.js 16, React 19, Tailwind 4, Framer Motion, shadcn)
- **Backend:** `Ktej255/mcq-portal-backend` (FastAPI 2.0.0, SQLAlchemy, PostgreSQL)
- **Intended infra (owner-confirmed):** Vercel (frontend hosting), Supabase (data/backend), Clerk (auth)

> Note on auth/data: the frontend already includes Clerk, Supabase and Firebase
> clients; the backend repo's config currently uses Firebase + PostgreSQL. If the
> single source of truth is Supabase + Clerk, the backend's auth/data layer is a
> future alignment task. Flagged here for visibility.

---

## How we work (conventions)

- **Never push to `main` directly.** Branch → PR → review/merge.
- **Verify before pushing:** `npx tsc --noEmit` and `npx eslint` must pass.
- **No long-running commands** (no dev server / `next build` in-session). Deliver via GitHub PRs.
- **Single sources of truth (frontend):**
  - Marketing data (nav, footer, subjects, pricing, current affairs, PYQs, resources): `src/components/marketing/site-data.ts`
  - Guides content: `src/components/marketing/guides-data.ts`
  - SEO helpers: `src/lib/seo.ts` (canonical/OG); JSON-LD via `src/components/marketing/JsonLd.tsx`
- **SEO/AEO standard:** follow the `beyond-seo` skill (on `main`): valid JSON-LD, canonical + alternates, one `<h1>` per page, intent-driven copy.
- **Agent Experience (AX):** keep `/llms.txt` and `/llms-full.txt` updated when adding public pages.

---

## Chronological log (2026-06-16)

| # | Work | Repo · Branch | Commit / PR |
|---|------|---------------|-------------|
| 1 | Research: top UPSC platforms + gaps; design/animation prompt | — (planning) | — |
| 2 | Full marketing homepage (`SaritHome`): hero, problem→loop, daily loop, transparency, features, retention, pricing, comparison, roadmap, FAQ, footer | FE · feat/marketing-website | `51c546e` (PR #2) |
| 3 | Fix overlaps: scattered section + hero floating chip | FE | `6a66623` |
| 4 | Independent footer pages + PYQs, Resources, Subjects (incl. **optional** subjects) + shared nav/footer/PageShell | FE | `ff067ca` |
| 5 | Beyond-SEO applied: Organization/WebSite/Course/FAQ/Breadcrumb/ItemList JSON-LD, canonical + OG, `sitemap.ts`, `robots.ts` | FE | `b038bd4` |
| 6 | Agent Experience: `/llms.txt` + `/llms-full.txt` + `text/plain` alternates | FE | `aa3aabb` |
| 7 | Current Affairs segment (`/current-affairs`) + PYQ "how to use" enhancement | FE | `294ae85` |
| 8 | Tests & Daily Practice segment (`/tests`) | FE | `3f33ad3` |
| 9 | Guides content hub (`/guides`, `/guides/[slug]`) with Article/FAQ/Breadcrumb schema | FE | `e91caa3` |
| 10 | Diagnostic onboarding (`/start`) — 5-step, personalized plan | FE | `d2dce70` |
| 11 | Public read-only dashboard demo (`/demo`) personalized from diagnostic | FE | `56a9115` |
| 12 | OG share image, web manifest (PWA), custom 404, theme-color | FE | `039a40a` |
| 13 | Transparency/methodology page (`/methodology`, E-E-A-T) | FE | `41a1bd7` |
| 14 | Real pricing tiers (Foundation/Plus/Pro/Ultimate) + discounts; pricing single source `pricingTiers` | FE | `75d4df9` |
| 15 | Copy honesty fix: "Start free" → "Take the free diagnostic" | FE | `83f92cd` |
| 16 | **Lead magnet:** diagnostic gated by email capture → `/api/lead` (Resend) | FE | `c65f647` |
| B1 | Backend cloned; API mapped; `INTEGRATION.md` added | BE · docs/integration-guide | `d44a52b` (PR #1) |

**Open PRs:** Frontend [PR #2](https://github.com/Ktej255/mcq-portal-frontend/pull/2) · Backend [PR #1](https://github.com/Ktej255/mcq-portal-backend/pull/1) — approved for merge by owner.

---

## Public site map (frontend)

`/` · `/start` · `/demo` · `/features` · `/pricing` · `/subjects` (+ `/subjects/[slug]`) ·
`/current-affairs` · `/pyqs` · `/tests` · `/resources` · `/guides` (+ `/guides/[slug]`) ·
`/methodology` · `/about` · `/contact` · `/privacy` · `/terms` ·
machine routes: `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image`.

---

## Current status

**Done:** full public marketing + content + SEO/AX + diagnostic lead magnet + dashboard demo + real pricing; backend API documented.

**Open / needs input or another owner:**
- Deployment to live URLs (Vercel + Supabase + Clerk) — see `DEPLOYMENT.md`; requires owner credentials.
- `RESEND_API_KEY` + `LEADS_NOTIFY_EMAIL` to activate lead delivery.
- Backend auth/data alignment if standardising on Supabase + Clerk.
- Real analytics (GA4 + Google Search Console) for a data-backed SEO audit.
- Deepening the authed dashboard `(dashboard)/upsc` (already exists; not duplicated).

---

## Next-up backlog

1. Connect Vercel project + env, deploy frontend; deploy/confirm backend; set CORS to live domain.
2. Wire lead delivery (Resend) and confirm leads arrive.
3. Decide final hero CTA copy.
4. Optional: a specific live frontend↔backend data integration (e.g., public subjects/PYQ feed).

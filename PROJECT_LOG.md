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


---

## 2026-06-16 · Paid system: entitlements, upgrade engine, Free tier

**Pricing correction:** marketing aligned to the system — Foundation ₹399, Plus ₹699, Pro ₹999, Ultimate ₹1299; discounts Yearly 15% / 2-Year 25% / 3-Year 35%. (The system in `yearlyPlanner.ts` was already correct; only the marketing page was rounded.)

**New (additive, no breaking changes):**
- `src/lib/upsc/entitlements.ts` — canonical per-tier capabilities **including a `free` tier** (`free → foundation → plus → pro → ultimate`) with daily MCQ caps, AI minutes, weak-topic runs, optional/mains/tests/all-subjects flags. Plus `getEntitlements`, `nextTier`, `isMcqLimitReached`, and **`evaluateUpgradePrompt(signals)`** — the upgrade-trigger engine (limit-hit → tier nudge; 7-day streak / month-2 on monthly → yearly; target year ≥ 2027 → 2-year; renewal window → cycle upgrade).
- `src/components/upsc/UpgradeNudge.tsx` — reusable, dismissible, frequency-capped (6-day cooldown via localStorage) nudge that renders the engine's suggestion. Live demo in `/demo`.
- Marketing: **Free tier** (`freeTier` in `site-data.ts`) shown on `/pricing` and the homepage as the funnel entry.

**How to wire into the authed dashboard (next step for any agent):**
1. Read the user's `tier` + `billingCycle` from profile/subscription (`useDashboardData`).
2. Enforce `getEntitlements(tier)` in the MCQ generator (`mcq-command`) and AI usage guards (block/curtail at the cap).
3. Render `<UpgradeNudge signals={…} />` on `daily-command` / subject loop pages, and pass `blockedFeature` when a user taps a gated feature (optional subjects, mains upload, unlimited tests).
4. Add a Free (₹0) entitlement to the backend/`yearlyPlanner` plan set so the funnel entry is a real account state (currently lowest paid tier is Foundation).

**Still open (larger follow-ons):**
- Real entitlement enforcement in the dashboard (the engine exists; per-screen wiring pending).
- Payments/checkout is pre-launch ("Record Intent" + commerce launch boundary) — wire Razorpay when going live.
- Diagnostic → dashboard handoff (place a beginner using their saved plan).
- Per-subject content depth beyond Geography (7 GS subjects scaffolded).
- Dashboard UI: usage meter ("32/50 MCQs today"), mobile density of pricing/plan cards.


---

## 2026-06-16 · Dashboard entitlement wiring + build unblock

- Wired `<UpgradeNudge>` into the real dashboard hub (`UpscDailyMissionControl`), driven by the student's `subscriptionPlanId` / `billingCycle` / `firstAttemptYear` from `studentProfile`. Free→paid upgrade prompts now appear in‑app (the engine lives in `src/lib/upsc/entitlements.ts`).
- **Build gate:** TypeScript is the build gate and is green (`tsc --noEmit` passes). The app has substantial **pre‑existing** ESLint debt (e.g., `set-state-in-effect`, `no-explicit-any`); Next 16's `NextConfig` no longer accepts an `eslint` key (ESLint is decoupled from `next build`), so it isn't configured there. **Follow‑up:** clean up app‑wide lint. If the deployment's build step runs lint and fails, run it with linting disabled for the initial deploy.
- **Next sub‑steps for entitlements:** enforce daily MCQ cap in `UpscMcqCommandCenter` (needs per‑day usage tracking) and pass `blockedFeature` when a user taps a gated feature (optional subjects / mains upload / unlimited tests).


---

## 2026-06-16 · MCQ cap enforcement (client primitive) + backend payments

- **Frontend:** `src/lib/upsc/dailyUsage.ts` (`getMcqUsedToday` / `recordMcqUsage`) + `McqUsageNudge` (reads tier + today's usage, shows the upgrade nudge when the cap is hit). Wired at the `mcq-command` page level (no refactor of the 689-line center). **To finish enforcement:** call `recordMcqUsage(n)` wherever MCQs are actually generated/served (e.g., MCQ readiness rooms / generate handlers) and block generation when `isMcqLimitReached(getMcqUsedToday(), tier)`. Mirror authoritatively on the server at the generation endpoint.
- **Backend (PR #2):** added `/api/v1/payments/cashfree/order` + signed `/cashfree/webhook` (activates the Subscription), `app/core/pricing.py`, and Cashfree config in `config.py`. Env-gated: set `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV`, `FRONTEND_BASE_URL`, `BACKEND_BASE_URL`. **Test in Cashfree sandbox** (couldn't run live here) and run the subscriptions migration.
- **Next:** frontend checkout (Cashfree JS SDK on `/pricing` → POST `/payments/cashfree/order` → `cashfree.checkout(payment_session_id)`); dashboard UI/mobile density; Geography; website 6-box polish.

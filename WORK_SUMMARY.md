# Work Summary — Sarit Learn / UPSC Command (for review)

A single, checkable record of everything delivered this cycle, so a reviewing
agent can verify it. Two repos: **mcq-portal-frontend** (Next.js 16) and
**mcq-portal-backend** (FastAPI). All work is on PRs — nothing merged to `main` yet.

## Pull requests to review/merge
- **Frontend PR #2** — branch `feat/marketing-website` (the bulk of the work).
- **Backend PR #1** — branch `docs/integration-guide` (integration docs).
- **Backend PR #2** — branch `feat/free-entitlement` (entitlements + Subscription + Cashfree).

## What was built (by area)

### Public marketing site (frontend)
- Full animated homepage (`SaritHome`): hero with sequence‑numbered 6‑box daily loop, problem→clarity, daily loop, minimal transparency, features, retention, pricing, comparison, roadmap, FAQ, footer.
- Independent pages: `/features`, `/pricing`, `/subjects` (+ `/subjects/[slug]`, GS + Optional), `/current-affairs`, `/pyqs`, `/tests`, `/resources`, `/guides` (+ `/guides/[slug]`), `/methodology`, `/about`, `/contact`, `/privacy`, `/terms`.
- Funnel: `/start` (2‑min diagnostic → personalized plan, **gated by email capture = lead magnet** → `POST /api/lead` via Resend) and `/demo` (read‑only dashboard preview personalized from the diagnostic).

### SEO / AEO / Agent Experience (frontend)
- JSON‑LD: Organization, WebSite, Course (subjects), Article + FAQPage (guides/methodology), Breadcrumb, ItemList.
- Canonical + Open Graph/Twitter metadata on every page; dynamic OG image; `sitemap.xml`; `robots.ts`; web app manifest; custom 404; theme‑color.
- Agent Experience: `/llms.txt` + `/llms-full.txt` + `text/plain` alternate links.
- Analytics: env‑gated **GA4** (`NEXT_PUBLIC_GA_ID`) + **Search Console** verification (`NEXT_PUBLIC_GSC_VERIFICATION`).

### Pricing & paid system
- Pricing aligned to the system: **Free ₹0 → Foundation ₹399 → Plus ₹699 → Pro ₹999 → Ultimate ₹1299**; discounts **Yearly 15% / 2‑Year 25% / 3‑Year 35%**.
- Frontend entitlements engine (`src/lib/upsc/entitlements.ts`) + upgrade‑trigger engine + reusable `UpgradeNudge` + `McqUsageMeter` + daily usage guard (`dailyUsage.ts`).
- MCQ daily‑cap recording + meter/nudge wired across **all subjects** (Geography room + the shared `SubjectMcqReadinessRoom` covering the other 7) + the `mcq-command` page.
- `UpgradeNudge` in the dashboard hub (`UpscDailyMissionControl`).
- Cashfree checkout (frontend) wired into `UpscPricingCheckoutIntent`, gated by `publicCommerceLaunchBoundary.readyForPayment`.

### Backend
- `GET /api/v1/entitlements/me` (auth) + `/catalog` (public) — server‑side tier capabilities incl. **free** (`app/core/entitlements.py`).
- `Subscription` model (additive; **migration intentionally not hand‑written** — see below) + `_resolve_tier` reads the active subscription defensively.
- Cashfree: `POST /api/v1/payments/cashfree/order` + signed `POST /cashfree/webhook` (activates subscription) + `app/core/pricing.py`; env‑gated by Cashfree keys.
- `INTEGRATION.md` documenting the API/CORS/auth contract.

## Commit log

### Frontend (`feat/marketing-website`)
```
399afdd analytics: env-gated GA4 + Search Console verification
6d49031 pricing: 1/2/4 responsive grid (tablet density)
a355b27 paid: MCQ usage + meter/nudge across all 7 shared-room subjects
bac6ec3 hero: sequence-numbered 6-box daily loop
ac38581 geography: record MCQ usage on practice start + meter/nudge
d92143e dashboard: daily MCQ usage meter on practice page
4fd34a6 payments: frontend Cashfree checkout (gated)
8d4b543 paid: daily MCQ usage guard + nudge at mcq-command
dd93fea fix: revert unsupported eslint config key (Next 16); tsc green
62be506 paid: wire UpgradeNudge into dashboard hub
27f523c paid: entitlements + upgrade engine + Free tier
04fb381 pricing: align to 399/699/999/1299 + 15/25/35%
5f73a15 docs: HANDOVER prompt
01cdda4 docs: PROJECT_LOG + DEPLOYMENT
c65f647 lead-magnet: diagnostic email capture + /api/lead (Resend)
83f92cd copy: "Take the free diagnostic"
75d4df9 pricing: real tiers + fix free copy
41a1bd7 trust: /methodology page
039a40a seo/ax: OG image, manifest, 404, theme-color
56a9115 funnel: /demo dashboard preview
d2dce70 funnel: /start diagnostic onboarding
e91caa3 content: /guides hub (Article/FAQ schema)
3f33ad3 content: /tests segment
294ae85 content: /current-affairs + PYQ enhancement
aa3aabb ax: llms.txt + llms-full.txt
b038bd4 seo: Beyond-SEO (JSON-LD, canonical/OG, sitemap, robots)
ff067ca marketing: footer pages + PYQs/Resources/Subjects (optionals)
6a66623 fix: scattered section + hero chip overlap
4cb16a3 marketing: full Sarit Learn website
```

### Backend
```
docs/integration-guide:  9b7f236 docs: integration guide
feat/free-entitlement:   dbfd70f entitlements + free tier (/api/v1/entitlements)
                         cf13e37 Subscription model + defensive tier resolution
                         bf9a53e Cashfree create-order + signed webhook
```

## Verification checklist (for the reviewing agent)
- [ ] Frontend `npx tsc --noEmit` passes (it did at each commit).
- [ ] Frontend `npx eslint <changed files>` has no errors (note: app has pre‑existing lint debt unrelated to this work; TypeScript is the gate).
- [ ] Backend `python3 -m py_compile app/**` on changed files passes.
- [ ] Public routes render: `/`, `/start`, `/demo`, `/features`, `/pricing`, `/subjects`, `/current-affairs`, `/pyqs`, `/tests`, `/resources`, `/guides`, `/methodology`, legal pages.
- [ ] Machine routes 200: `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image`.
- [ ] Pricing shows ₹399/₹699/₹999/₹1299 and 15/25/35% everywhere (marketing + in‑app match).
- [ ] `GET /api/v1/entitlements/catalog` returns all five tiers; `/me` returns free by default.
- [ ] Free user sees the MCQ usage meter fill and the upgrade nudge at the cap (Geography + other subjects + mcq-command).
- [ ] Lead magnet: completing `/start` posts to `/api/lead` (emails when `RESEND_API_KEY`+`LEADS_NOTIFY_EMAIL` set).
- [ ] Cashfree (sandbox): order → checkout → webhook → subscription `active`; `entitlements/me` reflects new tier.

## Pending / needs action (not done by design)
- **DB migration for `subscriptions`** — NOT hand‑written: the Alembic graph has merge/multiple heads. Run `alembic merge heads` (if needed) → `alembic revision --autogenerate -m "add subscriptions"` → `alembic upgrade head`.
- **Deploy** — Vercel (frontend) + backend host + Supabase + Clerk env (see `DEPLOYMENT.md` / `HANDOVER.md`).
- **Cashfree keys** + flip `publicCommerceLaunchBoundary.readyForPayment`; **test in sandbox**.
- **Env**: `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`, `NEXT_PUBLIC_API_BASE_URL`, Clerk + Supabase keys, backend `CASHFREE_*`, `DATABASE_URL`, `BACKEND_CORS_ORIGINS`.
- **Server‑side MCQ cap enforcement** — no server generation endpoint exists yet (MCQ generation is client‑side); add one to enforce server‑side.
- **Testimonials/trust section** — needs real content (intentionally not fabricated).
- **Backend auth/data alignment** if standardizing on Supabase + Clerk (backend currently Firebase + Postgres).

See also: `PROJECT_LOG.md`, `DEPLOYMENT.md`, `HANDOVER.md` (frontend) and `INTEGRATION.md` (backend).

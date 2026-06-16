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
| 17 | Merge PR #2 (`feat/marketing-website`) and fix Resend sender email to support `RESEND_FROM_EMAIL` | FE · main | `ba4f280` |
| B2 | Merge PR #1 (`docs/integration-guide`) into main | BE · main | `9b7f236` |

**Open PRs:** None (PR #1 and PR #2 merged).

---

## Public site map (frontend)

`/` · `/start` · `/demo` · `/features` · `/pricing` · `/subjects` (+ `/subjects/[slug]`) ·
`/current-affairs` · `/pyqs` · `/tests` · `/resources` · `/guides` (+ `/guides/[slug]`) ·
`/methodology` · `/about` · `/contact` · `/privacy` · `/terms` ·
machine routes: `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image`.

---

## Current status

**Done:** full public marketing + content + SEO/AX + diagnostic lead magnet + dashboard demo + real pricing; backend API documented; frontend PR #2 & backend PR #1 successfully merged into `main`; Resend `from` configured to be environment-variable-backed.

**Open / needs input or another owner:**
- Deploy the backend (`Dockerfile`) to production host (e.g. Render, Railway, or Google Cloud Run) and set env vars.
- Deploy the frontend to Vercel and point the `upsccommand.com` domain.
- Set environment variables (`NEXT_PUBLIC_API_BASE_URL`, Clerk, Supabase, Resend credentials).
- Confirm live verification checklist once hostnames are finalized.

---

## Next-up backlog

1. Deploy backend container and configure database connectivity.
2. Complete Vercel frontend deployment.
3. Verify live endpoints (check sitemaps, `/start` lead submission, Clerk auth loop).
4. Register the sitemap on Google Search Console.


---

## 2026-06-16 — Geography Optional "Read" + "Syllabus" experience (Geomorphology live)

Built the first real content module for the **Geography (Optional)** track (previously only a "Planned" stub). Topic-by-topic build, starting with **Geomorphology** (Paper I, Section A).

**What shipped**
- New dedicated, static route segment `/upsc/optional-subjects/geography-optional` (overrides the generic `[slug]` stub):
  - `…/geography-optional` — landing page. **Syllabus button is placed before the Read button**, as specified.
  - `…/geography-optional/syllabus` — three-layer Syllabus map: **Official says / Trend says / Hidden topics**.
  - `…/geography-optional/read` — topic index (Geomorphology live; Climatology → Oceanography → Biogeography → Environmental Geography queued).
  - `…/geography-optional/read/geomorphology` — full handwritten "personal notes" reader.
- **Authentic UPSC-grade content** for Geomorphology, 6 subtopics: factors & endo/exogenetic forces; plate tectonics & mountain building; isostasy; geomorphic cycles & slope theories; channel morphology & denudation chronology; applied geomorphology. Each carries concept notes, exam keywords, UPSC answer-phrasing, PYQs, and hand-drawn diagrams.
- **Three-layer syllabus** grounded in the official UPSC Geography Optional Paper I syllabus + 25-year PYQ trend, including surfaced "hidden" topics (drainage morphometry, Hjulström, etchplanation, neotectonics, mantle plumes, GIS/RS).
- **Handwritten aesthetic**: Caveat + Kalam Google fonts (scoped via section layout), notebook-paper background, highlighter/marker accents, and pencil-style inline **SVG** diagrams (Remotion/Hyperframe skills were not available in this environment, so hand-authored SVG was used to achieve the "handmade diagram" look).

**Files**
- Content/data: `src/lib/upsc/optional/{geographyOptionalTypes.ts, geomorphology.ts, geographyOptionalTopics.ts}`
- UI: `src/components/upsc/optional/{GeoOptionalDiagrams.tsx, GeographyOptionalReader.tsx}`
- Routes: `src/app/(dashboard)/upsc/optional-subjects/geography-optional/{layout.tsx, page.tsx, syllabus/page.tsx, read/page.tsx, read/[topic]/page.tsx}`
- Styling: `src/app/globals.css` (`.go-*` handwritten classes)
- `src/app/(dashboard)/upsc/optional-subjects/[slug]/page.tsx` — excluded `geography-optional` from `generateStaticParams` to avoid a route clash.

**Validation**
- `npm ci` (node_modules was absent), `tsc --noEmit` clean for all new/changed files.
- Production build compiles and prerenders all four new routes (incl. `/read/geomorphology`).

**⚠️ Pre-existing build blocker (not introduced here):** `main` has two pages resolving to `/tests` — `src/app/tests/page.tsx` and `src/app/(dashboard)/tests/page.tsx`. `next build` fails on this conflict. Validation above was done by temporarily moving the duplicate aside. **This should be resolved separately** (delete/merge one of the `/tests` pages) before deployment.

**Next:** author Climatology using the same model; then Oceanography, Biogeography, Environmental Geography.


---

## 2026-06-16 (cont.) — Climatology module + `/tests` build-blocker fixed

**Climatology (Paper I) shipped** — second Read module, same model/depth as Geomorphology:
- `/upsc/optional-subjects/geography-optional/read/climatology` — 6 subtopics: heat budget & pressure belts; atmospheric circulation, winds & stability; monsoons & jet streams; air masses, fronts & cyclones; precipitation & climate classification (Köppen/Thornthwaite/Trewartha); climate change & applied/urban climatology.
- Three-layer syllabus (Official/Trend/Hidden) added; hidden topics incl. lapse rates, ENSO/IOD teleconnections, jet-stream monsoon theory, Bergeron process, radiation laws, Milankovitch cycles.
- 5 new pencil-style SVG diagrams: heat budget, tri-cellular circulation, mid-latitude cyclone/fronts, Köppen groups, urban heat island.
- Files: `src/lib/upsc/optional/climatology.ts`; registered in `geographyOptionalTopics.ts` (moved from coming-soon → ready). Diagram IDs added in `geographyOptionalTypes.ts` + `GeoOptionalDiagrams.tsx`.

**Resolved the pre-existing `/tests` build conflict** (was blocking the whole app build):
- Root cause: two pages resolved to `/tests` — the public marketing page (`src/app/tests/page.tsx`, in the SEO site map + public nav) and a dashboard student-practice page (`src/app/(dashboard)/tests/page.tsx`).
- Fix: kept the public `/tests`; **moved the dashboard page to `/practice`** (`src/app/(dashboard)/practice/page.tsx`). The dashboard sidebar never linked to `/tests`, so no nav change was needed; updated the lone reference in `scratch/verify-student-signal-pages.cjs` (`/tests` → `/practice`).

**Validation:** full `next build` now succeeds — **222/222 static pages**, including `/tests`, `/practice`, and both `…/read/geomorphology` and `…/read/climatology`. No route conflicts.

**Geography Optional progress:** 2 of 5 physical-geography topics live (Geomorphology, Climatology). Next: Oceanography → Biogeography → Environmental Geography.


---

## 2026-06-16 (cont.) — Oceanography module (Geography Optional, 3 of 5 physical topics)

**Oceanography (Paper I) shipped** — third Read module, same model/depth:
- `/upsc/optional-subjects/geography-optional/read/oceanography` — 6 subtopics: ocean bottom relief & deposits; temperature, salinity & heat/salt budgets (thermohaline circulation); waves, currents & tides; marine resources (UNCLOS, Blue Economy); coral reefs & coral bleaching; sea-level changes, law of the sea & marine pollution.
- Three-layer syllabus (Official/Trend/Hidden); hidden topics incl. thermohaline conveyor, Ekman transport/upwelling, ENSO, ocean acidification, UNCLOS zones, active/passive margins.
- 5 new pencil-style SVG diagrams: ocean-floor relief, thermocline profile, wind-driven gyre, coral reef types (Darwin), spring/neap tides.
- Files: `src/lib/upsc/optional/oceanography.ts`; registered ready in `geographyOptionalTopics.ts`; diagram IDs added to `geographyOptionalTypes.ts` + `GeoOptionalDiagrams.tsx`.

**Validation:** full `next build` passes — **223/223 static pages**, incl. `/read/oceanography`.

**Geography Optional progress:** 3 of 5 physical-geography topics live (Geomorphology, Climatology, Oceanography). Next: Biogeography → Environmental Geography. Deployment handoff doc updated: `docs/GEOGRAPHY_OPTIONAL_BUILD_HANDOFF.md`.


---

## 2026-06-16 (cont.) — Biogeography module (Geography Optional, 4 of 5 physical topics)

**Biogeography (Paper I) shipped** — fourth Read module, same model/depth:
- `/upsc/optional-subjects/geography-optional/read/biogeography` — 6 subtopics: genesis of soils & soil profile; classification & distribution of soils; soil erosion, degradation & conservation; factors of plant/animal distribution (biomes); deforestation, social & agro-forestry; wildlife & major gene-pool centres.
- Three-layer syllabus; hidden topics incl. Jenny's CLORPT, pedogenic processes, ecological succession, biodiversity hotspots & Vavilov centres, Wallace's realms, ecosystem energy flow.
- 4 new pencil-style SVG diagrams: soil profile (O-A-E-B-C-R), world biomes, trophic energy pyramid, slope soil-conservation.
- Files: `src/lib/upsc/optional/biogeography.ts`; registered ready in `geographyOptionalTopics.ts` (also de-duplicated a stray coming-soon entry); diagram IDs added to `geographyOptionalTypes.ts` + `GeoOptionalDiagrams.tsx`.

**Validation:** full `next build` passes — **224/224 static pages**, incl. `/read/biogeography`.

**Geography Optional progress:** 4 of 5 physical-geography topics live (Geomorphology, Climatology, Oceanography, Biogeography). Final Section-A target: Environmental Geography.


---

## 2026-06-16 (cont.) — Environmental Geography module — Paper I Section A COMPLETE (5/5)

**Environmental Geography (Paper I) shipped** — fifth Read module, completing Section A:
- `/upsc/optional-subjects/geography-optional/read/environmental-geography` — 6 subtopics: principle of ecology & ecosystem; human ecological adaptations & influence of man; global/regional ecological changes & imbalances; environmental degradation, management & conservation; biodiversity & sustainable development; environmental policy, hazards & legislation.
- Three-layer syllabus; hidden topics incl. energy flow/10% law/biogeochemical cycles, ecological balance & carrying capacity, ozone/acid-rain/eutrophication mechanisms, international conventions & SDGs, EIA & Indian laws, the risk equation.
- 3 new pencil-style SVG diagrams: ecosystem structure (energy/nutrient), biogeochemical (carbon) cycle, sustainable-development three pillars.
- Files: `src/lib/upsc/optional/environmentalGeography.ts`; registered ready in `geographyOptionalTopics.ts` (coming-soon list now empty); diagram IDs added.

**Validation:** full `next build` passes — **225/225 static pages**; all 5 read topics generated.

**Milestone:** Geography Optional **Paper I Section A (Physical Geography) is COMPLETE** — Geomorphology, Climatology, Oceanography, Biogeography, Environmental Geography. Next phase: Paper I Section B (Human Geography), then Paper II (Geography of India).
# Geography (Optional) — Build & Deployment Handoff

**Audience:** the deployment agent + founder review
**Date:** 2026-06-16
**Frontend repo:** `Ktej255/mcq-portal-frontend`
**Branch with this work:** `feat/geography-optional-read-geomorphology`
**Pull Request:** #3 — https://github.com/Ktej255/mcq-portal-frontend/pull/3

---

## 0. READ THIS FIRST — two facts that resolve the confusion

1. **This work is the UPSC Geography OPTIONAL subject — NOT GS Geography.**
   - Optional (this work) lives at route prefix: **`/upsc/optional-subjects/geography-optional`**
   - GS Geography is a *different, separate* feature at **`/upsc/geography`** (the older 30-day "rooms" track). **It was not modified by this work.**
   - If a tool/agent reported "built under GS geography," that is incorrect — every file in this delivery is under `optional-subjects/geography-optional/` (routes) and `lib/upsc/optional/` + `components/upsc/optional/` (logic). See the file list in §3.

2. **This work is NOT on `main` yet — that is why the live deployment does not show it.**
   - It is committed on branch `feat/geography-optional-read-geomorphology` (PR #3).
   - The current production deploy is built from `main`, which does **not** include these files.
   - **To deploy it: merge PR #3 into `main` (or point the deploy at the branch).** Nothing else built here will appear until that happens.

---

## 1. What this delivers (plain English)

A "world-class Read" experience for Geography Optional, written like a topper's **personal handwritten notes**, so a first-time aspirant can build genuine conceptual confidence from a single honest read.

For each topic the student gets:
- A **Read (notes)** page — concept explained in plain language, **hand-drawn pencil-style diagrams**, **exam keywords**, **"how UPSC wants you to phrase it"**, and **previous-year questions (PYQs)**.
- A **Syllabus map** with three honest layers:
  - **Official says** — the exact UPSC syllabus line.
  - **Trend says** — what 25 years of question papers actually demand, ranked by frequency.
  - **Hidden topics** — themes never printed in the syllabus but repeatedly required to answer questions.
- A landing page where the **Syllabus button is placed before the Read button** (as specified by the founder).

**Topics live now (3 of 5 in Paper I Physical Geography):**
1. ✅ **Geomorphology**
2. ✅ **Climatology**
3. ✅ **Oceanography**
4. ⏳ Biogeography (queued)
5. ⏳ Environmental Geography (queued)

---

## 2. Routes (what to open after deploy)

| Page | URL |
|------|-----|
| Geography Optional home | `/upsc/optional-subjects/geography-optional` |
| Syllabus map (3 layers) | `/upsc/optional-subjects/geography-optional/syllabus` |
| Read — topic index | `/upsc/optional-subjects/geography-optional/read` |
| Read — Geomorphology | `/upsc/optional-subjects/geography-optional/read/geomorphology` |
| Read — Climatology | `/upsc/optional-subjects/geography-optional/read/climatology` |
| Read — Oceanography | `/upsc/optional-subjects/geography-optional/read/oceanography` |

> These pages sit inside the authenticated dashboard shell. See §5 for how to open them on a deployed (non-localhost) host without a full login.

---

## 3. Files in this delivery

**Routes (App Router pages):**
- `src/app/(dashboard)/upsc/optional-subjects/geography-optional/layout.tsx` — loads handwritten fonts (Caveat + Kalam), scoped to this section
- `src/app/(dashboard)/upsc/optional-subjects/geography-optional/page.tsx` — landing (Syllabus button before Read button)
- `src/app/(dashboard)/upsc/optional-subjects/geography-optional/syllabus/page.tsx` — three-layer syllabus map
- `src/app/(dashboard)/upsc/optional-subjects/geography-optional/read/page.tsx` — topic index
- `src/app/(dashboard)/upsc/optional-subjects/geography-optional/read/[topic]/page.tsx` — renders a topic's notes

**Content / data (the actual study material):**
- `src/lib/upsc/optional/geographyOptionalTypes.ts` — content model (types)
- `src/lib/upsc/optional/geomorphology.ts` — full Geomorphology content
- `src/lib/upsc/optional/climatology.ts` — full Climatology content
- `src/lib/upsc/optional/geographyOptionalTopics.ts` — topic registry (ready vs coming-soon)

**UI components:**
- `src/components/upsc/optional/GeographyOptionalReader.tsx` — the handwritten notes reader
- `src/components/upsc/optional/GeoOptionalDiagrams.tsx` — hand-drawn pencil-style SVG diagrams

**Styling:**
- `src/app/globals.css` — appended `.go-*` classes (notebook paper, highlighter, pencil strokes)

**Supporting change (pre-existing build blocker fix):**
- Moved dashboard student-practice page from `/tests` to `/practice` to resolve a pre-existing route collision with the public marketing `/tests` page. Files: `src/app/(dashboard)/practice/page.tsx` (moved), `scratch/verify-student-signal-pages.cjs` (reference updated). The public `/tests` marketing page is unchanged.
- Excluded `geography-optional` from the generic `optional-subjects/[slug]` static params so the dedicated route does not clash.

---

## 4. What was done today (chronological)

1. **Audited** the repo and confirmed Geography Optional was only a "Planned" placeholder (auto-generated catalog stub), while GS Geography (`/upsc/geography`) was a separate existing feature.
2. **Researched** the official UPSC Geography Optional Paper I syllabus + 25-year PYQ trends to ground the content.
3. **Built the content model and the Read + Syllabus experience** (routes, reader component, handwritten aesthetic, pencil SVG diagrams).
4. **Authored Geomorphology** — 6 subtopics, three-layer syllabus, diagrams, keywords, answer-language, PYQs.
5. **Authored Climatology** — 6 subtopics, three-layer syllabus, 5 new diagrams, keywords, answer-language, PYQs.
6. **Fixed a pre-existing build blocker** (`/tests` duplicate route) so the entire app builds again.
7. **Validated**: `tsc` clean; full `next build` succeeds — **222/222 static pages**, including both Read topics.
8. Pushed everything to PR #3 and wrote this handoff doc.

---

## 5. DEPLOYMENT PROMPT (give this to the deployment agent)

> **Goal:** Deploy the Geography Optional Read experience so it is visible on the live site.
>
> **Steps:**
> 1. **Merge PR #3** (`feat/geography-optional-read-geomorphology`) into `main` in `Ktej255/mcq-portal-frontend`. (Nothing in this feature is on `main` yet.)
> 2. Trigger the frontend deploy from `main` (Vercel or current host).
> 3. **Set environment variable** `NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN=true` so the dashboard-gated Geography Optional pages can be opened via Student Preview without a full Clerk/Supabase login. (If real auth is already configured on the live site, normal student login also works.)
> 4. After deploy, verify these URLs render (see §2):
>    - `/upsc/optional-subjects/geography-optional`
>    - `/upsc/optional-subjects/geography-optional/syllabus`
>    - `/upsc/optional-subjects/geography-optional/read/geomorphology`
>    - `/upsc/optional-subjects/geography-optional/read/climatology`
>
> **Build facts the deploy agent should know:**
> - Framework: Next.js 16 (App Router). Build command: `npm run build`. Node 20+.
> - The full build was verified green locally (222/222 pages) on this branch.
> - This branch also resolves a pre-existing `/tests` route conflict that breaks `next build` on `main`; deploying `main` WITHOUT this branch will fail the build. Merging PR #3 fixes it.

---

## 6. Verification checklist (for founder review after deploy)

- [ ] Landing page shows the **Syllabus** button **before** the **Read** button.
- [ ] Syllabus map shows three layers: **Official says / Trend says / Hidden topics** for Geomorphology and Climatology.
- [ ] Read pages render in the **handwritten notebook** style (ruled paper, handwriting fonts).
- [ ] **Pencil-style diagrams** appear (e.g., relief see-saw, plate boundaries, tri-cellular circulation, urban heat island).
- [ ] Each subtopic shows **exam keywords**, **answer phrasing**, and **PYQs**.
- [ ] Topic index shows Geomorphology + Climatology as "live" and Oceanography/Biogeography/Environmental Geography as "Soon".

---

## 7. Content depth summary (for the quality review)

### Geomorphology (`/read/geomorphology`) — 6 subtopics
1. Factors controlling landform development — endogenetic & exogenetic forces
2. Plate tectonics, continental drift & recent views on mountain building (incl. Himalaya application)
3. Isostasy — Airy vs Pratt + modern view
4. Geomorphic cycles & slope theories (Davis / Penck / King)
5. Channel morphology & denudation chronology (incl. drainage morphometry)
6. Applied geomorphology — geohydrology, economic geology, environment

**Hidden topics surfaced:** drainage morphometry & Horton–Strahler laws; Hjulström/Sundborg curves; etchplanation & pediplanation; tectonic geomorphology/neotectonics; mantle plumes & hotspots; geomorphic hazards & GIS/remote sensing.

### Climatology (`/read/climatology`) — 6 subtopics
1. Heat budget & temperature/pressure belts
2. Atmospheric circulation, winds & stability (incl. lapse rates)
3. Monsoons & jet streams (dynamic theory, ENSO/IOD)
4. Air masses, fronts & cyclones (temperate vs tropical)
5. Precipitation & climate classification (Köppen / Thornthwaite / Trewartha)
6. Climate change & applied/urban climatology

**Hidden topics surfaced:** lapse rates (ELR/DALR/SALR); ENSO, Walker circulation, IOD teleconnections; jet-stream & Tibetan-plateau monsoon theory; condensation/precipitation micro-physics (Bergeron, coalescence); radiation laws & greenhouse mechanism; Milankovitch cycles & palaeoclimate.

### Oceanography (`/read/oceanography`) — 6 subtopics
1. Ocean bottom relief & deposits (Atlantic/Pacific/Indian basins)
2. Temperature, salinity, and the heat & salt budgets (thermohaline circulation)
3. Waves, currents & tides (gyres, upwelling, spring/neap)
4. Marine resources — biotic, mineral & energy (UNCLOS, Blue Economy)
5. Coral reefs & coral bleaching (Darwin's theory, acidification)
6. Sea-level changes, law of the sea & marine pollution

**Hidden topics surfaced:** thermohaline circulation (global conveyor belt); Ekman transport, geostrophic flow & upwelling; El Niño/La Niña & Walker circulation; ocean acidification; UNCLOS maritime zones & Blue Economy; active vs passive continental margins.

---

## 8. Notes & known limitations

- **Diagrams are hand-authored inline SVG** styled to look pencil-drawn (no external image hosting/Remotion/Hyperframe was available in the build environment). They render fully offline and match the "handmade diagram" intent. Real photos/maps can be added later if desired.
- **Fonts:** Caveat (display) + Kalam (body), loaded via `next/font`, scoped to the Geography Optional section only — they do not affect the rest of the app.
- **Content is the initial authoritative draft** intended for iteration; the founder can refine wording/depth per topic going forward.

---

## 9. Roadmap (remaining Geography Optional content)

- **Paper I, Section A (Physical):** Biogeography → Environmental Geography (next build targets)
- **Paper I, Section B (Human Geography)** and **Paper II (Geography of India)**: to be scoped after Section A is complete.

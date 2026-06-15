# CENTRAL SYSTEM STATE

## 1. ARCHITECTURAL MANDATE: [INSTITUTIONAL STABILIZATION MODE]
The architectural phase is COMPLETE. The system is now in **Stabilization Mode**. All modifications must prioritize **Stability, Safety, and Scale Readiness**. Horizontal expansion of architecture or governance is prohibited.

## 2. CORE BOUNDARIES
### A. DATA INTEGRITY (FROZEN)
- `backend/app/models/domain.py`: Primary source of truth for schema.
- `backend/app/services/scoring_engine.py`: Governing logic for all calculations.
- `backend/app/services/report_service.py`: Forensic truth validation layer.

### B. ARCHITECTURAL LAYERS
- **Cognition Layer**: Knowledge graph and pedagogical dependencies.
- **Execution Layer**: Exam engine, timers, and submission logic.
- **Forensic Layer**: Telemetry, integrity checks, and report validation.
- **Interface Layer**: Calm Student UX (Frontend).

## 3. CURRENT GRAPH STATE (DRAFT)
- **Primary Dependencies**:
    - `Attempt` -> `Test` -> `Question`
    - `Report` -> `Attempt` -> `ScoringEngine`
    - `DailyWorkspace` -> `RevisionQueue` -> `MemoryMetrics`

## 4. MUTATION LOG
| Date | Agent | Mutation | Impacted Systems | Governance Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-05-13 | Governance Engine | Initialization | Governance | ACTIVE |
| 2026-05-13 | MCQ Production Engine | Frontend Sequential Sorting & Layout Polish | Interface Layer | ACTIVE |
| 2026-05-13 | MCQ Production Engine | Forensic Diagnostic Injection & Scoring Hardening | Forensic Layer | ACTIVE |
| 2026-05-13 | MCQ Production Engine | Final E2E Production Validation & UX Polish | Full Flow | STABLE |
| 2026-05-18 | Codex Stabilization Sprint | Local answer persistence forensic fix | Exam UI, Autosave, Attempt API | LOCAL STAGING VALIDATION REQUIRED |
| 2026-05-18 | Codex Stabilization Sprint | UPSC batch marking scheme correction | Test metadata, Migration | LOCAL STAGING VALIDATION REQUIRED |
| 2026-05-18 | Codex Stabilization Sprint | Report reliability display guard | Report UI | LOCAL STAGING VALIDATION REQUIRED |
| 2026-05-18 | Codex Stabilization Sprint | Environment Batch 1 corrupted question quarantine | Content API, Migration | LOCAL STAGING VALIDATION REQUIRED |
| 2026-05-18 | Codex Stabilization Sprint | Deterministic report truth render gate | Submit flow, Report UI, Autosave, Report pipeline validation | LOCAL STAGING VALIDATED; PRODUCTION UNVERIFIED |
| 2026-05-18 | Codex Stabilization Sprint | Phase 3 release cleanup | Auth runtime, static asset, Recharts, lint hygiene, student journey validation | LOCAL STAGING VALIDATED; FULL LINT + PRODUCTION UNVERIFIED |
| 2026-05-18 | Codex Stabilization Sprint | Phase 4 release-candidate audit | Lint closure, Firebase production probe, Cloud Run audit, release verdict | LOCAL GATES PASS; PRODUCTION BLOCKED |

---

## 5. RELEASE READINESS VERDICT: [BLOCKED]
- Production infrastructure was unavailable during this local staging pass.
- `npm run lint` passes with `0 errors, 0 warnings`.
- Mock-auth browser runtime is console-clean locally.
- Static resource 404 and Recharts chart container warnings were fixed locally.
- Deterministic report rendering has local staging evidence only; production browser/API/DB validation is still required.
- Production Cloud Run is suspended (`CONSUMER_SUSPENDED`), backend `/health` returns 404, and production Firebase auth returns Identity Toolkit 403.

---

### A. MUTATION: Frontend Sequential Sorting
- **What**: Sort `filteredTests` by title in `frontend/src/app/(dashboard)/tests/page.tsx`.
- **Why**: Institutional consistency. Batches 1-8 must appear in order.
- **Files**: `frontend/src/app/(dashboard)/tests/page.tsx`
- **Blast Radius**: Low. Only affects test listing display.
- **Rollback**: Revert sorting logic in `filteredTests`.

### B. MUTATION: Question Layout Stabilization (#2)
- **What**: Refine question metadata and bilingual spacing in `frontend/src/app/exam/[testId]/page.tsx`.
- **Why**: "Fantastic" layout preservation and forensic clarity.
- **Files**: `frontend/src/app/exam/[testId]/page.tsx`
- **Blast Radius**: Low. Visual only.
- **Rollback**: Revert JSX changes in `ExamInterface`.

### C. MUTATION: Forensic Diagnostic Injection & Scoring Hardening
- **What**: Inject granular logging into `report_service.py` and `ScoringEngine.py`.
- **Why**: Isolate the cause of "Forensic Mismatch" failures during production submissions.
- **Files**: `backend/app/services/report_service.py`, `backend/app/services/scoring_engine.py`
- **Blast Radius**: Low. Logic-preserving, adds only telemetry/logging.
- **Rollback**: Revert logging and assertion-like check in `ScoringEngine`.

### D. MUTATION: Local Answer Persistence Stabilization
- **What**: Scope frontend exam state by attempt ID, prevent passive visited/unanswered states from autosaving as skipped answers, add explicit clear-response semantics, and flush saveable answers before submit.
- **Why**: Local browser trace on attempt 17 showed reopening an exam overwrote Q1 from `A` to `NULL` via `PUT /attempts/17/answers` with `selected_option: null`.
- **Files**: `frontend/src/lib/store/useExamStore.ts`, `frontend/src/lib/hooks/useAutoSave.ts`, `frontend/src/services/api/examService.ts`, `frontend/src/app/exam/[testId]/page.tsx`, `backend/app/schemas/test_engine.py`, `backend/app/services/test_engine_service.py`
- **Blast Radius**: Medium. Exam answer persistence and submit flow only.
- **Rollback**: Revert the six files above and rerun Graphify plus local browser trace.

### E. MUTATION: UPSC Batch Marking Scheme Correction
- **What**: Add a data migration to move UPSC-style batch tests from `+1/-0.33` to `+2/-0.66`, and align admin test creation defaults.
- **Why**: Local DB evidence showed Environment Batch 1 used `correct_marks=1.0` and `negative_marking_value=0.33`, while ingestion scripts and sprint validation expect `2 correct - 1 incorrect = 3.34`.
- **Files**: `backend/alembic/versions/a18f2c7d9e41_fix_upsc_batch_marking_scheme.py`, `backend/app/schemas/admin.py`
- **Blast Radius**: Low/Medium. Test metadata and score outputs for UPSC batch tests.
- **Rollback**: Run Alembic downgrade for this revision or revert the migration before deployment.

### F. MUTATION: Report Reliability Display Guard
- **What**: Replace undefined behavioral reliability multiplication with a finite fallback from `report.reliability_score`.
- **Why**: Local browser evidence showed `NAN% RELIABILITY` on a mathematically reconciled report.
- **Files**: `frontend/src/app/(dashboard)/reports/page.tsx`
- **Blast Radius**: Low. Display-only reliability badge.
- **Rollback**: Revert the reliability fallback calculation.

### G. MUTATION: Environment Batch 1 Corrupted Question Quarantine
- **What**: Archive/soft-delete corrupted question 42 and filter unpublished/deleted questions from test listing/question APIs.
- **Why**: Content audit found footer leakage and truncated stem in Environment Batch 1 question 42.
- **Files**: `backend/alembic/versions/b29e6d8c4a12_quarantine_corrupted_environment_batch1.py`, `backend/app/api/v1/tests.py`
- **Blast Radius**: Medium. Test 1 now exposes 49 usable questions until replacement content is ingested.
- **Rollback**: Run Alembic downgrade for this revision after replacing/repairing the content.

---

## 6. ACTIVE GOVERNANCE SYSTEMS
- **Graph Cognition Engine**: Graphify (Automated indexing)
- **Primary Source**: `docs/governance/graph/graph.json`
- **Blast Radius & Mutation Guard**: `backend/scripts/governance/graphify_audit.py`
- **Visual Architecture Map**: `docs/governance/graph/graph.html`
- **Service Ownership Map**: `docs/governance/graph/SERVICE_MAP.md`
- **Mutation Registry**: `docs/governance/graph/mutations/`

## 7. ARCHITECTURAL BOUNDARY ENFORCEMENT [ACTIVE]
- **Protocol**: Every mutation MUST be validated via `graphify_audit.py`.
- **L0 Protection**: Core models (domain.py) are protected from automated agents.
- **Dependency Flow**: Strictly unidirectional (UI -> Service -> Domain).
- **Patch Size Governance**: Max 10 files per mutation.
- **Risk Threshold**: High-impact rewrites (>20 nodes) are automatically blocked.


 # #   8 .   D E P L O Y M E N T   S A F E T Y   &   S C A L E   R E A D I N E S S 
 -   * * M i g r a t i o n   P o l i c y * * :   N o   D D L   c h a n g e s   w i t h o u t   r o l l b a c k   s c r i p t s . 
 -   * * A s y n c   S t r a t e g y * * :   E n s u r e   t a s k   q u e u e   s u r v i v a b i l i t y   ( i d e m p o t e n c y   e n f o r c e d ) . 
 -   * * H o r i z o n t a l   S c a l e * * :   S t a t e l e s s   A P I   d e s i g n   ( P r o v i d e r - a g n o s t i c ) . 
 -   * * P r o d u c t i o n   F r e e z e * * :   T i e r - 0   C o r e   ( D o m a i n )   i s   f r o z e n . 
 
 # #   9 .   O P E R A T I O N A L   G O V E R N A N C E   ( C H A T   # 2 ) 
 -   * * R o l e * * :   P r o t e c t   p r o d u c t i o n   s t a b i l i t y   a n d   p r e v e n t   s y s t e m   d e c a y . 
 -   * * F o c u s * * :   S c a l e   r e a d i n e s s ,   s a f e t y ,   a n d   g r a p h   e n f o r c e m e n t . 
 -   * * P r o t o c o l * * :   M A N D A T O R Y   A u d i t   b e f o r e   e v e r y   m u t a t i o n . 
  
 

export type InventoryStatus =
  | "verified"
  | "partial"
  | "external"
  | "isolated";

export type InventoryItem = {
  feature: string;
  status: InventoryStatus;
  behavior: string;
  evidence: string;
};

export type InventoryGroup = {
  title: string;
  summary: string;
  items: InventoryItem[];
};

export type ReleaseGate = {
  title: string;
  complete: boolean;
  detail: string;
};

export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  verified: "Verified local",
  partial: "Partial",
  external: "External apply",
  isolated: "Isolated",
};

export const featureInventoryGroups: InventoryGroup[] = [
  {
    title: "Student experience",
    summary: "The small learner-facing surface that students can safely use today.",
    items: [
      {
        feature: "Marketing entry",
        status: "verified",
        behavior: "UPSC Command entry works on desktop and mobile without retired branding.",
        evidence: "upsc-marketing-entry-e2e.cjs",
      },
      {
        feature: "Local preview entry",
        status: "verified",
        behavior: "Localhost study routes open without cloud login for controlled testing.",
        evidence: "verify-student-dashboard.cjs",
      },
      {
        feature: "Public Google login",
        status: "partial",
        behavior: "Supabase OAuth branch is wired; deployed callback rehearsal remains open.",
        evidence: "AuthContext.tsx and live checklist",
      },
      {
        feature: "Self-study intake",
        status: "verified",
        behavior: "One explicit preparation-history answer identifies Beginner, Intermediate, or Advanced before the daily path can open. Daily duration and study preferences stay folded as optional tuning. Older inconsistent saved profiles normalize to one coherent preparation stage, level, attempt history, and first route before the learner resumes.",
        evidence: "verify-upsc-intake-self-study.cjs and verify-level-aware-guided-session.cjs",
      },
      {
        feature: "Level-aware guided session",
        status: "verified",
        behavior: "Beginner opens a 10-15 minute lesson first. Intermediate and Advanced open explanation-first diagnosis. The visible core loop is Learn, Discuss, and MCQ; MCQ command advances the generated syllabus path.",
        evidence: "verify-level-aware-guided-session.cjs and verify-generated-daily-path.cjs",
      },
      {
        feature: "Live conversational AI service",
        status: "partial",
        behavior: "Browser speech capture, local scoring, gap hints, and the 95% recall gate work. Talk disables duplicate checks, ignores stale responses after edits, rejects malformed successful API payloads, times out stalled browser requests after 13 seconds, and keeps one local next step during provider failure. The provider-isolated server route accepts JSON only, caps learner and provider bytes before parsing, and rejects oversized coach text. The Supabase distributed-limiter adapter is ready; live SQL apply, a server-only Gemini key, streaming UX, and live evaluation still remain.",
        evidence: "verify-adaptive-teacher-api.cjs, verify-adaptive-teacher-evaluation.cjs, verify-adaptive-teacher-talk.cjs, verify-adaptive-teacher-transition.cjs, verify-adaptive-teacher-production-boundary-static.mjs, and live AI checklist",
      },
      {
        feature: "Student dashboard",
        status: "verified",
        behavior: "Exactly four visible decisions: Today, Gaps, Revise, and Progress. Today advances from the first incomplete MCQ-command topic. The 60-second start check now saves the learner state plus a reset plan, and the main action exposes check-pending or ready session status. The folded planning drawer is read-only: its Learn, Discuss, and MCQ cards are orientation only, and its time-aware syllabus queue uses Current and Queued labels without skip-ahead links.",
        evidence: "verify-student-signal-pages.cjs and verify-generated-daily-path.cjs",
      },
      {
        feature: "Learning preferences",
        status: "verified",
        behavior: "Settings expose study preferences without technical controls.",
        evidence: "verify-student-signal-pages.cjs",
      },
      {
        feature: "Pricing and yearly planner",
        status: "verified",
        behavior: "Monthly is Rs 399, with yearly, 18-month, and three-year launch plans carrying deterministic list price, discount, savings, effective monthly price, and local checkout handoff. The yearly planner exposes nine windows, eight GS coverage blocks, source-library entry, and optional-subject catalog proof.",
        evidence: "verify-pricing-planner.cjs",
      },
      {
        feature: "Syllabus, PYQ, and optional library",
        status: "verified",
        behavior: "GS source rows, official anchors, trend boards, and optional-subject pages are available locally. Every UPSC optional subject has a route with Paper I and Paper II year-wise source rows; PDF text extraction and final topic tagging remain a later depth pass.",
        evidence: "verify-syllabus-pyq-trend-library.cjs and verify-optional-subject-pages.cjs",
      },
      {
        feature: "Covered-topic current affairs",
        status: "verified",
        behavior: "Current-affairs hooks are hidden until the linked static topic has local evidence. Geography and later GS subjects use the same subject/day gate so beginners do not see an open-ended news feed.",
        evidence: "verify-current-affairs-bridge.cjs",
      },
      {
        feature: "Reports and growth signal",
        status: "verified",
        behavior: "Weekly windows, monthly summary, growth percentage, current-affairs unlocks, AI gap count, MCQ evidence, recall evidence, and me-time checks are generated from local subject progress.",
        evidence: "verify-student-report-system.cjs",
      },
      {
        feature: "Adaptive question bank builder",
        status: "verified",
        behavior: "The learner-facing question bank prioritizes unresolved AI gaps, weak days, requested difficulty, and repair-first practice instead of showing a generic question dump.",
        evidence: "verify-question-bank-builder.cjs",
      },
    ],
  },
  {
    title: "Geography pilot",
    summary: "The first subject funnel. Local behavior is connected; real launch content remains the main gap.",
    items: [
      {
        feature: "30-day schedule",
        status: "verified",
        behavior: "Geography is mapped from Day 1 to Day 30. The command-room map keeps future unfinished days locked, clamps typed untouched-future URLs back to the current topic, and keeps completed or evidence-bearing days available for backward review. Static lesson/media contracts pass 30/30 and Week 1-4 browser content-pack checks cover the full staged Geography month.",
        evidence: "plan.ts, geography-command-simple-entry-e2e.cjs, verify-geography-day*-lesson-static.mjs, and geography-week1-4-content-pack-e2e.cjs",
      },
      {
        feature: "Talk room",
        status: "verified",
        behavior: "Speech or typed explanation is scored locally, a mastery plan identifies missing concepts, and the route stays in repair until the 95% recall target is cleared. Learners see one AI-teacher question and one next action without raw internal route-stage or steady-state backend labels. The mastery plan remains visible only while repair is required and disappears after clearance so the MCQ route is the single forward action.",
        evidence: "geography-talk-simple-e2e.cjs, verify-adaptive-teacher-talk.cjs, verify-adaptive-teacher-transition.cjs, and verify-level-aware-guided-session.cjs",
      },
      {
        feature: "Watch room",
        status: "verified",
        behavior: "Beginner receives one large 10-15 minute topic lesson first; experienced learners receive the same surface only after diagnosis exposes a repair gap. The redundant route-summary panel, visible day-jump controls, and premature above-player completion shortcut are removed while one enlarged player-level action persists the five-checkpoint Talk handoff. An attached approved recording opens Talk automatically when playback ends. Once recall clears 95%, direct Watch visits hide the lesson and open MCQ instead of reopening an unnecessary discussion loop.",
        evidence: "verify-level-aware-guided-session.cjs, geography-watch-simple-e2e.cjs, and geography-day1-source-backed-watch-e2e.cjs",
      },
      {
        feature: "Visual Lab",
        status: "verified",
        behavior: "Map and mechanism proof remains available as optional support without obstructing the simple learner loop. An incomplete learner can continue directly to MCQ without saving a visual, while a saved proof requires one meaningful note and records all five stages before MCQ handoff. Day 1 adds five source-backed map-relationship choices.",
        evidence: "verify-level-aware-guided-session.cjs, geography-lab-simple-proof-e2e.cjs, and geography-day1-map-relationship-lab-e2e.cjs",
      },
      {
        feature: "Fresh MCQ practice",
        status: "verified",
        behavior: "The local Day 1 boundary blocks a weak one-question intake, accepts a reviewed 25-question set, returns to a clean learner-only practice page, and routes weak performance into recovery. During practice the competing route panel stays hidden, the learner cannot skip an unanswered question or change an answer after feedback, and backward review remains available. Result states expose exactly one continuation action: short Revisit after a weak score or the next topic after command.",
        evidence: "geography-mcq-simple-practice-e2e.cjs",
      },
      {
        feature: "Revisit and Track",
        status: "verified",
        behavior: "Track opens with one current task, three compact read-only signals, and one next-topic action. Detailed diagnostics, the evidence ledger, and the 30-day maps stay folded; untouched future cards are locked while saved historical days remain reviewable. Revisit appears only for a real weak point, requires one correction note, keeps the optional five-step checklist folded, and exposes one return-to-discussion action.",
        evidence: "geography-track-diagnostics-e2e.cjs, geography-track-evidence-ledger-e2e.cjs, geography-revisit-simple-e2e.cjs, and verify-mcq-revisit-simple.cjs",
      },
      {
        feature: "Animation Studio",
        status: "partial",
        behavior: "Protected operator catalog and all 24 portal-motion storyboard previews are browser-verified. The first Universe pilot advances the tilted-Earth orbit continuously while Play is active, the Earth-interior pilot circulates mantle-current markers, and the Volcanism pilot adds continuous magma ascent, effusive lava advance, and explosive ash lift. The compact Day 2 learner lesson stays separate from the operator-heavy studio. Three.js depth and export-grade Remotion or HyperFrames production remain open.",
        evidence: "geography-animation-studio-e2e.cjs and geography-day2-universe-lesson-e2e.cjs",
      },
      {
        feature: "Real Day 1 pack",
        status: "partial",
        behavior: "A source-backed portal-native foundation draft and five-choice India map-relationship drill now work locally. Approved recording playback activates only when the recording and transcript pair are both attached; a partial attachment stays on the honest portal-native fallback. Final recorded lecture media, transcript approval, detailed visual production depth, and fresh advanced MCQs are still required.",
        evidence: "geography-day1-source-backed-watch-e2e.cjs, geography-day1-map-relationship-lab-e2e.cjs, and release gate",
      },
    ],
  },
  {
    title: "Shared subject structure",
    summary: "Later-subject scaffolds remain available for master inspection and hidden from learners until the Geography pilot is proven live.",
    items: [
      {
        feature: "Environment",
        status: "partial",
        behavior: "Shared loop and sample evidence exist; real content depth remains incomplete.",
        evidence: "environment browser regressions",
      },
      {
        feature: "Economy",
        status: "partial",
        behavior: "Shared structure and sample browser flow exist.",
        evidence: "subject browser regressions",
      },
      {
        feature: "Disaster Management",
        status: "partial",
        behavior: "Shared room routes exist; content production has not started.",
        evidence: "route audit",
      },
      {
        feature: "Science and Technology",
        status: "partial",
        behavior: "Shared room routes exist; content production has not started.",
        evidence: "route audit",
      },
      {
        feature: "Polity and Governance",
        status: "partial",
        behavior: "Shared room routes exist; content production has not started.",
        evidence: "route audit",
      },
      {
        feature: "Internal Security and Society",
        status: "partial",
        behavior: "Shared room routes exist; content production has not started.",
        evidence: "route audit",
      },
      {
        feature: "History",
        status: "partial",
        behavior: "A 60-day structural blueprint exists; real content depth remains incomplete.",
        evidence: "history blueprint audit",
      },
    ],
  },
  {
    title: "Learner data and authentication",
    summary: "Local persistence is ready; live identity and recovery proof must happen before sharing.",
    items: [
      {
        feature: "Offline-first learner profile",
        status: "verified",
        behavior: "Profile saves locally immediately. Remote writes serialize so the newest payload wins, newer offline state retries after authentication or reconnect, and logout or authenticated account switches clear learner-only local state. Mounted UPSC rooms immediately re-run the profile gate after cleanup. Legacy profile records normalize before routing so a stale level cannot reopen the wrong learner path.",
        evidence: "verify-supabase-learner-state-static.mjs, verify-student-dashboard.cjs, and verify-level-aware-guided-session.cjs",
      },
      {
        feature: "Offline-first subject progress",
        status: "verified",
        behavior: "Talk, Watch, Lab, MCQ, and Revisit state save locally. Remote writes serialize so a slower stale upload cannot overwrite newer progress, and newer offline state retries after hydration or reconnect.",
        evidence: "verify-supabase-learner-state-static.mjs and verify-student-dashboard.cjs",
      },
      {
        feature: "Adaptive teacher API boundary",
        status: "verified",
        behavior: "Learner-authenticated no-store endpoint requires JSON, rejects oversized learner payloads before parsing, isolates the provider key on the server, caps provider bytes and coach text before rendering, applies a local 12-request guard, prepares a Supabase-backed distributed limit with non-local fail-closed behavior, enforces a timeout, version-tags prompt and rubric traces, and returns structured local guidance when Gemini is not configured. The browser validates the successful response contract again before persisting teacher trace data.",
        evidence: "verify-adaptive-teacher-api.cjs, verify-adaptive-teacher-evaluation.cjs, verify-adaptive-teacher-talk.cjs, verify-adaptive-teacher-transition.cjs, and verify-adaptive-teacher-production-boundary-static.mjs",
      },
      {
        feature: "Supabase distributed teacher limiter",
        status: "external",
        behavior: "Migration, privilege check, hashed request identity, server-only secret adapter, and non-local fail-closed route are prepared. Apply the SQL and configure SUPABASE_SECRET_KEY on Vercel before live Talk requests.",
        evidence: "20260531_upsc_adaptive_teacher_rate_limit.sql and verify-adaptive-teacher-production-boundary-static.mjs",
      },
      {
        feature: "Supabase profile sync",
        status: "external",
        behavior: "Adapter exists; live table migration and continuity rehearsal remain open.",
        evidence: "verify-supabase-learner-state-static.mjs",
      },
      {
        feature: "Supabase subject progress sync",
        status: "external",
        behavior: "Adapter exists; live table migration and continuity rehearsal remain open.",
        evidence: "verify-supabase-learner-state-static.mjs",
      },
      {
        feature: "Row-level security",
        status: "external",
        behavior: "Migration defines auth.uid() = user_id policies and awaits live apply.",
        evidence: "20260531_upsc_learner_state.sql",
      },
      {
        feature: "Google OAuth",
        status: "external",
        behavior: "Client branch exists; provider callback must be verified on the deployed URL.",
        evidence: "SUPABASE_LIVE_APPLY_CHECKLIST_2026-05-31.md",
      },
    ],
  },
  {
    title: "Operator and admin tools",
    summary: "Internal rooms are retained for operating the pilot and remain hidden from students.",
    items: [
      {
        feature: "Admin Console",
        status: "verified",
        behavior: "Default operator landing shows only audited readiness, release gates, ordered next actions, Day 1 source decision, and corpus evidence.",
        evidence: "verify-upsc-operator-dashboard.cjs",
      },
      {
        feature: "Launch tracker",
        status: "verified",
        behavior: "Shows honest readiness, pending live steps, controlled tester workflow, and an operator-only six-receipt live-release boundary for Supabase RLS, Talk limiting, server-side AI configuration, deployed OAuth continuity, the real Day 1 pack, and the first controlled wave.",
        evidence: "admin-launch-plan-e2e.cjs",
      },
      {
        feature: "Founder Review",
        status: "verified",
        behavior: "Seven-point human review center exposes Geography surfaces, release gates, and the Day 1 content decision without fabricated health metrics.",
        evidence: "verify-upsc-admin-route-isolation.cjs",
      },
      {
        feature: "Integrity Logs",
        status: "verified",
        behavior: "Read-only local control view reports localhost preview, local MCQ drafts, and isolated legacy publishing without implying live health proof.",
        evidence: "verify-upsc-admin-route-isolation.cjs",
      },
      {
        feature: "Portal route matrix",
        status: "verified",
        behavior: "Role-aware browser crawl covers all 89 concrete page routes across public, learner, master-only, redirect, and isolated surfaces.",
        evidence: "verify-upsc-route-matrix.cjs",
      },
      {
        feature: "Subject content maturity matrix",
        status: "verified",
        behavior: "Source-derived audit separates 201 planned study days and 62 lab routes from 30 Geography rehearsal definitions and zero founder-approved live packs. Days 1 and 2 remain portal-native drafts, so Content Command honestly reports 28/30 staged locally.",
        evidence: "build-upsc-subject-readiness-matrix.mjs",
      },
      {
        feature: "Daily, Content, MCQ, and Revision Command",
        status: "verified",
        behavior: "Operator-only command screens remain accessible to masters.",
        evidence: "verify-upsc-operator-route-gate.cjs",
      },
      {
        feature: "Content Command rehearsal boundary",
        status: "verified",
        behavior: "Operator labels distinguish locally staged rehearsal packs from founder-approved live lecture media and student-release approval.",
        evidence: "verify-content-rehearsal-boundary.cjs",
      },
      {
        feature: "Readiness Audit",
        status: "verified",
        behavior: "Operator-only local readiness screen.",
        evidence: "verify-upsc-operator-route-gate.cjs",
      },
      {
        feature: "Prelims 2026 V2 audit",
        status: "verified",
        behavior: "Master-only Morning Batch corpus audit with locked public claim percentage.",
        evidence: "verify-prelims-audit-v2.cjs",
      },
      {
        feature: "Question bank and bulk upload",
        status: "verified",
        behavior: "Fresh CSV intake, strict quality preflight, local founder-review storage, draft-bank review, and a clean Geography learner-room handoff work without calling the retired API or leaking operator toasts.",
        evidence: "bulk-upload-upsc-csv-e2e.cjs and geography-mcq-simple-practice-e2e.cjs",
      },
    ],
  },
  {
    title: "Security and isolated legacy surfaces",
    summary: "Unsafe or backend-dependent routes stay behind master access until their release decision is explicit.",
    items: [
      {
        feature: "Student route isolation",
        status: "verified",
        behavior: "Learners are redirected away from operator, admin, simulation, and legacy exam routes.",
        evidence: "verify-upsc-operator-route-gate.cjs",
      },
      {
        feature: "Future subject isolation",
        status: "verified",
        behavior: "Environment through History remain master-inspection scaffolds; learners are redirected to Today until the Geography pilot closes.",
        evidence: "verify-future-subject-isolation.cjs",
      },
      {
        feature: "Internal audit API boundary",
        status: "verified",
        behavior: "Learner and forged JWT requests receive 403; explicit localhost master requests receive 200.",
        evidence: "verify-upsc-operator-route-gate.cjs",
      },
      {
        feature: "Real audit API token",
        status: "external",
        behavior: "Production token must verify through Supabase and match the master email list.",
        evidence: "live continuity rehearsal",
      },
      {
        feature: "Legacy exam interface",
        status: "isolated",
        behavior: "UI exists, but its legacy backend API is not running locally.",
        evidence: "route audit",
      },
      {
        feature: "Legacy MCQ publishing API",
        status: "isolated",
        behavior: "Live question-bank publishing stays off by default; enable NEXT_PUBLIC_ENABLE_LEGACY_API only after an approved authenticated replacement backend is verified.",
        evidence: "bulk-upload-upsc-csv-e2e.cjs",
      },
      {
        feature: "Prelims simulation lobby",
        status: "isolated",
        behavior: "Master-only prototype stays disabled until API verification.",
        evidence: "route audit",
      },
      {
        feature: "Legacy observability",
        status: "isolated",
        behavior: "Trace, job, metric, and governance polling stays disabled until an authenticated observability backend is deliberately restored.",
        evidence: "verify-upsc-admin-route-isolation.cjs",
      },
      {
        feature: "Student analytics",
        status: "isolated",
        behavior: "Reserved for real learner evidence after live continuity and the controlled tester wave.",
        evidence: "verify-upsc-admin-route-isolation.cjs",
      },
      {
        feature: "Legacy test management",
        status: "isolated",
        behavior: "Retained for internal inspection while day-specific fresh MCQ readiness remains the pilot standard.",
        evidence: "verify-upsc-admin-route-isolation.cjs",
      },
    ],
  },
];

export const releaseGates: ReleaseGate[] = [
  {
    title: "Local production build",
    complete: true,
    detail: "Rebuilt successfully with 146 generated app routes, including pricing checkout, optional subject pages, source library, reports, and this operator inventory.",
  },
  {
    title: "Student navigation and route isolation",
    complete: true,
    detail: "Simple learner navigation and protected internal boundaries pass locally.",
  },
  {
    title: "Supabase static preflight",
    complete: true,
    detail: "Local learner-state wiring passes all 27 checks, including serialized remote writes, offline recovery retries, mounted profile-gate recheck, and logout/account-switch cleanup.",
  },
  {
    title: "Local Geography Day 1 fresh-intake boundary",
    complete: true,
    detail: "Weak intake is blocked; a reviewed 25-question set returns to a clean learner-only practice page. Final student-grade MCQs are still required.",
  },
  {
    title: "Live Supabase learner-state migration",
    complete: false,
    detail: "Apply the prepared SQL migration in the live Supabase SQL Editor.",
  },
  {
    title: "Live Supabase distributed AI limiter",
    complete: false,
    detail: "Apply the prepared adaptive-teacher rate-limit SQL and add the server-only SUPABASE_SECRET_KEY in Vercel.",
  },
  {
    title: "Google OAuth callback rehearsal",
    complete: false,
    detail: "Verify the deployed URL with a real Google account.",
  },
  {
    title: "Cross-browser learner-state continuity",
    complete: false,
    detail: "Prove same-account recovery and different-account isolation.",
  },
  {
    title: "Real Geography Day 1 pack",
    complete: false,
    detail: "Source-backed portal-native draft passes locally. Attach the final recorded lecture, transcript approval, detailed visual proof, and fresh MCQs.",
  },
  {
    title: "Controlled tester wave",
    complete: false,
    detail: "Run the first tiny wave and repair every blocker before widening.",
  },
];

export const morningBatchCorpusSummary = [
  { label: "Indexed local files", value: "1,504" },
  { label: "Supported documents", value: "1,247" },
  { label: "Files with extractable text", value: "577" },
  { label: "Searchable chunks", value: "24,131" },
  { label: "Empty PDF pages", value: "14,671" },
  { label: "Verified public claims", value: "0" },
];

export function countInventoryStatuses() {
  return featureInventoryGroups
    .flatMap((group) => group.items)
    .reduce(
      (counts, item) => {
        counts[item.status] += 1;
        return counts;
      },
      { verified: 0, partial: 0, external: 0, isolated: 0 } satisfies Record<InventoryStatus, number>
    );
}

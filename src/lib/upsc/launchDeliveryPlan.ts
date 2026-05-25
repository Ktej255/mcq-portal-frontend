export type DeliveryStatus = "done" | "in-progress" | "pending" | "risk";

export type DeliveryMetric = {
  label: string;
  value: string;
  detail: string;
};

export type DeliveryWorkLog = {
  date: string;
  planned: string;
  completed: number;
  status: DeliveryStatus;
  codeWork: string[];
  valueDelivered: string[];
  evidence: string[];
};

export type DeliveryFocusItem = {
  title: string;
  owner: string;
  status: DeliveryStatus;
  percent: number;
  outcome: string;
};

export type DailyLaunchPlan = {
  date: string;
  title: string;
  objective: string;
  completionTarget: string;
  checkpoints: DeliveryFocusItem[];
};

export type SixDayFocus = {
  date: string;
  focus: string;
  output: string;
  riskControl: string;
};

export type LaunchVerdict = {
  title: string;
  status: DeliveryStatus;
  value: string;
  detail: string;
};

export const launchReadinessMetrics: DeliveryMetric[] = [
  {
    label: "Geography local pilot",
    value: "98%",
    detail: "Core routes, day mapping, Watch, Talk, Lab, MCQ, Track, Revisit, upload context, and quality gates are functional locally.",
  },
  {
    label: "Real student readiness",
    value: "97%",
    detail: "Day 1 journey, testing cockpit, all 30 Geography local class packs, and the 25-question Day 1 MCQ intake gate pass locally; remaining risk is real MCQ supply, real media depth, and live student feedback.",
  },
  {
    label: "Student testing window",
    value: "Ready locally",
    detail: "Clean Geography student pilot route, operator cockpit, tester script, share rules, feedback capture, and admin release decision are in place for local pilot feedback.",
  },
  {
    label: "June 1 batch risk",
    value: "Medium-low",
    detail: "Risk is fresh MCQ/media maturity and first live feedback, not basic app wiring or 30-day Geography class-pack coverage.",
  },
];

export const launchVerdictCards: LaunchVerdict[] = [
  {
    title: "May 24 plan verdict",
    status: "done",
    value: "Locally closed",
    detail:
      "Geography reached local production-pilot level: 30-day class packs, student loop, MCQ gate, Track/Revisit, testing cockpit, and admin tracker are built and verified.",
  },
  {
    title: "Still pending",
    status: "risk",
    value: "Human and content pass",
    detail:
      "Founder manual review, real student feedback, real advanced MCQs, and final media depth are the remaining launch risks. These are not basic route-wiring blockers.",
  },
  {
    title: "Current direction",
    status: "in-progress",
    value: "Geography first",
    detail:
      "Environment and other subjects stay paused until the Geography controlled student pilot has completed the first feedback-and-repair cycle.",
  },
];

export const deliveryWorkLog: DeliveryWorkLog[] = [
  {
    date: "Before May 23",
    planned: "Convert the existing MCQ portal into the foundation for a broader UPSC learning portal.",
    completed: 65,
    status: "done",
    codeWork: [
      "Existing dashboard, admin console, exam, reports, question bank, and bulk upload baseline existed.",
      "Core local app structure was already present in the Next.js frontend.",
    ],
    valueDelivered: [
      "The MCQ portal became the base system instead of a disposable prototype.",
      "Admin and student shells were available for UPSC-specific expansion.",
    ],
    evidence: ["Routes already present under dashboard, admin, tests, reports, and bulk upload."],
  },
  {
    date: "May 23",
    planned: "Make Geography the first production pilot subject and stop depending on cloud/Firebase for local testing.",
    completed: 82,
    status: "done",
    codeWork: [
      "Restored local login bypass for localhost testing.",
      "Built Geography 30-day GS-compatible schedule and room structure.",
      "Connected Command, Watch, Talk, Track, Revisit, Visual Lab, and MCQ readiness routes.",
      "Fixed forward/backward day movement across Geography rooms.",
      "Added contextual MCQ upload for subject, day, batch, and return path.",
      "Removed checked old protected branding from UPSC local flows.",
    ],
    valueDelivered: [
      "A student can move through Geography as a subject portal instead of only seeing an MCQ page.",
      "The admin can upload Geography MCQs against the exact day and batch without accidental mismatch.",
      "Local testing became possible even when Firebase or cloud services are unavailable.",
    ],
    evidence: [
      "Geography shared navigation E2E passed.",
      "Geography bulk context E2E passed.",
      "Production build passed locally.",
    ],
  },
  {
    date: "May 24",
    planned: "Close the Geography production pilot gaps and create an admin launch tracker for daily accountability.",
    completed: 99,
    status: "in-progress",
    codeWork: [
      "Added Geography MCQ quality preflight gate for weak versus strong CSV validation.",
      "Wired Geography MCQ readiness to the strict Geography audit so count-only batches cannot unlock student practice.",
      "Exposed the ready-state MCQ quality score in the Geography command board for operator verification.",
      "Updated Geography MCQ browser proofs with stronger fresh MCQ rows and quality-score assertions.",
      "Added a controlled Geography pilot release decision so the admin can approve or pause link sharing locally.",
      "Added tester share rules and a step-by-step Geography Day 1 pilot script to the testing cockpit.",
      "Split the shareable student pilot route from the operator testing cockpit so testers do not see admin language.",
      "Added a dynamic current-action panel and first-tester script to the student pilot route.",
      "Added a shared student handoff strip across Watch, Talk, and Visual Lab for previous/next room clarity.",
      "Added a zero-progress pilot proof so a fresh tester can start from the student link without seeded learner state.",
      "Added a share-ready rehearsal from the public pilot link through Watch handoff, Talk verdict, Lab proof, and feedback capture.",
      "Added a founder review checklist for Geography landing, Watch, Talk, Visual Lab, MCQ intake, Track/Revisit, and mobile fit.",
      "Blocked pilot approval until founder review checklist is complete and no open blocker feedback remains.",
      "Added a real GEO-D01 intake rule: Day 1 cannot import as a launch bank until 25 fresh audited MCQs are present.",
      "Hardened local MCQ command sync so Geography and Environment batches stay DRAFT unless their subject quality audit passes.",
      "Added all-day Geography MCQ production sweep for 30 sessions.",
      "Added this admin launch plan and delivery tracker.",
      "Verified Geography Watch to Talk handoff with scene proof and saved recap.",
      "Verified Talk classroom loop with AI teacher, peer challenge, examiner verdict, and next-route decision.",
      "Tightened Visual Lab so direct MCQ access stays locked until Talk proof and all five Lab proofs are saved.",
      "Verified Earth Layers, Monsoon, India Atlas, Lab completion, and Lab-to-MCQ routing in browser.",
      "Added a full Geography Day 1 student journey smoke from Watch through Talk, Visual Lab, MCQ outcome, Track, and Revisit.",
      "Added a controlled Geography testing cockpit and admin observation panel with local feedback capture.",
      "Staged the first Geography Day 1 content pack with ready video, notes, transcript summary, and Talk handoff preview.",
      "Standardized content placeholder behavior so missing class packs show planned status rather than a broken empty state.",
      "Expanded Geography Week 1 class packs for Days 1-7 with lesson promise, notes preview, transcript summary, and Talk handoff.",
      "Kept Day 8+ as explicit planned placeholders so incomplete content cannot look silently ready.",
      "Expanded Geography Week 2 class packs for Days 8-14 across India physiography, drainage, monsoon, climate, soils, resources, agriculture, and integrated map drill.",
      "Kept Day 15+ as explicit planned placeholders so Week 3 is not presented as production-ready before content is staged.",
      "Expanded Geography Week 3 class packs for Days 15-21 across population, settlements, economic activities, transport, industry, regional development, and human geography consolidation.",
      "Kept Day 22+ as explicit planned placeholders so Week 4 revision and atlas work are not presented as production-ready before content is staged.",
      "Expanded the final Geography block for Days 22-30 across atlas mastery, PYQ traps, disaster and environment bridge, mains application, full drill, weak repair, final mock, and command day.",
      "Added a non-Geography placeholder guard so Environment cannot accidentally look ready before its real class packs are staged.",
      "Added a final admin student share packet with the exact pilot link, tester cap, start instruction, stop rule, and feedback review rule.",
      "Added a student-facing pilot session guide with time window, resume rule, and finish-feedback rule.",
      "Added a Track closeout panel so completed Day 1 learners return to pilot feedback and still have a visible Revisit recovery route.",
      "Hardened the admin share packet so open Blocker feedback overrides prior approval and visibly stops link sharing.",
      "Hardened the student pilot route so open Blocker feedback pauses the shared link until the blocker is reviewed.",
      "Closed the student pause loophole by turning Day 1 path cards into non-clickable paused cards whenever sharing is blocked.",
      "Added live self-reported Blocker handling so saving Blocker feedback immediately pauses the student pilot route.",
      "Subscribed the student pilot route to local feedback/release events so admin review can resume the page without a manual refresh.",
    ],
    valueDelivered: [
      "Weak Geography MCQs are blocked before entering the local draft bank.",
      "Strong, properly mapped MCQs can be saved locally with quality metadata.",
      "Fresh MCQ count alone no longer opens student practice; rows must carry map or atlas anchors, mechanism explanation, syllabus link, and UPSC trap language.",
      "The operator can see a passed MCQ quality score before letting students enter practice.",
      "The testing link now has an operator sign-off layer before it is shared with real students.",
      "The student-facing pilot route now opens at /upsc/geography/pilot without exposing admin controls.",
      "The first tester can land on the pilot page and immediately see the correct next room plus the stuck rule.",
      "A fresh local student with no saved Geography progress now has a proven Start Watch room path.",
      "Students now see a consistent handoff surface in Watch, Talk, and Visual Lab with the current room, prior room, next room, and lock reason.",
      "The public pilot link now has an end-to-end rehearsal that reaches Lab proof and saves student feedback without entering through internal routes.",
      "The first tester receives one exact Day 1 path instead of improvising through the product.",
      "The founder review is now a visible checklist instead of an informal memory item.",
      "The admin cannot approve the student testing window until every launch-critical Day 1 surface is manually checked.",
      "A partial Day 1 MCQ file can no longer masquerade as a launch-ready bank.",
      "A 25-row audited GEO-D01 CSV becomes READY locally and rehydrates the Geography MCQ readiness room.",
      "The founder/admin view can now track what was planned, shipped, pending, and risky.",
      "A student can complete Watch scenes, carry the recap into Talk, answer the peer challenge, and receive a saved route decision.",
      "A student cannot skip Visual Lab into MCQ readiness; the route only opens after verified evidence.",
      "A complete Day 1 learner path now proves forward and backward room connectivity, MCQ command outcome, mobile fit, and old-branding cleanup.",
      "The founder can share one controlled local testing route and review saved tester feedback from the admin launch board.",
      "Day 1 Watch now opens with a credible class pack instead of a generic empty simulator, while Day 2+ clearly shows planned placeholders.",
      "Week 1 Watch and Content Command now open with staged Geography class packs, while Week 2 remains visibly planned until content is ready.",
      "Week 2 India Map Command now opens with staged class packs, while Week 3 remains visibly planned until content is ready.",
      "Week 3 Human and Economic Geography now opens with staged class packs, while Week 4 remains visibly planned until content is ready.",
      "Geography now has 30/30 local class packs staged for Watch, Content Command, and Talk handoff, while non-Geography subjects still show planned placeholders.",
      "The admin now has one share-ready handoff block for sending the pilot link without losing the operating rules.",
      "A tester can now pause and return to the pilot page with clear instruction to resume from the current room.",
      "After MCQ command, Track now becomes a proper student closeout surface instead of ending the loop silently.",
      "If a tester reports a Blocker, the admin sees a stop-sharing alert until that item is reviewed.",
      "If a Blocker exists, the student link itself stops exposing the Start/Open action and shows a paused review state.",
      "A blocked pilot link no longer leaves secondary room links available below the paused state.",
      "A student who reports a Blocker receives a clear pause confirmation and the route locks without a page reload.",
      "When the admin reviews the Blocker, the student page can return to the correct Start/Continue action through the local feedback update event.",
    ],
    evidence: [
      "Geography quality gate E2E passed.",
      "Geography MCQ readiness preflight E2E passed for content pending, quality review, command-ready, desktop, and mobile states.",
      "Geography MCQ gate E2E passed for Talk gate, Lab gate, fresh batch quality score, local practice, Track update, desktop, and mobile states.",
      "Geography testing cockpit E2E now covers tester script, share rules, student pilot current action, student first-tester script, student feedback save, admin review, admin approval, release persistence, desktop, and mobile states.",
      "Geography zero-progress pilot E2E proves an approved first-time student sees Start Watch room, opens Watch, and does not receive pre-seeded progress.",
      "Geography share-ready rehearsal E2E proves the public pilot link can carry a fresh tester through Watch handoff, Talk verdict, Lab proof, and feedback capture.",
      "Geography testing cockpit E2E now verifies pilot approval stays paused until the founder review checklist reaches 7/7.",
      "Geography Day 1 MCQ intake E2E blocks a 1-row GEO-D01 CSV, accepts 25 audited rows, marks GEO-D01 READY, and verifies the MCQ readiness return path.",
      "Geography bulk context E2E passed after the new gate.",
      "Geography all-day MCQ production E2E passed for all 30 days.",
      "Geography Watch to Talk handoff E2E passed.",
      "Geography Talk classroom loop E2E passed.",
      "Geography Visual Lab MCQ bypass E2E passed.",
      "Geography Visual Lab broad regression E2E passed.",
      "Geography Day 1 full student journey E2E passed with Watch/Talk/Lab handoff assertions, no desktop/mobile overflow, no console errors, and 3/3 MCQ command outcome.",
      "Geography testing cockpit E2E covers link, feedback save, admin review, desktop, and mobile.",
      "Geography content pack E2E covers Content Command Day 1, Watch Day 1, planned Day 2 placeholder, and mobile Watch proof.",
      "Geography Week 1 content pack E2E covers Days 1-7 ready state, Day 8 placeholder discipline, desktop Watch Day 6, and mobile Watch Day 7.",
      "Geography Week 2 content pack E2E covers Days 8-14 ready state, Day 15 placeholder discipline, desktop Watch Day 10, and mobile Watch Day 14.",
      "Geography Week 3 content pack E2E covers Days 15-21 ready state, Day 22 placeholder discipline, desktop Watch Day 18, and mobile Watch Day 21.",
      "Geography final block content pack E2E covers Days 22-30 ready state, Environment placeholder discipline, desktop Watch Day 24, and mobile Watch Day 30.",
      "Admin launch plan E2E covers the final share packet, exact student pilot link, tester cap, start rule, stop rule, feedback review rule, desktop, and mobile.",
      "Geography zero-progress and share-ready rehearsal E2Es cover the student session guide, resume rule, finish rule, desktop, and mobile.",
      "Geography Day 1 full student journey E2E now covers Track closeout, return to pilot feedback, feedback persistence, and Revisit recovery ledger.",
      "Admin launch plan E2E now seeds open Blocker feedback, verifies stop-sharing override, then marks it reviewed and verifies approval resumes.",
      "Geography zero-progress pilot E2E now seeds open Blocker feedback, verifies the student link pauses, then reviews the blocker and verifies Start Watch returns.",
      "Geography zero-progress pilot E2E now also verifies paused Day 1 path cards are not clickable links while Blocker feedback is open.",
      "Geography zero-progress pilot E2E now saves Blocker feedback from the student form and verifies immediate pause without reload.",
      "Geography zero-progress pilot E2E now marks that Blocker reviewed through the local event and verifies the student route resumes without reloading.",
    ],
  },
];

export const may24Plan: DailyLaunchPlan = {
  date: "May 24, 2026",
  title: "Geography Production Pilot Closure",
  objective:
    "Make Geography reliable enough for internal/founder testing and prepare the student testing link path.",
  completionTarget: "Geography 95-98% functional locally, with remaining gaps clearly listed.",
  checkpoints: [
    {
      title: "Admin launch tracker",
      owner: "Platform",
      status: "done",
      percent: 100,
      outcome: "Admin can see day-wise work log, May 24/25 plan, next six-day focus, and launch risk.",
    },
    {
      title: "Geography Watch room",
      owner: "Learning loop",
      status: "done",
      percent: 96,
      outcome: "Each day opens a credible lecture scene with topic, duration, learning promise, and visible Watch-to-Talk handoff.",
    },
    {
      title: "Geography Talk room",
      owner: "AI discussion",
      status: "done",
      percent: 96,
      outcome: "Student recall loop asks, evaluates, scores, redirects to Lab/Revisit, and exposes the next-room handoff clearly.",
    },
    {
      title: "Geography Visual Lab",
      owner: "Map and concept lab",
      status: "done",
      percent: 95,
      outcome: "Earth layer, monsoon, India atlas, rivers, parks, sanctuaries, soil-climate, proof-gated MCQ routing, and Lab-to-MCQ handoff are browser-verified.",
    },
    {
      title: "MCQ fresh upload readiness",
      owner: "Admin content",
      status: "done",
      percent: 100,
      outcome: "Contextual upload, strict Geography audit, 25-question GEO-D01 launch-bank rule, visible quality score, and local practice unlock are ready for fresh advanced MCQs.",
    },
    {
      title: "Student test smoke",
      owner: "Launch QA",
      status: "done",
      percent: 97,
      outcome: "One complete Geography Day 1 path passes locally from Watch to Talk to Visual Lab to MCQ Command, Track closeout, pilot feedback, Revisit, and mobile MCQ readiness.",
    },
  ],
};

export const may25Plan: DailyLaunchPlan = {
  date: "May 25, 2026",
  title: "Controlled Student Testing Readiness",
  objective:
    "Prepare one clean Geography testing link and one admin observation workflow before inviting students.",
  completionTarget: "One subject stable for controlled student testing, with known limitations documented.",
  checkpoints: [
    {
      title: "Founder review pass",
      owner: "Admin",
      status: "in-progress",
      percent: 70,
      outcome: "Admin release decision and 7-point founder checklist exist locally; founder still needs to perform the human review before sharing with students.",
    },
    {
      title: "Student testing route",
      owner: "Platform",
      status: "done",
      percent: 100,
      outcome: "Controlled local Geography student route exists at /upsc/geography/pilot with dynamic current action, first-tester script, session guide, blocker pause state, non-clickable paused path cards, zero-progress start proof, Day 1 path, gate checklist, and no admin-facing controls.",
    },
    {
      title: "Content placeholder discipline",
      owner: "Learning content",
      status: "done",
      percent: 98,
      outcome: "Geography Days 1-30 have staged local class packs and other subjects still show planned placeholders instead of broken empty states.",
    },
    {
      title: "Admin observation board",
      owner: "Operations",
      status: "done",
      percent: 99,
      outcome: "Admin launch plan now shows the testing link, feedback counts, latest observations, review action, founder checklist, approve/pause release decision, final student share packet, and live blocker stop-sharing override.",
    },
    {
      title: "Student feedback capture",
      owner: "QA",
      status: "done",
      percent: 99,
      outcome: "Student pilot captures tester feedback, immediately pauses itself on self-reported or existing Blocker feedback, resumes through local admin review events, and shows the finish-feedback rule before the pilot is closed.",
    },
  ],
};

export const nextSixDayFocus: SixDayFocus[] = [
  {
    date: "May 24",
    focus: "Geography closure",
    output: "Watch/Talk/Lab/MCQ loop reaches local production pilot level.",
    riskControl: "Do not expand new subjects until Geography journey passes.",
  },
  {
    date: "May 25",
    focus: "Controlled testing link",
    output: "Use the clean Geography student pilot link with a small tester group and collect first friction notes in admin.",
    riskControl: "Do not expand the test group if any blocker feedback remains open.",
  },
  {
    date: "May 26",
    focus: "Student feedback repairs",
    output: "Fix navigation, empty states, copy clarity, and first-session friction.",
    riskControl: "Treat every student confusion point as launch-critical.",
  },
  {
    date: "May 27",
    focus: "Geography content enrichment",
    output: "Attach first fresh high-quality MCQs and replace local staged packs with real recorded media where available.",
    riskControl: "Every new class pack must expose video, notes, transcript, and Talk handoff status before student use.",
  },
  {
    date: "May 28",
    focus: "Environment foundation only after Geography closure",
    output: "Mirror the proven Geography structure into Environment.",
    riskControl: "No superficial subject wrappers; each subject must inherit the same learning loop.",
  },
  {
    date: "May 29",
    focus: "Launch rehearsal",
    output: "End-to-end rehearsal of admin, student, content, and feedback flow.",
    riskControl: "Freeze risky UI churn after rehearsal unless it blocks launch.",
  },
];

export const launchFocusAreas: DeliveryFocusItem[] = [
  {
    title: "One subject first",
    owner: "Product strategy",
    status: "in-progress",
    percent: 98,
    outcome: "Geography remains the production pilot and now has a passing Day 1 journey, all 30 local class packs, strict MCQ quality gating, and a clean controlled student pilot route before Environment expansion.",
  },
  {
    title: "Learning loop depth",
    owner: "Student experience",
    status: "in-progress",
    percent: 99,
    outcome: "Watch, Talk, Visual Lab, MCQ, Track, and Revisit pass as one connected learner path with visible handoff decisions, resume guidance, all 30 Geography class packs staged, and MCQ practice blocked until fresh rows pass quality.",
  },
    {
      title: "Admin accountability",
      owner: "Operations",
      status: "in-progress",
      percent: 99,
      outcome: "Daily plan, completion, next work, risk status, Day 1 journey evidence, 30-day Geography content evidence, MCQ quality evidence, testing feedback, founder checklist, pilot release decision, and share packet are visible in the admin page.",
  },
  {
    title: "Fresh content quality",
    owner: "Content",
    status: "risk",
    percent: 93,
    outcome: "All 30 Geography local class packs are staged and Day 1 MCQ quality acceptance now requires 25 audited rows; full media assets and the real fresh advanced MCQ bank still need expansion.",
  },
];

export const immediateLaunchActions: DeliveryFocusItem[] = [
  {
    title: "Finish founder checklist",
    owner: "Founder / Admin",
    status: "in-progress",
    percent: 70,
    outcome:
      "Manually inspect Geography landing, Watch, Talk, Visual Lab, MCQ intake, Track/Revisit, and mobile fit before approving the student pilot link.",
  },
  {
    title: "Invite the first tiny tester group",
    owner: "Launch QA",
    status: "pending",
    percent: 0,
    outcome:
      "After the checklist is complete, share only /upsc/geography/pilot with up to 3 students and require one feedback note from each tester.",
  },
  {
    title: "Repair every blocker before widening",
    owner: "Platform",
    status: "pending",
    percent: 0,
    outcome:
      "If any tester marks Blocker, stop sharing automatically, review it in admin, fix the issue, and retest the same path before inviting more students.",
  },
  {
    title: "Load fresh advanced GEO-D01 MCQs",
    owner: "Content",
    status: "risk",
    percent: 25,
    outcome:
      "The upload engine is ready, but the real student-grade Day 1 MCQ bank still depends on fresh advanced questions supplied for final import.",
  },
];

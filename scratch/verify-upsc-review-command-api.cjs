const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/api/upsc/prelims-2026/review-command`;

const expectedActionLaneIds = [
  "website-release",
  "mcq-proof-lock",
  "source-archive-triage",
  "reallocation",
  "practice-build",
  "delivery-tracking",
];

const expectedApi = {
  reviewCommand: "/api/upsc/prelims-2026/review-command",
  releaseDecision: "/api/upsc/prelims-2026/release-decision",
  mainSiteHandoff: "/api/upsc/prelims-2026/main-site-handoff",
  manifest: "/api/upsc/prelims-2026/showcase-manifest",
  matchAccountability: "/api/upsc/prelims-2026/match-accountability",
  questionLedger: "/api/upsc/prelims-2026/question-ledger",
  proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
  courseAction: "/api/upsc/prelims-2027/course-action",
  sourceArchiveSummary: "/api/upsc/prelims-2026/source-archive-summary",
  buildReadiness: "/api/upsc/prelims-2026/build-readiness",
};

const forbiddenTokens = [
  "D:\\",
  "C:\\",
  "relativePath",
  "sampleFiles",
  "Paid Students",
  "Mians ready Dec 2025",
  "Morning Batch",
];

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 3000)}` : message);
  }
}

function assertApiMap(api) {
  for (const [key, endpoint] of Object.entries(expectedApi)) {
    assert(api?.[key] === endpoint, `Review Command API map missing ${key}`, api);
  }
}

function assertPublicSafe(serialized) {
  for (const token of forbiddenTokens) {
    assert(!serialized.includes(token), `Review Command leaked forbidden token ${token}`);
  }
  assert(!/webinar/i.test(serialized), "Review Command contains webinar wording");
}

(async () => {
  const response = await fetch(route);
  const payload = await response.json();
  const serialized = JSON.stringify(payload);
  const actionLaneIds = payload.actionLanes?.map((lane) => lane.id) || [];
  const quickLinkHrefs = payload.quickLinks?.map((link) => link.href) || [];
  const priorityIds = payload.priorities?.map((priority) => priority.id) || [];
  const criticalIds = payload.priorities
    ?.filter((priority) => priority.priority === "Critical")
    .map((priority) => priority.id) || [];
  const phaseCounts = payload.phaseCounts || {};

  assert(response.status === 200, `Review Command API returned ${response.status}`, payload);
  assert(response.headers.get("cache-control")?.includes("no-store"), "Review Command API should not be cached");
  assert(payload.version === "upsc-prelims-2026-review-command-v1", "Unexpected Review Command version", payload.version);
  assert(payload.status === "ready-with-live-archive", "Unexpected Review Command status", payload.status);
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Wrong public route", payload.publicRoute);
  assert(payload.dashboardRoute === "/upsc/prelims-2026-showcase", "Wrong dashboard route", payload.dashboardRoute);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong Review Command route", payload.reviewCommandRoute);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong strategy route", payload.strategyRoute);
  assert(/proof-locked/i.test(payload.proofPolicy || ""), "Proof policy should mention proof locks", payload.proofPolicy);

  assert(payload.summary?.effectiveCoveragePercent === 76, "Wrong coverage percent", payload.summary);
  assert(payload.summary?.preparedQuestions === 74, "Wrong prepared question count", payload.summary);
  assert(payload.summary?.scorableQuestions === 97, "Wrong scorable question count", payload.summary);
  assert(payload.summary?.direct === 44, "Wrong direct count", payload.summary);
  assert(payload.summary?.partial === 30, "Wrong partial count", payload.summary);
  assert(payload.summary?.misses === 23, "Wrong miss count", payload.summary);
  assert(payload.summary?.dropped === 3, "Wrong dropped count", payload.summary);
  assert(payload.summary?.totalQuestions === 100, "Wrong total question count", payload.summary);
  assert(payload.summary?.completeQuestionCards === 100, "Wrong complete question card count", payload.summary);
  assert(payload.summary?.optionSets === 100, "Wrong option set count", payload.summary);
  assert(payload.summary?.statementCoverageRows === 275, "Wrong statement row count", payload.summary);
  assert(payload.summary?.multiStatementQuestions === 75, "Wrong multi-statement question count", payload.summary);
  assert(payload.summary?.sourceCandidateQuestions === 98, "Wrong source candidate count", payload.summary);
  assert(payload.summary?.sourceBlindSpotQuestions === 2, "Wrong source blind spot count", payload.summary);
  assert(payload.summary?.sourceGapWorkOrdersRequired === 2, "Wrong source gap work-order count", payload.summary);
  assert(payload.summary?.priorityCount === 8, "Wrong priority count", payload.summary);
  assert(payload.summary?.criticalPriorityCount === 2, "Wrong critical priority count", payload.summary);
  assert(payload.summary?.taskCount === 34, "Wrong task count", payload.summary);
  assert(payload.summary?.practiceBlueprintCount === 16, "Wrong practice blueprint count", payload.summary);
  assert(payload.summary?.formatRuleCount === 6, "Wrong format rule count", payload.summary);
  assert(payload.summary?.buildFromScratchCount === 2, "Wrong build-from-scratch count", payload.summary);
  assert(payload.summary?.readinessRequirementCount === 12, "Wrong readiness requirement count", payload.summary);
  assert(payload.summary?.readinessCompleteCount === 9, "Wrong readiness complete count", payload.summary);
  assert(payload.summary?.readinessProofLockedCount === 2, "Wrong readiness proof-locked count", payload.summary);
  assert(payload.summary?.apiEndpointCount === 10, "Wrong API endpoint count", payload.summary);

  assert(Array.isArray(payload.quickLinks) && payload.quickLinks.length === 3, "Quick links missing", payload.quickLinks);
  assert(quickLinkHrefs.includes("/upsc-prelims-2026-showcase"), "Public showcase quick link missing", quickLinkHrefs);
  assert(quickLinkHrefs.includes("/upsc/prelims-2027-strategy"), "Strategy quick link missing", quickLinkHrefs);
  assert(
    quickLinkHrefs.includes("/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue"),
    "Proof queue quick link missing",
    quickLinkHrefs
  );

  assert(Array.isArray(payload.actionLanes) && payload.actionLanes.length === 6, "Action lanes missing", payload.actionLanes);
  for (const id of expectedActionLaneIds) {
    assert(actionLaneIds.includes(id), `Missing action lane ${id}`, actionLaneIds);
  }
  assert(
    payload.actionLanes.every(
      (lane) =>
        typeof lane.title === "string" &&
        typeof lane.status === "string" &&
        typeof lane.metric === "string" &&
        typeof lane.detail === "string" &&
        lane.ownerRoute?.startsWith("/")
    ),
    "Action lane rows are incomplete",
    payload.actionLanes
  );

  assert(payload.sourceReadiness?.sourceConnected === true, "Source readiness should be connected", payload.sourceReadiness);
  assert(payload.sourceReadiness?.candidateQuestions === 98, "Wrong source readiness candidate count", payload.sourceReadiness);
  assert(payload.sourceReadiness?.blindSpotQuestions === 2, "Wrong source readiness blind-spot count", payload.sourceReadiness);
  assert(payload.sourceReadiness?.sourceGapWorkOrdersRequired === 2, "Wrong source readiness work-order count", payload.sourceReadiness);
  assert(
    Array.isArray(payload.sourceReadiness?.blindSpotQuestionNumbers) &&
      payload.sourceReadiness.blindSpotQuestionNumbers.includes(43) &&
      payload.sourceReadiness.blindSpotQuestionNumbers.includes(100),
    "Wrong source readiness blind-spot question numbers",
    payload.sourceReadiness
  );
  assert(
    payload.sourceReadiness?.strongestCandidateTrackId === "polity-legal-ethics",
    "Wrong strongest source readiness track",
    payload.sourceReadiness
  );

  assert(Array.isArray(payload.priorities) && payload.priorities.length === 8, "Priority rows missing", payload.priorities);
  assert(priorityIds[0] === "ir-multilateral", "First priority should be IR/multilateral", priorityIds);
  assert(criticalIds.length === 2, "Critical priority count drifted", criticalIds);
  assert(criticalIds.includes("ir-multilateral"), "IR critical priority missing", criticalIds);
  assert(criticalIds.includes("science-new-domains"), "Science critical priority missing", criticalIds);

  assert(phaseCounts.Source === 7, "Wrong Source phase count", phaseCounts);
  assert(phaseCounts.Capsule === 6, "Wrong Capsule phase count", phaseCounts);
  assert(phaseCounts.MCQ === 7, "Wrong MCQ phase count", phaseCounts);
  assert(phaseCounts.Proof === 5, "Wrong Proof phase count", phaseCounts);
  assert(phaseCounts.Release === 5, "Wrong Release phase count", phaseCounts);
  assert(phaseCounts.Planner === 4, "Wrong Planner phase count", phaseCounts);

  assertApiMap(payload.api);
  assertPublicSafe(serialized);

  console.log(
    JSON.stringify(
      {
        ok: true,
        route,
        version: payload.version,
        status: payload.status,
        summary: payload.summary,
        actionLaneIds,
        quickLinkHrefs,
        criticalIds,
        phaseCounts,
        api: payload.api,
      },
      null,
      2
    )
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/api/upsc/prelims-2026/main-site-handoff`;

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

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

function assertApiMap(api) {
  for (const [key, endpoint] of Object.entries(expectedApi)) {
    assert(api?.[key] === endpoint, `Main-site handoff API map missing ${key}`, api);
  }
}

function assertPublicSafe(serialized) {
  const forbiddenTokens = ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025"];
  for (const token of forbiddenTokens) {
    assert(!serialized.includes(token), `Main-site handoff leaked forbidden token ${token}`);
  }
  assert(!/webinar/i.test(serialized), "Main-site handoff contains webinar wording");
}

(async () => {
  const response = await fetch(route);
  const payload = await response.json();
  const serialized = JSON.stringify(payload);

  assert(response.status === 200, `Main-site handoff API returned ${response.status}`, payload);
  assert(response.headers.get("cache-control")?.includes("no-store"), "Main-site handoff API should not be cached");
  assert(payload.version === "upsc-prelims-2026-main-site-handoff-v1", "Unexpected main-site handoff version", payload.version);
  assert(payload.status === "ready-for-main-site-integration-with-proof-locks", "Wrong handoff status", payload.status);
  assert(payload.mode === "public-safe-main-site-bundle", "Wrong handoff mode", payload.mode);
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Wrong public route", payload.publicRoute);
  assert(payload.dashboardRoute === "/upsc/prelims-2026-showcase", "Wrong dashboard route", payload.dashboardRoute);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong review command route", payload.reviewCommandRoute);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong strategy route", payload.strategyRoute);
  assert(/public-safe/i.test(payload.proofPolicy || ""), "Proof policy should mark the bundle as public-safe", payload.proofPolicy);

  assert(payload.audit?.direct === 44, "Wrong direct hit count", payload.audit);
  assert(payload.audit?.partial === 30, "Wrong partial hit count", payload.audit);
  assert(payload.audit?.misses === 23, "Wrong miss count", payload.audit);
  assert(payload.audit?.dropped === 3, "Wrong dropped count", payload.audit);
  assert(payload.audit?.scorableQuestions === 97, "Wrong scorable question count", payload.audit);
  assert(payload.audit?.preparedQuestions === 74, "Wrong prepared question count", payload.audit);
  assert(payload.audit?.effectiveCoveragePercent === 76, "Wrong effective coverage", payload.audit);
  assert(payload.sourceLead?.directTextLeads === 37, "Wrong direct source-lead count", payload.sourceLead);
  assert(payload.sourceLead?.conceptualLeads === 63, "Wrong conceptual source-lead count", payload.sourceLead);
  assert(payload.sourceLead?.totalQuestions === 100, "Wrong source-lead total", payload.sourceLead);

  assert(payload.visualStory?.publicAnchor === "/upsc-prelims-2026-showcase#question-logic", "Wrong visual story anchor", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.totalQuestions === 100, "Wrong visual story question total", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.threePlusStatements === 67, "Wrong 3+ statement chart count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.twoStatements === 8, "Wrong 2-statement chart count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.noExplicitList === 25, "Wrong no-explicit-list chart count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.multiStatementQuestions === 75, "Wrong multi-statement total", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.statementCoverageRows === 275, "Wrong visual story statement rows", payload.visualStory);
  assert(/75\/100/.test(payload.visualStory?.statementDominanceLine || ""), "Visual story statement dominance line should use 75/100", payload.visualStory);

  assert(payload.website?.copyBlocks?.length === 4, "Wrong website copy block count", payload.website);
  assert(payload.website?.integrationMap?.length === 6, "Wrong website integration map count", payload.website);
  assert(/44 direct hits/i.test(payload.website?.correctedCoverageLine || ""), "Coverage line missing corrected audit", payload.website);
  assert(/UPSC Command software/i.test(payload.website?.softwareLine || ""), "Software line missing portal connection", payload.website);
  assert(payload.operatorHandoff?.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong operator review command route", payload.operatorHandoff);
  assert(payload.operatorHandoff?.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong operator strategy route", payload.operatorHandoff);
  assert(
    payload.operatorHandoff?.proofQueueRoute === "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue" &&
      payload.operatorHandoff?.sourceGapRoute === "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders" &&
      payload.operatorHandoff?.reallocationRoute === "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board" &&
      payload.operatorHandoff?.mcqCommandRoute === "/upsc/mcq-command" &&
      payload.operatorHandoff?.releaseDecisionApi === "/api/upsc/prelims-2026/release-decision",
    "Operator handoff routes are incomplete",
    payload.operatorHandoff
  );
  assert(/Start operators from the Review Command/i.test(payload.operatorHandoff?.rule || ""), "Operator handoff rule is missing", payload.operatorHandoff);

  assert(payload.readiness?.summary?.requirementCount === 12, "Wrong readiness requirement count", payload.readiness?.summary);
  assert(payload.readiness?.summary?.apiEndpointCount === 10, "Wrong readiness API endpoint count", payload.readiness?.summary);
  assert(payload.readiness?.summary?.questionCount === 100, "Wrong readiness question count", payload.readiness?.summary);
  assert(payload.readiness?.gates?.length === 4, "Wrong readiness gate count", payload.readiness);
  assert(payload.readiness?.requirements?.length === 12, "Wrong readiness requirement preview count", payload.readiness);

  assert(payload.questionLedger?.endpoint === expectedApi.questionLedger, "Wrong question ledger endpoint", payload.questionLedger);
  assert(payload.questionLedger?.proofLocked === true, "Question ledger should be proof locked", payload.questionLedger);
  assert(payload.questionLedger?.summary?.totalQuestions === 100, "Wrong question ledger total", payload.questionLedger?.summary);
  assert(payload.questionLedger?.summary?.completeQuestionCards === 100, "Wrong complete question card count", payload.questionLedger?.summary);
  assert(payload.questionLedger?.summary?.optionSets === 100, "Wrong option-set count", payload.questionLedger?.summary);
  assert(payload.questionLedger?.summary?.statementCoverageRows === 275, "Wrong statement coverage count", payload.questionLedger?.summary);
  assert(payload.questionLedger?.sourceLeadLedger?.directTextLeads === 37, "Wrong question ledger direct leads", payload.questionLedger?.sourceLeadLedger);
  assert(payload.questionLedger?.sourceLeadLedger?.conceptualLeads === 63, "Wrong question ledger conceptual leads", payload.questionLedger?.sourceLeadLedger);
  assert(payload.questionLedger?.sourceLeadLedger?.noIndexedLeads === 0, "Wrong question ledger no-indexed leads", payload.questionLedger?.sourceLeadLedger);
  assert(payload.questionLedger?.previewQuestions?.length === 3, "Wrong preview question count", payload.questionLedger?.previewQuestions);
  assert(
    payload.questionLedger.previewQuestions.every(
      (question) =>
        Number.isInteger(question.number) &&
        typeof question.stem === "string" &&
        question.stem.length > 20 &&
        question.optionCount >= 2 &&
        question.statementCoverageRows >= 1
    ),
    "Preview questions are incomplete",
    payload.questionLedger.previewQuestions
  );

  assert(payload.matchAccountability?.endpoint === expectedApi.matchAccountability, "Wrong match-accountability endpoint", payload.matchAccountability);
  assert(payload.matchAccountability?.publicAnchor === "/upsc-prelims-2026-showcase#match-accountability", "Wrong match-accountability public anchor", payload.matchAccountability);
  assert(
    payload.matchAccountability?.strategyAnchor === "/upsc/prelims-2027-strategy#prelims-2026-match-accountability-api-readiness",
    "Wrong match-accountability strategy anchor",
    payload.matchAccountability
  );
  assert(payload.matchAccountability?.summary?.totalQuestions === 100, "Wrong match-accountability question count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.portionRows === 275, "Wrong match-accountability portion count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.matchedPortionRows === 205, "Wrong matched portion count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.manualCheckRows === 70, "Wrong manual-check portion count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.fullyMatchedQuestions === 68, "Wrong fully matched question count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.partialMatchQuestions === 22, "Wrong partial match question count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.manualOnlyQuestions === 10, "Wrong manual-only question count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.summary?.proofLockedQuestions === 100, "Wrong proof-locked question count", payload.matchAccountability?.summary);
  assert(payload.matchAccountability?.previewQuestions?.length === 5, "Wrong match-accountability preview count", payload.matchAccountability?.previewQuestions);
  assert(
    payload.matchAccountability.previewQuestions.every(
      (question) =>
        Number.isInteger(question.number) &&
        typeof question.highestMatchedPortion === "string" &&
        Array.isArray(question.matchedPortionLabels) &&
        Array.isArray(question.manualCheckPortionLabels) &&
        Number.isInteger(question.coverageScorePercent) &&
        typeof question.nextProofAction === "string"
    ),
    "Match-accountability preview questions are incomplete",
    payload.matchAccountability.previewQuestions
  );

  assert(payload.sourceArchive?.endpoint === expectedApi.sourceArchiveSummary, "Wrong source archive endpoint", payload.sourceArchive);
  assert(payload.sourceArchive?.scan?.rootConnected === true, "Source archive root should be connected", payload.sourceArchive?.scan);
  assert(payload.sourceArchive?.scan?.totalFiles >= 1000, "Source archive file count is too low", payload.sourceArchive?.scan);
  assert(payload.sourceArchive?.scan?.pdfCount >= 1000, "Source archive PDF count is too low", payload.sourceArchive?.scan);
  assert(payload.sourceArchive?.scan?.trackCount === 8, "Wrong source archive track count", payload.sourceArchive?.scan);
  assert(payload.sourceArchive?.tracks?.length === 8, "Wrong source archive track rows", payload.sourceArchive?.tracks);

  assert(payload.sourceGapReadiness?.endpoint === "/api/upsc/source-archive", "Wrong source-gap readiness endpoint", payload.sourceGapReadiness);
  assert(
    payload.sourceGapReadiness?.strategyAnchor === "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders",
    "Wrong source-gap readiness strategy anchor",
    payload.sourceGapReadiness
  );
  assert(
    payload.sourceGapReadiness?.archiveProofAnchor === "/upsc/prelims-2027-strategy#prelims-2026-archive-proof-triage",
    "Wrong archive proof readiness anchor",
    payload.sourceGapReadiness
  );
  assert(payload.sourceGapReadiness?.sourceStatus === "ready", "Source-gap readiness should be ready", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.sourceConnected === true, "Source-gap readiness should connect to archive", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.totalQuestions === 100, "Wrong source-gap question total", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.candidateQuestions === 98, "Wrong archive candidate question count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.needsProofWithCandidates === 98, "Wrong needs-proof candidate count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.blindSpotQuestions === 2, "Wrong archive blind-spot count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.needsProofBlindSpots === 2, "Wrong needs-proof blind-spot count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.buildGapBlindSpots === 0, "Wrong build-gap blind-spot count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.sourceGapWorkOrdersRequired === 2, "Wrong source-gap work-order count", payload.sourceGapReadiness);
  assert(
    Array.isArray(payload.sourceGapReadiness?.blindSpotQuestionNumbers) &&
      payload.sourceGapReadiness.blindSpotQuestionNumbers.length === 2 &&
      payload.sourceGapReadiness.blindSpotQuestionNumbers.includes(43) &&
      payload.sourceGapReadiness.blindSpotQuestionNumbers.includes(100),
    "Wrong source-gap blind-spot question numbers",
    payload.sourceGapReadiness
  );
  assert(
    payload.sourceGapReadiness?.strongestCandidateTrackId === "polity-legal-ethics",
    "Wrong source-gap strongest track",
    payload.sourceGapReadiness
  );
  assert(/internal triage/i.test(payload.sourceGapReadiness?.proofPolicy || ""), "Source-gap proof policy should stay internal-triage safe", payload.sourceGapReadiness);

  assert(payload.proofFeed?.endpoint === expectedApi.proofFeed, "Wrong proof feed endpoint", payload.proofFeed);
  assert(payload.proofFeed?.releasedClaimCount === 0, "Proof feed should stay empty until approved", payload.proofFeed);
  assert(payload.proofFeed?.releaseMode === "empty-until-approved-proof-packets", "Wrong proof feed release mode", payload.proofFeed);

  assert(payload.releaseDecision?.endpoint === expectedApi.releaseDecision, "Wrong release-decision endpoint", payload.releaseDecision);
  assert(payload.releaseDecision?.status === "publish-safe-with-proof-locks", "Wrong release-decision status", payload.releaseDecision);
  assert(payload.releaseDecision?.summary?.effectiveCoveragePercent === 76, "Wrong release-decision coverage", payload.releaseDecision?.summary);
  assert(payload.releaseDecision?.summary?.proofLockedQuestionCount === 100, "Wrong release-decision proof lock count", payload.releaseDecision?.summary);
  assert(payload.releaseDecision?.summary?.apiEndpointCount === 10, "Wrong release-decision API count", payload.releaseDecision?.summary);
  assert(payload.releaseDecision?.gates?.length === 6, "Wrong release-decision gate count", payload.releaseDecision?.gates);

  assert(payload.courseAction?.endpoint === expectedApi.courseAction, "Wrong course-action endpoint", payload.courseAction);
  assert(payload.courseAction?.summary?.priorityCount === 8, "Wrong strategy priority count", payload.courseAction?.summary);
  assert(payload.courseAction?.summary?.taskCount === 34, "Wrong strategy task count", payload.courseAction?.summary);
  assert(payload.courseAction?.summary?.practiceBlueprintCount === 16, "Wrong practice blueprint count", payload.courseAction?.summary);
  assert(payload.courseAction?.priorityPreview?.length === 5, "Wrong strategy priority preview count", payload.courseAction?.priorityPreview);

  assertApiMap(payload.api);
  assertPublicSafe(serialized);

  console.log(
    JSON.stringify(
      {
        ok: true,
        route,
        version: payload.version,
        audit: payload.audit,
        sourceLead: payload.sourceLead,
        visualStory: payload.visualStory,
        api: payload.api,
        readiness: payload.readiness.summary,
        sourceArchive: payload.sourceArchive.scan,
        sourceGapReadiness: payload.sourceGapReadiness,
      },
      null,
      2
    )
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#main-website-manifest-contract`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const expectedRequirementIds = [
  "standalone-public-page",
  "main-site-safe-copy",
  "portal-ready-route",
  "final-pdf-analysis",
  "archive-scan",
  "what-we-built",
  "what-appeared",
  "surprise-elements",
  "question-patterns",
  "complete-mcq-highlight",
  "untapped-domains",
  "software-execution-path",
];

const expectedPhaseCounts = {
  Source: 7,
  Capsule: 6,
  MCQ: 7,
  Proof: 5,
  Release: 5,
  Planner: 4,
};

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload)}` : message);
  }
}

function verifyManifest(payload, headers) {
  const serialized = JSON.stringify(payload);
  const requirementIds = payload?.website?.requirements?.map((requirement) => requirement.id) || [];
  const phaseCounts = payload?.strategy?.phaseCounts || {};

  assert(headers["cache-control"]?.includes("no-store"), "Manifest should not be cached", headers);
  assert(payload.version === "upsc-prelims-2026-showcase-manifest-v1", "Unexpected manifest version", payload.version);
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Unexpected public route", payload.publicRoute);
  assert(payload.dashboardRoute === "/upsc/prelims-2026-showcase", "Unexpected dashboard route", payload.dashboardRoute);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Unexpected review command route", payload.reviewCommandRoute);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Unexpected strategy route", payload.strategyRoute);
  assert(payload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command", "Missing review-command API path", payload.api);
  assert(payload.api?.releaseDecision === "/api/upsc/prelims-2026/release-decision", "Missing release-decision API path", payload.api);
  assert(payload.api?.mainSiteHandoff === "/api/upsc/prelims-2026/main-site-handoff", "Missing main-site handoff API path", payload.api);
  assert(payload.api?.manifest === "/api/upsc/prelims-2026/showcase-manifest", "Missing manifest API path", payload.api);
  assert(payload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability", "Missing match-accountability API path", payload.api);
  assert(payload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger", "Missing question-ledger API path", payload.api);
  assert(payload.api?.proofFeed === "/api/upsc/prelims-2026/public-proof-feed", "Missing proof-feed API path", payload.api);
  assert(payload.api?.courseAction === "/api/upsc/prelims-2027/course-action", "Missing course-action API path", payload.api);
  assert(
    payload.api?.sourceArchiveSummary === "/api/upsc/prelims-2026/source-archive-summary",
    "Missing source-archive-summary API path",
    payload.api
  );
  assert(payload.api?.buildReadiness === "/api/upsc/prelims-2026/build-readiness", "Missing build-readiness API path", payload.api);

  assert(payload.audit?.corrected?.direct === 44, "Wrong corrected direct count", payload.audit);
  assert(payload.audit?.corrected?.partial === 30, "Wrong corrected partial count", payload.audit);
  assert(payload.audit?.corrected?.misses === 23, "Wrong corrected miss count", payload.audit);
  assert(payload.audit?.corrected?.dropped === 3, "Wrong corrected dropped count", payload.audit);
  assert(payload.audit?.corrected?.scorableQuestions === 97, "Wrong scorable denominator", payload.audit);
  assert(payload.audit?.corrected?.preparedQuestions === 74, "Wrong prepared count", payload.audit);
  assert(payload.audit?.corrected?.effectiveCoveragePercent === 76, "Wrong effective coverage", payload.audit);

  assert(payload.audit?.sourceLead?.directTextLeads === 37, "Wrong direct source-lead count", payload.audit);
  assert(payload.audit?.sourceLead?.conceptualLeads === 63, "Wrong conceptual source-lead count", payload.audit);
  assert(payload.audit?.sourceLead?.totalQuestions === 100, "Wrong source-lead total", payload.audit);

  assert(payload.questionLedger?.totalQuestions === 100, "Wrong question ledger total", payload.questionLedger);
  assert(payload.questionLedger?.completeQuestionCards === 100, "Wrong complete card count", payload.questionLedger);
  assert(payload.questionLedger?.optionSets === 100, "Wrong option-set count", payload.questionLedger);
  assert(payload.questionLedger?.statementCoverageRows === 275, "Wrong statement coverage row count", payload.questionLedger);
  assert(payload.questionLedger?.multiStatementQuestions === 75, "Wrong multi-statement count", payload.questionLedger);
  assert(payload.questionLedger?.directTextLeadCards === 37, "Wrong automated direct card count", payload.questionLedger);
  assert(payload.questionLedger?.conceptualLeadCards === 63, "Wrong automated conceptual card count", payload.questionLedger);
  assert(payload.questionLedger?.noIndexedLeadCards === 0, "Wrong no-indexed-lead card count", payload.questionLedger);
  assert(payload.questionLedger?.proofLocked === true, "Question ledger should be proof locked", payload.questionLedger);
  assert(
    payload.questionLedger?.publicAnchor === "/upsc-prelims-2026-showcase#question-ledger",
    "Wrong question ledger anchor",
    payload.questionLedger
  );

  assert(payload.website?.copyBlocks?.length === 4, "Expected 4 website copy blocks", payload.website);
  assert(payload.website?.integrationMap?.length === 6, "Expected 6 integration rows", payload.website);
  assert(
    payload.website.integrationMap.some(
      (row) => row.title === "Software execution path" && row.dashboardRoute === "/upsc/prelims-review-command"
    ),
    "Software integration row is not wired to Review Command",
    payload.website.integrationMap
  );
  assert(payload.website?.requirements?.length === 12, "Expected 12 requirements", payload.website);
  for (const id of expectedRequirementIds) {
    assert(requirementIds.includes(id), `Missing requirement id ${id}`, requirementIds);
  }

  assert(payload.strategy?.priorityCount === 8, "Wrong priority count", payload.strategy);
  assert(payload.strategy?.taskCount === 34, "Wrong strategy task count", payload.strategy);
  assert(payload.strategy?.practiceBlueprintCount === 16, "Wrong practice blueprint count", payload.strategy);
  assert(payload.strategy?.formatRuleCount === 6, "Wrong format rule count", payload.strategy);
  for (const [phase, expectedCount] of Object.entries(expectedPhaseCounts)) {
    assert(phaseCounts[phase] === expectedCount, `Wrong ${phase} phase count`, phaseCounts);
  }
  assert(payload.strategy?.tracks?.length === 8, "Wrong strategy track count", payload.strategy?.tracks);
  assert(
    payload.strategy.tracks.some((track) => track.id === "ir-multilateral" && track.publicStatus === "Needs source pack"),
    "IR source-pack track missing",
    payload.strategy.tracks
  );
  assert(
    payload.strategy.tracks.some((track) => track.id === "economy-maintenance" && track.publicStatus === "Public proof ready"),
    "Economy proof-ready track missing",
    payload.strategy.tracks
  );

  assert(/proof-locked/i.test(payload.proofPolicy || ""), "Proof policy should mention proof locking", payload.proofPolicy);
  assert(!/webinar/i.test(serialized), "Manifest still contains webinar wording");

  return {
    version: payload.version,
    audit: payload.audit,
    questionLedger: payload.questionLedger,
    websiteCounts: {
      copyBlocks: payload.website.copyBlocks.length,
      integrationRows: payload.website.integrationMap.length,
      requirements: payload.website.requirements.length,
    },
    strategyCounts: {
      priorities: payload.strategy.priorityCount,
      tasks: payload.strategy.taskCount,
      blueprints: payload.strategy.practiceBlueprintCount,
      formatRules: payload.strategy.formatRuleCount,
      phaseCounts,
      tracks: payload.strategy.tracks.length,
    },
  };
}

async function verifyPublicPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(publicRoute, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-manifest-contract").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="showcase-manifest-contract"]')?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 20000 }
  );
  await page.getByTestId("showcase-website-copy-kit").waitFor({ state: "visible", timeout: 20000 });
  await page.getByTestId("showcase-requirement-tracker").waitFor({ state: "visible", timeout: 20000 });

  const uiResult = await page.evaluate(() => {
    const manifestContract = document.querySelector('[data-testid="showcase-manifest-contract"]');
    const copyBlocks = Array.from(document.querySelectorAll('[data-testid="showcase-copy-block"]'));
    const integrationRows = Array.from(document.querySelectorAll('[data-testid="showcase-integration-row"]'));
    const requirementRows = Array.from(document.querySelectorAll('[data-testid="showcase-requirement-row"]'));
    const text = document.body.innerText;

    return {
      hasManifestContract: Boolean(manifestContract),
      manifestStatus: manifestContract?.getAttribute("data-api-status"),
      manifestVersion: manifestContract?.getAttribute("data-version"),
      manifestEffectiveCoverage: Number(manifestContract?.getAttribute("data-effective-coverage")),
      manifestCorrectedDirect: Number(manifestContract?.getAttribute("data-corrected-direct")),
      manifestCorrectedPartial: Number(manifestContract?.getAttribute("data-corrected-partial")),
      manifestCorrectedMisses: Number(manifestContract?.getAttribute("data-corrected-misses")),
      manifestCorrectedDropped: Number(manifestContract?.getAttribute("data-corrected-dropped")),
      manifestSourceDirect: Number(manifestContract?.getAttribute("data-source-direct")),
      manifestSourceConceptual: Number(manifestContract?.getAttribute("data-source-conceptual")),
      manifestQuestionCount: Number(manifestContract?.getAttribute("data-question-count")),
      manifestStatementRows: Number(manifestContract?.getAttribute("data-statement-coverage-rows")),
      manifestStrategyTasks: Number(manifestContract?.getAttribute("data-strategy-task-count")),
      phaseSource: Number(manifestContract?.getAttribute("data-phase-source")),
      phaseCapsule: Number(manifestContract?.getAttribute("data-phase-capsule")),
      phaseMcq: Number(manifestContract?.getAttribute("data-phase-mcq")),
      phaseProof: Number(manifestContract?.getAttribute("data-phase-proof")),
      phaseRelease: Number(manifestContract?.getAttribute("data-phase-release")),
      phasePlanner: Number(manifestContract?.getAttribute("data-phase-planner")),
      copyBlocks: copyBlocks.length,
      integrationRows: integrationRows.length,
      requirementRows: requirementRows.length,
      hasPublicRouteCopy: text.includes("/upsc-prelims-2026-showcase"),
      hasManifestSafeCopy: text.includes("Website copy blocks keep internal planning language out"),
      hasReviewCommandEndpoint: text.includes("/api/upsc/prelims-2026/review-command"),
      hasReleaseDecisionEndpoint: text.includes("/api/upsc/prelims-2026/release-decision"),
      hasMainSiteHandoffEndpoint: text.includes("/api/upsc/prelims-2026/main-site-handoff"),
      hasManifestEndpoint: text.includes("/api/upsc/prelims-2026/showcase-manifest"),
      hasMatchAccountabilityEndpoint: text.includes("/api/upsc/prelims-2026/match-accountability"),
      hasQuestionLedgerEndpoint: text.includes("/api/upsc/prelims-2026/question-ledger"),
      hasProofFeedEndpoint: text.includes("/api/upsc/prelims-2026/public-proof-feed"),
      hasCourseActionEndpoint: text.includes("/api/upsc/prelims-2027/course-action"),
      hasSourceArchiveSummaryEndpoint: text.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasBuildReadinessEndpoint: text.includes("/api/upsc/prelims-2026/build-readiness"),
      reviewCommandEndpoint:
        manifestContract?.getAttribute("data-review-command-endpoint"),
      releaseDecisionEndpoint:
        manifestContract?.getAttribute("data-release-decision-endpoint"),
      mainSiteHandoffEndpoint:
        manifestContract?.getAttribute("data-main-site-handoff-endpoint"),
      matchAccountabilityEndpoint:
        manifestContract?.getAttribute("data-match-accountability-endpoint"),
      sourceArchiveSummaryEndpoint:
        manifestContract?.getAttribute("data-source-archive-summary-endpoint"),
      buildReadinessEndpoint: manifestContract?.getAttribute("data-build-readiness-endpoint"),
      hasProofPolicy: text.includes("Keep question-level claims proof-locked"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });

  assert(uiResult.hasManifestContract, "Public page manifest contract did not render", uiResult);
  assert(uiResult.manifestStatus === "ready", "Public page manifest contract did not load", uiResult);
  assert(
    uiResult.manifestVersion === "upsc-prelims-2026-showcase-manifest-v1",
    "Public page manifest version is wrong",
    uiResult
  );
  assert(
    uiResult.manifestEffectiveCoverage === 76 &&
      uiResult.manifestCorrectedDirect === 44 &&
      uiResult.manifestCorrectedPartial === 30 &&
      uiResult.manifestCorrectedMisses === 23 &&
      uiResult.manifestCorrectedDropped === 3,
    "Public page corrected audit manifest counts are wrong",
    uiResult
  );
  assert(
    uiResult.manifestSourceDirect === 37 &&
      uiResult.manifestSourceConceptual === 63 &&
      uiResult.manifestQuestionCount === 100 &&
      uiResult.manifestStatementRows === 275 &&
      uiResult.manifestStrategyTasks === 34,
    "Public page manifest ledger counts are wrong",
    uiResult
  );
  assert(uiResult.copyBlocks === 4, "Public page copy kit drifted from manifest", uiResult);
  assert(uiResult.integrationRows === 6, "Public page integration map drifted from manifest", uiResult);
  assert(uiResult.requirementRows === 12, "Public page requirement tracker drifted from manifest", uiResult);
  assert(uiResult.hasPublicRouteCopy && uiResult.hasManifestSafeCopy, "Public page lost main-site handoff copy", uiResult);
  assert(
      uiResult.hasReleaseDecisionEndpoint &&
      uiResult.hasReviewCommandEndpoint &&
      uiResult.hasMainSiteHandoffEndpoint &&
      uiResult.hasManifestEndpoint &&
      uiResult.hasMatchAccountabilityEndpoint &&
      uiResult.hasQuestionLedgerEndpoint &&
      uiResult.hasProofFeedEndpoint,
    "Public page lost manifest endpoint copy",
    uiResult
  );
  assert(
    uiResult.reviewCommandEndpoint === "/api/upsc/prelims-2026/review-command",
    "Public page manifest contract lost review-command endpoint data attribute",
    uiResult
  );
  assert(
    uiResult.releaseDecisionEndpoint === "/api/upsc/prelims-2026/release-decision",
    "Public page manifest contract lost release-decision endpoint data attribute",
    uiResult
  );
  assert(
    uiResult.mainSiteHandoffEndpoint === "/api/upsc/prelims-2026/main-site-handoff",
    "Public page manifest contract lost main-site handoff endpoint data attribute",
    uiResult
  );
  assert(
    uiResult.matchAccountabilityEndpoint === "/api/upsc/prelims-2026/match-accountability",
    "Public page manifest contract lost match-accountability endpoint data attribute",
    uiResult
  );
  assert(uiResult.hasCourseActionEndpoint, "Public page lost course-action endpoint copy", uiResult);
  assert(uiResult.hasSourceArchiveSummaryEndpoint, "Public page lost source-archive-summary endpoint copy", uiResult);
  assert(uiResult.hasBuildReadinessEndpoint, "Public page lost build-readiness endpoint copy", uiResult);
  assert(
    uiResult.sourceArchiveSummaryEndpoint === "/api/upsc/prelims-2026/source-archive-summary",
    "Public page manifest contract lost source archive endpoint data attribute",
    uiResult
  );
  assert(
    uiResult.buildReadinessEndpoint === "/api/upsc/prelims-2026/build-readiness",
    "Public page manifest contract lost build-readiness endpoint data attribute",
    uiResult
  );
  assert(uiResult.hasProofPolicy, "Public page lost manifest proof policy", uiResult);
  assert(
    uiResult.phaseSource === 7 &&
      uiResult.phaseCapsule === 6 &&
      uiResult.phaseMcq === 7 &&
      uiResult.phaseProof === 5 &&
      uiResult.phaseRelease === 5 &&
      uiResult.phasePlanner === 4,
    "Public page manifest phase counts are wrong",
    uiResult
  );
  assert(!uiResult.mentionsWebinar, "Public page still contains webinar wording", uiResult);
  assert(!uiResult.hasErrorOverlay, "Framework error overlay is visible", uiResult);
  assert(!uiResult.horizontalOverflow, "Public page has horizontal overflow", uiResult);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-manifest-contract").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, "upsc-showcase-manifest-api-public-page.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...uiResult, artifact: screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.request.get(manifestRoute);
    const headers = response.headers();
    const payload = await response.json();
    await context.close();

    assert(response.status() === 200, `Manifest API returned ${response.status()}`, payload);

    const manifest = verifyManifest(payload, headers);
    const publicPage = await verifyPublicPage(browser);

    console.log(
      JSON.stringify(
        {
          ok: true,
          manifestRoute,
          publicRoute,
          manifest,
          publicPage,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const readinessRoute = `${baseUrl}/api/upsc/prelims-2026/build-readiness`;
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#build-readiness`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const expectedRequirementIds = [
  "standalone-page",
  "main-site-safe-copy",
  "final-pdf-corrected-audit",
  "complete-mcq-ledger",
  "matched-portion-highlights",
  "source-archive-summary",
  "what-built-vs-appeared",
  "surprise-trend-introspection",
  "untapped-domain-actions",
  "software-execution-path",
  "public-proof-feed",
  "main-website-api-contract",
];

const expectedGateIds = [
  "public-audit-number",
  "question-claim-proof-lock",
  "raw-archive-boundary",
  "portal-execution-owner",
];

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

function verifyReadinessPayload(payload, headers) {
  const serialized = JSON.stringify(payload);
  const requirementIds = payload.requirements?.map((requirement) => requirement.id) || [];
  const gateIds = payload.gates?.map((gate) => gate.id) || [];

  assert(headers["cache-control"]?.includes("no-store"), "Build-readiness API should not be cached", headers);
  assert(payload.version === "upsc-prelims-2026-build-readiness-v1", "Unexpected build-readiness version", payload.version);
  assert(payload.status === "ready-for-main-site-integration-with-proof-locks", "Wrong build-readiness status", payload.status);
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Wrong public route", payload.publicRoute);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong review command route", payload.reviewCommandRoute);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong strategy route", payload.strategyRoute);
  assert(payload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command", "Missing review command API path", payload.api);
  assert(payload.api?.releaseDecision === "/api/upsc/prelims-2026/release-decision", "Missing release-decision API path", payload.api);
  assert(payload.api?.mainSiteHandoff === "/api/upsc/prelims-2026/main-site-handoff", "Missing main-site handoff API path", payload.api);
  assert(payload.api?.buildReadiness === "/api/upsc/prelims-2026/build-readiness", "Missing self API path", payload.api);
  assert(payload.api?.manifest === "/api/upsc/prelims-2026/showcase-manifest", "Missing manifest API path", payload.api);
  assert(payload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability", "Missing match-accountability API path", payload.api);
  assert(payload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger", "Missing question ledger API path", payload.api);
  assert(payload.api?.proofFeed === "/api/upsc/prelims-2026/public-proof-feed", "Missing proof feed API path", payload.api);
  assert(payload.api?.courseAction === "/api/upsc/prelims-2027/course-action", "Missing course action API path", payload.api);
  assert(payload.api?.sourceArchiveSummary === "/api/upsc/prelims-2026/source-archive-summary", "Missing source summary API path", payload.api);

  assert(payload.summary?.requirementCount === 12, "Wrong readiness requirement count", payload.summary);
  assert(payload.summary?.completeCount === 9, "Wrong readiness complete count", payload.summary);
  assert(payload.summary?.proofLockedCount === 2, "Wrong readiness proof-locked count", payload.summary);
  assert(payload.summary?.portalOwnedCount === 1, "Wrong readiness portal-owned count", payload.summary);
  assert(payload.summary?.websiteCopyBlockCount === 4, "Wrong copy block count", payload.summary);
  assert(payload.summary?.integrationRowCount === 6, "Wrong integration row count", payload.summary);
  assert(payload.summary?.originalTrackerCount === 12, "Wrong original tracker count", payload.summary);
  assert(payload.summary?.questionCount === 100, "Wrong question count", payload.summary);
  assert(payload.summary?.completeQuestionCards === 100, "Wrong complete question card count", payload.summary);
  assert(payload.summary?.optionSetCount === 100, "Wrong option set count", payload.summary);
  assert(payload.summary?.statementCoverageRows === 275, "Wrong statement coverage row count", payload.summary);
  assert(payload.summary?.priorityCount === 8, "Wrong priority count", payload.summary);
  assert(payload.summary?.strategyTaskCount === 34, "Wrong strategy task count", payload.summary);
  assert(payload.summary?.practiceBlueprintCount === 16, "Wrong practice blueprint count", payload.summary);
  assert(payload.summary?.formatRuleCount === 6, "Wrong format rule count", payload.summary);
  assert(payload.summary?.apiEndpointCount === 10, "Wrong API endpoint count", payload.summary);
  assert(payload.summary?.verifierCount >= 10, "Verifier count is too low", payload.summary);

  assert(Array.isArray(payload.requirements) && payload.requirements.length === 12, "Readiness requirements missing", payload.requirements);
  assert(Array.isArray(payload.gates) && payload.gates.length === 4, "Readiness gates missing", payload.gates);
  for (const id of expectedRequirementIds) {
    assert(requirementIds.includes(id), `Missing readiness requirement ${id}`, requirementIds);
  }
  for (const id of expectedGateIds) {
    assert(gateIds.includes(id), `Missing readiness gate ${id}`, gateIds);
  }
  assert(payload.gates.every((gate) => gate.status === "Pass"), "Every readiness gate should pass", payload.gates);
  assert(
    payload.requirements.some(
      (requirement) =>
        requirement.id === "source-archive-summary" &&
        requirement.apiEvidence === "/api/upsc/prelims-2026/source-archive-summary" &&
        requirement.verifier === "scratch/verify-upsc-source-archive-summary-api.cjs"
    ),
    "Source archive summary requirement is not wired to the new API/verifier",
    payload.requirements
  );
  assert(
    payload.requirements.some(
      (requirement) =>
        requirement.id === "surprise-trend-introspection" &&
        requirement.publicAnchor === "/upsc-prelims-2026-showcase#surprise-action-matrix" &&
        requirement.verifier === "scratch/verify-upsc-surprise-action-matrix.cjs"
    ),
    "Surprise trend requirement is not wired to the public surprise/action matrix",
    payload.requirements
  );
  assert(
    payload.requirements.some(
      (requirement) =>
        requirement.id === "untapped-domain-actions" &&
        requirement.publicAnchor === "/upsc-prelims-2026-showcase#surprise-action-matrix" &&
        requirement.portalOwner === "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board"
    ),
    "Untapped domain requirement is not wired to the public surprise/action matrix and reallocation board",
    payload.requirements
  );
  assert(
    payload.requirements.some(
      (requirement) =>
        requirement.id === "main-website-api-contract" &&
        requirement.portalOwner === "/upsc/prelims-2027-strategy#prelims-2026-main-website-manifest-contract" &&
        requirement.apiEvidence === "/api/upsc/prelims-2026/build-readiness" &&
        requirement.verifier === "scratch/verify-upsc-build-readiness-api.cjs"
    ),
    "Main website API contract requirement is not self-auditing",
    payload.requirements
  );
  assert(
    payload.requirements.some(
      (requirement) =>
        requirement.id === "software-execution-path" &&
        requirement.portalOwner === "/upsc/prelims-review-command" &&
        requirement.verifier === "scratch/verify-upsc-prelims-review-command.cjs"
    ),
    "Software execution path requirement is not wired to the Review Command",
    payload.requirements
  );
  assert(/proof-locked/i.test(payload.proofPolicy || ""), "Proof policy should mention proof locks", payload.proofPolicy);
  assert(!/webinar/i.test(serialized), "Build-readiness payload contains webinar wording");
  assert(!serialized.includes("D:\\"), "Build-readiness payload leaked local drive path");

  return {
    version: payload.version,
    status: payload.status,
    summary: payload.summary,
    gates: gateIds,
    requirements: requirementIds,
  };
}

async function verifyPublicPreview(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(publicRoute, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-build-readiness-api-preview").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="showcase-build-readiness-api-preview"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 30000 }
  );

  const result = await page.evaluate(({ expectedRequirementIds, expectedGateIds }) => {
    const section = document.querySelector('[data-testid="showcase-build-readiness-api-preview"]');
    const requirements = Array.from(document.querySelectorAll('[data-testid="showcase-build-readiness-requirement"]'));
    const gates = Array.from(document.querySelectorAll('[data-testid="showcase-build-readiness-gate"]'));
    const requirementIds = requirements.map((row) => row.getAttribute("data-requirement-id"));
    const gateIds = gates.map((row) => row.getAttribute("data-gate-id"));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      buildStatus: section?.getAttribute("data-build-status"),
      requirementCount: Number(section?.getAttribute("data-requirement-count")),
      completeCount: Number(section?.getAttribute("data-complete-count")),
      proofLockedCount: Number(section?.getAttribute("data-proof-locked-count")),
      portalOwnedCount: Number(section?.getAttribute("data-portal-owned-count")),
      questionCount: Number(section?.getAttribute("data-question-count")),
      completeQuestionCards: Number(section?.getAttribute("data-complete-question-cards")),
      optionSetCount: Number(section?.getAttribute("data-option-set-count")),
      statementCoverageRows: Number(section?.getAttribute("data-statement-coverage-rows")),
      strategyTaskCount: Number(section?.getAttribute("data-strategy-task-count")),
      practiceBlueprintCount: Number(section?.getAttribute("data-practice-blueprint-count")),
      formatRuleCount: Number(section?.getAttribute("data-format-rule-count")),
      apiEndpointCount: Number(section?.getAttribute("data-api-endpoint-count")),
      verifierCount: Number(section?.getAttribute("data-verifier-count")),
      gateCount: Number(section?.getAttribute("data-gate-count")),
      renderedRequirements: requirements.length,
      renderedGates: gates.length,
      requirementIds,
      gateIds,
      missingRequirementIds: expectedRequirementIds.filter((id) => !requirementIds.includes(id)),
      missingGateIds: expectedGateIds.filter((id) => !gateIds.includes(id)),
      statuses: requirements.map((row) => row.getAttribute("data-status")),
      portalOwners: requirements.map((row) => row.getAttribute("data-portal-owner")),
      apiEvidence: requirements.map((row) => row.getAttribute("data-api-evidence")),
      verifiers: requirements.map((row) => row.getAttribute("data-verifier")),
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2026/build-readiness"),
      hasReviewCommandApi: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasReleaseDecisionApi: sectionText.includes("/api/upsc/prelims-2026/release-decision"),
      hasMainSiteHandoffApi: sectionText.includes("/api/upsc/prelims-2026/main-site-handoff"),
      hasMatchAccountabilityApi: sectionText.includes("/api/upsc/prelims-2026/match-accountability"),
      hasQuestionLedgerApi: sectionText.includes("/api/upsc/prelims-2026/question-ledger"),
      hasSourceArchiveSummaryApi: sectionText.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasCourseActionApi: sectionText.includes("/api/upsc/prelims-2027/course-action"),
      hasManifestPortalOwner: sectionText.includes("/upsc/prelims-2027-strategy#prelims-2026-main-website-manifest-contract"),
      hasReviewCommandOwner: sectionText.includes("/upsc/prelims-review-command"),
      hasProofPolicy: /proof-locked/i.test(sectionText),
      hasVerifierText: sectionText.includes("scratch/verify-upsc-build-readiness-api.cjs"),
      hasGateCopy:
        sectionText.includes("Public audit number") &&
        sectionText.includes("Question claim proof lock") &&
        sectionText.includes("Raw archive boundary") &&
        sectionText.includes("Portal execution owner"),
      leakedLocalPath: sectionText.includes("D:\\"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
    };
  }, { expectedRequirementIds, expectedGateIds });

  assert(result.hasSection, "Build-readiness preview did not render", result);
  assert(result.apiStatus === "ready", "Build-readiness preview did not load", result);
  assert(result.version === "upsc-prelims-2026-build-readiness-v1", "Build-readiness preview version drifted", result);
  assert(result.buildStatus === "ready-for-main-site-integration-with-proof-locks", "Build status drifted", result);
  assert(result.requirementCount === 12 && result.renderedRequirements === 12, "Build-readiness requirement rows drifted", result);
  assert(result.completeCount === 9 && result.proofLockedCount === 2 && result.portalOwnedCount === 1, "Readiness status counts drifted", result);
  assert(result.questionCount === 100 && result.completeQuestionCards === 100 && result.optionSetCount === 100, "Question evidence counts drifted", result);
  assert(result.statementCoverageRows === 275, "Statement coverage row count drifted", result);
  assert(result.strategyTaskCount === 34 && result.practiceBlueprintCount === 16 && result.formatRuleCount === 6, "Strategy counts drifted", result);
  assert(result.apiEndpointCount === 10 && result.verifierCount >= 10, "API/verifier counts drifted", result);
  assert(result.gateCount === 4 && result.renderedGates === 4, "Build-readiness gates drifted", result);
  assert(result.missingRequirementIds.length === 0, "Build-readiness missing requirements", result);
  assert(result.missingGateIds.length === 0, "Build-readiness missing gates", result);
  assert(result.statuses.includes("Proof locked") && result.statuses.includes("Portal owned"), "Readiness statuses are incomplete", result);
  assert(
    result.portalOwners.includes("/upsc/prelims-2027-strategy#prelims-2026-main-website-manifest-contract"),
    "Readiness portal owner routes are incomplete",
    result
  );
  assert(result.portalOwners.includes("/upsc/prelims-review-command"), "Review Command portal owner is missing", result);
  assert(
    result.hasEndpointText &&
      result.hasReviewCommandApi &&
      result.hasReleaseDecisionApi &&
      result.hasMainSiteHandoffApi &&
      result.hasMatchAccountabilityApi &&
      result.hasQuestionLedgerApi &&
      result.hasSourceArchiveSummaryApi &&
      result.hasCourseActionApi &&
      result.hasManifestPortalOwner &&
      result.hasReviewCommandOwner &&
      result.hasVerifierText,
    "Build-readiness endpoint/API/verifier copy incomplete",
    result
  );
  assert(result.hasProofPolicy && result.hasGateCopy, "Build-readiness proof/gate copy incomplete", result);
  assert(!result.leakedLocalPath, "Build-readiness preview leaked local drive path", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.sectionLength > 3000, "Build-readiness preview appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-build-readiness-api-preview").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [readinessResponse, manifestResponse] = await Promise.all([
      page.request.get(readinessRoute),
      page.request.get(manifestRoute),
    ]);
    const readinessPayload = await readinessResponse.json();
    const manifestPayload = await manifestResponse.json();
    await context.close();

    assert(readinessResponse.status() === 200, `Build-readiness API returned ${readinessResponse.status()}`, readinessPayload);
    assert(manifestResponse.status() === 200, `Manifest API returned ${manifestResponse.status()}`, manifestPayload);
    assert(
      manifestPayload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command" &&
      manifestPayload.api?.releaseDecision === "/api/upsc/prelims-2026/release-decision" &&
      manifestPayload.api?.mainSiteHandoff === "/api/upsc/prelims-2026/main-site-handoff" &&
      manifestPayload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability" &&
      manifestPayload.api?.buildReadiness === "/api/upsc/prelims-2026/build-readiness",
      "Manifest does not point to build-readiness API",
      manifestPayload.api
    );

    const readiness = verifyReadinessPayload(readinessPayload, readinessResponse.headers());
    const desktop = await verifyPublicPreview(browser, { width: 1440, height: 1100 }, "upsc-build-readiness-api-preview.png");
    const mobile = await verifyPublicPreview(browser, { width: 390, height: 900 }, "upsc-build-readiness-api-preview-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          readinessRoute,
          manifestRoute,
          publicRoute,
          readiness,
          manifestApi: manifestPayload.api,
          desktop,
          mobile,
          artifacts: [desktop.screenshotPath, mobile.screenshotPath],
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

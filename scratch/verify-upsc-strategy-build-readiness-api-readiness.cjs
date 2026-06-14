const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2026-build-readiness-api-readiness`;
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

const profile = {
  level: "advanced",
  preparationStage: "multiple-attempts",
  studyWindow: "120",
  learningStyle: "practice-first",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "two-plus-attempts",
  learningPattern: "revision-first",
  mindState: "calm",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

async function seedLocalState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_build_readiness");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem(
      "sarit-upsc-prelims-2027-strategy-v1",
      JSON.stringify({
        statuses: {},
        completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
        completedTasks: [],
        queuedBlueprints: [],
      })
    );
  }, { profile });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  await seedLocalState(context);

  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("prelims-2026-build-readiness-api-readiness").waitFor({
    state: "visible",
    timeout: 30000,
  });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="prelims-2026-build-readiness-api-readiness"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 30000 }
  );

  const section = page.getByTestId("prelims-2026-build-readiness-api-readiness");
  await section.getByRole("button", { name: "Copy readiness endpoint" }).click();
  await section.getByRole("button", { name: "Endpoint copied" }).waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(({ expectedRequirementIds, expectedGateIds }) => {
    const section = document.querySelector('[data-testid="prelims-2026-build-readiness-api-readiness"]');
    const requirements = Array.from(document.querySelectorAll('[data-testid="prelims-2026-build-readiness-requirement"]'));
    const gates = Array.from(document.querySelectorAll('[data-testid="prelims-2026-build-readiness-gate"]'));
    const requirementIds = requirements.map((row) => row.getAttribute("data-requirement-id"));
    const gateIds = gates.map((row) => row.getAttribute("data-gate-id"));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

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
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      strategyTaskCount: Number(section?.getAttribute("data-strategy-task-count")),
      practiceBlueprintCount: Number(section?.getAttribute("data-practice-blueprint-count")),
      formatRuleCount: Number(section?.getAttribute("data-format-rule-count")),
      apiEndpointCount: Number(section?.getAttribute("data-api-endpoint-count")),
      verifierCount: Number(section?.getAttribute("data-verifier-count")),
      gateCount: Number(section?.getAttribute("data-gate-count")),
      renderedRequirementCount: Number(section?.getAttribute("data-rendered-requirement-count")),
      renderedGateCount: Number(section?.getAttribute("data-rendered-gate-count")),
      requirementIds,
      gateIds,
      missingRequirementIds: expectedRequirementIds.filter((id) => !requirementIds.includes(id)),
      missingGateIds: expectedGateIds.filter((id) => !gateIds.includes(id)),
      statuses: requirements.map((row) => row.getAttribute("data-status")),
      publicAnchors: requirements.map((row) => row.getAttribute("data-public-anchor")),
      portalOwners: requirements.map((row) => row.getAttribute("data-portal-owner")),
      apiEvidence: requirements.map((row) => row.getAttribute("data-api-evidence")),
      verifiers: requirements.map((row) => row.getAttribute("data-verifier")),
      hasTitle: sectionText.includes("Audit the final public-page handoff from inside the software"),
      hasReviewCommandEndpointText: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasReleaseDecisionEndpointText: sectionText.includes("/api/upsc/prelims-2026/release-decision"),
      hasMainSiteHandoffEndpointText: sectionText.includes("/api/upsc/prelims-2026/main-site-handoff"),
      hasBuildReadinessEndpointText: sectionText.includes("/api/upsc/prelims-2026/build-readiness"),
      hasManifestEndpointText: sectionText.includes("/api/upsc/prelims-2026/showcase-manifest"),
      hasMatchAccountabilityEndpointText: sectionText.includes("/api/upsc/prelims-2026/match-accountability"),
      hasQuestionLedgerEndpointText: sectionText.includes("/api/upsc/prelims-2026/question-ledger"),
      hasProofFeedEndpointText: sectionText.includes("/api/upsc/prelims-2026/public-proof-feed"),
      hasCourseActionEndpointText: sectionText.includes("/api/upsc/prelims-2027/course-action"),
      hasSourceSummaryEndpointText: sectionText.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasPublicReadinessLink: links.includes("/upsc-prelims-2026-showcase#build-readiness"),
      hasManifestContractLink: links.includes("#prelims-2026-main-website-manifest-contract"),
      hasProofPolicy: /proof-locked/i.test(sectionText) && /teacher validation/i.test(sectionText),
      hasGateCopy:
        sectionText.includes("Public audit number") &&
        sectionText.includes("Question claim proof lock") &&
        sectionText.includes("Raw archive boundary") &&
        sectionText.includes("Portal execution owner"),
      hasVerifierCopy:
        sectionText.includes("scratch/verify-upsc-build-readiness-api.cjs") &&
        sectionText.includes("scratch/verify-upsc-question-ledger-api.cjs") &&
        sectionText.includes("scratch/verify-upsc-source-archive-summary-api.cjs"),
      leakedLocalPath: sectionText.includes("D:\\") || sectionText.includes("D:\\\\"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
    };
  }, { expectedRequirementIds, expectedGateIds });

  assert(result.hasSection, "Strategy build-readiness section did not render", result);
  assert(result.apiStatus === "ready", "Strategy build-readiness section did not load", result);
  assert(result.version === "upsc-prelims-2026-build-readiness-v1", "Build-readiness version drifted", result);
  assert(result.buildStatus === "ready-for-main-site-integration-with-proof-locks", "Build-readiness status drifted", result);
  assert(result.requirementCount === 12 && result.renderedRequirementCount === 12, "Requirement rows drifted", result);
  assert(result.completeCount === 9 && result.proofLockedCount === 2 && result.portalOwnedCount === 1, "Requirement status counts drifted", result);
  assert(result.gateCount === 4 && result.renderedGateCount === 4, "Gate rows drifted", result);
  assert(result.questionCount === 100 && result.completeQuestionCards === 100 && result.optionSetCount === 100, "Question evidence counts drifted", result);
  assert(result.statementCoverageRows === 275, "Statement row count drifted", result);
  assert(result.priorityCount === 8 && result.strategyTaskCount === 34, "Strategy priority/task counts drifted", result);
  assert(result.practiceBlueprintCount === 16 && result.formatRuleCount === 6, "Practice/format counts drifted", result);
  assert(result.apiEndpointCount === 10 && result.verifierCount >= 10, "API/verifier counts drifted", result);
  assert(result.missingRequirementIds.length === 0, "Build-readiness requirements missing", result);
  assert(result.missingGateIds.length === 0, "Build-readiness gates missing", result);
  assert(result.statuses.includes("Proof locked") && result.statuses.includes("Portal owned"), "Requirement statuses incomplete", result);
  assert(
    result.publicAnchors.includes("/upsc-prelims-2026-showcase#source-archive-summary") &&
      result.portalOwners.includes("/upsc/prelims-2027-strategy#prelims-2026-source-archive-summary-api-readiness"),
    "Source archive summary ownership is incomplete",
    result
  );
  assert(
    result.apiEvidence.includes("/api/upsc/prelims-2026/build-readiness") &&
      result.apiEvidence.includes("/api/upsc/prelims-2027/course-action") &&
      result.apiEvidence.includes("/api/upsc/prelims-2026/question-ledger"),
    "API evidence rows incomplete",
    result
  );
  assert(
    result.hasTitle &&
      result.hasReviewCommandEndpointText &&
      result.hasReleaseDecisionEndpointText &&
      result.hasMainSiteHandoffEndpointText &&
      result.hasBuildReadinessEndpointText &&
      result.hasManifestEndpointText &&
      result.hasMatchAccountabilityEndpointText &&
      result.hasQuestionLedgerEndpointText &&
      result.hasProofFeedEndpointText &&
      result.hasCourseActionEndpointText &&
      result.hasSourceSummaryEndpointText,
    "Endpoint copy incomplete",
    result
  );
  assert(result.hasPublicReadinessLink && result.hasManifestContractLink, "Readiness links incomplete", result);
  assert(result.hasProofPolicy && result.hasGateCopy && result.hasVerifierCopy, "Readiness proof/gate/verifier copy incomplete", result);
  assert(!result.leakedLocalPath, "Strategy build-readiness section leaked local drive path", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.sectionLength > 4500, "Strategy build-readiness section appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await section.scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(
      browser,
      { width: 1440, height: 1100 },
      "upsc-strategy-build-readiness-api-readiness.png"
    );
    const mobile = await verifyViewport(
      browser,
      { width: 390, height: 900 },
      "upsc-strategy-build-readiness-api-readiness-mobile.png"
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
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

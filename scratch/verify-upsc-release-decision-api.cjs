const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const releaseDecisionRoute = `${baseUrl}/api/upsc/prelims-2026/release-decision`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#release-decision`;
const strategyRoute = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2027-publish-gate`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

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

const expectedGateIds = [
  "corrected-audit-public-safe",
  "complete-mcq-proof-lock",
  "public-proof-feed-release",
  "source-archive-boundary",
  "course-action-software-path",
  "main-site-api-contract",
];

const forbiddenTokens = [
  "D:\\",
  "C:\\",
  "relativePath",
  "sampleFiles",
  "Paid Students",
  "Mians ready Dec 2025",
  "Morning Batch",
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
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 3000)}` : message);
  }
}

function assertPublicSafe(serialized, label) {
  for (const token of forbiddenTokens) {
    assert(!serialized.includes(token), `${label} leaked forbidden token ${token}`);
  }
  assert(!/webinar/i.test(serialized), `${label} contains webinar wording`);
}

function assertApiMap(api, label) {
  for (const [key, endpoint] of Object.entries(expectedApi)) {
    assert(api?.[key] === endpoint, `${label} API map missing ${key}`, api);
  }
}

function verifyReleaseDecisionPayload(payload, headers) {
  const serialized = JSON.stringify(payload);
  const gateIds = payload.gates?.map((gate) => gate.id) || [];
  const gateStatuses = payload.gates?.map((gate) => gate.status) || [];

  assert(headers["cache-control"]?.includes("no-store"), "Release-decision API should not be cached", headers);
  assert(payload.version === "upsc-prelims-2026-release-decision-v1", "Unexpected release-decision version", payload.version);
  assert(payload.status === "publish-safe-with-proof-locks", "Unexpected release-decision status", payload.status);
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Wrong public route", payload.publicRoute);
  assert(payload.publicAnchor === "/upsc-prelims-2026-showcase#release-decision", "Wrong public anchor", payload.publicAnchor);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong review command route", payload.reviewCommandRoute);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong strategy route", payload.strategyRoute);
  assert(
    payload.strategyAnchor === "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
    "Wrong strategy anchor",
    payload.strategyAnchor
  );
  assert(/proof-lock/i.test(payload.proofPolicy || ""), "Proof policy should explain proof locks", payload.proofPolicy);

  assert(payload.decision?.headline === "Ready for main-site integration with proof locks.", "Wrong decision headline", payload.decision);
  assert(payload.decision?.publicStatus === "Safe with lock", "Wrong public decision status", payload.decision);
  assert(payload.decision?.allowedNow?.length === 4, "Wrong allowed-now count", payload.decision?.allowedNow);
  assert(payload.decision?.proofLocked?.length === 3, "Wrong proof-locked count", payload.decision?.proofLocked);
  assert(payload.decision?.internalOnly?.length === 3, "Wrong internal-only count", payload.decision?.internalOnly);
  assert(
    payload.decision.allowedNow.some((row) => /corrected headline/i.test(row)) &&
      payload.decision.proofLocked.some((row) => /question-wise public claims/i.test(row)) &&
      payload.decision.internalOnly.some((row) => /raw D-drive paths/i.test(row)),
    "Release-decision lists lost their publish boundaries",
    payload.decision
  );

  assert(payload.summary?.effectiveCoveragePercent === 76, "Wrong coverage percent", payload.summary);
  assert(payload.summary?.preparedQuestions === 74, "Wrong prepared count", payload.summary);
  assert(payload.summary?.scorableQuestions === 97, "Wrong scorable count", payload.summary);
  assert(payload.summary?.correctedDirect === 44, "Wrong direct count", payload.summary);
  assert(payload.summary?.correctedPartial === 30, "Wrong partial count", payload.summary);
  assert(payload.summary?.correctedMisses === 23, "Wrong miss count", payload.summary);
  assert(payload.summary?.correctedDropped === 3, "Wrong dropped count", payload.summary);
  assert(payload.summary?.completeQuestionCards === 100, "Wrong complete-card count", payload.summary);
  assert(payload.summary?.multiStatementQuestionCount === 75, "Wrong multi-statement question count", payload.summary);
  assert(payload.summary?.threePlusStatementCount === 67, "Wrong 3+ statement question count", payload.summary);
  assert(payload.summary?.twoStatementCount === 8, "Wrong 2-statement question count", payload.summary);
  assert(payload.summary?.noExplicitListQuestionCount === 25, "Wrong no-explicit-list question count", payload.summary);
  assert(payload.summary?.proofLockedQuestionCount === 100, "Wrong proof-lock question count", payload.summary);
  assert(payload.summary?.releasedClaimCount === 0, "Proof feed should stay empty until approved packets publish", payload.summary);
  assert(payload.summary?.sourceArchiveFileCount >= 1000, "Source archive file count is too low", payload.summary);
  assert(payload.summary?.sourceArchivePdfCount >= 1000, "Source archive PDF count is too low", payload.summary);
  assert(payload.summary?.sourceArchiveTrackCount === 8, "Wrong source archive track count", payload.summary);
  assert(payload.summary?.sourceCandidateQuestionCount === 98, "Wrong archive candidate question count", payload.summary);
  assert(payload.summary?.sourceGapBlindSpotCount === 2, "Wrong source-gap blind-spot count", payload.summary);
  assert(payload.summary?.sourceGapWorkOrdersRequired === 2, "Wrong source-gap work-order count", payload.summary);
  assert(payload.summary?.strategyPriorityCount === 8, "Wrong strategy priority count", payload.summary);
  assert(payload.summary?.strategyTaskCount === 34, "Wrong strategy task count", payload.summary);
  assert(payload.summary?.practiceBlueprintCount === 16, "Wrong practice blueprint count", payload.summary);
  assert(payload.summary?.apiEndpointCount === 10, "Wrong API endpoint count", payload.summary);

  assert(payload.visualStory?.publicAnchor === "/upsc-prelims-2026-showcase#question-logic", "Wrong visual story anchor", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.totalQuestions === 100, "Wrong visual story question total", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.threePlusStatements === 67, "Wrong visual story 3+ statement count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.twoStatements === 8, "Wrong visual story 2-statement count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.noExplicitList === 25, "Wrong visual story no-explicit-list count", payload.visualStory);
  assert(payload.visualStory?.questionFormat?.multiStatementQuestions === 75, "Wrong visual story multi-statement count", payload.visualStory);
  assert(/75\/100/.test(payload.visualStory?.statementDominanceLine || ""), "Visual story should include 75/100 dominance line", payload.visualStory);

  assert(payload.sourceGapReadiness?.endpoint === "/api/upsc/source-archive", "Wrong source-gap readiness endpoint", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.sourceStatus === "ready", "Source-gap readiness should be ready", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.sourceConnected === true, "Source-gap readiness should connect to archive", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.totalQuestions === 100, "Wrong source-gap question total", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.candidateQuestions === 98, "Wrong source-gap candidate count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.needsProofWithCandidates === 98, "Wrong source-gap needs-proof count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.blindSpotQuestions === 2, "Wrong source-gap blind-spot count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.needsProofBlindSpots === 2, "Wrong source-gap needs-proof blind-spot count", payload.sourceGapReadiness);
  assert(payload.sourceGapReadiness?.buildGapBlindSpots === 0, "Wrong source-gap build-gap blind-spot count", payload.sourceGapReadiness);
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

  assert(Array.isArray(payload.gates) && payload.gates.length === 6, "Wrong release gate count", payload.gates);
  for (const id of expectedGateIds) {
    assert(gateIds.includes(id), `Missing release gate ${id}`, gateIds);
  }
  assert(gateStatuses.includes("Public safe"), "Public-safe gate status missing", gateStatuses);
  assert(gateStatuses.includes("Proof locked"), "Proof-locked gate status missing", gateStatuses);
  assert(gateStatuses.includes("Waiting for approved packets"), "Proof-feed waiting status missing", gateStatuses);
  assert(gateStatuses.includes("Ready with locks"), "Ready-with-locks gate status missing", gateStatuses);
  assert(
    payload.gates.some(
      (gate) => gate.id === "source-archive-boundary" && gate.evidence.includes("98 archive-candidate questions") && gate.evidence.includes("2 source-gap work orders")
    ),
    "Source archive gate should include archive candidate and source-gap readiness",
    payload.gates
  );
  assert(
    payload.gates.some(
      (gate) => gate.id === "course-action-software-path" && gate.softwareOwner === "/upsc/prelims-review-command"
    ) &&
      payload.gates.some(
        (gate) => gate.id === "main-site-api-contract" && gate.softwareOwner === "/upsc/prelims-review-command"
      ),
    "Release decision gates should hand software/API ownership to Review Command",
    payload.gates
  );
  assert(
    payload.gates.every(
      (gate) =>
        typeof gate.title === "string" &&
        typeof gate.metric === "string" &&
        typeof gate.evidence === "string" &&
        typeof gate.publicAction === "string" &&
        gate.softwareOwner?.startsWith("/")
    ),
    "Release gates are incomplete",
    payload.gates
  );

  assertApiMap(payload.api, "Release-decision");
  assertPublicSafe(serialized, "Release-decision API");

  return {
    version: payload.version,
    status: payload.status,
    summary: payload.summary,
    gateIds,
    gateStatuses,
  };
}

async function seedStrategyState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_release_decision");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(profile));
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

async function verifyPublicPage(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(publicRoute, { waitUntil: "networkidle", timeout: 90000 });
  await page.getByTestId("showcase-release-decision-api-preview").waitFor({ state: "visible", timeout: 70000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="showcase-release-decision-api-preview"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 70000 }
  );

  const result = await page.evaluate((expectedGateIds) => {
    const section = document.querySelector('[data-testid="showcase-release-decision-api-preview"]');
    const gates = Array.from(document.querySelectorAll('[data-testid="showcase-release-decision-gate"]'));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const gateIds = gates.map((gate) => gate.getAttribute("data-gate-id"));
    const gateStatuses = gates.map((gate) => gate.getAttribute("data-gate-status"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      releaseStatus: section?.getAttribute("data-release-status"),
      effectiveCoverage: Number(section?.getAttribute("data-effective-coverage")),
      proofLockedQuestionCount: Number(section?.getAttribute("data-proof-locked-question-count")),
      releasedClaimCount: Number(section?.getAttribute("data-released-claim-count")),
      sourceArchiveFileCount: Number(section?.getAttribute("data-source-archive-file-count")),
      strategyTaskCount: Number(section?.getAttribute("data-strategy-task-count")),
      apiEndpointCount: Number(section?.getAttribute("data-api-endpoint-count")),
      gateCount: Number(section?.getAttribute("data-gate-count")),
      renderedGateCount: gates.length,
      gateIds,
      gateStatuses,
      missingGateIds: expectedGateIds.filter((id) => !gateIds.includes(id)),
      hasEndpoint: sectionText.includes("/api/upsc/prelims-2026/release-decision"),
      hasReviewCommandEndpoint: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasAllowedNow: sectionText.includes("Publish now"),
      hasProofLocked: sectionText.includes("Proof locked"),
      hasInternalOnly: sectionText.includes("Internal only"),
      hasProofPolicy: /proof-lock/i.test(sectionText),
      hasPublishRuleCopy: sectionText.includes("public-safe today") && sectionText.includes("software route owns"),
      leakedLocalPath: ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025", "Morning Batch"].some((token) =>
        sectionText.includes(token)
      ),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
      pageLength: pageText.trim().length,
    };
  }, expectedGateIds);

  assert(result.hasSection, "Public release-decision preview did not render", result);
  assert(result.apiStatus === "ready", "Public release-decision preview did not load", result);
  assert(result.version === "upsc-prelims-2026-release-decision-v1", "Public release-decision version drifted", result);
  assert(result.releaseStatus === "publish-safe-with-proof-locks", "Public release-decision status drifted", result);
  assert(result.effectiveCoverage === 76, "Public release-decision coverage drifted", result);
  assert(result.proofLockedQuestionCount === 100 && result.releasedClaimCount === 0, "Public proof-lock counts drifted", result);
  assert(result.sourceArchiveFileCount >= 1000, "Public release-decision source count is too low", result);
  assert(result.strategyTaskCount === 34 && result.apiEndpointCount === 10, "Public release-decision strategy/API counts drifted", result);
  assert(result.gateCount === 6 && result.renderedGateCount === 6, "Public release-decision gates drifted", result);
  assert(result.missingGateIds.length === 0, "Public release-decision missing gates", result);
  assert(
    result.gateStatuses.includes("Public safe") &&
      result.gateStatuses.includes("Proof locked") &&
      result.gateStatuses.includes("Waiting for approved packets") &&
      result.gateStatuses.includes("Ready with locks"),
    "Public release-decision gate statuses are incomplete",
    result
  );
  assert(
    result.hasEndpoint &&
      result.hasReviewCommandEndpoint &&
      result.hasAllowedNow &&
      result.hasProofLocked &&
      result.hasInternalOnly &&
      result.hasProofPolicy &&
      result.hasPublishRuleCopy,
    "Public release-decision copy is incomplete",
    result
  );
  assert(!result.leakedLocalPath, "Public release-decision preview leaked a private path token", result);
  assert(!result.mentionsWebinar, "Public page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Public page has horizontal overflow", result);
  assert(result.sectionLength > 2200 && result.pageLength > 8000, "Public release-decision page appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-release-decision-api-preview").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

async function verifyStrategyCommand(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedStrategyState(context);

  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(strategyRoute, { waitUntil: "networkidle", timeout: 90000 });
  await page.getByTestId("prelims-2026-release-decision-api-readiness").waitFor({ state: "visible", timeout: 70000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="prelims-2026-release-decision-api-readiness"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 70000 }
  );

  const result = await page.evaluate((expectedGateIds) => {
    const section = document.querySelector('[data-testid="prelims-2026-release-decision-api-readiness"]');
    const gates = Array.from(document.querySelectorAll('[data-testid="prelims-2026-release-decision-gate"]'));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const gateIds = gates.map((gate) => gate.getAttribute("data-gate-id"));
    const gateStatuses = gates.map((gate) => gate.getAttribute("data-gate-status"));
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      releaseStatus: section?.getAttribute("data-release-status"),
      effectiveCoverage: Number(section?.getAttribute("data-effective-coverage")),
      proofLockedQuestionCount: Number(section?.getAttribute("data-proof-locked-question-count")),
      releasedClaimCount: Number(section?.getAttribute("data-released-claim-count")),
      apiEndpointCount: Number(section?.getAttribute("data-api-endpoint-count")),
      gateCount: Number(section?.getAttribute("data-gate-count")),
      renderedGateCount: gates.length,
      gateIds,
      gateStatuses,
      missingGateIds: expectedGateIds.filter((id) => !gateIds.includes(id)),
      hasEndpoint: sectionText.includes("/api/upsc/prelims-2026/release-decision"),
      hasReviewCommandEndpoint: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasPublicStatus: sectionText.includes("Safe with lock"),
      hasCoverage: sectionText.includes("74/97"),
      hasApiEndpointCount: sectionText.includes("10"),
      hasDecisionTitle: sectionText.includes("One contract decides what the main site can publish"),
      hasPublicDecisionLink: links.includes("/upsc-prelims-2026-showcase#release-decision"),
      leakedLocalPath: ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025", "Morning Batch"].some((token) =>
        sectionText.includes(token)
      ),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
      pageLength: pageText.trim().length,
    };
  }, expectedGateIds);

  assert(result.hasSection, "Strategy release-decision readiness did not render", result);
  assert(result.apiStatus === "ready", "Strategy release-decision readiness did not load", result);
  assert(result.version === "upsc-prelims-2026-release-decision-v1", "Strategy release-decision version drifted", result);
  assert(result.releaseStatus === "publish-safe-with-proof-locks", "Strategy release-decision status drifted", result);
  assert(result.effectiveCoverage === 76, "Strategy release-decision coverage drifted", result);
  assert(result.proofLockedQuestionCount === 100 && result.releasedClaimCount === 0, "Strategy proof-lock counts drifted", result);
  assert(result.apiEndpointCount === 10, "Strategy release-decision endpoint count drifted", result);
  assert(result.gateCount === 6 && result.renderedGateCount === 6, "Strategy release-decision gates drifted", result);
  assert(result.missingGateIds.length === 0, "Strategy release-decision missing gates", result);
  assert(
    result.gateStatuses.includes("Public safe") &&
      result.gateStatuses.includes("Proof locked") &&
      result.gateStatuses.includes("Waiting for approved packets") &&
      result.gateStatuses.includes("Ready with locks"),
    "Strategy release-decision gate statuses are incomplete",
    result
  );
  assert(
    result.hasEndpoint &&
      result.hasReviewCommandEndpoint &&
      result.hasPublicStatus &&
      result.hasCoverage &&
      result.hasApiEndpointCount &&
      result.hasDecisionTitle &&
      result.hasPublicDecisionLink,
    "Strategy release-decision copy or link is incomplete",
    result
  );
  assert(!result.leakedLocalPath, "Strategy release-decision block leaked a private path token", result);
  assert(!result.mentionsWebinar, "Strategy command still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Strategy command has horizontal overflow", result);
  assert(result.sectionLength > 1200 && result.pageLength > 10000, "Strategy command appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("prelims-2026-release-decision-api-readiness").scrollIntoViewIfNeeded();
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
    const response = await page.request.get(releaseDecisionRoute, { timeout: 90000 });
    const payload = await response.json();
    const headers = response.headers();
    await context.close();

    assert(response.status() === 200, `Release-decision API returned ${response.status()}`, payload);
    const api = verifyReleaseDecisionPayload(payload, headers);
    const publicDesktop = await verifyPublicPage(browser, { width: 1440, height: 1100 }, "upsc-release-decision-public.png");
    const publicMobile = await verifyPublicPage(browser, { width: 390, height: 900 }, "upsc-release-decision-public-mobile.png");
    const strategyDesktop = await verifyStrategyCommand(browser, { width: 1440, height: 1100 }, "upsc-release-decision-strategy.png");
    const strategyMobile = await verifyStrategyCommand(browser, { width: 390, height: 900 }, "upsc-release-decision-strategy-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          releaseDecisionRoute,
          publicRoute,
          strategyRoute,
          api,
          publicDesktop,
          publicMobile,
          strategyDesktop,
          strategyMobile,
          artifacts: [
            publicDesktop.screenshotPath,
            publicMobile.screenshotPath,
            strategyDesktop.screenshotPath,
            strategyMobile.screenshotPath,
          ],
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

const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const matchRoute = `${baseUrl}/api/upsc/prelims-2026/match-accountability`;
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#match-accountability`;
const strategyRoute = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2026-match-accountability-api-readiness`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const forbiddenTokens = ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025", "Morning Batch"];

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

function assertPublicSafe(value, label) {
  for (const token of forbiddenTokens) {
    assert(!value.includes(token), `${label} leaked forbidden token ${token}`);
  }
  assert(!/webinar/i.test(value), `${label} contains webinar wording`);
}

function verifyPayload(payload, headers) {
  const serialized = JSON.stringify(payload);
  const questions = payload.questions || [];
  const first = questions[0];
  const portionRows = questions.reduce((total, question) => total + (question.match?.portionCoverage?.length || 0), 0);
  const matchedRows = questions.reduce(
    (total, question) =>
      total + (question.match?.portionCoverage || []).filter((portion) => portion.coverage !== "manual-check").length,
    0
  );
  const manualRows = questions.reduce(
    (total, question) =>
      total + (question.match?.portionCoverage || []).filter((portion) => portion.coverage === "manual-check").length,
    0
  );
  const proofLocked = questions.filter((question) => question.proofLocked === true).length;

  assert(headers["cache-control"]?.includes("no-store"), "Match-accountability API should not be cached", headers);
  assert(payload.version === "upsc-prelims-2026-match-accountability-v1", "Unexpected match-accountability version", payload.version);
  assert(payload.publicAnchor === "/upsc-prelims-2026-showcase#match-accountability", "Wrong public anchor", payload.publicAnchor);
  assert(
    payload.strategyAnchor === "/upsc/prelims-2027-strategy#prelims-2026-match-accountability-api-readiness",
    "Wrong strategy anchor",
    payload.strategyAnchor
  );
  assert(/candidate matched signals/i.test(payload.proofPolicy || ""), "Proof policy should mention candidate matched signals", payload.proofPolicy);

  assert(payload.summary?.totalQuestions === 100, "Wrong question count", payload.summary);
  assert(payload.summary?.completeQuestionCards === 100, "Wrong complete card count", payload.summary);
  assert(payload.summary?.optionSets === 100, "Wrong option set count", payload.summary);
  assert(payload.summary?.portionRows === 275, "Wrong portion row count", payload.summary);
  assert(payload.summary?.matchedPortionRows === 205, "Wrong matched portion row count", payload.summary);
  assert(payload.summary?.sourceSignalRows === 50, "Wrong source signal row count", payload.summary);
  assert(payload.summary?.conceptSignalRows === 155, "Wrong concept signal row count", payload.summary);
  assert(payload.summary?.manualCheckRows === 70, "Wrong manual check row count", payload.summary);
  assert(payload.summary?.fullyMatchedQuestions === 68, "Wrong fully matched question count", payload.summary);
  assert(payload.summary?.partialMatchQuestions === 22, "Wrong partial match question count", payload.summary);
  assert(payload.summary?.manualOnlyQuestions === 10, "Wrong manual-only question count", payload.summary);
  assert(payload.summary?.highlightedQuestions === 90, "Wrong highlighted question count", payload.summary);
  assert(payload.summary?.proofLockedQuestions === 100, "Wrong proof-lock question count", payload.summary);
  assert(payload.summary?.directTextLeads === 37, "Wrong direct text lead count", payload.summary);
  assert(payload.summary?.conceptualLeads === 63, "Wrong conceptual lead count", payload.summary);
  assert(payload.summary?.noIndexedLeads === 0, "Wrong no-indexed lead count", payload.summary);

  assert(questions.length === 100, "Expected 100 accountability question rows", { count: questions.length });
  assert(portionRows === 275, "Derived portion rows drifted", { portionRows });
  assert(matchedRows === 205, "Derived matched rows drifted", { matchedRows });
  assert(manualRows === 70, "Derived manual rows drifted", { manualRows });
  assert(proofLocked === 100, "Every accountability question should be proof locked", { proofLocked });

  assert(first?.number === 1, "First accountability question missing", first);
  assert(first?.question?.stem?.includes("Pleistocene"), "First full stem missing", first);
  assert(first?.question?.options?.length === 4, "First option set missing", first);
  assert(first?.answer === "D", "First answer drifted", first);
  assert(first?.match?.highestMatchedPortion === "Statement 3", "First highest matched portion drifted", first?.match);
  assert(first?.match?.matchedPortionLabels?.length === 2, "First matched portion count drifted", first?.match);
  assert(first?.match?.manualCheckPortionLabels?.length === 1, "First manual-check portion count drifted", first?.match);
  assert(first?.match?.coverageScorePercent === 67, "First coverage score drifted", first?.match);
  assert(first?.match?.portionCoverage?.length === 3, "First portion coverage rows drifted", first?.match);
  assert(first?.match?.nextProofAction?.includes("Manually check"), "First next proof action missing", first?.match);

  assert(payload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command", "Missing review command API path", payload.api);
  assert(payload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability", "Missing self API path", payload.api);
  assert(payload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger", "Missing question ledger API path", payload.api);
  assert(payload.api?.releaseDecision === "/api/upsc/prelims-2026/release-decision", "Missing release decision API path", payload.api);
  assertPublicSafe(serialized, "Match-accountability API");

  return {
    version: payload.version,
    summary: payload.summary,
    first: {
      number: first.number,
      highestMatchedPortion: first.match.highestMatchedPortion,
      matchedPortionLabels: first.match.matchedPortionLabels,
      manualCheckPortionLabels: first.match.manualCheckPortionLabels,
      coverageScorePercent: first.match.coverageScorePercent,
    },
  };
}

async function seedStrategyState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_match_accountability");
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
  await page.getByTestId("showcase-match-accountability-api-preview").waitFor({ state: "visible", timeout: 70000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="showcase-match-accountability-api-preview"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 70000 }
  );

  const result = await page.evaluate((forbiddenTokens) => {
    const section = document.querySelector('[data-testid="showcase-match-accountability-api-preview"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="showcase-match-accountability-card"]'));
    const portions = Array.from(document.querySelectorAll('[data-testid="showcase-match-accountability-portion"]'));
    const first = cards[0];
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      questionCount: Number(section?.getAttribute("data-question-count")),
      completeQuestionCards: Number(section?.getAttribute("data-complete-question-cards")),
      optionSetCount: Number(section?.getAttribute("data-option-set-count")),
      portionRowCount: Number(section?.getAttribute("data-portion-row-count")),
      matchedPortionRows: Number(section?.getAttribute("data-matched-portion-row-count")),
      sourceSignalRows: Number(section?.getAttribute("data-source-signal-rows")),
      conceptSignalRows: Number(section?.getAttribute("data-concept-signal-rows")),
      manualCheckRows: Number(section?.getAttribute("data-manual-check-rows")),
      fullyMatchedQuestions: Number(section?.getAttribute("data-fully-matched-question-count")),
      partialMatchQuestions: Number(section?.getAttribute("data-partial-match-question-count")),
      manualOnlyQuestions: Number(section?.getAttribute("data-manual-only-question-count")),
      highlightedQuestions: Number(section?.getAttribute("data-highlighted-question-count")),
      proofLockedQuestions: Number(section?.getAttribute("data-proof-locked-question-count")),
      previewCardCount: Number(section?.getAttribute("data-preview-card-count")),
      renderedCards: cards.length,
      renderedPortions: portions.length,
      firstQuestionNumber: first?.getAttribute("data-question-number"),
      firstHighestMatchedPortion: first?.getAttribute("data-highest-matched-portion"),
      firstMatchedPortionCount: Number(first?.getAttribute("data-matched-portion-count")),
      firstManualCheckPortionCount: Number(first?.getAttribute("data-manual-check-portion-count")),
      firstCoverageScore: Number(first?.getAttribute("data-coverage-score")),
      firstProofLocked: first?.getAttribute("data-proof-locked"),
      sourcePortionCount: portions.filter((portion) => portion.getAttribute("data-coverage") === "source-signal").length,
      conceptPortionCount: portions.filter((portion) => portion.getAttribute("data-coverage") === "concept-signal").length,
      manualPortionCount: portions.filter((portion) => portion.getAttribute("data-coverage") === "manual-check").length,
      hasEndpoint: sectionText.includes("/api/upsc/prelims-2026/match-accountability"),
      hasHighestCopy: sectionText.includes("Highest matched portion"),
      hasManualCopy: sectionText.includes("Manual-check portions"),
      hasNextActionCopy: sectionText.includes("Next proof action") || sectionText.includes("Verify page proof"),
      hasProofPolicy: /candidate signals|teacher validation|proof/i.test(sectionText),
      markCount: section?.querySelectorAll("mark").length || 0,
      leakedPrivateToken: forbiddenTokens.some((token) => sectionText.includes(token)),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
      pageLength: pageText.trim().length,
    };
  }, forbiddenTokens);

  assert(result.hasSection, "Public match-accountability section did not render", result);
  assert(result.apiStatus === "ready", "Public match-accountability API did not load", result);
  assert(result.version === "upsc-prelims-2026-match-accountability-v1", "Public match-accountability version drifted", result);
  assert(result.questionCount === 100 && result.completeQuestionCards === 100 && result.optionSetCount === 100, "Public question counts drifted", result);
  assert(result.portionRowCount === 275 && result.matchedPortionRows === 205 && result.manualCheckRows === 70, "Public portion counts drifted", result);
  assert(result.sourceSignalRows === 50 && result.conceptSignalRows === 155, "Public signal split drifted", result);
  assert(result.fullyMatchedQuestions === 68 && result.partialMatchQuestions === 22 && result.manualOnlyQuestions === 10, "Public match split drifted", result);
  assert(result.highlightedQuestions === 90 && result.proofLockedQuestions === 100, "Public proof-lock/highlight counts drifted", result);
  assert(result.previewCardCount === 5 && result.renderedCards === 5 && result.renderedPortions >= 9, "Public preview cards drifted", result);
  assert(
    result.firstQuestionNumber === "1" &&
      result.firstHighestMatchedPortion === "Statement 3" &&
      result.firstMatchedPortionCount === 2 &&
      result.firstManualCheckPortionCount === 1 &&
      result.firstCoverageScore === 67 &&
      result.firstProofLocked === "true",
    "Public first match-accountability card drifted",
    result
  );
  assert(result.sourcePortionCount > 0 && result.conceptPortionCount > 0 && result.manualPortionCount > 0, "Public preview lacks coverage mix", result);
  assert(result.hasEndpoint && result.hasHighestCopy && result.hasManualCopy && result.hasNextActionCopy && result.hasProofPolicy, "Public copy incomplete", result);
  assert(result.markCount >= 4, "Public matched signal highlights did not render", result);
  assert(!result.leakedPrivateToken, "Public match-accountability section leaked private token", result);
  assert(!result.mentionsWebinar, "Public page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Public page has horizontal overflow", result);
  assert(result.sectionLength > 3500 && result.pageLength > 10000, "Public page appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-match-accountability-api-preview").scrollIntoViewIfNeeded();
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
  await page.getByTestId("prelims-2026-match-accountability-api-readiness").waitFor({ state: "visible", timeout: 70000 });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="prelims-2026-match-accountability-api-readiness"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 70000 }
  );

  const result = await page.evaluate((forbiddenTokens) => {
    const section = document.querySelector('[data-testid="prelims-2026-match-accountability-api-readiness"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="prelims-2026-match-accountability-api-card"]'));
    const portions = Array.from(document.querySelectorAll('[data-testid="prelims-2026-match-accountability-api-portion"]'));
    const first = cards[0];
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      questionCount: Number(section?.getAttribute("data-question-count")),
      portionRowCount: Number(section?.getAttribute("data-portion-row-count")),
      matchedPortionRows: Number(section?.getAttribute("data-matched-portion-row-count")),
      manualCheckRows: Number(section?.getAttribute("data-manual-check-rows")),
      fullyMatchedQuestions: Number(section?.getAttribute("data-fully-matched-question-count")),
      partialMatchQuestions: Number(section?.getAttribute("data-partial-match-question-count")),
      manualOnlyQuestions: Number(section?.getAttribute("data-manual-only-question-count")),
      highlightedQuestions: Number(section?.getAttribute("data-highlighted-question-count")),
      proofLockedQuestions: Number(section?.getAttribute("data-proof-locked-question-count")),
      previewCardCount: Number(section?.getAttribute("data-preview-card-count")),
      previewQuestionNumber: Number(section?.getAttribute("data-preview-question-number")),
      previewHighestMatchedPortion: section?.getAttribute("data-preview-highest-matched-portion"),
      previewMatchedPortionCount: Number(section?.getAttribute("data-preview-matched-portion-count")),
      previewManualCheckPortionCount: Number(section?.getAttribute("data-preview-manual-check-portion-count")),
      renderedCards: cards.length,
      renderedPortions: portions.length,
      firstQuestionNumber: first?.getAttribute("data-question-number"),
      firstHighestMatchedPortion: first?.getAttribute("data-highest-matched-portion"),
      firstMatchedPortionCount: Number(first?.getAttribute("data-matched-portion-count")),
      firstManualCheckPortionCount: Number(first?.getAttribute("data-manual-check-portion-count")),
      firstCoverageScore: Number(first?.getAttribute("data-coverage-score")),
      firstProofLocked: first?.getAttribute("data-proof-locked"),
      hasEndpoint: sectionText.includes("/api/upsc/prelims-2026/match-accountability"),
      hasHighestCopy: sectionText.includes("Highest matched portion"),
      hasManualCopy: sectionText.includes("Manual-check portions"),
      hasNextActionCopy: sectionText.includes("Next proof action"),
      hasPublicLink: links.includes("/upsc-prelims-2026-showcase#match-accountability"),
      markCount: section?.querySelectorAll("mark").length || 0,
      leakedPrivateToken: forbiddenTokens.some((token) => sectionText.includes(token)),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
      pageLength: pageText.trim().length,
    };
  }, forbiddenTokens);

  assert(result.hasSection, "Strategy match-accountability section did not render", result);
  assert(result.apiStatus === "ready", "Strategy match-accountability API did not load", result);
  assert(result.version === "upsc-prelims-2026-match-accountability-v1", "Strategy match-accountability version drifted", result);
  assert(result.questionCount === 100 && result.portionRowCount === 275, "Strategy question/portion counts drifted", result);
  assert(result.matchedPortionRows === 205 && result.manualCheckRows === 70, "Strategy matched/manual counts drifted", result);
  assert(result.fullyMatchedQuestions === 68 && result.partialMatchQuestions === 22 && result.manualOnlyQuestions === 10, "Strategy match split drifted", result);
  assert(result.highlightedQuestions === 90 && result.proofLockedQuestions === 100, "Strategy proof-lock/highlight counts drifted", result);
  assert(result.previewCardCount === 4 && result.renderedCards === 4 && result.renderedPortions >= 8, "Strategy preview card count drifted", result);
  assert(
    result.previewQuestionNumber === 1 &&
      result.previewHighestMatchedPortion === "Statement 3" &&
      result.previewMatchedPortionCount === 2 &&
      result.previewManualCheckPortionCount === 1,
    "Strategy preview data attributes drifted",
    result
  );
  assert(
    result.firstQuestionNumber === "1" &&
      result.firstHighestMatchedPortion === "Statement 3" &&
      result.firstMatchedPortionCount === 2 &&
      result.firstManualCheckPortionCount === 1 &&
      result.firstCoverageScore === 67 &&
      result.firstProofLocked === "true",
    "Strategy first match-accountability card drifted",
    result
  );
  assert(result.hasEndpoint && result.hasHighestCopy && result.hasManualCopy && result.hasNextActionCopy && result.hasPublicLink, "Strategy copy/link incomplete", result);
  assert(result.markCount >= 4, "Strategy matched signal highlights did not render", result);
  assert(!result.leakedPrivateToken, "Strategy match-accountability section leaked private token", result);
  assert(!result.mentionsWebinar, "Strategy command still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Strategy command has horizontal overflow", result);
  assert(result.sectionLength > 3200 && result.pageLength > 12000, "Strategy command appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("prelims-2026-match-accountability-api-readiness").scrollIntoViewIfNeeded();
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
    const [matchResponse, manifestResponse] = await Promise.all([
      page.request.get(matchRoute, { timeout: 90000 }),
      page.request.get(manifestRoute, { timeout: 90000 }),
    ]);
    const payload = await matchResponse.json();
    const manifestPayload = await manifestResponse.json();
    await context.close();

    assert(matchResponse.status() === 200, `Match-accountability API returned ${matchResponse.status()}`, payload);
    assert(manifestResponse.status() === 200, `Manifest API returned ${manifestResponse.status()}`, manifestPayload);
    assert(
      manifestPayload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability",
      "Manifest does not advertise match-accountability API",
      manifestPayload.api
    );

    const api = verifyPayload(payload, matchResponse.headers());
    const publicDesktop = await verifyPublicPage(browser, { width: 1440, height: 1100 }, "upsc-match-accountability-public.png");
    const publicMobile = await verifyPublicPage(browser, { width: 390, height: 900 }, "upsc-match-accountability-public-mobile.png");
    const strategyDesktop = await verifyStrategyCommand(browser, { width: 1440, height: 1100 }, "upsc-match-accountability-strategy.png");
    const strategyMobile = await verifyStrategyCommand(browser, { width: 390, height: 900 }, "upsc-match-accountability-strategy-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          matchRoute,
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

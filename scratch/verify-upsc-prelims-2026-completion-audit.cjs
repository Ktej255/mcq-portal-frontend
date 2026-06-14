const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase`;
const dashboardRoute = `${baseUrl}/upsc/prelims-2026-showcase`;
const reviewCommandRoute = `${baseUrl}/upsc/prelims-review-command`;
const strategyRoute = `${baseUrl}/upsc/prelims-2027-strategy`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const showcaseSourcePath = path.resolve(process.cwd(), "src/components/marketing/UpscPrelimsShowcase.tsx");

const apiRoutes = {
  manifest: `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`,
  buildReadiness: `${baseUrl}/api/upsc/prelims-2026/build-readiness`,
  reviewCommand: `${baseUrl}/api/upsc/prelims-2026/review-command`,
  questionLedger: `${baseUrl}/api/upsc/prelims-2026/question-ledger`,
  sourceSummary: `${baseUrl}/api/upsc/prelims-2026/source-archive-summary`,
  courseAction: `${baseUrl}/api/upsc/prelims-2027/course-action`,
  releaseDecision: `${baseUrl}/api/upsc/prelims-2026/release-decision`,
  mainSiteHandoff: `${baseUrl}/api/upsc/prelims-2026/main-site-handoff`,
};

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

const forbiddenTokens = ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025"];

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

async function getJson(page, label, route) {
  const response = await page.request.get(route);
  const payload = await response.json();
  assert(response.status() === 200, `${label} returned ${response.status()}`, payload);
  assert(response.headers()["cache-control"]?.includes("no-store"), `${label} should not be cached`, response.headers());
  assertPublicSafe(JSON.stringify(payload), label);
  return payload;
}

function auditSourceLevelVisuals() {
  const source = fs.readFileSync(showcaseSourcePath, "utf8");

  return {
    hasFramerMotion: /from "framer-motion"/.test(source) && /<motion\./.test(source),
    hasPieChart: /<PieChart/.test(source) && /<Pie\b/.test(source),
    hasLineChart: /<LineChart/.test(source) && /<Line\b/.test(source),
    hasBarChart: /<BarChart/.test(source) && /<Bar\b/.test(source),
    hasRadarChart: /<RadarChart/.test(source) && (/<Radar\b/.test(source) || /<RadarShape\b/.test(source)),
    hasGeographyThemeSignals:
      source.includes("Geography") &&
      source.includes("Map pressure") &&
      source.includes("#1b6b4a") &&
      source.includes("#d8891c"),
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

  await page.goto(publicRoute, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("#question-ledger").waitFor({ state: "attached", timeout: 30000 });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="showcase-build-readiness-api-preview"]')
        ?.getAttribute("data-api-status") === "ready" &&
      document
        .querySelector('[data-testid="showcase-question-ledger-api-preview"]')
        ?.getAttribute("data-api-status") === "ready" &&
      document
        .querySelector('[data-testid="showcase-source-archive-summary-preview"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 60000 }
  );

  const result = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const htmlText = document.documentElement.textContent || "";
    const questionCards = Array.from(document.querySelectorAll('[data-testid="showcase-question-evidence-card"]'));
    const questionLedger = document.querySelector('[data-testid="showcase-question-ledger"]');
    const ledgerText = questionLedger?.textContent || "";
    const chartSection = document.querySelector('[data-testid="showcase-question-logic"]');
    const surprise = document.querySelector('[data-testid="showcase-surprise-action-matrix"]');
    const surpriseRows = Array.from(document.querySelectorAll('[data-testid="showcase-surprise-action-row"]'));
    const manifest = document.querySelector('[data-testid="showcase-manifest-contract"]');
    const integrationRows = Array.from(document.querySelectorAll('[data-testid="showcase-integration-row"]'));
    const copyBlocks = Array.from(document.querySelectorAll('[data-testid="showcase-copy-block"]'));
    const requirementRows = Array.from(document.querySelectorAll('[data-testid="showcase-build-readiness-requirement"]'));
    const sourceSummary = document.querySelector('[data-testid="showcase-source-archive-summary-preview"]');
    const allSvgs = Array.from(document.querySelectorAll("svg"));
    const rechartsWrappers = Array.from(document.querySelectorAll(".recharts-wrapper"));
    const rechartsSurfaces = Array.from(document.querySelectorAll(".recharts-surface"));
    const marks = Array.from(document.querySelectorAll("mark"));
    const style = window.getComputedStyle(document.body);
    const searchableText = `${bodyText}\n${htmlText}\n${ledgerText}`;

    return {
      pathname: window.location.pathname,
      title: document.title,
      bodyBackground: style.backgroundColor,
      textLength: bodyText.trim().length,
      questionCards: questionCards.length,
      optionCounts: questionCards.map((card) => Number(card.getAttribute("data-option-count"))),
      firstQuestionHasStem: searchableText.includes("Pleistocene"),
      lastQuestionHasOption:
        searchableText.includes("Which of the following countries are members of the European Union?") &&
        searchableText.includes("2 and 3"),
      questionLedgerCount: Number(questionLedger?.getAttribute("data-question-count")),
      statementCoverageRows: Number(questionLedger?.getAttribute("data-statement-coverage-rows")),
      multiStatementCount: Number(questionLedger?.getAttribute("data-multi-statement-count")),
      markCount: marks.length,
      chartThreePlus: Number(chartSection?.getAttribute("data-format-three-plus")),
      chartTwo: Number(chartSection?.getAttribute("data-format-two")),
      chartNoList: Number(chartSection?.getAttribute("data-format-no-list")),
      chartMulti: Number(chartSection?.getAttribute("data-format-multi-statement-total")),
      renderedSvgCount: allSvgs.length,
      rechartsWrapperCount: rechartsWrappers.length + rechartsSurfaces.length,
      hasPieCopy: searchableText.includes("Direct source leads") || searchableText.includes("37 direct / 63 conceptual"),
      hasTrendCopy: bodyText.includes("Question distribution trend"),
      hasQuestionPatternCopy: bodyText.includes("Statement architecture"),
      hasSourceSummary: Boolean(sourceSummary),
      sourceTotalFiles: Number(sourceSummary?.getAttribute("data-total-files")),
      sourcePdfCount: Number(sourceSummary?.getAttribute("data-pdf-count")),
      sourceTrackCount: Number(sourceSummary?.getAttribute("data-track-count")),
      surpriseRows: Number(surprise?.getAttribute("data-row-count")),
      surpriseCriticalRows: Number(surprise?.getAttribute("data-critical-count")),
      surpriseBuildRows: Number(surprise?.getAttribute("data-build-from-scratch-count")),
      hasIrSurprise: bodyText.includes("IR / Multilateral Bodies"),
      hasScienceSurprise:
        searchableText.includes("Science and Tech New Domains") ||
        searchableText.includes("new-domain S&T") ||
        surpriseRows.some((row) => row.getAttribute("data-priority-id") === "science-new-domains"),
      hasUntappedCopy: bodyText.includes("which domain is still underbuilt"),
      integrationRows: integrationRows.length,
      integrationRoutes: integrationRows.map((row) => row.getAttribute("data-dashboard-route")),
      copyBlocks: copyBlocks.length,
      requirementIds: requirementRows.map((row) => row.getAttribute("data-requirement-id")),
      buildReadinessStatus: document
        .querySelector('[data-testid="showcase-build-readiness-api-preview"]')
        ?.getAttribute("data-api-status"),
      hasReviewCommandEndpoint: htmlText.includes("/api/upsc/prelims-2026/review-command"),
      hasCourseActionEndpoint: htmlText.includes("/api/upsc/prelims-2027/course-action"),
      hasMainSiteHandoffEndpoint: htmlText.includes("/api/upsc/prelims-2026/main-site-handoff"),
      hasReviewCommandLink: Array.from(document.querySelectorAll("a")).some(
        (link) => link.getAttribute("href") === "/upsc/prelims-review-command"
      ),
      mentionsWebinar: /webinar/i.test(bodyText),
      leakedLocalPath: bodyText.includes("D:\\") || bodyText.includes("C:\\"),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });

  assert(result.pathname === "/upsc-prelims-2026-showcase", "Public standalone route is wrong", result);
  assert(result.questionCards === 100, "Public page does not render all 100 MCQ cards", result);
  assert(result.optionCounts.every((count) => count >= 4), "Every public MCQ card should render full options", result);
  assert(result.firstQuestionHasStem && result.lastQuestionHasOption, "Public page is missing complete MCQ text", result);
  assert(result.questionLedgerCount === 100, "Question ledger count drifted", result);
  assert(result.statementCoverageRows === 275, "Statement coverage row count drifted", result);
  assert(result.multiStatementCount === 75, "Multi-statement count drifted", result);
  assert(result.markCount >= 1000, "Highlighted matched portions are too sparse", result);
  assert(result.chartThreePlus === 67 && result.chartTwo === 8 && result.chartNoList === 25 && result.chartMulti === 75, "Question-format chart counts drifted", result);
  assert(result.renderedSvgCount >= 8 && result.rechartsWrapperCount >= 5, "Visual chart surface is too thin", result);
  assert(result.hasPieCopy && result.hasTrendCopy && result.hasQuestionPatternCopy, "Chart/trend copy is incomplete", result);
  assert(result.hasSourceSummary && result.sourceTotalFiles >= 1000 && result.sourcePdfCount >= 1000 && result.sourceTrackCount === 8, "Source archive summary is incomplete", result);
  assert(result.surpriseRows === 8 && result.surpriseCriticalRows === 2 && result.surpriseBuildRows === 2, "Surprise/action matrix counts drifted", result);
  assert(result.hasIrSurprise && result.hasScienceSurprise && result.hasUntappedCopy, "Surprise/untapped domain copy is incomplete", result);
  assert(result.integrationRows === 6, "Main-site integration map drifted", result);
  assert(result.integrationRoutes.includes("/upsc/prelims-review-command"), "Integration map does not point to Review Command", result);
  assert(result.copyBlocks === 4, "Main-site copy kit drifted", result);
  for (const id of expectedRequirementIds) {
    assert(result.requirementIds.includes(id), `Build-readiness requirement ${id} is missing`, result);
  }
  assert(result.buildReadinessStatus === "ready", "Build readiness preview did not load", result);
  assert(result.hasReviewCommandEndpoint && result.hasCourseActionEndpoint && result.hasMainSiteHandoffEndpoint, "Main-site API contract endpoints are missing", result);
  assert(result.hasReviewCommandLink, "Public software path does not link Review Command", result);
  assert(!result.mentionsWebinar, "Public page contains webinar wording", result);
  assert(!result.leakedLocalPath, "Public page leaked local paths", result);
  assert(!result.hasErrorOverlay, "Public page has a framework error overlay", result);
  assert(!result.horizontalOverflow, "Public page has horizontal overflow", result);
  assert(consoleErrors.length === 0, `Public page console errors: ${consoleErrors.join(" | ")}`, result);

  await page.screenshot({ path: path.join(artifactDir, "upsc-prelims-2026-completion-audit-public.png"), fullPage: false });
  await context.close();
  return result;
}

async function verifyOperatorRoutes(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await context.addInitScript(() => {
    window.MOCK_TOKEN = "MOCK_TOKEN_MASTER_completion_audit";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_completion_audit");
    window.localStorage.setItem(
      "sarit-upsc-student-profile-v1",
      JSON.stringify({
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
      })
    );
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(reviewCommandRoute, { waitUntil: "networkidle", timeout: 90000 });
  await page.getByTestId("prelims-review-command").waitFor({ state: "visible", timeout: 30000 });
  const review = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="prelims-review-command"]');
    return {
      pathname: window.location.pathname,
      effectiveCoverage: Number(root?.getAttribute("data-effective-coverage")),
      completeQuestions: Number(root?.getAttribute("data-complete-questions")),
      sourceCandidates: Number(root?.getAttribute("data-source-candidate-questions")),
      sourceBlindSpots: Number(root?.getAttribute("data-source-blind-spots")),
      priorityCount: Number(root?.getAttribute("data-priority-count")),
      taskCount: Number(root?.getAttribute("data-task-count")),
      actionLanes: document.querySelectorAll('[data-testid="prelims-review-command-action-lane"]').length,
      hasStrategyLink: Array.from(document.querySelectorAll("a")).some((link) => link.getAttribute("href") === "/upsc/prelims-2027-strategy"),
      hasMcqCommandLink: Array.from(document.querySelectorAll("a")).some((link) => link.getAttribute("href") === "/upsc/mcq-command"),
    };
  });

  await page.goto(strategyRoute, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.getByTestId("prelims-2027-course-correction-packet").waitFor({ state: "visible", timeout: 30000 });
  const strategy = await page.evaluate(() => {
    const packet = document.querySelector('[data-testid="prelims-2027-course-correction-packet"]');
    const courseApi = document.querySelector('[data-testid="prelims-2027-course-action-api-readiness"]');
    const questionApi = document.querySelector('[data-testid="prelims-2026-question-ledger-api-readiness"]');
    return {
      pathname: window.location.pathname,
      packetTracks: Number(packet?.getAttribute("data-track-count")),
      hasCoursePacketTitle: (packet?.textContent || "").includes("What changes inside the course and software"),
      courseApiStatus: courseApi?.getAttribute("data-api-status"),
      questionApiStatus: questionApi?.getAttribute("data-api-status"),
      reallocationRows: document.querySelectorAll('[data-testid="prelims-2027-reallocation-row"]').length,
      evidenceRows: document.querySelectorAll('[data-testid="prelims-2027-evidence-row"]').length,
      deliveryRows: document.querySelectorAll('[data-testid="prelims-2027-delivery-row"]').length,
      taskGroups: document.querySelectorAll('[data-testid="prelims-2027-task-priority-group"]').length,
    };
  });

  assert(review.pathname === "/upsc/prelims-review-command", "Review Command route is wrong", review);
  assert(review.effectiveCoverage === 76 && review.completeQuestions === 100, "Review Command audit/ledger counts drifted", review);
  assert(review.sourceCandidates === 98 && review.sourceBlindSpots === 2, "Review Command source readiness counts drifted", review);
  assert(review.priorityCount === 8 && review.taskCount === 34 && review.actionLanes === 6, "Review Command action lanes drifted", review);
  assert(review.hasStrategyLink && review.hasMcqCommandLink, "Review Command lacks software handoff links", review);
  assert(strategy.pathname === "/upsc/prelims-2027-strategy", "Strategy route is wrong", strategy);
  assert(strategy.packetTracks === 8 && strategy.hasCoursePacketTitle, "Course correction packet is incomplete", strategy);
  assert(strategy.reallocationRows === 8 && strategy.evidenceRows === 8, "2027 reallocation/evidence rows drifted", strategy);
  assert(strategy.deliveryRows >= 8 && strategy.taskGroups >= 8, "2027 delivery/task surfaces are incomplete", strategy);
  assert(consoleErrors.length === 0, `Operator route console errors: ${consoleErrors.join(" | ")}`, { review, strategy });

  await context.close();
  return { review, strategy };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [manifest, buildReadiness, reviewCommand, questionLedger, sourceSummary, courseAction, releaseDecision, mainSiteHandoff] =
      await Promise.all([
        getJson(page, "Manifest API", apiRoutes.manifest),
        getJson(page, "Build-readiness API", apiRoutes.buildReadiness),
        getJson(page, "Review Command API", apiRoutes.reviewCommand),
        getJson(page, "Question Ledger API", apiRoutes.questionLedger),
        getJson(page, "Source Summary API", apiRoutes.sourceSummary),
        getJson(page, "Course Action API", apiRoutes.courseAction),
        getJson(page, "Release Decision API", apiRoutes.releaseDecision),
        getJson(page, "Main-site Handoff API", apiRoutes.mainSiteHandoff),
      ]);
    await context.close();

    assert(buildReadiness.summary?.requirementCount === 12, "Build-readiness requirement count drifted", buildReadiness.summary);
    for (const id of expectedRequirementIds) {
      assert(buildReadiness.requirements?.some((requirement) => requirement.id === id), `Build-readiness is missing ${id}`, buildReadiness.requirements);
    }
    assert(buildReadiness.summary?.apiEndpointCount === 10, "API endpoint count drifted", buildReadiness.summary);
    assert(manifest.publicRoute === "/upsc-prelims-2026-showcase", "Manifest public route drifted", manifest);
    assert(mainSiteHandoff.mode === "public-safe-main-site-bundle", "Main-site handoff mode drifted", mainSiteHandoff);
    assert(releaseDecision.status === "publish-safe-with-proof-locks", "Release decision status drifted", releaseDecision);
    assert(reviewCommand.summary?.apiEndpointCount === 10, "Review Command API map count drifted", reviewCommand.summary);
    assert(questionLedger.questions?.length === 100 && questionLedger.summary?.statementCoverageRows === 275, "Question ledger API is incomplete", questionLedger.summary);
    assert(sourceSummary.scan?.rootConnected === true && sourceSummary.scan?.trackCount === 8, "Source summary scan is incomplete", sourceSummary.scan);
    assert(courseAction.summary?.priorityCount === 8 && courseAction.summary?.taskCount === 34, "Course action summary is incomplete", courseAction.summary);

    const sourceVisuals = auditSourceLevelVisuals();
    assert(
      sourceVisuals.hasFramerMotion &&
        sourceVisuals.hasPieChart &&
        sourceVisuals.hasLineChart &&
        sourceVisuals.hasBarChart &&
        sourceVisuals.hasRadarChart &&
        sourceVisuals.hasGeographyThemeSignals,
      "Source-level visual/animation requirements are incomplete",
      sourceVisuals
    );

    const publicPage = await verifyPublicPage(browser);
    const operatorRoutes = await verifyOperatorRoutes(browser);

    console.log(
      JSON.stringify(
        {
          ok: true,
          publicRoute,
          dashboardRoute,
          reviewCommandRoute,
          strategyRoute,
          requirements: expectedRequirementIds,
          apiSummary: {
            endpointCount: buildReadiness.summary.apiEndpointCount,
            correctedCoverage: manifest.audit.corrected.effectiveCoveragePercent,
            completeQuestions: questionLedger.summary.completeQuestionCards,
            statementCoverageRows: questionLedger.summary.statementCoverageRows,
            sourceFiles: sourceSummary.scan.totalFiles,
            sourcePdfs: sourceSummary.scan.pdfCount,
            coursePriorities: courseAction.summary.priorityCount,
            courseTasks: courseAction.summary.taskCount,
          },
          sourceVisuals,
          publicPage,
          operatorRoutes,
          artifact: path.join(artifactDir, "upsc-prelims-2026-completion-audit-public.png"),
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

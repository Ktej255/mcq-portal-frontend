const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const inventoryPath = path.join(__dirname, "upsc-route-inventory.json");
const evidencePath = path.join(__dirname, "upsc-route-matrix-evidence.json");

const learnerProfile = {
  level: "advanced",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "one-attempt",
  learningPattern: "deep-work",
  mindState: "calm",
  updatedAt: new Date().toISOString(),
};

const legacyProfile = {
  studentName: "Route Matrix Student",
  learnerLevel: "ADVANCED",
  dailyStudyMinutes: 120,
  targetYear: "2027",
  learningStyle: "BALANCED",
  weakestSubject: "GEOGRAPHY",
  completedAt: new Date().toISOString(),
};

async function seed(page, token) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ token, learnerProfile, legacyProfile }) => {
      window.localStorage.clear();
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(learnerProfile));
      window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(legacyProfile));
    },
    { token, learnerProfile, legacyProfile },
  );
}

async function inspectRoute(page, entry) {
  const routeConsoleErrors = [];
  const routePageErrors = [];
  const routeFailures = [];
  const onConsole = (message) => {
    if (message.type() === "error") routeConsoleErrors.push(message.text());
  };
  const onPageError = (error) => routePageErrors.push(error.message);
  const onRequestFailed = (request) => {
    routeFailures.push({ url: request.url(), failure: request.failure()?.errorText || "unknown" });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);

  try {
    await page.goto(`${baseUrl}${entry.route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (new URL(page.url()).pathname !== entry.expectedPath) {
      await page
        .waitForURL((url) => url.pathname === entry.expectedPath, { timeout: 5000 })
        .catch(() => {});
    }
    await page.waitForTimeout(entry.allowLegacyApiFailure ? 1200 : 350);
    await page
      .waitForFunction(() => document.body.innerText.trim().length > 0, undefined, { timeout: 5000 })
      .catch(() => {});

    const finalUrl = new URL(page.url());
    const metrics = await page.evaluate(() => ({
      bodyText: document.body.innerText.trim(),
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"),
      ),
    }));
    const legacyApiFailures = routeFailures.filter(({ url }) => url.includes("/api/v1/"));
    const unexpectedConsoleErrors = routeConsoleErrors.filter((error) => {
      if (entry.allowLegacyApiFailure && /Failed to fetch exam data|Network Error|ERR_NETWORK/i.test(error)) return false;
      return !/Failed to load resource: net::ERR_ABORTED/i.test(error);
    });
    const expectedPathReached = finalUrl.pathname === entry.expectedPath;
    const hasHorizontalOverflow =
      metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
    const containsRetiredBranding = /ANTIGRAVITY|ANTI\s*GRAVITY/i.test(metrics.bodyText);
    const hasUnexpectedLegacyApiFailure = legacyApiFailures.length > 0 && !entry.allowLegacyApiFailure;
    const passed =
      expectedPathReached &&
      metrics.bodyText.length > 0 &&
      !metrics.hasErrorOverlay &&
      !hasHorizontalOverflow &&
      !containsRetiredBranding &&
      !hasUnexpectedLegacyApiFailure &&
      unexpectedConsoleErrors.length === 0 &&
      routePageErrors.length === 0;

    return {
      route: entry.route,
      access: entry.access,
      area: entry.area,
      expectedPath: entry.expectedPath,
      finalPath: finalUrl.pathname,
      expectedPathReached,
      bodyCharacters: metrics.bodyText.length,
      hasErrorOverlay: metrics.hasErrorOverlay,
      hasHorizontalOverflow,
      containsRetiredBranding,
      legacyApiFailures,
      unexpectedConsoleErrors,
      pageErrors: routePageErrors,
      passed,
    };
  } catch (error) {
    return {
      route: entry.route,
      access: entry.access,
      area: entry.area,
      expectedPath: entry.expectedPath,
      finalPath: new URL(page.url()).pathname,
      error: error.message,
      legacyApiFailures: routeFailures.filter(({ url }) => url.includes("/api/v1/")),
      consoleErrors: routeConsoleErrors,
      pageErrors: routePageErrors,
      passed: false,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
  }
}

async function run() {
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`Missing generated route inventory: ${inventoryPath}`);
  }

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const browser = await chromium.launch({ headless: true });
  const publicContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const learnerContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const masterContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const publicPage = await publicContext.newPage();
  const learnerPage = await learnerContext.newPage();
  const masterPage = await masterContext.newPage();
  await seed(learnerPage, "MOCK_TOKEN_STUDENT_route_matrix");
  await seed(masterPage, "MOCK_TOKEN_MASTER_route_matrix");

  const results = [];
  for (const entry of inventory.routes) {
    const page = entry.access === "public" ? publicPage : entry.access === "learner" ? learnerPage : masterPage;
    const result = await inspectRoute(page, entry);
    results.push(result);
    console.log(`${result.passed ? "PASS" : "FAIL"} ${entry.route} -> ${result.finalPath}`);
  }

  await publicContext.close();
  await learnerContext.close();
  await masterContext.close();
  await browser.close();
  const failures = results.filter((result) => !result.passed);
  const evidence = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    inventoryCounts: inventory.counts,
    visitedRoutes: results.length,
    passedRoutes: results.length - failures.length,
    failedRoutes: failures.length,
    failures,
    results,
    passed: failures.length === 0,
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ...evidence, results: undefined }, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

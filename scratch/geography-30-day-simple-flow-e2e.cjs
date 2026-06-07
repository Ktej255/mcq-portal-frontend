const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-30-day-simple-flow-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-30-day-simple-flow-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(({ studentProfileKey, geographyProgressKey }) => {
    const seededProgress = {};
    for (let day = 1; day <= 30; day += 1) {
      seededProgress[String(day)] = {
        day,
        watchState: "Queued",
        updatedAt: new Date().toISOString(),
      };
    }

    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_30_day_simple_flow");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "60",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      }),
    );
    window.localStorage.setItem(geographyProgressKey, JSON.stringify(seededProgress));
  }, { studentProfileKey: profileKey, geographyProgressKey: progressKey });

  for (let day = 1; day <= 30; day += 1) {
    await page.goto(`${baseUrl}/upsc/geography?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const today = page.getByTestId("geography-today-simple-entry");
    await today.waitFor({ timeout: 15000 });
    await today.getByText(`Day ${day} of 30`, { exact: true }).waitFor({ timeout: 15000 });
    await today.getByText("12 min", { exact: true }).waitFor({ timeout: 15000 });

    const funnel = page.getByTestId("geography-day-funnel");
    const stepCount = await funnel.locator(":scope > *").count();
    const funnelText = (await funnel.textContent()) ?? "";
    if (stepCount !== 3 || !funnelText.includes("Learn") || !funnelText.includes("Discuss") || !funnelText.includes("MCQ")) {
      throw new Error(`Day ${day} command funnel is not the three-step contract: ${funnelText}`);
    }
    if (/Visual Lab|Track|Revisit/.test(funnelText)) {
      throw new Error(`Day ${day} command funnel leaked optional surfaces: ${funnelText}`);
    }

    const commandMetrics = await assertNoOverflow(page, `geography-command-day-${day}`);
    checks.push({ day, commandDuration: "12 min", stepCount, commandMetrics });

    await page.goto(`${baseUrl}/upsc/geography/watch?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
    const watchDuration = (await page.getByTestId("watch-topic-duration").textContent())?.trim();
    if (watchDuration !== "12 min topic") {
      throw new Error(`Day ${day} lesson duration is ${watchDuration}`);
    }
    const watchPath = ((await page.getByTestId("geography-watch-path-strip").textContent()) ?? "").trim();
    const oneActionRule = ((await page.getByTestId("watch-one-action-rule").textContent()) ?? "").trim();
    if (
      !watchPath.includes("Lesson") ||
      !watchPath.includes("Discussion") ||
      !watchPath.includes("Fresh MCQ") ||
      !watchPath.includes("Next topic") ||
      !oneActionRule.includes("Use the green button")
    ) {
      throw new Error(`Day ${day} Watch funnel is not simple enough: ${watchPath} / ${oneActionRule}`);
    }
    const watchMetrics = await assertNoOverflow(page, `geography-watch-day-${day}`);
    checks[checks.length - 1].watchDuration = "12 min topic";
    checks[checks.length - 1].watchPath = watchPath;
    checks[checks.length - 1].watchMetrics = watchMetrics;
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography?day=30`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-today-simple-entry").getByText("Day 30 of 30", { exact: true }).waitFor({ timeout: 15000 });
  const mobileCommandMetrics = await assertNoOverflow(page, "geography-command-day-30-mobile");
  await page.goto(`${baseUrl}/upsc/geography/watch?day=30`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  const mobileWatchMetrics = await assertNoOverflow(page, "geography-watch-day-30-mobile");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    mobileCommandMetrics,
    mobileWatchMetrics,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        daysVerified: checks.length,
        allCommandDurations: [...new Set(checks.map((check) => check.commandDuration))],
        allWatchDurations: [...new Set(checks.map((check) => check.watchDuration))],
        mobileCommandMetrics,
        mobileWatchMetrics,
        consoleErrors,
        blockingConsoleErrors,
        pageErrors,
        passed: evidence.passed,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

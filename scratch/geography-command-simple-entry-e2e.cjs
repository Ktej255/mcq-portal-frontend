const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-command-simple-entry-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-command-simple-entry-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function assertNextAction(page, expectedHref, checks) {
  const panel = page.getByTestId("command-next-action");
  await panel.getByText("Do this now", { exact: false }).waitFor({ timeout: 15000 });
  const href = await panel.getByRole("link").getAttribute("href");
  checks.push({ label: "next-action-href", href });
  if (href !== expectedHref) {
    throw new Error(`Expected next action ${expectedHref}, got ${href}`);
  }
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(({ localProgressKey, localProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_command_simple_entry");
    window.localStorage.setItem(
      localProfileKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
    window.localStorage.removeItem(localProgressKey);
  }, { localProgressKey: progressKey, localProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-today-simple-entry").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-command-syllabus-anchor").waitFor({ timeout: 15000 });
  const syllabusAnchor = page.getByTestId("geography-command-syllabus-anchor");
  const syllabusText = ((await syllabusAnchor.textContent()) ?? "").trim();
  const syllabusOpenBeforeClick = await syllabusAnchor.evaluate((element) => element.hasAttribute("open"));
  const sourcePathVisibleBeforeOpen = await page.getByTestId("geography-command-source-path").isVisible().catch(() => false);
  checks.push({ label: "geography-syllabus-anchor", syllabusText, syllabusOpenBeforeClick, sourcePathVisibleBeforeOpen });
  if (!syllabusText.includes("GS Paper I") || !/Geography foundation/i.test(syllabusText) || syllabusOpenBeforeClick) {
    throw new Error(`Geography syllabus anchor mismatch: ${syllabusText}`);
  }
  if (sourcePathVisibleBeforeOpen) {
    throw new Error("Geography source path should stay folded until syllabus coverage is opened.");
  }
  await syllabusAnchor.locator("summary").click();
  await page.getByTestId("geography-command-source-path").waitFor({ timeout: 15000 });
  const geographySourcePath = await page.getByTestId("geography-command-source-path").evaluate((node) => ({
    pyqRows: node.getAttribute("data-pyq-row-count"),
    trendInsights: node.getAttribute("data-trend-insight-count"),
    readinessScore: node.getAttribute("data-readiness-score"),
    text: node.textContent || "",
    links: [...node.querySelectorAll("a")].map((anchor) => anchor.getAttribute("href")),
  }));
  checks.push({ label: "geography-command-source-path", geographySourcePath });
  if (
    Number(geographySourcePath.pyqRows) < 20 ||
    Number(geographySourcePath.trendInsights) < 2 ||
    !geographySourcePath.text.includes("NCERT basics") ||
    !geographySourcePath.text.includes("Reference depth") ||
    !geographySourcePath.text.includes("PYQ trend") ||
    !geographySourcePath.text.includes("Current affairs gate") ||
    !geographySourcePath.links.includes("/upsc/source-library") ||
    !geographySourcePath.links.includes("/upsc/current-affairs?subject=geography")
  ) {
    throw new Error(`Geography source path proof failed: ${JSON.stringify(geographySourcePath, null, 2)}`);
  }
  await assertNextAction(page, "/upsc/geography/talk?day=1", checks);
  await page.getByText("Open controls", { exact: false }).waitFor({ timeout: 15000 });
  const funnelVisibleBeforeOpen = await page.getByTestId("geography-day-funnel").isVisible();
  checks.push({ label: "funnel-hidden-before-open", funnelVisibleBeforeOpen });
  if (funnelVisibleBeforeOpen) {
    throw new Error("Geography day funnel should be folded on first load.");
  }
  await page.getByTestId("geography-command-funnel-details").locator("summary").click();
  await page.getByTestId("geography-day-funnel").getByText("Diagnose", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-day-funnel").getByText("Repair", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-day-funnel").getByText("MCQ", { exact: true }).waitFor({ timeout: 15000 });
  const funnelStepCount = await page.getByTestId("geography-day-funnel").locator(":scope > *").count();
  checks.push({ label: "geography-three-step-funnel", funnelStepCount });
  if (funnelStepCount !== 3) {
    throw new Error(`Geography day funnel exposed ${funnelStepCount} steps instead of three.`);
  }

  const mapVisibleBeforeOpen = await page.getByTestId("geography-30-day-map").isVisible();
  checks.push({ label: "map-hidden-before-optional-open", mapVisibleBeforeOpen });
  if (mapVisibleBeforeOpen) {
    throw new Error("30-day map should be folded inside optional controls on first load.");
  }
  await assertNoOverflow(page, "simple-entry-desktop", checks);

  await page.getByTestId("geography-command-advanced-controls").locator("summary").click();
  await page.getByTestId("geography-baseline-intake").waitFor({ timeout: 15000 });
  await page.getByText("Saved profile", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Advanced", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("120 min daily sitting", { exact: false }).waitFor({ timeout: 15000 });
  const baselineIntake = await page.getByTestId("geography-baseline-intake").textContent();
  const baselineDraftCount = await page.getByTestId("geography-command-baseline-draft").count();
  const baselineSaveCount = await page.getByTestId("geography-command-save-baseline").count();
  checks.push({
    label: "geography-command-no-baseline-editor",
    baselineText: baselineIntake?.trim(),
    baselineDraftCount,
    baselineSaveCount,
  });
  if (
    !baselineIntake?.includes("Student input rule") ||
    !baselineIntake.includes("The command page does not collect another baseline") ||
    baselineDraftCount !== 0 ||
    baselineSaveCount !== 0
  ) {
    throw new Error(`Simplified baseline rule failed: ${JSON.stringify({ baselineIntake, baselineDraftCount, baselineSaveCount })}`);
  }

  const futureWeekDay = page.getByTestId("geography-week-day-5");
  const futureMapDay = page.getByTestId("geography-day-10");
  const futureWeekDayDisabled = await futureWeekDay.isDisabled();
  const futureWeekDayState = await futureWeekDay.getAttribute("data-day-state");
  const futureMapDayDisabled = await futureMapDay.isDisabled();
  const futureMapDayState = await futureMapDay.getAttribute("data-day-state");
  checks.push({
    label: "future-day-skip-controls-locked",
    futureWeekDayDisabled,
    futureWeekDayState,
    futureMapDayDisabled,
    futureMapDayState,
  });
  if (!futureWeekDayDisabled || futureWeekDayState !== "locked" || !futureMapDayDisabled || futureMapDayState !== "locked") {
    throw new Error("Future Geography day controls should stay locked until the current topic is cleared.");
  }

  await page.goto(`${baseUrl}/upsc/geography?day=10`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForFunction(() => window.location.href.endsWith("/upsc/geography?day=1"), null, { timeout: 15000 });
  const directFutureDayHeading = ((await page.getByTestId("geography-today-simple-entry").textContent()) ?? "").trim();
  checks.push({ label: "direct-future-day-url-clamped", url: page.url(), directFutureDayHeading });
  if (!directFutureDayHeading.includes("Day 1 of 30")) {
    throw new Error(`Untouched future Geography URL did not return to the current topic: ${directFutureDayHeading}`);
  }

  await page.evaluate((localProgressKey) => {
    window.localStorage.setItem(
      localProgressKey,
      JSON.stringify({
        1: {
          day: 1,
          mcqAttempted: true,
          mcqCompleted: true,
          mcqOutcome: "Command",
          confidence: "Command",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);
  await page.goto(`${baseUrl}/upsc/geography?day=2`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-command-advanced-controls").locator("summary").click();
  const previousReviewDay = page.getByTestId("geography-week-day-1");
  const nextFutureDay = page.getByTestId("geography-week-day-3");
  const previousReviewDayDisabled = await previousReviewDay.isDisabled();
  const previousReviewDayState = await previousReviewDay.getAttribute("data-day-state");
  const nextFutureDayDisabled = await nextFutureDay.isDisabled();
  const nextFutureDayState = await nextFutureDay.getAttribute("data-day-state");
  checks.push({
    label: "completed-day-review-remains-open",
    previousReviewDayDisabled,
    previousReviewDayState,
    nextFutureDayDisabled,
    nextFutureDayState,
  });
  if (previousReviewDayDisabled || previousReviewDayState !== "review" || !nextFutureDayDisabled || nextFutureDayState !== "locked") {
    throw new Error("Completed Geography days should remain reviewable while future unfinished days stay locked.");
  }
  await previousReviewDay.click();
  await page.waitForFunction(() => window.location.href.includes("day=1"), null, { timeout: 15000 });
  await assertNoOverflow(page, "optional-controls-open-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-today-simple-entry").waitFor({ timeout: 15000 });
  await assertNextAction(page, "/upsc/geography/talk?day=1", checks);
  const funnelVisibleMobile = await page.getByTestId("geography-day-funnel").isVisible();
  checks.push({ label: "funnel-hidden-before-open-mobile", funnelVisibleMobile });
  if (funnelVisibleMobile) {
    throw new Error("Geography day funnel should stay folded on mobile first load.");
  }
  const mapVisibleMobile = await page.getByTestId("geography-30-day-map").isVisible();
  checks.push({ label: "map-hidden-before-optional-open-mobile", mapVisibleMobile });
  if (mapVisibleMobile) {
    throw new Error("30-day map should stay folded on mobile first load.");
  }
  await assertNoOverflow(page, "simple-entry-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    finalUrl: page.url(),
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

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

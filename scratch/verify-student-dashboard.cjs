const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const authUserKey = "sarit-upsc-auth-user-v1";
const evidencePath = path.join(__dirname, "verify-student-dashboard-evidence.json");
const screenshotPath = path.join(__dirname, "verify-student-dashboard-final.png");
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

async function assertHref(locator, expectedHref, checks, label) {
  const href = await locator.getAttribute("href");
  checks.push({ label, href, expectedHref });
  if (href !== expectedHref) {
    throw new Error(`${label}: expected ${expectedHref}, got ${href}`);
  }
}

async function assertDashboardSurfaceIsSimple(page, checks, label) {
  const signalCount = await page.locator('[data-testid^="upsc-signal-"]').count();
  const todaysTaskVisible = await page.getByTestId("upsc-signal-todays-task").isVisible().catch(() => false);
  const todaysTaskPriority = await page.getByTestId("upsc-signal-todays-task").getAttribute("data-signal-priority");
  const monthlyPathCount = await page.locator('[data-testid="upsc-signal-monthly-path"]').count();
  const profileIntakeVisible = await page.getByTestId("upsc-profile-intake").isVisible().catch(() => false);
  const mainPathStrip = await page.getByTestId("upsc-main-path-strip").evaluate((node) => ({
    text: node.textContent || "",
    open: node.open,
  }));
  const oneActionRuleText = await page.getByTestId("upsc-one-action-rule").innerText();
  const dashboardVisibleMode = await page.getByTestId("upsc-simple-dashboard").getAttribute("data-visible-mode");
  const planningDrawerOpen = await page.getByTestId("upsc-planning-drawer").evaluate((node) =>
    node instanceof HTMLDetailsElement ? node.open : false
  );

  checks.push({
    label,
    signalCount,
    todaysTaskVisible,
    todaysTaskPriority,
    monthlyPathCount,
    profileIntakeVisible,
    mainPathStrip,
    oneActionRuleText,
    dashboardVisibleMode,
    planningDrawerOpen,
  });

  if (signalCount !== 4) {
    throw new Error(`${label}: expected 4 signal cards, got ${signalCount}`);
  }
  if (!todaysTaskVisible) {
    throw new Error(`${label}: Today's Task signal should be visible on the main dashboard`);
  }
  if (todaysTaskPriority !== "primary") {
    throw new Error(`${label}: Today's Task should be the dominant dashboard action`);
  }
  if (monthlyPathCount !== 0) {
    throw new Error(`${label}: monthly path signal should not be visible on the main dashboard`);
  }
  if (profileIntakeVisible) {
    throw new Error(`${label}: profile setup drawer should be hidden after setup`);
  }
  if (!mainPathStrip.text.includes("MCQ") || !mainPathStrip.text.includes("Next")) {
    throw new Error(`${label}: main path support detail should retain MCQ and automatic next topic: ${mainPathStrip.text}`);
  }
  if (mainPathStrip.open !== false || dashboardVisibleMode !== "four-signal-one-action") {
    throw new Error(`${label}: dashboard should keep the path support folded with one-action mode: ${JSON.stringify({ mainPathStrip, dashboardVisibleMode })}`);
  }
  if (!oneActionRuleText.includes("Use the main button only")) {
    throw new Error(`${label}: one-action rule copy missing: ${oneActionRuleText}`);
  }
  if (planningDrawerOpen) {
    throw new Error(`${label}: optional planning drawer should start closed`);
  }
}

async function seedSession(page, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileKey: profileStorageKey, progressKey: progressStorageKey, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_dashboard");
      window.localStorage.removeItem(profileStorageKey);
      window.localStorage.removeItem(progressStorageKey);
      if (seededProgress) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
      }
    },
    { profileKey, progressKey, seededProgress: progress }
  );
}

async function saveProfile(page) {
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "I attempted UPSC Prelims two or more times and need a recovery path" }).click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
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

  await seedSession(page);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await saveProfile(page);
  await assertDashboardSurfaceIsSimple(page, checks, "fresh-simple-surface");

  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/geography/talk?day=1", checks, "fresh-start-action");
  await assertHref(
    page.getByTestId("upsc-signal-learning-gap"),
    "/upsc/geography/talk?day=1",
    checks,
    "fresh-learning-gap"
  );
  await assertHref(
    page.getByTestId("upsc-signal-next-revision"),
    "/upsc/geography/revisit?day=1",
    checks,
    "fresh-next-revision"
  );
  await page.getByText("Not measured yet", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Day 1 recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Revise Geographic Thinking and Map Relationships on study Day 3.", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("balanced recall and repair", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-planning-drawer").locator("summary").first().click();
  await page.getByTestId("upsc-personal-plan-rules").getByText("Recall -> repair class -> fresh MCQ.", {
    exact: true,
  }).waitFor({ timeout: 15000 });
  const currentFlowRoomLinkCount = await page.getByTestId("upsc-today-task").locator("a").count();
  const orientationStepCount = await page.getByTestId("upsc-today-task").locator('[data-testid^="upsc-day-step-"]').count();
  checks.push({ label: "planning-drawer-read-only-orientation", currentFlowRoomLinkCount, orientationStepCount });
  if (currentFlowRoomLinkCount !== 0 || orientationStepCount !== 3) {
    throw new Error(
      `planning-drawer-read-only-orientation: expected zero room links and three orientation steps, got ${JSON.stringify({
        currentFlowRoomLinkCount,
        orientationStepCount,
      })}`
    );
  }
  await page.getByTestId("upsc-planning-drawer").locator("summary").first().click();
  await assertNoOverflow(page, "dashboard-fresh-desktop", checks);

  await seedSession(page, {
    1: {
      day: 1,
      talkScore: 76,
      talkBand: "Practice",
      talkNextRoute: "/upsc/geography/watch?day=1",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.evaluate((profileStorageKey) => {
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertDashboardSurfaceIsSimple(page, checks, "talk-clear-simple-surface");
  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/geography/watch?day=1", checks, "talk-clear-next-action");
  await assertHref(
    page.getByTestId("upsc-signal-next-revision"),
    "/upsc/geography/revisit?day=1",
    checks,
    "talk-clear-day-3-source-topic"
  );

  await page.evaluate((progressStorageKey) => {
    window.localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        1: {
          day: 1,
          watched: true,
          revisitQueued: true,
          talkScore: 58,
          talkBand: "Revisit",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertDashboardSurfaceIsSimple(page, checks, "revisit-simple-surface");
  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/geography/revisit?day=1", checks, "revisit-next-action");

  await page.evaluate((progressStorageKey) => {
    window.localStorage.removeItem(progressStorageKey);
  }, progressKey);

  const ctaChecks = [
    ["/reports", "student-gap-primary-action", "/upsc/geography/talk?day=1"],
    ["/revision", "student-revision-primary-action", "/upsc/geography/talk?day=1"],
    ["/history", "student-progress-primary-action", "/upsc/geography/talk?day=1"],
  ];

  for (const [route, testId, expectedHref] of ctaChecks) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 45000 });
    await assertHref(page.getByTestId(testId), expectedHref, checks, route);
    await assertNoOverflow(page, `${route}-desktop`, checks);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "dashboard-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_dashboard_logout");
      window.localStorage.setItem(authStorageKey, "authenticated-student-a");
      window.localStorage.setItem(profileStorageKey, JSON.stringify({ level: "advanced", updatedAt: new Date().toISOString() }));
      window.localStorage.setItem(progressStorageKey, JSON.stringify({ 1: { day: 1, watched: true, updatedAt: new Date().toISOString() } }));
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey }
  );
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("button", { name: "Exit" }).click();
  await page.waitForFunction(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) =>
      !window.localStorage.getItem("MOCK_TOKEN") &&
      !window.localStorage.getItem(profileStorageKey) &&
      !window.localStorage.getItem(progressStorageKey) &&
      !window.localStorage.getItem(authStorageKey),
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey },
    { timeout: 15000 }
  );
  const logoutState = await page.evaluate(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) => ({
      mockToken: window.localStorage.getItem("MOCK_TOKEN"),
      profile: window.localStorage.getItem(profileStorageKey),
      geographyProgress: window.localStorage.getItem(progressStorageKey),
      authenticatedUserMarker: window.localStorage.getItem(authStorageKey),
    }),
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey }
  );
  checks.push({ label: "logout-clears-local-learner-state", logoutState });

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

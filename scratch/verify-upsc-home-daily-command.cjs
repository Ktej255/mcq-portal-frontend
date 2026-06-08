const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-upsc-home-daily-command-evidence.json");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
}

async function seedUpscHome(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_upsc_home_daily_command");
    window.localStorage.setItem(
      "sarit-upsc-auth-user-v1",
      JSON.stringify({
        uid: "upsc-home-daily-command",
        email: "student@upsc.test",
        role: "student",
        displayName: "UPSC Student",
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-student-profile-v1",
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "90",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-daily-command-v1",
      JSON.stringify({
        subjectSlug: "geography",
        day: 1,
        note: "Keep the first day simple: recall, watch, talk, MCQ, revisit if needed.",
        updatedAt: new Date().toISOString(),
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        1: {
          day: 1,
          baselineKnowledge: "I know maps show direction and distance, but I cannot explain scale properly yet.",
          baselineSavedAt: new Date().toISOString(),
          watched: false,
          confidence: "Shaky",
          meTimeMood: "calm",
          meTimeCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  });
}

async function assertUpscHome(page, checks, label) {
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("daily-command-student-focus").waitFor({ timeout: 15000 });

  const dailyCommandFocus = await page.getByTestId("daily-command-student-focus").evaluate((node) => ({
    mode: node.getAttribute("data-visible-mode"),
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    nextActionHref: node.getAttribute("data-next-action-href"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
    readinessStatus: node.getAttribute("data-readiness-status"),
    readinessScore: node.getAttribute("data-readiness-score"),
    learningGap: node.getAttribute("data-learning-gap"),
    revisionHref: node.getAttribute("data-revision-href"),
    text: node.textContent || "",
  }));
  const signalCards = await page.locator('[data-testid^="daily-"]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute("data-testid"))
      .filter(Boolean)
      .slice(0, 40)
  );
  const oldDashboardCount = await page.locator('[data-testid="upsc-simple-dashboard"]').count();
  const learningDashboardCount = await page.locator('[data-testid="daily-learning-dashboard"]').count();
  const learningCards = await page.locator('[data-testid="daily-learning-dashboard"] [data-testid]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      testId: node.getAttribute("data-testid"),
      href: node.getAttribute("href"),
      text: node.textContent || "",
    }))
  );
  const primaryAction = await page.getByTestId("daily-command-primary-action").evaluate((node) => ({
    href: node.getAttribute("href"),
    label: node.getAttribute("data-next-action-label"),
    readiness: node.getAttribute("data-session-readiness"),
    text: node.textContent || "",
  }));
  const bodyText = await page.locator("body").innerText();
  const forbiddenInternalText = ["Forensic Debug Mode", "Critical Error", "validator", "SOVEREIGN"].filter((term) =>
    bodyText.includes(term)
  );

  checks.push({
    label,
    dailyCommandFocus,
    signalCards,
    oldDashboardCount,
    learningDashboardCount,
    learningCards,
    primaryAction,
    forbiddenInternalText,
  });

  if (dailyCommandFocus.mode !== "single-action-planner-proof") {
    throw new Error(`${label}: /upsc did not render the UPSC daily command focus`);
  }
  if (dailyCommandFocus.subject !== "geography" || dailyCommandFocus.day !== "1") {
    throw new Error(`${label}: expected Geography Day 1, got ${JSON.stringify(dailyCommandFocus)}`);
  }
  if (!dailyCommandFocus.nextActionHref || !dailyCommandFocus.nextActionLabel) {
    throw new Error(`${label}: next action proof missing ${JSON.stringify(dailyCommandFocus)}`);
  }
  if (!dailyCommandFocus.learningGap || !dailyCommandFocus.revisionHref) {
    throw new Error(`${label}: gap/revision proof missing ${JSON.stringify(dailyCommandFocus)}`);
  }
  if (!dailyCommandFocus.text.includes("Do this now")) {
    throw new Error(`${label}: simple primary instruction is missing`);
  }
  if (oldDashboardCount !== 0) {
    throw new Error(`${label}: /upsc should not render the older generic dashboard surface`);
  }
  if (learningDashboardCount !== 1) {
    throw new Error(`${label}: four-signal learning dashboard missing`);
  }
  const learningIds = learningCards.map((card) => card.testId).join("|");
  for (const required of ["daily-learning-gap", "daily-revision-signal", "daily-today-task", "daily-growth-signal"]) {
    if (!learningIds.includes(required)) {
      throw new Error(`${label}: missing ${required} in learning dashboard`);
    }
  }
  if (primaryAction.href !== dailyCommandFocus.nextActionHref || primaryAction.label !== dailyCommandFocus.nextActionLabel) {
    throw new Error(`${label}: primary action does not match focus contract ${JSON.stringify({ primaryAction, dailyCommandFocus })}`);
  }
  if (forbiddenInternalText.length) {
    throw new Error(`${label}: leaked internal/debug copy ${JSON.stringify(forbiddenInternalText)}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedUpscHome(page);
  await assertUpscHome(page, checks, "desktop");
  await assertNoOverflow(page, "desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await assertUpscHome(page, checks, "mobile");
  await assertNoOverflow(page, "mobile", checks);

  await browser.close();
  fs.writeFileSync(evidencePath, JSON.stringify({ baseUrl, checks, passed: true }, null, 2));

  if (consoleErrors.length || pageErrors.length) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }, null, 2));
  }

  console.log(JSON.stringify({ baseUrl, evidencePath, passed: true }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

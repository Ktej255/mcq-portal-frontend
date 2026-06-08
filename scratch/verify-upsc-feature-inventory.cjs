const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText,
  }));

  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
  if (hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (/ANTIGRAVITY|ANTI\s*GRAVITY/i.test(metrics.text)) {
    throw new Error(`${label} still contains retired branding.`);
  }

  return {
    label,
    url: metrics.url,
    clientWidth: metrics.clientWidth,
    scrollWidth: metrics.scrollWidth,
    bodyScrollWidth: metrics.bodyScrollWidth,
    hasHorizontalOverflow,
    containsOldBranding: false,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  const masterPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  masterPage.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  masterPage.on("pageerror", (error) => pageErrors.push(error.message));
  await masterPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_feature_inventory");
  });

  await masterPage.goto(`${baseUrl}/admin/feature-inventory`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await masterPage.getByTestId("admin-feature-inventory-page").waitFor({ timeout: 15000 });
  await masterPage.getByRole("heading", { name: "UPSC Portal Feature Inventory" }).waitFor({ timeout: 15000 });
  await masterPage.getByTestId("admin-release-gates").getByText("Stabilize before sharing", { exact: true }).waitFor();
  await masterPage.getByTestId("admin-release-gates").getByText("146 generated app routes", { exact: false }).waitFor();
  const launchVisionTracker = masterPage.getByTestId("admin-launch-vision-tracker");
  await launchVisionTracker.waitFor({ timeout: 15000 });
  await launchVisionTracker.getByText("Three-Day Launch Vision Tracker", { exact: true }).waitFor();
  await launchVisionTracker.getByText("11/16 ready locally", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Ready locally", { exact: true }).first().waitFor();
  await launchVisionTracker.getByText("Partial", { exact: true }).first().waitFor();
  await launchVisionTracker.getByText("Live action", { exact: true }).first().waitFor();
  await launchVisionTracker.getByText("Content gap", { exact: true }).first().waitFor();
  await launchVisionTracker.getByText("Rs 399 monthly plan plus yearly, 18-month, and three-year discount plans.", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Only current affairs linked to already covered static topics should be visible.", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Live stack", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Apply Supabase SQL, set production env vars, verify OAuth, and run same-account recovery.", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Geography launch pack", { exact: true }).waitFor();
  await launchVisionTracker.getByText("Attach final Day 1 lecture media, approve transcript, import fresh advanced MCQs, and run controlled tester receipts.", { exact: true }).waitFor();
  await masterPage.getByText("Verified local", { exact: true }).first().waitFor();
  await masterPage.getByText("External apply", { exact: true }).first().waitFor();
  await masterPage.getByText("Pricing and yearly planner", { exact: true }).waitFor();
  await masterPage.getByText("verify-pricing-planner.cjs", { exact: true }).first().waitFor();
  await masterPage.getByText("Syllabus, PYQ, and optional library", { exact: true }).waitFor();
  await masterPage.getByText("verify-syllabus-pyq-trend-library.cjs and verify-optional-subject-pages.cjs", { exact: true }).first().waitFor();
  await masterPage.getByText("Covered-topic current affairs", { exact: true }).waitFor();
  await masterPage.getByText("verify-current-affairs-bridge.cjs", { exact: true }).first().waitFor();
  await masterPage.getByText("solved Question Bank attempt for the same day", { exact: false }).waitFor();
  await masterPage.getByText("Reports and growth signal", { exact: true }).waitFor();
  await masterPage.getByText("verify-student-report-system.cjs", { exact: true }).first().waitFor();
  await masterPage.getByText("question-bank solved ledger", { exact: false }).first().waitFor();
  await masterPage.getByText("Adaptive question bank builder", { exact: true }).waitFor();
  await masterPage.getByText("verify-question-bank-builder.cjs", { exact: true }).first().waitFor();
  await masterPage.getByText("custom mixed sets across Easy, Medium, Hard, and PYQ-style questions", { exact: false }).waitFor();
  await masterPage.getByText("solved attempts feed the covered-topic current-affairs gate", { exact: false }).waitFor();
  await masterPage.getByText("60-second start check now saves the learner state plus a reset plan", { exact: false }).waitFor();
  await masterPage.getByText("Real Geography Day 1 pack", { exact: true }).first().waitFor();
  await masterPage.getByTestId("admin-corpus-summary").getByText("24,131", { exact: true }).waitFor();
  await masterPage.getByTestId("admin-corpus-summary").getByText("Verified public claims", { exact: true }).waitFor();
  await masterPage.getByTestId("admin-corpus-summary").getByText("0", { exact: true }).waitFor();
  const subjectMatrix = masterPage.getByTestId("admin-subject-readiness-matrix");
  await subjectMatrix.waitFor({ timeout: 15000 });
  await subjectMatrix.getByText("Subject Content Maturity", { exact: true }).waitFor();
  await subjectMatrix.getByText("201", { exact: true }).waitFor();
  await subjectMatrix.getByText("62", { exact: true }).waitFor();
  await subjectMatrix.locator("p").filter({ hasText: /^28$/ }).waitFor();
  await subjectMatrix.getByText("0 founder-approved live packs", { exact: true }).waitFor();
  await subjectMatrix.getByText("24 animation blueprints, 32 catalog topics, 7 labs", { exact: true }).waitFor();
  await subjectMatrix.getByText("Days 1 and 2 are portal-native drafts", { exact: false }).waitFor();
  await subjectMatrix.getByText("History", { exact: true }).waitFor();
  const day1Intake = masterPage.getByTestId("admin-geography-day1-intake");
  await day1Intake.waitFor({ timeout: 15000 });
  await day1Intake.getByText("Portal-native fallback active", { exact: true }).waitFor();
  await day1Intake.getByTestId("admin-geography-day1-media-contract").getByText("Awaiting approved URL", { exact: false }).waitFor();
  await day1Intake.getByText("Geography Foundation architecture", { exact: true }).waitFor();
  await day1Intake.getByText("India Map Intelligence value addition", { exact: true }).waitFor();
  await day1Intake.getByText("Final Day 1 lecture media", { exact: true }).waitFor();
  await day1Intake.getByText("Fresh Day 1 MCQ batch", { exact: true }).waitFor();
  checks.push(await assertNoOverflow(masterPage, "feature-inventory-desktop"));

  await masterPage.setViewportSize({ width: 390, height: 900 });
  await masterPage.goto(`${baseUrl}/admin/feature-inventory`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await masterPage.getByTestId("admin-feature-inventory-page").waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflow(masterPage, "feature-inventory-mobile"));

  const learnerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const learnerPage = await learnerContext.newPage();
  await learnerPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_sim_student_feature_inventory");
  });
  await learnerPage.goto(`${baseUrl}/admin/feature-inventory`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({
    label: "feature-inventory-learner-redirect",
    url: learnerPage.url(),
    redirectedToDashboard: learnerPage.url() === `${baseUrl}/dashboard`,
  });

  await browser.close();

  const unexpectedConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized")
  );
  if (unexpectedConsoleErrors.length || pageErrors.length) {
    throw new Error(JSON.stringify({ unexpectedConsoleErrors, pageErrors }, null, 2));
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        checks,
        consoleErrors,
        unexpectedConsoleErrors,
        pageErrors,
        passed: true,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

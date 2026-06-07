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
  await masterPage.getByText("Verified local", { exact: true }).first().waitFor();
  await masterPage.getByText("External apply", { exact: true }).first().waitFor();
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

  const learnerPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await learnerPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_STUDENT_feature_inventory");
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

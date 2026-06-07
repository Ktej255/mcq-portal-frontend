const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const forbiddenLegacyCopy = [
  "Total Students",
  "Active Tests",
  "Avg. Performance",
  "Live Attempts",
  "Engagement Trends",
  "Physics",
  "Chemistry",
  "Tab Switches",
  "Multiple Logins",
  "Rapid Responses",
  "Recalibrate Intelligence",
  "12,482",
];

async function assertDashboard(page, label) {
  await page.getByTestId("admin-operator-dashboard").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "UPSC Operator Console", exact: true }).waitFor();
  await page.getByText("Verified Local Snapshot", { exact: true }).waitFor();
  await page.getByText("Geography local funnel", { exact: true }).waitFor();
  await page.getByText("Real student readiness", { exact: true }).waitFor();
  await page.getByTestId("admin-dashboard-release-gates").getByText("3/8 closed", { exact: true }).waitFor();
  await page.getByTestId("admin-dashboard-action-queue").getByText("Apply Supabase learner-state migration", { exact: true }).waitFor();
  await page.getByTestId("admin-dashboard-action-queue").getByText("Load real Geography Day 1 assets", { exact: true }).waitFor();
  await page.getByTestId("admin-dashboard-day1-decision").getByText("Inspect Day 1 Sources", { exact: true }).waitFor();
  await page.getByTestId("admin-dashboard-corpus-summary").getByText("24,131", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Feature Inventory", exact: true }).first().waitFor();

  const metrics = await page.evaluate((legacyCopy) => {
    const text = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      containsOldBranding: /ANTIGRAVITY|ANTI\s*GRAVITY/i.test(text),
      forbiddenLegacyHits: legacyCopy.filter((item) => text.includes(item)),
    };
  }, forbiddenLegacyCopy);

  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
  if (hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still contains retired branding.`);
  }
  if (metrics.forbiddenLegacyHits.length) {
    throw new Error(`${label} still contains legacy demo copy: ${JSON.stringify(metrics.forbiddenLegacyHits)}`);
  }

  return { label, ...metrics, hasHorizontalOverflow };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_operator_dashboard");
  });

  await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
  checks.push(await assertDashboard(page, "operator-dashboard-desktop"));

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
  checks.push(await assertDashboard(page, "operator-dashboard-mobile"));

  const learnerPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await learnerPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_STUDENT_operator_dashboard");
  });
  await learnerPage.goto(`${baseUrl}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({
    label: "operator-dashboard-learner-redirect",
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

const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";

async function assertNoOverflowOrRetiredBranding(page, label) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText,
  }));
  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
  if (hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (/ANTIGRAVITY|ANTI\s*GRAVITY/i.test(metrics.text)) throw new Error(`${label} still contains retired branding.`);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_admin_route_isolation");
  });

  await masterPage.goto(`${baseUrl}/admin/founder`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("admin-founder-review-page").waitFor({ timeout: 15000 });
  await masterPage.getByRole("heading", { name: "Geography Pilot Review Center", exact: true }).waitFor();
  await masterPage.getByTestId("admin-founder-surface-checklist").getByText("Seven-Point Founder Checklist", { exact: true }).waitFor();
  await masterPage.getByTestId("admin-founder-release-gates").getByText("Live Supabase learner-state migration", { exact: true }).waitFor();
  const founderText = await masterPage.locator("body").innerText();
  for (const forbidden of ["OPERATIONAL STABILITY: 100%", "78.4%", "94.2%", "Student Burnout Risk", "Revision Avoidance Cluster"]) {
    if (founderText.includes(forbidden)) throw new Error(`Founder review still contains fabricated metric: ${forbidden}`);
  }
  checks.push(await assertNoOverflowOrRetiredBranding(masterPage, "founder-review-desktop"));

  await masterPage.setViewportSize({ width: 390, height: 900 });
  await masterPage.goto(`${baseUrl}/admin/founder`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("admin-founder-review-page").waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflowOrRetiredBranding(masterPage, "founder-review-mobile"));

  await masterPage.setViewportSize({ width: 1280, height: 900 });
  const isolatedRoutes = [
    {
      path: "/admin/observability",
      testId: "admin-observability-isolated",
      title: "Legacy Observability",
    },
    {
      path: "/admin/analytics",
      testId: "admin-analytics-isolated",
      title: "Student Analytics",
    },
    {
      path: "/admin/tests",
      testId: "admin-tests-isolated",
      title: "Legacy Test Management",
    },
  ];

  for (const route of isolatedRoutes) {
    await masterPage.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await masterPage.getByTestId(route.testId).waitFor({ timeout: 15000 });
    await masterPage.getByRole("heading", { name: route.title, exact: true }).waitFor();
    await masterPage.getByText("Internal Route Isolated", { exact: true }).waitFor();
    checks.push(await assertNoOverflowOrRetiredBranding(masterPage, route.path));
  }

  await masterPage.goto(`${baseUrl}/admin/integrity`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("admin-integrity-page").waitFor({ timeout: 15000 });
  await masterPage.getByText("Local controls visible", { exact: true }).waitFor();
  await masterPage.getByText("Legacy MCQ publishing API is disabled by default", { exact: false }).waitFor();
  const integrityText = await masterPage.locator("body").innerText();
  if (integrityText.includes("Local Audit Healthy")) {
    throw new Error("Integrity Logs still implies a completed live audit.");
  }
  checks.push(await assertNoOverflowOrRetiredBranding(masterPage, "/admin/integrity"));

  const learnerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const learnerPage = await learnerContext.newPage();
  await learnerPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_STUDENT_founder_review");
  });
  await learnerPage.goto(`${baseUrl}/admin/founder`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({
    label: "founder-review-learner-redirect",
    url: learnerPage.url(),
    redirectedToDashboard: learnerPage.url() === `${baseUrl}/dashboard`,
  });
  await learnerContext.close();

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

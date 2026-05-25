const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-upsc-shell-standardization-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function collectMetrics(page, label) {
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      bodyText: document.body.innerText,
    }));
    checks.push({
      label,
      url: page.url(),
      clientWidth: metrics.clientWidth,
      scrollWidth: metrics.scrollWidth,
      bodyScrollWidth: metrics.bodyScrollWidth,
      hasHorizontalOverflow: metrics.hasHorizontalOverflow,
      containsMcqPortal: metrics.bodyText.includes("MCQ Portal"),
    });
    return metrics;
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[mobile] ${message.text()}`);
  });
  mobile.on("pageerror", (error) => pageErrors.push(`[mobile] ${error.message}`));

  await mobile.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=10`, { waitUntil: "domcontentloaded" });
  await mobile.locator("header").getByText("UPSC Command", { exact: false }).first().waitFor({ timeout: 15000 });
  await mobile.locator("header").getByText("Geography Command", { exact: false }).first().waitFor({ timeout: 15000 });
  const mobileMetrics = await collectMetrics(mobile, "mobile-geography-shell");
  await mobile.screenshot({ path: path.join(__dirname, "verify-upsc-shell-mobile-geography.png"), fullPage: true });

  if (mobileMetrics.bodyText.includes("MCQ Portal")) {
    throw new Error("Mobile UPSC shell still displays MCQ Portal.");
  }
  if (mobileMetrics.hasHorizontalOverflow) {
    throw new Error(`Mobile UPSC shell has horizontal overflow: ${JSON.stringify(mobileMetrics)}`);
  }

  await mobile.getByRole("button", { name: /Open navigation/i }).click();
  const activeUpscLink = mobile.getByRole("link", { name: /UPSC Portal/i }).first();
  await activeUpscLink.waitFor({ timeout: 15000 });
  const activeClass = await activeUpscLink.getAttribute("class");
  checks.push({
    label: "mobile-nested-upsc-nav-active",
    activeClass,
    isNestedRouteHighlighted: Boolean(activeClass && activeClass.includes("bg-zinc-900")),
  });
  if (!activeClass || !activeClass.includes("bg-zinc-900")) {
    throw new Error(`UPSC sidebar link is not active for nested route. Class: ${activeClass}`);
  }
  await mobile.close();

  const desktop = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  desktop.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[desktop] ${message.text()}`);
  });
  desktop.on("pageerror", (error) => pageErrors.push(`[desktop] ${error.message}`));

  const routeTitleChecks = [
    { path: "/upsc/economy", title: "Economy Command" },
    { path: "/upsc/science-tech/watch?day=1", title: "Science and Tech Command" },
    { path: "/upsc/readiness-audit", title: "Readiness Audit" },
  ];

  for (const route of routeTitleChecks) {
    await desktop.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    await desktop.locator("header").getByText(route.title, { exact: false }).last().waitFor({ timeout: 15000 });
    const metrics = await collectMetrics(desktop, `desktop-${route.title}`);
    if (metrics.bodyText.includes("MCQ Portal")) {
      throw new Error(`${route.path} still displays MCQ Portal.`);
    }
    if (metrics.hasHorizontalOverflow) {
      throw new Error(`${route.path} has horizontal overflow: ${JSON.stringify(metrics)}`);
    }
  }
  await desktop.close();

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
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

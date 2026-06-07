const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const contentKey = "sarit-upsc-content-command-v1";
const evidencePath = path.join(__dirname, "geography-content-pack-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-content-pack-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still contains old protected branding.`);
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
  await page.evaluate((key) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_content_pack");
    window.localStorage.removeItem(key);
  }, contentKey);

  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page
    .getByTestId("content-pack-preview")
    .getByText("Geographic Thinking and Map Relationships", { exact: true })
    .waitFor({ timeout: 15000 });
  await page.getByTestId("content-pack-preview").getByText("what and where to why", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("IN PROGRESS", { exact: true }).waitFor({ timeout: 15000 });
  const dayOneNote = await page.locator("textarea").inputValue();
  if (!dayOneNote.includes("portal-native foundation draft") || !dayOneNote.includes("Final recorded lecture media")) {
    throw new Error(`Day 1 rehearsal note did not preserve the honest media boundary: ${dayOneNote}`);
  }
  await assertNoOverflow(page, "content-command-day1-pack", checks);

  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=2`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByText("IN PROGRESS", { exact: true }).waitFor({ timeout: 15000 });
  const dayTwoNote = await page.locator("textarea").inputValue();
  if (!dayTwoNote.includes("Day 2 portal-native visual lesson is source-backed") || !dayTwoNote.includes("Final recorded media")) {
    throw new Error(`Day 2 did not expose the honest portal-native visual boundary: ${dayTwoNote}`);
  }
  await assertNoOverflow(page, "content-command-day2-source-backed-draft", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("IN PROGRESS", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "content-command-day1-pack-mobile", checks);
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

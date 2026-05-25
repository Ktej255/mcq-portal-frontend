const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const contentKey = "sarit-upsc-content-command-v1";
const evidencePath = path.join(__dirname, "geography-week4-content-pack-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-week4-content-pack-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const finalBlockChecks = [
  [22, "Atlas Mastery"],
  [23, "PYQ Pattern Reading"],
  [24, "Disaster Geography Bridge"],
  [25, "Environment Geography Bridge"],
  [26, "Mains Geography Application"],
  [27, "Full Geography Drill"],
  [28, "Weak Area Repair"],
  [29, "Final Mock and Review"],
  [30, "Geography Command Day"],
];

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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_week4_content_pack");
    window.localStorage.removeItem(key);
  }, contentKey);

  for (const [day, title] of finalBlockChecks) {
    await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=${day}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.getByTestId("content-pack-preview").locator("h3").filter({ hasText: title }).waitFor({ timeout: 15000 });
    await page.getByTestId("content-pack-preview").locator("p").filter({ hasText: "UPSC trap" }).first().waitFor({ timeout: 15000 });
    await page.getByText("READY", { exact: true }).first().waitFor({ timeout: 15000 });
    await assertNoOverflow(page, `content-command-final-block-day-${day}`, checks);
  }

  await page.goto(`${baseUrl}/upsc/content-command?subject=environment&day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByText("IN PROGRESS", { exact: true }).waitFor({ timeout: 15000 });
  const environmentNote = await page.locator("textarea").inputValue();
  if (!environmentNote.includes("Planned placeholder: content is not broken")) {
    throw new Error(`Environment should remain a planned placeholder until its real pack is staged: ${environmentNote}`);
  }
  await assertNoOverflow(page, "content-command-environment-placeholder", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=24`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-content-asset-gate").getByText("Institutional content ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-content-pack-preview").locator("p").filter({ hasText: "Disaster Geography Bridge" }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-content-pack-preview").locator("p").filter({ hasText: "UPSC trap" }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day24-final-pack", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=30`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-content-pack-preview").locator("p").filter({ hasText: "Geography Command Day" }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day30-command-pack-mobile", checks);
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

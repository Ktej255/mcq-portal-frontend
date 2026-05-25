const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const contentKey = "sarit-upsc-content-command-v1";
const evidencePath = path.join(__dirname, "geography-week1-content-pack-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-week1-content-pack-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const weekOneChecks = [
  [1, "Earth as a System: Origin"],
  [2, "Interior of the Earth: Layers"],
  [3, "Plate Tectonics: Drift"],
  [4, "Geomorphic Processes"],
  [5, "Climatology Base"],
  [6, "Ocean System"],
  [7, "Physical Geography Consolidation"],
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_week1_content_pack");
    window.localStorage.removeItem(key);
  }, contentKey);

  for (const [day, title] of weekOneChecks) {
    await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=${day}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.getByTestId("content-pack-preview").getByText(title, { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("content-pack-preview").locator("p").filter({ hasText: "UPSC trap" }).first().waitFor({ timeout: 15000 });
    await page.getByText("READY", { exact: true }).first().waitFor({ timeout: 15000 });
    await assertNoOverflow(page, `content-command-week1-day-${day}`, checks);
  }

  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=8`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByText("IN PROGRESS", { exact: true }).waitFor({ timeout: 15000 });
  const dayEightNote = await page.locator("textarea").inputValue();
  if (!dayEightNote.includes("Planned placeholder: content is not broken")) {
    throw new Error(`Day 8 should remain a planned placeholder until Week 2 pack is staged: ${dayEightNote}`);
  }
  await assertNoOverflow(page, "content-command-day8-placeholder", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=6`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-content-asset-gate").getByText("Institutional content ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-content-pack-preview").getByText("Ocean System", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-content-pack-preview").locator("p").filter({ hasText: "UPSC trap" }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day6-week1-pack", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=7`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-content-pack-preview").getByText("Physical Geography Consolidation", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day7-week1-pack-mobile", checks);
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

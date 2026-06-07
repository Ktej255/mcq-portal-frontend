const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-diagnostic-first-loop-evidence.json");

async function readStorage(page, key) {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 980 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
    localStorage.removeItem("sarit-upsc-environment-progress-v1");
    localStorage.removeItem("sarit-upsc-geography-progress-v1");
  });

  await page.goto(`${baseUrl}/upsc/environment/watch?day=1`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="subject-baseline-check"]', { timeout: 15000 });
  const environmentBaseline = "I know biodiversity links species, habitat, protected areas, and human pressure.";
  await page.fill('[data-testid="subject-baseline-draft"]', environmentBaseline);
  await page.click('[data-testid="subject-save-baseline"]');
  await page.click('[data-testid="watch-complete-and-discuss"]');
  await page.waitForURL(/\/upsc\/environment\/talk\?day=1/, { timeout: 15000 });
  await page.waitForSelector('[data-testid="subject-talk-baseline"]', { timeout: 15000 });
  const environmentTalkBaseline = await page.locator('[data-testid="subject-talk-baseline-draft"]').inputValue();
  const environmentStorage = await readStorage(page, "sarit-upsc-environment-progress-v1");

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="geography-baseline-check"]', { timeout: 15000 });
  const geographyBaseline = "I know Earth movements connect latitude, rotation, seasons, and UPSC map traps.";
  await page.fill('[data-testid="geography-baseline-draft"]', geographyBaseline);
  await page.click('[data-testid="geography-save-baseline"]');
  await page.click('[data-testid="watch-complete-and-discuss"]');
  await page.waitForURL(/\/upsc\/geography\/talk\?day=1/, { timeout: 15000 });
  await page.waitForSelector('[data-testid="geography-talk-baseline"]', { timeout: 15000 });
  const geographyTalkBaseline = await page.locator('[data-testid="geography-talk-baseline-draft"]').inputValue();
  const geographyStorage = await readStorage(page, "sarit-upsc-geography-progress-v1");

  const checks = {
    environmentBaselineSaved: environmentStorage?.["1"]?.baselineKnowledge === environmentBaseline,
    environmentBaselineVisibleInTalk: environmentTalkBaseline === environmentBaseline,
    environmentWatchMarkedComplete: environmentStorage?.["1"]?.watched === true,
    geographyBaselineSaved: geographyStorage?.["1"]?.baselineKnowledge === geographyBaseline,
    geographyBaselineVisibleInTalk: geographyTalkBaseline === geographyBaseline,
    geographyWatchMarkedComplete: geographyStorage?.["1"]?.watched === true,
    consoleErrors,
    pageErrors,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(checks, null, 2));
  await browser.close();

  const failed = Object.entries(checks).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== true;
  });

  if (failed.length) {
    console.error(JSON.stringify(checks, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(checks, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

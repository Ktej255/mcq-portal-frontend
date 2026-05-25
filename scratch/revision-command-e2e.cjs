const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "revision-command-e2e-evidence.json");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function seedProgress(page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        3: {
          day: 3,
          watched: true,
          watchState: "Watched",
          confidence: "Shaky",
          reflection: "Monsoon logic needs map repair.",
          revisitQueued: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-history-progress-v1",
      JSON.stringify({
        4: {
          day: 4,
          watched: true,
          watchState: "Watched",
          confidence: "Shaky",
          reflection: "Revolt of 1857 chronology is not stable.",
          revisitQueued: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-economy-progress-v1",
      JSON.stringify({
        2: {
          day: 2,
          watched: true,
          watchState: "Watched",
          confidence: "Command",
          reflection: "National income concepts are stable.",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  });
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

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle" });
  await seedProgress(page);
  await page.getByRole("link", { name: /Open Revision Command/i }).first().click();
  await page.waitForURL("**/upsc/revision-command", { timeout: 15000 });
  await page.getByText("One dashboard for every subject queue.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Global repair queue", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Geography / Day 3", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("History / Day 4", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Economy", { exact: true }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revision-command-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Revision Command", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revision-command-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "revision-command-final.png"), fullPage: true });
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

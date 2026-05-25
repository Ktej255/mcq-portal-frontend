const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "mcq-command-e2e-evidence.json");
const storageKey = "sarit-upsc-mcq-command-v1";

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

async function seedBatchState(page) {
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "GEO-D03": {
          planned: 25,
          drafted: 25,
          difficulty: "MEDIUM",
          status: "READY",
          updatedAt: new Date().toISOString(),
        },
        "HIS-D04": {
          planned: 25,
          drafted: 5,
          difficulty: "HARD",
          status: "DRAFT",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
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
  await seedBatchState(page);
  const dashboardHref = await page.getByRole("link", { name: /Open MCQ Command/i }).first().getAttribute("href");
  if (dashboardHref !== "/upsc/mcq-command") {
    throw new Error(`Dashboard MCQ Command link is not wired correctly: ${dashboardHref}`);
  }
  await page.goto(`${baseUrl}/upsc/mcq-command`, { waitUntil: "networkidle" });
  await page.getByText("Build fresh MCQs against every class day.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-command-desktop-geography", checks);

  await page.getByRole("button", { name: /December-January\s+History/i }).click();
  await page.getByRole("button", { name: /HIS-D04/i }).click();
  await page.getByText("Revolt of 1857", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Mark ready/i }).click();
  await page.getByText("25/25 drafted", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("READY", { exact: true }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-command-desktop-history-ready", checks);

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}"), storageKey);
  if (stored["HIS-D04"]?.status !== "READY" || stored["HIS-D04"]?.drafted !== 25) {
    throw new Error(`History batch state did not persist as ready: ${JSON.stringify(stored["HIS-D04"])}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("MCQ Command", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-command-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    storedHistoryBatch: stored["HIS-D04"],
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "mcq-command-final.png"), fullPage: true });
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

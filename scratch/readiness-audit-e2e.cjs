const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "readiness-audit-e2e-evidence.json");

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

async function seedAuditState(page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "sarit-upsc-content-command-v1",
      JSON.stringify({
        "geography:D03": {
          videoStatus: "Ready",
          notesStatus: "Ready",
          transcriptStatus: "Ready",
          sourceType: "Demo",
          contentNote: "Monsoon class ready.",
          updatedAt: new Date().toISOString(),
        },
        "history:D04": {
          videoStatus: "Ready",
          notesStatus: "Ready",
          transcriptStatus: "Ready",
          sourceType: "Recorded",
          contentNote: "1857 class ready.",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-mcq-command-v1",
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
          drafted: 25,
          difficulty: "HARD",
          status: "READY",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        3: {
          day: 3,
          watched: true,
          watchState: "Watched",
          confidence: "Shaky",
          reflection: "Monsoon logic needs one more map pass.",
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
          confidence: "Working",
          reflection: "Revolt of 1857 causes and consequences revised.",
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

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await seedAuditState(page);
  const dashboardHref = await page.getByRole("link", { name: /Open Readiness Audit/i }).first().getAttribute("href");
  if (dashboardHref !== "/upsc/readiness-audit") {
    throw new Error(`Dashboard Readiness Audit link is not wired correctly: ${dashboardHref}`);
  }

  await page.goto(`${baseUrl}/upsc/readiness-audit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Audit the UPSC portal before launch.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Structural modules", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Content readiness", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Geography", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByText("History", { exact: true }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "readiness-audit-desktop", checks);

  await page.getByRole("button", { name: /Refresh local audit/i }).click();
  await page.getByText("Local launch score", { exact: false }).first().waitFor({ timeout: 15000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Readiness Audit", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "readiness-audit-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "readiness-audit-final.png"), fullPage: true });
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-watch-scenes-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-watch-scenes-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentScenes(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/watch?day=4`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-watch-scene-engine").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-watch-scene-list").waitFor({ timeout: 15000 });
    await page.getByText("1. Class briefing", { exact: false }).waitFor({ timeout: 15000 });

    await page.getByTestId("subject-watch-scene-complete").click();
    await page.getByText("2. Core mechanism", { exact: false }).waitFor({ timeout: 15000 });

    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId("subject-watch-scene-complete").click();
    }

    await page.getByText("5/5 complete", { exact: false }).waitFor({ timeout: 15000 });
    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["4"] : null;
    }, storageKey("environment"));
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });

    checks.push({ viewport: viewportName, route: "environment-watch", progress, metrics: pageMetrics });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Watch has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (!progress?.watched || progress?.watchState !== "Watched" || progress?.watchSceneCompletedIds?.length !== 5) {
      throw new Error(`Environment Watch scene progress did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifySecondSubject() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/economy/watch?day=2`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("subject-watch-scene-engine").waitFor({ timeout: 15000 });
    await page.getByText("Applied proof", { exact: false }).first().waitFor({ timeout: 15000 });
    const pageMetrics = await metrics(page);
    checks.push({ viewport: "desktop", route: "economy-watch", metrics: pageMetrics });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Watch has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentScenes("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentScenes("mobile", { width: 390, height: 844 });
  await verifySecondSubject();

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

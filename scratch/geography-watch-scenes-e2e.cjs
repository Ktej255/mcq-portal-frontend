const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-watch-scenes-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

async function getProgress(page, day) {
  return page.evaluate(
    ({ storageKey: key, day: selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { storageKey, day }
  );
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=7`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });

  await page.getByTestId("watch-scene-engine").getByText("Scene playback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-scene-list").getByText("Scene 1", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-scenes-initial", checks);

  await page.getByTestId("watch-scene-complete").click();
  await page.getByTestId("watch-scene-engine").getByText("2. Core mechanism", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-after-first-scene", checks);

  let progress = await getProgress(page, 7);
  if (
    progress?.watchState !== "In class" ||
    progress?.watchSceneIndex !== 1 ||
    !Array.isArray(progress?.watchSceneCompletedIds) ||
    progress.watchSceneCompletedIds.length !== 1 ||
    progress?.watched !== false
  ) {
    throw new Error(`First scene progress did not persist: ${JSON.stringify(progress)}`);
  }

  for (let i = 0; i < 4; i += 1) {
    await page.getByTestId("watch-scene-complete").click();
  }
  await page.getByText("Class progress saved locally", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-scene-engine").getByText("5/5 complete", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-after-all-scenes", checks);

  progress = await getProgress(page, 7);
  if (
    progress?.watched !== true ||
    progress?.watchState !== "Watched" ||
    progress?.watchSceneIndex !== 4 ||
    !Array.isArray(progress?.watchSceneCompletedIds) ||
    progress.watchSceneCompletedIds.length !== 5
  ) {
    throw new Error(`All scene progress did not persist: ${JSON.stringify(progress)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-scene-engine").getByText("Scene playback", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-scenes-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-watch-scenes-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    progress,
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

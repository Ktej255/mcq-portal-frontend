const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const contentStorageKey = "sarit-upsc-content-command-v1";
const evidencePath = path.join(__dirname, "geography-watch-room-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-watch-room-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function metrics(page) {
  return page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function assertNoOverflow(page, label, checks) {
  const pageMetrics = await metrics(page);
  checks.push({ label, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
  }
}

async function readProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)],
    { key: storageKey, selectedDay: day }
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

  await page.goto(`${baseUrl}/upsc/geography/talk?day=9`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ progressKey, contentKey }) => {
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(contentKey);
    },
    { progressKey: storageKey, contentKey: contentStorageKey }
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("talk-route-gate").getByText("Watch room required", { exact: false }).waitFor({ timeout: 15000 });
  const watchHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (watchHref !== "/upsc/geography/watch?day=9") {
    throw new Error(`Expected Talk gate to route back to Watch, got ${watchHref}`);
  }
  await assertNoOverflow(page, "talk-watch-gate", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=9`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("watch-demo-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-content-asset-gate").getByText("Demo fallback active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-demo-player").getByText("Demo fallback active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-route-gate").getByText("Complete class scenes first", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-initial", checks);

  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "geography:D09": {
          videoStatus: "Ready",
          notesStatus: "Ready",
          transcriptStatus: "Ready",
          sourceType: "Recorded",
          contentNote: "Recorded India physiography class is ready for the Watch room.",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, contentStorageKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("watch-content-asset-gate").getByText("Institutional content ready", { exact: false }).waitFor({
    timeout: 15000,
  });
  await page.getByTestId("watch-demo-player").getByText("Institutional content ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-content-ready", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["9"];
        return (day?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("watch-route-gate").getByText("AI teacher unlocked", { exact: false }).waitFor({ timeout: 15000 });
  const stored = await readProgress(page, 9);
  if (!stored?.watched || stored?.watchState !== "Watched" || stored?.watchSceneCompletedIds?.length !== 5) {
    throw new Error(`Watch room did not save complete proof: ${JSON.stringify(stored)}`);
  }
  checks.push({
    label: "stored-watch-proof",
    watched: stored.watched,
    watchState: stored.watchState,
    watchSceneCompletedIds: stored.watchSceneCompletedIds,
  });
  await assertNoOverflow(page, "watch-complete", checks);

  await page.getByTestId("watch-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=9", { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-after-watch-proof", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    watchHref,
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

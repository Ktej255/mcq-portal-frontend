const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const contentStorageKey = "sarit-upsc-content-command-v1";
const profileKey = "sarit-upsc-student-profile-v1";
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

  await page.addInitScript(({ studentProfileKey }) => {
    const token = "MOCK_TOKEN_geography_watch_room";
    window.MOCK_TOKEN = token;
    window.localStorage.setItem("MOCK_TOKEN", token);
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, { studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography/talk?day=9`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ progressKey, contentKey }) => {
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(contentKey);
    },
    { progressKey: storageKey, contentKey: contentStorageKey }
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("talk-flow-gate").getByText("Finish the lesson first", { exact: false }).waitFor({ timeout: 15000 });
  const watchHref = await page.getByTestId("talk-flow-gate-action").getAttribute("href");
  if (watchHref !== "/upsc/geography/watch?day=9") {
    throw new Error(`Expected Talk gate to route back to Watch, got ${watchHref}`);
  }
  await assertNoOverflow(page, "talk-watch-gate", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=9`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("geography-watch-simple-repair").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-current-action").getByText("Finish lesson and discuss", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-watch-checkpoints").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-complete-and-discuss").waitFor({ timeout: 15000 });
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
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-current-action").getByText("Finish lesson and discuss", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-content-ready", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=9", { timeout: 15000 });

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
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-discussion-surface").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-assess-answer").waitFor({ timeout: 15000 });
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

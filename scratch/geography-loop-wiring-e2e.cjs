const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-loop-wiring-e2e-evidence.json");
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

  await page.goto(`${baseUrl}/upsc/geography?day=10`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ key, studentProfileKey }) => {
      const token = "MOCK_TOKEN_MASTER_geography_loop_wiring";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(key, JSON.stringify({ "10": { day: 10 } }));
    },
    { key: storageKey, studentProfileKey: profileKey }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("geography-today-simple-entry").waitFor({ timeout: 15000 });
  await page.getByTestId("command-next-action").locator("a").first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "command-day-10", checks);

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=10`, { waitUntil: "networkidle" });
  await page.getByText("MCQ LOCKED", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-day-10", checks);

  await page.goto(`${baseUrl}/upsc/geography?day=10`, { waitUntil: "networkidle" });
  await page.getByTestId("command-next-action").locator("a").first().click();
  await page.waitForURL("**/upsc/geography/watch?day=10", { timeout: 15000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day-10-demo-ready", checks);
  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=10", { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-day-10", checks);

  await page.getByTestId("talk-answer-draft").fill(
    "I do not know Indian Monsoon yet."
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });

  const queuedProgress = await getProgress(page, 10);
  if (
    !queuedProgress?.reflection ||
    queuedProgress.confidence !== "Shaky" ||
    queuedProgress.revisitQueued !== true ||
    queuedProgress.talkBand !== "Revisit" ||
    typeof queuedProgress.talkScore !== "number"
  ) {
    throw new Error(`Talk progress did not persist correctly: ${JSON.stringify(queuedProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Day 10", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-with-revisit-day-10", checks);

  await page.getByTestId("geography-track-focused-route").click();
  await page.waitForURL("**/upsc/geography/revisit?day=10", { timeout: 15000 });
  await page.getByTestId("geography-revisit-simple-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-day-10", checks);

  await page.getByTestId("revisit-repair-note").fill(
    "I confused monsoon rainfall with a single pressure factor. Now I can explain ITCZ, jet streams, onset, break, retreat and map exceptions."
  );
  await page.getByTestId("revisit-complete-and-talk").click();
  await page.waitForURL("**/upsc/geography/talk?day=10", { timeout: 15000 });

  const recoveredProgress = await getProgress(page, 10);
  if (
    recoveredProgress?.revisitQueued !== false ||
    recoveredProgress?.recoveryCompleted !== true ||
    recoveredProgress?.recoveryStatus !== "talk-ready"
  ) {
    throw new Error(`Revisit recovery did not persist correctly: ${JSON.stringify(recoveredProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-after-recovery", checks);

  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    queuedProgress,
    recoveredProgress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors: consoleErrors.filter(
      (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
    ),
    pageErrors,
    passed:
      consoleErrors.every((message) => allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))) &&
      pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "geography-loop-wiring-final.png"), fullPage: true });
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});

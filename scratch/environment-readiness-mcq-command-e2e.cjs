const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "environment-readiness-mcq-command-e2e-evidence.json");
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

async function seedBase(page, progressPatch = {}) {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey, progressPatch: localPatch }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
            confidence: "Command",
            reflection: "Protected areas are linked through category, map, species, threat, and institution.",
            revisitQueued: false,
            talkScore: 92,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            labCompleted: true,
            labMode: "biodiversity-map",
            labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
            labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
            updatedAt: new Date().toISOString(),
            ...localPatch,
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "ENV-D05": {
            planned: 3,
            drafted: 3,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { progressKey, mcqKey, progressPatch }
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

  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "networkidle" });
  await seedBase(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("subject-readiness-snapshot").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-readiness-snapshot").getByText("0/20", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("MCQ practice needed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-stage-checklist").getByText("Practice pending", { exact: false }).waitFor({ timeout: 15000 });
  const pendingRoute = await page.getByTestId("track-focused-route").getAttribute("href");
  if (pendingRoute !== "/upsc/environment/mcq-readiness?day=5") {
    throw new Error(`Pending MCQ route should point to readiness, got ${pendingRoute}`);
  }
  await assertNoOverflow(page, "environment-track-mcq-practice-pending", checks);

  await seedBase(page, {
    mcqAttempted: true,
    mcqCompleted: true,
    mcqAnsweredCount: 3,
    mcqCorrectCount: 3,
    mcqTotal: 3,
    mcqScorePercent: 100,
    mcqLastBatchCode: "ENV-D05",
    mcqOutcome: "Command",
    mcqRecommendedRoute: "/upsc/environment/track?day=5",
    mcqReviewSummary: "3/3 correct (100%). Command gate cleared for ENV-D05.",
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("subject-readiness-snapshot").getByText("1/20", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("MCQ command", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-stage-checklist").getByText("Command 100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-mcq-outcome").getByText("Score 3/3", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-mcq-command-complete", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("track-focused-day").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-mcq-command-mobile", checks);
  await page.screenshot({ path: path.join(__dirname, "environment-readiness-mcq-command-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    pendingRoute,
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

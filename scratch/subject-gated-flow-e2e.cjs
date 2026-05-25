const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-gated-flow-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-gated-flow-final.png");
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqStateKey = "sarit-upsc-mcq-command-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function proofIds(day, labSlug) {
  return ["concept", "case", "institution", "trap", "answer"].map((stage) => `${day}-${labSlug}-${stage}`);
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function seed(page, progress, mcqState = {}) {
  await page.goto(`${baseUrl}/upsc/environment/track`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ progressKey: pk, mcqStateKey: mk, progress: nextProgress, mcqState: nextMcqState }) => {
      window.localStorage.setItem(pk, JSON.stringify(nextProgress));
      window.localStorage.setItem(mk, JSON.stringify(nextMcqState));
    },
    { progressKey, mcqStateKey, progress, mcqState }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  for (const namedPage of [page, mobilePage]) {
    namedPage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    namedPage.on("pageerror", (error) => pageErrors.push(error.message));
  }

  const labPendingProgress = {
    5: {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
      talkScore: 72,
      talkBand: "Practice",
      talkUnlockStage: "lab",
      talkVerdict: "Visual Lab unlocked.",
      confidence: "Working",
      reflection: "Protected area categories are partially understood.",
    },
  };

  await seed(page, labPendingProgress);
  await page.goto(`${baseUrl}/upsc/environment/track`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("track-day-5").waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-5").getByText("Lab proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-5").getByText("0/5 proofs", { exact: false }).waitFor({ timeout: 15000 });
  let pageMetrics = await metrics(page);
  checks.push({ route: "environment-track-lab-pending", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Track overflow: ${JSON.stringify(pageMetrics)}`);

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-gate-checklist").waitFor({ timeout: 15000 });
  await page.getByText("Student MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Lab proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("0/5 proof stages completed", { exact: false }).waitFor({ timeout: 15000 });
  pageMetrics = await metrics(page);
  checks.push({ route: "environment-mcq-locked", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`MCQ locked overflow: ${JSON.stringify(pageMetrics)}`);

  const unlockedProgress = {
    5: {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
      talkScore: 88,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "MCQ route conditionally unlocked.",
      confidence: "Command",
      reflection: "Protected areas are linked to category, map, species, institution, and UPSC trap.",
      labCompleted: true,
      labMode: "biodiversity-map",
      labProofIndex: 4,
      labProofCompletedIds: proofIds(5, "biodiversity-map"),
      labProofSummary: "Answer hook: protected area rule and map trap saved.",
      labInsight: "Protected area category plus map location and institution.",
    },
  };
  const readyBatch = {
    "ENV-D05": {
      planned: 25,
      drafted: 25,
      difficulty: "MEDIUM",
      status: "READY",
      updatedAt: new Date().toISOString(),
    },
  };

  await seed(page, unlockedProgress, readyBatch);
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-gate-checklist").waitFor({ timeout: 15000 });
  await page.getByText("Student MCQ unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Talk command", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Lab proof done", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Fresh batch ready", { exact: true }).waitFor({ timeout: 15000 });
  pageMetrics = await metrics(page);
  checks.push({ route: "environment-mcq-unlocked", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`MCQ unlocked overflow: ${JSON.stringify(pageMetrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const revisitProgress = {
    6: {
      day: 6,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["6-briefing", "6-mechanism", "6-application", "6-trap", "6-handoff"],
      revisitQueued: true,
      talkScore: 32,
      talkBand: "Revisit",
      talkUnlockStage: "revisit",
      talkVerdict: "Revisit required.",
      talkChallengeResponse: "I cannot explain the difference yet.",
      confidence: "Shaky",
      reflection: "The biodiversity category rules are confused.",
    },
  };

  await seed(mobilePage, revisitProgress);
  await mobilePage.goto(`${baseUrl}/upsc/environment/revisit?day=6`, { waitUntil: "domcontentloaded" });
  await mobilePage.getByTestId("revisit-repair-gates").waitFor({ timeout: 15000 });
  await mobilePage.getByText("5/5", { exact: false }).first().waitFor({ timeout: 15000 });
  await mobilePage.getByText("32%", { exact: false }).waitFor({ timeout: 15000 });
  await mobilePage.getByText("0/5", { exact: false }).waitFor({ timeout: 15000 });
  await mobilePage.getByPlaceholder("Write the recovery note", { exact: false }).fill(
    "Recovered: protected area category, rule, map, species and institution should be explained separately."
  );
  await mobilePage.getByRole("button", { name: /Mark recovered/i }).click();
  await mobilePage.getByText("Recovery saved locally", { exact: false }).waitFor({ timeout: 15000 });
  const recovered = await mobilePage.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["6"], progressKey);
  pageMetrics = await metrics(mobilePage);
  checks.push({ route: "environment-revisit-mobile", recovered, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Revisit mobile overflow: ${JSON.stringify(pageMetrics)}`);
  if (recovered?.revisitQueued !== false || recovered?.talkUnlockStage || recovered?.talkBand || recovered?.talkDiscussionStep !== "explain") {
    throw new Error(`Revisit recovery did not reset gate state: ${JSON.stringify(recovered)}`);
  }

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

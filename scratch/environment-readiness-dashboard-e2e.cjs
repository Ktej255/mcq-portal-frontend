const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "environment-readiness-dashboard-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const completeIds = ["scene-a", "scene-b", "scene-c", "scene-d", "scene-e"];

const seededProgress = {
  "2": {
    day: 2,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: completeIds,
    reflection: "Energy flow explanation saved.",
    talkScore: 68,
    talkBand: "Practice",
    talkUnlockStage: "retry",
    confidence: "Working",
  },
  "3": {
    day: 3,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: completeIds,
    reflection: "Cycle explanation is incomplete.",
    talkScore: 42,
    talkBand: "Revisit",
    talkUnlockStage: "revisit",
    revisitQueued: true,
    confidence: "Shaky",
    activePromptLabel: "Explain",
  },
  "4": {
    day: 4,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: completeIds,
    reflection: "Biodiversity levels are clear enough for applied lab work.",
    talkScore: 76,
    talkBand: "Practice",
    talkUnlockStage: "lab",
    labMode: "biodiversity-map",
    labProofCompletedIds: ["proof-a", "proof-b"],
    confidence: "Working",
  },
  "5": {
    day: 5,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: completeIds,
    reflection: "Protected areas explained with category rules and map examples.",
    talkScore: 88,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    labCompleted: true,
    labMode: "biodiversity-map",
    labProofCompletedIds: completeIds,
    confidence: "Command",
  },
  "6": {
    day: 6,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: completeIds,
    reflection: "Species conservation explained through IUCN, CITES, habitat, and examples.",
    talkScore: 92,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    labCompleted: true,
    labMode: "biodiversity-map",
    labProofCompletedIds: completeIds,
    confidence: "Command",
  },
};

const seededMcqState = {
  "ENV-D05": {
    planned: 25,
    drafted: 12,
    difficulty: "MEDIUM",
    status: "DRAFT",
    updatedAt: "2026-05-22T00:00:00.000Z",
  },
  "ENV-D06": {
    planned: 25,
    drafted: 25,
    difficulty: "MEDIUM",
    status: "READY",
    updatedAt: "2026-05-22T00:00:00.000Z",
  },
};

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

async function seedLocalState(page) {
  await page.evaluate(
    ({ mcqKey: batchKey, progressKey: subjectKey, mcqState, progressState }) => {
      window.localStorage.setItem(subjectKey, JSON.stringify(progressState));
      window.localStorage.setItem(batchKey, JSON.stringify(mcqState));
    },
    {
      progressKey,
      mcqKey,
      progressState: seededProgress,
      mcqState: seededMcqState,
    }
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

  await page.goto(`${baseUrl}/upsc/environment`, { waitUntil: "networkidle" });
  await seedLocalState(page);

  await page.goto(`${baseUrl}/upsc/environment/track?day=3`, { waitUntil: "networkidle" });
  await page.getByTestId("subject-readiness-snapshot").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-next-action-queue").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-stage-checklist").waitFor({ timeout: 15000 });
  await page.getByText("42%", { exact: false }).first().waitFor({ timeout: 15000 });

  const nextActionHref = await page.getByTestId("subject-next-action-3").getAttribute("href");
  if (!nextActionHref?.includes("/upsc/environment/revisit?day=3")) {
    throw new Error(`Expected Day 3 next action to route to revisit, got ${nextActionHref}`);
  }

  const focusedHref = await page.getByTestId("track-focused-route").getAttribute("href");
  if (!focusedHref?.includes("/upsc/environment/revisit?day=3")) {
    throw new Error(`Expected focused route to stay on Day 3 revisit, got ${focusedHref}`);
  }

  const focusedStages = await page.getByTestId("subject-focused-stage-checklist").textContent();
  if (!focusedStages?.includes("Revisit") || !focusedStages?.includes("active")) {
    throw new Error(`Focused stage checklist did not show active revisit: ${focusedStages}`);
  }

  await assertNoOverflow(page, "environment-track-readiness-desktop", checks);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/upsc/environment/track?day=3`, { waitUntil: "networkidle" });
  await page.getByTestId("subject-readiness-snapshot").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-readiness-mobile", checks);

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${baseUrl}/upsc/environment?day=6`, { waitUntil: "networkidle" });
  await page.getByText("Day 6 of 20", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-next-action").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-subject-readiness").waitFor({ timeout: 15000 });

  const commandNextAction = await page.getByTestId("subject-command-next-action").textContent();
  if (!commandNextAction?.includes("Command ready") || !commandNextAction?.includes("100% ready")) {
    throw new Error(`Command room did not surface Day 6 command readiness: ${commandNextAction}`);
  }

  const commandScore = await page.getByTestId("subject-command-readiness-score").textContent();
  if (!commandScore?.includes("100% ready")) {
    throw new Error(`Expected Day 6 readiness score to be 100%, got ${commandScore}`);
  }

  await assertNoOverflow(page, "environment-command-readiness-desktop", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    nextActionHref,
    focusedHref,
    commandScore,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "environment-readiness-dashboard-final.png"), fullPage: true });
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

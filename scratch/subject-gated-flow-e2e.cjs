const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-gated-flow-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-gated-flow-final.png");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqStateKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function proofIds(day, labSlug) {
  return ["concept", "case", "institution", "trap", "answer"].map((stage) => `${day}-${labSlug}-${stage}`);
}

function makeQuestion(index) {
  return {
    test_id: 7800 + index,
    topic_id: 7800 + index,
    text_en: `Environment protected-area command question ${index}: match category, map, species, threat and response.`,
    options_en: {
      A: "Protected-area category must be read with map, habitat and institution",
      B: "All protected areas follow identical activity rules",
      C: "Hotspot status is only animal population count",
      D: "Corridors never matter for fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      "The correct option links protected area category, habitat, species movement, governance mechanism and map-based conservation response.",
    difficulty: "MEDIUM",
    source: "FRESH_ENVIRONMENT_AUTHORING",
    status: "DRAFT",
    quality_notes: {
      batch_code: "ENV-D05",
      subject: "Environment",
      day: "5",
      week: "1",
      chapter: "Biodiversity",
      topic: "Protected Areas",
      test_title: "Environment Day 5: Protected Areas",
      map_or_case_tag: "Western Ghats hotspot",
      pyq_linked: "No",
    },
  };
}

async function seedProfile(page) {
  await page.addInitScript((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_gated_flow");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function openCommandBoard(page) {
  const board = page.getByTestId("mcq-readiness-command-board");
  await board.waitFor({ timeout: 15000 });
  const isOpen = await board.evaluate((element) => element.open);
  if (!isOpen) {
    await board.locator("summary").click();
  }
}

async function seed(page, progress, mcqState = {}, questions = []) {
  await page.goto(`${baseUrl}/upsc/environment/track`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ progressKey: pk, mcqStateKey: mk, draftKey: dk, progress: nextProgress, mcqState: nextMcqState, localQuestions }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_gated_flow");
      window.localStorage.setItem(pk, JSON.stringify(nextProgress));
      window.localStorage.setItem(mk, JSON.stringify(nextMcqState));
      window.localStorage.setItem(
        dk,
        JSON.stringify(
          localQuestions.length
            ? [
                {
                  id: `subject-gated-flow-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  importMode: "UPSC_MCQ_COMMAND",
                  questions: localQuestions,
                },
              ]
            : []
        )
      );
    },
    { progressKey, mcqStateKey, draftKey: localDraftKey, progress, mcqState, localQuestions: questions }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await seedProfile(page);
  await seedProfile(mobilePage);
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
  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("track-focused-day").waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Recall support", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Score 72%; target 95%", { exact: false }).waitFor({ timeout: 15000 });
  let pageMetrics = await metrics(page);
  checks.push({ route: "environment-track-lab-pending", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Track overflow: ${JSON.stringify(pageMetrics)}`);

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-simple-step").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice blocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-readiness-copy").getByText("AI teacher", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("95% recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Fresh MCQ", { exact: false }).waitFor({ timeout: 15000 });
  const lockedAdvancedOpen = await page.getByTestId("mcq-advanced-tools").evaluate((element) => element.open);
  if (lockedAdvancedOpen) throw new Error("Advanced MCQ controls should stay collapsed on the locked student screen.");
  await openCommandBoard(page);
  await page.getByTestId("mcq-gate-checklist").getByText("72% / 95%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-gate-checklist").getByText("Visual support", { exact: false }).waitFor({ timeout: 15000 });
  pageMetrics = await metrics(page);
  checks.push({ route: "environment-mcq-locked", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`MCQ locked overflow: ${JSON.stringify(pageMetrics)}`);

  const unlockedProgress = {
    5: {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
      talkScore: 96,
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

  await seed(page, unlockedProgress, readyBatch, Array.from({ length: 25 }, (_, index) => makeQuestion(index + 1)));
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-simple-step").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-readiness-copy").getByText("fresh MCQ set", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("95% recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Fresh MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Command score", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Next topic", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-primary-action").getByTestId("mcq-start-local-practice").getByText("Start fresh MCQs", { exact: false }).waitFor({ timeout: 15000 });
  const unlockedAdvancedOpen = await page.getByTestId("mcq-advanced-tools").evaluate((element) => element.open);
  if (unlockedAdvancedOpen) throw new Error("Advanced MCQ controls should stay collapsed on the ready student screen.");
  await openCommandBoard(page);
  await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-gate-checklist").getByText("96% / 95%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-gate-checklist").getByText("25/25", { exact: false }).waitFor({ timeout: 15000 });
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
  const revisitRepairGates = mobilePage.getByTestId("revisit-repair-gates");
  await revisitRepairGates.waitFor({ timeout: 15000 });
  const repairGatesOpen = await revisitRepairGates.evaluate((element) => element.open);
  if (!repairGatesOpen) {
    await revisitRepairGates.locator("summary").click();
  }
  await revisitRepairGates.getByText("5/5", { exact: false }).first().waitFor({ timeout: 15000 });
  await revisitRepairGates.getByText("32%", { exact: false }).waitFor({ timeout: 15000 });
  await revisitRepairGates.getByText("0/5", { exact: false }).waitFor({ timeout: 15000 });
  await mobilePage.getByTestId("subject-revisit-repair-note").fill(
    "Recovered: protected area category, rule, map, species and institution should be explained separately."
  );
  await mobilePage.getByTestId("subject-revisit-mark-recovered").click();
  await mobilePage.getByTestId("revisit-return-gate").getByText("Recovery saved locally", { exact: false }).waitFor({ timeout: 15000 });
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-mcq-readiness-preflight-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "environment-mcq-readiness-preflight-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seedProfile(page) {
  await page.addInitScript((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_environment_mcq_preflight");
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

function readyProgress() {
  return {
    day: 5,
    watched: true,
    watchState: "Watched",
    watchMinutes: 90,
    watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
    confidence: "Command",
    reflection: "Protected areas are linked through category, map, species, threat, and institution.",
    revisitQueued: false,
    talkScore: 96,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    labCompleted: true,
    labMode: "biodiversity-map",
    labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
    labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
    updatedAt: new Date().toISOString(),
  };
}

function makeQuestion(index, overrides = {}) {
  return {
    test_id: 9700 + index,
    topic_id: 9700 + index,
    text_en:
      overrides.text_en ??
      `Consider the following statements about protected areas and biodiversity corridors ${index}. Which option is correct?`,
    options_en: {
      A: "Core and buffer logic can vary by legal category and local rights",
      B: "All protected areas remove every human activity in the same way",
      C: "Hotspot status only means high animal population",
      D: "Corridors are irrelevant for fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      overrides.explanation_en ??
      "The correct option links protected area category, habitat, species movement, governance mechanism, and impact because corridors and buffer rules shape conservation outcomes.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "ENV-D05",
      subject: "Environment",
      day: "5",
      week: "1",
      chapter: "Biodiversity",
      topic: "Protected Areas",
      test_title: "Environment Day 5: Protected Areas",
      map_or_case_tag: overrides.map_or_case_tag ?? "Great Indian Bustard grassland",
      pyq_linked: "No",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function getProgress(page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
}

async function openCommandBoard(page) {
  const board = page.getByTestId("mcq-readiness-command-board");
  await board.waitFor({ timeout: 15000 });
  const isOpen = await board.evaluate((element) => element.open);
  if (!isOpen) {
    await board.locator("summary").click();
  }
}

async function seed(page, { planned, drafted, questions }) {
  const progress = readyProgress();
  await page.evaluate(
    ({ progressStorageKey, mcqStorageKey, draftStorageKey, plannedCount, draftedCount, localQuestions, seededProgress }) => {
      window.localStorage.setItem(progressStorageKey, JSON.stringify({ "5": seededProgress }));
      window.localStorage.setItem(
        mcqStorageKey,
        JSON.stringify({
          "ENV-D05": {
            planned: plannedCount,
            drafted: draftedCount,
            difficulty: "MEDIUM",
            status: draftedCount >= plannedCount ? "READY" : "DRAFT",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify(
          localQuestions.length
            ? [
                {
                  id: `environment-preflight-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  importMode: "UPSC_MCQ_COMMAND",
                  questions: localQuestions,
                },
              ]
            : []
        )
      );
    },
    {
      progressStorageKey: progressKey,
      mcqStorageKey: mcqKey,
      draftStorageKey: localDraftKey,
      plannedCount: planned,
      draftedCount: drafted,
      localQuestions: questions,
      seededProgress: progress,
    }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await seedProfile(page);
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await seed(page, { planned: 2, drafted: 2, questions: [] });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await openCommandBoard(page);
  await page.getByTestId("mcq-preflight-status").getByText("Content pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Upload fresh CSV", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-fresh-content-pending").getByText("Fresh MCQs not attached yet", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"]?.mcqReadinessStatus === "content-pending", progressKey, {
    timeout: 15000,
  });
  await assertNoOverflow(page, "environment-content-pending", checks);

  await seed(page, {
    planned: 3,
    drafted: 3,
    questions: [
      makeQuestion(1, { text_en: "Protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(2, { text_en: "Another protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(3, { text_en: "Third protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
    ],
  });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await openCommandBoard(page);
  await page.getByTestId("mcq-preflight-status").getByText("Quality review", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Fix MCQ quality", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"]?.mcqReadinessStatus === "quality-review", progressKey, {
    timeout: 15000,
  });
  await assertNoOverflow(page, "environment-quality-review", checks);

  await seed(page, { planned: 3, drafted: 3, questions: [makeQuestion(1), makeQuestion(2), makeQuestion(3)] });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await openCommandBoard(page);
  await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Start fresh MCQs", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("95% recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Fresh MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-flow").getByText("Command score", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-primary-action").getByTestId("mcq-start-local-practice").getByText("Start fresh MCQs", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("1 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByRole("button", { name: /^Next$/i }).click();
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByRole("button", { name: /^Next$/i }).click();
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });

  const commandProgress = await getProgress(page);
  if (
    commandProgress?.mcqReadinessStatus !== "command" ||
    commandProgress?.mcqNextRoute !== "/upsc/environment/track?day=5" ||
    commandProgress?.mcqNextActionLabel !== "Review track" ||
    commandProgress?.mcqFreshQuestionCount !== 3 ||
    commandProgress?.mcqPlannedCount !== 3 ||
    commandProgress?.mcqScorePercent !== 100
  ) {
    throw new Error(`Environment MCQ command preflight did not persist: ${JSON.stringify(commandProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "environment-command-ready", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await openCommandBoard(page);
  await assertNoOverflow(page, "environment-preflight-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    commandProgress,
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

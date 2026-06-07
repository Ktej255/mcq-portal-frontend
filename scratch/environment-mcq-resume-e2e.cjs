const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-mcq-resume-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "environment-mcq-resume-mobile.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9800 + index,
    topic_id: 9800 + index,
    text_en: `Consider the following statements about protected areas, national parks, wildlife sanctuaries, biodiversity corridors, and governance ${index}. Which option is correct?`,
    options_en: {
      A: "Protected-area category must be read with habitat, rights, species movement, and institution",
      B: "All protected areas have the same rule and no local variation",
      C: "A hotspot only means high animal population",
      D: "Corridors never matter after habitats are fragmented",
    },
    correct_option: "A",
    explanation_en:
      "The correct option links protected area category, habitat, species movement, governance mechanism, map anchor, conservation impact, and ecosystem process because legal category and local context change outcomes.",
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
      map_or_case_tag: "Great Indian Bustard grassland",
      pyq_linked: "No",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function seed(page) {
  const questions = [makeQuestion(1), makeQuestion(2)];
  await page.addInitScript(
    ({ studentProfileKey, subjectProgressKey, mcqCommandKey, draftBankKey, seededQuestions }) => {
      if (window.localStorage.getItem("sarit-upsc-environment-mcq-resume-seeded") === "true") return;
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_environment_mcq_resume");
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "advanced",
          preparationStage: "multiple-attempts",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "two-plus-attempts",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        subjectProgressKey,
        JSON.stringify({
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            reflection: "Protected areas require category, map, species, institution, and UPSC trap logic.",
            confidence: "Command",
            labCompleted: true,
            labMode: "biodiversity-map",
            labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
          },
        })
      );
      window.localStorage.setItem(
        mcqCommandKey,
        JSON.stringify({
          "ENV-D05": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        draftBankKey,
        JSON.stringify([
          {
            id: "local-environment-mcq-resume",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ])
      );
      window.localStorage.setItem("sarit-upsc-environment-mcq-resume-seeded", "true");
    },
    {
      studentProfileKey: profileKey,
      subjectProgressKey: progressKey,
      mcqCommandKey: mcqKey,
      draftBankKey: draftKey,
      seededQuestions: questions,
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

  await seed(page);
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-before-refresh", checks);

  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-local-practice-runner").getByText("2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-practice-score").getByText("Score 1/2", { exact: false }).waitFor({ timeout: 15000 });
  const progressAfterRefresh = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
  checks.push({ label: "environment-mcq-restored-after-refresh", progressAfterRefresh });
  if (
    progressAfterRefresh?.mcqAttempted !== true ||
    progressAfterRefresh?.mcqCompleted === true ||
    progressAfterRefresh?.mcqAnswerMap?.["0"] !== "A" ||
    progressAfterRefresh?.mcqCurrentQuestionIndex !== 1 ||
    progressAfterRefresh?.mcqAnsweredCount !== 1
  ) {
    throw new Error(`Partial Environment MCQ state was not restored: ${JSON.stringify(progressAfterRefresh, null, 2)}`);
  }

  await page.getByTestId("mcq-previous-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  const restoredOptionLocked = await page.getByTestId("mcq-practice-option-B").isDisabled();
  checks.push({ label: "environment-mcq-restored-answer-locked", restoredOptionLocked });
  if (!restoredOptionLocked) throw new Error("Restored Environment answer should stay locked for review.");

  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });
  const finalProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
  checks.push({ label: "environment-mcq-final-command-after-resume", finalProgress });
  if (
    finalProgress?.mcqCompleted !== true ||
    finalProgress?.mcqCorrectCount !== 2 ||
    finalProgress?.mcqScorePercent !== 100 ||
    finalProgress?.mcqOutcome !== "Command" ||
    finalProgress?.mcqAnswerMap?.["0"] !== "A" ||
    finalProgress?.mcqAnswerMap?.["1"] !== "A"
  ) {
    throw new Error(`Resumed Environment MCQ did not complete cleanly: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-resume-result-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    baseUrl,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

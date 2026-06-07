const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-resume-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-mcq-resume-mobile.png");

function buildQuestion(index, correctOption) {
  return {
    test_id: 9700 + index,
    topic_id: 9700 + index,
    text_en: `Resume-safe Geography practice question ${index}: choose the strongest map-linked explanation.`,
    options_en: {
      A: "Location, relief, scale, and mechanism are connected",
      B: "The map example proves the concept and exposes the UPSC trap",
      C: "Every region has identical physical outcomes",
      D: "A place name alone is enough for Geography",
    },
    correct_option: correctOption,
    explanation_en: `Question ${index} checks whether the answer connects concept, map proof, and trap.`,
    difficulty: "MEDIUM",
    source: "FRESH_AUTHORING",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D08",
      subject: "Geography",
      day: "8",
      chapter: "Physical Geography Foundation",
      topic: "Relief and Structure",
      map_or_case_tag: "India map-linked relief explanation",
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
  const questions = [buildQuestion(1, "A"), buildQuestion(2, "B")];
  await page.addInitScript(
    ({ studentProfileKey, geographyProgressKey, mcqCommandKey, draftBankKey, seededQuestions }) => {
      if (window.localStorage.getItem("sarit-upsc-geography-mcq-resume-seeded") === "true") return;
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_mcq_resume");
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
        }),
      );
      window.localStorage.setItem(
        geographyProgressKey,
        JSON.stringify({
          "8": {
            day: 8,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["8-briefing", "8-mechanism", "8-map", "8-trap", "8-recap"],
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            reflection: "Relief and structure must be explained through mechanism and map proof.",
            confidence: "Command",
          },
        }),
      );
      window.localStorage.setItem(
        mcqCommandKey,
        JSON.stringify({
          "GEO-D08": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        }),
      );
      window.localStorage.setItem(
        draftBankKey,
        JSON.stringify([
          {
            id: "local-geography-mcq-resume",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ]),
      );
      window.localStorage.setItem("sarit-upsc-geography-mcq-resume-seeded", "true");
    },
    {
      studentProfileKey: profileKey,
      geographyProgressKey: progressKey,
      mcqCommandKey: mcqKey,
      draftBankKey: draftKey,
      seededQuestions: questions,
    },
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
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=8`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Start practice", exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-before-refresh-desktop", checks);

  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-practice-score").getByText("Progress 1/2 answered", { exact: false }).waitFor({ timeout: 15000 });
  const progressAfterRefresh = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["8"], progressKey);
  checks.push({ label: "mcq-restored-after-refresh", progressAfterRefresh });
  if (
    progressAfterRefresh?.mcqAttempted !== true ||
    progressAfterRefresh?.mcqCompleted === true ||
    progressAfterRefresh?.mcqAnswerMap?.["0"] !== "A" ||
    progressAfterRefresh?.mcqCurrentQuestionIndex !== 1 ||
    progressAfterRefresh?.mcqAnsweredCount !== 1
  ) {
    throw new Error(`Partial MCQ state was not restored: ${JSON.stringify(progressAfterRefresh, null, 2)}`);
  }

  await page.getByTestId("mcq-previous-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  const restoredOptionLocked = await page.getByTestId("mcq-practice-option-B").isDisabled();
  checks.push({ label: "mcq-restored-answer-review", restoredOptionLocked });
  if (!restoredOptionLocked) throw new Error("Restored answered question should stay locked for review.");

  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: true }).waitFor({ timeout: 15000 });
  const finalProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["8"], progressKey);
  checks.push({ label: "mcq-final-command-after-resume", finalProgress });
  if (
    finalProgress?.mcqCompleted !== true ||
    finalProgress?.mcqCorrectCount !== 2 ||
    finalProgress?.mcqScorePercent !== 100 ||
    finalProgress?.mcqOutcome !== "Command" ||
    finalProgress?.mcqAnswerMap?.["0"] !== "A" ||
    finalProgress?.mcqAnswerMap?.["1"] !== "B"
  ) {
    throw new Error(`Resumed MCQ did not complete cleanly: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Continue to next topic", exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-next-action").getByText("Continue to next topic", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-resume-result-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
  const evidence = {
    baseUrl,
    checks,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

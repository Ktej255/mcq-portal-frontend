const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-mcq-practice-outcome-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9600 + index,
    topic_id: 600 + index,
    text_en: `Consider the following statements about protected areas, biodiversity hotspots, and corridors ${index}. Which option is correct?`,
    options_en: {
      A: "Core and buffer logic can vary by legal category and local rights",
      B: "All protected areas remove every human activity in the same way",
      C: "Hotspot status only means high animal population",
      D: "Corridors are irrelevant for fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      "The correct option links protected area category, habitat, species movement, governance mechanism, and impact because corridors and buffer rules shape conservation outcomes. The distractors fail by treating all categories as identical, ignoring endemism, and removing landscape process from the ecosystem.",
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
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
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

  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_environment_mcq_practice");
  });

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ profileKey: localProfileKey, progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, questions }) => {
      window.localStorage.setItem(
        localProfileKey,
        JSON.stringify({
          level: "advanced",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          updatedAt: new Date().toISOString(),
        })
      );
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
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            labCompleted: true,
            labMode: "biodiversity-map",
            labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
            labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
            updatedAt: new Date().toISOString(),
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
      window.localStorage.setItem(
        localLocalDraftKey,
        JSON.stringify([
          {
            id: "environment-practice-outcome",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions,
          },
        ])
      );
    },
    { profileKey, progressKey, mcqKey, localDraftKey, questions: [makeQuestion(1), makeQuestion(2), makeQuestion(3)] }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  const preflightOpen = await page
    .getByTestId("mcq-readiness-command-board")
    .evaluate((element) => Boolean(element.open));
  if (preflightOpen) {
    throw new Error("MCQ readiness proof should start folded for students.");
  }
  await page.getByTestId("mcq-top-start-practice").waitFor({ timeout: 15000 });
  const startButtonCount = await page.getByTestId("mcq-start-local-practice").count();
  const topStartDisabled = await page.getByTestId("mcq-start-local-practice").isDisabled();
  if (startButtonCount !== 1) {
    throw new Error(`MCQ page should expose exactly one start-practice button, found ${startButtonCount}.`);
  }
  if (topStartDisabled) {
    throw new Error("Expected top next-action button to start practice when gates and local content are ready.");
  }
  await page.getByTestId("mcq-advanced-tools").click();
  await page.getByTestId("environment-mcq-quality-score").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-question-preview").getByText("protected areas", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-practice-ready", checks);

  await page.getByTestId("mcq-advanced-tools").click();
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("1 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("2 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Review this trap", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("3 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Revisit queued", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-practice-score").getByText("Score 1/3", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-practice-revisit-outcome", checks);

  const progressAfterPractice = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
  if (
    !progressAfterPractice?.mcqAttempted ||
    !progressAfterPractice?.mcqCompleted ||
    progressAfterPractice?.mcqOutcome !== "Revisit" ||
    progressAfterPractice?.mcqCorrectCount !== 1 ||
    progressAfterPractice?.mcqTotal !== 3 ||
    progressAfterPractice?.revisitQueued !== true
  ) {
    throw new Error(`Environment MCQ outcome did not persist correctly: ${JSON.stringify(progressAfterPractice)}`);
  }

  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("subject-track-advanced-tools").click();
  await page.getByTestId("track-day-detail-5").getByText("MCQ practice done / 1/3 correct", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-mcq-outcome").getByText("Score 1/3", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-mcq-outcome", checks);

  await page.goto(`${baseUrl}/upsc/environment/revisit?day=5`, { waitUntil: "networkidle" });
  const revisitSummaryOpen = await page.getByTestId("revisit-mcq-summary").evaluate((element) => Boolean(element.open));
  if (!revisitSummaryOpen) {
    await page.getByTestId("revisit-mcq-summary").locator("summary").click();
  }
  await page.getByTestId("revisit-mcq-summary").getByText("1/3 correct", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-revisit-mcq-summary", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Revisit queued", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-practice-outcome-mobile", checks);
  await page.screenshot({ path: path.join(__dirname, "environment-mcq-practice-outcome-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    progressAfterPractice,
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-readiness-preflight-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-mcq-readiness-preflight-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function buildReadyProgress(day) {
  return {
    day,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: [`${day}-briefing`, `${day}-mechanism`, `${day}-map`, `${day}-trap`, `${day}-recap`],
    confidence: "Command",
    talkScore: 86,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    talkDiscussionStep: "verdict",
    labCompleted: true,
    labMode: "india-map",
    labProofCompletedIds: ["concept", "map", "example", "trap", "answer"],
    labProofSummary: "Seeded lab proof for MCQ preflight.",
    revisitQueued: false,
    updatedAt: new Date().toISOString(),
  };
}

function buildQuestion(batchCode, explanation) {
  return {
    test_id: 9401,
    topic_id: 9401,
    text_en:
      "Consider the following statements about soils and vegetation in India: which option correctly links parent rock, climate, map distribution, crop suitability and a UPSC trap?",
    options_en: {
      A: "Black soil develops over basaltic parent rock and supports cotton under suitable moisture conditions",
      B: "Alluvial soil is only found in desert regions and cannot support intensive agriculture",
      C: "Laterite soil is always rich in humus and never linked with heavy rainfall",
      D: "Forest type is unrelated to climate, rainfall, altitude or soil conditions",
    },
    correct_option: "A",
    explanation_en: explanation,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: batchCode,
      subject: "Geography",
      day: "12",
      chapter: "India Map Command",
      topic: "Soils and Vegetation",
      map_or_case_tag: "Black soil Deccan plateau cotton rainfall vegetation",
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

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
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

  const readyProgress = buildReadyProgress(12);
  const invalidQuestion = buildQuestion("GEO-D12", "Too short");
  const validQuestion = buildQuestion(
    "GEO-D12",
    "Because soil formation depends on parent rock, climate, relief, drainage and time, black soil is mapped with the Deccan basalt region and cotton suitability. The UPSC trap is to treat every soil-crop pair as universal or to ignore rainfall, vegetation and regional limits."
  );

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=12`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ storageKey: localStorageKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, progress }) => {
      window.localStorage.removeItem(localStorageKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localLocalDraftKey);
      window.localStorage.setItem(localStorageKey, JSON.stringify({ "12": progress }));
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D12": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { storageKey, mcqKey, localDraftKey, progress: readyProgress }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });

  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-preflight-status").getByText("Content pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Upload fresh CSV", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh content pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction(
    ({ key }) => JSON.parse(window.localStorage.getItem(key) || "{}")["12"]?.mcqReadinessStatus === "content-pending",
    { key: storageKey },
    { timeout: 15000 }
  );
  await assertNoOverflow(page, "mcq-content-pending", checks);

  await page.evaluate(
    ({ mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, question }) => {
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D12": {
            planned: 1,
            drafted: 1,
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
            id: "local-geography-mcq-invalid",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: [question],
          },
        ])
      );
    },
    { mcqKey, localDraftKey, question: invalidQuestion }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-preflight-status").getByText("Quality review", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-quality-review").getByText("Q1: explanation", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Fix MCQ quality", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction(
    ({ key }) => JSON.parse(window.localStorage.getItem(key) || "{}")["12"]?.mcqReadinessStatus === "quality-review",
    { key: storageKey },
    { timeout: 15000 }
  );
  await assertNoOverflow(page, "mcq-quality-review", checks);

  await page.evaluate(
    ({ localDraftKey: localLocalDraftKey, question }) => {
      window.localStorage.setItem(
        localLocalDraftKey,
        JSON.stringify([
          {
            id: "local-geography-mcq-valid",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: [question],
          },
        ])
      );
    },
    { localDraftKey, question: validQuestion }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Start local practice", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 1", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });

  const commandProgress = await getProgress(page, 12);
  if (
    commandProgress?.mcqReadinessStatus !== "command" ||
    commandProgress?.mcqNextRoute !== "/upsc/geography/track?day=12" ||
    commandProgress?.mcqNextActionLabel !== "Review track" ||
    commandProgress?.mcqFreshQuestionCount !== 1 ||
    commandProgress?.mcqPlannedCount !== 1 ||
    commandProgress?.mcqScorePercent !== 100
  ) {
    throw new Error(`MCQ command preflight did not persist correctly: ${JSON.stringify(commandProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "mcq-command-ready", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=12`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-preflight-mobile", checks);

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

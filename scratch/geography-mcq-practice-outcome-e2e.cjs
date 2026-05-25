const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-practice-outcome-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function buildProgress(day) {
  return {
    day,
    watched: true,
    watchState: "Watched",
    watchMinutes: 60,
    watchSceneCompletedIds: [
      `${day}-briefing`,
      `${day}-mechanism`,
      `${day}-map`,
      `${day}-trap`,
      `${day}-recap`,
    ],
    confidence: "Command",
    reflection: "Seeded command reflection for local MCQ outcome verification.",
    revisitQueued: false,
    talkScore: 88,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    assessmentSummary: "Seeded AI teacher clearance for MCQ readiness.",
    labCompleted: true,
    labMode: "india-map",
    labInsight: "Seeded visual lab insight.",
    labProofCompletedIds: ["concept", "map", "example", "trap", "answer"],
    labProofSummary: "All visual proof stages seeded for MCQ readiness.",
    updatedAt: new Date().toISOString(),
  };
}

function buildQuestion(batchCode, day, index, correctOption) {
  const labels = {
    A: "Relief controls rainfall and drainage",
    B: "Every plateau has identical soil and climate",
    C: "Longitude alone decides monsoon intensity",
    D: "Coastlines never influence settlement",
  };

  return {
    test_id: 9100 + day * 10 + index,
    topic_id: 9100 + day * 10 + index,
    text_en: `Fresh Geography Day ${day} practice question ${index}: choose the strongest map-linked explanation.`,
    options_en: {
      A: labels.A,
      B: labels.B,
      C: labels.C,
      D: labels.D,
    },
    correct_option: correctOption,
    explanation_en: `Question ${index} tests concept, map logic, and a UPSC trap for ${batchCode}.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: batchCode,
      subject: "Geography",
      day: String(day),
      chapter: "Physical Geography Foundation",
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
    ({ storageKey: key, day: selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { storageKey, day }
  );
}

async function answerCurrentQuestion(page, option, shouldMoveNext) {
  await page.getByTestId(`mcq-practice-option-${option}`).click();
  await page.getByTestId("mcq-practice-feedback").waitFor({ timeout: 15000 });
  if (shouldMoveNext) {
    await page.getByRole("button", { name: /Next question/i }).click();
  }
}

async function runPracticeScenario(page, day, answers) {
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 3", { exact: false }).waitFor({ timeout: 15000 });

  for (let index = 0; index < answers.length; index += 1) {
    await answerCurrentQuestion(page, answers[index], index < answers.length - 1);
  }

  await page.getByTestId("mcq-practice-outcome-gate").waitFor({ timeout: 15000 });
  return {
    progress: await getProgress(page, day),
    outcomeText: await page.getByTestId("mcq-practice-outcome-gate").innerText(),
    routeHref: await page.getByTestId("mcq-practice-outcome-route").getAttribute("href"),
  };
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

  const seededProgress = {
    "8": buildProgress(8),
    "9": buildProgress(9),
  };
  const seededBatchStates = {
    "GEO-D08": {
      planned: 3,
      drafted: 3,
      difficulty: "MEDIUM",
      status: "READY",
      updatedAt: new Date().toISOString(),
    },
    "GEO-D09": {
      planned: 3,
      drafted: 3,
      difficulty: "MEDIUM",
      status: "READY",
      updatedAt: new Date().toISOString(),
    },
  };
  const seededDrafts = [
    {
      id: "local-geography-mcq-practice-outcome",
      createdAt: new Date().toISOString(),
      importMode: "UPSC_MCQ_COMMAND",
      questions: [
        buildQuestion("GEO-D08", 8, 1, "A"),
        buildQuestion("GEO-D08", 8, 2, "B"),
        buildQuestion("GEO-D08", 8, 3, "C"),
        buildQuestion("GEO-D09", 9, 1, "A"),
        buildQuestion("GEO-D09", 9, 2, "B"),
        buildQuestion("GEO-D09", 9, 3, "C"),
      ],
    },
  ];

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ storageKey: localStorageKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, progress, batchStates, drafts }) => {
      window.localStorage.removeItem(localStorageKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localLocalDraftKey);

      window.localStorage.setItem(localStorageKey, JSON.stringify(progress));
      window.localStorage.setItem(localMcqKey, JSON.stringify(batchStates));
      window.localStorage.setItem(localLocalDraftKey, JSON.stringify(drafts));
    },
    { storageKey, mcqKey, localDraftKey, progress: seededProgress, batchStates: seededBatchStates, drafts: seededDrafts }
  );

  const lowResult = await runPracticeScenario(page, 8, ["A", "A", "A"]);
  await assertNoOverflow(page, "mcq-low-score-outcome", checks);

  if (
    lowResult.progress?.mcqCompleted !== true ||
    lowResult.progress?.mcqOutcome !== "Revisit" ||
    lowResult.progress?.revisitQueued !== true ||
    lowResult.progress?.mcqScorePercent !== 33 ||
    lowResult.routeHref !== "/upsc/geography/revisit?day=8" ||
    !lowResult.outcomeText.includes("Revisit queued")
  ) {
    throw new Error(`Low score did not queue revisit: ${JSON.stringify(lowResult, null, 2)}`);
  }

  const highResult = await runPracticeScenario(page, 9, ["A", "B", "C"]);
  await assertNoOverflow(page, "mcq-command-score-outcome", checks);

  if (
    highResult.progress?.mcqCompleted !== true ||
    highResult.progress?.mcqOutcome !== "Command" ||
    highResult.progress?.revisitQueued !== false ||
    highResult.progress?.mcqScorePercent !== 100 ||
    highResult.routeHref !== "/upsc/geography/track?day=9" ||
    !highResult.outcomeText.includes("Command retained")
  ) {
    throw new Error(`Command score did not route to track: ${JSON.stringify(highResult, null, 2)}`);
  }

  await page.screenshot({ path: path.join(__dirname, "geography-mcq-practice-outcome-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    lowResult,
    highResult,
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

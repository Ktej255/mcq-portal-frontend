const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-next-topic-levels-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const scenarios = [
  {
    level: "beginner",
    preparationStage: "not-started",
    expectedHref: "/upsc/geography/watch?day=2",
    expectedRoom: "watch",
    viewport: { width: 390, height: 844 },
  },
  {
    level: "intermediate",
    preparationStage: "coaching-complete",
    expectedHref: "/upsc/geography/talk?day=2",
    expectedRoom: "talk",
    viewport: { width: 1366, height: 900 },
  },
  {
    level: "advanced",
    preparationStage: "multiple-attempts",
    expectedHref: "/upsc/geography/talk?day=2",
    expectedRoom: "talk",
    viewport: { width: 1366, height: 900 },
  },
];

function buildQuestion(index, correctOption) {
  return {
    test_id: 9900 + index,
    topic_id: 9900 + index,
    text_en: `Fresh Geography Day 1 next-topic proof question ${index}.`,
    options_en: {
      A: "Location, scale, site and situation connect the map relationship.",
      B: "UPSC geography needs mechanism, India map proof and one trap.",
      C: "A place name alone proves every geography answer.",
      D: "Map relationships are not required after a lecture.",
    },
    correct_option: correctOption,
    explanation_en: `Question ${index} proves the Day 1 recall-to-MCQ handoff.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D01",
      subject: "Geography",
      day: "1",
      chapter: "Physical Geography Foundation",
      topic: "Geographic Thinking and Map Relationships",
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

async function runScenario(browser, scenario) {
  const context = await browser.newContext({ viewport: scenario.viewport });
  const page = await context.newPage();
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];
  const scenarioSeedKey = `sarit-upsc-mcq-next-topic-seeded-${scenario.level}`;

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(
    ({ profileKey: pk, progressKey: pgk, mcqKey: mk, draftKey: dk, scenario: localScenario, scenarioSeedKey: seedKey, questions }) => {
      if (window.localStorage.getItem(seedKey) === "true") return;
      const now = new Date().toISOString();
      window.localStorage.setItem("MOCK_TOKEN", `MOCK_TOKEN_${localScenario.level}_mcq_next_topic`);
      window.localStorage.setItem(
        pk,
        JSON.stringify({
          level: localScenario.level,
          preparationStage: localScenario.preparationStage,
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: localScenario.level === "advanced" ? "two-plus-attempts" : "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: now,
        })
      );
      window.localStorage.setItem(
        pgk,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchMinutes: 12,
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            confidence: "Command",
            reflection: "Day 1 map thinking connects location, scale, relationship and UPSC trap.",
            revisitQueued: false,
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            assessmentSummary: "Seeded 96 percent recall clearance for MCQ next-topic proof.",
            labCompleted: true,
            labMode: "india-map",
            labProofCompletedIds: ["concept", "map", "example", "trap", "answer"],
            labProofSummary: "Visual proof is complete.",
            updatedAt: now,
          },
        })
      );
      window.localStorage.setItem(
        mk,
        JSON.stringify({
          "GEO-D01": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        })
      );
      window.localStorage.setItem(
        dk,
        JSON.stringify([
          {
            id: `local-geography-mcq-next-topic-${localScenario.level}`,
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions,
          },
        ])
      );
      window.localStorage.setItem(seedKey, "true");
    },
    { profileKey, progressKey, mcqKey, draftKey, scenario, scenarioSeedKey, questions: [buildQuestion(1, "A"), buildQuestion(2, "B")] }
  );

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const levelShell = page.getByTestId("geography-mcq-level-shell");
  await levelShell.waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "Start practice", exact: true }).waitFor({ timeout: 15000 });

  const shellContract = await levelShell.evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    nextDay: element.getAttribute("data-next-day"),
    nextTopicRoute: element.getAttribute("data-next-topic-route"),
    visibleMode: element.getAttribute("data-visible-mode"),
  }));
  const foldedFlow = await page.getByTestId("mcq-simple-flow-strip").evaluate((element) => ({
    text: element.textContent || "",
    open: element.open,
  }));
  if (
    shellContract.learnerLevel !== scenario.level ||
    shellContract.nextDay !== "2" ||
    shellContract.nextTopicRoute !== scenario.expectedHref ||
    shellContract.visibleMode !== "single-action-practice" ||
    foldedFlow.open !== false ||
    !foldedFlow.text.includes("Talk 95%") ||
    !foldedFlow.text.includes("Fresh MCQ")
  ) {
    throw new Error(`MCQ shell contract mismatch for ${scenario.level}: ${JSON.stringify({ shellContract, foldedFlow })}`);
  }

  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: true }).waitFor({ timeout: 15000 });

  const nextAction = await page.getByTestId("mcq-student-next-action").evaluate((element) => ({
    href: element.getAttribute("href"),
    learnerLevel: element.getAttribute("data-learner-level"),
    outcome: element.getAttribute("data-outcome"),
    nextActionRoute: element.getAttribute("data-next-action-route"),
    nextTopicDay: element.getAttribute("data-next-topic-day"),
  }));
  const outcomeGate = await page.getByTestId("mcq-practice-outcome-gate").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    outcome: element.getAttribute("data-outcome"),
    nextActionRoute: element.getAttribute("data-next-action-route"),
    nextTopicDay: element.getAttribute("data-next-topic-day"),
  }));
  const proofText = await page.getByTestId("mcq-next-topic-proof").innerText();
  checks.push({ label: `${scenario.level}-mcq-next-action`, shellContract, nextAction, outcomeGate, proofText });

  if (
    nextAction.href !== scenario.expectedHref ||
    nextAction.nextActionRoute !== scenario.expectedHref ||
    nextAction.learnerLevel !== scenario.level ||
    nextAction.outcome !== "Command" ||
    nextAction.nextTopicDay !== "2" ||
    outcomeGate.nextActionRoute !== scenario.expectedHref ||
    !proofText.includes(`Day 2`) ||
    !proofText.includes(scenario.expectedHref)
  ) {
    throw new Error(`MCQ next action mismatch for ${scenario.level}: ${JSON.stringify({ nextAction, outcomeGate, proofText })}`);
  }

  const progressAfterMcq = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  if (
    progressAfterMcq?.mcqCompleted !== true ||
    progressAfterMcq?.mcqOutcome !== "Command" ||
    progressAfterMcq?.mcqScorePercent !== 100 ||
    progressAfterMcq?.mcqNextRoute !== scenario.expectedHref ||
    progressAfterMcq?.mcqNextActionLabel !== "Continue to next topic" ||
    progressAfterMcq?.revisitQueued !== false
  ) {
    throw new Error(`MCQ progress did not persist next-topic command for ${scenario.level}: ${JSON.stringify(progressAfterMcq)}`);
  }

  await assertNoOverflow(page, `${scenario.level}-mcq-result`, checks);

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-todays-task").getByText("Origin and Evolution of Earth", { exact: false }).waitFor({ timeout: 15000 });
  const dashboardContract = await page.getByTestId("upsc-simple-dashboard").evaluate((element) => ({
    studentLevel: element.getAttribute("data-student-level"),
    preparationStage: element.getAttribute("data-preparation-stage"),
    nextActionRoom: element.getAttribute("data-next-action-room"),
    nextActionHref: element.getAttribute("data-next-action-href"),
  }));
  const startToday = await page.getByTestId("upsc-start-today").evaluate((element) => ({
    href: element.getAttribute("href"),
    studentLevel: element.getAttribute("data-student-level"),
    nextActionRoom: element.getAttribute("data-next-action-room"),
  }));
  const dailyPathSummary = await page.getByTestId("upsc-generated-daily-path-summary").innerText();
  checks.push({ label: `${scenario.level}-dashboard-day2`, dashboardContract, startToday, dailyPathSummary });

  if (
    dashboardContract.studentLevel !== scenario.level ||
    dashboardContract.nextActionRoom !== scenario.expectedRoom ||
    dashboardContract.nextActionHref !== scenario.expectedHref ||
    startToday.href !== scenario.expectedHref ||
    startToday.nextActionRoom !== scenario.expectedRoom ||
    !dailyPathSummary.toLowerCase().includes("day 2 of")
  ) {
    throw new Error(`Dashboard did not advance to Day 2 for ${scenario.level}: ${JSON.stringify({ dashboardContract, startToday, dailyPathSummary })}`);
  }

  await assertNoOverflow(page, `${scenario.level}-dashboard-day2`, checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  await context.close();
  return {
    scenario,
    checks,
    progressAfterMcq,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const scenario of scenarios) {
    results.push(await runScenario(browser, scenario));
  }

  await browser.close();
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    results,
    passed: results.every((result) => result.passed),
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

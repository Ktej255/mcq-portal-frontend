const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-final-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-final-audit-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
  );
}

function buildMcqQuestion(batchCode, index, correctOption) {
  return {
    test_id: 9600 + index,
    topic_id: 9600 + index,
    text_en: `Final Geography audit question ${index}: choose the strongest map-linked resources and agriculture explanation.`,
    options_en: {
      A: "Location, relief, rainfall, irrigation and market access together shape crop and resource patterns",
      B: "Every mineral belt automatically creates the same crop pattern",
      C: "Agriculture is unrelated to soils, climate and irrigation",
      D: "Resource location has no connection with transport or industries",
    },
    correct_option: correctOption,
    explanation_en:
      "The correct answer connects location, map proof, relief or climate mechanism, and the UPSC trap of single-factor explanation.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: batchCode,
      subject: "Geography",
      day: "13",
      chapter: "India Map Command",
    },
  };
}

async function seedFreshMcqs(page) {
  const questions = [buildMcqQuestion("GEO-D13", 1, "A"), buildMcqQuestion("GEO-D13", 2, "B")];
  await page.evaluate(
    ({ localMcqKey, localDraftStorageKey, seededQuestions }) => {
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D13": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localDraftStorageKey,
        JSON.stringify([
          {
            id: "local-geography-final-audit",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ])
      );
    },
    { localMcqKey: mcqKey, localDraftStorageKey: localDraftKey, seededQuestions: questions }
  );
}

async function completeMcqPractice(page, checks) {
  await seedFreshMcqs(page);
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=13`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-student-next-action-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-next-action").getByText("Continue to next topic", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-mcq-command", checks);
}

async function completeMainSuccessPath(page, checks) {
  await page.goto(`${baseUrl}/upsc/geography/watch?day=13`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(
    ({ progressStorageKey, localMcqKey, localDraftStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_final_audit");
      window.localStorage.removeItem(progressStorageKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localDraftStorageKey);
    },
    { progressStorageKey: progressKey, localMcqKey: mcqKey, localDraftStorageKey: localDraftKey }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-watch-initial", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=13", { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-talk-from-watch", checks);

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Resources and agriculture in India Map Command require minerals, energy, irrigation, crops, and agro-climatic logic.",
      "First, location advantages cause crops, minerals, and industries to cluster where relief, rainfall, soil, transport, and market access connect.",
      "Because irrigation and energy affect regional specialization, map proof such as Deccan plateau mineral belts, western coast, eastern plains, and Ganga irrigation regions explains the pattern.",
      "Finally, the UPSC trap is to assume every industry or crop belt is identical or that only one factor controls all locations; check the regional exception.",
    ].join(" ")
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.waitForFunction(
    () =>
      Boolean(document.querySelector('[data-testid="talk-primary-route"]')) ||
      Boolean(document.querySelector('[data-testid="talk-teacher-follow-up"]')),
    null,
    { timeout: 15000 }
  );
  if (await page.getByTestId("talk-teacher-follow-up").isVisible().catch(() => false)) {
    await page.getByTestId("talk-challenge-response").fill(
      [
        "Resources and agriculture need the complete India Map Command chain: minerals, energy, irrigation, crops, agro-climatic logic, and location advantages.",
        "A crop belt must be explained through rainfall, soil, irrigation, and markets; a mineral belt must be explained through geology, transport, energy, and industries.",
        "For example, Deccan plateau mineral belts and Ganga irrigated crop regions are different map patterns because their causes and effects differ.",
        "The UPSC trap is to overgeneralize one variable or say every region is identical without checking relief, infrastructure, and exceptions.",
      ].join(" ")
    );
    await page.getByTestId("talk-reassess-challenge").click();
  }
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-talk-complete", checks);

  const talkProgress = await getProgress(page, 13);
  if (!talkProgress?.watched || (talkProgress?.talkScore ?? 0) < 70 || talkProgress?.revisitQueued !== false) {
    throw new Error(`Main path Talk did not clear: ${JSON.stringify(talkProgress, null, 2)}`);
  }

  await completeMcqPractice(page, checks);

  const mainProgress = await getProgress(page, 13);
  if (
    mainProgress?.mcqReadinessStatus !== "command" ||
    mainProgress?.mcqOutcome !== "Command" ||
    mainProgress?.mcqScorePercent !== 100 ||
    mainProgress?.mcqNextRoute !== "/upsc/geography/watch?day=14"
  ) {
    throw new Error(`Main Geography path did not finish in command state: ${JSON.stringify(mainProgress, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-track-simple-dashboard", checks);

  return mainProgress;
}

async function completeRevisitBranch(page, checks) {
  await page.goto(`${baseUrl}/upsc/geography/talk?day=10`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    const current = JSON.parse(window.localStorage.getItem(key) || "{}");
    current["10"] = {
      day: 10,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["10-briefing", "10-mechanism", "10-map", "10-trap", "10-recap"],
      confidence: "Working",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-answer-draft").fill("I do not know Indian Monsoon yet.");
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-primary-route").getByText("Open short revision", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "branch-talk-revisit-queued", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/revisit?day=10", { timeout: 15000 });
  await page.getByTestId("geography-revisit-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-repair-note").fill(
    "I corrected the monsoon mechanism with ITCZ movement, jet streams, Arabian Sea and Bay branches, Western Ghats rain shadow, and one non-uniform rainfall trap."
  );
  await page.getByTestId("revisit-repair-note").blur();
  await page.getByText("Repair note saved.", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-complete-and-talk").click();
  await page.waitForURL("**/upsc/geography/talk?day=10", { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "branch-talk-after-revisit", checks);

  const branchProgress = await getProgress(page, 10);
  if (
    branchProgress?.recoveryCompleted !== true ||
    branchProgress?.revisitQueued !== false ||
    branchProgress?.recoveryStatus !== "talk-ready" ||
    branchProgress?.recoveryNextRoute !== "/upsc/geography/talk?day=10"
  ) {
    throw new Error(`Revisit branch did not reset Talk gate correctly: ${JSON.stringify(branchProgress, null, 2)}`);
  }

  return branchProgress;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  await page.addInitScript(({ studentProfileKey }) => {
    window.MOCK_TOKEN = "MOCK_TOKEN_geography_final_audit";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_final_audit");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "60",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      }),
    );
  }, { studentProfileKey: profileKey });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const mainProgress = await completeMainSuccessPath(page, checks);
  const branchProgress = await completeRevisitBranch(page, checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "final-audit-mobile-track", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    mainProgress,
    branchProgress,
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "verify-question-bank-builder-evidence.json");

function progressKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
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

async function seedSession(page, { level, subjectSlug = "geography", progress }) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, learnerLevel, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_question_bank_builder");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: learnerLevel,
          preparationStage: "active",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey(subjectSlug), learnerLevel: level, seededProgress: progress }
  );
}

async function readQuestionBankState(page, label, checks, subjectSlug = "geography") {
  const route =
    subjectSlug === "geography"
      ? `${baseUrl}/upsc/question-bank`
      : `${baseUrl}/upsc/question-bank?subject=${subjectSlug}`;
  await page.goto(route, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-question-bank-hero").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-question-bank-recommendation").waitFor({ timeout: 15000 });

  const state = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    const recommendation = document.querySelector('[data-testid="upsc-question-bank-recommendation"]');
    const aiGap = document.querySelector('[data-testid="upsc-question-bank-ai-gap"]');
    const questions = [...document.querySelectorAll('[data-testid="upsc-question-bank-question"]')].map((node) => ({
      subjectSlug: node.getAttribute("data-subject-slug"),
      difficulty: node.getAttribute("data-question-difficulty"),
      linkedDay: node.getAttribute("data-linked-day"),
      text: node.textContent || "",
    }));

    return {
      activeSubject: hero?.getAttribute("data-active-subject"),
      activeDifficulty: hero?.getAttribute("data-active-difficulty"),
      activeCount: hero?.getAttribute("data-active-count"),
      recommendedDifficulty: recommendation?.getAttribute("data-recommended-difficulty"),
      recommendedCount: recommendation?.getAttribute("data-recommended-count"),
      aiGapCount: recommendation?.getAttribute("data-ai-gap-count"),
      targetDays: recommendation?.getAttribute("data-target-days"),
      aiGapText: aiGap?.textContent || "",
      questions,
    };
  });

  checks.push({ label, state });
  return state;
}

function expectDifficultySet(state, expectedDifficulty, minimumQuestions, label, expectedSubject = "geography") {
  if (state.activeSubject !== expectedSubject) {
    throw new Error(`${label}: expected subject ${expectedSubject}, got ${JSON.stringify(state)}`);
  }
  if (state.recommendedDifficulty !== expectedDifficulty || state.activeDifficulty !== expectedDifficulty) {
    throw new Error(`${label}: expected ${expectedDifficulty}, got ${JSON.stringify(state)}`);
  }
  if (state.questions.length < minimumQuestions) {
    throw new Error(`${label}: expected at least ${minimumQuestions} questions, got ${state.questions.length}`);
  }
  const wrongDifficulty = state.questions.find((question) => question.difficulty !== expectedDifficulty);
  if (wrongDifficulty) {
    throw new Error(`${label}: wrong question difficulty found: ${JSON.stringify(wrongDifficulty)}`);
  }
  const wrongSubject = state.questions.find((question) => question.subjectSlug !== expectedSubject);
  if (wrongSubject) {
    throw new Error(`${label}: wrong question subject found: ${JSON.stringify(wrongSubject)}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedSession(page, {
    level: "beginner",
    progress: {
      1: {
        day: 1,
        watched: true,
        talkScore: 62,
        talkBand: "Revisit",
        revisitQueued: true,
        mcqScorePercent: 40,
        updatedAt: new Date().toISOString(),
      },
    },
  });
  const recoveryState = await readQuestionBankState(page, "recovery-recommends-easy", checks);
  expectDifficultySet(recoveryState, "EASY", 5, "recovery-recommends-easy");
  await assertNoOverflow(page, "question-bank-recovery-desktop", checks);

  await page.getByRole("button", { name: "MEDIUM" }).click();
  await page.waitForFunction(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    return hero?.getAttribute("data-active-difficulty") === "MEDIUM";
  });
  const manualMediumState = await page.evaluate(() => ({
    activeDifficulty: document
      .querySelector('[data-testid="upsc-question-bank-hero"]')
      ?.getAttribute("data-active-difficulty"),
    questionDifficulties: [...document.querySelectorAll('[data-testid="upsc-question-bank-question"]')].map((node) =>
      node.getAttribute("data-question-difficulty")
    ),
  }));
  checks.push({ label: "manual-medium-override", manualMediumState });
  if (
    manualMediumState.activeDifficulty !== "MEDIUM" ||
    manualMediumState.questionDifficulties.some((difficulty) => difficulty !== "MEDIUM")
  ) {
    throw new Error(`manual-medium-override failed: ${JSON.stringify(manualMediumState)}`);
  }

  await seedSession(page, {
    level: "intermediate",
    progress: {
      5: {
        day: 5,
        watched: true,
        talkScore: 86,
        talkBand: "Practice",
        confidence: "Working",
        mcqCompleted: true,
        mcqScorePercent: 68,
        teacherDoubtCategory: "Map proof",
        teacherDoubtReason: "The explanation mentions monsoon but does not place the proof on India map.",
        teacherDoubtRepairAction: "Use one India map anchor before selecting any monsoon option.",
        teacherDoubtMasteryCheck: "Can the learner show the Bay branch or Western Ghats rain-shadow logic?",
        updatedAt: new Date().toISOString(),
      },
    },
  });
  const aiGapState = await readQuestionBankState(page, "teacher-gap-recommends-easy", checks);
  expectDifficultySet(aiGapState, "EASY", 5, "teacher-gap-recommends-easy");
  if (
    aiGapState.aiGapCount !== "1" ||
    aiGapState.targetDays !== "5" ||
    !aiGapState.aiGapText.includes("Map proof") ||
    !aiGapState.aiGapText.includes("India map anchor") ||
    aiGapState.questions[0]?.linkedDay !== "5"
  ) {
    throw new Error(`teacher-gap-recommends-easy failed: ${JSON.stringify(aiGapState)}`);
  }

  await seedSession(page, {
    level: "advanced",
    progress: {
      3: {
        day: 3,
        watched: true,
        talkScore: 96,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 86,
        updatedAt: new Date().toISOString(),
      },
      8: {
        day: 8,
        watched: true,
        talkScore: 98,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 88,
        updatedAt: new Date().toISOString(),
      },
      13: {
        day: 13,
        watched: true,
        talkScore: 95,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 90,
        updatedAt: new Date().toISOString(),
      },
    },
  });
  const commandState = await readQuestionBankState(page, "command-recommends-hard", checks);
  expectDifficultySet(commandState, "HARD", 5, "command-recommends-hard");

  await seedSession(page, {
    level: "advanced",
    subjectSlug: "environment",
    progress: {
      1: {
        day: 1,
        watched: true,
        talkScore: 97,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 86,
        updatedAt: new Date().toISOString(),
      },
      2: {
        day: 2,
        watched: true,
        talkScore: 95,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 84,
        updatedAt: new Date().toISOString(),
      },
      3: {
        day: 3,
        watched: true,
        talkScore: 98,
        talkBand: "Command",
        confidence: "Command",
        mcqCompleted: true,
        mcqScorePercent: 90,
        updatedAt: new Date().toISOString(),
      },
    },
  });
  const environmentState = await readQuestionBankState(page, "environment-command-recommends-hard", checks, "environment");
  expectDifficultySet(environmentState, "HARD", 5, "environment-command-recommends-hard", "environment");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/question-bank`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-question-bank-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "question-bank-mobile", checks);

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${baseUrl}/history`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("student-question-bank-entry").waitFor({ timeout: 15000 });
  const historyHref = await page
    .getByTestId("student-question-bank-entry")
    .getByRole("link", { name: /Open question bank/i })
    .getAttribute("href");
  checks.push({ label: "history-question-bank-entry", historyHref });
  if (historyHref !== "/upsc/question-bank") {
    throw new Error(`history-question-bank-entry failed: ${historyHref}`);
  }
  await assertNoOverflow(page, "history-question-bank-entry-desktop", checks);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized")
  );
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: actionableConsoleErrors.length === 0 && pageErrors.length === 0,
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

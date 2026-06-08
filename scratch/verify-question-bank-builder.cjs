const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const attemptKey = "sarit-upsc-question-bank-attempts-v1";
const pyqLedgerKey = "sarit-upsc-pyq-import-ledger-v1";
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

async function seedSession(page, { level, subjectSlug = "geography", progress, pyqRecords = [] }) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, learnerLevel, seededProgress, pyqImportStorageKey, seededPyqRecords }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_question_bank_builder");
      window.localStorage.removeItem("sarit-upsc-question-bank-attempts-v1");
      window.localStorage.setItem(pyqImportStorageKey, JSON.stringify(seededPyqRecords));
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
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey(subjectSlug),
      learnerLevel: level,
      seededProgress: progress,
      pyqImportStorageKey: pyqLedgerKey,
      seededPyqRecords: pyqRecords,
    }
  );
}

async function readQuestionBankState(page, label, checks, subjectSlug = "geography", options = {}) {
  const route =
    subjectSlug === "geography"
      ? `${baseUrl}/upsc/question-bank`
      : `${baseUrl}/upsc/question-bank?subject=${subjectSlug}`;
  if (options.navigate !== false) {
    await page.goto(route, { waitUntil: "networkidle", timeout: 45000 });
  }
  await page.getByTestId("upsc-question-bank-hero").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-question-bank-recommendation").waitFor({ timeout: 15000 });

  const state = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    const recommendation = document.querySelector('[data-testid="upsc-question-bank-recommendation"]');
    const selectionProof = document.querySelector('[data-testid="upsc-question-bank-selection-proof"]');
    const coverageProof = document.querySelector('[data-testid="upsc-question-bank-coverage-proof"]');
    const aiGap = document.querySelector('[data-testid="upsc-question-bank-ai-gap"]');
    const questions = [...document.querySelectorAll('[data-testid="upsc-question-bank-question"]')].map((node) => ({
      subjectSlug: node.getAttribute("data-subject-slug"),
      id: node.getAttribute("data-question-id"),
      difficulty: node.getAttribute("data-question-difficulty"),
      linkedDay: node.getAttribute("data-linked-day"),
      source: node.getAttribute("data-question-source"),
      exactPyqImport: node.getAttribute("data-exact-pyq-import"),
      sourceYear: node.getAttribute("data-source-year"),
      questionNumber: node.getAttribute("data-question-number"),
      solvedState: node.getAttribute("data-solved-state"),
      text: node.textContent || "",
    }));
    const ledger = document.querySelector('[data-testid="upsc-question-bank-ledger"]');

    return {
      activeSubject: hero?.getAttribute("data-active-subject"),
      activeDifficulty: hero?.getAttribute("data-active-difficulty"),
      activeCount: hero?.getAttribute("data-active-count"),
      customMode: hero?.getAttribute("data-custom-mode"),
      customMix: hero?.getAttribute("data-custom-mix"),
      recommendedDifficulty: recommendation?.getAttribute("data-recommended-difficulty"),
      recommendedCount: recommendation?.getAttribute("data-recommended-count"),
      aiGapCount: recommendation?.getAttribute("data-ai-gap-count"),
      targetDays: recommendation?.getAttribute("data-target-days"),
      solvedCount: recommendation?.getAttribute("data-solved-count"),
      solvedAccuracy: recommendation?.getAttribute("data-solved-accuracy"),
      unresolvedIncorrectCount: recommendation?.getAttribute("data-unresolved-incorrect-count"),
      adaptiveLevel: recommendation?.getAttribute("data-adaptive-level"),
      adaptiveScore: recommendation?.getAttribute("data-adaptive-score"),
      visibleQuestionRows: hero?.getAttribute("data-visible-question-rows"),
      importedExactQuestionRows: hero?.getAttribute("data-imported-exact-question-rows"),
      activeSubjectImportedExactRows: hero?.getAttribute("data-active-subject-imported-exact-rows"),
      recallPoints: recommendation?.getAttribute("data-recall-points"),
      consistencyPoints: recommendation?.getAttribute("data-consistency-points"),
      mcqPoints: recommendation?.getAttribute("data-mcq-points"),
      ledgerPoints: recommendation?.getAttribute("data-ledger-points"),
      commandBonus: recommendation?.getAttribute("data-command-bonus"),
      recoveryPenalty: recommendation?.getAttribute("data-recovery-penalty"),
      coverage: {
        subjectCount: coverageProof?.getAttribute("data-subject-count"),
        totalDays: coverageProof?.getAttribute("data-total-days"),
        totalQuestionRows: coverageProof?.getAttribute("data-total-question-rows"),
        curatedQuestionRows: coverageProof?.getAttribute("data-curated-question-rows"),
        generatedQuestionRows: coverageProof?.getAttribute("data-generated-question-rows"),
        coveredDifficultySlots: coverageProof?.getAttribute("data-covered-difficulty-slots"),
        expectedDifficultySlots: coverageProof?.getAttribute("data-expected-difficulty-slots"),
        fullCoverageSubjects: coverageProof?.getAttribute("data-full-coverage-subjects"),
        activeSubject: coverageProof?.getAttribute("data-active-subject"),
        activeSubjectDays: coverageProof?.getAttribute("data-active-subject-days"),
        activeSubjectQuestions: coverageProof?.getAttribute("data-active-subject-questions"),
        activeSubjectVisibleQuestions: coverageProof?.getAttribute("data-active-subject-visible-questions"),
        activeSubjectImportedExactRows: coverageProof?.getAttribute("data-active-subject-imported-exact-rows"),
        activeSubjectSlots: coverageProof?.getAttribute("data-active-subject-slots"),
        activeSubjectExpectedSlots: coverageProof?.getAttribute("data-active-subject-expected-slots"),
        activeSubjectFullCoverage: coverageProof?.getAttribute("data-active-subject-full-coverage"),
        text: coverageProof?.textContent || "",
      },
      adaptiveLevelText:
        document.querySelector('[data-testid="upsc-question-bank-adaptive-level"]')?.textContent || "",
      selectionProof: {
        evidenceRule: selectionProof?.getAttribute("data-evidence-rule"),
        activeDifficulty: selectionProof?.getAttribute("data-active-difficulty"),
        recommendedDifficulty: selectionProof?.getAttribute("data-recommended-difficulty"),
        manualOverride: selectionProof?.getAttribute("data-manual-override"),
        customMode: selectionProof?.getAttribute("data-custom-mode"),
        customRequestedTotal: selectionProof?.getAttribute("data-custom-requested-total"),
        customMix: selectionProof?.getAttribute("data-custom-mix"),
        adaptiveScore: selectionProof?.getAttribute("data-adaptive-score"),
        adaptiveLevel: selectionProof?.getAttribute("data-adaptive-level"),
        text: selectionProof?.textContent || "",
        rows: [...document.querySelectorAll('[data-testid="upsc-question-bank-proof-row"]')].map((row) => ({
          id: row.getAttribute("data-proof-id"),
          value: row.getAttribute("data-proof-value"),
          points: row.getAttribute("data-proof-points"),
          text: row.textContent || "",
        })),
      },
      customMixProof: (() => {
        const customMix = document.querySelector('[data-testid="upsc-question-bank-custom-mix"]');
        return {
          customMode: customMix?.getAttribute("data-custom-mode"),
          requestedTotal: customMix?.getAttribute("data-requested-total"),
          displayedTotal: customMix?.getAttribute("data-displayed-total"),
          customMix: customMix?.getAttribute("data-custom-mix"),
          displayedMix: customMix?.getAttribute("data-displayed-mix"),
          text: customMix?.textContent || "",
        };
      })(),
      exactPyqBridge: (() => {
        const bridge = document.querySelector('[data-testid="upsc-question-bank-exact-pyq-bridge"]');
        return {
          proofRule: bridge?.getAttribute("data-proof-rule"),
          totalImportedExactQuestions: bridge?.getAttribute("data-total-imported-exact-questions"),
          activeSubject: bridge?.getAttribute("data-active-subject"),
          activeSubjectExactQuestions: bridge?.getAttribute("data-active-subject-exact-questions"),
          displayedExactQuestions: bridge?.getAttribute("data-displayed-exact-questions"),
          text: bridge?.textContent || "",
          rows: [...document.querySelectorAll('[data-testid="upsc-question-bank-exact-pyq-row"]')].map((row) => ({
            id: row.getAttribute("data-question-id"),
            subjectSlug: row.getAttribute("data-subject-slug"),
            year: row.getAttribute("data-source-year"),
            questionNumber: row.getAttribute("data-question-number"),
            text: row.textContent || "",
          })),
        };
      })(),
      ledgerText: ledger?.textContent || "",
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

function parseMix(mix) {
  return Object.fromEntries(
    (mix || "")
      .split("|")
      .filter(Boolean)
      .map((entry) => {
        const [difficulty, count] = entry.split(":");
        return [difficulty, Number(count)];
      })
  );
}

function expectMixedSet(state, expectedMix, label, expectedSubject = "geography") {
  const displayedMix = parseMix(state.customMixProof.displayedMix);
  const requestedMix = parseMix(state.customMixProof.customMix);
  const requestedTotal = Object.values(expectedMix).reduce((sum, count) => sum + count, 0);

  if (
    state.activeSubject !== expectedSubject ||
    state.activeDifficulty !== "CUSTOM_MIX" ||
    state.customMode !== "true" ||
    state.selectionProof.activeDifficulty !== "CUSTOM_MIX" ||
    state.selectionProof.customMode !== "true" ||
    state.customMixProof.customMode !== "true" ||
    Number(state.customMixProof.requestedTotal) !== requestedTotal
  ) {
    throw new Error(`${label}: custom mode did not activate correctly: ${JSON.stringify(state)}`);
  }

  for (const [difficulty, count] of Object.entries(expectedMix)) {
    if (requestedMix[difficulty] !== count) {
      throw new Error(`${label}: requested ${difficulty} mix mismatch: ${JSON.stringify(state.customMixProof)}`);
    }
    if (displayedMix[difficulty] !== count) {
      throw new Error(`${label}: displayed ${difficulty} mix mismatch: ${JSON.stringify(state.customMixProof)}`);
    }
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
  if (
    recoveryState.adaptiveLevel !== "beginner" ||
    recoveryState.recallPoints !== "6" ||
    recoveryState.mcqPoints !== "4" ||
    recoveryState.recoveryPenalty !== "12" ||
    !recoveryState.adaptiveLevelText.includes("Evidence-derived MCQ level") ||
    recoveryState.selectionProof.evidenceRule !== "recall-consistency-marks-ledger-command-recovery" ||
    recoveryState.selectionProof.activeDifficulty !== "EASY" ||
    recoveryState.selectionProof.recommendedDifficulty !== "EASY" ||
    recoveryState.selectionProof.manualOverride !== "false" ||
    recoveryState.selectionProof.rows.length !== 6 ||
    !recoveryState.selectionProof.rows.some((row) => row.id === "recall" && row.points === "6" && row.value === "62/100") ||
    !recoveryState.selectionProof.rows.some((row) => row.id === "mcq-marks" && row.points === "4" && row.value === "40%") ||
    !recoveryState.selectionProof.rows.some((row) => row.id === "recovery" && row.points === "-12")
  ) {
    throw new Error(`recovery adaptive level failed: ${JSON.stringify(recoveryState)}`);
  }
  if (
    recoveryState.coverage.subjectCount !== "8" ||
    recoveryState.coverage.totalDays !== "201" ||
    recoveryState.coverage.coveredDifficultySlots !== recoveryState.coverage.expectedDifficultySlots ||
    recoveryState.coverage.fullCoverageSubjects !== "8" ||
    recoveryState.coverage.activeSubject !== "geography" ||
    recoveryState.coverage.activeSubjectDays !== "30" ||
    recoveryState.coverage.activeSubjectSlots !== recoveryState.coverage.activeSubjectExpectedSlots ||
    recoveryState.coverage.activeSubjectFullCoverage !== "true" ||
    Number(recoveryState.coverage.totalQuestionRows) < 804 ||
    Number(recoveryState.coverage.generatedQuestionRows) < 780 ||
    !recoveryState.coverage.text.includes("Full subjects")
  ) {
    throw new Error(`question bank full coverage proof failed: ${JSON.stringify(recoveryState.coverage)}`);
  }
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
    selectionProof: {
      activeDifficulty: document
        .querySelector('[data-testid="upsc-question-bank-selection-proof"]')
        ?.getAttribute("data-active-difficulty"),
      recommendedDifficulty: document
        .querySelector('[data-testid="upsc-question-bank-selection-proof"]')
        ?.getAttribute("data-recommended-difficulty"),
      manualOverride: document
        .querySelector('[data-testid="upsc-question-bank-selection-proof"]')
        ?.getAttribute("data-manual-override"),
    },
    questionDifficulties: [...document.querySelectorAll('[data-testid="upsc-question-bank-question"]')].map((node) =>
      node.getAttribute("data-question-difficulty")
    ),
  }));
  checks.push({ label: "manual-medium-override", manualMediumState });
  if (
    manualMediumState.activeDifficulty !== "MEDIUM" ||
    manualMediumState.selectionProof.activeDifficulty !== "MEDIUM" ||
    manualMediumState.selectionProof.recommendedDifficulty !== "EASY" ||
    manualMediumState.selectionProof.manualOverride !== "true" ||
    manualMediumState.questionDifficulties.some((difficulty) => difficulty !== "MEDIUM")
  ) {
    throw new Error(`manual-medium-override failed: ${JSON.stringify(manualMediumState)}`);
  }

  await page.getByRole("button", { name: "Use adaptive mix" }).click();
  await page.waitForFunction(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    return (
      hero?.getAttribute("data-custom-mode") === "true" &&
      hero?.getAttribute("data-active-difficulty") === "CUSTOM_MIX"
    );
  });
  const recoveryCustomMixState = await readQuestionBankState(page, "recovery-custom-mix", checks, "geography", { navigate: false });
  expectMixedSet(recoveryCustomMixState, { EASY: 4, MEDIUM: 2, HARD: 0, PYQ_STYLE: 1 }, "recovery-custom-mix");
  await page.getByTestId("upsc-question-bank-mix-hard").fill("1");
  await page.waitForFunction(() => {
    const customMix = document.querySelector('[data-testid="upsc-question-bank-custom-mix"]');
    return (
      customMix?.getAttribute("data-custom-mix") === "EASY:4|MEDIUM:2|HARD:1|PYQ_STYLE:1" &&
      customMix?.getAttribute("data-displayed-mix") === "EASY:4|MEDIUM:2|HARD:1|PYQ_STYLE:1"
    );
  });
  const recoveryEditedCustomMixState = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    const customMix = document.querySelector('[data-testid="upsc-question-bank-custom-mix"]');
    return {
      activeDifficulty: hero?.getAttribute("data-active-difficulty"),
      activeCount: hero?.getAttribute("data-active-count"),
      customMode: hero?.getAttribute("data-custom-mode"),
      customMix: customMix?.getAttribute("data-custom-mix"),
      displayedMix: customMix?.getAttribute("data-displayed-mix"),
      questionDifficulties: [...document.querySelectorAll('[data-testid="upsc-question-bank-question"]')].map((node) =>
        node.getAttribute("data-question-difficulty")
      ),
    };
  });
  checks.push({ label: "recovery-edited-custom-mix", recoveryEditedCustomMixState });
  if (
    recoveryEditedCustomMixState.activeDifficulty !== "CUSTOM_MIX" ||
    recoveryEditedCustomMixState.activeCount !== "8" ||
    recoveryEditedCustomMixState.customMode !== "true" ||
    recoveryEditedCustomMixState.customMix !== "EASY:4|MEDIUM:2|HARD:1|PYQ_STYLE:1" ||
    recoveryEditedCustomMixState.displayedMix !== "EASY:4|MEDIUM:2|HARD:1|PYQ_STYLE:1" ||
    !recoveryEditedCustomMixState.questionDifficulties.includes("HARD")
  ) {
    throw new Error(`recovery-edited-custom-mix failed: ${JSON.stringify(recoveryEditedCustomMixState)}`);
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
    aiGapState.selectionProof.rows.length !== 6 ||
    !aiGapState.selectionProof.rows.some((row) => row.id === "recovery" && row.points === "-27") ||
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
  if (
    commandState.adaptiveLevel !== "advanced" ||
    commandState.adaptiveScore !== "80" ||
    commandState.recallPoints !== "35" ||
    commandState.mcqPoints !== "30" ||
    commandState.commandBonus !== "9" ||
    commandState.selectionProof.activeDifficulty !== "HARD" ||
    commandState.selectionProof.adaptiveLevel !== "advanced" ||
    !commandState.selectionProof.rows.some((row) => row.id === "command" && row.points === "9") ||
    !commandState.selectionProof.rows.some((row) => row.id === "recovery" && row.points === "0")
  ) {
    throw new Error(`command adaptive level failed: ${JSON.stringify(commandState)}`);
  }

  const exactGeographyPyqRecord = {
    id: "2025-prelims-geography-general-studies-paper-i-q42",
    year: 2025,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    paper: "General Studies Paper I",
    questionNumber: "Q42",
    questionText:
      "Which location-process link best explains why a monsoon question must be solved through map logic and atmospheric mechanism together?",
    syllabusArea: "Indian monsoon and map reasoning",
    syllabusNodeId: "geo-climate",
    topicTags: ["monsoon", "map", "atmospheric mechanism"],
    trendInsightId: "geo-map-process",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202025",
    officialSourceTitle: "Civil Services Preliminary Examination 2025 Question Papers",
    answerDemand: "Prelims map-process elimination",
    importStatus: "MAPPED",
    textStatus: "EXACT_VERIFIED",
    importedAt: new Date().toISOString(),
  };

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
    pyqRecords: [exactGeographyPyqRecord],
  });
  const exactBridgeInitialState = await readQuestionBankState(page, "exact-pyq-bridge-loaded", checks);
  if (
    exactBridgeInitialState.importedExactQuestionRows !== "1" ||
    exactBridgeInitialState.activeSubjectImportedExactRows !== "1" ||
    exactBridgeInitialState.coverage.activeSubjectImportedExactRows !== "1" ||
    exactBridgeInitialState.exactPyqBridge.proofRule !== "mapped-exact-pyq-imports-become-demand-drills" ||
    exactBridgeInitialState.exactPyqBridge.totalImportedExactQuestions !== "1" ||
    exactBridgeInitialState.exactPyqBridge.activeSubjectExactQuestions !== "1" ||
    exactBridgeInitialState.exactPyqBridge.rows.length !== 1 ||
    !exactBridgeInitialState.exactPyqBridge.text.includes("answer-key claim honest")
  ) {
    throw new Error(`Exact PYQ bridge did not load: ${JSON.stringify(exactBridgeInitialState.exactPyqBridge)}`);
  }

  await page.getByRole("button", { name: "PYQ STYLE" }).click();
  await page.waitForFunction(() => {
    const hero = document.querySelector('[data-testid="upsc-question-bank-hero"]');
    const firstQuestion = document.querySelector('[data-testid="upsc-question-bank-question"]');
    return (
      hero?.getAttribute("data-active-difficulty") === "PYQ_STYLE" &&
      firstQuestion?.getAttribute("data-question-source") === "EXACT_PYQ_IMPORT"
    );
  });
  const exactPyqPracticeState = await readQuestionBankState(page, "exact-pyq-practice-visible", checks, "geography", {
    navigate: false,
  });
  const firstExactQuestion = exactPyqPracticeState.questions[0];
  if (
    exactPyqPracticeState.activeDifficulty !== "PYQ_STYLE" ||
    exactPyqPracticeState.exactPyqBridge.displayedExactQuestions !== "1" ||
    firstExactQuestion?.id !== `exact-pyq-${exactGeographyPyqRecord.id}` ||
    firstExactQuestion?.source !== "EXACT_PYQ_IMPORT" ||
    firstExactQuestion?.exactPyqImport !== "true" ||
    firstExactQuestion?.sourceYear !== "2025" ||
    firstExactQuestion?.questionNumber !== "Q42" ||
    !firstExactQuestion.text.includes("Exact PYQ demand drill") ||
    !firstExactQuestion.text.includes("official answer options/key are not claimed")
  ) {
    throw new Error(`Exact PYQ practice card failed: ${JSON.stringify(exactPyqPracticeState)}`);
  }
  await page
    .locator('[data-testid="upsc-question-bank-question"]')
    .first()
    .getByTestId("upsc-question-bank-option")
    .filter({ hasText: /^A\./ })
    .click();
  await page.getByTestId("upsc-question-bank-solved-proof").first().getByText("Correct evidence saved", { exact: false }).waitFor({ timeout: 15000 });
  const storedExactAttempt = await page.evaluate(
    ({ storageKey, questionId }) => JSON.parse(window.localStorage.getItem(storageKey) || "{}")[questionId],
    { storageKey: attemptKey, questionId: `exact-pyq-${exactGeographyPyqRecord.id}` }
  );
  checks.push({ label: "exact-pyq-demand-drill-ledger-storage", storedExactAttempt });
  if (
    storedExactAttempt?.questionId !== `exact-pyq-${exactGeographyPyqRecord.id}` ||
    storedExactAttempt?.subjectSlug !== "geography" ||
    storedExactAttempt?.difficulty !== "PYQ_STYLE" ||
    storedExactAttempt?.source !== "EXACT_PYQ_IMPORT" ||
    storedExactAttempt?.selectedOption !== "A" ||
    storedExactAttempt?.isCorrect !== true
  ) {
    throw new Error(`Exact PYQ attempt did not persist correctly: ${JSON.stringify(storedExactAttempt)}`);
  }

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
  if (
    environmentState.coverage.activeSubject !== "environment" ||
    environmentState.coverage.activeSubjectFullCoverage !== "true" ||
    Number(environmentState.coverage.activeSubjectDays) < 20 ||
    Number(environmentState.coverage.activeSubjectQuestions) < Number(environmentState.coverage.activeSubjectExpectedSlots)
  ) {
    throw new Error(`environment question bank coverage failed: ${JSON.stringify(environmentState.coverage)}`);
  }
  const firstEnvironmentQuestionId = environmentState.questions[0]?.id;
  if (!firstEnvironmentQuestionId) {
    throw new Error(`Missing first environment question id: ${JSON.stringify(environmentState)}`);
  }
  await page
    .locator('[data-testid="upsc-question-bank-question"]')
    .first()
    .getByTestId("upsc-question-bank-option")
    .filter({ hasText: /^A\./ })
    .click();
  await page.getByTestId("upsc-question-bank-ledger").getByText("Solved", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-question-bank-solved-proof").first().getByText("Correct evidence saved", { exact: false }).waitFor({ timeout: 15000 });
  const storedAttempt = await page.evaluate(
    ({ storageKey, questionId }) => JSON.parse(window.localStorage.getItem(storageKey) || "{}")[questionId],
    { storageKey: attemptKey, questionId: firstEnvironmentQuestionId }
  );
  checks.push({ label: "question-bank-solved-ledger-storage", firstEnvironmentQuestionId, storedAttempt });
  if (
    storedAttempt?.questionId !== firstEnvironmentQuestionId ||
    storedAttempt?.subjectSlug !== "environment" ||
    storedAttempt?.selectedOption !== "A" ||
    storedAttempt?.isCorrect !== true
  ) {
    throw new Error(`Solved ledger did not persist correctly: ${JSON.stringify(storedAttempt)}`);
  }
  const environmentAfterSolve = await readQuestionBankState(page, "environment-unsolved-priority-after-solve", checks, "environment");
  if (
    environmentAfterSolve.solvedCount !== "1" ||
    environmentAfterSolve.solvedAccuracy !== "100" ||
    environmentAfterSolve.questions[0]?.id === firstEnvironmentQuestionId ||
    environmentAfterSolve.questions.some((question) => question.id === firstEnvironmentQuestionId && question.solvedState !== "correct")
  ) {
    throw new Error(`Unsolved-priority ledger failed: ${JSON.stringify(environmentAfterSolve)}`);
  }

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

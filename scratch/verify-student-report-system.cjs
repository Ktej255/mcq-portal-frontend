const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const environmentProgressKey = "sarit-upsc-environment-progress-v1";
const dailyCommandKey = "sarit-upsc-daily-command-v1";
const questionBankAttemptKey = "sarit-upsc-question-bank-attempts-v1";
const autoSessionHandoffKey = "sarit-upsc-auto-session-handoff-v1";
const evidencePath = path.join(__dirname, "verify-student-report-system-evidence.json");

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

function readNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric ${label}, got ${value}`);
  }
  return parsed;
}

async function seedProfileAndProgress(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, envProgressStorageKey, dailyStorageKey, attemptStorageKey, handoffStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_report_system");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "advanced",
          preparationStage: "multiple-attempts",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        dailyStorageKey,
        JSON.stringify({
          subjectSlug: "geography",
          day: 1,
          note: "Report should show the same repair lock as Daily Mission.",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        attemptStorageKey,
        JSON.stringify({
          "geo-d02-medium-gis-scale": {
            questionId: "geo-d02-medium-gis-scale",
            subjectSlug: "geography",
            linkedDay: 2,
            topic: "Earth, Universe, and Location",
            difficulty: "MEDIUM",
            source: "REFERENCE_ADVANCED",
            selectedOption: "A",
            correctOption: "A",
            isCorrect: true,
            solvedAt: new Date().toISOString(),
          },
          "exact-pyq-2025-prelims-geography-general-studies-paper-i-q42": {
            questionId: "exact-pyq-2025-prelims-geography-general-studies-paper-i-q42",
            subjectSlug: "geography",
            linkedDay: 1,
            topic: "Indian monsoon and map reasoning",
            difficulty: "PYQ_STYLE",
            source: "EXACT_PYQ_IMPORT",
            selectedOption: "B",
            correctOption: "A",
            isCorrect: false,
            solvedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        progressStorageKey,
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            talkScore: 62,
            talkBand: "Revisit",
            revisitQueued: true,
            teacherDoubtCategory: "Mechanism",
            teacherDoubtReason: "The answer names location but misses the cause-effect chain.",
            teacherDoubtRepairAction: "Build one because-chain for location, relief, rainfall, and consequence.",
            teacherDoubtMasteryCheck: "Can the learner explain the sequence without skipping the middle cause?",
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "focused",
            updatedAt: new Date().toISOString(),
          },
          5: {
            day: 5,
            watched: true,
            talkScore: 96,
            talkBand: "Command",
            confidence: "Command",
            mcqCompleted: true,
            mcqScorePercent: 80,
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "calm",
            updatedAt: new Date().toISOString(),
          },
          6: {
            day: 6,
            reflection: "Ocean currents and marine heatwaves are linked.",
            talkScore: 88,
            talkBand: "Practice",
            mcqCompleted: true,
            mcqScorePercent: 60,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        envProgressStorageKey,
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            reflection: "Ecology foundation is connected with habitat and niche.",
            talkScore: 97,
            talkBand: "Command",
            confidence: "Command",
            mcqCompleted: true,
            mcqScorePercent: 84,
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "exam-stress",
            meTimeResetPlan: "Two-minute breathing and one diagram before class.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        handoffStorageKey,
        JSON.stringify({
          id: "geography-d1-to-d1-repair-first-report-proof",
          subjectSlug: "geography",
          sourceDay: 1,
          targetDay: 1,
          targetTitle: "Geographic Thinking and Map Relationships",
          statusLabel: "Repair first",
          href: "/upsc/geography/talk?day=1",
          actionLabel: "Repeat talk",
          canAdvance: false,
          evidenceUsed: 2,
          evidenceMissing: 1,
          blockers: 2,
          readinessStatus: "Repair lock",
          readinessScorePercent: 40,
          learningGapTitle: "AI found Mechanism gap",
          revisionDueLabel: "AI gap",
          studentInstruction: "Do not open new load yet. Clear 2 blockers before moving ahead.",
          reportHref: "/reports",
          questionBankHref: "/upsc/question-bank?subject=geography",
          proofRule: "automatic-new-day-handoff-from-me-time-recall-class-discussion-mcq-revision-report",
          generatedAt: new Date().toISOString(),
          selectedDay: 1,
          selectedSubjectSlug: "geography",
        })
      );
    },
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey,
      envProgressStorageKey: environmentProgressKey,
      dailyStorageKey: dailyCommandKey,
      attemptStorageKey: questionBankAttemptKey,
      handoffStorageKey: autoSessionHandoffKey,
    }
  );
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

  await seedProfileAndProgress(page);
  await page.goto(`${baseUrl}/reports`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("student-gap-primary-action").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-current-readiness-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-student-report-summary").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-auto-session-report-bridge").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-auto-report-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report-windows").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-report-evidence-streams").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-growth-scale").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-monthly-report").waitFor({ timeout: 15000 });

  const href = await page.getByTestId("student-gap-primary-action").getAttribute("href");
  const readinessReport = await page.getByTestId("upsc-current-readiness-report").evaluate((node) => ({
    subject: node.getAttribute("data-readiness-subject"),
    day: node.getAttribute("data-readiness-day"),
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
    text: node.textContent || "",
  }));
  const readinessHref = await page.getByTestId("upsc-current-readiness-action").getAttribute("href");
  const studentSummaryProof = await page.getByTestId("upsc-student-report-summary").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    activeSubject: node.getAttribute("data-active-subject"),
    activeDay: node.getAttribute("data-active-day"),
    currentReadiness: node.getAttribute("data-current-readiness"),
    currentAction: node.getAttribute("data-current-action"),
    currentActionHref: node.getAttribute("data-current-action-href"),
    weeklyReportId: node.getAttribute("data-weekly-report-id"),
    monthlyReportId: node.getAttribute("data-monthly-report-id"),
    growthPercent: node.getAttribute("data-growth-percent"),
    startedDays: node.getAttribute("data-started-days"),
    totalDays: node.getAttribute("data-total-days"),
    aiGapCount: node.getAttribute("data-ai-gap-count"),
    recoveryItems: node.getAttribute("data-recovery-items"),
    meTimeChecks: node.getAttribute("data-me-time-checks"),
    currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
    questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
    questionBankCorrect: node.getAttribute("data-question-bank-correct"),
    questionBankAccuracy: node.getAttribute("data-question-bank-accuracy"),
    exactPyqAttempts: node.getAttribute("data-exact-pyq-attempts"),
    exactPyqCorrect: node.getAttribute("data-exact-pyq-correct"),
    exactPyqAccuracy: node.getAttribute("data-exact-pyq-accuracy"),
    text: node.textContent || "",
  }));
  const studentSummaryActionHref = await page.getByTestId("upsc-student-report-summary-action").getAttribute("href");
  const studentSummaryCards = await page.getByTestId("upsc-student-report-summary-card").evaluateAll((nodes) =>
    nodes.map((node) => ({
      cardId: node.getAttribute("data-card-id"),
      text: node.textContent || "",
    }))
  );
  const autoHandoffBridge = await page.getByTestId("upsc-auto-session-report-bridge").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    status: node.getAttribute("data-handoff-status"),
    current: node.getAttribute("data-handoff-current"),
    id: node.getAttribute("data-handoff-id"),
    subjectSlug: node.getAttribute("data-subject-slug"),
    selectedDay: node.getAttribute("data-selected-day"),
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    statusLabel: node.getAttribute("data-status-label"),
    actionLabel: node.getAttribute("data-action-label"),
    actionHref: node.getAttribute("data-action-href"),
    canAdvance: node.getAttribute("data-can-advance"),
    evidenceUsed: node.getAttribute("data-evidence-used"),
    evidenceMissing: node.getAttribute("data-evidence-missing"),
    blockers: node.getAttribute("data-blockers"),
    readinessStatus: node.getAttribute("data-readiness-status"),
    readinessScore: node.getAttribute("data-readiness-score"),
    learningGap: node.getAttribute("data-learning-gap"),
    revisionDue: node.getAttribute("data-revision-due"),
    reportHref: node.getAttribute("data-report-href"),
    questionBankHref: node.getAttribute("data-question-bank-href"),
    text: node.textContent || "",
  }));
  const autoHandoffActionHref = await page.getByTestId("upsc-auto-session-report-action").getAttribute("href");
  const allSubjectText = await page.getByTestId("upsc-all-subject-report").innerText();
  const allSubjectProof = await page.getByTestId("upsc-all-subject-report").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    subjectCount: node.getAttribute("data-subject-count"),
    totalDays: node.getAttribute("data-total-days"),
    startedDays: node.getAttribute("data-started-days"),
    watchedDays: node.getAttribute("data-watched-days"),
    commandDays: node.getAttribute("data-command-days"),
    recoveryItems: node.getAttribute("data-recovery-items"),
    aiGapCount: node.getAttribute("data-ai-gap-count"),
    meTimeChecks: node.getAttribute("data-me-time-checks"),
    currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
    weeklyWindowsGenerated: node.getAttribute("data-weekly-windows-generated"),
    averageRecall: node.getAttribute("data-average-recall"),
    averageMcq: node.getAttribute("data-average-mcq"),
    questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
    questionBankCorrect: node.getAttribute("data-question-bank-correct"),
    questionBankAccuracy: node.getAttribute("data-question-bank-accuracy"),
    exactPyqAttempts: node.getAttribute("data-exact-pyq-attempts"),
    exactPyqCorrect: node.getAttribute("data-exact-pyq-correct"),
    exactPyqAccuracy: node.getAttribute("data-exact-pyq-accuracy"),
    growthPercent: node.getAttribute("data-growth-percent"),
  }));
  const autoReportProof = await page.getByTestId("upsc-auto-report-proof").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    weeklyReportId: node.getAttribute("data-weekly-report-id"),
    monthlyReportId: node.getAttribute("data-monthly-report-id"),
    growthBaseline: node.getAttribute("data-growth-baseline"),
    growthNow: node.getAttribute("data-growth-now"),
    nextWeeklyAction: node.getAttribute("data-next-weekly-action"),
    nextMonthlyAction: node.getAttribute("data-next-monthly-action"),
    text: node.textContent || "",
  }));
  const allSubjectWindowText = await page.getByTestId("upsc-all-subject-report-windows").innerText();
  const allSubjectWeeklyCount = await page.getByTestId("upsc-all-subject-weekly-report").count();
  const allSubjectWeeklyProofs = await page.getByTestId("upsc-all-subject-weekly-report").evaluateAll((nodes) =>
    nodes.map((node) => ({
      reportId: node.getAttribute("data-report-id"),
      variant: node.getAttribute("data-report-variant"),
      subjectCount: node.getAttribute("data-subject-count"),
      startedDays: node.getAttribute("data-started-days"),
      aiGapCount: node.getAttribute("data-ai-gap-count"),
      meTimeChecks: node.getAttribute("data-me-time-checks"),
      currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
      questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
      questionBankCorrect: node.getAttribute("data-question-bank-correct"),
      questionBankAccuracy: node.getAttribute("data-question-bank-accuracy"),
      exactPyqAttempts: node.getAttribute("data-exact-pyq-attempts"),
      exactPyqCorrect: node.getAttribute("data-exact-pyq-correct"),
      exactPyqAccuracy: node.getAttribute("data-exact-pyq-accuracy"),
      verdict: node.getAttribute("data-verdict"),
    }))
  );
  const allSubjectMonthlyText = await page.getByTestId("upsc-all-subject-monthly-report").innerText();
  const allSubjectMonthlyProof = await page.getByTestId("upsc-all-subject-monthly-report").evaluate((node) => ({
    reportId: node.getAttribute("data-report-id"),
    variant: node.getAttribute("data-report-variant"),
    subjectCount: node.getAttribute("data-subject-count"),
    startedDays: node.getAttribute("data-started-days"),
    averageRecall: node.getAttribute("data-average-recall"),
    averageMcq: node.getAttribute("data-average-mcq"),
    questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
    questionBankCorrect: node.getAttribute("data-question-bank-correct"),
    questionBankAccuracy: node.getAttribute("data-question-bank-accuracy"),
    exactPyqAttempts: node.getAttribute("data-exact-pyq-attempts"),
    exactPyqCorrect: node.getAttribute("data-exact-pyq-correct"),
    exactPyqAccuracy: node.getAttribute("data-exact-pyq-accuracy"),
    aiGapCount: node.getAttribute("data-ai-gap-count"),
    meTimeChecks: node.getAttribute("data-me-time-checks"),
    currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
    verdict: node.getAttribute("data-verdict"),
  }));
  const subjectCardCount = await page.getByTestId("upsc-subject-report-card").count();
  const subjectProofs = await page.getByTestId("upsc-subject-report-card").evaluateAll((nodes) =>
    nodes.map((node) => ({
      slug: node.getAttribute("data-subject-slug"),
      totalDays: node.getAttribute("data-total-days"),
      startedDays: node.getAttribute("data-started-days"),
      watchedDays: node.getAttribute("data-watched-days"),
      recallAttempts: node.getAttribute("data-recall-attempts"),
      averageRecall: node.getAttribute("data-average-recall"),
      mcqSets: node.getAttribute("data-mcq-sets"),
      averageMcq: node.getAttribute("data-average-mcq"),
      questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
      questionBankCorrect: node.getAttribute("data-question-bank-correct"),
      questionBankAccuracy: node.getAttribute("data-question-bank-accuracy"),
      exactPyqAttempts: node.getAttribute("data-exact-pyq-attempts"),
      exactPyqCorrect: node.getAttribute("data-exact-pyq-correct"),
      exactPyqAccuracy: node.getAttribute("data-exact-pyq-accuracy"),
      recoveryItems: node.getAttribute("data-recovery-items"),
      commandDays: node.getAttribute("data-command-days"),
      aiGapCount: node.getAttribute("data-ai-gap-count"),
      meTimeChecks: node.getAttribute("data-me-time-checks"),
      currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
      readinessSignal: node.getAttribute("data-readiness-signal"),
    }))
  );
  const weeklyCount = await page.getByTestId("upsc-weekly-report").count();
  const evidenceText = await page.getByTestId("upsc-report-evidence-streams").innerText();
  const monthlyText = await page.getByTestId("upsc-monthly-report").innerText();
  const geographyMonthlyProof = await page.getByTestId("upsc-monthly-report-card").evaluate((node) => ({
    reportId: node.getAttribute("data-report-id"),
    startedDays: node.getAttribute("data-started-days"),
    recallAttempts: node.getAttribute("data-recall-attempts"),
    averageRecall: node.getAttribute("data-average-recall"),
    mcqSets: node.getAttribute("data-mcq-sets"),
    averageMcq: node.getAttribute("data-average-mcq"),
    recoveryItems: node.getAttribute("data-recovery-items"),
    meTimeChecks: node.getAttribute("data-me-time-checks"),
    currentAffairsUnlocked: node.getAttribute("data-current-affairs-unlocked"),
    verdict: node.getAttribute("data-verdict"),
  }));
  const growthText = await page.getByTestId("upsc-growth-scale").innerText();
  const growthProof = await page.getByTestId("upsc-growth-scale").evaluate((node) => ({
    subjectSlug: node.getAttribute("data-subject-slug"),
    growthPercent: node.getAttribute("data-growth-percent"),
    startedFrom: node.getAttribute("data-started-from"),
    currentPosition: node.getAttribute("data-current-position"),
    strongestSignal: node.getAttribute("data-strongest-signal"),
    weakestSignal: node.getAttribute("data-weakest-signal"),
  }));
  const environmentCardText = await page
    .locator('[data-testid="upsc-subject-report-card"][data-subject-slug="environment"]')
    .innerText();
  const geographyCardText = await page
    .locator('[data-testid="upsc-subject-report-card"][data-subject-slug="geography"]')
    .innerText();

  checks.push({
    label: "report-system-content",
    href,
    readinessReport,
    readinessHref,
    studentSummaryProof,
    studentSummaryActionHref,
    studentSummaryCards,
    autoHandoffBridge,
    autoHandoffActionHref,
    allSubjectProof,
    subjectCardCount,
    subjectProofs,
    weeklyCount,
    allSubjectWeeklyCount,
    allSubjectWeeklyProofs,
    allSubjectText,
    autoReportProof,
    allSubjectWindowText,
    allSubjectMonthlyProof,
    allSubjectMonthlyText,
    geographyMonthlyProof,
    geographyCardText,
    environmentCardText,
    evidenceText,
    monthlyText,
    growthProof,
    growthText,
  });

  if (href !== "/upsc/geography/revisit?day=1") {
    throw new Error(`Gap CTA should still open recovery day 1, got ${href}`);
  }
  if (
    readinessReport.subject !== "geography" ||
    readinessReport.day !== "1" ||
    readinessReport.status !== "Repair lock" ||
    readinessReport.score !== "60" ||
    readinessHref !== "/upsc/geography/talk?day=1" ||
    !/current session readiness/i.test(readinessReport.text) ||
    !/because-chain/i.test(readinessReport.text) ||
    !/Exact PYQ 1 solved \/ 0 clear/i.test(readinessReport.text)
  ) {
    throw new Error(`Current readiness report is not synced with Daily Mission: ${JSON.stringify({ readinessReport, readinessHref })}`);
  }
  if (
    studentSummaryProof.proofRule !== "student-visible-gap-revision-growth-report-summary" ||
    studentSummaryProof.activeSubject !== "geography" ||
    studentSummaryProof.activeDay !== "1" ||
    studentSummaryProof.currentReadiness !== "Repair lock" ||
    studentSummaryProof.currentAction !== "Repeat talk" ||
    studentSummaryProof.currentActionHref !== "/upsc/geography/talk?day=1" ||
    studentSummaryActionHref !== "/upsc/geography/talk?day=1" ||
    studentSummaryProof.weeklyReportId !== "all-subject-week-1" ||
    studentSummaryProof.monthlyReportId !== "all-subject-month" ||
    studentSummaryProof.startedDays !== "5" ||
    studentSummaryProof.aiGapCount !== "1" ||
    studentSummaryProof.recoveryItems !== "1" ||
    studentSummaryProof.meTimeChecks !== "3" ||
    studentSummaryProof.currentAffairsUnlocked !== "4" ||
    studentSummaryProof.questionBankAttempts !== "2" ||
    studentSummaryProof.questionBankCorrect !== "1" ||
    studentSummaryProof.questionBankAccuracy !== "50" ||
    studentSummaryProof.exactPyqAttempts !== "1" ||
    studentSummaryProof.exactPyqCorrect !== "0" ||
    studentSummaryProof.exactPyqAccuracy !== "0" ||
    readNumber(studentSummaryProof.totalDays, "studentSummaryProof.totalDays") <= 200 ||
    readNumber(studentSummaryProof.growthPercent, "studentSummaryProof.growthPercent") < 1 ||
    studentSummaryCards.length !== 4 ||
    studentSummaryCards.map((card) => card.cardId).join("|") !== "gap-now|revise-next|growth|report-action" ||
    !/Four signals decide the next study move/i.test(studentSummaryProof.text) ||
    !/1 AI gap active/i.test(studentSummaryProof.text) ||
    !/Repair lock/i.test(studentSummaryProof.text) ||
    !/all-subject-week-1/i.test(studentSummaryProof.text)
  ) {
    throw new Error(
      `Student report summary proof failed: ${JSON.stringify({ studentSummaryProof, studentSummaryActionHref, studentSummaryCards }, null, 2)}`
    );
  }
  if (
    autoHandoffBridge.proofRule !== "automatic-new-day-handoff-from-me-time-recall-class-discussion-mcq-revision-report" ||
    autoHandoffBridge.status !== "saved" ||
    autoHandoffBridge.current !== "true" ||
    autoHandoffBridge.id !== "geography-d1-to-d1-repair-first-report-proof" ||
    autoHandoffBridge.subjectSlug !== "geography" ||
    autoHandoffBridge.selectedDay !== "1" ||
    autoHandoffBridge.sourceDay !== "1" ||
    autoHandoffBridge.targetDay !== "1" ||
    autoHandoffBridge.statusLabel !== "Repair first" ||
    autoHandoffBridge.actionLabel !== "Repeat talk" ||
    autoHandoffBridge.actionHref !== "/upsc/geography/talk?day=1" ||
    autoHandoffActionHref !== "/upsc/geography/talk?day=1" ||
    autoHandoffBridge.canAdvance !== "false" ||
    autoHandoffBridge.evidenceUsed !== "2" ||
    autoHandoffBridge.evidenceMissing !== "1" ||
    autoHandoffBridge.blockers !== "2" ||
    autoHandoffBridge.readinessStatus !== "Repair lock" ||
    autoHandoffBridge.readinessScore !== "40" ||
    autoHandoffBridge.learningGap !== "AI found Mechanism gap" ||
    autoHandoffBridge.revisionDue !== "AI gap" ||
    autoHandoffBridge.reportHref !== "/reports" ||
    autoHandoffBridge.questionBankHref !== "/upsc/question-bank?subject=geography" ||
    !/Auto session report bridge/i.test(autoHandoffBridge.text) ||
    !/Next session held: Repair first/i.test(autoHandoffBridge.text) ||
    !/Clear 2 blockers/i.test(autoHandoffBridge.text)
  ) {
    throw new Error(
      `Auto-session handoff bridge failed: ${JSON.stringify({ autoHandoffBridge, autoHandoffActionHref }, null, 2)}`
    );
  }
  if (weeklyCount !== 4) {
    throw new Error(`Expected 4 weekly report cards, got ${weeklyCount}`);
  }
  if (allSubjectWeeklyCount !== 4) {
    throw new Error(`Expected 4 all-subject weekly report cards, got ${allSubjectWeeklyCount}`);
  }
  const normalizedAllSubjectText = allSubjectText.toLowerCase();
  if (subjectCardCount !== 8 || !normalizedAllSubjectText.includes("environment") || !normalizedAllSubjectText.includes("weekly reports")) {
    throw new Error(`All-subject report missing expected evidence: ${JSON.stringify({ subjectCardCount, allSubjectText })}`);
  }
  if (
    allSubjectProof.proofRule !== "recall-mcq-question-bank-recovery-ai-me-time-current-affairs-growth" ||
    allSubjectProof.subjectCount !== "8" ||
    allSubjectProof.startedDays !== "5" ||
    allSubjectProof.watchedDays !== "3" ||
    allSubjectProof.commandDays !== "2" ||
    allSubjectProof.recoveryItems !== "1" ||
    allSubjectProof.aiGapCount !== "1" ||
    allSubjectProof.meTimeChecks !== "3" ||
    allSubjectProof.currentAffairsUnlocked !== "4" ||
    allSubjectProof.averageRecall !== "90" ||
    allSubjectProof.averageMcq !== "77" ||
    allSubjectProof.questionBankAttempts !== "2" ||
    allSubjectProof.questionBankCorrect !== "1" ||
    allSubjectProof.questionBankAccuracy !== "50" ||
    allSubjectProof.exactPyqAttempts !== "1" ||
    allSubjectProof.exactPyqCorrect !== "0" ||
    allSubjectProof.exactPyqAccuracy !== "0" ||
    readNumber(allSubjectProof.totalDays, "allSubjectProof.totalDays") <= 200 ||
    readNumber(allSubjectProof.weeklyWindowsGenerated, "allSubjectProof.weeklyWindowsGenerated") < 25 ||
    readNumber(allSubjectProof.growthPercent, "allSubjectProof.growthPercent") < 1
  ) {
    throw new Error(`All-subject report proof attributes failed: ${JSON.stringify(allSubjectProof)}`);
  }
  const compactAllSubjectText = allSubjectText.replace(/\s+/g, " ");
  if (
    !/current affairs\s+4/i.test(compactAllSubjectText) ||
    !/question bank\s+2/i.test(compactAllSubjectText) ||
    !/qb accuracy\s+50%/i.test(compactAllSubjectText) ||
    !/exact pyq\s+1/i.test(compactAllSubjectText) ||
    !/me-time\s+3/i.test(compactAllSubjectText) ||
    !/ai gaps\s+1/i.test(compactAllSubjectText)
  ) {
    throw new Error(`All-subject report should count Geography and Environment evidence: ${allSubjectText}`);
  }
  const compactWindowText = allSubjectWindowText.replace(/\s+/g, " ");
  if (
    !/All-subject monthly report/i.test(allSubjectMonthlyText) ||
    !/AI repair active/i.test(allSubjectMonthlyText) ||
    !/AI gaps\s+1/i.test(compactWindowText) ||
    !/Me-time\s+3/i.test(compactWindowText) ||
    !/News\s+4/i.test(compactWindowText) ||
    !/QB\s+2/i.test(compactWindowText) ||
    !/QB accuracy\s+50%/i.test(compactWindowText) ||
    !/Exact PYQ\s+1/i.test(compactWindowText)
  ) {
    throw new Error(`All-subject report windows missing generated evidence: ${allSubjectWindowText}`);
  }
  if (
    allSubjectMonthlyProof.reportId !== "all-subject-month" ||
    allSubjectMonthlyProof.variant !== "monthly" ||
    allSubjectMonthlyProof.subjectCount !== "8" ||
    allSubjectMonthlyProof.startedDays !== "5" ||
    allSubjectMonthlyProof.averageRecall !== "86" ||
    allSubjectMonthlyProof.averageMcq !== "75" ||
    allSubjectMonthlyProof.questionBankAttempts !== "2" ||
    allSubjectMonthlyProof.questionBankCorrect !== "1" ||
    allSubjectMonthlyProof.questionBankAccuracy !== "50" ||
    allSubjectMonthlyProof.exactPyqAttempts !== "1" ||
    allSubjectMonthlyProof.exactPyqCorrect !== "0" ||
    allSubjectMonthlyProof.exactPyqAccuracy !== "0" ||
    allSubjectMonthlyProof.aiGapCount !== "1" ||
    allSubjectMonthlyProof.meTimeChecks !== "3" ||
    allSubjectMonthlyProof.currentAffairsUnlocked !== "4" ||
    allSubjectMonthlyProof.verdict !== "AI repair active"
  ) {
    throw new Error(`All-subject monthly proof attributes failed: ${JSON.stringify(allSubjectMonthlyProof)}`);
  }
  if (
    allSubjectWeeklyProofs.length !== 4 ||
    allSubjectWeeklyProofs[0].reportId !== "all-subject-week-1" ||
    allSubjectWeeklyProofs[0].variant !== "weekly" ||
    allSubjectWeeklyProofs[0].subjectCount !== "8" ||
    allSubjectWeeklyProofs[0].startedDays !== "5" ||
    allSubjectWeeklyProofs[0].aiGapCount !== "1" ||
    allSubjectWeeklyProofs[0].meTimeChecks !== "3" ||
    allSubjectWeeklyProofs[0].currentAffairsUnlocked !== "4" ||
    allSubjectWeeklyProofs[0].questionBankAttempts !== "2" ||
    allSubjectWeeklyProofs[0].questionBankCorrect !== "1" ||
    allSubjectWeeklyProofs[0].questionBankAccuracy !== "50" ||
    allSubjectWeeklyProofs[0].exactPyqAttempts !== "1" ||
    allSubjectWeeklyProofs[0].exactPyqCorrect !== "0" ||
    allSubjectWeeklyProofs[0].exactPyqAccuracy !== "0" ||
    allSubjectWeeklyProofs[0].verdict !== "AI repair active"
  ) {
    throw new Error(`All-subject weekly proof attributes failed: ${JSON.stringify(allSubjectWeeklyProofs)}`);
  }
  const geographyProof = subjectProofs.find((subject) => subject.slug === "geography");
  const environmentProof = subjectProofs.find((subject) => subject.slug === "environment");
  if (
    !geographyProof ||
    geographyProof.startedDays !== "4" ||
    geographyProof.recallAttempts !== "3" ||
    geographyProof.averageRecall !== "82" ||
    geographyProof.mcqSets !== "2" ||
    geographyProof.averageMcq !== "70" ||
    geographyProof.questionBankAttempts !== "2" ||
    geographyProof.questionBankCorrect !== "1" ||
    geographyProof.questionBankAccuracy !== "50" ||
    geographyProof.exactPyqAttempts !== "1" ||
    geographyProof.exactPyqCorrect !== "0" ||
    geographyProof.exactPyqAccuracy !== "0" ||
    geographyProof.recoveryItems !== "1" ||
    geographyProof.commandDays !== "1" ||
    geographyProof.aiGapCount !== "1" ||
    geographyProof.meTimeChecks !== "2" ||
    geographyProof.currentAffairsUnlocked !== "3"
  ) {
    throw new Error(`Geography subject proof attributes failed: ${JSON.stringify(geographyProof)}`);
  }
  if (
    !environmentProof ||
    environmentProof.startedDays !== "1" ||
    environmentProof.averageRecall !== "97" ||
    environmentProof.averageMcq !== "84" ||
    environmentProof.questionBankAttempts !== "0" ||
    environmentProof.questionBankAccuracy !== "no-attempts" ||
    environmentProof.commandDays !== "1" ||
    environmentProof.meTimeChecks !== "1" ||
    environmentProof.currentAffairsUnlocked !== "1" ||
    environmentProof.readinessSignal !== "Exam stress: grounding needed"
  ) {
    throw new Error(`Environment subject proof attributes failed: ${JSON.stringify(environmentProof)}`);
  }
  if (!/latest ai gap:\s*mechanism/i.test(geographyCardText) || !/because-chain/i.test(geographyCardText)) {
    throw new Error(`Geography report card missing AI teacher gap evidence: ${geographyCardText}`);
  }
  if (!/exam stress: grounding needed/i.test(environmentCardText) || !/covered news\s+1 hook/i.test(environmentCardText.replace(/\s+/g, " "))) {
    throw new Error(`Environment report card missing readiness or covered-news evidence: ${environmentCardText}`);
  }
  const compactAutoReportProof = autoReportProof.text.replace(/\s+/g, " ");
  if (
    autoReportProof.proofRule !== "saved-daily-loop-evidence-regenerates-reports" ||
    autoReportProof.weeklyReportId !== "all-subject-week-1" ||
    autoReportProof.monthlyReportId !== "all-subject-month" ||
    autoReportProof.growthBaseline !== "Geography: 4/30 days started" ||
    autoReportProof.growthNow !== "1 AI teacher gap active" ||
    !autoReportProof.nextWeeklyAction.includes("Clear the latest AI teacher gap") ||
    !autoReportProof.nextMonthlyAction.includes("Clear the latest AI teacher gap") ||
    !/Auto-generated report proof/i.test(compactAutoReportProof) ||
    !/Weekly and monthly reports rebuild from evidence/i.test(compactAutoReportProof) ||
    !/No manual spreadsheet/i.test(compactAutoReportProof) ||
    !/Only saved learning evidence is counted/i.test(compactAutoReportProof) ||
    !/Growth start\s*Geography: 4\/30 days started/i.test(compactAutoReportProof) ||
    !/Growth now\s*1 AI teacher gap active/i.test(compactAutoReportProof) ||
    !/Clear the latest AI teacher gap/i.test(compactAutoReportProof)
  ) {
    throw new Error(`Auto-report proof missing cadence, IDs, or growth evidence: ${JSON.stringify(autoReportProof)}`);
  }
  const normalizedEvidence = `${evidenceText}\n${monthlyText}`.toLowerCase();
  for (const expectedText of ["recall", "mcq", "revision", "me-time", "current affairs", "2 unlocked"]) {
    if (!normalizedEvidence.includes(expectedText)) {
      throw new Error(`Report missing expected text: ${expectedText}`);
    }
  }
  if (!growthText.includes("Geography movement")) {
    throw new Error(`Growth scale missing movement label: ${growthText}`);
  }
  if (
    growthProof.subjectSlug !== "geography" ||
    growthProof.growthPercent !== "10" ||
    growthProof.startedFrom !== "Week 1: 3/7 days started" ||
    growthProof.currentPosition !== "Week 1: Repair weak points before adding load" ||
    growthProof.strongestSignal !== "Practice evidence" ||
    growthProof.weakestSignal !== "Recovery queue" ||
    geographyMonthlyProof.reportId !== "month-geography" ||
    geographyMonthlyProof.startedDays !== "3" ||
    geographyMonthlyProof.averageRecall !== "82" ||
    geographyMonthlyProof.averageMcq !== "70" ||
    geographyMonthlyProof.recoveryItems !== "1" ||
    geographyMonthlyProof.meTimeChecks !== "2" ||
    geographyMonthlyProof.currentAffairsUnlocked !== "2"
  ) {
    throw new Error(`Growth or Geography monthly proof attributes failed: ${JSON.stringify({ growthProof, geographyMonthlyProof })}`);
  }

  await assertNoOverflow(page, "reports-desktop", checks);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/reports`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-readiness-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-student-report-summary").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-auto-report-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report-windows").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-report-evidence-streams").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "reports-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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

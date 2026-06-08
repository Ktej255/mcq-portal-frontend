const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-student-revision-command-evidence.json");
const screenshotPath = path.join(__dirname, "verify-student-revision-command-final.png");

const profileKey = "sarit-upsc-student-profile-v1";
const questionBankKey = "sarit-upsc-question-bank-attempts-v1";
const blockedText = ["Network Error", "Critical Error", "Command Sync Failed", "Verification Failed", "Forensic Debug Mode"];

function now(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString();
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.overflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function seed(context) {
  await context.addInitScript(
    ({ profileKey: profileStorageKey, questionBankKey: questionBankStorageKey }) => {
      const date = new Date().toISOString();
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_revision_command");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "intermediate",
          preparationStage: "coaching-complete",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "concept-clarity",
          studyTime: "morning",
          attemptHistory: "one-attempt",
          learningPattern: "revision-first",
          mindState: "calm",
          updatedAt: date,
        })
      );
      window.localStorage.setItem(
        "sarit-upsc-geography-progress-v1",
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            reflection: "Earth system recall is clear.",
            talkScore: 97,
            talkBand: "Command",
            confidence: "Command",
            mcqCompleted: true,
            mcqOutcome: "Command",
            mcqScorePercent: 88,
            meTimeCompletedAt: date,
            meTimeMood: "focused",
            meTimeResetPlan: "Five-minute map recall before class.",
            updatedAt: date,
          },
        })
      );
      window.localStorage.setItem(
        "sarit-upsc-environment-progress-v1",
        JSON.stringify({
          "2": {
            day: 2,
            watched: true,
            reflection: "Ecosystem flow is still mixed with food-chain examples.",
            talkScore: 62,
            talkBand: "Revisit",
            confidence: "Shaky",
            revisitQueued: true,
            teacherDoubtCategory: "Concept clarity",
            teacherDoubtReason: "The learner confused food chain, food web, and ecological pyramid logic.",
            teacherDoubtRepairAction: "Rebuild the ecosystem example from producer to tertiary consumer before MCQs.",
            teacherDoubtMasteryCheck: "Explain why energy transfer falls at each trophic level without reading notes.",
            talkNextRoute: "/upsc/environment/talk?day=2",
            mcqCompleted: true,
            mcqOutcome: "Revisit",
            mcqScorePercent: 42,
            meTimeCompletedAt: date,
            meTimeMood: "overloaded",
            meTimeResetPlan: "Reduce the task to one ecosystem diagram and one spoken explanation.",
            updatedAt: date,
          },
        })
      );
      window.localStorage.setItem(
        "sarit-upsc-economy-progress-v1",
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            reflection: "Inflation basics watched, but monetary policy transmission is incomplete.",
            talkScore: 82,
            talkBand: "Working",
            confidence: "Working",
            updatedAt: date,
          },
        })
      );
      window.localStorage.setItem(
        questionBankStorageKey,
        JSON.stringify({
          "geo-d02-easy-rotation": {
            questionId: "geo-d02-easy-rotation",
            subjectSlug: "geography",
            linkedDay: 1,
            topic: "Earth as a System",
            difficulty: "EASY",
            source: "NCERT_BASE",
            selectedOption: "A",
            correctOption: "A",
            isCorrect: true,
            solvedAt: date,
          },
          "env-d02-trophic-trap": {
            questionId: "env-d02-trophic-trap",
            subjectSlug: "environment",
            linkedDay: 2,
            topic: "Ecosystem foundations",
            difficulty: "MEDIUM",
            source: "PYQ_PATTERN",
            selectedOption: "C",
            correctOption: "A",
            isCorrect: false,
            solvedAt: date,
          },
        })
      );
    },
    { profileKey, questionBankKey }
  );
}

async function verifyRevision(page, checks) {
  await page.goto(`${baseUrl}/revision`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector('[data-testid="student-revision-command"][data-loaded="true"]', { timeout: 45000 });

  const url = page.url();
  if (url.includes("/login")) {
    throw new Error(`/revision unexpectedly redirected to login: ${url}`);
  }

  const bodyText = await page.locator("body").innerText();
  for (const blocked of blockedText) {
    if (bodyText.includes(blocked)) {
      throw new Error(`/revision exposed blocked failure text: ${blocked}`);
    }
  }

  const command = await page.getByTestId("student-revision-command").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    loaded: node.getAttribute("data-loaded"),
    subjectCount: node.getAttribute("data-subject-count"),
    urgentCount: node.getAttribute("data-urgent-count"),
    recoveryItems: node.getAttribute("data-recovery-items"),
    aiGapCount: node.getAttribute("data-ai-gap-count"),
    meTimeChecks: node.getAttribute("data-me-time-checks"),
    questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
    primaryHref: node.getAttribute("data-primary-href"),
    primarySubject: node.getAttribute("data-primary-subject"),
    text: node.textContent || "",
  }));
  const primary = await page.getByTestId("student-revision-primary-action").evaluate((node) => ({
    href: node.getAttribute("href"),
    dataHref: node.getAttribute("data-primary-href"),
    subject: node.getAttribute("data-primary-subject"),
    text: node.textContent || "",
  }));
  const subjectCards = await page.locator('[data-testid="student-revision-subject-card"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      slug: node.getAttribute("data-subject-slug"),
      day: node.getAttribute("data-selected-day"),
      urgent: node.getAttribute("data-revision-urgent"),
      revisionHref: node.getAttribute("data-revision-href"),
      readinessStatus: node.getAttribute("data-readiness-status"),
      learningGap: node.getAttribute("data-learning-gap"),
      teacherGapCount: node.getAttribute("data-teacher-gap-count"),
      recoveryItems: node.getAttribute("data-recovery-items"),
      questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
      meTimeChecks: node.getAttribute("data-me-time-checks"),
      text: node.textContent || "",
    }))
  );
  const reportProof = await page.getByTestId("student-revision-weekly-monthly-proof").evaluate((node) => ({
    weeklyReportId: node.getAttribute("data-weekly-report-id"),
    monthlyReportId: node.getAttribute("data-monthly-report-id"),
    growthPercent: node.getAttribute("data-growth-percent"),
    weeklyWindows: node.getAttribute("data-weekly-windows"),
    text: node.textContent || "",
  }));
  checks.push({ command, primary, subjectCards, reportProof });

  if (
    command.proofRule !== "all-subject-revision-from-recall-mcq-ai-gaps-me-time-question-bank" ||
    command.loaded !== "true" ||
    command.subjectCount !== "8" ||
    Number(command.urgentCount) < 1 ||
    Number(command.recoveryItems) < 1 ||
    Number(command.aiGapCount) < 1 ||
    Number(command.meTimeChecks) < 1 ||
    Number(command.questionBankAttempts) < 2 ||
    command.primarySubject !== "environment"
  ) {
    throw new Error(`revision command contract failed: ${JSON.stringify(command)}`);
  }
  if (primary.subject !== "environment" || !primary.href?.includes("/upsc/environment/talk?day=2")) {
    throw new Error(`primary action should route to the environment AI gap: ${JSON.stringify(primary)}`);
  }
  if (subjectCards.length !== 8) {
    throw new Error(`expected 8 subject cards, got ${subjectCards.length}`);
  }
  const environmentCard = subjectCards.find((card) => card.slug === "environment");
  const geographyCard = subjectCards.find((card) => card.slug === "geography");
  const economyCard = subjectCards.find((card) => card.slug === "economy");
  if (
    !environmentCard ||
    environmentCard.urgent !== "true" ||
    environmentCard.teacherGapCount !== "1" ||
    environmentCard.recoveryItems !== "1" ||
    environmentCard.questionBankAttempts !== "1" ||
    !environmentCard.text.includes("AI found Concept clarity gap")
  ) {
    throw new Error(`environment card did not expose AI-gap revision proof: ${JSON.stringify(environmentCard)}`);
  }
  if (!geographyCard || geographyCard.meTimeChecks !== "1" || geographyCard.questionBankAttempts !== "1") {
    throw new Error(`geography command evidence was not preserved: ${JSON.stringify(geographyCard)}`);
  }
  if (!economyCard || !economyCard.text.includes("Economy")) {
    throw new Error(`economy weak-recall card missing: ${JSON.stringify(economyCard)}`);
  }
  if (
    reportProof.monthlyReportId !== "all-subject-month" ||
    !reportProof.weeklyReportId?.startsWith("all-subject-week-") ||
    Number(reportProof.weeklyWindows) < 1 ||
    !reportProof.text.includes("Weekly") ||
    !reportProof.text.includes("Monthly")
  ) {
    throw new Error(`weekly/monthly report proof missing: ${JSON.stringify(reportProof)}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await seed(context);
  const page = await context.newPage();
  const checks = [];
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await verifyRevision(page, checks);
  await assertNoOverflow(page, "desktop revision", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await assertNoOverflow(page, "mobile revision", checks);

  await browser.close();
  const unexpectedErrors = consoleErrors.filter((error) => !error.includes("AUTH | Firebase auth is not initialized"));
  if (unexpectedErrors.length) {
    throw new Error(`unexpected console/page errors: ${unexpectedErrors.join("\n")}`);
  }
  fs.writeFileSync(evidencePath, JSON.stringify({ baseUrl, checks, passed: true }, null, 2));
  console.log(JSON.stringify({ baseUrl, evidencePath, screenshotPath, passed: true }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "verify-mcq-revisit-simple-evidence.json");
const screenshotPath = path.join(__dirname, "verify-mcq-revisit-simple.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function subjectKey(subject) {
  return `sarit-upsc-${subject}-progress-v1`;
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

async function seedEnvironment(page) {
  await page.addInitScript((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_mcq_revisit_simple");
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
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
  await page.goto(`${baseUrl}/upsc/environment`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "5": {
          day: 5,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
          talkScore: 91,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          labCompleted: true,
          labMode: "biodiversity-map",
          labProofCompletedIds: [
            "5-biodiversity-map-concept",
            "5-biodiversity-map-case",
            "5-biodiversity-map-institution",
            "5-biodiversity-map-trap",
            "5-biodiversity-map-answer",
          ],
          labInsight: "Biodiversity map proof saved.",
          mcqAttempted: true,
          mcqCompleted: true,
          mcqAnsweredCount: 5,
          mcqCorrectCount: 2,
          mcqTotal: 5,
          mcqScorePercent: 40,
          mcqOutcome: "Revisit",
          mcqReviewSummary: "2/5 correct. Revisit queued for biodiversity map traps.",
          revisitQueued: true,
          reflection: "Protected area categories need another repair pass.",
        },
      })
    );
  }, subjectKey("environment"));
}

async function inspectSimpleRoutes(page, checks) {
  await seedEnvironment(page);

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  const environmentLearnerPath = new URL(page.url()).pathname;
  checks.push({ label: "environment-future-subject-learner-gate", environmentLearnerPath });
  if (environmentLearnerPath !== "/dashboard") {
    throw new Error(`Future Environment learner path should stay gated, got ${environmentLearnerPath}.`);
  }

  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "1": {
          day: 1,
          watched: true,
          watchHandoffReady: true,
          reflection: "My map proof needs one short correction before I explain again.",
          talkScore: 42,
          talkBand: "Revisit",
          talkUnlockStage: "revisit",
          revisitQueued: true,
          recoveryWeakSkill: "Map proof",
          recoveryDiagnosisSummary: "Add one map cue, one India example and one corrected UPSC trap.",
          recoveryProofCompletedIds: [],
        },
      })
    );
  }, subjectKey("geography"));

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("MCQ locked", { exact: false }).first().waitFor({ timeout: 15000 });
  const geographyLockActionCount = await page.getByRole("link", { name: /Open discussion/i }).count();
  checks.push({ label: "geography-mcq-discussion-gate", geographyLockActionCount });
  if (geographyLockActionCount !== 1) {
    throw new Error(`Geography MCQ gate should expose one discussion action, found ${geographyLockActionCount}.`);
  }
  await assertNoOverflow(page, "geography-mcq-simple-desktop", checks);

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("revisit-complete-and-talk").waitFor({ timeout: 15000 });
  const geographyChecklistHidden = !(await page.getByTestId("revisit-proof-recall").isVisible());
  const geographyPendingActionCount = await page.locator(
    '[data-testid="revisit-complete-and-talk"], [data-testid="revisit-primary-route"]'
  ).count();
  checks.push({ label: "geography-revisit-single-action", geographyChecklistHidden, geographyPendingActionCount });
  if (!geographyChecklistHidden || geographyPendingActionCount !== 1) {
    throw new Error("Geography Revisit should start with one repair action and a folded optional checklist.");
  }
  await page.getByTestId("revisit-repair-note").fill(
    "I corrected the map proof by adding scale, direction, one India example and one fixed UPSC trap."
  );
  await page.getByTestId("revisit-complete-and-talk").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  const geographyProgress = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"],
    subjectKey("geography")
  );
  if (!geographyProgress?.recoveryCompleted || geographyProgress?.revisitQueued !== false) {
    throw new Error(`Geography recovery did not persist correctly: ${JSON.stringify(geographyProgress)}`);
  }
  await assertNoOverflow(page, "geography-revisit-simple-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/revisit?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("revisit-primary-route").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-revisit-simple-mobile", checks);
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

  await inspectSimpleRoutes(page, checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    baseUrl,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

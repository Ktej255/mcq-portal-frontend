const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "verify-student-dashboard-signals-evidence.json");
const screenshotPath = path.join(__dirname, "verify-student-dashboard-signals-mobile.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function seedDashboard(page, progress) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_dashboard_signal_quality");
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
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.setItem(geographyProgressKey, JSON.stringify(seededProgress));
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey, seededProgress: progress },
  );
}

async function assertStudentSafeDashboard(page, label, checks) {
  const dashboardText = await page.getByTestId("upsc-simple-dashboard").innerText();
  const forbidden = ["GEO-D", "DRAFT", "debug", "operator", "local draft bank", "batch code"];
  const leaked = forbidden.filter((term) => dashboardText.toLowerCase().includes(term.toLowerCase()));
  const signalCount = await page.locator('[data-testid^="upsc-signal-"]').count();
  const essentialContract = await page.getByTestId("upsc-simple-dashboard").evaluate((node) => ({
    mode: node.getAttribute("data-visible-mode"),
    count: node.getAttribute("data-essential-signal-count"),
    signals: node.getAttribute("data-essential-signals"),
    nextActionHref: node.getAttribute("data-next-action-href"),
  }));
  const activeMissionPanelCount = await page.locator('[data-testid="upsc-active-mission-readiness"]').count();
  const taskReadiness = await page.getByTestId("upsc-task-readiness-proof").evaluate((node) => ({
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
    text: node.textContent || "",
  }));
  const mainPathStrip = await page.getByTestId("upsc-main-path-strip").evaluate((node) => ({
    text: node.textContent || "",
    open: node.open,
  }));
  const oneActionRuleText = await page.getByTestId("upsc-one-action-rule").innerText();
  const dashboardVisibleMode = await page.getByTestId("upsc-simple-dashboard").getAttribute("data-visible-mode");
  const planningDrawerOpen = await page.getByTestId("upsc-planning-drawer").evaluate((node) =>
    node instanceof HTMLDetailsElement ? node.open : false
  );
  checks.push({
    label,
    signalCount,
    essentialContract,
    activeMissionPanelCount,
    taskReadiness,
    mainPathStrip,
    oneActionRuleText,
    dashboardVisibleMode,
    planningDrawerOpen,
    leaked,
  });
  if (signalCount !== 4) throw new Error(`${label}: expected four dashboard signals, got ${signalCount}`);
  if (
    essentialContract.mode !== "four-signal-one-action" ||
    essentialContract.count !== "4" ||
    essentialContract.signals !== "todays-task|learning-gap|next-revision|current-path" ||
    !essentialContract.nextActionHref
  ) {
    throw new Error(`${label}: dashboard essential contract failed: ${JSON.stringify(essentialContract)}`);
  }
  if (activeMissionPanelCount !== 0) {
    throw new Error(`${label}: active mission panel should be folded into Today's task`);
  }
  if (!taskReadiness.subject || !taskReadiness.day || !taskReadiness.status || !taskReadiness.score) {
    throw new Error(`${label}: Today's task readiness proof missing: ${JSON.stringify(taskReadiness)}`);
  }
  if (!mainPathStrip.text.includes("MCQ") || !mainPathStrip.text.includes("Next")) {
    throw new Error(`${label}: main path support detail should retain MCQ and automatic next topic: ${mainPathStrip.text}`);
  }
  if (mainPathStrip.open !== false || dashboardVisibleMode !== "four-signal-one-action") {
    throw new Error(`${label}: dashboard path support should be folded by default: ${JSON.stringify({ mainPathStrip, dashboardVisibleMode })}`);
  }
  if (!oneActionRuleText.includes("Use the main button only")) {
    throw new Error(`${label}: one-action rule copy missing: ${oneActionRuleText}`);
  }
  if (planningDrawerOpen) throw new Error(`${label}: planning drawer should stay folded by default`);
  if (leaked.length) throw new Error(`${label}: dashboard leaked internal language ${JSON.stringify(leaked)}`);
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

  await seedDashboard(page, {
    1: {
      day: 1,
      watched: true,
      watchState: "Watched",
      revisitQueued: true,
      talkScore: 58,
      talkBand: "Revisit",
      talkUnlockStage: "revisit",
      recoveryWeakSkill: "Map proof",
      recoveryDiagnosisSummary: "The answer needs one India map example and one UPSC trap before new work.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-learning-gap").getByText("Map proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-learning-gap").getByText("India map example", { exact: false }).waitFor({ timeout: 15000 });
  const revisitHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const revisitPathText = await page.getByTestId("upsc-signal-current-path").innerText();
  checks.push({ label: "dashboard-revisit-signal", revisitHref, revisitPathText });
  if (revisitHref !== "/upsc/geography/revisit?day=1") throw new Error(`Expected revisit route, got ${revisitHref}`);
  await assertStudentSafeDashboard(page, "dashboard-revisit-copy", checks);
  await assertNoOverflow(page, "dashboard-revisit-desktop", checks);

  await seedDashboard(page, {
    1: {
      day: 1,
      watched: true,
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      mcqAttempted: true,
      mcqCompleted: true,
      mcqCorrectCount: 25,
      mcqTotal: 25,
      mcqScorePercent: 100,
      mcqOutcome: "Command",
      confidence: "Command",
      updatedAt: new Date().toISOString(),
    },
    2: {
      day: 2,
      talkScore: 82,
      talkBand: "Practice",
      talkRubric: [
        { label: "Recall", score: 25, max: 30, status: "Ready", evidence: "Core terms visible." },
        { label: "Mechanism", score: 9, max: 20, status: "Weak", evidence: "Cause-effect chain missing." },
      ],
      talkRepairHints: ["Add the cause-effect sequence before MCQ."],
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-todays-task").getByText("Origin and Evolution of Earth", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-learning-gap").getByText("Mechanism", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-current-path").getByText("1/30 command days", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-current-path").getByText("started", { exact: false }).waitFor({ timeout: 15000 });
  const repairHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  checks.push({ label: "dashboard-current-path", repairHref });
  if (repairHref !== "/upsc/daily-command#daily-me-time-checkin") {
    throw new Error(`Expected readiness gate route before new day, got ${repairHref}`);
  }
  await assertStudentSafeDashboard(page, "dashboard-command-trend-copy", checks);
  await assertNoOverflow(page, "dashboard-command-trend-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-current-path").getByText("1/30 command days", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "dashboard-signals-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const dailyCommandKey = "sarit-upsc-daily-command-v1";
const pyqImportLedgerKey = "sarit-upsc-pyq-import-ledger-v1";
const authUserKey = "sarit-upsc-auth-user-v1";
const evidencePath = path.join(__dirname, "verify-student-dashboard-evidence.json");
const screenshotPath = path.join(__dirname, "verify-student-dashboard-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

async function assertHref(locator, expectedHref, checks, label) {
  const href = await locator.getAttribute("href");
  checks.push({ label, href, expectedHref });
  if (href !== expectedHref) {
    throw new Error(`${label}: expected ${expectedHref}, got ${href}`);
  }
}

async function assertDashboardSurfaceIsSimple(page, checks, label) {
  const signalCount = await page.locator('[data-testid^="upsc-signal-"]').count();
  const essentialContract = await page.getByTestId("upsc-simple-dashboard").evaluate((node) => ({
    mode: node.getAttribute("data-visible-mode"),
    count: node.getAttribute("data-essential-signal-count"),
    signals: node.getAttribute("data-essential-signals"),
    nextActionHref: node.getAttribute("data-next-action-href"),
  }));
  const todaysTaskVisible = await page.getByTestId("upsc-signal-todays-task").isVisible().catch(() => false);
  const todaysTaskPriority = await page.getByTestId("upsc-signal-todays-task").getAttribute("data-signal-priority");
  const taskReadiness = await page.getByTestId("upsc-task-readiness-proof").evaluate((node) => ({
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
    exactTotalRows: node.getAttribute("data-exact-pyq-total-rows"),
    exactSubjectRows: node.getAttribute("data-exact-pyq-active-subject-rows"),
    exactDayRows: node.getAttribute("data-exact-pyq-active-day-rows"),
    text: node.textContent || "",
  }));
  const exactPyqProof = await page.getByTestId("upsc-dashboard-exact-pyq-proof").evaluate((node) => ({
    proofRule: node.getAttribute("data-proof-rule"),
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    totalRows: node.getAttribute("data-total-exact-pyq-rows"),
    subjectRows: node.getAttribute("data-active-subject-exact-pyq-rows"),
    dayRows: node.getAttribute("data-active-day-exact-pyq-rows"),
    text: node.textContent || "",
  }));
  const activeMissionPanelCount = await page.locator('[data-testid="upsc-active-mission-readiness"]').count();
  const monthlyPathCount = await page.locator('[data-testid="upsc-signal-monthly-path"]').count();
  const profileIntakeVisible = await page.getByTestId("upsc-profile-intake").isVisible().catch(() => false);
  const mainPathStrip = await page.getByTestId("upsc-main-path-strip").evaluate((node) => ({
    text: node.textContent || "",
    open: node.open,
  }));
  const oneActionRuleText = await page.getByTestId("upsc-one-action-rule").innerText();
  const afterThisStep = await page.getByTestId("upsc-after-this-step").evaluate((node) => ({
    decision: node.getAttribute("data-next-session-decision"),
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    nextRoute: node.getAttribute("data-next-route"),
    evidenceSummary: node.getAttribute("data-evidence-summary"),
    adjustmentRule: node.getAttribute("data-adjustment-rule"),
    evidenceCount: node.getAttribute("data-adaptive-evidence-count"),
    text: node.textContent || "",
  }));
  const adaptiveEvidence = await page.locator('[data-testid="upsc-adaptive-evidence-chip"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      label: node.getAttribute("data-evidence-label"),
      status: node.getAttribute("data-evidence-status"),
      text: node.textContent || "",
    }))
  );
  const yesterdayProof = await page.getByTestId("upsc-yesterday-proof").evaluate((node) => ({
    status: node.getAttribute("data-origin-status"),
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    route: node.getAttribute("data-origin-route"),
    evidenceCount: node.getAttribute("data-origin-evidence-count"),
    text: node.textContent || "",
  }));
  const yesterdayEvidence = await page.locator('[data-testid="upsc-yesterday-evidence-chip"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      label: node.getAttribute("data-evidence-label"),
      status: node.getAttribute("data-evidence-status"),
      text: node.textContent || "",
    }))
  );
  const dashboardVisibleMode = await page.getByTestId("upsc-simple-dashboard").getAttribute("data-visible-mode");
  const planningDrawerOpen = await page.getByTestId("upsc-planning-drawer").evaluate((node) =>
    node instanceof HTMLDetailsElement ? node.open : false
  );
  const meTimeStatus = await page.getByTestId("upsc-me-time-check").getAttribute("data-me-time-status");
  const meTimeResetPlan = await page.getByTestId("upsc-me-time-check").getAttribute("data-me-time-reset-plan");
  const startSessionReadiness = await page.getByTestId("upsc-start-today").getAttribute("data-session-readiness");

  checks.push({
    label,
    signalCount,
    essentialContract,
    todaysTaskVisible,
    todaysTaskPriority,
    taskReadiness,
    exactPyqProof,
    activeMissionPanelCount,
    monthlyPathCount,
    profileIntakeVisible,
    mainPathStrip,
    oneActionRuleText,
    afterThisStep,
    adaptiveEvidence,
    yesterdayProof,
    yesterdayEvidence,
    dashboardVisibleMode,
    planningDrawerOpen,
    meTimeStatus,
    meTimeResetPlan,
    startSessionReadiness,
  });

  if (signalCount !== 4) {
    throw new Error(`${label}: expected 4 signal cards, got ${signalCount}`);
  }
  if (
    essentialContract.mode !== "four-signal-one-action" ||
    essentialContract.count !== "4" ||
    essentialContract.signals !== "todays-task|learning-gap|next-revision|current-path" ||
    !essentialContract.nextActionHref
  ) {
    throw new Error(`${label}: dashboard essential contract failed: ${JSON.stringify(essentialContract)}`);
  }
  if (!todaysTaskVisible) {
    throw new Error(`${label}: Today's Task signal should be visible on the main dashboard`);
  }
  if (todaysTaskPriority !== "primary") {
    throw new Error(`${label}: Today's Task should be the dominant dashboard action`);
  }
  if (activeMissionPanelCount !== 0) {
    throw new Error(`${label}: active mission readiness should be folded into Today's task`);
  }
  if (!taskReadiness.subject || !taskReadiness.day || !taskReadiness.status || !taskReadiness.score) {
    throw new Error(`${label}: Today's task readiness proof is incomplete: ${JSON.stringify(taskReadiness)}`);
  }
  if (
    taskReadiness.exactTotalRows !== "1" ||
    taskReadiness.exactSubjectRows !== "1" ||
    taskReadiness.exactDayRows !== "1" ||
    exactPyqProof.proofRule !== "dashboard-today-card-reflects-exact-pyq-imports" ||
    exactPyqProof.subject !== taskReadiness.subject ||
    exactPyqProof.day !== taskReadiness.day ||
    exactPyqProof.totalRows !== "1" ||
    exactPyqProof.subjectRows !== "1" ||
    exactPyqProof.dayRows !== "1" ||
    !exactPyqProof.text.includes("Exact PYQ: 1 for today, 1 for Geography") ||
    !exactPyqProof.text.includes("Pattern practice continues")
  ) {
    throw new Error(`${label}: exact PYQ dashboard proof failed: ${JSON.stringify({ taskReadiness, exactPyqProof })}`);
  }
  if (monthlyPathCount !== 0) {
    throw new Error(`${label}: monthly path signal should not be visible on the main dashboard`);
  }
  if (profileIntakeVisible) {
    throw new Error(`${label}: profile setup drawer should be hidden after setup`);
  }
  if (!mainPathStrip.text.includes("MCQ") || !mainPathStrip.text.includes("Next")) {
    throw new Error(`${label}: main path support detail should retain MCQ and automatic next topic: ${mainPathStrip.text}`);
  }
  if (mainPathStrip.open !== false || dashboardVisibleMode !== "four-signal-one-action") {
    throw new Error(`${label}: dashboard should keep the path support folded with one-action mode: ${JSON.stringify({ mainPathStrip, dashboardVisibleMode })}`);
  }
  if (!oneActionRuleText.includes("Use the main button only")) {
    throw new Error(`${label}: one-action rule copy missing: ${oneActionRuleText}`);
  }
  if (
    !afterThisStep.text.includes("After this") ||
    !afterThisStep.decision ||
    !afterThisStep.sourceDay ||
    !afterThisStep.targetDay ||
    !afterThisStep.nextRoute ||
    !afterThisStep.evidenceSummary ||
    !afterThisStep.adjustmentRule ||
    afterThisStep.evidenceCount !== "5"
  ) {
    throw new Error(`${label}: after-this dynamic planner proof missing: ${JSON.stringify(afterThisStep)}`);
  }
  const adaptiveLabels = adaptiveEvidence.map((item) => item.label).join("|");
  const adaptiveStatuses = adaptiveEvidence.map((item) => item.status).join("|");
  if (
    adaptiveEvidence.length !== 5 ||
    !adaptiveLabels.includes("Mind-state") ||
    !adaptiveLabels.includes("Recall") ||
    !adaptiveLabels.includes("Class") ||
    !adaptiveLabels.includes("Practice") ||
    !adaptiveLabels.includes("Consistency") ||
    !adaptiveStatuses.match(/used|missing|blocked/)
  ) {
    throw new Error(`${label}: adaptive evidence chips are incomplete: ${JSON.stringify(adaptiveEvidence)}`);
  }
  if (
    !yesterdayProof.status ||
    !yesterdayProof.sourceDay ||
    !yesterdayProof.targetDay ||
    !yesterdayProof.route ||
    Number(yesterdayProof.evidenceCount) < 3 ||
    yesterdayEvidence.length !== Number(yesterdayProof.evidenceCount)
  ) {
    throw new Error(`${label}: yesterday evidence proof is incomplete: ${JSON.stringify({ yesterdayProof, yesterdayEvidence })}`);
  }
  if (planningDrawerOpen) {
    throw new Error(`${label}: optional planning drawer should start closed`);
  }
  if (!["pending", "ready"].includes(meTimeStatus)) {
    throw new Error(`${label}: me-time start check should expose a pending/ready status, got ${meTimeStatus}`);
  }
  if (!["check-pending", "ready"].includes(startSessionReadiness)) {
    throw new Error(`${label}: start action should expose session readiness, got ${startSessionReadiness}`);
  }
  if (meTimeStatus === "ready" && !meTimeResetPlan) {
    throw new Error(`${label}: ready me-time check should expose a saved reset plan`);
  }
}

async function seedSession(page, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileKey: profileStorageKey, progressKey: progressStorageKey, dailyKey, pyqKey, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_dashboard");
      window.localStorage.removeItem(profileStorageKey);
      window.localStorage.removeItem(progressStorageKey);
      window.localStorage.removeItem(dailyKey);
      window.localStorage.setItem(
        pyqKey,
        JSON.stringify([
          {
            id: "2024-prelims-geography-general-studies-paper-i-q-location-logic",
            year: 2024,
            stage: "Prelims",
            kind: "GS_PRELIMS",
            subjectSlug: "geography",
            subjectTitle: "Geography",
            paper: "General Studies Paper I",
            questionNumber: "Q-Location-Logic",
            questionText:
              "Which statement best explains why absolute and relative location both matter in map-based reasoning?",
            syllabusArea: "absolute and relative location",
            syllabusNodeId: "geo-india",
            topicTags: ["absolute location", "relative location", "site", "situation", "map"],
            trendInsightId: "geo-map-process",
            sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
            officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
            answerDemand: "Prelims map and location logic",
            importStatus: "MAPPED",
            textStatus: "EXACT_VERIFIED",
            importedAt: new Date().toISOString(),
          },
        ])
      );
      if (seededProgress) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
      }
    },
    { profileKey, progressKey, dailyKey: dailyCommandKey, pyqKey: pyqImportLedgerKey, seededProgress: progress }
  );
}

async function saveProfile(page) {
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "I attempted UPSC Prelims two or more times and need a recovery path" }).click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
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

  await seedSession(page);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await saveProfile(page);
  await assertDashboardSurfaceIsSimple(page, checks, "fresh-simple-surface");
  const freshTaskReadiness = await page.getByTestId("upsc-task-readiness-proof").evaluate((node) => ({
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
  }));
  const freshStartHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  checks.push({ label: "fresh-task-readiness", freshTaskReadiness, freshStartHref });
  if (
    freshTaskReadiness.subject !== "geography" ||
    freshTaskReadiness.day !== "1" ||
    freshTaskReadiness.status !== "Mind-state first" ||
    freshTaskReadiness.score !== "0" ||
    freshStartHref !== "/upsc/daily-command#daily-me-time-checkin"
  ) {
    throw new Error(`fresh-task-readiness: unexpected state ${JSON.stringify({ freshTaskReadiness, freshStartHref })}`);
  }

  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/daily-command#daily-me-time-checkin", checks, "fresh-start-action");
  await assertHref(
    page.getByTestId("upsc-signal-learning-gap"),
    "/upsc/daily-command#daily-me-time-checkin",
    checks,
    "fresh-learning-gap"
  );
  await assertHref(
    page.getByTestId("upsc-signal-next-revision"),
    "/upsc/geography/revisit?day=3",
    checks,
    "fresh-next-revision"
  );
  await page.getByText("Recall baseline pending", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Next revision Day 3", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Interior of Earth and Plate Movement", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("balanced recall and repair", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-me-time-check").getByRole("button", { name: "focused" }).click();
  await page.waitForFunction(
    (progressStorageKey) => {
      const raw = window.localStorage.getItem(progressStorageKey);
      if (!raw) return false;
      const progress = JSON.parse(raw);
      return Boolean(
        progress?.["1"]?.meTimeCompletedAt &&
          progress?.["1"]?.meTimeMood === "focused" &&
          progress?.["1"]?.meTimeResetPlan?.includes("main action now")
      );
    },
    progressKey,
    { timeout: 15000 }
  );
  await page.getByTestId("upsc-me-time-check").evaluate((node) => {
    if (node.getAttribute("data-me-time-status") !== "ready") {
      throw new Error("me-time check did not switch to ready after mood save");
    }
    if (!node.getAttribute("data-me-time-reset-plan")?.includes("main action now")) {
      throw new Error("me-time check did not expose the focused reset plan");
    }
  });
  await page.getByTestId("upsc-signal-todays-task").getByText("Recall baseline is pending", { exact: false }).waitFor({ timeout: 15000 });
  const focusedTaskReadiness = await page.getByTestId("upsc-task-readiness-proof").evaluate((node) => ({
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
  }));
  checks.push({ label: "focused-task-readiness", focusedTaskReadiness });
  if (focusedTaskReadiness.status !== "Recall first" || focusedTaskReadiness.score !== "20") {
    throw new Error(`focused-task-readiness: unexpected state ${JSON.stringify(focusedTaskReadiness)}`);
  }
  await page.getByTestId("upsc-me-time-reset-plan").getByText("main action now", { exact: false }).waitFor({ timeout: 15000 });
  await page.goto(`${baseUrl}/history`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("focused", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("1 start check saved", { exact: true }).waitFor({ timeout: 15000 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-planning-drawer").locator("summary").first().click();
  await page.getByTestId("upsc-personal-plan-rules").getByText("Recall -> repair class -> fresh MCQ.", {
    exact: true,
  }).waitFor({ timeout: 15000 });
  const currentFlowRoomLinkCount = await page.getByTestId("upsc-today-task").locator("a").count();
  const orientationStepCount = await page.getByTestId("upsc-today-task").locator('[data-testid^="upsc-day-step-"]').count();
  checks.push({ label: "planning-drawer-read-only-orientation", currentFlowRoomLinkCount, orientationStepCount });
  if (currentFlowRoomLinkCount !== 0 || orientationStepCount !== 3) {
    throw new Error(
      `planning-drawer-read-only-orientation: expected zero room links and three orientation steps, got ${JSON.stringify({
        currentFlowRoomLinkCount,
        orientationStepCount,
      })}`
    );
  }
  await page.getByTestId("upsc-planning-drawer").locator("summary").first().click();
  await assertNoOverflow(page, "dashboard-fresh-desktop", checks);

  await seedSession(page, {
    1: {
      day: 1,
      talkScore: 76,
      talkBand: "Practice",
      talkNextRoute: "/upsc/geography/watch?day=1",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.evaluate((profileStorageKey) => {
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertDashboardSurfaceIsSimple(page, checks, "talk-clear-simple-surface");
  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/daily-command#daily-me-time-checkin", checks, "talk-clear-next-action");
  await assertHref(
    page.getByTestId("upsc-signal-next-revision"),
    "/upsc/geography/revisit?day=3",
    checks,
    "talk-clear-day-3-source-topic"
  );

  await page.evaluate((progressStorageKey) => {
    window.localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        1: {
          day: 1,
          watched: true,
          revisitQueued: true,
          talkScore: 58,
          talkBand: "Revisit",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertDashboardSurfaceIsSimple(page, checks, "revisit-simple-surface");
  await assertHref(page.getByTestId("upsc-start-today"), "/upsc/geography/revisit?day=1", checks, "revisit-next-action");

  await page.evaluate((progressStorageKey) => {
    window.localStorage.removeItem(progressStorageKey);
  }, progressKey);

  const ctaChecks = [
    ["/reports", "student-gap-primary-action", "/upsc/geography/talk?day=1"],
    ["/revision", "student-revision-primary-action", "/upsc/daily-command#daily-me-time-checkin"],
    ["/history", "student-progress-primary-action", "/upsc/geography/talk?day=1"],
  ];

  for (const [route, testId, expectedHref] of ctaChecks) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 45000 });
    await assertHref(page.getByTestId(testId), expectedHref, checks, route);
    await assertNoOverflow(page, `${route}-desktop`, checks);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "dashboard-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_dashboard_logout");
      window.localStorage.setItem(authStorageKey, "authenticated-student-a");
      window.localStorage.setItem(profileStorageKey, JSON.stringify({ level: "advanced", updatedAt: new Date().toISOString() }));
      window.localStorage.setItem(progressStorageKey, JSON.stringify({ 1: { day: 1, watched: true, updatedAt: new Date().toISOString() } }));
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey }
  );
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("button", { name: "Exit" }).click();
  await page.waitForFunction(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) =>
      !window.localStorage.getItem("MOCK_TOKEN") &&
      !window.localStorage.getItem(profileStorageKey) &&
      !window.localStorage.getItem(progressStorageKey) &&
      !window.localStorage.getItem(authStorageKey),
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey },
    { timeout: 15000 }
  );
  const logoutState = await page.evaluate(
    ({ profileStorageKey, progressStorageKey, authStorageKey }) => ({
      mockToken: window.localStorage.getItem("MOCK_TOKEN"),
      profile: window.localStorage.getItem(profileStorageKey),
      geographyProgress: window.localStorage.getItem(progressStorageKey),
      authenticatedUserMarker: window.localStorage.getItem(authStorageKey),
    }),
    { profileStorageKey: profileKey, progressStorageKey: progressKey, authStorageKey: authUserKey }
  );
  checks.push({ label: "logout-clears-local-learner-state", logoutState });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

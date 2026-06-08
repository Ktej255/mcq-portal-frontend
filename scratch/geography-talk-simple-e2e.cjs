const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-talk-simple-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-talk-simple-final.png");
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
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function assertTalkFourSignalContract(page, expected, checks) {
  const panel = page.getByTestId("geography-talk-simple-panel");
  const grid = page.getByTestId("talk-four-signal-grid");
  await grid.waitFor({ timeout: 15000 });

  const panelContract = await panel.evaluate((node) => ({
    signalModel: node.getAttribute("data-signal-model"),
    signalCount: node.getAttribute("data-essential-signal-count"),
    signals: node.getAttribute("data-essential-signals"),
    flowState: node.getAttribute("data-flow-state"),
    visibleScore: node.getAttribute("data-visible-recall-score"),
    recallGap: node.getAttribute("data-recall-gap"),
    primaryActionHref: node.getAttribute("data-primary-action-href"),
    primaryActionLabel: node.getAttribute("data-primary-action-label"),
  }));

  const gridContract = await grid.evaluate((node) => ({
    signalCount: node.getAttribute("data-signal-count"),
    flowState: node.getAttribute("data-flow-state"),
    recallTarget: node.getAttribute("data-recall-target"),
    visibleScore: node.getAttribute("data-visible-recall-score"),
    nextActionRoute: node.getAttribute("data-next-action-route"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
    text: node.textContent || "",
  }));

  const signals = await grid.locator("[data-testid^='talk-signal-']").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-testid"),
      signal: node.getAttribute("data-signal"),
      href: node.getAttribute("href"),
      nextRoute: node.getAttribute("data-next-action-route"),
      nextLabel: node.getAttribute("data-next-action-label"),
      score: node.getAttribute("data-score"),
      gap: node.getAttribute("data-gap"),
      gapCategory: node.getAttribute("data-gap-category"),
      teacherStatus: node.getAttribute("data-teacher-status"),
      text: node.textContent || "",
    }))
  );

  checks.push({ label: expected.label, panelContract, gridContract, signals });

  const signalIds = signals.map((signal) => signal.id);
  const requiredSignals = [
    "talk-signal-teacher-question",
    "talk-signal-recall-gap",
    "talk-signal-repair-focus",
    "talk-signal-next-route",
  ];
  const recallSignal = signals.find((signal) => signal.id === "talk-signal-recall-gap");
  const repairSignal = signals.find((signal) => signal.id === "talk-signal-repair-focus");
  const nextRouteSignal = signals.find((signal) => signal.id === "talk-signal-next-route");

  if (
    panelContract.signalModel !== "talk-four-signal-one-answer" ||
    panelContract.signalCount !== "4" ||
    panelContract.signals !== "teacher-question|recall-gap|repair-focus|next-route" ||
    gridContract.signalCount !== "4" ||
    gridContract.recallTarget !== "95" ||
    signals.length !== 4 ||
    !requiredSignals.every((id) => signalIds.includes(id)) ||
    !gridContract.text.includes("Teacher question") ||
    !gridContract.text.includes("Recall gap") ||
    !gridContract.text.includes("Repair focus") ||
    !gridContract.text.includes("Next route") ||
    (expected.flowState && gridContract.flowState !== expected.flowState) ||
    (expected.score && gridContract.visibleScore !== expected.score) ||
    (expected.nextRoute !== undefined && gridContract.nextActionRoute !== expected.nextRoute) ||
    (expected.nextLabel && gridContract.nextActionLabel !== expected.nextLabel) ||
    (expected.nextRoute !== undefined && nextRouteSignal?.nextRoute !== expected.nextRoute) ||
    (expected.nextRoute && nextRouteSignal?.href !== expected.nextRoute) ||
    (expected.gapCategory && repairSignal?.gapCategory !== expected.gapCategory) ||
    (expected.teacherStatus && repairSignal?.teacherStatus !== expected.teacherStatus) ||
    (expected.score && recallSignal?.score !== expected.score)
  ) {
    throw new Error(`Talk four-signal contract failed: ${JSON.stringify({ expected, panelContract, gridContract, signals }, null, 2)}`);
  }
}

async function seedProfile(page, level, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, learnerLevel, savedProgress }) => {
      const token = "MOCK_TOKEN_geography_talk_simple";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: learnerLevel,
          preparationStage: learnerLevel === "beginner" ? "not-started" : learnerLevel === "intermediate" ? "coaching-complete" : "multiple-attempts",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: learnerLevel === "beginner" ? "no-attempt" : learnerLevel === "intermediate" ? "no-attempt" : "two-plus-attempts",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        }),
      );
      if (savedProgress) {
        window.localStorage.setItem(geographyProgressKey, JSON.stringify({ "1": savedProgress }));
      } else {
        window.localStorage.removeItem(geographyProgressKey);
      }
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey, learnerLevel: level, savedProgress: progress },
  );
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

  await seedProfile(page, "advanced");
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-teacher-question").getByText("AI teacher", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-teacher-question").getByText("Why did this topic still cost marks?", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-mode").getByText("Advanced attempt-gap diagnosis", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-teacher-hint").getByText("past attempts failed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-repair-frame").getByText("repeated-attempt gaps", { exact: false }).waitFor({ timeout: 15000 });
  const advancedPanelAttributes = await page.getByTestId("geography-talk-simple-panel").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    mode: element.getAttribute("data-teacher-mode"),
    visibleMode: element.getAttribute("data-visible-mode"),
  }));
  const advancedSurfaceMetrics = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      const box = node?.getBoundingClientRect();
      return box ? { top: Math.round(box.top), height: Math.round(box.height), bottom: Math.round(box.bottom) } : null;
    };
    return {
      panel: rect('[data-testid="geography-talk-simple-panel"]'),
      teacher: rect('[data-testid="talk-teacher-question"]'),
      answer: rect('[data-testid="talk-answer-draft"]'),
      assess: rect('[data-testid="talk-assess-answer"]'),
      surface: rect('[data-testid="talk-discussion-surface"]'),
    };
  });
  const advancedLoopStripOpen = await page.getByTestId("talk-recall-loop-strip").evaluate((node) => node.open);
  checks.push({ label: "talk-advanced-level-copy", advancedPanelAttributes, advancedSurfaceMetrics, advancedLoopStripOpen });
  if (
    advancedPanelAttributes.level !== "advanced" ||
    !advancedPanelAttributes.mode?.includes("Advanced attempt-gap") ||
    advancedPanelAttributes.visibleMode !== "one-question-one-answer"
  ) {
    throw new Error(`Advanced Talk level copy mismatch: ${JSON.stringify(advancedPanelAttributes)}`);
  }
  if (!advancedSurfaceMetrics.answer || advancedSurfaceMetrics.answer.top > 620 || !advancedSurfaceMetrics.assess || advancedSurfaceMetrics.assess.top > 820) {
    throw new Error(`Talk answer/action are too low on the first screen: ${JSON.stringify(advancedSurfaceMetrics)}`);
  }
  if (advancedLoopStripOpen) {
    throw new Error("Talk process strip should stay folded on the student screen.");
  }
  await assertTalkFourSignalContract(
    page,
    {
      label: "talk-four-signal-before-answer",
      flowState: "answer-required",
      score: "0",
      nextRoute: "",
      nextLabel: "Send to AI teacher",
      gapCategory: "Pending",
      teacherStatus: "answer-required",
    },
    checks
  );

  const baselineContainerCount = await page.getByTestId("geography-talk-baseline").count();
  const baselineInputCount = await page.getByTestId("geography-talk-baseline-draft").count();
  const baselineSaveCount = await page.getByTestId("geography-talk-save-baseline").count();
  await page.locator('[data-testid="geography-talk-details"] > summary').click();
  await page.getByTestId("geography-talk-single-answer-rule").getByText("Explain once in the main answer box", { exact: false }).waitFor({ timeout: 15000 });
  const singleAnswerRuleText = await page.getByTestId("geography-talk-single-answer-rule").innerText();
  const routeGateVisibleBeforeAnswer = await page.getByTestId("talk-route-gate").count().then((count) => count > 0);
  checks.push({
    label: "talk-advanced-single-answer-rule",
    baselineContainerCount,
    baselineInputCount,
    baselineSaveCount,
    singleAnswerRuleText,
    routeGateVisibleBeforeAnswer,
  });
  if (baselineContainerCount || baselineInputCount || baselineSaveCount || routeGateVisibleBeforeAnswer) {
    throw new Error("Talk should expose one answer box only before the first diagnosis answer.");
  }
  if (!singleAnswerRuleText.includes("Intermediate and advanced learners answer before the repair lesson")) {
    throw new Error(`Single answer rule copy mismatch: ${singleAnswerRuleText}`);
  }

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geography uses location and scale.",
      "Because a place has a site and situation, one India map example can explain the relationship and affect the conclusion.",
      "UPSC trap: do not assume every location is identical.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open repair lesson", { exact: false }).waitFor({ timeout: 15000 });
  const repairLessonHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  const rawDecisionLabels = await page.getByText(/^Decision:/).count();
  checks.push({ label: "talk-advanced-diagnosis-opens-repair", repairLessonHref, rawDecisionLabels });
  if (repairLessonHref !== "/upsc/geography/watch?day=1" || rawDecisionLabels !== 0) {
    throw new Error(`Experienced diagnosis did not open the repair lesson: ${repairLessonHref}`);
  }
  await assertTalkFourSignalContract(
    page,
    {
      label: "talk-four-signal-repair-route",
      flowState: "route-ready",
      nextRoute: "/upsc/geography/watch?day=1",
      nextLabel: "Open repair lesson",
      teacherStatus: "repair-required",
    },
    checks
  );
  await assertNoOverflow(page, "talk-advanced-diagnosis-desktop", checks);

  await seedProfile(page, "intermediate");
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-mode").getByText("Intermediate self-study diagnosis", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-teacher-question").getByText("What do you already know?", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-teacher-hint").getByText("known concept, missing link", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-repair-frame").getByText("self-study gap", { exact: false }).waitFor({ timeout: 15000 });
  const intermediatePanelAttributes = await page.getByTestId("geography-talk-simple-panel").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    mode: element.getAttribute("data-teacher-mode"),
  }));
  checks.push({ label: "talk-intermediate-level-copy", intermediatePanelAttributes });
  if (intermediatePanelAttributes.level !== "intermediate" || !intermediatePanelAttributes.mode?.includes("Intermediate self-study")) {
    throw new Error(`Intermediate Talk level copy mismatch: ${JSON.stringify(intermediatePanelAttributes)}`);
  }
  await assertNoOverflow(page, "talk-intermediate-diagnosis-desktop", checks);

  await seedProfile(page, "beginner", {
    day: 1,
    watched: true,
    watchState: "Watched",
    watchMinutes: 12,
    watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
    watchHandoffReady: true,
    watchHandoffSummary:
      "Concept: Geographic thinking and map relationships. Mechanism: location, site, situation, and scale explain India spatially. UPSC trap: avoid isolated-location memorization.",
    labMode: "india-map",
    updatedAt: new Date().toISOString(),
  });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-teacher-question").getByText("What did you learn?", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-mode").getByText("Beginner lesson recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geographic thinking uses location, scale, site and situation.",
      "Because location affects relationships across India, a map example such as a coast matters.",
      "UPSC trap: not every isolated statement is identical.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-teacher-follow-up").waitFor({ timeout: 15000 });
  await page
    .getByTestId("talk-teacher-follow-up-prompt")
    .getByText(/Ask for one clearer repeat explanation.*Connect .* through one cause-effect chain, one India map example, and one UPSC trap\./i)
    .waitFor({ timeout: 15000 });
  const teacherFollowUpPrompt = await page.getByTestId("talk-teacher-follow-up-prompt").innerText();
  const routeVisibleDuringChallenge = await page.getByTestId("talk-route-gate").isVisible().catch(() => false);
  const scoreVisibleDuringChallenge = await page.getByTestId("talk-score-card").isVisible().catch(() => false);
  const visibleRepairActionCount = await page.getByTestId("talk-reassess-challenge").count();
  checks.push({ label: "talk-one-teacher-follow-up", teacherFollowUpPrompt, routeVisibleDuringChallenge, scoreVisibleDuringChallenge, visibleRepairActionCount });
  if (routeVisibleDuringChallenge || scoreVisibleDuringChallenge) {
    throw new Error("Geography Talk should keep the score and route hidden while one repair answer is pending.");
  }
  if (visibleRepairActionCount !== 1) {
    throw new Error(`Geography Talk should expose one repair action, got ${visibleRepairActionCount}.`);
  }

  await page.getByTestId("talk-challenge-response").fill(
    [
      "Geographic thinking asks what, where, why, and why here rather than memorizing an isolated location.",
      "Absolute and relative location, site and situation, scale, and map relationships explain India spatially.",
      "Because location and scale change the relationship, the effect changes across a region.",
      "For example, an India map relationship between a river, coast, plateau, pass, or neighboring state proves why the place matters.",
      "UPSC trap: never assume every statement is identical or that only one isolated location proves the answer; check the exception.",
    ].join(" "),
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  const directMcqHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  const clearedMasteryPlanCount = await page.getByTestId("talk-mastery-plan").count();
  checks.push({ label: "talk-repair-clears-direct-to-mcq", directMcqHref, clearedMasteryPlanCount });
  if (directMcqHref !== "/upsc/geography/mcq-readiness?day=1" || clearedMasteryPlanCount !== 0) {
    throw new Error(`Repaired discussion did not open MCQ directly: ${directMcqHref}`);
  }
  await assertTalkFourSignalContract(
    page,
    {
      label: "talk-four-signal-mcq-route",
      flowState: "route-ready",
      nextRoute: "/upsc/geography/mcq-readiness?day=1",
      nextLabel: "Open MCQ",
      teacherStatus: "mcq-ready",
    },
    checks
  );
  await assertNoOverflow(page, "talk-repaired-desktop", checks);

  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "talk-progress", progress });
  if (
    typeof progress?.talkScore !== "number" ||
    progress.talkScore < 95 ||
    progress?.talkBand !== "Command" ||
    progress?.talkUnlockStage !== "mcq" ||
    progress?.talkNextRoute !== "/upsc/geography/mcq-readiness?day=1" ||
    progress?.talkDiscussionStep !== "verdict" ||
    progress?.talkTeacherStatus !== "mcq-ready" ||
    progress?.talkTeacherTurnCount !== 2 ||
    !progress?.talkTeacherFollowUpPrompt ||
    !progress?.talkTeacherFollowUpAnswer
  ) {
    throw new Error(`Talk did not persist direct MCQ clearance: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-repaired-mobile", checks);
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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

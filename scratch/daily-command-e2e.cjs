const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "daily-command-e2e-evidence.json");

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

async function seedMissionState(page) {
  await page.evaluate(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_daily_command_e2e");
    window.localStorage.setItem(
      "sarit-upsc-student-profile-v1",
      JSON.stringify({
        level: "beginner",
        preparationStage: "active",
        studyWindow: "90",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-daily-command-v1",
      JSON.stringify({
        subjectSlug: "geography",
        day: 3,
        note: "Start with monsoon logic and then repair weak areas.",
        updatedAt: new Date().toISOString(),
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-content-command-v1",
      JSON.stringify({
        "geography:D03": {
          videoStatus: "Ready",
          notesStatus: "Ready",
          transcriptStatus: "Ready",
          sourceType: "Demo",
          contentNote: "Monsoon class ready.",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-mcq-command-v1",
      JSON.stringify({
        "GEO-D03": {
          planned: 25,
          drafted: 25,
          difficulty: "MEDIUM",
          status: "READY",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        3: {
          day: 3,
          watched: true,
          watchState: "Watched",
          watchMinutes: 85,
          confidence: "Shaky",
          reflection: "Monsoon logic needs one more map explanation.",
          revisitQueued: true,
          talkScore: 72,
          talkBand: "Practice",
          talkNextRoute: "/upsc/geography/watch?day=3",
          teacherDoubtCategory: "Applied proof",
          teacherDoubtReason: "The answer knows monsoon words but does not prove the idea on the India map.",
          teacherDoubtRepairAction: "Attach one monsoon map proof: Western Ghats windward side, rain shadow, or Bay branch path.",
          teacherDoubtMasteryCheck: "Can the learner explain why one region receives rainfall while another stays dry?",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  });
}

async function assertStudentFocus(page, expected, checks, label) {
  await page.getByTestId("daily-command-student-focus").waitFor({ timeout: 15000 });
  const focus = await page.getByTestId("daily-command-student-focus").evaluate((node) => ({
    mode: node.getAttribute("data-visible-mode"),
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    nextActionHref: node.getAttribute("data-next-action-href"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
    readinessStatus: node.getAttribute("data-readiness-status"),
    readinessScore: node.getAttribute("data-readiness-score"),
    learningGap: node.getAttribute("data-learning-gap"),
    revisionHref: node.getAttribute("data-revision-href"),
    afterThisDecision: node.getAttribute("data-after-this-decision"),
    afterThisRoute: node.getAttribute("data-after-this-route"),
    yesterdayDecision: node.getAttribute("data-yesterday-decision"),
    yesterdaySourceDay: node.getAttribute("data-yesterday-source-day"),
    yesterdayTargetDay: node.getAttribute("data-yesterday-target-day"),
    text: node.textContent || "",
  }));
  const primaryAction = await page.getByTestId("daily-command-primary-action").evaluate((node) => ({
    href: node.getAttribute("href"),
    nextActionHref: node.getAttribute("data-next-action-href"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
    readiness: node.getAttribute("data-session-readiness"),
    text: node.textContent || "",
  }));
  const focusProofOpen = await page.getByTestId("daily-command-focus-proof").evaluate((node) =>
    node instanceof HTMLDetailsElement ? node.open : false
  );
  checks.push({ label, focus, primaryAction, focusProofOpen });

  if (
    focus.mode !== "single-action-planner-proof" ||
    focus.subject !== expected.subject ||
    focus.day !== expected.day ||
    focus.nextActionHref !== expected.nextActionHref ||
    focus.nextActionLabel !== expected.nextActionLabel ||
    focus.readinessStatus !== expected.readinessStatus ||
    focus.readinessScore !== expected.readinessScore ||
    focus.afterThisDecision !== expected.afterThisDecision ||
    focus.afterThisRoute !== expected.afterThisRoute ||
    focus.yesterdayDecision !== expected.yesterdayDecision ||
    focus.yesterdaySourceDay !== expected.yesterdaySourceDay ||
    focus.yesterdayTargetDay !== expected.yesterdayTargetDay ||
    !focus.learningGap ||
    !focus.revisionHref ||
    !focus.text.includes("Do this now") ||
    !focus.text.includes(expected.visibleText) ||
    primaryAction.href !== expected.nextActionHref ||
    primaryAction.nextActionHref !== expected.nextActionHref ||
    primaryAction.nextActionLabel !== expected.nextActionLabel ||
    primaryAction.readiness !== expected.readinessStatus ||
    !primaryAction.text.includes(expected.nextActionLabel) ||
    focusProofOpen
  ) {
    throw new Error(`${label}: student focus contract failed: ${JSON.stringify({ focus, primaryAction, focusProofOpen }, null, 2)}`);
  }
}

async function assertTodayOriginProof(page, expected, checks, label) {
  await page.getByTestId("daily-today-origin-proof").waitFor({ timeout: 15000 });
  const origin = await page.getByTestId("daily-today-origin-proof").evaluate((node) => ({
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    status: node.getAttribute("data-origin-status"),
    route: node.getAttribute("data-origin-route"),
    text: node.textContent || "",
  }));
  checks.push({ label, origin });

  if (
    origin.sourceDay !== expected.sourceDay ||
    origin.targetDay !== expected.targetDay ||
    origin.status !== expected.status ||
    origin.route !== expected.route ||
    !origin.text.includes(expected.titleText) ||
    !origin.text.includes(expected.summaryText)
  ) {
    throw new Error(`${label}: today origin proof failed: ${JSON.stringify(origin, null, 2)}`);
  }
}

async function assertLearningFunnel(page, expected, checks, label) {
  await page.getByTestId("daily-student-learning-funnel").waitFor({ timeout: 15000 });
  const funnel = await page.getByTestId("daily-student-learning-funnel").evaluate((node) => ({
    subject: node.getAttribute("data-active-subject"),
    day: node.getAttribute("data-active-day"),
    stepCount: node.getAttribute("data-step-count"),
    gapTitle: node.getAttribute("data-gap-title"),
    todayTask: node.getAttribute("data-today-task"),
    revisionLabel: node.getAttribute("data-revision-label"),
    nextRoute: node.getAttribute("data-next-route"),
    decision: node.getAttribute("data-decision"),
    readinessStatus: node.getAttribute("data-readiness-status"),
    text: node.textContent || "",
  }));
  const steps = await page.getByTestId("daily-student-learning-funnel").evaluate((node) =>
    [...node.querySelectorAll('[data-testid="daily-funnel-step"]')].map((step) => ({
      id: step.getAttribute("data-step-id"),
      text: step.textContent || "",
    }))
  );
  const primaryAction = await page.getByTestId("daily-funnel-primary-action").evaluate((node) => ({
    href: node.getAttribute("href"),
    text: node.textContent || "",
  }));

  checks.push({ label, funnel, steps, primaryAction });

  if (
    funnel.subject !== expected.subject ||
    funnel.day !== expected.day ||
    funnel.stepCount !== "4" ||
    funnel.gapTitle !== expected.gapTitle ||
    funnel.todayTask !== expected.todayTask ||
    funnel.revisionLabel !== expected.revisionLabel ||
    funnel.nextRoute !== expected.nextRoute ||
    funnel.decision !== expected.decision ||
    funnel.readinessStatus !== expected.readinessStatus ||
    primaryAction.href !== expected.primaryHref ||
    !primaryAction.text.includes(expected.primaryLabel) ||
    steps.map((step) => step.id).join("|") !== "known-evidence|gap|today|revision" ||
    !funnel.text.includes("Today's simple path") ||
    !funnel.text.includes(expected.visibleText)
  ) {
    throw new Error(`${label}: learning funnel contract failed: ${JSON.stringify({ funnel, steps, primaryAction }, null, 2)}`);
  }
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

  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "networkidle" });
  await seedMissionState(page);

  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "networkidle" });
  const seededHeaderText = await page.locator("body").innerText({ timeout: 15000 });
  checks.push({
    label: "daily-command-student-route",
    url: page.url(),
    textSample: seededHeaderText.slice(0, 500),
    storedDailyMission: await page.evaluate(() => window.localStorage.getItem("sarit-upsc-daily-command-v1")),
  });
  const dailyDashboardVisible = await page.getByTestId("daily-learning-dashboard").isVisible().catch(() => false);
  if (!dailyDashboardVisible) {
    throw new Error(
      `Daily command dashboard did not render after seed: ${JSON.stringify(checks[checks.length - 1], null, 2)}`
    );
  }
  await page.getByTestId("daily-learning-dashboard").waitFor({ timeout: 15000 });
  await assertStudentFocus(
    page,
    {
      subject: "geography",
      day: "3",
      nextActionHref: "/upsc/geography/watch?day=3",
      nextActionLabel: "Open repair class",
      readinessStatus: "Repair lock",
      readinessScore: "40",
      afterThisDecision: "Repair first",
      afterThisRoute: "/upsc/geography/watch?day=3",
      yesterdayDecision: "Manual selection",
      yesterdaySourceDay: "2",
      yesterdayTargetDay: "3",
      visibleText: "Repair Day 3 before new load",
    },
    checks,
    "daily-command-focus-repair-lock"
  );
  await assertLearningFunnel(
    page,
    {
      subject: "geography",
      day: "3",
      gapTitle: "AI found Applied proof gap",
      todayTask: "Repair Day 3 before new load",
      revisionLabel: "AI gap",
      nextRoute: "/upsc/geography/watch?day=3",
      decision: "Repair first",
      readinessStatus: "Repair lock",
      primaryHref: "/upsc/geography/watch?day=3",
      primaryLabel: "Open repair class",
      visibleText: "Day 3 evidence",
    },
    checks,
    "daily-learning-funnel-repair-lock"
  );
  await assertTodayOriginProof(
    page,
    {
      sourceDay: "2",
      targetDay: "3",
      status: "Manual selection",
      route: "/upsc/geography/watch?day=2",
      titleText: "Day 2 evidence is missing",
      summaryText: "Yesterday did not provide enough evidence",
    },
    checks,
    "daily-today-origin-proof-repair-lock"
  );
  await page.getByText("Geography: Day 3", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Revisit queued", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("daily-learning-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("daily-learning-gap").getByText("AI found Applied proof gap", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-revision-signal").getByText("AI gap", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-today-task").getByText("Solve Day 3 Applied proof gap", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-session-readiness").getByText("Repair Day 3 before new load", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-session-readiness").getByText("Attach one monsoon map proof", { exact: false }).waitFor({ timeout: 15000 });
  const repairReadiness = await page.getByTestId("daily-session-readiness").evaluate((node) => ({
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
    text: node.textContent || "",
  }));
  checks.push({ label: "daily-session-readiness-repair-lock", repairReadiness });
  if (repairReadiness.status !== "Repair lock" || repairReadiness.score !== "40") {
    throw new Error(`Unexpected repair readiness: ${JSON.stringify(repairReadiness)}`);
  }
  await page.getByTestId("daily-tomorrow-adjustment").getByText("Hold Day 3 for repair", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-tomorrow-adjustment").getByText("Tomorrow starts with the AI teacher's Applied proof gap", { exact: false }).waitFor({ timeout: 15000 });
  const repairAdjustment = await page.getByTestId("daily-tomorrow-adjustment").evaluate((node) => ({
    status: node.getAttribute("data-adjustment-status"),
    href: node.getAttribute("href"),
    text: node.textContent || "",
  }));
  checks.push({ label: "daily-tomorrow-repair-adjustment", repairAdjustment });
  if (repairAdjustment.status !== "Repair first" || repairAdjustment.href !== "/upsc/geography/watch?day=3") {
    throw new Error(`Unexpected repair adjustment: ${JSON.stringify(repairAdjustment)}`);
  }
  await page.getByTestId("daily-next-session-proof").getByText("Day 3 evidence chose Day 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-next-session-proof").getByText("AI gap: Applied proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-next-session-proof").getByText("Recall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-next-session-proof").getByText("MCQ evidence missing", { exact: false }).waitFor({ timeout: 15000 });
  const repairProof = await page.getByTestId("daily-next-session-proof").evaluate((node) => ({
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    decision: node.getAttribute("data-decision"),
    text: node.textContent || "",
  }));
  checks.push({ label: "daily-next-session-repair-proof", repairProof });
  if (
    repairProof.sourceDay !== "3" ||
    repairProof.targetDay !== "3" ||
    repairProof.decision !== "Repair first" ||
    !/blocker changed tomorrow's route/i.test(repairProof.text) ||
    !/Me-time pending/i.test(repairProof.text)
  ) {
    throw new Error(`Unexpected repair next-session proof: ${JSON.stringify(repairProof)}`);
  }
  await page.getByTestId("daily-teacher-doubt-plan").getByText("Attach one monsoon map proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-teacher-doubt-plan").getByText("Can the learner explain why one region receives rainfall", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-growth-signal").getByText("Average recall 72", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-me-time-checkin").waitFor({ timeout: 15000 });
  await page.getByTestId("daily-me-time-tired").click();
  await page
    .getByTestId("daily-me-time-checkin")
    .getByText("Me-time saved for Geography Day 3", { exact: false })
    .waitFor({ timeout: 15000 });
  await page.getByTestId("daily-growth-signal").getByText("Reset before class", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-session-readiness").getByText("Saved as tired", { exact: false }).waitFor({ timeout: 15000 });
  const repairReadinessAfterMeTime = await page.getByTestId("daily-session-readiness").evaluate((node) => ({
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
  }));
  checks.push({ label: "daily-session-readiness-after-me-time", repairReadinessAfterMeTime });
  if (repairReadinessAfterMeTime.status !== "Repair lock" || repairReadinessAfterMeTime.score !== "60") {
    throw new Error(`Unexpected repair readiness after me-time: ${JSON.stringify(repairReadinessAfterMeTime)}`);
  }
  await assertStudentFocus(
    page,
    {
      subject: "geography",
      day: "3",
      nextActionHref: "/upsc/geography/watch?day=3",
      nextActionLabel: "Open repair class",
      readinessStatus: "Repair lock",
      readinessScore: "60",
      afterThisDecision: "Repair first",
      afterThisRoute: "/upsc/geography/watch?day=3",
      yesterdayDecision: "Manual selection",
      yesterdaySourceDay: "2",
      yesterdayTargetDay: "3",
      visibleText: "Repair Day 3 before new load",
    },
    checks,
    "daily-command-focus-after-me-time"
  );
  await assertLearningFunnel(
    page,
    {
      subject: "geography",
      day: "3",
      gapTitle: "AI found Applied proof gap",
      todayTask: "Repair Day 3 before new load",
      revisionLabel: "AI gap",
      nextRoute: "/upsc/geography/watch?day=3",
      decision: "Repair first",
      readinessStatus: "Repair lock",
      primaryHref: "/upsc/geography/watch?day=3",
      primaryLabel: "Open repair class",
      visibleText: "Day 3 evidence",
    },
    checks,
    "daily-learning-funnel-after-me-time"
  );
  const repairProofAfterMeTime = await page.getByTestId("daily-next-session-proof").evaluate((node) => ({
    decision: node.getAttribute("data-decision"),
    text: node.textContent || "",
  }));
  checks.push({ label: "daily-next-session-proof-after-me-time", repairProofAfterMeTime });
  if (
    repairProofAfterMeTime.decision !== "Repair first" ||
    !/Saved tired/i.test(repairProofAfterMeTime.text) ||
    !/AI gap: Applied proof/i.test(repairProofAfterMeTime.text)
  ) {
    throw new Error(`Unexpected repair proof after me-time: ${JSON.stringify(repairProofAfterMeTime)}`);
  }
  await page.getByRole("link", { name: /Watch/i }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "daily-command-desktop-geography", checks);

  const geographyProgress = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("sarit-upsc-geography-progress-v1") || "{}")
  );
  checks.push({ label: "daily-me-time-progress", geographyDay3: geographyProgress["3"] });
  if (
    geographyProgress["3"]?.meTimeMood !== "tired" ||
    !geographyProgress["3"]?.meTimeCompletedAt ||
    !geographyProgress["3"]?.meTimeResetPlan?.includes("two-minute reset")
  ) {
    throw new Error(`Me-time progress did not persist correctly: ${JSON.stringify(geographyProgress["3"])}`);
  }

  await page.getByRole("button", { name: /December-January\s+History/i }).click();
  await page.getByRole("button", { name: /HIS-D04/i }).click();
  await page.getByText("History: Day 4", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("daily-session-readiness").getByText("Save mind-state before starting", { exact: false }).waitFor({ timeout: 15000 });
  const freshReadiness = await page.getByTestId("daily-session-readiness").evaluate((node) => {
    const link = node.querySelector("a");
    return {
      status: node.getAttribute("data-readiness-status"),
      score: node.getAttribute("data-readiness-score"),
      href: link?.getAttribute("href"),
    };
  });
  checks.push({ label: "daily-session-readiness-fresh-day", freshReadiness });
  if (freshReadiness.status !== "Mind-state first" || freshReadiness.score !== "0" || freshReadiness.href !== "#daily-me-time-checkin") {
    throw new Error(`Unexpected fresh readiness: ${JSON.stringify(freshReadiness)}`);
  }
  await assertStudentFocus(
    page,
    {
      subject: "history",
      day: "4",
      nextActionHref: "#daily-me-time-checkin",
      nextActionLabel: "Choose me-time",
      readinessStatus: "Mind-state first",
      readinessScore: "0",
      afterThisDecision: "Same topic",
      afterThisRoute: "/upsc/history/watch?day=4",
      yesterdayDecision: "Manual selection",
      yesterdaySourceDay: "3",
      yesterdayTargetDay: "4",
      visibleText: "Save mind-state before starting",
    },
    checks,
    "daily-command-focus-fresh-history"
  );
  await assertLearningFunnel(
    page,
    {
      subject: "history",
      day: "4",
      gapTitle: "Recall baseline pending",
      todayTask: "Save mind-state before starting",
      revisionLabel: "Day 6",
      nextRoute: "/upsc/history/watch?day=4",
      decision: "Same topic",
      readinessStatus: "Mind-state first",
      primaryHref: "#daily-me-time-checkin",
      primaryLabel: "Choose me-time",
      visibleText: "Recall baseline missing",
    },
    checks,
    "daily-learning-funnel-fresh-history"
  );
  await assertTodayOriginProof(
    page,
    {
      sourceDay: "3",
      targetDay: "4",
      status: "Manual selection",
      route: "/upsc/history/watch?day=3",
      titleText: "Day 3 evidence is missing",
      summaryText: "Yesterday did not provide enough evidence",
    },
    checks,
    "daily-today-origin-proof-fresh-history"
  );
  await page.getByTestId("daily-tomorrow-adjustment").getByText("Keep Day 4 as the next start", { exact: false }).waitFor({ timeout: 15000 });
  const freshAdjustment = await page.getByTestId("daily-tomorrow-adjustment").evaluate((node) => ({
    status: node.getAttribute("data-adjustment-status"),
    href: node.getAttribute("href"),
  }));
  checks.push({ label: "daily-tomorrow-fresh-adjustment", freshAdjustment });
  if (freshAdjustment.status !== "Same topic" || freshAdjustment.href !== "/upsc/history/watch?day=4") {
    throw new Error(`Unexpected fresh adjustment: ${JSON.stringify(freshAdjustment)}`);
  }
  await page.getByTestId("daily-next-session-proof").getByText("Day 4 evidence chose Day 4", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("daily-next-session-proof").getByText("missing evidence", { exact: false }).waitFor({ timeout: 15000 });
  const freshProof = await page.getByTestId("daily-next-session-proof").evaluate((node) => ({
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    decision: node.getAttribute("data-decision"),
    text: node.textContent || "",
  }));
  checks.push({ label: "daily-next-session-fresh-proof", freshProof });
  if (
    freshProof.sourceDay !== "4" ||
    freshProof.targetDay !== "4" ||
    freshProof.decision !== "Same topic" ||
    !/Me-time pending/i.test(freshProof.text) ||
    !/Recall baseline missing/i.test(freshProof.text) ||
    !/Class proof missing/i.test(freshProof.text)
  ) {
    throw new Error(`Unexpected fresh next-session proof: ${JSON.stringify(freshProof)}`);
  }
  await page.getByPlaceholder("Write today's target, doubt, or class instruction here.").fill(
    "Study Revolt of 1857 and then open Talk room."
  );
  await page.getByRole("button", { name: /Save daily mission/i }).click();
  await page.getByText("Daily mission saved locally.", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "daily-command-desktop-history", checks);

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sarit-upsc-daily-command-v1") || "{}"));
  if (stored.subjectSlug !== "history" || stored.day !== 4 || !stored.note?.includes("Revolt of 1857")) {
    throw new Error(`Daily mission did not persist correctly: ${JSON.stringify(stored)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Daily Mission", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "daily-command-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    storedDailyMission: stored,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "daily-command-final.png"), fullPage: true });
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-student-funnel-levels-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-student-funnel-levels-mobile.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function buildQuestion(index, correctOption) {
  return {
    test_id: 9300 + index,
    topic_id: 9300 + index,
    text_en: `Fresh Geography Day 1 student funnel proof question ${index}.`,
    options_en: {
      A: "Location, scale, site and situation connect the map relationship.",
      B: "UPSC geography needs mechanism, India map proof and one trap.",
      C: "A place name alone proves every geography answer.",
      D: "Map relationships are optional after a lecture.",
    },
    correct_option: correctOption,
    explanation_en: `Question ${index} proves the learner funnel handoff.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D01",
      subject: "Geography",
      day: "1",
      chapter: "Geography Foundation",
      topic: "Geographic Thinking and Map Relationships",
    },
  };
}

const weakAnswer =
  "Geographic thinking and map relationships ask what, where and why. Absolute and relative location, site, situation and scale help read an India map because location creates different effects.";

const commandAnswer = [
  "Geographic Thinking and Map Relationships belongs to Geography Foundation.",
  "The concept starts with what, where and why, then connects absolute and relative location with site and situation.",
  "Because scale controls the level of detail, the same process creates different effects on a village map, India map and regional map.",
  "Mechanism: location, relief, river, coast, climate and routes create a relationship, so one place is explained through nearby regions and consequences.",
  "Map proof: in India, a Ganga floodplain settlement, a coast, a plateau edge or a Himalayan pass must be read through site, situation and scale.",
  "UPSC trap: an almost-correct statement may reverse site and situation, treat every location as uniform, or pair the right process with the wrong map exception.",
  "Therefore I answer in order: concept, mechanism, map example, and trap.",
].join(" ");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
    containsRetiredBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(document.body.innerText),
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsRetiredBranding) throw new Error(`${label} contains retired branding.`);
}

async function seedLearner(page, scenario) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileKey, progressKey, mcqKey, draftKey, scenario, questions }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem("MOCK_TOKEN", `MOCK_TOKEN_geography_student_funnel_${scenario.level}`);
      window.localStorage.setItem(
        profileKey,
        JSON.stringify({
          level: scenario.level,
          preparationStage: scenario.preparationStage,
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: scenario.level === "advanced" ? "two-plus-attempts" : "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: now,
        }),
      );
      window.localStorage.removeItem(progressKey);
      window.localStorage.setItem(
        mcqKey,
        JSON.stringify({
          "GEO-D01": {
            planned: questions.length,
            drafted: questions.length,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        }),
      );
      window.localStorage.setItem(
        draftKey,
        JSON.stringify([
          {
            id: `geography-student-funnel-${scenario.level}`,
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions,
          },
        ]),
      );
    },
    {
      profileKey,
      progressKey,
      mcqKey,
      draftKey,
      scenario,
      questions: [buildQuestion(1, "A"), buildQuestion(2, "B")],
    },
  );
}

async function readDayProgress(page, day) {
  return page.evaluate(
    ({ progressKey, day }) => JSON.parse(window.localStorage.getItem(progressKey) || "{}")[String(day)],
    { progressKey, day },
  );
}

async function assertDashboardNext(page, expected, checks, label) {
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-todays-task").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-learning-gap").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-next-revision").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-signal-trend").waitFor({ timeout: 15000 });

  const dashboard = await page.getByTestId("upsc-simple-dashboard").evaluate((element) => ({
    studentLevel: element.getAttribute("data-student-level"),
    preparationStage: element.getAttribute("data-preparation-stage"),
    nextActionRoom: element.getAttribute("data-next-action-room"),
    nextActionHref: element.getAttribute("data-next-action-href"),
    visibleMode: element.getAttribute("data-visible-mode"),
  }));
  const startToday = await page.getByTestId("upsc-start-today").evaluate((element) => ({
    href: element.getAttribute("href"),
    nextActionRoom: element.getAttribute("data-next-action-room"),
    text: element.textContent?.trim() || "",
  }));
  const pathSummary = await page.getByTestId("upsc-generated-daily-path-summary").innerText();
  const mainPathStrip = await page.getByTestId("upsc-main-path-strip").evaluate((element) => ({
    text: element.textContent || "",
    open: element.open,
  }));
  checks.push({ label, dashboard, startToday, pathSummary, mainPathStrip });

  if (
    dashboard.studentLevel !== expected.level ||
    dashboard.nextActionRoom !== expected.room ||
    dashboard.nextActionHref !== expected.href ||
    dashboard.visibleMode !== "four-signal-one-action" ||
    startToday.href !== expected.href ||
    startToday.nextActionRoom !== expected.room ||
    !pathSummary.toLowerCase().includes(`day ${expected.day} of`) ||
    mainPathStrip.open !== false ||
    !mainPathStrip.text.includes("MCQ") ||
    !mainPathStrip.text.includes("Next")
  ) {
    throw new Error(`${label} dashboard mismatch: ${JSON.stringify({ dashboard, startToday, pathSummary, mainPathStrip })}`);
  }

  await assertNoOverflow(page, label, checks);
  return startToday;
}

async function completeWatchToTalk(page, checks, label) {
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  const watchShell = await page.getByTestId("geography-watch-simple-repair").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    flowState: element.getAttribute("data-flow-state"),
    currentAction: element.getAttribute("data-current-action-label"),
    duration: element.getAttribute("data-duration-minutes"),
    sceneCount: element.getAttribute("data-scene-count"),
  }));
  checks.push({ label: `${label}-watch-shell`, watchShell });
  if (watchShell.duration !== "12" || Number(watchShell.sceneCount) < 5) {
    throw new Error(`${label} watch shell is not a 10-15 minute lesson contract: ${JSON.stringify(watchShell)}`);
  }

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  const progress = await readDayProgress(page, 1);
  checks.push({ label: `${label}-watch-progress`, progress });
  if (
    progress?.watched !== true ||
    progress?.watchState !== "Watched" ||
    progress?.watchHandoffReady !== true ||
    (progress?.watchSceneCompletedIds?.length ?? 0) < 5
  ) {
    throw new Error(`${label} watch did not persist the class handoff: ${JSON.stringify(progress)}`);
  }
  await assertNoOverflow(page, `${label}-talk-after-watch`, checks);
}

async function submitTalkAnswer(page, answer, includeChallenge = false) {
  if (includeChallenge) {
    await page.getByTestId("talk-challenge-response").fill(answer);
    await page.getByTestId("talk-reassess-challenge").click();
    return;
  }

  await page.getByTestId("talk-answer-draft").fill(answer);
  await page.getByTestId("talk-assess-answer").click();
}

async function completeTalkToMcq(page, checks, label, mode) {
  if (mode === "beginner-repeat") {
    await submitTalkAnswer(page, weakAnswer);
    await page.getByTestId("talk-teacher-follow-up").waitFor({ timeout: 15000 });
    const weakGate = await page.getByTestId("talk-teacher-follow-up").evaluate((element) => ({
      learnerLevel: element.getAttribute("data-learner-level"),
      flowState: element.getAttribute("data-flow-state"),
      score: element.getAttribute("data-score"),
      recallTarget: element.getAttribute("data-recall-target"),
    }));
    checks.push({ label: `${label}-weak-talk-stays-in-room`, weakGate });
    if (weakGate.learnerLevel !== "beginner" || weakGate.recallTarget !== "95" || Number(weakGate.score) >= 95) {
      throw new Error(`${label} weak beginner answer did not stay in Talk repair: ${JSON.stringify(weakGate)}`);
    }
    if (await page.getByTestId("talk-route-gate").isVisible().catch(() => false)) {
      throw new Error(`${label} exposed a route before 95 percent recall.`);
    }

    await submitTalkAnswer(page, commandAnswer, true);
  } else {
    await submitTalkAnswer(page, commandAnswer);
  }

  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  const routeGate = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    score: element.getAttribute("data-score"),
    target: element.getAttribute("data-recall-target"),
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  checks.push({ label: `${label}-talk-route-gate`, routeGate });
  if (Number(routeGate.score) < 95 || routeGate.href !== "/upsc/geography/mcq-readiness?day=1" || routeGate.mcqReady !== "true") {
    throw new Error(`${label} Talk did not unlock MCQ at 95 percent: ${JSON.stringify(routeGate)}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=1", { timeout: 15000 });
  await page.getByTestId("geography-mcq-level-shell").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, `${label}-mcq-ready`, checks);
}

async function completeMcqToNextTopic(page, checks, label, expectedHref) {
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: true }).waitFor({ timeout: 15000 });

  const nextAction = await page.getByTestId("mcq-student-next-action").evaluate((element) => ({
    href: element.getAttribute("href"),
    learnerLevel: element.getAttribute("data-learner-level"),
    outcome: element.getAttribute("data-outcome"),
    nextActionRoute: element.getAttribute("data-next-action-route"),
    nextTopicDay: element.getAttribute("data-next-topic-day"),
  }));
  const progress = await readDayProgress(page, 1);
  checks.push({ label: `${label}-mcq-result`, nextAction, progress });

  if (
    nextAction.href !== expectedHref ||
    nextAction.nextActionRoute !== expectedHref ||
    nextAction.outcome !== "Command" ||
    nextAction.nextTopicDay !== "2" ||
    progress?.mcqCompleted !== true ||
    progress?.mcqOutcome !== "Command" ||
    progress?.mcqNextRoute !== expectedHref
  ) {
    throw new Error(`${label} MCQ did not advance to next topic: ${JSON.stringify({ nextAction, progress })}`);
  }
  await assertNoOverflow(page, `${label}-mcq-complete`, checks);
}

async function runBeginner(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedLearner(page, { level: "beginner", preparationStage: "not-started" });
  await assertDashboardNext(page, { level: "beginner", room: "watch", href: "/upsc/geography/watch?day=1", day: 1 }, checks, "beginner-dashboard-day1");
  await page.getByTestId("upsc-start-today").click();
  await page.waitForURL("**/upsc/geography/watch?day=1", { timeout: 15000 });
  await completeWatchToTalk(page, checks, "beginner");
  await completeTalkToMcq(page, checks, "beginner", "beginner-repeat");
  await completeMcqToNextTopic(page, checks, "beginner", "/upsc/geography/watch?day=2");
  await page.getByTestId("mcq-student-next-action").click();
  await page.waitForURL("**/upsc/geography/watch?day=2", { timeout: 15000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByText("Origin and Evolution of Earth", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-day2-watch", checks);
  await assertDashboardNext(page, { level: "beginner", room: "watch", href: "/upsc/geography/watch?day=2", day: 2 }, checks, "beginner-dashboard-day2");

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  await context.close();
  return {
    scenario: "beginner-full-loop",
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
}

async function runIntermediate(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedLearner(page, { level: "intermediate", preparationStage: "coaching-complete" });
  await assertDashboardNext(page, { level: "intermediate", room: "talk", href: "/upsc/geography/talk?day=1", day: 1 }, checks, "intermediate-dashboard-day1");
  await page.getByTestId("upsc-start-today").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  await submitTalkAnswer(page, weakAnswer);
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  const repairRoute = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    score: element.getAttribute("data-score"),
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const masteryPlanVisible = await page.getByTestId("talk-mastery-plan").isVisible().catch(() => false);
  checks.push({ label: "intermediate-diagnostic-first-repair", repairRoute, masteryPlanVisible });
  if (
    repairRoute.learnerLevel !== "intermediate" ||
    repairRoute.href !== "/upsc/geography/watch?day=1" ||
    repairRoute.label !== "Open repair lesson" ||
    repairRoute.mcqReady !== "false" ||
    masteryPlanVisible
  ) {
    throw new Error(`Intermediate diagnosis did not expose only the repair lesson: ${JSON.stringify({ repairRoute, masteryPlanVisible })}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/watch?day=1", { timeout: 15000 });
  await completeWatchToTalk(page, checks, "intermediate-repair");
  await completeTalkToMcq(page, checks, "intermediate", "direct-command");
  await completeMcqToNextTopic(page, checks, "intermediate", "/upsc/geography/talk?day=2");
  await assertDashboardNext(page, { level: "intermediate", room: "talk", href: "/upsc/geography/talk?day=2", day: 2 }, checks, "intermediate-dashboard-day2");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  await context.close();
  return {
    scenario: "intermediate-diagnostic-first-loop",
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
}

async function runAdvanced(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedLearner(page, { level: "advanced", preparationStage: "multiple-attempts" });
  await assertDashboardNext(page, { level: "advanced", room: "talk", href: "/upsc/geography/talk?day=1", day: 1 }, checks, "advanced-dashboard-day1");
  await page.getByTestId("upsc-start-today").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  await submitTalkAnswer(page, weakAnswer);
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  const repairRoute = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    score: element.getAttribute("data-score"),
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const masteryPlanVisible = await page.getByTestId("talk-mastery-plan").isVisible().catch(() => false);
  checks.push({ label: "advanced-attempt-gap-diagnosis-repair", repairRoute, masteryPlanVisible });
  if (
    repairRoute.learnerLevel !== "advanced" ||
    repairRoute.href !== "/upsc/geography/watch?day=1" ||
    repairRoute.label !== "Open repair lesson" ||
    repairRoute.mcqReady !== "false" ||
    masteryPlanVisible
  ) {
    throw new Error(`Advanced diagnosis did not expose only the precision repair lesson: ${JSON.stringify({ repairRoute, masteryPlanVisible })}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/watch?day=1", { timeout: 15000 });
  await completeWatchToTalk(page, checks, "advanced-repair");
  await completeTalkToMcq(page, checks, "advanced", "direct-command");
  await completeMcqToNextTopic(page, checks, "advanced", "/upsc/geography/talk?day=2");
  await page.getByTestId("mcq-student-next-action").click();
  await page.waitForURL("**/upsc/geography/talk?day=2", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "advanced-day2-talk", checks);
  await assertDashboardNext(page, { level: "advanced", room: "talk", href: "/upsc/geography/talk?day=2", day: 2 }, checks, "advanced-dashboard-day2");

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  await context.close();
  return {
    scenario: "advanced-attempt-gap-loop",
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [await runBeginner(browser), await runIntermediate(browser), await runAdvanced(browser)];
  await browser.close();

  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    results,
    passed: results.every((result) => result.passed),
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-talk-level-next-action-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-talk-level-next-action-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seedProfile(page, level, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, learnerLevel, savedProgress }) => {
      const token = "MOCK_TOKEN_geography_talk_level_next_action";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: learnerLevel,
          preparationStage:
            learnerLevel === "beginner"
              ? "not-started"
              : learnerLevel === "intermediate"
                ? "coaching-complete"
                : "multiple-attempts",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory:
            learnerLevel === "advanced"
              ? "two-plus-attempts"
              : "no-attempt",
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

async function submitWeakDiagnosis(page) {
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geography uses location and scale.",
      "A place has site and situation, so one India map example can affect the conclusion.",
      "UPSC trap: do not assume every location is identical.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
}

async function assertRepairLessonOnly(page, level, checks) {
  const routeGate = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    score: Number(element.getAttribute("data-score")),
    target: Number(element.getAttribute("data-recall-target")),
    route: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const panel = await page.getByTestId("geography-talk-simple-panel").evaluate((element) => ({
    state: element.getAttribute("data-flow-state"),
    primaryLabel: element.getAttribute("data-primary-action-label"),
    primaryHref: element.getAttribute("data-primary-action-href"),
    watchComplete: element.getAttribute("data-watch-complete"),
  }));
  const masteryPlanCount = await page.getByTestId("talk-mastery-plan").count();
  const repeatPromptCount = await page.getByTestId("talk-repeat-to-95").count();
  checks.push({ label: `${level}-repair-lesson-only`, routeGate, panel, masteryPlanCount, repeatPromptCount });

  if (
    routeGate.level !== level ||
    routeGate.route !== "/upsc/geography/watch?day=1" ||
    routeGate.label !== "Open repair lesson" ||
    routeGate.mcqReady !== "false" ||
    panel.state !== "route-ready" ||
    panel.primaryHref !== "/upsc/geography/watch?day=1" ||
    panel.watchComplete !== "false" ||
    masteryPlanCount !== 0 ||
    repeatPromptCount !== 0 ||
    !(routeGate.score > 0 && routeGate.score < routeGate.target)
  ) {
    throw new Error(`${level} repair route is not a single next action: ${JSON.stringify({ routeGate, panel, masteryPlanCount, repeatPromptCount }, null, 2)}`);
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

  await seedProfile(page, "beginner");
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-flow-gate").waitFor({ timeout: 15000 });
  const beginnerGate = await page.getByTestId("talk-flow-gate").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    state: element.getAttribute("data-flow-state"),
    href: element.getAttribute("data-gate-href"),
    target: element.getAttribute("data-recall-target"),
  }));
  const beginnerGateAction = await page.getByTestId("talk-flow-gate-action").getAttribute("href");
  checks.push({ label: "beginner-starts-with-lesson", beginnerGate, beginnerGateAction });
  if (
    beginnerGate.level !== "beginner" ||
    beginnerGate.state !== "gated" ||
    beginnerGate.href !== "/upsc/geography/watch?day=1" ||
    beginnerGateAction !== "/upsc/geography/watch?day=1" ||
    beginnerGate.target !== "95"
  ) {
    throw new Error(`Beginner gate mismatch: ${JSON.stringify({ beginnerGate, beginnerGateAction })}`);
  }

  await seedProfile(page, "intermediate");
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  const intermediateInitial = await page.getByTestId("geography-talk-simple-panel").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    state: element.getAttribute("data-flow-state"),
    target: element.getAttribute("data-recall-target"),
    primaryLabel: element.getAttribute("data-primary-action-label"),
    visibleMode: element.getAttribute("data-visible-mode"),
  }));
  checks.push({ label: "intermediate-initial-diagnosis", intermediateInitial });
  if (
    intermediateInitial.level !== "intermediate" ||
    intermediateInitial.state !== "answer-required" ||
    intermediateInitial.primaryLabel !== "Send to AI teacher" ||
    intermediateInitial.target !== "95" ||
    intermediateInitial.visibleMode !== "one-question-one-answer"
  ) {
    throw new Error(`Intermediate initial state mismatch: ${JSON.stringify(intermediateInitial)}`);
  }
  await submitWeakDiagnosis(page);
  await assertRepairLessonOnly(page, "intermediate", checks);

  await seedProfile(page, "advanced");
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-level-mode").getByText("Advanced attempt-gap diagnosis", { exact: false }).waitFor({ timeout: 15000 });
  await submitWeakDiagnosis(page);
  await assertRepairLessonOnly(page, "advanced", checks);
  await assertNoOverflow(page, "advanced-repair-route-desktop", checks);

  await seedProfile(page, "beginner", {
    day: 1,
    watched: true,
    watchState: "Watched",
    watchMinutes: 12,
    watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
    watchHandoffReady: true,
    watchHandoffSummary:
      "Concept: Geographic thinking and map relationships. Mechanism: location, site, situation, and scale explain India spatially. UPSC trap: avoid isolated-location memorization.",
    updatedAt: new Date().toISOString(),
  });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geographic thinking uses location, scale, site and situation.",
      "Because location affects relationships across India, a map example such as a coast matters.",
      "UPSC trap: not every isolated statement is identical.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-teacher-follow-up").waitFor({ timeout: 15000 });
  const beginnerRepairState = await page.getByTestId("talk-teacher-follow-up").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    state: element.getAttribute("data-flow-state"),
    score: Number(element.getAttribute("data-score")),
    target: Number(element.getAttribute("data-recall-target")),
  }));
  const routeDuringBeginnerRepair = await page.getByTestId("talk-route-gate").count();
  checks.push({ label: "beginner-repair-inside-talk", beginnerRepairState, routeDuringBeginnerRepair });
  if (
    beginnerRepairState.level !== "beginner" ||
    beginnerRepairState.state !== "repair-answer" ||
    !(beginnerRepairState.score > 0 && beginnerRepairState.score < beginnerRepairState.target) ||
    routeDuringBeginnerRepair !== 0
  ) {
    throw new Error(`Beginner repair loop mismatch: ${JSON.stringify({ beginnerRepairState, routeDuringBeginnerRepair })}`);
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
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  const mcqRoute = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    route: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    score: Number(element.getAttribute("data-score")),
    target: Number(element.getAttribute("data-recall-target")),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const finalPanel = await page.getByTestId("geography-talk-simple-panel").evaluate((element) => ({
    state: element.getAttribute("data-flow-state"),
    primaryHref: element.getAttribute("data-primary-action-href"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "beginner-mcq-unlocked-at-95", mcqRoute, finalPanel, progress });
  if (
    mcqRoute.level !== "beginner" ||
    mcqRoute.route !== "/upsc/geography/mcq-readiness?day=1" ||
    mcqRoute.label !== "Open MCQ" ||
    mcqRoute.mcqReady !== "true" ||
    mcqRoute.score < mcqRoute.target ||
    finalPanel.state !== "route-ready" ||
    finalPanel.primaryHref !== "/upsc/geography/mcq-readiness?day=1" ||
    finalPanel.mcqReady !== "true" ||
    progress?.talkNextRoute !== "/upsc/geography/mcq-readiness?day=1" ||
    progress?.talkTeacherStatus !== "mcq-ready"
  ) {
    throw new Error(`Beginner MCQ unlock mismatch: ${JSON.stringify({ mcqRoute, finalPanel, progress }, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-mcq-ready-mobile", checks);
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
  console.error(error.stack || error.message);
  process.exit(1);
});

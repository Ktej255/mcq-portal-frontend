const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-track-closeout-levels-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-track-closeout-levels-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const cases = [
  {
    level: "beginner",
    preparationStage: "not-started",
    expectedHref: "/upsc/geography/watch?day=2",
    expectedLandingTestId: "watch-topic-player",
  },
  {
    level: "intermediate",
    preparationStage: "coaching-complete",
    expectedHref: "/upsc/geography/talk?day=2",
    expectedLandingTestId: "geography-talk-simple-panel",
    expectedMode: "Intermediate self-study diagnosis",
  },
  {
    level: "advanced",
    preparationStage: "multiple-attempts",
    expectedHref: "/upsc/geography/talk?day=2",
    expectedLandingTestId: "geography-talk-simple-panel",
    expectedMode: "Advanced attempt-gap diagnosis",
  },
];

function completedDayOneProgress() {
  return {
    "1": {
      day: 1,
      watched: true,
      watchState: "Watched",
      watchMinutes: 12,
      watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
      watchHandoffReady: true,
      watchHandoffSummary:
        "Concept: Geographic thinking and map relationships. Mechanism: location, site, situation and scale explain India spatially. UPSC trap: avoid isolated-location memorization.",
      learnerLevel: "Beginner",
      reflection:
        "Geographic thinking connects what, where and why through location, scale, site, situation, India map proof and a UPSC trap.",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkTeacherStatus: "mcq-ready",
      talkNextRoute: "/upsc/geography/mcq-readiness?day=1",
      talkNextActionLabel: "Open MCQ",
      revisitQueued: false,
      labCompleted: true,
      labMode: "india-map",
      labProofCompletedIds: [
        "1-india-map-concept",
        "1-india-map-map",
        "1-india-map-example",
        "1-india-map-trap",
        "1-india-map-answer",
      ],
      labEvidenceAnchor: "Geographic thinking map proof",
      mcqAttempted: true,
      mcqCompleted: true,
      mcqAnsweredCount: 5,
      mcqCorrectCount: 5,
      mcqTotal: 5,
      mcqScorePercent: 100,
      mcqOutcome: "Command",
      mcqNextRoute: "/upsc/geography/watch?day=2",
      mcqNextActionLabel: "Start next topic",
      confidence: "Command",
      updatedAt: new Date().toISOString(),
    },
  };
}

async function seedCase(page, scenario) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, profile, progress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_track_closeout_levels");
      window.localStorage.setItem(studentProfileKey, JSON.stringify(profile));
      window.localStorage.setItem(geographyProgressKey, JSON.stringify(progress));
    },
    {
      studentProfileKey: profileKey,
      geographyProgressKey: progressKey,
      profile: {
        level: scenario.level,
        preparationStage: scenario.preparationStage,
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: scenario.level === "advanced" ? "two-plus-attempts" : "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      },
      progress: completedDayOneProgress(),
    },
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

async function verifyCase(page, scenario, checks) {
  await seedCase(page, scenario);
  await page.goto(`${baseUrl}/upsc/geography/track?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Start Day 2", { exact: false }).waitFor({ timeout: 15000 });

  const focused = await page.getByTestId("geography-track-focused-day").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    focusedDay: element.getAttribute("data-focused-day"),
    complete: element.getAttribute("data-day-complete"),
    nextTopicDay: element.getAttribute("data-next-topic-day"),
    href: element.getAttribute("data-next-action-href"),
    label: element.getAttribute("data-next-action-label"),
  }));
  const route = await page.getByTestId("geography-track-focused-route").evaluate((element) => ({
    level: element.getAttribute("data-learner-level"),
    focusedDay: element.getAttribute("data-focused-day"),
    complete: element.getAttribute("data-day-complete"),
    nextTopicDay: element.getAttribute("data-next-topic-day"),
    href: element.getAttribute("href"),
    dataHref: element.getAttribute("data-next-action-href"),
    label: element.getAttribute("data-next-action-label"),
  }));
  const recoveryRouteCount = await page.getByTestId("geography-track-recovery-route-detail").count();
  const advancedOpen = await page.getByTestId("geography-track-advanced-tools").evaluate((element) => Boolean(element.open));
  checks.push({ label: `${scenario.level}-track-closeout`, focused, route, recoveryRouteCount, advancedOpen });

  if (
    focused.level !== scenario.level ||
    route.level !== scenario.level ||
    focused.focusedDay !== "1" ||
    route.focusedDay !== "1" ||
    focused.complete !== "true" ||
    route.complete !== "true" ||
    focused.nextTopicDay !== "2" ||
    route.nextTopicDay !== "2" ||
    focused.href !== scenario.expectedHref ||
    route.href !== scenario.expectedHref ||
    route.dataHref !== scenario.expectedHref ||
    focused.label !== "Start Day 2" ||
    route.label !== "Start Day 2" ||
    recoveryRouteCount !== 0 ||
    advancedOpen
  ) {
    throw new Error(`${scenario.level} closeout mismatch: ${JSON.stringify({ focused, route, recoveryRouteCount, advancedOpen }, null, 2)}`);
  }

  await assertNoOverflow(page, `${scenario.level}-track-closeout-desktop`, checks);
  await page.getByTestId("geography-track-focused-route").click();
  await page.waitForURL(`**${scenario.expectedHref}`, { timeout: 45000 });
  await page.getByTestId(scenario.expectedLandingTestId).waitFor({ timeout: 15000 });
  if (scenario.expectedMode) {
    await page.getByTestId("talk-level-mode").getByText(scenario.expectedMode, { exact: false }).waitFor({ timeout: 15000 });
  }
  await assertNoOverflow(page, `${scenario.level}-next-topic-landing`, checks);
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

  for (const scenario of cases) {
    await verifyCase(page, scenario, checks);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await seedCase(page, cases[0]);
  await page.goto(`${baseUrl}/upsc/geography/track?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-track-focused-route").getByText("Start Day 2", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-track-closeout-mobile", checks);
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

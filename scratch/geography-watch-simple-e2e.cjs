const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-watch-simple-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-watch-simple-final.png");
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(({ progressStorageKey, profileStorageKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_watch_simple");
    window.localStorage.removeItem(progressStorageKey);
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
  }, { progressStorageKey: progressKey, profileStorageKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-start-recall-first").waitFor({ timeout: 15000 });
  const startRecallHref = await page.getByTestId("watch-start-recall-first").getAttribute("href");
  const watchCompleteVisibleBeforeRecall = await page.getByTestId("watch-complete-and-discuss").isVisible().catch(() => false);
  const checkpointsVisibleBeforeRecall = await page.getByTestId("watch-scene-1").isVisible().catch(() => false);
  checks.push({
    label: "watch-recall-first-gate",
    startRecallHref,
    watchCompleteVisibleBeforeRecall,
    checkpointsVisibleBeforeRecall,
  });
  if (startRecallHref !== "/upsc/geography/talk?day=1" || watchCompleteVisibleBeforeRecall || checkpointsVisibleBeforeRecall) {
    throw new Error(
      `Geography Watch should require Talk recall first: ${JSON.stringify({
        startRecallHref,
        watchCompleteVisibleBeforeRecall,
        checkpointsVisibleBeforeRecall,
      })}`
    );
  }

  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "1": {
          day: 1,
          reflection:
            "Earth as a system connects spheres, coordinates, scale and one UPSC trap, but I need repair class proof.",
          baselineKnowledge: "I know basic Earth system terms but need map proof.",
          talkScore: 42,
          talkBand: "Practice",
          talkUnlockStage: "retry",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-complete-and-discuss").waitFor({ timeout: 15000 });

  const checkpointsVisible = await page.getByTestId("watch-scene-1").isVisible();
  const optionalNoteVisible = await page.getByText("One doubt or one map clue", { exact: false }).isVisible();
  const currentActionText = ((await page.getByTestId("watch-current-action").textContent()) ?? "").trim();
  const pathStripText = ((await page.getByTestId("geography-watch-path-strip").textContent()) ?? "").trim();
  const oneActionRule = ((await page.getByTestId("watch-one-action-rule").textContent()) ?? "").trim();
  const learnerLevel = await page.getByTestId("geography-watch-simple-repair").getAttribute("data-learner-level");
  const flowState = await page.getByTestId("geography-watch-simple-repair").getAttribute("data-flow-state");
  const visibleMode = await page.getByTestId("geography-watch-simple-repair").getAttribute("data-visible-mode");
  const levelBadge = ((await page.getByTestId("geography-watch-level-badge").textContent()) ?? "").trim();
  const levelCopy = ((await page.getByTestId("geography-watch-level-copy").textContent()) ?? "").trim();
  const prematureWatchActions = await page.getByTestId("geography-watch-simple-repair").locator("button").count();
  const duplicateBaselineCount = await page.getByTestId("geography-baseline-check").count();
  const duplicateBaselineTextVisible = await page.getByText("Write what you already know.", { exact: true }).isVisible();
  checks.push({
    label: "watch-advanced-hidden-by-default",
    checkpointsVisible,
    optionalNoteVisible,
    currentActionText,
    pathStripText,
    oneActionRule,
    learnerLevel,
    flowState,
    visibleMode,
    levelBadge,
    levelCopy,
    prematureWatchActions,
    duplicateBaselineCount,
    duplicateBaselineTextVisible,
  });
  if (
    checkpointsVisible ||
    optionalNoteVisible ||
    !currentActionText.includes("Finish repair and discuss") ||
    !pathStripText.includes("Repair") ||
    !pathStripText.includes("Discussion") ||
    !pathStripText.includes("Fresh MCQ") ||
    !pathStripText.includes("Next topic") ||
    !oneActionRule.includes("Use the green button") ||
    learnerLevel !== "advanced" ||
    flowState !== "lesson-open" ||
    visibleMode !== "lesson-first-player" ||
    !levelBadge.includes("Attempt-gap repair") ||
    !levelCopy.includes("attempt trap") ||
    !levelCopy.includes("95%") ||
    prematureWatchActions !== 0 ||
    duplicateBaselineCount !== 0 ||
    duplicateBaselineTextVisible
  ) {
    throw new Error("Watch advanced checkpoints/details should be folded on first load.");
  }
  await assertNoOverflow(page, "watch-simple-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "watch-progress", progress });
  if (
    progress?.watched !== true ||
    progress?.watchHandoffReady !== true ||
    progress?.watchSceneCompletedIds?.length !== 5 ||
    !progress?.watchHandoffSummary?.includes("UPSC trap")
  ) {
    throw new Error(`Watch did not persist clean Talk handoff: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.evaluate(({ progressStorageKey, profileStorageKey }) => {
    const progress = JSON.parse(window.localStorage.getItem(progressStorageKey) || "{}");
    progress["1"] = {
      ...progress["1"],
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, { progressStorageKey: progressKey, profileStorageKey: profileKey });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-open-mcq-after-clearance").waitFor({ timeout: 15000 });
  const beginnerClearedHref = await page.getByTestId("watch-open-mcq-after-clearance").getAttribute("href");
  const beginnerClearedPlayerVisible = await page.getByTestId("watch-topic-player").isVisible().catch(() => false);
  checks.push({ label: "watch-cleared-beginner-sends-to-mcq", beginnerClearedHref, beginnerClearedPlayerVisible });
  if (beginnerClearedHref !== "/upsc/geography/mcq-readiness?day=1" || beginnerClearedPlayerVisible) {
    throw new Error("A Beginner with cleared recall should not reopen the lesson or discussion.");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || "{}");
    progress["2"] = {
      day: 2,
      reflection: "Universe basics are familiar, but I need class repair for scale, chronology and UPSC traps.",
      baselineKnowledge: "I know some universe facts.",
      talkScore: 44,
      talkBand: "Practice",
      talkUnlockStage: "retry",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(progress));
  }, progressKey);
  await page.goto(`${baseUrl}/upsc/geography/watch?day=2`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-complete-and-discuss").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-simple-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

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

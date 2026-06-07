const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-watch-30-day-simple-player-e2e-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seedBeginner(page) {
  await page.addInitScript(
    ({ studentProfileKey, geographyProgressKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_GEOGRAPHY_WATCH_30_DAY_SIMPLE_PLAYER");
      window.localStorage.setItem(
        studentProfileKey,
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
      window.localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey }
  );
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsRetiredBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsRetiredBranding) throw new Error(`${label} contains retired branding.`);
}

async function inspectWatchDay(page, day) {
  await page.goto(`${baseUrl}/upsc/geography/watch?day=${day}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-watch-simple-repair").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-complete-and-discuss").waitFor({ timeout: 15000 });

  return page.evaluate((selectedDay) => {
    const shell = document.querySelector('[data-testid="geography-watch-simple-repair"]');
    const player = document.querySelector('[data-testid="watch-topic-player"]');
    const primaryButton = document.querySelector('[data-testid="watch-complete-and-discuss"]');
    const pathStripNode = document.querySelector('[data-testid="geography-watch-path-strip"]');
    const pathStrip = pathStripNode?.textContent || "";
    const oneActionRule = document.querySelector('[data-testid="watch-one-action-rule"]')?.textContent || "";
    const dayNeighbor = document.querySelector('[data-testid="watch-day-neighbor-strip"]')?.textContent || "";
    const topicDuration = document.querySelector('[data-testid="watch-topic-duration"]')?.textContent || "";
    const currentAction = document.querySelector('[data-testid="watch-current-action"]')?.textContent || "";
    const checkpoints = document.querySelector('[data-testid="geography-watch-checkpoints"]');
    const details = document.querySelector('[data-testid="geography-watch-details"]');
    const playerBox = player?.getBoundingClientRect();
    const buttonBox = primaryButton?.getBoundingClientRect();
    const primaryActionButtons = Array.from(document.querySelectorAll('[data-testid="watch-complete-and-discuss"]')).filter((button) => {
      const box = button.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    const dataDuration = Number(player?.getAttribute("data-duration-minutes") || shell?.getAttribute("data-duration-minutes") || "0");
    const sceneCount = Number(player?.getAttribute("data-scene-count") || shell?.getAttribute("data-scene-count") || "0");
    return {
      day: selectedDay,
      learnerLevel: shell?.getAttribute("data-learner-level") || "",
      shellDay: shell?.getAttribute("data-day") || "",
      flowState: shell?.getAttribute("data-flow-state") || "",
      currentActionLabel: shell?.getAttribute("data-current-action-label") || "",
      currentActionHref: shell?.getAttribute("data-current-action-href") || "",
      playerTalkHref: player?.getAttribute("data-talk-href") || "",
      buttonNextHref: primaryButton?.getAttribute("data-next-action-href") || "",
      nextTopicDay: player?.getAttribute("data-next-topic-day") || "",
      mediaSource: player?.getAttribute("data-media-source") || "",
      visibleMode: player?.getAttribute("data-visible-mode") || "",
      dataDuration,
      sceneCount,
      topicDuration,
      pathStrip,
      pathStripOpen: Boolean(pathStripNode && pathStripNode.open),
      oneActionRule,
      dayNeighbor,
      currentAction,
      checkpointsOpen: Boolean(checkpoints && checkpoints.open),
      detailsOpen: Boolean(details && details.open),
      primaryActionButtonCount: primaryActionButtons.length,
      playerHeight: Math.round(playerBox?.height || 0),
      playerTop: Math.round(playerBox?.top || 0),
      buttonWidth: Math.round(buttonBox?.width || 0),
      buttonText: primaryButton?.textContent || "",
    };
  }, day);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await seedBeginner(page);

  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const dayResults = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (let day = 1; day <= 30; day += 1) {
    const result = await inspectWatchDay(page, day);
    dayResults.push(result);

    const expectedTalkHref = `/upsc/geography/talk?day=${day}`;
    const expectedNextDay = day < 30 ? String(day + 1) : "";
    const failures = [];
    if (result.learnerLevel !== "beginner") failures.push("learner level");
    if (result.shellDay !== String(day)) failures.push("shell day");
    if (result.flowState !== "lesson-open") failures.push("lesson-open flow");
    if (result.currentActionLabel !== "Finish lesson and discuss") failures.push("current action");
    if (result.currentActionHref !== "#watch-player") failures.push("current action href");
    if (result.visibleMode !== "single-action-player") failures.push("single action player mode");
    if (result.playerTalkHref !== expectedTalkHref) failures.push("player talk href");
    if (result.buttonNextHref !== expectedTalkHref) failures.push("button talk href");
    if (result.nextTopicDay !== expectedNextDay) failures.push("next topic day");
    if (result.dataDuration < 10 || result.dataDuration > 15) failures.push("10-15 minute duration");
    if (result.sceneCount < 5) failures.push("scene count");
    if (!result.topicDuration.includes(`${result.dataDuration} min topic`)) failures.push("duration copy");
    for (const word of ["Lesson", "Discussion", "Fresh MCQ", "Next topic"]) {
      if (!result.pathStrip.includes(word)) failures.push(`path ${word}`);
    }
    if (result.pathStripOpen) failures.push("folded path strip");
    if (!result.oneActionRule.includes("Use the green button")) failures.push("one action rule");
    if (!result.dayNeighbor.includes(`Day ${day}/30`)) failures.push("day neighbor");
    if (day < 30 && !result.dayNeighbor.includes(`Next opens after MCQ: Day ${day + 1}`)) failures.push("next day copy");
    if (day === 30 && !result.dayNeighbor.includes("Final day closeout")) failures.push("final day copy");
    if (!result.currentAction.includes("Finish lesson and discuss")) failures.push("current action copy");
    if (result.checkpointsOpen || result.detailsOpen) failures.push("folded details");
    if (result.primaryActionButtonCount !== 1) failures.push("one primary watch button");
    if (result.playerHeight < 580) failures.push("large player");
    if (!result.buttonText.includes("Finish lesson and discuss")) failures.push("button text");

    if (failures.length > 0) {
      throw new Error(`Watch Day ${day} failed simple player contract: ${JSON.stringify({ failures, result }, null, 2)}`);
    }
  }

  await assertNoOverflow(page, "watch-day-30-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDayOne = await inspectWatchDay(page, 1);
  checks.push({ label: "watch-day-1-mobile-contract", mobileDayOne });
  if (
    mobileDayOne.learnerLevel !== "beginner" ||
    mobileDayOne.flowState !== "lesson-open" ||
    mobileDayOne.dataDuration < 10 ||
    mobileDayOne.dataDuration > 15 ||
    !mobileDayOne.buttonText.includes("Finish lesson and discuss")
  ) {
    throw new Error(`Watch Day 1 mobile contract failed: ${JSON.stringify(mobileDayOne, null, 2)}`);
  }
  await assertNoOverflow(page, "watch-day-1-mobile", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  const dayOneProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "watch-day-1-handoff", dayOneProgress });
  if (
    dayOneProgress?.watched !== true ||
    dayOneProgress?.watchHandoffReady !== true ||
    dayOneProgress?.watchSceneCompletedIds?.length < 5 ||
    !dayOneProgress?.watchHandoffSummary?.includes("UPSC trap")
  ) {
    throw new Error(`Watch Day 1 handoff did not persist correctly: ${JSON.stringify(dayOneProgress, null, 2)}`);
  }

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    dayCount: dayResults.length,
    dayResults,
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
  console.error(error);
  process.exit(1);
});

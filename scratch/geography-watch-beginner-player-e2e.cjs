const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-watch-beginner-player-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-watch-beginner-player-final.png");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seedBeginner(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_GEOGRAPHY_WATCH_BEGINNER_PLAYER");
      localStorage.setItem(
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
        }),
      );
      localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey },
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

  await seedBeginner(page);
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByTestId("day1-map-thinking-visual").waitFor({ timeout: 15000 });

  const desktopState = await page.evaluate(() => {
    const player = document.querySelector('[data-testid="watch-topic-player"]')?.getBoundingClientRect();
    const visual = document.querySelector('[data-testid="day1-map-thinking-visual"]')?.getBoundingClientRect();
    const pathStrip = document.querySelector('[data-testid="geography-watch-path-strip"]')?.textContent || "";
    const oneActionRule = document.querySelector('[data-testid="watch-one-action-rule"]')?.textContent || "";
    const currentAction = document.querySelector('[data-testid="watch-current-action"]')?.textContent || "";
    const dayNeighbor = document.querySelector('[data-testid="watch-day-neighbor-strip"]')?.textContent || "";
    const levelShell = document.querySelector('[data-testid="geography-watch-simple-repair"]');
    const levelBadge = document.querySelector('[data-testid="geography-watch-level-badge"]')?.textContent || "";
    const levelCopy = document.querySelector('[data-testid="geography-watch-level-copy"]')?.textContent || "";
    const checkpoints = document.querySelector('[data-testid="geography-watch-checkpoints"]');
    const details = document.querySelector('[data-testid="geography-watch-details"]');
    return {
      playerHeight: Math.round(player?.height || 0),
      playerTop: Math.round(player?.top || 0),
      visualHeight: Math.round(visual?.height || 0),
      visualTop: Math.round(visual?.top || 0),
      pathStrip,
      oneActionRule,
      currentAction,
      dayNeighbor,
      learnerLevel: levelShell?.getAttribute("data-learner-level") || "",
      flowState: levelShell?.getAttribute("data-flow-state") || "",
      visibleMode: levelShell?.getAttribute("data-visible-mode") || "",
      levelBadge,
      levelCopy,
      checkpointsOpen: Boolean(checkpoints && checkpoints.open),
      detailsOpen: Boolean(details && details.open),
    };
  });
  checks.push({ label: "beginner-day1-player-desktop", desktopState });
  if (
    desktopState.playerHeight < 620 ||
    desktopState.visualHeight < 390 ||
    desktopState.playerTop > 320 ||
    !desktopState.pathStrip.includes("Lesson") ||
    !desktopState.pathStrip.includes("Discussion") ||
    !desktopState.pathStrip.includes("Fresh MCQ") ||
    !desktopState.pathStrip.includes("Next topic") ||
    !desktopState.oneActionRule.includes("Use the green button") ||
    !desktopState.currentAction.includes("Finish lesson and discuss") ||
    desktopState.learnerLevel !== "beginner" ||
    desktopState.flowState !== "lesson-open" ||
    desktopState.visibleMode !== "lesson-first-player" ||
    !desktopState.levelBadge.includes("Beginner lesson") ||
    !desktopState.levelCopy.includes("10-15 minute lesson") ||
    !desktopState.levelCopy.includes("fresh MCQ") ||
    !desktopState.dayNeighbor.includes("Day 1/30") ||
    !desktopState.dayNeighbor.includes("Next opens after MCQ: Day 2") ||
    desktopState.checkpointsOpen ||
    desktopState.detailsOpen
  ) {
    throw new Error(`Beginner Watch player is not the primary simple lesson surface: ${JSON.stringify(desktopState, null, 2)}`);
  }
  await assertNoOverflow(page, "beginner-watch-desktop", checks);

  await page.getByTestId("day1-map-thinking-stage-1-trap").click();
  const activeStage = await page.getByTestId("day1-map-thinking-visual").getAttribute("data-active-stage");
  checks.push({ label: "day1-visual-stage-click", activeStage });
  if (activeStage !== "1-trap") throw new Error(`Day 1 visual stage did not change: ${activeStage}`);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "beginner-watch-handoff-progress", progress });
  if (
    progress?.watched !== true ||
    progress?.watchHandoffReady !== true ||
    progress?.watchSceneCompletedIds?.length !== 5 ||
    !progress?.watchHandoffSummary?.includes("UPSC trap")
  ) {
    throw new Error(`Watch did not save clean beginner handoff: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await seedBeginner(page);
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("day1-map-thinking-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-watch-mobile", checks);
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
  console.error(error);
  process.exit(1);
});

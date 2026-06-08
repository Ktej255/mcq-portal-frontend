const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "environment-watch-talk-depth-e2e-evidence.json");
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

async function getDayProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
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
  await page.addInitScript(
    ({ profileStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_environment_watch_recall_gate");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
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
    },
    { profileStorageKey: profileKey }
  );

  await page.goto(`${baseUrl}/upsc/environment/watch?day=5`, { waitUntil: "networkidle" });
  await page.evaluate((key) => window.localStorage.removeItem(key), progressKey);
  await page.reload({ waitUntil: "networkidle" });

  await page.getByTestId("subject-pre-lesson-recall-gate").waitFor({ timeout: 15000 });
  const initialGate = await page.getByTestId("subject-pre-lesson-recall-gate").evaluate((node) => ({
    subject: node.getAttribute("data-subject"),
    day: node.getAttribute("data-day"),
    required: node.getAttribute("data-required"),
    status: node.getAttribute("data-status"),
    canOpenLesson: node.getAttribute("data-can-open-lesson"),
    currentAction: node.getAttribute("data-current-action"),
    playerPresent: Boolean(document.querySelector('[data-testid="subject-watch-topic-player"]')),
  }));
  if (
    initialGate.subject !== "environment" ||
    initialGate.day !== "5" ||
    initialGate.required !== "true" ||
    initialGate.status !== "baseline-missing" ||
    initialGate.canOpenLesson !== "false" ||
    initialGate.currentAction !== "save-baseline" ||
    initialGate.playerPresent
  ) {
    throw new Error(`Pre-lesson recall gate should block the class before baseline: ${JSON.stringify(initialGate)}`);
  }
  await page
    .getByTestId("subject-baseline-draft")
    .fill("Protected areas connect biodiversity, habitat, legal categories, maps, species threats and conservation governance.");
  await page.getByTestId("subject-save-baseline").click();
  await page.getByTestId("subject-watch-topic-player").waitFor({ timeout: 15000 });

  await page.getByTestId("environment-watch-teacher-pack").waitFor({ state: "attached", timeout: 15000 });
  const teacherPackText = await page.getByTestId("environment-watch-teacher-pack").evaluate((node) => node.textContent || "");
  if (
    !teacherPackText.includes("Map-linked biodiversity") ||
    !teacherPackText.includes("Kaziranga floodplain") ||
    !teacherPackText.includes("Cause chain")
  ) {
    throw new Error(`Environment watch teacher pack is incomplete: ${teacherPackText}`);
  }
  await assertNoOverflow(page, "environment-watch-depth-desktop", checks);

  await page.locator('[data-testid="subject-watch-scene-engine"] > summary').click();
  await page.getByTestId("subject-watch-scene-complete").waitFor({ timeout: 15000 });
  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("subject-watch-scene-complete").click();
  }

  const watchedProgress = await getDayProgress(page, 5);
  if (
    !watchedProgress?.watched ||
    !watchedProgress?.baselineKnowledge ||
    !watchedProgress?.baselineSavedAt ||
    watchedProgress.watchSceneCompletedIds?.length !== 5 ||
    !watchedProgress.watchSceneCompletedIds.includes("5-environment-handoff")
  ) {
    throw new Error(`Environment watch scenes did not persist correctly: ${JSON.stringify(watchedProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ state: "attached", timeout: 15000 });
  const talkTeacherPackText = await page.getByTestId("environment-talk-teacher-pack").evaluate((node) => node.textContent || "");
  if (!talkTeacherPackText.includes("Environment oral rubric") || !talkTeacherPackText.includes("Map-linked biodiversity")) {
    throw new Error(`Environment talk teacher pack is incomplete: ${talkTeacherPackText}`);
  }

  await page.getByTestId("talk-answer-draft").fill(
    "Protected Areas must be explained through location, habitat, species, legal category, threat and institution. Compare national parks, wildlife sanctuaries, biosphere reserves and conservation reserves because protected-area rules are not identical. In a Kaziranga floodplain example, floods renew grassland habitat but also create corridor and human-wildlife conflict questions. A Great Indian Bustard grassland case proves biodiversity is not forest-only protection. The mechanism is habitat fragmentation causing species pressure, then conservation response through corridors, IUCN status, protected area rules, sanctuary or biosphere categories and monitoring. The UPSC trap is assuming all protected areas have identical restrictions or that hotspot means only high species richness without endemism and threat."
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("subject-maic-discussion-turns").waitFor({ state: "attached", timeout: 15000 });
  const maicDiscussionText = await page.getByTestId("subject-maic-discussion-turns").evaluate((node) => node.textContent || "");
  if (
    !maicDiscussionText.includes("AI Teacher") ||
    !maicDiscussionText.includes("Peer Challenger") ||
    !maicDiscussionText.includes("UPSC Examiner") ||
    !maicDiscussionText.includes("Score gate")
  ) {
    throw new Error(`MAIC discussion depth is incomplete: ${maicDiscussionText}`);
  }
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });

  const talkProgress = await getDayProgress(page, 5);
  if ((talkProgress?.talkScore ?? 0) < 70 || !talkProgress?.talkTranscript?.some((turn) => turn.message.includes("Environment chain"))) {
    throw new Error(`Environment Talk depth did not persist expected MAIC state: ${JSON.stringify(talkProgress)}`);
  }

  const routeHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (!routeHref?.includes("/upsc/environment/lab?")) {
    throw new Error(`Expected Talk to route to Environment lab before MCQ readiness, got ${routeHref}`);
  }

  await assertNoOverflow(page, "environment-talk-depth-desktop", checks);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ state: "attached", timeout: 15000 });
  await assertNoOverflow(page, "environment-talk-depth-mobile", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    initialGate,
    teacherPackText,
    talkTeacherPackText,
    maicDiscussionText,
    watchedProgress,
    talkScore: talkProgress?.talkScore,
    routeHref,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "environment-watch-talk-depth-final.png"), fullPage: true });
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

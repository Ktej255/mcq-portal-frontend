const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "verify-level-aware-guided-session-evidence.json");
const screenshotPath = path.join(__dirname, "verify-level-aware-guided-session-mobile.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function reset(page, profile = null, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, nextProfile, nextProgress }) => {
      const token = "MOCK_TOKEN_level_aware_guided_session";
      window.MOCK_TOKEN = token;
      localStorage.setItem("MOCK_TOKEN", token);
      localStorage.removeItem(profileStorageKey);
      localStorage.removeItem(progressStorageKey);
      if (nextProfile) localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      if (nextProgress) localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, nextProfile: profile, nextProgress: progress }
  );
}

async function setProgress(page, progress) {
  await page.evaluate(
    ({ progressStorageKey, nextProgress }) => {
      localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
    },
    { progressStorageKey: progressKey, nextProgress: progress }
  );
}

function profile(level, preparationStage) {
  return {
    level,
    preparationStage,
    studyWindow: "90",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: level === "advanced" ? "two-plus-attempts" : "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
  };
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

  await reset(page);
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  for (const text of [
    "I am starting my UPSC preparation now",
    "I completed coaching and want a self-study path",
    "I attempted UPSC Prelims two or more times and need a recovery path",
  ]) {
    await page.getByRole("button", { name: text }).waitFor({ timeout: 15000 });
  }
  const optionalPreferencesOpen = await page
    .getByTestId("upsc-intake-optional-preferences")
    .evaluate((node) => node instanceof HTMLDetailsElement && node.open);
  checks.push({ label: "simple-intake", optionalPreferencesOpen });
  if (optionalPreferencesOpen) throw new Error("Optional intake preferences should start folded.");

  await reset(page, {
    ...profile("advanced", "multiple-attempts"),
    preparationStage: "not-started",
    attemptHistory: "two-plus-attempts",
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const normalizedLegacyProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), profileKey);
  const normalizedLegacyStartHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const normalizedLegacyProof = (await page.getByTestId("upsc-classification-proof").innerText()).trim();
  checks.push({ label: "legacy-profile-normalization", normalizedLegacyProfile, normalizedLegacyStartHref, normalizedLegacyProof });
  if (
    normalizedLegacyProfile?.level !== "beginner" ||
    normalizedLegacyProfile?.preparationStage !== "not-started" ||
    normalizedLegacyProfile?.attemptHistory !== "no-attempt" ||
    normalizedLegacyStartHref !== "/upsc/geography/watch?day=1" ||
    !normalizedLegacyProof.toLowerCase().includes("identified as beginner: lesson -> talk 95% -> mcq -> next topic")
  ) {
    throw new Error(
      `Legacy profile should normalize to one coherent classification: ${JSON.stringify({
        normalizedLegacyProfile,
        normalizedLegacyStartHref,
      })}`
    );
  }

  await reset(page);
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "I am starting my UPSC preparation now" }).click();
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const beginnerStartHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const beginnerProof = (await page.getByTestId("upsc-classification-proof").innerText()).trim();
  checks.push({ label: "beginner-dashboard-entry", beginnerStartHref, beginnerProof });
  if (
    beginnerStartHref !== "/upsc/geography/watch?day=1" ||
    !beginnerProof.toLowerCase().includes("identified as beginner: lesson -> talk 95% -> mcq -> next topic")
  ) {
    throw new Error(`Beginner should start with lesson, got ${beginnerStartHref}`);
  }

  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const beginnerCommandHref = await page.getByTestId("command-next-action").getByRole("link").getAttribute("href");
  const beginnerStepLabels = await page
    .getByTestId("geography-command-funnel-details")
    .locator("summary")
    .click()
    .then(() => page.getByTestId("geography-day-funnel").locator("h3").allTextContents());
  checks.push({ label: "beginner-command-entry", beginnerCommandHref, beginnerStepLabels });
  if (beginnerCommandHref !== "/upsc/geography/watch?day=1" || beginnerStepLabels.join("|") !== "Learn|Discuss|MCQ") {
    throw new Error(`Beginner command path mismatch: ${JSON.stringify({ beginnerCommandHref, beginnerStepLabels })}`);
  }
  await page.getByTestId("geography-command-advanced-controls").locator("summary").click();
  await page.getByTestId("geography-baseline-intake").waitFor({ timeout: 15000 });
  const commandBaselineTextareaCount = await page.getByTestId("geography-command-baseline-draft").count();
  const commandBaselineSaveCount = await page.getByTestId("geography-command-save-baseline").count();
  const commandDiagnosisHref = await page.getByTestId("geography-command-diagnosis-action").getAttribute("href");
  checks.push({
    label: "command-page-removes-extra-baseline-input",
    commandBaselineTextareaCount,
    commandBaselineSaveCount,
    commandDiagnosisHref,
  });
  if (
    commandBaselineTextareaCount !== 0 ||
    commandBaselineSaveCount !== 0 ||
    commandDiagnosisHref !== "/upsc/geography/watch?day=1"
  ) {
    throw new Error(
      `Command page should route, not collect another baseline: ${JSON.stringify({
        commandBaselineTextareaCount,
        commandBaselineSaveCount,
        commandDiagnosisHref,
      })}`
    );
  }

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  const beginnerDuration = await page.getByTestId("watch-topic-duration").innerText();
  const beginnerPlayerHeight = await page.getByTestId("watch-topic-player").evaluate((node) => node.getBoundingClientRect().height);
  const recallGateVisibleForBeginner = await page.getByTestId("watch-start-recall-first").isVisible().catch(() => false);
  const prematureWatchActions = await page.getByTestId("geography-watch-simple-repair").locator("button").count();
  const playerCompletionActions = await page.locator('[data-testid="watch-complete-and-discuss"][data-action-location="player"]').count();
  const redundantRouteSummaryCount = await page.locator('[data-testid="watch-route-summary"]').count();
  checks.push({
    label: "beginner-large-topic-player",
    beginnerDuration,
    beginnerPlayerHeight,
    recallGateVisibleForBeginner,
    prematureWatchActions,
    playerCompletionActions,
    redundantRouteSummaryCount,
  });
  if (
    !/12 min topic/i.test(beginnerDuration) ||
    beginnerPlayerHeight < 600 ||
    recallGateVisibleForBeginner ||
    prematureWatchActions !== 0 ||
    playerCompletionActions !== 1 ||
    redundantRouteSummaryCount !== 0
  ) {
    throw new Error(
      `Beginner lesson surface mismatch: ${JSON.stringify({
        beginnerDuration,
        beginnerPlayerHeight,
        recallGateVisibleForBeginner,
        prematureWatchActions,
        playerCompletionActions,
        redundantRouteSummaryCount,
      })}`
    );
  }
  await page.getByRole("button", { name: "Finish lesson and discuss" }).first().click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByText("What did you learn?", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-speak-answer").waitFor({ timeout: 15000 });
  await page.getByText("95%", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-talk-desktop", checks);

  await reset(page, profile("beginner", "not-started"));
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-flow-gate").waitFor({ timeout: 15000 });
  const beginnerDirectTalkHref = await page.getByTestId("talk-flow-gate-action").getAttribute("href");
  checks.push({ label: "beginner-direct-talk-requires-lesson", beginnerDirectTalkHref });
  if (beginnerDirectTalkHref !== "/upsc/geography/watch?day=1") {
    throw new Error(`Beginner direct Talk bypass stayed open: ${beginnerDirectTalkHref}`);
  }

  await reset(page, profile("intermediate", "coaching-complete"));
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const intermediateStartHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const intermediateProof = (await page.getByTestId("upsc-classification-proof").innerText()).trim();
  checks.push({ label: "intermediate-dashboard-entry", intermediateStartHref, intermediateProof });
  if (
    intermediateStartHref !== "/upsc/geography/talk?day=1" ||
    !intermediateProof.toLowerCase().includes("identified as intermediate: diagnosis -> repair only if needed -> mcq")
  ) {
    throw new Error(`Intermediate should start with diagnosis, got ${intermediateStartHref}`);
  }
  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-command-funnel-details").locator("summary").click();
  const prematureRepairLinks = await page
    .getByTestId("geography-day-funnel")
    .locator('a[href="/upsc/geography/watch?day=1"]')
    .count();
  checks.push({ label: "intermediate-command-repair-locked-before-diagnosis", prematureRepairLinks });
  if (prematureRepairLinks !== 0) throw new Error("Intermediate repair card opened before diagnosis.");

  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-start-recall-first").waitFor({ timeout: 15000 });
  const repairPlayerVisibleBeforeDiagnosis = await page.getByTestId("watch-topic-player").isVisible().catch(() => false);
  checks.push({ label: "intermediate-repair-gate", repairPlayerVisibleBeforeDiagnosis });
  if (repairPlayerVisibleBeforeDiagnosis) throw new Error("Intermediate repair lesson should wait for diagnosis.");

  await setProgress(page, {
    1: {
      day: 1,
      talkScore: 42,
      talkBand: "Practice",
      reflection: "I need a short repair lesson for the diagnosed UPSC concept gaps.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const diagnosedRepairHref = await page.getByTestId("command-next-action").getByRole("link").getAttribute("href");
  checks.push({ label: "intermediate-command-opens-diagnosed-repair", diagnosedRepairHref });
  if (diagnosedRepairHref !== "/upsc/geography/watch?day=1") {
    throw new Error(`Intermediate diagnosed gap should open repair lesson, got ${diagnosedRepairHref}`);
  }
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-flow-gate").waitFor({ timeout: 15000 });
  const intermediateRetryTalkHref = await page.getByTestId("talk-flow-gate-action").getAttribute("href");
  checks.push({ label: "intermediate-repeat-talk-requires-repair-proof", intermediateRetryTalkHref });
  if (intermediateRetryTalkHref !== "/upsc/geography/watch?day=1") {
    throw new Error(`Intermediate retry should return to repair lesson, got ${intermediateRetryTalkHref}`);
  }

  await setProgress(page, {
    1: {
      day: 1,
      watched: true,
      talkScore: 42,
      talkBand: "Practice",
      reflection: "I completed the repair and will explain the corrected concept.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  checks.push({ label: "intermediate-talk-reopens-after-repair-proof", url: page.url() });

  await reset(page, profile("advanced", "multiple-attempts"), {
    1: {
      day: 1,
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      reflection: "Strong diagnostic answer with map proof and UPSC trap.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const advancedStartHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const advancedProof = (await page.getByTestId("upsc-classification-proof").innerText()).trim();
  checks.push({ label: "advanced-cleared-dashboard-entry", advancedStartHref, advancedProof });
  if (
    advancedStartHref !== "/upsc/geography/mcq-readiness?day=1" ||
    !advancedProof.toLowerCase().includes("identified as advanced: attempt-gap diagnosis -> precision repair -> mcq")
  ) {
    throw new Error(`Advanced cleared path should move directly to MCQ, got ${advancedStartHref}`);
  }
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("Practice is being prepared", { exact: true }).waitFor({ timeout: 15000 });
  const lockedCount = await page.getByText("MCQ locked", { exact: true }).count();
  const optionalVisualCount = await page.getByText("Optional visual", { exact: true }).count();
  checks.push({ label: "advanced-mcq-without-lab", lockedCount, optionalVisualCount });
  if (lockedCount || optionalVisualCount !== 1) {
    throw new Error("Visual Lab should remain available as folded optional support after a 95% Talk score.");
  }
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-open-mcq-after-clearance").waitFor({ timeout: 15000 });
  const advancedClearedWatchHref = await page.getByTestId("watch-open-mcq-after-clearance").getAttribute("href");
  const advancedRepairPlayerVisible = await page.getByTestId("watch-topic-player").isVisible().catch(() => false);
  checks.push({ label: "advanced-cleared-watch-sends-to-mcq", advancedClearedWatchHref, advancedRepairPlayerVisible });
  if (advancedClearedWatchHref !== "/upsc/geography/mcq-readiness?day=1" || advancedRepairPlayerVisible) {
    throw new Error("Advanced learner with cleared recall should not reopen unnecessary repair content.");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await reset(page, profile("beginner", "not-started"));
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "beginner-watch-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
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

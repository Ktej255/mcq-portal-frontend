const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "subject-level-aware-entry-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-level-aware-entry-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function profile(level) {
  return {
    level,
    preparationStage:
      level === "beginner" ? "not-started" : level === "advanced" ? "multiple-attempts" : "coaching-complete",
    studyWindow: "90",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: level === "advanced" ? "two-plus-attempts" : level === "intermediate" ? "one-attempt" : "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
  };
}

async function seed(page, studentProfile, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, nextProfile, nextProgress }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_level_aware_entry");
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      if (nextProgress) {
        localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
      } else {
        localStorage.removeItem(progressStorageKey);
      }
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, nextProfile: studentProfile, nextProgress: progress }
  );
}

async function metrics(page, label, checks) {
  const item = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics: item });
  if (item.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(item)}`);
  if (item.containsOldBranding) throw new Error(`${label} contains retired branding.`);
}

async function inspectCommand(page, level, expectedHref, expectedInstruction, checks) {
  await seed(page, profile(level));
  await page.goto(`${baseUrl}/upsc/environment?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-standard-shell").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-student-instruction").getByText(expectedInstruction, { exact: false }).waitFor({
    timeout: 15000,
  });
  const href = await page.getByTestId("subject-command-action-route").getAttribute("href");
  const profileSummary = (await page.getByTestId("subject-command-profile-summary").innerText()).trim();
  await metrics(page, `environment-${level}-command`, checks);
  if (href !== expectedHref) {
    throw new Error(`${level} command route mismatch: ${JSON.stringify({ href, expectedHref })}`);
  }
  const expectedLabel = level[0].toUpperCase() + level.slice(1);
  const normalizedProfileSummary = profileSummary.toLowerCase();
  if (!normalizedProfileSummary.includes(expectedLabel.toLowerCase()) || !normalizedProfileSummary.includes("90 min")) {
    throw new Error(`${level} profile summary mismatch: ${profileSummary}`);
  }
  return { level, href, profileSummary };
}

async function inspectTrack(page, level, expectedHref, expectedLabel, checks) {
  await seed(page, profile(level));
  await page.goto(`${baseUrl}/upsc/environment/track?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText(expectedLabel, { exact: false }).waitFor({ timeout: 15000 });
  const href = await page.getByTestId("track-focused-route").getAttribute("href");
  await metrics(page, `environment-${level}-track`, checks);
  if (href !== expectedHref) {
    throw new Error(`${level} track route mismatch: ${JSON.stringify({ href, expectedHref })}`);
  }
  return { level, href };
}

async function inspectDirectTalkGate(page, level, expectedHref, checks) {
  await seed(page, profile(level));
  await page.goto(`${baseUrl}/upsc/environment/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-talk-flow-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-talk-flow-gate").getByText("Finish the lesson first", { exact: false }).waitFor({
    timeout: 15000,
  });
  const href = await page.getByTestId("subject-talk-flow-gate-action").getAttribute("href");
  await metrics(page, `environment-${level}-direct-talk-gated`, checks);
  if (href !== expectedHref) {
    throw new Error(`${level} direct Talk gate mismatch: ${JSON.stringify({ href, expectedHref })}`);
  }
  return { level, directTalk: "gated", href };
}

async function inspectDirectTalkOpen(page, level, checks, progress = null) {
  await seed(page, profile(level), progress);
  await page.goto(`${baseUrl}/upsc/environment/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 });
  const gateCount = await page.getByTestId("subject-talk-flow-gate").count();
  await metrics(page, `environment-${level}-direct-talk-open`, checks);
  if (gateCount > 0) {
    throw new Error(`${level} direct Talk should be open, but gate is visible.`);
  }
  return { level, directTalk: "open", url: page.url() };
}

async function inspectDirectWatchGate(page, level, expectedHref, checks) {
  await seed(page, profile(level));
  await page.goto(`${baseUrl}/upsc/environment/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-watch-flow-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-watch-flow-gate").getByText("Explain before watching", { exact: false }).waitFor({
    timeout: 15000,
  });
  const href = await page.getByTestId("subject-watch-flow-gate-action").getAttribute("href");
  await metrics(page, `environment-${level}-direct-watch-gated`, checks);
  if (href !== expectedHref) {
    throw new Error(`${level} direct Watch gate mismatch: ${JSON.stringify({ href, expectedHref })}`);
  }
  return { level, directWatch: "gated", href };
}

async function inspectDirectWatchOpen(page, level, checks, progress = null) {
  await seed(page, profile(level), progress);
  await page.goto(`${baseUrl}/upsc/environment/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-watch-simple-repair").waitFor({ timeout: 15000 });
  const gateCount = await page.getByTestId("subject-watch-flow-gate").count();
  const action = page.getByTestId("watch-complete-and-discuss");
  await action.waitFor({ timeout: 15000 });
  const pathHeadline = (await page.getByTestId("subject-watch-path-headline").innerText()).trim();
  const simpleLoopText = (await page.getByTestId("subject-watch-simple-loop").innerText()).trim();
  const playerFlowText = (await page.getByTestId("subject-watch-player-flow").innerText()).trim();
  const playerNextStepText = (await page.getByTestId("subject-watch-player-next-step").innerText()).trim();
  const shellDuration = await page.getByTestId("subject-watch-simple-repair").getAttribute("data-duration-minutes");
  const playerDuration = await page.getByTestId("subject-watch-topic-player").getAttribute("data-duration-minutes");
  const visibleDuration = (await page.getByTestId("subject-watch-visible-duration").innerText()).trim();
  const playerHeight = await page.getByTestId("subject-watch-topic-player").evaluate((node) => node.getBoundingClientRect().height);
  const baselineTextareaCount = await page.getByTestId("subject-baseline-draft").count();
  const baselineSaveCount = await page.getByTestId("subject-save-baseline").count();
  const baselineReadonlyCount = await page.getByTestId("subject-baseline-readonly").count();
  await metrics(page, `environment-${level}-direct-watch-open`, checks);
  if (gateCount > 0) {
    throw new Error(`${level} direct Watch should be open, but gate is visible.`);
  }
  if (baselineTextareaCount !== 0 || baselineSaveCount !== 0 || baselineReadonlyCount !== 1) {
    throw new Error(
      `${level} Watch should keep recall read-only: ${JSON.stringify({
        baselineTextareaCount,
        baselineSaveCount,
        baselineReadonlyCount,
      })}`
    );
  }
  if (level === "beginner" && !/Watch one focused topic/i.test(pathHeadline)) {
    throw new Error(`Beginner Watch should read as guided lesson, got: ${pathHeadline}`);
  }
  if (level !== "beginner" && progress && !/Repair the exact gap/i.test(pathHeadline)) {
    throw new Error(`${level} Watch with diagnosis should read as repair, got: ${pathHeadline}`);
  }
  if (!/Topic/i.test(simpleLoopText) || !/AI discussion/i.test(simpleLoopText) || !/95% recall/i.test(simpleLoopText) || !/Fresh MCQ/i.test(simpleLoopText)) {
    throw new Error(`Watch simple loop is missing the beginner flow labels: ${simpleLoopText}`);
  }
  if (!/10-15 min lesson/i.test(playerFlowText) || !/AI discussion/i.test(playerFlowText) || !/95% recall/i.test(playerFlowText)) {
    throw new Error(`Watch player flow is missing class-to-discussion labels: ${playerFlowText}`);
  }
  if (shellDuration !== "12" || playerDuration !== "12" || visibleDuration !== "12 min focused topic") {
    throw new Error(
      `${level} Watch should expose a 10-15 minute focused topic contract: ${JSON.stringify({
        shellDuration,
        playerDuration,
        visibleDuration,
      })}`
    );
  }
  if (!/Next opens automatically/i.test(playerNextStepText) || !/AI teacher discussion/i.test(playerNextStepText)) {
    throw new Error(`Watch player next step should be automatic and simple: ${playerNextStepText}`);
  }
  if (playerHeight < 520) {
    throw new Error(`Watch player should be the primary class surface, height=${playerHeight}`);
  }
  return { level, directWatch: "open", actionText: (await action.innerText()).trim(), pathHeadline, playerHeight };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const inspected = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  inspected.push(
    await inspectCommand(
      page,
      "beginner",
      "/upsc/environment/watch?day=1",
      "Start with the short lesson",
      checks
    )
  );
  inspected.push(await inspectTrack(page, "beginner", "/upsc/environment/watch?day=1", "Start lesson", checks));
  inspected.push(await inspectDirectWatchOpen(page, "beginner", checks));
  inspected.push(await inspectDirectWatchGate(page, "intermediate", "/upsc/environment/talk?day=1", checks));
  inspected.push(
    await inspectDirectWatchOpen(page, "intermediate", checks, {
      "1": {
        reflection: "I know the topic partly, but I am missing the conservation chain and UPSC trap.",
        talkScore: 42,
        talkBand: "Revisit",
        talkUnlockStage: "revisit",
        talkNextRoute: "/upsc/environment/watch?day=1",
        talkNextActionLabel: "Open class",
      },
    })
  );
  inspected.push(await inspectDirectTalkGate(page, "beginner", "/upsc/environment/watch?day=1", checks));
  inspected.push(await inspectDirectTalkOpen(page, "intermediate", checks));
  inspected.push(
    await inspectDirectTalkOpen(page, "beginner", checks, {
      "1": {
        watched: true,
        watchState: "Watched",
        watchCompletedAt: new Date().toISOString(),
        watchSceneCompletedIds: ["intro", "mechanism", "example", "trap", "handoff"],
      },
    })
  );
  inspected.push(
    await inspectCommand(
      page,
      "intermediate",
      "/upsc/environment/talk?day=1",
      "The AI checks what coaching already covered",
      checks
    )
  );
  inspected.push(
    await inspectCommand(
      page,
      "advanced",
      "/upsc/environment/talk?day=1",
      "attempt-level gap",
      checks
    )
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await inspectCommand(page, "beginner", "/upsc/environment/watch?day=1", "Start with the short lesson", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    inspected,
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

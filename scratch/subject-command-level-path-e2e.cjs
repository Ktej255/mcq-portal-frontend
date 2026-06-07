const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "subject-command-level-path-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-command-level-path-mobile.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function profile(level, preparationStage, studyWindow) {
  return {
    level,
    preparationStage,
    studyWindow,
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: level === "advanced" ? "two-plus-attempts" : "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
  };
}

async function seed(page, studentProfile, progress = {}) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, progressStorageKey, nextProfile, nextProgress }) => {
      const token = "MOCK_TOKEN_MASTER_subject_command_level_path";
      window.MOCK_TOKEN = token;
      localStorage.setItem("MOCK_TOKEN", token);
      localStorage.setItem(studentProfileKey, JSON.stringify(nextProfile));
      localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
    },
    { studentProfileKey: profileKey, progressStorageKey: progressKey, nextProfile: studentProfile, nextProgress: progress }
  );
}

async function snapshot(page, label, checks) {
  await page.goto(`${baseUrl}/upsc/environment?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-simple-student-flow").waitFor({ timeout: 15000 }).catch(async (error) => {
    const diagnostics = await page.evaluate(() => ({
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 1200),
      hasProfileRequired: Boolean(document.querySelector('[data-testid="upsc-profile-required"]')),
      hasLogin: /authorized entry|connect with google|profile required|complete setup/i.test(document.body.innerText),
    }));
    throw new Error(`${label} did not reach subject command surface: ${JSON.stringify(diagnostics, null, 2)}\n${error.message}`);
  });
  await page.getByTestId("subject-generated-daily-path").waitFor({ timeout: 15000 });
  const actionHref = await page.getByTestId("subject-command-action-route").getAttribute("href");
  const instruction = await page.getByTestId("subject-command-student-instruction").innerText();
  const levelText = await page.getByTestId("subject-level-identified").innerText();
  const normalizedLevelText = levelText.toLowerCase();
  const pathSummary = await page.getByTestId("subject-generated-daily-path").innerText();
  const pathLinkCount = await page.getByTestId("subject-generated-daily-path").locator("a").count();
  const topics = await page.getByTestId("subject-generated-daily-topic").evaluateAll((nodes) =>
    nodes.map((node) => ({
      state: node.getAttribute("data-topic-state"),
      gate: node.getAttribute("data-topic-gate"),
      text: node.textContent,
    }))
  );
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  const result = { label, actionHref, instruction, levelText, normalizedLevelText, pathSummary, pathLinkCount, topics, metrics };
  checks.push(result);
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
  if (pathLinkCount !== 0) throw new Error(`${label} generated path should be read-only, got ${pathLinkCount} links.`);
  return result;
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

  await seed(page, profile("beginner", "not-started", "120"));
  const beginner = await snapshot(page, "beginner-environment-path", checks);
  if (
    beginner.actionHref !== "/upsc/environment/watch?day=5" ||
    !beginner.normalizedLevelText.includes("beginner path identified") ||
    !beginner.instruction.includes("short lesson") ||
    !beginner.pathSummary.includes("2 topics") ||
    beginner.topics.map((topic) => topic.state).join("|") !== "current|queued" ||
    beginner.topics.map((topic) => topic.gate).join("|") !== "watch|watch" ||
    !beginner.topics[0].text.includes("Day 5") ||
    !beginner.topics[1].text.includes("Day 6") ||
    !beginner.topics[0].text.includes("10-15 min topic") ||
    !beginner.topics[0].text.includes("Start lesson") ||
    !beginner.topics[0].text.includes("Next: Open lesson")
  ) {
    throw new Error(`Beginner subject path mismatch: ${JSON.stringify(beginner, null, 2)}`);
  }

  await seed(page, profile("beginner", "not-started", "120"), {
    "5": {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
      updatedAt: new Date().toISOString(),
    },
  });
  const beginnerWatched = await snapshot(page, "beginner-watched-talk-gate", checks);
  if (
    beginnerWatched.actionHref !== "/upsc/environment/talk?day=5" ||
    beginnerWatched.topics[0].gate !== "talk" ||
    !beginnerWatched.topics[0].text.includes("Talk pending") ||
    !beginnerWatched.topics[0].text.includes("Next: Open AI teacher")
  ) {
    throw new Error(`Beginner watched path mismatch: ${JSON.stringify(beginnerWatched, null, 2)}`);
  }

  await seed(page, profile("beginner", "not-started", "120"), {
    "5": {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      updatedAt: new Date().toISOString(),
    },
  });
  const beginnerCommandRecall = await snapshot(page, "beginner-command-recall-mcq-gate", checks);
  if (
    beginnerCommandRecall.actionHref !== "/upsc/environment/mcq-readiness?day=5" ||
    beginnerCommandRecall.topics[0].gate !== "mcq" ||
    !beginnerCommandRecall.topics[0].text.includes("Practice not attached") ||
    !beginnerCommandRecall.topics[0].text.includes("Next: Open practice")
  ) {
    throw new Error(`Beginner command recall path mismatch: ${JSON.stringify(beginnerCommandRecall, null, 2)}`);
  }

  await seed(page, profile("intermediate", "coaching-complete", "180"));
  const intermediate = await snapshot(page, "intermediate-environment-path", checks);
  if (
    intermediate.actionHref !== "/upsc/environment/talk?day=5" ||
    !intermediate.normalizedLevelText.includes("intermediate path identified") ||
    !intermediate.instruction.includes("coaching already covered") ||
    !intermediate.pathSummary.includes("3 topics") ||
    intermediate.topics.map((topic) => topic.state).join("|") !== "current|queued|queued" ||
    intermediate.topics.map((topic) => topic.gate).join("|") !== "talk|talk|talk" ||
    !intermediate.topics[2].text.includes("Day 7")
  ) {
    throw new Error(`Intermediate subject path mismatch: ${JSON.stringify(intermediate, null, 2)}`);
  }

  await seed(page, profile("advanced", "multiple-attempts", "90"));
  const advanced = await snapshot(page, "advanced-environment-path", checks);
  if (
    advanced.actionHref !== "/upsc/environment/talk?day=5" ||
    !advanced.normalizedLevelText.includes("advanced path identified") ||
    !advanced.instruction.includes("attempt-level gap") ||
    !advanced.pathSummary.includes("1 topic") ||
    advanced.topics[0].gate !== "talk"
  ) {
    throw new Error(`Advanced subject path mismatch: ${JSON.stringify(advanced, null, 2)}`);
  }

  await seed(page, profile("advanced", "multiple-attempts", "90"), {
    "5": {
      day: 5,
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      reflection: "I can explain the concept, map link, exception, and repeated-attempt trap.",
      updatedAt: new Date().toISOString(),
    },
  });
  const advancedCommandRecall = await snapshot(page, "advanced-command-recall-skips-unneeded-watch", checks);
  if (
    advancedCommandRecall.actionHref !== "/upsc/environment/mcq-readiness?day=5" ||
    advancedCommandRecall.topics[0].gate !== "mcq" ||
    !advancedCommandRecall.topics[0].text.includes("Practice not attached") ||
    !advancedCommandRecall.topics[0].text.includes("Next: Open practice")
  ) {
    throw new Error(`Advanced command recall should move to MCQ without mandatory Watch: ${JSON.stringify(advancedCommandRecall, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-generated-daily-path").waitFor({ timeout: 15000 });
  const mobileMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label: "mobile", metrics: mobileMetrics });
  if (mobileMetrics.hasHorizontalOverflow) throw new Error(`Mobile overflow: ${JSON.stringify(mobileMetrics)}`);
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

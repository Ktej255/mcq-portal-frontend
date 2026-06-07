const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "subject-track-next-topic-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-track-next-topic-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function profile(level) {
  return {
    level,
    preparationStage:
      level === "beginner" ? "not-started" : level === "advanced" ? "multiple-attempts" : "coaching-complete",
    studyWindow: "120",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: level === "advanced" ? "two-plus-attempts" : level === "intermediate" ? "one-attempt" : "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
  };
}

function commandReadyProgress() {
  return {
    "5": {
      day: 5,
      watched: true,
      watchState: "Watched",
      watchMinutes: 90,
      watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
      confidence: "Command",
      reflection: "Protected areas are linked through category, map, species, threat, and institution.",
      revisitQueued: false,
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      labCompleted: true,
      labMode: "biodiversity-map",
      labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
      labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
      mcqAttempted: true,
      mcqCompleted: true,
      mcqAnsweredCount: 3,
      mcqCorrectCount: 3,
      mcqTotal: 3,
      mcqScorePercent: 100,
      mcqLastBatchCode: "ENV-D05",
      mcqOutcome: "Command",
      mcqRecommendedRoute: "/upsc/environment/track?day=5",
      mcqReviewSummary: "3/3 correct (100%). Command gate cleared for ENV-D05.",
      updatedAt: new Date().toISOString(),
    },
  };
}

async function seed(page, level) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, mcqStorageKey, nextProfile, nextProgress }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_track_next_topic");
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
      localStorage.setItem(
        mcqStorageKey,
        JSON.stringify({
          "ENV-D05": {
            planned: 3,
            drafted: 3,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey,
      mcqStorageKey: mcqKey,
      nextProfile: profile(level),
      nextProgress: commandReadyProgress(),
    }
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

async function inspectHandoff(page, level, expectedHref, expectedAction, checks) {
  await seed(page, level);
  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-next-topic-handoff").getByText("Day 6", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-next-topic-handoff").getByText("Biodiversity", { exact: false }).waitFor({ timeout: 15000 });

  const primaryHref = await page.getByTestId("track-focused-route").getAttribute("href");
  const primaryText = (await page.getByTestId("track-focused-route").innerText()).trim();
  const detailHref = await page.getByTestId("track-focused-route-detail").getAttribute("href");
  const gapHref = await page.getByTestId("subject-track-learning-gap").getAttribute("href");

  if (primaryHref !== expectedHref) {
    throw new Error(`${level} primary handoff mismatch: ${JSON.stringify({ primaryHref, expectedHref })}`);
  }
  if (detailHref !== expectedHref) {
    throw new Error(`${level} detail handoff mismatch: ${JSON.stringify({ detailHref, expectedHref })}`);
  }
  if (gapHref !== expectedHref) {
    throw new Error(`${level} gap signal handoff mismatch: ${JSON.stringify({ gapHref, expectedHref })}`);
  }
  if (!primaryText.includes(expectedAction)) {
    throw new Error(`${level} handoff action mismatch: ${JSON.stringify({ primaryText, expectedAction })}`);
  }

  await assertNoOverflow(page, `environment-${level}-command-next-topic`, checks);
  return { level, primaryHref, detailHref, gapHref, primaryText };
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

  inspected.push(await inspectHandoff(page, "beginner", "/upsc/environment/watch?day=6", "Start Day 6 lesson", checks));
  inspected.push(await inspectHandoff(page, "intermediate", "/upsc/environment/talk?day=6", "Start Day 6 diagnosis", checks));
  inspected.push(await inspectHandoff(page, "advanced", "/upsc/environment/talk?day=6", "Start Day 6 diagnosis", checks));

  await page.setViewportSize({ width: 390, height: 844 });
  await inspectHandoff(page, "beginner", "/upsc/environment/watch?day=6", "Start Day 6 lesson", checks);
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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

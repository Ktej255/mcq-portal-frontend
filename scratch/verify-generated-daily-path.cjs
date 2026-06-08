const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const questionBankAttemptKey = "sarit-upsc-question-bank-attempts-v1";
const evidencePath = path.join(__dirname, "verify-generated-daily-path-evidence.json");
const screenshotPath = path.join(__dirname, "verify-generated-daily-path-mobile.png");

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

async function seed(page, studentProfile, progress = null, questionBankAttempts = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, attemptStorageKey, nextProfile, nextProgress, nextAttempts }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_generated_daily_path");
      localStorage.setItem(studentProfileKey, JSON.stringify(nextProfile));
      localStorage.removeItem(geographyProgressKey);
      localStorage.removeItem(attemptStorageKey);
      if (nextProgress) localStorage.setItem(geographyProgressKey, JSON.stringify(nextProgress));
      if (nextAttempts) localStorage.setItem(attemptStorageKey, JSON.stringify(nextAttempts));
    },
    {
      studentProfileKey: profileKey,
      geographyProgressKey: progressKey,
      attemptStorageKey: questionBankAttemptKey,
      nextProfile: studentProfile,
      nextProgress: progress,
      nextAttempts: questionBankAttempts,
    }
  );
}

async function dashboardSnapshot(page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const summary = await page.getByTestId("upsc-generated-daily-path-summary").innerText();
  const startHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const yesterdayProof = await page.getByTestId("upsc-yesterday-proof").evaluate((node) => ({
    status: node.getAttribute("data-origin-status"),
    sourceDay: node.getAttribute("data-source-day"),
    targetDay: node.getAttribute("data-target-day"),
    route: node.getAttribute("data-origin-route"),
    text: node.textContent || "",
  }));
  const dashboardProof = await page.getByTestId("upsc-simple-dashboard").evaluate((node) => ({
    questionBankAttempts: node.getAttribute("data-question-bank-attempts"),
    text: node.textContent || "",
  }));
  await page.getByTestId("upsc-planning-drawer").locator("summary").first().click();
  const pathLinkCount = await page.getByTestId("upsc-generated-daily-path").locator("a").count();
  const pathTopics = await page.getByTestId("upsc-generated-daily-topic").evaluateAll((topics) =>
    topics.map((topic) => ({
      state: topic.getAttribute("data-topic-state"),
      text: topic.textContent,
    }))
  );
  return { summary, startHref, yesterdayProof, dashboardProof, pathLinkCount, pathTopics };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seed(page, profile("beginner", "not-started", "120"));
  const beginnerDay1 = await dashboardSnapshot(page);
  const beginnerDay1Summary = beginnerDay1.summary.toLowerCase();
  if (
    !beginnerDay1Summary.includes("day 1 of 30") ||
    !beginnerDay1Summary.includes("geography day 1") ||
    beginnerDay1.startHref !== "/upsc/daily-command#daily-me-time-checkin" ||
    beginnerDay1.yesterdayProof.status !== "Subject start" ||
    beginnerDay1.yesterdayProof.sourceDay !== "0" ||
    beginnerDay1.yesterdayProof.targetDay !== "1" ||
    !beginnerDay1.yesterdayProof.text.includes("Day 1 starts here") ||
    beginnerDay1.pathLinkCount !== 0 ||
    beginnerDay1.pathTopics.map((item) => item.state).join("|") !== "current|queued" ||
    !beginnerDay1.pathTopics[0]?.text.includes("Day 1") ||
    !beginnerDay1.pathTopics[1]?.text.includes("Day 2")
  ) {
    throw new Error(`Beginner Day 1 generated path mismatch: ${JSON.stringify(beginnerDay1)}`);
  }

  await seed(page, profile("beginner", "not-started", "120"), {
    1: {
      day: 1,
      mcqAttempted: true,
      mcqCompleted: true,
      mcqOutcome: "Command",
      confidence: "Command",
      updatedAt: new Date().toISOString(),
    },
  });
  const beginnerDay2 = await dashboardSnapshot(page);
  const beginnerDay2Summary = beginnerDay2.summary.toLowerCase();
  if (
    !beginnerDay2Summary.includes("day 2 of 30") ||
    beginnerDay2.startHref !== "/upsc/daily-command#daily-me-time-checkin" ||
    beginnerDay2.yesterdayProof.status !== "Auto advance" ||
    beginnerDay2.yesterdayProof.sourceDay !== "1" ||
    beginnerDay2.yesterdayProof.targetDay !== "2" ||
    !beginnerDay2.yesterdayProof.text.includes("Day 1 cleared") ||
    beginnerDay2.pathLinkCount !== 0 ||
    beginnerDay2.pathTopics.map((item) => item.state).join("|") !== "current|queued" ||
    !beginnerDay2.pathTopics[0]?.text.includes("Day 2") ||
    !beginnerDay2.pathTopics[1]?.text.includes("Day 3")
  ) {
    throw new Error(`Beginner Day 2 generated path mismatch: ${JSON.stringify(beginnerDay2)}`);
  }

  await seed(
    page,
    profile("beginner", "not-started", "120"),
    {
      1: {
        day: 1,
        watched: true,
        reflection: "I can explain location, coordinates, and basic map logic.",
        talkScore: 96,
        talkBand: "Command",
        confidence: "Command",
        updatedAt: new Date().toISOString(),
      },
    },
    {
      "geo-d01-qb-correct": {
        questionId: "geo-d01-qb-correct",
        subjectSlug: "geography",
        linkedDay: 1,
        topic: "Geography Foundation",
        difficulty: "MEDIUM",
        source: "REFERENCE_ADVANCED",
        selectedOption: "A",
        correctOption: "A",
        isCorrect: true,
        solvedAt: new Date().toISOString(),
      },
    }
  );
  const beginnerDay2FromQuestionBank = await dashboardSnapshot(page);
  if (
    !beginnerDay2FromQuestionBank.summary.toLowerCase().includes("day 2 of 30") ||
    beginnerDay2FromQuestionBank.startHref !== "/upsc/daily-command#daily-me-time-checkin" ||
    beginnerDay2FromQuestionBank.yesterdayProof.status !== "Auto advance" ||
    beginnerDay2FromQuestionBank.yesterdayProof.sourceDay !== "1" ||
    beginnerDay2FromQuestionBank.yesterdayProof.targetDay !== "2" ||
    !beginnerDay2FromQuestionBank.yesterdayProof.text.includes("Day 1 cleared") ||
    !beginnerDay2FromQuestionBank.yesterdayProof.text.includes("Question Bank 1 solved") ||
    beginnerDay2FromQuestionBank.dashboardProof.questionBankAttempts !== "0" ||
    beginnerDay2FromQuestionBank.pathTopics.map((item) => item.state).join("|") !== "current|queued" ||
    !beginnerDay2FromQuestionBank.pathTopics[0]?.text.includes("Day 2")
  ) {
    throw new Error(`Question Bank generated path mismatch: ${JSON.stringify(beginnerDay2FromQuestionBank)}`);
  }

  await seed(page, profile("intermediate", "coaching-complete", "180"), {
    1: {
      day: 1,
      mcqAttempted: true,
      mcqCompleted: true,
      mcqOutcome: "Command",
      confidence: "Command",
      updatedAt: new Date().toISOString(),
    },
  });
  const intermediateDay2 = await dashboardSnapshot(page);
  const intermediateDay2Summary = intermediateDay2.summary.toLowerCase();
  if (
    !intermediateDay2Summary.includes("day 2 of 30") ||
    !intermediateDay2Summary.includes("geography day 2") ||
    intermediateDay2.startHref !== "/upsc/daily-command#daily-me-time-checkin" ||
    intermediateDay2.yesterdayProof.status !== "Auto advance" ||
    intermediateDay2.yesterdayProof.sourceDay !== "1" ||
    intermediateDay2.yesterdayProof.targetDay !== "2" ||
    !intermediateDay2.yesterdayProof.text.includes("Day 1 cleared") ||
    intermediateDay2.pathLinkCount !== 0 ||
    intermediateDay2.pathTopics.map((item) => item.state).join("|") !== "current|queued|queued" ||
    !intermediateDay2.pathTopics[0]?.text.includes("Day 2") ||
    !intermediateDay2.pathTopics[1]?.text.includes("Day 3") ||
    !intermediateDay2.pathTopics[2]?.text.includes("Day 4")
  ) {
    throw new Error(`Intermediate generated path mismatch: ${JSON.stringify(intermediateDay2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  if (metrics.hasHorizontalOverflow) throw new Error(`Generated path mobile overflow: ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const evidence = {
    baseUrl,
    checks: { beginnerDay1, beginnerDay2, beginnerDay2FromQuestionBank, intermediateDay2, metrics },
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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

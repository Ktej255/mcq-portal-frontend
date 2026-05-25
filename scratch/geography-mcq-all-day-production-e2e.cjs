const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-all-day-production-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-mcq-all-day-production-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const labSlugByTitle = {
  "Earth Layers Lab": "earth-layers",
  "Monsoon Simulator": "monsoon",
  "India Interactive Map": "india-map",
  "Disaster Link": "disaster-link",
  "Environment Bridge": "environment-bridge",
  "MCQ Engine": "mcq-engine",
};

const labProofStages = ["concept", "map", "example", "trap", "answer"];

function parseGeographySessions() {
  const planPath = path.join(__dirname, "..", "src", "lib", "upsc", "plan.ts");
  const source = fs.readFileSync(planPath, "utf8");
  const sessionsBlock = source.split("export const geographySessions: GeographySession[] = [")[1]?.split("];")[0];
  if (!sessionsBlock) throw new Error("Could not find geographySessions in plan.ts");

  const sessions = [];
  const sessionRegex =
    /{\s*day:\s*(\d+),[\s\S]*?week:\s*(\d+),[\s\S]*?title:\s*"([^"]+)",[\s\S]*?chapter:\s*"([^"]+)",[\s\S]*?anchor:\s*"([^"]+)",[\s\S]*?test:\s*"([^"]+)",[\s\S]*?lab:\s*"([^"]+)"/g;
  let match;
  while ((match = sessionRegex.exec(sessionsBlock))) {
    sessions.push({
      day: Number(match[1]),
      week: Number(match[2]),
      title: match[3],
      chapter: match[4],
      anchor: match[5],
      test: match[6],
      lab: match[7],
      labSlug: labSlugByTitle[match[7]],
      batchCode: `GEO-D${String(match[1]).padStart(2, "0")}`,
    });
  }

  if (sessions.length !== 30) throw new Error(`Expected 30 Geography sessions, found ${sessions.length}`);
  const missingLabSlug = sessions.find((session) => !session.labSlug);
  if (missingLabSlug) throw new Error(`Missing lab slug for ${missingLabSlug.day}: ${missingLabSlug.lab}`);
  return sessions.sort((a, b) => a.day - b.day);
}

function buildQuestion(session, index, correctOption) {
  return {
    test_id: 12000 + session.day * 10 + index,
    topic_id: 12000 + session.day * 10 + index,
    text_en: `Geography Day ${session.day} fresh command question ${index}: test ${session.title} through map logic, mechanism, exception, and UPSC trap.`,
    options_en: {
      A: `${session.title} must be explained through location, process, map proof and exception logic`,
      B: `${session.title} can be solved by memorising one isolated fact without map or mechanism`,
      C: `${session.title} has no relation with Geography command, atlas work or UPSC statement traps`,
      D: `${session.title} should ignore the anchor ${session.anchor} during practice`,
    },
    correct_option: correctOption,
    explanation_en: `The correct answer links ${session.title} with ${session.anchor}, map proof, mechanism, and the daily trap: ${session.test}`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: session.batchCode,
      subject: "Geography",
      day: String(session.day),
      chapter: session.chapter,
      topic: session.title,
      map_tag: session.lab,
    },
  };
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
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsOldBranding) throw new Error(`${label} still shows old branding.`);
}

async function seedAllDays(page, sessions) {
  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((seed) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_mcq_all_day");
    window.localStorage.setItem(seed.progressKey, JSON.stringify(seed.progress));
    window.localStorage.setItem(seed.mcqKey, JSON.stringify(seed.mcqStates));
    window.localStorage.setItem(seed.localDraftKey, JSON.stringify(seed.drafts));
  }, buildSeedPayload(sessions));
}

function buildSeedPayload(sessions) {
  const progress = {};
  const mcqStates = {};
  const questions = [];

  for (const session of sessions) {
    progress[String(session.day)] = {
      day: session.day,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: [
        `${session.day}-briefing`,
        `${session.day}-mechanism`,
        `${session.day}-map`,
        `${session.day}-trap`,
        `${session.day}-recap`,
      ],
      confidence: "Command",
      mentorMode: "Cause-effect",
      reflection: `${session.title} has been explained with concept, mechanism, map proof and UPSC trap.`,
      talkScore: 92,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "MCQ route conditionally unlocked: complete Visual Lab proof first if it is still pending.",
      activePromptLabel: "MCQ Practice",
      labCompleted: true,
      labMode: session.labSlug,
      labProofCompletedIds: labProofStages.map((stage) => `${session.day}-${session.labSlug}-${stage}`),
      labEvidenceStatus: "mcq-ready",
      labEvidenceAnchor: `${session.title} / ${session.lab}`,
      labNextRoute: `/upsc/geography/mcq-readiness?day=${session.day}`,
      labNextActionLabel: "Open MCQ readiness",
    };
    mcqStates[session.batchCode] = {
      planned: 2,
      drafted: 2,
      difficulty: "MEDIUM",
      status: "READY",
      updatedAt: new Date().toISOString(),
    };
    questions.push(buildQuestion(session, 1, "A"));
    questions.push(buildQuestion(session, 2, "B"));
  }

  return {
    progressKey,
    mcqKey,
    localDraftKey,
    progress,
    mcqStates,
    drafts: [
      {
        id: "local-geography-all-day-production",
        createdAt: new Date().toISOString(),
        importMode: "UPSC_MCQ_COMMAND",
        questions,
      },
    ],
  };
}

async function runPositiveAllDayProof(page, sessions, checks, findings) {
  for (const session of sessions) {
    await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=${session.day}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
    await page.getByTestId("geography-mcq-day-test-command").getByText(session.test, { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByText(session.batchCode, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByTestId("mcq-local-question-preview").getByText(`Geography Day ${session.day}`, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await assertNoOverflow(page, `mcq-ready-day-${session.day}`, checks);

    await page.getByTestId("mcq-start-local-practice").click();
    await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByTestId("mcq-practice-option-A").click();
    await page.getByRole("button", { name: /Next question/i }).click();
    await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByTestId("mcq-practice-option-B").click();
    await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({
      timeout: 15000,
    });
    await page.getByTestId("mcq-practice-outcome-route").getByText("Review track", { exact: false }).waitFor({
      timeout: 15000,
    });
    await assertNoOverflow(page, `mcq-command-day-${session.day}`, checks);

    const progress = await page.evaluate(
      ({ key, day }) => JSON.parse(window.localStorage.getItem(key) || "{}")[String(day)],
      { key: progressKey, day: session.day }
    );
    if (
      progress?.mcqReadinessStatus !== "command" ||
      progress?.mcqOutcome !== "Command" ||
      progress?.mcqNextRoute !== `/upsc/geography/track?day=${session.day}` ||
      progress?.mcqScorePercent !== 100 ||
      progress?.mcqCorrectCount !== 2
    ) {
      throw new Error(`Day ${session.day} MCQ command state failed: ${JSON.stringify(progress, null, 2)}`);
    }

    findings.push({
      day: session.day,
      title: session.title,
      batchCode: session.batchCode,
      status: progress.mcqReadinessStatus,
      score: progress.mcqScorePercent,
      nextRoute: progress.mcqNextRoute,
    });
  }
}

async function runWeakContentGate(page, session, checks) {
  const seed = buildSeedPayload([session]);
  seed.drafts[0].questions = [
    {
      ...buildQuestion(session, 1, "A"),
      text_en: "Too short",
      options_en: { A: "Only A" },
      explanation_en: "",
      quality_notes: { batch_code: session.batchCode },
    },
    buildQuestion(session, 2, "B"),
  ];

  await page.evaluate((payload) => {
    window.localStorage.setItem(payload.progressKey, JSON.stringify(payload.progress));
    window.localStorage.setItem(payload.mcqKey, JSON.stringify(payload.mcqStates));
    window.localStorage.setItem(payload.localDraftKey, JSON.stringify(payload.drafts));
  }, seed);
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=${session.day}`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-preflight-status").getByText("Quality review", { exact: false }).waitFor({
    timeout: 15000,
  });
  await page.getByTestId("mcq-quality-review").getByText("Q1: stem", { exact: false }).waitFor({
    timeout: 15000,
  });
  const disabled = await page.getByTestId("mcq-start-local-practice").isDisabled();
  if (!disabled) throw new Error("Weak MCQ content should not enable local practice.");
  await assertNoOverflow(page, `mcq-weak-quality-gate-day-${session.day}`, checks);
}

async function run() {
  const sessions = parseGeographySessions();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const findings = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_mcq_all_day");
  });
  await seedAllDays(page, sessions);

  await runPositiveAllDayProof(page, sessions, checks, findings);
  await runWeakContentGate(page, sessions[0], checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    sessionCount: sessions.length,
    allDayCommandChecks: findings.length,
    weakContentGateChecked: true,
    findings,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

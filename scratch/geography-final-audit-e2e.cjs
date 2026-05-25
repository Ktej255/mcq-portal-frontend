const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-final-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-final-audit-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
  );
}

function buildMcqQuestion(batchCode, index, correctOption) {
  return {
    test_id: 9600 + index,
    topic_id: 9600 + index,
    text_en: `Final Geography audit question ${index}: choose the strongest map-linked resources and agriculture explanation.`,
    options_en: {
      A: "Location, relief, rainfall, irrigation and market access together shape crop and resource patterns",
      B: "Every mineral belt automatically creates the same crop pattern",
      C: "Agriculture is unrelated to soils, climate and irrigation",
      D: "Resource location has no connection with transport or industries",
    },
    correct_option: correctOption,
    explanation_en:
      "The correct answer connects location, map proof, relief or climate mechanism, and the UPSC trap of single-factor explanation.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: batchCode,
      subject: "Geography",
      day: "13",
      chapter: "India Map Command",
    },
  };
}

async function completeVisualLab(page, checks) {
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("india-layer-wildlife-sanctuaries").click();
  await page.getByTestId("india-atlas-point-wayanad-wls").click();
  await assertNoOverflow(page, "main-lab-initial", checks);

  const stages = [
    "1. Concept lock",
    "2. Map mechanism",
    "3. India example",
    "4. UPSC trap",
    "5. Answer hook",
  ];

  for (let index = 0; index < stages.length; index += 1) {
    await page.getByTestId("geography-lab-proof-stages").getByText(stages[index], { exact: false }).click();
    await page.getByTestId("geography-lab-use-proof-suggestion").click();
    await page.getByTestId("geography-lab-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["13"];
        return (day?.labProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-lab-complete", checks);
}

async function seedFreshMcqs(page) {
  const questions = [buildMcqQuestion("GEO-D13", 1, "A"), buildMcqQuestion("GEO-D13", 2, "B")];
  await page.evaluate(
    ({ localMcqKey, localDraftStorageKey, seededQuestions }) => {
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D13": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localDraftStorageKey,
        JSON.stringify([
          {
            id: "local-geography-final-audit",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ])
      );
    },
    { localMcqKey: mcqKey, localDraftStorageKey: localDraftKey, seededQuestions: questions }
  );
}

async function completeMcqPractice(page, checks) {
  await seedFreshMcqs(page);
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=13`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Start local practice", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-mcq-command", checks);
}

async function completeMainSuccessPath(page, checks) {
  await page.goto(`${baseUrl}/upsc/geography/watch?day=13`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(
    ({ progressStorageKey, localMcqKey, localDraftStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_final_audit");
      window.localStorage.removeItem(progressStorageKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localDraftStorageKey);
    },
    { progressStorageKey: progressKey, localMcqKey: mcqKey, localDraftStorageKey: localDraftKey }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("watch-demo-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-scene-engine").getByText("Scene playback", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-watch-initial", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["13"];
        return (day?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }
  await page.getByTestId("watch-route-gate").getByText("AI teacher unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=13", { timeout: 15000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-talk-from-watch", checks);

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Resources and agriculture cluster through location advantages, rainfall, irrigation, soil, relief, transport and market access.",
      "Minerals concentrate in belts because geology and relief create deposits, while agriculture changes with soil, climate, irrigation and technology.",
      "The India map proof includes mineral belts, crop belts, western and eastern coasts, plateau regions, irrigation zones and agro-climatic regions.",
      "The mechanism is not one-factor; rainfall, soil, relief, water, labour, market and policy combine to create regional specialization.",
      "UPSC can trap by saying one factor alone explains every crop or mineral industry, so exceptions and regional examples are essential.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-stage-peer-challenge").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-challenge-response").fill(
    [
      "The map proof is the key.",
      "A crop belt must be explained through rainfall, soil, irrigation and markets; a mineral belt must be explained through geology, transport and industry.",
      "For example plateau mineral belts and irrigated crop regions are different map patterns.",
      "The trap is to overgeneralize one variable like rainfall or mineral availability without checking region, relief and infrastructure.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-stage-examiner-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-next-handoff").getByText("Open visual lab", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-talk-complete", checks);

  const talkProgress = await getProgress(page, 13);
  if (!talkProgress?.watched || (talkProgress?.talkScore ?? 0) < 70 || talkProgress?.revisitQueued !== false) {
    throw new Error(`Main path Talk did not clear: ${JSON.stringify(talkProgress, null, 2)}`);
  }

  await completeVisualLab(page, checks);
  await completeMcqPractice(page, checks);

  const mainProgress = await getProgress(page, 13);
  if (
    mainProgress?.labCompleted !== true ||
    mainProgress?.labEvidenceStatus !== "mcq-ready" ||
    mainProgress?.mcqReadinessStatus !== "command" ||
    mainProgress?.mcqOutcome !== "Command" ||
    mainProgress?.mcqScorePercent !== 100 ||
    mainProgress?.mcqNextRoute !== "/upsc/geography/track?day=13"
  ) {
    throw new Error(`Main Geography path did not finish in command state: ${JSON.stringify(mainProgress, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-focused-evidence-ledger").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-focused-evidence-ledger").getByText("100% ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-evidence-mcq-outcome").getByText("2/2 correct", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "main-track-100-ready", checks);

  return mainProgress;
}

async function completeRevisitBranch(page, checks) {
  await page.goto(`${baseUrl}/upsc/geography/talk?day=10`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    const current = JSON.parse(window.localStorage.getItem(key) || "{}");
    current["10"] = {
      day: 10,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["10-briefing", "10-mechanism", "10-map", "10-trap", "10-recap"],
      confidence: "Working",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByPlaceholder("Write the explanation in your own words.").fill("I do not know Indian Monsoon yet.");
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("MCQ locked: revisit first", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "branch-talk-revisit-queued", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/revisit?day=10", { timeout: 15000 });
  await page.getByTestId("revisit-recovery-ledger").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-recovery-status").getByText("Recovery pending", { exact: false }).waitFor({ timeout: 15000 });

  const recoveryLines = [
    "Recall proof: Indian Monsoon requires ITCZ, jet streams, onset, break, retreat and rainfall variability.",
    "Explain proof: unequal heating shifts pressure, winds and rainfall through Arabian Sea and Bay branches.",
    "Map proof: Western Ghats, Himalaya, rain shadow and Bay branch must be placed on the India map.",
    "Trap proof: monsoon is not uniform, not only rainfall, and not explained by one pressure factor alone.",
    "Retest proof: I can now explain monsoon mechanism with map logic and one UPSC exception.",
  ];

  for (let index = 0; index < recoveryLines.length; index += 1) {
    await page.getByTestId("revisit-recovery-note").fill(recoveryLines[index]);
    await page.getByTestId("revisit-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["10"];
        return (day?.recoveryProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("revisit-recovery-status").getByText("Talk ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=10", { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "branch-talk-after-revisit", checks);

  const branchProgress = await getProgress(page, 10);
  if (
    branchProgress?.revisitQueued !== false ||
    branchProgress?.recoveryStatus !== "talk-ready" ||
    branchProgress?.recoveryNextRoute !== "/upsc/geography/talk?day=10" ||
    branchProgress?.talkBand !== undefined
  ) {
    throw new Error(`Revisit branch did not reset Talk gate correctly: ${JSON.stringify(branchProgress, null, 2)}`);
  }

  return branchProgress;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  await page.addInitScript(() => {
    window.MOCK_TOKEN = "MOCK_TOKEN_geography_final_audit";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_final_audit");
  });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const mainProgress = await completeMainSuccessPath(page, checks);
  const branchProgress = await completeRevisitBranch(page, checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-focused-evidence-ledger").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "final-audit-mobile-track", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    mainProgress,
    branchProgress,
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

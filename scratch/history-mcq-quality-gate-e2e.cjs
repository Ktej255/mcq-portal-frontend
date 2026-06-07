const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-history-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "history-mcq-quality-gate-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index, overrides = {}) {
  const quality_notes = {
    batch_code: "HIS-D04",
    subject: "History",
    day: "4",
    week: "1",
    chapter: "Modern History",
    topic: "Revolt of 1857",
    test_title: "History Day 4: Revolt of 1857",
    map_or_case_tag: overrides.map_or_case_tag ?? "1857 centre-leader-cause map",
    pyq_linked: "No",
  };

  return {
    test_id: 9700 + index,
    topic_id: 700 + index,
    text_en:
      overrides.text_en ??
      `Consider the following statements about Revolt of 1857 chronology, centres, leaders, causes, and consequence ${index}. Which statement is correct?`,
    options_en: {
      A: "The revolt had uneven regional spread but changed Company rule into Crown rule",
      B: "The revolt was uniform across all regions and had no political consequence",
      C: "The cartridge issue was the only background cause everywhere",
      D: "Jhansi, Kanpur, Lucknow, and Delhi had no leader-centre relationship",
    },
    correct_option: "A",
    explanation_en:
      overrides.explanation_en ??
      "The correct option links chronology, source-map proof, centre, leader, background cause, immediate trigger, British response, and consequence because 1857 was regionally uneven but historically decisive. The distractors fail by treating every centre as uniform, mixing cause with trigger, and ignoring the Company-to-Crown transition.",
    difficulty: "MEDIUM",
    source: "FRESH_HISTORY_AUTHORING",
    status: "DRAFT",
    quality_notes,
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
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function seed(page, questions, status = "READY") {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, questions: localQuestions, status: localStatus }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "4": {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchMinutes: 95,
            watchSceneCompletedIds: ["4-history-frame", "4-history-causation-chain", "4-history-evidence-anchor", "4-history-trap", "4-history-handoff"],
            confidence: "Command",
            reflection: "Revolt of 1857 is ready through chronology, source-map proof, centre, leader, cause, response, and consequence.",
            revisitQueued: false,
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            talkClassroomStage: "examiner-verdict",
            labCompleted: true,
            labMode: "modern-timeline",
            labProofCompletedIds: ["cause", "centre", "leader", "response", "trap"],
            labProofSummary: "Modern timeline proof saved for cause-centre-consequence.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "HIS-D04": {
            planned: 3,
            drafted: localQuestions.length,
            difficulty: "MEDIUM",
            status: localStatus,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localLocalDraftKey,
        JSON.stringify([
          {
            id: `history-quality-${Date.now()}`,
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: localQuestions,
          },
        ])
      );
    },
    { progressKey, mcqKey, localDraftKey, questions, status }
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

  await page.goto(`${baseUrl}/upsc/history/mcq-readiness?day=4`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey }) => {
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localLocalDraftKey);
    },
    { progressKey, mcqKey, localDraftKey }
  );

  await seed(
    page,
    [
      makeQuestion(1, { text_en: "Revolt basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(2, { text_en: "Another revolt basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(3, { text_en: "Third revolt basic question", explanation_en: "Short.", map_or_case_tag: "" }),
    ],
    "DRAFT"
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("history-mcq-quality-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Student MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-route").getByText("Fix MCQ quality", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("history-mcq-quality-explanation-depth").getByText("History proof explanation", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("history-mcq-quality-chronology-proof").getByText("Chronology or period proof", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "history-mcq-quality-weak", checks);

  const weakScore = await page.getByTestId("history-mcq-quality-score").textContent();
  const weakHref = await page.getByTestId("mcq-talk-route").getAttribute("href");
  if (weakHref !== "/admin/questions/bulk") {
    throw new Error(`Expected weak History quality gate to route to bulk upload, got ${weakHref}`);
  }

  await seed(page, [makeQuestion(1), makeQuestion(2), makeQuestion(3)], "READY");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("history-mcq-quality-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Student MCQ unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("history-mcq-quality-score").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-route").getByText("Track progress", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "history-mcq-quality-strong", checks);

  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["4"], progressKey);
  if (progress?.mcqQualityPassed !== true || progress?.mcqQualityScore !== 100 || progress?.mcqReadinessStatus !== "practice-ready") {
    throw new Error(`History quality status did not persist: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/history/mcq-readiness?day=4`, { waitUntil: "networkidle" });
  await page.getByTestId("history-mcq-quality-gate").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "history-mcq-quality-mobile", checks);
  await page.screenshot({ path: path.join(__dirname, "history-mcq-quality-gate-final.png"), fullPage: true });

  const strongScore = await page.getByTestId("history-mcq-quality-score").textContent();
  const strongHref = await page.getByTestId("mcq-talk-route").getAttribute("href");
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    weakScore,
    strongScore,
    weakHref,
    strongHref,
    progress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0 && strongHref === "/upsc/history/track",
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

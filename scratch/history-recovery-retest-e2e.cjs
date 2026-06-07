const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-history-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "history-recovery-retest-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9800 + index,
    topic_id: 800 + index,
    text_en: `Recovery retest statement ${index}: Revolt of 1857 chronology, source-map, leader-centre, cause, and consequence.`,
    options_en: {
      A: "The revolt had uneven spread but changed Company rule into Crown rule",
      B: "The revolt was uniform and had no consequence",
      C: "Only the cartridge issue mattered in every centre",
      D: "Delhi, Kanpur, Lucknow, and Jhansi had no leader-centre relationship",
    },
    correct_option: "A",
    explanation_en:
      "The correct answer links chronology, source-map proof, centre, leader, trigger, background cause, British response, and Company-to-Crown consequence. The distractors flatten regional variation or remove the political consequence.",
    difficulty: "MEDIUM",
    source: "FRESH_HISTORY_AUTHORING",
    status: "DRAFT",
    quality_notes: {
      batch_code: "HIS-D04",
      subject: "History",
      day: "4",
      week: "1",
      chapter: "Modern History",
      topic: "Revolt of 1857",
      test_title: "History Day 4: Revolt of 1857",
      map_or_case_tag: "1857 centre-leader-cause map",
      pyq_linked: "No",
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
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function expectText(page, label, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  return { label, text };
}

async function run() {
  const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const findings = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_history_recovery_retest");
  });

  await page.goto(`${baseUrl}/upsc/history/mcq-readiness?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, questions: localQuestions }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "4": {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["4-history-frame", "4-history-causation-chain", "4-history-evidence-anchor", "4-history-trap", "4-history-handoff"],
            watchMediaReadyIds: ["lecture-video", "timeline-map", "source-deck", "transcript"],
            confidence: "Working",
            reflection: "Recovery proof rebuilt with chronology, source-map, personalities, causes, and consequences.",
            revisitQueued: false,
            activePromptLabel: "MCQ Revisit",
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            talkClassroomStage: "examiner-verdict",
            labCompleted: true,
            labMode: "modern-timeline",
            labProofCompletedIds: ["timeline", "map", "source", "personality", "trap"],
            labProofSummary: "Source-map proof rebuilt after MCQ failure.",
            mcqReadinessStatus: "practice-ready",
            mcqEvidenceAnchor: "HIS-D04 / Revolt of 1857 / recovery retest",
            mcqNextRoute: "/upsc/history/mcq-readiness?day=4",
            mcqNextActionLabel: "Retest fresh MCQs",
            mcqPreflightSummary: "Recovery completed. Retest fresh MCQs.",
            mcqQualityScore: 100,
            mcqQualityWarnings: [],
            mcqQualityPassed: true,
            mcqQualityGateLabel: "History MCQ quality gate",
            mcqRecoveryCompleted: true,
            mcqRecoveryNote: "Rebuilt the 1857 centre-leader-cause trap.",
            mcqRecoverySummary: "1/3 correct (33%). Recovery proof saved; retest fresh MCQs for Revolt of 1857.",
            mcqRecoverySourceOutcome: "1/3 correct (33%)",
            mcqRecoveryCompletedAt: "2026-05-23T00:00:00.000Z",
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "HIS-D04": {
            planned: 3,
            drafted: 3,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localLocalDraftKey,
        JSON.stringify([
          {
            id: `history-recovery-retest-${Date.now()}`,
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: localQuestions,
          },
        ])
      );
    },
    { progressKey, mcqKey, localDraftKey, questions }
  );

  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("mcq-recovery-retest-banner").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "retest-banner", "Recovery retest mode"));
  findings.push(await expectText(page, "retest-pending", "Retest pending"));
  findings.push(await expectText(page, "retest-button", "Retest fresh MCQs"));
  await assertNoOverflow(page, "history-recovery-retest-ready", checks);

  await page.getByTestId("mcq-start-local-practice").click();
  for (let index = 0; index < questions.length; index += 1) {
    await page.getByTestId("mcq-practice-option-A").click();
    if (index < questions.length - 1) {
      await page.getByRole("button", { name: /Next question/i }).click();
    }
  }

  await page.getByTestId("mcq-practice-outcome-gate").getByText("Recovery command cleared", { exact: false }).waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "retest-cleared", "Recovery retest cleared"));
  await assertNoOverflow(page, "history-recovery-retest-cleared", checks);

  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["4"], progressKey);
  if (
    progress?.mcqRecoveryRetestCompleted !== true ||
    progress?.mcqRecoveryResolved !== true ||
    progress?.mcqRecoveryRetestOutcome !== "Command" ||
    progress?.mcqReadinessStatus !== "command" ||
    progress?.mcqOutcome !== "Command" ||
    progress?.revisitQueued !== false
  ) {
    throw new Error(`Recovery retest did not close the loop: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit-recovery").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "track-recovery-loop", "Recovery loop"));
  findings.push(await expectText(page, "track-recovery-closed", "Closed"));
  findings.push(await expectText(page, "track-recovery-cleared", "Recovery retest cleared"));
  findings.push(await expectText(page, "day-report-recovery-closed", "Status: Recovery closed"));
  findings.push(await expectText(page, "day-report-why-cleared", "Why this day is cleared"));
  await assertNoOverflow(page, "history-recovery-track-closed", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit-recovery").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mobile-track-recovery-loop", "Recovery loop"));
  findings.push(await expectText(page, "mobile-track-recovery-closed", "Closed"));
  findings.push(await expectText(page, "mobile-day-report-recovery-closed", "Status: Recovery closed"));
  findings.push(await expectText(page, "mobile-day-report-why-cleared", "Why this day is cleared"));
  await assertNoOverflow(page, "history-recovery-track-closed-mobile", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    findings,
    checks,
    progress,
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

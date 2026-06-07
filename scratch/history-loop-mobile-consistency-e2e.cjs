const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-history-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "history-loop-mobile-consistency-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "history-loop-mobile-consistency-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9900 + index,
    topic_id: 900 + index,
    text_en: `Mobile consistency retest ${index}: Revolt of 1857 chronology, source-map, leader-centre, cause, and consequence.`,
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

const seedProgress = {
  "4": {
    day: 4,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: ["frame", "timeline", "map", "source", "trap"],
    watchMediaReadyIds: ["lecture-video", "timeline-map", "source-deck", "transcript"],
    watchMediaAssetSources: {
      "lecture-video": "local-demo://history/day-4/revolt-of-1857-lecture",
      "timeline-map": "local-demo://history/day-4/revolt-map-timeline",
      "source-deck": "local-demo://history/day-4/source-personality-proof",
      transcript: "local-demo://history/day-4/revision-transcript",
    },
    watchMediaTranscript:
      "Day 4 History proof links chronology, source-map pairing, personalities, consequences, and UPSC trap repair.",
    confidence: "Command",
    reflection: "Revolt of 1857 answer uses chronology, region map, source anchor, personalities, causes, and consequences.",
    talkScore: 96,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    talkClassroomStage: "examiner-verdict",
    talkNextRoute: "/upsc/history/mcq-readiness?day=4",
    talkNextActionLabel: "Open MCQ readiness",
    talkDiscussionStep: "verdict",
    talkChallengeResponse: "The missing proof is source-map-personality linkage across Delhi, Awadh, Jhansi, and Kanpur.",
    labCompleted: true,
    labMode: "modern-timeline",
    labProofCompletedIds: ["timeline", "map", "source", "personality", "trap"],
    labProofSummary: "Source-map proof locked: Meerut, Delhi, Awadh, Rani Lakshmibai, sepoy-civilian trap.",
    mcqReadinessStatus: "revisit",
    mcqEvidenceAnchor: "HIS-D04 / Revolt of 1857 / 1/3 correct",
    mcqNextRoute: "/upsc/history/revisit?day=4",
    mcqNextActionLabel: "Open revisit",
    mcqPreflightSummary: "1/3 correct (33%). Revisit queued for HIS-D04.",
    mcqQualityScore: 100,
    mcqQualityWarnings: [],
    mcqQualityPassed: true,
    mcqQualityGateLabel: "History MCQ quality gate",
    revisitQueued: true,
    activePromptLabel: "MCQ Practice",
    mcqAttempted: true,
    mcqCompleted: true,
    mcqAnsweredCount: 3,
    mcqCorrectCount: 1,
    mcqTotal: 3,
    mcqScorePercent: 33,
    mcqLastBatchCode: "HIS-D04",
    mcqOutcome: "Revisit",
    mcqRecommendedRoute: "/upsc/history/revisit?day=4",
    mcqReviewSummary: "1/3 correct (33%). Revisit queued for HIS-D04.",
    updatedAt: "2026-05-23T00:00:00.000Z",
  },
};

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

async function expectText(page, label, text, findings) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  findings.push({ label, text });
}

async function visit(page, url, waitTestIds, label, checks) {
  await page.goto(`${baseUrl}${url}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-loop-actions").waitFor({ timeout: 15000 });
  for (const testId of waitTestIds) {
    await page.getByTestId(testId).waitFor({ timeout: 15000 });
  }
  await assertNoOverflow(page, label, checks);
}

async function run() {
  const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const findings = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_history_mobile_loop");
  });

  await page.goto(`${baseUrl}/upsc/history/watch?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(
    ({ localProgressKey, localMcqKey, localDraftStorageKey, localProgress, localQuestions }) => {
      window.localStorage.setItem(localProgressKey, JSON.stringify(localProgress));
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
        localDraftStorageKey,
        JSON.stringify([
          {
            id: "history-loop-mobile-consistency",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: localQuestions,
          },
        ])
      );
    },
    {
      localProgressKey: progressKey,
      localMcqKey: mcqKey,
      localDraftStorageKey: localDraftKey,
      localProgress: seedProgress,
      localQuestions: questions,
    }
  );

  await visit(page, "/upsc/history/watch?day=4", ["history-watch-media-queue"], "history-mobile-watch", checks);
  await expectText(page, "watch-room", "History lecture media queue", findings);

  await visit(page, "/upsc/history/talk?day=4", ["history-talk-classroom-protocol", "talk-route-gate"], "history-mobile-talk", checks);
  await expectText(page, "talk-room", "Interactive History classroom protocol", findings);

  await visit(
    page,
    "/upsc/history/lab?mode=modern-timeline&day=4",
    ["history-lab-visual-command-deck", "history-lab-media-studio", "subject-lab-proof-engine"],
    "history-mobile-lab",
    checks
  );
  await expectText(page, "lab-room", "History media studio", findings);

  await visit(
    page,
    "/upsc/history/mcq-readiness?day=4",
    ["mcq-gate-checklist", "history-mcq-quality-gate", "mcq-practice-outcome-gate"],
    "history-mobile-mcq",
    checks
  );
  await expectText(page, "mcq-room", "History MCQ quality gate", findings);

  await visit(
    page,
    "/upsc/history/revisit?day=4",
    ["history-mcq-recovery-command", "history-revisit-retest-protocol", "revisit-repair-gates"],
    "history-mobile-revisit",
    checks
  );
  await expectText(page, "revisit-room", "History MCQ recovery command", findings);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    viewport: { width: 390, height: 844 },
    findings,
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

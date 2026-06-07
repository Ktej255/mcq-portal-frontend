const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-history-progress-v1";
const evidencePath = path.join(__dirname, "history-command-drill-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "history-command-drill-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];
const seededHistoryProgress = {
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
    talkNextActionLabel: "Start local practice",
    labCompleted: true,
    labMode: "modern-timeline",
    labProofCompletedIds: ["timeline", "map", "source", "personality", "trap"],
    labProofSummary: "Source-map proof locked: Meerut, Delhi, Awadh, Rani Lakshmibai, sepoy-civilian trap.",
    mcqReadinessStatus: "practice-ready",
    mcqEvidenceAnchor: "HIS-D04 / Revolt of 1857 / Source-map proof / 25 fresh MCQs",
    mcqNextRoute: "/upsc/history/mcq-readiness?day=4",
    mcqNextActionLabel: "Start local practice",
    mcqPreflightSummary: "Fresh History batch passed chronology, source-map, personality, and UPSC trap checks.",
    mcqQualityScore: 100,
    mcqQualityWarnings: [],
    mcqQualityPassed: true,
    mcqQualityGateLabel: "History MCQ quality gate",
    updatedAt: "2026-05-23T00:00:00.000Z",
  },
};
const seededHistoryRecoveryProgress = {
  "4": {
    ...seededHistoryProgress["4"],
    confidence: "Shaky",
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
    mcqReadinessStatus: "revisit",
    mcqEvidenceAnchor: "HIS-D04 / Revolt of 1857 / 1/3 correct",
    mcqNextRoute: "/upsc/history/revisit?day=4",
    mcqNextActionLabel: "Open revisit",
    mcqPreflightSummary: "1/3 correct (33%). Revisit queued for HIS-D04.",
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

async function expectText(page, label, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  return { label, text };
}

async function run() {
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_history_command_drill");
  });

  await page.goto(`${baseUrl}/upsc/history/track`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("history-revision-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("history-revision-block-modern").waitFor({ timeout: 15000 });
  await page.getByTestId("history-revision-block-ancient").waitFor({ timeout: 15000 });
  await page.getByTestId("history-revision-block-medieval").waitFor({ timeout: 15000 });
  await page.getByTestId("history-revision-block-art-culture").waitFor({ timeout: 15000 });
  await page.getByTestId("history-retest-queue").waitFor({ timeout: 15000 });
  await page.getByTestId("history-retest-protocol").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "track-title", "History 60-day command drill"));
  findings.push(await expectText(page, "day-report-title", "Day command report"));
  findings.push(await expectText(page, "day-report-blocked", "Status: Class not complete"));
  findings.push(await expectText(page, "day-report-blocker", "Why this day is blocked"));
  findings.push(await expectText(page, "modern-block", "Modern History"));
  findings.push(await expectText(page, "ancient-block", "Ancient History"));
  findings.push(await expectText(page, "medieval-block", "Medieval History"));
  findings.push(await expectText(page, "culture-block", "Art and Culture"));
  findings.push(await expectText(page, "queue-title", "60-day retest queue"));
  findings.push(await expectText(page, "protocol-step", "Classify the mistake"));
  await assertNoOverflow(page, "history-track-command-drill", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  await page.getByTestId("history-revision-command-board").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mobile-day-report-blocked", "Status: Class not complete"));
  findings.push(await expectText(page, "mobile-day-report-blocker", "Why this day is blocked"));
  await assertNoOverflow(page, "history-track-command-drill-mobile", checks);
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: storageKey, value: seededHistoryProgress }
  );
  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit").waitFor({ timeout: 15000 });
  await page.getByTestId("history-track-command-audit-next-route").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "audit-title", "History command audit"));
  findings.push(await expectText(page, "audit-media", "Media assets"));
  findings.push(await expectText(page, "audit-source-map", "Source-map proof"));
  findings.push(await expectText(page, "audit-mcq-quality", "MCQ quality"));
  findings.push(await expectText(page, "audit-quality-score", "100%"));
  findings.push(await expectText(page, "audit-next-route", "Start local practice"));
  findings.push(await expectText(page, "day-report-practice-ready", "Status: Practice ready"));
  findings.push(await expectText(page, "day-report-practice-summary", "Start local practice"));
  await assertNoOverflow(page, "history-track-command-audit-seeded", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mobile-audit-title", "History command audit"));
  findings.push(await expectText(page, "mobile-day-report-practice-ready", "Status: Practice ready"));
  await assertNoOverflow(page, "history-track-command-audit-seeded-mobile", checks);
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: storageKey, value: seededHistoryRecoveryProgress }
  );
  await page.goto(`${baseUrl}/upsc/history/revisit?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-mcq-recovery-command").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-recovery-command", "History MCQ recovery command"));
  findings.push(await expectText(page, "mcq-recovery-score", "1/3 correct"));
  findings.push(await expectText(page, "mcq-recovery-step", "Trap isolated"));
  await assertNoOverflow(page, "history-mcq-recovery-command-open", checks);

  await page.getByPlaceholder("Write the recovery note").fill(
    "Rebuilt 1857 chronology with Delhi, Awadh, Jhansi, leadership, British response, and Company-to-Crown consequence."
  );
  await page.getByRole("button", { name: /Mark recovered/i }).click();
  await page.getByTestId("revisit-return-gate").getByText("Retest fresh MCQs", { exact: false }).waitFor({ timeout: 15000 });
  const recoveredProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["4"], storageKey);
  if (
    !recoveredProgress?.mcqRecoveryCompleted ||
    recoveredProgress?.mcqReadinessStatus !== "practice-ready" ||
    recoveredProgress?.mcqNextActionLabel !== "Retest fresh MCQs" ||
    recoveredProgress?.revisitQueued !== false
  ) {
    throw new Error(`History MCQ recovery did not persist correctly: ${JSON.stringify(recoveredProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "history-mcq-recovery-command-saved", checks);

  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit-recovery").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "track-recovery-loop", "Recovery loop"));
  findings.push(await expectText(page, "track-recovery-route", "Retest fresh MCQs"));
  await assertNoOverflow(page, "history-track-recovery-loop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/history/track?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-track-command-audit-recovery").waitFor({ timeout: 15000 });
  await page.getByTestId("history-day-command-report").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mobile-track-recovery-loop", "Recovery loop"));
  findings.push(await expectText(page, "mobile-track-recovery-route", "Retest fresh MCQs"));
  await assertNoOverflow(page, "history-track-recovery-loop-mobile", checks);
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto(`${baseUrl}/upsc/history/revisit?day=48`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-revisit-retest-protocol").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "revisit-protocol-title", "History retest protocol"));
  findings.push(await expectText(page, "revisit-art-deck", "Art Architecture Recognition Deck"));
  findings.push(await expectText(page, "revisit-art-proof", "Nagara Dravida Vesara"));
  await assertNoOverflow(page, "history-revisit-command-drill", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
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

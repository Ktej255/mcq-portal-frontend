const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const waveDecisionKey = "sarit-upsc-geography-pilot-wave-decision-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";

function buildReadyDay1Question(index) {
  return {
    test_id: 9100 + index,
    topic_id: 9100 + index,
    text_en: `Controlled Geography Day 1 launch question ${index}: choose the option that correctly uses location, scale, relationship, and map proof.`,
    options_en: {
      A: "Use site, situation, scale, physical process, and one India-map relationship before accepting the conclusion.",
      B: "Use one memorized location and ignore the surrounding relationships.",
      C: "Assume every map scale produces the same answer for every region.",
      D: "Treat map evidence as unnecessary once a written statement appears.",
    },
    correct_option: "A",
    explanation_en: `Question ${index} checks the Day 1 relationship method: what, where, why there, map proof, and the UPSC trap. Option A keeps the full chain intact.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D01",
      subject: "Geography",
      day: "1",
      chapter: "Physical Geography Foundation",
      topic: "Geographic Thinking and Map Relationships",
      map_or_case_tag: "India map relationship drill",
    },
  };
}

async function seedReadyDay1Mcqs(page) {
  const questions = Array.from({ length: 25 }, (_, index) => buildReadyDay1Question(index + 1));
  await page.evaluate(
    ({ localMcqKey, localDraftKey, seededQuestions }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D01": {
            planned: 25,
            drafted: seededQuestions.length,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        }),
      );
      window.localStorage.setItem(
        localDraftKey,
        JSON.stringify([
          {
            id: "admin-launch-plan-geography-day1-ready",
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ]),
      );
    },
    { localMcqKey: mcqKey, localDraftKey: draftKey, seededQuestions: questions },
  );
}

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText,
  }));

  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
  if (hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }

  if (/ANTIGRAVITY|ANTI\s*GRAVITY/i.test(metrics.text)) {
    throw new Error(`${label} still contains old protected branding.`);
  }

  return {
    label,
    metrics: {
      url: metrics.url,
      clientWidth: metrics.clientWidth,
      scrollWidth: metrics.scrollWidth,
      bodyScrollWidth: metrics.bodyScrollWidth,
      hasHorizontalOverflow,
      containsOldBranding: false,
    },
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_admin_launch_plan");
  });

  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-launch-plan-page").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "Launch Plan and Delivery Tracker" }).waitFor({ timeout: 15000 });
  await page.getByText("May 24, 2026", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("May 25, 2026", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("May 31, 2026", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Next Six-Day Operating Plan", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Geography local funnel", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("link", { name: /Launch Plan/i }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-launch-plan-page").getByRole("link", { name: /Feature Inventory/i }).waitFor({ timeout: 15000 });
  const verdictPanel = page.getByTestId("admin-24-25-verdict");
  await verdictPanel.waitFor({ timeout: 15000 });
  await verdictPanel.getByText("24 May to 31 May operating answer", { exact: true }).waitFor({ timeout: 15000 });
  await verdictPanel.getByText("May 24 plan verdict", { exact: true }).waitFor({ timeout: 15000 });
  await verdictPanel.getByText("Locally closed", { exact: true }).waitFor({ timeout: 15000 });
  await verdictPanel.getByText("Stabilize before sharing", { exact: true }).waitFor({ timeout: 15000 });
  const actionQueue = page.getByTestId("admin-immediate-action-queue");
  await actionQueue.waitFor({ timeout: 15000 });
  await actionQueue.getByText("Immediate Action Queue", { exact: true }).waitFor({ timeout: 15000 });
  await actionQueue.getByText("Apply Supabase learner-state migration", { exact: true }).waitFor({ timeout: 15000 });
  await actionQueue.getByText("Verify Google OAuth and continuity", { exact: true }).waitFor({ timeout: 15000 });
  await actionQueue.getByText("Invite the first tiny tester group", { exact: true }).waitFor({ timeout: 15000 });
  await actionQueue.getByText("Load real Geography Day 1 assets", { exact: true }).waitFor({ timeout: 15000 });
  const liveReleaseBoundary = page.getByTestId("admin-live-release-boundary");
  await liveReleaseBoundary.waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Live Release Boundary", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Apply learner-state RLS", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Apply the distributed Talk limiter", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Activate the live AI teacher", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Prove deployed Google login continuity", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Load the real Day 1 release pack", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("Run the controlled first wave", { exact: true }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("SUPABASE_SECRET_KEY", { exact: false }).waitFor({ timeout: 15000 });
  await liveReleaseBoundary.getByText("GEMINI_API_KEY", { exact: false }).waitFor({ timeout: 15000 });
  const sharePacket = page.getByTestId("admin-share-packet");
  await sharePacket.waitFor({ timeout: 15000 });
  await sharePacket.getByText("/upsc/geography/pilot").waitFor({ timeout: 15000 });
  await sharePacket.getByText("Max testers", { exact: true }).waitFor({ timeout: 15000 });
  await sharePacket.getByText("Start lesson", { exact: true }).waitFor({ timeout: 15000 });
  await sharePacket.getByText("Stop sharing", { exact: true }).waitFor({ timeout: 15000 });
  await sharePacket.getByText("Review open feedback", { exact: true }).waitFor({ timeout: 15000 });
  const rosterPanel = page.getByTestId("admin-controlled-tester-roster");
  await rosterPanel.waitFor({ timeout: 15000 });
  const outcomeGate = page.getByTestId("admin-pilot-outcome-gate");
  await outcomeGate.waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-outcome-status").getByText("No tester wave started", { exact: true }).waitFor({ timeout: 15000 });
  const waveDecisionLock = page.getByTestId("admin-wave-decision-lock");
  await waveDecisionLock.waitFor({ timeout: 15000 });
  const firstWaveEvidence = page.getByTestId("admin-first-wave-evidence-summary");
  await firstWaveEvidence.waitFor({ timeout: 15000 });
  await page.getByTestId("admin-first-wave-evidence-status").getByText("No first wave evidence yet", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-wave-decision-status").getByText("Hold first wave", { exact: true }).waitFor({ timeout: 15000 });
  if (!(await page.getByTestId("admin-wave-decision-second-wave").isDisabled())) {
    throw new Error("Second-wave decision unlocked before the first tester wave completed.");
  }
  await rosterPanel.getByText("First pilot window: 0/3 testers", { exact: true }).waitFor({ timeout: 15000 });
  await rosterPanel.getByText("Cap open", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByLabel("Tester name").fill("Pilot One");
  await page.getByLabel("Tester contact").fill("Batch A / 9 PM");
  await page.getByTestId("admin-add-controlled-tester").click();
  await rosterPanel.getByText("1. Pilot One", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-controlled-tester-code-1").getByText(/^Code GEO-/).waitFor({ timeout: 15000 });
  await rosterPanel.getByText("First pilot window: 1/3 testers", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByLabel("Tester name").fill("Pilot Two");
  await page.getByLabel("Tester contact").fill("Batch A / 9 PM");
  await page.getByTestId("admin-add-controlled-tester").click();
  await page.getByLabel("Tester name").fill("Pilot Three");
  await page.getByLabel("Tester contact").fill("Batch A / 9 PM");
  await page.getByTestId("admin-add-controlled-tester").click();
  await rosterPanel.getByText("First pilot window: 3/3 testers", { exact: true }).waitFor({ timeout: 15000 });
  await rosterPanel.getByText("Cap reached", { exact: true }).waitFor({ timeout: 15000 });
  if (!(await page.getByTestId("admin-add-controlled-tester").isDisabled())) {
    throw new Error("Controlled tester roster allowed more than three students.");
  }
  await rosterPanel.getByRole("button", { name: "invited" }).first().click();
  await page.getByTestId("admin-pilot-outcome-status").getByText("First tester wave in progress", { exact: true }).waitFor({ timeout: 15000 });
  await outcomeGate.getByText("0/3 completed", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-first-wave-evidence-status").getByText("Waiting for first tester evidence", { exact: true }).waitFor({ timeout: 15000 });
  if (!(await page.getByTestId("admin-wave-decision-second-wave").isDisabled())) {
    throw new Error("Second-wave decision unlocked while tester wave was still in progress.");
  }
  const rosterState = await page.evaluate((localRosterKey) => {
    const parsed = JSON.parse(window.localStorage.getItem(localRosterKey) || "[]");
    return { count: parsed.length, firstStatus: parsed[0]?.status, inviteCodes: parsed.map((tester) => tester.inviteCode) };
  }, rosterKey);
  if (rosterState.count !== 3 || rosterState.firstStatus !== "invited" || !rosterState.inviteCodes.every((code) => String(code || "").startsWith("GEO-"))) {
    throw new Error(`Unexpected roster state: ${JSON.stringify(rosterState)}`);
  }
  const completedButtons = rosterPanel.getByRole("button", { name: "completed" });
  await completedButtons.nth(0).click();
  await completedButtons.nth(1).click();
  await completedButtons.nth(2).click();
  await page.getByTestId("admin-first-wave-evidence-status").getByText("Waiting for first tester evidence", { exact: true }).waitFor({ timeout: 15000 });
  await outcomeGate.getByText("3/3 completed", { exact: true }).waitFor({ timeout: 15000 });
  if (!(await page.getByTestId("admin-wave-decision-second-wave").isDisabled())) {
    throw new Error("Second-wave decision unlocked without feedback receipts.");
  }
  await page.evaluate(
    ({ localFeedbackKey, inviteCodes }) => {
      window.localStorage.setItem(
        localFeedbackKey,
        JSON.stringify(
          inviteCodes.map((inviteCode, index) => ({
            id: `admin-launch-plan-positive-${index + 1}`,
            createdAt: new Date(Date.now() + index).toISOString(),
            testerName: `Pilot ${index + 1}`,
            stage: index === 0 ? "Watch" : index === 1 ? "Talk" : "Visual Lab",
            severity: "Positive",
            day: 1,
            note: "Tester completed the Geography Day 1 loop and submitted usable feedback evidence.",
            currentRoute: "/upsc/geography/pilot",
            inviteCode,
            status: "open",
          }))
        )
      );
      window.dispatchEvent(new CustomEvent("geography-pilot-feedback-updated"));
    },
    { localFeedbackKey: feedbackKey, inviteCodes: rosterState.inviteCodes }
  );
  await page.getByTestId("admin-first-wave-evidence-status").getByText("Evidence clean for second wave", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-outcome-status").getByText("Ready for second testing wave", { exact: true }).waitFor({ timeout: 15000 });
  await outcomeGate.getByText("3/3 completed", { exact: true }).waitFor({ timeout: 15000 });
  await firstWaveEvidence.getByText("3/3 receipts", { exact: true }).waitFor({ timeout: 15000 });
  if (await page.getByTestId("admin-wave-decision-second-wave").isDisabled()) {
    throw new Error("Second-wave decision stayed locked after all first-wave testers completed.");
  }
  await page.getByTestId("admin-wave-decision-second-wave").click();
  await page.getByTestId("admin-wave-decision-status").getByText("Second wave ready", { exact: true }).waitFor({ timeout: 15000 });
  const waveDecisionState = await page.evaluate((localWaveDecisionKey) => {
    return JSON.parse(window.localStorage.getItem(localWaveDecisionKey) || "null");
  }, waveDecisionKey);
  if (waveDecisionState?.status !== "second-wave") {
    throw new Error(`Unexpected wave decision state: ${JSON.stringify(waveDecisionState)}`);
  }
  const preShareGate = page.getByTestId("admin-pre-share-gate");
  await preShareGate.waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pre-share-gate-status").getByText("Do not share yet", { exact: true }).waitFor({ timeout: 15000 });
  await preShareGate.getByText("0/7 checked", { exact: true }).waitFor({ timeout: 15000 });
  await preShareGate.getByText("0 open blockers", { exact: true }).waitFor({ timeout: 15000 });
  const founderRunner = page.getByTestId("admin-founder-review-runner");
  await founderRunner.waitFor({ timeout: 15000 });
  await founderRunner.getByText("Next review step", { exact: true }).waitFor({ timeout: 15000 });
  await founderRunner.getByText("Geography landing", { exact: true }).waitFor({ timeout: 15000 });
  await founderRunner.getByText("Landing opens without old branding or overflow.", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-founder-review-open-next").getAttribute("href").then((href) => {
    if (href !== "/upsc/geography") throw new Error(`Unexpected founder review href: ${href}`);
  });
  await page.getByTestId("admin-founder-review-mark-next").click();
  await founderRunner.getByText("Watch room", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-founder-review-count").getByText("1/7 checked", { exact: true }).waitFor({ timeout: 15000 });
  await preShareGate.getByText("1/7 checked", { exact: true }).waitFor({ timeout: 15000 });
  for (let remainingReviewStep = 0; remainingReviewStep < 6; remainingReviewStep += 1) {
    await page.getByTestId("admin-founder-review-mark-next").click();
  }
  await page.getByTestId("admin-founder-review-count").getByText("7/7 checked", { exact: true }).waitFor({ timeout: 15000 });
  await founderRunner.getByText("All review surfaces checked", { exact: true }).waitFor({ timeout: 15000 });
  await seedReadyDay1Mcqs(page);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-geography-launch-readiness").getByText("25/25 ready", { exact: false }).waitFor({ timeout: 15000 });
  const publicLaunchBoundary = page.getByTestId("admin-geography-public-launch-boundary");
  await publicLaunchBoundary.waitFor({ timeout: 15000 });
  await publicLaunchBoundary.getByText("Public launch still locked", { exact: true }).waitFor({ timeout: 15000 });
  await publicLaunchBoundary.getByText("Final Day 1 media", { exact: true }).waitFor({ timeout: 15000 });
  await publicLaunchBoundary.getByText("Missing", { exact: true }).waitFor({ timeout: 15000 });
  if ((await publicLaunchBoundary.getAttribute("data-public-launch-ready")) !== "false") {
    throw new Error("Public launch boundary unlocked before final Day 1 media and first-wave receipts.");
  }
  await page.getByTestId("admin-pre-share-gate-status").getByText("Do not share yet", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-approve").click();
  await page.getByTestId("admin-pre-share-gate-status").getByText("Safe to share with controlled testers", { exact: true }).waitFor({ timeout: 15000 });
  if ((await publicLaunchBoundary.getAttribute("data-controlled-pilot-ready")) !== "true") {
    throw new Error("Public boundary did not reflect the now-ready controlled pilot gate.");
  }
  if ((await publicLaunchBoundary.getAttribute("data-public-launch-ready")) !== "false") {
    throw new Error("Public launch unlocked even though final Day 1 media is still missing.");
  }
  await preShareGate.getByText("Approved", { exact: true }).waitFor({ timeout: 15000 });
  await sharePacket.getByText("Share approved", { exact: true }).waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflow(page, "admin-launch-plan-desktop"));

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-launch-plan-page").waitFor({ timeout: 15000 });
  await page.getByTestId("admin-share-packet").waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflow(page, "admin-launch-plan-mobile"));

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(
    ({ localFeedbackKey, localReleaseKey }) => {
      window.localStorage.setItem(
        localReleaseKey,
        JSON.stringify({
          status: "approved",
          reviewerName: "Founder QA",
          note: "Approved before live blocker feedback arrived.",
          maxTesters: 3,
          testWindow: "25-35 minutes",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        localFeedbackKey,
        JSON.stringify([
          {
            id: "admin-launch-plan-open-blocker",
            createdAt: new Date().toISOString(),
            testerName: "Blocker Tester",
            stage: "Navigation",
            severity: "Blocker",
            day: 1,
            note: "Student cannot find the next room after Track closeout.",
            currentRoute: "/upsc/geography/pilot",
            status: "open",
          },
          ...JSON.parse(window.localStorage.getItem(localFeedbackKey) || "[]"),
        ])
      );
    },
    { localFeedbackKey: feedbackKey, localReleaseKey: releaseKey }
  );
  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-launch-plan-page").waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-outcome-status").getByText("Repair before widening", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-wave-decision-status").getByText("Second wave locked by live gate", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pre-share-gate-status").getByText("Do not share yet", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-release-status").getByText("Stop sharing: blocker feedback open", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-share-blocker-alert").getByText("1 open blocker feedback item", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-share-packet").getByText("1 open blocker item need review before widening.", { exact: false }).waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflow(page, "admin-launch-plan-blocker-stop-sharing"));

  await page.getByRole("button", { name: "Mark reviewed" }).first().click();
  await page.getByTestId("admin-pilot-release-status").getByText("Approved for controlled testing", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-wave-decision-status").getByText("Second wave ready", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-share-blocker-alert").waitFor({ state: "detached", timeout: 15000 });
  await page.getByTestId("admin-share-packet").getByText("Share approved", { exact: true }).waitFor({ timeout: 15000 });

  await browser.close();

  const unexpectedConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized")
  );
  if (unexpectedConsoleErrors.length || pageErrors.length) {
    throw new Error(
      JSON.stringify(
        {
          unexpectedConsoleErrors,
          pageErrors,
        },
        null,
        2
      )
    );
  }

  console.log(JSON.stringify({ baseUrl, checks, consoleErrors, unexpectedConsoleErrors, pageErrors, passed: true }, null, 2));
}

run().catch(async (error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

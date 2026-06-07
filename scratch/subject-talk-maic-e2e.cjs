const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "subject-talk-maic-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-talk-maic-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function seedProfile(page) {
  await page.addInitScript((studentProfileKey) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_talk_maic");
    localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentTalk(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    await seedProfile(page);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 }).catch(async (error) => {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      await page.screenshot({ path: path.join(__dirname, `subject-talk-maic-${viewportName}-missing-step.png`), fullPage: true }).catch(() => {});
      throw new Error(
        `${viewportName} Talk step did not render. URL=${page.url()} BODY=${bodyText.slice(0, 900)} ` +
          `PAGE_ERRORS=${JSON.stringify(pageErrors.slice(-5))} CONSOLE_ERRORS=${JSON.stringify(consoleErrors.slice(-5))} ERROR=${error.message}`
      );
    });
    await page.getByTestId("talk-discussion-window").waitFor({ timeout: 15000 });
    await page.getByText("Speak your attempt-level gap", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-learner-mode").getByText("Advanced attempt diagnosis", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-simple-loop").getByText("Speak", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-simple-loop").getByText("AI teacher check", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-simple-loop").getByText("95% recall", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-simple-loop").getByText("Next room", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("talk-speak-answer").getByText("Speak answer", { exact: false }).waitFor({ timeout: 15000 });
    const simpleState = await page.evaluate(() => ({
      baselineOpen: Boolean(document.querySelector('[data-testid="subject-talk-baseline"]')?.open),
      baselineDraftVisible:
        (document.querySelector('[data-testid="subject-talk-baseline-draft"]')?.getClientRects().length ?? 0) > 0,
      baselineContainerCount: document.querySelectorAll('[data-testid="subject-talk-baseline"]').length,
      baselineDraftCount: document.querySelectorAll('[data-testid="subject-talk-baseline-draft"]').length,
      baselineSaveCount: document.querySelectorAll('[data-testid="subject-talk-save-baseline"]').length,
      speakButtonVisible:
        (document.querySelector('[data-testid="talk-speak-answer"]')?.getClientRects().length ?? 0) > 0,
      moreControlsOpen: Boolean(document.querySelector('[data-testid="subject-talk-more-controls"]')?.open),
      teacherControlsOpen: Boolean(document.querySelector('[data-testid="subject-talk-teacher-controls"]')?.open),
      advancedOpen: Boolean(document.querySelector('[data-testid="subject-talk-details"]')?.open),
      routeGateVisibleBeforeAnswer:
        (document.querySelector('[data-testid="talk-route-gate"]')?.getClientRects().length ?? 0) > 0,
    }));
    if (
      simpleState.baselineOpen ||
      simpleState.baselineDraftVisible ||
      simpleState.baselineContainerCount !== 0 ||
      simpleState.baselineDraftCount !== 0 ||
      simpleState.baselineSaveCount !== 0 ||
      !simpleState.speakButtonVisible ||
      simpleState.moreControlsOpen ||
      simpleState.teacherControlsOpen ||
      simpleState.advancedOpen ||
      simpleState.routeGateVisibleBeforeAnswer
    ) {
      throw new Error(`${viewportName} Talk controls should start folded: ${JSON.stringify(simpleState)}`);
    }
    await page.getByPlaceholder("Write the explanation", { exact: false }).fill(
      "Protected Areas in biodiversity include national parks, wildlife sanctuaries, biosphere reserves and conservation reserves. The mechanism is category, governance, permitted activities, institution, map location and ecology. In India, a tiger reserve or wetland example shows why UPSC mixes protected area rules with biodiversity, habitat, conservation, national park, sanctuary and location traps."
    );
    await page.getByRole("button", { name: /Assess explanation/i }).click();
    await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
    await page.getByTestId("talk-recall-target").getByText("Target 95% recall", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-doubt-diagnosis").getByText("Doubt diagnosis", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-doubt-diagnosis").getByText("Repair action", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-doubt-diagnosis").getByText("Mastery check", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Teacher command", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Repair", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Check", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-teacher-coach").waitFor({ timeout: 15000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-testid="subject-talk-teacher-connection"]')?.textContent || "";
      return /guidance active|will retry later/i.test(text);
    }, null, { timeout: 15000 });
    await page.getByTestId("talk-route-gate").getByText("Watch the exact gap", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("talk-primary-route").getByText("Open class", { exact: false }).waitFor({ timeout: 15000 });
    const routeInsideScoreCard = await page.getByTestId("talk-score-card").getByTestId("talk-route-gate").isVisible();
    if (!routeInsideScoreCard) {
      throw new Error(`${viewportName} Talk next route should be inside the single result card.`);
    }
    const peerChallengeVisibleAfterAnswer = await page.getByTestId("subject-talk-peer-challenge").isVisible().catch(() => false);
    if (peerChallengeVisibleAfterAnswer) {
      throw new Error(`${viewportName} Talk should not require a second peer challenge answer.`);
    }
    const transcriptVisibleBeforeDetails = await page.getByTestId("subject-maic-discussion-turns").isVisible();
    if (transcriptVisibleBeforeDetails) {
      throw new Error(`${viewportName} MAIC transcript should stay folded on the main Talk surface.`);
    }
    await page.getByTestId("subject-talk-details").locator("summary").first().click();
    await page.getByTestId("subject-talk-single-answer-rule").waitFor({ state: "visible", timeout: 15000 });
    const teacherControlsVisibleBeforeOpen = await page.getByTestId("subject-talk-teacher-controls").isVisible();
    const singleAnswerRuleText = (await page.getByTestId("subject-talk-single-answer-rule").innerText()).trim();
    const promptWallVisibleBeforeOpen = await page.getByText("Mentor lens", { exact: true }).isVisible().catch(() => false);
    if (!teacherControlsVisibleBeforeOpen || !/Explain once in the main answer box/i.test(singleAnswerRuleText) || promptWallVisibleBeforeOpen) {
      throw new Error(
        `${viewportName} teacher tools should remain folded inside optional details: ${JSON.stringify({
          teacherControlsVisibleBeforeOpen,
          singleAnswerRuleText,
          promptWallVisibleBeforeOpen,
        })}`
      );
    }
    await page.getByTestId("subject-maic-discussion-turns").locator("summary").click();
    await page.getByTestId("subject-maic-discussion-turns").getByText("UPSC Examiner", { exact: false }).waitFor({ timeout: 15000 });
    const primaryRouteHref = await page.getByTestId("talk-primary-route").getAttribute("href");
    const simplePanelContract = await page.getByTestId("subject-talk-simple-step").evaluate((element) => ({
      proofRule: element.getAttribute("data-proof-rule"),
      flowState: element.getAttribute("data-flow-state"),
      learnerLevel: element.getAttribute("data-learner-level"),
      recallTarget: element.getAttribute("data-recall-target"),
      primaryActionHref: element.getAttribute("data-primary-action-href"),
      primaryActionLabel: element.getAttribute("data-primary-action-label"),
      watchComplete: element.getAttribute("data-watch-complete"),
      mcqReady: element.getAttribute("data-mcq-ready"),
    }));
    const routeGateContract = await page.getByTestId("talk-route-gate").evaluate((element) => ({
      proofRule: element.getAttribute("data-proof-rule"),
      flowState: element.getAttribute("data-flow-state"),
      learnerLevel: element.getAttribute("data-learner-level"),
      score: Number(element.getAttribute("data-score")),
      band: element.getAttribute("data-band"),
      recallTarget: Number(element.getAttribute("data-recall-target")),
      nextActionRoute: element.getAttribute("data-next-action-route"),
      nextActionLabel: element.getAttribute("data-next-action-label"),
      mcqReady: element.getAttribute("data-mcq-ready"),
      watchComplete: element.getAttribute("data-watch-complete"),
      teacherStatus: element.getAttribute("data-teacher-status"),
    }));
    const commandSummaryContract = await page.getByTestId("subject-talk-command-summary").evaluate((element) => ({
      proofRule: element.getAttribute("data-proof-rule"),
      gapCategory: element.getAttribute("data-gap-category"),
      teacherStatus: element.getAttribute("data-teacher-status"),
      score: Number(element.getAttribute("data-score")),
      recallTarget: Number(element.getAttribute("data-recall-target")),
      nextActionRoute: element.getAttribute("data-next-action-route"),
      nextActionLabel: element.getAttribute("data-next-action-label"),
      mcqReady: element.getAttribute("data-mcq-ready"),
      text: element.textContent || "",
    }));
    const primaryRouteContract = await page.getByTestId("talk-primary-route").evaluate((element) => ({
      nextActionRoute: element.getAttribute("data-next-action-route"),
      nextActionLabel: element.getAttribute("data-next-action-label"),
      recallTarget: Number(element.getAttribute("data-recall-target")),
      score: Number(element.getAttribute("data-score")),
      mcqReady: element.getAttribute("data-mcq-ready"),
    }));
    const teacherConnectionText = (await page.getByTestId("subject-talk-teacher-connection").innerText()).trim();
    if (primaryRouteHref !== "/upsc/environment/watch?day=5") {
      throw new Error(`Fresh environment Talk should repair through Watch before Lab/MCQ: ${primaryRouteHref}`);
    }
    if (
      simplePanelContract.proofRule !== "ai-teacher-recall-score-doubt-repair-route" ||
      simplePanelContract.flowState !== "route-ready" ||
      simplePanelContract.learnerLevel !== "advanced" ||
      simplePanelContract.recallTarget !== "95" ||
      simplePanelContract.primaryActionHref !== "/upsc/environment/watch?day=5" ||
      simplePanelContract.primaryActionLabel !== "Open class" ||
      simplePanelContract.watchComplete !== "false" ||
      simplePanelContract.mcqReady !== "false" ||
      routeGateContract.proofRule !== "ai-teacher-recall-score-doubt-repair-route" ||
      routeGateContract.flowState !== "route-ready" ||
      routeGateContract.learnerLevel !== "advanced" ||
      routeGateContract.recallTarget !== 95 ||
      routeGateContract.nextActionRoute !== "/upsc/environment/watch?day=5" ||
      routeGateContract.nextActionLabel !== "Open class" ||
      routeGateContract.mcqReady !== "false" ||
      routeGateContract.watchComplete !== "false" ||
      routeGateContract.teacherStatus !== "repair-required" ||
      commandSummaryContract.proofRule !== "ai-teacher-gap-repair-mastery-next" ||
      !commandSummaryContract.gapCategory ||
      commandSummaryContract.teacherStatus !== "repair-required" ||
      commandSummaryContract.score !== routeGateContract.score ||
      commandSummaryContract.recallTarget !== 95 ||
      commandSummaryContract.nextActionRoute !== "/upsc/environment/watch?day=5" ||
      commandSummaryContract.nextActionLabel !== "Open class" ||
      commandSummaryContract.mcqReady !== "false" ||
      !/teacher command/i.test(commandSummaryContract.text) ||
      !/repair/i.test(commandSummaryContract.text) ||
      !/check/i.test(commandSummaryContract.text) ||
      primaryRouteContract.nextActionRoute !== "/upsc/environment/watch?day=5" ||
      primaryRouteContract.nextActionLabel !== "Open class" ||
      primaryRouteContract.recallTarget !== 95 ||
      primaryRouteContract.mcqReady !== "false"
    ) {
      throw new Error(
        `${viewportName} subject Talk production contract mismatch: ${JSON.stringify({
          simplePanelContract,
          routeGateContract,
          commandSummaryContract,
          primaryRouteContract,
        }, null, 2)}`
      );
    }

    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["5"] : null;
    }, storageKey("environment"));
    if (
      !progress?.teacherMode ||
      !progress?.teacherCoachNextPrompt ||
      progress?.teacherRecallTarget !== 95 ||
      !progress?.teacherDoubtCategory ||
      !progress?.teacherDoubtReason ||
      !progress?.teacherDoubtRepairAction ||
      !progress?.teacherDoubtMasteryCheck ||
      progress?.talkTeacherStatus !== "repair-required" ||
      progress?.talkTeacherTurnCount !== 1
    ) {
      throw new Error(`Environment Talk adaptive teacher state did not persist correctly: ${JSON.stringify(progress)}`);
    }
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push({
      viewport: viewportName,
      route: "environment-talk",
      mode: "single-answer-verdict",
      primaryRouteHref,
      simplePanelContract,
      routeGateContract,
      commandSummaryContract,
      primaryRouteContract,
      routeInsideScoreCard,
      teacherConnectionText,
      doubtDiagnosis: {
        category: progress.teacherDoubtCategory,
        reason: progress.teacherDoubtReason,
        repairAction: progress.teacherDoubtRepairAction,
        masteryCheck: progress.teacherDoubtMasteryCheck,
      },
      progress,
      metrics: pageMetrics,
    });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Talk has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (!progress?.talkTranscript?.length || progress?.talkDiscussionStep !== "verdict" || !progress?.talkUnlockStage || !progress?.talkVerdict) {
      throw new Error(`Environment Talk MAIC state did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifyEconomyTalk() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await seedProfile(page);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/economy/talk?day=3`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 });
    await page.getByTestId("talk-discussion-window").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-learner-mode").getByText("Advanced attempt diagnosis", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-simple-loop").getByText("95% recall", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("talk-speak-answer").getByText("Speak answer", { exact: false }).waitFor({ timeout: 15000 });
    const simpleState = await page.evaluate(() => ({
      baselineOpen: Boolean(document.querySelector('[data-testid="subject-talk-baseline"]')?.open),
      baselineDraftVisible:
        (document.querySelector('[data-testid="subject-talk-baseline-draft"]')?.getClientRects().length ?? 0) > 0,
      baselineContainerCount: document.querySelectorAll('[data-testid="subject-talk-baseline"]').length,
      baselineDraftCount: document.querySelectorAll('[data-testid="subject-talk-baseline-draft"]').length,
      baselineSaveCount: document.querySelectorAll('[data-testid="subject-talk-save-baseline"]').length,
      speakButtonVisible:
        (document.querySelector('[data-testid="talk-speak-answer"]')?.getClientRects().length ?? 0) > 0,
      moreControlsOpen: Boolean(document.querySelector('[data-testid="subject-talk-more-controls"]')?.open),
      teacherControlsOpen: Boolean(document.querySelector('[data-testid="subject-talk-teacher-controls"]')?.open),
      advancedOpen: Boolean(document.querySelector('[data-testid="subject-talk-details"]')?.open),
      routeGateVisibleBeforeAnswer:
        (document.querySelector('[data-testid="talk-route-gate"]')?.getClientRects().length ?? 0) > 0,
    }));
    if (
      simpleState.baselineOpen ||
      simpleState.baselineDraftVisible ||
      simpleState.baselineContainerCount !== 0 ||
      simpleState.baselineDraftCount !== 0 ||
      simpleState.baselineSaveCount !== 0 ||
      !simpleState.speakButtonVisible ||
      simpleState.moreControlsOpen ||
      simpleState.teacherControlsOpen ||
      simpleState.advancedOpen ||
      simpleState.routeGateVisibleBeforeAnswer
    ) {
      throw new Error(`Economy Talk controls should start folded: ${JSON.stringify(simpleState)}`);
    }
    await page.getByPlaceholder("Write the explanation", { exact: false }).fill(
      "Money, Inflation and Business Cycle links money supply, inflation, deflation, stagflation, CPI, WPI, demand-pull, cost-push, liquidity, credit and monetary transmission. Inflation becomes an economic and social policy problem because food prices, wages, savings, interest rates, fiscal support, RBI repo tools, growth and household welfare move together. India example: CPI food inflation can require monetary policy response while supply shocks need government buffer stock, import, tax or welfare action. UPSC trap: do not treat every inflation episode as demand-pull or every RBI action as instantly reducing prices."
    );
    await page.getByRole("button", { name: /Assess explanation/i }).click();
    await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
    await page.getByTestId("talk-recall-target").getByText("Target 95% recall", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-doubt-diagnosis").getByText("Doubt diagnosis", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-doubt-diagnosis").getByText("Mastery check", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Teacher command", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Repair", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-command-summary").getByText("Check", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-teacher-coach").waitFor({ timeout: 15000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-testid="subject-talk-teacher-connection"]')?.textContent || "";
      return /guidance active|will retry later/i.test(text);
    }, null, { timeout: 15000 });
    await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
    const economyRouteInsideScoreCard = await page.getByTestId("talk-score-card").getByTestId("talk-route-gate").isVisible();
    if (!economyRouteInsideScoreCard) {
      throw new Error("Economy Talk next route should be inside the single result card.");
    }
    const peerChallengeVisibleAfterAnswer = await page.getByTestId("subject-talk-peer-challenge").isVisible().catch(() => false);
    if (peerChallengeVisibleAfterAnswer) {
      throw new Error("Economy Talk should not require a second peer challenge answer.");
    }
    const transcriptVisibleBeforeDetails = await page.getByTestId("subject-maic-discussion-turns").isVisible();
    if (transcriptVisibleBeforeDetails) {
      throw new Error("Economy MAIC transcript should stay folded on the main Talk surface.");
    }
    await page.getByTestId("subject-talk-details").locator("summary").first().click();
    await page.getByTestId("subject-talk-single-answer-rule").waitFor({ state: "visible", timeout: 15000 });
    const promptWallVisibleBeforeOpen = await page.getByText("Mentor lens", { exact: true }).isVisible().catch(() => false);
    const singleAnswerRuleText = (await page.getByTestId("subject-talk-single-answer-rule").innerText()).trim();
    if (!/Explain once in the main answer box/i.test(singleAnswerRuleText) || promptWallVisibleBeforeOpen) {
      throw new Error(`Economy teacher tools should remain folded inside optional details: ${JSON.stringify({ singleAnswerRuleText, promptWallVisibleBeforeOpen })}`);
    }
    await page.getByTestId("subject-maic-discussion-turns").locator("summary").click();
    await page.getByTestId("subject-maic-discussion-turns").getByText("UPSC Examiner", { exact: false }).first().waitFor({ timeout: 15000 });
    const economyTeacherConnectionText = (await page.getByTestId("subject-talk-teacher-connection").innerText()).trim();
    const economyRouteGateContract = await page.getByTestId("talk-route-gate").evaluate((element) => ({
      proofRule: element.getAttribute("data-proof-rule"),
      flowState: element.getAttribute("data-flow-state"),
      learnerLevel: element.getAttribute("data-learner-level"),
      recallTarget: Number(element.getAttribute("data-recall-target")),
      nextActionRoute: element.getAttribute("data-next-action-route"),
      nextActionLabel: element.getAttribute("data-next-action-label"),
      mcqReady: element.getAttribute("data-mcq-ready"),
      teacherStatus: element.getAttribute("data-teacher-status"),
    }));
    const economyCommandSummaryContract = await page.getByTestId("subject-talk-command-summary").evaluate((element) => ({
      proofRule: element.getAttribute("data-proof-rule"),
      gapCategory: element.getAttribute("data-gap-category"),
      teacherStatus: element.getAttribute("data-teacher-status"),
      score: Number(element.getAttribute("data-score")),
      recallTarget: Number(element.getAttribute("data-recall-target")),
      nextActionRoute: element.getAttribute("data-next-action-route"),
      nextActionLabel: element.getAttribute("data-next-action-label"),
      mcqReady: element.getAttribute("data-mcq-ready"),
      text: element.textContent || "",
    }));
    const economyProgress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["3"] : null;
    }, storageKey("economy"));
    if (
      economyRouteGateContract.proofRule !== "ai-teacher-recall-score-doubt-repair-route" ||
      economyRouteGateContract.flowState !== "route-ready" ||
      economyRouteGateContract.learnerLevel !== "advanced" ||
      economyRouteGateContract.recallTarget !== 95 ||
      economyRouteGateContract.nextActionRoute !== "/upsc/economy/watch?day=3" ||
      economyRouteGateContract.nextActionLabel !== "Open class" ||
      economyRouteGateContract.mcqReady !== "false" ||
      economyRouteGateContract.teacherStatus !== "repair-required" ||
      economyCommandSummaryContract.proofRule !== "ai-teacher-gap-repair-mastery-next" ||
      !economyCommandSummaryContract.gapCategory ||
      economyCommandSummaryContract.teacherStatus !== "repair-required" ||
      economyCommandSummaryContract.recallTarget !== 95 ||
      economyCommandSummaryContract.nextActionRoute !== "/upsc/economy/watch?day=3" ||
      economyCommandSummaryContract.nextActionLabel !== "Open class" ||
      economyCommandSummaryContract.mcqReady !== "false" ||
      !/teacher command/i.test(economyCommandSummaryContract.text) ||
      !/repair/i.test(economyCommandSummaryContract.text) ||
      !/check/i.test(economyCommandSummaryContract.text) ||
      !economyProgress?.teacherDoubtCategory ||
      !economyProgress?.teacherDoubtRepairAction ||
      !economyProgress?.teacherDoubtMasteryCheck ||
      economyProgress?.talkTeacherStatus !== "repair-required" ||
      economyProgress?.talkTeacherTurnCount !== 1
    ) {
      throw new Error(`Economy Talk adaptive doubt diagnosis did not persist correctly: ${JSON.stringify(economyProgress)}`);
    }
    const pageMetrics = await metrics(page);
    checks.push({
      viewport: "desktop",
      route: "economy-talk",
      routeInsideScoreCard: economyRouteInsideScoreCard,
      economyRouteGateContract,
      economyCommandSummaryContract,
      teacherConnectionText: economyTeacherConnectionText,
      doubtDiagnosis: {
        category: economyProgress.teacherDoubtCategory,
        repairAction: economyProgress.teacherDoubtRepairAction,
        masteryCheck: economyProgress.teacherDoubtMasteryCheck,
      },
      metrics: pageMetrics,
    });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Talk has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  async function verifyWeakInitialRecallDoesNotQueueRevisit() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await seedProfile(page);
    const key = storageKey("environment");
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[weak-recall] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[weak-recall] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/talk?day=6`, { waitUntil: "domcontentloaded" });
    await page.evaluate((storageKeyValue) => window.localStorage.removeItem(storageKeyValue), key);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 });
    await page.getByPlaceholder("Write the explanation", { exact: false }).fill(
      "I have seen this chapter before but I cannot explain it clearly. I remember some facts and need to learn the basics."
    );
    await page.getByRole("button", { name: /Assess explanation/i }).click();
    await page.getByTestId("talk-primary-route").getByText("Open class", { exact: false }).waitFor({ timeout: 15000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-testid="subject-talk-teacher-connection"]')?.textContent || "";
      return /guidance active|will retry later/i.test(text);
    }, null, { timeout: 15000 });
    const weakPrimaryRoute = await page.getByTestId("talk-primary-route").getAttribute("href");
    const initialProgress = await page.evaluate((storageKeyValue) => {
      const raw = window.localStorage.getItem(storageKeyValue);
      return raw ? JSON.parse(raw)["6"] : null;
    }, key);

    if (weakPrimaryRoute !== "/upsc/environment/watch?day=6") {
      throw new Error(`Weak initial recall should still open repair class first: ${weakPrimaryRoute}`);
    }
    if (initialProgress?.revisitQueued) {
      throw new Error(`Weak pre-repair recall should not queue Revisit yet: ${JSON.stringify(initialProgress)}`);
    }
    if (!initialProgress?.talkNextRoute?.includes("/watch")) {
      throw new Error(`Weak pre-repair recall should retain Watch as next route: ${JSON.stringify(initialProgress)}`);
    }
    if (initialProgress?.talkTeacherStatus !== "repair-required" || initialProgress?.talkTeacherTurnCount !== 1) {
      throw new Error(`Weak pre-repair recall should persist teacher repair status: ${JSON.stringify(initialProgress)}`);
    }

    await page.evaluate((storageKeyValue) => {
      const progress = JSON.parse(window.localStorage.getItem(storageKeyValue) || "{}");
      progress["6"] = {
        ...progress["6"],
        watched: true,
        watchState: "Watched",
        watchSceneCompletedIds: ["6-briefing", "6-mechanism", "6-application", "6-trap", "6-handoff"],
      };
      window.localStorage.setItem(storageKeyValue, JSON.stringify(progress));
    }, key);
    await page.goto(`${baseUrl}/upsc/environment?day=6`, { waitUntil: "networkidle", timeout: 45000 });
    await page.getByTestId("subject-command-action-route").waitFor({ timeout: 15000 });
    const afterWatchRoute = await page.getByTestId("subject-command-action-route").getAttribute("href");
    const afterWatchLabel = (await page.getByTestId("subject-command-action-route").innerText()).trim();
    if (afterWatchRoute !== "/upsc/environment/talk?day=6") {
      throw new Error(`After repair class, weak initial recall should return to Talk before Revisit: ${afterWatchRoute}`);
    }

    const pageMetrics = await metrics(page);
    checks.push({
      viewport: "desktop",
      route: "environment-weak-initial-recall",
      weakPrimaryRoute,
      afterWatchRoute,
      afterWatchLabel,
      initialProgress,
      metrics: pageMetrics,
    });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Weak recall route has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentTalk("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentTalk("mobile", { width: 390, height: 844 });
  await verifyEconomyTalk();
  await verifyWeakInitialRecallDoesNotQueueRevisit();

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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

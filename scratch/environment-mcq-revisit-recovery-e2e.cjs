const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-mcq-revisit-recovery-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9700 + index,
    topic_id: 700 + index,
    text_en: `Consider the following statements about protected areas, biodiversity hotspots, and corridors ${index}. Which option is correct?`,
    options_en: {
      A: "Core and buffer logic can vary by legal category and local rights",
      B: "All protected areas remove every human activity in the same way",
      C: "Hotspot status only means high animal population",
      D: "Corridors are irrelevant for fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      "The correct option links protected area category, habitat, species movement, governance mechanism, and impact because corridors and buffer rules shape conservation outcomes. The distractors fail by treating all categories as identical, ignoring endemism, and removing landscape process from the ecosystem.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "ENV-D05",
      subject: "Environment",
      day: "5",
      week: "1",
      chapter: "Biodiversity",
      topic: "Protected Areas",
      test_title: "Environment Day 5: Protected Areas",
      map_or_case_tag: "Great Indian Bustard grassland",
      pyq_linked: "No",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
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

  await page.goto(`${baseUrl}/upsc/environment/revisit?day=5`, { waitUntil: "networkidle" });
  await page.evaluate(({ progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, questions }) => {
    window.localStorage.setItem(
      localProgressKey,
      JSON.stringify({
        "5": {
          day: 5,
          watched: true,
          watchState: "Watched",
          watchMinutes: 90,
          watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
          confidence: "Shaky",
          reflection: "Protected areas are linked through category, map, species, threat, and institution.",
          revisitQueued: true,
          talkScore: 92,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          labCompleted: true,
          labMode: "biodiversity-map",
          labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
          labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
          mcqAttempted: true,
          mcqCompleted: true,
          mcqAnsweredCount: 3,
          mcqCorrectCount: 1,
          mcqTotal: 3,
          mcqScorePercent: 33,
          mcqLastBatchCode: "ENV-D05",
          mcqOutcome: "Revisit",
          mcqRecommendedRoute: "/upsc/environment/revisit?day=5",
          mcqReviewSummary: "1/3 correct (33%). Revisit queued for ENV-D05.",
          activePromptLabel: "MCQ Practice",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      localMcqKey,
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
    window.localStorage.setItem(
      localLocalDraftKey,
      JSON.stringify([
        {
          id: "environment-mcq-revisit-recovery",
          createdAt: new Date().toISOString(),
          importMode: "UPSC_MCQ_COMMAND",
          questions,
        },
      ])
    );
  }, { progressKey, mcqKey, localDraftKey, questions: [makeQuestion(1), makeQuestion(2), makeQuestion(3)] });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("revisit-mcq-summary").getByText("1/3 correct", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("MCQ retest after recovery", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-revisit-before-recovery", checks);

  await page.getByPlaceholder("Write the recovery note or corrected explanation here.").fill(
    "Recovered MCQ trap: protected area categories differ by notification, rights, core-buffer logic, habitat, corridor need, and species threat. I will retest the fresh batch now."
  );
  await page.getByRole("button", { name: /Mark recovered/i }).click();
  await page.getByTestId("revisit-return-gate").getByText("Retest the fresh MCQ batch", { exact: false }).waitFor({ timeout: 15000 });
  const routeHref = await page.getByTestId("revisit-primary-route").getAttribute("href");
  if (routeHref !== "/upsc/environment/mcq-readiness?day=5") {
    throw new Error(`MCQ recovery should route to MCQ readiness, got ${routeHref}`);
  }

  const recoveredProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
  if (
    recoveredProgress?.revisitQueued !== false ||
    recoveredProgress?.talkScore !== 92 ||
    recoveredProgress?.talkBand !== "Command" ||
    recoveredProgress?.talkUnlockStage !== "mcq" ||
    recoveredProgress?.labCompleted !== true ||
    recoveredProgress?.mcqAttempted !== undefined ||
    recoveredProgress?.mcqTotal !== undefined ||
    recoveredProgress?.mcqOutcome !== undefined ||
    recoveredProgress?.mcqReviewSummary !== undefined
  ) {
    throw new Error(`MCQ revisit recovery state is incorrect: ${JSON.stringify(recoveredProgress)}`);
  }
  await assertNoOverflow(page, "environment-mcq-revisit-after-recovery", checks);

  await page.getByTestId("revisit-primary-route").click();
  await page.waitForURL("**/upsc/environment/mcq-readiness?day=5", { timeout: 15000 });
  await page.getByTestId("environment-mcq-quality-score").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-revisit-retest-route", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/revisit?day=5`, { waitUntil: "networkidle" });
  await page.getByText("No revisit queue yet", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-revisit-mobile-cleared", checks);
  await page.screenshot({ path: path.join(__dirname, "environment-mcq-revisit-recovery-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    routeHref,
    recoveredProgress,
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

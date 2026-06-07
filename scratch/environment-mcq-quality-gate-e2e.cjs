const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-mcq-quality-gate-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index, overrides = {}) {
  const quality_notes = {
    batch_code: "ENV-D05",
    subject: "Environment",
    day: "5",
    week: "1",
    chapter: "Biodiversity",
    topic: "Protected Areas",
    test_title: "Environment Day 5: Protected Areas",
    map_or_case_tag: overrides.map_or_case_tag ?? "Great Indian Bustard grassland",
    pyq_linked: "No",
  };

  return {
    test_id: 9500 + index,
    topic_id: 500 + index,
    text_en:
      overrides.text_en ??
      `Consider the following statements about protected areas and biodiversity corridors ${index}. Which of the following is correct?`,
    options_en: {
      A: "Core and buffer logic can vary by legal category and local rights",
      B: "All protected areas remove every human activity in the same way",
      C: "Hotspot status only means high animal population",
      D: "Corridors are irrelevant for fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      overrides.explanation_en ??
      "The correct option links protected area category, habitat, species movement, governance mechanism, and impact because corridors and buffer rules shape conservation outcomes. The distractors fail by treating all categories as identical, ignoring endemism, and removing landscape process from the ecosystem.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes,
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

async function seed(page, questions, status = "READY") {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey, questions: localQuestions, status: localStatus }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            watchSceneCompletedIds: ["intro", "map", "law", "trap", "recap"],
            confidence: "Command",
            reflection: "Protected areas are linked through category, map, species, threat, and institution.",
            revisitQueued: false,
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            labCompleted: true,
            labMode: "biodiversity-map",
            labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
            labProofSummary: "Map proof saved for protected area categories and biodiversity cases.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "ENV-D05": {
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
            id: `environment-quality-${Date.now()}`,
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

  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle" });
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
      makeQuestion(1, { text_en: "Protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(2, { text_en: "Another protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeQuestion(3, { text_en: "Third protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
    ],
    "DRAFT"
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("environment-mcq-quality-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Student MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-route").getByText("Fix MCQ quality", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("environment-mcq-quality-explanation-depth").getByText("Mechanism explanation", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-quality-weak", checks);

  const weakScore = await page.getByTestId("environment-mcq-quality-score").textContent();
  const weakHref = await page.getByTestId("mcq-talk-route").getAttribute("href");
  if (weakHref !== "/admin/questions/bulk") {
    throw new Error(`Expected weak quality gate to route to bulk upload, got ${weakHref}`);
  }

  await seed(page, [makeQuestion(1), makeQuestion(2), makeQuestion(3)], "READY");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("environment-mcq-quality-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Student MCQ unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("environment-mcq-quality-score").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-route").getByText("Track progress", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-quality-strong", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/mcq-readiness?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("environment-mcq-quality-gate").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-mcq-quality-mobile", checks);
  await page.screenshot({ path: path.join(__dirname, "environment-mcq-quality-gate-final.png"), fullPage: true });

  const strongScore = await page.getByTestId("environment-mcq-quality-score").textContent();
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
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0 && strongHref === "/upsc/environment/track",
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

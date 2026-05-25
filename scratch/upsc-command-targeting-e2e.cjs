const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "upsc-command-targeting-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "upsc-command-targeting-final.png");
const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";
const subjectSlugs = [
  "geography",
  "environment",
  "disaster-management",
  "economy",
  "science-tech",
  "polity-governance",
  "internal-security-society",
  "history",
];
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function progressKey(slug) {
  return `sarit-upsc-${slug}-progress-v1`;
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function clearLocalState(page) {
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ slugs, contentKey, mcqKey }) => {
      for (const slug of slugs) window.localStorage.removeItem(`sarit-upsc-${slug}-progress-v1`);
      window.localStorage.removeItem(contentKey);
      window.localStorage.removeItem(mcqKey);
    },
    { slugs: subjectSlugs, contentKey: contentStorageKey, mcqKey: mcqStorageKey }
  );
}

async function seedEconomyMcqQueue(page) {
  await page.evaluate(
    ({ contentKey, mcqKey }) => {
      const fullProof = (day, labSlug) =>
        ["concept", "case", "institution", "trap", "answer"].map((stage) => `${day}-${labSlug}-${stage}`);

      window.localStorage.setItem(
        "sarit-upsc-economy-progress-v1",
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-application", "1-trap", "1-handoff"],
            talkScore: 88,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            confidence: "Command",
            reflection: "Macro circular flow complete.",
            labCompleted: true,
            labMode: "macro-flow-board",
            labProofCompletedIds: fullProof(1, "macro-flow-board"),
          },
          2: {
            day: 2,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["2-briefing", "2-mechanism", "2-application", "2-trap", "2-handoff"],
            talkScore: 88,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            confidence: "Command",
            reflection: "National income complete.",
            labCompleted: true,
            labMode: "macro-flow-board",
            labProofCompletedIds: fullProof(2, "macro-flow-board"),
          },
          3: {
            day: 3,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["3-briefing", "3-mechanism", "3-application", "3-trap", "3-handoff"],
            talkScore: 88,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            confidence: "Command",
            reflection: "Inflation complete.",
            labCompleted: true,
            labMode: "inflation-dashboard",
            labProofCompletedIds: fullProof(3, "inflation-dashboard"),
          },
        })
      );

      window.localStorage.setItem(
        contentKey,
        JSON.stringify({
          "economy:D01": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
          "economy:D02": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
          "economy:D03": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
        })
      );

      window.localStorage.setItem(
        mcqKey,
        JSON.stringify({
          "ECO-D01": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY" },
          "ECO-D02": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY" },
          "ECO-D03": { planned: 25, drafted: 10, difficulty: "MEDIUM", status: "DRAFT" },
        })
      );
    },
    { contentKey: contentStorageKey, mcqKey: mcqStorageKey }
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

  await clearLocalState(page);

  await page.goto(`${baseUrl}/upsc/content-command?subject=environment&day=5`, { waitUntil: "domcontentloaded" });
  await page.getByText("ENV-D05", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Mark content ready/i }).click();
  await page.getByText("Content state saved locally for environment:D05", { exact: false }).waitFor({ timeout: 15000 });
  let stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["environment:D05"], contentStorageKey);
  if (stored?.videoStatus !== "Ready" || stored?.notesStatus !== "Ready" || stored?.transcriptStatus !== "Ready") {
    throw new Error(`Content command did not save ENV-D05 readiness: ${JSON.stringify(stored)}`);
  }
  let pageMetrics = await metrics(page);
  checks.push({ route: "content-command-direct-target", stored, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Content command overflow: ${JSON.stringify(pageMetrics)}`);

  await page.goto(`${baseUrl}/upsc/mcq-command?subject=economy&day=3`, { waitUntil: "domcontentloaded" });
  await page.getByText("ECO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /^Mark ready$/i }).click();
  stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["ECO-D03"], mcqStorageKey);
  if (stored?.status !== "READY" || stored?.drafted !== stored?.planned) {
    throw new Error(`MCQ command did not save ECO-D03 readiness: ${JSON.stringify(stored)}`);
  }
  pageMetrics = await metrics(page);
  checks.push({ route: "mcq-command-direct-target", stored, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`MCQ command overflow: ${JSON.stringify(pageMetrics)}`);

  await clearLocalState(page);
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  const contentQueue = page.getByTestId("global-next-action-queue");
  await contentQueue.waitFor({ timeout: 15000 });
  await contentQueue.getByText("Content pending", { exact: false }).first().waitFor({ timeout: 15000 });
  await contentQueue.locator("a").filter({ hasText: "Geography" }).filter({ hasText: "Content pending" }).first().click();
  await page.waitForURL("**/upsc/content-command?subject=geography&day=1", { timeout: 15000 });
  await page.getByText("GEO-D01", { exact: false }).first().waitFor({ timeout: 15000 });

  await clearLocalState(page);
  await seedEconomyMcqQueue(page);
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  const mcqQueue = page.getByTestId("global-next-action-queue");
  await mcqQueue.waitFor({ timeout: 15000 });
  await mcqQueue.getByText("MCQ practice pending", { exact: false }).waitFor({ timeout: 15000 });
  await mcqQueue.getByText("25/25 fresh MCQs ready; student practice is still pending.", { exact: false }).waitFor({ timeout: 15000 });
  const economyPracticeCard = mcqQueue.locator("a").filter({ hasText: "Economy" }).filter({ hasText: "MCQ practice pending" }).first();
  const economyPracticeHref = await economyPracticeCard.getAttribute("href");
  if (economyPracticeHref !== "/upsc/economy/mcq-readiness?day=1") {
    throw new Error(`Economy practice queue should target day 1 MCQ practice, got ${economyPracticeHref}`);
  }
  await economyPracticeCard.click();
  await page.waitForURL("**/upsc/economy/mcq-readiness?day=1", { timeout: 30000 });
  await page.getByText("ECO-D01", { exact: false }).first().waitFor({ timeout: 15000 });
  pageMetrics = await metrics(page);
  checks.push({ route: "queue-to-command-targets", economyPracticeHref, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Queue targeting overflow: ${JSON.stringify(pageMetrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

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

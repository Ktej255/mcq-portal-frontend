const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "upsc-global-action-queue-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "upsc-global-action-queue-final.png");
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
const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function progressKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function proofIds(day, labSlug) {
  return ["concept", "case", "institution", "trap", "answer"].map((stage) => `${day}-${labSlug}-${stage}`);
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function seed(page) {
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ subjectSlugs: slugs, contentStorageKey: ck, mcqStorageKey: mk }) => {
      for (const slug of slugs) window.localStorage.removeItem(`sarit-upsc-${slug}-progress-v1`);
      window.localStorage.removeItem(ck);
      window.localStorage.removeItem(mk);

      window.localStorage.setItem(
        "sarit-upsc-polity-governance-progress-v1",
        JSON.stringify({
          2: {
            day: 2,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["2-briefing", "2-mechanism", "2-application", "2-trap", "2-handoff"],
            revisitQueued: true,
            talkScore: 35,
            talkBand: "Revisit",
            talkUnlockStage: "revisit",
            confidence: "Shaky",
            reflection: "Constitutional morality is not clear yet.",
          },
        })
      );

      window.localStorage.setItem(
        "sarit-upsc-environment-progress-v1",
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
            reflection: "Ecology foundation complete.",
            labCompleted: true,
            labMode: "ecosystem-board",
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `1-ecosystem-board-${stage}`),
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
            reflection: "Food chain logic complete.",
            labCompleted: true,
            labMode: "ecosystem-board",
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `2-ecosystem-board-${stage}`),
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
            reflection: "Biome logic complete.",
            labCompleted: true,
            labMode: "ecosystem-board",
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `3-ecosystem-board-${stage}`),
          },
          4: {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["4-briefing", "4-mechanism", "4-application", "4-trap", "4-handoff"],
            talkScore: 88,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            confidence: "Command",
            reflection: "Ecosystem services complete.",
            labCompleted: true,
            labMode: "ecosystem-board",
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `4-ecosystem-board-${stage}`),
          },
          5: {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
            talkScore: 74,
            talkBand: "Practice",
            talkUnlockStage: "lab",
            confidence: "Working",
            reflection: "Protected areas are partly clear.",
          },
        })
      );

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
            reflection: "Macro basics complete.",
            labCompleted: true,
            labMode: "macro-flow-board",
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `1-macro-flow-board-${stage}`),
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
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `2-macro-flow-board-${stage}`),
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
            reflection: "Inflation is linked to demand, supply, RBI and government.",
            labCompleted: true,
            labMode: "inflation-dashboard",
            labProofIndex: 4,
            labProofCompletedIds: ["concept", "case", "institution", "trap", "answer"].map((stage) => `3-inflation-dashboard-${stage}`),
            labProofSummary: "Inflation answer hook saved.",
          },
        })
      );

      window.localStorage.setItem(
        ck,
        JSON.stringify({
          "environment:D05": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
          "economy:D03": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
          "polity-governance:D02": { videoStatus: "Ready", notesStatus: "Ready", transcriptStatus: "Ready" },
        })
      );

      window.localStorage.setItem(
        mk,
        JSON.stringify({
          "ECO-D03": {
            planned: 25,
            drafted: 10,
            difficulty: "MEDIUM",
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          },
          "ENV-D01": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
          "ENV-D02": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
          "ENV-D03": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
          "ENV-D04": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
          "ECO-D01": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
          "ECO-D02": { planned: 25, drafted: 25, difficulty: "MEDIUM", status: "READY", updatedAt: new Date().toISOString() },
        })
      );
    },
    { subjectSlugs, contentStorageKey, mcqStorageKey }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  for (const namedPage of [page, mobilePage]) {
    namedPage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    namedPage.on("pageerror", (error) => pageErrors.push(error.message));
  }

  await seed(page);

  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  const dailyQueue = page.getByTestId("global-next-action-queue");
  await dailyQueue.waitFor({ timeout: 15000 });
  await dailyQueue.getByText("Polity and Governance", { exact: false }).waitFor({ timeout: 15000 });
  await dailyQueue.getByText("Revisit required", { exact: false }).waitFor({ timeout: 15000 });
  await dailyQueue.locator("a").filter({ hasText: "Environment" }).filter({ hasText: "MCQ practice pending" }).first().waitFor({ timeout: 15000 });
  await dailyQueue
    .locator("a")
    .filter({ hasText: "Environment" })
    .filter({ hasText: "25/25 fresh MCQs ready; student practice is still pending." })
    .first()
    .waitFor({ timeout: 15000 });
  await dailyQueue.locator("a").filter({ hasText: "Economy" }).filter({ hasText: "MCQ practice pending" }).first().waitFor({ timeout: 15000 });
  let pageMetrics = await metrics(page);
  checks.push({ route: "daily-command-queue", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Daily queue overflow: ${JSON.stringify(pageMetrics)}`);

  await page.goto(`${baseUrl}/upsc/readiness-audit`, { waitUntil: "domcontentloaded" });
  const auditQueue = page.getByTestId("readiness-next-action-queue");
  await auditQueue.waitFor({ timeout: 15000 });
  await auditQueue.getByText("Polity and Governance", { exact: false }).waitFor({ timeout: 15000 });
  await auditQueue.getByText("Revisit required", { exact: false }).waitFor({ timeout: 15000 });
  await auditQueue.locator("a").filter({ hasText: "Environment" }).filter({ hasText: "MCQ practice pending" }).first().waitFor({ timeout: 15000 });
  await auditQueue.locator("a").filter({ hasText: "Economy" }).filter({ hasText: "MCQ practice pending" }).first().waitFor({ timeout: 15000 });
  pageMetrics = await metrics(page);
  checks.push({ route: "readiness-audit-queue", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Readiness queue overflow: ${JSON.stringify(pageMetrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await mobilePage.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  await mobilePage.evaluate(
    ({ sourceKeys, contentStorageKey: ck, mcqStorageKey: mk }) => {
      for (const key of sourceKeys) {
        const value = window.localStorage.getItem(key);
        if (value) window.localStorage.setItem(key, value);
      }
      const content = window.localStorage.getItem(ck);
      if (content) window.localStorage.setItem(ck, content);
      const mcq = window.localStorage.getItem(mk);
      if (mcq) window.localStorage.setItem(mk, mcq);
    },
    { sourceKeys: subjectSlugs.map(progressKey), contentStorageKey, mcqStorageKey }
  );
  await seed(mobilePage);
  await mobilePage.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  await mobilePage.getByTestId("global-next-action-queue").waitFor({ timeout: 15000 });
  await mobilePage.getByTestId("global-next-action-queue").getByText("Revisit required", { exact: false }).waitFor({
    timeout: 15000,
  });
  pageMetrics = await metrics(mobilePage);
  checks.push({ route: "daily-command-queue-mobile", metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) throw new Error(`Mobile daily queue overflow: ${JSON.stringify(pageMetrics)}`);

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

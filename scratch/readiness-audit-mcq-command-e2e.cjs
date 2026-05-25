const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "readiness-audit-mcq-command-e2e-evidence.json");

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

async function getMetricValue(page, testId) {
  return (await page.getByTestId(testId).locator("p").nth(1).textContent())?.trim();
}

async function seedBatchReadyOnly(page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    const now = new Date().toISOString();

    window.localStorage.setItem(
      "sarit-upsc-content-command-v1",
      JSON.stringify({
        "environment:D05": {
          videoStatus: "Ready",
          notesStatus: "Ready",
          transcriptStatus: "Ready",
          sourceType: "Demo",
          contentNote: "Protected areas class ready.",
          updatedAt: now,
        },
      })
    );

    window.localStorage.setItem(
      "sarit-upsc-mcq-command-v1",
      JSON.stringify({
        "ENV-D05": {
          planned: 5,
          drafted: 5,
          difficulty: "HARD",
          status: "READY",
          updatedAt: now,
        },
      })
    );

    window.localStorage.setItem(
      "sarit-upsc-environment-progress-v1",
      JSON.stringify({
        5: {
          day: 5,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["hook", "concept", "case", "trap", "recap"],
          confidence: "Command",
          reflection: "Protected area categories and restrictions are clear.",
          talkScore: 92,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          labCompleted: true,
          labProofCompletedIds: ["concept", "map", "policy", "case", "trap"],
          updatedAt: now,
        },
      })
    );
  });
}

async function seedMcqCommand(page) {
  await page.evaluate(() => {
    const now = new Date().toISOString();
    const progress = JSON.parse(window.localStorage.getItem("sarit-upsc-environment-progress-v1") || "{}");
    progress[5] = {
      ...progress[5],
      mcqAttempted: true,
      mcqCompleted: true,
      mcqAnsweredCount: 5,
      mcqCorrectCount: 5,
      mcqTotal: 5,
      mcqScorePercent: 100,
      mcqLastBatchCode: "ENV-D05",
      mcqOutcome: "Command",
      mcqRecommendedRoute: "/upsc/environment/track?day=5",
      mcqReviewSummary: "Command score retained.",
      revisitQueued: false,
      updatedAt: now,
    };
    window.localStorage.setItem("sarit-upsc-environment-progress-v1", JSON.stringify(progress));
  });
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

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await seedBatchReadyOnly(page);

  await page.goto(`${baseUrl}/upsc/readiness-audit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Audit the UPSC portal before launch.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("audit-mcq-environment").waitFor({ timeout: 15000 });

  const batchOnly = {
    batchTotal: await getMetricValue(page, "audit-total-batch"),
    commandTotal: await getMetricValue(page, "audit-total-mcq-command"),
    environmentDetail: await page.getByTestId("audit-mcq-environment").textContent(),
  };

  if (batchOnly.batchTotal !== "1" || batchOnly.commandTotal !== "0") {
    throw new Error(`Batch-ready-only state counted incorrectly: ${JSON.stringify(batchOnly)}`);
  }
  if (!batchOnly.environmentDetail?.includes("Practice pending: 1") || !batchOnly.environmentDetail?.includes("Command cleared: 0/20")) {
    throw new Error(`Environment audit did not expose pending practice: ${batchOnly.environmentDetail}`);
  }
  await assertNoOverflow(page, "batch-ready-only-audit", checks);

  await seedMcqCommand(page);
  await page.getByRole("button", { name: /Refresh local audit/i }).click();
  await page.getByTestId("audit-mcq-environment").waitFor({ timeout: 15000 });

  const commandCleared = {
    batchTotal: await getMetricValue(page, "audit-total-batch"),
    commandTotal: await getMetricValue(page, "audit-total-mcq-command"),
    environmentDetail: await page.getByTestId("audit-mcq-environment").textContent(),
  };

  if (commandCleared.batchTotal !== "1" || commandCleared.commandTotal !== "1") {
    throw new Error(`MCQ Command state counted incorrectly: ${JSON.stringify(commandCleared)}`);
  }
  if (!commandCleared.environmentDetail?.includes("Practice pending: 0") || !commandCleared.environmentDetail?.includes("Command cleared: 1/20")) {
    throw new Error(`Environment audit did not expose command clearance: ${commandCleared.environmentDetail}`);
  }
  await assertNoOverflow(page, "mcq-command-cleared-audit", checks);

  const evidence = {
    baseUrl,
    batchOnly,
    commandCleared,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "readiness-audit-mcq-command-final.png"), fullPage: true });
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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-lab-proof-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-lab-proof-final.png");
const progressKey = "sarit-upsc-geography-progress-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function metrics(page) {
  return page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function assertNoOverflow(page, label, checks) {
  const pageMetrics = await metrics(page);
  checks.push({ label, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
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

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=10`, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        10: {
          day: 10,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["10-briefing", "10-mechanism", "10-map", "10-trap", "10-recap"],
          talkScore: 88,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkVerdict: "MCQ route conditionally unlocked.",
          confidence: "Command",
          reflection: "India map logic is ready for applied atlas proof.",
        },
      })
    );
  }, progressKey);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("india-layered-atlas").waitFor({ timeout: 15000 });
  await page.getByTestId("india-layer-national-parks").click();
  await page.getByTestId("geography-lab-proof-stages").waitFor({ timeout: 15000 });

  const proofLines = [
    "Concept lock: protected areas must be read with relief, river, forest type and state location.",
    "Map mechanism: national park location becomes meaningful when connected with foothill, floodplain or delta geography.",
    "India example: Jim Corbett links Terai-Bhabar foothills, riverine forest and tiger habitat.",
    "UPSC trap: protected area questions can mix state, river, biome and category, so label-only memory is weak.",
    "Answer hook: map the place first, then connect habitat, physical region, conservation category and one statement trap.",
  ];

  for (let index = 0; index < proofLines.length; index += 1) {
    await page.getByTestId("geography-lab-proof-input").fill(proofLines[index]);
    await page.getByTestId("geography-lab-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["10"];
        return (day?.labProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["10"], progressKey);
  if (!stored?.labCompleted || stored?.labMode !== "india-map" || stored?.labProofCompletedIds?.length !== 5) {
    throw new Error(`Lab proof did not complete correctly: ${JSON.stringify(stored)}`);
  }
  if (stored.labAtlasLayer !== "national-parks" || stored.labAtlasPoint !== "Jim Corbett NP") {
    throw new Error(`Atlas selection was not preserved: ${JSON.stringify(stored)}`);
  }
  checks.push({
    label: "stored-geography-lab-proof",
    labCompleted: stored.labCompleted,
    labMode: stored.labMode,
    labProofCompletedIds: stored.labProofCompletedIds,
    labAtlasLayer: stored.labAtlasLayer,
    labAtlasPoint: stored.labAtlasPoint,
  });
  await assertNoOverflow(page, "geography-lab-proof", checks);

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=10`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-lab-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-mcq-lab-proof-gate", checks);
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

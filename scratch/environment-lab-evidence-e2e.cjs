const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "environment-lab-evidence-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const completeSceneIds = [
  "5-briefing",
  "5-mechanism",
  "5-application",
  "5-trap",
  "5-handoff",
];

const seededProgress = {
  "5": {
    day: 5,
    watched: true,
    watchState: "Watched",
    watchMinutes: 90,
    watchSceneCompletedIds: completeSceneIds,
    reflection:
      "Protected areas explained through governance, map examples, legal categories, habitat logic, and UPSC statement traps.",
    talkScore: 91,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    confidence: "Command",
  },
};

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

  await page.goto(`${baseUrl}/upsc/environment`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, state, studentProfileKey }) => {
      window.localStorage.setItem(
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
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: progressKey, state: seededProgress, studentProfileKey: profileKey }
  );

  await page.goto(`${baseUrl}/upsc/environment/lab?mode=biodiversity-map&day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("subject-lab-one-action").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-visual-surface").getByText("Biodiversity Map", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-route-status").getByText("Practice locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-top-route").getByText("Complete proof below", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-command-board").locator("summary").click();
  await page.getByTestId("subject-lab-command-talk").getByText("91%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-evidence-deck").locator("summary").click();
  await page.getByText("Kaziranga Floodplain", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-evidence-card-5-biodiversity-map-3").click();
  await page.getByText("Great Indian Bustard Landscape", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-case").getByText("Species", { exact: false }).waitFor({ timeout: 15000 });

  await page.getByTestId("subject-lab-proof-engine").evaluate((element) => {
    element.open = true;
  });
  await page.getByTestId("subject-lab-proof-list").evaluate((element) => {
    element.open = true;
  });
  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("subject-lab-proof-complete").click();
  }

  await page.getByTestId("subject-lab-proof-status").getByText("5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-proof").getByText("5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-route").getByText("Locked", { exact: false }).waitFor({ timeout: 15000 });
  await page
    .getByPlaceholder("Write the concept, case, map point, or UPSC trap you can now explain.")
    .fill(
      "Great Indian Bustard proves grassland conservation is not forest-only protection; the UPSC trap is to ignore habitat category and power-line risk."
    );
  await page.getByRole("button", { name: /Save proof and continue/i }).click();
  await page.getByText("Lab saved locally", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-route-status").getByText("Practice open", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-top-route").getByText("Open fresh practice", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-save").getByText("Saved", { exact: false }).waitFor({ timeout: 15000 });

  const savedProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["5"], progressKey);
  if (!savedProgress?.labCompleted || savedProgress.labMode !== "biodiversity-map") {
    throw new Error(`Lab completion did not persist: ${JSON.stringify(savedProgress)}`);
  }
  if (!savedProgress.labFocus?.includes("Great Indian Bustard Landscape")) {
    throw new Error(`Selected evidence was not saved into labFocus: ${JSON.stringify(savedProgress)}`);
  }
  if (!Array.isArray(savedProgress.labProofCompletedIds) || savedProgress.labProofCompletedIds.length !== 5) {
    throw new Error(`Expected five lab proof ids, got ${JSON.stringify(savedProgress.labProofCompletedIds)}`);
  }

  const primaryHref = await page.getByTestId("lab-primary-route").getAttribute("href");
  if (!primaryHref?.includes("/upsc/environment/mcq-readiness?day=5")) {
    throw new Error(`Expected lab primary route to MCQ readiness, got ${primaryHref}`);
  }

  await assertNoOverflow(page, "environment-lab-evidence-desktop", checks);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/upsc/environment/lab?mode=biodiversity-map&day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("environment-lab-evidence-deck").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-lab-evidence-mobile", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    savedProgress,
    primaryHref,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "environment-lab-evidence-final.png"), fullPage: true });
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

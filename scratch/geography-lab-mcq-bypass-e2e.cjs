const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-lab-mcq-bypass-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-lab-mcq-bypass-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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
    throw new Error(`${label} still contains old protected branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
  );
}

async function saveCurrentStage(page, expectedCount) {
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.trim()) {
    throw new Error("Lab proof suggestion did not populate the proof input.");
  }
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForFunction(
    ({ key, expected }) => {
      const day = JSON.parse(window.localStorage.getItem(key) || "{}")["14"];
      return (day?.labProofCompletedIds?.length ?? 0) >= expected;
    },
    { key: progressKey, expected: expectedCount },
    { timeout: 15000 }
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_lab_mcq_bypass");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "14": {
          day: 14,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["14-briefing", "14-mechanism", "14-map", "14-trap", "14-recap"],
          talkScore: 86,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkClassroomStage: "examiner-verdict",
          talkNextRoute: "/upsc/geography/lab?mode=india-map&day=14",
          talkNextActionLabel: "Open visual lab",
          confidence: "Command",
          reflection: "Seeded Talk proof for Visual Lab MCQ bypass verification.",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=14`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-status").getByText("proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-direct-mcq-route").getByText("MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  const directRouteTagBefore = await page.getByTestId("lab-direct-mcq-route").evaluate((element) => element.tagName);
  const directRouteDisabledBefore = await page.getByTestId("lab-direct-mcq-route").isDisabled();
  const directRouteHrefBefore = await page.getByTestId("lab-direct-mcq-route").getAttribute("href");
  if (directRouteTagBefore !== "BUTTON" || !directRouteDisabledBefore || directRouteHrefBefore !== null) {
    throw new Error(
      `Direct MCQ route should be a disabled button before lab proof: ${JSON.stringify({
        directRouteTagBefore,
        directRouteDisabledBefore,
        directRouteHrefBefore,
      })}`
    );
  }
  await assertNoOverflow(page, "lab-mcq-direct-route-locked", checks);

  const stages = ["1. Concept lock", "2. Map mechanism", "3. India example", "4. UPSC trap", "5. Answer hook"];
  for (let index = 0; index < stages.length; index += 1) {
    await page.getByTestId("geography-lab-proof-stages").getByText(stages[index], { exact: false }).click();
    await saveCurrentStage(page, index + 1);
  }

  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-direct-mcq-route").getByText("MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  const directRouteTagAfter = await page.getByTestId("lab-direct-mcq-route").evaluate((element) => element.tagName);
  const directRouteHrefAfter = await page.getByTestId("lab-direct-mcq-route").getAttribute("href");
  if (directRouteTagAfter !== "A" || directRouteHrefAfter !== "/upsc/geography/mcq-readiness?day=14") {
    throw new Error(
      `Direct MCQ route should unlock after lab proof: ${JSON.stringify({
        directRouteTagAfter,
        directRouteHrefAfter,
      })}`
    );
  }

  const finalProgress = await getProgress(page, 14);
  if (
    finalProgress?.labCompleted !== true ||
    finalProgress?.labEvidenceStatus !== "mcq-ready" ||
    finalProgress?.labNextRoute !== "/upsc/geography/mcq-readiness?day=14" ||
    finalProgress?.labProofCompletedIds?.length !== 5
  ) {
    throw new Error(`Lab proof did not persist the unlocked MCQ route: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.getByTestId("lab-direct-mcq-route").click();
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=14", { timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-mcq-direct-route-unlocked", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=14`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-mcq-direct-route-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    directRouteTagBefore,
    directRouteDisabledBefore,
    directRouteHrefBefore,
    directRouteTagAfter,
    directRouteHrefAfter,
    finalProgress,
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

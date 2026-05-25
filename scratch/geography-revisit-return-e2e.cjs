const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-revisit-return-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

async function getProgress(page, day) {
  return page.evaluate(
    ({ storageKey: key, day: selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { storageKey, day }
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

  await page.goto(`${baseUrl}/upsc/geography/talk?day=5`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "5": {
          day: 5,
          watched: true,
          watchState: "Watched",
          watchMinutes: 75,
          watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-map", "5-trap", "5-recap"],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "I do not know this geography topic yet."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("MCQ locked: revisit first", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-weak-locked", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/revisit?day=5", { timeout: 15000 });
  await page.getByText("Focused recovery", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-from-talk-lock", checks);

  const recoveryLines = [
    "Recall proof: I can state the core variables and the exact concept boundary without reading notes.",
    "Explain proof: I can connect cause, mechanism and consequence in my own words.",
    "Map proof: I can place the topic on a real region, relief feature, river or climate belt.",
    "Trap proof: I can create one wrong UPSC statement and correct the exception.",
    "Retest proof: I can now face a fresh MCQ because the weak link has been rebuilt.",
  ];

  for (let index = 0; index < recoveryLines.length; index += 1) {
    await page.getByPlaceholder("Write the recovery note or corrected explanation here.").fill(recoveryLines[index]);
    await page.getByTestId("revisit-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["5"];
        return (day?.recoveryProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("revisit-return-gate").getByText("Recovery saved locally", { exact: false }).waitFor({
    timeout: 15000,
  });

  const recoveredProgress = await getProgress(page, 5);
  if (
    recoveredProgress?.revisitQueued !== false ||
    recoveredProgress?.recoveryCompleted !== true ||
    recoveredProgress?.recoveryProofCompletedIds?.length !== 5 ||
    recoveredProgress?.confidence !== "Working" ||
    recoveredProgress?.talkBand !== undefined ||
    recoveredProgress?.talkScore !== undefined
  ) {
    throw new Error(`Recovery did not reset the Talk gate correctly: ${JSON.stringify(recoveredProgress)}`);
  }

  const returnHref = await page.getByTestId("revisit-primary-route").getAttribute("href");
  if (returnHref !== "/upsc/geography/talk?day=5") {
    throw new Error(`Expected return to Talk route, got ${returnHref}`);
  }

  await page.getByTestId("revisit-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=5", { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-after-revisit-return", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-revisit-return-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    recoveredProgress,
    returnHref,
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

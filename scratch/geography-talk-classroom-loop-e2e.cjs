const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-classroom-loop-evidence.json");
const screenshotPath = path.join(__dirname, "geography-talk-classroom-loop-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    bodyText: document.body.innerText,
  }));

  checks.push({
    label,
    url: metrics.url,
    clientWidth: metrics.clientWidth,
    scrollWidth: metrics.scrollWidth,
    bodyScrollWidth: metrics.bodyScrollWidth,
    hasHorizontalOverflow: metrics.hasHorizontalOverflow,
  });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (/AntiGravity|ANTIGRAVITY|antigravity/i.test(metrics.bodyText)) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: storageKey, selectedDay: day }
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_talk_classroom_loop");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "8": {
          day: 8,
          watched: true,
          watchState: "Watched",
          watchMinutes: 90,
          watchSceneCompletedIds: ["8-briefing", "8-mechanism", "8-map", "8-trap", "8-recap"],
          watchHandoffReady: true,
          watchHandoffSummary:
            "India physiography must be explained through Himalayas, plains, plateau, desert, coast and islands. Relief controls rivers, climate, soils, agriculture and risk through location and slope.",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);

  await page.goto(`${baseUrl}/upsc/geography/talk?day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("talk-classroom-protocol").getByText("Interactive classroom protocol", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-stage-watch-proof").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-stage-student-explain").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-next-handoff").getByText("Assess explanation first", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "classroom-initial", checks);

  await page.getByTestId("talk-load-watch-recap").click();
  const loadedRecap = await page.getByTestId("talk-answer-draft").inputValue();
  if (!loadedRecap.includes("Relief controls rivers")) {
    throw new Error(`Watch recap did not load into Talk answer draft: ${loadedRecap}`);
  }

  await page.getByTestId("talk-answer-draft").fill(
    [
      "India physiography must be explained through Himalayas, northern plains, plateau, desert, coast and islands.",
      "Because relief controls slope and drainage, Himalayan rivers create floodplains while plateau rivers often form different valleys and basins.",
      "This mechanism affects climate, soils, agriculture and risk; for example western coastal relief changes rainfall while the Thar desert shows aridity.",
      "The map proof is India, Himalayas, plains, Deccan plateau, western coast and islands.",
      "UPSC can trap by saying relief alone always controls agriculture or by reversing Himalayan and peninsular river behaviour; exception and location matter.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-stage-peer-challenge").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-next-handoff").getByText("Answer peer challenge", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "classroom-after-first-assessment", checks);

  const preliminary = await getProgress(page, 8);
  if (
    preliminary?.talkClassroomStage !== "peer-challenge" ||
    preliminary?.talkNextActionLabel !== "Answer peer challenge" ||
    !String(preliminary?.talkNextRoute || "").includes("/upsc/geography/talk?day=8") ||
    preliminary?.talkDiscussionStep !== "challenge"
  ) {
    throw new Error(`Classroom peer challenge state did not persist: ${JSON.stringify(preliminary, null, 2)}`);
  }

  await page.getByTestId("talk-challenge-response").fill(
    [
      "The weak point is the map mechanism.",
      "Himalayas block and redirect winds, plains accumulate alluvium, plateau relief changes drainage, and the coast modifies rainfall and agriculture.",
      "Therefore location, slope, relief and climate must be read together.",
      "UPSC trap: not every plain, coast or plateau creates the same crop pattern because soil, rainfall and irrigation change the outcome.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-stage-examiner-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-next-handoff").getByText("Open visual lab", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "classroom-after-verdict", checks);

  const finalProgress = await getProgress(page, 8);
  if (
    finalProgress?.talkClassroomStage !== "examiner-verdict" ||
    finalProgress?.talkNextActionLabel !== "Open visual lab" ||
    !String(finalProgress?.talkNextRoute || "").includes("/upsc/geography/lab") ||
    finalProgress?.talkDiscussionStep !== "verdict" ||
    !["lab", "mcq"].includes(finalProgress?.talkUnlockStage)
  ) {
    throw new Error(`Classroom final verdict state did not persist: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("talk-classroom-protocol").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "classroom-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    preliminary,
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

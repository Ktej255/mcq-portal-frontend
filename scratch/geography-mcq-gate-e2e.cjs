const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-gate-e2e-evidence.json");
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

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=6`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ storageKey: localStorageKey, mcqKey: localMcqKey, localDraftKey: localLocalDraftKey }) => {
      window.localStorage.removeItem(localStorageKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localLocalDraftKey);
      window.localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          "6": {
            day: 6,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { storageKey, mcqKey, localDraftKey }
  );
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice blocked", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-locked", checks);

  const lockedTalkHref = await page.getByTestId("mcq-talk-route").getAttribute("href");
  if (lockedTalkHref !== "/upsc/geography/talk?day=6") {
    throw new Error(`Expected MCQ gate to route to Talk Day 6, got ${lockedTalkHref}`);
  }

  await page.getByTestId("mcq-talk-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=6", { timeout: 15000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    [
      "Ocean system links ocean relief, salinity, temperature and currents with climate.",
      "Warm and cold currents move heat across regions, shape coastal deserts, rainfall, fog and fisheries, and their direction depends on wind, rotation, coastline and basin pattern.",
      "Examples include cold currents near west coast deserts, warm currents increasing moisture, and upwelling improving fisheries.",
      "On a map the current-location pair is essential because UPSC can trap by reversing warm and cold currents or overgeneralizing salinity and temperature effects.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("Peer challenge pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-challenge-response").fill(
    [
      "Peer challenge response: Ocean currents must be attached to map proof.",
      "Cold currents near west coasts reduce evaporation and can create deserts, while upwelling improves fisheries.",
      "Warm currents increase moisture and fog risk in some coastal regions, but salinity alone never explains fisheries.",
      "UPSC can reverse warm and cold current effects, so the current-location pair is the trap.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-route-gate").getByText("Visual Lab required", { exact: false }).waitFor({ timeout: 15000 });

  const talkProgress = await getProgress(page, 6);
  if (!["Practice", "Command"].includes(talkProgress?.talkBand) || talkProgress?.revisitQueued !== false) {
    throw new Error(`Talk did not unlock MCQ readiness: ${JSON.stringify(talkProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=6`, { waitUntil: "networkidle" });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 0/5", { exact: false }).waitFor({ timeout: 15000 });
  const labRouteHref = await page.getByTestId("mcq-talk-route").getAttribute("href");
  if (labRouteHref !== "/upsc/geography/lab?mode=monsoon&day=6") {
    throw new Error(`Expected MCQ gate to route to Visual Lab Day 6, got ${labRouteHref}`);
  }
  await assertNoOverflow(page, "mcq-readiness-lab-locked", checks);

  await page.getByTestId("mcq-talk-route").click();
  await page.waitForURL("**/upsc/geography/lab?mode=monsoon&day=6", { timeout: 15000 });
  await page.getByText("Monsoon Simulator", { exact: false }).first().waitFor({ timeout: 15000 });

  const labProofLines = [
    "Concept lock: ocean current logic connects relief, current direction, salinity, temperature and coastal climate.",
    "Map mechanism: place warm and cold currents on coasts before explaining desert, fog or fisheries.",
    "India example: monsoon and coastal upwelling show why map location changes the climate outcome.",
    "UPSC trap: warm currents do not always mean rainfall and salinity alone never explains fisheries.",
    "Answer hook: identify the current, locate the coast, explain mechanism, then write the exception.",
  ];

  for (let index = 0; index < labProofLines.length; index += 1) {
    await page.getByTestId("geography-lab-proof-input").fill(labProofLines[index]);
    await page.getByTestId("geography-lab-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["6"];
        return (day?.labProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }
  await page.getByText("Lab saved locally", { exact: false }).waitFor({ timeout: 15000 });
  const labProgress = await getProgress(page, 6);
  if (!labProgress?.labCompleted || labProgress?.labMode !== "monsoon") {
    throw new Error(`Lab did not unlock the MCQ gate: ${JSON.stringify(labProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=6`, { waitUntil: "networkidle" });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice blocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-unlocked", checks);

  await page.evaluate(
    ({ mcqKey: localMcqKey, localDraftKey: localLocalDraftKey }) => {
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D06": {
            planned: 1,
            drafted: 1,
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
            id: "local-test-batch",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: [
              {
                test_id: 9001,
                topic_id: 9001,
                text_en: "Consider the following statements about ocean currents: which option correctly links current location, coastal desert, upwelling, fisheries and the UPSC trap?",
                options_en: {
                  A: "Cold currents reduce evaporation and can support upwelling",
                  B: "Warm currents always create deserts in every coastal region",
                  C: "Salinity alone explains all fisheries without upwelling or nutrients",
                  D: "Coastlines and current direction do not affect ocean current impacts",
                },
                correct_option: "A",
                explanation_en: "Cold currents can cool adjacent air, reduce evaporation and rainfall, and because upwelling brings nutrients to the surface, they can support fisheries. The map trap is to reverse warm and cold current effects or use salinity alone as the explanation.",
                difficulty: "MEDIUM",
                source: "UPSC_MCQ_COMMAND",
                status: "DRAFT",
                quality_notes: {
                  batch_code: "GEO-D06",
                  subject: "Geography",
                  day: "6",
                  chapter: "Physical Geography Foundation",
                  topic: "Ocean System",
                  map_or_case_tag: "Cold currents coastal desert upwelling fisheries",
                },
              },
            ],
          },
        ])
      );
    },
    { mcqKey, localDraftKey }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-mcq-quality-score").getByText("100", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-question-preview").getByText("which option correctly links current location", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 1", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-practice-score").getByText("Score 1/1", { exact: false }).waitFor({ timeout: 15000 });
  const mcqProgress = await getProgress(page, 6);
  if (
    !mcqProgress?.mcqAttempted ||
    !mcqProgress?.mcqCompleted ||
    mcqProgress?.mcqCorrectCount !== 1 ||
    mcqProgress?.mcqTotal !== 1 ||
    mcqProgress?.mcqScorePercent !== 100
  ) {
    throw new Error(`MCQ practice result did not persist correctly: ${JSON.stringify(mcqProgress)}`);
  }
  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByTestId("track-day-6").getByText("MCQ practice done / 1/1 correct", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-6").getByText("MCQ 1/1", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-practice-ready", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=6`, { waitUntil: "networkidle" });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-unlocked-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-mcq-gate-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    lockedTalkHref,
    labRouteHref,
    talkProgress,
    labProgress,
    mcqProgress,
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

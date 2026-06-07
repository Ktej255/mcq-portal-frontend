const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "subject-lab-proof-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-lab-proof-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function seedProfile(page) {
  await page.addInitScript((studentProfileKey) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_lab_proof");
    localStorage.setItem(
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
  }, profileKey);
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

function makeTalkClearedProgress(day, score = 82) {
  return {
    day,
    watched: true,
    watchState: "Watched",
    watchSceneCompletedIds: ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5"],
    reflection:
      "Student explained the concept with mechanism, example, actor, trap and revision hook before entering Visual Lab.",
    talkScore: score,
    talkBand: score >= 85 ? "Command" : "Practice",
    talkUnlockStage: score >= 85 ? "mcq" : "lab",
    talkVerdict: "Visual Lab unlocked after AI teacher check.",
    talkClassroomStage: "examiner-verdict",
    talkDiscussionStep: "verdict",
    updatedAt: new Date().toISOString(),
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentLab(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    await seedProfile(page);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/lab?mode=biodiversity-map&day=5`, {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-lab-talk-first-gate").waitFor({ timeout: 15000 });
    const gateText = await page.getByTestId("subject-lab-talk-first-gate").innerText();
    if (!gateText.includes("Explain the topic first")) {
      throw new Error(`${viewportName} lab should block visual proof until Talk is cleared.`);
    }
    const lockedOneActionCount = await page.getByTestId("subject-lab-one-action").count();
    if (lockedOneActionCount !== 0) {
      throw new Error(`${viewportName} lab should not show proof controls before Talk clearance.`);
    }
    const talkFirstHref = await page.getByTestId("subject-lab-talk-first-route").getAttribute("href");
    if (talkFirstHref !== "/upsc/environment/talk?day=5") {
      throw new Error(`${viewportName} lab Talk-first route is wrong: ${talkFirstHref}`);
    }

    await page.evaluate(
      ({ key, progress }) => {
        window.localStorage.setItem(key, JSON.stringify({ "5": progress }));
      },
      { key: storageKey("environment"), progress: makeTalkClearedProgress(5, 82) }
    );
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-lab-one-action").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-lab-proof-engine").waitFor({ timeout: 15000 });
    const oneActionText = await page.getByTestId("subject-lab-one-action").innerText();
    if (!oneActionText.includes("Write one line")) {
      throw new Error(`${viewportName} lab should lead with the one-line proof action.`);
    }
    const visualSurfaceOpen = await page
      .getByTestId("subject-lab-visual-surface")
      .evaluate((element) => Boolean(element.open));
    if (visualSurfaceOpen) {
      throw new Error(`${viewportName} visual board should start folded`);
    }
    const proofEngineOpen = await page
      .getByTestId("subject-lab-proof-engine")
      .evaluate((element) => Boolean(element.open));
    if (proofEngineOpen) {
      throw new Error(`${viewportName} proof stage drawer should start folded`);
    }
    const proofChecklistOpen = await page
      .getByTestId("subject-lab-proof-list")
      .evaluate((element) => Boolean(element.open));
    if (proofChecklistOpen) {
      throw new Error(`${viewportName} proof checklist should start folded`);
    }
    await page.locator('[data-testid="subject-lab-proof-engine"] > summary').click();
    await page.getByTestId("subject-lab-proof-list").waitFor({ timeout: 15000 });
    await page.getByText("1. Concept proof", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("Write this in your words", { exact: false }).waitFor({ timeout: 15000 });
    await page
      .getByPlaceholder("Write the concept, case, map point, or UPSC trap", { exact: false })
      .fill(
        "Biodiversity proof: classify protected area category, link the map region, species, threat, legal rule and institution. UPSC can create traps by mixing national park, sanctuary, biosphere reserve and conservation reserve permissions."
      );
    await page.getByRole("button", { name: /Save proof and continue/i }).click();
    await page.getByText("Lab saved locally", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("5/5 proof stages", { exact: false }).waitFor({ timeout: 15000 });

    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["5"] : null;
    }, storageKey("environment"));
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push({ viewport: viewportName, route: "environment-lab", progress, metrics: pageMetrics });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Lab has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (
      !progress?.labCompleted ||
      progress?.labMode !== "biodiversity-map" ||
      progress?.labProofCompletedIds?.length !== 5 ||
      progress?.labProofIndex !== 4 ||
      !progress?.labProofSummary
    ) {
      throw new Error(`Environment Lab proof state did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifyEconomyLab() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await seedProfile(page);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/economy/lab?mode=inflation-dashboard&day=3`, {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(
      ({ key, progress }) => {
        window.localStorage.setItem(key, JSON.stringify({ "3": progress }));
      },
      { key: storageKey("economy"), progress: makeTalkClearedProgress(3, 88) }
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("subject-lab-one-action").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-lab-proof-engine").waitFor({ timeout: 15000 });
    const proofEngineOpen = await page
      .getByTestId("subject-lab-proof-engine")
      .evaluate((element) => Boolean(element.open));
    if (proofEngineOpen) {
      throw new Error("Economy proof stage drawer should start folded");
    }
    const proofChecklistOpen = await page
      .getByTestId("subject-lab-proof-list")
      .evaluate((element) => Boolean(element.open));
    if (proofChecklistOpen) {
      throw new Error("Economy proof checklist should start folded");
    }
    await page.locator('[data-testid="subject-lab-proof-engine"] > summary').click();
    await page.getByTestId("subject-lab-proof-list").waitFor({ timeout: 15000 });
    await page.getByText("Write this in your words", { exact: false }).waitFor({ timeout: 15000 });

    const pageMetrics = await metrics(page);
    checks.push({ viewport: "desktop", route: "economy-lab", metrics: pageMetrics });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Lab has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentLab("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentLab("mobile", { width: 390, height: 844 });
  await verifyEconomyLab();

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

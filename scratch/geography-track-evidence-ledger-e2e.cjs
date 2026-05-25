const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-track-evidence-ledger-evidence.json");
const screenshotPath = path.join(__dirname, "geography-track-evidence-ledger-final.png");
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
    throw new Error(`${label} still shows old branding.`);
  }
}

async function seedEvidence(page) {
  await page.evaluate((key) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_track_evidence_ledger");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "13": {
          day: 13,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["13-briefing", "13-mechanism", "13-map", "13-trap", "13-recap"],
          talkScore: 88,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkClassroomStage: "examiner-verdict",
          talkNextRoute: "/upsc/geography/lab?mode=india-map&day=13",
          talkNextActionLabel: "Open visual lab",
          confidence: "Command",
          reflection: "Resources and Agriculture explanation passed Talk.",
          revisitQueued: false,
          labCompleted: true,
          labMode: "india-map",
          labProofCompletedIds: [
            "13-india-map-concept",
            "13-india-map-map",
            "13-india-map-example",
            "13-india-map-trap",
            "13-india-map-answer",
          ],
          labEvidenceStatus: "mcq-ready",
          labEvidenceAnchor: "Wildlife Sanctuaries: Wayanad WLS",
          labNextRoute: "/upsc/geography/mcq-readiness?day=13",
          labNextActionLabel: "Open MCQ readiness",
          labAtlasLayer: "wildlife-sanctuaries",
          labAtlasPoint: "Wayanad WLS",
          mcqAttempted: true,
          mcqCompleted: true,
          mcqCorrectCount: 22,
          mcqTotal: 25,
          mcqScorePercent: 88,
          mcqOutcome: "Command",
          mcqRecommendedRoute: "/upsc/geography/watch?day=14",
          updatedAt: new Date().toISOString(),
        },
        "15": {
          day: 15,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["15-briefing", "15-mechanism", "15-map", "15-trap", "15-recap"],
          confidence: "Working",
          reflection: "",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);
}

async function expectEvidence(page, id, statusText, detailText) {
  const row = page.getByTestId(id);
  await row.getByText(statusText, { exact: false }).first().waitFor({ timeout: 15000 });
  await row.getByText(detailText, { exact: false }).first().waitFor({ timeout: 15000 });
  return row.getAttribute("href");
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
  await seedEvidence(page);

  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-focused-evidence-ledger").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-focused-evidence-ledger").getByText("Tick status for this day", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-focused-evidence-ledger").getByText("100% ready", { exact: false }).waitFor({ timeout: 15000 });

  const watchHref = await expectEvidence(page, "geography-evidence-watch-proof", "Done", "5/5 scene proofs saved");
  const talkHref = await expectEvidence(page, "geography-evidence-talk-verdict", "Done", "88/100 Command verdict");
  const revisitHref = await expectEvidence(page, "geography-evidence-revisit-state", "Done", "No active recovery blocker");
  const labHref = await expectEvidence(page, "geography-evidence-lab-proof", "Done", "Wildlife Sanctuaries: Wayanad WLS");
  const mcqHref = await expectEvidence(page, "geography-evidence-mcq-outcome", "Done", "22/25 correct");

  const expectedHrefs = {
    watchHref: "/upsc/geography/watch?day=13",
    talkHref: "/upsc/geography/talk?day=13",
    revisitHref: "/upsc/geography/revisit?day=13",
    labHref: "/upsc/geography/lab?mode=india-map&day=13",
    mcqHref: "/upsc/geography/mcq-readiness?day=13",
  };
  const actualHrefs = { watchHref, talkHref, revisitHref, labHref, mcqHref };
  for (const [key, expected] of Object.entries(expectedHrefs)) {
    if (actualHrefs[key] !== expected) {
      throw new Error(`${key} expected ${expected}, got ${actualHrefs[key]}`);
    }
  }
  await assertNoOverflow(page, "evidence-ledger-command-day", checks);

  await page.goto(`${baseUrl}/upsc/geography/track?day=15`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-focused-evidence-ledger").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-evidence-watch-proof").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-evidence-talk-verdict").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-evidence-lab-proof").getByText("Blocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-evidence-mcq-outcome").getByText("Blocked", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "evidence-ledger-talk-pending-day", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-focused-evidence-ledger").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "evidence-ledger-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    actualHrefs,
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

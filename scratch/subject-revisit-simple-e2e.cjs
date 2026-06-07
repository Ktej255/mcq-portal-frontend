const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "subject-revisit-simple-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-revisit-simple-e2e.png");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} contains old protected branding.`);
  }
}

async function getProgress(page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["6"], progressKey);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(({ key, studentProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_revisit_simple");
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
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "6": {
          day: 6,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["a", "b", "c", "d", "e"],
          confidence: "Shaky",
          reflection: "I confuse protected area category, habitat type, species threat and institution role.",
          revisitQueued: true,
          activePromptLabel: "Apply",
          talkScore: 32,
          talkBand: "Revisit",
          assessmentSummary: "The answer needs a case, legal category and one UPSC exception before MCQs.",
          talkUnlockStage: "revisit",
          talkVerdict: "Revisit required.",
          talkDiscussionStep: "verdict",
          labProofCompletedIds: [],
        },
      })
    );
  }, { key: progressKey, studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/environment/revisit?day=6`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await page.getByTestId("revisit-simple-step").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-repair-gates").getByText("Optional gate snapshot", { exact: false }).waitFor({ timeout: 15000 });

  const nextRouteHiddenBeforeSave = (await page.getByTestId("revisit-primary-route").count()) === 0;
  if (!nextRouteHiddenBeforeSave) {
    throw new Error("Revisit should not show a next-route button before the repair note is saved.");
  }

  const checklistHiddenByDefault = !(await page.getByTestId("subject-revisit-step-recall").isVisible());
  if (!checklistHiddenByDefault) {
    throw new Error("Shared Revisit checklist should stay folded by default.");
  }
  const gateDetailsClosedByDefault = !(await page.getByTestId("revisit-repair-gates").getByText("Talk 32%", { exact: false }).isVisible());
  if (!gateDetailsClosedByDefault) {
    throw new Error("Revisit gate proof details should stay folded by default.");
  }

  await page.getByTestId("revisit-repair-gates").locator("summary").click();
  await page.getByTestId("revisit-repair-gates").getByText("Watch", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-repair-gates").getByText("Talk", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-repair-gates").getByText("Lab", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-repair-gates").locator("summary").click();

  await page.getByTestId("subject-revisit-repair-note").fill(
    "Recovered: separate legal category, habitat, species threat, map location and institution role before answering."
  );
  await page.getByTestId("subject-revisit-mark-recovered").click();
  await page.getByTestId("revisit-return-gate").getByText("Recovery saved locally", { exact: false }).waitFor({
    timeout: 15000,
  });

  const href = await page.getByTestId("revisit-primary-route").getAttribute("href");
  if (href !== "/upsc/environment/talk?day=6") {
    throw new Error(`Concept recovery should route back to Talk, got ${href}`);
  }

  const recovered = await getProgress(page);
  if (
    recovered?.revisitQueued !== false ||
    recovered?.confidence !== "Working" ||
    recovered?.talkScore !== undefined ||
    recovered?.talkBand !== undefined ||
    recovered?.talkUnlockStage !== undefined ||
    recovered?.talkDiscussionStep !== "explain" ||
    !recovered?.reflection?.includes("Recovery note")
  ) {
    throw new Error(`Shared Revisit did not reset concept gates correctly: ${JSON.stringify(recovered, null, 2)}`);
  }

  await page.getByTestId("subject-revisit-recovery-checklist").locator("summary").click();
  await page.getByTestId("subject-revisit-step-recall").waitFor({ state: "visible", timeout: 15000 });
  await assertNoOverflow(page, "subject-revisit-simple-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/revisit?day=6`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("revisit-simple-step").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "subject-revisit-simple-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const evidence = {
    baseUrl,
    checklistHiddenByDefault,
    gateDetailsClosedByDefault,
    nextRouteHiddenBeforeSave,
    href,
    recovered,
    checks,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

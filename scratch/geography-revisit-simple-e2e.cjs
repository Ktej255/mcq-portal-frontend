const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-revisit-simple-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-revisit-simple-e2e.png");

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
    throw new Error(`${label} still contains old protected branding.`);
  }
}

async function getDayProgress(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw)["1"] : null;
  }, storageKey);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_revisit_simple");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "1": {
          day: 1,
          watched: true,
          watchHandoffReady: true,
          reflection:
            "I understand Earth as a system, but my map proof is weak and I need to connect time, scale and direction.",
          talkScore: 42,
          talkBand: "Revisit",
          talkUnlockStage: "revisit",
          revisitQueued: true,
          recoveryWeakSkill: "Map proof",
          recoveryDiagnosisSummary:
            "The explanation names Earth systems but does not prove the idea with a map, scale or location cue.",
          talkRepairHints: ["Add one map cue, one India example and one UPSC trap before explaining again."],
          recoveryProofCompletedIds: [],
        },
      })
    );
  }, { key: storageKey, studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await page.getByTestId("geography-revisit-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-revisit-focus").getByText("Map proof", { exact: false }).waitFor({
    timeout: 15000,
  });

  const revisitShell = await page.getByTestId("geography-revisit-simple-panel").evaluate((element) => ({
    visibleMode: element.getAttribute("data-visible-mode"),
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  const actionCard = await page.getByTestId("geography-revisit-action-card").evaluate((element) => ({
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  const noteSurfaceVisible = await page.getByTestId("geography-revisit-note-surface").isVisible();
  const routeLogicClosedByDefault = await page.getByTestId("geography-revisit-path-strip").evaluate((element) => !element.open);
  if (
    revisitShell.visibleMode !== "one-note-one-action" ||
    revisitShell.studentSurface !== "repair-first" ||
    actionCard.studentSurface !== "primary-action" ||
    !noteSurfaceVisible ||
    !routeLogicClosedByDefault
  ) {
    throw new Error(
      `Revisit should start as one repair note and one action: ${JSON.stringify({
        revisitShell,
        actionCard,
        noteSurfaceVisible,
        routeLogicClosedByDefault,
      })}`
    );
  }

  const checklistHiddenByDefault = !(await page.getByTestId("revisit-proof-recall").isVisible());
  if (!checklistHiddenByDefault) {
    throw new Error("Recovery checklist proof buttons should be hidden until the folded checklist is opened.");
  }
  const finishDisabledBeforeNote = await page.getByTestId("revisit-complete-and-talk").isDisabled();
  if (!finishDisabledBeforeNote) {
    throw new Error("Short revision should require one repair note before returning to discussion.");
  }
  const pendingVisibleActionCount = await page.locator(
    '[data-testid="revisit-complete-and-talk"], [data-testid="revisit-primary-route"]'
  ).count();
  const pathStripText = ((await page.getByTestId("geography-revisit-path-strip").textContent()) || "").trim();
  const oneActionRule = ((await page.getByTestId("geography-revisit-one-action-rule").textContent()) || "").trim();
  if (pendingVisibleActionCount !== 1) {
    throw new Error(`Short revision should expose one pending action, found ${pendingVisibleActionCount}.`);
  }
  if (
    !pathStripText.includes("Gap") ||
    !pathStripText.includes("Repair note") ||
    !pathStripText.includes("Talk 95%") ||
    !pathStripText.includes("MCQ") ||
    !oneActionRule.includes("Write one corrected idea")
  ) {
    throw new Error(`Short revision should expose a simple return path: ${pathStripText} / ${oneActionRule}`);
  }

  await page.getByTestId("revisit-repair-note").fill(
    "I corrected the map proof by adding latitude, longitude, scale, direction and one India example."
  );
  await page.getByTestId("revisit-repair-note").blur();
  await page.getByText("Repair note saved.", { exact: true }).waitFor({ timeout: 15000 });

  const afterNote = await getDayProgress(page);
  if (!afterNote?.recoverySummary?.includes("latitude")) {
    throw new Error(`Repair note was not persisted: ${JSON.stringify(afterNote, null, 2)}`);
  }

  await page.getByTestId("geography-revisit-checklist").locator("summary").click();
  await page.getByTestId("revisit-proof-recall").waitFor({ state: "visible", timeout: 15000 });
  await assertNoOverflow(page, "revisit-simple-desktop", checks);

  await page.getByTestId("revisit-complete-and-talk").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });

  const afterComplete = await getDayProgress(page);
  const expectedIds = ["recall", "explain", "map", "trap", "retest"].map((stage) => `1-recovery-${stage}`);
  const missingIds = expectedIds.filter((id) => !afterComplete?.recoveryProofCompletedIds?.includes(id));
  if (
    afterComplete?.recoveryCompleted !== true ||
    afterComplete?.revisitQueued !== false ||
    afterComplete?.recoveryStatus !== "talk-ready" ||
    missingIds.length > 0 ||
    Object.prototype.hasOwnProperty.call(afterComplete, "talkScore") ||
    Object.prototype.hasOwnProperty.call(afterComplete, "talkBand")
  ) {
    throw new Error(`Recovery completion did not persist cleanly: ${JSON.stringify(afterComplete, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/revisit?day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("geography-revisit-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-primary-route").waitFor({ timeout: 15000 });
  const completedVisibleActionCount = await page.locator(
    '[data-testid="revisit-complete-and-talk"], [data-testid="revisit-primary-route"]'
  ).count();
  if (completedVisibleActionCount !== 1) {
    throw new Error(`Completed revision should expose one return action, found ${completedVisibleActionCount}.`);
  }
  await assertNoOverflow(page, "revisit-simple-mobile", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const evidence = {
    baseUrl,
    revisitShell,
    actionCard,
    noteSurfaceVisible,
    routeLogicClosedByDefault,
    checklistHiddenByDefault,
    finishDisabledBeforeNote,
    pendingVisibleActionCount,
    completedVisibleActionCount,
    pathStripText,
    oneActionRule,
    afterNote,
    afterComplete,
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

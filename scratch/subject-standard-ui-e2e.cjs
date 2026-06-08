const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "subject-standard-ui-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-standard-ui-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const subjects = [
  { slug: "environment", title: "Environment", accent: "#1d9e75", dark: "#123c31", light: "#e7f5ee", expectedGs: "GS Paper III" },
  { slug: "economy", title: "Economy", accent: "#2563eb", dark: "#172554", light: "#eff6ff", expectedGs: "GS Paper III" },
  { slug: "disaster-management", title: "Disaster Management", accent: "#d97706", dark: "#3a2515", light: "#fff4df", expectedGs: "GS Paper III" },
  { slug: "polity-governance", title: "Polity and Governance", accent: "#7c3aed", dark: "#312e81", light: "#f5f3ff", expectedGs: "GS Paper II" },
  { slug: "science-tech", title: "Science and Technology", accent: "#0891b2", dark: "#164e63", light: "#ecfeff", expectedGs: "GS Paper III" },
  { slug: "internal-security-society", title: "Internal Security and Society", accent: "#b45309", dark: "#451a03", light: "#fff7ed", expectedGs: "GS Paper I/III" },
  { slug: "history", title: "History", accent: "#be123c", dark: "#4c0519", light: "#fff1f2", expectedGs: "GS Paper I" },
];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

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

async function inspectSubject(page, subject, checks) {
  await page.addInitScript((studentProfileKey) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_standard_ui");
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
  await page.goto(`${baseUrl}/upsc/${subject.slug}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey(subject.slug));
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  const shell = page.getByTestId("subject-standard-shell");
  await shell.waitFor({ timeout: 15000 });
  await page.getByTestId("subject-simple-student-flow").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-student-instruction").getByText("First action", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-action-route").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-four-signal-grid").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-signal-todays-task").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-signal-learning-gap").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-signal-next-revision").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-signal-current-path").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-context-details").waitFor({ timeout: 15000 });

  const simpleFlowProof = await page.getByTestId("subject-simple-student-flow").evaluate((node) => ({
    mode: node.getAttribute("data-visible-mode"),
    count: node.getAttribute("data-essential-signal-count"),
    signals: node.getAttribute("data-essential-signals"),
    primaryActionHref: node.getAttribute("data-primary-action-href"),
    activeSubject: node.getAttribute("data-active-subject"),
    activeDay: node.getAttribute("data-active-day"),
    currentReadiness: node.getAttribute("data-current-readiness"),
  }));
  const signalCount = await page.locator('[data-testid^="subject-signal-"]').count();
  const signalIds = await page.locator('[data-testid^="subject-signal-"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-testid"))
  );
  const todaysTaskSignal = await page.getByTestId("subject-signal-todays-task").evaluate((node) => ({
    priority: node.getAttribute("data-signal-priority"),
    route: node.getAttribute("data-signal-route"),
    text: node.textContent || "",
  }));
  const currentPathSignal = await page.getByTestId("subject-signal-current-path").evaluate((node) => ({
    week: node.getAttribute("data-current-week"),
    day: node.getAttribute("data-current-day"),
    totalDays: node.getAttribute("data-total-days"),
    sprintProgress: node.getAttribute("data-sprint-progress"),
    text: node.textContent || "",
  }));

  if (
    simpleFlowProof.mode !== "four-signal-one-action" ||
    simpleFlowProof.count !== "4" ||
    simpleFlowProof.signals !== "todays-task|learning-gap|next-revision|current-path" ||
    simpleFlowProof.activeSubject !== subject.slug ||
    simpleFlowProof.activeDay !== "1" ||
    !simpleFlowProof.primaryActionHref ||
    !simpleFlowProof.currentReadiness ||
    signalCount !== 4 ||
    signalIds.join("|") !==
      "subject-signal-todays-task|subject-signal-learning-gap|subject-signal-next-revision|subject-signal-current-path" ||
    todaysTaskSignal.priority !== "primary" ||
    todaysTaskSignal.route !== simpleFlowProof.primaryActionHref ||
    !todaysTaskSignal.text.includes("Today's task") ||
    currentPathSignal.day !== "1" ||
    currentPathSignal.week !== "1" ||
    currentPathSignal.totalDays === "0" ||
    !currentPathSignal.sprintProgress ||
    !currentPathSignal.text.includes("Current path")
  ) {
    throw new Error(
      `${subject.slug} simple four-signal contract failed: ${JSON.stringify({
        simpleFlowProof,
        signalCount,
        signalIds,
        todaysTaskSignal,
        currentPathSignal,
      })}`
    );
  }

  const contextOpenBefore = await page.getByTestId("subject-command-context-details").evaluate((element) => element.open);
  const syllabusVisibleBefore = await page.getByTestId("subject-command-syllabus-anchor").isVisible();
  if (contextOpenBefore || syllabusVisibleBefore) {
    throw new Error(
      `${subject.slug} should keep syllabus and context folded on first load: ${JSON.stringify({
        contextOpenBefore,
        syllabusVisibleBefore,
      })}`
    );
  }

  await page.getByTestId("subject-command-context-details").locator(":scope > summary").click();
  await page.getByTestId("subject-command-syllabus-anchor").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("subject-command-input-rule").waitFor({ state: "visible", timeout: 15000 });
  const syllabusText = (await page.getByTestId("subject-command-syllabus-anchor").innerText()).trim();
  if (!syllabusText.includes(subject.expectedGs) || !syllabusText.includes("Daily focus")) {
    throw new Error(`Subject syllabus anchor mismatch for ${subject.slug}: ${syllabusText}`);
  }

  const plannerOpenBefore = await page.getByTestId("subject-planner-details").evaluate((element) => element.open);
  const baselineTextareaCount = await page.getByTestId("subject-command-baseline-draft").count();
  const baselineSaveCount = await page.getByTestId("subject-command-save-baseline").count();
  const inputRuleText = (await page.getByTestId("subject-command-input-rule").innerText()).trim();
  const profileSummary = (await page.getByTestId("subject-command-profile-summary").innerText()).trim();
  const loopVisibleBeforeOpen = await page.getByTestId("subject-loop-actions").first().isVisible();
  if (
    plannerOpenBefore ||
    contextOpenBefore ||
    baselineTextareaCount !== 0 ||
    baselineSaveCount !== 0 ||
    !inputRuleText.includes("Speak first inside Talk") ||
    !/Advanced/i.test(profileSummary) ||
    !/120 min/i.test(profileSummary) ||
    loopVisibleBeforeOpen
  ) {
    throw new Error(
      `${subject.slug} should keep optional areas folded while using the saved profile summary: ${JSON.stringify({
        plannerOpenBefore,
        baselineTextareaCount,
        baselineSaveCount,
        inputRuleText,
        profileSummary,
        loopVisibleBeforeOpen,
      })}`
    );
  }

  await page.getByTestId("subject-planner-details").locator(":scope > summary").click();
  const loop = page.getByTestId("subject-loop-actions").first();
  await loop.waitFor({ state: "visible", timeout: 15000 });
  await loop.getByTestId("subject-loop-one-action").waitFor({ timeout: 15000 });
  const roomSwitcherOpenBefore = await loop
    .getByTestId("subject-loop-room-switcher")
    .evaluate((element) => element.open);

  const theme = await shell.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      subject: node.getAttribute("data-subject"),
      accentAttr: node.getAttribute("data-subject-accent"),
      darkAttr: node.getAttribute("data-subject-dark"),
      lightAttr: node.getAttribute("data-subject-light"),
      accentVar: styles.getPropertyValue("--subject-accent").trim(),
      darkVar: styles.getPropertyValue("--subject-dark").trim(),
      lightVar: styles.getPropertyValue("--subject-light").trim(),
    };
  });

  const loopTheme = await loop.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      subject: node.getAttribute("data-subject"),
      accentAttr: node.getAttribute("data-subject-accent"),
      accentVar: styles.getPropertyValue("--subject-accent").trim(),
      linkCount: node.querySelectorAll("a").length,
    };
  });

  if (
    theme.subject !== subject.slug ||
    theme.accentAttr !== subject.accent ||
    theme.darkAttr !== subject.dark ||
    theme.lightAttr !== subject.light ||
    theme.accentVar !== subject.accent ||
    theme.darkVar !== subject.dark ||
    theme.lightVar !== subject.light
  ) {
    throw new Error(`Subject shell theme mismatch for ${subject.slug}: ${JSON.stringify(theme)}`);
  }

  if (loopTheme.subject !== subject.slug || loopTheme.accentAttr !== subject.accent || loopTheme.accentVar !== subject.accent || loopTheme.linkCount < 6) {
    throw new Error(`Subject loop theme mismatch for ${subject.slug}: ${JSON.stringify(loopTheme)}`);
  }

  if (roomSwitcherOpenBefore) {
    throw new Error(`Subject loop room switcher should start folded for ${subject.slug}.`);
  }

  const actionHref = await page.getByTestId("subject-command-action-route").getAttribute("href");
  const actionLabel = (await page.getByTestId("subject-command-action-route").innerText()).trim();
  if (actionHref !== `/upsc/${subject.slug}/talk?day=1` || !/Start recall/i.test(actionLabel)) {
    throw new Error(`Fresh student should start with recall for ${subject.slug}: ${JSON.stringify({ actionHref, actionLabel })}`);
  }

  await assertNoOverflow(page, `${subject.slug}-desktop`, checks);
  return { theme, loopTheme, actionHref, actionLabel, syllabusText, simpleFlowProof, signalIds };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const inspected = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const subject of subjects) {
    inspected.push({ subject: subject.slug, ...(await inspectSubject(page, subject, checks)) });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await inspectSubject(page, subjects[1], checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    inspected,
    checks,
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

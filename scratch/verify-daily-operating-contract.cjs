const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-daily-operating-contract-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const dailyCommandKey = "sarit-upsc-daily-command-v1";
const questionBankAttemptKey = "sarit-upsc-question-bank-attempts-v1";

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

async function seedLocalSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, dailyStorageKey, attemptStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_daily_operating_contract");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "intermediate",
          preparationStage: "coaching-complete",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(dailyStorageKey, JSON.stringify({ subjectSlug: "geography", day: 1 }));
      window.localStorage.removeItem(progressStorageKey);
      window.localStorage.removeItem(attemptStorageKey);
    },
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey,
      dailyStorageKey: dailyCommandKey,
      attemptStorageKey: questionBankAttemptKey,
    }
  );
}

async function readContractState(page, label, checks) {
  await page.getByTestId("daily-new-day-operating-contract").waitFor({ timeout: 15000 });
  const state = await page.evaluate(() => {
    const contract = document.querySelector('[data-testid="daily-new-day-operating-contract"]');
    const rows = [...document.querySelectorAll('[data-testid="daily-operating-contract-row"]')].map((row) => ({
      id: row.getAttribute("data-contract-id"),
      status: row.getAttribute("data-status"),
      href: row.getAttribute("data-href"),
      text: row.textContent || "",
    }));
    const meTime = document.querySelector('[data-testid="daily-me-time-checkin"]');
    const focus = document.querySelector('[data-testid="daily-command-student-focus"]');
    const funnel = document.querySelector('[data-testid="daily-student-learning-funnel"]');

    return {
      contract: {
        rule: contract?.getAttribute("data-contract-rule"),
        rowCount: contract?.getAttribute("data-row-count"),
        activeSubject: contract?.getAttribute("data-active-subject"),
        activeDay: contract?.getAttribute("data-active-day"),
        questionBankDifficulty: contract?.getAttribute("data-question-bank-difficulty"),
        questionBankCount: contract?.getAttribute("data-question-bank-count"),
        questionBankLevel: contract?.getAttribute("data-question-bank-level"),
        questionBankScore: contract?.getAttribute("data-question-bank-score"),
        questionBankMix: contract?.getAttribute("data-question-bank-mix"),
        reportHref: contract?.getAttribute("data-report-href"),
        nextDayRoute: contract?.getAttribute("data-next-day-route"),
        text: contract?.textContent || "",
      },
      rows,
      meTime: {
        activeMood: meTime?.getAttribute("data-active-mood"),
        completed: meTime?.getAttribute("data-completed"),
      },
      focus: {
        mode: focus?.getAttribute("data-visible-mode"),
        readinessStatus: focus?.getAttribute("data-readiness-status"),
        readinessScore: focus?.getAttribute("data-readiness-score"),
        nextActionHref: focus?.getAttribute("data-next-action-href"),
        questionBankAttempts: focus?.getAttribute("data-question-bank-attempts"),
      },
      funnel: {
        stepCount: funnel?.getAttribute("data-step-count"),
        gapTitle: funnel?.getAttribute("data-gap-title"),
        todayTask: funnel?.getAttribute("data-today-task"),
        revisionLabel: funnel?.getAttribute("data-revision-label"),
        nextRoute: funnel?.getAttribute("data-next-route"),
        decision: funnel?.getAttribute("data-decision"),
      },
    };
  });

  checks.push({ label, state });
  return state;
}

function requireContractShell(state, label) {
  const rowsById = new Map(state.rows.map((row) => [row.id, row]));
  const expectedIds = ["me-time", "recall-gap", "class-discussion", "adaptive-mcq", "revision-report", "next-day"];

  if (
    state.contract.rule !== "me-time-recall-gap-class-discussion-mcq-revision-report-next-day" ||
    state.contract.rowCount !== "6" ||
    state.contract.activeSubject !== "geography" ||
    state.contract.activeDay !== "1" ||
    !state.contract.questionBankDifficulty ||
    Number(state.contract.questionBankCount) < 5 ||
    !state.contract.questionBankLevel ||
    Number(state.contract.questionBankScore) < 0 ||
    !state.contract.questionBankMix?.includes("EASY:") ||
    state.contract.reportHref !== "/reports" ||
    !state.contract.nextDayRoute ||
    state.rows.length !== 6 ||
    expectedIds.some((id) => !rowsById.has(id))
  ) {
    throw new Error(`${label}: contract shell failed: ${JSON.stringify(state.contract)}`);
  }

  const mcq = rowsById.get("adaptive-mcq");
  const report = rowsById.get("revision-report");
  const nextDay = rowsById.get("next-day");
  if (
    mcq.href !== "/upsc/question-bank?subject=geography" ||
    !/set/i.test(mcq.text) ||
    report.href !== "/reports" ||
    !/weekly and monthly reports/i.test(report.text) ||
    !nextDay.href
  ) {
    throw new Error(`${label}: contract row links/proof failed: ${JSON.stringify({ mcq, report, nextDay })}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedLocalSession(page);
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "networkidle", timeout: 45000 });
  const initialState = await readContractState(page, "initial-contract", checks);
  requireContractShell(initialState, "initial-contract");

  const initialRows = new Map(initialState.rows.map((row) => [row.id, row]));
  if (
    initialRows.get("me-time")?.status !== "pending" ||
    initialState.meTime.completed !== "false" ||
    initialState.focus.readinessStatus !== "Mind-state first" ||
    initialState.focus.readinessScore !== "0" ||
    initialState.funnel.stepCount !== "4"
  ) {
    throw new Error(`initial-contract state failed: ${JSON.stringify(initialState)}`);
  }
  await assertNoOverflow(page, "daily-contract-desktop-initial", checks);

  await page.getByTestId("daily-me-time-focused").click();
  await page.waitForFunction(
    (progressStorageKey) => {
      const raw = window.localStorage.getItem(progressStorageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed?.["1"]?.meTimeMood === "focused" && Boolean(parsed?.["1"]?.meTimeCompletedAt);
    },
    progressKey,
    { timeout: 15000 }
  );

  const focusedState = await readContractState(page, "focused-contract", checks);
  requireContractShell(focusedState, "focused-contract");
  const focusedRows = new Map(focusedState.rows.map((row) => [row.id, row]));
  if (
    focusedRows.get("me-time")?.status !== "ready" ||
    focusedState.meTime.activeMood !== "focused" ||
    focusedState.meTime.completed !== "true" ||
    focusedState.focus.readinessStatus !== "Recall first" ||
    focusedState.focus.readinessScore !== "20" ||
    !focusedRows.get("recall-gap")?.text.includes("Recall baseline pending")
  ) {
    throw new Error(`focused-contract state failed: ${JSON.stringify(focusedState)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("daily-new-day-operating-contract").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "daily-contract-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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

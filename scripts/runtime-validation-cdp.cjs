const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const FRONTEND = process.env.MCQ_FRONTEND || "https://mcq-portal-frontend.vercel.app";
const CDP = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(process.cwd(), "validation-artifacts", `runtime-${stamp}`);

fs.mkdirSync(outDir, { recursive: true });

const evidence = {
  startedAt: new Date().toISOString(),
  frontend: FRONTEND,
  cdpEndpoint: CDP,
  screenshots: [],
  requests: [],
  responses: [],
  console: [],
  pageErrors: [],
  failedRequests: [],
  observations: [],
  flow: {},
};

function writeEvidence() {
  fs.writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify(evidence, null, 2));
}

function apiRelated(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes("mcq-backend") || u.pathname.includes("/api/v1/");
  } catch {
    return false;
  }
}

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  evidence.screenshots.push(file);
}

async function settle(page, ms = 1800) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(ms);
}

async function bodyText(page) {
  return page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
}

async function snapshot(page, label) {
  const data = await page.evaluate(() => {
    const debug = window.MCQ_DEBUG || null;
    const local = {};
    for (const key of ["mcq-exam-storage", "mcq-timer-storage"]) {
      local[key] = localStorage.getItem(key);
    }
    return {
      url: location.href,
      title: document.title,
      bodyText: (document.body?.innerText || "").slice(0, 3500),
      debug,
      localStorage: local,
    };
  }).catch((err) => ({ url: page.url(), error: err.message }));
  evidence.observations.push({ label, snapshot: data });
  return data;
}

async function clickFirst(page, selectors, label, options = {}) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click(options).catch(async () => {
        await loc.click({ force: true, ...options });
      });
      evidence.observations.push({ label, clicked: selector });
      return selector;
    }
  }
  evidence.observations.push({ label, clicked: null });
  return null;
}

async function requireAuthenticated(page) {
  const text = await bodyText(page);
  if (/Continue with Google|Authorized access only|login/i.test(text) && page.url().includes("/login")) {
    throw new Error("Browser session is not authenticated. Login screen rendered.");
  }
}

async function requirePageUsable(page, label) {
  const text = await bodyText(page);
  if (/This page couldn.t load|Reload to try again|Application error|Critical Error/i.test(text)) {
    await shot(page, `${label}-unusable`);
    throw new Error(`${label} is not usable: ${text.slice(0, 300)}`);
  }
}

async function requireClick(page, selectors, label, options = {}) {
  const clicked = await clickFirst(page, selectors, label, options);
  if (!clicked) throw new Error(`Required click failed: ${label}`);
  return clicked;
}

async function answerCurrentQuestion(page, label, confidenceText) {
  await requireClick(page, [
    "label:has([role='radio'])",
    "[role='radio']",
    "input[type='radio']",
  ], `${label}-select-answer`);
  await settle(page, 700);
  if (confidenceText) {
    await requireClick(page, [
      `button:has-text("${confidenceText}")`,
      `text=${confidenceText}`,
      "button:has-text('Fairly')",
      "button:has-text('Educated')",
      "button:has-text('100')",
    ], `${label}-confidence`);
  }
  await settle(page, 2600);
}

async function currentExamState(page, label) {
  const state = await page.evaluate(() => {
    const buttonTexts = Array.from(document.querySelectorAll("button")).map((b) => ({
      text: b.innerText,
      className: b.className,
      disabled: b.disabled,
    })).slice(0, 80);
    return {
      url: location.href,
      timerText: Array.from(document.querySelectorAll("*")).map((e) => e.textContent || "").find((t) => /\b\d{2}:\d{2}(:\d{2})?\b/.test(t)) || null,
      storageExam: localStorage.getItem("mcq-exam-storage"),
      storageTimer: localStorage.getItem("mcq-timer-storage"),
      buttons: buttonTexts,
    };
  }).catch((err) => ({ error: err.message }));
  evidence.observations.push({ label, state });
  return state;
}

(async () => {
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    evidence.console.push({ url: page.url(), type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (err) => {
    evidence.pageErrors.push({ url: page.url(), message: err.message, stack: err.stack });
  });
  page.on("request", (req) => {
    if (!apiRelated(req.url())) return;
    evidence.requests.push({
      at: new Date().toISOString(),
      url: req.url(),
      method: req.method(),
      headers: req.headers(),
      postData: req.postData(),
    });
  });
  page.on("requestfailed", (req) => {
    evidence.failedRequests.push({
      at: new Date().toISOString(),
      url: req.url(),
      method: req.method(),
      failure: req.failure(),
    });
  });
  page.on("response", async (res) => {
    if (!apiRelated(res.url())) return;
    const entry = {
      at: new Date().toISOString(),
      url: res.url(),
      method: res.request().method(),
      status: res.status(),
      headers: res.headers(),
    };
    const contentType = res.headers()["content-type"] || "";
    if (contentType.includes("application/json")) {
      entry.body = await res.json().catch((err) => ({ parseError: err.message }));
    } else {
      entry.bodyPreview = await res.text().then((t) => t.slice(0, 2000)).catch((err) => err.message);
    }
    evidence.responses.push(entry);
  });

  await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
  await settle(page, 3500);
  await shot(page, "01-dashboard");
  await requireAuthenticated(page);
  await snapshot(page, "dashboard-session-restore");

  await page.goto(`${FRONTEND}/tests`, { waitUntil: "domcontentloaded" });
  await settle(page, 3500);
  await shot(page, "02-tests");
  await snapshot(page, "tests-loaded");

  const startSelector = await clickFirst(page, [
    "button:has-text('Start Test')",
    "text=Start Test",
  ], "start-test");
  if (!startSelector) throw new Error("No Start Test button found.");

  await page.waitForURL(/\/exam\/.+attemptId=/, { timeout: 60000 });
  await settle(page, 4000);
  await shot(page, "03-exam-open");
  await snapshot(page, "exam-open");
  await requirePageUsable(page, "exam-open");
  await currentExamState(page, "exam-initial-state");

  await answerCurrentQuestion(page, "q1", "Educated");
  await shot(page, "04-q1-answered-autosaved");
  await currentExamState(page, "q1-after-autosave");

  await requireClick(page, ["button:has-text('Next')"], "navigate-next-q2");
  await settle(page, 1000);
  await answerCurrentQuestion(page, "q2", "Fairly");
  await shot(page, "05-q2-answered-autosaved");

  await requireClick(page, ["button:has-text('Review & Next')", "button:has-text('Review')"], "mark-review-q2");
  await settle(page, 2800);
  await shot(page, "06-review-mark-navigation");
  await currentExamState(page, "after-review-mark");

  const beforeRefresh = await currentExamState(page, "before-refresh");
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page, 4500);
  await shot(page, "07-refresh-recovery");
  await requirePageUsable(page, "refresh-recovery");
  const afterRefresh = await currentExamState(page, "after-refresh");
  evidence.flow.refreshRecovery = {
    sameUrl: beforeRefresh.url === afterRefresh.url,
    beforeTimer: beforeRefresh.timerText,
    afterTimer: afterRefresh.timerText,
    beforeStorageExam: beforeRefresh.storageExam,
    afterStorageExam: afterRefresh.storageExam,
    beforeStorageTimer: beforeRefresh.storageTimer,
    afterStorageTimer: afterRefresh.storageTimer,
  };

  let safety = 0;
  while (!(await page.locator("button:has-text('Review & Submit')").first().isVisible().catch(() => false)) && safety < 80) {
    const moved = await clickFirst(page, ["button:has-text('Next')"], `goto-final-${safety}`);
    if (!moved) break;
    safety += 1;
    await settle(page, 350);
  }
  await shot(page, "08-final-question-cta");
  await requireClick(page, ["button:has-text('Review & Submit')"], "open-review-screen");
  await settle(page, 1800);
  await shot(page, "09-review-screen");
  await snapshot(page, "review-screen");

  await requireClick(page, ["#confirm-submit", "input[type='checkbox']"], "confirm-final-submit");
  await settle(page, 500);
  await requireClick(page, ["button:has-text('Submit Final Test')"], "submit-final-test");
  await page.waitForURL(/\/reports\?attemptId=/, { timeout: 60000 });
  await settle(page, 6500);
  await shot(page, "10-report-after-submit");
  await snapshot(page, "report-after-submit");

  const reportUrl = page.url();
  const attemptId = new URL(reportUrl).searchParams.get("attemptId");
  evidence.flow.attemptId = attemptId;
  evidence.flow.reportUrl = reportUrl;

  await page.goto(`${FRONTEND}/history`, { waitUntil: "domcontentloaded" });
  await settle(page, 3500);
  await shot(page, "11-history");
  await snapshot(page, "history-after-submit");

  await page.goto(`${FRONTEND}/reports`, { waitUntil: "domcontentloaded" });
  await settle(page, 3500);
  await shot(page, "12-aggregate-report");
  await snapshot(page, "aggregate-analytics");

  evidence.finishedAt = new Date().toISOString();
  writeEvidence();
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
  console.log(`VALIDATION_ARTIFACTS=${outDir}`);
})().catch(async (err) => {
  evidence.fatal = { message: err.message, stack: err.stack };
  try {
    const browser = await chromium.connectOverCDP(CDP);
    const page = browser.contexts()[0]?.pages()?.at(-1);
    if (page) {
      await shot(page, "fatal-current-state");
      await snapshot(page, "fatal-current-state");
    }
    await browser.close().catch(() => {});
  } catch {}
  writeEvidence();
  console.error(err);
  console.error(`VALIDATION_ARTIFACTS=${outDir}`);
  process.exit(1);
});

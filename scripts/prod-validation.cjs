const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const FRONTEND = "https://mcq-portal-frontend.vercel.app";
const BACKEND = "https://mcq-backend-822862054564.us-central1.run.app";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(process.cwd(), "validation-artifacts", stamp);
const profileDir = path.join(process.cwd(), ".playwright-prod-profile");

fs.mkdirSync(outDir, { recursive: true });

const evidence = {
  startedAt: new Date().toISOString(),
  frontend: FRONTEND,
  backend: BACKEND,
  screenshots: [],
  api: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  observations: [],
};

function apiPath(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("mcq-backend") || parsed.pathname.includes("/api/v1");
  } catch {
    return false;
  }
}

function writeEvidence() {
  fs.writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify(evidence, null, 2));
}

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  evidence.screenshots.push(file);
}

async function waitForSettled(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(2500);
}

async function getAuthSnapshot(page) {
  return page.evaluate(async () => {
    const debug = window.MCQ_DEBUG || null;
    return {
      url: location.href,
      debug,
      localStorageKeys: Object.keys(localStorage),
      bodyText: document.body.innerText.slice(0, 2000),
    };
  });
}

async function requireNoCriticalError(page, label) {
  const text = await page.locator("body").innerText().catch(() => "");
  if (/Critical Error|ERR_NETWORK|Authentication required|Failed to load/i.test(text)) {
    evidence.observations.push({ label, status: "critical-text-found", text: text.slice(0, 1500) });
    await shot(page, `${label}-critical`);
    throw new Error(`${label} shows critical failure text`);
  }
}

async function gotoAndCapture(page, route, name) {
  await page.goto(`${FRONTEND}${route}`, { waitUntil: "domcontentloaded" });
  await waitForSettled(page);
  await ensureAuthenticated(page, name);
  await shot(page, name);
  await requireNoCriticalError(page, name);
  evidence.observations.push({ label: name, snapshot: await getAuthSnapshot(page) });
}

async function isLoginOrSpinner(page) {
  const state = await page.evaluate(() => ({
    path: location.pathname,
    text: document.body.innerText,
  })).catch(() => ({ path: "", text: "" }));
  return (
    state.path.startsWith("/login") ||
    /Continue with Google|Authorized access only|Initializing exam portal|Loading session/i.test(state.text)
  );
}

async function ensureAuthenticated(page, label) {
  if (!(await isLoginOrSpinner(page))) return;

  const text = await page.locator("body").innerText().catch(() => "");
  if (/Continue with Google|Authorized access only/i.test(text)) {
    console.log(`\nACTION REQUIRED (${label}): Complete Google sign-in in the visible browser window.`);
    console.log("Waiting until the app leaves the login screen and renders authenticated content.\n");
    await clickFirstVisible(page, [
      "button:has-text('Continue with Google')",
      "text=Continue with Google",
    ], `${label}-google-login`);
  }

  await page.waitForFunction(() => {
    const text = document.body.innerText || "";
    return (
      !location.pathname.startsWith("/login") &&
      !/Continue with Google|Authorized access only|Initializing exam portal|Loading session/i.test(text)
    );
  }, null, { timeout: 300000 });
  await waitForSettled(page);
}

async function clickFirstVisible(page, selectors, label) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      evidence.observations.push({ label, clicked: selector });
      return true;
    }
  }
  evidence.observations.push({ label, clicked: null });
  return false;
}

(async () => {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1440, height: 1000 },
    recordHar: { path: path.join(outDir, "network.har"), content: "embed" },
  });

  context.on("page", (p) => {
    p.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) {
        evidence.consoleErrors.push({ page: p.url(), type: msg.type(), text: msg.text() });
      }
    });
    p.on("pageerror", (err) => {
      evidence.pageErrors.push({ page: p.url(), message: err.message, stack: err.stack });
    });
    p.on("requestfailed", (req) => {
      evidence.failedRequests.push({
        url: req.url(),
        method: req.method(),
        failure: req.failure(),
      });
    });
    p.on("response", async (res) => {
      if (!apiPath(res.url())) return;
      const entry = {
        url: res.url(),
        status: res.status(),
        method: res.request().method(),
        headers: res.headers(),
      };
      const contentType = res.headers()["content-type"] || "";
      if (contentType.includes("application/json")) {
        entry.body = await res.json().catch(() => null);
      } else {
        entry.bodyPreview = await res.text().then((t) => t.slice(0, 1000)).catch(() => null);
      }
      evidence.api.push(entry);
    });
  });

  const page = context.pages()[0] || await context.newPage();
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      evidence.consoleErrors.push({ page: page.url(), type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    evidence.pageErrors.push({ page: page.url(), message: err.message, stack: err.stack });
  });
  page.on("requestfailed", (req) => {
    evidence.failedRequests.push({ url: req.url(), method: req.method(), failure: req.failure() });
  });
  page.on("response", async (res) => {
    if (!apiPath(res.url())) return;
    const entry = { url: res.url(), status: res.status(), method: res.request().method(), headers: res.headers() };
    const contentType = res.headers()["content-type"] || "";
    if (contentType.includes("application/json")) entry.body = await res.json().catch(() => null);
    else entry.bodyPreview = await res.text().then((t) => t.slice(0, 1000)).catch(() => null);
    evidence.api.push(entry);
  });

  await page.goto(FRONTEND, { waitUntil: "domcontentloaded" });
  await waitForSettled(page);
  await shot(page, "00-initial");

  await ensureAuthenticated(page, "initial");

  await waitForSettled(page);
  evidence.observations.push({ label: "authenticated-session", snapshot: await getAuthSnapshot(page) });
  await shot(page, "01-dashboard-after-login");

  await gotoAndCapture(page, "/dashboard", "02-dashboard");
  await gotoAndCapture(page, "/tests", "03-tests");

  const startClicked = await clickFirstVisible(page, [
    "button:has-text('Start Test')",
    "text=Start Test",
  ], "start-test");
  if (!startClicked) {
    throw new Error("No Start Test button found on /tests");
  }

  await page.waitForURL(/.*\/exam\/.*attemptId=.*/, { timeout: 60000 });
  await waitForSettled(page);
  await shot(page, "04-exam-started");
  evidence.observations.push({ label: "exam-started", snapshot: await getAuthSnapshot(page) });

  await clickFirstVisible(page, [
    "[role='radio']",
    "label:has([role='radio'])",
  ], "answer-question-1");
  await page.waitForTimeout(3500);
  await shot(page, "05-answer-autosaved");

  await clickFirstVisible(page, [
    "button:has-text('Next')",
  ], "next-question");
  await page.waitForTimeout(1000);
  await clickFirstVisible(page, [
    "[role='radio']",
    "label:has([role='radio'])",
  ], "answer-question-2");
  await page.waitForTimeout(3500);
  await shot(page, "06-second-answer-autosaved");

  const examUrl = page.url();
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSettled(page);
  await shot(page, "07-after-refresh-restore");
  evidence.observations.push({ label: "refresh-restore", beforeUrl: examUrl, afterUrl: page.url(), snapshot: await getAuthSnapshot(page) });

  const dialogPromise = page.waitForEvent("dialog", { timeout: 10000 }).then(async (dialog) => {
    evidence.observations.push({ label: "submit-dialog", message: dialog.message() });
    await dialog.accept();
  }).catch((err) => {
    evidence.observations.push({ label: "submit-dialog", missing: true, message: err.message });
  });
  await clickFirstVisible(page, [
    "button:has-text('Submit')",
    "text=Submit",
  ], "submit-test");
  await dialogPromise;
  await page.waitForTimeout(5000);
  await shot(page, "08-after-submit");
  evidence.observations.push({ label: "after-submit", snapshot: await getAuthSnapshot(page) });

  await gotoAndCapture(page, "/history", "09-history");
  await gotoAndCapture(page, "/analytics", "10-analytics");

  evidence.finishedAt = new Date().toISOString();
  writeEvidence();
  await context.close();
  console.log(`\nVALIDATION_ARTIFACTS=${outDir}\n`);
})().catch(async (err) => {
  evidence.fatal = { message: err.message, stack: err.stack };
  writeEvidence();
  console.error(err);
  console.error(`\nVALIDATION_ARTIFACTS=${outDir}\n`);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-launch-env-boundary-panel-evidence.json");

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

async function seedAdmin(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_admin_launch_env_boundary_panel");
  });
}

async function readBoundaryState(page) {
  return page.evaluate(() => {
    const boundary = document.querySelector('[data-testid="admin-launch-env-boundary"]');
    const status = document.querySelector('[data-testid="admin-launch-env-boundary-status"]');
    const checks = [...document.querySelectorAll('[data-testid="admin-launch-env-check"]')].map((check) => ({
      id: check.getAttribute("data-env-check-id"),
      group: check.getAttribute("data-env-check-group"),
      status: check.getAttribute("data-env-check-status"),
      publicSafe: check.getAttribute("data-env-check-public-safe"),
      secretValuePrinted: check.getAttribute("data-secret-value-printed"),
      text: check.textContent || "",
    }));
    const bodyText = document.body.textContent || "";

    return {
      boundary: {
        proofRule: boundary?.getAttribute("data-proof-rule"),
        totalChecks: boundary?.getAttribute("data-total-checks"),
        passCount: boundary?.getAttribute("data-pass-count"),
        pendingCount: boundary?.getAttribute("data-pending-count"),
        failCount: boundary?.getAttribute("data-fail-count"),
        localReady: boundary?.getAttribute("data-local-ready"),
        publicSecretExposure: boundary?.getAttribute("data-public-secret-exposure"),
      },
      status: {
        localReady: status?.getAttribute("data-launch-env-local-ready"),
        publicSecretExposure: status?.getAttribute("data-launch-env-public-secret-exposure"),
        text: status?.textContent || "",
      },
      checks,
      bodyText,
    };
  });
}

function findCheck(state, id) {
  const check = state.checks.find((item) => item.id === id);
  if (!check) throw new Error(`Missing launch env check ${id}: ${JSON.stringify(state.checks)}`);
  return check;
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

  await seedAdmin(page);
  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-launch-env-boundary").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "Launch Environment Boundary" }).waitFor({ timeout: 15000 });

  const desktopState = await readBoundaryState(page);
  checks.push({ label: "launch-env-boundary-desktop-state", state: desktopState });

  if (
    desktopState.boundary.proofRule !== "no-secret-launch-env-boundary-with-live-receipts" ||
    desktopState.boundary.totalChecks !== "14" ||
    desktopState.boundary.failCount !== "0" ||
    desktopState.boundary.publicSecretExposure !== "false" ||
    desktopState.status.publicSecretExposure !== "false" ||
    Number(desktopState.boundary.pendingCount) < 2
  ) {
    throw new Error(`Launch env boundary shell failed: ${JSON.stringify(desktopState.boundary)}`);
  }

  const expectedChecks = [
    "env-template",
    "auth-provider",
    "browser-supabase-url",
    "browser-supabase-key",
    "public-secret-firewall",
    "vercel-project-link",
    "server-supabase-secret",
    "server-gemini-key",
    "learner-state-migration",
    "learner-state-verify-sql",
    "teacher-limiter-migration",
    "teacher-limiter-verify-sql",
    "live-sql-receipt",
    "oauth-continuity-receipt",
  ];
  for (const id of expectedChecks) findCheck(desktopState, id);

  for (const id of [
    "env-template",
    "auth-provider",
    "browser-supabase-url",
    "browser-supabase-key",
    "public-secret-firewall",
    "vercel-project-link",
    "learner-state-migration",
    "learner-state-verify-sql",
    "teacher-limiter-migration",
    "teacher-limiter-verify-sql",
  ]) {
    const check = findCheck(desktopState, id);
    if (check.status !== "pass" || check.secretValuePrinted !== "false") {
      throw new Error(`Expected ${id} to pass without printed secret value: ${JSON.stringify(check)}`);
    }
  }

  for (const id of ["live-sql-receipt", "oauth-continuity-receipt"]) {
    const check = findCheck(desktopState, id);
    if (check.status !== "pending" || !check.text.includes("record")) {
      throw new Error(`Expected ${id} to stay pending with receipt instruction: ${JSON.stringify(check)}`);
    }
  }

  const secretPatterns = [
    /sb_secret_[A-Za-z0-9_-]{8,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /https:\/\/[a-z0-9]{10,}\.supabase\.co/i,
  ];
  const leakedPattern = secretPatterns.find((pattern) => pattern.test(desktopState.bodyText));
  if (leakedPattern) {
    throw new Error(`Launch env panel appears to print a secret-like value: ${leakedPattern}`);
  }

  for (const required of [
    "no Supabase, Gemini, or OAuth secret value is printed here",
    "Local environment boundary",
    "live SQL and OAuth receipts",
    "server-only Vercel variable",
    "two real browser profiles",
  ]) {
    if (!desktopState.bodyText.includes(required)) {
      throw new Error(`Launch env panel missing visible text: ${required}`);
    }
  }

  await assertNoOverflow(page, "launch-env-boundary-desktop", checks);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-launch-env-boundary").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "launch-env-boundary-mobile", checks);

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

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "bulk-upload-upsc-csv-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "bulk-upload-upsc-csv-final.png");
const templatePath = path.join(__dirname, "..", "public", "templates", "upsc_mcq_command_template.csv");
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";

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

async function run() {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing UPSC CSV template at ${templatePath}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || "unknown" });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_admin-bulk-upload-e2e");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify({
      level: "advanced",
      studyWindow: "120",
      learningStyle: "mixed",
      weakSignal: "mcq-traps",
      studyTime: "morning",
      attemptHistory: "one-attempt",
      learningPattern: "deep-work",
      mindState: "calm",
      updatedAt: new Date().toISOString(),
    }));
    window.localStorage.setItem("sarit-upsc-geography-progress-v1", JSON.stringify({
      3: {
        day: 3,
        talkScore: 82,
        talkBand: "Command",
        labCompleted: true,
        labProofCompletedIds: ["concept", "map", "example", "trap", "answer"],
      },
    }));
  });
  await page.route("**/api/v1/admin/tests", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/topics", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions**", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions/bulk", (route) => route.abort("connectionrefused"));

  await page.goto(`${baseUrl}/admin/questions/bulk`, { waitUntil: "domcontentloaded" });
  try {
    await page.getByText("Bulk Question Ingestion", { exact: false }).first().waitFor({ timeout: 60000 });
  } catch (error) {
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "<body unavailable>");
    const mockToken = await page.evaluate(() => window.localStorage.getItem("MOCK_TOKEN")).catch(() => null);
    await page.screenshot({ path: path.join(__dirname, "bulk-upload-upsc-csv-debug.png"), fullPage: true });
    throw new Error(
      `Bulk upload page did not render. url=${page.url()} mockToken=${mockToken} body=${bodyText} console=${JSON.stringify(consoleErrors)} pageErrors=${JSON.stringify(pageErrors)} requestFailures=${JSON.stringify(requestFailures)}`,
      { cause: error }
    );
  }
  await page.getByText("Local Draft Mode", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-upload-empty-desktop", checks);

  await page.locator('input[type="file"]').setInputFiles(templatePath);
  await page.getByText("UPSC MCQ Command", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Consider the following statements about divergent plate boundaries", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-upload-upsc-preview-desktop", checks);

  const importButton = page.getByRole("button", { name: /Start Ingestion/i });
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const importButton = buttons.find((button) => button.textContent?.includes("Start Ingestion"));
    return importButton && !importButton.hasAttribute("disabled");
  }, null, { timeout: 15000 });
  await importButton.click();
  await page.getByText("Saved 1 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });
  const localDrafts = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), localDraftKey);
  const latestDraft = localDrafts.at(-1);
  if (latestDraft?.questions?.[0]?.quality_notes?.batch_code !== "GEO-D03") {
    throw new Error(`Local draft did not preserve UPSC metadata: ${JSON.stringify(latestDraft)}`);
  }

  const commandState = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sarit-upsc-mcq-command-v1") || "{}"));
  if (commandState["GEO-D03"]?.drafted !== 1 || commandState["GEO-D03"]?.status !== "DRAFT") {
    throw new Error(`MCQ command state did not sync from local import: ${JSON.stringify(commandState["GEO-D03"])}`);
  }

  await page.goto(`${baseUrl}/admin/questions`, { waitUntil: "domcontentloaded" });
  try {
    await page.getByText("Local Draft Bank", { exact: false }).first().waitFor({ timeout: 30000 });
  } catch (error) {
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "<body unavailable>");
    await page.screenshot({ path: path.join(__dirname, "admin-questions-local-draft-debug.png"), fullPage: true });
    throw new Error(
      `Admin question bank did not render local drafts. url=${page.url()} body=${bodyText} console=${JSON.stringify(consoleErrors)} pageErrors=${JSON.stringify(pageErrors)} requestFailures=${JSON.stringify(requestFailures)}`,
      { cause: error }
    );
  }
  await page.getByText("Legacy API disabled for UPSC pilot", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Plate Tectonics", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "admin-questions-local-draft-desktop", checks);
  await page.getByRole("link", { name: /Day room/i }).first().click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=3/, { timeout: 15000 });
  try {
    await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  } catch (error) {
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "<body unavailable>");
    await page.screenshot({ path: path.join(__dirname, "geography-mcq-readiness-debug.png"), fullPage: true });
    throw new Error(
      `Geography MCQ room did not hydrate the imported draft. url=${page.url()} body=${bodyText}`,
      { cause: error }
    );
  }
  await page.getByText("Fresh set waiting", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Questions are attached, but this set is still DRAFT", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "draft-bank-day-room-route-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/questions/bulk`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').setInputFiles(templatePath);
  await page.getByText("UPSC MCQ Command", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-upload-upsc-preview-mobile", checks);

  const legacyApiRequestFailures = requestFailures.filter(({ url }) => url.includes("/api/v1/"));
  if (legacyApiRequestFailures.length !== 0) {
    throw new Error(`Local draft mode still made failed legacy API requests: ${JSON.stringify(legacyApiRequestFailures)}`);
  }

  const unexpectedConsoleErrors = consoleErrors.filter((error) => !error.includes("Failed to load resource: net::ERR_"));
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    templatePath,
    localDraftQuestionCount: latestDraft?.questions?.length || 0,
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    requestFailures,
    legacyApiRequestFailures,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: screenshotPath, fullPage: true });
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

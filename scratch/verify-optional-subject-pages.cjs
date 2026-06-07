const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "verify-optional-subject-pages-evidence.json");

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
  await page.evaluate((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_optional_subject_pages");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "active",
        studyWindow: "90",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
}

async function readOptionalDetailState(page, slug, checks) {
  await page.goto(`${baseUrl}/upsc/optional-subjects/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-detail").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-readiness").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-year-wise-pyqs").waitFor({ timeout: 15000 });

  const state = await page.evaluate(() => {
    const readiness = document.querySelector('[data-testid="upsc-optional-readiness"]');
    const yearRows = [...document.querySelectorAll('[data-testid="upsc-optional-year-row"]')].map((row) => ({
      year: row.getAttribute("data-year"),
      indexedCount: row.getAttribute("data-indexed-count"),
      paperLinks: row.querySelectorAll("a").length,
      text: row.textContent || "",
    }));
    const themes = [...document.querySelectorAll('[data-testid="upsc-optional-syllabus-themes"] article')].map(
      (theme) => theme.textContent || ""
    );
    const summaries = [...document.querySelectorAll('[data-testid="upsc-optional-paper-summary"] article')].map(
      (summary) => summary.textContent || ""
    );

    return {
      title: document.querySelector('[data-testid="upsc-optional-detail"] h1')?.textContent || "",
      yearCount: readiness?.getAttribute("data-year-count"),
      paperRowCount: readiness?.getAttribute("data-paper-row-count"),
      yearRows,
      themes,
      summaries,
    };
  });

  checks.push({ label: `${slug}-detail-state`, state });
  return state;
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
  await page.goto(`${baseUrl}/upsc/optional-subjects`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-catalog").waitFor({ timeout: 15000 });
  const catalogState = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid="upsc-optional-catalog"] a')].map((card) => ({
      href: card.getAttribute("href"),
      text: card.textContent || "",
    }));
    return {
      count: cards.length,
      anthropology: cards.find((card) => card.href === "/upsc/optional-subjects/anthropology"),
      publicAdministration: cards.find((card) => card.href === "/upsc/optional-subjects/public-administration"),
      geography: cards.find((card) => card.href === "/upsc/optional-subjects/geography"),
    };
  });
  checks.push({ label: "optional-catalog-state", catalogState });
  if (
    catalogState.count !== 48 ||
    !catalogState.anthropology ||
    !catalogState.publicAdministration ||
    !catalogState.geography
  ) {
    throw new Error(`optional-catalog-state failed: ${JSON.stringify(catalogState)}`);
  }
  await assertNoOverflow(page, "optional-catalog-desktop", checks);

  const anthropologyState = await readOptionalDetailState(page, "anthropology", checks);
  if (
    anthropologyState.yearCount !== "11" ||
    anthropologyState.paperRowCount !== "22" ||
    anthropologyState.yearRows.length !== 11 ||
    anthropologyState.yearRows.some((row) => row.paperLinks !== 2) ||
    anthropologyState.themes.length < 2 ||
    anthropologyState.summaries.length !== 2 ||
    !anthropologyState.themes.join(" ").includes("Indian anthropology")
  ) {
    throw new Error(`anthropology detail failed: ${JSON.stringify(anthropologyState)}`);
  }
  await assertNoOverflow(page, "anthropology-detail-desktop", checks);

  const publicAdminState = await readOptionalDetailState(page, "public-administration", checks);
  if (
    publicAdminState.yearCount !== "11" ||
    publicAdminState.paperRowCount !== "22" ||
    !publicAdminState.themes.join(" ").includes("Administrative theory")
  ) {
    throw new Error(`public administration detail failed: ${JSON.stringify(publicAdminState)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/optional-subjects/anthropology`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-detail").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "anthropology-detail-mobile", checks);

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

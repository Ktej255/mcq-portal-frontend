const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-syllabus-pyq-trend-library-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";

async function seedSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((profileStorageKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_syllabus_pyq_trend");
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "intermediate",
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedSession(page);
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-library-hero").waitFor({ timeout: 15000 });
  await page.getByText("Trend boards", { exact: true }).waitFor({ timeout: 15000 });

  const libraryState = await page.evaluate(() => {
    const packs = [...document.querySelectorAll('[data-testid="upsc-subject-source-pack"]')];
    const geographyPack = document.querySelector('[data-testid="upsc-subject-source-pack"][data-subject-slug="geography"]');
    const trendInsights = [...document.querySelectorAll('[data-testid="upsc-pyq-trend-insight"]')];
    const officialAnchors = [...document.querySelectorAll('[data-testid="upsc-official-source-anchors"] a')];
    const optionalCards = [...document.querySelectorAll('[data-testid="upsc-optional-source-packs"] a')];

    return {
      subjectPackCount: packs.length,
      officialAnchorCount: officialAnchors.length,
      optionalCardCount: optionalCards.length,
      trendInsightCount: trendInsights.length,
      trendEvidenceLevels: trendInsights.map((node) => node.getAttribute("data-evidence-level")),
      geographyText: geographyPack?.textContent || "",
      bodyText: document.body.textContent || "",
    };
  });

  checks.push({ label: "source-library-trend-state", libraryState });

  if (libraryState.subjectPackCount < 8) {
    throw new Error(`Expected at least 8 GS source packs, got ${libraryState.subjectPackCount}`);
  }
  if (libraryState.officialAnchorCount < 5) {
    throw new Error(`Expected official source anchors, got ${libraryState.officialAnchorCount}`);
  }
  if (libraryState.optionalCardCount < 45) {
    throw new Error(`Expected optional source cards, got ${libraryState.optionalCardCount}`);
  }
  if (libraryState.trendInsightCount < 12) {
    throw new Error(`Expected subject trend insights, got ${libraryState.trendInsightCount}`);
  }
  if (libraryState.trendEvidenceLevels.some((level) => level !== "topic-pattern-model")) {
    throw new Error(`Unexpected trend evidence levels: ${JSON.stringify(libraryState.trendEvidenceLevels)}`);
  }
  for (const required of [
    "Map plus process explanation",
    "Systematic path rule",
    "Basics:",
    "Advanced:",
    "Current affairs:",
    "Gap:",
    "Revision:",
    "full PDF text extraction and exact topic tagging continue next",
  ]) {
    if (!libraryState.bodyText.includes(required)) {
      throw new Error(`Missing source-library text: ${required}`);
    }
  }
  for (const required of ["monsoon", "atlas proof", "recall prompts", "PYQ-style traps"]) {
    if (!libraryState.geographyText.toLowerCase().includes(required.toLowerCase())) {
      throw new Error(`Missing geography trend detail: ${required}`);
    }
  }

  await assertNoOverflow(page, "source-library-desktop", checks);

  await page.goto(`${baseUrl}/upsc/optional-subjects/anthropology`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-detail").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-year-wise-pyqs").waitFor({ timeout: 15000 });
  const optionalState = await page.evaluate(() => ({
    text: document.body.textContent || "",
    rowCount: document.querySelectorAll('[data-testid="upsc-optional-year-wise-pyqs"] a').length,
  }));
  checks.push({ label: "optional-detail-year-wise-rows", optionalState });
  if (optionalState.rowCount < 10 || !optionalState.text.includes("Anthropology Paper I")) {
    throw new Error(`Optional year-wise rows missing: ${JSON.stringify(optionalState)}`);
  }
  await assertNoOverflow(page, "optional-detail-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-library-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "source-library-mobile", checks);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized")
  );
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: actionableConsoleErrors.length === 0 && pageErrors.length === 0,
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

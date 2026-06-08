const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const attemptKey = "sarit-upsc-question-bank-attempts-v1";
const evidencePath = path.join(__dirname, "verify-current-affairs-bridge-evidence.json");

function progressKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
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

async function seedProgress(page, progress, subjectSlug = "geography", questionBankAttempts = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, attemptStorageKey, seededProgress, seededQuestionBankAttempts }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_current_affairs_bridge");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.removeItem(progressStorageKey);
      if (seededProgress) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
      }
      window.localStorage.removeItem(attemptStorageKey);
      if (seededQuestionBankAttempts) {
        window.localStorage.setItem(attemptStorageKey, JSON.stringify(seededQuestionBankAttempts));
      }
    },
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey(subjectSlug),
      attemptStorageKey: attemptKey,
      seededProgress: progress,
      seededQuestionBankAttempts: questionBankAttempts,
    }
  );
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

  await seedProgress(page, null);
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  const activeSubject = await page.getByTestId("upsc-current-affairs-hero").getAttribute("data-active-subject");
  const initialProof = await page.getByTestId("upsc-current-affairs-coverage-proof").evaluate((proof) => ({
    rule: proof.getAttribute("data-rule"),
    activeSubject: proof.getAttribute("data-active-subject"),
    totalHooks: proof.getAttribute("data-total-hooks"),
    unlockedCount: proof.getAttribute("data-unlocked-count"),
    lockedCount: proof.getAttribute("data-locked-count"),
    coveredDays: proof.getAttribute("data-covered-days"),
  }));
  const initialUnlockedCards = await page.getByTestId("upsc-current-affairs-card").count();
  const initialNextUnlockText = await page.getByTestId("upsc-current-affairs-next-unlock").innerText();
  const initialLeakedHookCount = await page.getByText("Monsoon variability", { exact: false }).count();
  checks.push({ label: "initial-locked-state", activeSubject, initialProof, initialUnlockedCards, initialNextUnlockText, initialLeakedHookCount });
  if (
    activeSubject !== "geography" ||
    initialProof.rule !== "covered-static-topic-only" ||
    initialProof.activeSubject !== "geography" ||
    initialProof.unlockedCount !== "0" ||
    initialProof.lockedCount !== initialProof.totalHooks ||
    initialProof.coveredDays !== "" ||
    initialUnlockedCards !== 0 ||
    initialLeakedHookCount !== 0 ||
    !initialNextUnlockText.includes("Day 2")
  ) {
    throw new Error(`initial-locked-state failed: ${JSON.stringify({ activeSubject, initialProof, initialUnlockedCards, initialNextUnlockText, initialLeakedHookCount })}`);
  }
  await assertNoOverflow(page, "current-affairs-initial-desktop", checks);

  await seedProgress(page, null, "geography", {
    "geo-d02-medium-gis-scale": {
      questionId: "geo-d02-medium-gis-scale",
      subjectSlug: "geography",
      linkedDay: 2,
      topic: "Earth, Universe, and Location",
      difficulty: "MEDIUM",
      source: "REFERENCE_ADVANCED",
      selectedOption: "A",
      correctOption: "A",
      isCorrect: true,
      solvedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const proof = document.querySelector('[data-testid="upsc-current-affairs-coverage-proof"]');
    return proof?.getAttribute("data-unlocked-count") === "1";
  });
  const questionBankProof = await page.getByTestId("upsc-current-affairs-coverage-proof").evaluate((proof) => ({
    rule: proof.getAttribute("data-rule"),
    activeSubject: proof.getAttribute("data-active-subject"),
    totalHooks: proof.getAttribute("data-total-hooks"),
    unlockedCount: proof.getAttribute("data-unlocked-count"),
    lockedCount: proof.getAttribute("data-locked-count"),
    coveredDays: proof.getAttribute("data-covered-days"),
    questionBankAttemptCount: proof.getAttribute("data-question-bank-attempt-count"),
    rows: [...document.querySelectorAll('[data-testid="upsc-current-affairs-proof-row"]')].map((row) => ({
      day: row.getAttribute("data-linked-day"),
      status: row.getAttribute("data-gate-status"),
      signals: row.getAttribute("data-signals"),
    })),
  }));
  const questionBankUnlockedCards = await page.getByTestId("upsc-current-affairs-card").evaluateAll((cards) =>
    cards.map((card) => ({
      linkedDay: card.getAttribute("data-linked-day"),
      unlocked: card.getAttribute("data-unlocked"),
      text: card.textContent || "",
    }))
  );
  checks.push({ label: "question-bank-attempt-unlocks-linked-current-affairs", questionBankProof, questionBankUnlockedCards });
  if (
    questionBankProof.rule !== "covered-static-topic-only" ||
    questionBankProof.activeSubject !== "geography" ||
    questionBankProof.unlockedCount !== "1" ||
    questionBankProof.coveredDays !== "2" ||
    questionBankProof.questionBankAttemptCount !== "1" ||
    !questionBankProof.rows.some((row) => row.day === "2" && row.status === "unlocked" && row.signals.includes("Question bank solved")) ||
    questionBankUnlockedCards.length !== 1 ||
    questionBankUnlockedCards[0].linkedDay !== "2" ||
    !questionBankUnlockedCards[0].text.includes("Earth-observation satellites")
  ) {
    throw new Error(`question-bank-attempt-unlocks-linked-current-affairs failed: ${JSON.stringify({ questionBankProof, questionBankUnlockedCards })}`);
  }

  await seedProgress(page, {
    5: {
      day: 5,
      watched: true,
      talkScore: 82,
      updatedAt: new Date().toISOString(),
    },
    6: {
      day: 6,
      reflection: "Ocean currents and marine heatwaves are linked.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  const seededProof = await page.getByTestId("upsc-current-affairs-coverage-proof").evaluate((proof) => ({
    rule: proof.getAttribute("data-rule"),
    activeSubject: proof.getAttribute("data-active-subject"),
    totalHooks: proof.getAttribute("data-total-hooks"),
    unlockedCount: proof.getAttribute("data-unlocked-count"),
    lockedCount: proof.getAttribute("data-locked-count"),
    coveredDays: proof.getAttribute("data-covered-days"),
    rows: [...document.querySelectorAll('[data-testid="upsc-current-affairs-proof-row"]')].map((row) => ({
      day: row.getAttribute("data-linked-day"),
      status: row.getAttribute("data-gate-status"),
      signals: row.getAttribute("data-signals"),
    })),
  }));
  await page.getByText("Monsoon variability", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Marine heatwaves", { exact: false }).waitFor({ timeout: 15000 });
  const unlockedCards = await page.getByTestId("upsc-current-affairs-card").evaluateAll((cards) =>
    cards.map((card) => ({
      linkedDay: card.getAttribute("data-linked-day"),
      unlocked: card.getAttribute("data-unlocked"),
      text: card.textContent || "",
    }))
  );
  const hasWrongUnlock = unlockedCards.some((card) => card.unlocked !== "true" || !["5", "6"].includes(card.linkedDay));
  checks.push({ label: "covered-topic-unlocks-only-linked-hooks", seededProof, unlockedCards });
  if (
    seededProof.rule !== "covered-static-topic-only" ||
    seededProof.unlockedCount !== "2" ||
    seededProof.coveredDays !== "5,6" ||
    !seededProof.rows.some((row) => row.day === "5" && row.status === "unlocked" && row.signals.includes("Watch evidence")) ||
    !seededProof.rows.some((row) => row.day === "6" && row.status === "unlocked" && row.signals.includes("Talk reflection")) ||
    unlockedCards.length !== 2 ||
    hasWrongUnlock
  ) {
    throw new Error(`covered-topic-unlocks-only-linked-hooks failed: ${JSON.stringify({ seededProof, unlockedCards })}`);
  }
  await assertNoOverflow(page, "current-affairs-unlocked-desktop", checks);

  await seedProgress(page, {
    1: {
      day: 1,
      watched: true,
      talkScore: 76,
      updatedAt: new Date().toISOString(),
    },
  }, "environment");
  await page.goto(`${baseUrl}/upsc/current-affairs?subject=environment`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-current-affairs-card").first().waitFor({ timeout: 15000 });
  const environmentState = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="upsc-current-affairs-hero"]');
    const cards = [...document.querySelectorAll('[data-testid="upsc-current-affairs-card"]')].map((card) => ({
      subjectSlug: card.getAttribute("data-subject-slug"),
      linkedDay: card.getAttribute("data-linked-day"),
      unlocked: card.getAttribute("data-unlocked"),
      text: card.textContent || "",
    }));

    return {
      activeSubject: hero?.getAttribute("data-active-subject"),
      proof: {
        rule: document.querySelector('[data-testid="upsc-current-affairs-coverage-proof"]')?.getAttribute("data-rule"),
        activeSubject: document.querySelector('[data-testid="upsc-current-affairs-coverage-proof"]')?.getAttribute("data-active-subject"),
        unlockedCount: document.querySelector('[data-testid="upsc-current-affairs-coverage-proof"]')?.getAttribute("data-unlocked-count"),
        coveredDays: document.querySelector('[data-testid="upsc-current-affairs-coverage-proof"]')?.getAttribute("data-covered-days"),
      },
      cards,
    };
  });
  checks.push({ label: "environment-covered-topic-unlocks-only-environment-hook", environmentState });
  if (
    environmentState.activeSubject !== "environment" ||
    environmentState.proof.rule !== "covered-static-topic-only" ||
    environmentState.proof.activeSubject !== "environment" ||
    environmentState.proof.unlockedCount !== "1" ||
    environmentState.proof.coveredDays !== "1" ||
    environmentState.cards.length !== 1 ||
    environmentState.cards.some((card) => card.subjectSlug !== "environment" || card.linkedDay !== "1" || card.unlocked !== "true")
  ) {
    throw new Error(`environment-covered-topic-unlocks-only-environment-hook failed: ${JSON.stringify(environmentState)}`);
  }
  await assertNoOverflow(page, "current-affairs-environment-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "current-affairs-mobile", checks);

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

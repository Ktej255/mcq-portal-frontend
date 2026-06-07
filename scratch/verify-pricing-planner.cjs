const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-pricing-planner-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";
const expectedMonthlyBase = 399;

const expectedPlans = {
  monthly: { months: 1, launchPrice: 399 },
  yearly: { months: 12, launchPrice: 3999 },
  "eighteen-month": { months: 18, launchPrice: 5499 },
  "three-year": { months: 36, launchPrice: 8999 },
};

function expectedPlanMath(plan) {
  const listPrice = expectedMonthlyBase * plan.months;
  return {
    ...plan,
    listPrice,
    savings: listPrice - plan.launchPrice,
    discountPercent: Math.round(((listPrice - plan.launchPrice) / listPrice) * 100),
    effectiveMonthly: Math.round(plan.launchPrice / plan.months),
  };
}

function money(value) {
  return `Rs ${value.toLocaleString("en-IN")}`;
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

async function seedSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((profileStorageKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_pricing_planner");
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "intermediate",
        preparationStage: "coaching-complete",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "one-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
}

function readNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected numeric value, got ${value}`);
  return parsed;
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
  await page.goto(`${baseUrl}/upsc/pricing`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-pricing-hero").waitFor({ timeout: 15000 });

  const pricingState = await page.evaluate(() => {
    const discountProof = document.querySelector('[data-testid="upsc-pricing-discount-proof"]');
    const plans = [...document.querySelectorAll('[data-testid="upsc-pricing-plan"]')].map((card) => ({
      id: card.getAttribute("data-plan-id"),
      months: card.getAttribute("data-months"),
      listPrice: card.getAttribute("data-list-price"),
      launchPrice: card.getAttribute("data-launch-price"),
      savings: card.getAttribute("data-savings"),
      discountPercent: card.getAttribute("data-discount-percent"),
      effectiveMonthly: card.getAttribute("data-effective-monthly"),
      selectHref: card.querySelector('[data-testid="upsc-pricing-plan-select"]')?.getAttribute("href"),
      text: card.textContent || "",
    }));
    const proofRows = [...document.querySelectorAll('[data-testid="upsc-pricing-proof-row"]')].map((row) => ({
      id: row.getAttribute("data-plan-id"),
      months: row.getAttribute("data-duration-months"),
      monthlyBase: row.getAttribute("data-monthly-base"),
      listPrice: row.getAttribute("data-list-price"),
      launchPrice: row.getAttribute("data-launch-price"),
      savings: row.getAttribute("data-savings"),
      discountPercent: row.getAttribute("data-discount-percent"),
      effectiveMonthly: row.getAttribute("data-effective-monthly"),
      text: row.textContent || "",
    }));

    return {
      plans,
      discountProof: {
        monthlyBase: discountProof?.getAttribute("data-monthly-base"),
        planCount: discountProof?.getAttribute("data-plan-count"),
        proofRule: discountProof?.getAttribute("data-proof-rule"),
        proofRows,
        text: discountProof?.textContent || "",
      },
      inclusionText: document.querySelector('[data-testid="upsc-pricing-inclusions"]')?.textContent || "",
      readinessText: document.querySelector('[data-testid="upsc-pricing-operating-rules"]')?.textContent || "",
    };
  });
  checks.push({ label: "pricing-plan-math", pricingState });

  if (pricingState.plans.length !== 4) {
    throw new Error(`Expected 4 pricing plans, got ${pricingState.plans.length}`);
  }
  if (
    readNumber(pricingState.discountProof.monthlyBase) !== expectedMonthlyBase ||
    readNumber(pricingState.discountProof.planCount) !== 4 ||
    pricingState.discountProof.proofRule !== "monthly-base-times-duration-minus-launch-price" ||
    pricingState.discountProof.proofRows.length !== 4
  ) {
    throw new Error(`Pricing discount proof shell failed: ${JSON.stringify(pricingState.discountProof)}`);
  }

  for (const [planId, expectedBase] of Object.entries(expectedPlans)) {
    const actual = pricingState.plans.find((plan) => plan.id === planId);
    const proof = pricingState.discountProof.proofRows.find((plan) => plan.id === planId);
    const expected = expectedPlanMath(expectedBase);
    if (!actual) throw new Error(`Missing pricing plan ${planId}`);
    if (!proof) throw new Error(`Missing pricing proof row ${planId}`);
    const actualMath = {
      months: readNumber(actual.months),
      listPrice: readNumber(actual.listPrice),
      launchPrice: readNumber(actual.launchPrice),
      savings: readNumber(actual.savings),
      discountPercent: readNumber(actual.discountPercent),
      effectiveMonthly: readNumber(actual.effectiveMonthly),
    };
    const proofMath = {
      months: readNumber(proof.months),
      monthlyBase: readNumber(proof.monthlyBase),
      listPrice: readNumber(proof.listPrice),
      launchPrice: readNumber(proof.launchPrice),
      savings: readNumber(proof.savings),
      discountPercent: readNumber(proof.discountPercent),
      effectiveMonthly: readNumber(proof.effectiveMonthly),
    };
    const expectedMath = {
      months: expected.months,
      listPrice: expected.listPrice,
      launchPrice: expected.launchPrice,
      savings: expected.savings,
      discountPercent: expected.discountPercent,
      effectiveMonthly: expected.effectiveMonthly,
    };
    const expectedProofMath = {
      months: expected.months,
      monthlyBase: expectedMonthlyBase,
      listPrice: expected.listPrice,
      launchPrice: expected.launchPrice,
      savings: expected.savings,
      discountPercent: expected.discountPercent,
      effectiveMonthly: expected.effectiveMonthly,
    };
    if (JSON.stringify(actualMath) !== JSON.stringify(expectedMath)) {
      throw new Error(`${planId} pricing math mismatch: ${JSON.stringify({ actualMath, expectedMath })}`);
    }
    if (JSON.stringify(proofMath) !== JSON.stringify(expectedProofMath)) {
      throw new Error(`${planId} pricing proof mismatch: ${JSON.stringify({ proofMath, expectedProofMath })}`);
    }
    if (actual.selectHref !== `/upsc/pricing/checkout?plan=${encodeURIComponent(planId)}`) {
      throw new Error(`${planId} select href mismatch: ${actual.selectHref}`);
    }
    if (!proof.text.includes(money(expectedMonthlyBase)) || !proof.text.includes(money(expected.launchPrice))) {
      throw new Error(`${planId} proof row missing visible source math: ${proof.text}`);
    }
  }

  if (
    !pricingState.inclusionText.includes("Systematic subject path") ||
    !pricingState.readinessText.includes("Optional PYQ rows")
  ) {
    throw new Error(`Pricing page missing inclusion/readiness proof: ${JSON.stringify(pricingState)}`);
  }
  await assertNoOverflow(page, "pricing-desktop", checks);

  await page.goto(`${baseUrl}/upsc/pricing/checkout?plan=three-year`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-pricing-checkout-intent").waitFor({ timeout: 15000 });
  const checkoutState = await page.evaluate(() => {
    const intent = document.querySelector('[data-testid="upsc-pricing-checkout-intent"]');
    const math = document.querySelector('[data-testid="upsc-pricing-checkout-math"]');
    const proof = document.querySelector('[data-testid="upsc-pricing-checkout-proof"]');
    return {
      planId: intent?.getAttribute("data-plan-id"),
      months: intent?.getAttribute("data-months"),
      monthlyBase: intent?.getAttribute("data-monthly-base"),
      listPrice: intent?.getAttribute("data-list-price"),
      launchPrice: intent?.getAttribute("data-launch-price"),
      savings: intent?.getAttribute("data-savings"),
      discountPercent: intent?.getAttribute("data-discount-percent"),
      effectiveMonthly: intent?.getAttribute("data-effective-monthly"),
      proofRule: proof?.getAttribute("data-proof-rule"),
      proofText: proof?.textContent || "",
      mathText: math?.textContent || "",
      text: document.body.textContent || "",
    };
  });
  checks.push({ label: "checkout-intent-three-year", checkoutState });
  const threeYearMath = expectedPlanMath(expectedPlans["three-year"]);
  if (
    checkoutState.planId !== "three-year" ||
    readNumber(checkoutState.months) !== threeYearMath.months ||
    readNumber(checkoutState.monthlyBase) !== expectedMonthlyBase ||
    readNumber(checkoutState.listPrice) !== threeYearMath.listPrice ||
    readNumber(checkoutState.launchPrice) !== threeYearMath.launchPrice ||
    readNumber(checkoutState.savings) !== threeYearMath.savings ||
    readNumber(checkoutState.discountPercent) !== threeYearMath.discountPercent ||
    readNumber(checkoutState.effectiveMonthly) !== threeYearMath.effectiveMonthly ||
    checkoutState.proofRule !== "monthly-base-times-duration-minus-launch-price" ||
    !checkoutState.proofText.includes(money(expectedMonthlyBase)) ||
    !checkoutState.proofText.includes(money(threeYearMath.savings)) ||
    !checkoutState.text.includes("Local checkout handoff")
  ) {
    throw new Error(`Checkout intent failed: ${JSON.stringify(checkoutState)}`);
  }
  await assertNoOverflow(page, "checkout-three-year-desktop", checks);

  await page.goto(`${baseUrl}/upsc/yearly-planner`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-yearly-planner-hero").waitFor({ timeout: 15000 });
  const plannerState = await page.evaluate(() => ({
    pricingCards: document.querySelectorAll('[data-testid="upsc-pricing-ladder"] article').length,
    timelineRows: document.querySelectorAll('[data-testid="upsc-yearly-timeline"] a').length,
    gsCoverageCards: document.querySelectorAll('[data-testid="upsc-gs-coverage"] article').length,
    optionalText: document.querySelector('[data-testid="upsc-optional-summary"]')?.textContent || "",
    sourceLibraryText: document.querySelector('[data-testid="upsc-source-library-link"]')?.textContent || "",
  }));
  checks.push({ label: "yearly-planner-state", plannerState });
  if (
    plannerState.pricingCards !== 4 ||
    plannerState.timelineRows !== 9 ||
    plannerState.gsCoverageCards !== 8 ||
    !plannerState.optionalText.includes("All optional pages are seeded") ||
    !plannerState.sourceLibraryText.includes("Syllabus and PYQ preload ledger")
  ) {
    throw new Error(`Yearly planner state failed: ${JSON.stringify(plannerState)}`);
  }
  await assertNoOverflow(page, "yearly-planner-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/pricing`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-pricing-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "pricing-mobile", checks);
  await page.goto(`${baseUrl}/upsc/pricing/checkout?plan=yearly`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-pricing-checkout-intent").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "checkout-yearly-mobile", checks);

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

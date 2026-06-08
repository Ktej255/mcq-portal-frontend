const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "revision-command-e2e-evidence.json");

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

async function seedProgress(page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        3: {
          day: 3,
          watched: true,
          watchState: "Watched",
          confidence: "Shaky",
          reflection: "Monsoon logic needs map repair.",
          revisitQueued: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-environment-progress-v1",
      JSON.stringify({
        2: {
          day: 2,
          watched: true,
          watchState: "Watched",
          confidence: "Working",
          reflection: "Food-chain answer is incomplete.",
          talkScore: 82,
          talkBand: "Practice",
          talkNextRoute: "/upsc/environment/watch?day=2",
          teacherDoubtCategory: "Concept chain",
          teacherDoubtReason: "The answer names trophic levels but misses energy transfer logic.",
          teacherDoubtRepairAction: "Repair the producer-consumer-decomposer chain before mixed revision.",
          teacherDoubtMasteryCheck: "Can the learner explain why energy reduces at each trophic level?",
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-history-progress-v1",
      JSON.stringify({
        4: {
          day: 4,
          watched: true,
          watchState: "Watched",
          confidence: "Shaky",
          reflection: "Revolt of 1857 chronology is not stable.",
          revisitQueued: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-economy-progress-v1",
      JSON.stringify({
        2: {
          day: 2,
          watched: true,
          watchState: "Watched",
          confidence: "Command",
          reflection: "National income concepts are stable.",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-question-bank-attempts-v1",
      JSON.stringify({
        "sci-d02-wrong": {
          questionId: "sci-d02-wrong",
          subjectSlug: "science-tech",
          linkedDay: 2,
          topic: "Space technology basics",
          difficulty: "HARD",
          source: "PYQ_PATTERN",
          selectedOption: "B",
          correctOption: "A",
          isCorrect: false,
          solvedAt: new Date().toISOString(),
        },
      })
    );
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_revision_command");
  });

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "domcontentloaded" });
  await seedProgress(page);
  await page.goto(`${baseUrl}/upsc/revision-command`, { waitUntil: "networkidle" });
  await page.getByText("One dashboard for every subject queue.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Global repair queue", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Geography / Day 3", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Environment / Day 2", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("AI teacher gap: Concept chain", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Repair the producer-consumer-decomposer chain", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("History / Day 4", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Science and Tech / Day 2", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Question Bank trap", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Question Bank ledger has 1 incorrect answer in Space technology basics", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Economy", { exact: true }).first().waitFor({ timeout: 15000 });
  const aiGapState = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("a")].map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent || "",
      source: link.getAttribute("data-revision-source"),
    }));
    return {
      hasAiGapTotal: document.body.textContent?.includes("AI gaps") ?? false,
      hasQuestionBankTrapTotal: document.body.textContent?.includes("QB traps") ?? false,
      environmentRepairLinks: cards.filter((card) => card.href === "/upsc/environment/watch?day=2"),
      questionBankRepairLinks: cards.filter(
        (card) => card.href === "/upsc/science-tech/revisit?day=2" && card.source === "question-bank"
      ),
    };
  });
  checks.push({ label: "revision-command-ai-gap-state", aiGapState });
  if (
    !aiGapState.hasAiGapTotal ||
    !aiGapState.hasQuestionBankTrapTotal ||
    !aiGapState.environmentRepairLinks.some(
      (link) => link.text.includes("AI teacher gap") || link.text.includes("AI Concept chain repair")
    ) ||
    !aiGapState.questionBankRepairLinks.some((link) => link.text.includes("Question Bank ledger has 1 incorrect answer"))
  ) {
    throw new Error(`revision-command-ai-gap-state failed: ${JSON.stringify(aiGapState)}`);
  }
  await assertNoOverflow(page, "revision-command-desktop", checks);

  await page.goto(`${baseUrl}/upsc/revision-command?subject=environment&day=2`, { waitUntil: "networkidle" });
  await page.getByTestId("revision-target-focus").waitFor({ timeout: 15000 });
  await page.getByText("AI teacher gap: Concept chain", { exact: false }).first().waitFor({ timeout: 15000 });
  const targetHref = await page.getByTestId("revision-target-route").getAttribute("href");
  checks.push({ label: "revision-command-ai-gap-direct-target", targetHref });
  if (targetHref !== "/upsc/environment/watch?day=2") {
    throw new Error(`revision-command-ai-gap-direct-target failed: ${targetHref}`);
  }

  await page.goto(`${baseUrl}/upsc/revision-command?subject=science-tech&day=2`, { waitUntil: "networkidle" });
  await page.getByTestId("revision-target-focus").waitFor({ timeout: 15000 });
  await page.getByText("Question Bank trap", { exact: false }).first().waitFor({ timeout: 15000 });
  const questionBankTarget = await page.evaluate(() => {
    const target = document.querySelector('[data-testid="revision-target-focus"]');
    const link = document.querySelector('[data-testid="revision-target-route"]');
    return {
      trapCount: target?.getAttribute("data-question-bank-traps"),
      targetHref: link?.getAttribute("href"),
      text: target?.textContent || "",
    };
  });
  checks.push({ label: "revision-command-question-bank-direct-target", questionBankTarget });
  if (
    questionBankTarget.trapCount !== "1" ||
    questionBankTarget.targetHref !== "/upsc/science-tech/revisit?day=2" ||
    !questionBankTarget.text.includes("Question Bank trap")
  ) {
    throw new Error(`revision-command-question-bank-direct-target failed: ${JSON.stringify(questionBankTarget)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Revision Command", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revision-command-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "revision-command-final.png"), fullPage: true });
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

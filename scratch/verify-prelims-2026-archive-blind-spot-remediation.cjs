const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const profile = {
  level: "advanced",
  preparationStage: "multiple-attempts",
  studyWindow: "120",
  learningStyle: "practice-first",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "two-plus-attempts",
  learningPattern: "revision-first",
  mindState: "calm",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

const strategyState = {
  statuses: {
    "ir-multilateral": "Building",
    "science-new-domains": "Building",
    "polity-legal-ethics": "Building",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
  completedTasks: ["ir-source-matrix", "st-domain-capsules", "polity-act-text-pack"],
  queuedBlueprints: [],
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_archive_blind_spot");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.removeItem("sarit-upsc-prelims-2026-question-proof-v1");
      window.localStorage.removeItem("sarit-upsc-prelims-2026-proof-packets-v1");
    },
    { profile, strategyState }
  );
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedLocalState(context);
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("prelims-2026-archive-blind-spot-remediation").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="prelims-2026-archive-blind-spot-remediation"]');
    return Number(section?.getAttribute("data-blind-spot-count")) > 0;
  }, null, { timeout: 30000 });

  const firstRow = page.getByTestId("prelims-2026-archive-blind-spot-row").first();
  const firstQuestionNumber = await firstRow.getAttribute("data-question-number");
  if (!firstQuestionNumber) throw new Error("First blind-spot row has no question number.");

  await firstRow.getByRole("button", { name: "Mark build gap" }).click();
  await page.waitForFunction((questionNumber) => {
    const row = Array.from(document.querySelectorAll('[data-testid="prelims-2026-archive-blind-spot-row"]')).find(
      (item) => item.getAttribute("data-question-number") === questionNumber
    );
    return row?.getAttribute("data-proof-decision") === "Build gap";
  }, firstQuestionNumber);

  const result = await page.evaluate((firstQuestionNumber) => {
    const section = document.querySelector('[data-testid="prelims-2026-archive-blind-spot-remediation"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-archive-blind-spot-row"]'));
    const firstRow = rows.find((row) => row.getAttribute("data-question-number") === firstQuestionNumber);
    const stored = JSON.parse(window.localStorage.getItem("sarit-upsc-prelims-2026-question-proof-v1") || "{}");
    const text = section?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasSection: Boolean(section),
      blindSpotCount: Number(section?.getAttribute("data-blind-spot-count")),
      needsProofCount: Number(section?.getAttribute("data-needs-proof-count")),
      buildGapCount: Number(section?.getAttribute("data-build-gap-count")),
      rowCount: rows.length,
      firstQuestionNumber,
      firstRowDecision: firstRow?.getAttribute("data-proof-decision"),
      storedDecision: stored[firstQuestionNumber],
      hasHeading: text.includes("Turn no-source MCQs into explicit 2027 build actions"),
      hasNoPublicClaimRule: text.includes("Do not release a public question-level claim"),
      hasSourceIntakeLink: Boolean(section?.querySelector('a[href="/upsc/source-library#upsc-morning-batch-archive-intake"]')),
      hasProofEditorLink: Boolean(section?.querySelector('a[href="#prelims-2026-question-proof-queue"]')),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  }, firstQuestionNumber);

  if (!result.hasSection) throw new Error("Blind-spot remediation section did not render.");
  if (result.blindSpotCount < 1 || result.rowCount < 1) {
    throw new Error(`Expected visible blind spots, got ${JSON.stringify(result)}`);
  }
  if (result.firstRowDecision !== "Build gap" || result.storedDecision !== "Build gap") {
    throw new Error(`Mark build gap did not persist: ${JSON.stringify(result)}`);
  }
  if (result.buildGapCount < 1) throw new Error(`Build-gap metric did not update: ${JSON.stringify(result)}`);
  if (!result.hasHeading || !result.hasNoPublicClaimRule || !result.hasSourceIntakeLink || !result.hasProofEditorLink) {
    throw new Error(`Blind-spot workflow copy/links are incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 900) throw new Error("Blind-spot remediation appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2026-archive-blind-spot-remediation").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2026-archive-blind-spot-remediation.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2026-archive-blind-spot-remediation-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2026-archive-blind-spot-remediation.png"),
            path.join(artifactDir, "upsc-prelims-2026-archive-blind-spot-remediation-mobile.png"),
          ],
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

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
      window.MOCK_TOKEN = "MOCK_TOKEN_MASTER_archive_proof_triage";
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_archive_proof_triage");
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
  await page.getByTestId("prelims-2026-archive-proof-triage").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="prelims-2026-archive-proof-triage"]');
    return section?.getAttribute("data-source-status") === "ready";
  }, null, { timeout: 30000 });

  const firstRow = page.getByTestId("prelims-2026-archive-triage-row").first();
  const firstQuestionNumber = await firstRow.getAttribute("data-question-number");
  if (!firstQuestionNumber) throw new Error("First archive triage row has no question number.");

  await firstRow.getByRole("link", { name: "Open proof editor" }).click();
  await page.waitForFunction((questionNumber) => {
    const editor = document.querySelector('[data-testid="prelims-2026-proof-packet-editor"]');
    return editor?.getAttribute("data-selected-question") === questionNumber;
  }, firstQuestionNumber);

  const result = await page.evaluate((firstQuestionNumber) => {
    const section = document.querySelector('[data-testid="prelims-2026-archive-proof-triage"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-archive-triage-row"]'));
    const editor = document.querySelector('[data-testid="prelims-2026-proof-packet-editor"]');
    const candidateCounts = rows.map((row) => Number(row.getAttribute("data-candidate-count")));
    const topSources = rows.map((row) => row.getAttribute("data-top-source") || "");
    const text = section?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasSection: Boolean(section),
      sourceStatus: section?.getAttribute("data-source-status"),
      candidateRows: Number(section?.getAttribute("data-candidate-rows")),
      needsProofWithCandidates: Number(section?.getAttribute("data-needs-proof-with-candidates")),
      blindSpots: Number(section?.getAttribute("data-blind-spots")),
      rowCount: rows.length,
      candidateCounts,
      topSources,
      firstQuestionNumber,
      editorSelectedQuestion: editor?.getAttribute("data-selected-question"),
      hasQuestionHeading: text.includes("Find which MCQs already have source-file candidates"),
      hasTopSource: topSources.some((source) => source.length > 0),
      hasDecisionBadges: text.includes("Needs proof") && text.includes("candidates"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  }, firstQuestionNumber);

  if (!result.hasSection) throw new Error("Archive proof triage section did not render.");
  if (result.sourceStatus !== "ready") throw new Error(`Expected ready source status, got ${result.sourceStatus}.`);
  if (result.candidateRows < 1) throw new Error(`Expected candidate rows, got ${result.candidateRows}.`);
  if (result.needsProofWithCandidates < 1) {
    throw new Error(`Expected needs-proof rows with candidates, got ${result.needsProofWithCandidates}.`);
  }
  if (result.blindSpots < 1) throw new Error(`Expected at least one blind spot, got ${result.blindSpots}.`);
  if (result.rowCount < 8) throw new Error(`Expected visible triage rows, found ${result.rowCount}.`);
  if (!result.candidateCounts.some((count) => count > 0) || !result.hasTopSource) {
    throw new Error(`Triage rows did not expose candidate sources: ${JSON.stringify(result)}`);
  }
  if (!result.hasQuestionHeading || !result.hasDecisionBadges) {
    throw new Error(`Triage board copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.editorSelectedQuestion !== firstQuestionNumber) {
    throw new Error(`Open proof editor did not select Q${firstQuestionNumber}: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 2200) throw new Error("Archive proof triage appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2026-archive-proof-triage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2026-archive-proof-triage.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2026-archive-proof-triage-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2026-archive-proof-triage.png"),
            path.join(artifactDir, "upsc-prelims-2026-archive-proof-triage-mobile.png"),
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

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
    "economy-maintenance": "Ready",
    "medieval-reduction": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board", "format-rebuilder"],
  completedTasks: [
    "ir-source-matrix",
    "ir-proof-release",
    "st-current-source-tags",
    "polity-act-text-pack",
    "geo-map-proof-lock",
    "eco-regulator-proof-lock",
  ],
  queuedBlueprints: ["ir-body-match-pair"],
};

const handoff = {
  id: "ir-body-match-pair-2026-06-10T00:00:00.000Z",
  blueprintId: "ir-body-match-pair",
  priorityId: "ir-multilateral",
  subjectSlug: "internal-security-society",
  day: 1,
  title: "IR body and India-link match set",
  format: "Match-pair",
  instruction:
    "Match ASEAN, BIMSTEC, SCO, QUAD, G20 and UN bodies with members, secretariat, summit theme and India's role.",
  matchedGap: "Directly repairs the 2026 multilateral-body misses.",
  expectedOutput: "25 match-pair questions with one close institutional distractor per pair.",
  difficulty: "PYQ_STYLE",
  plannedQuestions: 25,
  minutes: 45,
  generatedAt: "2026-06-10T00:00:00.000Z",
};

const mcqBatches = {
  "internal-security-society-day-1": {
    planned: 25,
    drafted: 25,
    difficulty: "PYQ_STYLE",
    status: "READY",
    updatedAt: "2026-06-10T00:05:00.000Z",
    strategyBlueprintId: "ir-body-match-pair",
    strategyTitle: "IR body and India-link match set",
    strategyFormat: "Match-pair",
  },
};

const attempts = {
  "strategy-ir-body-match-pair-1": {
    questionId: "strategy-ir-body-match-pair-1",
    subjectSlug: "internal-security-society",
    linkedDay: 1,
    topic: "IR body and India-link match set",
    difficulty: "PYQ_STYLE",
    source: "UPSC_2027_STRATEGY",
    selectedOption: "A",
    correctOption: "A",
    isCorrect: true,
    solvedAt: "2026-06-10T00:10:00.000Z",
  },
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState, handoff, mcqBatches, attempts }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_publish_gate");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.setItem("sarit-upsc-2027-practice-handoffs-v1", JSON.stringify([handoff]));
      window.localStorage.setItem("sarit-upsc-mcq-command-v1", JSON.stringify(mcqBatches));
      window.localStorage.setItem("sarit-upsc-question-bank-attempts-v1", JSON.stringify(attempts));
    },
    { profile, strategyState, handoff, mcqBatches, attempts }
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
  await page.getByTestId("prelims-2027-publish-gate").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const gate = document.querySelector('[data-testid="prelims-2027-publish-gate"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2027-publish-gate-row"]'));
    const statuses = rows.map((row) => row.getAttribute("data-gate-status"));
    const bodyText = document.body.innerText;

    return {
      hasGate: Boolean(gate),
      rowCount: rows.length,
      statuses,
      hasPublicSafe: statuses.includes("Public safe"),
      hasProofLocked: statuses.includes("Proof locked"),
      hasInProgress: statuses.includes("In progress"),
      hasActionNeeded: statuses.includes("Action needed"),
      hasPublicHandoffLink: Array.from(document.querySelectorAll("a")).some(
        (link) => link.getAttribute("href") === "/upsc-prelims-2026-showcase#strategy-2027"
      ),
      hasProofLedgerLink: Array.from(document.querySelectorAll("a")).some(
        (link) => link.getAttribute("href") === "#prelims-2027-evidence-ledger"
      ),
      mentionsWebinar: /webinar/i.test(bodyText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: bodyText.trim().length,
    };
  });

  if (!result.hasGate) throw new Error("Publish gate did not render.");
  if (result.rowCount !== 7) throw new Error(`Expected 7 publish gate rows, found ${result.rowCount}.`);
  if (!result.hasPublicSafe || !result.hasProofLocked || !result.hasInProgress || !result.hasActionNeeded) {
    throw new Error(`Missing expected gate statuses: ${JSON.stringify(result.statuses)}`);
  }
  if (!result.hasPublicHandoffLink || !result.hasProofLedgerLink) throw new Error("Publish gate links are incomplete.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 1800) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2027-publish-gate").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2027-publish-gate.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2027-publish-gate-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2027-publish-gate.png"),
            path.join(artifactDir, "upsc-prelims-2027-publish-gate-mobile.png"),
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

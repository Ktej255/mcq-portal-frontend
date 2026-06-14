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
    "environment-current": "Building",
    "geography-maps": "Building",
    "ancient-tn-board": "Building",
    "economy-maintenance": "Ready",
    "medieval-reduction": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board", "format-rebuilder"],
  completedTasks: [
    "ir-source-matrix",
    "ir-static-current-bridge",
    "st-domain-capsules",
    "st-current-source-tags",
    "polity-act-text-pack",
    "eco-maintenance-test",
    "medieval-planner-cap",
  ],
  queuedBlueprints: [
    "ir-body-match-pair",
    "ir-summit-how-many",
    "st-ai-application-multi",
    "st-semiconductor-exception",
  ],
};

const handoffs = [
  {
    id: "ir-body-match-pair-2026-06-10T00:00:00.000Z",
    blueprintId: "ir-body-match-pair",
    priorityId: "ir-multilateral",
    subjectSlug: "internal-security-society",
    day: 1,
    title: "IR body and India-link match set",
    format: "Match-pair",
    instruction: "Match IR bodies with India-link facts.",
    matchedGap: "Directly repairs the 2026 multilateral-body misses.",
    expectedOutput: "25 match-pair questions with one close institutional distractor per pair.",
    difficulty: "PYQ_STYLE",
    plannedQuestions: 25,
    minutes: 45,
    generatedAt: "2026-06-10T00:00:00.000Z",
  },
  {
    id: "st-ai-application-multi-2026-06-10T00:01:00.000Z",
    blueprintId: "st-ai-application-multi",
    priorityId: "science-new-domains",
    subjectSlug: "science-tech",
    day: 1,
    title: "AI, blockchain and quantum application pack",
    format: "Multi-statement",
    instruction: "Create applied Science and Tech questions.",
    matchedGap: "Targets the new-domain Science and Tech surprise layer.",
    expectedOutput: "35 multi-statement questions with one technical limitation trap in each.",
    difficulty: "HARD",
    plannedQuestions: 35,
    minutes: 55,
    generatedAt: "2026-06-10T00:01:00.000Z",
  },
];

const mcqBatches = {
  "internal-security-society-day-1": {
    planned: 25,
    drafted: 25,
    difficulty: "PYQ_STYLE",
    status: "READY",
    updatedAt: "2026-06-10T00:10:00.000Z",
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
    solvedAt: "2026-06-10T00:20:00.000Z",
  },
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState, handoffs, mcqBatches, attempts }) => {
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            window.__lastCopiedCoursePacket = value;
          },
        },
      });
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_course_packet");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.setItem("sarit-upsc-2027-practice-handoffs-v1", JSON.stringify(handoffs));
      window.localStorage.setItem("sarit-upsc-mcq-command-v1", JSON.stringify(mcqBatches));
      window.localStorage.setItem("sarit-upsc-question-bank-attempts-v1", JSON.stringify(attempts));
    },
    { profile, strategyState, handoffs, mcqBatches, attempts }
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
  await page.getByTestId("prelims-2027-course-correction-packet").waitFor({ state: "visible", timeout: 15000 });

  const copyButton = page.getByTestId("prelims-2027-copy-course-packet");
  await copyButton.click();
  await page.getByText("Course packet copied").waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(() => {
    const packet = document.querySelector('[data-testid="prelims-2027-course-correction-packet"]');
    const copyButton = document.querySelector('[data-testid="prelims-2027-copy-course-packet"]');
    const text = packet?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasPacket: Boolean(packet),
      trackCount: packet?.getAttribute("data-track-count"),
      hasHeading: text.includes("What changes inside the course and software after the final PDF"),
      hasPacketTitle: text.includes("UPSC Prelims 2027 Course Correction Packet"),
      hasCorrectedSignal: text.includes("74/97 scorable questions"),
      hasBuildGroup: text.includes("Build from scratch: IR / Multilateral Bodies; S&T New Domains"),
      hasDepthGroup: text.includes("Depth upgrade: Polity Legal + Ethics"),
      hasPatchGroup: text.includes("Patch and tag: Environment Current Layer; Geography International Map Layer"),
      hasReduceTrack: text.includes("Medieval History Effort Reduction"),
      hasPublicRule: text.includes("Only proof-locked claims from the public proof feed should move to the main website."),
      hasOwnerRoute: text.includes("/upsc/yearly-planner"),
      copyLabelChanged: copyButton?.textContent?.includes("Course packet copied") ?? false,
      copiedPacketHasTitle: window.__lastCopiedCoursePacket?.includes("UPSC Prelims 2027 Course Correction Packet") ?? false,
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasPacket) throw new Error("Course correction packet did not render.");
  if (result.trackCount !== "8") throw new Error(`Expected 8 decision tracks, found ${result.trackCount}.`);
  if (!result.hasHeading || !result.hasPacketTitle || !result.hasCorrectedSignal) {
    throw new Error(`Course packet header/signal is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasBuildGroup || !result.hasDepthGroup || !result.hasPatchGroup || !result.hasReduceTrack) {
    throw new Error(`Course packet decision groups are incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicRule || !result.hasOwnerRoute) {
    throw new Error(`Course packet rules/routes are incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.copyLabelChanged) throw new Error("Copy packet button did not acknowledge the action.");
  if (!result.copiedPacketHasTitle) throw new Error("Copy packet button did not write the operator packet.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 2200) throw new Error("Course packet appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2027-course-correction-packet").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2027-course-correction-packet.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2027-course-correction-packet-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2027-course-correction-packet.png"),
            path.join(artifactDir, "upsc-prelims-2027-course-correction-packet-mobile.png"),
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

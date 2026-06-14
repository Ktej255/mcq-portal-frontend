const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const localProofFeedStorageKey = "sarit-upsc-prelims-2026-public-proof-feed-local-v1";

const sampleFeedPayload = {
  mode: "supabase",
  table: "upsc_prelims_2026_public_proof_feed",
  claimCount: 2,
  publishedAt: "2026-06-10T05:30:00.000Z",
  message: "Latest public proof feed is available for the main website.",
  feed: {
    version: "upsc-prelims-2026-public-proof-feed-v1",
    lastUpdatedAt: "2026-06-10T05:30:00.000Z",
    audit: {
      direct: 44,
      partial: 30,
      misses: 23,
      dropped: 3,
      scorableQuestions: 97,
      effectiveCoveragePercent: 76,
    },
    proofPolicy:
      "Question-wise public claims require Approved decision plus complete source reference, page/location, teacher note and public claim line.",
    portalOwner: "/upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
    releasedClaims: [
      {
        questionNumber: 1,
        subject: "Ancient India",
        auditStatus: "partial",
        statusLabel: "Conceptual source lead",
        format: "Multi-statement",
        sourceLead: "Economy module retained source",
        matchScope: "Statement 1 and Statement 2 matched in the automated pass.",
        publicClaim: "This released sample claim is available to the main website proof feed.",
        sourceRef: "Retained source pack",
        pageRef: "Page 4",
        teacherNote: "Teacher approved source and trap logic.",
        updatedAt: "2026-06-10T05:20:00.000Z",
        question: {
          stem: "Sample UPSC stem for proof-feed verification.",
          statements: ["Sample statement 1", "Sample statement 2"],
          instruction: "Which statements are correct?",
          options: [
            { letter: "A", text: "1 only" },
            { letter: "B", text: "2 only" },
            { letter: "C", text: "Both" },
            { letter: "D", text: "Neither" },
          ],
          answer: "C",
        },
        matchedPortions: [
          {
            label: "Statement 1",
            text: "Sample statement 1",
            coverageLabel: "Concept signal found",
            matchedSignals: ["sample", "statement"],
          },
        ],
        manualCheckPortions: [],
      },
      {
        questionNumber: 4,
        subject: "Geography",
        auditStatus: "direct",
        statusLabel: "Strong candidate source lead",
        format: "Statement elimination",
        sourceLead: "Geography source pack",
        matchScope: "Core stem and trap matched in the automated pass.",
        publicClaim: "This geography sample claim can render as a verified public card.",
        sourceRef: "Geography proof pack",
        pageRef: "PDF page 18",
        teacherNote: "Teacher approved exact concept and elimination trap.",
        updatedAt: "2026-06-10T05:30:00.000Z",
        question: {
          stem: "Sample geography stem for proof-feed verification.",
          statements: ["Sample geography statement"],
          instruction: "Choose the correct option.",
          options: [
            { letter: "A", text: "Correct option" },
            { letter: "B", text: "Distractor" },
          ],
          answer: "A",
        },
        matchedPortions: [
          {
            label: "Core stem",
            text: "Sample geography stem",
            coverageLabel: "Source signal found",
            matchedSignals: ["geography", "stem"],
          },
        ],
        manualCheckPortions: [],
      },
    ],
  },
};

const emptyLocalOnlyPayload = {
  mode: "local-only",
  table: "upsc_prelims_2026_public_proof_feed",
  claimCount: 0,
  publishedAt: null,
  message: "Supabase persistence is not configured. Public proof feed remains browser-local.",
  feed: {
    ...sampleFeedPayload.feed,
    lastUpdatedAt: "local-draft",
    releasedClaims: [],
  },
};

async function verifyViewport(browser, viewport, fileName, options = {}) {
  const context = await browser.newContext({ viewport });
  if (options.localFeed) {
    await context.addInitScript(
      ({ localProofFeedStorageKey, localFeed }) => {
        window.localStorage.setItem(localProofFeedStorageKey, JSON.stringify(localFeed));
      },
      { localProofFeedStorageKey, localFeed: options.localFeed }
    );
  }
  const page = await context.newPage();
  const consoleErrors = [];

  await page.route("**/api/upsc/prelims-2026/public-proof-feed", async (requestRoute) => {
    await requestRoute.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.apiPayload ?? sampleFeedPayload),
    });
  });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-proof-feed-preview").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="showcase-proof-feed-preview"]');
    return section?.getAttribute("data-api-status") === "ready";
  });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-proof-feed-preview"]');
    const claimCards = Array.from(document.querySelectorAll('[data-testid="showcase-proof-feed-claim"]'));
    const statementRows = Array.from(document.querySelectorAll('[data-testid="showcase-proof-feed-statement"]'));
    const text = document.body.innerText;
    const fullText = document.body.textContent || "";

    return {
      hasSection: Boolean(section),
      status: section?.getAttribute("data-api-status"),
      mode: section?.getAttribute("data-api-mode"),
      claimCount: section?.getAttribute("data-claim-count"),
      claimCardCount: claimCards.length,
      questionNumbers: claimCards.map((card) => card.getAttribute("data-question-number")),
      statementRowCount: statementRows.length,
      hasEndpoint: text.includes("/api/upsc/prelims-2026/public-proof-feed"),
      hasSampleClaim: text.includes("This released sample claim is available to the main website proof feed."),
      hasGeographyClaim: text.includes("This geography sample claim can render as a verified public card."),
      hasCompleteProofLabel: fullText.includes("Complete MCQ proof"),
      hasQuestionStem: fullText.includes("Sample UPSC stem for proof-feed verification."),
      hasStatement: fullText.includes("Sample statement 1"),
      hasOption: fullText.includes("Both"),
      hasAnswer: fullText.includes("Answer: C"),
      hasTeacherNote: fullText.includes("Teacher approved source and trap logic."),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });

  if (!result.hasSection) throw new Error("Proof feed preview did not render.");
  if (result.status !== "ready" || result.mode !== (options.expectedMode ?? "supabase") || result.claimCount !== "2") {
    throw new Error(`Proof feed preview did not consume mocked API payload: ${JSON.stringify(result)}`);
  }
  if (result.claimCardCount !== 2 || !result.questionNumbers.includes("1") || !result.questionNumbers.includes("4")) {
    throw new Error(`Proof feed preview cards did not render: ${JSON.stringify(result)}`);
  }
  if (!result.hasEndpoint || !result.hasSampleClaim || !result.hasGeographyClaim) {
    throw new Error(`Proof feed preview text is incomplete: ${JSON.stringify(result)}`);
  }
  if (
    result.statementRowCount < 2 ||
    !result.hasCompleteProofLabel ||
    !result.hasQuestionStem ||
    !result.hasStatement ||
    !result.hasOption ||
    !result.hasAnswer ||
    !result.hasTeacherNote
  ) {
    throw new Error(`Proof feed preview did not render complete MCQ proof: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-proof-feed-preview").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-proof-feed-preview.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-proof-feed-preview-mobile.png");
    const localCache = await verifyViewport(
      browser,
      { width: 1440, height: 1100 },
      "upsc-showcase-proof-feed-preview-local-cache.png",
      {
        apiPayload: emptyLocalOnlyPayload,
        localFeed: sampleFeedPayload.feed,
        expectedMode: "local-cache",
      }
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          localCache,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-proof-feed-preview.png"),
            path.join(artifactDir, "upsc-showcase-proof-feed-preview-mobile.png"),
            path.join(artifactDir, "upsc-showcase-proof-feed-preview-local-cache.png"),
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

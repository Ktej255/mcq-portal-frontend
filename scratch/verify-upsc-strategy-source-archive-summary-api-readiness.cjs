const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2026-source-archive-summary-api-readiness`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const expectedTrackIds = [
  "ir-multilateral",
  "science-new-domains",
  "polity-legal-ethics",
  "environment-current",
  "geography-maps",
  "ancient-tn-board",
  "economy-maintenance",
  "medieval-reduction",
];

const forbiddenRawTokens = [
  "D:\\",
  "D:\\\\",
  "rootPath",
  "relativePath",
  "sampleFiles",
  "recentFiles",
  "D9_International_Organisations_Radar_UPSC2026.pdf",
  "SARIT_CLASSES_ScienceTech_FULL_MODULE.pdf",
  "UPSC_Medieval_History_Master_Module_COMPLETE.pdf",
];

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

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

async function seedLocalState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_source_archive_summary");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem(
      "sarit-upsc-prelims-2027-strategy-v1",
      JSON.stringify({
        statuses: {},
        completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
        completedTasks: [],
        queuedBlueprints: [],
      })
    );
  }, { profile });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  await seedLocalState(context);

  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("prelims-2026-source-archive-summary-api-readiness").waitFor({
    state: "visible",
    timeout: 30000,
  });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="prelims-2026-source-archive-summary-api-readiness"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 30000 }
  );

  const section = page.getByTestId("prelims-2026-source-archive-summary-api-readiness");
  await section.getByRole("button", { name: "Copy archive endpoint" }).click();
  await section.getByRole("button", { name: "Endpoint copied" }).waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(({ expectedTrackIds, forbiddenRawTokens }) => {
    const section = document.querySelector('[data-testid="prelims-2026-source-archive-summary-api-readiness"]');
    const tracks = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-archive-summary-track"]'));
    const folders = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-archive-summary-folder"]'));
    const extensions = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-archive-summary-extension"]'));
    const trackIds = tracks.map((track) => track.getAttribute("data-track-id"));
    const decisions = tracks.map((track) => track.getAttribute("data-decision"));
    const hitCounts = tracks.map((track) => Number(track.getAttribute("data-hit-count")));
    const sampleCounts = tracks.map((track) => Number(track.getAttribute("data-sample-count")));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      rootConnected: section?.getAttribute("data-root-connected"),
      totalFiles: Number(section?.getAttribute("data-total-files")),
      totalDirectories: Number(section?.getAttribute("data-total-directories")),
      totalBytes: Number(section?.getAttribute("data-total-bytes")),
      pdfCount: Number(section?.getAttribute("data-pdf-count")),
      docxCount: Number(section?.getAttribute("data-docx-count")),
      imageCount: Number(section?.getAttribute("data-image-count")),
      extensionTypeCount: Number(section?.getAttribute("data-extension-type-count")),
      folderBucketCount: Number(section?.getAttribute("data-folder-bucket-count")),
      trackCount: Number(section?.getAttribute("data-track-count")),
      renderedTrackCount: Number(section?.getAttribute("data-rendered-track-count")),
      renderedFolderCount: Number(section?.getAttribute("data-rendered-folder-count")),
      renderedExtensionCount: Number(section?.getAttribute("data-rendered-extension-count")),
      strongestTrackId: section?.getAttribute("data-strongest-track-id"),
      proofPolicy: section?.getAttribute("data-proof-policy"),
      tracks: tracks.length,
      folders: folders.length,
      extensions: extensions.length,
      trackIds,
      missingTrackIds: expectedTrackIds.filter((id) => !trackIds.includes(id)),
      decisions,
      hitCounts,
      sampleCounts,
      extensionCounts: Object.fromEntries(
        extensions.map((extension) => [extension.getAttribute("data-extension"), Number(extension.getAttribute("data-count"))])
      ),
      hasTitle: sectionText.includes("Validate the archive summary before the main website uses it"),
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasPublicPreviewLink: links.includes("/upsc-prelims-2026-showcase#source-archive-summary"),
      hasInternalIntakeLink: links.includes("/upsc/source-library#upsc-morning-batch-archive-intake"),
      hasProofBoundaryCopy: /raw file names/i.test(sectionText) && /operator portal/i.test(sectionText),
      hasDecisionLabels:
        sectionText.includes("Build from scratch") &&
        sectionText.includes("Depth upgrade") &&
        sectionText.includes("Patch and tag") &&
        sectionText.includes("Maintain") &&
        sectionText.includes("Reduce"),
      leakedTokens: forbiddenRawTokens.filter((token) => sectionText.includes(token)),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
    };
  }, { expectedTrackIds, forbiddenRawTokens });

  assert(result.hasSection, "Source archive summary strategy section did not render", result);
  assert(result.apiStatus === "ready", "Source archive summary strategy section did not load", result);
  assert(result.version === "upsc-prelims-2026-source-archive-summary-v1", "Source archive summary version drifted", result);
  assert(result.rootConnected === "true", "Source archive root should be connected", result);
  assert(result.totalFiles >= 1000 && result.pdfCount >= 1000, "Source archive counts are too small", result);
  assert(result.totalDirectories >= 30 && result.totalBytes > 1000000000, "Archive folder/size counts are too small", result);
  assert(result.extensionTypeCount >= 3 && result.folderBucketCount >= 6, "Archive type/folder summaries are incomplete", result);
  assert(result.trackCount === 8 && result.renderedTrackCount === 8 && result.tracks === 8, "Expected 8 rendered tracks", result);
  assert(result.folders >= 6 && result.renderedFolderCount >= 6, "Expected at least 6 rendered folder buckets", result);
  assert(result.extensions >= 3 && result.renderedExtensionCount >= 3, "Expected at least 3 rendered extension rows", result);
  assert(result.extensionCounts[".pdf"] >= 1000, "Expected PDF extension row", result);
  assert(result.missingTrackIds.length === 0, "Source archive summary missing track ids", result);
  assert(result.hitCounts.every((count) => count > 0), "Every source track needs hit counts", result);
  assert(result.sampleCounts.every((count) => count > 0), "Every source track needs sample counts", result);
  assert(result.trackIds.includes(result.strongestTrackId), "Strongest track id should be rendered", result);
  assert(result.proofPolicy === "sanitized-summary-no-raw-paths", "Wrong source summary proof policy marker", result);
  assert(result.hasTitle && result.hasEndpointText, "Source summary section copy is incomplete", result);
  assert(result.hasPublicPreviewLink && result.hasInternalIntakeLink, "Source summary links are incomplete", result);
  assert(result.hasProofBoundaryCopy && result.hasDecisionLabels, "Source summary proof-boundary copy is incomplete", result);
  assert(result.leakedTokens.length === 0, "Source summary strategy section leaked raw archive details", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.sectionLength > 1800, "Source summary strategy section appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await section.scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(
      browser,
      { width: 1440, height: 1100 },
      "upsc-strategy-source-archive-summary-api-readiness.png"
    );
    const mobile = await verifyViewport(
      browser,
      { width: 390, height: 900 },
      "upsc-strategy-source-archive-summary-api-readiness-mobile.png"
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [desktop.screenshotPath, mobile.screenshotPath],
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

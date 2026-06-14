const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const summaryRoute = `${baseUrl}/api/upsc/prelims-2026/source-archive-summary`;
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#source-archive-summary`;
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

const expectedDecisions = ["Build from scratch", "Depth upgrade", "Patch and tag", "Maintain", "Reduce"];
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

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

function assertSanitized(serialized, label) {
  for (const token of forbiddenRawTokens) {
    assert(!serialized.includes(token), `${label} leaked raw archive token ${token}`);
  }
}

function verifySummaryPayload(payload, headers) {
  const serialized = JSON.stringify(payload);
  const trackIds = payload.tracks?.map((track) => track.id) || [];
  const decisions = payload.tracks?.map((track) => track.decision) || [];
  const pdfExtension = payload.extensions?.find((extension) => extension.extension === ".pdf");

  assert(headers["cache-control"]?.includes("no-store"), "Source summary API should not be cached", headers);
  assert(
    payload.version === "upsc-prelims-2026-source-archive-summary-v1",
    "Unexpected source summary version",
    payload.version
  );
  assert(payload.publicRoute === "/upsc-prelims-2026-showcase", "Wrong public route", payload.publicRoute);
  assert(
    payload.publicAnchor === "/upsc-prelims-2026-showcase#source-archive-summary",
    "Wrong public anchor",
    payload.publicAnchor
  );
  assert(
    payload.internalIntakeRoute === "/upsc/source-library#upsc-morning-batch-archive-intake",
    "Wrong internal intake route",
    payload.internalIntakeRoute
  );
  assert(
    payload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command",
    "Missing review command API path",
    payload.api
  );
  assert(
    payload.api?.sourceArchiveSummary === "/api/upsc/prelims-2026/source-archive-summary",
    "Missing self API path",
    payload.api
  );
  assert(/raw file paths/i.test(payload.proofPolicy || ""), "Proof policy should mention raw path boundary", payload.proofPolicy);
  assert(/operator portal/i.test(payload.proofPolicy || ""), "Proof policy should mention operator portal", payload.proofPolicy);

  assert(payload.scan?.ok === true, "Source archive scan should be ok", payload.scan);
  assert(payload.scan?.rootConnected === true, "Source archive root should be connected locally", payload.scan);
  assert(payload.scan?.totalFiles >= 1000, "Expected at least 1000 archive files", payload.scan);
  assert(payload.scan?.pdfCount >= 1000, "Expected at least 1000 PDFs", payload.scan);
  assert(payload.scan?.totalDirectories >= 30, "Expected at least 30 folders", payload.scan);
  assert(payload.scan?.totalBytes > 1000000000, "Expected archive size above 1GB", payload.scan);
  assert(payload.scan?.extensionTypeCount >= 3, "Expected multiple file types", payload.scan);
  assert(payload.scan?.folderBucketCount >= 6, "Expected folder buckets", payload.scan);
  assert(payload.scan?.trackCount === 8, "Expected 8 archive tracks", payload.scan);
  assert(trackIds.length === 8, "Expected 8 rendered track payload rows", payload.tracks);
  assert(expectedTrackIds.every((id) => trackIds.includes(id)), "Source summary missing expected track ids", trackIds);
  assert(expectedDecisions.every((decision) => decisions.includes(decision)), "Source summary missing decision bands", decisions);
  assert(
    payload.tracks.every((track) => track.hitCount > 0 && track.sampleCount > 0),
    "Every track should have hit and sample counts",
    payload.tracks
  );
  assert(trackIds.includes(payload.scan.strongestTrackId), "Strongest track id should be one of the tracks", payload.scan);
  assert(Array.isArray(payload.topFolders) && payload.topFolders.length >= 6, "Top folder summary is too small", payload.topFolders);
  assert(Array.isArray(payload.extensions) && payload.extensions.length >= 3, "Extension summary is too small", payload.extensions);
  assert(pdfExtension?.count >= 1000, "PDF extension count is too small", payload.extensions);
  assertSanitized(serialized, "Source archive summary API");

  return {
    version: payload.version,
    scan: payload.scan,
    firstTrack: {
      id: payload.tracks[0].id,
      decision: payload.tracks[0].decision,
      hitCount: payload.tracks[0].hitCount,
      sampleCount: payload.tracks[0].sampleCount,
    },
    renderedFolders: payload.topFolders.length,
    renderedExtensions: payload.extensions.length,
  };
}

async function verifyPublicPreview(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(publicRoute, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-source-archive-summary-preview").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="showcase-source-archive-summary-preview"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 30000 }
  );

  const result = await page.evaluate((expectedTrackIds) => {
    const section = document.querySelector('[data-testid="showcase-source-archive-summary-preview"]');
    const tracks = Array.from(document.querySelectorAll('[data-testid="showcase-source-archive-summary-track"]'));
    const folders = Array.from(document.querySelectorAll('[data-testid="showcase-source-archive-summary-folder"]'));
    const extensions = Array.from(document.querySelectorAll('[data-testid="showcase-source-archive-summary-extension"]'));
    const trackIds = tracks.map((track) => track.getAttribute("data-track-id"));
    const decisions = tracks.map((track) => track.getAttribute("data-decision"));
    const hitCounts = tracks.map((track) => Number(track.getAttribute("data-hit-count")));
    const sampleCounts = tracks.map((track) => Number(track.getAttribute("data-sample-count")));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;

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
      strongestTrackId: section?.getAttribute("data-strongest-track-id"),
      renderedTrackCount: Number(section?.getAttribute("data-rendered-track-count")),
      renderedFolderCount: Number(section?.getAttribute("data-rendered-folder-count")),
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
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasInternalIntakeLink: Boolean(section?.querySelector('a[href="/upsc/source-library#upsc-morning-batch-archive-intake"]')),
      hasProofBoundaryCopy: /raw file paths/i.test(sectionText) && /operator portal/i.test(sectionText),
      hasDecisionLabels:
        sectionText.includes("Build from scratch") &&
        sectionText.includes("Depth upgrade") &&
        sectionText.includes("Patch and tag") &&
        sectionText.includes("Maintain") &&
        sectionText.includes("Reduce"),
      leakedLocalPath: sectionText.includes("D:\\") || sectionText.includes("D:\\\\"),
      leakedRelativePath: sectionText.includes("relativePath"),
      leakedSampleFilesKey: sectionText.includes("sampleFiles"),
      leakedKnownFile:
        sectionText.includes("D9_International_Organisations_Radar_UPSC2026.pdf") ||
        sectionText.includes("SARIT_CLASSES_ScienceTech_FULL_MODULE.pdf") ||
        sectionText.includes("UPSC_Medieval_History_Master_Module_COMPLETE.pdf"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
    };
  }, expectedTrackIds);

  assert(result.hasSection, "Source archive summary preview did not render", result);
  assert(result.apiStatus === "ready", "Source archive summary preview did not load", result);
  assert(result.version === "upsc-prelims-2026-source-archive-summary-v1", "Source archive summary version drifted", result);
  assert(result.rootConnected === "true", "Source archive root should be connected", result);
  assert(result.totalFiles >= 1000 && result.pdfCount >= 1000, "Source archive summary counts are too small", result);
  assert(result.totalDirectories >= 30 && result.totalBytes > 1000000000, "Source archive size/folder counts are too small", result);
  assert(result.extensionTypeCount >= 3 && result.folderBucketCount >= 6, "Source archive type/folder summaries are incomplete", result);
  assert(result.trackCount === 8 && result.renderedTrackCount === 8 && result.tracks === 8, "Expected 8 source tracks", result);
  assert(result.folders >= 6 && result.renderedFolderCount >= 6, "Expected at least 6 folder rows", result);
  assert(result.extensions >= 3 && result.extensionCounts[".pdf"] >= 1000, "Expected PDF extension row", result);
  assert(result.missingTrackIds.length === 0, "Source archive summary missing track ids", result);
  assert(result.hitCounts.every((count) => count > 0), "Every source track needs a hit count", result);
  assert(result.sampleCounts.every((count) => count > 0), "Every source track needs a sample count", result);
  assert(result.trackIds.includes(result.strongestTrackId), "Strongest track id should be rendered", result);
  assert(result.proofPolicy === "sanitized-summary-no-raw-paths", "Wrong public proof-policy data attribute", result);
  assert(result.hasEndpointText && result.hasInternalIntakeLink, "Source archive summary endpoint/link copy incomplete", result);
  assert(result.hasProofBoundaryCopy && result.hasDecisionLabels, "Source archive summary public copy incomplete", result);
  assert(!result.leakedLocalPath, "Source archive summary leaked local drive path", result);
  assert(!result.leakedRelativePath && !result.leakedSampleFilesKey, "Source archive summary leaked raw API field names", result);
  assert(!result.leakedKnownFile, "Source archive summary leaked known raw filenames", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.sectionLength > 2000, "Source archive summary preview appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-source-archive-summary-preview").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [summaryResponse, manifestResponse] = await Promise.all([
      page.request.get(summaryRoute),
      page.request.get(manifestRoute),
    ]);
    const summaryPayload = await summaryResponse.json();
    const manifestPayload = await manifestResponse.json();
    await context.close();

    assert(summaryResponse.status() === 200, `Source summary API returned ${summaryResponse.status()}`, summaryPayload);
    assert(manifestResponse.status() === 200, `Manifest API returned ${manifestResponse.status()}`, manifestPayload);
    assert(
      manifestPayload.api?.sourceArchiveSummary === "/api/upsc/prelims-2026/source-archive-summary",
      "Manifest does not point to source summary API",
      manifestPayload.api
    );

    const summary = verifySummaryPayload(summaryPayload, summaryResponse.headers());
    const desktop = await verifyPublicPreview(browser, { width: 1440, height: 1100 }, "upsc-source-archive-summary-api-preview.png");
    const mobile = await verifyPublicPreview(browser, { width: 390, height: 900 }, "upsc-source-archive-summary-api-preview-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          summaryRoute,
          manifestRoute,
          publicRoute,
          summary,
          manifestApi: manifestPayload.api,
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

import {
  defaultUpscSourceArchiveRoot,
  type SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const prelims2026SourceArchiveSummaryVersion = "upsc-prelims-2026-source-archive-summary-v1";

function extensionCount(scan: SourceArchiveIntakeResponse, extension: string) {
  return scan.extensions.find((item) => item.extension === extension)?.count ?? 0;
}

function imageCount(scan: SourceArchiveIntakeResponse) {
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  return scan.extensions
    .filter((item) => imageExtensions.has(item.extension))
    .reduce((total, item) => total + item.count, 0);
}

export function buildPrelims2026SourceArchiveSummaryFromScan(scan: SourceArchiveIntakeResponse) {
  const pdfCount = extensionCount(scan, ".pdf");
  const docxCount = extensionCount(scan, ".docx");
  const imageFileCount = imageCount(scan);
  const strongestTrack = scan.tracks.slice().sort((left, right) => right.hitCount - left.hitCount)[0] ?? null;

  return {
    version: prelims2026SourceArchiveSummaryVersion,
    generatedAt: new Date().toISOString(),
    sourceLabel: "Morning Batch source archive",
    publicRoute: "/upsc-prelims-2026-showcase",
    publicAnchor: "/upsc-prelims-2026-showcase#source-archive-summary",
    internalIntakeRoute: "/upsc/source-library#upsc-morning-batch-archive-intake",
    proofPolicy:
      "This summary exposes archive counts and rebuild tracks only. Raw file paths, file names and page-level proof stay inside the operator portal.",
    scan: {
      ok: scan.ok,
      rootConnected: scan.rootExists,
      totalFiles: scan.totalFiles,
      totalDirectories: scan.totalDirectories,
      totalBytes: scan.totalBytes,
      pdfCount,
      docxCount,
      imageCount: imageFileCount,
      extensionTypeCount: scan.extensions.length,
      folderBucketCount: scan.topFolders.length,
      trackCount: scan.tracks.length,
      strongestTrackId: strongestTrack?.id ?? "none",
      strongestTrackLabel: strongestTrack?.label ?? "No source track",
      message: scan.message ?? "",
    },
    extensions: scan.extensions.slice(0, 8),
    topFolders: scan.topFolders.slice(0, 8),
    tracks: scan.tracks.map((track) => ({
      id: track.id,
      label: track.label,
      decision: track.decision,
      hitCount: track.hitCount,
      sampleCount: track.sampleFiles.length,
      nextAction: track.nextAction,
    })),
    api: {
      reviewCommand: "/api/upsc/prelims-2026/review-command",
      manifest: "/api/upsc/prelims-2026/showcase-manifest",
      questionLedger: "/api/upsc/prelims-2026/question-ledger",
      proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
      courseAction: "/api/upsc/prelims-2027/course-action",
      sourceArchiveSummary: "/api/upsc/prelims-2026/source-archive-summary",
    },
  };
}

export async function buildPrelims2026SourceArchiveSummary(rootPath = defaultUpscSourceArchiveRoot) {
  const scan = await scanSourceArchive(rootPath);
  return buildPrelims2026SourceArchiveSummaryFromScan(scan);
}

import { NextRequest, NextResponse } from "next/server";

import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";

import {
  defaultUpscSourceArchiveRoot,
  sourceArchiveTrackRules,
  type SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyPayload(rootPath: string, message: string): SourceArchiveIntakeResponse {
  return {
    ok: false,
    rootPath,
    rootExists: false,
    scanComplete: false,
    scanErrorCount: 1,
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    totalDirectories: 0,
    totalBytes: 0,
    extensions: [],
    topFolders: [],
    recentFiles: [],
    tracks: sourceArchiveTrackRules.map((rule) => ({ ...rule, hitCount: 0, sampleFiles: [] })),
    message,
  };
}

// This lists folders and file names from the source archive on the server's
// disk, so it is for operators only. The public pages use the summary
// endpoints, which carry counts and no paths.
export async function GET(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return NextResponse.json(emptyPayload("", "Operator access is required to view the source archive."), {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const rootPath = process.env.UPSC_SOURCE_ARCHIVE_ROOT || defaultUpscSourceArchiveRoot;

  try {
    const payload = await scanSourceArchive(rootPath);
    return NextResponse.json(payload);
  } catch (error) {
    const payload = emptyPayload(
      rootPath,
      error instanceof Error ? error.message : "Source archive scan failed.",
    );

    return NextResponse.json(payload, { status: 500 });
  }
}

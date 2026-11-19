import { NextRequest, NextResponse } from "next/server";

import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";
import { buildPrelims2026ReleaseDecision } from "@/lib/upsc/prelims2026ReleaseDecision";
import {
  sourceArchiveTrackRules,
  type SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildUnconnectedArchiveScan(): SourceArchiveIntakeResponse {
  return {
    ok: false,
    rootPath: "",
    rootExists: false,
    scanComplete: false,
    scanErrorCount: 0,
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    totalDirectories: 0,
    totalBytes: 0,
    extensions: [],
    topFolders: [],
    recentFiles: [],
    tracks: sourceArchiveTrackRules.map((rule) => ({ ...rule, hitCount: 0, sampleFiles: [] })),
    message: "Live source archive metrics require operator authentication.",
  };
}

export async function GET(request: NextRequest) {
  const isInternal = await hasInternalApiAccess(request);
  const payload = isInternal
    ? await buildPrelims2026ReleaseDecision(process.env.UPSC_SOURCE_ARCHIVE_ROOT)
    : await buildPrelims2026ReleaseDecision(undefined, buildUnconnectedArchiveScan());
  const response = NextResponse.json(payload);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

import { NextResponse } from "next/server";

import {
  defaultUpscSourceArchiveRoot,
  sourceArchiveTrackRules,
  type SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rootPath = process.env.UPSC_SOURCE_ARCHIVE_ROOT || defaultUpscSourceArchiveRoot;

  try {
    const payload = await scanSourceArchive(rootPath);
    return NextResponse.json(payload);
  } catch (error) {
    const payload: SourceArchiveIntakeResponse = {
      ok: false,
      rootPath,
      rootExists: false,
      generatedAt: new Date().toISOString(),
      totalFiles: 0,
      totalDirectories: 0,
      totalBytes: 0,
      extensions: [],
      topFolders: [],
      recentFiles: [],
      tracks: sourceArchiveTrackRules.map((rule) => ({ ...rule, hitCount: 0, sampleFiles: [] })),
      message: error instanceof Error ? error.message : "Source archive scan failed.",
    };

    return NextResponse.json(payload, { status: 500 });
  }
}

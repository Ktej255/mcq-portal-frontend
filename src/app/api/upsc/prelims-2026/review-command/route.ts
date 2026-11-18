import { NextRequest, NextResponse } from "next/server";

import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";
import { buildPrelims2026ReviewCommand } from "@/lib/upsc/prelims2026ReviewCommand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json(await buildPrelims2026ReviewCommand(process.env.UPSC_SOURCE_ARCHIVE_ROOT));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

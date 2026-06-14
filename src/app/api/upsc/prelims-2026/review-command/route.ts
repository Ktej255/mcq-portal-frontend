import { NextResponse } from "next/server";

import { buildPrelims2026ReviewCommand } from "@/lib/upsc/prelims2026ReviewCommand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(await buildPrelims2026ReviewCommand(process.env.UPSC_SOURCE_ARCHIVE_ROOT));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

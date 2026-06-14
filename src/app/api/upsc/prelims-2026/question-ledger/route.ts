import { NextResponse } from "next/server";

import { buildPrelims2026QuestionLedgerPublic } from "@/lib/upsc/prelims2026QuestionLedgerPublic";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(buildPrelims2026QuestionLedgerPublic());
  response.headers.set("Cache-Control", "no-store");
  return response;
}

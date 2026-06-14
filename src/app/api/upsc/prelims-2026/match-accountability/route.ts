import { NextResponse } from "next/server";

import { buildPrelims2026MatchAccountability } from "@/lib/upsc/prelims2026MatchAccountability";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(buildPrelims2026MatchAccountability());
  response.headers.set("Cache-Control", "no-store");
  return response;
}

import { NextResponse } from "next/server";

import { buildPrelims2026BuildReadiness } from "@/lib/upsc/prelims2026BuildReadiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(buildPrelims2026BuildReadiness());
  response.headers.set("Cache-Control", "no-store");
  return response;
}

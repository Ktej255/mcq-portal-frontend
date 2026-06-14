import { NextResponse } from "next/server";

import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(buildPrelims2026ShowcaseManifest());
  response.headers.set("Cache-Control", "no-store");
  return response;
}

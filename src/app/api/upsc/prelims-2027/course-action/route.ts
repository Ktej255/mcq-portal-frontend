import { NextResponse } from "next/server";

import { buildPrelims2027CourseActionPublic } from "@/lib/upsc/prelims2027CourseActionPublic";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(buildPrelims2027CourseActionPublic());
  response.headers.set("Cache-Control", "no-store");
  return response;
}

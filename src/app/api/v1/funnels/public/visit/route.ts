import { NextRequest, NextResponse } from "next/server";
import { trackFunnelEvent } from "@/lib/funnels/routing";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, step_id, visitor_token } = body;

    if (!project_id || !step_id || !visitor_token) {
      return noStoreJson({ message: "project_id, step_id, and visitor_token are required" }, { status: 400 });
    }

    // Track 'page_view'
    trackFunnelEvent(project_id, step_id, visitor_token, "page_view");

    return noStoreJson({ ok: true });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

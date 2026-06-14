import { NextRequest, NextResponse } from "next/server";
import { trackFunnelEvent } from "@/lib/funnels/routing";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

const ALLOWED_EVENTS = new Set([
  "page_view",
  "step_complete",
  "step_skip",
  "form_submit",
  "cta_click",
  "exit"
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, step_id, visitor_token, event_type, metadata = {} } = body;

    if (!project_id || !step_id || !visitor_token || !event_type) {
      return noStoreJson({ message: "project_id, step_id, visitor_token, and event_type are required" }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.has(event_type)) {
      return noStoreJson({ message: `Invalid event_type: ${event_type}` }, { status: 400 });
    }

    // Track event
    trackFunnelEvent(project_id, step_id, visitor_token, event_type, metadata);

    return noStoreJson({ ok: true });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

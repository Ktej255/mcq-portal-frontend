import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await props.params;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { watch_percentage } = body;

    if (watch_percentage === undefined || typeof watch_percentage !== "number") {
      return noStoreJson({ message: "watch_percentage (number) is required" }, { status: 400 });
    }

    // 1. Fetch current session and funnel settings
    const { data: session, error: sessionError } = await client
      .from("vsl_sessions")
      .select("id, watch_percentage, ai_triggered_at, funnel_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return noStoreJson({ message: "Session not found" }, { status: 404 });
    }

    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("ai_trigger_threshold")
      .eq("id", session.funnel_id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Associated VSL funnel not found" }, { status: 404 });
    }

    // Determine if AI trigger threshold has been crossed
    const triggerThreshold = funnel.ai_trigger_threshold;
    const shouldTriggerAI = watch_percentage >= triggerThreshold && !session.ai_triggered_at;
    const aiTriggeredTime = shouldTriggerAI ? new Date().toISOString() : session.ai_triggered_at;

    // 2. Update session watch percentage and trigger time
    const { error: updateError } = await client
      .from("vsl_sessions")
      .update({
        watch_percentage: Math.max(session.watch_percentage, watch_percentage),
        ai_triggered_at: aiTriggeredTime,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (updateError) {
      return noStoreJson({ message: `Failed to update session progress: ${updateError.message}` }, { status: 500 });
    }

    return noStoreJson({
      ai_triggered: Boolean(aiTriggeredTime)
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

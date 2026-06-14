import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { funnel_id, visitor_token } = body;

    if (!funnel_id || !visitor_token) {
      return noStoreJson({ message: "funnel_id and visitor_token are required" }, { status: 400 });
    }

    // 1. Verify funnel exists (can be published or draft for dev flexibility)
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("status")
      .eq("id", funnel_id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    // 2. Create session
    const { data: session, error: sessionError } = await client
      .from("vsl_sessions")
      .insert({
        funnel_id,
        visitor_token,
        watch_percentage: 0,
        ai_conversation_log: [],
        converted: false,
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return noStoreJson({ message: `Failed to create session: ${sessionError?.message}` }, { status: 500 });
    }

    return noStoreJson({ session_id: session.id }, { status: 201 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

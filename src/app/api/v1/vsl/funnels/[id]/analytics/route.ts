import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: funnelId } = await props.params;
  const authResult = await requireModule(request, "vsl");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // 1. Verify ownership
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    // 2. Fetch all sessions for this funnel
    const { data: sessions, error: sessionsError } = await client
      .from("vsl_sessions")
      .select("id, watch_percentage, ai_triggered_at, converted, ai_conversation_log")
      .eq("funnel_id", funnelId);

    if (sessionsError) {
      return noStoreJson({ message: `Failed to retrieve sessions: ${sessionsError.message}` }, { status: 500 });
    }

    const totalViews = sessions?.length || 0;
    let avgWatchPercentage = 0;
    let aiTriggerCount = 0;
    let leadCaptureCount = 0;

    const questionCounts: Record<string, number> = {};

    if (totalViews > 0 && sessions) {
      let sumWatchPercentage = 0;
      sessions.forEach((s) => {
        sumWatchPercentage += Number(s.watch_percentage || 0);
        if (s.ai_triggered_at) aiTriggerCount++;
        if (s.converted) leadCaptureCount++;

        // Process conversation log for user questions
        const log = Array.isArray(s.ai_conversation_log) ? s.ai_conversation_log : [];
        log.forEach((msg: any) => {
          if (msg && msg.role === "user" && typeof msg.content === "string") {
            const cleanText = msg.content.trim();
            if (cleanText.length > 3) {
              questionCounts[cleanText] = (questionCounts[cleanText] || 0) + 1;
            }
          }
        });
      });

      avgWatchPercentage = Number((sumWatchPercentage / totalViews).toFixed(2));
    }

    const conversionRate = totalViews > 0 ? Number(((leadCaptureCount / totalViews) * 100).toFixed(2)) : 0;

    // Get top 5 unique questions sorted by frequency
    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question]) => question);

    return noStoreJson({
      total_views: totalViews,
      avg_watch_percentage: avgWatchPercentage,
      ai_trigger_count: aiTriggerCount,
      lead_capture_count: leadCaptureCount,
      conversion_rate: conversionRate,
      top_questions: topQuestions
    });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

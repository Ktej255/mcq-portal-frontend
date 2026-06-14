import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(
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
    const { email, phone = null, name = null } = body;

    if (!email) {
      return noStoreJson({ message: "email is required" }, { status: 400 });
    }

    // 1. Fetch session and funnel context
    const { data: session, error: sessionError } = await client
      .from("vsl_sessions")
      .select(`
        id,
        watch_percentage,
        ai_conversation_log,
        funnel_id,
        vsl_funnels (
          workspace_id
        )
      `)
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return noStoreJson({ message: "Session not found" }, { status: 404 });
    }

    const sessionData = session as any;
    const funnel = sessionData.vsl_funnels;
    const workspaceId = funnel?.workspace_id;

    if (!workspaceId) {
      return noStoreJson({ message: "Workspace context not found for funnel" }, { status: 500 });
    }

    // 2. Check if lead already exists for this email + workspace
    let { data: lead, error: leadSelectError } = await client
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .maybeSingle();

    let isNewLead = false;

    if (!lead && !leadSelectError) {
      isNewLead = true;
      const conversationLog = Array.isArray(sessionData.ai_conversation_log)
        ? sessionData.ai_conversation_log
        : [];
      
      const lastThreeMessages = conversationLog.slice(-3);

      // Create lead metadata
      const leadMetadata = {
        watch_percentage: sessionData.watch_percentage,
        conversation_summary: lastThreeMessages,
        primary_objection: null, // extracted during chat if applicable
        captured_at: new Date().toISOString()
      };

      // Insert lead
      const { data: newLead, error: leadInsertError } = await client
        .from("leads")
        .insert({
          workspace_id: workspaceId,
          source_module: "vsl",
          source_id: sessionData.funnel_id,
          email,
          phone,
          name,
          metadata: leadMetadata
        })
        .select("id")
        .single();

      if (leadInsertError || !newLead) {
        return noStoreJson({ message: `Failed to register lead: ${leadInsertError?.message}` }, { status: 500 });
      }

      lead = newLead;
    }

    if (!lead) {
      return noStoreJson({ message: "Failed to resolve lead ID" }, { status: 500 });
    }

    // 3. Update session converted status
    const { error: sessionUpdateError } = await client
      .from("vsl_sessions")
      .update({
        lead_id: lead.id,
        converted: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      return noStoreJson({ message: `Failed to link lead to session: ${sessionUpdateError.message}` }, { status: 500 });
    }

    let followupJobsCreated = 0;

    // 4. Stagger follow-up jobs if new lead
    if (isNewLead) {
      const now = new Date();
      const jobTimeouts = [
        { channel: "email" as const, delayHours: 1 },
        { channel: "whatsapp" as const, delayHours: 2 },
        { channel: "sms" as const, delayHours: 1 }
      ];

      const jobsToInsert = jobTimeouts.map((t) => {
        const scheduledTime = new Date(now.getTime() + t.delayHours * 60 * 60 * 1000);
        return {
          workspace_id: workspaceId,
          lead_id: lead!.id,
          channel: t.channel,
          sequence_id: "vsl_default",
          status: "pending" as const,
          scheduled_at: scheduledTime.toISOString()
        };
      });

      const { data: createdJobs, error: jobsInsertError } = await client
        .from("followup_jobs")
        .insert(jobsToInsert)
        .select("id");

      if (!jobsInsertError && createdJobs) {
        followupJobsCreated = createdJobs.length;
      } else {
        console.error("CAPTURE_API | Failed to create follow-up jobs:", jobsInsertError);
      }
    }

    return noStoreJson({
      lead_id: lead.id,
      followup_jobs_created: followupJobsCreated
    }, { status: 200 });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

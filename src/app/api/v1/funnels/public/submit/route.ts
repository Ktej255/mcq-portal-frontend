import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getNextStep, trackFunnelEvent } from "@/lib/funnels/routing";

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
    const {
      project_id,
      step_id,
      visitor_token,
      field_data = {},
      email,
      phone,
      name
    } = body;

    if (!project_id || !step_id || !visitor_token) {
      return noStoreJson({ message: "project_id, step_id, and visitor_token are required" }, { status: 400 });
    }

    // 1. Fetch project to verify it exists and get workspace_id
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("workspace_id")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    // 2. Fetch current step to get step_order
    const { data: currentStep, error: currentStepError } = await client
      .from("funnel_steps")
      .select("step_order, step_type")
      .eq("id", step_id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (currentStepError || !currentStep) {
      return noStoreJson({ message: "Step not found in this project" }, { status: 404 });
    }

    // 3. Resolve or create lead if email is provided
    let leadId: string | null = null;
    let isNewLead = false;

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();

      // Check if lead already exists in this workspace
      const { data: existingLead, error: leadSelectError } = await client
        .from("leads")
        .select("id")
        .eq("workspace_id", project.workspace_id)
        .eq("email", trimmedEmail)
        .maybeSingle();

      if (!leadSelectError && existingLead) {
        leadId = existingLead.id;

        // Optionally update phone and name if they are now provided and were missing
        const updates: Record<string, any> = {};
        if (phone) updates.phone = phone;
        if (name) updates.name = name;
        if (Object.keys(updates).length > 0) {
          await client.from("leads").update(updates).eq("id", leadId);
        }
      } else {
        // Create new lead
        isNewLead = true;
        const { data: newLead, error: leadInsertError } = await client
          .from("leads")
          .insert({
            workspace_id: project.workspace_id,
            source_module: "funnels",
            source_id: project_id,
            email: trimmedEmail,
            phone: phone || null,
            name: name || null,
            metadata: {
              captured_at: new Date().toISOString(),
              visitor_token
            }
          })
          .select("id")
          .single();

        if (!leadInsertError && newLead) {
          leadId = newLead.id;
        } else {
          console.error("SUBMIT_API | Failed to create lead:", leadInsertError?.message);
        }
      }
    }

    // 4. Insert funnel_submissions row
    const { data: submission, error: submissionError } = await client
      .from("funnel_submissions")
      .insert({
        project_id,
        step_id,
        lead_id: leadId,
        visitor_token,
        field_data
      })
      .select("id")
      .single();

    if (submissionError || !submission) {
      return noStoreJson({ message: `Failed to insert submission: ${submissionError?.message}` }, { status: 500 });
    }

    // 5. Track events
    trackFunnelEvent(project_id, step_id, visitor_token, "form_submit");
    trackFunnelEvent(project_id, step_id, visitor_token, "step_complete");

    // 6. Schedule follow-up jobs if new lead was created
    let followupJobsCreated = 0;
    if (isNewLead && leadId) {
      const now = new Date();
      const jobTimeouts = [
        { channel: "email" as const, delayHours: 1 },
        { channel: "sms" as const, delayHours: 1 },
        { channel: "whatsapp" as const, delayHours: 2 }
      ];

      const jobsToInsert = jobTimeouts.map((t) => {
        const scheduledTime = new Date(now.getTime() + t.delayHours * 60 * 60 * 1000);
        return {
          workspace_id: project.workspace_id,
          lead_id: leadId!,
          channel: t.channel,
          sequence_id: "funnel_default",
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
        console.error("SUBMIT_API | Failed to schedule followups:", jobsInsertError?.message);
      }
    }

    // 7. Resolve next step
    const nextStep = await getNextStep(project_id, currentStep.step_order);
    const isFinalStep = nextStep === null;

    return noStoreJson({
      lead_id: leadId,
      next_step: nextStep
        ? {
            id: nextStep.id,
            step_order: nextStep.step_order,
            step_type: nextStep.step_type
          }
        : null,
      is_final_step: isFinalStep,
      followup_jobs_created: followupJobsCreated
    }, { status: 200 });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

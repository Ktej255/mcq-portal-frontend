import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const authResult = await requireModule(request, "funnels");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const jobId = request.nextUrl.searchParams.get("job_id");
    if (!jobId) {
      return noStoreJson({ message: "job_id is required" }, { status: 400 });
    }

    const { data: job, error: jobError } = await client
      .from("hermes_jobs")
      .select("status, completed_at")
      .eq("id", jobId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (jobError || !job) {
      return noStoreJson({ message: "Hermes job not found in workspace" }, { status: 404 });
    }

    return noStoreJson({
      status: job.status,
      completed_at: job.completed_at || null
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

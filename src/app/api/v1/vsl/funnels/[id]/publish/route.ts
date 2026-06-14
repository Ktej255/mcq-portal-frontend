import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

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
    // 1. Fetch funnel and pages
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id, slug")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    const { data: pages, error: pagesError } = await client
      .from("vsl_pages")
      .select("id, content")
      .eq("funnel_id", funnelId);

    if (pagesError || !pages || pages.length === 0) {
      return noStoreJson({ message: "Cannot publish funnel: no pages found" }, { status: 400 });
    }

    // 2. Snapshot current content into published_content for each page
    for (const page of pages) {
      const { error: pageUpdateError } = await client
        .from("vsl_pages")
        .update({
          published_content: page.content,
          updated_at: new Date().toISOString()
        })
        .eq("id", page.id);

      if (pageUpdateError) {
        return noStoreJson({ message: `Failed to snapshot page content: ${pageUpdateError.message}` }, { status: 500 });
      }
    }

    // 3. Mark funnel as published
    const { error: publishError } = await client
      .from("vsl_funnels")
      .update({
        status: "published",
        updated_at: new Date().toISOString()
      })
      .eq("id", funnelId);

    if (publishError) {
      return noStoreJson({ message: `Failed to update funnel status: ${publishError.message}` }, { status: 500 });
    }

    const publicUrl = `/vsl/${workspace.slug}/${funnel.slug}`;

    return noStoreJson({
      public_url: publicUrl
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

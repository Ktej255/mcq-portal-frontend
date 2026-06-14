import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { title, template_id } = body;

    if (!title) {
      return noStoreJson({ message: "title is required" }, { status: 400 });
    }

    // Generate unique slug for workspace
    let slug = slugify(title);
    if (!slug) {
      slug = `funnel-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Check slug conflict
    const { data: existingFunnel } = await client
      .from("vsl_funnels")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("slug", slug)
      .maybeSingle();

    if (existingFunnel) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // 1. Create funnel
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .insert({
        workspace_id: workspace.id,
        title,
        slug,
        status: "draft",
        transcription_status: "pending",
        ai_trigger_threshold: 80,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (funnelError || !funnel) {
      return noStoreJson({ message: `Failed to create funnel: ${funnelError?.message}` }, { status: 500 });
    }

    const createdPages = [];

    // 2. Set pages based on template
    if (template_id) {
      const { data: template } = await client
        .from("vsl_templates")
        .select("page_content")
        .eq("id", template_id)
        .maybeSingle();

      if (template) {
        const { data: page } = await client
          .from("vsl_pages")
          .insert({
            funnel_id: funnel.id,
            page_type: "vsl",
            page_order: 0,
            content: template.page_content,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (page) createdPages.push(page);
      }
    }

    // Fallback if no template or template missing: create vsl page + thankyou page
    if (createdPages.length === 0) {
      const { data: vslPage } = await client
        .from("vsl_pages")
        .insert({
          funnel_id: funnel.id,
          page_type: "vsl",
          page_order: 0,
          content: { sections: [] },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data: thankYouPage } = await client
        .from("vsl_pages")
        .insert({
          funnel_id: funnel.id,
          page_type: "thankyou",
          page_order: 1,
          content: { sections: [] },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (vslPage) createdPages.push(vslPage);
      if (thankYouPage) createdPages.push(thankYouPage);
    }

    return noStoreJson({
      ...funnel,
      pages: createdPages
    }, { status: 201 });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
    // 1. Fetch funnels
    const { data: funnels, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id, title, slug, status, created_at, video_url, transcription_status")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (funnelError || !funnels) {
      return noStoreJson({ message: `Failed to retrieve funnels: ${funnelError?.message}` }, { status: 500 });
    }

    if (funnels.length === 0) {
      return noStoreJson([]);
    }

    // 2. Fetch basic session stats per funnel
    const funnelIds = funnels.map((f) => f.id);
    const { data: sessions, error: sessionsError } = await client
      .from("vsl_sessions")
      .select("funnel_id, converted")
      .in("funnel_id", funnelIds);

    const statsMap: Record<string, { session_count: number; lead_count: number }> = {};
    funnelIds.forEach((id) => {
      statsMap[id] = { session_count: 0, lead_count: 0 };
    });

    if (!sessionsError && sessions) {
      sessions.forEach((s) => {
        if (statsMap[s.funnel_id]) {
          statsMap[s.funnel_id].session_count++;
          if (s.converted) {
            statsMap[s.funnel_id].lead_count++;
          }
        }
      });
    }

    // 3. Combine funnels with stats
    const response = funnels.map((f) => ({
      ...f,
      session_count: statsMap[f.id].session_count,
      lead_count: statsMap[f.id].lead_count,
    }));

    return noStoreJson(response);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

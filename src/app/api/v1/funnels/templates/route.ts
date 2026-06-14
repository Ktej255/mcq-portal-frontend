import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const funnelType = searchParams.get("funnel_type");
    const tag = searchParams.get("tag");
    const vslCompatible = searchParams.get("vsl_compatible");

    let query = client
      .from("funnel_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }
    if (funnelType) {
      query = query.eq("funnel_type", funnelType);
    }
    if (vslCompatible === "true") {
      query = query.contains("tags", ["vsl_compatible"]);
    } else if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data: templates, error } = await query;

    if (error) {
      return noStoreJson({ message: `Failed to retrieve templates: ${error.message}` }, { status: 500 });
    }

    return noStoreJson(templates || []);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

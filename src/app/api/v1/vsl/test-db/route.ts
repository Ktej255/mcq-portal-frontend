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
    return noStoreJson({ success: false, error: "Database client not configured" }, { status: 500 });
  }

  try {
    const tables = ['leads', 'followup_jobs', 'hermes_jobs', 'vsl_funnels', 'vsl_pages', 'vsl_sessions', 'vsl_templates'];
    const results: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await client.from(table).select("id").limit(1);
      results[table] = !error || (error.code !== "42P01"); // 42P01 is pg error code for undefined_table
    }

    const missing = Object.entries(results).filter(([, exists]) => !exists).map(([table]) => table);

    return noStoreJson({
      success: missing.length === 0,
      results,
      missing,
    });
  } catch (err) {
    return noStoreJson({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

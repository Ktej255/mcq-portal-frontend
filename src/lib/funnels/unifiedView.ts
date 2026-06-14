import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface UnifiedFunnelItem {
  id: string;
  name: string;
  type: string; // 'vsl' | 'general' | 'optin' | 'webinar' etc.
  status: string;
  source_module: 'vsl' | 'funnels';
  lead_count: number;
  created_at: string;
  edit_url: string;
  live_url: string;
}

export async function getUnifiedFunnelList(
  workspaceId: string,
  activeModules: string[]
): Promise<UnifiedFunnelItem[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("getUnifiedFunnelList | Database client not configured");
    return [];
  }

  try {
    const list: UnifiedFunnelItem[] = [];

    // Fetch workspace details for slug context
    const { data: ws } = await client
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle();
    const workspaceSlug = ws?.slug || "my-workspace";

    // 1. Fetch VSL Funnels if 'vsl' is active
    if (activeModules.includes("vsl")) {
      const { data: vslFunnels } = await client
        .from("vsl_funnels")
        .select("id, title, slug, status, created_at")
        .eq("workspace_id", workspaceId)
        .neq("status", "archived");

      if (vslFunnels && vslFunnels.length > 0) {
        const vslIds = vslFunnels.map((f) => f.id);

        // Fetch lead counts for VSL
        const { data: vslLeads } = await client
          .from("leads")
          .select("id, source_id")
          .eq("source_module", "vsl")
          .in("source_id", vslIds);

        const vslLeadCounts: Record<string, number> = {};
        vslIds.forEach((id) => (vslLeadCounts[id] = 0));
        if (vslLeads) {
          vslLeads.forEach((l) => {
            if (vslLeadCounts[l.source_id] !== undefined) {
              vslLeadCounts[l.source_id]++;
            }
          });
        }

        vslFunnels.forEach((funnel) => {
          list.push({
            id: funnel.id,
            name: funnel.title,
            type: "vsl",
            status: funnel.status,
            source_module: "vsl",
            lead_count: vslLeadCounts[funnel.id] || 0,
            created_at: funnel.created_at,
            edit_url: `/dashboard/vsl/${funnel.id}/edit`,
            live_url: `/vsl/${workspaceSlug}/${funnel.slug}`
          });
        });
      }
    }

    // 2. Fetch Funnel Projects if 'funnels' is active
    if (activeModules.includes("funnels")) {
      const { data: projects } = await client
        .from("funnel_projects")
        .select("id, name, slug, funnel_type, status, created_at")
        .eq("workspace_id", workspaceId)
        .neq("status", "archived");

      if (projects && projects.length > 0) {
        const projectIds = projects.map((p) => p.id);

        // Fetch lead counts for general funnels
        const { data: funnelLeads } = await client
          .from("leads")
          .select("id, source_id")
          .eq("source_module", "funnels")
          .in("source_id", projectIds);

        const funnelLeadCounts: Record<string, number> = {};
        projectIds.forEach((id) => (funnelLeadCounts[id] = 0));
        if (funnelLeads) {
          funnelLeads.forEach((l) => {
            if (funnelLeadCounts[l.source_id] !== undefined) {
              funnelLeadCounts[l.source_id]++;
            }
          });
        }

        projects.forEach((proj) => {
          list.push({
            id: proj.id,
            name: proj.name,
            type: proj.funnel_type,
            status: proj.status,
            source_module: "funnels",
            lead_count: funnelLeadCounts[proj.id] || 0,
            created_at: proj.created_at,
            edit_url: `/dashboard/funnels/${proj.id}/edit`,
            live_url: `/f/${workspaceSlug}/${proj.slug}`
          });
        });
      }
    }

    // 3. Sort by created_at descending
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("getUnifiedFunnelList | Error querying unified list:", error);
    return [];
  }
}

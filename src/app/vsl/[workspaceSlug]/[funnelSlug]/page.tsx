import React from "react";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { VSLPage } from "@/components/vsl/VSLPage";

export const dynamic = "force-dynamic";

interface VSLViewerPageProps {
  params: Promise<{
    workspaceSlug: string;
    funnelSlug: string;
  }>;
}

export default async function VSLViewerPage(props: VSLViewerPageProps) {
  const { workspaceSlug, funnelSlug } = await props.params;
  const client = getSupabaseAdminClient();
  if (!client) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-slate-400">
        <p>Database connection is not configured. Please contact the administrator.</p>
      </div>
    );
  }

  // 1. Fetch workspace by slug
  const { data: workspace, error: wsError } = await client
    .from("workspaces")
    .select("id, name")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (wsError || !workspace) {
    notFound();
  }

  // 2. Fetch published funnel by slug + workspace_id
  const { data: funnel, error: funnelError } = await client
    .from("vsl_funnels")
    .select(`
      id,
      title,
      slug,
      status,
      video_url,
      ai_trigger_threshold,
      hermes_job_id,
      hermes_jobs (
        output_data
      )
    `)
    .eq("workspace_id", workspace.id)
    .eq("slug", funnelSlug)
    .maybeSingle();

  if (funnelError || !funnel) {
    notFound();
  }

  // Ensure funnel is published (flexible for local dev/preview if needed, but let's enforce published for production URLs)
  if (funnel.status !== "published" && process.env.NODE_ENV === "production") {
    notFound();
  }

  const funnelData = funnel as any;
  const outputData = funnelData.hermes_jobs?.output_data || {};
  const aiStarters = Array.isArray(outputData.ai_starters)
    ? outputData.ai_starters
    : ["Hello! I would love to answer any questions you have about the presentation."];

  // 3. Fetch published page layout content
  const { data: page } = await client
    .from("vsl_pages")
    .select("published_content")
    .eq("funnel_id", funnel.id)
    .eq("page_type", "vsl")
    .maybeSingle();

  const puckContent = page?.published_content || { sections: [] };

  const headline = outputData.page_copy?.headline || funnel.title;
  const subheadline = outputData.page_copy?.subheadline || "Watch the visual video presentation below.";

  return (
    <VSLPage
      funnelId={funnel.id}
      videoUrl={funnel.video_url || ""}
      triggerThreshold={funnel.ai_trigger_threshold}
      aiStarters={aiStarters}
      title={funnel.title}
      headline={headline}
      subheadline={subheadline}
    />
  );
}

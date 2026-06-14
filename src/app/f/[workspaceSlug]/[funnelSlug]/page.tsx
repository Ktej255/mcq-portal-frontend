import { notFound } from "next/navigation";
import { getPublicFunnelData } from "@/lib/funnels/routing";
import FunnelViewer from "@/components/funnels/FunnelViewer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    workspaceSlug: string;
    funnelSlug: string;
  }>;
}

export default async function FunnelEntryPage(props: PageProps) {
  const { workspaceSlug, funnelSlug } = await props.params;

  const funnelData = await getPublicFunnelData(workspaceSlug, funnelSlug);
  if (!funnelData) {
    notFound();
  }

  return (
    <FunnelViewer
      project={funnelData.project}
      steps={funnelData.steps}
      workspaceSlug={workspaceSlug}
      initialStepOrder={0}
    />
  );
}

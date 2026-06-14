import { notFound, redirect } from "next/navigation";
import { getPublicFunnelData } from "@/lib/funnels/routing";
import FunnelViewer from "@/components/funnels/FunnelViewer";

export const dynamic = "force-dynamic";

interface StepPageProps {
  params: Promise<{
    workspaceSlug: string;
    funnelSlug: string;
    stepOrder: string;
  }>;
}

export default async function FunnelStepPage(props: StepPageProps) {
  const { workspaceSlug, funnelSlug, stepOrder } = await props.params;
  const targetOrder = parseInt(stepOrder, 10);

  if (isNaN(targetOrder)) {
    redirect(`/f/${workspaceSlug}/${funnelSlug}`);
  }

  const funnelData = await getPublicFunnelData(workspaceSlug, funnelSlug);
  if (!funnelData) {
    notFound();
  }

  // Find step with the matching order
  const stepExists = funnelData.steps.some((s) => s.step_order === targetOrder);
  if (!stepExists) {
    redirect(`/f/${workspaceSlug}/${funnelSlug}`);
  }

  return (
    <FunnelViewer
      project={funnelData.project}
      steps={funnelData.steps}
      workspaceSlug={workspaceSlug}
      initialStepOrder={targetOrder}
    />
  );
}

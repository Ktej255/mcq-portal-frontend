import { ScienceTechMcqReadinessRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

export default async function ScienceTechMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <ScienceTechMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

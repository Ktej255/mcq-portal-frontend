import { EconomyMcqReadinessRoute } from "@/components/upsc/EconomySubjectRoutes";

export default async function EconomyMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EconomyMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

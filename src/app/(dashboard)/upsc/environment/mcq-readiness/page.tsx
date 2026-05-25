import { EnvironmentMcqReadinessRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EnvironmentMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

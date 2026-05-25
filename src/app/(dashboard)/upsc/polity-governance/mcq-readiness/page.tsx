import { PolityGovernanceMcqReadinessRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <PolityGovernanceMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

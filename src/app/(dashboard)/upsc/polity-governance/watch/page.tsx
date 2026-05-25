import { PolityGovernanceWatchRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <PolityGovernanceWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

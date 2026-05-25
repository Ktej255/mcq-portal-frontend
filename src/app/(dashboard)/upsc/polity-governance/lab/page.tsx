import { PolityGovernanceLabRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <PolityGovernanceLabRoute initialDay={Number.isFinite(day) ? day : 1} initialMode={params?.mode} />;
}

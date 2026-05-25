import { PolityGovernanceTalkRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <PolityGovernanceTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

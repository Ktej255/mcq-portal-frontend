import { PolityGovernanceRevisitRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <PolityGovernanceRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

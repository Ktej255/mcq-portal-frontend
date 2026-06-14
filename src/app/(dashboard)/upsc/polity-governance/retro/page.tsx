import { PolityGovernanceRetroRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

export default async function PolityGovernanceRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <PolityGovernanceRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

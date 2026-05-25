import { PolityGovernanceTrackRoute } from "@/components/upsc/PolityGovernanceSubjectRoutes";

type PolityGovernanceTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function PolityGovernanceTrackPage({ searchParams }: PolityGovernanceTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <PolityGovernanceTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

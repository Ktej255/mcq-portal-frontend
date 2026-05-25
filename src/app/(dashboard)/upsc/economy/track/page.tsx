import { EconomyTrackRoute } from "@/components/upsc/EconomySubjectRoutes";

type EconomyTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function EconomyTrackPage({ searchParams }: EconomyTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <EconomyTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

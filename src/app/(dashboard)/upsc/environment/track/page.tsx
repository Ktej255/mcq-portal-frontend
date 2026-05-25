import { EnvironmentTrackRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

type EnvironmentTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function EnvironmentTrackPage({ searchParams }: EnvironmentTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <EnvironmentTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

import { ScienceTechTrackRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

type ScienceTechTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function ScienceTechTrackPage({ searchParams }: ScienceTechTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <ScienceTechTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

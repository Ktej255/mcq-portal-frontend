import { HistoryTrackRoute } from "@/components/upsc/HistorySubjectRoutes";

type HistoryTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function HistoryTrackPage({ searchParams }: HistoryTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <HistoryTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

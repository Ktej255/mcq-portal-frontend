import { HistoryWatchRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <HistoryWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

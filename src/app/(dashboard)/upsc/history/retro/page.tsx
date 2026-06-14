import { HistoryRetroRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <HistoryRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

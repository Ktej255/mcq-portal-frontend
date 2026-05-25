import { HistoryRevisitRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <HistoryRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

import { HistoryMcqReadinessRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <HistoryMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

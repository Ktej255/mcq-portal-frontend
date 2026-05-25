import { HistoryTalkRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <HistoryTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

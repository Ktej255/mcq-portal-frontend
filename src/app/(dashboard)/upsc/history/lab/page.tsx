import { HistoryLabRoute } from "@/components/upsc/HistorySubjectRoutes";

export default async function HistoryLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <HistoryLabRoute initialDay={Number.isFinite(day) ? day : 1} initialMode={params?.mode} />;
}

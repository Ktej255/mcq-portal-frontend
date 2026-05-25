import { EconomyWatchRoute } from "@/components/upsc/EconomySubjectRoutes";

export default async function EconomyWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EconomyWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

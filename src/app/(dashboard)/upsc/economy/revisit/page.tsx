import { EconomyRevisitRoute } from "@/components/upsc/EconomySubjectRoutes";

export default async function EconomyRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EconomyRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

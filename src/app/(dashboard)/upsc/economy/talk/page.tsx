import { EconomyTalkRoute } from "@/components/upsc/EconomySubjectRoutes";

export default async function EconomyTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EconomyTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

import { EconomyLabRoute } from "@/components/upsc/EconomySubjectRoutes";

export default async function EconomyLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EconomyLabRoute initialDay={Number.isFinite(day) ? day : 1} initialMode={params?.mode} />;
}

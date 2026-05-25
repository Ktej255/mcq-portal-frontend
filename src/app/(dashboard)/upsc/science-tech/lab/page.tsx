import { ScienceTechLabRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

export default async function ScienceTechLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <ScienceTechLabRoute initialDay={Number.isFinite(day) ? day : 1} initialMode={params?.mode} />;
}

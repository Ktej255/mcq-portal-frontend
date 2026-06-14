import { ScienceTechRetroRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

export default async function ScienceTechRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <ScienceTechRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

import { ScienceTechRevisitRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

export default async function ScienceTechRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <ScienceTechRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

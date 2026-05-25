import { ScienceTechTalkRoute } from "@/components/upsc/ScienceTechSubjectRoutes";

export default async function ScienceTechTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <ScienceTechTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

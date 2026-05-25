import { EnvironmentTalkRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EnvironmentTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

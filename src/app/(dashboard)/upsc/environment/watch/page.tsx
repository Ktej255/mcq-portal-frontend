import { EnvironmentWatchRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <EnvironmentWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

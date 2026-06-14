import { EnvironmentRetroRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <EnvironmentRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

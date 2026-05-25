import { EnvironmentLabRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return (
    <EnvironmentLabRoute
      initialDay={Number.isFinite(day) ? day : 1}
      initialMode={params?.mode}
    />
  );
}

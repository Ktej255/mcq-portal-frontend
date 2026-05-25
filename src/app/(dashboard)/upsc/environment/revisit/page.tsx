import { EnvironmentRevisitRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

export default async function EnvironmentRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "0");

  return <EnvironmentRevisitRoute initialDay={Number.isFinite(day) && day > 0 ? day : undefined} />;
}

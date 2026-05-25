import { InternalSecuritySocietyMcqReadinessRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <InternalSecuritySocietyMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

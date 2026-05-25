import { InternalSecuritySocietyRevisitRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <InternalSecuritySocietyRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

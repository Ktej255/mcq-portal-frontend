import { InternalSecuritySocietyLabRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <InternalSecuritySocietyLabRoute initialDay={Number.isFinite(day) ? day : 1} initialMode={params?.mode} />;
}

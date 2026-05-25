import { InternalSecuritySocietyWatchRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <InternalSecuritySocietyWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

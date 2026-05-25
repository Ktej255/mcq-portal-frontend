import { InternalSecuritySocietyTalkRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <InternalSecuritySocietyTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

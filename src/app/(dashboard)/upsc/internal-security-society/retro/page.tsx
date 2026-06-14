import { InternalSecuritySocietyRetroRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

export default async function InternalSecuritySocietyRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <InternalSecuritySocietyRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

import { InternalSecuritySocietyTrackRoute } from "@/components/upsc/InternalSecuritySocietySubjectRoutes";

type InternalSecuritySocietyTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function InternalSecuritySocietyTrackPage({
  searchParams,
}: InternalSecuritySocietyTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <InternalSecuritySocietyTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

import { DisasterManagementTrackRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

type DisasterManagementTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function DisasterManagementTrackPage({ searchParams }: DisasterManagementTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <DisasterManagementTrackRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

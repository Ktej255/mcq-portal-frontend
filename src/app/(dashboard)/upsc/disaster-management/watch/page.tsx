import { DisasterManagementWatchRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <DisasterManagementWatchRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

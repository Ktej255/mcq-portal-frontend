import { DisasterManagementTalkRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <DisasterManagementTalkRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

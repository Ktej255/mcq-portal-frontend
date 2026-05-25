import { DisasterManagementRevisitRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <DisasterManagementRevisitRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

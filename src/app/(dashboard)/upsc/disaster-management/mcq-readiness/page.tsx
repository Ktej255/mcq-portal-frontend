import { DisasterManagementMcqReadinessRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <DisasterManagementMcqReadinessRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

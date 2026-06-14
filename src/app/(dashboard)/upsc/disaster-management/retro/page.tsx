import { DisasterManagementRetroRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <DisasterManagementRetroRoute initialDay={Number.isFinite(day) ? day : 1} />;
}

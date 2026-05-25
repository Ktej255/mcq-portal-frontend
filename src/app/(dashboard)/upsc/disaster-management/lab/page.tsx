import { DisasterManagementLabRoute } from "@/components/upsc/DisasterManagementSubjectRoutes";

export default async function DisasterManagementLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return (
    <DisasterManagementLabRoute
      initialDay={Number.isFinite(day) ? day : 1}
      initialMode={params?.mode}
    />
  );
}

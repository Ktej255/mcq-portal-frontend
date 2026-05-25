import { GeographyMcqReadinessRoom } from "@/components/upsc/GeographyMcqReadinessRoom";

export default async function GeographyMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <GeographyMcqReadinessRoom initialDay={Number.isFinite(day) ? day : 1} />;
}

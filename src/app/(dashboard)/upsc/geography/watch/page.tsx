import { GeographyWatchRoom } from "@/components/upsc/GeographyWatchRoom";

export default async function GeographyWatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <GeographyWatchRoom initialDay={Number.isFinite(day) ? day : 1} />;
}

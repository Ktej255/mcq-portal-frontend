import { GeographyRevisitRoom } from "@/components/upsc/GeographyRevisitRoom";

export default async function GeographyRevisitPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "0");

  return <GeographyRevisitRoom initialDay={Number.isFinite(day) && day > 0 ? day : undefined} />;
}

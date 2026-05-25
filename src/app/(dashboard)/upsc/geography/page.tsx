import { GeographyCommandRoom } from "@/components/upsc/GeographyCommandRoom";

export default async function GeographyPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <GeographyCommandRoom initialDay={Number.isFinite(day) ? day : 1} />;
}

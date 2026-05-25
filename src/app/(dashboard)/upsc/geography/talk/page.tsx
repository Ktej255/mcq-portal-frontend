import { GeographyTalkRoom } from "@/components/upsc/GeographyTalkRoom";

export default async function GeographyTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <GeographyTalkRoom initialDay={Number.isFinite(day) ? day : 1} />;
}


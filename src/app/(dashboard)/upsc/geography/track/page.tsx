import { GeographyTrackRoom } from "@/components/upsc/GeographyTrackRoom";

type GeographyTrackPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function GeographyTrackPage({ searchParams }: GeographyTrackPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <GeographyTrackRoom initialDay={Number.isFinite(day) ? day : undefined} />;
}

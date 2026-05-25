import { GeographyVisualLab } from "@/components/upsc/GeographyVisualLab";

export default async function GeographyLabPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return <GeographyVisualLab initialMode={params?.mode} initialDay={Number.isFinite(day) ? day : 1} />;
}

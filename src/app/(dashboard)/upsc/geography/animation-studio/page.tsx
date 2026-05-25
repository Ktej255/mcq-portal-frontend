import { GeographyAnimationStudio } from "@/components/upsc/GeographyAnimationStudio";

export default async function GeographyAnimationStudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;

  return <GeographyAnimationStudio initialSlug={params?.topic} />;
}

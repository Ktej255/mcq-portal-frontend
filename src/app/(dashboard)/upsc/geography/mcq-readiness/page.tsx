import { GeographyMcqReadinessRoom } from "@/components/upsc/GeographyMcqReadinessRoom";
import { McqUsageNudge } from "@/components/upsc/McqUsageNudge";
import { McqUsageMeter } from "@/components/upsc/McqUsageMeter";

export default async function GeographyMcqReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");

  return (
    <>
      <McqUsageNudge />
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-8">
        <McqUsageMeter />
      </div>
      <GeographyMcqReadinessRoom initialDay={Number.isFinite(day) ? day : 1} />
    </>
  );
}

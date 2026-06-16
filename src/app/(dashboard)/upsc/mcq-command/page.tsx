import { UpscMcqCommandCenter } from "@/components/upsc/UpscMcqCommandCenter";
import { McqUsageNudge } from "@/components/upsc/McqUsageNudge";
import { McqUsageMeter } from "@/components/upsc/McqUsageMeter";

type UpscMcqCommandPageProps = {
  searchParams?: Promise<{
    subject?: string;
    day?: string;
  }>;
};

export default async function UpscMcqCommandPage({ searchParams }: UpscMcqCommandPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return (
    <>
      <McqUsageNudge />
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-8">
        <McqUsageMeter />
      </div>
      <UpscMcqCommandCenter
        initialSubjectSlug={params?.subject}
        initialDay={Number.isFinite(day) ? day : undefined}
      />
    </>
  );
}

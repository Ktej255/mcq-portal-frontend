import { UpscMcqCommandCenter } from "@/components/upsc/UpscMcqCommandCenter";
import { McqUsageNudge } from "@/components/upsc/McqUsageNudge";

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
      <UpscMcqCommandCenter
        initialSubjectSlug={params?.subject}
        initialDay={Number.isFinite(day) ? day : undefined}
      />
    </>
  );
}

import { UpscMcqCommandCenter } from "@/components/upsc/UpscMcqCommandCenter";

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
    <UpscMcqCommandCenter
      initialSubjectSlug={params?.subject}
      initialDay={Number.isFinite(day) ? day : undefined}
    />
  );
}

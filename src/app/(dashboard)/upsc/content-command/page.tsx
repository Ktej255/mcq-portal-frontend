import { UpscContentCommandCenter } from "@/components/upsc/UpscContentCommandCenter";

type UpscContentCommandPageProps = {
  searchParams?: Promise<{
    subject?: string;
    day?: string;
  }>;
};

export default async function UpscContentCommandPage({ searchParams }: UpscContentCommandPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return (
    <UpscContentCommandCenter
      initialSubjectSlug={params?.subject}
      initialDay={Number.isFinite(day) ? day : undefined}
    />
  );
}

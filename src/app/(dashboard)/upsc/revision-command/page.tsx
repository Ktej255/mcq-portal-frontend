import { UpscRevisionCommandRoom } from "@/components/upsc/UpscRevisionCommandRoom";

type UpscRevisionCommandPageProps = {
  searchParams?: Promise<{
    subject?: string;
    day?: string;
  }>;
};

export default async function UpscRevisionCommandPage({ searchParams }: UpscRevisionCommandPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return (
    <UpscRevisionCommandRoom
      initialSubjectSlug={params?.subject}
      initialDay={Number.isFinite(day) ? day : undefined}
    />
  );
}

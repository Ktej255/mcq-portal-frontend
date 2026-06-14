import { GeographyTalkRoom } from "@/components/upsc/GeographyTalkRoom";

export default async function GeographyTalkPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string; module?: string; section?: string; startDay?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  const startDay = params?.startDay ? Number(params.startDay) : NaN;

  return (
    <GeographyTalkRoom
      initialDay={Number.isFinite(day) ? day : 1}
      initialModuleId={params?.module}
      initialSectionId={params?.section}
      dayStartReturnDay={Number.isFinite(startDay) ? startDay : undefined}
    />
  );
}

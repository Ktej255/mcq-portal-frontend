import { SubjectRetroRoom } from "@/components/upsc/SubjectRetroRoom";
import { geographyPlan } from "@/lib/upsc/subjectPlans";

export default async function GeographyRetroPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Number(params?.day ?? "1");
  return <SubjectRetroRoom plan={geographyPlan} initialDay={Number.isFinite(day) ? day : 1} />;
}

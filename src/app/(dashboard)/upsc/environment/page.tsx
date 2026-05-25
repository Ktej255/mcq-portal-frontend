import { EnvironmentCommandRoute } from "@/components/upsc/EnvironmentSubjectRoutes";

type EnvironmentPageProps = {
  searchParams?: Promise<{ day?: string }>;
};

export default async function EnvironmentPage({ searchParams }: EnvironmentPageProps) {
  const params = await searchParams;
  const day = Number(params?.day);

  return <EnvironmentCommandRoute initialDay={Number.isFinite(day) ? day : undefined} />;
}

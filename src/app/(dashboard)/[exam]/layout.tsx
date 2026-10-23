import { notFound } from "next/navigation";

import { EXAM_ROUTE_CODES, isExamRouteCode } from "@/lib/exams/examRoutes";

/**
 * NEET and JEE routes: /neet/... and /jee/... reuse the UPSC engine pages.
 *
 * `dynamicParams = false` makes every other value of `[exam]` a 404, so an
 * unknown top-level path (/notanexam) still 404s. Static top-level routes
 * (/dashboard, /reports, ...) always win over this dynamic segment.
 * The `/neet(.*)` and `/jee(.*)` auth rules live in src/proxy.ts.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return EXAM_ROUTE_CODES.map((exam) => ({ exam }));
}

export default async function ExamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ exam: string }>;
}) {
  // dynamicParams only covers this segment's own pages, so guard nested routes too.
  if (!isExamRouteCode((await params).exam)) notFound();
  return <>{children}</>;
}

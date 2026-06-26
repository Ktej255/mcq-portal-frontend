/**
 * Geography entry page.
 *
 * @deprecated The original GeographyCommandRoom (Watch→Talk→MCQ day-based
 * system) has been superseded by the unified Geography LMS. This page now
 * redirects students to the LMS entry point.
 *
 * The redirect preserves a `?day=N` param by mapping to the LMS syllabus
 * page — the LMS planner handles topic sequencing from the server side.
 *
 * Requirements: 10.1, 10.2
 */
import { redirect } from "next/navigation";

export default async function GeographyPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  // Any ?day=N param is dropped — the LMS planner manages progression
  // server-side. Students land on the LMS entry which redirects to either
  // onboarding or the syllabus tree based on their onboarding status.
  void searchParams; // acknowledged but not used post-redirect
  redirect("/upsc/geography/lms");
}

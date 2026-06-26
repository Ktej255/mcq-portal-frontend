/**
 * @deprecated Redirects to the Geography LMS practice page.
 * MCQ practice is now handled inside the LMS with per-topic sequential sessions.
 */
import { redirect } from "next/navigation";
export default function GeographyMcqReadinessPage() {
  redirect("/upsc/geography/lms/practice");
}

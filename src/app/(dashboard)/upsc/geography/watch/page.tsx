/**
 * @deprecated Redirects to the Geography LMS syllabus page.
 * The Watch room has been unified into the LMS topic content pages.
 */
import { redirect } from "next/navigation";
export default function GeographyWatchPage() {
  redirect("/upsc/geography/lms/syllabus");
}

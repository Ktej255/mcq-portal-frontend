/**
 * @deprecated Redirects to the Geography LMS syllabus page.
 * The Talk/Discussion room is now the AI Discussion gate inside each LMS topic.
 */
import { redirect } from "next/navigation";
export default function GeographyTalkPage() {
  redirect("/upsc/geography/lms/syllabus");
}

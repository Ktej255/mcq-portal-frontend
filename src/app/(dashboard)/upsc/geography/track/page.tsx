/**
 * @deprecated Redirects to the Geography LMS gaps page.
 * Progress tracking is now in the LMS gap dashboard.
 */
import { redirect } from "next/navigation";
export default function GeographyTrackPage() {
  redirect("/upsc/geography/lms/gaps");
}

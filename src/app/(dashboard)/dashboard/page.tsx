import { redirect } from "next/navigation";

// Canonical student home is /upsc (UPSC Daily Mission Control).
// The legacy /dashboard surface now redirects there to remove the
// duplicate "home" experience.
export default function DashboardHome() {
  redirect("/upsc");
}

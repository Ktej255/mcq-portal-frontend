import { redirect } from "next/navigation";

// Past tests are listed on the Reports page, each with its own report.
export default function HistoryPage() {
  redirect("/reports#tests");
}

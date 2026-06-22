import { redirect } from "next/navigation";

// /upsc and /upsc/daily-command rendered the same component, creating a
// duplicate canonical route. /upsc is now the single home; this route
// redirects there while preserving any ?tab= deep link.
export default async function UpscDailyCommandPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params?.tab;
  redirect(tab ? `/upsc?tab=${encodeURIComponent(tab)}` : "/upsc");
}

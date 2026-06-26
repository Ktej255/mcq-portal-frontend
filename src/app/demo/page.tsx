import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Product Demo — See Your UPSC Daily Command Center | Sarit Classes",
  description:
    "A read-only preview of the Sarit Classes daily command center: today's connected loop, streaks, daily targets and your weakness recovery queue — personalized from your diagnostic.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Live demo"
        title="See your daily command center."
        sub="This is what your day looks like inside Sarit Classes — one connected loop, your streak, today's targets and a weakness queue that adapts to you."
      />
      <DashboardPreview />
    </PageShell>
  );
}

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { DiagnosticFlow } from "@/components/marketing/DiagnosticFlow";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Get Started Free — 2-Minute UPSC Diagnostic | Sarit Learn",
  description:
    "Answer five quick questions and get a personalized UPSC starting plan — your first subject, daily targets, current-affairs routine and revision rhythm. Free, no card.",
  path: "/start",
});

export default function StartPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Get started free"
        title="Two minutes to a plan built around you."
        sub="Tell us a few things about your preparation and we'll turn it into a concrete daily plan you can start today — no card required."
      />
      <DiagnosticFlow />
    </PageShell>
  );
}

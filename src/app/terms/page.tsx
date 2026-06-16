import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Terms of Service — Sarit Learn",
  description: "The terms that govern your use of Sarit Learn.",
  path: "/terms",
});

const sections = [
  {
    h: "Using the platform",
    p: "Sarit Learn provides UPSC preparation content and tools for your personal, non-commercial study. You agree to use the platform lawfully and not to misuse, copy or redistribute our content.",
  },
  {
    h: "Your account",
    p: "You are responsible for keeping your login credentials secure and for activity under your account. Please notify us of any unauthorised use.",
  },
  {
    h: "Free and paid plans",
    p: "The free plan includes limited features as described on our pricing page. Paid plans unlock additional features. Plan details and pricing may be updated over time.",
  },
  {
    h: "Content and accuracy",
    p: "We work hard to keep content accurate and exam-relevant, but we do not guarantee any specific result or rank. Always cross-check critical facts with official sources.",
  },
  {
    h: "Changes",
    p: "We may update these terms as the product evolves. Continued use after changes means you accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Legal" title="Terms of Service" sub="Last updated: June 2026" />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-sm font-semibold leading-8 text-[#536259]">
          This is a plain-language summary of the terms for using Sarit Learn. A full legal version will be published
          before public launch.
        </p>
        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-lg font-black tracking-tight text-[#13251d]">{s.h}</h2>
              <p className="mt-2 text-sm font-semibold leading-8 text-[#536259]">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

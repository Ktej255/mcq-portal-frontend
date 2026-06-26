import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Privacy Policy — Sarit Classes",
  description: "How Sarit Classes collects, uses and protects your data.",
  path: "/privacy",
});

const sections = [
  {
    h: "Information we collect",
    p: "We collect the information you provide when you create an account (such as name and email) and the learning activity you generate on the platform — quizzes attempted, progress, bookmarks and revision history — so we can personalise your preparation.",
  },
  {
    h: "How we use your information",
    p: "Your data is used to build your personalized plan, track your progress, surface weak areas, schedule revision and improve the product. We do not sell your personal data.",
  },
  {
    h: "Data security",
    p: "We use industry-standard measures to protect your data. No method of transmission or storage is fully secure, but we work continuously to safeguard your information.",
  },
  {
    h: "Your choices",
    p: "You can access, update or delete your account data at any time. Contact us to exercise these rights or to ask any privacy question.",
  },
  {
    h: "Changes to this policy",
    p: "We may update this policy as the product evolves. Material changes will be communicated through the platform.",
  },
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Legal" title="Privacy Policy" sub="Last updated: June 2026" />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-sm font-semibold leading-8 text-[#536259]">
          This is a plain-language summary of how we handle your data. A full legal version will be published before
          public launch. By using Sarit Classes you agree to the practices described here.
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

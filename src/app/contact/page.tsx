import { Mail, MessageSquare, MapPin } from "lucide-react";

import { ContactForm } from "@/components/marketing/ContactForm";
import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contact Sarit Classes — Support, Partnerships & Feedback",
  description: "Get in touch with the Sarit Classes team — support, partnerships, and feedback.",
  path: "/contact",
});

const channels = [
  { icon: Mail, title: "Email", detail: "support@saritlearn.com", href: "mailto:support@saritlearn.com" },
  { icon: MessageSquare, title: "Help & support", detail: "We reply within one working day.", href: "mailto:support@saritlearn.com" },
  { icon: MapPin, title: "Based in", detail: "India · serving aspirants nationwide", href: undefined },
];

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you."
        sub="Questions, feedback, or want a specific optional subject prioritised? Reach out — real humans read every message."
      />

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((c) => {
            const Icon = c.icon;
            const inner = (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{c.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{c.detail}</p>
              </>
            );
            return c.href ? (
              <a
                key={c.title}
                href={c.href}
                className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {inner}
              </a>
            ) : (
              <div key={c.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                {inner}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-[#13251d]">Send us a note</h2>
          <p className="mt-1 text-sm font-semibold text-[#536259]">
            Write to us here and we will reply by email.
          </p>
          <ContactForm supportEmail="support@saritlearn.com" />
        </div>
      </section>
    </PageShell>
  );
}

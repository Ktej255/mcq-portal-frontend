import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Contact — Sarit Learn UPSC Command",
  description: "Get in touch with the Sarit Learn team — support, partnerships, and feedback.",
};

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
            Prefer email? Click below and your mail app will open with our address pre-filled.
          </p>
          <form className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">Message</label>
              <textarea
                rows={4}
                placeholder="How can we help?"
                className="rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
            <div className="sm:col-span-2">
              <a
                href="mailto:support@saritlearn.com"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                Email us
              </a>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

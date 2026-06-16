import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageShell } from "@/components/marketing/PageShell";

const links = [
  { label: "Subjects", href: "/subjects" },
  { label: "Free PYQs", href: "/pyqs" },
  { label: "Current affairs", href: "/current-affairs" },
  { label: "UPSC guides", href: "/guides" },
];

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8c5d14]">404</p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#13251d] md:text-5xl">
          This page wandered off the syllabus.
        </h1>
        <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#536259]">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Here are some good places to continue.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c7] bg-[#fffdf8] px-4 py-2 text-sm font-bold text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              {l.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
        >
          Back to home
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </PageShell>
  );
}

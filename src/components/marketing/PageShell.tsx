import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f4ee] text-[#13251d]">
      <SiteNav />
      <main className="pt-16">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[#dcd5c7]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_85%_0%,rgba(29,158,117,0.12),transparent),radial-gradient(45%_50%_at_5%_0%,rgba(239,159,39,0.10),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8c5d14]">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#13251d] md:text-5xl">
          {title}
        </h1>
        {sub ? <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#536259]">{sub}</p> : null}
      </div>
    </section>
  );
}

export function StartFreeCta({ label = "Start free — no card" }: { label?: string }) {
  return (
    <Link
      href="/start"
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
    >
      {label}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  );
}

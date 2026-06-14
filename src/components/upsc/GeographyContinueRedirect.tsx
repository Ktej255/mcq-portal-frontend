"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";

import { getGeographyContinueRoute } from "@/lib/upsc/geographyContinue";
import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";

export function GeographyContinueRedirect() {
  const router = useRouter();
  const { isLoaded, progress } = useGeographyProgress();
  const learnerLevel = readStudentProfile()?.level ?? "beginner";
  const route = useMemo(
    () => getGeographyContinueRoute(progress, learnerLevel, { isLoaded }),
    [isLoaded, learnerLevel, progress]
  );

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => router.replace(route.href), 250);
    return () => window.clearTimeout(timer);
  }, [isLoaded, route.href, router]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-[#13251d] md:px-8">
      <section
        data-testid="geography-continue-redirect"
        data-loaded={isLoaded ? "true" : "false"}
        data-continue-day={route.day}
        data-continue-href={route.href}
        className="mx-auto max-w-xl rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
          <Compass className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
          Continue Geography
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Finding the next right room</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
          {isLoaded ? route.reason : "Reading local Watch, Talk, Revisit, and MCQ progress first."}
        </p>
        <Link
          href={route.href}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
        >
          {isLoaded ? route.label : "Open when ready"} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/upsc/geography?day=${route.day}`}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a] transition hover:bg-[#f2eadc]"
        >
          Open Command instead
        </Link>
      </section>
    </main>
  );
}

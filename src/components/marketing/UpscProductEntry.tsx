"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  Map,
  MessageSquareText,
  PlayCircle,
  Route,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const accessStorageKey = "sarit-upsc-access-pass-v1";

type AccessPass = {
  product: "UPSC Command";
  status: "LOCAL_ACTIVE";
  plan: "June Geography Pilot";
  activatedAt: string;
  landingRoute: string;
};

const sequence = [
  { label: "Watch", detail: "Structured lesson room", icon: PlayCircle },
  { label: "Talk", detail: "AI teacher discussion", icon: MessageSquareText },
  { label: "Visual Lab", detail: "Maps and concept boards", icon: Map },
  { label: "MCQ", detail: "Fresh practice action", icon: ClipboardCheck },
  { label: "Track", detail: "Weakness and progress signals", icon: Route },
  { label: "Revisit", detail: "Recovery and revision loop", icon: BookOpenCheck },
];

const subjectWindows = [
  ["June", "Geography", "Build pilot"],
  ["July", "Environment + Disaster Management", "Structure next"],
  ["August", "Economy", "Prepare subject room"],
  ["September", "Science and Tech", "Prepare subject room"],
  ["Next", "Polity + Governance", "Mega chapter"],
];

type ProductStat = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

export function UpscProductEntry() {
  const [accessPass, setAccessPass] = useState<AccessPass | null>(null);
  const showLocalAccess =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN === "true";

  useEffect(() => {
    const rawPass = localStorage.getItem(accessStorageKey);
    if (!rawPass) return;

    try {
      setAccessPass(JSON.parse(rawPass) as AccessPass);
    } catch {
      localStorage.removeItem(accessStorageKey);
    }
  }, []);

  const accessStatus = useMemo(() => {
    if (!showLocalAccess) return "Student account required for personal progress";
    if (!accessPass) return "Access not activated on this device";
    return `Local access active since ${new Date(accessPass.activatedAt).toLocaleDateString()}`;
  }, [accessPass, showLocalAccess]);

  const productStats: ProductStat[] = [
    { label: "Access", detail: accessStatus, icon: ShieldCheck },
    { label: "Mode", detail: showLocalAccess ? "Local preview access enabled" : "Supabase account continuity", icon: BrainCircuit },
    { label: "Core", detail: "MCQ is an action, not the whole product", icon: Layers3 },
  ];

  function activateAccess(landingRoute: string) {
    const nextPass: AccessPass = {
      product: "UPSC Command",
      status: "LOCAL_ACTIVE",
      plan: "June Geography Pilot",
      activatedAt: new Date().toISOString(),
      landingRoute,
    };

    localStorage.setItem(accessStorageKey, JSON.stringify(nextPass));
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_upsc_paid_access_local");
    window.location.assign(landingRoute);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ee] text-[#13251d]">
      <section className="relative min-h-screen border-b border-[#dcd5c7]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,244,238,0.94)_0%,rgba(247,244,238,0.88)_44%,rgba(20,68,54,0.18)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 border-l border-[#dcd5c7] bg-[#e7f5ee] lg:block">
          <div className="grid h-full grid-cols-6 grid-rows-6 gap-px bg-[#cfe0d7]">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                key={index}
                className={
                  index % 7 === 0
                    ? "bg-[#1a3a2a]"
                    : index % 5 === 0
                      ? "bg-[#ef9f27]"
                      : index % 4 === 0
                        ? "bg-[#d8edf7]"
                        : "bg-[#f7f4ee]"
                }
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 md:px-8 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black uppercase tracking-tight">UPSC Command</p>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Civil services learning system</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8c5d14]">June Geography pilot</p>
              <h1 className="text-5xl font-black leading-none tracking-tight text-[#13251d] md:text-7xl">
                UPSC Command
              </h1>
              <p className="max-w-2xl text-lg font-semibold leading-8 text-[#536259] md:text-xl">
                A subject-first learning portal where classes, discussion, maps, fresh MCQs, tracking, and revision stay
                connected in one daily loop.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {showLocalAccess ? (
                <>
                  <Button
                    type="button"
                    onClick={() => activateAccess("/upsc")}
                    className="h-11 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white hover:bg-[#10291d]"
                  >
                    Activate local UPSC access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => activateAccess("/upsc/geography")}
                    variant="outline"
                    className="h-11 rounded-md border-[#1d9e75]/40 bg-[#e7f5ee] px-5 text-sm font-black text-[#085041] hover:bg-[#d8f0e6]"
                  >
                    Open Geography pilot
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/upsc"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Start UPSC portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/login?redirect=/upsc/geography"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-5 text-sm font-black text-[#085041] transition hover:bg-[#d8f0e6]"
                  >
                    Open Geography pilot
                  </Link>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {productStats.map(({ label, detail, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                  <Icon className="mb-4 h-5 w-5 text-[#1d9e75]" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8173]">{label}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#33443b]">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-[#cadfd6] bg-[#fffdf8] p-4 shadow-sm md:p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Student journey</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Lesson to command loop</h2>
                </div>
                <Sparkles className="h-5 w-5 text-[#ef9f27]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sequence.map((item, index) => (
                  <div key={item.label} className="rounded-lg border border-[#e1d8ca] bg-[#f7f4ee] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <item.icon className="h-5 w-5 text-[#1a3a2a]" />
                      <span className="text-xs font-black text-[#8c5d14]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-base font-black text-[#13251d]">{item.label}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#5e6b62]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next route</p>
                    <p className="mt-1 text-sm font-bold text-[#33443b]">Paid user lands on UPSC portal, then Geography.</p>
                  </div>
                  <Link
                    href="/upsc"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-white px-4 text-sm font-black text-[#085041] transition hover:bg-[#f7f4ee]"
                  >
                    View portal map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:px-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Product status</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Controlled Geography pilot is the first launch path.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
            Students enter through one account route, complete the daily Geography loop, and use MCQs as one action
            inside the wider learning system.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {subjectWindows.map(([windowLabel, subject, status]) => (
            <div key={`${windowLabel}-${subject}`} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8c5d14]">{windowLabel}</p>
              <h3 className="mt-3 text-base font-black text-[#13251d]">{subject}</h3>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#536259]">
                <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                {status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

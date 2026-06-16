"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Flame,
  Map,
  MessageSquareText,
  PlayCircle,
  Route,
  Target,
  type LucideIcon,
} from "lucide-react";

import { UpgradeNudge } from "@/components/upsc/UpgradeNudge";

const STORAGE_KEY = "sarit-diagnostic-plan-v1";

type Plan = {
  year?: string;
  stage?: string;
  subjects?: string[];
  hours?: string;
  optional?: string;
};

const loopSteps: { label: string; detail: string; icon: LucideIcon; done: boolean }[] = [
  { label: "Watch", detail: "Today's concept lesson", icon: PlayCircle, done: true },
  { label: "Talk", detail: "Ask the AI teacher", icon: MessageSquareText, done: true },
  { label: "Visual Lab", detail: "Maps & concept boards", icon: Map, done: true },
  { label: "MCQ", detail: "Fresh daily practice", icon: ClipboardCheck, done: true },
  { label: "Track", detail: "Weakness signals", icon: Route, done: false },
  { label: "Revisit", detail: "Spaced revision", icon: BookOpenCheck, done: false },
];

const dailyMcqByHours: Record<string, number> = {
  "Under 2 hours": 10,
  "2–4 hours": 20,
  "4–6 hours": 30,
  "6+ hours": 40,
};

export function DashboardPreview() {
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe localStorage read after mount
      if (raw) setPlan(JSON.parse(raw) as Plan);
    } catch {
      // ignore
    }
  }, []);

  const focus = plan?.subjects?.[0] ?? "Geography";
  const dailyMcqs = plan?.hours ? dailyMcqByHours[plan.hours] ?? 10 : 10;
  const weakTopics = (plan?.subjects && plan.subjects.length > 0 ? plan.subjects : ["Geography", "Polity & Governance", "Economy"]).slice(0, 5);
  const doneCount = loopSteps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / loopSteps.length) * 100);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      {/* preview banner */}
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#ef9f27]/40 bg-[#fff7e9] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-[#8c5d14]">
          This is a read-only preview of your daily command center{plan ? ", personalized from your diagnostic." : "."}
        </p>
        <Link
          href="/login?redirect=/upsc"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
        >
          Continue to the portal
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <UpgradeNudge
        signals={{
          tier: "free",
          billingCycle: "monthly",
          mcqUsedToday: dailyMcqs,
          targetYear: plan?.year,
          streakDays: 12,
        }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Today's loop */}
        <div className="rounded-3xl border border-[#cadfd6] bg-[#fffdf8] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Today&apos;s loop</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{focus} · Day 12</h2>
            </div>
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#1d9e75 0% ${pct}%, #e7f5ee ${pct}% 100%)` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fffdf8]">
                <span className="text-sm font-black text-[#085041]">{doneCount}/{loopSteps.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {loopSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className={`rounded-2xl border p-4 ${
                    step.done ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#e1d8ca] bg-[#f7f4ee]"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${step.done ? "text-[#085041]" : "text-[#1a3a2a]"}`} />
                  <h3 className="mt-3 text-sm font-black text-[#13251d]">{step.label}</h3>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-[#536259]">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">Streak</p>
              <p className="mt-1 text-2xl font-black text-[#13251d]">12 days</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff2dd] text-[#ef9f27]">
              <Flame className="h-6 w-6" />
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Today&apos;s target</p>
              <p className="mt-1 text-2xl font-black text-[#13251d]">{dailyMcqs} MCQs</p>
              <p className="text-xs font-semibold text-[#536259]">+ daily current-affairs quiz</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f5ee] text-[#085041]">
              <Target className="h-6 w-6" />
            </span>
          </div>

          {plan?.year ? (
            <div className="rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">Your goal</p>
              <p className="mt-1 text-sm font-bold text-[#33443b]">
                {answersSummary(plan)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Weakness queue */}
      <div className="mt-6 rounded-3xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Route className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-xl font-black tracking-tight text-[#13251d]">Your weakness recovery queue</h2>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-[#536259]">
          We resurface these — your focus areas — at the right interval so you stop forgetting them.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weakTopics.map((t, i) => (
            <div key={t} className="flex items-center justify-between rounded-xl border border-[#e1d8ca] bg-[#f7f4ee] p-4">
              <span className="text-sm font-black text-[#13251d]">{t}</span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">
                {i === 0 ? "Due today" : i === 1 ? "Tomorrow" : "This week"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function answersSummary(plan: Plan): string {
  const parts: string[] = [];
  if (plan.year) parts.push(`${plan.year} attempt`);
  if (plan.stage) parts.push(plan.stage.toLowerCase());
  if (plan.hours) parts.push(`${plan.hours.toLowerCase()} a day`);
  return parts.join(" · ");
}

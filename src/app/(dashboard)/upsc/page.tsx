import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { learningSteps, upscCalendar } from "@/lib/upsc/plan";
import { cn } from "@/lib/utils";

export default function UpscPortalPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-[#f7f4ee]">
                UPSC Command
              </Badge>
              <span className="text-sm font-semibold text-[#6f756d]">One subject. One month. Command it.</span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">June sprint</p>
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[#13251d] md:text-5xl">
                    Geography is the first live subject room.
                  </h1>
                  <p className="max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
                    The portal now moves beyond standalone MCQ practice into a full learning sequence: watch, talk, test,
                    track, and revisit. MCQ remains a strong action inside the flow.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/upsc/daily-command"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#1d9e75]/30 bg-[#e7f5ee] px-4 text-sm font-bold text-[#085041] transition hover:bg-[#d8f0e6]"
                  >
                    Open Daily Mission <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/geography"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#10291d]"
                  >
                    Open Geography <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/tests"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    <ClipboardCheck className="h-4 w-4" /> MCQ Engine
                  </Link>
                  <Link
                    href="/upsc/environment"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#1d9e75]/30 bg-[#e7f5ee] px-4 text-sm font-bold text-[#085041] transition hover:bg-[#d8f0e6]"
                  >
                    Open Environment <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/disaster-management"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ef9f27]/40 bg-[#fff4df] px-4 text-sm font-bold text-[#6f4a12] transition hover:bg-[#ffe8bf]"
                  >
                    Open Disaster Management <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/economy"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#2563eb]/30 bg-[#eff6ff] px-4 text-sm font-bold text-[#172554] transition hover:bg-[#dbeafe]"
                  >
                    Open Economy <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/science-tech"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#0891b2]/30 bg-[#ecfeff] px-4 text-sm font-bold text-[#164e63] transition hover:bg-[#cffafe]"
                  >
                    Open Science and Tech <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/polity-governance"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#7c3aed]/30 bg-[#f5f3ff] px-4 text-sm font-bold text-[#312e81] transition hover:bg-[#ede9fe]"
                  >
                    Open Polity and Governance <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/internal-security-society"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#b45309]/30 bg-[#fff7ed] px-4 text-sm font-bold text-[#451a03] transition hover:bg-[#ffedd5]"
                  >
                    Open Internal Security and Society <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/history"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#be123c]/30 bg-[#fff1f2] px-4 text-sm font-bold text-[#4c0519] transition hover:bg-[#ffe4e6]"
                  >
                    Open History <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/revision-command"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#0f766e]/30 bg-[#f0fdfa] px-4 text-sm font-bold text-[#134e4a] transition hover:bg-[#ccfbf1]"
                  >
                    Open Revision Command <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/mcq-command"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ca8a04]/30 bg-[#fefce8] px-4 text-sm font-bold text-[#713f12] transition hover:bg-[#fef3c7]"
                  >
                    Open MCQ Command <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/content-command"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#0e7490]/30 bg-[#ecfeff] px-4 text-sm font-bold text-[#164e63] transition hover:bg-[#cffafe]"
                  >
                    Open Content Command <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/upsc/readiness-audit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#475569]/30 bg-[#f8fafc] px-4 text-sm font-bold text-[#334155] transition hover:bg-[#e2e8f0]"
                  >
                    Open Readiness Audit <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="rounded-md border-[#1d9e75]/30 text-[#085041]">
                    Build now
                  </Badge>
                </div>
                <h2 className="text-xl font-black text-[#085041]">June Geography</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#41645a]">
                  Map-first modules, visual labs, daily concept work, fresh tests, and revision recovery.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {["30 days", "4 weeks", "5 steps"].map((item) => (
                    <div key={item} className="rounded-md bg-white/75 px-2 py-3 text-xs font-black text-[#085041]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#1b2f27]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#13251d]">Student landing after payment</p>
                <p className="text-xs font-semibold text-[#7c766a]">UPSC page, not raw test list</p>
              </div>
            </div>

            <div className="space-y-3">
              {["Paid UPSC access", "Current subject room", "Daily plan", "MCQ action button", "Revision queue"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-[#f7f4ee] px-3 py-2 text-sm font-bold text-[#33443b]">
                  <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Core learning loop</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">From lesson to command</h2>
            </div>
            <Sparkles className="h-5 w-5 text-[#ef9f27]" />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {learningSteps.map((step) => (
              <div key={step.label} className={cn("rounded-lg p-4 ring-1", step.tone)}>
                <step.icon className="mb-4 h-5 w-5" />
                <h3 className="text-base font-black">{step.label}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#13251d]">Subject calendar</h2>
                <p className="text-sm font-medium text-[#756f64]">Current one-year UPSC build order</p>
              </div>
            </div>

            <div className="rounded-md bg-[#f7f4ee] p-4">
              <p className="text-sm font-bold leading-6 text-[#4f5e55]">
                Geography is the pilot. Each later subject should inherit the same structure: subject home, daily plan,
                content room, talk room, MCQ action, analytics, and revision.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {upscCalendar.map((item) => {
              const cardContent = (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.window}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md text-[11px]",
                        item.status === "Build now" || item.status === "Structure ready"
                          ? "border-[#1d9e75]/40 text-[#085041]"
                          : "border-[#d8cbb8] text-[#7a6b59]"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-black text-[#13251d]">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{item.detail}</p>
                  {item.href && (
                    <p className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      Open room <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  )}
                </>
              );

              return item.href ? (
                <Link
                  key={`${item.window}-${item.title}`}
                  href={item.href}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm transition hover:border-[#1d9e75]/50 hover:bg-[#fdfaf3]"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={`${item.window}-${item.title}`}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

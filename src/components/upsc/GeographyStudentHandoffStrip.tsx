import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDot, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

export type GeographyStudentHandoffStatus = "done" | "current" | "next" | "locked";

export type GeographyStudentHandoffStep = {
  label: string;
  detail: string;
  status: GeographyStudentHandoffStatus;
};

type GeographyStudentHandoffRoute = {
  label: string;
  detail: string;
  href: string;
  locked?: boolean;
};

type GeographyStudentHandoffStripProps = {
  testId: string;
  activeDay: number;
  title: string;
  detail: string;
  previous: GeographyStudentHandoffRoute;
  next: GeographyStudentHandoffRoute;
  steps: GeographyStudentHandoffStep[];
};

const statusTone: Record<GeographyStudentHandoffStatus, string> = {
  done: "border-[#1d9e75]/45 bg-[#e7f5ee] text-[#085041]",
  current: "border-[#1a3a2a] bg-[#1a3a2a] text-white",
  next: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]",
  locked: "border-[#dcd5c7] bg-[#fbf8f0] text-[#746f66]",
};

function statusIcon(status: GeographyStudentHandoffStatus) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "locked") return <LockKeyhole className="h-4 w-4" />;
  return <CircleDot className="h-4 w-4" />;
}

export function GeographyStudentHandoffStrip({
  testId,
  activeDay,
  title,
  detail,
  previous,
  next,
  steps,
}: GeographyStudentHandoffStripProps) {
  return (
    <section
      data-testid={`geography-student-handoff-${testId}`}
      className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Day {activeDay} student handoff</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">{detail}</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[310px]">
          <Link
            data-testid={`geography-student-handoff-previous-${testId}`}
            href={previous.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="min-w-0">
              <span className="block text-left text-xs uppercase tracking-[0.14em] text-[#746f66]">Back</span>
              <span className="block break-words text-left">{previous.label}</span>
            </span>
          </Link>
          {next.locked ? (
            <span
              data-testid={`geography-student-handoff-next-${testId}`}
              aria-disabled="true"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ef9f27]/45 bg-[#fff4df] px-3 text-sm font-black text-[#6f4a12]"
            >
              <LockKeyhole className="h-4 w-4" />
              <span className="min-w-0">
                <span className="block text-left text-xs uppercase tracking-[0.14em]">Locked</span>
                <span className="block break-words text-left">{next.label}</span>
              </span>
            </span>
          ) : (
            <Link
              data-testid={`geography-student-handoff-next-${testId}`}
              href={next.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              <span className="min-w-0">
                <span className="block text-left text-xs uppercase tracking-[0.14em] text-white/70">Next</span>
                <span className="block break-words text-left">{next.label}</span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={`${step.label}-${step.status}`}
            data-testid={`geography-student-handoff-step-${testId}-${index + 1}`}
            className={cn("rounded-md border p-3", statusTone[step.status])}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              {statusIcon(step.status)}
              <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
                {step.status}
              </span>
            </div>
            <p className="text-sm font-black leading-5">{step.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3 text-xs font-bold leading-5 text-[#085041] md:grid-cols-2">
        <p data-testid={`geography-student-handoff-previous-detail-${testId}`}>{previous.detail}</p>
        <p data-testid={`geography-student-handoff-next-detail-${testId}`}>{next.detail}</p>
      </div>
    </section>
  );
}

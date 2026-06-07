"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LineChart,
  MapPinned,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type GeographyLoopRoom = "watch" | "talk" | "lab" | "mcq" | "track" | "revisit";

type GeographyLoopActionsProps = {
  activeDay: number;
  labSlug: string;
  current?: GeographyLoopRoom;
  title?: string;
  detail?: string;
  className?: string;
  showDayControls?: boolean;
  onSelectDay?: (day: number) => void;
};

const geographyDayCount = 30;

function buildLoopHref(room: GeographyLoopRoom | undefined, day: number, labSlug: string) {
  if (room === "watch") return `/upsc/geography/watch?day=${day}`;
  if (room === "talk") return `/upsc/geography/talk?day=${day}`;
  if (room === "lab") return `/upsc/geography/lab?mode=${labSlug}&day=${day}`;
  if (room === "mcq") return `/upsc/geography/mcq-readiness?day=${day}`;
  if (room === "track") return `/upsc/geography/track?day=${day}`;
  if (room === "revisit") return `/upsc/geography/revisit?day=${day}`;
  return `/upsc/geography?day=${day}`;
}

export function GeographyLoopActions({
  activeDay,
  labSlug,
  current,
  title = "Learning loop",
  detail = "Move through the same Geography workflow from any room.",
  className,
  showDayControls = true,
  onSelectDay,
}: GeographyLoopActionsProps) {
  const previousHref = activeDay > 1 ? buildLoopHref(current, activeDay - 1, labSlug) : null;
  const nextHref = activeDay < geographyDayCount ? buildLoopHref(current, activeDay + 1, labSlug) : null;
  const canGoPrevious = activeDay > 1;
  const canGoNext = activeDay < geographyDayCount;
  const actions = [
    {
      id: "talk" as const,
      step: "01",
      label: "Talk",
      detail: "Recall",
      href: `/upsc/geography/talk?day=${activeDay}`,
      icon: BrainCircuit,
    },
    {
      id: "watch" as const,
      step: "02",
      label: "Watch",
      detail: "Repair",
      href: `/upsc/geography/watch?day=${activeDay}`,
      icon: PlayCircle,
    },
    {
      id: "lab" as const,
      step: "03",
      label: "Visual Lab",
      detail: "Map",
      href: `/upsc/geography/lab?mode=${labSlug}&day=${activeDay}`,
      icon: MapPinned,
    },
    {
      id: "mcq" as const,
      step: "04",
      label: "MCQ",
      detail: "Practice",
      href: `/upsc/geography/mcq-readiness?day=${activeDay}`,
      icon: ClipboardCheck,
    },
    {
      id: "track" as const,
      step: "05",
      label: "Track",
      detail: "Progress",
      href: `/upsc/geography/track?day=${activeDay}`,
      icon: LineChart,
    },
    {
      id: "revisit" as const,
      step: "06",
      label: "Revisit",
      detail: "Repair",
      href: `/upsc/geography/revisit?day=${activeDay}`,
      icon: RefreshCcw,
    },
  ];

  return (
    <div className={cn("rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">{title}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#657066]">{detail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            data-testid="loop-command-route"
            href={`/upsc/geography?day=${activeDay}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.14em] text-[#085041] transition hover:border-[#1d9e75]"
          >
            <ArrowLeft className="h-4 w-4" /> Command
          </Link>
          <div className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
            Day {activeDay}
          </div>
        </div>
      </div>

      <div data-testid="loop-sequence-spine" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => {
          const isCurrent = current === action.id;
          return (
            <Link
              key={action.id}
              href={action.href}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "group flex min-h-16 min-w-0 items-center gap-3 rounded-md border px-3 text-left transition hover:-translate-y-0.5",
                isCurrent
                  ? "border-[#1a3a2a] bg-[#1a3a2a] text-white shadow-sm"
                  : "border-[#dcd5c7] bg-[#f7f4ee] text-[#1a3a2a] hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
                  isCurrent ? "bg-white/15 text-white" : "bg-white text-[#085041] group-hover:bg-[#1d9e75] group-hover:text-white"
                )}
              >
                <action.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                  Step {action.step}
                </span>
                <span className="block break-words text-sm font-black leading-5">{action.label}</span>
                <span className="mt-0.5 block text-xs font-semibold opacity-70">{action.detail}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {showDayControls && (
        <div
          data-testid="loop-day-controls"
          className="mt-4 grid gap-2 border-t border-[#eee6d7] pt-4 sm:grid-cols-[1fr_auto_1fr]"
        >
          {canGoPrevious ? (
            <Link
              data-testid="loop-previous-day"
              href={previousHref ?? `/upsc/geography?day=${activeDay - 1}`}
              onClick={() => onSelectDay?.(activeDay - 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              <ChevronLeft className="h-4 w-4" /> Previous day
            </Link>
          ) : (
            <span
              data-testid="loop-previous-day-disabled"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#e3d9c7] bg-[#f7f4ee] px-3 text-sm font-bold text-[#9b9388]"
            >
              <ChevronLeft className="h-4 w-4" /> Previous day
            </span>
          )}

          <Link
            data-testid="loop-day-dashboard-route"
            href={`/upsc/geography?day=${activeDay}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Day dashboard
          </Link>

          {canGoNext ? (
            <Link
              data-testid="loop-next-day"
              href={nextHref ?? `/upsc/geography?day=${activeDay + 1}`}
              onClick={() => onSelectDay?.(activeDay + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Next day <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span
              data-testid="loop-next-day-disabled"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#e3d9c7] bg-[#f7f4ee] px-3 text-sm font-bold text-[#9b9388]"
            >
              Next day <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

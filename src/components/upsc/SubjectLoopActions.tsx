"use client";

import Link from "next/link";
import {
  BrainCircuit,
  ClipboardCheck,
  Layers3,
  LineChart,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";

import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { cn } from "@/lib/utils";

export type SubjectLoopRoom = "watch" | "talk" | "lab" | "mcq" | "track" | "revisit";

type SubjectLoopActionsProps = {
  plan: SubjectSprintPlan;
  activeDay: number;
  current?: SubjectLoopRoom;
  title?: string;
  detail?: string;
  className?: string;
};

export function SubjectLoopActions({
  plan,
  activeDay,
  current,
  title = "Learning loop",
  detail,
  className,
}: SubjectLoopActionsProps) {
  const basePath = `/upsc/${plan.slug}`;
  const boundedDay = Math.min(Math.max(activeDay, 1), plan.sessions.length);
  const activeSession = plan.sessions.find((session) => session.day === boundedDay) ?? plan.sessions[0];
  const activeLab = plan.labs.find((lab) => lab.title === activeSession.lab) ?? plan.labs[0];
  const loopDetail = detail ?? `Move through the same ${plan.title} workflow from any room.`;
  const themeStyle = getSubjectThemeStyle(plan);
  const actions = [
    {
      id: "watch" as const,
      label: "Watch",
      detail: "Class",
      href: `${basePath}/watch?day=${boundedDay}`,
      icon: PlayCircle,
    },
    {
      id: "talk" as const,
      label: "Talk",
      detail: "Explain",
      href: `${basePath}/talk?day=${boundedDay}`,
      icon: BrainCircuit,
    },
    ...(activeLab
      ? [
          {
            id: "lab" as const,
            label: "Lab",
            detail: "Visual",
            href: `${basePath}/lab?mode=${activeLab.slug}&day=${boundedDay}`,
            icon: Layers3,
          },
        ]
      : []),
    {
      id: "mcq" as const,
      label: "MCQ",
      detail: "Practice",
      href: `${basePath}/mcq-readiness?day=${boundedDay}`,
      icon: ClipboardCheck,
    },
    {
      id: "track" as const,
      label: "Track",
      detail: "Progress",
      href: `${basePath}/track`,
      icon: LineChart,
    },
    {
      id: "revisit" as const,
      label: "Revisit",
      detail: "Repair",
      href: `${basePath}/revisit?day=${boundedDay}`,
      icon: RefreshCcw,
    },
  ];

  return (
    <div
      data-testid="subject-loop-actions"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className={cn("rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm", className)}
    >
      <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{title}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--subject-muted)]">{loopDetail}</p>
        </div>
        <div className="max-w-full break-words rounded-md bg-[var(--subject-dark)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white sm:shrink-0">
          Day {boundedDay}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const isCurrent = current === action.id;
          return (
            <Link
              key={action.id}
              href={action.href}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "group flex min-h-14 items-center gap-3 rounded-md border px-3 text-left transition hover:-translate-y-0.5",
                isCurrent
                  ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white shadow-sm"
                  : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-dark)] hover:border-[var(--subject-accent)] hover:bg-[var(--subject-light)]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
                  isCurrent
                    ? "bg-white/15 text-white"
                    : "bg-white text-[var(--subject-dark)] group-hover:bg-[var(--subject-accent)] group-hover:text-white"
                )}
              >
                <action.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-5">{action.label}</span>
                <span className="mt-0.5 block text-xs font-semibold opacity-70">{action.detail}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

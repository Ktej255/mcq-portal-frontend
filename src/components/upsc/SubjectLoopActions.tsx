"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  ClipboardCheck,
  Layers3,
  LineChart,
  MessageSquare,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { cn } from "@/lib/utils";

export type SubjectLoopRoom = "watch" | "talk" | "lab" | "mcq" | "track" | "revisit" | "retro";

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
  const actions: Array<{
    id: SubjectLoopRoom;
    label: string;
    detail: string;
    href: string;
    icon: LucideIcon;
  }> = [
    {
      id: "watch",
      label: "Lesson",
      detail: "10-15 min topic",
      href: `${basePath}/watch?day=${boundedDay}`,
      icon: PlayCircle,
    },
    {
      id: "talk",
      label: "AI discussion",
      detail: "95% recall",
      href: `${basePath}/talk?day=${boundedDay}`,
      icon: BrainCircuit,
    },
    {
      id: "mcq",
      label: "Fresh MCQ",
      detail: "Practice",
      href: `${basePath}/mcq-readiness?day=${boundedDay}`,
      icon: ClipboardCheck,
    },
    {
      id: "track",
      label: "Track",
      detail: "Progress",
      href: `${basePath}/track?day=${boundedDay}`,
      icon: LineChart,
    },
    {
      id: "revisit",
      label: "Revisit",
      detail: "Repair",
      href: `${basePath}/revisit?day=${boundedDay}`,
      icon: RefreshCcw,
    },
    ...(activeLab
      ? [
          {
            id: "lab" as const,
            label: "Visual support",
            detail: "Optional",
            href: `${basePath}/lab?mode=${activeLab.slug}&day=${boundedDay}`,
            icon: Layers3,
          },
        ]
      : []),
    {
      id: "retro" as const,
      label: "Sunday retro",
      detail: "Frame repair",
      href: `${basePath}/retro?day=${boundedDay}`,
      icon: MessageSquare,
    },
  ];
  const currentAction = actions.find((action) => action.id === current) ?? actions[0];
  const guidedNextByRoom: Record<SubjectLoopRoom, { label: string; detail: string; href: string; icon: LucideIcon }> = {
    watch: {
      label: "AI discussion",
      detail: "Explain the lesson until recall reaches 95%.",
      href: `${basePath}/talk?day=${boundedDay}`,
      icon: BrainCircuit,
    },
    talk: {
      label: "Fresh MCQ",
      detail: "Open practice only after the recall gate is ready.",
      href: `${basePath}/mcq-readiness?day=${boundedDay}`,
      icon: ClipboardCheck,
    },
    lab: {
      label: "AI discussion",
      detail: "Use support, then explain again.",
      href: `${basePath}/talk?day=${boundedDay}`,
      icon: BrainCircuit,
    },
    mcq: {
      label: "Track progress",
      detail: "Check command, revisit, and next topic.",
      href: `${basePath}/track?day=${boundedDay}`,
      icon: LineChart,
    },
    track: {
      label: "Day overview",
      detail: "Return to the day card and selected task.",
      href: `${basePath}?day=${boundedDay}`,
      icon: LineChart,
    },
    revisit: {
      label: "AI discussion",
      detail: "Explain again after the repair note.",
      href: `${basePath}/talk?day=${boundedDay}`,
      icon: BrainCircuit,
    },
    retro: {
      label: "MCQ practice",
      detail: "Retry the batch after the mental frame audit.",
      href: `${basePath}/mcq-readiness?day=${boundedDay}`,
      icon: ClipboardCheck,
    },
  };
  const nextAction = current ? guidedNextByRoom[current] : guidedNextByRoom.watch;
  const CurrentIcon = currentAction.icon;
  const NextIcon = nextAction.icon;

  return (
    <div
      data-testid="subject-loop-actions"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className={cn("rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm", className)}
    >
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{title}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--subject-muted)]">{loopDetail}</p>
        </div>
        <div className="max-w-full break-words rounded-md bg-[var(--subject-dark)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white sm:shrink-0">
          Day {boundedDay}
        </div>
      </div>

      <div
        data-testid="subject-loop-one-action"
        className="grid gap-3 rounded-lg border border-[var(--subject-ring)] bg-[var(--subject-light)] p-3 xl:grid-cols-[1fr_auto_auto_auto]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-[var(--subject-dark)] shadow-sm">
            <CurrentIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
              Current step
            </p>
            <p className="mt-1 text-base font-black text-[var(--subject-heading)]">{currentAction.label}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--subject-muted)]">
              Guided next: {nextAction.label} - {activeSession.title}
            </p>
          </div>
        </div>
        <Link
          href={nextAction.href}
          data-testid="subject-loop-current-route"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
        >
          Open next <NextIcon className="h-4 w-4" />
        </Link>
        <Link
          href={currentAction.href}
          data-testid="subject-loop-current-room-route"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-4 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-bg)]"
        >
          Stay here <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`${basePath}?day=${boundedDay}`}
          data-testid="subject-loop-day-overview"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--subject-border)] bg-white px-4 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-bg)]"
        >
          Day overview
        </Link>
      </div>

      <details data-testid="subject-loop-room-switcher" className="mt-3 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)] marker:hidden">
          Switch room
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="grid gap-2 border-t border-[var(--subject-border)] p-3 sm:grid-cols-2 xl:grid-cols-3">
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
      </details>
    </div>
  );
}

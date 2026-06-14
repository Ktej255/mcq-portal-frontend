"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";

import { geographySessions } from "@/lib/upsc/plan";
import { cn } from "@/lib/utils";

type GeographyRoomCompassProps = {
  day: number;
  title: string;
  room: "Watch" | "Talk" | "MCQ" | "Revisit" | "Track" | "Lab";
  detail: string;
  primaryHref?: string;
  primaryLabel?: string;
  className?: string;
};

export function GeographyRoomCompass({
  day,
  title,
  room,
  detail,
  primaryHref,
  primaryLabel = "Continue",
  className,
}: GeographyRoomCompassProps) {
  const commandHref = `/upsc/geography?day=${day}`;

  return (
    <section
      data-testid="geography-room-compass"
      data-room={room.toLowerCase()}
      data-day={day}
      data-total-days={geographySessions.length}
      data-command-href={commandHref}
      data-primary-action-href={primaryHref ?? ""}
      className={cn("rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm", className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={commandHref}
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041] transition hover:border-[#1d9e75]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Command
            </Link>
            <span className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              {room}
            </span>
            <span className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-black text-[#5d675f]">
              Day {day} of {geographySessions.length}
            </span>
          </div>
          <h2 className="mt-3 break-words text-xl font-black leading-tight text-[#13251d] md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#657066]">{detail}</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-64">
          {primaryHref ? (
            <Link
              href={primaryHref}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <Link
            href={commandHref}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a] transition hover:bg-[#f2eadc]"
          >
            <Compass className="h-4 w-4" /> Find topic or switch day
          </Link>
        </div>
      </div>
      <p
        data-testid="geography-room-compass-rule"
        className="mt-3 rounded-md border border-[#eee7dc] bg-[#f7f4ee] px-3 py-2 text-xs font-black leading-5 text-[#49675e]"
      >
        Simple rule: follow the green action. Use Command only when you need the topic finder, day map, or profile controls.
      </p>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay17EconomicActivitiesStages } from "@/lib/upsc/geographyDay17PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay17EconomicActivitiesVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay17EconomicActivitiesStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay17EconomicActivitiesStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay17EconomicActivitiesStages)[number]["id"]) =>
    geographyDay17EconomicActivitiesStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day17-economic-activities-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Economic activities sector ladder from primary resource use to structural change"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path d="M92 290 L196 238 L304 186 L412 134 L528 82" fill="none" stroke="#d1fae5" strokeWidth="7" strokeDasharray="11 8" opacity="0.76" />

            <g opacity={isVisible("primary") ? 1 : 0.16}>
              <circle cx="92" cy="290" r="48" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <text x="92" y="284" textAnchor="middle" fill="#86efac" fontSize="11" fontWeight="900">PRIMARY</text>
              <text x="92" y="304" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">resource use</text>
            </g>

            <g opacity={isVisible("secondary") ? 1 : 0.14}>
              <circle cx="196" cy="238" r="48" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
              <text x="196" y="232" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="900">SECONDARY</text>
              <text x="196" y="252" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">transformation</text>
            </g>

            <g opacity={isVisible("tertiary") ? 1 : 0.14}>
              <circle cx="304" cy="186" r="48" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
              <text x="304" y="180" textAnchor="middle" fill="#bae6fd" fontSize="11" fontWeight="900">TERTIARY</text>
              <text x="304" y="200" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">services</text>
            </g>

            <g opacity={isVisible("knowledge") ? 1 : 0.14}>
              <circle cx="412" cy="134" r="50" fill="#0f172a" stroke="#c4b5fd" strokeWidth="4" />
              <text x="412" y="128" textAnchor="middle" fill="#ddd6fe" fontSize="10" fontWeight="900">KNOWLEDGE</text>
              <text x="412" y="146" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">research data decisions</text>
            </g>

            <g opacity={isVisible("shift") ? 1 : 0.14}>
              <circle cx="528" cy="82" r="56" fill="#0f172a" stroke="#fb7185" strokeWidth="4" />
              <text x="528" y="76" textAnchor="middle" fill="#fecdd3" fontSize="11" fontWeight="900">SHIFT</text>
              <text x="528" y="94" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">productivity and technology</text>
              <rect x="330" y="264" width="270" height="64" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="346" y="288" fill="#86efac" fontSize="10" fontWeight="900">CLASSIFY THE SPECIFIC ACTIVITY</text>
              <text x="346" y="308" fill="#fde68a" fontSize="9" fontWeight="900">real chains contain several sectors</text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#86efac]">{activeStage.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.label}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.explanation}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fde68a]">
              {activeStage.proof}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              title={isPlaying ? "Pause animation" : "Play animation"}
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#15803d] px-3 text-sm font-black text-white transition hover:bg-[#166534]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Restart animation"
              onClick={() => {
                setIsPlaying(false);
                setActiveIndex(0);
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-5">
        {geographyDay17EconomicActivitiesStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day17-economic-activities-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#28543f] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#dcfce7]" : "text-white/60 hover:bg-[#166534] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

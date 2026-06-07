"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay21HumanGeographyConsolidationStages } from "@/lib/upsc/geographyDay21PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay21HumanGeographyConsolidationVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay21HumanGeographyConsolidationStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay21HumanGeographyConsolidationStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay21HumanGeographyConsolidationStages)[number]["id"]) =>
    geographyDay21HumanGeographyConsolidationStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day21-human-geography-consolidation-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Human geography consolidation chain connecting population, settlement, economy, networks, regional outcome, and weak-link repair"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("people") ? 1 : 0.16}>
              <circle cx="92" cy="174" r="42" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <circle cx="82" cy="162" r="8" fill="#86efac" />
              <circle cx="108" cy="160" r="8" fill="#86efac" />
              <path d="M66 194 C82 178, 106 178, 122 194" fill="none" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
              <text x="48" y="238" fill="#dcfce7" fontSize="10" fontWeight="900">PEOPLE</text>
              <text x="42" y="34" fill="#86efac" fontSize="10" fontWeight="900">HUMAN GEOGRAPHY CHAIN</text>
            </g>

            <g opacity={isVisible("settlements") ? 1 : 0.14}>
              <path d="M150 174 L222 174" fill="none" stroke="#86efac" strokeWidth="5" strokeDasharray="8 6" />
              <rect x="222" y="132" width="94" height="84" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
              <path d="M238 198 L238 170 L254 154 L270 170 L270 198 M280 198 L280 160 L300 160 L300 198" fill="none" stroke="#bae6fd" strokeWidth="4" />
              <text x="226" y="238" fill="#bae6fd" fontSize="10" fontWeight="900">SETTLEMENT</text>
            </g>

            <g opacity={isVisible("economy") ? 1 : 0.14}>
              <path d="M316 174 L374 174" fill="none" stroke="#fbbf24" strokeWidth="5" strokeDasharray="8 6" />
              <circle cx="412" cy="174" r="42" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
              <path d="M390 190 L390 164 L410 146 L430 164 L430 190 M384 190 L438 190" fill="none" stroke="#fde68a" strokeWidth="4" />
              <text x="380" y="238" fill="#fef3c7" fontSize="10" fontWeight="900">ECONOMY</text>
            </g>

            <g opacity={isVisible("networks") ? 1 : 0.14}>
              <path d="M454 174 L536 174" fill="none" stroke="#38bdf8" strokeWidth="5" strokeDasharray="8 6" />
              <circle cx="564" cy="174" r="38" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
              <path d="M544 174 L584 174 M564 154 L564 194" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
              <text x="526" y="238" fill="#bae6fd" fontSize="10" fontWeight="900">NETWORK</text>
              <path d="M92 92 C240 52, 414 54, 564 94" fill="none" stroke="#fde68a" strokeWidth="5" strokeDasharray="10 8" />
              <text x="208" y="62" fill="#fef3c7" fontSize="10" fontWeight="900">REGIONAL OUTCOME: GAIN AND PRESSURE</text>
            </g>

            <g opacity={isVisible("repair") ? 1 : 0.14}>
              <rect x="166" y="276" width="308" height="64" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="186" y="302" fill="#fecdd3" fontSize="10" fontWeight="900">REPAIR THE WEAKEST LINK</text>
              <text x="186" y="322" fill="#ffffff" fontSize="9" fontWeight="800">indicator example map link mismatch trap</text>
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
        {geographyDay21HumanGeographyConsolidationStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day21-human-geography-consolidation-stage-${stage.id}`}
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

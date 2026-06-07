"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay20RegionalDevelopmentStages } from "@/lib/upsc/geographyDay20PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay20RegionalDevelopmentVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay20RegionalDevelopmentStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay20RegionalDevelopmentStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay20RegionalDevelopmentStages)[number]["id"]) =>
    geographyDay20RegionalDevelopmentStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day20-regional-development-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Regional development board connecting spatial disparity, planning regions, urban growth pressure, governance response, and policy traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("disparity") ? 1 : 0.16}>
              <path d="M72 82 L214 52 L294 142 L184 220 L74 184 Z" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <path d="M310 68 L484 74 L560 166 L448 230 L324 176 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
              <circle cx="150" cy="132" r="22" fill="#166534" stroke="#86efac" strokeWidth="4" />
              <circle cx="438" cy="140" r="34" fill="#92400e" stroke="#fde68a" strokeWidth="4" />
              <text x="42" y="34" fill="#86efac" fontSize="10" fontWeight="900">SPATIAL INEQUALITY</text>
              <text x="100" y="176" fill="#dcfce7" fontSize="9" fontWeight="900">REGION A</text>
              <text x="406" y="194" fill="#fef3c7" fontSize="9" fontWeight="900">REGION B</text>
              <path d="M184 132 L404 140" fill="none" stroke="#fb7185" strokeWidth="5" strokeDasharray="10 8" />
              <text x="236" y="118" fill="#fecdd3" fontSize="10" fontWeight="900">DEVELOPMENT GAP</text>
            </g>

            <g opacity={isVisible("planning") ? 1 : 0.14}>
              <rect x="42" y="262" width="266" height="76" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="58" y="286" fill="#bae6fd" fontSize="10" fontWeight="900">PLANNING REGION</text>
              <text x="58" y="307" fill="#ffffff" fontSize="9" fontWeight="800">functional administrative resource</text>
              <text x="58" y="325" fill="#ffffff" fontSize="9" fontWeight="800">river basin problem region</text>
            </g>

            <g opacity={isVisible("urban") ? 1 : 0.14}>
              <circle cx="524" cy="280" r="54" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
              <circle cx="524" cy="280" r="16" fill="#92400e" stroke="#fde68a" strokeWidth="4" />
              <path d="M524 218 L524 342 M462 280 L586 280 M482 238 L566 322 M566 238 L482 322" stroke="#fde68a" strokeWidth="3" strokeDasharray="7 6" />
              <text x="470" y="358" fill="#fef3c7" fontSize="10" fontWeight="900">GROWTH POLE</text>
            </g>

            <g opacity={isVisible("governance") ? 1 : 0.14}>
              <rect x="346" y="20" width="244" height="66" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="364" y="44" fill="#bae6fd" fontSize="10" fontWeight="900">GOVERNANCE RESPONSE</text>
              <text x="364" y="64" fill="#ffffff" fontSize="9" fontWeight="800">infrastructure institutions ecology</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="314" y="254" width="164" height="84" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="332" y="278" fill="#fecdd3" fontSize="10" fontWeight="900">VERIFY RESPONSE</text>
              <text x="332" y="298" fill="#ffffff" fontSize="9" fontWeight="800">cause indicator region</text>
              <text x="332" y="316" fill="#fde68a" fontSize="9" fontWeight="900">policy sustainability</text>
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
        {geographyDay20RegionalDevelopmentStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day20-regional-development-stage-${stage.id}`}
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

"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay4GeomorphicStages } from "@/lib/upsc/geographyDay4PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay4GeomorphicVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay4GeomorphicStages[activeIndex];
  const showWeathering = activeIndex >= 1;
  const showErosion = activeIndex >= 2;
  const showDeposition = activeIndex >= 3;
  const showSlope = activeIndex >= 4;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay4GeomorphicStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      data-testid="day4-geomorphic-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#172018]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 580 340"
            role="img"
            aria-label="Weathering erosion deposition and mass-wasting causal animation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <defs>
              <linearGradient id="day4-slope" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#4d7c0f" />
                <stop offset="54%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#292524" />
              </linearGradient>
              <linearGradient id="day4-river" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>

            <path d="M 40 280 L 40 212 L 154 82 L 270 246 L 540 280 Z" fill="url(#day4-slope)" stroke="#d9f99d" strokeWidth="3" />
            <circle cx="100" cy="58" r="24" fill="#facc15" opacity="0.9" />
            <path d="M 204 36 C 198 58, 198 70, 204 86" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 7" />
            <path d="M 226 36 C 220 58, 220 70, 226 86" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 7" />
            <text x="144" y="310" textAnchor="middle" fill="#ecfccb" fontSize="11" fontWeight="900">uplift exposes rock to climate and gravity</text>

            {showWeathering ? (
              <g>
                <path d="M 145 100 L 132 136 L 158 162 L 140 198" fill="none" stroke="#fef3c7" strokeWidth="4" />
                <path d="M 176 126 L 164 155 L 186 180" fill="none" stroke="#fed7aa" strokeWidth="3" />
                <path d="M 113 118 C 119 136, 121 152, 116 168" fill="none" stroke="#a7f3d0" strokeWidth="4" />
                <text x="146" y="224" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">weathering breaks rock in place</text>
              </g>
            ) : null}

            {showErosion ? (
              <g>
                <path d="M 198 190 C 246 226, 290 239, 352 246 C 390 250, 426 260, 462 272" fill="none" stroke="url(#day4-river)" strokeWidth="12" strokeLinecap="round" />
                {[238, 285, 336, 392].map((x, index) => (
                  <circle key={x} cx={x} cy={225 + index * 10} r={5 + (index % 2)} fill="#fde68a" />
                ))}
                <text x="346" y="216" textAnchor="middle" fill="#bae6fd" fontSize="11" fontWeight="900">erosion removes and transports sediment</text>
              </g>
            ) : null}

            {showDeposition ? (
              <g>
                <path d="M 418 270 C 450 242, 488 242, 532 272 Z" fill="#fcd34d" opacity="0.84" />
                <circle cx="456" cy="263" r="5" fill="#92400e" />
                <circle cx="478" cy="256" r="4" fill="#92400e" />
                <circle cx="498" cy="265" r="5" fill="#92400e" />
                <text x="474" y="298" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">deposition builds when energy falls</text>
              </g>
            ) : null}

            {showSlope ? (
              <g>
                <path d="M 176 138 C 216 164, 242 188, 278 218" fill="none" stroke="#fecaca" strokeWidth="7" strokeLinecap="round" />
                <path d="M 278 218 L 260 214 L 272 202 Z" fill="#fecaca" />
                <circle cx="196" cy="160" r="8" fill="#78350f" />
                <circle cx="222" cy="184" r="10" fill="#78350f" />
                <circle cx="249" cy="205" r="7" fill="#78350f" />
                <text x="328" y="168" textAnchor="middle" fill="#fecaca" fontSize="11" fontWeight="900">gravity drives mass wasting</text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#bef264]">{activeStage.eyebrow}</p>
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
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#4d7c0f] px-3 text-sm font-black text-white transition hover:bg-[#365314]"
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
        {geographyDay4GeomorphicStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day4-geomorphic-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#26351f] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#d9f99d]" : "text-white/60 hover:bg-[#365314] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

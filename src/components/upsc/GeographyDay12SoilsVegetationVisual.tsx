"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay12SoilsVegetationStages } from "@/lib/upsc/geographyDay12PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay12SoilsVegetationVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay12SoilsVegetationStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay12SoilsVegetationStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay12SoilsVegetationStages)[number]["id"]) =>
    geographyDay12SoilsVegetationStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day12-soils-vegetation-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Soils and vegetation learning map with formation factors, regional soil families, forest response, degradation, and conservation"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#eef8e8"
              stroke="#bbf7d0"
              strokeWidth="5"
              opacity="0.94"
            />

            <g opacity={isVisible("formation") ? 1 : 0.16}>
              <rect x="42" y="30" width="194" height="104" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="58" y="52" fill="#86efac" fontSize="10" fontWeight="900">FORMATION FACTORS</text>
              <text x="58" y="72" fill="#ffffff" fontSize="9" fontWeight="800">parent rock  climate  relief</text>
              <text x="58" y="90" fill="#ffffff" fontSize="9" fontWeight="800">drainage  organisms  time</text>
              <text x="58" y="112" fill="#fde68a" fontSize="9" fontWeight="900">factors create properties</text>
            </g>

            <g opacity={isVisible("soils") ? 1 : 0.14}>
              <path d="M214 112 C260 94, 336 98, 428 130" fill="none" stroke="#fbbf24" strokeWidth="22" strokeLinecap="round" opacity="0.82" />
              <path d="M274 158 C316 148, 372 164, 408 210 C390 248, 362 280, 336 294 C306 250, 288 212, 274 158 Z" fill="#1f2937" stroke="#94a3b8" strokeWidth="4" opacity="0.92" />
              <path d="M212 150 L252 160 L266 202 L226 202 L198 174 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" opacity="0.9" />
              <path d="M392 154 C424 176, 432 210, 416 246" fill="none" stroke="#dc2626" strokeWidth="16" strokeLinecap="round" opacity="0.78" />
              <text x="466" y="122" fill="#fde68a" fontSize="10" fontWeight="900">ALLUVIAL</text>
              <text x="444" y="210" fill="#fecaca" fontSize="10" fontWeight="900">RED / LATERITE</text>
              <text x="316" y="242" fill="#e2e8f0" fontSize="10" fontWeight="900">BLACK SOIL BELT</text>
              <text x="118" y="190" fill="#fef3c7" fontSize="10" fontWeight="900">DESERT</text>
            </g>

            <g opacity={isVisible("vegetation") ? 1 : 0.14}>
              <circle cx="252" cy="138" r="16" fill="#15803d" />
              <circle cx="404" cy="182" r="16" fill="#166534" />
              <circle cx="348" cy="274" r="16" fill="#22c55e" />
              <circle cx="222" cy="178" r="14" fill="#84cc16" />
              <text x="470" y="292" fill="#bbf7d0" fontSize="10" fontWeight="900">VEGETATION RESPONSE</text>
              <text x="470" y="308" fill="#dcfce7" fontSize="9" fontWeight="800">rainfall  temperature</text>
              <text x="470" y="324" fill="#dcfce7" fontSize="9" fontWeight="800">altitude  soil  pressure</text>
            </g>

            <g opacity={isVisible("pressure") ? 1 : 0.14}>
              <path d="M154 246 C192 228, 230 232, 266 252" fill="none" stroke="#fb923c" strokeWidth="6" strokeDasharray="10 7" />
              <path d="M386 116 C418 100, 456 104, 492 130" fill="none" stroke="#fb7185" strokeWidth="6" strokeDasharray="10 7" />
              <text x="54" y="278" fill="#fed7aa" fontSize="10" fontWeight="900">EROSION / DESERTIFICATION</text>
              <text x="430" y="92" fill="#fecdd3" fontSize="10" fontWeight="900">DEGRADATION</text>
            </g>

            <g opacity={isVisible("conserve") ? 1 : 0.14}>
              <rect x="448" y="148" width="154" height="102" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="464" y="170" fill="#86efac" fontSize="10" fontWeight="900">CONSERVE WITH LOGIC</text>
              <text x="464" y="190" fill="#ffffff" fontSize="9" fontWeight="800">match pressure</text>
              <text x="464" y="206" fill="#ffffff" fontSize="9" fontWeight="800">to response</text>
              <text x="464" y="228" fill="#fde68a" fontSize="9" fontWeight="900">region + use + limit</text>
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
        {geographyDay12SoilsVegetationStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day12-soils-vegetation-stage-${stage.id}`}
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

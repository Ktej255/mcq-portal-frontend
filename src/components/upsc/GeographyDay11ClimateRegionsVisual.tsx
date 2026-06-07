"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay11ClimateRegionsStages } from "@/lib/upsc/geographyDay11PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay11ClimateRegionsVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay11ClimateRegionsStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay11ClimateRegionsStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay11ClimateRegionsStages)[number]["id"]) =>
    geographyDay11ClimateRegionsStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day11-climate-regions-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#102736]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="India climate-region learning map with rainfall corridors, rain shadow, western disturbances, and regional temperature contrasts"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#e8f5e9"
              stroke="#bae6fd"
              strokeWidth="5"
              opacity="0.92"
            />

            <g opacity={isVisible("controls") ? 1 : 0.16}>
              <rect x="52" y="32" width="176" height="92" rx="8" fill="#0f172a" stroke="#67e8f9" strokeWidth="3" />
              <text x="68" y="54" fill="#67e8f9" fontSize="10" fontWeight="900">CLIMATE CONTROLS</text>
              <text x="68" y="74" fill="#ffffff" fontSize="9" fontWeight="800">latitude  altitude  relief</text>
              <text x="68" y="92" fill="#ffffff" fontSize="9" fontWeight="800">distance from sea  winds</text>
              <text x="68" y="110" fill="#fef08a" fontSize="9" fontWeight="900">controls first, totals later</text>
            </g>

            <g opacity={isVisible("rainfall") ? 1 : 0.14}>
              <path d="M148 324 C188 278, 226 236, 258 184 C272 160, 284 140, 296 126" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
              <path d="M520 278 C474 248, 438 214, 406 180 C380 152, 358 140, 332 128" fill="none" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" />
              <path d="M246 164 C264 134, 282 116, 308 102" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
              <path d="M326 112 C360 96, 396 96, 430 112" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
              <text x="86" y="340" fill="#bae6fd" fontSize="10" fontWeight="900">ARABIAN SEA MOISTURE</text>
              <text x="470" y="296" fill="#cffafe" fontSize="10" fontWeight="900">BAY PATH</text>
              <text x="330" y="82" fill="#ffffff" fontSize="10" fontWeight="900">RELIEF BARRIERS</text>
            </g>

            <g opacity={isVisible("shadow") ? 1 : 0.14}>
              <path d="M264 164 L276 206" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
              <path d="M276 206 L266 188 L286 188 Z" fill="#fef08a" />
              <rect x="98" y="172" width="124" height="58" rx="8" fill="#164e63" stroke="#67e8f9" strokeWidth="2" />
              <text x="112" y="194" fill="#cffafe" fontSize="10" fontWeight="900">WINDWARD</text>
              <text x="112" y="212" fill="#ffffff" fontSize="9" fontWeight="800">uplift and rain</text>
              <rect x="98" y="242" width="124" height="58" rx="8" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
              <text x="112" y="264" fill="#fde68a" fontSize="10" fontWeight="900">LEEWARD</text>
              <text x="112" y="282" fill="#ffffff" fontSize="9" fontWeight="800">rain shadow</text>
            </g>

            <g opacity={isVisible("winter") ? 1 : 0.14}>
              <path d="M38 116 C92 98, 146 90, 204 94 C232 96, 256 100, 278 108" fill="none" stroke="#c4b5fd" strokeWidth="6" strokeDasharray="10 7" />
              <text x="42" y="142" fill="#ddd6fe" fontSize="10" fontWeight="900">WESTERN DISTURBANCES</text>
              <text x="42" y="158" fill="#ede9fe" fontSize="9" fontWeight="800">winter rain northwest + Himalayan snow</text>
            </g>

            <g opacity={isVisible("regions") ? 1 : 0.14}>
              <circle cx="244" cy="196" r="14" fill="#38bdf8" />
              <circle cx="330" cy="210" r="14" fill="#fbbf24" />
              <circle cx="202" cy="136" r="14" fill="#fb923c" />
              <circle cx="382" cy="290" r="14" fill="#67e8f9" />
              <text x="454" y="240" fill="#fef08a" fontSize="10" fontWeight="900">COMPARE REGIONS</text>
              <text x="454" y="258" fill="#ffffff" fontSize="9" fontWeight="800">rainfall season</text>
              <text x="454" y="274" fill="#ffffff" fontSize="9" fontWeight="800">temperature range</text>
              <text x="454" y="290" fill="#ffffff" fontSize="9" fontWeight="800">control + exception</text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#67e8f9]">{activeStage.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.label}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.explanation}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fef08a]">
              {activeStage.proof}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              title={isPlaying ? "Pause animation" : "Play animation"}
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#0369a1] px-3 text-sm font-black text-white transition hover:bg-[#075985]"
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
        {geographyDay11ClimateRegionsStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day11-climate-regions-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#164e63] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#cffafe]" : "text-white/60 hover:bg-[#075985] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

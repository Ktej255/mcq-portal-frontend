"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay6OceanStages } from "@/lib/upsc/geographyDay6PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay6OceanVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay6OceanStages[activeIndex];
  const showProperties = activeIndex >= 1;
  const showCirculation = activeIndex >= 2;
  const showEffects = activeIndex >= 3;
  const showMap = activeIndex >= 4;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay6OceanStages.length - 1) {
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
      data-testid="day6-ocean-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#082f49]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 580 340"
            role="img"
            aria-label="Ocean relief water properties circulation and coastal-effects animation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <defs>
              <linearGradient id="day6-ocean" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#0369a1" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#164e63" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="day6-floor" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="55%" stopColor="#713f12" />
                <stop offset="100%" stopColor="#422006" />
              </linearGradient>
            </defs>

            <path d="M 28 76 C 118 62, 208 84, 302 72 C 386 62, 468 80, 552 66 L 552 258 L 28 258 Z" fill="url(#day6-ocean)" />
            <path d="M 28 258 L 28 192 L 124 198 L 174 236 L 294 252 L 356 210 L 404 248 L 474 278 L 552 224 L 552 306 L 28 306 Z" fill="url(#day6-floor)" stroke="#fde68a" strokeWidth="3" />
            <text x="74" y="184" fill="#fef3c7" fontSize="10" fontWeight="900">shelf</text>
            <text x="146" y="226" fill="#fef3c7" fontSize="10" fontWeight="900">slope</text>
            <text x="240" y="276" fill="#fef3c7" fontSize="10" fontWeight="900">abyssal plain</text>
            <text x="344" y="198" fill="#fef3c7" fontSize="10" fontWeight="900">ridge</text>
            <text x="454" y="300" fill="#fef3c7" fontSize="10" fontWeight="900">trench</text>

            {showProperties ? (
              <g>
                <circle cx="90" cy="104" r="25" fill="#facc15" opacity="0.92" />
                <path d="M 88 136 C 98 152, 108 160, 124 168" fill="none" stroke="#fed7aa" strokeWidth="5" strokeDasharray="7 6" />
                <path d="M 432 106 C 420 132, 420 150, 432 172" fill="none" stroke="#bae6fd" strokeWidth="5" strokeDasharray="7 6" />
                <path d="M 456 106 C 444 132, 444 150, 456 172" fill="none" stroke="#bae6fd" strokeWidth="5" strokeDasharray="7 6" />
                <text x="116" y="132" fill="#fef3c7" fontSize="10" fontWeight="900">evaporation raises salinity</text>
                <text x="424" y="94" fill="#dbeafe" fontSize="10" fontWeight="900">rain and rivers dilute</text>
              </g>
            ) : null}

            {showCirculation ? (
              <g>
                <path d="M 80 150 C 182 112, 286 112, 388 144 C 432 158, 468 156, 504 134" fill="none" stroke="#fb923c" strokeWidth="8" strokeLinecap="round" />
                <path d="M 504 134 L 484 126 L 490 148 Z" fill="#fb923c" />
                <path d="M 504 184 C 398 216, 286 218, 184 194 C 142 184, 112 184, 78 202" fill="none" stroke="#7dd3fc" strokeWidth="8" strokeLinecap="round" />
                <path d="M 78 202 L 98 208 L 92 186 Z" fill="#7dd3fc" />
                <text x="292" y="108" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="900">warm current redistributes heat</text>
                <text x="292" y="232" textAnchor="middle" fill="#bae6fd" fontSize="11" fontWeight="900">cold current supports upwelling logic</text>
              </g>
            ) : null}

            {showEffects ? (
              <g>
                <path d="M 430 188 C 430 156, 440 128, 454 100" fill="none" stroke="#cffafe" strokeWidth="5" strokeDasharray="6 6" />
                <path d="M 454 100 L 442 120 L 464 120 Z" fill="#cffafe" />
                <circle cx="444" cy="184" r="5" fill="#bef264" />
                <circle cx="462" cy="176" r="6" fill="#bef264" />
                <circle cx="480" cy="188" r="5" fill="#bef264" />
                <text x="466" y="86" textAnchor="middle" fill="#d9f99d" fontSize="10" fontWeight="900">nutrient upwelling</text>
                <text x="468" y="212" textAnchor="middle" fill="#d9f99d" fontSize="10" fontWeight="900">fishery zone</text>
                <path d="M 102 126 C 126 108, 150 110, 174 128" fill="none" stroke="#fef08a" strokeWidth="4" strokeDasharray="6 5" />
                <text x="138" y="98" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">fog and coastal aridity</text>
              </g>
            ) : null}

            {showMap ? (
              <g>
                <rect x="64" y="34" width="206" height="50" rx="9" fill="#7c2d12" opacity="0.92" />
                <text x="167" y="55" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900">Peru Current: cold, upwelling, aridity</text>
                <text x="167" y="72" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">map pair before isolated fact</text>
                <rect x="310" y="34" width="218" height="50" rx="9" fill="#075985" opacity="0.94" />
                <text x="419" y="55" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">North Atlantic Drift: warm, maritime effect</text>
                <text x="419" y="72" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">location plus direction plus effect</text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#67e8f9]">{activeStage.eyebrow}</p>
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
        {geographyDay6OceanStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day6-ocean-stage-${stage.id}`}
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

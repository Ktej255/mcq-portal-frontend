"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay9DrainageStages } from "@/lib/upsc/geographyDay9PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay9DrainageVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay9DrainageStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay9DrainageStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay9DrainageStages)[number]["id"]) =>
    geographyDay9DrainageStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day9-drainage-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#13251d]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Indian drainage learning map with Himalayan rivers, peninsular rivers, outlets, and tributary logic"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M210 38 L280 48 L350 46 L430 70 L470 118 L450 164 L430 208 L404 266 L370 330 L338 286 L318 238 L280 214 L250 174 L222 142 L188 118 L174 78 Z"
              fill="#e8f5e9"
              stroke="#d1fae5"
              strokeWidth="5"
              opacity="0.9"
            />
            <path
              d="M192 84 C238 50, 302 72, 348 62 C386 54, 422 76, 456 104"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.9"
            />

            <g opacity={isVisible("himalayan") ? 1 : 0.14}>
              <path d="M230 82 C236 112, 274 124, 338 132 C380 138, 412 146, 450 164" fill="none" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
              <path d="M310 74 C320 102, 350 110, 390 118 C416 122, 438 132, 456 148" fill="none" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" />
              <path d="M404 84 C392 110, 410 132, 448 154" fill="none" stroke="#a5f3fc" strokeWidth="5" strokeLinecap="round" />
              <text x="466" y="158" fill="#cffafe" fontSize="10" fontWeight="900">GANGA-BRAHMAPUTRA PLAIN</text>
            </g>

            <g opacity={isVisible("peninsular") ? 1 : 0.14}>
              <path d="M300 174 C336 186, 370 196, 418 212" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
              <path d="M292 198 C330 216, 364 228, 408 246" fill="none" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
              <path d="M322 220 C298 226, 272 230, 246 232" fill="none" stroke="#818cf8" strokeWidth="6" strokeLinecap="round" />
              <text x="432" y="214" fill="#bae6fd" fontSize="10" fontWeight="900">EAST-FLOWING DELTA SYSTEMS</text>
              <text x="92" y="235" fill="#c7d2fe" fontSize="10" fontWeight="900">WEST-FLOWING ESTUARY</text>
            </g>

            <g opacity={isVisible("outlets") ? 1 : 0.14}>
              <path d="M416 207 l20 -10 m-20 10 l20 4 m-28 34 l22 -10 m-22 10 l20 5" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <path d="M450 160 l20 -8 m-20 8 l18 6" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="436" cy="203" r="6" fill="#fde68a" />
              <circle cx="430" cy="241" r="6" fill="#fde68a" />
              <circle cx="468" cy="157" r="6" fill="#fde68a" />
              <text x="470" y="284" fill="#fde68a" fontSize="10" fontWeight="900">OUTLET {"->"} DELTA / ESTUARY {"->"} USE / RISK</text>
            </g>

            <g opacity={isVisible("traps") ? 1 : 0.14}>
              <path d="M282 118 L258 104 M282 118 L256 132" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />
              <circle cx="282" cy="118" r="8" fill="#fb923c" />
              <text x="54" y="104" fill="#fed7aa" fontSize="11" fontWeight="900">FACE DOWNSTREAM</text>
              <text x="54" y="120" fill="#ffedd5" fontSize="9" fontWeight="800">then decide left bank / right bank</text>
            </g>

            <g opacity={isVisible("frame") ? 1 : 0.2}>
              <text x="56" y="42" fill="#d1fae5" fontSize="14" fontWeight="900">INDIAN DRAINAGE METHOD</text>
              <text x="56" y="62" fill="#a7f3d0" fontSize="10" fontWeight="800">source {"->"} slope {"->"} basin {"->"} tributary {"->"} outlet</text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6ee7b7]">{activeStage.eyebrow}</p>
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
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#087f5b] px-3 text-sm font-black text-white transition hover:bg-[#066047]"
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
        {geographyDay9DrainageStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day9-drainage-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#1a3a2a] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#d1fae5]" : "text-white/60 hover:bg-[#24523b] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

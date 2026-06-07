"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay8IndiaReliefStages } from "@/lib/upsc/geographyDay8PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay8IndiaReliefVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay8IndiaReliefStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay8IndiaReliefStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay8IndiaReliefStages)[number]["id"]) =>
    geographyDay8IndiaReliefStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day8-india-relief-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#13251d]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="India physiography learning map with Himalayas, northern plains, plateau, desert, coasts, and islands"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M210 38 L280 48 L350 46 L430 70 L470 118 L450 164 L430 208 L404 266 L370 330 L338 286 L318 238 L280 214 L250 174 L222 142 L188 118 L174 78 Z"
              fill="#e8f5e9"
              stroke="#d1fae5"
              strokeWidth="5"
              opacity="0.92"
            />

            <path
              d="M192 84 C238 50, 302 72, 348 62 C386 54, 422 76, 456 104"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="22"
              strokeLinecap="round"
              opacity={isVisible("himalayas") ? 1 : 0.18}
            />
            <path
              d="M202 106 C256 92, 326 106, 402 118 C428 122, 446 130, 458 140"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="20"
              strokeLinecap="round"
              opacity={isVisible("plains") ? 0.9 : 0.14}
            />
            <path
              d="M260 146 L398 156 L420 204 L392 266 L350 294 L310 238 L270 210 L240 170 Z"
              fill="#fb923c"
              stroke="#fed7aa"
              strokeWidth="4"
              opacity={isVisible("plateau") ? 0.9 : 0.14}
            />
            <path
              d="M182 112 L224 118 L246 160 L212 170 L186 148 Z"
              fill="#fde68a"
              stroke="#facc15"
              strokeWidth="3"
              opacity={isVisible("edges") ? 0.95 : 0.14}
            />
            <path
              d="M255 172 C274 206, 304 238, 336 286 C347 303, 358 320, 370 330"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="9"
              strokeLinecap="round"
              opacity={isVisible("edges") ? 0.95 : 0.14}
            />
            <path
              d="M402 154 C416 190, 418 224, 404 266 C394 290, 382 310, 370 330"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="9"
              strokeLinecap="round"
              opacity={isVisible("edges") ? 0.95 : 0.14}
            />
            <circle cx="466" cy="250" r="8" fill="#67e8f9" opacity={isVisible("edges") ? 0.95 : 0.14} />
            <circle cx="488" cy="270" r="6" fill="#67e8f9" opacity={isVisible("edges") ? 0.95 : 0.14} />
            <circle cx="260" cy="316" r="7" fill="#67e8f9" opacity={isVisible("edges") ? 0.95 : 0.14} />

            <g opacity={isVisible("frame") ? 1 : 0.2}>
              <text x="56" y="42" fill="#d1fae5" fontSize="14" fontWeight="900">INDIA RELIEF FRAME</text>
              <text x="56" y="62" fill="#a7f3d0" fontSize="10" fontWeight="800">read the base layer before details</text>
            </g>
            <g opacity={isVisible("himalayas") ? 1 : 0.16}>
              <line x1="432" y1="58" x2="492" y2="38" stroke="#ffffff" strokeWidth="2" />
              <text x="500" y="36" fill="#ffffff" fontSize="11" fontWeight="900">HIMALAYAS</text>
              <text x="500" y="52" fill="#d1fae5" fontSize="9" fontWeight="800">uplift, rivers, hazard</text>
            </g>
            <g opacity={isVisible("plains") ? 1 : 0.16}>
              <line x1="422" y1="132" x2="516" y2="112" stroke="#fbbf24" strokeWidth="2" />
              <text x="524" y="110" fill="#fde68a" fontSize="11" fontWeight="900">PLAINS</text>
              <text x="524" y="126" fill="#fef3c7" fontSize="9" fontWeight="800">alluvium, farms, floods</text>
            </g>
            <g opacity={isVisible("plateau") ? 1 : 0.16}>
              <line x1="390" y1="212" x2="504" y2="210" stroke="#fb923c" strokeWidth="2" />
              <text x="512" y="208" fill="#fed7aa" fontSize="11" fontWeight="900">PLATEAU</text>
              <text x="512" y="224" fill="#ffedd5" fontSize="9" fontWeight="800">slope, rivers, minerals</text>
            </g>
            <g opacity={isVisible("edges") ? 1 : 0.16}>
              <line x1="212" y1="152" x2="116" y2="176" stroke="#facc15" strokeWidth="2" />
              <text x="44" y="174" fill="#fde68a" fontSize="11" fontWeight="900">DESERT</text>
              <text x="44" y="190" fill="#fef3c7" fontSize="9" fontWeight="800">aridity and risk</text>
              <text x="456" y="314" fill="#a5f3fc" fontSize="11" fontWeight="900">COASTS + ISLANDS</text>
              <text x="456" y="330" fill="#cffafe" fontSize="9" fontWeight="800">ports, deltas, exposure</text>
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
        {geographyDay8IndiaReliefStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day8-india-relief-stage-${stage.id}`}
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

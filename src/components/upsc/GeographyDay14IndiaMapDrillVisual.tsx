"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay14IndiaMapDrillStages } from "@/lib/upsc/geographyDay14PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay14IndiaMapDrillVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay14IndiaMapDrillStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay14IndiaMapDrillStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay14IndiaMapDrillStages)[number]["id"]) =>
    geographyDay14IndiaMapDrillStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day14-india-map-drill-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Layered India map drill with relief, drainage, climate, productive belts, and weak-location repair"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#eef8e8"
              stroke="#bbf7d0"
              strokeWidth="5"
              opacity="0.94"
            />

            <g opacity={isVisible("relief") ? 1 : 0.16}>
              <path d="M202 92 C260 62, 354 62, 438 104" fill="none" stroke="#94a3b8" strokeWidth="20" strokeLinecap="round" opacity="0.84" />
              <path d="M274 168 C312 164, 370 184, 400 252 C374 288, 350 294, 328 252 C306 222, 286 198, 274 168 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="4" opacity="0.82" />
              <text x="42" y="48" fill="#d1fae5" fontSize="10" fontWeight="900">1. RELIEF BASE</text>
              <text x="42" y="66" fill="#ffffff" fontSize="9" fontWeight="800">mountain plain plateau coast</text>
            </g>

            <g opacity={isVisible("drainage") ? 1 : 0.14}>
              <path d="M254 112 C294 142, 342 154, 418 164" fill="none" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
              <path d="M302 188 C340 216, 378 230, 420 246" fill="none" stroke="#0ea5e9" strokeWidth="7" strokeLinecap="round" />
              <path d="M330 198 C306 230, 300 248, 286 266" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
              <text x="464" y="86" fill="#bae6fd" fontSize="10" fontWeight="900">2. DRAINAGE</text>
              <text x="464" y="104" fill="#e0f2fe" fontSize="9" fontWeight="800">source slope basin outlet</text>
            </g>

            <g opacity={isVisible("climate") ? 1 : 0.14}>
              <path d="M178 282 C236 250, 284 218, 332 176" fill="none" stroke="#fbbf24" strokeWidth="7" strokeDasharray="10 7" />
              <path d="M438 238 C412 190, 376 156, 338 130" fill="none" stroke="#fde68a" strokeWidth="7" strokeDasharray="10 7" />
              <text x="42" y="308" fill="#fef3c7" fontSize="10" fontWeight="900">3. CLIMATE LAYER</text>
              <text x="42" y="326" fill="#fffbeb" fontSize="9" fontWeight="800">monsoon relief season contrast</text>
            </g>

            <g opacity={isVisible("production") ? 1 : 0.14}>
              <circle cx="254" cy="136" r="10" fill="#22c55e" />
              <circle cx="326" cy="206" r="10" fill="#7c3aed" />
              <circle cx="390" cy="246" r="10" fill="#f97316" />
              <circle cx="410" cy="176" r="10" fill="#22c55e" />
              <text x="452" y="286" fill="#dcfce7" fontSize="10" fontWeight="900">4. PRODUCTIVE BELTS</text>
              <text x="452" y="304" fill="#ecfdf5" fontSize="9" fontWeight="800">soil resource crop pressure</text>
            </g>

            <g opacity={isVisible("repair") ? 1 : 0.14}>
              <rect x="38" y="134" width="156" height="112" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="54" y="158" fill="#86efac" fontSize="10" fontWeight="900">5. REPAIR CARDS</text>
              <text x="54" y="180" fill="#ffffff" fontSize="9" fontWeight="800">map cue + cause</text>
              <text x="54" y="198" fill="#ffffff" fontSize="9" fontWeight="800">linked layer + trap</text>
              <text x="54" y="224" fill="#fde68a" fontSize="9" fontWeight="900">fix weakest five</text>
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
        {geographyDay14IndiaMapDrillStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day14-india-map-drill-stage-${stage.id}`}
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

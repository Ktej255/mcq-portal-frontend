"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay18TransportTradeStages } from "@/lib/upsc/geographyDay18PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay18TransportTradeVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay18TransportTradeStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay18TransportTradeStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay18TransportTradeStages)[number]["id"]) =>
    geographyDay18TransportTradeStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day18-transport-trade-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Transport and trade network with nodes, modes, port, hinterland, regional change, and mismatch traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("network") ? 1 : 0.16}>
              <path d="M88 208 L188 126 L300 190 L408 112 L534 174" fill="none" stroke="#d1fae5" strokeWidth="7" strokeDasharray="11 8" />
              {[["88", "208"], ["188", "126"], ["300", "190"], ["408", "112"], ["534", "174"]].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="18" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              ))}
              <text x="44" y="48" fill="#86efac" fontSize="10" fontWeight="900">NETWORK LOGIC</text>
              <text x="44" y="68" fill="#ffffff" fontSize="9" fontWeight="800">nodes routes corridors terminals</text>
            </g>

            <g opacity={isVisible("modes") ? 1 : 0.14}>
              <rect x="44" y="252" width="256" height="74" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="60" y="274" fill="#bae6fd" fontSize="10" fontWeight="900">MODE ADVANTAGE</text>
              <text x="60" y="294" fill="#ffffff" fontSize="9" fontWeight="800">rail  road  waterway  air  pipeline</text>
              <text x="60" y="312" fill="#fde68a" fontSize="9" fontWeight="900">cargo distance terrain urgency</text>
            </g>

            <g opacity={isVisible("ports") ? 1 : 0.14}>
              <circle cx="540" cy="274" r="42" fill="#0f172a" stroke="#38bdf8" strokeWidth="5" />
              <path d="M540 232 L540 316 M514 260 L566 260" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
              <path d="M524 294 C536 308, 548 308, 560 294" fill="none" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
              <path d="M458 212 C488 232, 508 246, 520 258" fill="none" stroke="#fbbf24" strokeWidth="6" strokeDasharray="9 7" />
              <text x="386" y="244" fill="#fef3c7" fontSize="10" fontWeight="900">HINTERLAND</text>
              <text x="504" y="340" fill="#bae6fd" fontSize="10" fontWeight="900">PORT GATEWAY</text>
            </g>

            <g opacity={isVisible("change") ? 1 : 0.14}>
              <path d="M208 92 C280 54, 374 56, 470 82" fill="none" stroke="#fbbf24" strokeWidth="7" strokeDasharray="10 7" />
              <text x="250" y="36" fill="#fef3c7" fontSize="10" fontWeight="900">REGIONAL CHANGE</text>
              <text x="220" y="54" fill="#fffbeb" fontSize="9" fontWeight="800">market access growth inequality ecological pressure</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="328" y="276" width="176" height="64" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="344" y="300" fill="#fecdd3" fontSize="10" fontWeight="900">VERIFY THE MAP CHAIN</text>
              <text x="344" y="320" fill="#ffffff" fontSize="9" fontWeight="800">port corridor cargo hinterland</text>
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
        {geographyDay18TransportTradeStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day18-transport-trade-stage-${stage.id}`}
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

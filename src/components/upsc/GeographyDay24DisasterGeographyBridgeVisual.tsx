"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay24DisasterGeographyBridgeStages } from "@/lib/upsc/geographyDay24PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay24DisasterGeographyBridgeVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay24DisasterGeographyBridgeStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay24DisasterGeographyBridgeStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay24DisasterGeographyBridgeStages)[number]["id"]) =>
    geographyDay24DisasterGeographyBridgeStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day24-disaster-geography-bridge-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Disaster geography board tracing physical hazard, exposed assets, vulnerability, capacity, and UPSC mismatch verification"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <defs>
              <marker id="day24-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#86efac" />
              </marker>
            </defs>

            <g opacity={isVisible("hazard") ? 1 : 0.16}>
              <rect x="34" y="42" width="164" height="88" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
              <text x="54" y="70" fill="#bae6fd" fontSize="11" fontWeight="900">PHYSICAL HAZARD</text>
              <text x="54" y="94" fill="#ffffff" fontSize="9" fontWeight="800">cyclone flood drought</text>
              <text x="54" y="112" fill="#ffffff" fontSize="9" fontWeight="800">landslide earthquake</text>
            </g>

            <path d="M206 86 H262" stroke="#86efac" strokeWidth="4" markerEnd="url(#day24-arrow)" opacity={isVisible("exposure") ? 1 : 0.16} />

            <g opacity={isVisible("exposure") ? 1 : 0.14}>
              <rect x="278" y="42" width="150" height="88" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="298" y="70" fill="#fef3c7" fontSize="11" fontWeight="900">EXPOSURE</text>
              <text x="298" y="94" fill="#ffffff" fontSize="9" fontWeight="800">people farms roads ports</text>
              <text x="298" y="112" fill="#ffffff" fontSize="9" fontWeight="800">power and services</text>
            </g>

            <path d="M436 86 H492" stroke="#86efac" strokeWidth="4" markerEnd="url(#day24-arrow)" opacity={isVisible("vulnerability") ? 1 : 0.16} />

            <g opacity={isVisible("vulnerability") ? 1 : 0.14}>
              <rect x="508" y="42" width="104" height="88" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="523" y="70" fill="#fecdd3" fontSize="10" fontWeight="900">VULNERABILITY</text>
              <text x="523" y="94" fill="#ffffff" fontSize="8" fontWeight="800">land use drainage</text>
              <text x="523" y="112" fill="#ffffff" fontSize="8" fontWeight="800">housing ecosystems</text>
            </g>

            <g opacity={isVisible("capacity") ? 1 : 0.14}>
              <rect x="74" y="182" width="492" height="72" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="94" y="208" fill="#dcfce7" fontSize="11" fontWeight="900">CAPACITY REDUCES RISK</text>
              <text x="94" y="232" fill="#ffffff" fontSize="9" fontWeight="800">early warning  evacuation  resilient infrastructure  land-use planning  local preparedness</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="74" y="292" width="492" height="48" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="94" y="313" fill="#fecdd3" fontSize="10" fontWeight="900">UPSC MISMATCH CHECK</text>
              <text x="94" y="330" fill="#ffffff" fontSize="9" fontWeight="800">cause  region  mitigation  institution: verify every relationship</text>
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
        {geographyDay24DisasterGeographyBridgeStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day24-disaster-geography-bridge-stage-${stage.id}`}
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

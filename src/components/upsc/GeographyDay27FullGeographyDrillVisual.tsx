"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay27FullGeographyDrillStages } from "@/lib/upsc/geographyDay27PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay27FullGeographyDrillVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay27FullGeographyDrillStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay27FullGeographyDrillStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay27FullGeographyDrillStages)[number]["id"]) =>
    geographyDay27FullGeographyDrillStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day27-full-geography-drill-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Full Geography drill board integrating physical geography, India map, human geography, environment and disaster bridges, and weak-area repair"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("physical") ? 1 : 0.16}>
              <rect x="34" y="42" width="572" height="60" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <text x="54" y="67" fill="#dcfce7" fontSize="11" fontWeight="900">PHYSICAL BASE</text>
              <text x="54" y="89" fill="#ffffff" fontSize="9" fontWeight="800">structure relief processes atmosphere climate oceans</text>
            </g>

            <g opacity={isVisible("india") ? 1 : 0.14}>
              <rect x="34" y="138" width="170" height="82" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="54" y="164" fill="#bae6fd" fontSize="10" fontWeight="900">INDIA MAP</text>
              <text x="54" y="188" fill="#ffffff" fontSize="9" fontWeight="800">relief rivers monsoon</text>
              <text x="54" y="206" fill="#ffffff" fontSize="9" fontWeight="800">soil resources crops</text>
            </g>

            <g opacity={isVisible("human") ? 1 : 0.14}>
              <rect x="235" y="138" width="170" height="82" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="255" y="164" fill="#fef3c7" fontSize="10" fontWeight="900">HUMAN CHAIN</text>
              <text x="255" y="188" fill="#ffffff" fontSize="9" fontWeight="800">people settlement sectors</text>
              <text x="255" y="206" fill="#ffffff" fontSize="9" fontWeight="800">networks industry regions</text>
            </g>

            <g opacity={isVisible("bridges") ? 1 : 0.14}>
              <rect x="436" y="138" width="170" height="82" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="456" y="164" fill="#dcfce7" fontSize="10" fontWeight="900">BRIDGES</text>
              <text x="456" y="188" fill="#ffffff" fontSize="9" fontWeight="800">habitat climate exposure</text>
              <text x="456" y="206" fill="#ffffff" fontSize="9" fontWeight="800">hazard vulnerability capacity</text>
            </g>

            <g opacity={isVisible("repair") ? 1 : 0.14}>
              <rect x="74" y="274" width="492" height="58" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="94" y="298" fill="#fecdd3" fontSize="10" fontWeight="900">WEAK-AREA HEATMAP</text>
              <text x="94" y="319" fill="#ffffff" fontSize="9" fontWeight="800">chapter  map zone  concept type  trap type  repair card  fresh retest</text>
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
        {geographyDay27FullGeographyDrillStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day27-full-geography-drill-stage-${stage.id}`}
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

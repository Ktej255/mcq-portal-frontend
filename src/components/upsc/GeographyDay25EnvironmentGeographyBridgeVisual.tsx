"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay25EnvironmentGeographyBridgeStages } from "@/lib/upsc/geographyDay25PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay25EnvironmentGeographyBridgeVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay25EnvironmentGeographyBridgeStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay25EnvironmentGeographyBridgeStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay25EnvironmentGeographyBridgeStages)[number]["id"]) =>
    geographyDay25EnvironmentGeographyBridgeStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day25-environment-geography-bridge-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Environment geography board tracing biome controls, biodiversity patterns, climate exposure, conservation mapping, and UPSC cross-match verification"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("biome") ? 1 : 0.16}>
              <rect x="38" y="44" width="564" height="66" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <text x="58" y="70" fill="#dcfce7" fontSize="11" fontWeight="900">BIOME CONTROLS</text>
              <text x="58" y="94" fill="#ffffff" fontSize="9" fontWeight="800">temperature  rainfall  seasonality  latitude  altitude  soil</text>
            </g>

            <g opacity={isVisible("biodiversity") ? 1 : 0.14}>
              <rect x="38" y="146" width="264" height="78" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="58" y="172" fill="#bae6fd" fontSize="10" fontWeight="900">BIODIVERSITY PATTERN</text>
              <text x="58" y="194" fill="#ffffff" fontSize="9" fontWeight="800">habitat corridors endemism</text>
              <text x="58" y="212" fill="#ffffff" fontSize="9" fontWeight="800">gradients and human pressure</text>
            </g>

            <g opacity={isVisible("exposure") ? 1 : 0.14}>
              <rect x="338" y="146" width="264" height="78" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="358" y="172" fill="#fef3c7" fontSize="10" fontWeight="900">CLIMATE EXPOSURE</text>
              <text x="358" y="194" fill="#ffffff" fontSize="9" fontWeight="800">coasts mountains drylands forests</text>
              <text x="358" y="212" fill="#ffffff" fontSize="9" fontWeight="800">islands and urban zones</text>
            </g>

            <g opacity={isVisible("conservation") ? 1 : 0.14}>
              <rect x="38" y="262" width="264" height="70" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="58" y="287" fill="#dcfce7" fontSize="10" fontWeight="900">CONSERVATION MAP</text>
              <text x="58" y="310" fill="#ffffff" fontSize="9" fontWeight="800">region habitat species response</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="338" y="262" width="264" height="70" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="358" y="287" fill="#fecdd3" fontSize="10" fontWeight="900">CROSS-MATCH TRAP</text>
              <text x="358" y="310" fill="#ffffff" fontSize="9" fontWeight="800">species habitat area state climate</text>
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
        {geographyDay25EnvironmentGeographyBridgeStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day25-environment-geography-bridge-stage-${stage.id}`}
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

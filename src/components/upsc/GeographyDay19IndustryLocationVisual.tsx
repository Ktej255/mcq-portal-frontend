"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay19IndustryLocationStages } from "@/lib/upsc/geographyDay19PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay19IndustryLocationVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay19IndustryLocationStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay19IndustryLocationStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay19IndustryLocationStages)[number]["id"]) =>
    geographyDay19IndustryLocationStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day19-industry-location-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Industry location board comparing classical factors, modern factors, old regions, new clusters, and factor mismatch traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("classic") ? 1 : 0.16}>
              <rect x="252" y="142" width="136" height="82" rx="10" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <text x="278" y="177" fill="#dcfce7" fontSize="13" fontWeight="900">INDUSTRY</text>
              <text x="284" y="199" fill="#ffffff" fontSize="10" fontWeight="800">location pull</text>
              {[
                ["RAW MATERIAL", "112", "68", "252", "154"],
                ["POWER", "276", "52", "306", "142"],
                ["MARKET", "478", "76", "388", "162"],
                ["LABOR", "94", "248", "252", "206"],
                ["TRANSPORT", "454", "258", "388", "208"],
              ].map(([label, x, y, x2, y2]) => (
                <g key={label}>
                  <line x1={x} y1={y} x2={x2} y2={y2} stroke="#86efac" strokeWidth="3" strokeDasharray="7 6" />
                  <text x={x} y={y} fill="#d1fae5" fontSize="9" fontWeight="900">{label}</text>
                </g>
              ))}
              <text x="42" y="34" fill="#86efac" fontSize="10" fontWeight="900">CLASSICAL FACTORS</text>
            </g>

            <g opacity={isVisible("modern") ? 1 : 0.14}>
              <rect x="424" y="20" width="178" height="96" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="442" y="44" fill="#bae6fd" fontSize="10" fontWeight="900">MODERN FACTORS</text>
              <text x="442" y="66" fill="#ffffff" fontSize="9" fontWeight="800">skills data innovation</text>
              <text x="442" y="84" fill="#ffffff" fontSize="9" fontWeight="800">logistics policy value chains</text>
              <path d="M442 102 L388 154" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="7 6" />
            </g>

            <g opacity={isVisible("regions") ? 1 : 0.14}>
              <rect x="44" y="286" width="224" height="60" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="60" y="310" fill="#fef3c7" fontSize="10" fontWeight="900">OLD REGION</text>
              <text x="60" y="330" fill="#ffffff" fontSize="9" fontWeight="800">coal ore rail port legacy links</text>
            </g>

            <g opacity={isVisible("clusters") ? 1 : 0.14}>
              <rect x="288" y="286" width="246" height="60" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="304" y="310" fill="#bae6fd" fontSize="10" fontWeight="900">NEW CLUSTER</text>
              <text x="304" y="330" fill="#ffffff" fontSize="9" fontWeight="800">skills suppliers highway finance policy</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="34" y="116" width="172" height="72" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="52" y="142" fill="#fecdd3" fontSize="10" fontWeight="900">VERIFY THE CHAIN</text>
              <text x="52" y="162" fill="#ffffff" fontSize="9" fontWeight="800">industry factor region network</text>
              <text x="52" y="178" fill="#fde68a" fontSize="9" fontWeight="900">reject the mismatch</text>
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
        {geographyDay19IndustryLocationStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day19-industry-location-stage-${stage.id}`}
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

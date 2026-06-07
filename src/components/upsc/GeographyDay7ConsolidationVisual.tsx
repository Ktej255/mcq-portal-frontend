"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay7ConsolidationStages } from "@/lib/upsc/geographyDay7PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay7ConsolidationVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay7ConsolidationStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay7ConsolidationStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const stageNodes = [
    { id: "location", label: "Locate", detail: "map and scale", x: 92, y: 168, color: "#38bdf8" },
    { id: "tectonics", label: "Create relief", detail: "plates and hazards", x: 192, y: 92, color: "#fb923c" },
    { id: "surface", label: "Reshape", detail: "weathering and erosion", x: 302, y: 168, color: "#bef264" },
    { id: "circulation", label: "Redistribute", detail: "winds and currents", x: 412, y: 92, color: "#67e8f9" },
    { id: "synthesis", label: "Explain", detail: "effect and trap", x: 512, y: 168, color: "#fde68a" },
  ];

  return (
    <div
      data-testid="day7-consolidation-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#13251d]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 600 340"
            role="img"
            aria-label="Integrated physical-geography system from location through UPSC explanation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <path d="M 92 168 L 192 92 L 302 168 L 412 92 L 512 168" fill="none" stroke="#d1fae5" strokeWidth="5" strokeDasharray="10 8" opacity="0.78" />
            <path d="M 80 264 C 180 232, 286 250, 394 230 C 464 216, 520 228, 562 212" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
            <path d="M 128 264 C 166 214, 200 198, 240 226 C 274 250, 316 238, 358 194" fill="none" stroke="#a3e635" strokeWidth="6" strokeLinecap="round" opacity="0.72" />

            {stageNodes.map((node, index) => {
              const isVisible = index <= activeIndex;
              const isActive = index === activeIndex;
              return (
                <g key={node.id} opacity={isVisible ? 1 : 0.2}>
                  <circle cx={node.x} cy={node.y} r={isActive ? 45 : 38} fill="#0f172a" stroke={node.color} strokeWidth={isActive ? 5 : 3} />
                  <text x={node.x} y={node.y - 4} textAnchor="middle" fill={node.color} fontSize="12" fontWeight="900">{node.label}</text>
                  <text x={node.x} y={node.y + 16} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">{node.detail}</text>
                </g>
              );
            })}

            <text x="300" y="44" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">physical geography works as one connected map system</text>
            <text x="300" y="306" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">locate {"->"} explain driver {"->"} trace process {"->"} map effect {"->"} reject trap</text>
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
        {geographyDay7ConsolidationStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day7-consolidation-stage-${stage.id}`}
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

"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay13ResourcesAgricultureStages } from "@/lib/upsc/geographyDay13PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay13ResourcesAgricultureVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay13ResourcesAgricultureStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay13ResourcesAgricultureStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay13ResourcesAgricultureStages)[number]["id"]) =>
    geographyDay13ResourcesAgricultureStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day13-resources-agriculture-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Resources and agriculture learning map with location factors, mineral belts, crop suitability, irrigation pressure, and regional clusters"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#eef8e8"
              stroke="#bbf7d0"
              strokeWidth="5"
              opacity="0.94"
            />

            <g opacity={isVisible("locate") ? 1 : 0.16}>
              <rect x="38" y="24" width="194" height="114" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="54" y="48" fill="#86efac" fontSize="10" fontWeight="900">LOCATION LOGIC</text>
              <text x="54" y="68" fill="#ffffff" fontSize="9" fontWeight="800">geology  relief  soil  water</text>
              <text x="54" y="86" fill="#ffffff" fontSize="9" fontWeight="800">climate  route  market  policy</text>
              <text x="54" y="112" fill="#fde68a" fontSize="9" fontWeight="900">locate before memorizing</text>
            </g>

            <g opacity={isVisible("resources") ? 1 : 0.14}>
              <path d="M232 138 C288 160, 346 192, 394 246" fill="none" stroke="#7c3aed" strokeWidth="18" strokeLinecap="round" opacity="0.86" />
              <path d="M290 118 C338 126, 390 144, 424 178" fill="none" stroke="#334155" strokeWidth="14" strokeLinecap="round" opacity="0.9" />
              <circle cx="250" cy="148" r="9" fill="#fbbf24" stroke="#fef3c7" strokeWidth="3" />
              <circle cx="330" cy="188" r="9" fill="#fbbf24" stroke="#fef3c7" strokeWidth="3" />
              <circle cx="396" cy="246" r="9" fill="#fbbf24" stroke="#fef3c7" strokeWidth="3" />
              <text x="458" y="112" fill="#ddd6fe" fontSize="10" fontWeight="900">RESOURCE BELTS</text>
              <text x="458" y="130" fill="#ede9fe" fontSize="9" fontWeight="800">geology + route + demand</text>
            </g>

            <g opacity={isVisible("crops") ? 1 : 0.14}>
              <path d="M216 114 C272 96, 348 102, 428 136" fill="none" stroke="#fbbf24" strokeWidth="18" strokeLinecap="round" opacity="0.8" />
              <path d="M286 216 C324 232, 364 260, 384 298" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" opacity="0.82" />
              <path d="M206 164 C230 182, 248 206, 258 232" fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round" opacity="0.76" />
              <text x="48" y="214" fill="#fed7aa" fontSize="10" fontWeight="900">CROP BELTS</text>
              <text x="48" y="232" fill="#ffedd5" fontSize="9" fontWeight="800">soil + rain + season + market</text>
            </g>

            <g opacity={isVisible("water") ? 1 : 0.14}>
              <path d="M226 120 C284 146, 342 170, 420 198" fill="none" stroke="#38bdf8" strokeWidth="7" strokeDasharray="10 7" />
              <path d="M254 166 C292 192, 324 216, 350 252" fill="none" stroke="#0ea5e9" strokeWidth="7" strokeDasharray="10 7" />
              <text x="454" y="212" fill="#bae6fd" fontSize="10" fontWeight="900">WATER PRESSURE</text>
              <text x="454" y="230" fill="#e0f2fe" fontSize="9" fontWeight="800">output + depletion + salinity</text>
            </g>

            <g opacity={isVisible("cluster") ? 1 : 0.14}>
              <rect x="430" y="260" width="176" height="84" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="446" y="282" fill="#86efac" fontSize="10" fontWeight="900">EXPLAIN ONE CLUSTER</text>
              <text x="446" y="302" fill="#ffffff" fontSize="9" fontWeight="800">factor  belt  use  pressure</text>
              <text x="446" y="322" fill="#fde68a" fontSize="9" fontWeight="900">reject the swapped pair</text>
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
        {geographyDay13ResourcesAgricultureStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day13-resources-agriculture-stage-${stage.id}`}
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

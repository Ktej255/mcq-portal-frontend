"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay15PopulationStages } from "@/lib/upsc/geographyDay15PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay15PopulationVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay15PopulationStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay15PopulationStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay15PopulationStages)[number]["id"]) =>
    geographyDay15PopulationStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day15-population-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Population geography learning map with indicators, concentration factors, migration, demographic transition, and UPSC traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#eef8e8"
              stroke="#bbf7d0"
              strokeWidth="5"
              opacity="0.94"
            />

            <g opacity={isVisible("concepts") ? 1 : 0.16}>
              <rect x="36" y="28" width="192" height="112" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="52" y="50" fill="#86efac" fontSize="10" fontWeight="900">INDICATORS</text>
              <text x="52" y="70" fill="#ffffff" fontSize="9" fontWeight="800">density = ratio</text>
              <text x="52" y="88" fill="#ffffff" fontSize="9" fontWeight="800">distribution = map pattern</text>
              <text x="52" y="112" fill="#fde68a" fontSize="9" fontWeight="900">do not swap the terms</text>
            </g>

            <g opacity={isVisible("controls") ? 1 : 0.14}>
              <circle cx="252" cy="132" r="17" fill="#dc2626" opacity="0.9" />
              <circle cx="296" cy="152" r="15" fill="#ef4444" opacity="0.86" />
              <circle cx="382" cy="208" r="17" fill="#dc2626" opacity="0.9" />
              <circle cx="356" cy="248" r="13" fill="#f97316" opacity="0.84" />
              <circle cx="224" cy="192" r="11" fill="#f97316" opacity="0.82" />
              <text x="456" y="86" fill="#fecaca" fontSize="10" fontWeight="900">CONCENTRATION</text>
              <text x="456" y="104" fill="#fee2e2" fontSize="9" fontWeight="800">water jobs routes services</text>
            </g>

            <g opacity={isVisible("migration") ? 1 : 0.14}>
              <path d="M226 230 C272 202, 316 184, 374 174" fill="none" stroke="#38bdf8" strokeWidth="7" strokeDasharray="10 7" />
              <path d="M365 164 L388 172 L368 188" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="52" y="270" fill="#bae6fd" fontSize="10" fontWeight="900">MIGRATION</text>
              <text x="52" y="288" fill="#e0f2fe" fontSize="9" fontWeight="800">push - route - pull - effect</text>
            </g>

            <g opacity={isVisible("transition") ? 1 : 0.14}>
              <path d="M448 164 C484 136, 520 150, 548 188 C568 216, 572 244, 594 262" fill="none" stroke="#fbbf24" strokeWidth="6" />
              <circle cx="448" cy="164" r="8" fill="#fde68a" />
              <circle cx="548" cy="188" r="8" fill="#fde68a" />
              <circle cx="594" cy="262" r="8" fill="#fde68a" />
              <text x="450" y="302" fill="#fef3c7" fontSize="10" fontWeight="900">DEMOGRAPHIC TRANSITION</text>
              <text x="450" y="320" fill="#fffbeb" fontSize="9" fontWeight="800">birth death growth age structure</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="42" y="300" width="342" height="44" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="58" y="326" fill="#fecdd3" fontSize="10" fontWeight="900">CHECK THE TERM: RATIO, PATTERN, RATE, BIRTH BEHAVIOR, OR MOVEMENT?</text>
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
        {geographyDay15PopulationStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day15-population-stage-${stage.id}`}
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

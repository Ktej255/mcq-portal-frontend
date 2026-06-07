"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay1PortalLesson } from "@/lib/upsc/geographyDay1PortalLesson";
import { cn } from "@/lib/utils";

const stageNotes = geographyDay1PortalLesson.scenes.map((scene, index) => ({
  ...scene,
  shortLabel: ["Ask", "Locate", "Relate", "Trap", "Explain"][index] ?? scene.title,
}));

export function GeographyDay1MapThinkingVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = stageNotes[activeIndex] ?? stageNotes[0];
  const showLocation = activeIndex >= 1;
  const showRelationships = activeIndex >= 2;
  const showTrap = activeIndex >= 3;
  const showAnswer = activeIndex >= 4;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= stageNotes.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1700);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      data-testid="day1-map-thinking-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#071d17]"
    >
      <div className="grid min-h-[24rem] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden p-4 sm:p-5">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <svg
            viewBox="0 0 620 360"
            role="img"
            aria-label="Geographic thinking map relationship animation"
            className="relative z-10 h-full min-h-[21rem] w-full"
          >
            <defs>
              <linearGradient id="day1-river" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="day1-land" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#bbf7d0" />
              </linearGradient>
            </defs>

            <rect x="42" y="42" width="544" height="276" rx="20" fill="#0b2a21" stroke="#8ee8c8" strokeWidth="2" />
            <path
              d="M74 242 C118 198, 158 226, 197 184 C234 145, 276 157, 314 116 C350 77, 414 82, 458 116 C504 151, 536 126, 564 92"
              fill="none"
              stroke="url(#day1-river)"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d="M76 100 C136 56, 235 80, 277 125 C321 170, 403 164, 460 202 C509 236, 548 228, 568 264 L568 314 L76 314 Z"
              fill="url(#day1-land)"
              opacity="0.2"
            />

            <g opacity={activeIndex >= 0 ? 1 : 0.2}>
              <rect x="70" y="62" width="148" height="66" rx="12" fill="#fefce8" />
              <text x="144" y="88" textAnchor="middle" fill="#14532d" fontSize="14" fontWeight="900">
                WHAT?
              </text>
              <text x="144" y="108" textAnchor="middle" fill="#365245" fontSize="11" fontWeight="800">
                name the feature
              </text>
            </g>

            <g opacity={showLocation ? 1 : 0.2}>
              <line x1="290" y1="58" x2="290" y2="322" stroke="#fef3c7" strokeWidth="2" strokeDasharray="7 8" />
              <line x1="54" y1="178" x2="588" y2="178" stroke="#fef3c7" strokeWidth="2" strokeDasharray="7 8" />
              <circle cx="290" cy="178" r="15" fill="#f97316" stroke="#fff7ed" strokeWidth="4" />
              <rect x="246" y="205" width="88" height="42" rx="10" fill="#fff7ed" />
              <text x="290" y="231" textAnchor="middle" fill="#7c2d12" fontSize="13" fontWeight="900">
                WHERE?
              </text>
            </g>

            <g opacity={showRelationships ? 1 : 0.22}>
              <path d="M290 178 L170 244" stroke="#8ee8c8" strokeWidth="4" strokeDasharray="8 7" />
              <path d="M290 178 L466 118" stroke="#8ee8c8" strokeWidth="4" strokeDasharray="8 7" />
              <path d="M290 178 L468 250" stroke="#8ee8c8" strokeWidth="4" strokeDasharray="8 7" />
              {[
                [170, 244, "River"],
                [466, 118, "Pass"],
                [468, 250, "Coast"],
              ].map(([cx, cy, label]) => (
                <g key={String(label)}>
                  <circle cx={cx as number} cy={cy as number} r="24" fill="#ecfdf5" stroke="#34d399" strokeWidth="3" />
                  <text x={cx as number} y={(cy as number) + 4} textAnchor="middle" fill="#064e3b" fontSize="12" fontWeight="900">
                    {label}
                  </text>
                </g>
              ))}
              <rect x="386" y="52" width="154" height="58" rx="12" fill="#ecfdf5" />
              <text x="463" y="77" textAnchor="middle" fill="#064e3b" fontSize="13" fontWeight="900">
                WHY HERE?
              </text>
              <text x="463" y="96" textAnchor="middle" fill="#315244" fontSize="10" fontWeight="800">
                prove the relationship
              </text>
            </g>

            <g opacity={showTrap ? 1 : 0.18}>
              <rect x="82" y="268" width="182" height="48" rx="12" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
              <text x="173" y="288" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="900">
                UPSC TRAP
              </text>
              <text x="173" y="306" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="800">
                one name is not enough
              </text>
            </g>

            <g opacity={showAnswer ? 1 : 0.18}>
              <rect x="360" y="246" width="186" height="66" rx="14" fill="#052e16" stroke="#86efac" strokeWidth="3" />
              <text x="453" y="270" textAnchor="middle" fill="#bbf7d0" fontSize="12" fontWeight="900">
                FINAL ANSWER
              </text>
              <text x="453" y="291" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="800">
                what + where + relation + trap
              </text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#75ddbc]">
              12 minute lesson
            </p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.title}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.narration}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fde68a]">
              {activeStage.checkpoint}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              title={isPlaying ? "Pause lesson animation" : "Play lesson animation"}
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d9e75] px-3 text-sm font-black text-white transition hover:bg-[#087a59]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Restart lesson animation"
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
        {stageNotes.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day1-map-thinking-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#0b241d] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#8ee8c8]" : "text-white/60 hover:bg-[#10382d] hover:text-white",
            )}
          >
            {index + 1}. {stage.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

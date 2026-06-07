"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay2UniverseStages } from "@/lib/upsc/geographyDay2PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay2UniverseVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay2UniverseStages[activeIndex];
  const showStructure = activeIndex >= 1;
  const showDisk = activeIndex >= 2;
  const showEarth = activeIndex >= 3;
  const showSurface = activeIndex >= 4;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay2UniverseStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      data-testid="day2-universe-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#071321]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <div className="absolute inset-0 opacity-70">
            {Array.from({ length: 48 }).map((_, index) => (
              <span
                key={index}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{
                  left: `${(index * 29) % 100}%`,
                  top: `${(index * 17) % 100}%`,
                  opacity: 0.18 + ((index % 5) * 0.12),
                }}
              />
            ))}
          </div>

          <svg
            viewBox="0 0 560 330"
            role="img"
            aria-label="Universe to Earth causal animation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <defs>
              <radialGradient id="day2-hot-state" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="55%" stopColor="#fb923c" stopOpacity="0.86" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="day2-earth" cx="42%" cy="38%" r="64%">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="54%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#164e63" />
              </radialGradient>
            </defs>

            <g opacity={activeIndex === 0 ? 1 : 0.4}>
              {[46, 78, 112].map((radius) => (
                <circle key={radius} cx="105" cy="165" r={radius} fill="none" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="7 8" />
              ))}
              <circle cx="105" cy="165" r="40" fill="url(#day2-hot-state)" />
              <text x="105" y="169" textAnchor="middle" fill="#3b0764" fontSize="11" fontWeight="900">EXPANDS</text>
              <text x="105" y="298" textAnchor="middle" fill="#ddd6fe" fontSize="12" fontWeight="900">space expands and cools</text>
            </g>

            <path d="M 210 165 L 252 165" stroke="#6ee7b7" strokeWidth="3" strokeDasharray="6 7" />
            <polygon points="252,165 238,157 238,173" fill="#6ee7b7" />

            <g opacity={showStructure ? 1 : 0.22}>
              <circle cx="306" cy="165" r="75" fill="#172554" stroke="#60a5fa" strokeWidth="2" strokeDasharray="8 7" />
              {[[-32, -24], [23, -34], [-8, 22], [34, 18], [-36, 35]].map(([x, y], index) => (
                <g key={`${x}-${y}`}>
                  <circle cx={306 + x} cy={165 + y} r={8 + (index % 3) * 3} fill="#38bdf8" opacity="0.58" />
                  <circle cx={310 + x} cy={162 + y} r="3" fill="#fef3c7" />
                </g>
              ))}
              <text x="306" y="298" textAnchor="middle" fill="#bfdbfe" fontSize="12" fontWeight="900">gravity builds structure</text>
            </g>

            <path d="M 384 165 L 424 165" stroke="#6ee7b7" strokeWidth="3" strokeDasharray="6 7" />
            <polygon points="424,165 410,157 410,173" fill="#6ee7b7" />

            <g opacity={showDisk ? 1 : 0.2}>
              <ellipse cx="478" cy="165" rx="72" ry="33" fill="#0f766e" opacity="0.46" stroke="#99f6e4" strokeWidth="2" />
              <ellipse cx="478" cy="165" rx="54" ry="20" fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="5 6" />
              <circle cx="478" cy="165" r="18" fill="#facc15" />
              {[438, 453, 509, 528].map((x, index) => (
                <circle key={x} cx={x} cy="165" r={4 + (index % 2) * 2} fill={index < 2 ? "#fca5a5" : "#93c5fd"} />
              ))}
              <text x="478" y="298" textAnchor="middle" fill="#ccfbf1" fontSize="12" fontWeight="900">solar disk and accretion</text>
            </g>

            {showEarth ? (
              <g>
                <circle cx="478" cy="86" r="38" fill="url(#day2-earth)" stroke="#bae6fd" strokeWidth="2" />
                <circle cx="478" cy="86" r="24" fill="#fb923c" opacity="0.72" />
                <circle cx="478" cy="86" r="11" fill="#fef3c7" />
                <text x="478" y="38" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">density sorting</text>
              </g>
            ) : null}

            {showSurface ? (
              <g>
                <path d="M 448 87 C 456 58, 492 50, 510 78" fill="none" stroke="#dbeafe" strokeWidth="4" opacity="0.88" />
                <path d="M 444 97 C 464 112, 490 112, 512 96" fill="none" stroke="#67e8f9" strokeWidth="4" opacity="0.9" />
                <text x="478" y="137" textAnchor="middle" fill="#bae6fd" fontSize="10" fontWeight="900">atmosphere and water</text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#75ddbc]">{activeStage.eyebrow}</p>
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
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d9e75] px-3 text-sm font-black text-white transition hover:bg-[#087a59]"
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
        {geographyDay2UniverseStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day2-universe-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#0b1c2d] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#8ee8c8]" : "text-white/60 hover:bg-[#102a3d] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

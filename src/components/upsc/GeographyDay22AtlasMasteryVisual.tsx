"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay22AtlasMasteryStages } from "@/lib/upsc/geographyDay22PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay22AtlasMasteryVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay22AtlasMasteryStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay22AtlasMasteryStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay22AtlasMasteryStages)[number]["id"]) =>
    geographyDay22AtlasMasteryStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day22-atlas-mastery-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Atlas mastery board connecting map orientation, neighbors, physical layers, quick recall, and nearby-location traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("orient") ? 1 : 0.16}>
              <circle cx="304" cy="174" r="104" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <path d="M304 50 L304 298 M180 174 L428 174" stroke="#86efac" strokeWidth="3" strokeDasharray="8 7" />
              <path d="M304 58 L294 80 L314 80 Z M304 290 L294 268 L314 268 Z M188 174 L210 164 L210 184 Z M420 174 L398 164 L398 184 Z" fill="#86efac" />
              <text x="296" y="40" fill="#dcfce7" fontSize="12" fontWeight="900">N</text>
              <text x="296" y="318" fill="#dcfce7" fontSize="12" fontWeight="900">S</text>
              <text x="160" y="180" fill="#dcfce7" fontSize="12" fontWeight="900">W</text>
              <text x="442" y="180" fill="#dcfce7" fontSize="12" fontWeight="900">E</text>
              <circle cx="336" cy="136" r="16" fill="#fbbf24" stroke="#fde68a" strokeWidth="4" />
              <text x="42" y="34" fill="#86efac" fontSize="10" fontWeight="900">ORIENTATION FIRST</text>
            </g>

            <g opacity={isVisible("neighbors") ? 1 : 0.14}>
              {[
                ["244", "112"],
                ["382", "116"],
                ["244", "224"],
                ["388", "224"],
              ].map(([cx, cy]) => (
                <g key={`${cx}-${cy}`}>
                  <line x1="336" y1="136" x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="3" strokeDasharray="7 6" />
                  <circle cx={cx} cy={cy} r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
                </g>
              ))}
              <text x="466" y="94" fill="#bae6fd" fontSize="10" fontWeight="900">NEIGHBOR LINKS</text>
              <text x="466" y="114" fill="#ffffff" fontSize="9" fontWeight="800">state river range coast sea</text>
            </g>

            <g opacity={isVisible("layers") ? 1 : 0.14}>
              <rect x="40" y="264" width="236" height="78" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="58" y="288" fill="#fef3c7" fontSize="10" fontWeight="900">MAP LAYERS</text>
              <text x="58" y="308" fill="#ffffff" fontSize="9" fontWeight="800">relief rivers climate resources</text>
              <text x="58" y="326" fill="#ffffff" fontSize="9" fontWeight="800">biodiversity ports borders current</text>
            </g>

            <g opacity={isVisible("recall") ? 1 : 0.14}>
              <rect x="330" y="266" width="262" height="76" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="348" y="290" fill="#bae6fd" fontSize="10" fontWeight="900">QUICK RECALL</text>
              <text x="348" y="312" fill="#ffffff" fontSize="9" fontWeight="800">{"locate -> connect -> explain -> compare"}</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="454" y="148" width="154" height="76" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="472" y="174" fill="#fecdd3" fontSize="10" fontWeight="900">VERIFY THE SWAP</text>
              <text x="472" y="194" fill="#ffffff" fontSize="9" fontWeight="800">direction neighbor layer</text>
              <text x="472" y="210" fill="#fde68a" fontSize="9" fontWeight="900">regional relationship</text>
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
        {geographyDay22AtlasMasteryStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day22-atlas-mastery-stage-${stage.id}`}
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

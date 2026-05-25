"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Earth,
  Layers3,
  Moon,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  geographyAnimationBlueprints,
  geographyAnimationProductionQueue,
  geographyAnimationStandards,
  getGeographyAnimationBlueprint,
  universeAnimationTopics,
} from "@/lib/upsc/geographyAnimationCatalog";
import { cn } from "@/lib/utils";

function frameTone(index: number) {
  if (index <= 1) return "from-[#111827] via-[#1f2937] to-[#0f172a]";
  if (index <= 3) return "from-[#12243b] via-[#17425c] to-[#0f172a]";
  if (index <= 6) return "from-[#153829] via-[#1f5d47] to-[#0f172a]";
  return "from-[#3b2f12] via-[#62491d] to-[#13251d]";
}

function UniversePreview({ frameIndex }: { frameIndex: number }) {
  const orbitProgress = Math.min(Math.max((frameIndex - 2) / 4, 0), 1);
  const earthX = 210 + Math.cos(orbitProgress * Math.PI * 1.65) * 132;
  const earthY = 142 + Math.sin(orbitProgress * Math.PI * 1.65) * 72;
  const showScale = frameIndex <= 1;
  const showOrbit = frameIndex >= 2;
  const showTilt = frameIndex >= 3;
  const showRays = frameIndex >= 5;
  const showSeasons = frameIndex >= 6;
  const showTrap = frameIndex === 7;
  const showProof = frameIndex >= 8;
  const seasonalNodes = [
    { label: "June solstice", x: 80, y: 142, cue: "N. Hemisphere direct rays" },
    { label: "Sept equinox", x: 210, y: 70, cue: "Equal day and night" },
    { label: "Dec solstice", x: 340, y: 142, cue: "S. Hemisphere direct rays" },
    { label: "Mar equinox", x: 210, y: 214, cue: "Equal day and night" },
  ];
  const activeSeasonIndex = showSeasons ? Math.min(Math.max(frameIndex - 6, 0), seasonalNodes.length - 1) : -1;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className={cn(
        "relative min-h-[420px] overflow-hidden rounded-lg bg-gradient-to-br p-4 text-white shadow-inner",
        frameTone(frameIndex),
      )}
    >
      <div className="absolute inset-0 opacity-50">
        {Array.from({ length: 46 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white/80"
            style={{
              left: `${(index * 31) % 100}%`,
              top: `${(index * 17) % 100}%`,
              opacity: 0.25 + ((index % 5) * 0.12),
            }}
          />
        ))}
      </div>

      <div
        data-testid="universe-orbital-mechanism-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          23.5 deg tilt locked
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Direct rays vs slant rays
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Seasons need tilt plus revolution
        </span>
      </div>

      <svg viewBox="0 0 420 290" className="relative z-10 h-[300px] w-full" role="img" aria-label="Universe to Earth orbital mechanism preview">
        {showScale ? (
          <>
            <circle cx="210" cy="142" r={frameIndex === 0 ? 8 : 20} fill="#38bdf8" />
            <circle cx="210" cy="142" r={54} fill="none" stroke="#e5e7eb" strokeDasharray="4 8" opacity="0.35" />
            <circle cx="210" cy="142" r={98} fill="none" stroke="#e5e7eb" strokeDasharray="4 10" opacity="0.25" />
            <circle cx="210" cy="142" r={140} fill="none" stroke="#e5e7eb" strokeDasharray="4 12" opacity="0.18" />
            <text x="210" y="202" textAnchor="middle" fill="#e5e7eb" fontSize="10" fontWeight="800">
              Earth inside larger physical systems
            </text>
            <text x="210" y="222" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="800">
              Universe to galaxy to Solar System to Earth
            </text>
          </>
        ) : null}

        {showOrbit ? (
          <>
            <circle cx="210" cy="142" r="34" fill="#facc15" />
            <circle cx="210" cy="142" r="46" fill="none" stroke="#fde68a" opacity="0.25" />
            <text x="210" y="146" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="900">
              SUN
            </text>
            <ellipse cx="210" cy="142" rx="132" ry="72" fill="none" stroke="#d1fae5" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
            <ellipse cx="210" cy="142" rx="96" ry="52" fill="none" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="3 8" opacity="0.25" />
            <circle cx={earthX} cy={earthY} r="20" fill="#2dd4bf" />
            <path d={`M ${earthX - 8} ${earthY - 17} C ${earthX + 6} ${earthY - 11}, ${earthX + 10} ${earthY + 6}, ${earthX - 5} ${earthY + 17}`} stroke="#134e4a" strokeWidth="3" fill="none" opacity="0.75" />
            {showTilt ? (
              <>
                <line x1={earthX - 10} y1={earthY + 28} x2={earthX + 10} y2={earthY - 28} stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                <path d={`M ${earthX + 16} ${earthY - 24} A 27 27 0 0 1 ${earthX + 24} ${earthY + 6}`} stroke="#fef3c7" strokeWidth="2" fill="none" />
                <text x={earthX + 28} y={earthY - 18} fill="#fef3c7" fontSize="9" fontWeight="900">23.5 deg</text>
              </>
            ) : null}
            {showRays ? (
              <>
                {[90, 112, 134, 156, 178].map((y) => (
                  <line key={y} x1="56" y1={y} x2={earthX - 30} y2={earthY + (y - 134) * 0.24} stroke="#fde68a" strokeWidth={y === 134 ? 4 : 2} opacity={y === 134 ? 0.95 : 0.75} />
                ))}
                <text x="62" y="78" fill="#fef3c7" fontSize="10" fontWeight="900">Sunlight angle changes energy</text>
                <text x={Math.max(40, earthX - 64)} y={earthY + 52} fill="#bbf7d0" fontSize="9" fontWeight="900">
                  direct and slant rays create unequal heating
                </text>
              </>
            ) : null}
          </>
        ) : null}

        {showSeasons ? (
          <>
            {seasonalNodes.map((node, index) => {
              const active = index === activeSeasonIndex;
              return (
                <g key={node.label}>
                  <circle cx={node.x} cy={node.y} r={active ? 15 : 10} fill={active ? "#fef3c7" : "#d1fae5"} opacity={active ? 0.95 : 0.55} />
                  <line x1={node.x - 5} y1={node.y + 18} x2={node.x + 5} y2={node.y - 18} stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
                  <text x={node.x} y={node.y + (node.y < 100 ? -22 : 34)} textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="900">
                    {node.label}
                  </text>
                  {active ? (
                    <text x={node.x} y={node.y + (node.y < 100 ? -10 : 47)} textAnchor="middle" fill="#bbf7d0" fontSize="8" fontWeight="800">
                      {node.cue}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <rect x="92" y="242" width="236" height="28" rx="8" fill="#0f5132" opacity="0.82" />
            <text x="210" y="260" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              Solstice/equinox labels appear after the mechanism, not before it.
            </text>
          </>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="80" y="92" width="260" height="88" rx="10" fill="#7f1d1d" opacity="0.94" />
            <text x="210" y="120" textAnchor="middle" fill="#fee2e2" fontSize="13" fontWeight="900">UPSC trap</text>
            <text x="210" y="144" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Seasons are not mainly distance from the Sun.</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Correct chain: tilt plus revolution plus sunlight angle.</text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="62" y="74" width="296" height="112" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="104" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="130" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Tilt plus revolution changes sunlight angle.</text>
            <text x="210" y="148" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Sunlight angle and day length create seasons.</text>
            <text x="210" y="166" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">Do not use distance as the main cause.</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 grid gap-2 sm:grid-cols-4">
        {[
          ["Scale", showScale],
          ["Orbit", showOrbit],
          ["Tilt", showTilt],
          ["Proof", showProof],
        ].map(([label, active]) => (
          <div
            key={String(label)}
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-white/20 bg-white/10 text-white/65",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-3">
        {[
          ["Mechanism", "Axis remains tilted while Earth revolves."],
          ["Energy", "Direct rays concentrate heat; slant rays spread heat."],
          ["Outcome", "Solstice and equinox are named after the mechanism is visible."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BigBangPreview({ frameIndex }: { frameIndex: number }) {
  const expansion = 34 + frameIndex * 18;
  const heatStage = frameIndex <= 1 ? "Hot dense state" : frameIndex <= 2 ? "Expansion begins" : frameIndex <= 3 ? "Cooling allows matter" : frameIndex <= 5 ? "Gravity builds structure" : "Proof ready";
  const coolingColor = frameIndex <= 1 ? "#fef3c7" : frameIndex <= 2 ? "#fb923c" : frameIndex <= 3 ? "#f472b6" : "#93c5fd";
  const gridOpacity = frameIndex >= 1 ? 0.58 : 0.2;
  const showRadiation = frameIndex >= 3;
  const showStructure = frameIndex >= 4;
  const showProof = frameIndex >= 6;
  const gridLines = [-2, -1, 0, 1, 2].map((value) => value * (22 + frameIndex * 8));
  const densitySeeds = [
    { x: 116, y: 86, size: 12 },
    { x: 250, y: 82, size: 9 },
    { x: 106, y: 178, size: 8 },
    { x: 270, y: 174, size: 14 },
    { x: 186, y: 206, size: 7 },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[420px] overflow-hidden rounded-lg bg-gradient-to-br from-[#12091f] via-[#3b145f] to-[#060712] p-4 text-white shadow-inner"
    >
      <div className="absolute inset-0">
        {Array.from({ length: 52 }).map((_, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + (index % 3)}px`,
              height: `${1 + (index % 3)}px`,
              left: `${(index * 29 + frameIndex * 9) % 100}%`,
              top: `${(index * 17 + frameIndex * 13) % 100}%`,
              opacity: 0.2 + ((index % 4) * 0.13),
            }}
          />
        ))}
      </div>

      <div
        data-testid="big-bang-expanding-space-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Expansion of space itself
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Cooling creates matter
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Gravity forms structure
        </span>
      </div>

      <svg viewBox="0 0 420 290" className="relative z-10 h-[300px] w-full" role="img" aria-label="Big Bang expanding-space mechanism preview">
        <defs>
          <radialGradient id="bigBangHeat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
            <stop offset="48%" stopColor={coolingColor} stopOpacity="0.82" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.08" />
          </radialGradient>
          <pattern id="cmbTexture" patternUnits="userSpaceOnUse" width="24" height="18">
            <circle cx="4" cy="4" r="2" fill="#f9a8d4" opacity="0.45" />
            <circle cx="18" cy="11" r="1.4" fill="#93c5fd" opacity="0.42" />
            <circle cx="10" cy="15" r="1" fill="#fde68a" opacity="0.35" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="420" height="290" fill="url(#bigBangHeat)" opacity={frameIndex <= 1 ? 0.95 : 0.42} />

        {gridLines.map((offset) => (
          <g key={`grid-${offset}`} opacity={gridOpacity}>
            <line x1={210 + offset} y1="28" x2={210 + offset} y2="252" stroke="#c4b5fd" strokeWidth="1.4" strokeDasharray="6 7" />
            <line x1="42" y1={145 + offset * 0.52} x2="378" y2={145 + offset * 0.52} stroke="#c4b5fd" strokeWidth="1.4" strokeDasharray="6 7" />
          </g>
        ))}
        {frameIndex >= 1 ? (
          <text x="210" y="34" textAnchor="middle" fill="#ddd6fe" fontSize="11" fontWeight="900">
            grid points separate because space expands
          </text>
        ) : null}

        {[0, 1, 2].map((ring) => (
          <circle
            key={ring}
            cx="210"
            cy="145"
            r={Math.max(8, expansion + ring * 28)}
            fill="none"
            stroke={ring === 0 ? "#fef3c7" : ring === 1 ? "#f472b6" : "#93c5fd"}
            strokeWidth="3"
            opacity={Math.max(0.15, 0.78 - ring * 0.2)}
            strokeDasharray={ring === 2 ? "8 10" : undefined}
          />
        ))}
        <circle cx="210" cy="145" r={Math.max(8, 24 - frameIndex * 1.2)} fill={coolingColor} opacity="0.95" />
        <text x="210" y="150" textAnchor="middle" fill="#1f102a" fontSize="9" fontWeight="900">
          {frameIndex <= 1 ? "hot" : "cooling"}
        </text>

        {frameIndex >= 2 ? (
          <g>
            {[70, 102, 290, 324].map((x, index) => (
              <circle
                key={x}
                cx={x}
                cy={index % 2 === 0 ? 98 : 194}
                r={3 + index}
                fill="#fde68a"
                opacity="0.82"
              />
            ))}
            <text x="210" y="266" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="900">
              expansion lowers temperature; particles can stabilize
            </text>
          </g>
        ) : null}

        {showRadiation ? (
          <g opacity="0.82">
            <rect x="54" y="58" width="312" height="174" rx="18" fill="url(#cmbTexture)" opacity="0.45" />
            {[64, 104, 144, 184, 224, 264, 304].map((x) => (
              <path key={x} d={`M ${x} 226 C ${x + 22} 194, ${x - 18} 166, ${x + 18} 132`} stroke="#f9a8d4" strokeWidth="2" fill="none" />
            ))}
            <text x="210" y="238" textAnchor="middle" fill="#fce7f3" fontSize="11" fontWeight="900">
              cosmic background radiation cue
            </text>
          </g>
        ) : null}

        {showStructure ? (
          <g>
            {densitySeeds.map((seed, index) => (
              <g key={`${seed.x}-${seed.y}`}>
                <circle cx={seed.x} cy={seed.y} r={seed.size + frameIndex} fill="#38bdf8" opacity="0.35" />
                <circle cx={seed.x} cy={seed.y} r={seed.size} fill="#38bdf8" opacity="0.86" />
                <circle cx={seed.x + 12} cy={seed.y + 5} r={3 + (index % 3)} fill="#fef3c7" />
                <path
                  d={`M ${seed.x - 10} ${seed.y} C ${seed.x + 2} ${seed.y - 14}, ${seed.x + 18} ${seed.y - 12}, ${seed.x + 26} ${seed.y + 3}`}
                  stroke="#bfdbfe"
                  strokeWidth="1.4"
                  fill="none"
                  opacity="0.7"
                />
              </g>
            ))}
            <text x="210" y="50" textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="900">
              tiny density differences grow into matter clouds
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="54" y="74" width="312" height="116" rx="12" fill="#172554" opacity="0.95" />
            <text x="210" y="106" textAnchor="middle" fill="#dbeafe" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="132" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">space expands, temperature falls, matter stabilizes</text>
            <text x="210" y="150" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">gravity organizes density differences into structure</text>
            <text x="210" y="168" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">not explosion into pre-existing empty space</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 grid gap-2 sm:grid-cols-4">
        {[
          ["Stage", heatStage],
          ["Space", "Grid expands"],
          ["Temperature", frameIndex <= 2 ? "Very hot" : "Cooling"],
          ["Evidence", showRadiation ? "CMB cue visible" : "CMB pending"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-3 rounded-md border border-white/15 bg-white/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-100">Continuity chain</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/85">
          Hot dense state to expansion of space to cooling to background radiation evidence to gravity-led structure.
        </p>
      </div>
    </div>
  );
}

function SolarSystemFormationPreview({ frameIndex }: { frameIndex: number }) {
  const showCollapse = frameIndex >= 1;
  const showSun = frameIndex >= 2;
  const showAccretion = frameIndex >= 3;
  const showSorting = frameIndex >= 4;
  const showLeftovers = frameIndex >= 5;
  const showProof = frameIndex >= 6;
  const dustParticles = Array.from({ length: 38 }).map((_, index) => ({
    x: 36 + ((index * 41 + frameIndex * 8) % 350),
    y: 54 + ((index * 29 + frameIndex * 5) % 180),
    size: 1.5 + (index % 4),
  }));
  const rockyPlanets = [
    { x: 166, y: 145, r: 5, label: "Mercury" },
    { x: 190, y: 145, r: 7, label: "Venus" },
    { x: 216, y: 145, r: 7, label: "Earth" },
    { x: 242, y: 145, r: 6, label: "Mars" },
  ];
  const gasPlanets = [
    { x: 306, y: 145, r: 13, label: "Jupiter" },
    { x: 344, y: 145, r: 12, label: "Saturn" },
    { x: 376, y: 145, r: 10, label: "Ice giants" },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#09111f] via-[#223047] to-[#111827] p-4 text-white shadow-inner"
    >
      <div
        data-testid="solar-system-formation-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Gravity collapses nebula
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Disk sorts material by heat
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Accretion builds planets
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Solar System formation nebular disk preview">
        <defs>
          <radialGradient id="solarFormationSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="56%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.22" />
          </radialGradient>
          <radialGradient id="nebularCloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        <ellipse cx="210" cy="145" rx={showCollapse ? 154 : 190} ry={showCollapse ? 74 : 112} fill="url(#nebularCloud)" />
        {dustParticles.map((particle, index) => (
          <circle
            key={`${particle.x}-${particle.y}-${index}`}
            cx={showCollapse ? 210 + (particle.x - 210) * 0.72 : particle.x}
            cy={showCollapse ? 145 + (particle.y - 145) * 0.54 : particle.y}
            r={particle.size}
            fill={index % 5 === 0 ? "#fef3c7" : "#bfdbfe"}
            opacity={0.32 + (index % 4) * 0.12}
          />
        ))}

        {showCollapse ? (
          <g>
            {[52, 90, 330, 366].map((x, index) => (
              <path
                key={x}
                d={`M ${x} ${index % 2 === 0 ? 76 : 212} C ${120 + index * 18} ${index % 2 === 0 ? 112 : 184}, 170 145, 210 145`}
                stroke="#93c5fd"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
                strokeDasharray="7 7"
              />
            ))}
            <text x="210" y="42" textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="900">
              Gravity pulls gas and dust inward
            </text>
          </g>
        ) : null}

        {showCollapse ? (
          <g opacity="0.88">
            <ellipse cx="210" cy="145" rx="154" ry="48" fill="none" stroke="#fef3c7" strokeWidth="2.5" strokeDasharray="8 9" />
            <ellipse cx="210" cy="145" rx="118" ry="32" fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="5 7" />
            <path d="M 80 145 C 136 112, 272 112, 340 145" stroke="#facc15" strokeWidth="3" fill="none" opacity="0.56" />
            <text x="210" y="226" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Rotation flattens the cloud into a protoplanetary disk
            </text>
          </g>
        ) : null}

        {showSun ? (
          <g>
            <circle cx="210" cy="145" r="30" fill="url(#solarFormationSun)" />
            <circle cx="210" cy="145" r="45" fill="none" stroke="#fde68a" opacity="0.22" />
            <text x="210" y="149" textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="900">
              SUN
            </text>
            <text x="210" y="258" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="900">
              Most mass concentrates at the center before planets finalize
            </text>
          </g>
        ) : null}

        {showAccretion ? (
          <g>
            {[130, 150, 270, 292].map((x, index) => (
              <g key={x}>
                <circle cx={x} cy={index % 2 === 0 ? 116 : 176} r={7 + index} fill="#d1d5db" />
                <circle cx={x + 10} cy={index % 2 === 0 ? 122 : 170} r="4" fill="#94a3b8" />
                <path
                  d={`M ${x - 20} ${index % 2 === 0 ? 116 : 176} C ${x - 8} ${index % 2 === 0 ? 106 : 186}, ${x + 2} ${index % 2 === 0 ? 106 : 186}, ${x + 14} ${index % 2 === 0 ? 116 : 176}`}
                  stroke="#e5e7eb"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>
            ))}
            <text x="210" y="70" textAnchor="middle" fill="#e5e7eb" fontSize="11" fontWeight="900">
              Dust to planetesimals to protoplanets
            </text>
          </g>
        ) : null}

        {showSorting ? (
          <g>
            <line x1="270" y1="72" x2="270" y2="218" stroke="#38bdf8" strokeWidth="2" strokeDasharray="7 7" />
            <text x="270" y="64" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              frost line
            </text>
            {rockyPlanets.map((planet) => (
              <g key={planet.label}>
                <circle cx={planet.x} cy={planet.y} r={planet.r} fill="#fca5a5" />
                <text x={planet.x} y={planet.y + 24} textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="900">
                  {planet.label}
                </text>
              </g>
            ))}
            {gasPlanets.map((planet) => (
              <g key={planet.label}>
                <circle cx={planet.x} cy={planet.y} r={planet.r} fill="#93c5fd" />
                <text x={planet.x} y={planet.y + 28} textAnchor="middle" fill="#dbeafe" fontSize="8" fontWeight="900">
                  {planet.label}
                </text>
              </g>
            ))}
            <rect x="82" y="238" width="256" height="34" rx="9" fill="#0f5132" opacity="0.9" />
            <text x="210" y="259" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              Rocky inner planets, gas and ice-rich outer planets
            </text>
          </g>
        ) : null}

        {showLeftovers ? (
          <g>
            {[256, 262, 268, 274, 280, 286].map((x, index) => (
              <circle key={x} cx={x} cy={110 + (index % 3) * 16} r="3" fill="#fef3c7" opacity="0.9" />
            ))}
            <path d="M 354 74 C 392 114, 392 176, 348 220" stroke="#a7f3d0" strokeWidth="2" fill="none" strokeDasharray="7 7" />
            <circle cx="354" cy="74" r="6" fill="#a7f3d0" />
            <text x="288" y="104" fill="#fef3c7" fontSize="9" fontWeight="900">
              asteroid belt
            </text>
            <text x="328" y="62" fill="#d1fae5" fontSize="9" fontWeight="900">
              comet path
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="86" width="304" height="118" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="118" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="144" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">nebula to gravity to disk to accretion</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">heat sorting separates rocky and gas planets</text>
            <text x="210" y="180" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">leftovers explain asteroids and comets</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Source", "Gas and dust cloud supplies the material."],
          ["Mechanism", "Gravity and rotation create a disk."],
          ["Planet build", "Accretion grows planetesimals into planets."],
          ["Sorting", "Temperature separates rocky inner and gas outer planets."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SunStructurePreview({ frameIndex }: { frameIndex: number }) {
  const showRadiative = frameIndex >= 1;
  const showConvection = frameIndex >= 2;
  const showPhotosphere = frameIndex >= 3;
  const showSolarWind = frameIndex >= 4;
  const showRisk = frameIndex >= 5;
  const showProof = frameIndex >= 6;
  const energyPackets = [
    { x: 188, y: 128 },
    { x: 218, y: 118 },
    { x: 236, y: 152 },
    { x: 174, y: 162 },
    { x: 210, y: 180 },
  ];
  const convectionCells = [
    { x: 172, y: 94 },
    { x: 244, y: 98 },
    { x: 260, y: 190 },
    { x: 156, y: 188 },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#170f08] via-[#46210d] to-[#07111f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="sun-structure-energy-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Core fusion creates energy
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Energy moves outward
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Solar wind affects Earth
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Sun structure and solar energy core to Earth preview">
        <defs>
          <radialGradient id="sunCoreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="34%" stopColor="#fde047" />
            <stop offset="67%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>
          <radialGradient id="earthMagnetosphere" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.06" />
          </radialGradient>
        </defs>

        <circle cx="198" cy="150" r="112" fill="#7c2d12" opacity="0.45" />
        <circle cx="198" cy="150" r="96" fill="#f97316" opacity="0.62" />
        <circle cx="198" cy="150" r="70" fill="#fb923c" opacity="0.78" />
        <circle cx="198" cy="150" r="36" fill="url(#sunCoreGradient)" />
        <text x="198" y="154" textAnchor="middle" fill="#7c2d12" fontSize="10" fontWeight="900">
          CORE
        </text>

        <circle cx="198" cy="150" r="36" fill="none" stroke="#fff7ed" strokeWidth="3" opacity="0.8" />
        <text x="198" y="54" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
          Nuclear fusion in the core produces solar energy
        </text>

        {showRadiative ? (
          <g>
            {energyPackets.map((packet, index) => (
              <path
                key={`${packet.x}-${packet.y}`}
                d={`M 198 150 L ${packet.x - 12} ${packet.y + 8} L ${packet.x + 10} ${packet.y - 6} L ${packet.x + 22} ${packet.y + 12}`}
                stroke="#fef3c7"
                strokeWidth="2"
                fill="none"
                opacity={0.62 + index * 0.07}
              />
            ))}
            <circle cx="198" cy="150" r="70" fill="none" stroke="#fde68a" strokeDasharray="6 6" strokeWidth="3" />
            <text x="92" y="112" fill="#fde68a" fontSize="10" fontWeight="900">
              radiative zone
            </text>
            <text x="198" y="276" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Energy zigzags outward by absorption and re-emission
            </text>
          </g>
        ) : null}

        {showConvection ? (
          <g>
            {convectionCells.map((cell, index) => (
              <path
                key={`${cell.x}-${cell.y}`}
                d={`M ${cell.x - 18} ${cell.y + 10} C ${cell.x - 10} ${cell.y - 20}, ${cell.x + 22} ${cell.y - 20}, ${cell.x + 18} ${cell.y + 10} C ${cell.x + 8} ${cell.y + 28}, ${cell.x - 12} ${cell.y + 28}, ${cell.x - 18} ${cell.y + 10}`}
                stroke={index % 2 === 0 ? "#fed7aa" : "#fdba74"}
                strokeWidth="2"
                fill="none"
                opacity="0.84"
              />
            ))}
            <circle cx="198" cy="150" r="96" fill="none" stroke="#fed7aa" strokeDasharray="4 8" strokeWidth="3" />
            <text x="278" y="114" fill="#fed7aa" fontSize="10" fontWeight="900">
              convection zone
            </text>
            <text x="198" y="294" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="900">
              Hot plasma rises; cooler plasma sinks
            </text>
          </g>
        ) : null}

        {showPhotosphere ? (
          <g>
            <circle cx="198" cy="150" r="112" fill="none" stroke="#fff7ed" strokeWidth="4" />
            <circle cx="198" cy="150" r="126" fill="none" stroke="#fbbf24" strokeDasharray="9 10" strokeWidth="2" opacity="0.72" />
            <text x="198" y="26" textAnchor="middle" fill="#fff7ed" fontSize="11" fontWeight="900">
              photosphere = visible surface; corona = outer solar atmosphere
            </text>
          </g>
        ) : null}

        {showSolarWind ? (
          <g>
            {[104, 126, 148, 170, 192].map((y, index) => (
              <path
                key={y}
                d={`M 284 ${y} C 324 ${y - 18 + index * 4}, 336 ${y + 18 - index * 3}, 370 ${y}`}
                stroke="#fde68a"
                strokeWidth={index === 2 ? 3 : 2}
                fill="none"
                opacity="0.72"
              />
            ))}
            <ellipse cx="372" cy="150" rx="34" ry="58" fill="url(#earthMagnetosphere)" />
            <circle cx="372" cy="150" r="18" fill="#2563eb" />
            <path d="M 362 136 C 382 138, 388 158, 366 164" stroke="#93c5fd" strokeWidth="3" fill="none" opacity="0.9" />
            <path d="M 358 112 C 372 102, 390 110, 396 124" stroke="#22c55e" strokeWidth="3" fill="none" />
            <path d="M 356 188 C 372 198, 388 188, 396 176" stroke="#22c55e" strokeWidth="3" fill="none" />
            <text x="372" y="78" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              magnetosphere guides particles
            </text>
            <text x="372" y="234" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              aurora near polar regions
            </text>
          </g>
        ) : null}

        {showRisk ? (
          <g>
            <path d="M 254 82 C 290 62, 326 78, 350 112" stroke="#fecaca" strokeWidth="4" fill="none" opacity="0.9" />
            <path d="M 266 70 L 282 88 L 258 94 Z" fill="#ef4444" />
            <rect x="288" y="238" width="96" height="42" rx="8" fill="#7f1d1d" opacity="0.92" />
            <text x="336" y="256" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              satellite risk
            </text>
            <text x="336" y="272" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              GPS and communication
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="52" y="82" width="300" height="126" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="202" y="114" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="202" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">core fusion to energy transfer to photosphere</text>
            <text x="202" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">solar wind to magnetosphere to aurora</text>
            <text x="202" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">space weather affects satellites, GPS, communication, power</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Source", "Core fusion creates solar energy."],
          ["Transfer", "Radiative and convective zones move energy outward."],
          ["Visible layer", "Photosphere is the visible surface."],
          ["Earth link", "Solar wind connects Sun to aurora and technology risk."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarLifeCyclePreview({ frameIndex }: { frameIndex: number }) {
  const showProtostar = frameIndex >= 1;
  const showMainSequence = frameIndex >= 2;
  const showLowMassPath = frameIndex >= 3;
  const showMassivePath = frameIndex >= 4;
  const showRemnants = frameIndex >= 5;
  const showProof = frameIndex >= 6;
  const nebulaParticles = Array.from({ length: 44 }).map((_, index) => ({
    x: 44 + ((index * 47 + frameIndex * 11) % 330),
    y: 54 + ((index * 31 + frameIndex * 7) % 170),
    size: 1.4 + (index % 5),
  }));

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#090a1f] via-[#1f2556] to-[#07111f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="star-life-cycle-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Mass decides final path
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Main sequence burns hydrogen
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Not every star becomes black hole
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Life cycle of stars mass branch preview">
        <defs>
          <radialGradient id="starNebula" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
          </radialGradient>
          <radialGradient id="mainSequenceStar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="55%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>
          <radialGradient id="redGiantStar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fee2e2" />
            <stop offset="58%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
        </defs>

        <ellipse cx="210" cy="142" rx="170" ry="90" fill="url(#starNebula)" />
        {nebulaParticles.map((particle, index) => (
          <circle
            key={`${particle.x}-${particle.y}-${index}`}
            cx={showProtostar ? 210 + (particle.x - 210) * 0.68 : particle.x}
            cy={showProtostar ? 142 + (particle.y - 142) * 0.56 : particle.y}
            r={particle.size}
            fill={index % 4 === 0 ? "#fde68a" : index % 3 === 0 ? "#c4b5fd" : "#93c5fd"}
            opacity={0.28 + (index % 5) * 0.1}
          />
        ))}
        <text x="210" y="42" textAnchor="middle" fill="#ddd6fe" fontSize="11" fontWeight="900">
          Gravity gathers gas and dust inside a stellar nebula
        </text>

        {showProtostar ? (
          <g>
            <circle cx="116" cy="142" r="22" fill="#fed7aa" opacity="0.95" />
            <circle cx="116" cy="142" r="36" fill="none" stroke="#fef3c7" strokeDasharray="5 7" opacity="0.64" />
            <path d="M 66 142 C 82 116, 108 108, 136 120 C 154 128, 152 158, 126 166 C 96 176, 74 166, 66 142" stroke="#fed7aa" strokeWidth="2" fill="none" opacity="0.7" />
            <text x="116" y="190" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              protostar heats up
            </text>
          </g>
        ) : null}

        {showMainSequence ? (
          <g>
            <line x1="142" y1="142" x2="196" y2="142" stroke="#dbeafe" strokeWidth="2" strokeDasharray="7 7" />
            <circle cx="220" cy="142" r="30" fill="url(#mainSequenceStar)" />
            <circle cx="220" cy="142" r="44" fill="none" stroke="#fde68a" opacity="0.26" />
            <text x="220" y="146" textAnchor="middle" fill="#713f12" fontSize="9" fontWeight="900">
              H fusion
            </text>
            <text x="220" y="192" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              main sequence: fusion balances gravity
            </text>
          </g>
        ) : null}

        {showLowMassPath ? (
          <g>
            <path d="M 250 132 C 282 92, 312 82, 348 82" stroke="#bbf7d0" strokeWidth="3" fill="none" strokeDasharray="8 7" />
            <text x="304" y="60" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              low and medium mass path
            </text>
            <circle cx="306" cy="96" r="22" fill="url(#redGiantStar)" />
            <text x="306" y="130" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="900">
              red giant
            </text>
            <ellipse cx="356" cy="96" rx="24" ry="16" fill="#a7f3d0" opacity="0.34" />
            <circle cx="356" cy="96" r="5" fill="#e0f2fe" />
            <text x="356" y="132" textAnchor="middle" fill="#d1fae5" fontSize="9" fontWeight="900">
              planetary nebula
            </text>
            <text x="356" y="146" textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="900">
              white dwarf
            </text>
          </g>
        ) : null}

        {showMassivePath ? (
          <g>
            <path d="M 250 154 C 284 204, 314 226, 350 226" stroke="#fecaca" strokeWidth="3" fill="none" strokeDasharray="8 7" />
            <text x="304" y="248" textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">
              massive star path
            </text>
            <circle cx="306" cy="210" r="28" fill="url(#redGiantStar)" />
            <text x="306" y="198" textAnchor="middle" fill="#fee2e2" fontSize="8" fontWeight="900">
              red
            </text>
            <text x="306" y="212" textAnchor="middle" fill="#fee2e2" fontSize="8" fontWeight="900">
              supergiant
            </text>
            <g>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((ray) => {
                const angle = (ray / 8) * Math.PI * 2;
                return (
                  <line
                    key={ray}
                    x1={356}
                    y1={210}
                    x2={356 + Math.cos(angle) * 30}
                    y2={210 + Math.sin(angle) * 30}
                    stroke="#fef3c7"
                    strokeWidth="2"
                    opacity="0.82"
                  />
                );
              })}
              <circle cx="356" cy="210" r="14" fill="#f97316" />
              <text x="356" y="254" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
                supernova
              </text>
            </g>
          </g>
        ) : null}

        {showRemnants ? (
          <g>
            <line x1="356" y1="210" x2="386" y2="182" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="5 6" />
            <line x1="356" y1="210" x2="386" y2="236" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="5 6" />
            <circle cx="386" cy="182" r="8" fill="#dbeafe" />
            <circle cx="386" cy="236" r="11" fill="#020617" stroke="#a855f7" strokeWidth="3" />
            <circle cx="386" cy="236" r="22" fill="none" stroke="#a855f7" strokeDasharray="4 6" opacity="0.55" />
            <text x="386" y="166" textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="900">
              neutron star
            </text>
            <text x="386" y="270" textAnchor="middle" fill="#e9d5ff" fontSize="9" fontWeight="900">
              black hole
            </text>
            <rect x="54" y="250" width="220" height="34" rx="9" fill="#0f5132" opacity="0.9" />
            <text x="164" y="271" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              final remnant depends on remaining core mass
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="78" width="304" height="126" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="110" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="136" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">nebula to protostar to main sequence</text>
            <text x="210" y="154" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">mass decides the ending path</text>
            <text x="210" y="172" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">black hole needs massive-star collapse</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Birth", "Nebula collapses into a protostar."],
          ["Stable phase", "Main sequence burns hydrogen in the core."],
          ["Branch", "Low and massive stars diverge after fuel changes."],
          ["Trap control", "Black hole is not the ending of every star."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalaxyFormationPreview({ frameIndex }: { frameIndex: number }) {
  const showCollapse = frameIndex >= 1;
  const showDisk = frameIndex >= 2;
  const showStars = frameIndex >= 3;
  const showArms = frameIndex >= 4;
  const showMilkyWayLocation = frameIndex >= 5;
  const showProof = frameIndex >= 6;
  const matterClouds = Array.from({ length: 52 }).map((_, index) => ({
    x: 48 + ((index * 37 + frameIndex * 9) % 326),
    y: 52 + ((index * 29 + frameIndex * 6) % 180),
    size: 1.2 + (index % 4),
  }));
  const starKnots = [
    { x: 164, y: 118 },
    { x: 244, y: 112 },
    { x: 284, y: 160 },
    { x: 190, y: 190 },
    { x: 126, y: 154 },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#080b19] via-[#172554] to-[#07111f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="galaxy-formation-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Gravity gathers matter
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Rotation creates structure
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Solar System is inside Milky Way
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Galaxy formation gravity rotation spiral arms preview">
        <defs>
          <radialGradient id="galaxyBulge" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="48%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.12" />
          </radialGradient>
          <radialGradient id="galaxyCloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.04" />
          </radialGradient>
        </defs>

        <ellipse cx="210" cy="148" rx={showCollapse ? 152 : 184} ry={showCollapse ? 72 : 104} fill="url(#galaxyCloud)" />
        {matterClouds.map((particle, index) => (
          <circle
            key={`${particle.x}-${particle.y}-${index}`}
            cx={showCollapse ? 210 + (particle.x - 210) * 0.72 : particle.x}
            cy={showCollapse ? 148 + (particle.y - 148) * 0.58 : particle.y}
            r={particle.size}
            fill={index % 6 === 0 ? "#fde68a" : index % 3 === 0 ? "#c4b5fd" : "#93c5fd"}
            opacity={0.26 + (index % 5) * 0.11}
          />
        ))}
        <text x="210" y="38" textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="900">
          Matter clouds and tiny density differences become structure
        </text>

        {showCollapse ? (
          <g>
            {[54, 92, 326, 366].map((x, index) => (
              <path
                key={x}
                d={`M ${x} ${index % 2 === 0 ? 78 : 218} C ${118 + index * 20} ${index % 2 === 0 ? 112 : 184}, 166 148, 210 148`}
                stroke="#bfdbfe"
                strokeWidth="2"
                fill="none"
                opacity="0.72"
                strokeDasharray="7 7"
              />
            ))}
            <text x="210" y="280" textAnchor="middle" fill="#bfdbfe" fontSize="11" fontWeight="900">
              Gravity amplifies uneven matter into denser clumps
            </text>
          </g>
        ) : null}

        {showDisk ? (
          <g>
            <ellipse cx="210" cy="148" rx="144" ry="48" fill="#1e3a8a" opacity="0.28" />
            <ellipse cx="210" cy="148" rx="120" ry="34" fill="none" stroke="#dbeafe" strokeWidth="2" strokeDasharray="7 8" />
            <circle cx="210" cy="148" r="26" fill="url(#galaxyBulge)" />
            <path d="M 82 148 C 126 104, 202 116, 210 148 C 218 180, 300 192, 340 148" stroke="#fde68a" strokeWidth="3" fill="none" opacity="0.6" />
            <text x="210" y="236" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="900">
              Rotation flattens matter into a disk with central bulge
            </text>
          </g>
        ) : null}

        {showStars ? (
          <g>
            {starKnots.map((star, index) => (
              <g key={`${star.x}-${star.y}`}>
                <circle cx={star.x} cy={star.y} r={6 + (index % 3)} fill="#fef3c7" />
                <circle cx={star.x} cy={star.y} r={13 + index} fill="#fef3c7" opacity="0.12" />
              </g>
            ))}
            <text x="210" y="62" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Dense gas regions ignite new stars
            </text>
          </g>
        ) : null}

        {showArms ? (
          <g>
            {[0, 1, 2, 3].map((arm) => {
              const rotate = arm * 90;
              return (
                <path
                  key={arm}
                  d="M 210 148 C 244 118, 300 104, 346 126 C 318 142, 278 154, 232 170"
                  stroke={arm % 2 === 0 ? "#93c5fd" : "#c4b5fd"}
                  strokeWidth="5"
                  fill="none"
                  opacity="0.72"
                  transform={`rotate(${rotate} 210 148)`}
                />
              );
            })}
            <text x="210" y="260" textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="900">
              Spiral arms concentrate gas, dust, and young stars
            </text>
          </g>
        ) : null}

        {showMilkyWayLocation ? (
          <g>
            <circle cx="278" cy="122" r="7" fill="#22c55e" />
            <circle cx="278" cy="122" r="15" fill="none" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="4 5" />
            <path d="M 278 122 L 342 76" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="5 5" />
            <rect x="270" y="52" width="122" height="42" rx="8" fill="#064e3b" opacity="0.94" />
            <text x="331" y="69" textAnchor="middle" fill="#d1fae5" fontSize="9" fontWeight="900">
              Solar System
            </text>
            <text x="331" y="84" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              inside Milky Way arm
            </text>
            <rect x="52" y="242" width="194" height="34" rx="9" fill="#7f1d1d" opacity="0.9" />
            <text x="149" y="263" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              Do not mix Solar System, galaxy, universe
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="82" width="304" height="122" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">density difference to gravity to rotating disk</text>
            <text x="210" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">stars form inside gas-rich spiral structure</text>
            <text x="210" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">Solar System sits inside the Milky Way, not at its center</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Start", "Tiny density differences create matter clumps."],
          ["Mechanism", "Gravity and rotation organize the galaxy."],
          ["Structure", "Spiral arms hold gas, dust, and young stars."],
          ["Scale", "Solar System is inside one galaxy, not the whole universe."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarthRotationRevolutionPreview({ frameIndex }: { frameIndex: number }) {
  const showRotation = frameIndex >= 1;
  const showAxis = frameIndex >= 2;
  const showRevolution = frameIndex >= 3;
  const showSeasonNodes = frameIndex >= 4;
  const showSunlightAngle = frameIndex >= 5;
  const showTrap = frameIndex >= 6;
  const showProof = frameIndex >= 7;
  const orbitProgress = Math.min(Math.max((frameIndex - 3) / 3, 0), 1);
  const earthX = 212 + Math.cos(orbitProgress * Math.PI * 1.6) * 128;
  const earthY = 150 + Math.sin(orbitProgress * Math.PI * 1.6) * 68;
  const rotationBands = [-16, 0, 16];
  const seasonNodes = [
    { label: "June solstice", x: 84, y: 150 },
    { label: "Sept equinox", x: 212, y: 82 },
    { label: "Dec solstice", x: 340, y: 150 },
    { label: "Mar equinox", x: 212, y: 218 },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#153829] to-[#09111f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="earth-rotation-revolution-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Rotation creates day-night
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Revolution creates year
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Tilt plus sunlight angle creates seasons
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Earth rotation and revolution mechanism preview">
        <defs>
          <radialGradient id="earthMotionSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="62%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
          </radialGradient>
          <clipPath id="earthMotionClip">
            <circle cx={earthX} cy={earthY} r="24" />
          </clipPath>
          <marker id="earthMotionArrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#bfdbfe" />
          </marker>
        </defs>

        {Array.from({ length: 28 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 43) % 410}
            cy={(index * 29) % 90}
            r={index % 4 === 0 ? 1.6 : 1}
            fill="#dbeafe"
            opacity={0.18 + (index % 5) * 0.08}
          />
        ))}

        <circle cx="212" cy="150" r="34" fill="url(#earthMotionSun)" />
        <circle cx="212" cy="150" r="48" fill="none" stroke="#fde68a" opacity="0.22" />
        <text x="212" y="154" textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="900">
          SUN
        </text>

        {showRevolution ? (
          <g>
            <ellipse cx="212" cy="150" rx="128" ry="68" fill="none" stroke="#d1fae5" strokeWidth="2" strokeDasharray="7 8" />
            <text x="212" y="244" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              Revolution around the Sun creates the year
            </text>
          </g>
        ) : null}

        {showSeasonNodes ? (
          <g>
            {seasonNodes.map((node, index) => (
              <g key={node.label}>
                <circle cx={node.x} cy={node.y} r="9" fill={index % 2 === 0 ? "#fef3c7" : "#bbf7d0"} opacity="0.82" />
                <line x1={node.x - 5} y1={node.y + 15} x2={node.x + 5} y2={node.y - 15} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <text x={node.x} y={node.y + (node.y < 120 ? -18 : 30)} textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="900">
                  {node.label}
                </text>
              </g>
            ))}
            <text x="212" y="64" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Axis stays oriented while Earth revolves
            </text>
          </g>
        ) : null}

        {[102, 124, 146, 168, 190].map((y, index) => (
          <line
            key={y}
            x1="44"
            y1={y}
            x2={earthX - 30}
            y2={earthY + (y - 146) * 0.24}
            stroke="#fde68a"
            strokeWidth={index === 2 ? 3 : 2}
            opacity={0.36 + index * 0.08}
          />
        ))}

        <circle cx={earthX} cy={earthY} r="24" fill="#2dd4bf" />
        <rect x={earthX} y={earthY - 24} width="24" height="48" fill="#0f172a" opacity="0.5" clipPath="url(#earthMotionClip)" />
        <path
          d={`M ${earthX - 10} ${earthY - 20} C ${earthX + 8} ${earthY - 14}, ${earthX + 12} ${earthY + 9}, ${earthX - 6} ${earthY + 20}`}
          stroke="#134e4a"
          strokeWidth="3"
          fill="none"
          opacity="0.72"
        />
        <text x={earthX} y={earthY + 42} textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
          day-night line
        </text>

        {showRotation ? (
          <g>
            {rotationBands.map((offset, index) => (
              <path
                key={offset}
                d={`M ${earthX - 19} ${earthY + offset} C ${earthX - 6} ${earthY + offset - 8}, ${earthX + 8} ${earthY + offset - 8}, ${earthX + 19} ${earthY + offset}`}
                stroke="#e0f2fe"
                strokeWidth="1.6"
                fill="none"
                opacity={0.72 - index * 0.1}
              />
            ))}
            <path d={`M ${earthX - 36} ${earthY - 34} C ${earthX - 18} ${earthY - 54}, ${earthX + 28} ${earthY - 52}, ${earthX + 40} ${earthY - 28}`} stroke="#bfdbfe" strokeWidth="2" fill="none" markerEnd="url(#earthMotionArrowhead)" />
            <text x="82" y="276" fill="#bfdbfe" fontSize="11" fontWeight="900">
              Rotation moves places through day and night
            </text>
          </g>
        ) : null}

        {showAxis ? (
          <g>
            <line x1={earthX - 11} y1={earthY + 33} x2={earthX + 11} y2={earthY - 33} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d={`M ${earthX + 16} ${earthY - 25} A 30 30 0 0 1 ${earthX + 25} ${earthY + 5}`} stroke="#fef3c7" strokeWidth="2" fill="none" />
            <text x={earthX + 30} y={earthY - 18} fill="#fef3c7" fontSize="9" fontWeight="900">
              23.5 deg axis
            </text>
          </g>
        ) : null}

        {showSunlightAngle ? (
          <g>
            <line x1={earthX - 5} y1={earthY - 22} x2={earthX + 34} y2={earthY - 42} stroke="#fef3c7" strokeWidth="3" />
            <line x1={earthX - 14} y1={earthY + 14} x2={earthX + 34} y2={earthY + 34} stroke="#fed7aa" strokeWidth="2" />
            <rect x="64" y="78" width="174" height="42" rx="8" fill="#0f5132" opacity="0.92" />
            <text x="151" y="95" textAnchor="middle" fill="#d1fae5" fontSize="9" fontWeight="900">
              Direct rays concentrate heat
            </text>
            <text x="151" y="110" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              slant rays spread energy
            </text>
            <text x="272" y="278" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="900">
              sunlight angle and day length control seasonal heating
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="64" y="214" width="292" height="54" rx="10" fill="#7f1d1d" opacity="0.94" />
            <text x="210" y="235" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: seasons are not mainly Earth-Sun distance
            </text>
            <text x="210" y="253" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              Correct chain: tilt plus revolution plus sunlight angle plus day length
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="82" width="304" height="126" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">rotation creates day-night</text>
            <text x="210" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">revolution creates year</text>
            <text x="210" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">tilt plus sunlight angle and day length create seasons</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Rotation", "Daily spin creates day and night."],
          ["Axis", "Tilt stays oriented during revolution."],
          ["Revolution", "Annual orbit creates the year."],
          ["Seasons", "Tilt changes sunlight angle and day length."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatitudeLongitudeTimePreview({ frameIndex }: { frameIndex: number }) {
  const showLatitude = frameIndex >= 1;
  const showLongitude = frameIndex >= 2;
  const showCoordinate = frameIndex >= 3;
  const showLocalTime = frameIndex >= 4;
  const showIst = frameIndex >= 5;
  const showIdl = frameIndex >= 6;
  const showProof = frameIndex >= 7;
  const globe = { x: 174, y: 150, r: 78 };
  const meridians = [-54, -27, 0, 27, 54];
  const parallels = [-48, -24, 0, 24, 48];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#12344c] to-[#0b1f18] p-4 text-white shadow-inner"
    >
      <div
        data-testid="latitude-longitude-time-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Latitude locates north-south
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Longitude locates east-west
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          15 deg longitude = 1 hour
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Latitude longitude and time mechanism preview">
        <defs>
          <radialGradient id="coordinateGlobe" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="55%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f766e" />
          </radialGradient>
          <clipPath id="coordinateGlobeClip">
            <circle cx={globe.x} cy={globe.y} r={globe.r} />
          </clipPath>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 47) % 410}
            cy={(index * 23) % 86}
            r={index % 4 === 0 ? 1.6 : 1}
            fill="#dbeafe"
            opacity={0.18 + (index % 5) * 0.08}
          />
        ))}

        <circle cx={globe.x} cy={globe.y} r={globe.r} fill="url(#coordinateGlobe)" />
        <path d={`M ${globe.x - 64} ${globe.y - 18} C ${globe.x - 20} ${globe.y - 46}, ${globe.x + 38} ${globe.y - 38}, ${globe.x + 64} ${globe.y - 4}`} stroke="#134e4a" strokeWidth="5" fill="none" opacity="0.55" />
        <path d={`M ${globe.x - 50} ${globe.y + 26} C ${globe.x - 8} ${globe.y + 4}, ${globe.x + 32} ${globe.y + 26}, ${globe.x + 54} ${globe.y + 50}`} stroke="#134e4a" strokeWidth="5" fill="none" opacity="0.48" />

        {showLatitude ? (
          <g clipPath="url(#coordinateGlobeClip)">
            {parallels.map((offset) => (
              <ellipse
                key={offset}
                cx={globe.x}
                cy={globe.y + offset}
                rx={Math.max(28, globe.r - Math.abs(offset) * 0.58)}
                ry="8"
                fill="none"
                stroke={offset === 0 ? "#fef3c7" : "#d1fae5"}
                strokeWidth={offset === 0 ? 3 : 1.8}
                opacity="0.82"
              />
            ))}
          </g>
        ) : null}

        {showLongitude ? (
          <g clipPath="url(#coordinateGlobeClip)">
            {meridians.map((offset) => (
              <ellipse
                key={offset}
                cx={globe.x + offset}
                cy={globe.y}
                rx="12"
                ry={globe.r}
                fill="none"
                stroke={offset === 0 ? "#fef3c7" : "#bfdbfe"}
                strokeWidth={offset === 0 ? 3 : 1.6}
                opacity="0.78"
              />
            ))}
          </g>
        ) : null}

        {showLatitude ? (
          <g>
            <line x1={globe.x - globe.r - 18} y1={globe.y} x2={globe.x + globe.r + 18} y2={globe.y} stroke="#fef3c7" strokeWidth="2" strokeDasharray="6 7" />
            <text x={globe.x} y={globe.y + 96} textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Equator is 0 latitude
            </text>
            <text x="72" y="78" fill="#d1fae5" fontSize="10" fontWeight="900">
              Parallels measure north-south position
            </text>
          </g>
        ) : null}

        {showLongitude ? (
          <g>
            <line x1={globe.x} y1={globe.y - globe.r - 16} x2={globe.x} y2={globe.y + globe.r + 16} stroke="#fef3c7" strokeWidth="2" strokeDasharray="6 7" />
            <text x={globe.x + 92} y={globe.y - 72} fill="#fef3c7" fontSize="10" fontWeight="900">
              Prime Meridian is 0 longitude
            </text>
            <text x={globe.x + 104} y={globe.y - 52} fill="#bfdbfe" fontSize="10" fontWeight="900">
              Meridians measure east-west position
            </text>
          </g>
        ) : null}

        {showCoordinate ? (
          <g>
            <circle cx={globe.x + 33} cy={globe.y - 22} r="7" fill="#22c55e" />
            <circle cx={globe.x + 33} cy={globe.y - 22} r="15" fill="none" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="4 5" />
            <path d={`M ${globe.x + 33} ${globe.y - 22} L 308 84`} stroke="#bbf7d0" strokeWidth="2" strokeDasharray="5 5" />
            <rect x="270" y="56" width="120" height="44" rx="8" fill="#064e3b" opacity="0.94" />
            <text x="330" y="74" textAnchor="middle" fill="#d1fae5" fontSize="9" fontWeight="900">
              coordinate fix
            </text>
            <text x="330" y="89" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              latitude plus longitude
            </text>
          </g>
        ) : null}

        {showLocalTime ? (
          <g>
            {[0, 1, 2, 3, 4].map((band) => (
              <rect
                key={band}
                x={270 + band * 22}
                y="126"
                width="18"
                height="72"
                rx="4"
                fill={band === 2 ? "#fef3c7" : "#1d4ed8"}
                opacity={band === 2 ? 0.92 : 0.45}
              />
            ))}
            <text x="324" y="118" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
              360 deg / 24 hours = 15 deg per hour
            </text>
            <text x="324" y="216" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              East is ahead; west is behind
            </text>
          </g>
        ) : null}

        {showIst ? (
          <g>
            <rect x="62" y="242" width="154" height="48" rx="9" fill="#0f5132" opacity="0.92" />
            <text x="139" y="262" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              IST standard meridian
            </text>
            <text x="139" y="278" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
              82.5E = UTC plus 5:30
            </text>
            <line x1={globe.x + 44} y1={globe.y - 66} x2={globe.x + 44} y2={globe.y + 66} stroke="#22c55e" strokeWidth="3" strokeDasharray="5 6" />
            <text x={globe.x + 54} y={globe.y + 72} fill="#bbf7d0" fontSize="9" fontWeight="900">
              82.5E
            </text>
          </g>
        ) : null}

        {showIdl ? (
          <g>
            <line x1="354" y1="62" x2="354" y2="274" stroke="#fca5a5" strokeWidth="3" strokeDasharray="7 7" />
            <rect x="272" y="234" width="130" height="50" rx="9" fill="#7f1d1d" opacity="0.92" />
            <text x="337" y="253" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              180 line changes date
            </text>
            <text x="337" y="270" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              Prime Meridian is not IDL
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="82" width="304" height="126" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">latitude gives north-south position</text>
            <text x="210" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">longitude gives east-west position and time</text>
            <text x="210" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">IST uses 82.5E, UTC plus 5 hours 30 minutes</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Latitude", "North-south position from the Equator."],
          ["Longitude", "East-west position from Prime Meridian."],
          ["Time", "15 deg longitude equals one hour."],
          ["India", "IST uses 82.5E as standard meridian."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatZonesPreview({ frameIndex }: { frameIndex: number }) {
  const showSunAngle = frameIndex >= 1;
  const showTorrid = frameIndex >= 2;
  const showTemperate = frameIndex >= 3;
  const showFrigid = frameIndex >= 4;
  const showEnergySpread = frameIndex >= 5;
  const showTrap = frameIndex >= 6;
  const showProof = frameIndex >= 7;
  const globe = { x: 190, y: 150, r: 82 };
  const boundaryLines = [
    { label: "Arctic Circle", y: -54, color: "#bfdbfe" },
    { label: "Tropic of Cancer", y: -26, color: "#fef3c7" },
    { label: "Equator", y: 0, color: "#fde68a" },
    { label: "Tropic of Capricorn", y: 26, color: "#fef3c7" },
    { label: "Antarctic Circle", y: 54, color: "#bfdbfe" },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#183a2e] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="heat-zones-earth-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Torrid Zone gets direct rays
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Temperate Zones get slant rays
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Frigid Zones get very oblique rays
        </span>
      </div>

      <svg viewBox="0 0 420 320" className="relative z-10 h-[318px] w-full" role="img" aria-label="Heat zones of Earth sunlight angle preview">
        <defs>
          <radialGradient id="heatZonesGlobe" cx="38%" cy="34%" r="68%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="48%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#134e4a" />
          </radialGradient>
          <clipPath id="heatZonesGlobeClip">
            <circle cx={globe.x} cy={globe.y} r={globe.r} />
          </clipPath>
        </defs>

        {Array.from({ length: 28 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 41) % 410}
            cy={(index * 31) % 86}
            r={index % 4 === 0 ? 1.6 : 1}
            fill="#dbeafe"
            opacity={0.16 + (index % 5) * 0.08}
          />
        ))}

        <circle cx="52" cy="150" r="34" fill="#facc15" />
        <circle cx="52" cy="150" r="48" fill="none" stroke="#fde68a" opacity="0.2" />
        <text x="52" y="154" textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="900">
          SUN
        </text>

        {[92, 116, 140, 164, 188].map((y, index) => (
          <line
            key={y}
            x1="88"
            y1={y}
            x2={globe.x - globe.r + 6}
            y2={y}
            stroke="#fde68a"
            strokeWidth={index === 2 ? 3 : 2}
            opacity={0.36 + index * 0.08}
          />
        ))}

        <circle cx={globe.x} cy={globe.y} r={globe.r} fill="url(#heatZonesGlobe)" />

        {showTorrid ? (
          <rect
            x={globe.x - globe.r}
            y={globe.y - 26}
            width={globe.r * 2}
            height="52"
            fill="#f97316"
            opacity="0.42"
            clipPath="url(#heatZonesGlobeClip)"
          />
        ) : null}
        {showTemperate ? (
          <g clipPath="url(#heatZonesGlobeClip)">
            <rect x={globe.x - globe.r} y={globe.y - 54} width={globe.r * 2} height="28" fill="#facc15" opacity="0.28" />
            <rect x={globe.x - globe.r} y={globe.y + 26} width={globe.r * 2} height="28" fill="#facc15" opacity="0.28" />
          </g>
        ) : null}
        {showFrigid ? (
          <g clipPath="url(#heatZonesGlobeClip)">
            <rect x={globe.x - globe.r} y={globe.y - globe.r} width={globe.r * 2} height="28" fill="#bfdbfe" opacity="0.34" />
            <rect x={globe.x - globe.r} y={globe.y + 54} width={globe.r * 2} height="28" fill="#bfdbfe" opacity="0.34" />
          </g>
        ) : null}

        <g clipPath="url(#heatZonesGlobeClip)">
          {boundaryLines.map((line) => (
            <ellipse
              key={line.label}
              cx={globe.x}
              cy={globe.y + line.y}
              rx={Math.max(26, globe.r - Math.abs(line.y) * 0.55)}
              ry="7"
              fill="none"
              stroke={line.color}
              strokeWidth={line.y === 0 ? 3 : 1.7}
              opacity="0.88"
            />
          ))}
        </g>

        {boundaryLines.map((line, index) => (
          <text
            key={line.label}
            x={globe.x + globe.r + 14}
            y={globe.y + line.y + 4}
            fill={line.color}
            fontSize="8"
            fontWeight="900"
          >
            {index === 0 ? "Arctic Circle" : index === 1 ? "Tropic of Cancer" : index === 2 ? "Equator" : index === 3 ? "Tropic of Capricorn" : "Antarctic Circle"}
          </text>
        ))}

        {showSunAngle ? (
          <g>
            <line x1={globe.x - 52} y1={globe.y} x2={globe.x + 22} y2={globe.y} stroke="#fef3c7" strokeWidth="4" />
            <line x1={globe.x - 62} y1={globe.y - 52} x2={globe.x + 18} y2={globe.y - 70} stroke="#bfdbfe" strokeWidth="2" />
            <line x1={globe.x - 62} y1={globe.y + 52} x2={globe.x + 18} y2={globe.y + 70} stroke="#bfdbfe" strokeWidth="2" />
            <text x="72" y="248" fill="#fef3c7" fontSize="11" fontWeight="900">
              Sun angle changes energy concentration
            </text>
          </g>
        ) : null}

        {showTorrid ? (
          <text x={globe.x} y={globe.y + 4} textAnchor="middle" fill="#fff7ed" fontSize="11" fontWeight="900">
            Torrid Zone
          </text>
        ) : null}
        {showTemperate ? (
          <g>
            <text x={globe.x} y={globe.y - 36} textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="900">
              Temperate
            </text>
            <text x={globe.x} y={globe.y + 42} textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="900">
              Temperate
            </text>
          </g>
        ) : null}
        {showFrigid ? (
          <g>
            <text x={globe.x} y={globe.y - 66} textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="900">
              Frigid
            </text>
            <text x={globe.x} y={globe.y + 72} textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="900">
              Frigid
            </text>
          </g>
        ) : null}

        {showEnergySpread ? (
          <g>
            <rect x="58" y="260" width="304" height="38" rx="9" fill="#0f5132" opacity="0.92" />
            <text x="210" y="276" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Direct rays concentrate energy; slant rays spread energy over a larger area
            </text>
            <text x="210" y="291" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              This is the physical reason behind heat zones
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="62" y="68" width="292" height="54" rx="10" fill="#7f1d1d" opacity="0.94" />
            <text x="208" y="89" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: zone names are not enough
            </text>
            <text x="208" y="107" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              Link latitude to Sun angle and day length
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="58" y="82" width="304" height="126" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Torrid Zone receives direct rays</text>
            <text x="210" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Temperate Zones receive moderate slant rays</text>
            <text x="210" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">Frigid Zones receive very oblique rays and extreme day length</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Torrid", "Between Tropics; more direct rays."],
          ["Temperate", "Between Tropics and polar circles."],
          ["Frigid", "Poleward of polar circles."],
          ["Mechanism", "Sun angle and day length control heating."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoonEclipsePreview({ frameIndex }: { frameIndex: number }) {
  const earth = { x: 238, y: 146 };
  const orbitRx = 104;
  const orbitRy = frameIndex >= 5 ? 34 : 58;
  const phaseIndex = Math.min(Math.max(frameIndex - 2, 0), 7);
  const moonAngle = (phaseIndex / 8) * Math.PI * 2;
  const moonX = frameIndex === 3 ? 152 : frameIndex === 4 ? 342 : earth.x + Math.cos(moonAngle) * orbitRx;
  const moonY = frameIndex === 3 || frameIndex === 4 ? earth.y : earth.y + Math.sin(moonAngle) * orbitRy;
  const showPhaseRule = frameIndex >= 1;
  const showPhaseSequence = frameIndex >= 2;
  const showSolarEclipse = frameIndex === 3;
  const showLunarEclipse = frameIndex === 4;
  const showTilt = frameIndex >= 5;
  const showProof = frameIndex >= 6;
  const phaseSequence = [
    "New",
    "Crescent",
    "Quarter",
    "Gibbous",
    "Full",
    "Gibbous",
    "Quarter",
    "Crescent",
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#06121f] via-[#12344c] to-[#07111f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="moon-eclipse-alignment-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Phase = viewing angle
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Eclipse = alignment + shadow
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Orbit tilt prevents monthly eclipses
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Moon phases and eclipses mechanism preview">
        <defs>
          <radialGradient id="moonSunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
            <stop offset="64%" stopColor="#facc15" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="earthShadow" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {Array.from({ length: 34 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 37) % 410}
            cy={(index * 23) % 86}
            r={index % 4 === 0 ? 1.8 : 1}
            fill="#e0f2fe"
            opacity={0.18 + (index % 5) * 0.1}
          />
        ))}

        <circle cx="52" cy={earth.y} r="34" fill="url(#moonSunGlow)" />
        <circle cx="52" cy={earth.y} r="48" fill="none" stroke="#fde68a" opacity="0.18" />
        <text x="52" y={earth.y + 4} textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="900">
          SUN
        </text>
        {[96, 122, 148, 174].map((x, index) => (
          <line
            key={x}
            x1={x}
            y1={earth.y - 52 + index * 22}
            x2="386"
            y2={earth.y - 52 + index * 22}
            stroke="#fde68a"
            strokeWidth={index === 2 ? 3 : 2}
            opacity={0.38 + index * 0.08}
          />
        ))}

        <ellipse
          cx={earth.x}
          cy={earth.y}
          rx={orbitRx}
          ry={orbitRy}
          fill="none"
          stroke={showTilt ? "#bfdbfe" : "#e5e7eb"}
          strokeDasharray="7 8"
          strokeWidth="2"
          opacity="0.72"
          transform={showTilt ? `rotate(-8 ${earth.x} ${earth.y})` : undefined}
        />
        {showTilt ? (
          <g>
            <circle cx={earth.x - orbitRx} cy={earth.y - 14} r="5" fill="#fef3c7" />
            <circle cx={earth.x + orbitRx} cy={earth.y + 14} r="5" fill="#fef3c7" />
            <text x={earth.x - 112} y={earth.y - 26} fill="#fef3c7" fontSize="9" fontWeight="900">
              node
            </text>
            <text x={earth.x + 91} y={earth.y + 32} fill="#fef3c7" fontSize="9" fontWeight="900">
              node
            </text>
            <text x={earth.x} y="54" textAnchor="middle" fill="#dbeafe" fontSize="12" fontWeight="900">
              Moon orbit tilt explains why eclipses are not monthly
            </text>
          </g>
        ) : null}

        {showSolarEclipse ? (
          <g>
            <path d="M 166 138 L 247 146 L 166 154 Z" fill="#020617" opacity="0.9" />
            <path d="M 166 122 L 266 146 L 166 170 Z" fill="#020617" opacity="0.24" />
            <text x="214" y="129" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              Umbra
            </text>
            <text x="224" y="176" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              Penumbra
            </text>
            <text x="238" y="218" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">
              Solar eclipse: Moon between Sun and Earth
            </text>
          </g>
        ) : null}

        {showLunarEclipse ? (
          <g>
            <path d="M 266 128 L 386 104 L 386 188 L 266 164 Z" fill="url(#earthShadow)" opacity="0.9" />
            <path d="M 266 139 L 386 126 L 386 166 L 266 153 Z" fill="#020617" opacity="0.82" />
            <text x="326" y="124" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              Penumbra
            </text>
            <text x="326" y="157" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              Umbra
            </text>
            <text x="238" y="218" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">
              Lunar eclipse: Earth shadow reaches Moon
            </text>
          </g>
        ) : null}

        <circle cx={earth.x} cy={earth.y} r="28" fill="#2563eb" />
        <path
          d={`M ${earth.x - 18} ${earth.y - 20} C ${earth.x + 9} ${earth.y - 17}, ${earth.x + 24} ${earth.y + 12}, ${earth.x - 6} ${earth.y + 22}`}
          stroke="#93c5fd"
          strokeWidth="4"
          fill="none"
          opacity="0.8"
        />
        <text x={earth.x} y={earth.y + 45} textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
          Earth sees changing lit portion
        </text>

        <circle cx={moonX} cy={moonY} r="16" fill="#e5e7eb" />
        <path
          d={`M ${moonX} ${moonY - 16} A 16 16 0 0 1 ${moonX} ${moonY + 16} A 7 16 0 0 0 ${moonX} ${moonY - 16}`}
          fill="#64748b"
          opacity={showPhaseRule ? "0.78" : "0.42"}
        />
        <text x={moonX} y={moonY - 24} textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
          Moon
        </text>

        {showPhaseRule ? (
          <g>
            <rect x="116" y="24" width="246" height="30" rx="8" fill="#0f5132" opacity="0.86" />
            <text x="239" y="43" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              Moon phases are caused by viewing angle, not Earth shadow.
            </text>
          </g>
        ) : null}

        {showPhaseSequence ? (
          <g>
            {phaseSequence.map((label, index) => {
              const x = 42 + index * 48;
              const isActive = index === phaseIndex;
              return (
                <g key={`${label}-${index}`}>
                  <circle cx={x} cy="270" r={isActive ? 13 : 10} fill="#e5e7eb" opacity={isActive ? 1 : 0.78} />
                  {label === "New" ? <circle cx={x} cy="270" r="10" fill="#0f172a" opacity="0.9" /> : null}
                  {label === "Crescent" ? <circle cx={x - 4} cy="270" r="10" fill="#0f172a" opacity="0.72" /> : null}
                  {label === "Quarter" ? <path d={`M ${x} 260 A 10 10 0 0 0 ${x} 280 L ${x} 260 Z`} fill="#0f172a" opacity="0.72" /> : null}
                  {label === "Gibbous" ? <circle cx={x - 8} cy="270" r="10" fill="#0f172a" opacity="0.42" /> : null}
                  <text x={x} y="296" textAnchor="middle" fill={isActive ? "#fef3c7" : "#dbeafe"} fontSize="8" fontWeight="900">
                    {label}
                  </text>
                </g>
              );
            })}
            <text x="210" y="318" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              New to Crescent to Quarter to Gibbous to Full and back again
            </text>
          </g>
        ) : null}
        {showProof ? (
          <g>
            <rect x="68" y="76" width="304" height="118" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="220" y="108" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="220" y="134" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">phase = viewing angle</text>
            <text x="220" y="152" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">eclipse = alignment + shadow</text>
            <text x="220" y="170" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">new/full moon alone is not enough</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Phase", "Visible lit portion changes with viewing angle."],
          ["Solar eclipse", "Moon casts shadow on Earth."],
          ["Lunar eclipse", "Earth casts shadow on Moon."],
          ["Tilt", "Most months the Moon misses the shadow line."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TidesPreview({ frameIndex }: { frameIndex: number }) {
  const earth = { x: 210, y: 158, r: 42 };
  const showBulge = frameIndex >= 1;
  const showRotation = frameIndex >= 2;
  const showSpring = frameIndex >= 3;
  const showNeap = frameIndex >= 4;
  const showCoast = frameIndex >= 5;
  const showTrap = frameIndex >= 6;
  const showProof = frameIndex >= 7;
  const moon = showNeap ? { x: earth.x, y: 62 } : { x: 332, y: earth.y };
  const oceanRx = showSpring && !showNeap ? 94 : showNeap ? 62 : 80;
  const oceanRy = showSpring && !showNeap ? 42 : showNeap ? 58 : 42;
  const oceanRotation = showNeap ? -90 : 0;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#123c46] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="tides-gravity-coast-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Spring tide = aligned Sun and Moon
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Neap tide = right angle
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Coast shape changes range
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Tides gravity alignment and coastline response preview">
        <defs>
          <radialGradient id="tideEarthGradient" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="52%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#164e63" />
          </radialGradient>
          <radialGradient id="tideMoonGradient" cx="38%" cy="34%" r="62%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
          <linearGradient id="tideRangeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {Array.from({ length: 32 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 43) % 410}
            cy={(index * 29) % 96}
            r={index % 4 === 0 ? 1.7 : 1}
            fill="#bae6fd"
            opacity={0.16 + (index % 5) * 0.08}
          />
        ))}

        <circle cx="54" cy={earth.y} r="33" fill="#facc15" />
        <circle cx="54" cy={earth.y} r="48" fill="none" stroke="#fde68a" opacity="0.18" />
        <text x="54" y={earth.y + 4} textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="900">
          SUN
        </text>

        {[92, 116, 140, 164].map((x, index) => (
          <line
            key={x}
            x1={x}
            y1={earth.y - 42 + index * 24}
            x2="372"
            y2={earth.y - 42 + index * 24}
            stroke="#fde68a"
            strokeWidth={index === 2 ? 3 : 2}
            opacity="0.34"
          />
        ))}

        {showBulge ? (
          <ellipse
            cx={earth.x}
            cy={earth.y}
            rx={oceanRx}
            ry={oceanRy}
            fill="url(#tideRangeGradient)"
            stroke="#67e8f9"
            strokeWidth="2"
            opacity="0.92"
            transform={`rotate(${oceanRotation} ${earth.x} ${earth.y})`}
          />
        ) : null}

        <line
          x1={earth.x}
          y1={earth.y}
          x2={moon.x}
          y2={moon.y}
          stroke="#dbeafe"
          strokeDasharray="7 7"
          strokeWidth="2"
          opacity={showBulge ? 0.82 : 0.28}
        />

        {showNeap ? (
          <line
            x1="54"
            y1={earth.y}
            x2={earth.x}
            y2={earth.y}
            stroke="#fef3c7"
            strokeDasharray="7 7"
            strokeWidth="2"
            opacity="0.76"
          />
        ) : null}

        <circle cx={earth.x} cy={earth.y} r={earth.r} fill="url(#tideEarthGradient)" />
        <path
          d={`M ${earth.x - 16} ${earth.y - 28} C ${earth.x + 2} ${earth.y - 20}, ${earth.x + 24} ${earth.y - 4}, ${earth.x + 10} ${earth.y + 26}`}
          stroke="#064e3b"
          strokeWidth="5"
          fill="none"
          opacity="0.62"
        />
        <text x={earth.x} y={earth.y + 4} textAnchor="middle" fill="#ecfeff" fontSize="10" fontWeight="900">
          Earth
        </text>

        <circle cx={moon.x} cy={moon.y} r="18" fill="url(#tideMoonGradient)" />
        <text x={moon.x} y={moon.y - 27} textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
          Moon
        </text>

        {showBulge ? (
          <g>
            <text x={earth.x + 76} y={earth.y - 10} textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="900">
              High tide
            </text>
            <text x={earth.x} y={earth.y + 76} textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              Low tide between bulges
            </text>
          </g>
        ) : null}

        {showRotation ? (
          <g>
            <path d="M 178 99 C 216 78, 260 96, 276 132" fill="none" stroke="#d1fae5" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 276 132 L 264 126 L 276 120 Z" fill="#d1fae5" />
            <text x="210" y="47" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">
              Earth rotation moves each coast through high and low tide
            </text>
          </g>
        ) : null}

        {showSpring && !showNeap ? (
          <g>
            <rect x="86" y="252" width="248" height="42" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="210" y="270" textAnchor="middle" fill="#d1fae5" fontSize="12" fontWeight="900">
              Spring tide: highest tidal range
            </text>
            <text x="210" y="286" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
              Sun, Earth, and Moon pull along one line
            </text>
          </g>
        ) : null}

        {showNeap ? (
          <g>
            <rect x="78" y="246" width="264" height="50" rx="10" fill="#164e63" opacity="0.94" />
            <text x="210" y="266" textAnchor="middle" fill="#cffafe" fontSize="12" fontWeight="900">
              Neap tide: lower tidal range
            </text>
            <text x="210" y="283" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
              Sun and Moon pull at right angles
            </text>
          </g>
        ) : null}

        {showCoast ? (
          <g>
            <path d="M 52 234 C 96 212, 130 224, 168 210 C 145 242, 108 254, 58 252 Z" fill="#0f5132" opacity="0.88" />
            <path d="M 64 244 C 102 230, 130 234, 154 222" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
            <text x="114" y="203" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Funnel-shaped bay can amplify tide
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="60" y="74" width="300" height="54" rx="10" fill="#7f1d1d" opacity="0.94" />
            <text x="210" y="95" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              Tides are not ordinary wind waves
            </text>
            <text x="210" y="113" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              Tides are periodic sea-level rise and fall
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="54" y="82" width="312" height="128" rx="12" fill="#064e3b" opacity="0.96" />
            <text x="210" y="113" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="139" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">gravity creates tidal bulges</text>
            <text x="210" y="157" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">alignment creates spring tide; right angle creates neap tide</text>
            <text x="210" y="176" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">gravity + alignment + rotation + coast shape</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Bulge", "Moon gravity creates high tide zones."],
          ["Rotation", "Coasts move through high and low tide."],
          ["Alignment", "Spring and neap tides change tidal range."],
          ["Coast", "Bay shape and seabed modify observed tide."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarthInteriorPreview({ frameIndex }: { frameIndex: number }) {
  const showLithosphere = frameIndex >= 1;
  const showConvection = frameIndex >= 2;
  const showDivergent = frameIndex >= 3;
  const showConvergent = frameIndex >= 4;
  const showTransform = frameIndex >= 5;
  const showHazard = frameIndex >= 6;
  const showTrap = frameIndex >= 7;
  const showProof = frameIndex >= 8;
  const earth = { x: 140, y: 154, r: 82 };

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#2b2618] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="earth-interior-plate-movement-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Heat creates convection
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Plates move at boundaries
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Landforms and hazards follow
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Interior of Earth and plate movement preview">
        <defs>
          <radialGradient id="earthInteriorMantle" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="56%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <radialGradient id="earthInteriorCore" cx="42%" cy="34%" r="62%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <linearGradient id="plateSlabGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#134e4a" />
          </linearGradient>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 47) % 410}
            cy={(index * 31) % 90}
            r={index % 4 === 0 ? 1.8 : 1}
            fill="#fed7aa"
            opacity={0.14 + (index % 5) * 0.08}
          />
        ))}

        <circle cx={earth.x} cy={earth.y} r={earth.r} fill="url(#earthInteriorMantle)" />
        <circle cx={earth.x} cy={earth.y} r="56" fill="#ea580c" opacity="0.78" />
        <circle cx={earth.x} cy={earth.y} r="34" fill="#dc2626" opacity="0.88" />
        <circle cx={earth.x} cy={earth.y} r="18" fill="url(#earthInteriorCore)" />
        <circle cx={earth.x} cy={earth.y} r={earth.r} fill="none" stroke="#d1fae5" strokeWidth="4" />
        <path d={`M ${earth.x - 70} ${earth.y - 40} C ${earth.x - 28} ${earth.y - 64}, ${earth.x + 20} ${earth.y - 64}, ${earth.x + 70} ${earth.y - 40}`} stroke="#0f766e" strokeWidth="8" fill="none" strokeLinecap="round" />

        <text x={earth.x} y={earth.y - 88} textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
          crust
        </text>
        <text x={earth.x - 64} y={earth.y + 3} textAnchor="middle" fill="#ffedd5" fontSize="9" fontWeight="900">
          mantle
        </text>
        <text x={earth.x} y={earth.y + 4} textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="900">
          core
        </text>

        {showLithosphere ? (
          <g>
            <rect x="54" y="238" width="172" height="48" rx="10" fill="#0f5132" opacity="0.9" />
            <rect x="66" y="250" width="148" height="10" rx="4" fill="#99f6e4" opacity="0.94" />
            <rect x="66" y="265" width="148" height="10" rx="4" fill="#f97316" opacity="0.72" />
            <text x="140" y="252" textAnchor="middle" fill="#052e16" fontSize="7" fontWeight="900">
              lithosphere
            </text>
            <text x="140" y="282" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Rigid lithosphere over weak asthenosphere
            </text>
          </g>
        ) : null}

        {showConvection ? (
          <g>
            <path d="M 108 187 C 86 142, 98 103, 130 94" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
            <path d="M 130 94 L 119 92 L 126 104 Z" fill="#fef3c7" />
            <path d="M 174 98 C 204 116, 202 166, 170 192" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
            <path d="M 170 192 L 181 188 L 174 181 Z" fill="#fef3c7" />
            <text x="140" y="48" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Convection current moves plates
            </text>
          </g>
        ) : null}

        {showHazard ? (
          <g>
            {[0, 30, 60, 90, 125, 155, 190, 230, 270, 310].map((angle) => {
              const radian = (angle / 180) * Math.PI;
              return (
                <circle
                  key={angle}
                  cx={earth.x + Math.cos(radian) * 95}
                  cy={earth.y + Math.sin(radian) * 95}
                  r="3.5"
                  fill={angle % 60 === 0 ? "#facc15" : "#ef4444"}
                  opacity="0.9"
                />
              );
            })}
            <text x="140" y="316" textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">
              Earthquakes and volcanoes cluster at plate margins
            </text>
          </g>
        ) : null}

        <g transform="translate(250 54)">
          <rect x="0" y="0" width="138" height="58" rx="10" fill={showDivergent ? "#0f5132" : "#111827"} opacity="0.93" stroke="#ffffff" strokeOpacity="0.12" />
          <rect x="25" y="29" width="34" height="8" rx="3" fill="url(#plateSlabGradient)" />
          <rect x="79" y="29" width="34" height="8" rx="3" fill="url(#plateSlabGradient)" />
          {showDivergent ? (
            <>
              <path d="M 58 25 L 42 25" stroke="#d1fae5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 80 25 L 96 25" stroke="#d1fae5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 69 44 L 69 26" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
              <text x="69" y="17" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
                Divergent: new crust
              </text>
            </>
          ) : (
            <text x="69" y="18" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="900">Divergent</text>
          )}
        </g>

        <g transform="translate(250 130)">
          <rect x="0" y="0" width="138" height="64" rx="10" fill={showConvergent ? "#7c2d12" : "#111827"} opacity="0.93" stroke="#ffffff" strokeOpacity="0.12" />
          <rect x="16" y="35" width="48" height="8" rx="3" fill="#0f766e" />
          <path d="M 68 35 L 118 50" stroke="#134e4a" strokeWidth="8" strokeLinecap="round" />
          {showConvergent ? (
            <>
              <path d="M 46 29 L 62 29" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
              <path d="M 96 29 L 80 29" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
              <path d="M 72 31 L 83 13 L 96 31 Z" fill="#a7f3d0" opacity="0.92" />
              <path d="M 99 29 C 103 16, 110 13, 113 4" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
              <text x="69" y="18" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900">
                Convergent: subduction and uplift
              </text>
            </>
          ) : (
            <text x="69" y="18" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="900">Convergent</text>
          )}
        </g>

        <g transform="translate(250 214)">
          <rect x="0" y="0" width="138" height="58" rx="10" fill={showTransform ? "#164e63" : "#111827"} opacity="0.93" stroke="#ffffff" strokeOpacity="0.12" />
          <rect x="28" y="26" width="82" height="9" rx="4" fill="#0f766e" />
          <path d="M 69 18 L 61 42" stroke="#fef3c7" strokeWidth="2" strokeDasharray="4 4" />
          {showTransform ? (
            <>
              <path d="M 42 20 L 82 20" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
              <path d="M 96 42 L 56 42" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
              <path d="M 67 28 L 75 21 L 72 32 L 82 29 L 70 42 L 72 32 Z" fill="#facc15" />
              <text x="69" y="16" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
                Transform: earthquake fault
              </text>
            </>
          ) : (
            <text x="69" y="16" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="900">Transform</text>
          )}
        </g>

        {showTrap ? (
          <g>
            <rect x="52" y="84" width="318" height="58" rx="10" fill="#7f1d1d" opacity="0.95" />
            <text x="211" y="106" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: mantle is not a liquid magma ocean
            </text>
            <text x="211" y="124" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              Plates are rigid lithosphere moving over weak plastic asthenosphere
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="42" y="78" width="336" height="134" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="111" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="138" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">internal heat creates convection</text>
            <text x="210" y="157" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">convection moves lithospheric plates</text>
            <text x="210" y="177" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">plate boundaries create landforms and hazards</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Layers", "Crust, mantle, outer core, inner core."],
          ["Driver", "Internal heat creates convection currents."],
          ["Boundaries", "Divergent, convergent, and transform motion."],
          ["Outcome", "Earthquakes, volcanoes, mountains, ridges."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VolcanismPreview({ frameIndex }: { frameIndex: number }) {
  const showChamber = frameIndex >= 1;
  const showVent = frameIndex >= 2;
  const showEffusive = frameIndex >= 3;
  const showExplosive = frameIndex >= 4;
  const showIntrusive = frameIndex >= 5;
  const showExtrusive = frameIndex >= 6;
  const showHazard = frameIndex >= 7;
  const showTrap = frameIndex >= 8;
  const showProof = frameIndex >= 9;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#0b1117] via-[#2f1d14] to-[#101827] p-4 text-white shadow-inner"
    >
      <div
        data-testid="volcanism-eruption-landforms-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Magma below, lava above
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Effusive vs explosive eruption
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Landforms and hazards
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Volcanism magma eruption and landforms preview">
        <defs>
          <linearGradient id="volcanoConeGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="58%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1c1917" />
          </linearGradient>
          <radialGradient id="magmaGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
          <linearGradient id="ashColumnGradient" x1="0%" x2="0%" y1="100%" y2="0%">
            <stop offset="0%" stopColor="#57534e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d6d3d1" stopOpacity="0.72" />
          </linearGradient>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 41) % 410}
            cy={(index * 37) % 100}
            r={index % 4 === 0 ? 1.8 : 1}
            fill="#fed7aa"
            opacity={0.12 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 42 242 C 98 216, 134 224, 178 198 C 226 168, 262 190, 314 216 C 348 233, 382 229, 406 244 L 406 296 L 42 296 Z" fill="#0f5132" opacity="0.82" />
        <path d="M 112 244 L 202 82 L 294 244 Z" fill="url(#volcanoConeGradient)" stroke="#fed7aa" strokeOpacity="0.16" strokeWidth="2" />
        <path d="M 176 129 L 202 82 L 228 129 C 214 119, 193 119, 176 129 Z" fill="#1c1917" opacity="0.86" />

        {showChamber ? (
          <g>
            <ellipse cx="204" cy="238" rx="58" ry="26" fill="url(#magmaGlow)" opacity="0.96" />
            <text x="204" y="242" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              magma chamber
            </text>
          </g>
        ) : null}

        {showVent ? (
          <g>
            <path d="M 203 236 C 194 190, 200 142, 202 94" stroke="#f97316" strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M 202 94 L 186 124 L 218 124 Z" fill="#fb923c" opacity="0.92" />
            <text x="258" y="137" fill="#fed7aa" fontSize="10" fontWeight="900">
              central vent
            </text>
            <line x1="244" y1="133" x2="211" y2="128" stroke="#fed7aa" strokeWidth="2" />
            <text x="202" y="72" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              crater
            </text>
          </g>
        ) : null}

        {showEffusive ? (
          <g>
            <path d="M 205 124 C 226 142, 248 153, 288 158 C 315 162, 340 175, 360 190" fill="none" stroke="#fb923c" strokeWidth="8" strokeLinecap="round" />
            <path d="M 206 127 C 178 143, 154 158, 126 178" fill="none" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
            <text x="314" y="148" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              Effusive lava flow
            </text>
          </g>
        ) : null}

        {showExplosive ? (
          <g>
            <path d="M 202 88 C 182 60, 176 34, 198 18 C 222 0, 256 18, 250 43 C 286 34, 316 50, 310 78 C 286 102, 242 96, 202 88 Z" fill="url(#ashColumnGradient)" opacity="0.9" />
            <path d="M 202 92 C 195 62, 208 40, 224 26" stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" />
            {[178, 190, 222, 242, 268, 292].map((x, index) => (
              <circle key={x} cx={x} cy={52 + (index % 3) * 15} r="3.5" fill={index % 2 === 0 ? "#f97316" : "#d6d3d1"} />
            ))}
            <text x="292" y="42" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              Explosive ash column
            </text>
          </g>
        ) : null}

        {showIntrusive ? (
          <g>
            <path d="M 137 210 L 190 194" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
            <path d="M 222 218 L 282 218" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
            <path d="M 246 238 C 260 216, 282 205, 300 185" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
            <text x="88" y="209" fill="#fed7aa" fontSize="10" fontWeight="900">
              dyke
            </text>
            <text x="282" y="235" fill="#fed7aa" fontSize="10" fontWeight="900">
              sill
            </text>
            <text x="196" y="283" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              Intrusive landforms cool below surface
            </text>
          </g>
        ) : null}

        {showExtrusive ? (
          <g>
            <path d="M 60 238 C 98 216, 124 224, 162 207" fill="none" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
            <path d="M 312 214 C 334 194, 360 188, 388 194" fill="none" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
            <circle cx="330" cy="203" r="18" fill="none" stroke="#fed7aa" strokeWidth="3" opacity="0.78" />
            <text x="340" y="183" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              caldera cue
            </text>
            <text x="91" y="229" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              lava plateau
            </text>
          </g>
        ) : null}

        {showHazard ? (
          <g>
            <rect x="52" y="20" width="128" height="54" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="116" y="42" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              Hazards
            </text>
            <text x="116" y="59" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              ash, pyroclasts, lava
            </text>
            <rect x="256" y="246" width="128" height="54" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="320" y="268" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Resources
            </text>
            <text x="320" y="285" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              fertile soil, minerals, heat
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="50" y="91" width="320" height="62" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="116" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: magma and lava are not the same position
            </text>
            <text x="210" y="135" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              magma below surface; lava after eruption
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="42" y="84" width="336" height="132" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="116" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="143" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">plate setting and heat create magma</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">gas and viscosity control eruption style</text>
            <text x="210" y="182" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">eruption style creates landforms, hazards, and resources</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Source", "Partial melting creates magma."],
          ["Pathway", "Magma chamber, vent, and crater."],
          ["Style", "Effusive lava flow or explosive ash eruption."],
          ["Outcome", "Intrusive/extrusive landforms and hazards."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarthquakePreview({ frameIndex }: { frameIndex: number }) {
  const showRebound = frameIndex >= 1;
  const showFocus = frameIndex >= 2;
  const showPWave = frameIndex >= 3;
  const showSWave = frameIndex >= 4;
  const showSurface = frameIndex >= 5;
  const showShadow = frameIndex >= 6;
  const showMagnitude = frameIndex >= 7;
  const showRisk = frameIndex >= 8;
  const showTrap = frameIndex >= 9;
  const showProof = frameIndex >= 10;
  const focus = { x: 204, y: 212 };
  const epicentre = { x: 204, y: 120 };

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#08111f] via-[#172554] to-[#111827] p-4 text-white shadow-inner"
    >
      <div
        data-testid="earthquakes-seismic-waves-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Focus inside, epicentre on surface
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          P waves first, S waves second
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Magnitude is not intensity
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Earthquake focus epicentre and seismic waves preview">
        <defs>
          <linearGradient id="quakeCrustGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="54%" stopColor="#164e63" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <radialGradient id="quakeFocusGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </radialGradient>
        </defs>

        {Array.from({ length: 28 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 43) % 410}
            cy={(index * 29) % 98}
            r={index % 4 === 0 ? 1.7 : 1}
            fill="#bfdbfe"
            opacity={0.12 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 38 122 C 88 100, 135 113, 184 102 C 236 90, 292 106, 382 90 L 382 152 C 300 166, 244 150, 190 162 C 130 176, 82 158, 38 172 Z" fill="url(#quakeCrustGradient)" opacity="0.93" />
        <path d="M 42 184 C 102 158, 147 168, 194 154 C 246 140, 292 159, 382 140 L 382 292 L 42 292 Z" fill="#2f1d14" opacity="0.96" />
        <path d="M 204 104 L 184 150 L 214 188 L 192 238 L 210 292" stroke="#fef3c7" strokeWidth="4" strokeDasharray="7 7" fill="none" opacity="0.92" />

        <g opacity={showRebound ? 1 : 0.55}>
          <rect x={showRebound ? 68 : 78} y="142" width="98" height="30" rx="8" fill="#0f766e" />
          <rect x={showRebound ? 248 : 238} y="124" width="98" height="30" rx="8" fill="#164e63" />
          <path d="M 164 156 L 194 144" stroke="#d1fae5" strokeWidth="3" strokeLinecap="round" />
          <path d="M 250 140 L 220 152" stroke="#d1fae5" strokeWidth="3" strokeLinecap="round" />
          <text x="116" y="134" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
            locked block
          </text>
          <text x="298" y="116" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
            stress block
          </text>
        </g>

        {showRebound ? (
          <g>
            <path d="M 88 198 L 148 178" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
            <path d="M 276 170 L 340 154" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
            <text x="210" y="48" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
              Elastic rebound: stored stress releases suddenly
            </text>
          </g>
        ) : null}

        {showFocus ? (
          <g>
            <line x1={focus.x} y1={focus.y} x2={epicentre.x} y2={epicentre.y} stroke="#fef3c7" strokeWidth="2" strokeDasharray="5 6" />
            <circle cx={focus.x} cy={focus.y} r="12" fill="url(#quakeFocusGlow)" />
            <circle cx={epicentre.x} cy={epicentre.y} r="8" fill="#facc15" />
            <text x={focus.x + 28} y={focus.y + 4} fill="#fed7aa" fontSize="10" fontWeight="900">
              focus
            </text>
            <text x={epicentre.x + 18} y={epicentre.y - 9} fill="#fef3c7" fontSize="10" fontWeight="900">
              epicentre
            </text>
          </g>
        ) : null}

        {showPWave ? (
          <g>
            {[34, 60, 86].map((radius) => (
              <circle key={radius} cx={focus.x} cy={focus.y} r={radius} fill="none" stroke="#67e8f9" strokeWidth="2.5" opacity={0.9 - radius * 0.006} />
            ))}
            <text x="83" y="250" fill="#cffafe" fontSize="10" fontWeight="900">
              P waves: fastest, compression, pass through liquid
            </text>
          </g>
        ) : null}

        {showSWave ? (
          <g>
            {[46, 76, 106].map((radius) => (
              <circle key={radius} cx={focus.x} cy={focus.y} r={radius} fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="6 8" opacity={0.82 - radius * 0.004} />
            ))}
            <ellipse cx="294" cy="224" rx="36" ry="54" fill="#1e3a8a" opacity="0.72" />
            <text x="294" y="227" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontWeight="900">
              liquid outer core
            </text>
            <text x="104" y="270" fill="#fef3c7" fontSize="10" fontWeight="900">
              S waves: slower shear, stopped by liquid
            </text>
          </g>
        ) : null}

        {showSurface ? (
          <g>
            <path d="M 48 118 C 72 96, 95 138, 120 116 C 144 94, 168 138, 194 114 C 220 92, 248 137, 276 113 C 302 91, 330 136, 370 106" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
            <rect x="300" y="71" width="16" height="31" rx="2" fill="#e5e7eb" />
            <rect x="320" y="58" width="18" height="44" rx="2" fill="#d1d5db" />
            <path d="M 318 58 L 334 102" stroke="#ef4444" strokeWidth="2.5" />
            <text x="314" y="44" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              Surface waves cause strong shaking damage
            </text>
          </g>
        ) : null}

        {showShadow ? (
          <g>
            <path d="M 42 300 C 115 230, 210 211, 374 300" fill="none" stroke="#67e8f9" strokeWidth="2.2" opacity="0.76" />
            <path d="M 84 300 C 156 250, 244 250, 336 300" fill="none" stroke="#fef3c7" strokeWidth="2.2" strokeDasharray="5 7" opacity="0.76" />
            <rect x="250" y="256" width="132" height="34" rx="9" fill="#111827" opacity="0.88" />
            <text x="316" y="270" textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="900">
              shadow zones prove layered Earth
            </text>
            <text x="316" y="284" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="800">
              S wave blocked by liquid outer core
            </text>
          </g>
        ) : null}

        {showMagnitude ? (
          <g>
            <rect x="44" y="22" width="148" height="56" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="118" y="44" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Magnitude
            </text>
            <text x="118" y="61" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              energy released at source
            </text>
            <rect x="228" y="22" width="148" height="56" rx="10" fill="#164e63" opacity="0.92" />
            <text x="302" y="44" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
              Intensity
            </text>
            <text x="302" y="61" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              observed shaking and damage
            </text>
          </g>
        ) : null}

        {showRisk ? (
          <g>
            <rect x="54" y="246" width="138" height="48" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="123" y="265" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Risk reduction
            </text>
            <text x="123" y="281" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              codes, zoning, drills
            </text>
            <rect x="228" y="246" width="138" height="48" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="297" y="265" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              Risk = hazard
            </text>
            <text x="297" y="281" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              plus exposure and vulnerability
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="45" y="88" width="330" height="62" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="113" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: epicentre is not inside Earth
            </text>
            <text x="210" y="132" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              focus is inside; epicentre is on the surface
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="42" y="84" width="336" height="136" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="116" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="143" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">stress creates slip and energy release</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">P and S waves reveal Earth layers</text>
            <text x="210" y="182" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">risk falls through codes, zoning, drills, and preparedness</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Source", "Stress accumulates and releases on a fault."],
          ["Location", "Focus inside; epicentre on surface."],
          ["Waves", "P, S, and surface waves behave differently."],
          ["Risk", "Hazard becomes disaster through exposure."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TsunamiPreview({ frameIndex }: { frameIndex: number }) {
  const showWaterColumn = frameIndex >= 1;
  const showDeepOcean = frameIndex >= 2;
  const showShoaling = frameIndex >= 3;
  const showDrawdown = frameIndex >= 4;
  const showRunUp = frameIndex >= 5;
  const showWarning = frameIndex >= 6;
  const showRisk = frameIndex >= 7;
  const showTrap = frameIndex >= 8;
  const showProof = frameIndex >= 9;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#06121f] via-[#12344c] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="tsunami-seafloor-coastal-impact-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Seafloor displacement starts tsunami
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Shoaling raises wave height
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Warning plus evacuation saves lives
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Tsunami seafloor displacement and coastal impact preview">
        <defs>
          <linearGradient id="tsunamiOceanGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.68" />
            <stop offset="56%" stopColor="#0891b2" stopOpacity="0.76" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="tsunamiSeafloorGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="58%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="tsunamiWaveGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#cffafe" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.36" />
          </linearGradient>
        </defs>

        {Array.from({ length: 28 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 37) % 410}
            cy={(index * 23) % 90}
            r={index % 4 === 0 ? 1.6 : 1}
            fill="#bae6fd"
            opacity={0.16 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 36 116 C 86 106, 126 126, 176 116 C 224 106, 272 122, 326 105 C 360 94, 388 95, 404 92 L 404 226 L 36 226 Z" fill="url(#tsunamiOceanGradient)" opacity="0.92" />
        <path d="M 36 226 C 95 218, 150 230, 205 222 C 246 216, 286 230, 328 210 C 360 194, 386 184, 404 172 L 404 294 L 36 294 Z" fill="url(#tsunamiSeafloorGradient)" opacity="0.96" />
        <path d="M 168 224 L 216 205 L 238 226" stroke="#fef3c7" strokeWidth="4" strokeDasharray="7 7" fill="none" />

        <g>
          <rect x="146" y="211" width="76" height="16" rx="5" fill="#7c2d12" />
          <rect x="221" y={showWaterColumn ? 196 : 211} width="76" height="16" rx="5" fill="#92400e" />
          <path d="M 223 214 L 238 200 L 253 214" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
          <text x="212" y="246" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
            undersea fault slip lifts seafloor
          </text>
        </g>

        {showWaterColumn ? (
          <g>
            <rect x="205" y="118" width="82" height="82" rx="10" fill="#cffafe" opacity="0.2" stroke="#cffafe" strokeWidth="2" strokeDasharray="5 6" />
            <path d="M 220 170 C 240 144, 260 144, 282 170" fill="none" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
            <text x="246" y="108" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
              water-column uplift
            </text>
          </g>
        ) : null}

        {showDeepOcean ? (
          <g>
            <path d="M 48 134 C 84 124, 120 144, 156 134 C 190 124, 226 144, 262 134" fill="none" stroke="url(#tsunamiWaveGradient)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 64 154 L 248 154" stroke="#cffafe" strokeWidth="2" strokeDasharray="7 7" opacity="0.82" />
            <text x="132" y="92" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
              deep ocean: fast, long, low wave
            </text>
          </g>
        ) : null}

        {showShoaling ? (
          <g>
            <path d="M 250 138 C 274 120, 298 162, 326 126 C 350 96, 374 118, 404 70" fill="none" stroke="#e0f2fe" strokeWidth="7" strokeLinecap="round" />
            <path d="M 318 216 C 342 198, 372 184, 404 174" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 6" fill="none" />
            <text x="326" y="91" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              shoaling: speed down, height up
            </text>
          </g>
        ) : null}

        <path d="M 352 114 L 404 90 L 404 226 L 362 226 C 368 190, 366 150, 352 114 Z" fill="#14532d" opacity="0.98" />
        <path d="M 356 116 C 378 106, 392 100, 404 96" stroke="#bbf7d0" strokeWidth="4" fill="none" />
        <rect x="372" y="102" width="15" height="28" rx="2" fill="#e5e7eb" />
        <rect x="389" y="88" width="12" height="42" rx="2" fill="#d1d5db" />

        {showDrawdown ? (
          <g>
            <path d="M 326 162 C 348 154, 376 158, 404 154" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
            <path d="M 392 156 L 368 150" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
            <text x="323" y="182" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              sudden sea withdrawal can be warning
            </text>
          </g>
        ) : null}

        {showRunUp ? (
          <g>
            <path d="M 310 144 C 336 126, 366 126, 404 110 L 404 196 C 374 202, 344 194, 318 180 Z" fill="#67e8f9" opacity="0.58" />
            <line x1="390" y1="110" x2="390" y2="190" stroke="#fef3c7" strokeWidth="3" />
            <text x="360" y="105" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              run-up
            </text>
            <text x="356" y="203" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
              inundation zone
            </text>
          </g>
        ) : null}

        {showWarning ? (
          <g>
            <rect x="42" y="22" width="328" height="44" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="206" y="40" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              seismic sensor {"->"} ocean buoy {"->"} alert {"->"} evacuation
            </text>
            <text x="206" y="56" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              warning chain must connect detection to action
            </text>
          </g>
        ) : null}

        {showRisk ? (
          <g>
            <rect x="46" y="250" width="132" height="46" rx="10" fill="#064e3b" opacity="0.94" />
            <text x="112" y="269" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Prepared coast
            </text>
            <text x="112" y="284" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              high ground, routes, shelters
            </text>
            <rect x="218" y="250" width="132" height="46" rx="10" fill="#14532d" opacity="0.94" />
            <text x="284" y="269" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              Natural buffer
            </text>
            <text x="284" y="284" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              mangroves and no-build zones
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="46" y="86" width="328" height="64" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="112" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: tsunami is not a tidal wave
            </text>
            <text x="210" y="132" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              tides are gravitational; tsunami is displacement-driven
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="42" y="82" width="336" height="138" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="115" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">fault slip displaces seafloor and water column</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">deep-ocean wave becomes tall near shallow coast</text>
            <text x="210" y="183" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">warning plus evacuation reduces coastal loss</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Source", "Seafloor displacement moves water column."],
          ["Travel", "Deep ocean wave is fast, long, and low."],
          ["Coast", "Shoaling raises wave height and run-up."],
          ["Response", "Warning and evacuation reduce loss."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MountainBuildingPreview({ frameIndex }: { frameIndex: number }) {
  const showFolding = frameIndex >= 1;
  const showFoldLabels = frameIndex >= 2;
  const showThrust = frameIndex >= 3;
  const showMountainBelt = frameIndex >= 4;
  const showNormalFault = frameIndex >= 5;
  const showBlockLandforms = frameIndex >= 6;
  const showErosion = frameIndex >= 7;
  const showTrap = frameIndex >= 8;
  const showProof = frameIndex >= 9;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#28321f] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="mountain-building-fold-fault-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Compression folds crust
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Faulting creates blocks
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Uplift plus erosion shapes relief
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Mountain building folds faults and uplift preview">
        <defs>
          <linearGradient id="mountainCrustGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="55%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
          <linearGradient id="mountainLayerGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 47) % 410}
            cy={(index * 29) % 92}
            r={index % 4 === 0 ? 1.7 : 1}
            fill="#fef3c7"
            opacity={0.13 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 38 238 C 88 218, 126 224, 164 204 C 205 184, 240 210, 282 188 C 326 164, 360 190, 404 174 L 404 292 L 38 292 Z" fill="url(#mountainCrustGradient)" opacity="0.96" />
        <path d="M 42 246 C 94 228, 130 235, 171 213 C 207 194, 242 220, 284 200 C 324 180, 360 202, 402 188" fill="none" stroke="#d1fae5" strokeWidth="3" opacity="0.76" />

        <g>
          <path d="M 56 174 L 96 174" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
          <path d="M 96 174 L 82 166 L 82 182 Z" fill="#fef3c7" />
          <path d="M 364 174 L 324 174" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
          <path d="M 324 174 L 338 166 L 338 182 Z" fill="#fef3c7" />
          <text x="210" y="56" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">
            Plate convergence compresses layered crust
          </text>
        </g>

        {showFolding ? (
          <g>
            {[0, 14, 28].map((offset) => (
              <path
                key={offset}
                d={`M 86 ${205 + offset} C 122 ${174 + offset}, 152 ${174 + offset}, 186 ${205 + offset} C 220 ${236 + offset}, 252 ${236 + offset}, 286 ${205 + offset} C 316 ${178 + offset}, 344 ${180 + offset}, 376 ${207 + offset}`}
                fill="none"
                stroke={offset === 14 ? "#fef3c7" : "url(#mountainLayerGradient)"}
                strokeWidth={offset === 14 ? 4 : 3}
                opacity={offset === 28 ? 0.65 : 0.92}
              />
            ))}
            <text x="116" y="151" fill="#fef3c7" fontSize="10" fontWeight="900">
              folding begins
            </text>
          </g>
        ) : null}

        {showFoldLabels ? (
          <g>
            <path d="M 151 176 L 151 130" stroke="#d1fae5" strokeWidth="2" strokeDasharray="5 5" />
            <path d="M 235 235 L 235 268" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="5 5" />
            <text x="151" y="121" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              anticline
            </text>
            <text x="235" y="282" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              syncline
            </text>
          </g>
        ) : null}

        {showThrust ? (
          <g>
            <path d="M 108 238 L 300 144" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
            <path d="M 292 148 L 278 146 L 287 160 Z" fill="#fb923c" />
            <path d="M 186 196 L 242 154 L 292 174 L 226 212 Z" fill="#a16207" opacity="0.76" />
            <text x="303" y="139" fill="#fed7aa" fontSize="10" fontWeight="900">
              thrust fault uplift
            </text>
          </g>
        ) : null}

        {showMountainBelt ? (
          <g>
            <path d="M 82 178 L 122 112 L 157 178 Z" fill="#4d7c0f" opacity="0.96" />
            <path d="M 130 178 L 188 88 L 246 178 Z" fill="#365314" opacity="0.96" />
            <path d="M 214 178 L 270 102 L 330 178 Z" fill="#4d7c0f" opacity="0.96" />
            <path d="M 172 114 L 188 88 L 205 114 Z" fill="#f8fafc" opacity="0.9" />
            <text x="209" y="80" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Fold mountain belt
            </text>
          </g>
        ) : null}

        {showNormalFault ? (
          <g>
            <rect x="62" y="236" width="82" height="38" rx="6" fill="#92400e" opacity="0.95" />
            <rect x="156" y="254" width="82" height="38" rx="6" fill="#78350f" opacity="0.95" />
            <rect x="250" y="236" width="82" height="38" rx="6" fill="#92400e" opacity="0.95" />
            <path d="M 145 232 L 156 294" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 6" />
            <path d="M 238 294 L 250 232" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 6" />
            <path d="M 112 224 L 82 224" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />
            <path d="M 284 224 L 314 224" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />
            <text x="198" y="312" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              extension creates normal faults
            </text>
          </g>
        ) : null}

        {showBlockLandforms ? (
          <g>
            <text x="104" y="231" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              horst
            </text>
            <text x="198" y="250" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              graben / rift valley
            </text>
            <text x="292" y="231" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              block mountain
            </text>
          </g>
        ) : null}

        {showErosion ? (
          <g>
            {[120, 188, 270].map((x) => (
              <path key={x} d={`M ${x} 92 C ${x - 12} 128, ${x + 16} 150, ${x - 8} 178`} stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
            ))}
            <path d="M 66 184 C 118 178, 146 198, 196 186 C 244 174, 286 190, 356 170" stroke="#67e8f9" strokeWidth="4" fill="none" strokeLinecap="round" />
            <text x="210" y="102" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              erosion exposes folded structure and carves relief
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="86" width="332" height="64" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="112" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: all mountains are not volcanic
            </text>
            <text x="210" y="132" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              fold, block, volcanic, and residual mountains have different mechanisms
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="40" y="82" width="340" height="138" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="115" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">compression creates folding and thrust uplift</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">extension creates horst, graben, and rift valleys</text>
            <text x="210" y="183" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">uplift plus erosion reveals the final landform</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Force", "Compression folds and thrusts crust."],
          ["Folds", "Anticline rises; syncline bends down."],
          ["Faults", "Horst, graben, block mountain, rift valley."],
          ["Finish", "Uplift gives relief; erosion shapes it."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatheringErosionPreview({ frameIndex }: { frameIndex: number }) {
  const showPhysical = frameIndex >= 1;
  const showChemical = frameIndex >= 2;
  const showBiological = frameIndex >= 3;
  const showErosion = frameIndex >= 4;
  const showDeposition = frameIndex >= 5;
  const showMassWasting = frameIndex >= 6;
  const showSoil = frameIndex >= 7;
  const showTrap = frameIndex >= 8;
  const showProof = frameIndex >= 9;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#08111f] via-[#22321f] to-[#111827] p-4 text-white shadow-inner"
    >
      <div
        data-testid="weathering-erosion-mass-wasting-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Weathering breaks rock in place
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Erosion removes and transports
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Gravity drives mass wasting
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Weathering erosion and mass wasting denudation preview">
        <defs>
          <linearGradient id="weatherSlopeGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#4d7c0f" />
            <stop offset="50%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
          <linearGradient id="weatherRiverGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="soilHorizonGradient" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#365314" />
            <stop offset="45%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 41) % 410}
            cy={(index * 31) % 92}
            r={index % 4 === 0 ? 1.7 : 1}
            fill="#bbf7d0"
            opacity={0.12 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 42 240 C 92 220, 126 226, 168 202 C 216 174, 250 188, 292 156 C 330 128, 366 142, 404 118 L 404 292 L 42 292 Z" fill="url(#weatherSlopeGradient)" opacity="0.97" />
        <path d="M 72 244 C 132 224, 178 232, 240 212 C 296 194, 342 178, 404 158" stroke="#d1fae5" strokeWidth="3" fill="none" opacity="0.72" />
        <circle cx="250" cy="176" r="32" fill="#78716c" />
        <path d="M 222 178 C 238 160, 264 162, 280 181" stroke="#fef3c7" strokeWidth="3" fill="none" opacity="0.65" />
        <text x="251" y="143" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
          exposed rock after uplift
        </text>

        {showPhysical ? (
          <g>
            <path d="M 248 147 L 244 176 L 258 204" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" />
            <path d="M 232 168 L 250 178 L 271 170" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="226" cy="206" r="5" fill="#a8a29e" />
            <circle cx="240" cy="216" r="4" fill="#a8a29e" />
            <text x="108" y="124" fill="#fef3c7" fontSize="10" fontWeight="900">
              physical weathering: cracks widen
            </text>
          </g>
        ) : null}

        {showChemical ? (
          <g>
            {[225, 243, 265].map((x, index) => (
              <path key={x} d={`M ${x} 84 C ${x - 9} 106, ${x + 12} 124, ${x - 3} 146`} stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
            ))}
            <path d="M 272 188 C 285 180, 294 185, 304 196" stroke="#86efac" strokeWidth="4" fill="none" strokeLinecap="round" />
            <text x="283" y="82" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">
              chemical weathering alters minerals
            </text>
          </g>
        ) : null}

        {showBiological ? (
          <g>
            <path d="M 198 174 C 188 145, 197 122, 212 104" stroke="#65a30d" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 198 174 C 208 162, 218 157, 232 150" stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 212 104 C 200 94, 190 94, 179 100" stroke="#86efac" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 212 104 C 226 92, 240 94, 250 104" stroke="#86efac" strokeWidth="3" fill="none" strokeLinecap="round" />
            <text x="164" y="96" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              roots widen joints
            </text>
          </g>
        ) : null}

        {showErosion ? (
          <g>
            <path d="M 166 210 C 196 214, 216 238, 258 238 C 304 238, 338 224, 384 238" stroke="url(#weatherRiverGradient)" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 178 202 L 206 218 L 238 224" stroke="#cffafe" strokeWidth="3" strokeDasharray="5 6" fill="none" />
            {[188, 226, 276, 326].map((x, index) => (
              <circle key={x} cx={x} cy={220 + (index % 2) * 10} r="3.5" fill="#fed7aa" />
            ))}
            <text x="124" y="224" fill="#cffafe" fontSize="10" fontWeight="900">
              erosion removes and transports
            </text>
          </g>
        ) : null}

        {showDeposition ? (
          <g>
            <path d="M 296 244 C 328 228, 362 228, 394 248 C 368 258, 334 260, 296 244 Z" fill="#f59e0b" opacity="0.76" />
            <text x="344" y="270" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              deposition when energy falls
            </text>
          </g>
        ) : null}

        {showMassWasting ? (
          <g>
            <path d="M 286 160 C 304 176, 316 190, 330 212 C 300 214, 276 202, 260 184 Z" fill="#7f1d1d" opacity="0.78" />
            <path d="M 286 162 L 328 211" stroke="#fecaca" strokeWidth="3" strokeDasharray="6 6" />
            <path d="M 323 205 L 309 204 L 318 193 Z" fill="#fecaca" />
            <text x="324" y="150" textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">
              mass wasting: gravity moves slope material
            </text>
          </g>
        ) : null}

        {showSoil ? (
          <g>
            <rect x="48" y="42" width="132" height="74" rx="10" fill="url(#soilHorizonGradient)" opacity="0.94" />
            <line x1="60" y1="62" x2="168" y2="62" stroke="#bbf7d0" strokeWidth="2" />
            <line x1="60" y1="84" x2="168" y2="84" stroke="#fed7aa" strokeWidth="2" />
            <text x="114" y="58" textAnchor="middle" fill="#ecfccb" fontSize="9" fontWeight="900">
              humus
            </text>
            <text x="114" y="79" textAnchor="middle" fill="#fff7ed" fontSize="9" fontWeight="900">
              topsoil
            </text>
            <text x="114" y="101" textAnchor="middle" fill="#fed7aa" fontSize="9" fontWeight="900">
              parent material
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="84" width="332" height="66" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="110" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: weathering is not transport
            </text>
            <text x="210" y="130" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              weathering breaks in place; erosion removes and carries
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="40" y="82" width="340" height="140" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="115" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">uplift exposes rock to external processes</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">weathering breaks, erosion transports, deposition rebuilds</text>
            <text x="210" y="184" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">gravity controls mass wasting and slope failure</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Weathering", "Rock breakdown in place."],
          ["Erosion", "Removal and transport by an agent."],
          ["Deposition", "Sediment settles when energy falls."],
          ["Mass wasting", "Gravity moves material downslope."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiverSystemPreview({ frameIndex }: { frameIndex: number }) {
  const showUpper = frameIndex >= 1;
  const showLoad = frameIndex >= 2;
  const showMeander = frameIndex >= 3;
  const showOxbow = frameIndex >= 4;
  const showFloodplain = frameIndex >= 5;
  const showLower = frameIndex >= 6;
  const showDelta = frameIndex >= 7;
  const showRisk = frameIndex >= 8;
  const showTrap = frameIndex >= 9;
  const showProof = frameIndex >= 10;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#06121f] via-[#123c46] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="river-system-fluvial-landforms-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          River basin collects water
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Erosion, transport, deposition
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Floodplain and delta logic
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="River system and fluvial landforms preview">
        <defs>
          <linearGradient id="riverBasinGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#365314" />
            <stop offset="45%" stopColor="#4d7c0f" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="riverWaterGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="deltaFanGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.62" />
          </linearGradient>
        </defs>

        {Array.from({ length: 26 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 43) % 410}
            cy={(index * 29) % 92}
            r={index % 4 === 0 ? 1.6 : 1}
            fill="#bae6fd"
            opacity={0.13 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 38 92 C 82 48, 144 60, 186 92 C 238 132, 270 118, 322 146 C 364 168, 394 198, 404 248 L 404 296 L 38 296 Z" fill="url(#riverBasinGradient)" opacity="0.9" />
        <path d="M 64 94 C 98 66, 137 70, 166 100 C 192 126, 222 120, 252 150 C 290 190, 350 195, 386 244" fill="none" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="6 7" opacity="0.85" />
        <text x="118" y="64" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
          drainage basin boundary
        </text>

        <path
          d="M 112 76 C 120 108, 138 130, 156 148 C 180 174, 164 196, 190 212 C 218 230, 260 198, 284 220 C 307 241, 324 262, 370 250"
          fill="none"
          stroke="url(#riverWaterGradient)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path d="M 96 92 L 122 112" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" />
        <path d="M 150 102 L 138 128" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
        <text x="126" y="91" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
          source and tributaries
        </text>

        {showUpper ? (
          <g>
            <path d="M 96 132 L 140 166 L 176 140" fill="none" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" />
            <path d="M 137 134 L 126 178 L 150 178 Z" fill="#1f2937" opacity="0.72" />
            <text x="107" y="188" fill="#fef3c7" fontSize="10" fontWeight="900">
              upper course: vertical erosion
            </text>
            <text x="167" y="130" fill="#dbeafe" fontSize="9" fontWeight="900">
              V-shaped valley
            </text>
          </g>
        ) : null}

        {showLoad ? (
          <g>
            {[154, 176, 202, 232].map((x, index) => (
              <circle key={x} cx={x} cy={168 + (index % 2) * 22} r={index === 0 ? 5 : 3.5} fill="#fed7aa" />
            ))}
            <rect x="42" y="226" width="148" height="52" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="116" y="247" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              transport load
            </text>
            <text x="116" y="264" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              traction, saltation, suspension, solution
            </text>
          </g>
        ) : null}

        {showMeander ? (
          <g>
            <path d="M 178 186 C 220 154, 254 170, 252 199 C 249 236, 198 236, 188 211" fill="none" stroke="#e0f2fe" strokeWidth="5" strokeLinecap="round" />
            <path d="M 251 192 C 242 182, 232 178, 218 180" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M 190 211 C 202 220, 220 220, 235 212" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
            <text x="276" y="185" fill="#fecaca" fontSize="9" fontWeight="900">
              outer bank erosion
            </text>
            <text x="235" y="239" textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="900">
              inner bank deposition
            </text>
          </g>
        ) : null}

        {showOxbow ? (
          <g>
            <ellipse cx="242" cy="212" rx="30" ry="18" fill="none" stroke="#67e8f9" strokeWidth="5" opacity="0.82" />
            <path d="M 210 206 C 236 202, 260 204, 288 212" stroke="#0ea5e9" strokeWidth="7" strokeLinecap="round" />
            <text x="286" y="232" fill="#cffafe" fontSize="10" fontWeight="900">
              oxbow lake after cutoff
            </text>
          </g>
        ) : null}

        {showFloodplain ? (
          <g>
            <path d="M 168 230 C 214 206, 270 208, 334 232 C 290 252, 224 256, 168 230 Z" fill="#facc15" opacity="0.34" />
            <path d="M 170 225 C 210 215, 252 218, 334 226" stroke="#fed7aa" strokeWidth="4" strokeLinecap="round" />
            <text x="258" y="269" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              floodplain and natural levees
            </text>
          </g>
        ) : null}

        {showLower ? (
          <g>
            <rect x="244" y="44" width="130" height="52" rx="10" fill="#164e63" opacity="0.92" />
            <text x="309" y="65" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
              lower course
            </text>
            <text x="309" y="82" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              low gradient, deposition dominates
            </text>
            <path d="M 272 222 C 296 226, 318 222, 344 226" stroke="#facc15" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
          </g>
        ) : null}

        {showDelta ? (
          <g>
            <path d="M 354 242 L 404 212 L 404 286 Z" fill="url(#deltaFanGradient)" opacity="0.82" />
            <path d="M 360 246 L 404 222" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
            <path d="M 366 250 L 404 250" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
            <path d="M 360 252 L 404 276" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
            <text x="354" y="210" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              delta and distributaries
            </text>
          </g>
        ) : null}

        {showRisk ? (
          <g>
            <rect x="44" y="24" width="158" height="48" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="123" y="43" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              Flood risk
            </text>
            <text x="123" y="59" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              floodplain exposure and poor drainage
            </text>
            <rect x="240" y="104" width="138" height="48" rx="10" fill="#0f5132" opacity="0.92" />
            <text x="309" y="123" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Management
            </text>
            <text x="309" y="139" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              wetlands, zoning, warnings
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="84" width="332" height="66" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="110" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: rivers do not only erode
            </text>
            <text x="210" y="130" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              rivers erode, transport and deposit across different courses
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="40" y="82" width="340" height="140" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="115" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">upper course cuts down with steep gradient</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">middle course migrates through meanders</text>
            <text x="210" y="184" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">lower course deposits floodplains and deltas</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Basin", "Watershed, tributaries and main channel."],
          ["Upper", "Steep gradient and vertical erosion."],
          ["Middle", "Meanders, cut banks and point bars."],
          ["Lower", "Floodplain, levees, delta deposition."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlacialLandformsPreview({ frameIndex }: { frameIndex: number }) {
  const showFlow = frameIndex >= 1;
  const showErosion = frameIndex >= 2;
  const showCirque = frameIndex >= 3;
  const showAreteHorn = frameIndex >= 4;
  const showUValley = frameIndex >= 5;
  const showMoraine = frameIndex >= 6;
  const showOutwash = frameIndex >= 7;
  const showRetreat = frameIndex >= 8;
  const showTrap = frameIndex >= 9;
  const showProof = frameIndex >= 10;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#07111f] via-[#17324c] to-[#0f172a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="glacial-landforms-ice-erosion-deposition-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Ice flows under gravity
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Plucking plus abrasion erode
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Moraines and outwash deposit
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Glacial landforms ice erosion and deposition preview">
        <defs>
          <linearGradient id="glacierMountainGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="52%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="glacierIceGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="48%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="glacierOutwashGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.56" />
          </linearGradient>
        </defs>

        {Array.from({ length: 34 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 37) % 410}
            cy={(index * 23) % 106}
            r={index % 4 === 0 ? 1.8 : 1}
            fill="#e0f2fe"
            opacity={0.16 + (index % 5) * 0.08}
          />
        ))}

        <path d="M 42 236 L 116 78 L 184 236 Z" fill="url(#glacierMountainGradient)" />
        <path d="M 136 236 L 224 52 L 318 236 Z" fill="url(#glacierMountainGradient)" />
        <path d="M 264 236 L 342 96 L 404 236 Z" fill="url(#glacierMountainGradient)" />
        <path d="M 96 122 L 116 78 L 134 122 Z" fill="#f8fafc" />
        <path d="M 194 114 L 224 52 L 256 114 Z" fill="#f8fafc" />
        <path d="M 326 126 L 342 96 L 359 126 Z" fill="#f8fafc" />

        <path d="M 194 90 C 174 126, 160 166, 146 210 C 180 230, 226 236, 274 222 C 268 180, 248 134, 224 96 C 214 84, 204 82, 194 90 Z" fill="url(#glacierIceGradient)" opacity="0.95" />
        <path d="M 154 214 C 188 246, 248 252, 322 238 C 344 234, 368 242, 394 258 L 394 292 L 98 292 C 122 260, 134 232, 154 214 Z" fill="#475569" opacity="0.9" />
        <text x="212" y="77" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
          snow accumulation compacts into firn and ice
        </text>

        {showFlow ? (
          <g>
            <path d="M 212 104 C 206 136, 202 170, 204 208" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
            <path d="M 204 208 L 194 194 L 214 194 Z" fill="#0ea5e9" />
            <text x="276" y="149" fill="#cffafe" fontSize="10" fontWeight="900">
              glacier flow under gravity
            </text>
          </g>
        ) : null}

        {showErosion ? (
          <g>
            <path d="M 166 198 C 184 192, 202 197, 224 188" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 6" fill="none" />
            <path d="M 156 220 L 230 218" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" />
            {[164, 182, 204, 226].map((x) => (
              <circle key={x} cx={x} cy="218" r="3.5" fill="#78350f" />
            ))}
            <text x="116" y="185" fill="#fef3c7" fontSize="10" fontWeight="900">
              plucking
            </text>
            <text x="235" y="202" fill="#fef3c7" fontSize="10" fontWeight="900">
              abrasion
            </text>
          </g>
        ) : null}

        {showCirque ? (
          <g>
            <path d="M 166 116 C 184 88, 222 86, 244 116 C 226 132, 188 134, 166 116 Z" fill="#e0f2fe" opacity="0.5" stroke="#f8fafc" strokeWidth="3" />
            <text x="205" y="112" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="900">
              cirque
            </text>
            <text x="210" y="134" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
              bowl-shaped headwall erosion
            </text>
          </g>
        ) : null}

        {showAreteHorn ? (
          <g>
            <path d="M 126 128 L 224 52 L 306 136" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" />
            <circle cx="224" cy="52" r="7" fill="#fef3c7" />
            <text x="164" y="104" fill="#fef3c7" fontSize="10" fontWeight="900">
              arete
            </text>
            <text x="249" y="51" fill="#fef3c7" fontSize="10" fontWeight="900">
              horn
            </text>
          </g>
        ) : null}

        {showUValley ? (
          <g>
            <path d="M 98 252 C 140 286, 286 286, 338 248" fill="none" stroke="#e0f2fe" strokeWidth="8" strokeLinecap="round" />
            <path d="M 112 246 C 140 264, 284 264, 326 242" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <text x="214" y="308" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
              U-shaped valley, not river V-shaped valley
            </text>
          </g>
        ) : null}

        {showMoraine ? (
          <g>
            <path d="M 142 214 C 156 238, 172 256, 204 270" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
            <path d="M 268 222 C 262 244, 248 260, 224 274" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
            <path d="M 206 232 C 210 250, 214 266, 218 282" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
            <path d="M 170 276 C 210 290, 260 288, 302 272" stroke="#fed7aa" strokeWidth="5" strokeLinecap="round" />
            <text x="92" y="258" fill="#fef3c7" fontSize="10" fontWeight="900">
              lateral moraine
            </text>
            <text x="292" y="270" fill="#fef3c7" fontSize="10" fontWeight="900">
              terminal moraine
            </text>
          </g>
        ) : null}

        {showOutwash ? (
          <g>
            <path d="M 234 280 C 274 262, 326 260, 394 282 L 394 302 L 210 302 Z" fill="url(#glacierOutwashGradient)" opacity="0.82" />
            <path d="M 244 282 C 282 274, 328 276, 386 288" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
            <text x="318" y="252" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">
              meltwater sorts outwash plain
            </text>
          </g>
        ) : null}

        {showRetreat ? (
          <g>
            <path d="M 236 232 C 254 212, 286 214, 302 236 C 280 252, 252 252, 236 232 Z" fill="#0ea5e9" opacity="0.78" />
            <path d="M 224 218 L 256 205" stroke="#fecaca" strokeWidth="3" strokeDasharray="5 6" />
            <rect x="42" y="26" width="150" height="50" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="117" y="45" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              Retreat risk
            </text>
            <text x="117" y="61" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              moraine-dammed lake and GLOF
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="86" width="332" height="66" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="112" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: glaciers are not static ice
            </text>
            <text x="210" y="130" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              glaciers move, erode, transport and deposit material
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="40" y="82" width="340" height="140" rx="12" fill="#064e3b" opacity="0.97" />
            <text x="210" y="115" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">accumulation creates moving glacier ice</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">plucking and abrasion carve cirques and U-shaped valleys</text>
            <text x="210" y="184" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">melting deposits moraines, outwash and lake-risk signals</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Formation", "Snow compacts into moving glacial ice."],
          ["Erosion", "Plucking and abrasion carve valleys."],
          ["Landforms", "Cirque, arete, horn and U-shaped valley."],
          ["Deposition", "Moraines, outwash and retreat lakes."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AeolianLandformsPreview({ frameIndex }: { frameIndex: number }) {
  const showDeflation = frameIndex >= 1;
  const showAbrasion = frameIndex >= 2;
  const showTransport = frameIndex >= 3;
  const showDune = frameIndex >= 4;
  const showBarchan = frameIndex >= 5;
  const showYardang = frameIndex >= 6;
  const showLoess = frameIndex >= 7;
  const showDesertification = frameIndex >= 8;
  const showTrap = frameIndex >= 9;
  const showProof = frameIndex >= 10;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#2b1f16] via-[#6b4b2d] to-[#153f35] p-4 text-white shadow-inner"
    >
      <div
        data-testid="aeolian-landforms-wind-erosion-deposition-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Wind erodes by deflation and abrasion
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Dunes form by deposition
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Vegetation loss raises desertification risk
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Aeolian landforms wind erosion and deposition preview">
        <defs>
          <linearGradient id="aeolianSkyGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.92" />
            <stop offset="58%" stopColor="#f59e0b" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#134e4a" stopOpacity="0.74" />
          </linearGradient>
          <linearGradient id="aeolianDuneGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="52%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="aeolianDuneShadeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.88" />
          </linearGradient>
          <filter id="aeolianDustBlur">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <rect x="0" y="0" width="420" height="330" fill="url(#aeolianSkyGradient)" opacity="0.9" />
        <path d="M 0 246 C 58 216, 118 228, 174 248 C 242 274, 302 250, 420 230 L 420 330 L 0 330 Z" fill="url(#aeolianDuneGradient)" />
        <path d="M 0 276 C 84 250, 178 264, 232 286 C 290 310, 354 286, 420 266 L 420 330 L 0 330 Z" fill="#7c2d12" opacity="0.42" />
        <path d="M 28 264 C 88 238, 142 248, 210 266 C 166 280, 112 286, 44 284 Z" fill="#fef3c7" opacity="0.45" />

        {[36, 72, 118, 166, 214, 264, 312, 360].map((x, index) => (
          <g key={x} opacity={0.8 - index * 0.04}>
            <path d={`M ${x} ${64 + (index % 3) * 18} C ${x + 32} ${54 + (index % 3) * 16}, ${x + 58} ${70 + (index % 2) * 14}, ${x + 88} ${58 + (index % 4) * 12}`} stroke="#fff7ed" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d={`M ${x + 88} ${58 + (index % 4) * 12} L ${x + 76} ${52 + (index % 4) * 12} L ${x + 78} ${66 + (index % 4) * 12} Z`} fill="#fff7ed" />
          </g>
        ))}
        <text x="68" y="44" fill="#1f2937" fontSize="10" fontWeight="900">
          dry exposed surface plus steady wind
        </text>

        {showDeflation ? (
          <g>
            <path d="M 52 258 C 94 240, 142 244, 174 262 C 136 282, 82 284, 52 258 Z" fill="#3f2d1b" opacity="0.78" />
            <path d="M 76 232 C 104 210, 140 204, 174 198" stroke="#fde68a" strokeWidth="3" strokeDasharray="5 7" fill="none" />
            {[94, 112, 134, 154].map((x, index) => (
              <circle key={x} cx={x} cy={224 - index * 7} r="4" fill="#fef3c7" filter="url(#aeolianDustBlur)" />
            ))}
            <text x="88" y="292" fill="#fff7ed" fontSize="10" fontWeight="900">
              deflation removes fine material
            </text>
          </g>
        ) : null}

        {showAbrasion ? (
          <g>
            <path d="M 260 198 C 248 212, 250 238, 268 248 C 286 238, 288 212, 276 198 Z" fill="#57534e" />
            <path d="M 244 186 C 254 166, 288 166, 300 186 C 292 202, 252 204, 244 186 Z" fill="#78716c" />
            {[214, 230, 246].map((x, index) => (
              <path key={x} d={`M ${x} ${206 + index * 10} L ${x + 48} ${196 + index * 8}`} stroke="#fef3c7" strokeWidth="2" strokeDasharray="3 5" />
            ))}
            <text x="236" y="268" fill="#fff7ed" fontSize="10" fontWeight="900">
              abrasion carves mushroom rock
            </text>
          </g>
        ) : null}

        {showTransport ? (
          <g>
            <path d="M 18 176 C 76 154, 132 176, 198 154 C 254 134, 318 148, 392 118" stroke="#fff7ed" strokeWidth="3" strokeDasharray="7 7" fill="none" />
            <path d="M 22 238 C 64 216, 108 240, 152 218 C 196 198, 232 214, 270 196" stroke="#fed7aa" strokeWidth="3" strokeDasharray="4 7" fill="none" />
            {[38, 70, 104, 142, 184, 230, 282, 332].map((x, index) => (
              <circle key={x} cx={x} cy={170 + (index % 3) * 8} r="3" fill="#fffbeb" opacity="0.82" />
            ))}
            {[52, 84, 116, 150, 188, 226].map((x, index) => (
              <circle key={x} cx={x} cy={238 - (index % 2) * 13} r="4" fill="#fde68a" opacity="0.92" />
            ))}
            <text x="210" y="132" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              saltation and suspension move sand and dust
            </text>
          </g>
        ) : null}

        {showDune ? (
          <g>
            <path d="M 118 248 C 178 190, 258 202, 328 252 C 262 266, 188 270, 118 248 Z" fill="url(#aeolianDuneShadeGradient)" opacity="0.95" />
            <path d="M 158 244 C 200 206, 250 210, 306 248" stroke="#fff7ed" strokeWidth="3" fill="none" />
            <path d="M 252 208 L 308 248 L 260 254 Z" fill="#78350f" opacity="0.48" />
            <text x="214" y="230" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              dune forms where wind loses energy
            </text>
          </g>
        ) : null}

        {showBarchan ? (
          <g>
            <path d="M 148 198 C 202 164, 274 170, 322 204 C 290 196, 270 212, 248 224 C 218 240, 184 232, 148 198 Z" fill="#facc15" opacity="0.9" />
            <path d="M 148 198 C 130 214, 114 226, 96 232" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
            <path d="M 322 204 C 346 212, 362 224, 382 238" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
            <text x="214" y="170" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              barchan horns point downwind
            </text>
            <text x="352" y="246" fill="#fff7ed" fontSize="9" fontWeight="900">
              downwind
            </text>
          </g>
        ) : null}

        {showYardang ? (
          <g>
            <path d="M 54 182 C 94 158, 158 158, 198 182 C 152 196, 92 198, 54 182 Z" fill="#57534e" opacity="0.94" />
            <path d="M 70 192 C 114 174, 162 176, 190 190" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" />
            <path d="M 236 198 C 252 182, 306 182, 322 198 C 306 212, 252 214, 236 198 Z" fill="#44403c" opacity="0.95" />
            <text x="124" y="154" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              yardang aligns with prevailing wind
            </text>
            <text x="278" y="178" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              resistant ridge
            </text>
          </g>
        ) : null}

        {showLoess ? (
          <g>
            <path d="M 296 78 C 330 94, 360 112, 390 130" stroke="#fffbeb" strokeWidth="8" strokeLinecap="round" opacity="0.42" filter="url(#aeolianDustBlur)" />
            <path d="M 302 252 C 332 232, 372 236, 420 218 L 420 272 C 376 286, 332 280, 302 252 Z" fill="#fef08a" opacity="0.68" />
            <text x="338" y="207" fill="#1f2937" fontSize="10" fontWeight="900">
              loess blankets fertile downwind plains
            </text>
          </g>
        ) : null}

        {showDesertification ? (
          <g>
            <path d="M 42 304 C 104 284, 174 288, 232 306" stroke="#7f1d1d" strokeWidth="5" strokeDasharray="7 7" fill="none" />
            {[54, 82, 132].map((x, index) => (
              <g key={x}>
                <path d={`M ${x} 284 L ${x + 5} ${270 - index * 4}`} stroke="#166534" strokeWidth="3" strokeLinecap="round" />
                <path d={`M ${x + 5} ${270 - index * 4} C ${x - 4} ${268 - index * 3}, ${x - 6} ${276 - index * 2}, ${x + 5} ${278 - index * 3}`} fill="#22c55e" />
                <path d={`M ${x + 5} ${270 - index * 4} C ${x + 16} ${268 - index * 3}, ${x + 18} ${276 - index * 2}, ${x + 5} ${278 - index * 3}`} fill="#16a34a" />
              </g>
            ))}
            <rect x="36" y="24" width="220" height="52" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="146" y="45" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              desertification risk rises when vegetation cover falls
            </text>
            <text x="146" y="62" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              exposed soil gives wind more material
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="48" y="86" width="324" height="66" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="112" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: deserts are not only sand dunes
            </text>
            <text x="210" y="130" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              include deflation, abrasion, yardangs, loess and risk
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="38" y="80" width="344" height="142" rx="12" fill="#064e3b" opacity="0.98" />
            <text x="210" y="112" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="140" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">wind speed plus dry exposed sediment starts erosion</text>
            <text x="210" y="162" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">saltation and suspension move sand and dust</text>
            <text x="210" y="186" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">wind erodes, transports and deposits depending on energy and cover</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Erode", "Deflation removes fines; abrasion carves rock."],
          ["Transport", "Saltation moves sand; suspension moves dust."],
          ["Deposit", "Dunes and loess form when wind energy falls."],
          ["Manage", "Vegetation cover reduces desertification risk."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoastalLandformsPreview({ frameIndex }: { frameIndex: number }) {
  const showRefraction = frameIndex >= 1;
  const showErosion = frameIndex >= 2;
  const showPlatform = frameIndex >= 3;
  const showCaveStack = frameIndex >= 4;
  const showHeadlandBay = frameIndex >= 5;
  const showLongshore = frameIndex >= 6;
  const showDeposition = frameIndex >= 7;
  const showLagoon = frameIndex >= 8;
  const showRisk = frameIndex >= 9;
  const showTrap = frameIndex >= 10;
  const showProof = frameIndex >= 11;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#082f49] via-[#0f766e] to-[#f5d08a] p-4 text-white shadow-inner"
    >
      <div
        data-testid="coastal-landforms-marine-erosion-deposition-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Waves erode, transport and deposit
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Headlands focus wave energy
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Longshore drift builds spits and bars
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Coastal landforms marine erosion and deposition preview">
        <defs>
          <linearGradient id="coastalSeaGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="54%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="coastalLandGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="48%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="coastalCliffGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="56%" stopColor="#57534e" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="330" fill="url(#coastalSeaGradient)" />
        {[22, 66, 110, 154, 198, 242, 286, 330].map((x, index) => (
          <path
            key={x}
            d={`M ${x} ${62 + (index % 3) * 28} C ${x + 30} ${50 + (index % 3) * 28}, ${x + 62} ${74 + (index % 2) * 20}, ${x + 100} ${58 + (index % 3) * 24}`}
            stroke="#e0f2fe"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity={0.72 - index * 0.04}
          />
        ))}

        <path d="M 212 0 C 244 38, 232 84, 270 120 C 318 166, 280 228, 420 248 L 420 330 L 188 330 C 170 286, 184 240, 154 210 C 118 174, 136 118, 174 88 C 202 66, 180 30, 212 0 Z" fill="url(#coastalLandGradient)" />
        <path d="M 210 16 C 236 48, 226 86, 256 120 C 284 150, 268 188, 292 214 C 320 244, 360 248, 420 260" stroke="#fff7ed" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.82" />
        <path d="M 176 90 C 222 96, 258 126, 270 156 C 238 154, 208 146, 178 130 C 158 118, 158 98, 176 90 Z" fill="url(#coastalCliffGradient)" opacity="0.96" />
        <text x="294" y="46" fill="#1f2937" fontSize="10" fontWeight="900">
          hard and soft rocks meet wave energy
        </text>

        {showRefraction ? (
          <g>
            <path d="M 24 98 C 72 82, 122 88, 174 112" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 32 126 C 82 112, 132 124, 174 146" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 170 112 L 154 102 L 156 120 Z" fill="#e0f2fe" />
            <path d="M 172 146 L 154 136 L 156 154 Z" fill="#e0f2fe" />
            <text x="112" y="80" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              wave refraction concentrates energy on headlands
            </text>
          </g>
        ) : null}

        {showErosion ? (
          <g>
            <path d="M 176 116 C 198 118, 220 130, 236 150" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 6" fill="none" />
            <circle cx="196" cy="126" r="4" fill="#fef3c7" />
            <circle cx="212" cy="136" r="3.5" fill="#fef3c7" />
            <circle cx="228" cy="148" r="3" fill="#fef3c7" />
            <text x="214" y="176" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              hydraulic action and abrasion cut cliffs
            </text>
          </g>
        ) : null}

        {showPlatform ? (
          <g>
            <path d="M 162 156 C 196 168, 236 174, 270 168" stroke="#fde68a" strokeWidth="8" strokeLinecap="round" />
            <path d="M 154 154 L 178 164 L 160 174 Z" fill="#292524" opacity="0.85" />
            <path d="M 170 184 C 206 194, 248 192, 286 180" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
            <text x="250" y="201" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              wave-cut platform marks cliff retreat
            </text>
          </g>
        ) : null}

        {showCaveStack ? (
          <g>
            <path d="M 150 104 C 170 82, 204 84, 218 108 C 204 102, 180 102, 168 120 Z" fill="#44403c" stroke="#fef3c7" strokeWidth="2" />
            <path d="M 182 112 C 190 96, 212 98, 224 116 C 210 118, 196 122, 182 112 Z" fill="#082f49" />
            <path d="M 244 122 C 266 118, 280 132, 278 154 C 270 168, 250 164, 244 146 Z" fill="#57534e" />
            <path d="M 302 162 C 316 142, 344 150, 342 180 C 326 190, 308 184, 302 162 Z" fill="#44403c" />
            <text x="208" y="86" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              cave to arch to stack sequence
            </text>
          </g>
        ) : null}

        {showHeadlandBay ? (
          <g>
            <path d="M 280 220 C 310 194, 350 196, 384 224 C 356 238, 316 238, 280 220 Z" fill="#38bdf8" opacity="0.74" />
            <path d="M 232 82 C 258 104, 270 134, 268 162" stroke="#7f1d1d" strokeWidth="5" strokeLinecap="round" />
            <text x="322" y="252" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              bays form where softer rock erodes faster
            </text>
            <text x="245" y="76" fill="#fff7ed" fontSize="10" fontWeight="900">
              headland
            </text>
          </g>
        ) : null}

        {showLongshore ? (
          <g>
            <path d="M 96 246 L 146 220 L 196 242 L 248 216 L 300 238" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 7" fill="none" />
            <path d="M 300 238 L 284 228 L 286 248 Z" fill="#fef3c7" />
            <path d="M 110 262 L 154 262 L 154 274 L 110 274 Z" fill="#fbbf24" opacity="0.9" />
            <text x="198" y="214" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              longshore drift moves sediment along coast
            </text>
          </g>
        ) : null}

        {showDeposition ? (
          <g>
            <path d="M 236 250 C 286 244, 326 250, 374 274" stroke="#facc15" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 302 260 C 328 272, 356 288, 390 294" stroke="#fde68a" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M 348 278 C 366 264, 390 260, 410 268" stroke="#fef3c7" strokeWidth="5" strokeLinecap="round" fill="none" />
            <text x="314" y="304" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              beach, spit and bar are deposition features
            </text>
          </g>
        ) : null}

        {showLagoon ? (
          <g>
            <ellipse cx="348" cy="250" rx="38" ry="18" fill="#67e8f9" opacity="0.75" />
            {[318, 334, 366, 384].map((x, index) => (
              <g key={x}>
                <path d={`M ${x} 244 L ${x + (index % 2 === 0 ? -7 : 7)} 226`} stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
                <circle cx={x + (index % 2 === 0 ? -8 : 8)} cy="224" r="5" fill="#22c55e" />
              </g>
            ))}
            <text x="332" y="218" textAnchor="middle" fill="#052e16" fontSize="10" fontWeight="900">
              lagoons and mangroves buffer coast
            </text>
          </g>
        ) : null}

        {showRisk ? (
          <g>
            <path d="M 22 184 C 82 154, 132 178, 196 150 C 240 132, 282 138, 334 116" stroke="#fecaca" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M 330 116 L 312 108 L 316 128 Z" fill="#fecaca" />
            <rect x="42" y="24" width="214" height="56" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="149" y="46" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              erosion risk rises with storms and sea-level change
            </text>
            <text x="149" y="64" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              exposure plus degraded buffers increases loss
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="88" width="332" height="68" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: coasts are not only erosion
            </text>
            <text x="210" y="134" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              waves erode, transport, deposit and interact with buffers
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="34" y="78" width="352" height="148" rx="12" fill="#064e3b" opacity="0.98" />
            <text x="210" y="110" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="138" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">wave refraction focuses energy on hard-rock headlands</text>
            <text x="210" y="160" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">longshore drift moves sediment until deposition builds spits and bars</text>
            <text x="210" y="184" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">coastal landforms depend on rock type, wave energy, sediment supply and sea-level change</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Erode", "Refraction focuses waves; cliffs retreat."],
          ["Shape", "Hard rock forms headlands; soft rock forms bays."],
          ["Move", "Swash and backwash create longshore drift."],
          ["Deposit", "Beaches, spits, bars, lagoons and buffers form."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KarstTopographyPreview({ frameIndex }: { frameIndex: number }) {
  const showCarbonation = frameIndex >= 1;
  const showDissolution = frameIndex >= 2;
  const showSinkhole = frameIndex >= 3;
  const showDisappearingStream = frameIndex >= 4;
  const showCave = frameIndex >= 5;
  const showSpeleothems = frameIndex >= 6;
  const showAquifer = frameIndex >= 7;
  const showSpring = frameIndex >= 8;
  const showTowerRisk = frameIndex >= 9;
  const showTrap = frameIndex >= 10;
  const showProof = frameIndex >= 11;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#172554] via-[#334155] to-[#14532d] p-4 text-white shadow-inner"
    >
      <div
        data-testid="karst-topography-groundwater-landforms-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Carbonation dissolves limestone
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Groundwater creates caves and springs
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Karst risk needs land-use control
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Karst topography groundwater and limestone landforms preview">
        <defs>
          <linearGradient id="karstSurfaceGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="52%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#365314" />
          </linearGradient>
          <linearGradient id="karstLimestoneGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="54%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="karstWaterGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="330" fill="#0f172a" />
        <path d="M 0 98 C 58 78, 118 88, 176 76 C 248 60, 318 72, 420 52 L 420 136 L 0 136 Z" fill="url(#karstSurfaceGradient)" />
        <path d="M 0 136 L 420 136 L 420 330 L 0 330 Z" fill="url(#karstLimestoneGradient)" />
        <path d="M 0 220 C 84 206, 160 214, 238 204 C 310 194, 362 204, 420 190 L 420 330 L 0 330 Z" fill="#334155" opacity="0.58" />
        <text x="210" y="38" textAnchor="middle" fill="#dcfce7" fontSize="10" fontWeight="900">
          rain plus carbon dioxide plus limestone creates karst
        </text>

        {[42, 92, 144, 196, 248, 300, 352].map((x, index) => (
          <g key={x} opacity={0.84 - index * 0.04}>
            <path d={`M ${x} 24 L ${x - 12} 58`} stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M ${x - 12} 58 L ${x - 18} 48 L ${x - 6} 48 Z`} fill="#bfdbfe" />
          </g>
        ))}

        <path d="M 128 136 L 116 326" stroke="#1e293b" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M 220 136 L 194 326" stroke="#1e293b" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M 302 136 L 322 326" stroke="#1e293b" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M 0 174 L 420 174" stroke="#64748b" strokeWidth="2" strokeDasharray="10 8" opacity="0.8" />

        {showCarbonation ? (
          <g>
            <circle cx="90" cy="86" r="20" fill="#0f766e" opacity="0.9" />
            <text x="90" y="82" textAnchor="middle" fill="#ecfeff" fontSize="9" fontWeight="900">
              CO2
            </text>
            <text x="90" y="97" textAnchor="middle" fill="#ecfeff" fontSize="8" fontWeight="800">
              + H2O
            </text>
            <path d="M 104 96 C 126 112, 144 122, 166 136" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" fill="none" />
            <text x="194" y="118" fill="#ecfeff" fontSize="10" fontWeight="900">
              carbonic acid forms in soil water
            </text>
          </g>
        ) : null}

        {showDissolution ? (
          <g>
            <path d="M 122 146 C 154 164, 178 184, 210 198 C 242 212, 278 208, 316 186" stroke="#67e8f9" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.86" />
            <path d="M 132 154 C 168 174, 194 190, 226 198" stroke="#cffafe" strokeWidth="2.5" strokeDasharray="5 6" fill="none" />
            <circle cx="128" cy="146" r="7" fill="#bae6fd" />
            <circle cx="220" cy="198" r="7" fill="#bae6fd" />
            <circle cx="314" cy="186" r="7" fill="#bae6fd" />
            <text x="224" y="226" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="900">
              solution widens joints and bedding planes
            </text>
          </g>
        ) : null}

        {showSinkhole ? (
          <g>
            <path d="M 128 104 C 156 98, 184 102, 204 116 C 184 136, 150 140, 122 120 Z" fill="#3f2d1b" opacity="0.94" />
            <path d="M 142 120 C 160 134, 184 132, 198 118" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <text x="156" y="91" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              sinkhole forms by solution or collapse
            </text>
          </g>
        ) : null}

        {showDisappearingStream ? (
          <g>
            <path d="M 28 96 C 62 92, 92 104, 124 116 C 142 123, 160 124, 178 118" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 178 118 C 174 138, 166 154, 154 170" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="178" cy="118" r="11" fill="#082f49" />
            <text x="88" y="130" fill="#ecfeff" fontSize="10" fontWeight="900">
              stream disappears into swallow hole
            </text>
          </g>
        ) : null}

        {showCave ? (
          <g>
            <path d="M 86 236 C 134 202, 190 212, 230 236 C 268 258, 326 246, 368 218 C 360 284, 112 292, 86 236 Z" fill="#020617" opacity="0.92" />
            <path d="M 106 242 C 148 224, 198 232, 236 250 C 274 268, 318 250, 350 230" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" fill="none" />
            <text x="220" y="210" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="900">
              caves grow along underground conduits
            </text>
          </g>
        ) : null}

        {showSpeleothems ? (
          <g>
            {[132, 178, 248, 300].map((x, index) => (
              <path key={x} d={`M ${x} ${226 + (index % 2) * 5} L ${x - 9} ${254 + (index % 2) * 8} L ${x + 8} ${254 + (index % 2) * 8} Z`} fill="#fef3c7" />
            ))}
            {[156, 214, 278].map((x, index) => (
              <path key={x} d={`M ${x} 286 L ${x - 9} ${262 - (index % 2) * 6} L ${x + 8} ${262 - (index % 2) * 6} Z`} fill="#fde68a" />
            ))}
            <text x="210" y="304" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              stalactites hang and stalagmites rise
            </text>
          </g>
        ) : null}

        {showAquifer ? (
          <g>
            <path d="M 34 286 C 92 266, 144 276, 202 264 C 258 252, 314 256, 386 236" stroke="url(#karstWaterGradient)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
            <path d="M 386 236 L 368 228 L 372 248 Z" fill="#67e8f9" />
            <text x="196" y="250" textAnchor="middle" fill="#ecfeff" fontSize="10" fontWeight="900">
              karst aquifer moves water rapidly
            </text>
          </g>
        ) : null}

        {showSpring ? (
          <g>
            <path d="M 344 202 C 368 194, 390 198, 414 188" stroke="#67e8f9" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 386 210 C 398 214, 410 214, 420 208 L 420 238 C 396 242, 372 232, 360 218 Z" fill="#38bdf8" opacity="0.72" />
            <text x="322" y="190" textAnchor="middle" fill="#ecfeff" fontSize="10" fontWeight="900">
              spring marks groundwater resurgence
            </text>
          </g>
        ) : null}

        {showTowerRisk ? (
          <g>
            <path d="M 56 126 C 72 88, 104 88, 118 126 L 112 184 C 96 196, 72 194, 60 180 Z" fill="#e2e8f0" opacity="0.95" />
            <path d="M 284 112 C 308 76, 352 82, 366 122 L 350 196 C 326 214, 294 204, 280 176 Z" fill="#cbd5e1" opacity="0.94" />
            <rect x="42" y="26" width="230" height="52" rx="10" fill="#7f1d1d" opacity="0.92" />
            <text x="157" y="46" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              tower karst remains after deep solution
            </text>
            <text x="157" y="64" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
              collapse and contamination risk need planning
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="44" y="88" width="332" height="68" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: karst is not only caves
            </text>
            <text x="210" y="134" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              it includes chemistry, sinkholes, underground drainage and springs
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="30" y="78" width="360" height="150" rx="12" fill="#064e3b" opacity="0.98" />
            <text x="210" y="110" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="138" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">rainwater plus carbon dioxide dissolves limestone along cracks</text>
            <text x="210" y="160" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">surface streams sink, caves grow, and springs return water</text>
            <text x="210" y="184" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">karst depends on rainfall, carbon dioxide, limestone, fractures and groundwater flow</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Chemistry", "Carbonation turns water into a dissolving agent."],
          ["Structure", "Joints and bedding planes guide solution."],
          ["Drainage", "Streams sink into caves and aquifers."],
          ["Risk", "Collapse and contamination need land-use control."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoilFormationPreview({ frameIndex }: { frameIndex: number }) {
  const showParent = frameIndex >= 1;
  const showClimate = frameIndex >= 2;
  const showHumus = frameIndex >= 3;
  const showRelief = frameIndex >= 4;
  const showTime = frameIndex >= 5;
  const showTopsoil = frameIndex >= 6;
  const showTranslocation = frameIndex >= 7;
  const showProfile = frameIndex >= 8;
  const showLaterisation = frameIndex >= 9;
  const showConservation = frameIndex >= 10;
  const showTrap = frameIndex >= 11;
  const showProof = frameIndex >= 12;

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#1f2937] via-[#365314] to-[#78350f] p-4 text-white shadow-inner"
    >
      <div
        data-testid="soil-formation-soil-profile-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Soil forms through five factors
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Horizons record movement of material
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Topsoil protection keeps fertility
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Soil formation and soil profile preview">
        <defs>
          <linearGradient id="soilSkyGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="54%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>
          <linearGradient id="soilProfileGradient" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#3f2d1b" />
            <stop offset="33%" stopColor="#8b5a2b" />
            <stop offset="67%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78716c" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="330" fill="url(#soilSkyGradient)" />
        <path d="M 0 114 C 64 94, 128 102, 194 92 C 268 80, 344 92, 420 72 L 420 330 L 0 330 Z" fill="#3f6212" opacity="0.92" />
        <rect x="82" y="128" width="250" height="184" rx="16" fill="url(#soilProfileGradient)" stroke="#fef3c7" strokeWidth="3" />
        <path d="M 84 166 L 330 166" stroke="#fef3c7" strokeWidth="2" strokeDasharray="8 7" opacity="0.85" />
        <path d="M 84 214 L 330 214" stroke="#fef3c7" strokeWidth="2" strokeDasharray="8 7" opacity="0.78" />
        <path d="M 84 262 L 330 262" stroke="#fef3c7" strokeWidth="2" strokeDasharray="8 7" opacity="0.68" />
        <text x="210" y="42" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
          parent material, climate, organisms, relief and time create soil
        </text>

        {[54, 124, 194, 264, 334].map((x, index) => (
          <g key={x}>
            <path d={`M ${x} 34 L ${x - 8} 80`} stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" opacity={0.72 - index * 0.04} />
            <path d={`M ${x - 8} 80 L ${x - 14} 70 L ${x - 2} 70 Z`} fill="#2563eb" opacity="0.75" />
          </g>
        ))}

        {showParent ? (
          <g>
            <path d="M 102 286 C 132 270, 166 280, 192 264 C 222 246, 262 264, 306 248" stroke="#44403c" strokeWidth="7" strokeLinecap="round" fill="none" />
            {[120, 154, 208, 254, 292].map((x, index) => (
              <circle key={x} cx={x} cy={282 - (index % 3) * 10} r="8" fill="#57534e" stroke="#f8fafc" strokeWidth="1.5" />
            ))}
            <text x="210" y="304" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              parent material weathers into regolith
            </text>
          </g>
        ) : null}

        {showClimate ? (
          <g>
            <circle cx="56" cy="74" r="20" fill="#f59e0b" opacity="0.9" />
            <path d="M 350 36 C 372 36, 386 46, 390 62 C 370 68, 344 66, 326 58 C 330 44, 338 38, 350 36 Z" fill="#e0f2fe" opacity="0.9" />
            <path d="M 332 72 L 320 102 M 358 72 L 346 104 M 382 72 L 370 102" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
            <path d="M 112 130 C 160 148, 220 150, 288 132" stroke="#67e8f9" strokeWidth="4" strokeDasharray="7 7" fill="none" />
            <text x="210" y="116" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              climate controls weathering, leaching and moisture
            </text>
          </g>
        ) : null}

        {showHumus ? (
          <g>
            <path d="M 94 132 C 146 120, 214 126, 328 128 L 328 164 L 92 164 Z" fill="#1c1917" opacity="0.9" />
            {[118, 158, 220, 278].map((x, index) => (
              <g key={x}>
                <path d={`M ${x} 126 L ${x + (index % 2 === 0 ? -8 : 8)} 96`} stroke="#14532d" strokeWidth="4" strokeLinecap="round" />
                <circle cx={x + (index % 2 === 0 ? -10 : 10)} cy="94" r="8" fill="#22c55e" />
              </g>
            ))}
            <text x="210" y="154" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              organisms add humus to topsoil
            </text>
          </g>
        ) : null}

        {showRelief ? (
          <g>
            <path d="M 20 268 C 78 210, 126 202, 174 226" stroke="#fef3c7" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 36 240 C 72 252, 98 260, 124 280" stroke="#7f1d1d" strokeWidth="4" strokeDasharray="6 6" fill="none" />
            <text x="90" y="202" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              steep slope loses thin soil
            </text>
          </g>
        ) : null}

        {showTime ? (
          <g>
            <path d="M 334 126 C 384 166, 384 244, 334 292" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 334 292 L 330 272 L 348 282 Z" fill="#fde68a" />
            <text x="358" y="206" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="900">
              time separates horizons
            </text>
          </g>
        ) : null}

        {showTopsoil ? (
          <g>
            <rect x="96" y="136" width="222" height="30" rx="8" fill="#1c1917" opacity="0.94" />
            <text x="207" y="156" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">
              A horizon topsoil holds humus, roots and biota
            </text>
          </g>
        ) : null}

        {showTranslocation ? (
          <g>
            {[142, 188, 236, 282].map((x, index) => (
              <g key={x}>
                <path d={`M ${x} 158 C ${x - 8} 178, ${x + 10} 194, ${x} 218`} stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d={`M ${x} 218 L ${x - 8} 204 L ${x + 8} 204 Z`} fill="#67e8f9" />
                <circle cx={x + 12} cy={190 + (index % 2) * 10} r="4" fill="#fef3c7" />
              </g>
            ))}
            <text x="210" y="236" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              eluviation removes above, illuviation accumulates below
            </text>
          </g>
        ) : null}

        {showProfile ? (
          <g>
            <text x="64" y="154" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">A</text>
            <text x="64" y="197" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">B</text>
            <text x="64" y="246" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">C</text>
            <text x="64" y="292" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="900">R</text>
            <text x="210" y="198" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              B horizon stores clay, iron and minerals
            </text>
            <text x="210" y="252" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              C horizon is weathered parent material
            </text>
          </g>
        ) : null}

        {showLaterisation ? (
          <g>
            <rect x="106" y="174" width="204" height="54" rx="10" fill="#b91c1c" opacity="0.78" />
            <path d="M 132 132 C 158 150, 188 164, 224 174 C 250 182, 276 190, 298 204" stroke="#60a5fa" strokeWidth="5" strokeDasharray="7 7" fill="none" />
            <text x="208" y="202" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">
              laterisation: heavy leaching leaves iron and aluminium
            </text>
          </g>
        ) : null}

        {showConservation ? (
          <g>
            <path d="M 22 276 C 78 252, 126 258, 172 282" stroke="#7f1d1d" strokeWidth="5" strokeDasharray="7 7" fill="none" />
            <path d="M 30 250 L 156 224 M 44 272 L 176 244" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
            {[44, 76, 112, 148].map((x) => (
              <path key={x} d={`M ${x} 244 L ${x + 8} 224`} stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            ))}
            <text x="116" y="306" textAnchor="middle" fill="#fff7ed" fontSize="10" fontWeight="900">
              contour bunds and vegetation reduce topsoil loss
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="42" y="88" width="336" height="72" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: soil is not just broken rock
            </text>
            <text x="210" y="136" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              soil includes minerals, humus, water, air, organisms and horizons
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="28" y="76" width="364" height="154" rx="12" fill="#064e3b" opacity="0.98" />
            <text x="210" y="108" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="136" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">parent material plus climate and organisms builds soil</text>
            <text x="210" y="160" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">leaching and translocation create A, B and C horizons</text>
            <text x="210" y="186" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">soil formation links factors, horizons, fertility, erosion and conservation</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Factors", "Parent material, climate, organisms, relief and time."],
          ["Profile", "A, B, C horizons develop through movement."],
          ["Fertility", "Humus and minerals decide productivity."],
          ["Protection", "Topsoil loss needs conservation control."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanetComparisonPreview({ frameIndex }: { frameIndex: number }) {
  const showTerrestrial = frameIndex >= 1;
  const showJovian = frameIndex >= 2;
  const showDensity = frameIndex >= 3;
  const showSize = frameIndex >= 4;
  const showAtmosphere = frameIndex >= 5;
  const showRings = frameIndex >= 6;
  const showOrbit = frameIndex >= 7;
  const showEarth = frameIndex >= 8;
  const showTemperature = frameIndex >= 9;
  const showTrap = frameIndex >= 10;
  const showProof = frameIndex >= 11;

  const planets = [
    { name: "Mercury", x: 66, r: 6, color: "#94a3b8" },
    { name: "Venus", x: 104, r: 9, color: "#f59e0b" },
    { name: "Earth", x: 148, r: 10, color: "#2563eb" },
    { name: "Mars", x: 190, r: 8, color: "#dc2626" },
    { name: "Jupiter", x: 250, r: 20, color: "#d97706" },
    { name: "Saturn", x: 304, r: 18, color: "#facc15" },
    { name: "Uranus", x: 354, r: 14, color: "#67e8f9" },
    { name: "Neptune", x: 392, r: 14, color: "#1d4ed8" },
  ];

  return (
    <div
      data-testid="geography-animation-visual-preview"
      className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-[#020617] via-[#172554] to-[#312e81] p-4 text-white shadow-inner"
    >
      <div
        data-testid="planet-comparison-terrestrial-jovian-scene"
        className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Inner rocky, outer giant pattern
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Density and composition explain contrast
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
          Rings and satellites cluster outside
        </span>
      </div>

      <svg viewBox="0 0 420 330" className="relative z-10 h-[320px] w-full" role="img" aria-label="Planet comparison terrestrial and Jovian planets preview">
        <defs>
          <radialGradient id="planetSunGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="56%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <linearGradient id="planetHeatGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="330" fill="#020617" />
        {Array.from({ length: 58 }).map((_, index) => (
          <circle
            key={index}
            cx={(index * 47) % 420}
            cy={(index * 31) % 320}
            r={index % 5 === 0 ? 1.7 : 1}
            fill="#dbeafe"
            opacity={0.18 + (index % 4) * 0.08}
          />
        ))}

        <circle cx="24" cy="160" r="28" fill="url(#planetSunGradient)" />
        <path d="M 44 150 C 102 122, 178 116, 252 126 C 322 136, 374 148, 414 162" stroke="url(#planetHeatGradient)" strokeWidth="20" strokeLinecap="round" opacity="0.28" />
        <line x1="48" y1="160" x2="410" y2="160" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="7 9" opacity="0.5" />
        <rect x="214" y="118" width="10" height="84" rx="5" fill="#94a3b8" opacity="0.55" />
        <text x="219" y="112" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="900">
          asteroid belt
        </text>

        {planets.map((planet) => (
          <g key={planet.name}>
            <circle cx={planet.x} cy="160" r={planet.r} fill={planet.color} />
            <text x={planet.x} y={196 + (planet.r > 14 ? 10 : 0)} textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="900">
              {planet.name}
            </text>
          </g>
        ))}
        <ellipse cx="304" cy="160" rx="30" ry="7" fill="none" stroke="#fde68a" strokeWidth="3" opacity="0.78" />
        <text x="214" y="44" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
          eight-planet order starts with distance from the Sun
        </text>

        {showTerrestrial ? (
          <g>
            <rect x="48" y="214" width="160" height="40" rx="10" fill="#064e3b" opacity="0.92" />
            <path d="M 54 182 C 96 206, 154 208, 196 184" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none" />
            <text x="128" y="238" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">
              Mercury to Mars are terrestrial planets
            </text>
          </g>
        ) : null}

        {showJovian ? (
          <g>
            <rect x="232" y="214" width="166" height="40" rx="10" fill="#1e3a8a" opacity="0.92" />
            <path d="M 240 188 C 286 212, 354 212, 402 186" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" fill="none" />
            <text x="315" y="238" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
              Jupiter to Neptune are Jovian planets
            </text>
          </g>
        ) : null}

        {showDensity ? (
          <g>
            <rect x="54" y="74" width="312" height="54" rx="10" fill="#111827" opacity="0.92" />
            <rect x="78" y="102" width="118" height="10" rx="5" fill="#f97316" />
            <rect x="228" y="102" width="70" height="10" rx="5" fill="#60a5fa" />
            <text x="137" y="94" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              rocky planets are denser and smaller
            </text>
            <text x="262" y="94" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
              giants are larger but less dense
            </text>
          </g>
        ) : null}

        {showSize ? (
          <g>
            <circle cx="256" cy="160" r="25" fill="none" stroke="#fef3c7" strokeWidth="3" />
            <circle cx="66" cy="160" r="10" fill="none" stroke="#fef3c7" strokeWidth="2" />
            <text x="276" y="130" fill="#fef3c7" fontSize="10" fontWeight="900">
              Jupiter largest
            </text>
            <text x="50" y="136" fill="#fef3c7" fontSize="10" fontWeight="900">
              Mercury smallest
            </text>
          </g>
        ) : null}

        {showAtmosphere ? (
          <g>
            <circle cx="104" cy="160" r="18" fill="none" stroke="#fbbf24" strokeWidth="4" opacity="0.82" />
            <path d="M 82 134 C 102 112, 132 124, 136 150" stroke="#f97316" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="54" y="258" width="312" height="42" rx="10" fill="#7c2d12" opacity="0.93" />
            <text x="210" y="283" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900">
              Venus is hottest because of strong greenhouse effect
            </text>
          </g>
        ) : null}

        {showRings ? (
          <g>
            <ellipse cx="250" cy="160" rx="34" ry="9" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.75" />
            <ellipse cx="354" cy="160" rx="22" ry="6" fill="none" stroke="#cffafe" strokeWidth="2" opacity="0.75" />
            {[236, 274, 290, 322, 338, 374, 398].map((x, index) => (
              <circle key={x} cx={x} cy={128 + (index % 3) * 12} r="3" fill="#dbeafe" />
            ))}
            <text x="312" y="112" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="900">
              rings and many moons dominate outer planets
            </text>
          </g>
        ) : null}

        {showOrbit ? (
          <g>
            <path d="M 58 160 C 58 82, 146 54, 222 72 C 326 98, 404 110, 404 160 C 404 214, 326 246, 222 248 C 122 250, 58 220, 58 160 Z" fill="none" stroke="#93c5fd" strokeWidth="3" strokeDasharray="8 8" opacity="0.84" />
            <path d="M 404 160 L 388 150 L 390 170 Z" fill="#93c5fd" />
            <text x="214" y="268" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900">
              orbital period increases with distance
            </text>
          </g>
        ) : null}

        {showEarth ? (
          <g>
            <circle cx="148" cy="160" r="18" fill="none" stroke="#22c55e" strokeWidth="4" />
            <path d="M 126 128 C 146 112, 174 118, 188 138" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
            <text x="154" y="116" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="900">
              Earth stays in liquid-water habitability zone
            </text>
          </g>
        ) : null}

        {showTemperature ? (
          <g>
            <path d="M 50 70 L 382 70" stroke="#f97316" strokeWidth="8" strokeLinecap="round" opacity="0.72" />
            <path d="M 382 70 L 364 58 L 364 82 Z" fill="#f97316" opacity="0.72" />
            <text x="216" y="62" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="900">
              distance from Sun controls energy received
            </text>
            <text x="216" y="88" textAnchor="middle" fill="#dbeafe" fontSize="9" fontWeight="800">
              atmosphere modifies the simple distance rule
            </text>
          </g>
        ) : null}

        {showTrap ? (
          <g>
            <rect x="38" y="86" width="344" height="74" rx="10" fill="#7f1d1d" opacity="0.96" />
            <text x="210" y="114" textAnchor="middle" fill="#fee2e2" fontSize="12" fontWeight="900">
              UPSC trap: Pluto is a dwarf planet, not one of the eight planets
            </text>
            <text x="210" y="136" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
              current planet count for this comparison is eight
            </text>
          </g>
        ) : null}

        {showProof ? (
          <g>
            <rect x="32" y="76" width="356" height="154" rx="12" fill="#064e3b" opacity="0.98" />
            <text x="210" y="108" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900">Proof checkpoint</text>
            <text x="210" y="136" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">inner rocky planets are small and dense</text>
            <text x="210" y="160" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">outer giants are large, low density, ringed and moon-rich</text>
            <text x="210" y="186" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900">planet comparison depends on distance, composition, mass, atmosphere and satellites</text>
          </g>
        ) : null}
      </svg>

      <div className="relative z-10 mt-3 grid gap-2 md:grid-cols-4">
        {[
          ["Order", "Mercury to Neptune, with asteroid belt between groups."],
          ["Type", "Inner rocky planets and outer gas or ice giants."],
          ["Facts", "Density, atmosphere, rings, moons and orbit vary."],
          ["Trap", "Pluto is a dwarf planet, not one of the eight."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimationPreview({ slug, frameIndex }: { slug: string; frameIndex: number }) {
  if (slug === "big-bang-expansion") return <BigBangPreview frameIndex={frameIndex} />;
  if (slug === "solar-system-formation") return <SolarSystemFormationPreview frameIndex={frameIndex} />;
  if (slug === "sun-structure-solar-energy") return <SunStructurePreview frameIndex={frameIndex} />;
  if (slug === "life-cycle-of-stars") return <StarLifeCyclePreview frameIndex={frameIndex} />;
  if (slug === "galaxy-formation") return <GalaxyFormationPreview frameIndex={frameIndex} />;
  if (slug === "earth-rotation-revolution") return <EarthRotationRevolutionPreview frameIndex={frameIndex} />;
  if (slug === "latitude-longitude-time") return <LatitudeLongitudeTimePreview frameIndex={frameIndex} />;
  if (slug === "heat-zones-earth") return <HeatZonesPreview frameIndex={frameIndex} />;
  if (slug === "tides-gravity-coast") return <TidesPreview frameIndex={frameIndex} />;
  if (slug === "earth-interior-plate-movement") return <EarthInteriorPreview frameIndex={frameIndex} />;
  if (slug === "volcanism-eruption-landforms") return <VolcanismPreview frameIndex={frameIndex} />;
  if (slug === "earthquakes-seismic-waves") return <EarthquakePreview frameIndex={frameIndex} />;
  if (slug === "tsunami-seafloor-coastal-impact") return <TsunamiPreview frameIndex={frameIndex} />;
  if (slug === "mountain-building-fold-fault") return <MountainBuildingPreview frameIndex={frameIndex} />;
  if (slug === "weathering-erosion-mass-wasting") return <WeatheringErosionPreview frameIndex={frameIndex} />;
  if (slug === "river-system-fluvial-landforms") return <RiverSystemPreview frameIndex={frameIndex} />;
  if (slug === "glacial-landforms-ice-erosion-deposition") return <GlacialLandformsPreview frameIndex={frameIndex} />;
  if (slug === "aeolian-landforms-wind-erosion-deposition") return <AeolianLandformsPreview frameIndex={frameIndex} />;
  if (slug === "coastal-landforms-marine-erosion-deposition") return <CoastalLandformsPreview frameIndex={frameIndex} />;
  if (slug === "karst-topography-groundwater-landforms") return <KarstTopographyPreview frameIndex={frameIndex} />;
  if (slug === "soil-formation-soil-profile") return <SoilFormationPreview frameIndex={frameIndex} />;
  if (slug === "planet-comparison-terrestrial-jovian") return <PlanetComparisonPreview frameIndex={frameIndex} />;
  if (slug === "moon-phases-eclipses") return <MoonEclipsePreview frameIndex={frameIndex} />;
  return <UniversePreview frameIndex={frameIndex} />;
}

export function GeographyAnimationStudio({ initialSlug }: { initialSlug?: string }) {
  const [activeSlug, setActiveSlug] = useState(initialSlug ?? geographyAnimationBlueprints[0].slug);
  const activeBlueprint = useMemo(() => getGeographyAnimationBlueprint(activeSlug), [activeSlug]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeFrame = activeBlueprint.frames[activeFrameIndex] ?? activeBlueprint.frames[0];
  const progress = Math.round(((activeFrameIndex + 1) / activeBlueprint.frames.length) * 100);

  useEffect(() => {
    setActiveFrameIndex(0);
    setIsPlaying(false);
  }, [activeSlug]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setActiveFrameIndex((current) => {
        if (current >= activeBlueprint.frames.length - 1) {
          window.clearInterval(interval);
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1400);
    return () => window.clearInterval(interval);
  }, [activeBlueprint.frames.length, isPlaying]);

  return (
    <div data-testid="geography-animation-studio" className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <Link
                href="/upsc/geography"
                className="mb-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dcd5c7] bg-white px-3 text-xs font-black text-[#1a3a2a] transition hover:bg-[#f7f4ee]"
              >
                <ArrowLeft className="h-4 w-4" />
                Geography command room
              </Link>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Universe first</Badge>
                <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                  Animation studio
                </Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">
                Geography Visual Intelligence Lab
              </h1>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#5d675f]">
                Build the content blueprint before choosing Remotion, HyperFrames, or Three.js. Each frame must carry one UPSC-relevant step in the mechanism.
              </p>
            </div>
            <div className="grid min-w-[220px] gap-2 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#085041]">
                <Sparkles className="h-4 w-4" />
                Frame QA standard
              </div>
              <p className="text-xs font-semibold leading-5 text-[#49675e]">
                Previous frame, next frame, UPSC trap, student proof. No decorative animation passes the gate.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Pilot blueprint</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Universe animation sequence</h2>
                </div>
                <Layers3 className="h-6 w-6 text-[#085041]" />
              </div>

              <div className="grid gap-2">
                {geographyAnimationBlueprints.map((blueprint) => {
                  const isActive = blueprint.slug === activeSlug;
                  return (
                    <button
                      key={blueprint.slug}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveSlug(blueprint.slug)}
                      className={cn(
                        "rounded-md border p-3 text-left transition",
                        isActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]",
                      )}
                    >
                      <span className="block text-sm font-black">{blueprint.title}</span>
                      <span className="mt-1 block text-xs font-semibold opacity-80">{blueprint.objective}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Animation standards</p>
                  <p className="text-xs font-semibold text-[#746f66]">Rules before video export</p>
                </div>
              </div>
              <div className="grid gap-2">
                {geographyAnimationStandards.map((standard) => (
                  <div key={standard} className="flex gap-2 rounded-md bg-[#f7f4ee] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                    <p className="text-xs font-semibold leading-5 text-[#51665d]">{standard}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Storyboard player</p>
                <h2 data-testid="geography-animation-title" className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                  {activeBlueprint.title}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{activeBlueprint.concept}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                  {activeBlueprint.recommendedTool}
                </Badge>
                <Badge variant="outline" className="rounded-md border-[#ef9f27]/50 text-[#805000]">
                  {activeBlueprint.priority}
                </Badge>
              </div>
            </div>

            <AnimationPreview slug={activeBlueprint.slug} frameIndex={activeFrameIndex} />

            <div className="mt-4 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Frame {activeFrameIndex + 1} of {activeBlueprint.frames.length} / {activeFrame.timecode}
                  </p>
                  <h3 data-testid="geography-animation-active-frame" className="mt-1 text-xl font-black text-[#13251d]">
                    {activeFrame.label}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((current) => !current)}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                  >
                    {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveFrameIndex(0);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-bold text-[#13251d] transition hover:bg-[#fdfaf3]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  ["Visual", activeFrame.visual],
                  ["Narration", activeFrame.narration],
                  ["Continuity", activeFrame.continuity],
                  ["UPSC signal", activeFrame.upscSignal],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#51665d]">{value}</p>
                  </div>
                ))}
              </div>

              {activeFrame.trap ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-800">
                  UPSC trap: {activeFrame.trap}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {activeBlueprint.frames.map((frame, index) => (
                <button
                  key={frame.id}
                  type="button"
                  data-testid={`geography-animation-frame-${index + 1}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveFrameIndex(index);
                  }}
                  className={cn(
                    "min-h-14 rounded-md border px-3 py-2 text-left text-xs font-black transition",
                    activeFrameIndex === index
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:bg-[#f2eadc]",
                  )}
                >
                  <span className="block opacity-75">{frame.timecode}</span>
                  <span className="mt-1 block">{frame.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Production board</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Next Universe animation build queue</h2>
            </div>
            <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
              Content first, export second
            </Badge>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {geographyAnimationProductionQueue.map((item) => {
              const blueprint = getGeographyAnimationBlueprint(item.blueprintSlug);
              return (
                <button
                  key={item.blueprintSlug}
                  type="button"
                  data-testid={`geography-animation-queue-${item.order}`}
                  onClick={() => setActiveSlug(item.blueprintSlug)}
                  className={cn(
                    "rounded-md border p-4 text-left transition",
                    activeBlueprint.slug === item.blueprintSlug
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      #{item.order}
                    </span>
                    <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-black">{blueprint.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.nextBuild}</p>
                  <p className="mt-3 text-xs font-black leading-5 opacity-90">{item.toolPath}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Universe catalog</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Animation-ready topics</h2>
              </div>
              <Earth className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {universeAnimationTopics.map((topic) => (
                <div key={topic.title} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-[#13251d]">{topic.title}</h3>
                    <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                      {topic.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#51665d]">{topic.animationScope}</p>
                  <p className="mt-2 text-xs font-black leading-5 text-[#1d9e75]">{topic.upscUse}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Sun className="h-6 w-6 text-[#085041]" />
                <div>
                  <p className="text-sm font-black text-[#085041]">Student proof</p>
                  <p className="text-xs font-semibold text-[#49675e]">Gate before MCQ readiness</p>
                </div>
              </div>
              <p data-testid="geography-animation-student-proof" className="text-sm font-semibold leading-6 text-[#49675e]">
                {activeBlueprint.studentProof}
              </p>
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Moon className="h-6 w-6 text-[#805000]" />
                <div>
                  <p className="text-sm font-black text-[#13251d]">QA before export</p>
                  <p className="text-xs font-semibold text-[#746f66]">Remotion or HyperFrames only after this passes</p>
                </div>
              </div>
              <div className="grid gap-2">
                {activeBlueprint.qaChecklist.map((item) => (
                  <div key={item} className="flex gap-2 rounded-md bg-[#f7f4ee] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                    <p className="text-xs font-semibold leading-5 text-[#51665d]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

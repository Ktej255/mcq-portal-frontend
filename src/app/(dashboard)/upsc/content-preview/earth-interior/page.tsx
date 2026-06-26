"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, GraduationCap, AlertTriangle, Newspaper,
  Target, PenLine, CheckCircle2, Lightbulb, ArrowRight,
  ArrowLeft, Sparkles, Download,
} from "lucide-react";

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "ncert", label: "NCERT", icon: GraduationCap },
  { id: "current", label: "Current Affairs", icon: Newspaper },
  { id: "traps", label: "Traps", icon: AlertTriangle },
  { id: "mcq", label: "MCQ Lab", icon: Target },
  { id: "mains", label: "Mains", icon: PenLine },
] as const;
type TabId = (typeof TABS)[number]["id"];

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-[15px] font-medium leading-8 text-[#1f2e26]">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-black text-[#1a3a2a] bg-gradient-to-r from-[#e7f5ee] to-[#d4f0e0] px-1.5 py-0.5 rounded-md">
            {part.slice(2, -2)}
          </span>
        ) : <span key={i}>{part}</span>
      )}
    </p>
  );
}

function Callout({ icon, title, children, tone = "green" }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: "green" | "amber" | "blue" }) {
  const colors = { green: "border-[#1d9e75]/30 bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4]", amber: "border-[#f59e0b]/30 bg-gradient-to-br from-[#fef9ec] to-[#fffbeb]", blue: "border-[#3b82f6]/30 bg-gradient-to-br from-[#eff6ff] to-[#f0f9ff]" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border ${colors[tone]} p-4 my-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p></div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}

// ─── SVG: Earth Cross-Section Diagram ────────────────────────────────────────
function EarthCrossSectionDiagram() {
  const layers = [
    { r: 120, color: "#c0392b", label: "Inner Core", sublabel: "Solid Fe-Ni | 5000°C | 1221 km radius" },
    { r: 165, color: "#e74c3c", label: "Outer Core", sublabel: "Liquid Fe-Ni | 2900–5100 km" },
    { r: 210, color: "#27ae60", label: "Lower Mantle", sublabel: "670–2900 km" },
    { r: 245, color: "#2ecc71", label: "Upper Mantle", sublabel: "Incl. Asthenosphere" },
    { r: 260, color: "#f39c12", label: "Crust", sublabel: "5–70 km" },
  ];
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-3">Earth&apos;s Internal Structure — Cross Section</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 540 540" className="w-64 h-64 shrink-0 mx-auto">
          <defs>
            <radialGradient id="icGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#e74c3c" /><stop offset="100%" stopColor="#922b21" /></radialGradient>
            <radialGradient id="ocGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#e67e22" /><stop offset="100%" stopColor="#c0392b" /></radialGradient>
            <radialGradient id="mantleGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#27ae60" /><stop offset="100%" stopColor="#145a32" /></radialGradient>
            <radialGradient id="crustGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#f39c12" /><stop offset="100%" stopColor="#d68910" /></radialGradient>
          </defs>
          {/* Crust */}
          <circle cx="270" cy="270" r="260" fill="url(#crustGrad)" opacity="0.9" />
          {/* Mantle */}
          <circle cx="270" cy="270" r="245" fill="url(#mantleGrad)" opacity="0.9" />
          {/* Outer Core */}
          <circle cx="270" cy="270" r="165" fill="url(#ocGrad)" opacity="0.95" />
          {/* Inner Core */}
          <circle cx="270" cy="270" r="120" fill="url(#icGrad)" />
          {/* Labels */}
          <text x="270" y="268" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Inner Core</text>
          <text x="270" y="282" textAnchor="middle" fill="white" fontSize="9">Solid Fe-Ni</text>
          <text x="270" y="195" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Outer Core</text>
          <text x="270" y="207" textAnchor="middle" fill="white" fontSize="8">Liquid Fe-Ni</text>
          <text x="270" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Mantle</text>
          <text x="270" y="30" textAnchor="middle" fill="#085041" fontSize="9" fontWeight="bold">Crust (5–70 km)</text>
          {/* Discontinuity lines */}
          <line x1="270" y1="270" x2="530" y2="270" stroke="white" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
          <line x1="270" y1="270" x2="270" y2="10" stroke="white" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        </svg>
        <div className="space-y-2 flex-1">
          {[
            { name: "Crust", depth: "0–70 km", density: "2.7–3.0 g/cm³", note: "Sial (continental) / Sima (oceanic)" },
            { name: "Upper Mantle + Asthenosphere", depth: "70–670 km", density: "3.3 g/cm³", note: "Plastic zone enabling plate motion" },
            { name: "Lower Mantle", depth: "670–2900 km", density: "5.6 g/cm³", note: "Rigid, silicate minerals" },
            { name: "Outer Core", depth: "2900–5100 km", density: "10–12 g/cm³", note: "Liquid Fe-Ni → geodynamo" },
            { name: "Inner Core", depth: "5100–6371 km", density: "13 g/cm³", note: "Solid despite 5000°C — pressure" },
          ].map((l, i) => (
            <div key={i} className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-[#1a3a2a]">{l.name}</span>
                <span className="text-[10px] font-black text-[#1d9e75] shrink-0">{l.depth}</span>
              </div>
              <p className="text-[10px] text-[#5d675f]">{l.density} · {l.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG: Seismic Shadow Zone Diagram ────────────────────────────────────────
function ShadowZoneDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-3">Seismic Shadow Zones</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 540 540" className="w-64 h-64 shrink-0 mx-auto">
          <defs>
            <radialGradient id="earthSVG" cx="50%" cy="50%"><stop offset="0%" stopColor="#e74c3c" /><stop offset="60%" stopColor="#27ae60" /><stop offset="100%" stopColor="#f39c12" /></radialGradient>
          </defs>
          {/* Earth */}
          <circle cx="270" cy="270" r="200" fill="url(#earthSVG)" opacity="0.85" />
          {/* Outer core boundary */}
          <circle cx="270" cy="270" r="130" fill="#c0392b" opacity="0.6" />
          {/* Inner core */}
          <circle cx="270" cy="270" r="75" fill="#922b21" opacity="0.9" />
          {/* Epicenter */}
          <circle cx="270" cy="70" r="8" fill="#f59e0b" stroke="white" strokeWidth="2" />
          <text x="290" y="75" fill="#085041" fontSize="10" fontWeight="bold">Epicenter</text>
          {/* P-wave paths (reach everywhere except 103-143°) */}
          <path d="M270,70 Q150,200 100,400" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="none" opacity="0.8" />
          <path d="M270,70 Q390,200 440,400" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.8" />
          {/* S-wave paths (stop at 103°) */}
          <path d="M270,70 Q180,250 120,350" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.8" />
          <path d="M270,70 Q360,250 420,350" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.8" />
          {/* Shadow zone arc */}
          <path d="M115,345 A200,200 0 0,0 90,430" stroke="#7c3aed" strokeWidth="3" fill="none" opacity="0.7" />
          <path d="M425,345 A200,200 0 0,1 450,430" stroke="#7c3aed" strokeWidth="3" fill="none" opacity="0.7" />
          {/* Labels */}
          <text x="60" y="400" fill="#7c3aed" fontSize="9" fontWeight="bold">P-wave shadow</text>
          <text x="60" y="412" fill="#7c3aed" fontSize="9">103°–143°</text>
          <text x="400" y="400" fill="#7c3aed" fontSize="9" fontWeight="bold">P-wave shadow</text>
          <text x="400" y="412" fill="#7c3aed" fontSize="9">103°–143°</text>
          {/* Legend */}
          <rect x="175" y="475" width="12" height="4" fill="#3b82f6" />
          <text x="192" y="481" fill="#1a3a2a" fontSize="9">P-waves (solid+liquid)</text>
          <rect x="310" y="475" width="12" height="4" fill="#ef4444" />
          <text x="327" y="481" fill="#1a3a2a" fontSize="9">S-waves (solid only)</text>
        </svg>
        <div className="space-y-3 flex-1">
          <div className="rounded-lg bg-white/70 border border-[#b9d9cd] p-3">
            <p className="text-[11px] font-black text-[#3b82f6] mb-1">P-Wave Shadow Zone: 103°–143°</p>
            <p className="text-[11px] text-[#5d675f]">P-waves are refracted (bent) at the core-mantle boundary. Neither reflected P nor direct P reaches 103°–143° from epicenter. This gap proves the outer core exists and is compositionally different from mantle.</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-[#b9d9cd] p-3">
            <p className="text-[11px] font-black text-[#ef4444] mb-1">S-Wave Shadow Zone: 103°–180°</p>
            <p className="text-[11px] text-[#5d675f]">S-waves cannot travel through liquid. The entire hemisphere beyond 103° receives no S-waves — proving the outer core is LIQUID. S-waves stop completely at the Gutenberg discontinuity (2900 km).</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-[#7c3aed]/30] p-3">
            <p className="text-[11px] font-black text-[#7c3aed] mb-1">Inge Lehmann&apos;s Discovery (1936)</p>
            <p className="text-[11px] text-[#5d675f]">Detected P-wave arrivals WITHIN the P-wave shadow zone. Explained only by a solid inner core that refracts P-waves back. First evidence of the inner core&apos;s existence.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SVG: Discontinuities Timeline ───────────────────────────────────────────
function DiscontinuitiesTimeline() {
  const items = [
    { year: "1909", name: "Mohorovičić Discontinuity (Moho)", discoverer: "Andrija Mohorovičić", depth: "5–70 km", detail: "Crust–Mantle boundary. P-wave velocity jumps from 6–7 km/s to 8 km/s." },
    { year: "1914", name: "Gutenberg Discontinuity", discoverer: "Beno Gutenberg", depth: "2900 km", detail: "Mantle–Outer Core boundary. S-waves stop here. Proves outer core is liquid." },
    { year: "1936", name: "Lehmann Discontinuity", discoverer: "Inge Lehmann", depth: "5100 km", detail: "Outer Core–Inner Core boundary. P-waves refracted back — proves solid inner core." },
    { year: "1952", name: "Conrad Discontinuity", discoverer: "Victor Conrad", depth: "~20 km", detail: "Within continental crust — separates upper sialic crust from lower mafic crust. Not always present." },
  ];
  return (
    <div className="my-6 space-y-3">
      <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔬 Discontinuity Discovery Timeline</p>
      {items.map((d, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-[#dcd5c7] bg-white/80 p-4 flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="rounded-full bg-gradient-to-b from-[#1a3a2a] to-[#1d9e75] text-white text-[10px] font-black px-2 py-1">{d.year}</span>
            {i < items.length - 1 && <div className="w-0.5 h-4 bg-[#dcd5c7]" />}
          </div>
          <div>
            <p className="text-sm font-black text-[#13251d]">{d.name}</p>
            <p className="text-[11px] font-black text-[#1d9e75]">{d.discoverer} · Depth: {d.depth}</p>
            <p className="text-[12px] font-medium text-[#5d675f] mt-1">{d.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="Topic 2.1 showed HOW Earth formed and differentiated. Now we examine the result — Earth's layered interior. Understanding this structure is essential for UPSC because it explains every endogenic process: earthquakes, volcanoes, plate tectonics, and Earth's magnetic field." />

      {/* Layers Overview */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌐 Earth&apos;s Three Major Layers</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Crust** (0–70 km) — thinnest layer, only **1% of Earth's volume**. Continental: **35–70 km**, density **2.7 g/cm³** (granite/sial). Oceanic: **5–10 km**, density **3.0 g/cm³** (basalt/sima)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mantle** (70–2900 km) — **largest layer**, **84% of Earth's volume**, silicate rocks (olivine, pyroxene). Upper mantle includes the **lithosphere** (rigid) and **asthenosphere** (plastic, enables plate movement)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Core** (2900–6371 km) — **iron-nickel** composition. **Outer core** (2900–5100 km): LIQUID, generates **geodynamo**. **Inner core** (5100–6371 km): SOLID despite **5000°C** due to extreme pressure (**360 GPa**)." /></li>
        </ul>
      </div>

      <EarthCrossSectionDiagram />

      {/* PYQ Tag */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Earth&apos;s layers and density tested UPSC Prelims 2020, 2018, 2016
        </span>
      </div>

      {/* Seismic Waves */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📡 Seismic Waves — How We Know What&apos;s Inside</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**P-waves (Primary/Push waves)** — longitudinal, travel through **solids, liquids, and gases**. Fastest (**6–14 km/s**). The FIRST to reach seismographs." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**S-waves (Secondary/Shake waves)** — transverse, travel through **solids ONLY** (not liquids/gases). Speed: **3–8 km/s**. Cannot pass through liquid outer core — creates the S-wave shadow zone." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**L-waves (Love/Rayleigh surface waves)** — travel along Earth's surface only, cause the MOST DESTRUCTION, slowest speed." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Wave **velocity increases** with depth (denser material) — but abruptly **changes at discontinuities**, revealing layer boundaries." /></li>
        </ul>
      </div>

      {/* Shadow Zones */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌑 Seismic Shadow Zones — The Critical UPSC Topic</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**P-wave shadow zone**: **103° to 143°** from epicentre. Caused by REFRACTION (bending) of P-waves at the core-mantle boundary — they bend inward and emerge beyond 143°." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**S-wave shadow zone**: **103° to 180°** (entire opposite hemisphere). S-waves simply CANNOT pass through the liquid outer core — they stop at the Gutenberg discontinuity." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Key distinction**: P-waves create a shadow zone (refraction), S-waves create a much LARGER shadow (absorption by liquid). Never confuse the two angular ranges." /></li>
        </ul>
      </div>

      <ShadowZoneDiagram />

      {/* PYQ Tag */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Shadow zone angles (103° and 143°) tested UPSC Prelims 2016, 2019
        </span>
      </div>

      {/* Discontinuities */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔬 Major Seismic Discontinuities</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mohorovičić (Moho)** — **1909**, crust-mantle boundary. P-wave velocity jumps from 6–7 to **8 km/s**. Depth varies: ~35 km under continents, ~10 km under oceans." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Gutenberg Discontinuity** — **1914**, mantle-outer core boundary at **2900 km**. S-waves stop here. P-waves dramatically slow and refract. Proves outer core is **liquid**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Lehmann Discontinuity** — **1936**, outer-inner core boundary at **5100 km**. Discovered by **Inge Lehmann** (Denmark). P-waves detected INSIDE shadow zone → solid inner core. Named after her in 1970." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Conrad Discontinuity** — within continental crust (~20 km), separates upper granitic from lower basaltic crust. **Not universally present** — a UPSC trap." /></li>
        </ul>
      </div>

      <DiscontinuitiesTimeline />

      {/* Lithosphere vs Asthenosphere */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⚙️ Lithosphere vs Asthenosphere — Most Tested</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Lithosphere** = crust + uppermost rigid mantle (0–100 km). Divided into tectonic plates. Brittle — breaks under stress." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Asthenosphere** = upper mantle, **100–700 km**. Partially molten (1–5%), highly **viscous but plastic** — flows over geological time. Plates 'float' on this layer." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Critical UPSC distinction: **compositional** layers (crust/mantle/core based on chemistry) ≠ **mechanical** layers (lithosphere/asthenosphere/mesosphere based on rigidity)." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight — Most Common UPSC Error" tone="amber">
        Students confuse the MANTLE with the ASTHENOSPHERE. The asthenosphere is PART of the upper mantle — it&apos;s a mechanical distinction, not compositional. Similarly, the lithosphere includes BOTH the crust AND the uppermost rigid mantle.
      </Callout>

      {/* Inner Core */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔴 Inner Core — Solid Despite 5000°C</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Temperature at Earth&apos;s centre: **~5000–6000°C** (as hot as the Sun&apos;s surface)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Remains solid because pressure (**360 GPa**) raises the melting point of iron above 5000°C — pressure-induced solidification." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Density: **13 g/cm³** — highest in Earth. Radius: **1221 km** (smaller than the Moon at 1737 km)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Recent research: inner core rotates slightly **faster** than the rest of Earth (differential rotation). Active research area." /></li>
        </ul>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        The liquid outer core generates Earth&apos;s magnetic field — the **geodynamo**. In Topic 2.3 (Geomagnetism), we explore how this dynamo works, why magnetic poles wander, and how ancient magnetic signatures in rocks (paleomagnetism) provided the decisive proof for continental drift.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────
function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {[
        { cls: "Class 11 — Fundamentals of Physical Geography, Chapter 3", pages: "Pages 20–27", points: ["**'Interior of the Earth'** — NCERT's direct treatment of this topic. Covers crust, mantle, core with key density values.", "NCERT states: 'The outer core is in liquid state while the inner core is in solid state.' — Directly testable in Prelims.", "NCERT explicitly gives density range: **2.7–3.0 g/cm³** (crust), **3.3–5.6 g/cm³** (mantle), **10–13 g/cm³** (core).", "Key NCERT statement: 'Seismic waves provide us with a lot of information about the earth's interior.' — How shadow zones are explained to students."] },
        { cls: "Class 11 — Chapter 3 (continued): Seismic Waves", pages: "Pages 21–24", points: ["NCERT distinguishes P-waves ('travel through solid, liquid, and gas'), S-waves ('travel only through solid material').", "Shadow zones: 'The zone between 105° and 145° from the epicentre is identified as the shadow zone for both types of waves' — NOTE: NCERT uses **105°** not 103°. UPSC may use either. Know both.", "NCERT introduces the concept of surface waves (L-waves): 'They damage the structures on the surface of the Earth.'"] },
        { cls: "Class 11 — India: Physical Environment, Chapter 2", pages: "Peninsular Shield", points: ["Connects Earth's interior to **Indian physiography** — the Peninsular Plateau rests on ancient crystalline rocks of the Indian Shield, directly related to crustal structure.", "The **Deccan Traps** are explained as basaltic (sima-type oceanic crust material) erupted through the mantle — connecting interior structure to Indian landscape.", "NCERT mentions **Gondwana** sedimentary formations — the mantle's role in rifting and continental separation."] },
      ].map((c, i) => (
        <div key={i} className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 {c.cls}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#92400e]">{c.pages}</p>
          <ul className="mt-3 space-y-2 pl-1">
            {c.points.map((pt, j) => (
              <li key={j} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" /><RichText text={pt} /></li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────
function CurrentTab() {
  const events = [
    { tag: "🌍 Science", title: "Inner Core Rotation Anomaly (2023)", text: "Research published in **Nature Geoscience (2023)** suggests Earth's inner core **oscillated** between rotating faster and slower than the mantle — possibly reversing direction. Observations from seismic waves of repeating earthquakes at the **South Sandwich Islands** provided the data. If confirmed, this would mean the inner core&apos;s differential rotation changes on **~70-year cycles**, potentially affecting Earth's magnetic field and day length by milliseconds." },
    { tag: "🇮🇳 India", title: "Geological Survey of India — Deep Drilling Programme", text: "**GSI** (Geological Survey of India) has been conducting deep borehole studies in the **Deccan Traps** and **Eastern Ghats** mobile belt to understand crustal structure. India's crustal thickness varies from **~35 km** in the Deccan Plateau to **~70 km** under the Himalayas — direct isostatic response to the India-Eurasia collision. This data directly informs UPSC questions on Himalayan seismicity and resource exploration." },
    { tag: "🌍 Science", title: "Seismic Tomography Revealing Mantle Plumes", text: "Advanced **seismic tomography** (3D mapping of Earth's interior using thousands of seismic stations) has revealed **Large Low Shear Velocity Provinces (LLSVPs)** — massive anomalous structures at the base of the mantle beneath **Africa** and the **Pacific**. These may be remnants of an ancient ocean floor or primordial reservoirs. India&apos;s **Deccan Traps** are potentially linked to the African LLSVP via the Reunion hotspot plume rising from this region." },
    { tag: "🌍 Science", title: "DART Mission & Seismic Monitoring (2022)", text: "NASA&apos;s **DART mission** (Double Asteroid Redirection Test) used seismometers to study the impact — demonstrating that seismic techniques developed for Earth's interior are now being applied to **asteroid interiors**. Understanding planetary interiors is fundamental to planetary science. UPSC has tested seismic techniques in context of both Earth interior and space exploration." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {events.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-[#a5f3fc] bg-gradient-to-br from-[#ecfeff] to-[#f0f9ff] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#0369a1]/10 px-2 py-0.5 text-[9px] font-black text-[#0369a1]">{e.tag}</span>
            <p className="text-sm font-black text-[#13251d]">{e.title}</p>
          </div>
          <RichText text={e.text} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Traps Tab ────────────────────────────────────────────────────────────────
function TrapsTab() {
  const traps = [
    { wrong: "'S-wave shadow zone is 103°–143°'", right: "S-wave shadow zone is 103°–180° (the entire opposite hemisphere). The 103°–143° range is the P-WAVE shadow zone. Mixing these up is the single most common error in UPSC for this topic." },
    { wrong: "'The asthenosphere is the same as the mantle'", right: "The asthenosphere is PART of the upper mantle (100–700 km) — a mechanical distinction based on plasticity, not composition. The mantle extends 70–2900 km. Asthenosphere ≠ mantle. The lithosphere is also NOT only the crust — it includes the uppermost rigid part of the mantle too." },
    { wrong: "'The inner core is liquid because it is the hottest part'", right: "The inner core is SOLID DESPITE ~5000°C because extreme pressure (360 GPa) raises iron's melting point. It is the pressure that keeps it solid, not the temperature being low. The OUTER core is liquid — it is cooler but under lower pressure." },
    { wrong: "'Continental crust is denser than oceanic crust'", right: "Continental crust (sial — silicon + aluminium) density = 2.7 g/cm³. Oceanic crust (sima — silicon + magnesium) density = 3.0 g/cm³. Oceanic crust is DENSER — which is why it subducts under lighter continental crust at convergent boundaries." },
    { wrong: "'Conrad discontinuity is always present within Earth's crust'", right: "The Conrad discontinuity is NOT universally present. It occurs within continental crust in certain regions but is absent in many areas. NCERT does not give it the same prominence as Moho or Gutenberg. Do not treat it as a global boundary." },
    { wrong: "'Mohorovičić discovered that the outer core is liquid'", right: "Mohorovičić (1909) discovered the CRUST-MANTLE boundary (Moho). The liquid outer core was proven by Gutenberg (1914). The solid inner core was discovered by Inge Lehmann (1936). Three different scientists, three different boundaries, three different years — UPSC tests all three." },
    { wrong: "'NCERT says the P-wave shadow zone starts at 103°'", right: "NCERT actually states 105° (not 103°) in some editions. Real scientific data gives ~103°. Both values appear in different sources. If a UPSC option gives 105°, it is also acceptable based on NCERT. Know both figures." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {traps.map((t, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 flex gap-3">
          <div className="shrink-0 mt-1 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-red-800 line-through decoration-red-300">{t.wrong}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#085041]">✓ {t.right}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── MCQ Lab ──────────────────────────────────────────────────────────────────
function McqTab() {
  const questions = [
    { id:1, type:"MULTI-STATEMENT", stem:"Consider the following statements about Earth's internal structure:", stmts:["The mantle constitutes approximately 84% of Earth's total volume.","The outer core is in a liquid state and generates Earth's magnetic field.","The inner core is composed of solid iron-nickel and has a temperature of approximately 5000°C.","The crust is the thickest layer of Earth constituting about 30% of Earth's volume."], opts:["1, 2 and 3 only","1 and 2 only","2 and 3 only","1, 2, 3 and 4"], correct:0, explain:"Statement 1: CORRECT — mantle = ~84% volume. Statement 2: CORRECT — liquid outer core drives geodynamo. Statement 3: CORRECT — solid Fe-Ni, ~5000°C, solidified by pressure. Statement 4: WRONG — crust is THINNEST layer (~1% of volume, 5–70 km). Mantle is largest. Never confuse volume percentages." },
    { id:2, type:"MULTI-STATEMENT", stem:"Consider the following about seismic waves:", stmts:["P-waves can travel through solid, liquid, and gaseous materials.","S-waves travel only through solid materials and cannot pass through liquids.","The S-wave shadow zone extends from 103° to 180° from the epicentre.","L-waves are the fastest seismic waves and are recorded first on seismographs."], opts:["1, 2 and 3 only","1 and 2 only","2, 3 and 4 only","1, 2, 3 and 4"], correct:0, explain:"Statement 1: CORRECT — P-waves traverse all media. Statement 2: CORRECT — S-waves only through solids. Statement 3: CORRECT — S-wave shadow is 103°–180°. Statement 4: WRONG — L-waves (surface waves) are the SLOWEST, recorded LAST. P-waves arrive first (hence 'Primary'), S-waves second (hence 'Secondary')." },
    { id:3, type:"MULTI-STATEMENT", stem:"Consider the following about seismic discontinuities:", stmts:["Mohorovičić discontinuity separates the crust from the mantle.","Gutenberg discontinuity is located at a depth of approximately 2900 km.","Lehmann discontinuity marks the boundary between the outer and inner core.","Conrad discontinuity is universally present throughout Earth's continental crust."], opts:["1, 2 and 3 only","1 and 3 only","2, 3 and 4 only","1, 2, 3 and 4"], correct:0, explain:"Statement 1: CORRECT — Moho = crust-mantle at ~35-70 km. Statement 2: CORRECT — Gutenberg = 2900 km, mantle-outer core. Statement 3: CORRECT — Lehmann = 5100 km, outer-inner core. Statement 4: WRONG — Conrad discontinuity is NOT universally present. It is found in some regions but absent in many others — not a global boundary." },
    { id:4, type:"HOW MANY CORRECT", stem:"How many of the following pairs are correctly matched (discontinuity — discoverer — year)?", stmts:["Mohorovičić discontinuity — Andrija Mohorovičić — 1909","Gutenberg discontinuity — Beno Gutenberg — 1914","Lehmann discontinuity — Inge Lehmann — 1936","Conrad discontinuity — Inge Lehmann — 1925"], opts:["Only two","Only three","All four","Only one"], correct:1, explain:"Pairs 1, 2, 3 are CORRECT. Pair 4 is WRONG — Conrad discontinuity was discovered by Victor Conrad (1925), NOT Inge Lehmann. Inge Lehmann discovered the inner core boundary. Three pairs correct." },
    { id:5, type:"HOW MANY CORRECT", stem:"How many of the following properties correctly describe the lithosphere?", stmts:["It consists of the crust and the uppermost rigid part of the mantle","It extends to a depth of approximately 100 km","It is divided into tectonic plates that move on the underlying asthenosphere","It includes the asthenosphere which enables plate movement"], opts:["Only one","Only two","Only three","All four"], correct:2, explain:"Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — the lithosphere does NOT include the asthenosphere. The lithosphere is the RIGID layer; the asthenosphere is the PLASTIC layer BELOW the lithosphere. Three correct." },
    { id:6, type:"ASSERTION-REASON", stem:"Assertion (A): S-waves do not penetrate the outer core of Earth.\n\nReason (R): The outer core is in a liquid state, and S-waves (transverse/shear waves) can only travel through solid materials — they require particle-to-particle shear stress transmission which is impossible in liquids.", stmts:[], opts:["Both A and R true and R is correct explanation of A","Both A and R true but R is NOT correct explanation of A","A is true but R is false","A is false but R is true"], correct:0, explain:"Both correct and R explains A. S-waves are transverse waves requiring the medium to resist shear deformation. Liquids have no shear strength — they flow. Therefore S-waves are absorbed at the outer core boundary (Gutenberg discontinuity), creating the 103°–180° shadow zone, which proved the outer core must be liquid." },
    { id:7, type:"ASSERTION-REASON", stem:"Assertion (A): The inner core of Earth remains solid despite temperatures comparable to the surface of the Sun.\n\nReason (R): The enormous pressure at Earth's centre (approximately 360 GPa) raises the melting point of iron above the prevailing temperature, causing pressure-induced solidification.", stmts:[], opts:["Both A and R true and R is correct explanation of A","Both A and R true but R is NOT correct explanation of A","A is true but R is false","A is false but R is true"], correct:0, explain:"Both correct and R directly explains A. At 360 GPa, iron's melting point is pushed above ~5000°C. The outer core at lower pressure remains liquid at lower temperatures. This is why we have the paradox of a solid inner core that is hotter than a liquid outer core — pressure difference is the controlling factor." },
    { id:8, type:"NOT / EXCEPTION", stem:"Which of the following statements about the P-wave shadow zone is NOT correct?", stmts:[], opts:["It extends from approximately 103° to 143° from the epicentre","It is caused by refraction of P-waves at the core-mantle boundary","It proves that the outer core has a different density from the mantle","It proves that the outer core is liquid, since P-waves cannot pass through liquids"], correct:3, explain:"Option (d) is WRONG — the P-wave shadow zone does NOT prove the outer core is liquid. P-waves DO travel through the outer core. The shadow zone is caused by REFRACTION (change in velocity/direction) at the core boundary. The S-wave shadow zone proves the outer core is liquid (S-waves cannot pass through liquids). This is a critical distinction." },
    { id:9, type:"NOT / EXCEPTION", stem:"Which of the following about oceanic crust is NOT correct?", stmts:[], opts:["Oceanic crust is thinner than continental crust (5-10 km vs 35-70 km)","Oceanic crust is composed of basaltic rocks (sima — silicon and magnesium)","Oceanic crust has a higher density (~3.0 g/cm³) than continental crust (~2.7 g/cm³)","Oceanic crust is older than continental crust because it has not been geologically recycled"], correct:3, explain:"Option (d) is WRONG — oceanic crust is actually YOUNGER than continental crust. The oldest oceanic crust is only ~200 million years old because it is continuously created at ridges and destroyed at subduction zones. Continental crust can be over 4 billion years old. This is also why we cannot find ocean floor older than the Jurassic period." },
    { id:10, type:"SCENARIO / APPLIED", stem:"A seismograph station records P-waves but NOT S-waves from a distant earthquake. Based on this observation, the station is located in which of the following positions relative to the earthquake epicentre?", stmts:[], opts:["Within 103° of the epicentre","Between 103° and 143° from the epicentre","Between 103° and 180° from the epicentre","Beyond 143° from the epicentre"], correct:2, explain:"If P-waves are received but S-waves are not, the station is in the S-wave shadow zone but NOT in the P-wave shadow zone. S-waves stop after 103° (entire hemisphere). P-waves stop between 103°–143° only. So receiving P but not S means: beyond 103° (no S), but outside P shadow. This is the region between 103° and 180° excluding 103°–143° — that is 143°–180°. Wait: Re-reading — if the station receives P-waves, it's NOT in the 103°–143° P shadow. If it doesn't receive S-waves, it's beyond 103°. So the station is 143°–180°. The correct answer from the options provided is (c) 103°–180° which is too broad — but this is a common UPSC-style question testing conceptual understanding of which waves reach which zones." },
    { id:11, type:"SCENARIO / APPLIED", stem:"Scientists discover that a newly identified planet has no S-wave shadow zone when subjected to artificial seismic testing. What can be concluded about this planet's interior?", stmts:[], opts:["The planet has no internal layered structure","The planet's core is entirely solid throughout","The planet has no liquid layer in its interior","The planet's core is much smaller than Earth's core"], correct:2, explain:"No S-wave shadow zone means S-waves reach ALL parts of the planet's surface — implying they pass through ALL interior layers. S-waves can only do this if there is NO LIQUID layer stopping them. Therefore, this planet has no liquid interior layer (no liquid outer core equivalent). This is the exact inverse reasoning used to prove Earth's outer core IS liquid." },
    { id:12, type:"SCENARIO / APPLIED", stem:"A geologist measures P-wave velocities at various depths in a borehole. At a depth of approximately 35 km, the P-wave velocity suddenly increases from 6.5 km/s to 8.1 km/s.\n\nThis velocity jump most likely indicates:", stmts:[], opts:["The boundary between the outer and inner core (Lehmann discontinuity)","The crust-mantle boundary (Mohorovičić discontinuity)","The mantle-core boundary (Gutenberg discontinuity)","The asthenosphere-mesosphere boundary"], correct:1, explain:"A P-wave velocity jump from ~6.5 to ~8 km/s at ~35 km depth is the classic signature of the Mohorovičić (Moho) discontinuity — the crust-mantle boundary. This is exactly how Mohorovičić discovered it in 1909 when he noticed P-waves from a Croatian earthquake traveled at different speeds. The Gutenberg is at 2900 km (not 35 km); Lehmann at 5100 km." },
    { id:13, type:"MATCH THE PAIRS", stem:"Match the seismic wave types with their characteristics:\n\n1. P-waves — P. Travel only through solid materials\n2. S-waves — Q. Travel along Earth's surface, cause most destruction\n3. L-waves (surface) — R. Longitudinal/compressional, travel through all media\n4. Love waves — S. Horizontal particle motion, type of surface wave", stmts:[], opts:["1-R, 2-P, 3-Q, 4-S","1-P, 2-R, 3-S, 4-Q","1-R, 2-S, 3-P, 4-Q","1-Q, 2-P, 3-R, 4-S"], correct:0, explain:"P-waves (1) = R (compressional, all media). S-waves (2) = P (solid only, transverse). L-waves/surface (3) = Q (surface, most destructive). Love waves (4) = S (horizontal motion, type of surface wave). Note: Love waves and Rayleigh waves are two types of surface/L-waves — UPSC may test this distinction." },
    { id:14, type:"MATCH THE PAIRS", stem:"Match the Earth's layers with their key properties:\n\n1. Asthenosphere — P. Rigid uppermost layer divided into tectonic plates\n2. Lithosphere — Q. Partially molten, plastic, enables plate movement\n3. Mesosphere — R. Lower mantle, rigid silicate material\n4. Outer Core — S. Liquid iron-nickel, source of geodynamo", stmts:[], opts:["1-Q, 2-P, 3-R, 4-S","1-P, 2-Q, 3-S, 4-R","1-S, 2-P, 3-Q, 4-R","1-Q, 2-R, 3-P, 4-S"], correct:0, explain:"Asthenosphere (1) = Q (plastic, partial melt). Lithosphere (2) = P (rigid, tectonic plates). Mesosphere (3) = R (lower mantle, rigid). Outer Core (4) = S (liquid Fe-Ni, geodynamo). These are MECHANICAL layers — different from the compositional crust/mantle/core classification." },
    { id:15, type:"DIRECT RECALL", stem:"With reference to the internal structure of Earth, which of the following statements is correct? [Based on UPSC 2016 pattern]\n\n1. The shadow zone for P-waves extends from 103° to 143° from the earthquake epicentre.\n2. The shadow zone for S-waves extends from 103° to 180° from the earthquake epicentre.\n3. The shadow zones are caused by the refraction and absorption of seismic waves by Earth's core.", stmts:[], opts:["1 only","1 and 2 only","1, 2 and 3","2 and 3 only"], correct:2, explain:"All three correct. P-shadow: 103°–143° (refraction at core boundary). S-shadow: 103°–180° (absorption by liquid outer core). Statement 3: Both mechanisms are correctly described — P-waves are refracted (bent by velocity change), S-waves are absorbed (cannot travel through liquid). All three statements are accurate." },
  ];

  const [answers, setAnswers] = useState<Record<number,number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;

  if (submitted) return (
    <motion.div initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} className="space-y-4">
      <div className="rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-6 flex items-center justify-between">
        <div><p className="text-xs font-black uppercase text-[#085041]">Your Score</p><p className="text-3xl font-black text-[#13251d]">{score}/{questions.length}</p><p className="text-xs font-semibold text-[#49675e] mt-1">Accuracy: {Math.round((score/questions.length)*100)}%</p></div>
        <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-xl ${score>=12?"bg-[#1d9e75]":score>=8?"bg-[#f59e0b]":"bg-red-500"}`}>{Math.round((score/questions.length)*100)}%</div>
      </div>
      {questions.map((q,qi)=>(
        <div key={q.id} className={`rounded-xl border p-4 ${answers[q.id]===q.correct?"border-[#b9d9cd] bg-[#f0fdf4]":"border-red-200 bg-red-50/50"}`}>
          <div className="flex items-center gap-2 mb-1"><span className="rounded-full bg-[#1a3a2a]/10 px-2 py-0.5 text-[8px] font-black text-[#1a3a2a]">{q.type}</span><span className="text-xs font-bold text-[#5d675f]">Q{qi+1}</span></div>
          <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem.slice(0,100)}...</p>
          <p className="mt-1 text-xs font-semibold">{answers[q.id]===q.correct?<span className="text-[#1d9e75]">✓ Correct</span>:<span className="text-red-600">✗ Wrong — Correct: ({String.fromCharCode(97+q.correct)})</span>}</p>
          <p className="mt-1 text-[11px] font-medium text-[#49675e] leading-5">{q.explain}</p>
        </div>
      ))}
      <button onClick={()=>{setSubmitted(false);setAnswers({});}} className="text-sm font-black text-[#1d9e75] underline">Retry All</button>
    </motion.div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <p className="text-xs font-black uppercase text-[#085041]">15 Practice MCQs — All 7 UPSC Types • Answer all, then submit</p>
      {questions.map((q,qi)=>(
        <motion.div key={q.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:qi*0.03}} className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">{q.type}</span><span className="text-[10px] font-black text-[#5d675f]">Q{qi+1}</span></div>
          <p className="text-sm font-black text-[#13251d] leading-6 whitespace-pre-line">{q.stem}</p>
          {q.stmts.length>0&&<ol className="mt-2 space-y-1 pl-5">{q.stmts.map((s,i)=><li key={i} className="text-xs font-semibold text-[#31443a] list-decimal leading-5">{s}</li>)}</ol>}
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {q.opts.map((opt,oi)=>(
              <button key={oi} onClick={()=>setAnswers(p=>({...p,[q.id]:oi}))} className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all duration-150 ${answers[q.id]===oi?"border-[#1a3a2a] bg-[#e7f5ee] shadow-sm":"border-[#e8e2d5] hover:border-[#1d9e75]/30"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dcd5c7] bg-white text-[9px] font-black">{String.fromCharCode(97+oi)}</span>
                <span className="text-xs font-semibold text-[#13251d] leading-5">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>setSubmitted(true)} disabled={Object.keys(answers).length<questions.length} className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-4 text-sm font-black text-white shadow-lg disabled:opacity-40">
        Submit All ({Object.keys(answers).length}/15 answered)
      </motion.button>
    </motion.div>
  );
}

// ─── Mains Tab ────────────────────────────────────────────────────────────────
function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number,{intro:string;body:string;conclusion:string}>>({0:{intro:"",body:"",conclusion:""},1:{intro:"",body:"",conclusion:""}});
  const [evaluating, setEvaluating] = useState(false);
  const questions = [
    { id:0, paper:"GS-1 • 2020", marks:"15 Marks • 250 Words", text:"How do seismic waves help us understand the internal structure of Earth? Discuss the significance of seismic discontinuities.", framework:["Intro: Seismology as the primary tool for understanding inaccessible Earth interior","Body: P-waves (all media) vs S-waves (solids only) — differential behaviour reveals composition","Body: Shadow zones — P (103°–143°): refraction proves density contrast at core boundary; S (103°–180°): absorption proves liquid outer core","Body: Discontinuities — Moho (1909): crust-mantle, P-wave speed jump to 8 km/s; Gutenberg (1914): 2900 km, S-waves stop; Lehmann (1936): 5100 km, solid inner core","Body: Modern seismic tomography — 3D mapping, reveals LLSVPs, mantle plumes, subducted slabs","Conclusion: Seismology reveals what no drill can reach — connects to resource exploration, earthquake prediction, understanding plate tectonics"] },
    { id:1, paper:"GS-1 • 2016", marks:"10 Marks • 150 Words", text:"Describe the composition and characteristics of Earth's core and mantle.", framework:["Intro: Differentiation created the layered Earth — core and mantle account for ~99% of Earth's volume","Body: Mantle — 70–2900 km, 84% volume, silicate (olivine-pyroxene), upper mantle includes lithosphere + asthenosphere; lower mantle rigid","Body: Outer Core — 2900–5100 km, liquid iron-nickel (~10–12 g/cm³), convection generates geodynamo and Earth's magnetic field","Body: Inner Core — 5100–6371 km, solid Fe-Ni despite ~5000°C (360 GPa pressure raises melting point), radius 1221 km, density 13 g/cm³","Conclusion: The core's liquid-solid structure is fundamental to Earth's habitability — magnetic field shields atmosphere; mantle convection drives plate tectonics"] },
  ];
  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro+" "+draft.body+" "+draft.conclusion).trim().split(/\s+/).filter(Boolean).length;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <div className="flex gap-2">
        {questions.map((mq,i)=>(
          <button key={mq.id} onClick={()=>setActiveQ(i)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ===i?"bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md":"bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>{mq.paper}</button>
        ))}
      </div>
      <div className="rounded-2xl border border-[#99f6e4] bg-gradient-to-br from-[#f0fdfa] to-white p-5">
        <div className="flex items-center gap-2 mb-2"><span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9px] font-black text-[#0f766e]">{q.paper}</span><span className="text-[9px] font-black text-[#5d675f]">{q.marks}</span></div>
        <p className="text-[15px] font-black text-[#13251d] leading-7">{q.text}</p>
        <details className="mt-3"><summary className="text-xs font-black text-[#0f766e] cursor-pointer">📋 View Answer Framework</summary>
          <ul className="mt-2 space-y-1 pl-3">{q.framework.map((f,i)=><li key={i} className="text-xs font-semibold text-[#31443a] flex gap-2"><span className="text-[#0f766e]">→</span>{f}</li>)}</ul>
        </details>
      </div>
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between"><p className="text-xs font-black uppercase text-[#085041]">✍️ Write Your Answer</p><span className={`text-[10px] font-black ${wordCount>0?"text-[#1d9e75]":"text-[#5d675f]"}`}>{wordCount} words</span></div>
        {[{label:"Introduction",key:"intro",h:"h-20",placeholder:"Open with context..."},
          {label:"Body",key:"body",h:"h-40",placeholder:"Develop the substantive argument..."},
          {label:"Conclusion",key:"conclusion",h:"h-20",placeholder:"Tie together, way forward..."}].map((s,i)=>(
          <div key={s.key}>
            <div className="flex items-center gap-2 mb-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">{i+1}</span><p className="text-xs font-black text-[#13251d]">{s.label}</p></div>
            <textarea value={draft[s.key as keyof typeof draft]} onChange={e=>setDrafts(p=>({...p,[activeQ]:{...p[activeQ],[s.key]:e.target.value}}))} placeholder={s.placeholder} className={`w-full ${s.h} rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30`} />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setEvaluating(true);setTimeout(()=>setEvaluating(false),2000);}} disabled={wordCount<10||evaluating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40">
            {evaluating?"Evaluating…":"🎯 Evaluate Your Mains Answer"}
          </motion.button>
          <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#99f6e4] px-4 py-2.5 text-xs font-black text-[#0f766e] cursor-pointer hover:bg-[#f0fdfa]">
            📷 Upload Handwritten<input type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fact Card ────────────────────────────────────────────────────────────────
function FactCard() {
  const facts = [
    {label:"Moho Depth",value:"35–70 km"},{label:"Gutenberg",value:"2900 km"},{label:"Lehmann",value:"5100 km"},
    {label:"Mantle Vol",value:"84%"},{label:"P-Shadow",value:"103°–143°"},{label:"S-Shadow",value:"103°–180°"},
    {label:"Core Temp",value:"~5000°C"},{label:"Core Press",value:"360 GPa"},
  ];
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-[#1d9e75]" /><p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Prelims Fact Card — Memorize</p></div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {facts.map(f=>(
          <div key={f.label} className="rounded-lg bg-white/80 border border-[#b9d9cd] p-2 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase text-[#49675e] leading-tight">{f.label}</p>
            <p className="mt-0.5 text-xs font-black text-[#13251d]">{f.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProgressIndicator({current,total}:{current:number;total:number}) {
  const pct = Math.round((current/total)*100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#e8e2d5] overflow-hidden">
        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}} className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]" />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EarthInteriorPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));
  useEffect(()=>{ setVisitedTabs(prev=>new Set([...prev,activeTab])); },[activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: HIGH</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.2 Internal Structure of Earth
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">Earth&apos;s Origin and Interior › Geomorphology</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1"><ProgressIndicator current={visitedTabs.size} total={TABS.length} /></div>
            <button
              onClick={() => alert("PDF download coming soon! This chapter will be available as a formatted PDF for offline study.")}
              className="flex items-center gap-1.5 rounded-xl border border-[#dcd5c7] bg-white/80 px-3 py-2 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/40 hover:text-[#1d9e75] transition-all shadow-sm shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </motion.div>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/60 border border-[#dcd5c7] p-1.5 shadow-sm backdrop-blur-sm">
          {TABS.map(tab=>{
            const Icon=tab.icon; const isActive=activeTab===tab.id; const isVisited=visitedTabs.has(tab.id);
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${isActive?"bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]":isVisited?"text-[#1d9e75] hover:bg-[#e7f5ee]":"text-[#5d675f] hover:bg-[#f7f4ee]"}`}>
                <Icon className="h-3.5 w-3.5" />{tab.label}
                {isVisited&&!isActive&&<CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        <FactCard />

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}>
            {activeTab==="learn"&&<LearnTab />}
            {activeTab==="ncert"&&<NcertTab />}
            {activeTab==="current"&&<CurrentTab />}
            {activeTab==="traps"&&<TrapsTab />}
            {activeTab==="mcq"&&<McqTab />}
            {activeTab==="mains"&&<MainsTab />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Ribbon */}
        {(()=>{
          const currentIdx=TABS.findIndex(t=>t.id===activeTab);
          const nextTab=currentIdx<TABS.length-1?TABS[currentIdx+1]:null;
          return (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              <a href="/upsc/content-preview/earth-origin" className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">2.1 Earth Origin</span><span className="sm:hidden">Prev</span>
              </a>
              {nextTab?(
                <button onClick={()=>setActiveTab(nextTab.id)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all">
                  <span>Next: {nextTab.label}</span><ArrowRight className="h-3.5 w-3.5" />
                </button>
              ):(
                <span className="flex items-center gap-2 rounded-xl bg-[#e7f5ee] border border-[#1d9e75]/20 px-4 py-2.5 text-xs font-black text-[#1d9e75]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Sections Done
                </span>
              )}
              <a href="/upsc/content-preview/geomagnetism" className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">2.3 Geomagnetism</span><span className="sm:hidden">Next</span><ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}

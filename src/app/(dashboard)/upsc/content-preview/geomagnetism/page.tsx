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

// ─── SVG Diagram 1: Earth Magnetic Field ─────────────────────────────────────
function EarthMagneticFieldDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-3">Earth&apos;s Magnetic Field — Dipole Pattern</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 540 560" className="w-72 h-72 shrink-0 mx-auto">
          <defs>
            <radialGradient id="earthMagGrad" cx="45%" cy="40%">
              <stop offset="0%" stopColor="#5a9e6f" />
              <stop offset="50%" stopColor="#1a5c32" />
              <stop offset="100%" stopColor="#0e3a1e" />
            </radialGradient>
          </defs>
          {/* Magnetosphere label area */}
          <text x="270" y="22" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">Magnetosphere</text>
          {/* Field lines — left side (from S pole curving to N pole) */}
          <path d="M270,370 C160,370 60,270 60,200 C60,130 160,60 270,60" stroke="#3b82f6" strokeWidth="2.5" fill="none" opacity="0.85">
            <marker id="arrowL1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
          </path>
          <path d="M270,370 C190,370 110,290 110,220 C110,150 190,80 270,80" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M270,350 C220,350 180,310 180,215 C180,120 220,75 270,90" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Field lines — right side */}
          <path d="M270,370 C380,370 480,270 480,200 C480,130 380,60 270,60" stroke="#3b82f6" strokeWidth="2.5" fill="none" opacity="0.85" />
          <path d="M270,370 C350,370 430,290 430,220 C430,150 350,80 270,80" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M270,350 C320,350 360,310 360,215 C360,120 320,75 270,90" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Arrows on field lines indicating direction (S→N pole) */}
          <polygon points="270,68 265,82 275,82" fill="#3b82f6" opacity="0.9" />
          <polygon points="66,196 80,192 78,204" fill="#3b82f6" opacity="0.8" />
          <polygon points="474,196 460,192 462,204" fill="#3b82f6" opacity="0.8" />
          {/* Earth circle */}
          <circle cx="270" cy="215" r="95" fill="url(#earthMagGrad)" />
          {/* Rotation axis — thin white dashed line */}
          <line x1="270" y1="100" x2="270" y2="330" stroke="white" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.6" />
          {/* Magnetic axis — tilted 11° */}
          <line x1="255" y1="105" x2="285" y2="325" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" opacity="0.9" />
          {/* Geographic North Pole label */}
          <circle cx="270" cy="120" r="5" fill="white" opacity="0.9" />
          <text x="280" y="118" fill="white" fontSize="9" fontWeight="bold">Geographic N</text>
          {/* Magnetic North Pole label — offset */}
          <circle cx="260" cy="125" r="4.5" fill="#f59e0b" opacity="0.95" />
          <text x="230" y="140" fill="#f59e0b" fontSize="9" fontWeight="bold">Magnetic N (11° off)</text>
          {/* South labels */}
          <text x="230" y="320" fill="white" fontSize="9" fontWeight="bold">Geographic S</text>
          <text x="228" y="338" fill="#f59e0b" fontSize="9">Magnetic S</text>
          {/* 11° angle arc */}
          <path d="M270,150 A20,20 0 0,1 253,160" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
          <text x="240" y="170" fill="#f59e0b" fontSize="9">11°</text>
          {/* Equator label */}
          <line x1="175" y1="215" x2="365" y2="215" stroke="white" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          <text x="370" y="218" fill="white" fontSize="8">Equator</text>
        </svg>
        <div className="space-y-2 flex-1">
          {[
            { label: "Magnetic Inclination at Equator", value: "0°", note: "Field is horizontal at the magnetic equator" },
            { label: "Magnetic Inclination at Poles", value: "90°", note: "Field dips vertically at the magnetic poles" },
            { label: "Dipole Tilt from Rotation Axis", value: "11°", note: "Magnetic North ≠ Geographic North" },
            { label: "Declination", value: "Variable", note: "Angle between magnetic north and geographic north at a given location" },
            { label: "Magnetosphere Extent (Day Side)", value: "~10 Re", note: "Earth radii; extends millions of km on night side (magnetotail)" },
          ].map((f, i) => (
            <div key={i} className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-[#1a3a2a]">{f.label}</span>
                <span className="text-[10px] font-black text-[#1d9e75] shrink-0">{f.value}</span>
              </div>
              <p className="text-[10px] text-[#5d675f]">{f.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG Diagram 2: Polarity Reversal Timeline ────────────────────────────────
function PolarityReversalTimeline() {
  // Timeline: 0 Ma (left) to 5 Ma (right), total 500px
  // Scale: 100px per Ma
  const epochs = [
    { name: "Brunhes Normal", start: 0, end: 0.78, color: "#1a3a2a", textColor: "white" },
    { name: "Matuyama Reversed", start: 0.78, end: 2.58, color: "#f0ede5", textColor: "#1a3a2a" },
    { name: "Gauss Normal", start: 2.58, end: 3.58, color: "#1a3a2a", textColor: "white" },
    { name: "Gilbert Reversed", start: 3.58, end: 5.0, color: "#f0ede5", textColor: "#1a3a2a" },
  ];
  const subevents = [
    { name: "Jaramillo", start: 0.99, end: 1.07, color: "#1a3a2a" },
    { name: "Olduvai", start: 1.78, end: 1.95, color: "#1a3a2a" },
  ];
  const scale = 100; // px per Ma
  const offsetX = 20;
  const barY = 60;
  const barH = 40;

  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-1">Geomagnetic Polarity Timescale (GPTS)</p>
      <p className="text-[10px] text-center text-[#49675e] mb-3">Normal = Dark Green · Reversed = Light Paper</p>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 560 160" className="w-full min-w-[420px] h-40">
          {/* Epoch bars */}
          {epochs.map((ep, i) => {
            const x = offsetX + ep.start * scale;
            const w = (ep.end - ep.start) * scale;
            return (
              <g key={i}>
                <rect x={x} y={barY} width={w} height={barH} fill={ep.color} stroke="#b9d9cd" strokeWidth="0.5" rx="2" />
                {w > 30 && (
                  <text x={x + w / 2} y={barY + 14} textAnchor="middle" fill={ep.textColor} fontSize="8" fontWeight="bold">{ep.name}</text>
                )}
                {w > 30 && (
                  <text x={x + w / 2} y={barY + 26} textAnchor="middle" fill={ep.textColor} fontSize="7">{ep.start}–{ep.end} Ma</text>
                )}
              </g>
            );
          })}
          {/* Sub-events within Matuyama */}
          {subevents.map((se, i) => {
            const x = offsetX + se.start * scale;
            const w = (se.end - se.start) * scale;
            return (
              <g key={i}>
                <rect x={x} y={barY + 5} width={w} height={barH - 10} fill={se.color} stroke="#b9d9cd" strokeWidth="0.5" rx="1" />
                <text x={x + w / 2} y={barY + 17} textAnchor="middle" fill="white" fontSize="6.5" fontWeight="bold">{se.name}</text>
              </g>
            );
          })}
          {/* Tick marks every 0.5 Ma */}
          {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(t => (
            <g key={t}>
              <line x1={offsetX + t * scale} y1={barY + barH} x2={offsetX + t * scale} y2={barY + barH + 8} stroke="#49675e" strokeWidth="1" />
              <text x={offsetX + t * scale} y={barY + barH + 18} textAnchor="middle" fill="#49675e" fontSize="8">{t}</text>
            </g>
          ))}
          {/* Axis label */}
          <text x={offsetX} y={barY + barH + 30} fill="#49675e" fontSize="8" fontWeight="bold">Present</text>
          <text x={offsetX + 5 * scale - 20} y={barY + barH + 30} fill="#49675e" fontSize="8" fontWeight="bold">5 Ma ago</text>
          <text x={offsetX + 2.5 * scale} y={barY + barH + 30} textAnchor="middle" fill="#49675e" fontSize="7">Million Years Ago (Ma)</text>
          {/* Arrow indicating time direction */}
          <line x1={offsetX + 5 * scale} y1={barY - 10} x2={offsetX} y2={barY - 10} stroke="#49675e" strokeWidth="1" markerEnd="url(#arrowTime)" />
          <defs>
            <marker id="arrowTime" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#49675e" />
            </marker>
          </defs>
          <text x={offsetX + 2.5 * scale} y={barY - 14} textAnchor="middle" fill="#49675e" fontSize="7">Time direction →</text>
          {/* Legend */}
          <rect x={offsetX} y={10} width="14" height="10" fill="#1a3a2a" rx="1" />
          <text x={offsetX + 18} y={19} fill="#1a3a2a" fontSize="8" fontWeight="bold">Normal polarity</text>
          <rect x={offsetX + 110} y={10} width="14" height="10" fill="#f0ede5" stroke="#b9d9cd" strokeWidth="0.5" rx="1" />
          <text x={offsetX + 128} y={19} fill="#1a3a2a" fontSize="8" fontWeight="bold">Reversed polarity</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 2.2, we learned that Earth&apos;s liquid outer core generates a magnetic field through the geodynamo. Now we explore that field in depth — how it protects Earth, how it has reversed in the past, and how ancient magnetic signatures in rocks became the decisive proof for continental drift." />

      {/* Geodynamo */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🧲 Earth&apos;s Magnetic Field — The Geodynamo</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Generated by **convection of liquid iron-nickel** in the outer core — the **geodynamo** mechanism." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Approximates a **dipole** tilted **11°** from Earth&apos;s rotation axis — like a giant bar magnet slightly off-centre." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Magnetic North Pole ≠ Geographic North Pole** — currently located in **northern Canada**, slowly drifting toward Siberia (~50 km/year)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Declination** = horizontal angle between magnetic north and geographic north — used in navigation and requires regular recalibration of GPS/compasses." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Inclination** = vertical dip of the field from horizontal: **0° at magnetic equator**, **90° at magnetic poles**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Field extends thousands of km into space = **magnetosphere** — deflects solar wind particles and cosmic rays, shielding Earth&apos;s atmosphere." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Without magnetosphere → **Mars fate**: solar wind strips the atmosphere over geological time. Mars once had a magnetic field but lost it ~4 Ga ago." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="India&apos;s **Aditya-L1** mission (2023) studies **solar wind interaction** with magnetospheres from the L1 Lagrange point." /></li>
        </ul>
      </div>

      <EarthMagneticFieldDiagram />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Magnetic declination and inclination — UPSC Prelims 2019, 2021
        </span>
      </div>

      {/* Magnetosphere */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🛡️ Magnetosphere — Earth&apos;s Shield</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Bow shock** on day side (~10 Earth radii); **magnetotail** extends millions of km on night side (solar wind pushes it back)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Van Allen Radiation Belts** — Inner belt (protons, ~1,000–6,000 km altitude); Outer belt (electrons, ~13,000–60,000 km)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Aurora Borealis** (Northern Lights) and **Aurora Australis** (Southern Lights) — caused by solar wind particles channelled along field lines into the polar atmosphere, exciting gas molecules to emit light." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Geomagnetic storms** from **Coronal Mass Ejections (CMEs)** can disrupt satellites, power grids, GPS, and radio communications — **space weather** is an active research and policy area." /></li>
        </ul>
      </div>

      {/* Reversals */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔄 Magnetic Reversals — Polarity Flips</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Earth&apos;s magnetic field has **reversed polarity hundreds of times** in geological history — recorded in the rock record." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Current epoch: **Brunhes Normal Chron** — last **780,000 years (0.78 Ma)**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Previous: **Matuyama Reversed Chron** (**0.78–2.58 Ma**); sub-events include **Jaramillo** (0.99–1.07 Ma) and **Olduvai** (1.78–1.95 Ma) normal episodes." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Before that: **Gauss Normal** (2.58–3.58 Ma), **Gilbert Reversed** (3.58–5.0 Ma)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Reversals are **RANDOM in timing** — no fixed periodicity. Cannot be predicted." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="During reversal: field **weakens** → multiple poles appear → field re-establishes with **opposite polarity**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Reversals take **1,000–10,000 years** — NOT instantaneous. Gradual transition over human-geological timescales." /></li>
        </ul>
      </div>

      <PolarityReversalTimeline />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Brunhes, Matuyama chrons — UPSC Prelims 2022; Vine-Matthews — UPSC Mains GS-1 2018
        </span>
      </div>

      {/* Paleomagnetism */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🪨 Paleomagnetism — Fossil Magnetism</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="When **igneous rocks** cool below the **Curie temperature** (~580°C for magnetite), magnetic minerals permanently **lock in** the ambient field direction." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="This &apos;fossil magnetism&apos; records the **direction and inclination** of Earth&apos;s field at the time of cooling — a paleomagnetic signature." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Inclination** reveals **former latitude**; **Declination** reveals former orientation relative to the poles." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Sedimentary rocks** also preserve paleomagnetism when magnetic particles align during deposition before lithification." /></li>
        </ul>
      </div>

      {/* APW */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📐 Apparent Polar Wander (APW)</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="When paleomagnetism is traced backwards in time, the **magnetic pole appears to have wandered** — hence &apos;Apparent Polar Wander&apos;." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Different continents show **different APW paths** — because they moved independently. But paths **CONVERGE** when continents are reassembled into Gondwana/Pangaea positions." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="This convergence is **quantitative proof** of continental drift — exact positions and past velocities of continents are calculable from APW data." /></li>
        </ul>
      </div>

      {/* Vine-Matthews */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌊 Vine-Matthews Hypothesis (1963) — Key UPSC Topic</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Fred Vine and Drummond Matthews (1963): ocean floor shows **symmetric magnetic stripe anomalies** on both sides of mid-ocean ridges." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Each stripe = one **polarity epoch** recorded as magma cooled at the ridge and **spread outward** symmetrically." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Normal polarity stripes = **dark** (same as today); Reversed polarity stripes = **light** — mirror image on both sides." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Proves seafloor spreading** — most direct measurable evidence. Vindicates **Harry Hess&apos;s seafloor spreading hypothesis** (1962)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Enables **calculation of spreading rates** from stripe widths and the known GPTS polarity timescale." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight — Most Important UPSC Linkage" tone="amber">
        Vine-Matthews is the most important linkage between paleomagnetism and plate tectonics. The symmetric magnetic stripes are the DIRECT EVIDENCE for seafloor spreading. UPSC tests this in both prelims and mains.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="Forward — What Comes Next" tone="blue">
        Paleomagnetism and magnetic anomalies set the stage for the complete plate tectonics story. In Topic 3.1 (Continental Drift), we see how all these lines of evidence converged.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────
function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {[
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 3",
          pages: "Seafloor Spreading & Magnetic Anomalies",
          points: [
            "**Magnetic anomalies as evidence for seafloor spreading.** NCERT presents the symmetric stripe pattern about mid-ocean ridges as validating Hess&apos;s hypothesis.",
            "NCERT states that each stripe on the ocean floor corresponds to a period of normal or reversed polarity — directly linking the GPTS to oceanic crust formation.",
            "The Vine-Matthews explanation is introduced as the mechanism: magma at ridges records ambient field direction, then spreads laterally.",
            "UPSC directly tests: &apos;What is the significance of magnetic anomalies in oceans?&apos; — answer rooted in NCERT Chapter 3.",
          ],
        },
        {
          cls: "Class 11 — India: Physical Environment, Chapter 4 (Geomorphology)",
          pages: "Continental Drift Evidence",
          points: [
            "**Continental Drift evidence** — paleomagnetism presented as **quantitative proof** enabling measurement of past plate velocities.",
            "NCERT discusses how APW paths from different continents converge when Pangaea/Gondwana is reconstructed — key evidence section.",
            "Connects to Indian subcontinent&apos;s northward drift from Gondwana — paleomagnetic data gives India&apos;s ancient latitude (~35°S) before collision with Asia.",
            "UPSC Mains: paleomagnetism as one of several lines of evidence for continental drift — NCERT Chapter 4 is direct source material.",
          ],
        },
        {
          cls: "Class 7 — Our Environment (Geography)",
          pages: "Basic Magnetism & Navigation",
          points: [
            "**Basic magnetism** — compass points to **magnetic north**, not geographic north. Declination explained simply for foundational understanding.",
            "NCERT introduces the concept that Earth behaves like a giant magnet — sets the stage for deeper treatment in Class 11.",
            "Navigation context: sailors and aviators must correct for magnetic declination — practical application that UPSC sometimes tests in current affairs context.",
          ],
        },
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
    {
      tag: "🇮🇳 India",
      title: "Aditya-L1 — Solar Wind & Magnetosphere (2024)",
      text: "India&apos;s **Aditya-L1** spacecraft, positioned at the **Sun-Earth L1 Lagrange point**, is studying solar wind composition and its interaction with Earth&apos;s magnetosphere. Data from its ASPEX payload provides real-time measurements of proton and alpha particle fluxes — directly relevant to understanding how the magnetosphere shields Earth from solar energetic particles.",
    },
    {
      tag: "🌍 Space",
      title: "G5 Geomagnetic Storm — May 2024",
      text: "The **strongest geomagnetic storm in 20 years** (G5 level, Kp-index = 9) struck Earth in May 2024 following multiple **Coronal Mass Ejections (CMEs)**. Auroras were visible at unusually low latitudes including parts of **northern India, Europe, and North America**. The storm disrupted GPS signals, HF radio communications, and caused voltage irregularities in power grids — illustrating real space weather threats to modern infrastructure.",
    },
    {
      tag: "🌍 Science",
      title: "Magnetic North Pole Acceleration",
      text: "The **magnetic north pole** has been accelerating its drift from **northern Canada toward Siberia** at approximately **50 km/year** — the fastest rate observed in recorded history. This drift has required unusually frequent updates to the **World Magnetic Model (WMM)**, which underpins GPS navigation, aircraft instruments, and smartphone compass apps. The last emergency update was in 2019; the 2025 update is due. UPSC has tested declination and pole drift concepts.",
    },
    {
      tag: "🇮🇳 India",
      title: "NISAR Satellite — Magnetic Field Variations",
      text: "The joint **NASA-ISRO SAR (NISAR)** satellite mission (launch planned 2025) will use synthetic aperture radar to study Earth surface deformations, crustal movements, and also **variations in Earth&apos;s magnetic field** affecting satellite navigation. Understanding regional magnetic anomalies improves the accuracy of navigation and geodetic surveys across the Indian subcontinent.",
    },
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
    {
      wrong: "'Magnetic North Pole = Geographic North Pole'",
      right: "They are approximately 11° apart. The Magnetic North Pole is currently in northern Canada and is moving toward Siberia at ~50 km/year. Compasses point to Magnetic North, which must be corrected for Declination to find true Geographic North.",
    },
    {
      wrong: "'Earth&apos;s magnetic field has always had the same polarity'",
      right: "Earth&apos;s field has reversed hundreds of times. The current Normal polarity (Brunhes Chron) only started 0.78 Ma ago. Before that was the Matuyama Reversed Chron. The GPTS is direct evidence of these reversals recorded in ocean floor rocks.",
    },
    {
      wrong: "'Paleomagnetism proves continental drift through rock composition'",
      right: "Paleomagnetism proves it through MAGNETIC DIRECTION (inclination and declination) preserved in rocks when they cooled below the Curie temperature — NOT through rock composition. Inclination reveals former latitude; declination reveals orientation to poles.",
    },
    {
      wrong: "'Vine-Matthews hypothesis proposed seafloor spreading'",
      right: "Vine-Matthews (1963) explained the SYMMETRIC MAGNETIC ANOMALIES as evidence FOR seafloor spreading. Seafloor spreading was proposed by Harry Hess (1962). Vine-Matthews provided the measurable proof — don&apos;t conflate the hypothesis with the evidence.",
    },
    {
      wrong: "'Magnetic reversal is instantaneous — poles flip overnight'",
      right: "Reversals take 1,000–10,000 years. During the transition, the field weakens significantly, multiple poles appear, and then the field re-establishes with opposite polarity. It is a gradual geophysical process, not a sudden event.",
    },
    {
      wrong: "'Aurora Borealis is caused by the Sun directly heating the atmosphere'",
      right: "Auroras are caused by solar wind particles channelled along Earth&apos;s magnetic field lines into the polar atmosphere. These particles collide with and excite gas molecules (oxygen and nitrogen), which then emit light when they return to ground state. It is electromagnetic, not thermal.",
    },
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
    {
      id: 1, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about Earth&apos;s magnetic field:",
      stmts: [
        "Earth&apos;s magnetic field is generated by convection of liquid iron-nickel in the outer core (geodynamo).",
        "The magnetic dipole is tilted approximately 11° from Earth&apos;s rotation axis.",
        "The magnetosphere deflects solar wind and cosmic rays, protecting Earth&apos;s atmosphere.",
        "Magnetic reversals occur at regular, predictable intervals of approximately 500,000 years.",
      ],
      opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — magnetic reversals are RANDOM with no fixed periodicity. They have occurred as frequently as every 20,000 years and as rarely as every few million years. The current Brunhes Normal has lasted 780,000 years, which is already longer than many previous epochs.",
    },
    {
      id: 2, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about paleomagnetism:",
      stmts: [
        "When igneous rocks cool below the Curie temperature, magnetic minerals permanently lock in the ambient field direction.",
        "Paleomagnetic inclination in a rock can be used to determine the former latitude of that rock.",
        "Apparent Polar Wander paths from different continents diverge when those continents are reassembled into Pangaea.",
        "Sedimentary rocks can also preserve paleomagnetic signatures when magnetic particles align during deposition.",
      ],
      opts: ["1, 2 and 4 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 4 are CORRECT. Statement 3 is WRONG — APW paths CONVERGE (not diverge) when continents are reassembled into Pangaea. The convergence is the proof of continental drift: each continent drifted separately, so their paths are different, but when you reassemble Pangaea they align — showing they were once together near the same pole.",
    },
    {
      id: 3, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about the Vine-Matthews hypothesis:",
      stmts: [
        "It explains the symmetric magnetic stripe anomalies observed on both sides of mid-ocean ridges.",
        "Each stripe represents a polarity epoch recorded in oceanic crust as it cooled and spread away from the ridge.",
        "The hypothesis provides direct evidence for seafloor spreading as proposed by Harry Hess.",
        "The width of each stripe can be used to calculate the rate of seafloor spreading.",
      ],
      opts: ["All four", "1, 2 and 3 only", "1 and 4 only", "2, 3 and 4 only"],
      correct: 0,
      explain: "All four statements are CORRECT. Vine and Matthews (1963) explained symmetric stripes as polarity epochs frozen into oceanic crust at ridges. This directly validated Hess&apos;s 1962 seafloor spreading model. And since the GPTS gives the timing of each polarity epoch, stripe width ÷ epoch duration = spreading rate. This is why Vine-Matthews is so significant.",
    },
    {
      id: 4, type: "HOW MANY CORRECT",
      stem: "How many of the following pairs correctly match the polarity chron with its description?",
      stmts: [
        "Brunhes — Normal polarity — 0 to 0.78 Ma",
        "Matuyama — Normal polarity — 0.78 to 2.58 Ma",
        "Gauss — Normal polarity — 2.58 to 3.58 Ma",
        "Gilbert — Reversed polarity — 3.58 to 5.0 Ma",
      ],
      opts: ["Only two", "Only three", "All four", "Only one"],
      correct: 1,
      explain: "Three pairs are correct: Brunhes (1), Gauss (3), and Gilbert (4). Pair 2 is WRONG — Matuyama is a REVERSED chron, not Normal. Matuyama Reversed: 0.78–2.58 Ma. This is a common UPSC trap — Matuyama is reversed while Brunhes (current) and Gauss are normal.",
    },
    {
      id: 5, type: "HOW MANY CORRECT",
      stem: "How many of the following correctly describe properties of Earth&apos;s magnetosphere?",
      stmts: [
        "It deflects solar wind particles away from Earth&apos;s atmosphere.",
        "The Van Allen Radiation Belts are regions within the magnetosphere with high particle flux.",
        "Auroras (Borealis and Australis) are caused by solar particles channelled to polar regions.",
        "The magnetosphere keeps Earth&apos;s rotation rate stable over geological time.",
        "Coronal Mass Ejections can compress the magnetosphere and disrupt GPS and power grids.",
      ],
      opts: ["Only two", "Only three", "Only four", "All five"],
      correct: 2,
      explain: "Statements 1, 2, 3, and 5 are CORRECT. Statement 4 is WRONG — the magnetosphere has no role in stabilising Earth&apos;s rotation. Earth&apos;s rotation is governed by angular momentum and is slowed very slightly by tidal friction from the Moon — nothing to do with the magnetosphere. Four statements are correct.",
    },
    {
      id: 6, type: "ASSERTION-REASON",
      stem: "Assertion (A): Different continents show different Apparent Polar Wander (APW) paths when plotted separately, but the paths converge when the continents are reassembled into Gondwana/Pangaea.\n\nReason (R): Each continent recorded the magnetic pole position from its own location as it drifted independently over geological time, so their paths diverged as the continents separated.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R correctly explains A. When Pangaea/Gondwana was assembled, all continents were recording the pole from the same relative position. After breakup, each drifted independently — so their APW paths diverge from the point of separation. Reassemble the continents and the paths align. This is the quantitative paleomagnetic proof of continental drift.",
    },
    {
      id: 7, type: "ASSERTION-REASON",
      stem: "Assertion (A): Symmetric magnetic stripe anomalies on both sides of mid-ocean ridges prove seafloor spreading.\n\nReason (R): New oceanic crust records the ambient magnetic field direction as it forms from magma at the ridge and then spreads laterally, creating a mirror image of polarity epochs on each flank.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R is the exact mechanism. Magma rises at ridges, records polarity as it cools below the Curie temperature, then spreads symmetrically. Each polarity epoch creates one stripe on each side. The symmetric pattern is explicable ONLY if the crust formed at the ridge and moved outward — this is the Vine-Matthews (1963) explanation that proved Hess&apos;s (1962) seafloor spreading.",
    },
    {
      id: 8, type: "NOT / EXCEPTION",
      stem: "Which of the following statements about paleomagnetism is NOT correct?",
      stmts: [],
      opts: [
        "Igneous rocks record the ambient magnetic field direction when they cool below the Curie temperature.",
        "Paleomagnetic inclination in a rock reveals the former latitude at which the rock formed.",
        "Paleomagnetic declination in a rock reveals the former longitude at which the rock formed.",
        "Apparent Polar Wander paths from separated continents converge when those continents are reassembled.",
      ],
      correct: 2,
      explain: "Option (c) is WRONG. Paleomagnetic declination does NOT reveal former longitude — it reveals the former orientation of the rock relative to the magnetic poles (azimuthal direction). Longitude cannot be determined from paleomagnetism alone. Inclination gives latitude; declination gives orientation. This is a classic UPSC-style precision trap.",
    },
    {
      id: 9, type: "NOT / EXCEPTION",
      stem: "Which of the following statements about magnetic reversals is NOT correct?",
      stmts: [],
      opts: [
        "The current Brunhes Normal Chron began approximately 0.78 million years ago.",
        "Magnetic reversals occur at regular, periodic intervals.",
        "During a reversal, the field weakens before re-establishing with opposite polarity.",
        "A magnetic reversal takes approximately 1,000 to 10,000 years to complete.",
      ],
      correct: 1,
      explain: "Option (b) is WRONG. Magnetic reversals are RANDOM — there is no fixed periodicity. The time between reversals has ranged from thousands to millions of years. The current Brunhes Normal at ~780,000 years is already longer than many previous intervals. Regularity/periodicity is the trap — never say reversals are periodic.",
    },
    {
      id: 10, type: "SCENARIO / APPLIED",
      stem: "A geologist finds an igneous rock sample with a magnetic polarity opposite to today&apos;s field (reversed polarity). Based on the Geomagnetic Polarity Timescale, which age range is most consistent with the sample having been deposited during the Matuyama Reversed Chron?",
      stmts: [],
      opts: ["0 to 0.78 Ma", "0.78 to 2.58 Ma", "2.58 to 3.58 Ma", "3.58 to 5.0 Ma"],
      correct: 1,
      explain: "The Matuyama Reversed Chron spans 0.78–2.58 Ma. Rocks with reversed polarity falling in this age range belong to Matuyama. Note: the Jaramillo (0.99–1.07 Ma) and Olduvai (1.78–1.95 Ma) sub-events within Matuyama are normal polarity episodes — so a reversed sample from 0.78–2.58 Ma (but not those sub-events) is Matuyama. Option (c) = Gauss Normal; (d) = Gilbert Reversed — also reversed, but older.",
    },
    {
      id: 11, type: "SCENARIO / APPLIED",
      stem: "An oceanographic survey maps magnetic stripe widths on both sides of a mid-ocean ridge. The pattern is: 25 km normal, 30 km reversed, 20 km normal (same on both sides). Given that the Brunhes Normal lasted 0.78 Ma and the ridge has been spreading symmetrically, what does this information primarily allow scientists to calculate?",
      stmts: [],
      opts: [
        "The depth of the ocean at that location",
        "The age and rate of seafloor spreading from the ridge",
        "The chemical composition of the oceanic crust",
        "The direction of the Earth&apos;s magnetic field at the time of formation",
      ],
      correct: 1,
      explain: "Stripe widths + known polarity epoch durations from the GPTS = spreading rate. If the Brunhes Normal stripe is 25 km wide and lasted 0.78 Ma, the half-spreading rate is 25/0.78 ≈ 32 km/Ma ≈ 3.2 cm/year. This is exactly how seafloor spreading rates are measured globally. The symmetric stripes also confirm seafloor spreading — the direct application of Vine-Matthews.",
    },
    {
      id: 12, type: "SCENARIO / APPLIED",
      stem: "During a G5 geomagnetic storm (like May 2024), the following sequence of events occurs. Arrange them in the correct causal order:\n\nP. GPS signals show increased positional errors in India\nQ. Ionosphere is heated and expanded by energetic particle bombardment\nR. Coronal Mass Ejection reaches Earth and compresses the magnetosphere\nS. Van Allen Belt particles are disturbed and injected into lower orbit",
      stmts: [],
      opts: ["R → S → Q → P", "Q → R → S → P", "R → Q → S → P", "S → R → Q → P"],
      correct: 0,
      explain: "Correct chain: R (CME compresses magnetosphere) → S (Van Allen belt disruption, particle injection) → Q (ionospheric heating and expansion from energetic particles) → P (ionospheric disruption causes GPS signal delay/error). The ionosphere is the medium through which GPS signals travel, so ionospheric disturbance directly affects positioning accuracy. This is the standard space weather impact chain.",
    },
    {
      id: 13, type: "MATCH THE PAIRS",
      stem: "Match the scientists with their contributions:\n\n1. Vine and Matthews\n2. Harry Hess\n3. Andrija Mohorovičić\n4. Inge Lehmann\n\nP. Proposed the seafloor spreading hypothesis (1962)\nQ. Explained symmetric magnetic stripe anomalies at mid-ocean ridges (1963)\nR. Discovered the crust-mantle boundary from seismic velocity change\nS. Discovered the solid inner core from P-wave arrivals in the shadow zone",
      stmts: [],
      opts: ["1-Q, 2-P, 3-R, 4-S", "1-P, 2-Q, 3-S, 4-R", "1-Q, 2-R, 3-P, 4-S", "1-R, 2-P, 3-Q, 4-S"],
      correct: 0,
      explain: "1-Q: Vine & Matthews explained magnetic anomalies (1963). 2-P: Harry Hess proposed seafloor spreading (1962). 3-R: Mohorovičić discovered the Moho crust-mantle boundary (1909). 4-S: Inge Lehmann discovered the solid inner core (1936) from anomalous P-wave arrivals inside the shadow zone. These four scientists are frequently tested together in UPSC prelims.",
    },
    {
      id: 14, type: "MATCH THE PAIRS",
      stem: "Match the geomagnetic polarity chrons with their correct descriptions:\n\n1. Brunhes\n2. Matuyama\n3. Gauss\n4. Gilbert\n\nP. Reversed polarity — 3.58 to 5.0 Ma\nQ. Normal polarity — 0 to 0.78 Ma (current)\nR. Reversed polarity — 0.78 to 2.58 Ma\nS. Normal polarity — 2.58 to 3.58 Ma",
      stmts: [],
      opts: ["1-Q, 2-R, 3-S, 4-P", "1-R, 2-Q, 3-P, 4-S", "1-Q, 2-S, 3-R, 4-P", "1-S, 2-R, 3-Q, 4-P"],
      correct: 0,
      explain: "1-Q: Brunhes = Normal, 0–0.78 Ma (current epoch). 2-R: Matuyama = Reversed, 0.78–2.58 Ma. 3-S: Gauss = Normal, 2.58–3.58 Ma. 4-P: Gilbert = Reversed, 3.58–5.0 Ma. The pattern is Normal-Reversed-Normal-Reversed going back in time. Key rule: Brunhes and Gauss are Normal; Matuyama and Gilbert are Reversed.",
    },
    {
      id: 15, type: "DIRECT RECALL",
      stem: "With reference to paleomagnetism and its significance, consider the following: [Based on UPSC 2018 Mains pattern]\n\n1. Paleomagnetic inclination data from rocks enables determination of the latitude at which those rocks originally formed.\n2. Apparent Polar Wander paths from different continents converge when the continents are reassembled into Gondwana/Pangaea.\n3. Symmetric magnetic stripe anomalies on both sides of mid-ocean ridges, as explained by Vine and Matthews, provide direct evidence for seafloor spreading.\n\nWhich of the above provide evidence for continental drift and/or seafloor spreading?",
      stmts: [],
      opts: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
      correct: 3,
      explain: "All three are correct. Statement 1: inclination revealing former latitude is foundational to paleomagnetism as evidence for drift. Statement 2: APW path convergence on Pangaea reassembly is the quantitative paleomagnetic proof of continental drift. Statement 3: Vine-Matthews symmetric stripes are the direct evidence for seafloor spreading (Hess&apos;s hypothesis). All three are standard UPSC answer points for this topic.",
    },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;

  if (submitted) return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      <div className="rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#085041]">Your Score</p>
          <p className="text-3xl font-black text-[#13251d]">{score}/{questions.length}</p>
          <p className="text-xs font-semibold text-[#49675e] mt-1">Accuracy: {Math.round((score / questions.length) * 100)}%</p>
        </div>
        <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-xl ${score >= 12 ? "bg-[#1d9e75]" : score >= 8 ? "bg-[#f59e0b]" : "bg-red-500"}`}>
          {Math.round((score / questions.length) * 100)}%
        </div>
      </div>
      {questions.map((q, qi) => (
        <div key={q.id} className={`rounded-xl border p-4 ${answers[q.id] === q.correct ? "border-[#b9d9cd] bg-[#f0fdf4]" : "border-red-200 bg-red-50/50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[#1a3a2a]/10 px-2 py-0.5 text-[8px] font-black text-[#1a3a2a]">{q.type}</span>
            <span className="text-xs font-bold text-[#5d675f]">Q{qi + 1}</span>
          </div>
          <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem.slice(0, 100)}...</p>
          <p className="mt-1 text-xs font-semibold">
            {answers[q.id] === q.correct
              ? <span className="text-[#1d9e75]">✓ Correct</span>
              : <span className="text-red-600">✗ Wrong — Correct: ({String.fromCharCode(97 + q.correct)})</span>}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#49675e] leading-5">{q.explain}</p>
        </div>
      ))}
      <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm font-black text-[#1d9e75] underline">Retry All</button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <p className="text-xs font-black uppercase text-[#085041]">15 Practice MCQs — All 7 UPSC Types • Answer all, then submit</p>
      {questions.map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }}
          className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">{q.type}</span>
            <span className="text-[10px] font-black text-[#5d675f]">Q{qi + 1}</span>
          </div>
          <p className="text-sm font-black text-[#13251d] leading-6 whitespace-pre-line">{q.stem}</p>
          {q.stmts.length > 0 && (
            <ol className="mt-2 space-y-1 pl-5">
              {q.stmts.map((s, i) => <li key={i} className="text-xs font-semibold text-[#31443a] list-decimal leading-5">{s}</li>)}
            </ol>
          )}
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {q.opts.map((opt, oi) => (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))}
                className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all duration-150 ${answers[q.id] === oi ? "border-[#1a3a2a] bg-[#e7f5ee] shadow-sm" : "border-[#e8e2d5] hover:border-[#1d9e75]/30"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dcd5c7] bg-white text-[9px] font-black">{String.fromCharCode(97 + oi)}</span>
                <span className="text-xs font-semibold text-[#13251d] leading-5">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSubmitted(true)}
        disabled={Object.keys(answers).length < questions.length}
        className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-4 text-sm font-black text-white shadow-lg disabled:opacity-40">
        Submit All ({Object.keys(answers).length}/15 answered)
      </motion.button>
    </motion.div>
  );
}

// ─── Mains Tab ────────────────────────────────────────────────────────────────
function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, { intro: string; body: string; conclusion: string }>>({
    0: { intro: "", body: "", conclusion: "" },
    1: { intro: "", body: "", conclusion: "" },
  });
  const [evaluating, setEvaluating] = useState(false);
  const questions = [
    {
      id: 0, paper: "GS-1 • 2018", marks: "15 Marks • 250 Words",
      text: "How does paleomagnetism provide evidence for continental drift and seafloor spreading? Explain with reference to the Vine-Matthews hypothesis.",
      framework: [
        "Intro: Paleomagnetism = fossil magnetism locked in rocks below Curie temperature (~580°C) — records field direction at time of cooling",
        "Body: APW paths — different continents show divergent paths that converge on Gondwana/Pangaea reassembly → quantitative proof of drift; inclination gives former latitude",
        "Body: Vine-Matthews (1963) — symmetric magnetic stripes on both sides of mid-ocean ridges; each stripe = one GPTS polarity epoch frozen into oceanic crust",
        "Body: Mechanism — magma at ridge cools, records ambient polarity, spreads symmetrically → mirror image on both flanks → direct evidence for Hess&apos;s seafloor spreading (1962)",
        "Body: Application — stripe width ÷ epoch duration = spreading rate; Atlantic spreading ~2–3 cm/yr; Pacific faster ~15 cm/yr",
        "Conclusion: Paleomagnetism transformed continental drift from a qualitative hypothesis into a quantitatively verified theory — foundation of modern plate tectonics",
      ],
    },
    {
      id: 1, paper: "GS-1", marks: "10 Marks • 150 Words",
      text: "Discuss the role of Earth&apos;s magnetic field in maintaining habitability. How does space weather threaten modern infrastructure?",
      framework: [
        "Intro: Earth&apos;s magnetic field — generated by geodynamo in liquid outer core — creates the magnetosphere, the primary shield enabling habitability",
        "Body: Habitability — deflects solar wind (preventing atmospheric stripping, cf. Mars); shields from cosmic radiation (DNA damage, ozone depletion); enables liquid water persistence",
        "Body: Van Allen belts trap energetic particles; auroras as benign manifestation of solar-magnetosphere interaction",
        "Body: Space weather threats — Coronal Mass Ejections (CMEs) compress magnetosphere; May 2024 G5 storm example; threats: GPS errors, satellite orbital decay, HF radio blackouts, power grid surges (Quebec 1989: 6M without power)",
        "Conclusion: Magnetic field is a prerequisite for complex life; space weather monitoring (Aditya-L1, NOAA SWPC) is essential for protecting modern digital infrastructure",
      ],
    },
  ];
  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
            {mq.paper}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[#99f6e4] bg-gradient-to-br from-[#f0fdfa] to-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9px] font-black text-[#0f766e]">{q.paper}</span>
          <span className="text-[9px] font-black text-[#5d675f]">{q.marks}</span>
        </div>
        <p className="text-[15px] font-black text-[#13251d] leading-7">{q.text}</p>
        <details className="mt-3">
          <summary className="text-xs font-black text-[#0f766e] cursor-pointer">📋 View Answer Framework</summary>
          <ul className="mt-2 space-y-1 pl-3">
            {q.framework.map((f, i) => (
              <li key={i} className="text-xs font-semibold text-[#31443a] flex gap-2"><span className="text-[#0f766e]">→</span>{f}</li>
            ))}
          </ul>
        </details>
      </div>
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase text-[#085041]">✍️ Write Your Answer</p>
          <span className={`text-[10px] font-black ${wordCount > 0 ? "text-[#1d9e75]" : "text-[#5d675f]"}`}>{wordCount} words</span>
        </div>
        {[
          { label: "Introduction", key: "intro", h: "h-20", placeholder: "Open with context..." },
          { label: "Body", key: "body", h: "h-40", placeholder: "Develop the substantive argument..." },
          { label: "Conclusion", key: "conclusion", h: "h-20", placeholder: "Tie together, way forward..." },
        ].map((s, i) => (
          <div key={s.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">{i + 1}</span>
              <p className="text-xs font-black text-[#13251d]">{s.label}</p>
            </div>
            <textarea
              value={draft[s.key as keyof typeof draft]}
              onChange={e => setDrafts(p => ({ ...p, [activeQ]: { ...p[activeQ], [s.key]: e.target.value } }))}
              placeholder={s.placeholder}
              className={`w-full ${s.h} rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30`}
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEvaluating(true); setTimeout(() => setEvaluating(false), 2000); }}
            disabled={wordCount < 10 || evaluating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40">
            {evaluating ? "Evaluating…" : "🎯 Evaluate Your Mains Answer"}
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
    { label: "Dipole Tilt", value: "11°" },
    { label: "Brunhes Started", value: "0.78 Ma" },
    { label: "Matuyama", value: "Reversed" },
    { label: "Curie Temp", value: "~580°C" },
    { label: "Vine-Matthews", value: "1963" },
    { label: "Reversal Duration", value: "1K–10K yrs" },
    { label: "Hess Spreading", value: "1962" },
    { label: "Magnetosphere", value: "~10 Re day" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#1d9e75]" />
        <p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Prelims Fact Card — Memorize</p>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {facts.map(f => (
          <div key={f.label} className="rounded-lg bg-white/80 border border-[#b9d9cd] p-2 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase text-[#49675e] leading-tight">{f.label}</p>
            <p className="mt-0.5 text-xs font-black text-[#13251d]">{f.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#e8e2d5] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]" />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GeomagnetismPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));
  useEffect(() => { setVisitedTabs(prev => new Set([...prev, activeTab])); }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: MODERATE</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.3 Geomagnetism and Paleomagnetism
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
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isVisited = visitedTabs.has(tab.id);
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${isActive ? "bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]" : isVisited ? "text-[#1d9e75] hover:bg-[#e7f5ee]" : "text-[#5d675f] hover:bg-[#f7f4ee]"}`}>
                <Icon className="h-3.5 w-3.5" />{tab.label}
                {isVisited && !isActive && <CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        <FactCard />

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "learn" && <LearnTab />}
            {activeTab === "ncert" && <NcertTab />}
            {activeTab === "current" && <CurrentTab />}
            {activeTab === "traps" && <TrapsTab />}
            {activeTab === "mcq" && <McqTab />}
            {activeTab === "mains" && <MainsTab />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Ribbon */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              <a href="/upsc/content-preview/earth-interior"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">2.2 Internal Structure</span><span className="sm:hidden">Prev</span>
              </a>
              {nextTab ? (
                <button onClick={() => setActiveTab(nextTab.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all">
                  <span>Next: {nextTab.label}</span><ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-[#e7f5ee] border border-[#1d9e75]/20 px-4 py-2.5 text-xs font-black text-[#1d9e75]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Sections Done
                </span>
              )}
              <a href="/upsc/content-preview/geosynclines"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">2.4 Geosynclines</span><span className="sm:hidden">Next</span><ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}

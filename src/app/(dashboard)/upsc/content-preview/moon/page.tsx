"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Newspaper,
  Target,
  PenLine,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  Image as ImageIcon,
  Download,
} from "lucide-react";

// ─── Tab Configuration ───────────────────────────────────────────────────────

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "ncert", label: "NCERT", icon: GraduationCap },
  { id: "current", label: "Current Affairs", icon: Newspaper },
  { id: "traps", label: "Traps", icon: AlertTriangle },
  { id: "mcq", label: "MCQ Lab", icon: Target },
  { id: "mains", label: "Mains", icon: PenLine },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Rich Text with Highlights ────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-[15px] font-medium leading-8 text-[#1f2e26]">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-black text-[#1a3a2a] bg-gradient-to-r from-[#e7f5ee] to-[#d4f0e0] px-1.5 py-0.5 rounded-md">
            {part.slice(2, -2)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ─── Callout Box ─────────────────────────────────────────────────────────────

function Callout({ icon, title, children, tone = "green" }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: "green" | "amber" | "blue" }) {
  const colors = {
    green: "border-[#1d9e75]/30 bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4]",
    amber: "border-[#f59e0b]/30 bg-gradient-to-br from-[#fef9ec] to-[#fffbeb]",
    blue: "border-[#3b82f6]/30 bg-gradient-to-br from-[#eff6ff] to-[#f0f9ff]",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors[tone]} p-4 my-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p>
      </div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}


// ─── Learn Tab ────────────────────────────────────────────────────────────────

function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 1.5 we saw how the Moon stabilises Earth's axial tilt. Now we dive deep into our closest celestial neighbour — its violent origin, unique characteristics, and profound influence on Earth." />

      {/* Moon Basics */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌙 MOON BASICS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Orbits at **384,400 km**, diameter **3,474 km** (about **1/4** of Earth's)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Mass **1/81** of Earth, surface gravity **1/6** (**1.62 m/s²**)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Largest moon relative to its host planet** in the Solar System; **5th largest** moon overall." /></li>
        </ul>
      </div>

      {/* Giant Impact Hypothesis */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">💥 GIANT IMPACT HYPOTHESIS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Mars-sized protoplanet **Theia** collided with proto-Earth ~**4.5 Ga**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Evidence: **isotopic oxygen match** with Earth's mantle, tiny **iron core ~2%** (vs Earth's 32%), depleted **volatiles**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Rejected alternatives: **Fission** (Darwin 1879), **Capture**, **Co-accretion**." /></li>
        </ul>
      </div>

      {/* Lunar Surface */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🗺️ LUNAR SURFACE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Maria** — dark basaltic plains, **3.1–3.9 Ga**, ~**16%** of surface, concentrated on near side." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Highlands (Terrae)** — lighter, heavily cratered, ancient ~**4.4 Ga** — oldest lunar surfaces." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Chandrayaan-3** detected **sulphur** on lunar surface near the south pole." /></li>
        </ul>
      </div>

      {/* Tidal Locking */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔄 TIDAL LOCKING</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Same face always points toward Earth — rotation = revolution = **27.3 days** (sidereal month)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Synodic period** (new moon to new moon) = **29.5 days** (Earth also orbiting Sun)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Far side ≠ 'dark side' — receives the **same amount of sunlight** as near side." /></li>
        </ul>
      </div>

      {/* Tides */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌊 TIDES</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Caused by Moon's **differential gravity** on Earth's near vs far side → **two tidal bulges**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Spring tides** — Sun-Moon-Earth aligned (new/full moon) → highest range." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Neap tides** — Sun-Moon at right angles (quarter moons) → lowest range." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Bay of Fundy** (Canada) = **16 m**; **Gulf of Khambhat** (India) = **8–11 m**." /></li>
        </ul>
      </div>

      {/* Moon Receding */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📏 MOON RECEDING</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Moving away at **3.8 cm/year** due to tidal energy transfer." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Earth's day lengthening by **~2.3 ms per century**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Around **900 Ma**, an Earth day was only **18 hours** long." /></li>
        </ul>
      </div>

      {/* Habitability Role */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🛡️ HABITABILITY ROLE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Stabilises Earth's **axial tilt** at **~23.5°** — prevents chaotic 0°–85° variations." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Tides create **intertidal zones** — dynamic environments possibly crucial for emergence of life." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Giant impact may have enhanced Earth's **geodynamo** by adding energy and angular momentum to core." /></li>
        </ul>
      </div>

      {/* Giant Impact Hypothesis Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Giant Impact Hypothesis — Formation Stages</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Proto-Earth • Theia Impact • Debris Ring • Moon Coalescence</p>
        </div>
      </div>

      {/* PYQ Tags */}
      <div className="flex flex-wrap items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Spring tides tested in UPSC Prelims 2019
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Moon properties tested in UPSC Prelims 2021
        </span>
      </div>

      {/* Tide Mechanism Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Tide Mechanism — Spring &amp; Neap Tides</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Sun-Moon-Earth Alignment (Spring) • Right Angle Configuration (Neap) • Two Tidal Bulges</p>
        </div>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        The far side of the Moon is NOT the &apos;dark side&apos;. It receives the same amount of sunlight as the near side. It is simply never visible from Earth due to tidal locking. China&apos;s Chang&apos;e-4 and Chang&apos;e-6 have explored this region.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        This completes the Universe chapter. The next mega topic explores Earth&apos;s Interior — its layered structure, seismic waves, and how internal heat drives plate tectonics and volcanism.
      </Callout>
    </motion.div>
  );
}


// ─── NCERT Tab ────────────────────────────────────────────────────────────────

function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 6 — The Earth: Our Habitat, Chapter 1</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** 'The Moon is about 3,84,400 km from us… moves around Earth in about 27 days… same time to spin… has neither water nor air.' This establishes the basic facts of distance, orbital period, tidal locking, and the Moon's inhospitable surface." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 2 &amp; Chapter 14</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Testable Concept:** Chapter 2 places the Moon in the context of Earth's formation — the giant impact that created the Moon also influenced Earth's core dynamics. Chapter 14 covers **ocean tides** as a result of the gravitational interaction between the Sun, Moon, and Earth — directly linking lunar science to oceanography." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 7 — Our Environment, Chapter 5</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key Mechanism:** 'Tides = rhythmic rise and fall… gravitational force of Sun and Moon… Moon = primary cause.' NCERT clearly establishes that both Sun and Moon cause tides, but the Moon is the **primary driver** due to its proximity despite its smaller mass compared to the Sun." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🇮🇳 India", title: "Chandrayaan-3 — South Pole Landing (Aug 2023)", text: "**Chandrayaan-3** successfully landed near the **lunar south pole** in **August 2023**, making India the **first country** to achieve a soft landing at the south pole. The **Pragyan rover** detected **sulphur** and other elements using its LIBS instrument. This mission demonstrated India's growing lunar exploration capability and provided critical data on permanently shadowed regions." },
    { tag: "🌍 Space", title: "NASA Artemis Programme — Return to the Moon", text: "NASA's **Artemis programme** aims to return humans to the Moon by **2025–26**, establish the **Lunar Gateway** space station in lunar orbit, and build a sustainable presence. India signed the **Artemis Accords** in **June 2023**, joining international partners for peaceful lunar exploration and resource utilisation." },
    { tag: "🇨🇳 China", title: "Chang'e-6 — First Far-Side Sample Return (June 2024)", text: "China's **Chang'e-6** mission achieved the first-ever **sample return from the lunar far side** in **June 2024**, collecting material from the **South Pole-Aitken Basin** — one of the largest and oldest impact structures in the Solar System. These samples could reveal information about the Moon's deep interior and early Solar System history." },
    { tag: "🌍 Discovery", title: "Lunar Water Ice — Confirmed and Mapped", text: "**Lunar water ice** was confirmed by **Chandrayaan-1** (2008, M3 instrument) and NASA's **LCROSS** mission (2009). Water ice exists in **permanently shadowed craters** near the poles. This resource is critical for future lunar settlements — providing drinking water, oxygen, and rocket fuel. Multiple missions are now planned to characterise and extract this resource." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {events.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-[#a5f3fc] bg-gradient-to-br from-[#ecfeff] to-[#f0f9ff] p-5">
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
    { wrong: "'The far side of the Moon is always dark.'", right: "WRONG. The far side receives the same amount of sunlight as the near side. It is simply never visible from Earth due to tidal locking. 'Far side' ≠ 'dark side'." },
    { wrong: "'Tides are caused only by the Moon.'", right: "INCOMPLETE. Both the Sun and Moon cause tides. The Sun's tidal effect is about 46% of the Moon's. Spring tides occur when both forces align; neap tides when they oppose." },
    { wrong: "'India was the first to detect water on the Moon.'", right: "PARTIALLY CORRECT. Chandrayaan-1's M3 instrument provided the first definitive confirmation of water molecules on the lunar surface (2008). However, earlier missions had provided hints — the definitive confirmation credit goes to Chandrayaan-1." },
    { wrong: "'Spring tides occur in the spring season.'", right: "WRONG. Spring tides occur twice every month — at new moon and full moon — when Sun-Moon-Earth are aligned. The name 'spring' refers to water 'springing up' higher, NOT the season." },
    { wrong: "'The Moon revolves around Earth in 30 days.'", right: "IMPRECISE. The sidereal period (relative to stars) is 27.3 days. The synodic period (new moon to new moon) is 29.5 days. UPSC may test the distinction — always specify which period." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {traps.map((t, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 flex gap-3">
          <div className="shrink-0 mt-1">
            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            </div>
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


// ─── MCQ Lab Tab (15 Questions, 7 Types) ──────────────────────────────────────

function McqTab() {
  const questions = [
    // TYPE 1: MULTI-STATEMENT (3 questions)
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about the origin of the Moon:", stmts: ["The Giant Impact Hypothesis proposes that a Mars-sized body called Theia collided with proto-Earth.", "The Moon's isotopic oxygen ratios closely match those of Earth's mantle.", "The Moon has a large iron core constituting about 32% of its mass.", "The Fission Hypothesis proposed by Darwin in 1879 is the currently accepted model."], opts: ["1 and 2 only", "1, 2 and 3 only", "1, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — Theia impact ~4.5 Ga is the accepted model. Statement 2: CORRECT — isotopic similarity is key evidence for the Giant Impact Hypothesis. Statement 3: WRONG — Moon's iron core is only ~2% of its mass (Earth's is 32%). Statement 4: WRONG — Fission Hypothesis is REJECTED, Giant Impact is accepted." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements about ocean tides:", stmts: ["Spring tides occur when the Sun, Moon and Earth are aligned.", "Neap tides produce the highest tidal range.", "The Bay of Fundy has the world's largest tidal range at approximately 16 metres.", "In India, the Gulf of Khambhat has a tidal range of 8–11 metres."], opts: ["1, 3 and 4 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — spring tides at new/full moon when Sun-Moon-Earth aligned. Statement 2: WRONG — neap tides produce the LOWEST range (spring tides produce highest). Statement 3: CORRECT — Bay of Fundy ~16 m. Statement 4: CORRECT — Gulf of Khambhat 8–11 m, India's highest." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following characteristics of the Moon:", stmts: ["The Moon's surface gravity is approximately 1/6 of Earth's.", "The synodic period of the Moon is 27.3 days.", "Maria are dark basaltic plains formed 3.1–3.9 billion years ago.", "The Moon is the largest satellite relative to its host planet in the Solar System."], opts: ["1, 3 and 4 only", "1, 2 and 3 only", "1 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — 1/6 Earth gravity (1.62 m/s²). Statement 2: WRONG — 27.3 days is the SIDEREAL period; the synodic period is 29.5 days. Statement 3: CORRECT — Maria are basaltic lava flows dating 3.1–3.9 Ga. Statement 4: CORRECT — largest moon relative to host planet." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following are evidence supporting the Giant Impact Hypothesis for Moon's formation?", stmts: ["Isotopic oxygen ratios in lunar samples match Earth's mantle.", "The Moon has a disproportionately small iron core (~2% vs Earth's 32%).", "Lunar rocks are depleted in volatile elements.", "The Moon's orbit is in Earth's equatorial plane.", "Angular momentum of the Earth-Moon system is consistent with a giant impact."], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1, 2, 3, and 5 are valid evidence. Statement 4 is WRONG — the Moon's orbit is actually tilted ~5° from the ecliptic, not in Earth's equatorial plane. Four correct." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following describe the Moon's influence on Earth?", stmts: ["Stabilises Earth's axial tilt at approximately 23.5°", "Creates tidal forces that produce intertidal ecological zones", "The giant impact may have enhanced Earth's geodynamo", "Causes Earth's rotation to slow down over time", "Prevents all asteroid impacts on Earth"], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1, 2, 3, and 4 are CORRECT. The Moon stabilises tilt, creates tides and intertidal zones, the impact may have enhanced the geodynamo, and tidal friction slows Earth's rotation. Statement 5 is WRONG — Jupiter acts as the asteroid shield, not the Moon. Four correct." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): The same face of the Moon always points toward Earth.\n\nReason (R): The Moon's rotational period equals its orbital period around Earth due to tidal locking.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. Tidal locking occurs because Earth's gravity created a tidal bulge on the Moon that acted as a brake, synchronising rotation and revolution at 27.3 days. This is why we always see the same face — a direct consequence of tidal locking." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The Moon plays a crucial role in maintaining Earth's climate stability.\n\nReason (R): Without the Moon, Earth's axial tilt could vary chaotically between 0° and 85°, causing extreme climate variations.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. The Moon's gravitational influence keeps Earth's tilt stable between 22.1°–24.5° over 41,000-year Milankovitch cycles. Without this stabilisation, chaotic tilt variations would produce extreme seasonal shifts incompatible with complex life. Mars (no large moon) shows such chaotic obliquity changes." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following statements about the Moon is NOT correct?", stmts: [], opts: ["The Moon is receding from Earth at 3.8 cm per year", "The Moon's diameter is approximately 3,474 km", "The far side of the Moon never receives sunlight", "The Moon's sidereal orbital period is 27.3 days"], correct: 2, explain: "Option (c) is WRONG — the far side receives the same amount of sunlight as the near side. It is simply not visible from Earth due to tidal locking. 'Far side' ≠ 'dark side'. All other statements are factually correct." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following about tides is NOT correct?", stmts: [], opts: ["Spring tides occur at new moon and full moon", "Neap tides occur when the Sun and Moon are at right angles relative to Earth", "Spring tides are named because they occur only in the spring season", "The Moon is the primary cause of tides due to its proximity to Earth"], correct: 2, explain: "Option (c) is WRONG — spring tides occur TWICE every month (at new and full moon), not seasonally. The term 'spring' refers to water 'springing up' or surging higher. All other options correctly describe tidal mechanics." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news report states: 'Chandrayaan-3 successfully landed near the lunar south pole in August 2023, with the Pragyan rover detecting sulphur.'\n\nA student makes three inferences:\n1. India is the first country to land a spacecraft near the lunar south pole.\n2. The detection of sulphur confirms the presence of water ice at the landing site.\n3. The mission's success demonstrates India's growing capability in deep-space exploration.\n\nWhich inference(s) is/are valid?", stmts: [], opts: ["1 and 3 only", "1, 2 and 3", "2 and 3 only", "1 only"], correct: 0, explain: "Inference 1: CORRECT — India was first to soft-land near the south pole. Inference 2: WRONG — sulphur detection does NOT confirm water ice; these are different findings. Water ice exists in permanently shadowed craters, not necessarily at the landing site. Inference 3: CORRECT — demonstrates India's advanced space capability." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "India signed the Artemis Accords in June 2023. Consider the following implications:\n1. India will participate in NASA's Lunar Gateway space station programme.\n2. India has committed to principles of peaceful exploration and resource utilisation on the Moon.\n3. India will exclusively use NASA rockets for future lunar missions.\n\nWhich implication(s) is/are valid?", stmts: [], opts: ["1 and 2 only", "2 only", "1, 2 and 3", "2 and 3 only"], correct: 1, explain: "Inference 1: PARTIALLY VALID but not guaranteed by Accords alone — the Accords are about principles, not specific programme membership. Inference 2: CORRECT — the Artemis Accords establish principles for peaceful, transparent space exploration and resource use. Inference 3: WRONG — Accords signatories retain independent space capabilities; India continues its own ISRO missions." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "India's Gulf of Khambhat has a tidal range of 8–11 metres. A policy brief proposes establishing a tidal energy plant here.\n\nThe primary geographical advantage of this location for tidal energy is:", stmts: [], opts: ["High tidal range due to funnel-shaped coastal morphology amplifying tidal flow", "Proximity to deep ocean trenches", "Location in the tropics ensures constant solar heating of water", "Presence of volcanic activity on the sea floor"], correct: 0, explain: "The Gulf of Khambhat's funnel shape (narrowing coastline) amplifies tidal range to 8–11 m — sufficient for commercial tidal energy generation. Tidal energy depends on tidal RANGE (height difference), which is enhanced by coastal geomorphology. Options (b), (c), (d) are irrelevant to tidal energy potential." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the Moon formation theories with their proponents/descriptions:\n\n1. Giant Impact Hypothesis — P. Moon captured from elsewhere by Earth's gravity\n2. Fission Hypothesis — Q. Theia collision with proto-Earth ~4.5 Ga\n3. Capture Hypothesis — R. Moon spun off from a rapidly rotating early Earth\n4. Co-accretion — S. Moon and Earth formed simultaneously from same material", stmts: [], opts: ["1-Q, 2-R, 3-P, 4-S", "1-R, 2-Q, 3-P, 4-S", "1-Q, 2-P, 3-R, 4-S", "1-P, 2-R, 3-Q, 4-S"], correct: 0, explain: "Giant Impact (1) = Q (Theia collision). Fission (2) = R (spun off from Earth — Darwin 1879). Capture (3) = P (gravitationally captured). Co-accretion (4) = S (formed together from same nebular material). Only Giant Impact is the accepted model." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match the tidal types with their characteristics:\n\n1. Spring Tides — P. Lowest tidal range, Sun-Moon at right angles\n2. Neap Tides — Q. Occur only during full moon\n3. Diurnal Tides — R. Highest tidal range, Sun-Moon-Earth aligned\n4. Semi-diurnal Tides — S. Two high and two low tides per day", stmts: [], opts: ["1-R, 2-P, 3-Q, 4-S", "1-P, 2-R, 3-Q, 4-S", "1-R, 2-P, 3-S, 4-Q", "1-Q, 2-P, 3-R, 4-S"], correct: 0, explain: "Spring Tides (1) = R (highest range, Sun-Moon-Earth aligned at new/full moon). Neap Tides (2) = P (lowest range, right angles). Note: Option Q says 'only during full moon' which is incomplete (spring tides occur at BOTH new and full moon) — this is a distractor. Diurnal (3) has one high/low per day but Q is the closest match in this set. Semi-diurnal (4) = S (two high/low per day, most common type)." },
    // TYPE 7: DIRECT RECALL (1 question — UPSC 2019 actual)
    { id: 15, type: "DIRECT RECALL", stem: "Consider the following statements about spring tides: [Based on UPSC Prelims 2019]\n1. Spring tides occur when the Sun, Moon and Earth are in a straight line.\n2. They occur twice a month — at new moon and full moon.\n3. The tidal range during spring tides is the maximum.\n\nWhich of the statements given above are correct?", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], correct: 3, explain: "ALL three are CORRECT. Statement 1: Spring tides occur when Sun-Moon-Earth are aligned (syzygy). Statement 2: This alignment happens at new moon (conjunction) and full moon (opposition) — twice per month. Statement 3: The combined gravitational pull of Sun and Moon produces the highest (maximum) tidal range. This is a classic UPSC recall question." },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;

  if (submitted) {
    return (
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
            <p className="mt-1 text-xs font-semibold">{answers[q.id] === q.correct ? <span className="text-[#1d9e75]">✓ Correct</span> : <span className="text-red-600">✗ Wrong — Correct: ({String.fromCharCode(97 + q.correct)})</span>}</p>
            <p className="mt-1 text-[11px] font-medium text-[#49675e] leading-5">{q.explain}</p>
          </div>
        ))}
        <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm font-black text-[#1d9e75] underline">Retry All</button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <p className="text-xs font-black uppercase text-[#085041]">15 Practice MCQs — All 7 UPSC Types • Answer all, then submit for report</p>
      {questions.map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }} className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
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
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))} className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all duration-150 ${answers[q.id] === oi ? "border-[#1a3a2a] bg-[#e7f5ee] shadow-sm" : "border-[#e8e2d5] hover:border-[#1d9e75]/30"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dcd5c7] bg-white text-[9px] font-black">{String.fromCharCode(97 + oi)}</span>
                <span className="text-xs font-semibold text-[#13251d] leading-5">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length} className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-4 text-sm font-black text-white shadow-lg disabled:opacity-40">
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
    { id: 0, paper: "GS-1 • 2017", marks: "10 Marks • 150 Words", text: "Explain the Giant Impact Hypothesis. How does the Moon influence Earth's environment?", framework: ["Intro: Moon as Earth's closest celestial companion — formed through violent collision", "Body: Giant Impact Hypothesis — Theia (~Mars-sized) collided with proto-Earth ~4.5 Ga", "Body: Evidence — isotopic oxygen match, tiny lunar iron core (2%), absence of volatiles", "Body: Moon's influence — stabilises axial tilt (23.5°), prevents chaotic obliquity", "Body: Tides — creates intertidal zones, critical for early life evolution", "Body: Earth's rotation slowing — Moon receding 3.8 cm/yr, day lengthening", "Conclusion: Moon is not just a companion but an essential factor in Earth's habitability; link to ISRO Chandrayaan missions expanding our understanding"] },
    { id: 1, paper: "GS-1 • 2020", marks: "15 Marks • 250 Words", text: "Discuss ocean tides and their geographical significance. How can tidal energy be harnessed in India?", framework: ["Intro: Tides as rhythmic rise and fall of sea level driven by gravitational forces", "Body: Mechanism — differential gravitational pull of Moon (primary) and Sun creates two bulges", "Body: Types — Spring tides (alignment, max range), Neap tides (right angles, min range)", "Body: Geographical significance — navigation, port operations, intertidal ecosystems, sediment transport", "Body: Global examples — Bay of Fundy (16 m), Severn Estuary (14 m)", "Body: India's potential — Gulf of Khambhat (8–11 m), Gulf of Kutch (5–8 m), Sundarbans", "Body: Technologies — tidal barrage, tidal stream generators, tidal lagoons", "Body: Challenges — high capital cost, environmental impact on estuaries, intermittent generation", "Conclusion: India's long coastline and high-range sites make tidal energy viable; integrate with National Offshore Wind Energy Policy"] },
  ];

  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
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
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">1</span>
            <p className="text-xs font-black text-[#13251d]">Introduction</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Define scope, set up answer</p>
          </div>
          <textarea value={draft.intro} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], intro: e.target.value } }))} placeholder="Open with context, a definition, or the crux of the demand…" className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">2</span>
            <p className="text-xs font-black text-[#13251d]">Body</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Core argument, examples, dimensions</p>
          </div>
          <textarea value={draft.body} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], body: e.target.value } }))} placeholder="Develop the substantive argument with structured points, examples, data…" className="w-full h-40 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">3</span>
            <p className="text-xs font-black text-[#13251d]">Conclusion</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Forward-looking synthesis, way forward</p>
          </div>
          <textarea value={draft.conclusion} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], conclusion: e.target.value } }))} placeholder="Tie the argument together and end on a way-forward note…" className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setEvaluating(true); setTimeout(() => setEvaluating(false), 2000); }} disabled={wordCount < 10 || evaluating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40 transition-all">
            {evaluating ? "Evaluating…" : "🎯 Evaluate Your Mains Answer"}
          </motion.button>
          <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#99f6e4] px-4 py-2.5 text-xs font-black text-[#0f766e] cursor-pointer hover:bg-[#f0fdfa] transition">
            📷 Upload Handwritten
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fact Card ─────────────────────────────────────────────────────────────────

function FactCard() {
  const facts = [
    { label: "Moon Distance", value: "384,400 km" },
    { label: "Diameter", value: "3,474 km" },
    { label: "Gravity", value: "1/6 Earth" },
    { label: "Sidereal Period", value: "27.3 days" },
    { label: "Synodic Period", value: "29.5 days" },
    { label: "Recession Rate", value: "3.8 cm/yr" },
    { label: "Theia Impact", value: "4.5 Ga" },
    { label: "Tidal Range India", value: "8–11 m" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#e8e2d5] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]" />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MoonPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));

  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: HIGH</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: MODERATE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.6 The Moon — Origin, Characteristics, and Influence on Earth
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">Earth and Its Origin (The Universe) › Geomorphology</p>
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
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
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

        {/* Navigation Ribbon — Previous Topic | Next Section | Chapter Complete */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              {/* Previous Topic */}
              <a href="/upsc/content-preview/earth-uniqueness"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.5 Earth</span>
                <span className="sm:hidden">Prev</span>
              </a>
              {/* Next Section */}
              {nextTab ? (
                <button onClick={() => setActiveTab(nextTab.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all">
                  <span>Next: {nextTab.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-[#e7f5ee] border border-[#1d9e75]/20 px-4 py-2.5 text-xs font-black text-[#1d9e75]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Sections Done
                </span>
              )}
              {/* Last topic — Chapter Complete */}
              <span className="flex items-center gap-2 rounded-xl border border-[#e8e2d5] px-3 py-2.5 text-xs font-black text-[#c9c3b8]">
                <span className="hidden sm:inline">Chapter Complete</span>
                <span className="sm:hidden">End</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </motion.div>
          );
        })()}

      </div>
    </main>
  );
}

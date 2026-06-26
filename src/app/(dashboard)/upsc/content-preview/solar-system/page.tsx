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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors[tone]} p-4 my-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p>
      </div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}

// ─── Learn Tab Content ─────────────────────────────────────────────────────────

function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 1.1 we established that the Big Bang produced only hydrogen and helium — and that heavier elements were forged in stellar explosions. Those elements now had to assemble into a **Solar System**." />

      {/* Nebular Hypothesis */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌀 NEBULAR HYPOTHESIS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="First proposed by **Immanuel Kant (1755)**, independently developed by **Pierre-Simon Laplace (1796)**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Modern **Solar Nebula Theory** — Solar System formed **4.6 Ga** from a rotating cloud of gas and dust." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Collapse triggered by a nearby **supernova shockwave**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Cloud spun faster as it contracted due to **conservation of angular momentum** (ice-skater effect)." /></li>
        </ul>
      </div>

      {/* PYQ Tag */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Nebular Hypothesis asked in UPSC Prelims 2016
        </span>
      </div>

      {/* Protoplanetary Disk */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">☀️ PROTOPLANETARY DISK</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Collapsing cloud flattened into a rotating **protoplanetary disk** (accretion disk)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Centre reached extreme temperature/pressure → ignited **nuclear fusion** → **proto-Sun** born." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Only **0.1%** of total nebula mass became planets, moons, asteroids, comets via **accretion**." /></li>
        </ul>
      </div>

      {/* Diagram Placeholder — Nebular Hypothesis Stages */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Nebular Hypothesis — Stage Diagram</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Gas Cloud → Collapse → Spinning Disk → Proto-Sun + Planetesimals → Solar System</p>
        </div>
      </div>

      {/* The Frost Line */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">❄️ THE FROST LINE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Located at **~2.7 AU** from proto-Sun — between present-day **Mars** and **Jupiter** orbits." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Inside frost line: only **metals and silicates** (rock) could remain solid — explains small rocky inner planets." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Outside frost line: **volatiles/ices** (water, methane, ammonia) condensed — added enormous mass to protoplanets." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Also called **Snow Line** or **Ice Line** — single concept explaining inner vs outer planet dichotomy." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        The frost line explains WHY inner planets (Mercury, Venus, Earth, Mars) are small and rocky while outer planets (Jupiter, Saturn, Uranus, Neptune) are massive gas/ice giants. This single concept answers multiple UPSC questions about planetary classification.
      </Callout>

      {/* Angular Momentum Problem */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⚡ ANGULAR MOMENTUM PROBLEM</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Sun = **99.86%** of Solar System's mass but only **0.5%** of its angular momentum." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Planets carry **99.5%** of angular momentum — Sun should spin faster if formed from spinning disk." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Resolution: **magnetic braking** — young Sun's magnetic field + solar wind transferred momentum outward." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="India's **Aditya-L1** studies solar magnetic fields that drive such processes even today." /></li>
        </ul>
      </div>

      {/* PYQ Tag */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Angular momentum distribution tested in UPSC Prelims 2019
        </span>
      </div>

      {/* Diagram Placeholder — Frost Line */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Frost Line & Planetary Zones — Cross-Section</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Inner rocky zone (metals + silicates) • Frost Line at ~2.7 AU • Outer volatile zone (ices + gases)</p>
        </div>
      </div>

      {/* Planet Building Stages */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🪨 PLANET BUILDING STAGES</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Dust grains** collided and stuck → millimetre-sized particles (accretion)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Grew into **planetesimals** (**1–10 km** bodies) through continued collisions." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Planetesimals attracted more material → **protoplanets**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Beyond frost line: cores reached **~10 Earth masses** → captured **H/He gas** → **gas giants**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Jupiter = **318 Earth masses** — runaway gas capture explains its enormous size." /></li>
        </ul>
      </div>

      {/* Evidence */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📐 EVIDENCE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="All planets orbit in the **same direction** (prograde) and in the **same plane** (ecliptic)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**ALMA telescope** (Chile) has directly imaged protoplanetary disks around young stars." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Compositional gradient (rocky inner → gaseous outer) matches **frost line** predictions precisely." /></li>
        </ul>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        Understanding how the Solar System formed from a nebula sets up the next sub-topic — Stars: their formation, life cycles, and the nuclear furnaces that create all elements heavier than hydrogen. The stellar material recycled into our nebula came from earlier-generation stars that lived and died before our Sun existed.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────

function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 2</p>
        <p className="mt-1 text-xs font-semibold text-[#92400e]">Pages 16-18: Origin of the Earth</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** 'The nebula from which our Solar System is believed to have been formed started its collapse and condensation approximately 5 to 5.6 billion years ago. The Sun was formed about 5 billion years ago.'" />
          <RichText text="**Testable Fact:** 'The planets were formed about 4.6 billion years ago.' — UPSC frequently tests Earth's age (4.54 Ga) vs Sun's age (5 Ga) vs Universe age (13.8 Ga)." />
          <RichText text="**Supporting evidence:** NCERT mentions that 'our solar system consists of the Sun, eight planets, 63 moons, millions of smaller bodies like asteroids and comets, and huge quantities of dust-grains and gases.' Note: NCERT still says 63 moons (outdated — current count exceeds 200)." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Chapter 2: Theories of Origin</p>
        <p className="mt-1 text-xs font-semibold text-[#92400e]">Pages 16-17</p>
        <div className="mt-3 space-y-3">
          <RichText text="NCERT explicitly discusses: (1) **Nebular Hypothesis** by Kant-Laplace — planets formed from slowly rotating nebula of gas and dust. (2) **Revised Nebular Hypothesis** — incorporates modern understanding of accretion and angular momentum transfer." />
          <RichText text="**Critical NCERT note:** 'In 1950, Otto Schmidt in Russia and Carl Weizascar in Germany somewhat revised the nebular hypothesis.' — This detail appears in MCQ options to test if students know the REVISED version vs original Kant-Laplace version." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 9 — Contemporary India, Chapter 2</p>
        <div className="mt-3">
          <RichText text="Basic framework: 'The solar system consists of the Sun and its family of planets.' Introduces concepts of inner vs outer planets and the asteroid belt as a dividing line — a simplified precursor to the frost line concept." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🇮🇳 India", title: "Aditya-L1 — India's Solar Mission (2023)", text: "ISRO's **Aditya-L1** reached the **L1 Lagrange point** (1.5 million km from Earth) in January 2024. It studies solar corona, solar wind, and magnetic fields — the same solar wind that resolved the angular momentum problem in nebular theory. First Indian mission to study the Sun directly." },
    { tag: "🌍 Space", title: "ALMA Telescope — Protoplanetary Disk Imaging", text: "The **Atacama Large Millimeter Array (ALMA)** in Chile has directly imaged **protoplanetary disks** around young stars like **HL Tauri** (2014) and **TW Hydrae**. These images show gaps carved by forming planets — the first direct visual evidence of the nebular hypothesis in action around other stars." },
    { tag: "🌍 Space", title: "JWST Discovers Planet-Forming Disks (2023–24)", text: "**James Webb Space Telescope** detected water vapour in the inner regions of protoplanetary disks around young stars, confirming the **frost line concept** — water exists as vapour inside and as ice outside. Observations of disk around star **PDS 70** show active planet formation." },
    { tag: "🇮🇳 India", title: "Chandrayaan-3 & Lunar Origin (2023)", text: "India's **Chandrayaan-3** soft-landed near the lunar south pole (August 2023). The Moon likely formed from a **giant impact** between proto-Earth and a Mars-sized body called **Theia** — a late-stage event in Solar System formation. Pragyan rover analysed lunar regolith composition." },
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
    { wrong: "'Kant and Laplace jointly proposed the Nebular Hypothesis.'", right: "They proposed INDEPENDENTLY — Kant (1755) first, Laplace (1796) later. They never collaborated. UPSC options may say 'jointly' to trap." },
    { wrong: "'The frost line is located between Earth and Mars.'", right: "The frost line (~2.7 AU) is between MARS and JUPITER — specifically in the asteroid belt region. Earth is at 1 AU, Mars at 1.5 AU, Jupiter at 5.2 AU." },
    { wrong: "'The Sun contains most of the Solar System's angular momentum.'", right: "The Sun has 99.86% of the MASS but only 0.5% of the angular MOMENTUM. Planets (especially Jupiter) carry 99.5% of angular momentum. Never confuse mass distribution with momentum distribution." },
    { wrong: "'Gas giants formed because they are farther from the Sun and hence cooler.'", right: "INCOMPLETE. Distance alone doesn't explain it. Beyond the frost line, ICES could condense alongside rocks — this gave protoplanets MORE solid material to grow massive cores that then captured gas gravitationally. It's the FROST LINE mechanism, not just temperature." },
    { wrong: "'The Solar System formed from the Big Bang directly.'", right: "The Big Bang (13.8 Ga) produced only H and He. The Solar System (4.6 Ga) formed from a SECOND-GENERATION nebula enriched with heavy elements from earlier stellar explosions. There's a 9-billion-year gap." },
    { wrong: "'Planetesimals are small planets.'", right: "Planetesimals are 1–10 km rocky/icy bodies — building blocks of planets, NOT small planets. Planets formed FROM planetesimals through accretion. A planetesimal is to a planet what a brick is to a building." },
    { wrong: "'The Nebular Hypothesis has been rejected because it cannot explain angular momentum.'", right: "NOT rejected — it has been MODIFIED. Modern Solar Nebula Theory (post-1970s) resolves angular momentum through magnetic braking and turbulent viscosity. The hypothesis evolved, not abandoned." },
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
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about the Nebular Hypothesis:", stmts: ["Immanuel Kant and Pierre-Simon Laplace independently proposed the Nebular Hypothesis.", "According to this hypothesis, the Solar System formed from a rotating cloud of gas and dust.", "The original Nebular Hypothesis could satisfactorily explain the distribution of angular momentum in the Solar System.", "Otto Schmidt and Carl Weizacker revised the Nebular Hypothesis in the mid-20th century."], opts: ["1 and 2 only", "1, 2 and 4 only", "2 and 3 only", "1, 2, 3 and 4"], correct: 1, explain: "Statement 1: CORRECT — Kant (1755) and Laplace (1796) proposed independently. Statement 2: CORRECT — rotating gas-dust cloud is the core idea. Statement 3: WRONG — the original hypothesis COULD NOT explain angular momentum distribution (Sun has 99.86% mass but only 0.5% momentum). Statement 4: CORRECT — Schmidt (Russia) and Weizacker (Germany) revised it around 1950." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements about the Frost Line in the Solar System:", stmts: ["The frost line is located approximately between the orbits of Mars and Jupiter.", "Inside the frost line, only metals and silicates could condense from the protoplanetary disk.", "The frost line concept explains why inner planets are rocky and outer planets are gaseous.", "The frost line is also known as the Snow Line or Ice Line."], opts: ["1, 2 and 3 only", "2 and 4 only", "1 and 3 only", "1, 2, 3 and 4"], correct: 3, explain: "All four statements are correct. Frost line at ~2.7 AU (between Mars at 1.5 AU and Jupiter at 5.2 AU). Inside: only refractory materials survive. Outside: volatiles condense as ice, enabling massive planet growth. Alternative names: Snow Line, Ice Line." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following statements about angular momentum in the Solar System:", stmts: ["The Sun contains approximately 99.86% of the Solar System's total mass.", "The Sun also contains approximately 99% of the Solar System's total angular momentum.", "Magnetic braking by the young Sun's magnetic field transferred angular momentum outward.", "Jupiter alone carries more angular momentum than all other planets combined."], opts: ["1 and 3 only", "1, 3 and 4 only", "1 and 2 only", "2, 3 and 4 only"], correct: 1, explain: "Statement 1: CORRECT (99.86% mass). Statement 2: WRONG — Sun has only 0.5% of angular momentum; planets carry 99.5%. Statement 3: CORRECT — magnetic braking is the modern resolution. Statement 4: CORRECT — Jupiter's mass and orbital velocity give it dominant angular momentum share." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following statements about protoplanetary disk processes are correct?", stmts: ["Accretion is the process by which small particles collide and stick together to form larger bodies.", "Planetesimals are bodies approximately 1–10 km in size that serve as building blocks of planets.", "Gas giants formed by first building rocky/icy cores of about 10 Earth masses, then capturing hydrogen and helium.", "The protoplanetary disk contained approximately 50% of the total mass of the solar nebula."], opts: ["Only one", "Only two", "Only three", "All four"], correct: 2, explain: "Statement 1: CORRECT — accretion definition. Statement 2: CORRECT — planetesimal size range. Statement 3: CORRECT — core accretion model for gas giants. Statement 4: WRONG — the disk contained only about 0.1% of the nebula's mass; 99.9% went to the Sun. Three statements are correct." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following are valid pieces of evidence supporting the Nebular Hypothesis?", stmts: ["All planets orbit the Sun in the same direction (prograde).", "All planets orbit approximately in the same plane (ecliptic).", "Protoplanetary disks have been directly imaged around young stars by ALMA.", "The compositional gradient from rocky inner planets to gaseous outer planets matches frost-line predictions.", "Pluto's highly inclined and eccentric orbit."], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1–4 are VALID evidence. Pluto's orbit (statement 5) is actually an ANOMALY that doesn't directly support the basic nebular hypothesis — it's explained by gravitational perturbation and Kuiper Belt dynamics, not the standard formation model. Four are valid." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): The inner planets of the Solar System (Mercury, Venus, Earth, Mars) are smaller and denser than the outer planets.\n\nReason (R): Inside the frost line, only refractory materials like metals and silicates could condense from the protoplanetary disk, limiting the available solid mass for planet formation.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Assertion: CORRECT — inner planets are smaller (Earth = 1 vs Jupiter = 318 Earth masses) and denser (Earth 5.5 g/cm³ vs Jupiter 1.3 g/cm³). Reason: CORRECT — frost line limited solid condensation material inside it. R directly explains A — less material available = smaller planets; only metals/silicates = higher density." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The original Nebular Hypothesis proposed by Kant and Laplace was considered inadequate by the early 20th century.\n\nReason (R): The hypothesis could not explain why the Sun, which contains 99.86% of the Solar System's mass, possesses only about 0.5% of the system's total angular momentum.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct. The angular momentum problem was the PRIMARY objection. A spinning disk collapsing into a central body should spin faster — but the Sun rotates slowly. This was the main reason the hypothesis was considered inadequate until magnetic braking resolved it." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following statements about Solar System formation is NOT correct?", stmts: [], opts: ["The Solar System formed approximately 4.6 billion years ago from a solar nebula", "A nearby supernova explosion likely triggered the initial collapse of the solar nebula", "The Sun formed at the periphery of the protoplanetary disk where temperatures were lowest", "Planets formed from the residual material in the accretion disk around the proto-Sun"], correct: 2, explain: "Option (c) is WRONG — the Sun formed at the CENTRE of the disk where temperatures and pressures were HIGHEST (enough to ignite nuclear fusion). All other statements are correct." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following is NOT a correct pairing of a scientist with their contribution to Solar System origin theories?", stmts: [], opts: ["Immanuel Kant — Proposed nebular hypothesis for Solar System origin (1755)", "Pierre-Simon Laplace — Independently developed nebular hypothesis (1796)", "James Jeans — Proposed the Tidal Hypothesis involving a passing star", "Otto Schmidt — Proposed the original Nebular Hypothesis before Kant"], correct: 3, explain: "Option (d) is WRONG — Otto Schmidt (1943) REVISED the Nebular Hypothesis; he did not propose the original. Kant (1755) proposed the original. Schmidt and Weizacker modified it to address angular momentum issues." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news report states: 'ALMA telescope has captured the sharpest image ever of a protoplanetary disk around the young star HL Tauri, showing concentric gaps that indicate planets are actively forming.'\n\nA student draws three inferences:\n1. This provides direct observational evidence for the Nebular Hypothesis.\n2. Planet formation takes millions of years, so HL Tauri must be at least as old as our Solar System.\n3. The gaps suggest that accretion and gravitational clearing occur simultaneously within protoplanetary disks.\n\nWhich inference(s) is/are scientifically valid?", stmts: [], opts: ["1 only", "1 and 3 only", "2 and 3 only", "1, 2 and 3"], correct: 1, explain: "Inference 1: VALID — directly observing disk + forming planets confirms the nebular model. Inference 2: INVALID — HL Tauri is only about 1 million years old; planet formation can begin very early. Our Solar System at 4.6 Ga is far older. Inference 3: VALID — gaps indicate gravitational clearing by forming protoplanets within the disk." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "Consider: 'India's Aditya-L1 spacecraft, positioned at the L1 Lagrange point, has begun studying the solar corona and solar wind. Scientists note that understanding solar magnetic fields is crucial for explaining how the young Sun lost angular momentum to the surrounding disk.'\n\nWhich of the following correctly links Aditya-L1's observations to Solar System formation theory?", stmts: [], opts: ["Solar wind pressure pushed planets to their current orbits", "Solar magnetic fields coupled with charged disk material to transfer angular momentum outward — a process called magnetic braking", "Aditya-L1 will directly observe the formation of new planets around the Sun", "Solar corona temperature explains why inner planets are rocky"], correct: 1, explain: "Option (b) is correct. Magnetic braking: young Sun's magnetic field lines connected to ionized disk material, transferring rotational energy (angular momentum) outward. This is the modern resolution to the angular momentum problem. Aditya-L1 studies present-day solar magnetic fields — analogous to processes in the early Solar System." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "JWST has detected water vapour in the INNER region of a protoplanetary disk around a young star, while the OUTER regions show water ice. A student concludes:\n\nStatement-I: This observation confirms the existence of a frost line in that stellar system.\nStatement-II: The frost line location depends on the luminosity of the central star.\n\nSelect the correct answer:", stmts: [], opts: ["Both statements correct and Statement-II explains Statement-I", "Both statements correct but Statement-II does not explain Statement-I", "Only Statement-I is correct", "Only Statement-II is correct"], correct: 0, explain: "Both correct. Water vapour inside and ice outside = direct confirmation of a frost/snow line (Statement-I). The frost line position depends on stellar luminosity (hotter/brighter star → frost line farther out) — this explains why the line exists at a SPECIFIC distance (Statement-II explains I)." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the following theories with their proponents:\n\n1. Nebular Hypothesis — P. Chamberlain and Moulton\n2. Tidal Hypothesis — Q. Kant and Laplace\n3. Planetesimal Hypothesis — R. Hoyle\n4. Binary Star Hypothesis — S. James Jeans and Harold Jeffreys", stmts: [], opts: ["1-Q, 2-S, 3-P, 4-R", "1-P, 2-Q, 3-S, 4-R", "1-Q, 2-P, 3-S, 4-R", "1-S, 2-Q, 3-R, 4-P"], correct: 0, explain: "Nebular Hypothesis = Q (Kant & Laplace). Tidal Hypothesis = S (Jeans & Jeffreys — passing star pulls material from Sun). Planetesimal Hypothesis = P (Chamberlain & Moulton — star passes close, pulls out gaseous filaments). Binary Star Hypothesis = R (Hoyle — Sun had a companion star that exploded)." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match the Solar System zones with their characteristics:\n\n1. Inner Solar System (within frost line) — P. Volatile ices condense, massive planet cores form\n2. Outer Solar System (beyond frost line) — Q. Only metals and silicates remain solid\n3. Asteroid Belt — R. Trans-Neptunian icy bodies, short-period comets\n4. Kuiper Belt — S. Transition zone, remnant planetesimals unable to form a planet due to Jupiter's gravity", stmts: [], opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-R, 3-S, 4-P", "1-S, 2-P, 3-Q, 4-R"], correct: 0, explain: "Inner = Q (rocky materials only). Outer = P (ices condense, gas giants form). Asteroid Belt = S (Jupiter's gravity prevented planetesimals from accreting into a planet). Kuiper Belt = R (beyond Neptune, icy bodies, source of short-period comets)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "With reference to the formation of the Solar System, consider the following:\n1. The Solar System formed from a rotating cloud of gas and dust called a nebula.\n2. The frost line divided the protoplanetary disk into inner rocky and outer gaseous zones.\n3. The Sun contains about 99.86% of the Solar System's mass.\n4. All planets revolve around the Sun in the same direction.\n\nWhich of the above statements are correct?", stmts: [], opts: ["1 and 3 only", "1, 2 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 3, explain: "All four are correct. (1) Nebular origin is the accepted model. (2) Frost line at ~2.7 AU divided rocky/gaseous zones. (3) Sun = 99.86% mass. (4) Prograde revolution of all 8 planets — evidence for common disk origin." },
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


// ─── Mains Tab (Intro/Body/Conclusion + Evaluate) ─────────────────────────────

function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, { intro: string; body: string; conclusion: string }>>({
    0: { intro: "", body: "", conclusion: "" },
    1: { intro: "", body: "", conclusion: "" },
  });
  const [evaluating, setEvaluating] = useState(false);

  const questions = [
    { id: 0, paper: "GS-1 • 2016", marks: "15 Marks • 250 Words", text: "Discuss the Nebular Hypothesis for the origin of the Solar System. How does the concept of the frost line explain the compositional differences between the inner and outer planets?", framework: ["Intro: Define Nebular Hypothesis, mention Kant-Laplace origin", "Body: Stages — nebula collapse, disk formation, accretion, proto-Sun ignition", "Body: Frost line concept — location at 2.7 AU, inner (silicates) vs outer (volatiles)", "Body: Why inner planets rocky (limited material) vs outer planets gaseous (ice + gas capture)", "Body: Angular momentum problem and modern resolution (magnetic braking)", "Conclusion: Observational confirmation (ALMA, JWST), connect to Earth's unique position"] },
    { id: 1, paper: "GS-1 • 2019", marks: "10 Marks • 150 Words", text: "What is the angular momentum problem in the context of Solar System formation? How does modern science resolve this discrepancy?", framework: ["Intro: Define angular momentum, state the paradox (Sun = 99.86% mass, 0.5% momentum)", "Body: Why this is a problem — collapsing disk should give fast-spinning Sun", "Body: Resolution 1 — Magnetic braking (Sun's magnetic field transfers momentum)", "Body: Resolution 2 — Solar wind carries angular momentum outward", "Body: Resolution 3 — Turbulent viscosity in disk, gravitational interactions", "Conclusion: Importance for understanding planet migration, Aditya-L1 relevance"] },
  ];

  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  const handleEvaluate = () => {
    setEvaluating(true);
    setTimeout(() => setEvaluating(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Question Selector */}
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
            {mq.paper}
          </button>
        ))}
      </div>

      {/* Question */}
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

      {/* Answer Workspace — Intro / Body / Conclusion */}
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase text-[#085041]">✍️ Write Your Answer</p>
          <span className={`text-[10px] font-black ${wordCount > 0 ? "text-[#1d9e75]" : "text-[#5d675f]"}`}>
            {wordCount} words
          </span>
        </div>

        {/* Introduction */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">1</span>
            <p className="text-xs font-black text-[#13251d]">Introduction</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Define scope, set up answer</p>
          </div>
          <textarea
            value={draft.intro}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], intro: e.target.value } }))}
            placeholder="Open with context, a definition, or the crux of the demand…"
            className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">2</span>
            <p className="text-xs font-black text-[#13251d]">Body</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Core argument, examples, dimensions</p>
          </div>
          <textarea
            value={draft.body}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], body: e.target.value } }))}
            placeholder="Develop the substantive argument with structured points, examples, data…"
            className="w-full h-40 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Conclusion */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">3</span>
            <p className="text-xs font-black text-[#13251d]">Conclusion</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Forward-looking synthesis, way forward</p>
          </div>
          <textarea
            value={draft.conclusion}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], conclusion: e.target.value } }))}
            placeholder="Tie the argument together and end on a way-forward note…"
            className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEvaluate}
            disabled={wordCount < 10 || evaluating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40 transition-all"
          >
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
    { label: "Solar System Age", value: "4.6 Ga" },
    { label: "Frost Line", value: "~2.7 AU" },
    { label: "Sun Mass %", value: "99.86%" },
    { label: "Sun Momentum %", value: "0.5%" },
    { label: "H in Nebula", value: "75%" },
    { label: "He in Nebula", value: "25%" },
    { label: "Jupiter Mass", value: "318 Earths" },
    { label: "Kant Year", value: "1755" },
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]"
        />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SolarSystemPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));

  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">
              Part 1 — Physical Geography
            </span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">
              Prelims: HIGH
            </span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">
              Mains: HIGH
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.2 Origin of the Solar System — Nebular Hypothesis
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">
            Earth and Its Origin (The Universe) › Geomorphology
          </p>

          {/* Progress */}
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

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/60 border border-[#dcd5c7] p-1.5 shadow-sm backdrop-blur-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isVisited = visitedTabs.has(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]"
                    : isVisited
                    ? "text-[#1d9e75] hover:bg-[#e7f5ee]"
                    : "text-[#5d675f] hover:bg-[#f7f4ee]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {isVisited && !isActive && <CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        {/* Fact Card (always visible) */}
        <FactCard />

        {/* Tab Content */}
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

        {/* Navigation Ribbon — Previous Topic | Next Section | Next Topic */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              <a href="/upsc/content-preview"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.1 Big Bang</span>
                <span className="sm:hidden">Prev</span>
              </a>
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
              <a href="/upsc/content-preview/stars"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">1.3 Stars</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}

      </div>
    </main>
  );
}

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
      <RichText text="In the Universe chapter, we traced cosmic origins from the Big Bang to Earth's place in the Goldilocks Zone. Now we dive INTO Earth itself — understanding how a molten ball of rock differentiated into the layered planet we know today." />

      {/* Formation */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌍 Earth's Formation</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Earth formed **4.6 Ga** from the **solar nebula** — a rotating disk of gas and dust left after the Sun ignited." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Particles collided and grew through **accretion**: dust grains → **planetesimals** (km-scale) → proto-Earth." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Nebular hypothesis** (Kant-Laplace) + modern **accretion theory** = comprehensive formation model." /></li>
        </ul>
      </div>

      {/* Differentiation */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔥 Differentiation</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Gravitational energy** + **radioactive heating** (U, Th, K) melted the interior → **magma ocean stage**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Heavy **iron and nickel** sank → **core**. Lighter **silicates** rose → **mantle** and **crust**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Occurred DURING formation (not after). Magma ocean lasted **hundreds of millions of years**." /></li>
        </ul>
      </div>

      {/* Atmospheric Evolution */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">💨 Atmospheric Evolution — Three Stages</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Stage 1** — Primary atmosphere (H₂/He) **lost to space** — gravity too weak to retain light gases." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Stage 2** — Secondary atmosphere via **volcanic outgassing**: **CO₂**, **H₂O**, **N₂** from interior." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Stage 3** — **Great Oxidation Event (2.5 Ga)**: **cyanobacteria** produced **O₂** through photosynthesis." /></li>
        </ul>
      </div>

      {/* Giant Impact */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌙 Giant Impact Hypothesis</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Mars-sized body **Theia** collided with proto-Earth at **4.5 Ga** → debris coalesced into the Moon." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Impact re-melted Earth's surface and contributed to the magma ocean phase." /></li>
        </ul>
      </div>

      {/* Radiometric Dating */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⏱️ Radiometric Dating</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**U-Pb** (uranium-lead) → billions of years | **K-Ar** → millions | **C-14** → thousands (max ~**50,000 yrs**)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Oldest Earth **zircons** = **4.4 Ga** (Western Australia). Oldest **rocks** = **4.0 Ga** (Acasta Gneiss, Canada)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Earth's age (**4.6 Ga**) from **meteorites** — NOT Earth rocks (geological recycling destroyed earliest crust)." /></li>
        </ul>
      </div>

      {/* Indian Context */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🇮🇳 Indian Geological Context</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Dharwar craton** (Karnataka) — Archean crust **>3 Ga**, hosts **gold** and **iron ore** deposits." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Aravalli craton** (Rajasthan) — among Earth's most ancient continental fragments, rich in **manganese**." /></li>
        </ul>
      </div>

      {/* Earth Differentiation Process Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Earth Differentiation Process</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Homogeneous accretion → Magma ocean → Iron sinks (core) → Silicates rise (mantle/crust)</p>
        </div>
      </div>

      {/* PYQ Tags */}
      <div className="flex flex-wrap items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Earth origin &amp; differentiation tested in UPSC Prelims 2019
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Atmospheric evolution tested in UPSC Prelims 2017
        </span>
      </div>

      {/* Atmospheric Evolution Timeline Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Atmospheric Evolution Timeline</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Primary (H/He lost) → Secondary (volcanic outgassing: CO₂, H₂O, N₂) → Great Oxidation Event (2.5 Ga)</p>
        </div>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        Earth&apos;s age of 4.6 Ga comes from <strong>meteorite dating</strong>, not from Earth rocks. Earth&apos;s geological activity has recycled its earliest crust, so the oldest Earth rocks (Acasta Gneiss, 4.0 Ga) are younger than the planet itself. Meteorites preserve the original solar system formation age.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="Forward Hook" tone="blue">
        Differentiation created Earth&apos;s layered structure — core, mantle, and crust. In the next topic (2.2), we explore these layers in detail: their composition, physical properties, and how we know what lies beneath the surface through seismic evidence.
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
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Content:** Earth's origin through the **nebular hypothesis**, solar system formation from rotating gas and dust cloud, and **planetary differentiation** — the process by which a homogeneous early Earth separated into distinct layers based on density." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 3</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Testable Connection:** Interior of Earth — this chapter directly connects **differentiation** to Earth's **layered structure**. The sinking of iron to form the core and rising of silicates to form mantle/crust explains WHY Earth has concentric layers with distinct compositions and physical properties." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — India: Physical Environment (Geography)</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Indian Context:** Ancient **shield regions** of India — the **Peninsular craton** contains some of the oldest rocks on the subcontinent. These Archean formations host India's major **mineral wealth** including iron ore (Dharwar), gold (Kolar), and manganese deposits linked to early Earth's geological history." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🌍 Space", title: "JWST Protoplanetary Disk Observations", text: "The **James Webb Space Telescope** has captured unprecedented images of **protoplanetary disks** around young stars, providing real-time evidence of **planetary formation** in action. These observations confirm accretion models showing dust grains growing into planetesimals — directly validating the processes that formed Earth **4.6 Ga** ago." },
    { tag: "🇮🇳 India", title: "India's Deep Continental Studies Programme", text: "India's **Deep Continental Studies** programme investigates **Precambrian geology** of the Indian shield. Research focuses on the **Dharwar** and **Aravalli cratons** — rocks older than **3 Ga** — to understand early crustal formation, mineral resource potential, and Earth's earliest geological processes preserved in the Indian subcontinent." },
    { tag: "🌍 Space", title: "Perseverance Rover — Comparative Planetology", text: "NASA's **Perseverance** rover on Mars provides crucial data for **comparative planetology** — understanding why Mars evolved differently from Earth despite forming from the same solar nebula. Mars lacks plate tectonics, lost its magnetic field early, and its differentiation history diverged significantly from Earth's, resulting in a geologically dead planet." },
    { tag: "🌍 Science", title: "Zircon Dating Breakthroughs", text: "New **zircon dating** techniques are pushing back the timeline of Earth's earliest materials. **Jack Hills zircons** from Western Australia (**4.4 Ga**) preserve evidence that liquid water existed on Earth's surface within **100 million years** of formation — suggesting the magma ocean cooled far faster than previously thought." },
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
    { wrong: "'Nebular hypothesis and planetesimal hypothesis are the same thing.'", right: "WRONG. The nebular hypothesis (Kant-Laplace) describes the formation of the solar system from a rotating gas cloud. The planetesimal hypothesis specifically describes accretion of small solid bodies. Modern science COMBINES both but they are historically and conceptually different frameworks." },
    { wrong: "'Earth's age of 4.6 Ga is based on Earth rocks.'", right: "WRONG. Earth's age comes from METEORITE dating (4.6 Ga). The oldest Earth rocks (Acasta Gneiss, Canada) are only 4.0 Ga. Earth's geological activity has recycled its earliest crust — meteorites preserve the original solar system formation age because they haven't been geologically processed." },
    { wrong: "'Differentiation happened after Earth fully formed.'", right: "WRONG. Differentiation occurred DURING formation while Earth was still accreting material. The energy of accretion plus radioactive heating created a magma ocean in which heavy iron sank and light silicates rose SIMULTANEOUSLY with ongoing bombardment and growth." },
    { wrong: "'The Great Oxidation Event marks the origin of life.'", right: "WRONG. Life existed at least 1+ billion years BEFORE oxygen accumulated in the atmosphere. Early life was anaerobic. Cyanobacteria evolved and produced O₂ much earlier, but oxygen was initially consumed by oxidising iron and other reduced minerals. The GOE (2.5 Ga) marks when O₂ finally accumulated in the atmosphere, not when life began." },
    { wrong: "'Carbon-14 can be used to date billion-year-old rocks.'", right: "WRONG. C-14 has a half-life of ~5,730 years and a maximum dating range of ~50,000 years. For geological timescales (millions to billions of years), use U-Pb (uranium-lead) or K-Ar (potassium-argon) dating. C-14 is only for archaeological/recent geological materials." },
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
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about Earth's differentiation:", stmts: ["Differentiation occurred while Earth was still in a molten magma ocean state.", "Heavy iron and nickel sank to form the core due to gravitational separation.", "The process was driven by gravitational energy and radioactive heating from U, Th, and K.", "Differentiation began only after Earth had completely cooled and solidified."], opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — differentiation required a molten state (magma ocean). Statement 2: CORRECT — density-driven separation, iron/nickel (dense) sank. Statement 3: CORRECT — both energy sources melted the interior. Statement 4: WRONG — differentiation occurred DURING the molten phase, not after cooling. Earth had to be molten for materials to separate by density." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements about Earth's atmospheric evolution:", stmts: ["The primary atmosphere of H₂ and He was lost because Earth's gravity could not retain these light gases.", "The secondary atmosphere was produced by volcanic outgassing of CO₂, H₂O, and N₂.", "The Great Oxidation Event occurred approximately 2.5 billion years ago.", "Free oxygen was present in Earth's atmosphere from the time of its formation."], opts: ["1, 2 and 3 only", "1 and 3 only", "1, 2 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — light H/He escaped Earth's gravitational pull. Statement 2: CORRECT — degassing from volcanic activity created secondary atmosphere. Statement 3: CORRECT — GOE at 2.5 Ga when cyanobacteria O₂ accumulated. Statement 4: WRONG — early atmosphere had NO free oxygen; O₂ appeared only after biological activity (cyanobacteria) billions of years later." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following about radiometric dating methods:", stmts: ["Uranium-Lead (U-Pb) dating is used for timescales of billions of years.", "Potassium-Argon (K-Ar) dating is suitable for millions of years.", "Carbon-14 dating can measure ages up to approximately 50,000 years.", "Earth's age was determined by dating the oldest rocks found on Earth's surface."], opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — U-Pb for Ga timescales. Statement 2: CORRECT — K-Ar for Ma timescales. Statement 3: CORRECT — C-14 half-life ~5,730 yrs, max ~50,000. Statement 4: WRONG — Earth's age (4.6 Ga) comes from METEORITE dating, not Earth rocks. Oldest Earth rocks are only 4.0 Ga because geological recycling destroyed earlier crust." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following constitute evidence for determining Earth's age?", stmts: ["Radiometric dating of meteorites (4.6 Ga)", "Age of the oldest zircon crystals (4.4 Ga, Western Australia)", "Age of the oldest intact rocks (Acasta Gneiss, 4.0 Ga, Canada)", "Lunar rock samples brought back by Apollo missions", "Radioactive decay ratios in chondritic meteorites"], opts: ["Only two", "Only three", "Only four", "All five"], correct: 3, explain: "ALL five are valid evidence for constraining Earth's age. Meteorite dating (4.6 Ga) gives the primary age. Zircons (4.4 Ga) confirm early crust formation. Acasta Gneiss (4.0 Ga) = oldest surviving rock. Lunar samples provide independent solar system age. Chondritic meteorites preserve original nebula composition. All five contribute to the converging evidence." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following factors drove Earth's differentiation?", stmts: ["Gravitational energy released during accretion", "Radioactive decay of uranium, thorium, and potassium isotopes", "Heat from frequent asteroid impacts during Late Heavy Bombardment", "Energy from the giant impact that formed the Moon", "Solar radiation heating the surface"], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Four are correct (1-4). Gravitational energy from accretion heated the interior. Radioactive decay provided sustained internal heating. Impacts (including Late Heavy Bombardment) added kinetic energy as heat. The Theia impact re-melted much of Earth. However, solar radiation (5) only affects the surface — it cannot penetrate deep enough to drive internal differentiation. Only four correct." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): Earth's differentiation resulted in a layered internal structure with a dense core and lighter mantle/crust.\n\nReason (R): During the magma ocean stage, materials separated by density — heavier iron-nickel sank while lighter silicates floated upward.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both A and R are correct, and R directly explains A. The layered structure (A) exists precisely BECAUSE of density-driven separation in the magma ocean (R). Iron/nickel (7.8-8.9 g/cm³) sank to form the core, while silicates (2.7-3.3 g/cm³) rose to form mantle and crust. R is the mechanism that caused A." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The Great Oxidation Event fundamentally transformed Earth's atmospheric chemistry around 2.5 Ga.\n\nReason (R): Cyanobacteria evolved the ability to perform oxygenic photosynthesis, releasing free O₂ as a metabolic byproduct.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. The GOE (A) occurred because cyanobacteria (R) produced O₂ through photosynthesis. Initially, this O₂ was consumed by oxidising dissolved iron and surface minerals. Once these 'sinks' were saturated, free O₂ accumulated in the atmosphere — the GOE. Cyanobacterial photosynthesis is the direct cause." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following statements about Earth's formation is NOT correct?", stmts: [], opts: ["Earth formed approximately 4.6 billion years ago from the solar nebula", "Planetesimals grew through accretion of smaller particles in the protoplanetary disk", "Earth's age is determined by dating the oldest rocks found on Earth's surface", "The nebular hypothesis explains solar system formation from a rotating cloud of gas and dust"], correct: 2, explain: "Option (c) is WRONG — Earth's age is NOT from Earth rocks. It is determined from meteorite dating (4.6 Ga). The oldest Earth rocks (Acasta Gneiss) are only 4.0 Ga because plate tectonics and geological recycling destroyed Earth's earliest crust. Meteorites, being geologically unprocessed, preserve the original solar system age." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following about radiometric dating methods is NOT correct?", stmts: [], opts: ["U-Pb dating is suitable for measuring ages of billions of years", "K-Ar dating is appropriate for geological timescales of millions of years", "C-14 dating can reliably measure ages up to 4 billion years", "Radiometric dating relies on known decay rates of radioactive isotopes"], correct: 2, explain: "Option (c) is WRONG — C-14 has a half-life of ~5,730 years and a maximum effective range of approximately 50,000 years. It CANNOT date anything older. After ~10 half-lives, virtually no C-14 remains to measure. For billion-year timescales, U-Pb or K-Ar methods are required." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news report states: 'JWST has captured images of a protoplanetary disk around a young star showing dust grains clumping into larger structures, providing direct evidence of planetary formation in progress.'\n\nA student makes three inferences:\n1. This validates the accretion model of planet formation that explains Earth's origin.\n2. The observed disk is at the same stage as our solar system was 4.6 billion years ago.\n3. Planets in this disk will necessarily form an Earth-like habitable world.\n\nWhich inference(s) is/are valid?", stmts: [], opts: ["1 and 2 only", "1 only", "2 and 3 only", "1, 2 and 3"], correct: 0, explain: "Inference 1: CORRECT — JWST disk observations directly validate accretion theory (dust → planetesimals → planets). Inference 2: CORRECT — the disk represents an early stage analogous to our solar nebula 4.6 Ga ago. Inference 3: WRONG — planetary formation does NOT guarantee habitability; Earth's unique conditions (distance, size, magnetic field, etc.) may not be replicated." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "A geologist discovers a zircon crystal in Western Australia dated to 4.4 Ga. The zircon contains oxygen isotope ratios suggesting interaction with liquid water.\n\nThis finding is most significant because it suggests:", stmts: [], opts: ["Earth had surface liquid water within 200 million years of formation", "The magma ocean phase lasted longer than previously thought", "Earth's core had not yet differentiated at 4.4 Ga", "The atmosphere at 4.4 Ga was oxygen-rich"], correct: 0, explain: "A 4.4 Ga zircon with water-interaction signatures indicates liquid water existed on Earth's surface very early — within ~200 million years of formation (Earth = 4.6 Ga). This means the magma ocean cooled FASTER than expected, not slower (eliminates b). Differentiation happened much earlier (eliminates c). The atmosphere was NOT oxygen-rich until 2.5 Ga (eliminates d)." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "A comparative planetology study notes that Mars and Earth formed from the same solar nebula at roughly the same time, yet Mars is geologically dead while Earth remains active.\n\nThe primary reason for this divergence in geological evolution is:", stmts: [], opts: ["Mars is smaller, so it lost internal heat faster and its core solidified, ending volcanism and magnetic field generation", "Mars is farther from the Sun, receiving less solar energy", "Mars never underwent differentiation into core, mantle, and crust", "Mars formed from different materials than Earth"], correct: 0, explain: "Mars is smaller (~half Earth's diameter, ~10% mass), so it had less total heat budget and lost internal heat more rapidly through its proportionally larger surface area. Its core solidified, killing the geodynamo (magnetic field) and slowing volcanism. Solar distance (b) doesn't affect internal heat. Mars DID differentiate (c is wrong). Both formed from same nebula materials (d is wrong)." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the radiometric dating methods with their appropriate timescales:\n\n1. U-Pb (Uranium-Lead) — P. Thousands of years (max ~50,000)\n2. K-Ar (Potassium-Argon) — Q. Billions of years\n3. C-14 (Carbon-14) — R. Millions of years\n4. Rb-Sr (Rubidium-Strontium) — S. Billions of years (metamorphic rocks)", stmts: [], opts: ["1-Q, 2-R, 3-P, 4-S", "1-R, 2-Q, 3-P, 4-S", "1-Q, 2-P, 3-R, 4-S", "1-P, 2-R, 3-Q, 4-S"], correct: 0, explain: "U-Pb (1) = Q (billions of years — half-life of U-238 is 4.5 Ga). K-Ar (2) = R (millions of years — half-life of K-40 is 1.25 Ga but useful for Ma-scale). C-14 (3) = P (thousands of years — half-life 5,730 yrs, max ~50,000). Rb-Sr (4) = S (billions of years, especially useful for dating metamorphic events)." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match the Earth layers with their primary composition:\n\n1. Inner Core — P. Silicate minerals (olivine, pyroxene)\n2. Outer Core — Q. Solid iron-nickel alloy\n3. Mantle — R. Liquid iron-nickel with lighter elements\n4. Crust — S. Silica-rich rocks (granite, basalt)", stmts: [], opts: ["1-Q, 2-R, 3-P, 4-S", "1-R, 2-Q, 3-P, 4-S", "1-Q, 2-R, 3-S, 4-P", "1-P, 2-R, 3-Q, 4-S"], correct: 0, explain: "Inner Core (1) = Q (SOLID iron-nickel, solidified under extreme pressure). Outer Core (2) = R (LIQUID iron-nickel with some lighter elements like S, O). Mantle (3) = P (silicate minerals — predominantly olivine and pyroxene). Crust (4) = S (silica-rich rocks — continental crust is granitic, oceanic is basaltic)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "With reference to the origin and evolution of Earth, consider the following statements: [Based on UPSC 2019 pattern]\n1. Earth formed approximately 4.6 billion years ago through accretion of planetesimals.\n2. The process of differentiation separated Earth into core, mantle, and crust based on density.\n3. The oldest rocks on Earth (Acasta Gneiss) are approximately 4.0 billion years old.\n\nWhich of the statements given above are correct?", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1, 2 and 3", "1 and 3 only"], correct: 2, explain: "All three are CORRECT. Statement 1: Earth formed 4.6 Ga from solar nebula through accretion. Statement 2: Differentiation = density separation into layered structure (iron core, silicate mantle/crust). Statement 3: Acasta Gneiss in Canada = 4.0 Ga, oldest known intact rock on Earth. All factually accurate." },
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
    { id: 0, paper: "GS-1 • 2019", marks: "15 Marks • 250 Words", text: "Discuss modern theories regarding Earth's origin and explain how differentiation led to its layered structure.", framework: ["Intro: Earth's origin as a key question in physical geography — convergence of nebular hypothesis and accretion theory", "Body: Nebular hypothesis (Kant-Laplace) — solar system from rotating gas cloud", "Body: Modern accretion theory — dust → planetesimals → proto-Earth over millions of years", "Body: Energy sources — gravitational accretion + radioactive decay (U, Th, K) → melting", "Body: Magma ocean stage — complete melting allowed density-driven separation", "Body: Differentiation — Fe-Ni sank (core), silicates rose (mantle/crust)", "Body: Evidence — meteorite dating (4.6 Ga), oldest zircons (4.4 Ga), Acasta Gneiss (4.0 Ga)", "Conclusion: Differentiation created the layered Earth that enables geodynamo, plate tectonics, and habitability"] },
    { id: 1, paper: "GS-1 • 2017", marks: "10 Marks • 150 Words", text: "Explain the evolution of Earth's atmosphere and its significance for understanding climate change.", framework: ["Intro: Earth's atmosphere has undergone three fundamental transformations", "Body: Stage 1 — Primary atmosphere (H₂/He) lost to space due to weak gravity and solar wind", "Body: Stage 2 — Secondary atmosphere from volcanic outgassing (CO₂, H₂O, N₂)", "Body: Stage 3 — Great Oxidation Event (2.5 Ga) — cyanobacteria produced free O₂", "Body: Significance — understanding natural atmospheric change provides baseline for evaluating anthropogenic climate change", "Conclusion: Modern climate change is occurring at rates far exceeding any natural atmospheric transformation — this geological perspective underscores the urgency of climate action"] },
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
    { label: "Earth Age", value: "4.6 Ga" },
    { label: "Oldest Zircon", value: "4.4 Ga" },
    { label: "Oldest Rock", value: "4.0 Ga" },
    { label: "GOE", value: "2.5 Ga" },
    { label: "Core Comp.", value: "Fe-Ni" },
    { label: "Dharwar Age", value: ">3 Ga" },
    { label: "C-14 Range", value: "50K yrs" },
    { label: "Atm N₂", value: "78%" },
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

export default function EarthOriginPage() {
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
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.1 Origin and Evolution of Earth
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

        {/* Navigation Ribbon — Previous Topic | Next Section | Next Topic */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              {/* Previous Topic */}
              <a href="/upsc/content-preview/moon"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.6 Moon</span>
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
              {/* Next Topic */}
              <a href="/upsc/content-preview/earth-interior"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">2.2 Internal Structure</span>
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

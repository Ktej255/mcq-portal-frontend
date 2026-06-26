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
      <RichText text="In Topic 1.3 we explored how **stars** are born, live, and die — manufacturing every element heavier than lithium. But where do stars live? They cluster together by the hundreds of billions into vast gravitationally bound systems called **galaxies**." />

      {/* What is a Galaxy */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌌 WHAT IS A GALAXY</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="A **gravitationally bound system** of stars, gas, dust, and dark matter." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Estimated **200 billion–2 trillion galaxies** in the observable Universe." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Fundamental building blocks of the Universe's large-scale structure." /></li>
        </ul>
      </div>

      {/* Hubble Classification */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔭 HUBBLE CLASSIFICATION 1926</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Spiral** — disc + arms, ongoing star formation, mix of young and old stars (e.g., Milky Way, Andromeda)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Elliptical** — smooth, featureless, predominantly old red stars, minimal gas/dust, little new formation." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Irregular** — chaotic, no defined structure, vigorous star formation (e.g., **Magellanic Clouds**)." /></li>
        </ul>
      </div>

      {/* Galaxy Classification Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Hubble Tuning Fork — Galaxy Classification</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Elliptical (E0–E7) • Spiral (Sa–Sc) • Barred Spiral (SBa–SBc) • Irregular</p>
        </div>
      </div>

      {/* Milky Way */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🏠 MILKY WAY</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Barred spiral galaxy**, approximately **100,000 light-years** in diameter." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Contains **200–400 billion stars** with a central bar-shaped structure." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Four components: **central bulge** (old stars + SMBH), **disc** (spiral arms), **stellar halo** (globular clusters), **dark matter halo**." /></li>
        </ul>
      </div>

      {/* Sun's Position */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📍 SUN&apos;S POSITION</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Located in the **Orion Arm**, approximately **26,000 light-years** from the galactic centre." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="One orbit = **225–250 million years** (one **galactic year**)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Sgr A*** at centre — supermassive black hole, **4 million solar masses**, imaged by EHT 2022." /></li>
        </ul>
      </div>

      {/* PYQ Tag */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Sun&apos;s position in Milky Way tested in UPSC Prelims 2017
        </span>
      </div>

      {/* Dark Matter */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔮 DARK MATTER</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Constitutes **~27%** of Universe's total mass-energy content." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Does **not emit, absorb, or reflect light** — detected only through **gravitational effects**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Key evidence: **galaxy rotation curves** — outer stars orbit too fast for visible matter alone." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Provides gravitational **scaffolding** on which galaxies and large-scale structure form." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        Dark Matter vs Dark Energy — completely different! Dark Matter (~27%) provides gravitational pull holding galaxies together. Dark Energy (~68%) provides repulsive force accelerating the Universe&apos;s expansion. Only ~5% of the Universe is ordinary (baryonic) matter we can see and touch.
      </Callout>

      {/* Large-Scale Structure */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🕸️ LARGE-SCALE STRUCTURE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Cosmic Web**: galaxies cluster along **filaments** and walls surrounding enormous **voids**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Hierarchy: galaxies → **clusters** (~100–1000) → **superclusters** (~10,000+) → filaments." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Milky Way → **Local Group** (~80 galaxies) → **Virgo Supercluster** → **Laniakea** (~100K galaxies, 500M ly)." /></li>
        </ul>
      </div>

      {/* Cosmic Web Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Large-Scale Structure — The Cosmic Web</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Galaxies → Clusters → Superclusters → Filaments → Voids</p>
        </div>
      </div>

      {/* Andromeda */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌀 ANDROMEDA</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Nearest major spiral galaxy — **2.5 million light-years** away." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Shows **BLUESHIFT** — **approaching** Milky Way at **~110 km/s**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Collision in **~4.5 Ga** — demonstrates gravity overcomes expansion locally." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Local Group galaxies are **gravitationally bound** — expansion applies on larger scales only." /></li>
        </ul>
      </div>

      {/* PYQ Tag */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Galaxy hierarchy and Virgo Supercluster tested in UPSC Prelims 2021
        </span>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        We now understand the cosmic address: Universe → Supercluster → Cluster → Galaxy → Solar System → Earth. In Topic 1.5, we zoom in to understand what makes Earth uniquely habitable among all the planets in all these galaxies — the Goldilocks conditions that permitted life.
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
        <p className="mt-1 text-xs font-semibold text-[#92400e]">Pages 14-15: Universe and Galaxies</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** 'The Universe contains billions of galaxies.' NCERT establishes the hierarchy: Universe → Galaxies → Solar Systems → Planets. This organisational framework is the foundation for understanding Earth's cosmic context." />
          <RichText text="**Testable Fact:** The emphasis is on **scale** — our Sun is one star among billions in the Milky Way, and the Milky Way is one galaxy among billions. UPSC tests whether students can correctly place Earth within this hierarchy." />
          <RichText text="**Important:** NCERT does not specify Hubble's classification in detail, but UPSC expects knowledge of **Spiral, Elliptical, and Irregular** types from standard references like GC Leong." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 8 — Science: Stars and the Solar System</p>
        <div className="mt-3 space-y-3">
          <RichText text="NCERT describes the Milky Way as appearing as a **bright band across the night sky** when viewed edge-on from within. This is because we are inside the disc looking along the plane." />
          <RichText text="Mentions that the Sun is just **one of the many stars** in our galaxy — establishing the Sun's ordinary nature, critical for understanding that planet-forming conditions are likely common across the galaxy." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 6 — The Earth: Our Habitat, Chapter 1</p>
        <div className="mt-3">
          <RichText text="Foundation: **'A Galaxy is a huge system of billions of stars and clouds of dust and gases.'** NCERT mentions millions of galaxies exist and that our galaxy is the Milky Way. While basic, UPSC has framed questions testing whether students know the Sun is one star among billions in one galaxy among billions." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🌍 Space", title: "JWST — Discovering the Earliest Galaxies", text: "**JWST** has discovered galaxies existing just **300–400 million years** after the Big Bang — much earlier than expected. Some of these early galaxies are unexpectedly **massive and mature**, challenging existing models of galaxy formation. This is an active area of research that may require revisions to our understanding of early Universe structure formation." },
    { tag: "🌍 Space", title: "Event Horizon Telescope — Sagittarius A* Image (2022)", text: "**EHT** released the first image of **Sagittarius A*** — the supermassive black hole at the centre of our Milky Way (May 2022). The image shows the 'shadow' of the black hole surrounded by a bright ring of hot gas. Confirmed mass (~**4 million solar masses**) and validated general relativity predictions for our own galactic centre." },
    { tag: "🇮🇳 India", title: "AstroSat — UV Galaxy Detection", text: "India's **AstroSat** detected extreme **ultraviolet radiation** from a distant galaxy, demonstrating that such radiation can escape galaxies and ionise intergalactic hydrogen — relevant to understanding how the early Universe became transparent (**cosmic reionisation**). India's observation capabilities are reaching internationally competitive levels." },
    { tag: "🌍 Space", title: "Dark Energy Survey Results", text: "The **Dark Energy Survey** mapped hundreds of millions of galaxies to study the **large-scale structure** of the Universe. Results confirm that **dark energy** (~68% of the Universe) drives accelerated expansion. The survey's galaxy distribution maps match predictions of the **ΛCDM cosmological model**, strengthening our understanding of cosmic evolution." },
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
    { wrong: "'The Sun is at the centre of the Milky Way.'", right: "The Sun is approximately 26,000 light-years from the galactic centre, located in the Orion Arm (Local Spur). At the centre is the supermassive black hole Sagittarius A*. Tested in UPSC Prelims 2017." },
    { wrong: "'Andromeda galaxy shows redshift — it is moving away from us.'", right: "WRONG. Andromeda shows BLUESHIFT — it is APPROACHING the Milky Way at ~110 km/s. Local gravitational attraction overcomes Hubble expansion. Collision in ~4.5 billion years." },
    { wrong: "'Dark matter is the same as dark energy.'", right: "Completely different! Dark Matter (~27%) provides gravitational PULL — holds galaxies together. Dark Energy (~68%) provides repulsive PUSH — accelerates cosmic expansion. Different physics, different effects." },
    { wrong: "'The Milky Way is the largest galaxy in the Universe.'", right: "WRONG. The Milky Way is an average-sized galaxy. IC 1101, one of the largest known galaxies, is about 6 million light-years in diameter — 60× the Milky Way. Even Andromeda in our Local Group is larger." },
    { wrong: "'All galaxies are moving away from us due to expansion.'", right: "WRONG. Hubble expansion applies to the large-scale Universe. Locally, galaxies within clusters are gravitationally BOUND and can approach each other. Andromeda, M33, and other Local Group members are approaching." },
    { wrong: "'We can see the entire Milky Way from Earth.'", right: "WRONG. We are INSIDE the Milky Way's disc. Interstellar dust in the galactic plane obscures our view of large portions. The galactic centre is invisible in optical light — observed only in infrared and radio wavelengths." },
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
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about types of galaxies:", stmts: ["Spiral galaxies have disc-shaped structures with rotating spiral arms and ongoing star formation.", "Elliptical galaxies are predominantly composed of young, blue stars with vigorous star formation.", "Irregular galaxies lack defined structure and include the Large and Small Magellanic Clouds.", "The Milky Way was reclassified as a barred spiral galaxy based on infrared observations revealing a central bar."], opts: ["1, 3 and 4 only", "1 and 3 only", "1, 2 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — spiral galaxies have discs with arms and active star formation. Statement 2: WRONG — elliptical galaxies have predominantly OLD, RED stars with minimal star formation. Statement 3: CORRECT — LMC and SMC are irregular galaxies. Statement 4: CORRECT — reclassified from spiral to barred spiral (SBbc) in 2005 based on infrared surveys." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements about the Milky Way galaxy:", stmts: ["The Milky Way is approximately 100,000 light-years in diameter.", "It contains approximately 200-400 billion stars.", "The Sun is located at the galactic centre near Sagittarius A*.", "The Sun takes 225-250 million years to orbit the galactic centre once."], opts: ["1, 2 and 4 only", "1 and 2 only", "1, 2 and 3 only", "1, 2, 3 and 4"], correct: 0, explain: "Statements 1, 2, 4: CORRECT. Statement 3: WRONG — the Sun is NOT at the galactic centre. It is in the Orion Arm, 26,000 light-years from centre. Sagittarius A* is the supermassive black hole AT the centre. This was tested in UPSC 2017." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following about dark matter:", stmts: ["Dark matter constitutes approximately 27% of the Universe's total mass-energy.", "It is detected through its gravitational effects on visible matter.", "Galaxy rotation curves provide key evidence for dark matter's existence.", "Dark matter emits radiation in the infrared spectrum invisible to optical telescopes."], opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statements 1, 2, 3: CORRECT. Statement 4: WRONG — dark matter does NOT emit, absorb, or reflect ANY radiation at any wavelength. That's precisely why it's 'dark' — it interacts only gravitationally. If it emitted infrared, we could detect it with telescopes." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following statements provide evidence for Hubble's galaxy classification system?", stmts: ["Presence or absence of spiral arm structures in observed galaxies.", "Ratio of old red stars to young blue stars in the stellar population.", "Amount of interstellar gas and dust available for new star formation.", "The galaxy's distance from the Milky Way.", "Presence of a central bar structure in some spiral galaxies."], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1, 2, 3, 5 are relevant classification evidence. Statement 4 (distance from Milky Way) is NOT a classification criterion — galaxy type is based on morphology/structure, not location. Four correct." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following about the large-scale structure of the Universe are correct?", stmts: ["Galaxies are organised into clusters containing hundreds to thousands of members.", "Superclusters are the largest gravitationally bound structures in the Universe.", "Cosmic voids are vast regions nearly empty of galaxies.", "Filaments are thread-like structures along which galaxies are distributed.", "The Laniakea Supercluster contains approximately 100,000 galaxies."], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1, 3, 4, 5 are CORRECT. Statement 2 is WRONG — superclusters are NOT gravitationally bound; they are being torn apart by dark energy expansion. Galaxy CLUSTERS are the largest gravitationally bound structures. This is a subtle but important distinction. Four correct." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): Galaxy rotation curves provide strong evidence for the existence of dark matter.\n\nReason (R): Stars in the outer regions of galaxies orbit at much higher velocities than can be explained by the gravitational pull of visible matter alone.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. Without dark matter, outer stars should orbit slowly (Keplerian decline). Instead they orbit fast — implying a massive invisible halo. This 'flat rotation curve' problem is the primary evidence for dark matter in galaxies." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The Andromeda galaxy will collide with the Milky Way in approximately 4.5 billion years.\n\nReason (R): The gravitational attraction between the Milky Way and Andromeda overcomes the Hubble expansion at their relatively close distance of 2.5 million light-years.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. At the Local Group scale (~few Mpc), gravitational binding dominates over Hubble expansion. Andromeda approaches at ~110 km/s (blueshift), demonstrating that expansion is a large-scale phenomenon, not universal at all scales." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following about the Milky Way is NOT correct?", stmts: [], opts: ["The Milky Way is a barred spiral galaxy approximately 100,000 light-years in diameter", "The Sun is located in the Orion Arm about 26,000 light-years from the centre", "The Milky Way contains approximately 200-400 billion stars", "The Milky Way is the largest galaxy in the Local Group"], correct: 3, explain: "Option (d) is WRONG — the Milky Way is NOT the largest galaxy in the Local Group. Andromeda (M31) is larger in terms of diameter and mass. The Milky Way is the second-largest. All other statements are factually correct." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following is NOT a type in Hubble's galaxy classification system?", stmts: [], opts: ["Spiral galaxies with well-defined rotating arms", "Elliptical galaxies with smooth featureless appearance", "Quasar galaxies with extremely high luminosity cores", "Irregular galaxies lacking defined structure"], correct: 2, explain: "Option (c) is NOT part of Hubble's classification. Quasars are Active Galactic Nuclei — extremely luminous centres of distant galaxies, not a morphological galaxy type. Hubble classified galaxies by shape: Elliptical, Spiral (normal + barred), and Irregular." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news headline reads: 'JWST discovers galaxy existing just 350 million years after the Big Bang — earlier and more massive than models predicted.'\n\nA student makes three inferences:\n1. This discovery confirms existing galaxy formation models perfectly.\n2. Galaxies may have formed earlier than previously thought.\n3. JWST observes distant objects by detecting light that has travelled billions of years.\n\nWhich inference(s) is/are valid?", stmts: [], opts: ["1 and 3 only", "2 and 3 only", "1 and 2 only", "1, 2 and 3"], correct: 1, explain: "Inference 1: WRONG — the headline says 'earlier and more massive than models predicted,' meaning models are CHALLENGED, not confirmed. Inference 2: CORRECT — earlier existence implies earlier formation. Inference 3: CORRECT — JWST observes infrared light from distant/early Universe objects (lookback time). Only 2 and 3 valid." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "Consider: 'The Event Horizon Telescope has released the first image of the supermassive black hole at the centre of the Milky Way, Sagittarius A*, confirming its mass at approximately 4 million solar masses.'\n\nThis achievement primarily demonstrates:", stmts: [], opts: ["That black holes emit visible light that can be directly photographed", "That very long baseline interferometry can achieve resolution equivalent to a planet-sized telescope", "That Sagittarius A* is the largest black hole in the observable Universe", "That the Milky Way's centre is devoid of stars due to the black hole's gravitational pull"], correct: 1, explain: "Option (b) CORRECT. EHT is not one telescope but a global network using Very Long Baseline Interferometry (VLBI) to achieve angular resolution of a single Earth-sized dish. Option (a): WRONG — they imaged the 'shadow' and surrounding hot gas, not light from the BH. Option (c): WRONG — Sgr A* is relatively modest. Option (d): WRONG — the central region is very dense with stars." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "An astronomer observes that a distant galaxy's spectral lines are shifted toward the red end of the spectrum. Another nearby galaxy (Andromeda) shows spectral lines shifted toward the blue end.\n\nThe most accurate interpretation is:", stmts: [], opts: ["Both galaxies are moving toward us at different speeds", "The distant galaxy is receding due to cosmic expansion; Andromeda is approaching due to local gravitational attraction", "Both galaxies are rotating at different rates causing different Doppler effects", "Red and blue shifts indicate the temperature differences between the two galaxies"], correct: 1, explain: "Option (b) CORRECT. Redshift of distant galaxy = recession (Hubble expansion). Blueshift of Andromeda = approaching (gravitational binding overcomes expansion locally). This demonstrates that expansion is a large-scale phenomenon while gravity dominates locally." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the galaxy types with their characteristics:\n\n1. Spiral Galaxy — P. Smooth, featureless, predominantly old red stars\n2. Elliptical Galaxy — Q. Disc-shaped with arms, active star formation, mix of young and old stars\n3. Irregular Galaxy — R. No defined structure, chaotic, vigorous star formation", stmts: [], opts: ["1-Q, 2-P, 3-R", "1-P, 2-Q, 3-R", "1-R, 2-P, 3-Q", "1-Q, 2-R, 3-P"], correct: 0, explain: "Spiral = Q (disc with arms, active formation). Elliptical = P (smooth, old red stars). Irregular = R (no structure, chaotic). The key distinguisher is star formation activity: spirals have ongoing, ellipticals have little, irregulars have vigorous but unstructured." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match space missions/telescopes with their primary objectives:\n\n1. Event Horizon Telescope — P. UV observations and cosmic reionisation studies\n2. James Webb Space Telescope — Q. Imaging black hole shadows using global interferometry\n3. India's AstroSat — R. Observing earliest galaxies in infrared\n4. Euclid (ESA) — S. Mapping large-scale structure to study dark energy", stmts: [], opts: ["1-Q, 2-R, 3-P, 4-S", "1-R, 2-Q, 3-S, 4-P", "1-Q, 2-P, 3-R, 4-S", "1-S, 2-R, 3-P, 4-Q"], correct: 0, explain: "EHT = Q (black hole imaging via VLBI). JWST = R (infrared, earliest galaxies). AstroSat = P (UV observations, reionisation). Euclid = S (large-scale structure, dark energy). Common trap: confusing JWST (infrared) with AstroSat (UV)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "Consider the following statements: [Based on UPSC 2017]\n1. The Sun is approximately at the centre of the Milky Way galaxy.\n2. The Sun takes approximately 250 million years to orbit the galactic centre.\n\nWhich of the above is/are correct?", stmts: [], opts: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"], correct: 1, explain: "Statement 1: WRONG — Sun is NOT at centre; it's 26,000 ly away in Orion Arm. Statement 2: CORRECT — galactic year is 225-250 million years. Only Statement 2 is correct. This is an actual UPSC 2017 question pattern testing Sun's position in the Milky Way." },
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
            <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem}</p>
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
    { id: 0, paper: "GS-1 • 2017", marks: "10 Marks • 150 Words", text: "Discuss the structure of the Milky Way galaxy and the Sun's position within it.", framework: ["Intro: Define Milky Way as barred spiral galaxy, mention scale", "Body: Four structural components — central bulge, disc, stellar halo, dark matter halo", "Body: Spiral arms — major arms (Perseus, Scutum-Centaurus) and minor spurs (Orion Arm)", "Body: Sun's position — Orion Arm, 26,000 ly from centre, galactic year 225-250 My", "Body: Sagittarius A* — supermassive black hole, 4 million solar masses at centre", "Conclusion: Copernican Principle — Earth occupies no special position, significance for cosmology"] },
    { id: 1, paper: "GS-3 • India S&T", marks: "15 Marks • 250 Words", text: "How has India's AstroSat contributed to our understanding of the Universe? Discuss its capabilities and key achievements.", framework: ["Intro: AstroSat launched 2015, India's first dedicated multi-wavelength space observatory", "Body: Five payloads covering UV, X-ray, and optical — simultaneous multi-wavelength observation", "Body: Key achievement — UV detection of galaxy 9.3 billion light-years away", "Body: Cosmic reionisation studies — UV radiation escaping galaxies", "Body: Studies of neutron stars, black hole binaries, star-forming regions", "Body: Comparison with international observatories — cost-effective, competitive science", "Conclusion: India's growing space science capability, upcoming missions, global collaboration"] },
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
    { label: "MW Diameter", value: "100K ly" },
    { label: "Stars in MW", value: "200-400B" },
    { label: "Sun from Centre", value: "26K ly" },
    { label: "Galactic Year", value: "225M yr" },
    { label: "Dark Matter", value: "27%" },
    { label: "Dark Energy", value: "68%" },
    { label: "Andromeda Dist", value: "2.5M ly" },
    { label: "Hubble Year", value: "1926" },
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

export default function GalaxiesPage() {
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
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: MODERATE</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: LOW</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.4 Galaxies and Large-Scale Structure of the Universe
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

        {/* Navigation Ribbon — Previous Topic | Next Section | Next Topic */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              <a href="/upsc/content-preview/stars"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.3 Stars</span>
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
              <a href="/upsc/content-preview/earth-uniqueness"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">1.5 Earth</span>
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

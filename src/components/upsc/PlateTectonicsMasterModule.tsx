"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileStack,
  FileText,
  Layers3,
  Printer,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = {
  primary: "#1B2A4A",
  section: "#1E3A5F",
  accent: "#2ECC71",
  light: "#EAF6FF",
  warning: "#FFF3CD",
  warningBorder: "#F39C12",
  current: "#E8F8F0",
  pyq: "#F0F4FF",
  text: "#1A1A1A",
  white: "#FFFFFF",
  slate: "#526174",
  line: "#D8E5F3",
  softGreen: "#DDF7E8",
  pale: "#F8FBFF",
};

const downloadModes = [
  { label: "Topic PDF", icon: FileText },
  { label: "Chapter PDF", icon: FileStack },
  { label: "Week Cluster PDF", icon: Download },
];

const moduleMap = [
  "Continental Drift Theory: Wegener, Pangaea, Panthalassa, Laurasia, Gondwanaland.",
  "Evidence: jigsaw fit, rock continuity, tillite, placer deposits, Glossopteris, Mesosaurus.",
  "Sea-floor spreading: Hess, mid-oceanic ridge, basaltic crust, magnetic reversal stripes.",
  "Plate Tectonic Theory: lithosphere plates moving over asthenosphere.",
  "Plate boundaries: convergent, divergent, transform and the landforms each produces.",
  "Convergent sub-types: oceanic-oceanic, oceanic-continental, continental-continental.",
  "Divergent boundaries: rift valleys, ridges, new sea floor, East African Rift.",
  "Transform boundaries: strike-slip faults, San Andreas Fault, Sagaing Fault comparison.",
  "Hotspots: Hawaiian chain, age progression, Deccan Traps and Reunion hotspot theory.",
  "Indian plate movement: northward drift, Tethys closure, collision with Eurasia, Himalaya.",
  "Tethys Sea: sediments, marine fossils, compression, uplift, fold mountain formation.",
  "Gondwanaland vs Laurasia: breakup history and India's path from south to north.",
];

const ncertReferences = [
  {
    book: "Fundamentals of Physical Geography",
    className: "Class XI",
    chapter: "Chapter 4: Distribution of Oceans and Continents",
    pages: "pp. 27-35",
    use: [
      "Use pp. 27-28 for continental drift, Pangaea, Panthalassa, Laurasia and Gondwanaland.",
      "Use pp. 28-29 for Wegener evidence: jigsaw fit, rocks, tillite, placer deposits and fossil links.",
      "Use pp. 29-31 for convection current theory, ocean floor mapping and sea-floor spreading.",
      "Use pp. 31-33 for plate tectonic theory, major plates and boundary types.",
      "Use pp. 34-35 for Indian plate movement, Tethys, Deccan volcanism and Himalaya formation.",
    ],
    strategy:
      "Read the chapter once as chronology, then revise it as cause-effect chains: theory -> evidence -> mechanism -> landform -> UPSC trap.",
  },
  {
    book: "India: Physical Environment",
    className: "Class XI",
    chapter: "Chapter 2: Structure and Physiography",
    pages: "supporting cross-read",
    use: [
      "Use for Himalaya, Peninsular block and Indo-Ganga plain as outcomes of plate interaction.",
      "Connect Tethys sediment compression with the young fold mountain character of Himalaya.",
      "Connect the stable Peninsular block with old Gondwana ancestry and later Deccan volcanism.",
    ],
    strategy:
      "Read only after the global plate-tectonic base is clear; it converts the global theory into India-specific prelims logic.",
  },
];

const advancedBlocks = [
  {
    title: "Theory Ladder",
    points: [
      "Continental drift explained that continents moved, but it did not fully explain the force of movement.",
      "Convection current theory supplied the internal heat-driven mechanism inside the mantle.",
      "Sea-floor spreading explained how new crust forms at ridges and moves outward.",
      "Plate tectonics integrated continental drift, ocean-floor evidence and mantle dynamics into one model.",
      "UPSC angle: questions often test the sequence of theory development, not only definitions.",
    ],
  },
  {
    title: "Boundary Logic",
    points: [
      "Divergent boundary: plates move apart; magma rises; new crust forms; ridges and rifts dominate.",
      "Convergent boundary: plates move together; subduction or collision occurs; trenches, arcs, volcanoes and fold mountains form.",
      "Transform boundary: plates slide past each other; crust is neither created nor destroyed; shallow earthquakes dominate.",
      "UPSC angle: do not mechanically connect every boundary with volcanoes; transform boundaries mainly produce earthquakes.",
    ],
  },
  {
    title: "Indian Plate Chain",
    points: [
      "India was part of Gondwanaland and later separated from Africa, Antarctica and Australia.",
      "The Tethys Sea existed between the Indian plate and Eurasian plate before collision.",
      "Marine sediments deposited in Tethys were compressed, folded and uplifted to form the Himalaya.",
      "Deccan Traps are linked in one theory with Indian plate passage over the Reunion hotspot around 60 Ma.",
      "UPSC angle: India is a moving plate story, not just a static physiography story.",
    ],
  },
  {
    title: "Exception And Edge Cases",
    points: [
      "Hotspot volcanism may occur within plates, away from plate boundaries.",
      "Back-arc regions can have extension even near convergent systems.",
      "Continental collision creates high mountains but does not usually create a neat volcanic arc because buoyant continental crust resists subduction.",
      "Earthquake intensity depends on depth, distance, rupture, soil and building vulnerability, not magnitude alone.",
      "UPSC angle: the examiner may mix a correct plate setting with a wrong landform or hazard outcome.",
    ],
  },
];

const actualTrapPatterns = [
  {
    trap: "Continental drift vs plate tectonics",
    pattern:
      "A statement says Wegener gave a complete mechanism for continental movement. This is false; he gave the drift idea and evidence, but the mechanism matured later.",
    correction:
      "Match Wegener with continental drift; Hess with sea-floor spreading; plate tectonics with integrated lithospheric plates.",
  },
  {
    trap: "Transform boundary produces new ocean floor",
    pattern:
      "A statement says transform faults create new crust because they are found near ridges. This confuses transform offsets with divergent ridge segments.",
    correction:
      "New crust forms at divergent ridges; transform boundaries mainly conserve crust and generate shallow earthquakes.",
  },
  {
    trap: "All convergent boundaries form Himalaya-like mountains",
    pattern:
      "A statement treats every convergence as continental-continental collision.",
    correction:
      "Oceanic-oceanic creates island arcs; oceanic-continental creates trenches plus volcanic mountains; continental-continental creates fold mountains.",
  },
  {
    trap: "Hotspots are always plate boundaries",
    pattern:
      "A statement links all hotspots with divergent or convergent margins.",
    correction:
      "Hotspots can be intra-plate; Hawaiian chain is the classic case, while Deccan Traps are linked to hotspot theory.",
  },
  {
    trap: "Tethys Sea disappeared by evaporation",
    pattern:
      "A statement says Tethys simply dried up, leaving sediments behind.",
    correction:
      "The plate collision closed Tethys; its marine sediments were compressed and uplifted into Himalayan structures.",
  },
];

const predictedTraps = [
  "How many of these are evidence for continental drift: Glossopteris, Mesosaurus, magnetic reversals, coal in Antarctica?",
  "Match boundary with outcome: trench, ridge, strike-slip fault, island arc.",
  "Statement test on India: Deccan volcanism, Tethys closure, Himalaya rise and northward drift chronology.",
  "Current event bridge: Sagaing Fault or San Andreas Fault as transform/strike-slip setting.",
  "Exception test: hotspot volcanism away from plate margins.",
  "Back-arc or subduction test: Japan/Kamchatka earthquake setting vs simple collision language.",
];

const currentAffairs = [
  {
    year: "2023",
    event: "Turkey-Syria / Pazarcik earthquake sequence: USGS M 7.8, shallow and destructive.",
    staticConcept: "Transform or strike-slip faulting can generate severe shallow earthquakes.",
    upscAngle:
      "Ask whether transform boundaries create crust, destroy crust, or mainly release accumulated shear stress.",
    source: "USGS event us6000jllz",
  },
  {
    year: "2024",
    event: "Noto Peninsula, Japan: USGS M 7.5 earthquake, tsunami flag, red alert.",
    staticConcept: "Convergent-margin regions can involve reverse faulting, uplift, tsunami and landslide risk.",
    upscAngle:
      "Japan should not be reduced to one phrase; subduction, back-arc stress, uplift and tsunami risk can all be examined.",
    source: "USGS event us6000m0xl",
  },
  {
    year: "2025",
    event: "Mandalay/Sagaing, Myanmar: USGS M 7.7 earthquake, depth about 10 km, red alert.",
    staticConcept: "Strike-slip rupture along a major fault can damage distant basins through wave amplification.",
    upscAngle:
      "Compare Sagaing Fault with San Andreas as a transform-style strike-slip question.",
    source: "USGS event us7000pn9s",
  },
  {
    year: "2025",
    event: "Kamchatka Peninsula, Russia: USGS M 8.8 earthquake with tsunami flag.",
    staticConcept: "Fast convergent subduction zones can host megathrust earthquakes and tsunami generation.",
    upscAngle:
      "Differentiate oceanic subduction hazards from continental collision mountain building.",
    source: "USGS event us6000qw60",
  },
];

const pyqLedger: Array<{
  year: string;
  status: string;
  question: ReactNode;
  options: string[];
  answer: string;
  explanation: ReactNode;
  match: ReactNode;
  pattern: string;
}> = [
  {
    year: "UPSC CSE Prelims 2013",
    status: "Verified theme; final public release should lock exact paper wording from your PYQ database.",
    question: (
      <>
        Which of the following phenomena might have influenced the evolution of organisms?
        <br />
        1. <Mark>Continental drift</Mark>
        <br />
        2. Glacial cycles
      </>
    ),
    options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
    answer: "Both 1 and 2",
    explanation: (
      <>
        Continental drift changed geographic isolation, migration routes and climate belts. Glacial cycles
        repeatedly changed habitats and sea levels. Both can influence evolution.
      </>
    ),
    match: (
      <>
        This module covers the matching portion under <Mark>Continental Drift Theory</Mark>,{" "}
        <Mark>Gondwanaland vs Laurasia</Mark> and fossil evidence.
      </>
    ),
    pattern: "UPSC links a static geography theory with biology/environment, not only maps.",
  },
  {
    year: "UPSC PYQ pattern: plate boundary and landform",
    status: "Pattern reconstruction for demo; replace with exact full PYQ from repository before public release.",
    question: (
      <>
        Consider the following statements:
        <br />
        1. <Mark>Mid-oceanic ridges</Mark> are associated with divergent boundaries.
        <br />
        2. <Mark>Oceanic trenches</Mark> are commonly associated with subduction zones.
        <br />
        3. <Mark>Transform boundaries</Mark> are zones where crust is continuously created.
      </>
    ),
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: "1 and 2 only",
    explanation: (
      <>
        Ridges are divergent settings and trenches are subduction-linked. Transform boundaries conserve crust;
        they mainly generate strike-slip earthquakes.
      </>
    ),
    match: (
      <>
        Matching portion: <Mark>Types of plate boundaries</Mark>, <Mark>sea-floor spreading</Mark> and{" "}
        <Mark>transform boundary</Mark>.
      </>
    ),
    pattern: "Examiner mixes two correct associations with one boundary-process trap.",
  },
  {
    year: "UPSC PYQ pattern: Indian plate chronology",
    status: "Pattern reconstruction for demo; exact year-wise paper lock pending.",
    question: (
      <>
        With reference to the evolution of the Indian subcontinent, consider the following statements:
        <br />
        1. India separated from Gondwanaland and moved northward.
        <br />
        2. <Mark>The Tethys Sea lay between India and Eurasia</Mark> before collision.
        <br />
        3. Himalaya formation is related to compression and uplift of Tethyan sediments.
      </>
    ),
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: "1, 2 and 3",
    explanation: (
      <>
        All three statements form one connected chain: Gondwana separation, northward drift, Tethys closure
        and Himalayan uplift.
      </>
    ),
    match: (
      <>
        Matching portion: <Mark>Indian plate movement</Mark>, <Mark>Tethys Sea</Mark> and{" "}
        <Mark>detailed study of sediments that became Himalayas</Mark>.
      </>
    ),
    pattern: "UPSC rewards chain thinking over isolated fact recall.",
  },
  {
    year: "UPSC PYQ pattern: hotspot exception",
    status: "Pattern reconstruction for demo; exact paper database should validate.",
    question: (
      <>
        Which of the following is the best explanation for the formation of the Hawaiian Islands?
      </>
    ),
    options: [
      "Collision of two continental plates",
      "Subduction of continental crust below oceanic crust",
      "Movement of an oceanic plate over a relatively fixed hotspot",
      "Closure of a shallow sea between two continents",
    ],
    answer: "Movement of an oceanic plate over a relatively fixed hotspot",
    explanation: (
      <>
        Hawaiian island age progression is classically explained by Pacific plate movement over a hotspot.
      </>
    ),
    match: (
      <>
        Matching portion: <Mark>Hotspots</Mark>, <Mark>Hawaiian Islands formation</Mark> and the idea
        that volcanism can occur away from plate boundaries.
      </>
    ),
    pattern: "Exception-based MCQ: not all volcanism sits directly on a plate boundary.",
  },
];

const practiceMcqs = [
  {
    type: "Direct Recall",
    question: "Who proposed the Continental Drift Theory in 1912?",
    options: ["Arthur Holmes", "Alfred Wegener", "Harry Hess", "Tuzo Wilson"],
    answer: "Alfred Wegener",
    explanation: "Wegener proposed continental drift; Hess is linked with sea-floor spreading.",
  },
  {
    type: "Direct Recall",
    question: "Which supercontinent was surrounded by Panthalassa?",
    options: ["Laurasia", "Gondwanaland", "Pangaea", "Tethys"],
    answer: "Pangaea",
    explanation: "Pangaea was the single large landmass; Panthalassa was the surrounding ocean.",
  },
  {
    type: "Multi-Statement",
    question:
      "Consider: 1. Mesosaurus fossils support continental drift. 2. Magnetic reversals support sea-floor spreading. 3. Tillite deposits are unrelated to past glaciation. Which are correct?",
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: "1 and 2 only",
    explanation: "Tillite is glacial sedimentary evidence, so statement 3 is incorrect.",
  },
  {
    type: "Multi-Statement",
    question:
      "Consider: 1. Divergent boundaries create new crust. 2. Transform boundaries destroy old crust. 3. Convergent boundaries may form trenches. Which are correct?",
    options: ["1 and 2 only", "1 and 3 only", "2 and 3 only", "1, 2 and 3"],
    answer: "1 and 3 only",
    explanation: "Transform boundaries conserve crust; they do not normally destroy it.",
  },
  {
    type: "Multi-Statement",
    question:
      "Consider: 1. The Himalaya is linked with India-Eurasia collision. 2. Tethys sediments were compressed during this process. 3. The Himalaya is an old residual mountain like the Aravalli. Which are correct?",
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: "1 and 2 only",
    explanation: "The Himalaya is a young fold mountain system, not an old residual mountain.",
  },
  {
    type: "Multi-Statement",
    question:
      "Consider: 1. Oceanic-oceanic convergence may form island arcs. 2. Oceanic-continental convergence may form volcanic mountains. 3. Continental-continental convergence usually forms deep ocean trenches. Which are correct?",
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: "1 and 2 only",
    explanation: "Continental collision is more associated with fold mountains than deep ocean trenches.",
  },
  {
    type: "How-many-correct",
    question:
      "How many are evidence for continental drift: jigsaw fit of continents, Glossopteris fossils, symmetric magnetic stripes, placer deposits across continents?",
    options: ["Only one", "Only two", "Only three", "All four"],
    answer: "Only three",
    explanation:
      "Jigsaw fit, Glossopteris and placer deposits support drift. Symmetric magnetic stripes support sea-floor spreading.",
  },
  {
    type: "How-many-correct",
    question:
      "How many can be linked with convergent boundaries: trench, volcanic arc, ridge, fold mountain?",
    options: ["Only one", "Only two", "Only three", "All four"],
    answer: "Only three",
    explanation: "Trench, volcanic arc and fold mountain can be linked with convergence. Ridge is divergent.",
  },
  {
    type: "Match Pairs",
    question: "Match: A. Divergent boundary B. Transform boundary C. Continental collision",
    options: [
      "A-rift valley, B-strike-slip fault, C-fold mountain",
      "A-trench, B-ridge, C-island arc",
      "A-fold mountain, B-trench, C-ridge",
      "A-hotspot, B-trench, C-ocean floor",
    ],
    answer: "A-rift valley, B-strike-slip fault, C-fold mountain",
    explanation: "The correct association follows movement direction and crustal outcome.",
  },
  {
    type: "Match Pairs",
    question: "Match: A. Wegener B. Hess C. Holmes",
    options: [
      "A-continental drift, B-sea-floor spreading, C-convection currents",
      "A-convection currents, B-continental drift, C-sea-floor spreading",
      "A-magnetic reversal, B-Pangaea, C-Tethys sediments",
      "A-hotspot chain, B-India collision, C-island arcs",
    ],
    answer: "A-continental drift, B-sea-floor spreading, C-convection currents",
    explanation: "This is the classic theory-development chain.",
  },
  {
    type: "Assertion-Reason",
    question:
      "Assertion: Transform boundaries are often associated with shallow earthquakes. Reason: At transform boundaries, plates slide laterally past each other.",
    options: [
      "Both A and R are true, and R explains A",
      "Both A and R are true, but R does not explain A",
      "A is true, R is false",
      "A is false, R is true",
    ],
    answer: "Both A and R are true, and R explains A",
    explanation: "Lateral shearing accumulates stress and releases it as earthquakes.",
  },
  {
    type: "Assertion-Reason",
    question:
      "Assertion: Himalayan rocks include marine sedimentary evidence. Reason: The Tethys Sea existed between India and Eurasia before collision.",
    options: [
      "Both A and R are true, and R explains A",
      "Both A and R are true, but R does not explain A",
      "A is true, R is false",
      "A is false, R is true",
    ],
    answer: "Both A and R are true, and R explains A",
    explanation: "Tethyan sediments were compressed and uplifted during India-Eurasia collision.",
  },
  {
    type: "NOT/Exception",
    question: "Which one is NOT normally associated with divergent boundaries?",
    options: ["Rift valley", "Mid-oceanic ridge", "New oceanic crust", "Deep ocean trench due to subduction"],
    answer: "Deep ocean trench due to subduction",
    explanation: "Trenches are linked with subduction at convergent margins.",
  },
  {
    type: "NOT/Exception",
    question: "Which one is NOT evidence used by Wegener for continental drift?",
    options: ["Jigsaw fit", "Glossopteris fossils", "Tillite deposits", "GPS satellite plate velocity"],
    answer: "GPS satellite plate velocity",
    explanation: "GPS is modern evidence for plate motion, not Wegener's original evidence set.",
  },
  {
    type: "Scenario",
    question:
      "A long linear fault shows horizontal displacement of roads and fences, shallow earthquakes, and no creation of new crust. Which boundary is most likely?",
    options: ["Divergent", "Transform", "Oceanic-oceanic convergent", "Continental-continental convergent"],
    answer: "Transform",
    explanation: "Horizontal displacement and shallow strike-slip earthquakes point to transform movement.",
  },
];

const coverageSplit = [
  { name: "Static Core", value: 34, color: colors.section },
  { name: "India Linkage", value: 22, color: colors.accent },
  { name: "Current Affairs", value: 16, color: "#4AA3DF" },
  { name: "PYQ/Traps", value: 18, color: colors.warningBorder },
  { name: "Practice", value: 10, color: "#8E6BD8" },
];

const trendData = [
  { label: "2013", direct: 72, applied: 28 },
  { label: "2016", direct: 58, applied: 42 },
  { label: "2019", direct: 44, applied: 56 },
  { label: "2022", direct: 35, applied: 65 },
  { label: "2026", direct: 28, applied: 72 },
];

const boundaryData = [
  { label: "Divergent", staticWeight: 70, trapRisk: 42 },
  { label: "Convergent", staticWeight: 92, trapRisk: 78 },
  { label: "Transform", staticWeight: 54, trapRisk: 74 },
  { label: "Hotspot", staticWeight: 48, trapRisk: 68 },
  { label: "India", staticWeight: 88, trapRisk: 82 },
];

export function PlateTectonicsMasterModule() {
  const [printMode, setPrintMode] = useState("Topic PDF");

  function handlePrint(label: string) {
    setPrintMode(label);
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <main className="plate-module">
      <style>{moduleCss}</style>
      <div className="print-fixed-header">
        SARIT CLASSES | UPSC PRELIMS MASTER MODULE | Plate Tectonics | {printMode}
      </div>
      <div className="print-fixed-footer">
        Student module generated from master prompt | Download mode: {printMode}
      </div>

      <section className="hero-band">
        <div className="hero-copy">
          <nav className="v1-version-nav" aria-label="Plate tectonics versions">
            <a href="/upsc-geography-plate-tectonics-demo" className="active">
              Version 1: Prompt Demo
            </a>
            <a href="/upsc-geography-plate-tectonics-v2">Version 2: Research Edition</a>
            <a href="/upsc-geography-plate-tectonics-v3">Version 3: Unified Lab</a>
          </nav>
          <div className="brand-row">
            <span className="brand-mark">SC</span>
            <div>
              <p className="brand-name">SARIT CLASSES</p>
              <p className="brand-tag">UPSC PRELIMS MASTER MODULE | GS PAPER 1</p>
            </div>
          </div>
          <h1>Plate Tectonics Master Module</h1>
          <p className="hero-subtitle">
            A student-facing geography module built from the master prompt: static base, NCERT
            anchor, advanced logic, examiner traps, current-affairs bridge, PYQ pattern ledger and
            practice MCQs in one printable page.
          </p>
          <div className="hero-actions screen-actions">
            {downloadModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button key={mode.label} type="button" onClick={() => handlePrint(mode.label)}>
                  <Icon size={17} aria-hidden="true" />
                  {mode.label}
                </button>
              );
            })}
            <button type="button" className="secondary-action" onClick={() => handlePrint("Print Preview")}>
              <Printer size={17} aria-hidden="true" />
              Print
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Animated plate tectonics diagram">
          <AnimatedPlateDiagram />
        </div>
      </section>

      <section className="toc-band">
        <div className="toc-title">
          <BookOpen size={19} />
          Module Table Of Contents
        </div>
        <div className="toc-grid">
          {[
            "1. Basics",
            "2. NCERT Reference",
            "3. Advanced",
            "4. Examiner Trap Zone",
            "5. Current Affairs Bridge",
            "6. Previous Year Questions",
            "7. Practice MCQs",
          ].map((item) => (
            <a href={`#${slugify(item)}`} key={item}>
              {item}
            </a>
          ))}
        </div>
      </section>

      <div className="insight-grid">
        <AnalysisCard title="Coverage Split" icon={<Target size={18} />}>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={coverageSplit} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82}>
                  {coverageSplit.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-grid">
            {coverageSplit.map((item) => (
              <span key={item.name}>
                <i style={{ background: item.color }} />
                {item.name}: {item.value}%
              </span>
            ))}
          </div>
        </AnalysisCard>

        <AnalysisCard title="Trend Change" icon={<TrendingUp size={18} />}>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#E3EDF7" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="direct" stroke={colors.warningBorder} strokeWidth={3} dot />
                <Line type="monotone" dataKey="applied" stroke={colors.accent} strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mini-note">
            Reading direction: direct recall is reducing; applied, statement-based and current-linked
            interpretation is increasing.
          </p>
        </AnalysisCard>

        <AnalysisCard title="Boundary Risk Map" icon={<Layers3 size={18} />}>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={boundaryData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#E3EDF7" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="staticWeight" fill={colors.section} radius={[4, 4, 0, 0]} />
                <Bar dataKey="trapRisk" fill={colors.warningBorder} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mini-note">
            Highest risk: Indian plate chain, convergent margins and transform-fault current affairs.
          </p>
        </AnalysisCard>
      </div>

      <ModuleSection id="1-basics" number="1" title="Basics">
        <ConceptAnchor
          title="Concept Anchor Box"
          points={[
            "Plate tectonics is the master framework that explains the distribution of continents, oceans, mountains, trenches, ridges, earthquakes and volcanoes.",
            "The lithosphere is broken into plates that move slowly over the weaker asthenosphere.",
            "Movement is powered by Earth's internal heat, mantle convection, slab pull and ridge push.",
            "UPSC usually tests this topic through association, sequence, exception and current-event application.",
          ]}
        />
        <div className="topic-grid">
          {moduleMap.map((item, index) => (
            <div className="topic-chip" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </div>
          ))}
        </div>
        <div className="visual-grid">
          <MiniDiagram title="Continental Drift To Plate Tectonics">
            <div className="drift-panel">
              <span className="continent c1">S. America</span>
              <span className="continent c2">Africa</span>
              <span className="flow-label">Fit + fossils + rocks -&gt; drift idea</span>
            </div>
          </MiniDiagram>
          <MiniDiagram title="Sea-Floor Spreading">
            <div className="ridge-panel">
              <span className="stripe s1" />
              <span className="stripe s2" />
              <span className="ridge" />
              <span className="stripe s3" />
              <span className="stripe s4" />
              <span className="ridge-label">New basaltic crust at ridge</span>
            </div>
          </MiniDiagram>
          <MiniDiagram title="Indian Plate Chain">
            <div className="india-panel">
              <span>Gondwana</span>
              <i />
              <span>Northward Drift</span>
              <i />
              <span>Tethys Closure</span>
              <i />
              <span>Himalaya</span>
            </div>
          </MiniDiagram>
        </div>
      </ModuleSection>

      <ModuleSection id="2-ncert-reference" number="2" title="NCERT Reference">
        <div className="reference-table">
          {ncertReferences.map((item) => (
            <article key={`${item.book}-${item.chapter}`}>
              <div className="reference-head">
                <span>{item.className}</span>
                <strong>{item.book}</strong>
              </div>
              <h3>{item.chapter}</h3>
              <p className="page-range">{item.pages}</p>
              <BulletList items={item.use} />
              <div className="strategy-box">
                <strong>Read Strategy:</strong> {item.strategy}
              </div>
            </article>
          ))}
        </div>
        <div className="source-strip">
          <CheckCircle2 size={17} />
          NCERT base locked to official Class XI geography chapter flow: drift theory, evidence,
          sea-floor spreading, plate tectonics and Indian plate movement.
        </div>
      </ModuleSection>

      <ModuleSection id="3-advanced" number="3" title="Advanced">
        <div className="advanced-grid">
          {advancedBlocks.map((block) => (
            <article className="advanced-card" key={block.title}>
              <h3>{block.title}</h3>
              <BulletList items={block.points} />
            </article>
          ))}
        </div>
        <div className="comparison-table">
          <h3>Boundary Comparison Table</h3>
          <table>
            <thead>
              <tr>
                <th>Boundary</th>
                <th>Movement</th>
                <th>Major Output</th>
                <th>UPSC Trap</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Divergent</td>
                <td>Away from each other</td>
                <td>Ridge, rift, new crust</td>
                <td>Do not attach trench to divergence</td>
              </tr>
              <tr>
                <td>Convergent</td>
                <td>Towards each other</td>
                <td>Trench, island arc, volcano, fold mountain</td>
                <td>Sub-type decides output</td>
              </tr>
              <tr>
                <td>Transform</td>
                <td>Sideways sliding</td>
                <td>Strike-slip fault, shallow earthquake</td>
                <td>Crust is conserved</td>
              </tr>
              <tr>
                <td>Hotspot</td>
                <td>Plate over mantle plume</td>
                <td>Volcanic chain, flood basalt</td>
                <td>Can be intra-plate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ModuleSection>

      <ModuleSection id="4-examiner-trap-zone" number="4" title="Examiner Trap Zone">
        <div className="trap-layout">
          <div>
            <h3 className="subhead">Part A: Actual PYQ-Style Traps</h3>
            {actualTrapPatterns.map((item) => (
              <article className="trap-card" key={item.trap}>
                <h4>
                  <ShieldAlert size={15} />
                  {item.trap}
                </h4>
                <p>{item.pattern}</p>
                <div>
                  <strong>Correction:</strong> {item.correction}
                </div>
              </article>
            ))}
          </div>
          <div>
            <h3 className="subhead">Part B: Predicted Trap Zone</h3>
            <div className="predicted-box">
              <BulletList items={predictedTraps} />
            </div>
          </div>
        </div>
      </ModuleSection>

      <ModuleSection id="5-current-affairs-bridge" number="5" title="Current Affairs Bridge">
        <div className="current-grid">
          {currentAffairs.map((item) => (
            <article className="current-card" key={`${item.year}-${item.event}`}>
              <span className="year-pill">{item.year}</span>
              <h3>{item.event}</h3>
              <p>
                <strong>Static concept:</strong> {item.staticConcept}
              </p>
              <p>
                <strong>UPSC angle:</strong> {item.upscAngle}
              </p>
              <p className="source-note">{item.source}</p>
            </article>
          ))}
        </div>
      </ModuleSection>

      <ModuleSection id="6-previous-year-questions" number="6" title="Previous Year Questions">
        <div className="pyq-status">
          <Sparkles size={17} />
          This local demo shows the exact PYQ presentation format: complete question, full options,
          answer, explanation, pattern note and highlighted matching module portion. Before student
          public release, connect this block to your locked UPSC PYQ repository for exact year-wise
          wording.
        </div>
        <div className="pyq-list">
          {pyqLedger.map((item) => (
            <article className="question-card pyq-card" key={item.year}>
              <div className="question-head">
                <span>{item.year}</span>
                <small>{item.status}</small>
              </div>
              <h3>{item.question}</h3>
              <ol className="option-list">
                {item.options.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ol>
              <div className="answer-box">
                <strong>Answer:</strong> {item.answer}
              </div>
              <p>
                <strong>Explanation:</strong> {item.explanation}
              </p>
              <p>
                <strong>Matching covered portion:</strong> {item.match}
              </p>
              <p className="pattern-note">
                <strong>Pattern note:</strong> {item.pattern}
              </p>
            </article>
          ))}
        </div>
      </ModuleSection>

      <ModuleSection id="7-practice-mcqs" number="7" title="Practice MCQs">
        <div className="practice-grid">
          {practiceMcqs.map((item, index) => (
            <article className="question-card" key={`${item.type}-${item.question}`}>
              <div className="question-head">
                <span>
                  Q{index + 1}. {item.type}
                </span>
              </div>
              <h3>{item.question}</h3>
              <ol className="option-list">
                {item.options.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ol>
              <details>
                <summary>Answer And Explanation</summary>
                <div className="answer-box">
                  <strong>Answer:</strong> {item.answer}
                </div>
                <p>{item.explanation}</p>
              </details>
            </article>
          ))}
        </div>
      </ModuleSection>

      <section className="source-band">
        <h2>Source And Build Notes</h2>
        <p>
          Static base: NCERT Class XI Fundamentals of Physical Geography, Chapter 4. Current affairs:
          USGS event pages for 2023 Pazarcik, 2024 Noto, 2025 Mandalay/Sagaing and 2025 Kamchatka.
          The page is local and public inside the app route; it does not depend on student login.
        </p>
      </section>
    </main>
  );
}

function ModuleSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="module-section" id={id}>
      <header className="section-title">
        <span>{number}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function AnalysisCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="analysis-card">
      <h2>
        {icon}
        {title}
      </h2>
      {children}
    </article>
  );
}

function ConceptAnchor({ title, points }: { title: string; points: string[] }) {
  return (
    <article className="concept-anchor">
      <h3>{title}</h3>
      <BulletList items={points} />
    </article>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Mark({ children }: { children: ReactNode }) {
  return <span className="concept-match">{children}</span>;
}

function MiniDiagram({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mini-diagram">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function AnimatedPlateDiagram() {
  return (
    <div className="plate-stage">
      <div className="plate ocean-left">
        <span>Oceanic Plate</span>
      </div>
      <div className="plate continental-right">
        <span>Cont. Plate</span>
      </div>
      <div className="mantle-flow flow-a" />
      <div className="mantle-flow flow-b" />
      <div className="magma-column" />
      <div className="ridge-core" />
      <div className="mountain-chain">
        <i />
        <i />
        <i />
      </div>
      <div className="subduction-slab" />
      <span className="label l1">Divergence</span>
      <span className="label l2">Convergence</span>
      <span className="label l3">Mantle convection</span>
    </div>
  );
}

function slugify(item: string) {
  return item.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const moduleCss = `
  .plate-module {
    min-height: 100vh;
    background: ${colors.white};
    color: ${colors.text};
    font-family: var(--font-sans), Arial, sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }

  .hero-band {
    min-height: 86vh;
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(340px, 0.98fr);
    gap: 28px;
    align-items: center;
    padding: 42px clamp(18px, 5vw, 72px) 28px;
    background:
      linear-gradient(135deg, rgba(234, 246, 255, 0.96), rgba(232, 248, 240, 0.92)),
      repeating-linear-gradient(90deg, rgba(30, 58, 95, 0.08) 0 1px, transparent 1px 64px);
    border-bottom: 1px solid ${colors.line};
  }

  .hero-copy h1 {
    margin: 26px 0 12px;
    color: ${colors.primary};
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .v1-version-nav {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 22px;
  }

  .v1-version-nav a {
    border: 1px solid ${colors.line};
    background: ${colors.white};
    color: ${colors.primary};
    border-radius: 8px;
    padding: 8px 10px;
    text-decoration: none;
    font-weight: 850;
    font-size: 12px;
  }

  .v1-version-nav .active {
    background: ${colors.primary};
    color: ${colors.white};
    border-color: ${colors.primary};
  }

  .hero-subtitle {
    max-width: 760px;
    margin: 0;
    color: ${colors.slate};
    font-size: 14px;
  }

  .brand-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    background: ${colors.primary};
    color: white;
    border-radius: 8px;
    font-weight: 800;
  }

  .brand-name {
    margin: 0;
    color: ${colors.primary};
    font-weight: 800;
    letter-spacing: 0;
  }

  .brand-tag {
    margin: 1px 0 0;
    color: ${colors.section};
    font-size: 12px;
    font-weight: 700;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }

  .hero-actions button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid ${colors.primary};
    background: ${colors.primary};
    color: white;
    border-radius: 8px;
    padding: 10px 13px;
    font-weight: 750;
    cursor: pointer;
  }

  .hero-actions button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(27, 42, 74, 0.16);
  }

  .hero-actions .secondary-action {
    background: white;
    color: ${colors.primary};
  }

  .hero-visual {
    min-height: 390px;
    display: grid;
    place-items: center;
  }

  .plate-stage {
    width: min(520px, 100%);
    aspect-ratio: 1.24;
    position: relative;
    overflow: hidden;
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background:
      linear-gradient(180deg, #EAF6FF 0 32%, #F5E2C1 32% 41%, #E5B77A 41% 58%, #C87643 58% 100%);
    box-shadow: 0 22px 60px rgba(27, 42, 74, 0.14);
  }

  .plate-stage:before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 32% 62%, rgba(255,255,255,0.28), transparent 22%),
      radial-gradient(circle at 72% 70%, rgba(255,255,255,0.18), transparent 20%);
    pointer-events: none;
  }

  .plate {
    position: absolute;
    top: 28%;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.primary};
    font-weight: 800;
    font-size: 12px;
    border-top: 4px solid rgba(30, 58, 95, 0.32);
  }

  .plate span {
    position: relative;
    z-index: 5;
    max-width: 92%;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.42);
    padding: 4px 8px;
    white-space: nowrap;
  }

  .ocean-left {
    left: -2%;
    width: 49%;
    background: linear-gradient(180deg, #8FC7E8, #4D9AC9);
    animation: plateLeft 5s ease-in-out infinite;
  }

  .continental-right {
    right: -2%;
    width: 51%;
    background: linear-gradient(180deg, #A8D8A8, #71B36A);
    animation: plateRight 5s ease-in-out infinite;
  }

  .continental-right span {
    position: absolute;
    right: 8px;
    bottom: 6px;
  }

  .magma-column {
    position: absolute;
    left: 47%;
    top: 32%;
    width: 40px;
    height: 48%;
    background: linear-gradient(180deg, rgba(243, 156, 18, 0.82), rgba(236, 91, 48, 0.6));
    clip-path: polygon(45% 0, 58% 0, 100% 100%, 0 100%);
    animation: magmaPulse 2.4s ease-in-out infinite;
  }

  .ridge-core {
    position: absolute;
    left: 49%;
    top: 27%;
    width: 18px;
    height: 72px;
    background: #F39C12;
    border-radius: 999px;
    box-shadow: 0 0 20px rgba(243, 156, 18, 0.38);
  }

  .subduction-slab {
    position: absolute;
    right: 25%;
    top: 39%;
    width: 170px;
    height: 28px;
    background: #4D9AC9;
    transform: rotate(28deg);
    transform-origin: left center;
    border-radius: 0 0 8px 8px;
    opacity: 0.9;
    z-index: 3;
  }

  .mountain-chain {
    position: absolute;
    right: 14%;
    top: 21%;
    display: flex;
    align-items: flex-end;
    gap: 0;
    z-index: 4;
  }

  .mountain-chain i {
    display: block;
    width: 58px;
    height: 64px;
    background: linear-gradient(135deg, #8DA45F, #536B38);
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
    margin-left: -18px;
  }

  .mantle-flow {
    position: absolute;
    bottom: 12%;
    width: 180px;
    height: 64px;
    border: 4px solid rgba(255, 255, 255, 0.55);
    border-top-color: transparent;
    border-radius: 0 0 999px 999px;
  }

  .flow-a {
    left: 17%;
    animation: flowMove 5s linear infinite;
  }

  .flow-b {
    right: 15%;
    transform: scaleX(-1);
    animation: flowMove 5s linear infinite reverse;
  }

  .label {
    position: absolute;
    background: rgba(255,255,255,0.88);
    border: 1px solid ${colors.line};
    color: ${colors.primary};
    border-radius: 999px;
    padding: 6px 9px;
    font-weight: 800;
    font-size: 11px;
  }

  .l1 { left: 38%; top: 16%; }
  .l2 { right: 12%; top: 13%; }
  .l3 { left: 31%; bottom: 10%; }

  @keyframes plateLeft {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-8px); }
  }

  @keyframes plateRight {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(8px); }
  }

  @keyframes magmaPulse {
    0%, 100% { opacity: 0.7; transform: translateY(6px) scaleY(0.96); }
    50% { opacity: 1; transform: translateY(-3px) scaleY(1.03); }
  }

  @keyframes flowMove {
    0% { opacity: 0.4; transform: translateY(4px); }
    50% { opacity: 0.95; transform: translateY(-4px); }
    100% { opacity: 0.4; transform: translateY(4px); }
  }

  .toc-band,
  .source-band {
    max-width: 1180px;
    margin: 22px auto 0;
    padding: 18px;
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: ${colors.pale};
  }

  .toc-title {
    display: flex;
    align-items: center;
    gap: 9px;
    color: ${colors.primary};
    font-weight: 800;
    margin-bottom: 12px;
  }

  .toc-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .toc-grid a {
    display: block;
    min-height: 50px;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid ${colors.line};
    background: white;
    color: ${colors.section};
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  .insight-grid {
    max-width: 1180px;
    margin: 22px auto 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .analysis-card,
  .module-section {
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: white;
    box-shadow: 0 10px 28px rgba(27, 42, 74, 0.07);
  }

  .analysis-card {
    padding: 16px;
  }

  .analysis-card h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    color: ${colors.section};
    font-size: 16px;
    font-weight: 800;
  }

  .chart-box {
    height: 220px;
  }

  .legend-grid {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }

  .legend-grid span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: ${colors.slate};
    font-size: 12px;
  }

  .legend-grid i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  .mini-note {
    margin: 8px 0 0;
    color: ${colors.slate};
    font-size: 12px;
  }

  .module-section {
    max-width: 1180px;
    margin: 22px auto 0;
    overflow: hidden;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${colors.section};
    color: white;
    padding: 12px 16px;
  }

  .section-title span {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(255,255,255,0.45);
    border-radius: 7px;
    font-weight: 800;
  }

  .section-title h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .concept-anchor,
  .pyq-status,
  .source-strip,
  .strategy-box {
    background: ${colors.light};
    border: 1px solid #CFE7FB;
    border-left: 5px solid ${colors.section};
    margin: 16px;
    padding: 14px;
    border-radius: 8px;
  }

  .concept-anchor h3,
  .advanced-card h3,
  .mini-diagram h3,
  .comparison-table h3,
  .source-band h2,
  .current-card h3,
  .question-card h3,
  .reference-table h3,
  .subhead {
    color: ${colors.section};
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0;
    margin: 0 0 9px;
  }

  .bullet-list {
    margin: 0;
    padding-left: 18px;
  }

  .bullet-list li {
    margin: 6px 0;
  }

  .topic-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding: 0 16px 16px;
  }

  .topic-chip {
    min-height: 82px;
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: ${colors.pale};
    padding: 11px;
    color: ${colors.text};
  }

  .topic-chip span {
    display: block;
    color: ${colors.accent};
    font-weight: 900;
    margin-bottom: 5px;
  }

  .visual-grid,
  .advanced-grid,
  .current-grid,
  .practice-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    padding: 0 16px 16px;
  }

  .mini-diagram,
  .advanced-card,
  .current-card,
  .question-card,
  .reference-table article {
    border: 1px solid ${colors.line};
    border-radius: 8px;
    background: white;
    padding: 14px;
  }

  .drift-panel,
  .ridge-panel,
  .india-panel {
    min-height: 150px;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background: ${colors.light};
    border: 1px dashed #B7D7F0;
  }

  .continent {
    position: absolute;
    display: grid;
    place-items: center;
    background: #8DCB84;
    color: ${colors.primary};
    font-weight: 800;
    font-size: 11px;
  }

  .c1 {
    left: 18%;
    top: 26%;
    width: 92px;
    height: 82px;
    clip-path: polygon(36% 0, 72% 8%, 84% 38%, 62% 59%, 70% 100%, 34% 88%, 12% 54%, 18% 18%);
  }

  .c2 {
    right: 18%;
    top: 25%;
    width: 98px;
    height: 86px;
    clip-path: polygon(29% 4%, 68% 0, 86% 29%, 74% 54%, 91% 90%, 47% 100%, 25% 73%, 11% 40%);
  }

  .flow-label,
  .ridge-label {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    color: ${colors.section};
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  .ridge-panel {
    display: grid;
    grid-template-columns: 1fr 1fr 18px 1fr 1fr;
    align-items: stretch;
  }

  .stripe {
    display: block;
    opacity: 0.85;
  }

  .s1, .s4 { background: #6EB4D8; }
  .s2, .s3 { background: #A8D8A8; }
  .ridge { background: ${colors.warningBorder}; box-shadow: 0 0 18px rgba(243, 156, 18, 0.45); }

  .india-panel {
    display: grid;
    grid-template-columns: 1fr 16px 1fr 16px 1fr 16px 1fr;
    align-items: center;
    padding: 14px;
  }

  .india-panel span {
    display: grid;
    place-items: center;
    min-height: 58px;
    text-align: center;
    background: white;
    border: 1px solid ${colors.line};
    border-radius: 8px;
    color: ${colors.section};
    font-size: 11px;
    font-weight: 800;
  }

  .india-panel i {
    height: 2px;
    background: ${colors.accent};
  }

  .reference-table {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 16px;
  }

  .reference-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    color: ${colors.slate};
    font-size: 12px;
  }

  .page-range,
  .source-note,
  .pattern-note {
    color: ${colors.slate};
    font-size: 12px;
    margin: 6px 0 10px;
  }

  .source-strip,
  .pyq-status {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    color: ${colors.section};
    font-weight: 750;
  }

  .advanced-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: 16px;
  }

  .advanced-card {
    background: ${colors.pale};
  }

  .comparison-table {
    margin: 0 16px 16px;
    border: 1px solid ${colors.line};
    border-radius: 8px;
    overflow: hidden;
  }

  .comparison-table h3 {
    padding: 13px 14px;
    background: ${colors.light};
    margin: 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    border-top: 1px solid ${colors.line};
    padding: 10px;
    vertical-align: top;
  }

  th {
    color: ${colors.section};
    background: ${colors.pale};
    font-size: 12px;
  }

  .trap-layout {
    display: grid;
    grid-template-columns: 1.12fr 0.88fr;
    gap: 16px;
    padding: 16px;
  }

  .trap-card,
  .predicted-box {
    background: ${colors.warning};
    border: 1px solid #F8DB91;
    border-left: 5px solid ${colors.warningBorder};
    border-radius: 8px;
    padding: 13px;
    margin-bottom: 10px;
  }

  .trap-card h4 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 8px;
    color: ${colors.primary};
    font-size: 13px;
  }

  .trap-card p {
    margin: 0 0 8px;
  }

  .current-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding-top: 16px;
  }

  .current-card {
    background: ${colors.current};
    border-left: 5px solid ${colors.accent};
  }

  .year-pill {
    display: inline-flex;
    margin-bottom: 10px;
    padding: 4px 8px;
    background: white;
    border: 1px solid #BFECD0;
    border-radius: 999px;
    color: ${colors.section};
    font-weight: 900;
    font-size: 11px;
  }

  .pyq-list {
    display: grid;
    gap: 14px;
    padding: 0 16px 16px;
  }

  .question-card {
    background: ${colors.pyq};
    border-left: 5px solid ${colors.section};
  }

  .practice-grid {
    padding-top: 16px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .question-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .question-head span {
    color: ${colors.primary};
    font-weight: 900;
  }

  .question-head small {
    max-width: 58%;
    color: ${colors.slate};
    font-size: 11px;
    text-align: right;
  }

  .option-list {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  .option-list li {
    margin: 5px 0;
  }

  .answer-box {
    background: ${colors.softGreen};
    border: 1px solid #B9EACB;
    border-radius: 8px;
    padding: 9px 10px;
    margin: 8px 0;
    color: ${colors.primary};
  }

  details {
    margin-top: 10px;
  }

  summary {
    cursor: pointer;
    color: ${colors.section};
    font-weight: 800;
  }

  .concept-match {
    background: ${colors.softGreen};
    color: ${colors.primary};
    border-bottom: 2px solid ${colors.accent};
    padding: 0 3px;
    border-radius: 4px;
    font-weight: 850;
  }

  .source-band {
    margin-bottom: 28px;
  }

  .source-band h2 {
    margin-bottom: 8px;
  }

  .source-band p {
    margin: 0;
    color: ${colors.slate};
  }

  .print-fixed-header,
  .print-fixed-footer {
    display: none;
  }

  @media (max-width: 1100px) {
    .hero-band,
    .insight-grid,
    .toc-grid,
    .topic-grid,
    .visual-grid,
    .current-grid,
    .practice-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .toc-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .hero-band {
      min-height: auto;
    }
  }

  @media (max-width: 760px) {
    .hero-band,
    .insight-grid,
    .toc-grid,
    .topic-grid,
    .visual-grid,
    .advanced-grid,
    .reference-table,
    .trap-layout,
    .current-grid,
    .practice-grid {
      grid-template-columns: 1fr;
    }
    .hero-band {
      padding: 26px 14px;
    }
    .hero-visual {
      min-height: 280px;
    }
    .toc-band,
    .source-band,
    .module-section,
    .insight-grid {
      width: calc(100% - 24px);
    }
    .question-head {
      display: block;
    }
    .question-head small {
      display: block;
      max-width: none;
      text-align: left;
      margin-top: 4px;
    }
  }

  @media print {
    @page {
      size: A4;
      margin: 14mm 10mm;
    }
    html,
    body {
      background: white !important;
    }
    .screen-actions {
      display: none !important;
    }
    .v1-version-nav {
      display: none;
    }
    .plate-module {
      padding: 28px 0 24px;
      background: white;
      font-size: 11.5px;
    }
    .hero-band {
      min-height: auto;
      padding: 10px 0 12px;
      grid-template-columns: 1fr;
      border-bottom: 1px solid ${colors.line};
      background: white;
    }
    .hero-visual {
      min-height: 220px;
    }
    .plate-stage {
      max-width: 420px;
    }
    .toc-band,
    .source-band,
    .insight-grid,
    .module-section {
      max-width: none;
      width: 100%;
      margin: 10px 0 0;
      box-shadow: none;
    }
    .insight-grid,
    .topic-grid,
    .visual-grid,
    .advanced-grid,
    .reference-table,
    .current-grid,
    .practice-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .toc-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .module-section,
    .analysis-card,
    .question-card,
    .advanced-card,
    .current-card,
    .reference-table article,
    .mini-diagram,
    .trap-card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .print-fixed-header,
    .print-fixed-footer {
      display: block;
      position: fixed;
      left: 0;
      right: 0;
      z-index: 1000;
      background: white;
      color: ${colors.primary};
      font-size: 9.5px;
      font-weight: 800;
      padding: 5px 10mm;
    }
    .print-fixed-header {
      top: 0;
      border-bottom: 1px solid ${colors.line};
    }
    .print-fixed-footer {
      bottom: 0;
      border-top: 1px solid ${colors.line};
    }
  }
`;

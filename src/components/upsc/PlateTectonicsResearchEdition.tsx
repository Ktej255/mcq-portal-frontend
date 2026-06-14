"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Layers3,
  Map,
  Microscope,
  Mountain,
  Route,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const theme = {
  primary: "#17324D",
  blue: "#1E5D83",
  green: "#1F9D66",
  mint: "#E8F8F0",
  sky: "#EAF6FF",
  amber: "#FFF3CD",
  orange: "#F39C12",
  ink: "#18212F",
  slate: "#526174",
  line: "#D7E4EF",
  white: "#FFFFFF",
  page: "#F7FBFD",
  violet: "#6750A4",
  red: "#B54708",
};

const masteryStack = [
  { label: "Lithosphere", note: "Rigid plate shell", weight: 16 },
  { label: "Asthenosphere", note: "Weak flow layer", weight: 12 },
  { label: "Motion Drivers", note: "Slab pull, ridge push, convection", weight: 18 },
  { label: "Boundaries", note: "Divergent, convergent, transform", weight: 22 },
  { label: "Evidence", note: "Fossils, rocks, paleomagnetism, age bands", weight: 14 },
  { label: "India Link", note: "Tethys, Deccan, Himalaya, seismicity", weight: 18 },
];

const trendData = [
  { year: "Old style", recall: 70, applied: 30 },
  { year: "Mixed", recall: 52, applied: 48 },
  { year: "Recent", recall: 34, applied: 66 },
  { year: "2027 Prep", recall: 24, applied: 76 },
];

const boundaryWeights = [
  { name: "Convergent", value: 31, color: theme.blue },
  { name: "India Chain", value: 24, color: theme.green },
  { name: "Transform", value: 17, color: theme.orange },
  { name: "Divergent", value: 15, color: "#4AA3DF" },
  { name: "Hotspot", value: 13, color: theme.violet },
];

const kernelCards = [
  {
    title: "One-Line Definition",
    body: "Plate tectonics explains how rigid lithospheric plates move over the asthenosphere and produce large-scale landforms and hazards.",
  },
  {
    title: "UPSC Mental Model",
    body: "Never memorize a boundary alone. Always attach movement, crust outcome, landform, hazard, India example and current event.",
  },
  {
    title: "Core Question",
    body: "Is crust being created, consumed, conserved, or thermally pierced by a hotspot?",
  },
  {
    title: "India Hook",
    body: "India's story is Gondwana separation -> northward drift -> Deccan volcanism -> Tethys closure -> Himalaya uplift.",
  },
];

const theoryTimeline = [
  {
    title: "Wegener",
    time: "1912",
    idea: "Continental drift",
    use: "Explains why continents appear to fit and why fossils/rocks match across oceans.",
    limit: "Could not fully explain the driving force.",
  },
  {
    title: "Holmes",
    time: "1920s-30s",
    idea: "Mantle convection",
    use: "Provided a possible internal heat engine for movement.",
    limit: "Needed ocean-floor evidence to become decisive.",
  },
  {
    title: "Hess",
    time: "1960s",
    idea: "Sea-floor spreading",
    use: "New oceanic crust forms at ridges and moves away symmetrically.",
    limit: "Became powerful when joined with paleomagnetism.",
  },
  {
    title: "Plate Tectonics",
    time: "1960s onward",
    idea: "Integrated plate theory",
    use: "Explains ridges, trenches, arcs, earthquakes, volcanoes and mountain building.",
    limit: "UPSC tests exceptions and regional application.",
  },
];

const evidenceBlocks = [
  {
    title: "Continental Fit",
    items: [
      "Best fit is along continental shelves, not today's coastlines.",
      "South America and Africa are the classic mental image.",
      "Trap: coastlines change; shelves preserve a better geologic fit.",
    ],
  },
  {
    title: "Fossil Continuity",
    items: [
      "Glossopteris connects Gondwana landmasses.",
      "Mesosaurus supports a South America-Africa link.",
      "Trap: fossil evidence supports past connection, not modern migration across oceans.",
    ],
  },
  {
    title: "Rock And Glacial Clues",
    items: [
      "Matching rock sequences across separated continents strengthen the drift argument.",
      "Tillite deposits record ancient glaciation across Gondwana fragments.",
      "Trap: coal in Antarctica means past climate/latitude was different, not that coal forms in polar ice.",
    ],
  },
  {
    title: "Ocean-Floor Proof",
    items: [
      "Youngest oceanic crust lies near mid-ocean ridges.",
      "Symmetric magnetic stripes preserve reversal history.",
      "Trap: magnetic stripes prove spreading; they are not Wegener's original evidence.",
    ],
  },
];

const boundaryStudio = [
  {
    title: "Divergent Boundary",
    movement: "Plates move apart",
    crust: "New crust is created",
    landforms: "Mid-ocean ridge, rift valley, new ocean floor",
    examples: "Mid-Atlantic Ridge, East African Rift",
    hazards: "Shallow earthquakes, fissure volcanism, basaltic outpouring",
    trap: "Do not attach deep trench or subduction to divergence.",
  },
  {
    title: "Oceanic-Oceanic Convergence",
    movement: "Dense oceanic plate subducts beneath another oceanic plate",
    crust: "Old crust is consumed",
    landforms: "Trench, island arc, volcanic chain",
    examples: "Japan arc, Mariana trench system",
    hazards: "Strong earthquakes, tsunami, explosive volcanism",
    trap: "Island arc is not the same as mid-ocean ridge.",
  },
  {
    title: "Oceanic-Continental Convergence",
    movement: "Oceanic plate subducts beneath continental plate",
    crust: "Oceanic crust is consumed",
    landforms: "Trench, continental volcanic arc, fold-thrust belt",
    examples: "Andes-type margin",
    hazards: "Megathrust earthquake, tsunami, stratovolcano",
    trap: "Continental crust usually does not subduct easily because it is buoyant.",
  },
  {
    title: "Continental-Continental Convergence",
    movement: "Two buoyant continents collide",
    crust: "Crust thickens and shortens",
    landforms: "Fold mountain, plateau, deep crustal root",
    examples: "Himalaya-Tibet system",
    hazards: "Large earthquakes, landslides, river disruption",
    trap: "Volcanic arc is not the dominant output after full continental collision.",
  },
  {
    title: "Transform Boundary",
    movement: "Plates slide laterally past each other",
    crust: "Crust is conserved",
    landforms: "Strike-slip fault, offset river/road, linear valley",
    examples: "San Andreas Fault, Sagaing Fault",
    hazards: "Shallow, damaging earthquakes",
    trap: "Transform does not create new sea floor.",
  },
  {
    title: "Hotspot / Mantle Plume",
    movement: "Plate moves over a relatively fixed thermal anomaly",
    crust: "Crust is thermally pierced, not boundary-controlled",
    landforms: "Volcanic chain, flood basalt province",
    examples: "Hawaii, Deccan Traps-Reunion hotspot theory",
    hazards: "Volcanism, lava flows, climate-forcing eruptions in deep time",
    trap: "A hotspot can be intra-plate; it is not always at a plate boundary.",
  },
];

const indiaSequence = [
  {
    stage: "1. Gondwana Base",
    detail: "India was once connected with Africa, Antarctica, Australia and South America.",
    examUse: "Use this to explain fossil, rock and glacial continuity.",
  },
  {
    stage: "2. Rifting And Drift",
    detail: "India separated and moved northward at a geologically rapid pace.",
    examUse: "Connect with Indian Ocean opening and changing latitude/climate.",
  },
  {
    stage: "3. Deccan Volcanism",
    detail: "One theory links Deccan flood basalts with the Indian plate passing over the Reunion hotspot.",
    examUse: "Use as the hotspot exception inside the India story.",
  },
  {
    stage: "4. Tethys Closure",
    detail: "The Tethys Sea between India and Eurasia narrowed as India approached Eurasia.",
    examUse: "Marine sediments of Tethys become central to Himalaya formation.",
  },
  {
    stage: "5. Collision And Himalaya",
    detail: "Continental collision compressed, folded and uplifted sediments into the Himalaya-Tibet system.",
    examUse: "Young fold mountains, seismicity, landslides, river systems and monsoon barriers.",
  },
];

const currentAffairsLab = [
  {
    event: "2023 Turkey-Syria / Pazarcik earthquake",
    sourceFact: "USGS lists M 7.8 for the Pazarcik earthquake sequence.",
    concept: "Strike-slip and shallow fault rupture can create severe damage.",
    upscUse: "Transform-style boundary questions: crust conserved, earthquake risk high.",
  },
  {
    event: "2024 Noto Peninsula, Japan earthquake",
    sourceFact: "USGS lists M 7.5 and a tsunami flag for the Noto event.",
    concept: "Convergent margin regions may combine reverse faulting, uplift and tsunami risk.",
    upscUse: "Avoid one-word Japan = volcano logic; test subduction, back-arc and coastal hazard.",
  },
  {
    event: "2025 Mandalay/Sagaing, Myanmar earthquake",
    sourceFact: "USGS lists M 7.7, shallow depth around 10 km and red alert.",
    concept: "Large strike-slip earthquakes can occur along major continental fault systems.",
    upscUse: "Compare Sagaing Fault with San Andreas for transform-style mechanics.",
  },
  {
    event: "2025 Kamchatka Peninsula earthquake",
    sourceFact: "USGS lists M 8.8 and a tsunami flag for the Kamchatka event.",
    concept: "Fast subduction zones can host megathrust earthquakes and tsunami generation.",
    upscUse: "Separate oceanic subduction from India-Eurasia continental collision.",
  },
];

const trapBank = [
  "Wegener proposed plate tectonics. False: he proposed continental drift.",
  "Sea-floor spreading was part of Wegener's original evidence. False: it came later.",
  "All volcanoes are on plate boundaries. False: hotspots can be intra-plate.",
  "Transform boundaries create new crust. False: they conserve crust.",
  "Divergent boundaries always occur in oceans. False: continental rifts also exist.",
  "Oceanic trenches form at divergent boundaries. False: trenches are subduction-linked.",
  "Himalaya formation is due to oceanic plate subduction under India. False: dominant story is continental collision after Tethys closure.",
  "Tethys Sea evaporated to form Himalaya. False: sediments were compressed and uplifted.",
  "Coal in Antarctica means coal forms in polar climate. False: it indicates past latitude/climate change.",
  "Pangaea broke directly into today's continents. False: large blocks like Laurasia and Gondwana came first.",
  "Continental crust is denser than oceanic crust. False: oceanic crust is generally denser.",
  "Oldest ocean crust is at ridge. False: youngest crust is at ridge.",
  "Earthquake magnitude and intensity are the same. False: magnitude is energy; intensity is observed effect.",
  "Tsunami needs only high magnitude. Incomplete: seafloor displacement, depth and faulting style matter.",
  "Hotspot chain age is random. False: age progression can show plate motion direction.",
  "Every convergent margin creates Himalaya-type mountains. False: sub-type decides output.",
];

const pyqPatterns = [
  {
    title: "Evolution Link Pattern",
    prompt: "Which phenomena might influence evolution: continental drift, glacial cycles?",
    solution: "Both can alter habitats, isolation and migration routes.",
    studyMove: "Connect plate tectonics with environment, biodiversity and climate history.",
  },
  {
    title: "Association Pattern",
    prompt: "Match boundary with feature: ridge, trench, strike-slip fault, island arc.",
    solution: "Solve by crust outcome: created, consumed or conserved.",
    studyMove: "Use boundary decision tree before selecting options.",
  },
  {
    title: "India Chain Pattern",
    prompt: "Statements on India drift, Tethys Sea and Himalaya sediment uplift.",
    solution: "Treat them as one chronological chain, not three separate facts.",
    studyMove: "Use Gondwana -> drift -> Tethys -> collision -> Himalaya.",
  },
  {
    title: "Current Bridge Pattern",
    prompt: "A recent earthquake near Japan, Myanmar or Kamchatka appears in the stem.",
    solution: "Map the event to fault type and boundary setting.",
    studyMove: "Do not memorize event names; extract the tectonic mechanism.",
  },
];

const mcqs = [
  {
    q: "Which evidence is most directly connected with sea-floor spreading rather than Wegener's original continental drift evidence?",
    o: ["Glossopteris fossils", "Mesosaurus fossils", "Symmetric magnetic reversal stripes", "Jigsaw fit of South America and Africa"],
    a: "Symmetric magnetic reversal stripes",
    e: "Magnetic stripes on either side of mid-ocean ridges support sea-floor spreading.",
  },
  {
    q: "How many are usually associated with oceanic-oceanic convergence: trench, island arc, mid-ocean ridge, subduction?",
    o: ["Only one", "Only two", "Only three", "All four"],
    a: "Only three",
    e: "Trench, island arc and subduction fit. Mid-ocean ridge is divergent.",
  },
  {
    q: "A plate boundary has shallow earthquakes, lateral displacement and no creation/destruction of crust. It is most likely:",
    o: ["Divergent", "Transform", "Oceanic-continental convergent", "Hotspot"],
    a: "Transform",
    e: "Lateral sliding and conserved crust are transform-boundary markers.",
  },
  {
    q: "Which pair is correctly matched?",
    o: ["Harry Hess - Continental drift", "Arthur Holmes - Convection currents", "Wegener - Sea-floor spreading", "Tuzo Wilson - Glossopteris fossil"],
    a: "Arthur Holmes - Convection currents",
    e: "Holmes is associated with mantle convection as a movement mechanism.",
  },
  {
    q: "The Tethys Sea is most important for understanding:",
    o: ["Formation of Hawaiian Islands", "Origin of Himalaya sediments", "Age of Atlantic ocean floor", "San Andreas Fault movement"],
    a: "Origin of Himalaya sediments",
    e: "Tethyan marine sediments were compressed and uplifted during India-Eurasia collision.",
  },
  {
    q: "Which statement is incorrect?",
    o: ["Young oceanic crust occurs near ridges", "Oceanic crust is generally denser than continental crust", "Continental collision usually produces a mid-ocean ridge", "Subduction may generate trenches"],
    a: "Continental collision usually produces a mid-ocean ridge",
    e: "Continental collision produces fold mountains and crustal thickening, not ridges.",
  },
  {
    q: "Hawaiian Islands are best used as an example of:",
    o: ["Continental collision", "Intra-plate hotspot volcanism", "Transform boundary faulting", "Tethys sediment uplift"],
    a: "Intra-plate hotspot volcanism",
    e: "The Pacific plate moves over a hotspot, producing age-progressive islands.",
  },
  {
    q: "Which sequence is most logical for India's plate story?",
    o: [
      "Tethys closure -> Gondwana separation -> Deccan volcanism -> Himalaya",
      "Gondwana separation -> northward drift -> Deccan volcanism -> Tethys closure -> Himalaya",
      "Himalaya -> Tethys closure -> Gondwana separation -> Deccan volcanism",
      "Deccan volcanism -> Himalaya -> Gondwana separation -> Tethys closure",
    ],
    a: "Gondwana separation -> northward drift -> Deccan volcanism -> Tethys closure -> Himalaya",
    e: "This is the best simplified chronology for prelims use.",
  },
];

const sources = [
  {
    label: "NCERT Class XI Fundamentals of Physical Geography, Chapter 4",
    href: "https://ncert.nic.in/textbook/pdf/kegy204.pdf",
  },
  {
    label: "USGS This Dynamic Earth",
    href: "https://pubs.usgs.gov/gip/dynamic/dynamic.html",
  },
  {
    label: "USGS Pazarcik 2023 Event",
    href: "https://earthquake.usgs.gov/earthquakes/eventpage/us6000jllz",
  },
  {
    label: "USGS Noto 2024 Event",
    href: "https://earthquake.usgs.gov/earthquakes/eventpage/us6000m0xl",
  },
  {
    label: "USGS Mandalay/Sagaing 2025 Event",
    href: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000pn9s",
  },
  {
    label: "USGS Kamchatka 2025 Event",
    href: "https://earthquake.usgs.gov/earthquakes/eventpage/us6000qw60",
  },
];

export function PlateTectonicsResearchEdition() {
  function printPdf() {
    window.print();
  }

  return (
    <main className="pt-v2">
      <style>{css}</style>
      <div className="print-head">SARIT CLASSES | Plate Tectonics Research Edition V2</div>
      <div className="print-foot">Single-source UPSC topic module | Version 2</div>

      <section className="v2-hero">
        <div className="hero-text">
          <VersionNav />
          <p className="eyebrow">Version 2 | Research Edition | Built beyond the master prompt</p>
          <h1>Plate Tectonics: Single Source UPSC Module</h1>
          <p className="lead">
            This edition treats Plate Tectonics as an answer engine: concept clarity, evidence, boundary
            logic, India-first application, current-affairs translation, traps and MCQ readiness in one place.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={printPdf}>
              <Download size={17} />
              Download / Print PDF
            </button>
            <a href="#decision-tree">
              <Route size={17} />
              Boundary Decision Tree
            </a>
            <a href="#mcq-lab">
              <Target size={17} />
              MCQ Lab
            </a>
          </div>
        </div>
        <div className="hero-image-wrap">
          <img src="/upsc-assets/plate-tectonics-v2-hero.png" alt="Scientific cross-section of plate tectonics" />
          <span className="pin ridge">Ridge</span>
          <span className="pin trench">Trench</span>
          <span className="pin slab">Subduction</span>
          <span className="pin mantle">Mantle Flow</span>
        </div>
      </section>

      <section className="top-strip">
        <Metric title="Single Topic Goal" value="One-stop" text="Teach once, revise many times, convert into prelims statements." />
        <Metric title="Core UPSC Shift" value="Applied" text="From fact recall to mechanism, exception and current-link testing." />
        <Metric title="India Weight" value="High" text="Tethys, Himalaya, Deccan and seismicity are answer multipliers." />
        <Metric title="Student Output" value="MCQ-ready" text="Every concept ends as a trap, association or scenario question." />
      </section>

      <section className="section" id="trend-map">
        <SectionTitle icon={<TrendingUp size={20} />} title="1. UPSC Trend Map" kicker="How this topic is changing" />
        <div className="two-col">
          <div className="panel">
            <h3>My 2027 Reading Of The Trend</h3>
            <Bullet
              items={[
                "UPSC is less likely to ask only 'who proposed what'; it is more likely to ask statement combinations.",
                "The safer preparation method is mechanism-first: movement -> process -> landform -> hazard -> exception.",
                "Current affairs will not ask only event names; it will ask the static tectonic logic hidden behind the event.",
                "India-specific conversion is crucial: Tethys-Himalaya-Deccan-seismicity turns a global chapter into GS Paper 1 value.",
                "The highest scoring student will detect wrong associations quickly: ridge vs trench, hotspot vs boundary, drift vs spreading.",
              ]}
            />
          </div>
          <div className="chart-panel">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#D7E4EF" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="recall" fill={theme.orange} radius={[5, 5, 0, 0]} />
                <Bar dataKey="applied" fill={theme.green} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p>Read the chart as preparation strategy, not official marks distribution.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<Brain size={20} />} title="2. Concept Kernel" kicker="The minimum model a student must own" />
        <div className="kernel-grid">
          {kernelCards.map((card) => (
            <article className="kernel-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <div className="stack-panel">
          <div>
            <h3>Mastery Stack</h3>
            <p>
              Plate tectonics is not one chapter. It is the control room behind geomorphology,
              earthquakes, volcanoes, mountains, ocean basins, resources and disaster geography.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={masteryStack} dataKey="weight" nameKey="label" innerRadius={56} outerRadius={90}>
                {masteryStack.map((item, index) => (
                  <Cell
                    key={item.label}
                    fill={[theme.blue, theme.green, theme.orange, "#4AA3DF", theme.violet, "#7BA05B"][index]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {masteryStack.map((item) => (
              <span key={item.label}>
                <b>{item.label}</b> - {item.note}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<Microscope size={20} />} title="3. Theory Evolution And Evidence" kicker="From idea to proof" />
        <div className="timeline">
          {theoryTimeline.map((item) => (
            <article key={item.title}>
              <span>{item.time}</span>
              <h3>{item.title}</h3>
              <p>
                <strong>{item.idea}:</strong> {item.use}
              </p>
              <small>{item.limit}</small>
            </article>
          ))}
        </div>
        <div className="evidence-grid">
          {evidenceBlocks.map((block) => (
            <article className="evidence-card" key={block.title}>
              <h3>{block.title}</h3>
              <Bullet items={block.items} />
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="decision-tree">
        <SectionTitle icon={<Layers3 size={20} />} title="4. Boundary Decision Tree" kicker="The fastest way to solve MCQs" />
        <div className="decision-tree">
          <Decision step="Question asks about crust outcome?" yes="Created" no="Consumed, conserved or pierced" />
          <Decision step="Created?" yes="Divergent boundary" no="Check if one plate subducts" />
          <Decision step="Subduction?" yes="Oceanic convergence" no="Collision, transform or hotspot" />
          <Decision step="Sideways movement?" yes="Transform boundary" no="Hotspot or continental collision" />
        </div>
        <div className="boundary-grid">
          {boundaryStudio.map((item) => (
            <article className="boundary-card" key={item.title}>
              <h3>{item.title}</h3>
              <dl>
                <div>
                  <dt>Movement</dt>
                  <dd>{item.movement}</dd>
                </div>
                <div>
                  <dt>Crust Outcome</dt>
                  <dd>{item.crust}</dd>
                </div>
                <div>
                  <dt>Landforms</dt>
                  <dd>{item.landforms}</dd>
                </div>
                <div>
                  <dt>Examples</dt>
                  <dd>{item.examples}</dd>
                </div>
                <div>
                  <dt>Hazards</dt>
                  <dd>{item.hazards}</dd>
                </div>
              </dl>
              <p className="trap">
                <AlertTriangle size={15} />
                {item.trap}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section india-section" id="india-chain">
        <SectionTitle icon={<Map size={20} />} title="5. India-First Plate Tectonics" kicker="Where UPSC converts static into marks" />
        <div className="image-learning">
          <div className="india-image">
            <img src="/upsc-assets/plate-tectonics-v2-india-tethys.png" alt="India Tethys Himalaya geological illustration" />
            <span className="tag t-india">Indian Plate</span>
            <span className="tag t-tethys">Tethys sediments</span>
            <span className="tag t-himalaya">Himalaya uplift</span>
          </div>
          <div className="panel">
            <h3>The India Chain You Should Teach</h3>
            <p>
              A student should be able to narrate India in one minute and solve five different MCQ
              types from it: chronology, assertion-reason, map-location, disaster and climate linkage.
            </p>
            <Bullet
              items={[
                "Gondwana explains shared fossils, rocks and glacial evidence.",
                "Northward drift explains changing latitude and collision potential.",
                "Deccan volcanism introduces hotspot exception inside India.",
                "Tethys sediments explain why marine evidence appears in the Himalaya story.",
                "Himalaya uplift connects to earthquakes, landslides, rivers and monsoon barrier logic.",
              ]}
            />
          </div>
        </div>
        <div className="sequence-grid">
          {indiaSequence.map((item) => (
            <article key={item.stage}>
              <h3>{item.stage}</h3>
              <p>{item.detail}</p>
              <small>{item.examUse}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<Flame size={20} />} title="6. Current Affairs Lab" kicker="Convert events into static concepts" />
        <div className="current-grid-v2">
          {currentAffairsLab.map((item) => (
            <article key={item.event}>
              <h3>{item.event}</h3>
              <p>
                <strong>Source fact:</strong> {item.sourceFact}
              </p>
              <p>
                <strong>Static concept:</strong> {item.concept}
              </p>
              <p>
                <strong>UPSC use:</strong> {item.upscUse}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<AlertTriangle size={20} />} title="7. Trap Bank" kicker="What students must not confuse" />
        <div className="trap-bank">
          {trapBank.map((trap, index) => (
            <div key={trap}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {trap}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<Compass size={20} />} title="8. PYQ Pattern Engine" kicker="Not just old questions, but old examiner habits" />
        <div className="pattern-grid">
          {pyqPatterns.map((pattern) => (
            <article key={pattern.title}>
              <h3>{pattern.title}</h3>
              <p>
                <strong>Stem style:</strong> {pattern.prompt}
              </p>
              <p>
                <strong>Solution logic:</strong> {pattern.solution}
              </p>
              <p className="study-move">
                <CheckCircle2 size={15} />
                {pattern.studyMove}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="mcq-lab">
        <SectionTitle icon={<Target size={20} />} title="9. MCQ Lab" kicker="Original questions from V2 logic" />
        <div className="mcq-grid">
          {mcqs.map((item, index) => (
            <article className="mcq-card" key={item.q}>
              <h3>
                Q{index + 1}. {item.q}
              </h3>
              <ol>
                {item.o.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ol>
              <details>
                <summary>Answer</summary>
                <p>
                  <strong>{item.a}</strong>
                </p>
                <p>{item.e}</p>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle icon={<Sparkles size={20} />} title="10. 2027 Course Action Plan" kicker="How I would convert this into software/course flow" />
        <div className="action-grid">
          <ActionCard title="Watch Layer" text="Short visual explainer: boundary types, Indian plate journey and current event conversion." />
          <ActionCard title="Talk Layer" text="Student explains each boundary in 45 seconds; software checks missing links in the chain." />
          <ActionCard title="MCQ Layer" text="Adaptive MCQ blocks by trap type: association, chronology, exception, India, current event." />
          <ActionCard title="Map Layer" text="Interactive map of ridges, trenches, arcs, hotspots, Himalayan belt and Indian Ocean context." />
          <ActionCard title="PDF Layer" text="Student can download topic, chapter, week cluster or mistake-book PDF after completing practice." />
          <ActionCard title="Analytics Layer" text="Dashboard shows which concept is weak: evidence, boundary, India, current affairs or traps." />
        </div>
      </section>

      <section className="source-section">
        <h2>Research Sources Used</h2>
        <div className="source-list">
          {sources.map((source) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
              {source.label}
              <ExternalLink size={13} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function VersionNav() {
  return (
    <nav className="version-nav" aria-label="Plate tectonics versions">
      <a href="/upsc-geography-plate-tectonics-demo">Version 1: Prompt Demo</a>
      <a href="/upsc-geography-plate-tectonics-v2" className="active">
        Version 2: Research Edition
      </a>
      <a href="/upsc-geography-plate-tectonics-v3">Version 3: Unified Lab</a>
    </nav>
  );
}

function Metric({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <article>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

function SectionTitle({ icon, title, kicker }: { icon: ReactNode; title: string; kicker: string }) {
  return (
    <header className="section-title-v2">
      <span>{icon}</span>
      <div>
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
    </header>
  );
}

function Bullet({ items }: { items: string[] }) {
  return (
    <ul className="v2-bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Decision({ step, yes, no }: { step: string; yes: string; no: string }) {
  return (
    <article>
      <h3>{step}</h3>
      <div>
        <span>
          Yes <ArrowRight size={14} /> {yes}
        </span>
        <span>
          No <ArrowRight size={14} /> {no}
        </span>
      </div>
    </article>
  );
}

function ActionCard({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

const css = `
  .pt-v2 {
    min-height: 100vh;
    background: ${theme.page};
    color: ${theme.ink};
    font-family: var(--font-sans), Arial, sans-serif;
    font-size: 13px;
    line-height: 1.56;
  }

  .v2-hero {
    min-height: 78vh;
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
    gap: 34px;
    align-items: center;
    padding: 28px clamp(18px, 5vw, 70px) 28px;
    background:
      linear-gradient(135deg, rgba(234,246,255,0.98), rgba(232,248,240,0.96)),
      linear-gradient(180deg, white, transparent);
    border-bottom: 1px solid ${theme.line};
  }

  .version-nav {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 22px;
  }

  .version-nav a {
    border: 1px solid ${theme.line};
    background: white;
    color: ${theme.primary};
    border-radius: 8px;
    padding: 8px 10px;
    text-decoration: none;
    font-weight: 850;
    font-size: 12px;
  }

  .version-nav .active {
    background: ${theme.primary};
    color: white;
    border-color: ${theme.primary};
  }

  .eyebrow {
    margin: 0 0 8px;
    color: ${theme.green};
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .hero-text h1 {
    margin: 0 0 12px;
    color: ${theme.primary};
    font-size: 32px;
    line-height: 1.12;
    font-weight: 900;
    letter-spacing: 0;
  }

  .lead {
    margin: 0;
    max-width: 700px;
    color: ${theme.slate};
    font-size: 15px;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }

  .hero-actions button,
  .hero-actions a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid ${theme.primary};
    background: ${theme.primary};
    color: white;
    border-radius: 8px;
    padding: 10px 12px;
    font-weight: 850;
    text-decoration: none;
    cursor: pointer;
  }

  .hero-actions a:nth-child(2),
  .hero-actions a:nth-child(3) {
    background: white;
    color: ${theme.primary};
  }

  .hero-image-wrap,
  .india-image {
    position: relative;
    overflow: hidden;
    border: 1px solid ${theme.line};
    border-radius: 8px;
    background: white;
    box-shadow: 0 22px 60px rgba(23, 50, 77, 0.14);
  }

  .hero-image-wrap {
    aspect-ratio: 1.42;
  }

  .hero-image-wrap img,
  .india-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pin,
  .tag {
    position: absolute;
    border: 1px solid rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.86);
    color: ${theme.primary};
    border-radius: 999px;
    padding: 7px 10px;
    font-weight: 900;
    font-size: 12px;
    box-shadow: 0 8px 18px rgba(23, 50, 77, 0.16);
  }

  .ridge { left: 42%; top: 31%; }
  .trench { right: 18%; top: 35%; }
  .slab { right: 28%; bottom: 28%; }
  .mantle { left: 34%; bottom: 14%; }

  .top-strip,
  .section,
  .source-section {
    max-width: 1210px;
    margin: 22px auto 0;
    padding: 0 18px;
  }

  .top-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .top-strip article,
  .panel,
  .chart-panel,
  .kernel-card,
  .stack-panel,
  .timeline article,
  .evidence-card,
  .boundary-card,
  .sequence-grid article,
  .current-grid-v2 article,
  .trap-bank div,
  .pattern-grid article,
  .mcq-card,
  .action-grid article,
  .source-section {
    border: 1px solid ${theme.line};
    border-radius: 8px;
    background: ${theme.white};
    box-shadow: 0 10px 26px rgba(23, 50, 77, 0.06);
  }

  .top-strip article {
    padding: 14px;
  }

  .top-strip span {
    display: block;
    color: ${theme.slate};
    font-size: 12px;
    font-weight: 800;
  }

  .top-strip strong {
    display: block;
    color: ${theme.primary};
    font-size: 22px;
    font-weight: 950;
    margin: 3px 0;
  }

  .top-strip p,
  .chart-panel p {
    margin: 0;
    color: ${theme.slate};
    font-size: 12px;
  }

  .section {
    padding-top: 18px;
  }

  .section-title-v2 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .section-title-v2 > span {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: ${theme.primary};
    color: white;
    display: grid;
    place-items: center;
  }

  .section-title-v2 p {
    margin: 0 0 2px;
    color: ${theme.green};
    font-weight: 900;
    text-transform: uppercase;
    font-size: 11px;
  }

  .section-title-v2 h2 {
    margin: 0;
    color: ${theme.primary};
    font-size: 20px;
    font-weight: 950;
    letter-spacing: 0;
  }

  .two-col,
  .image-learning {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }

  .panel,
  .chart-panel,
  .stack-panel {
    padding: 16px;
  }

  .panel h3,
  .kernel-card h3,
  .stack-panel h3,
  .timeline h3,
  .evidence-card h3,
  .boundary-card h3,
  .sequence-grid h3,
  .current-grid-v2 h3,
  .pattern-grid h3,
  .mcq-card h3,
  .action-grid h3,
  .source-section h2 {
    margin: 0 0 8px;
    color: ${theme.blue};
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0;
  }

  .v2-bullets {
    margin: 0;
    padding-left: 18px;
  }

  .v2-bullets li {
    margin: 6px 0;
  }

  .kernel-grid,
  .evidence-grid,
  .boundary-grid,
  .sequence-grid,
  .current-grid-v2,
  .pattern-grid,
  .mcq-grid,
  .action-grid {
    display: grid;
    gap: 14px;
  }

  .kernel-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .kernel-card {
    padding: 15px;
    border-top: 4px solid ${theme.green};
  }

  .kernel-card p,
  .panel p,
  .stack-panel p,
  .timeline p,
  .evidence-card p,
  .boundary-card p,
  .sequence-grid p,
  .current-grid-v2 p,
  .pattern-grid p,
  .action-grid p,
  .mcq-card p {
    margin: 0;
  }

  .stack-panel {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1.2fr;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }

  .legend {
    display: grid;
    gap: 7px;
    color: ${theme.slate};
    font-size: 12px;
  }

  .legend b {
    color: ${theme.primary};
  }

  .timeline {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .timeline article {
    padding: 15px;
    border-left: 5px solid ${theme.blue};
  }

  .timeline span {
    display: inline-flex;
    border-radius: 999px;
    background: ${theme.sky};
    color: ${theme.primary};
    padding: 4px 8px;
    font-weight: 900;
    margin-bottom: 10px;
  }

  .timeline small,
  .sequence-grid small {
    display: block;
    color: ${theme.slate};
    margin-top: 8px;
  }

  .evidence-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 14px;
  }

  .evidence-card {
    padding: 15px;
    background: ${theme.sky};
  }

  .decision-tree {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .decision-tree article {
    border: 1px solid ${theme.line};
    border-radius: 8px;
    background: linear-gradient(180deg, white, ${theme.sky});
    padding: 14px;
  }

  .decision-tree h3 {
    margin: 0 0 10px;
    color: ${theme.primary};
    font-size: 13px;
  }

  .decision-tree div {
    display: grid;
    gap: 8px;
  }

  .decision-tree span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${theme.blue};
    font-weight: 850;
    font-size: 12px;
  }

  .boundary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .boundary-card {
    padding: 15px;
  }

  .boundary-card dl {
    display: grid;
    gap: 8px;
    margin: 0;
  }

  .boundary-card div {
    border-top: 1px solid ${theme.line};
    padding-top: 8px;
  }

  .boundary-card dt {
    color: ${theme.primary};
    font-weight: 900;
    font-size: 12px;
  }

  .boundary-card dd {
    margin: 2px 0 0;
    color: ${theme.slate};
  }

  .trap {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    margin-top: 12px !important;
    padding: 10px;
    border-radius: 8px;
    background: ${theme.amber};
    color: ${theme.red};
    font-weight: 800;
  }

  .india-image {
    aspect-ratio: 1.45;
  }

  .t-india { left: 12%; bottom: 16%; }
  .t-tethys { left: 42%; top: 48%; }
  .t-himalaya { right: 10%; top: 19%; }

  .sequence-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    margin-top: 14px;
  }

  .sequence-grid article {
    padding: 14px;
    border-top: 4px solid ${theme.green};
  }

  .current-grid-v2 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .current-grid-v2 article {
    padding: 15px;
    background: ${theme.mint};
    border-left: 5px solid ${theme.green};
  }

  .trap-bank {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .trap-bank div {
    min-height: 92px;
    padding: 12px;
    background: ${theme.amber};
    border-left: 4px solid ${theme.orange};
  }

  .trap-bank span {
    display: block;
    color: ${theme.red};
    font-weight: 950;
    margin-bottom: 5px;
  }

  .pattern-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pattern-grid article {
    padding: 15px;
  }

  .study-move {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    margin-top: 10px !important;
    color: ${theme.green};
    font-weight: 850;
  }

  .mcq-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mcq-card {
    padding: 15px;
    background: #F0F4FF;
    border-left: 5px solid ${theme.blue};
  }

  .mcq-card ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  .mcq-card li {
    margin: 5px 0;
  }

  summary {
    cursor: pointer;
    color: ${theme.primary};
    font-weight: 900;
  }

  .action-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .action-grid article {
    padding: 15px;
    border-top: 4px solid ${theme.orange};
  }

  .source-section {
    margin-bottom: 28px;
    padding: 18px;
  }

  .source-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .source-list a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${theme.line};
    border-radius: 999px;
    background: ${theme.sky};
    color: ${theme.primary};
    padding: 8px 10px;
    text-decoration: none;
    font-weight: 850;
    font-size: 12px;
  }

  .print-head,
  .print-foot {
    display: none;
  }

  @media (max-width: 1120px) {
    .v2-hero,
    .two-col,
    .image-learning,
    .stack-panel {
      grid-template-columns: 1fr;
    }
    .top-strip,
    .kernel-grid,
    .timeline,
    .evidence-grid,
    .decision-tree,
    .current-grid-v2,
    .pattern-grid,
    .trap-bank {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .boundary-grid,
    .sequence-grid,
    .action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .v2-hero {
      min-height: auto;
      padding: 24px 14px 22px;
      grid-template-columns: 1fr;
    }
    .hero-text h1 {
      font-size: 25px;
    }
    .top-strip,
    .kernel-grid,
    .timeline,
    .evidence-grid,
    .decision-tree,
    .current-grid-v2,
    .pattern-grid,
    .trap-bank,
    .boundary-grid,
    .sequence-grid,
    .action-grid,
    .mcq-grid {
      grid-template-columns: 1fr;
    }
    .section,
    .top-strip,
    .source-section {
      width: calc(100% - 24px);
      padding-left: 0;
      padding-right: 0;
    }
    .pin,
    .tag {
      font-size: 10px;
      padding: 5px 7px;
    }
    .ridge { left: 35%; top: 25%; }
    .trench { right: 10%; top: 34%; }
    .slab { right: 18%; bottom: 25%; }
    .mantle { left: 26%; bottom: 12%; }
  }

  @media print {
    @page {
      size: A4;
      margin: 14mm 10mm;
    }
    .pt-v2 {
      background: white;
      padding: 26px 0;
      font-size: 11.5px;
    }
    .v2-hero {
      min-height: auto;
      grid-template-columns: 1fr;
      padding: 8px 0 14px;
      background: white;
    }
    .hero-actions,
    .version-nav {
      display: none;
    }
    .top-strip,
    .section,
    .source-section {
      max-width: none;
      width: 100%;
      margin: 10px 0 0;
      padding: 0;
    }
    .top-strip,
    .kernel-grid,
    .timeline,
    .evidence-grid,
    .decision-tree,
    .boundary-grid,
    .sequence-grid,
    .current-grid-v2,
    .pattern-grid,
    .trap-bank,
    .mcq-grid,
    .action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .hero-image-wrap,
    .india-image {
      max-height: 360px;
    }
    .top-strip article,
    .panel,
    .chart-panel,
    .kernel-card,
    .timeline article,
    .evidence-card,
    .boundary-card,
    .sequence-grid article,
    .current-grid-v2 article,
    .trap-bank div,
    .pattern-grid article,
    .mcq-card,
    .action-grid article {
      box-shadow: none;
      break-inside: avoid;
    }
    .print-head,
    .print-foot {
      display: block;
      position: fixed;
      left: 0;
      right: 0;
      background: white;
      color: ${theme.primary};
      font-size: 9px;
      font-weight: 900;
      z-index: 1000;
      padding: 5px 10mm;
    }
    .print-head {
      top: 0;
      border-bottom: 1px solid ${theme.line};
    }
    .print-foot {
      bottom: 0;
      border-top: 1px solid ${theme.line};
    }
  }
`;

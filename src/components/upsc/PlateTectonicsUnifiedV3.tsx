"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Save,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

type OptionKey = "A" | "B" | "C" | "D";
type QuizMode = "pyq" | "practice";

type SourceId = "ncert" | "nios3" | "nios16" | "usgs" | "nasa" | "ncs" | "ignou";

type LearningSection = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  focus: string;
  sources: SourceId[];
};

type QuizOption = {
  key: OptionKey;
  text: string;
  isCorrect: boolean;
  feedback: string;
};

type StatementAnalysis = {
  label: string;
  verdict: "Correct" | "Incorrect";
  why: string;
};

type QuizQuestion = {
  id: string;
  title: string;
  sourceLabel: string;
  stem: string;
  statements: string[];
  options: QuizOption[];
  answerKey: OptionKey;
  purpose: string;
  trap: string;
  statementAnalysis: StatementAnalysis[];
  topicTags: string[];
};

type QuizSummary = {
  total: number;
  attempted: number;
  correct: number;
  accuracy: number;
  weakTags: string[];
  strongTags: string[];
};

type RecallCheck = {
  label: string;
  section: string;
  aliases: string[];
};

type RecallTopic = {
  id: string;
  title: string;
  level: "Intermediate" | "Advanced";
  checks: RecallCheck[];
};

type RecallAttempt = {
  id: string;
  topicId: string;
  topicTitle: string;
  score: number;
  matched: string[];
  missing: string[];
  sections: { label: string; status: "recalled" | "revise" }[];
  createdAt: string;
};

type SavedAnalytics = {
  updatedAt: string;
  completedSections: string[];
  pyqAnswers: Record<string, OptionKey>;
  practiceAnswers: Record<string, OptionKey>;
  recallAttempts: RecallAttempt[];
};

const ANALYTICS_KEY = "upsc:plate-tectonics:v3:analytics";

const theme = {
  primary: "#164A5B",
  teal: "#1D7B77",
  green: "#23845F",
  blue: "#2368A2",
  amber: "#B7791F",
  red: "#B42318",
  ink: "#18212F",
  slate: "#566579",
  soft: "#F5FAFB",
  mint: "#E7F6F0",
  sky: "#E9F5FF",
  sand: "#FFF8E8",
  rose: "#FFF0ED",
  line: "#D8E7EA",
  white: "#FFFFFF",
};

const sources: Record<
  SourceId,
  {
    name: string;
    url: string;
    use: string;
  }
> = {
  ncert: {
    name: "NCERT Class XI Fundamentals of Physical Geography, Ch. 4",
    url: "https://ncert.nic.in/textbook/pdf/kegy204.pdf",
    use: "UPSC base layer: continental drift evidence, sea-floor spreading, plates, boundaries, Indian plate.",
  },
  nios3: {
    name: "NIOS Geography 316, Lesson 3: Dynamic Surface of the Earth",
    url: "https://nios.ac.in/media/documents/316courseE/ch3.pdf",
    use: "Official Indian open-school layer for isostasy, continental drift, plate tectonics and plate boundaries.",
  },
  nios16: {
    name: "NIOS Geography 316, Lesson 16: India - Physical Features",
    url: "https://nios.ac.in/media/documents/316courseE/ch16.pdf",
    use: "India conversion layer: relief, Himalaya, plains, plateau and physical setting.",
  },
  usgs: {
    name: "USGS: This Dynamic Earth",
    url: "https://pubs.usgs.gov/gip/dynamic/dynamic.html",
    use: "International scientific layer for plate motions, hotspots, volcanoes, earthquakes and people.",
  },
  nasa: {
    name: "NASA Earth Observatory: Putting Earthquakes in Their Place",
    url: "https://science.nasa.gov/earth/earth-observatory/putting-earthquakes-in-their-place/",
    use: "Map and remote-sensing layer: how active faults, rifts, ridges and volcanoes are mapped.",
  },
  ncs: {
    name: "National Center for Seismology, Ministry of Earth Sciences",
    url: "https://seismo.gov.in/",
    use: "Indian current-events layer for earthquake monitoring and future portal data connections.",
  },
  ignou: {
    name: "IGNOU eGyanKosh Source Desk",
    url: "https://egyankosh.ac.in/",
    use: "Higher-depth university repository to map exact geomorphology/geology PDFs into the final content bank.",
  },
};

const combinedModuleMap = [
  "Continental Drift Theory: Wegener, Pangaea, Panthalassa, Laurasia and Gondwanaland.",
  "Evidence: jig-saw fit, rock continuity, tillite, placer deposits, Glossopteris and Mesosaurus.",
  "Sea-floor spreading: Hess, mid-oceanic ridges, basaltic crust and magnetic reversal stripes.",
  "Plate Tectonic Theory: lithosphere plates moving over the asthenosphere.",
  "Plate boundaries: convergent, divergent and transform with landforms each produces.",
  "Convergent sub-types: oceanic-oceanic, oceanic-continental and continental-continental.",
  "Divergent boundaries: rift valleys, ridges, new sea floor and East African Rift.",
  "Transform boundaries: strike-slip faults, San Andreas Fault and Sagaing Fault comparison.",
  "Hotspots: Hawaiian chain, age progression, Deccan Traps and Reunion hotspot theory.",
  "Indian plate movement: northward drift, Tethys closure, collision with Eurasia and Himalaya.",
  "Tethys Sea: sediments, marine fossils, compression, uplift and fold mountain formation.",
  "Gondwanaland vs Laurasia: breakup history and India's path from south to north.",
];

const mergePillars = [
  {
    label: "V1 Foundation",
    title: "Portal-ready learning order",
    detail:
      "Topic map, NCERT references, download logic, webinar/showcase framing and student-facing sequence are retained.",
  },
  {
    label: "V2 Depth",
    title: "Research edition intelligence",
    detail:
      "Kernel model, theory timeline, evidence traps, boundary studio, India chain and current affairs translation are retained.",
  },
  {
    label: "V3 Software Layer",
    title: "Learning behaviour",
    detail:
      "Section gating, MCQ slide engine, report popup, recall scoring, local analytics and controlled AI discussion are added.",
  },
];

const theoryLadder = [
  {
    title: "Wegener",
    time: "1912",
    idea: "Continental drift",
    use: "Explains why continents appear to fit and why fossils, rocks and glacial deposits match across oceans.",
    trap: "He did not provide the full modern plate-driving mechanism.",
  },
  {
    title: "Holmes",
    time: "1920s-30s",
    idea: "Mantle convection",
    use: "Supplied an internal heat-driven possibility for movement.",
    trap: "Convection is a mechanism layer, not the same thing as fossil evidence.",
  },
  {
    title: "Hess",
    time: "1960s",
    idea: "Sea-floor spreading",
    use: "New oceanic crust forms at ridges and moves outward symmetrically.",
    trap: "Sea-floor spreading was not Wegener's original evidence.",
  },
  {
    title: "Plate Tectonics",
    time: "1960s onward",
    idea: "Integrated theory",
    use: "Explains ridges, trenches, arcs, earthquakes, volcanoes and mountain building.",
    trap: "UPSC often checks whether the right process is attached to the right boundary.",
  },
];

const evidenceLanes = [
  {
    title: "Continental fit",
    foundation: "South America and Africa show a classic visual fit.",
    depth: "The stronger fit is along continental shelves, not only present-day coastlines.",
    trap: "Do not treat eroded modern shorelines as the final proof.",
  },
  {
    title: "Fossils",
    foundation: "Mesosaurus and Glossopteris connect separated landmasses.",
    depth: "The value is not the name alone; it is the impossibility of easy ocean crossing for those distributions.",
    trap: "If the statement says Mesosaurus swam across a wide ocean, it reverses the logic.",
  },
  {
    title: "Rocks and tillite",
    foundation: "Rock sequences and tillite deposits connect Gondwana fragments.",
    depth: "Tillite becomes a palaeoclimate clue showing comparable glacial history.",
    trap: "Coal in Antarctica points to changed latitude/climate, not polar coal formation.",
  },
  {
    title: "Ocean-floor evidence",
    foundation: "Mid-ocean ridges, young crust and magnetic stripes supported sea-floor spreading.",
    depth: "Paleomagnetism and age bands solved the missing mechanism problem.",
    trap: "Do not list magnetic reversal as Wegener's original evidence.",
  },
];

const boundaryStudio = [
  {
    title: "Divergent Boundary",
    movement: "Plates move apart.",
    crust: "New crust is created.",
    landforms: "Rift valley, mid-oceanic ridge and new ocean floor.",
    examples: "Mid-Atlantic Ridge, East African Rift.",
    hazards: "Shallow earthquakes, fissure volcanism and basaltic activity.",
    trap: "Do not attach deep trench or subduction to divergence.",
  },
  {
    title: "Oceanic-Oceanic Convergence",
    movement: "One oceanic plate subducts beneath another oceanic plate.",
    crust: "Old dense oceanic crust is consumed.",
    landforms: "Trench, island arc and volcanic chain.",
    examples: "Japan arc, Mariana trench system.",
    hazards: "Strong earthquakes, tsunami and explosive volcanism.",
    trap: "Island arc is not the same as mid-ocean ridge.",
  },
  {
    title: "Oceanic-Continental Convergence",
    movement: "Oceanic plate subducts below continental plate.",
    crust: "Oceanic crust is consumed.",
    landforms: "Trench, continental volcanic arc and fold-thrust belt.",
    examples: "Andes-type margin.",
    hazards: "Megathrust earthquakes, tsunami and stratovolcanoes.",
    trap: "Do not forget oceanic crust is denser and subducts more easily.",
  },
  {
    title: "Continental-Continental Convergence",
    movement: "Two buoyant continental masses collide.",
    crust: "Crust thickens and shortens.",
    landforms: "Fold mountains, plateau and deep crustal root.",
    examples: "Himalaya-Tibet system.",
    hazards: "Large earthquakes, landslides and river disruption.",
    trap: "Do not overstate volcanic arcs after full continental collision.",
  },
  {
    title: "Transform Boundary",
    movement: "Plates slide laterally past one another.",
    crust: "Crust is conserved.",
    landforms: "Strike-slip fault, offset streams and linear valleys.",
    examples: "San Andreas Fault, Sagaing Fault.",
    hazards: "Shallow damaging earthquakes.",
    trap: "Transform does not create new sea floor.",
  },
  {
    title: "Hotspot / Mantle Plume",
    movement: "Plate moves over a relatively fixed thermal anomaly.",
    crust: "Crust is thermally pierced rather than boundary-controlled.",
    landforms: "Volcanic chain and flood basalt province.",
    examples: "Hawaii, Deccan Traps-Reunion hotspot theory.",
    hazards: "Volcanism, lava flows and deep-time climate forcing.",
    trap: "Hotspots can be intra-plate; they are not always at boundaries.",
  },
];

const indiaSequence = [
  {
    stage: "1. Gondwana base",
    detail: "India was once connected with Africa, Antarctica, Australia and South America.",
    examUse: "Use this for fossil, rock and glacial continuity.",
  },
  {
    stage: "2. Rifting and drift",
    detail: "India separated and moved northward at a geologically rapid pace.",
    examUse: "Connect with Indian Ocean opening and changing latitude/climate.",
  },
  {
    stage: "3. Deccan volcanism",
    detail: "One theory links Deccan flood basalts with the Indian plate passing over the Reunion hotspot.",
    examUse: "Use as the hotspot exception inside the India story.",
  },
  {
    stage: "4. Tethys closure",
    detail: "The Tethys Sea between India and Eurasia narrowed as India approached Eurasia.",
    examUse: "Marine sediments of Tethys become central to Himalaya formation.",
  },
  {
    stage: "5. Collision and Himalaya",
    detail: "Continental collision compressed, folded and uplifted sediments into the Himalaya-Tibet system.",
    examUse: "Young fold mountains, seismicity, landslides, river systems and monsoon barrier logic.",
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
    sourceFact: "USGS lists M 7.5 and tsunami-related alerting for the event.",
    concept: "Convergent-margin regions can involve reverse faulting, uplift and tsunami risk.",
    upscUse: "Japan should be analysed as a subduction-region system, not a one-word location.",
  },
  {
    event: "2025 Mandalay/Sagaing, Myanmar earthquake",
    sourceFact: "USGS lists M 7.7 near a major strike-slip fault setting.",
    concept: "Transform-style lateral rupture can damage distant basins through wave amplification.",
    upscUse: "Compare Sagaing Fault with San Andreas-style strike-slip logic.",
  },
  {
    event: "2025 Kamchatka Peninsula earthquake",
    sourceFact: "USGS lists a very large earthquake in a Pacific subduction setting.",
    concept: "Fast oceanic subduction zones can host megathrust earthquakes and tsunami generation.",
    upscUse: "Differentiate oceanic subduction hazards from continental collision mountain building.",
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
];

const sections: LearningSection[] = [
  {
    id: "blueprint",
    label: "Blueprint",
    kicker: "V1 + V2 combined",
    title: "What Version 3 Becomes",
    focus: "A section-wise single-source lab: learn, test, recall, discuss and save progress.",
    sources: ["ncert", "nios3", "usgs"],
  },
  {
    id: "evidence",
    label: "Evidence",
    kicker: "Wegener to acceptance",
    title: "Continental Drift Evidence",
    focus: "Move from memory facts to question traps: fit, rocks, tillite, fossils, placer deposits and later evidence.",
    sources: ["ncert", "nios3"],
  },
  {
    id: "motion",
    label: "Motion",
    kicker: "Sea-floor spreading",
    title: "Lithosphere, Asthenosphere and Sea-floor Logic",
    focus: "Why ridges create crust, why trenches consume crust and why magnetic stripes matter.",
    sources: ["ncert", "nios3", "usgs"],
  },
  {
    id: "boundaries",
    label: "Boundaries",
    kicker: "UPSC decision tree",
    title: "Boundary Types and Outcomes",
    focus: "Convergent, divergent and transform boundaries with exact landform and hazard outputs.",
    sources: ["ncert", "nios3", "usgs", "nasa"],
  },
  {
    id: "india",
    label: "India",
    kicker: "Gondwana to Himalaya",
    title: "Indian Plate, Tethys, Himalaya and Deccan",
    focus: "Convert global plate theory into India-specific UPSC value.",
    sources: ["ncert", "nios16", "ncs"],
  },
  {
    id: "current",
    label: "Current",
    kicker: "2027 readiness",
    title: "Current Affairs Translation Layer",
    focus: "Turn earthquakes, volcanoes and island arcs into static plate-tectonic reasoning.",
    sources: ["usgs", "nasa", "ncs"],
  },
  {
    id: "sources",
    label: "Sources",
    kicker: "Reference discipline",
    title: "Official Source Desk",
    focus: "Students can see which official source is controlling which part of the topic.",
    sources: ["ncert", "nios3", "nios16", "usgs", "nasa", "ncs", "ignou"],
  },
  {
    id: "pyq",
    label: "PYQ Lab",
    kicker: "One question per slide",
    title: "PYQ Pattern Slide Lab",
    focus: "Full UPSC-style stem, statements, A/B/C/D options, trap analysis and saved report.",
    sources: ["ncert", "nios3"],
  },
  {
    id: "practice",
    label: "Practice",
    kicker: "2026 pattern drill",
    title: "Practice MCQ Slide Lab",
    focus: "Multi-statement conceptual MCQs with option-wise feedback and analytics capture.",
    sources: ["ncert", "nios3", "usgs"],
  },
  {
    id: "recall",
    label: "Recall",
    kicker: "Intermediate + advanced",
    title: "Recall and AI Discussion Lab",
    focus: "Student recalls a topic, the system scores coverage, highlights remembered/missing areas and opens discussion.",
    sources: ["ncert", "nios3", "usgs", "ignou"],
  },
];

const pyqSlides: QuizQuestion[] = [
  {
    id: "pyq-evidence-01",
    title: "PYQ Pattern 1: Continental Drift Evidence",
    sourceLabel: "NCERT + NIOS evidence cluster",
    stem: "Consider the following statements regarding evidence used to support continental drift:",
    statements: [
      "1. Tillite deposits across India, Africa, Antarctica and Australia indicate comparable glacial history in Gondwana landmasses.",
      "2. Mesosaurus fossils are treated as evidence because the organism could easily cross a wide open ocean.",
      "3. The match between South America and Africa becomes stronger when continental shelves are compared rather than modern shorelines only.",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: false,
        feedback:
          "You caught tillite but fell into the fossil trap. Mesosaurus supports drift because it could not explainably cross a wide ocean barrier.",
      },
      {
        key: "B",
        text: "1 and 3 only",
        isCorrect: true,
        feedback:
          "Correct. This combines the glacial-sediment evidence with the stronger shelf-margin fit and rejects the misleading Mesosaurus logic.",
      },
      {
        key: "C",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "The shelf-fit statement is right, but statement 2 reverses the logic of fossil evidence. Also, tillite is a standard drift clue.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "This is the classic 'all statements look familiar' trap. Statement 2 uses a true fossil name but gives the wrong reason.",
      },
    ],
    answerKey: "B",
    purpose:
      "To check whether the student can separate evidence names from evidence logic.",
    trap:
      "Statement 2 sounds scientific because Mesosaurus is a real example, but the reasoning is inverted.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "Tillite and Gondwana sediment similarity are standard drift evidence.",
      },
      {
        label: "Statement 2",
        verdict: "Incorrect",
        why: "Mesosaurus was a shallow-water/fresh-brackish organism; its distribution is evidence against a wide ocean barrier.",
      },
      {
        label: "Statement 3",
        verdict: "Correct",
        why: "Continental shelf fit is more reliable than present eroded shorelines.",
      },
    ],
    topicTags: ["Evidence", "Wegener", "Fossils"],
  },
  {
    id: "pyq-spreading-02",
    title: "PYQ Pattern 2: Sea-floor Spreading",
    sourceLabel: "NCERT sea-floor spreading cluster",
    stem: "With reference to sea-floor spreading, consider the following statements:",
    statements: [
      "1. Oceanic crust near the mid-oceanic ridge is generally younger than crust farther away from the ridge.",
      "2. Magnetic reversal stripes on either side of a ridge helped strengthen the case for sea-floor spreading.",
      "3. Deep-sea trenches are usually places where new oceanic crust is produced.",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. Ridges create younger crust and preserve magnetic symmetry; trenches mainly consume oceanic crust.",
      },
      {
        key: "B",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "You identified magnetic evidence, but statement 3 confuses construction at ridges with consumption at trenches.",
      },
      {
        key: "C",
        text: "1 and 3 only",
        isCorrect: false,
        feedback:
          "Statement 1 is right, but missing statement 2 loses the strongest ocean-floor proof. Statement 3 is reversed.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "The all-correct option is a trap. Sea-floor creation belongs to ridges; trenches are linked with subduction.",
      },
    ],
    answerKey: "A",
    purpose:
      "To connect mechanism, age pattern and magnetic evidence in one reasoning chain.",
    trap:
      "UPSC can mix ridge and trench outcomes because both are ocean-floor features.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "New crust forms near ridges and moves outward.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "Symmetrical magnetic stripes record reversals as new basalt cools.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Trenches are subduction/consumption zones, not construction zones.",
      },
    ],
    topicTags: ["Sea-floor Spreading", "Magnetism", "Ridge-Trench"],
  },
  {
    id: "pyq-boundary-03",
    title: "PYQ Pattern 3: Boundary Association",
    sourceLabel: "NCERT + USGS boundary framework",
    stem: "Which of the following pairs are correctly matched?",
    statements: [
      "1. Oceanic-oceanic convergence - Island arc and trench",
      "2. Continental-continental convergence - Fold mountains and very high volcanism",
      "3. Transform boundary - Lateral displacement and shallow earthquakes",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: false,
        feedback:
          "Statement 1 is correct, but statement 2 adds 'very high volcanism' to continental collision. That is the trap.",
      },
      {
        key: "B",
        text: "1 and 3 only",
        isCorrect: true,
        feedback:
          "Correct. Island arcs belong to oceanic-oceanic convergence and transform boundaries generate lateral slip with shallow quakes.",
      },
      {
        key: "C",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "Transform logic is right, but you dropped oceanic-oceanic island arc logic and accepted the continental-collision volcano trap.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "The attractive error is to associate every convergence with volcanism. Continental collision produces fold mountains, but not the classic volcanic arc outcome.",
      },
    ],
    answerKey: "B",
    purpose:
      "To test boundary-output mapping rather than memorised boundary names.",
    trap:
      "Convergence is not one thing. Oceanic subduction and continental collision have different outputs.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "One oceanic plate subducts, producing a trench and volcanic island arc.",
      },
      {
        label: "Statement 2",
        verdict: "Incorrect",
        why: "Continental collision produces fold mountains and crustal thickening; intense arc volcanism is not its standard output.",
      },
      {
        label: "Statement 3",
        verdict: "Correct",
        why: "Transform movement is lateral, commonly causing shallow earthquakes.",
      },
    ],
    topicTags: ["Boundaries", "Convergence", "Transform"],
  },
  {
    id: "pyq-india-04",
    title: "PYQ Pattern 4: Indian Plate and Tethys",
    sourceLabel: "NCERT + NIOS India conversion",
    stem: "Consider the following statements about the Indian Plate and the Himalaya:",
    statements: [
      "1. The Himalayan orogeny is linked to the collision between the Indian Plate and the Eurasian Plate.",
      "2. Sediments of the Tethys Sea were involved in the formation of Himalayan sedimentary sequences.",
      "3. The Deccan Traps were formed due to the same continental-continental collision that formed the Himalaya.",
    ],
    options: [
      {
        key: "A",
        text: "1 only",
        isCorrect: false,
        feedback:
          "Statement 1 is correct, but statement 2 is also important. The Tethys sediment layer is a common missed concept.",
      },
      {
        key: "B",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. Himalaya is a collision story, while Tethys sediments explain much of the sedimentary material involved.",
      },
      {
        key: "C",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "You caught Tethys, but statement 3 wrongly merges Deccan volcanism with Himalayan collision.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "Statement 3 is the trap. Deccan Traps are commonly linked with large igneous province/hotspot debate, not Himalayan collision.",
      },
    ],
    answerKey: "B",
    purpose:
      "To make India-specific tectonics precise: collision, sediments and volcanic province are separate chains.",
    trap:
      "The question mixes two famous Indian geography topics and expects the student to keep their mechanisms separate.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "The Indian Plate moved northward and collided with Eurasia, causing Himalayan uplift.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "Tethys Sea sediments were compressed/uplifted during the collision history.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Deccan Traps are flood basalts and are not the direct product of India-Eurasia collision.",
      },
    ],
    topicTags: ["India", "Tethys", "Deccan"],
  },
];

const practiceSlides: QuizQuestion[] = [
  {
    id: "practice-lithosphere-01",
    title: "Practice 1: Lithosphere vs Asthenosphere",
    sourceLabel: "NCERT + NIOS foundation",
    stem: "Consider the following statements:",
    statements: [
      "1. Lithosphere includes the crust and the uppermost rigid part of the mantle.",
      "2. Asthenosphere is treated as a mechanically weak layer over which plates can move.",
      "3. A tectonic plate must be either fully oceanic or fully continental.",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. A plate may include both continental and oceanic lithosphere; it need not be purely one type.",
      },
      {
        key: "B",
        text: "2 only",
        isCorrect: false,
        feedback:
          "You recognised the asthenosphere, but missed the lithosphere definition.",
      },
      {
        key: "C",
        text: "1 and 3 only",
        isCorrect: false,
        feedback:
          "Statement 1 is right, but statement 3 is false because many plates carry both landmass and ocean floor.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "This option falls for a classification trap. Plate type depends on dominant composition, not exclusivity.",
      },
    ],
    answerKey: "A",
    purpose:
      "To build exact vocabulary before solving mechanism questions.",
    trap:
      "Students often think 'continental plate' means no oceanic crust inside the plate.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "Lithosphere is the rigid shell: crust plus uppermost mantle.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "The asthenosphere allows plate motion due to its weaker behaviour.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Large plates can carry both continental and oceanic lithosphere.",
      },
    ],
    topicTags: ["Definitions", "Lithosphere", "Asthenosphere"],
  },
  {
    id: "practice-rift-02",
    title: "Practice 2: Divergent Boundary",
    sourceLabel: "NCERT + NASA map reasoning",
    stem: "Which of the following may be associated with divergent plate boundaries?",
    statements: [
      "1. Rift valleys in continental settings",
      "2. New oceanic crust at mid-oceanic ridges",
      "3. Deep-focus earthquakes due to subduction",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. Divergence stretches crust and creates new crust; deep-focus subduction quakes belong to convergence.",
      },
      {
        key: "B",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "You identified ridge construction, but added subduction logic from a convergent boundary.",
      },
      {
        key: "C",
        text: "1 and 3 only",
        isCorrect: false,
        feedback:
          "Rift valleys fit divergence, but deep-focus earthquakes point toward subducting slabs.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "This is a boundary-mixing trap. Divergent boundaries usually produce shallow seismicity.",
      },
    ],
    answerKey: "A",
    purpose:
      "To test whether the student can separate divergent and convergent earthquake signatures.",
    trap:
      "Deep-focus earthquake sounds like any major tectonic process, but it is linked to subduction.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "Continental divergence can begin as rifting.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "Ridge volcanism creates new basaltic oceanic crust.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Deep-focus earthquake zones are associated with subducting slabs.",
      },
    ],
    topicTags: ["Divergence", "Rift", "Earthquakes"],
  },
  {
    id: "practice-hotspot-03",
    title: "Practice 3: Hotspots",
    sourceLabel: "USGS hotspot concept",
    stem: "With reference to hotspots, consider the following statements:",
    statements: [
      "1. Hotspots can produce volcanic chains within a plate as the plate moves over a relatively fixed mantle plume.",
      "2. The Hawaiian Islands are a standard example used to explain hotspot tracks.",
      "3. Hotspots occur only at convergent boundaries.",
    ],
    options: [
      {
        key: "A",
        text: "1 only",
        isCorrect: false,
        feedback:
          "Statement 1 is correct, but statement 2 is also a standard example.",
      },
      {
        key: "B",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. The question tests whether you can keep intraplate hotspot logic separate from plate boundary logic.",
      },
      {
        key: "C",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "Hawaii is right, but hotspots are not restricted to convergent margins.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "Statement 3 is over-restrictive. Hotspots are important precisely because they can be away from boundaries.",
      },
    ],
    answerKey: "B",
    purpose:
      "To check if students can identify exception mechanisms beyond boundary-based thinking.",
    trap:
      "After learning boundaries, students start forcing every volcano into a boundary category.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "A plate moving over a plume can leave a volcanic chain.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "Hawaii is a classic hotspot-track example.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Hotspots can occur within plates and are not only convergent-boundary features.",
      },
    ],
    topicTags: ["Hotspot", "Volcanism", "Exceptions"],
  },
  {
    id: "practice-transform-04",
    title: "Practice 4: Transform Boundary",
    sourceLabel: "USGS + UPSC association drill",
    stem: "Consider the following statements about transform boundaries:",
    statements: [
      "1. The dominant movement is horizontal/lateral sliding between plates.",
      "2. The San Andreas Fault is commonly cited as a transform boundary example.",
      "3. Transform boundaries are the main sites of large-scale creation of new oceanic crust.",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. Transform means lateral slip; crust creation is a divergent-ridge process.",
      },
      {
        key: "B",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "The example is right, but the process in statement 3 belongs to divergent boundaries.",
      },
      {
        key: "C",
        text: "1 and 3 only",
        isCorrect: false,
        feedback:
          "Movement is right, but the crust-creation claim is wrong and the San Andreas example should not be omitted.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "The third statement is the trap. Transform boundaries conserve crust rather than construct it at scale.",
      },
    ],
    answerKey: "A",
    purpose:
      "To make the boundary-output map automatic under time pressure.",
    trap:
      "The word boundary makes students expect construction or destruction. Transform is mostly lateral displacement.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "Transform boundaries involve plates sliding past each other.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "San Andreas is a standard transform example.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "New oceanic crust is created mainly at divergent ridges.",
      },
    ],
    topicTags: ["Transform", "Faults", "Boundaries"],
  },
  {
    id: "practice-current-05",
    title: "Practice 5: Current Event Translation",
    sourceLabel: "USGS/NCS current-event logic",
    stem: "A major earthquake is reported along an active plate boundary. Which analytical moves are valid for UPSC preparation?",
    statements: [
      "1. Identify whether the event is linked with convergence, divergence or transform motion before memorising the event location.",
      "2. Connect the event with associated landforms such as trenches, arcs, fold belts or faults where relevant.",
      "3. Assume that every high-magnitude earthquake must be volcanic in origin.",
    ],
    options: [
      {
        key: "A",
        text: "1 and 2 only",
        isCorrect: true,
        feedback:
          "Correct. This is the V3 method: event -> boundary -> process -> landform/hazard -> UPSC trap.",
      },
      {
        key: "B",
        text: "2 and 3 only",
        isCorrect: false,
        feedback:
          "Landform connection is useful, but statement 3 is a dangerous overgeneralisation.",
      },
      {
        key: "C",
        text: "1 only",
        isCorrect: false,
        feedback:
          "Boundary identification is necessary, but you also need associated landform and hazard outputs.",
      },
      {
        key: "D",
        text: "1, 2 and 3",
        isCorrect: false,
        feedback:
          "Statement 3 is the trap. Many earthquakes are fault-motion events and need not be volcanic.",
      },
    ],
    answerKey: "A",
    purpose:
      "To train the student to use current affairs as a static-concept trigger.",
    trap:
      "Students often memorise the earthquake name and miss the plate-tectonic logic UPSC can ask.",
    statementAnalysis: [
      {
        label: "Statement 1",
        verdict: "Correct",
        why: "Boundary type gives the correct process frame.",
      },
      {
        label: "Statement 2",
        verdict: "Correct",
        why: "Landforms and hazard belts convert current events into syllabus concepts.",
      },
      {
        label: "Statement 3",
        verdict: "Incorrect",
        why: "Earthquakes may occur due to faulting, subduction, collision or transform movement without direct volcanism.",
      },
    ],
    topicTags: ["Current Affairs", "Hazards", "Analysis"],
  },
];

const recallTopics: RecallTopic[] = [
  {
    id: "recall-evidence",
    title: "Continental Drift Evidence",
    level: "Intermediate",
    checks: [
      { label: "Pangaea/Panthalassa", section: "Blueprint", aliases: ["pangaea", "panthalassa", "supercontinent"] },
      { label: "Jig-saw fit", section: "Evidence", aliases: ["jigsaw", "jig-saw", "south america", "africa"] },
      { label: "Tillite/Gondwana", section: "Evidence", aliases: ["tillite", "gondwana", "glacial"] },
      { label: "Fossil evidence", section: "Evidence", aliases: ["mesosaurus", "glossopteris", "fossil"] },
      { label: "Placer deposits", section: "Evidence", aliases: ["placer", "ghana", "brazil", "gold"] },
    ],
  },
  {
    id: "recall-boundaries",
    title: "Boundary Decision Tree",
    level: "Intermediate",
    checks: [
      { label: "Divergent", section: "Boundaries", aliases: ["divergent", "rift", "mid-ocean", "new crust"] },
      { label: "Convergent", section: "Boundaries", aliases: ["convergent", "subduction", "collision", "trench"] },
      { label: "Transform", section: "Boundaries", aliases: ["transform", "san andreas", "lateral", "strike-slip"] },
      { label: "Oceanic-oceanic output", section: "Boundaries", aliases: ["island arc", "oceanic-oceanic"] },
      { label: "Continental collision output", section: "India", aliases: ["fold mountain", "himalaya", "continental-continental"] },
    ],
  },
  {
    id: "recall-india",
    title: "Indian Plate and Tethys",
    level: "Advanced",
    checks: [
      { label: "Northward drift", section: "India", aliases: ["northward", "indian plate", "eurasian"] },
      { label: "Tethys Sea", section: "India", aliases: ["tethys", "sea", "sediment"] },
      { label: "Himalayan uplift", section: "India", aliases: ["himalaya", "uplift", "orogeny", "fold"] },
      { label: "Deccan distinction", section: "India", aliases: ["deccan", "flood basalt", "hotspot"] },
      { label: "Seismicity link", section: "Current", aliases: ["earthquake", "seismic", "main himalayan", "fault"] },
    ],
  },
  {
    id: "recall-current",
    title: "Current Event Translation",
    level: "Advanced",
    checks: [
      { label: "Event to boundary", section: "Current", aliases: ["boundary", "convergent", "transform", "divergent"] },
      { label: "Boundary to process", section: "Current", aliases: ["subduction", "collision", "slip", "spreading"] },
      { label: "Process to landform", section: "Current", aliases: ["trench", "arc", "ridge", "fold", "fault"] },
      { label: "Hazard signature", section: "Current", aliases: ["shallow", "deep", "volcano", "earthquake"] },
      { label: "UPSC trap", section: "Practice", aliases: ["trap", "statement", "exception", "not all"] },
    ],
  },
];

export function PlateTectonicsUnifiedV3() {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [pyqAnswers, setPyqAnswers] = useState<Record<string, OptionKey>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, OptionKey>>({});
  const [pyqIndex, setPyqIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [report, setReport] = useState<null | { mode: QuizMode; summary: QuizSummary }>(null);
  const [recallTopicId, setRecallTopicId] = useState(recallTopics[0].id);
  const [recallText, setRecallText] = useState("");
  const [recallResult, setRecallResult] = useState<RecallAttempt | null>(null);
  const [recallAttempts, setRecallAttempts] = useState<RecallAttempt[]>([]);
  const [discussionQuestion, setDiscussionQuestion] = useState("");
  const [discussionReply, setDiscussionReply] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const activeSection = sections[activeSectionIndex];
  const sectionProgress = Math.round((completedSections.length / sections.length) * 100);
  const pyqSummary = useMemo(() => buildQuizSummary(pyqSlides, pyqAnswers), [pyqAnswers]);
  const practiceSummary = useMemo(
    () => buildQuizSummary(practiceSlides, practiceAnswers),
    [practiceAnswers],
  );
  const totalAttempted = pyqSummary.attempted + practiceSummary.attempted;
  const totalQuestions = pyqSummary.total + practiceSummary.total;
  const combinedAccuracy =
    totalAttempted === 0
      ? 0
      : Math.round(((pyqSummary.correct + practiceSummary.correct) / totalAttempted) * 100);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ANALYTICS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedAnalytics>;
        setCompletedSections(saved.completedSections ?? []);
        setPyqAnswers(saved.pyqAnswers ?? {});
        setPracticeAnswers(saved.practiceAnswers ?? {});
        setRecallAttempts(saved.recallAttempts ?? []);
      }
    } catch {
      // Ignore corrupt local prototype state and keep the page usable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const snapshot: SavedAnalytics = {
      updatedAt: new Date().toISOString(),
      completedSections,
      pyqAnswers,
      practiceAnswers,
      recallAttempts,
    };
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(snapshot));
  }, [completedSections, hydrated, practiceAnswers, pyqAnswers, recallAttempts]);

  function markSectionComplete(sectionId = activeSection.id) {
    setCompletedSections((current) =>
      current.includes(sectionId) ? current : [...current, sectionId],
    );
  }

  function goNext() {
    markSectionComplete();
    setActiveSectionIndex((current) => Math.min(current + 1, sections.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setActiveSectionIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function answerQuestion(mode: QuizMode, questionId: string, key: OptionKey) {
    if (mode === "pyq") {
      setPyqAnswers((current) => ({ ...current, [questionId]: key }));
      return;
    }
    setPracticeAnswers((current) => ({ ...current, [questionId]: key }));
  }

  function resetQuiz(mode: QuizMode) {
    if (mode === "pyq") {
      setPyqAnswers({});
      setPyqIndex(0);
    } else {
      setPracticeAnswers({});
      setPracticeIndex(0);
    }
    setReport(null);
  }

  function evaluateActiveRecall() {
    const topic = recallTopics.find((item) => item.id === recallTopicId) ?? recallTopics[0];
    const attempt = evaluateRecall(topic, recallText);
    setRecallResult(attempt);
    setRecallAttempts((current) => [attempt, ...current].slice(0, 12));
  }

  function askDiscussion(question = discussionQuestion) {
    const cleaned = question.trim();
    if (!cleaned) {
      return;
    }
    setDiscussionQuestion(cleaned);
    setDiscussionReply(buildDiscussionReply(cleaned, activeSection));
  }

  function renderActiveSection() {
    if (activeSection.id === "pyq") {
      return (
        <QuizSlider
          mode="pyq"
          questions={pyqSlides}
          currentIndex={pyqIndex}
          answers={pyqAnswers}
          summary={pyqSummary}
          onAnswer={answerQuestion}
          onIndexChange={setPyqIndex}
          onFinish={() => setReport({ mode: "pyq", summary: pyqSummary })}
          onReset={() => resetQuiz("pyq")}
        />
      );
    }

    if (activeSection.id === "practice") {
      return (
        <QuizSlider
          mode="practice"
          questions={practiceSlides}
          currentIndex={practiceIndex}
          answers={practiceAnswers}
          summary={practiceSummary}
          onAnswer={answerQuestion}
          onIndexChange={setPracticeIndex}
          onFinish={() => setReport({ mode: "practice", summary: practiceSummary })}
          onReset={() => resetQuiz("practice")}
        />
      );
    }

    if (activeSection.id === "recall") {
      return (
        <RecallLab
          attempts={recallAttempts}
          activeTopicId={recallTopicId}
          recallText={recallText}
          result={recallResult}
          onTopicChange={(topicId) => {
            setRecallTopicId(topicId);
            setRecallResult(null);
          }}
          onTextChange={setRecallText}
          onEvaluate={evaluateActiveRecall}
        />
      );
    }

    return <ContentSection sectionId={activeSection.id} />;
  }

  return (
    <main className="v3-shell">
      <style>{css}</style>

      <header className="v3-hero">
        <div className="hero-main">
          <VersionNav />
          <p className="eyebrow">Version 3 | Unified learning lab | Section-gated prototype</p>
          <h1>Plate Tectonics: Single Source Learning Lab</h1>
          <p className="hero-lead">
            V3 combines the portal-ready structure of Version 1 with the research depth of Version 2.
            The student now learns one section at a time, solves one MCQ slide at a time, gets trap-level
            explanations, recalls topics, and saves progress into local prototype analytics.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => setActiveSectionIndex(0)}>
              <BookOpen size={18} />
              Start Learning Flow
            </button>
            <button type="button" className="ghost" onClick={() => setActiveSectionIndex(7)}>
              <ClipboardCheck size={18} />
              Open MCQ Slides
            </button>
          </div>
        </div>

        <div className="analytics-panel">
          <div className="panel-title">
            <BarChart3 size={20} />
            Student Analytics Snapshot
          </div>
          <Metric label="Section progress" value={`${sectionProgress}%`} note={`${completedSections.length}/${sections.length} sections`} />
          <Metric label="MCQ attempted" value={`${totalAttempted}/${totalQuestions}`} note={`${combinedAccuracy}% current accuracy`} />
          <Metric label="Recall attempts" value={`${recallAttempts.length}`} note="Saved locally for profile wiring" />
          <div className="saved-chip">
            <Save size={16} />
            Prototype save key: {ANALYTICS_KEY}
          </div>
        </div>
      </header>

      <section className="learning-layout">
        <aside className="section-rail" aria-label="Learning sections">
          <div className="rail-heading">
            <Target size={18} />
            Learning Flow
          </div>
          {sections.map((section, index) => (
            <button
              type="button"
              key={section.id}
              className={`rail-item ${activeSection.id === section.id ? "active" : ""}`}
              onClick={() => setActiveSectionIndex(index)}
            >
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{section.label}</strong>
                <small>{section.kicker}</small>
              </span>
              {completedSections.includes(section.id) ? <CheckCircle2 size={16} /> : null}
            </button>
          ))}
        </aside>

        <article className="section-card">
          <div className="section-head">
            <p className="eyebrow">{activeSection.kicker}</p>
            <h2>{activeSection.title}</h2>
            <p>{activeSection.focus}</p>
            <SourceChips sourceIds={activeSection.sources} />
          </div>

          {renderActiveSection()}

          <DiscussionDock
            section={activeSection}
            question={discussionQuestion}
            reply={discussionReply}
            onQuestionChange={setDiscussionQuestion}
            onAsk={askDiscussion}
          />

          <div className="section-controls">
            <button type="button" className="secondary" onClick={goBack} disabled={activeSectionIndex === 0}>
              <ArrowLeft size={18} />
              Back
            </button>
            <button type="button" className="secondary" onClick={() => markSectionComplete()}>
              <CheckCircle2 size={18} />
              Mark Learned
            </button>
            <button type="button" onClick={goNext} disabled={activeSectionIndex === sections.length - 1}>
              Mark Learned + Next
              <ArrowRight size={18} />
            </button>
          </div>
        </article>
      </section>

      {report ? (
        <ReportModal
          mode={report.mode}
          summary={report.summary}
          onClose={() => setReport(null)}
          onReset={() => resetQuiz(report.mode)}
        />
      ) : null}
    </main>
  );
}

function VersionNav() {
  return (
    <nav className="version-nav" aria-label="Plate tectonics versions">
      <a href="/upsc-geography-plate-tectonics-demo">Version 1: Prompt Demo</a>
      <a href="/upsc-geography-plate-tectonics-v2">Version 2: Research Edition</a>
      <a href="/upsc-geography-plate-tectonics-v3" className="active">
        Version 3: Unified Lab
      </a>
    </nav>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function SourceChips({ sourceIds }: { sourceIds: SourceId[] }) {
  return (
    <div className="source-chips">
      {sourceIds.map((sourceId) => (
        <a key={sourceId} href={sources[sourceId].url} target="_blank" rel="noreferrer">
          {sources[sourceId].name}
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}

function ContentSection({ sectionId }: { sectionId: string }) {
  if (sectionId === "blueprint") {
    return (
      <div className="content-grid">
        <InfoBlock
          icon={<Trophy size={20} />}
          title="What gets combined"
          items={[
            "Version 1 contributes portal-readiness: showcase flow, clear course architecture, download/export idea and student-facing learning order.",
            "Version 2 contributes depth: research-first content, trend traps, India conversion, visuals and source transparency.",
            "Version 3 adds software behaviour: gated sections, MCQ slides, recall scoring, analytics payload and AI discussion mode.",
          ]}
        />
        <InfoBlock
          icon={<Target size={20} />}
          title="How it will look"
          items={[
            "Left side: section rail with completion ticks.",
            "Center: one active learning section only, with visuals, concepts and official source chips.",
            "Inside quiz sections: one complete question per slide, A/B/C/D options, selected-answer feedback and final report modal.",
          ]}
        />
        <div className="image-panel">
          <img src="/upsc-assets/plate-tectonics-v2-hero.png" alt="Plate tectonics cross-section visual" />
          <div>
            <strong>Student journey</strong>
            <p>
              Learn the mechanism, solve the trap, recall the section, then ask the discussion panel to convert
              doubt into a UPSC-style explanation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sectionId === "evidence") {
    return (
      <div className="content-stack">
        <div className="timeline">
          {[
            ["1596", "Ortelius notices continental fit possibility."],
            ["1912", "Wegener presents continental drift theory."],
            ["1960s", "Ocean-floor mapping and paleomagnetism make the theory testable."],
            ["Now", "UPSC asks evidence plus mechanism plus exception traps."],
          ].map(([year, text]) => (
            <div key={year} className="timeline-item">
              <strong>{year}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="concept-cards">
          <ConceptCard title="Jig-saw fit" text="Best understood through continental shelves, not only modern coastlines that have been modified." />
          <ConceptCard title="Tillite" text="Glacial deposits connect Gondwana landmasses and become a palaeoclimate clue." />
          <ConceptCard title="Fossils" text="Mesosaurus and Glossopteris are not names to memorise only; the question is why their distribution matters." />
          <ConceptCard title="Later proof" text="Paleomagnetism and sea-floor spreading solved the missing mechanism problem in Wegener's model." />
        </div>
      </div>
    );
  }

  if (sectionId === "motion") {
    return (
      <div className="content-stack">
        <div className="flow-strip">
          {[
            ["Mantle heat", "creates convection and density contrasts"],
            ["Ridge", "lava rises and new crust is formed"],
            ["Magnetic stripes", "record normal/reversed polarity as basalt cools"],
            ["Trench", "old dense oceanic crust is consumed"],
          ].map(([head, body]) => (
            <div key={head}>
              <strong>{head}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
        <InfoBlock
          icon={<Lightbulb size={20} />}
          title="The UPSC-safe chain"
          items={[
            "Ridge is construction; trench is consumption.",
            "Oceanic crust is younger near ridges and older away from them.",
            "Magnetic reversal evidence is not a separate theory; it is proof that spreading happened over time.",
          ]}
        />
      </div>
    );
  }

  if (sectionId === "boundaries") {
    return (
      <div className="boundary-table">
        {[
          ["Divergent", "Plates move apart", "Rift valley, mid-oceanic ridge, new crust", "Do not attach deep-focus subduction quakes."],
          ["Oceanic-oceanic convergent", "One oceanic plate subducts", "Trench, island arc, earthquakes", "Do not call it fold mountain collision."],
          ["Oceanic-continental convergent", "Oceanic plate subducts below continent", "Trench, continental volcanic arc, quakes", "Do not forget oceanic crust is denser."],
          ["Continental-continental convergent", "Buoyant crust collides", "Fold mountains, crustal thickening", "Do not overstate volcanic arcs."],
          ["Transform", "Plates slide past each other", "Strike-slip faults, shallow quakes", "Do not call it crust creation."],
        ].map(([type, motion, output, trap]) => (
          <div key={type} className="boundary-row">
            <strong>{type}</strong>
            <span>{motion}</span>
            <span>{output}</span>
            <em>{trap}</em>
          </div>
        ))}
      </div>
    );
  }

  if (sectionId === "india") {
    return (
      <div className="india-grid">
        <div className="image-panel">
          <img src="/upsc-assets/plate-tectonics-v2-india-tethys.png" alt="Indian plate Tethys Himalaya visual" />
        </div>
        <InfoBlock
          icon={<Target size={20} />}
          title="India conversion model"
          items={[
            "Gondwana breakup places India as a drifting fragment in the southern-hemisphere story.",
            "Northward movement of the Indian Plate closes the Tethys and produces India-Eurasia collision.",
            "Tethys sediments explain why Himalayan geology is not only 'mountain uplift' but also a sedimentary archive.",
            "Deccan Traps must be separated from Himalayan collision; keep hotspot/flood-basalt reasoning independent.",
          ]}
        />
      </div>
    );
  }

  if (sectionId === "current") {
    return (
      <div className="content-grid">
        <InfoBlock
          icon={<BarChart3 size={20} />}
          title="Current affairs to static concept"
          items={[
            "Earthquake event -> identify plate boundary or fault setting.",
            "Boundary -> identify motion: subduction, collision, lateral slip or spreading.",
            "Motion -> identify landform and hazard: trench, arc, fold belt, fault, shallow/deep focus.",
            "UPSC trap -> check whether the statement mixes the wrong boundary outcome.",
          ]}
        />
        <div className="concept-cards">
          <ConceptCard title="Myanmar/Sagaing logic" text="Transform-style lateral faulting can be converted into transform-boundary reasoning." />
          <ConceptCard title="Japan/Noto logic" text="Subduction-margin regions train trench, arc and earthquake-depth reasoning." />
          <ConceptCard title="Himalayan logic" text="Collision belts train fold mountain, thrust fault and seismic risk reasoning." />
          <ConceptCard title="Kamchatka logic" text="Arc-volcanism regions train oceanic subduction and Pacific Ring of Fire associations." />
        </div>
      </div>
    );
  }

  if (sectionId === "sources") {
    return (
      <div className="source-desk">
        {Object.entries(sources).map(([id, source]) => (
          <a key={id} href={source.url} target="_blank" rel="noreferrer" className="source-card">
            <FileText size={20} />
            <strong>{source.name}</strong>
            <span>{source.use}</span>
            <em>
              Open source
              <ExternalLink size={13} />
            </em>
          </a>
        ))}
      </div>
    );
  }

  return null;
}

function InfoBlock({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div className="info-block">
      <h3>
        {icon}
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ConceptCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="concept-card">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function QuizSlider({
  mode,
  questions,
  currentIndex,
  answers,
  summary,
  onAnswer,
  onIndexChange,
  onFinish,
  onReset,
}: {
  mode: QuizMode;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, OptionKey>;
  summary: QuizSummary;
  onAnswer: (mode: QuizMode, questionId: string, key: OptionKey) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  onReset: () => void;
}) {
  const question = questions[currentIndex];
  const selected = answers[question.id];
  const selectedOption = selected ? question.options.find((option) => option.key === selected) : null;
  const canGoNext = currentIndex < questions.length - 1;
  const modeLabel = mode === "pyq" ? "PYQ pattern" : "Practice";

  return (
    <div className="quiz-lab">
      <div className="quiz-topline">
        <span>{modeLabel} slide {currentIndex + 1} of {questions.length}</span>
        <span>{summary.correct}/{summary.attempted || 0} correct attempted</span>
      </div>

      <div className="question-card">
        <p className="question-source">{question.sourceLabel}</p>
        <h3>{question.title}</h3>
        <p className="stem">{question.stem}</p>
        <ol className="statements">
          {question.statements.map((statement) => (
            <li key={statement}>{statement.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>

        <div className="option-grid" role="list">
          {question.options.map((option) => (
            <button
              type="button"
              role="listitem"
              key={option.key}
              className={`option ${selected === option.key ? "selected" : ""} ${
                selected && option.isCorrect ? "correct" : ""
              } ${selected === option.key && !option.isCorrect ? "wrong" : ""}`}
              onClick={() => onAnswer(mode, question.id, option.key)}
            >
              <strong>{option.key}</strong>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedOption ? (
        <div className={`answer-panel ${selectedOption.isCorrect ? "right" : "needs-work"}`}>
          <h4>
            {selectedOption.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            Selected {selected}: {selectedOption.isCorrect ? "Correct" : "Needs correction"}
          </h4>
          <p>{selectedOption.feedback}</p>
          <div className="explain-grid">
            <div>
              <strong>Purpose of the question</strong>
              <span>{question.purpose}</span>
            </div>
            <div>
              <strong>Trap</strong>
              <span>{question.trap}</span>
            </div>
            <div>
              <strong>Correct option</strong>
              <span>{question.answerKey}</span>
            </div>
          </div>
          <div className="statement-breakdown">
            {question.statementAnalysis.map((statement) => (
              <div key={statement.label} className={statement.verdict === "Correct" ? "ok" : "bad"}>
                <strong>{statement.label}: {statement.verdict}</strong>
                <span>{statement.why}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="answer-panel waiting">
          <h4>
            <Lightbulb size={18} />
            Solve first
          </h4>
          <p>Select A, B, C or D. The slide will then show option-specific feedback, statement analysis and the trap.</p>
        </div>
      )}

      <div className="quiz-controls">
        <button type="button" className="secondary" onClick={() => onIndexChange(Math.max(currentIndex - 1, 0))} disabled={currentIndex === 0}>
          <ArrowLeft size={18} />
          Previous
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          <RotateCcw size={18} />
          Reset Set
        </button>
        {canGoNext ? (
          <button type="button" onClick={() => onIndexChange(currentIndex + 1)} disabled={!selected}>
            Next Question
            <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={onFinish} disabled={summary.attempted < questions.length}>
            Submit Set + Show Report
            <Trophy size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function RecallLab({
  attempts,
  activeTopicId,
  recallText,
  result,
  onTopicChange,
  onTextChange,
  onEvaluate,
}: {
  attempts: RecallAttempt[];
  activeTopicId: string;
  recallText: string;
  result: RecallAttempt | null;
  onTopicChange: (topicId: string) => void;
  onTextChange: (text: string) => void;
  onEvaluate: () => void;
}) {
  const activeTopic = recallTopics.find((topic) => topic.id === activeTopicId) ?? recallTopics[0];

  return (
    <div className="recall-lab">
      <div className="recall-topic-list">
        {recallTopics.map((topic) => (
          <button
            type="button"
            key={topic.id}
            className={activeTopicId === topic.id ? "active" : ""}
            onClick={() => onTopicChange(topic.id)}
          >
            <span>{topic.level}</span>
            <strong>{topic.title}</strong>
          </button>
        ))}
      </div>

      <div className="recall-workspace">
        <div>
          <p className="question-source">{activeTopic.level} recall topic</p>
          <h3>{activeTopic.title}</h3>
          <p className="muted">
            Type whatever the student recalls. The prototype checks concept coverage against the V3 content map and highlights remembered and missing areas.
          </p>
        </div>
        <textarea
          value={recallText}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Example: Continental drift was proposed by Wegener. Pangaea split into Laurasia and Gondwana..."
        />
        <button type="button" onClick={onEvaluate} disabled={recallText.trim().length < 20}>
          Evaluate Recall
          <Brain size={18} />
        </button>
      </div>

      {result ? (
        <div className="recall-result">
          <div className="recall-score">
            <strong>{result.score}%</strong>
            <span>{result.score >= 60 ? "Recall is usable. Now sharpen missing links." : "Recall needs rebuilding before MCQ pressure."}</span>
          </div>
          <div className="recall-columns">
            <ChipList title="Recalled" items={result.matched} tone="green" />
            <ChipList title="Need to remember" items={result.missing} tone="amber" />
          </div>
          <div className="coverage-map">
            {result.sections.map((section) => (
              <span key={section.label} className={section.status}>
                {section.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="attempt-list">
        <h4>Saved recall attempts</h4>
        {attempts.length === 0 ? (
          <p className="muted">No recall attempt yet. Once evaluated, this feeds the student profile payload.</p>
        ) : (
          attempts.slice(0, 5).map((attempt) => (
            <div key={attempt.id}>
              <strong>{attempt.topicTitle}</strong>
              <span>{attempt.score}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ChipList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  return (
    <div className="chip-list">
      <strong>{title}</strong>
      <div>
        {items.length === 0 ? (
          <span className={`mini-chip ${tone}`}>Nothing yet</span>
        ) : (
          items.map((item) => (
            <span key={item} className={`mini-chip ${tone}`}>
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function DiscussionDock({
  section,
  question,
  reply,
  onQuestionChange,
  onAsk,
}: {
  section: LearningSection;
  question: string;
  reply: string;
  onQuestionChange: (question: string) => void;
  onAsk: (question?: string) => void;
}) {
  const prompts = [
    `Explain the UPSC trap in ${section.label}`,
    `Ask me one 3-statement MCQ from ${section.label}`,
    `Connect ${section.label} with current affairs`,
  ];

  return (
    <section className="discussion-dock">
      <div className="dock-head">
        <MessageCircle size={19} />
        <div>
          <strong>AI Discussion Mode</strong>
          <span>Prototype tutor panel. Later this can call the portal AI API and save chat history.</span>
        </div>
      </div>
      <div className="prompt-row">
        {prompts.map((prompt) => (
          <button type="button" key={prompt} onClick={() => onAsk(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="ask-row">
        <input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask a doubt, request an MCQ, or ask for a trap explanation..."
        />
        <button type="button" onClick={() => onAsk()}>
          Ask
        </button>
      </div>
      {reply ? <p className="discussion-reply">{reply}</p> : null}
    </section>
  );
}

function ReportModal({
  mode,
  summary,
  onClose,
  onReset,
}: {
  mode: QuizMode;
  summary: QuizSummary;
  onClose: () => void;
  onReset: () => void;
}) {
  const title = mode === "pyq" ? "PYQ Pattern Report" : "Practice MCQ Report";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="report-modal">
        <div className="modal-title">
          <Trophy size={24} />
          <div>
            <h3>{title}</h3>
            <p>Saved into local prototype analytics and ready for profile/backend wiring.</p>
          </div>
        </div>
        <div className="report-metrics">
          <Metric label="Score" value={`${summary.correct}/${summary.total}`} note={`${summary.accuracy}% accuracy`} />
          <Metric label="Attempted" value={`${summary.attempted}/${summary.total}`} note="All slides submitted" />
          <Metric label="Weak zones" value={`${summary.weakTags.length}`} note={summary.weakTags.slice(0, 2).join(", ") || "None"} />
        </div>
        <ChipList title="Strong topics" items={summary.strongTags} tone="green" />
        <ChipList title="Revision topics" items={summary.weakTags} tone="amber" />
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onReset}>
            Reset This Set
          </button>
          <button type="button" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

function buildQuizSummary(
  questions: QuizQuestion[],
  answers: Record<string, OptionKey>,
): QuizSummary {
  const attemptedQuestions = questions.filter((question) => answers[question.id]);
  const correctQuestions = attemptedQuestions.filter((question) => answers[question.id] === question.answerKey);
  const wrongQuestions = attemptedQuestions.filter((question) => answers[question.id] !== question.answerKey);
  const weakTags = unique(wrongQuestions.flatMap((question) => question.topicTags));
  const strongTags = unique(correctQuestions.flatMap((question) => question.topicTags));

  return {
    total: questions.length,
    attempted: attemptedQuestions.length,
    correct: correctQuestions.length,
    accuracy:
      attemptedQuestions.length === 0
        ? 0
        : Math.round((correctQuestions.length / attemptedQuestions.length) * 100),
    weakTags,
    strongTags,
  };
}

function evaluateRecall(topic: RecallTopic, text: string): RecallAttempt {
  const normalised = text.toLowerCase();
  const matchedChecks = topic.checks.filter((check) =>
    check.aliases.some((alias) => normalised.includes(alias.toLowerCase())),
  );
  const matchedLabels = matchedChecks.map((check) => check.label);
  const missingLabels = topic.checks
    .filter((check) => !matchedLabels.includes(check.label))
    .map((check) => check.label);
  const sectionsToCheck = unique(topic.checks.map((check) => check.section));
  const sections = sectionsToCheck.map((label) => ({
    label,
    status: matchedChecks.some((check) => check.section === label) ? "recalled" as const : "revise" as const,
  }));

  return {
    id: `${topic.id}-${Date.now()}`,
    topicId: topic.id,
    topicTitle: topic.title,
    score: Math.round((matchedLabels.length / topic.checks.length) * 100),
    matched: matchedLabels,
    missing: missingLabels,
    sections,
    createdAt: new Date().toISOString(),
  };
}

function buildDiscussionReply(question: string, section: LearningSection) {
  const lower = question.toLowerCase();
  if (lower.includes("mcq")) {
    return `MCQ mode for ${section.label}: create three statements where two are conceptually close and one has a mechanism error. The strongest trap here is to mix boundary name, movement and landform output.`;
  }
  if (lower.includes("trap")) {
    return `Trap lens for ${section.label}: UPSC will rarely ask only definitions. It will change one process word, for example ridge vs trench, hotspot vs boundary, collision vs subduction, or evidence name vs evidence reason.`;
  }
  if (lower.includes("current")) {
    return `Current-affairs conversion for ${section.label}: start with the event location, identify boundary/fault setting, map the motion, then attach landform and hazard signature. This makes the event reusable for 2027.`;
  }
  return `For ${section.label}, explain the idea in this chain: definition -> mechanism -> evidence -> India/current example -> likely UPSC trap. That chain is what V3 is training the student to reproduce.`;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

const css = `
  .v3-shell {
    min-height: 100vh;
    background:
      linear-gradient(120deg, rgba(231, 246, 240, 0.86), rgba(233, 245, 255, 0.82)),
      ${theme.soft};
    color: ${theme.ink};
    font-family: var(--font-sans, "Inter", "Segoe UI", sans-serif);
    padding: 24px;
  }

  .v3-shell * {
    box-sizing: border-box;
    letter-spacing: 0;
  }

  .v3-shell button,
  .v3-shell input,
  .v3-shell textarea {
    font: inherit;
  }

  .v3-shell button {
    border: 0;
    border-radius: 8px;
    background: ${theme.primary};
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 10px 15px;
    cursor: pointer;
    font-weight: 750;
  }

  .v3-shell button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .v3-shell .secondary,
  .v3-shell .ghost {
    background: white;
    color: ${theme.primary};
    border: 1px solid ${theme.line};
  }

  .v3-hero,
  .learning-layout {
    max-width: 1360px;
    margin: 0 auto;
  }

  .v3-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 20px;
    align-items: stretch;
    padding: 18px 0 22px;
  }

  .hero-main,
  .analytics-panel,
  .section-card,
  .section-rail {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid ${theme.line};
    border-radius: 8px;
    box-shadow: 0 16px 44px rgba(22, 74, 91, 0.12);
  }

  .hero-main {
    padding: 28px;
  }

  .version-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }

  .version-nav a {
    color: ${theme.primary};
    border: 1px solid ${theme.line};
    background: ${theme.white};
    border-radius: 999px;
    padding: 8px 12px;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 750;
  }

  .version-nav a.active {
    background: ${theme.primary};
    color: white;
    border-color: ${theme.primary};
  }

  .eyebrow {
    color: ${theme.teal};
    font-weight: 850;
    text-transform: uppercase;
    font-size: 0.78rem;
    margin: 0 0 8px;
  }

  .v3-hero h1 {
    margin: 0;
    font-size: clamp(2.2rem, 4vw, 4.8rem);
    line-height: 1.02;
    max-width: 920px;
  }

  .hero-lead {
    color: ${theme.slate};
    font-size: 1.06rem;
    line-height: 1.7;
    max-width: 900px;
    margin: 18px 0;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .analytics-panel {
    padding: 22px;
    display: grid;
    gap: 12px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 850;
    color: ${theme.primary};
  }

  .metric {
    border: 1px solid ${theme.line};
    background: ${theme.soft};
    border-radius: 8px;
    padding: 12px;
    display: grid;
    gap: 3px;
  }

  .metric span,
  .metric small {
    color: ${theme.slate};
  }

  .metric strong {
    color: ${theme.ink};
    font-size: 1.55rem;
  }

  .saved-chip {
    border: 1px solid rgba(35, 132, 95, 0.25);
    background: ${theme.mint};
    color: ${theme.green};
    border-radius: 8px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    overflow-wrap: anywhere;
  }

  .learning-layout {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .section-rail {
    padding: 14px;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
    overflow: auto;
  }

  .rail-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${theme.primary};
    font-weight: 850;
    padding: 8px;
  }

  .rail-item {
    width: 100%;
    justify-content: flex-start;
    background: transparent;
    color: ${theme.ink};
    border: 1px solid transparent;
    margin-top: 6px;
    padding: 10px;
  }

  .rail-item.active {
    background: ${theme.sky};
    border-color: rgba(35, 104, 162, 0.25);
  }

  .rail-item span:not(.step-number) {
    display: grid;
    gap: 2px;
    text-align: left;
    flex: 1;
  }

  .rail-item small {
    color: ${theme.slate};
    font-weight: 600;
  }

  .step-number {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: white;
    border: 1px solid ${theme.line};
    display: inline-grid;
    place-items: center;
    color: ${theme.teal};
    font-weight: 900;
  }

  .section-card {
    padding: 24px;
    min-height: 660px;
  }

  .section-head {
    border-bottom: 1px solid ${theme.line};
    padding-bottom: 18px;
    margin-bottom: 20px;
  }

  .section-head h2 {
    margin: 0;
    font-size: clamp(1.6rem, 2.5vw, 2.7rem);
  }

  .section-head p:not(.eyebrow) {
    color: ${theme.slate};
    line-height: 1.6;
    max-width: 900px;
  }

  .source-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .source-chips a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${theme.line};
    color: ${theme.primary};
    background: white;
    text-decoration: none;
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 0.78rem;
    font-weight: 750;
  }

  .content-grid,
  .india-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .content-stack {
    display: grid;
    gap: 16px;
  }

  .info-block,
  .concept-card,
  .image-panel,
  .question-card,
  .answer-panel,
  .discussion-dock,
  .recall-workspace,
  .recall-result,
  .attempt-list {
    border: 1px solid ${theme.line};
    background: white;
    border-radius: 8px;
    padding: 18px;
  }

  .info-block h3 {
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${theme.primary};
  }

  .info-block ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 10px;
    color: ${theme.slate};
    line-height: 1.55;
  }

  .image-panel {
    display: grid;
    gap: 12px;
    align-content: start;
    overflow: hidden;
  }

  .image-panel img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid ${theme.line};
  }

  .image-panel p,
  .concept-card p,
  .muted {
    color: ${theme.slate};
    line-height: 1.55;
    margin-bottom: 0;
  }

  .concept-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .concept-card strong {
    color: ${theme.primary};
  }

  .timeline {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .timeline-item {
    border: 1px solid ${theme.line};
    background: ${theme.sky};
    border-radius: 8px;
    padding: 14px;
    display: grid;
    gap: 8px;
  }

  .timeline-item strong {
    font-size: 1.35rem;
    color: ${theme.blue};
  }

  .timeline-item span,
  .flow-strip span {
    color: ${theme.slate};
    line-height: 1.45;
  }

  .flow-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .flow-strip div {
    border: 1px solid ${theme.line};
    background: ${theme.mint};
    border-radius: 8px;
    padding: 14px;
    display: grid;
    gap: 7px;
  }

  .flow-strip strong {
    color: ${theme.green};
  }

  .boundary-table {
    display: grid;
    gap: 10px;
  }

  .boundary-row {
    display: grid;
    grid-template-columns: 190px 1fr 1.4fr 1.2fr;
    gap: 12px;
    align-items: start;
    border: 1px solid ${theme.line};
    background: white;
    border-radius: 8px;
    padding: 14px;
  }

  .boundary-row strong {
    color: ${theme.primary};
  }

  .boundary-row span {
    color: ${theme.slate};
  }

  .boundary-row em {
    color: ${theme.amber};
    font-style: normal;
    font-weight: 750;
  }

  .source-desk {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .source-card {
    border: 1px solid ${theme.line};
    background: white;
    border-radius: 8px;
    padding: 16px;
    text-decoration: none;
    color: ${theme.ink};
    display: grid;
    gap: 8px;
  }

  .source-card svg {
    color: ${theme.teal};
  }

  .source-card span {
    color: ${theme.slate};
    line-height: 1.45;
  }

  .source-card em {
    color: ${theme.primary};
    display: inline-flex;
    gap: 5px;
    align-items: center;
    font-style: normal;
    font-weight: 800;
  }

  .quiz-lab {
    display: grid;
    gap: 14px;
  }

  .quiz-topline {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    color: ${theme.slate};
    font-weight: 750;
  }

  .question-source {
    color: ${theme.teal};
    font-weight: 850;
    margin: 0 0 8px;
    font-size: 0.86rem;
  }

  .question-card h3 {
    margin: 0 0 12px;
    font-size: 1.45rem;
  }

  .stem {
    color: ${theme.ink};
    font-weight: 720;
    line-height: 1.55;
  }

  .statements {
    display: grid;
    gap: 10px;
    margin: 14px 0;
    padding-left: 22px;
    color: ${theme.slate};
    line-height: 1.55;
  }

  .option-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .option {
    justify-content: flex-start;
    text-align: left;
    min-height: 64px;
    background: ${theme.soft};
    color: ${theme.ink};
    border: 1px solid ${theme.line};
  }

  .option strong {
    min-width: 32px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-grid;
    place-items: center;
    background: white;
    color: ${theme.primary};
    border: 1px solid ${theme.line};
  }

  .option.selected {
    border-color: ${theme.blue};
    background: ${theme.sky};
  }

  .option.correct {
    border-color: rgba(35, 132, 95, 0.45);
  }

  .option.wrong {
    border-color: rgba(180, 35, 24, 0.42);
    background: ${theme.rose};
  }

  .answer-panel h4 {
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .answer-panel p {
    color: ${theme.slate};
    line-height: 1.55;
  }

  .answer-panel.right {
    background: ${theme.mint};
    border-color: rgba(35, 132, 95, 0.35);
  }

  .answer-panel.needs-work {
    background: ${theme.rose};
    border-color: rgba(180, 35, 24, 0.28);
  }

  .answer-panel.waiting {
    background: ${theme.sand};
  }

  .explain-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .explain-grid div,
  .statement-breakdown div {
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(216, 231, 234, 0.8);
    border-radius: 8px;
    padding: 12px;
    display: grid;
    gap: 5px;
  }

  .explain-grid span,
  .statement-breakdown span {
    color: ${theme.slate};
    line-height: 1.45;
  }

  .statement-breakdown {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .statement-breakdown .ok strong {
    color: ${theme.green};
  }

  .statement-breakdown .bad strong {
    color: ${theme.red};
  }

  .quiz-controls,
  .section-controls,
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .discussion-dock {
    margin-top: 18px;
    display: grid;
    gap: 12px;
    background: linear-gradient(135deg, ${theme.sky}, white);
  }

  .dock-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dock-head strong {
    display: block;
    color: ${theme.primary};
  }

  .dock-head span {
    color: ${theme.slate};
    font-size: 0.9rem;
  }

  .prompt-row,
  .ask-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .prompt-row button {
    background: white;
    color: ${theme.primary};
    border: 1px solid ${theme.line};
    min-height: 36px;
    font-size: 0.85rem;
  }

  .ask-row input {
    flex: 1;
    min-width: 240px;
    border: 1px solid ${theme.line};
    border-radius: 8px;
    padding: 11px 12px;
  }

  .discussion-reply {
    background: white;
    border: 1px solid ${theme.line};
    border-radius: 8px;
    padding: 12px;
    color: ${theme.slate};
    line-height: 1.55;
    margin: 0;
  }

  .section-controls {
    margin-top: 18px;
    border-top: 1px solid ${theme.line};
    padding-top: 18px;
  }

  .recall-lab {
    display: grid;
    gap: 14px;
  }

  .recall-topic-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .recall-topic-list button {
    display: grid;
    text-align: left;
    justify-content: stretch;
    background: white;
    color: ${theme.ink};
    border: 1px solid ${theme.line};
    min-height: 78px;
  }

  .recall-topic-list button.active {
    background: ${theme.mint};
    border-color: rgba(35, 132, 95, 0.35);
  }

  .recall-topic-list span {
    color: ${theme.teal};
    font-size: 0.78rem;
    font-weight: 850;
  }

  .recall-workspace {
    display: grid;
    gap: 12px;
  }

  .recall-workspace textarea {
    width: 100%;
    min-height: 150px;
    resize: vertical;
    border: 1px solid ${theme.line};
    border-radius: 8px;
    padding: 12px;
    line-height: 1.5;
  }

  .recall-result {
    display: grid;
    gap: 14px;
    background: ${theme.soft};
  }

  .recall-score {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .recall-score strong {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    display: inline-grid;
    place-items: center;
    background: ${theme.primary};
    color: white;
    font-size: 1.7rem;
  }

  .recall-score span {
    color: ${theme.slate};
    line-height: 1.5;
  }

  .recall-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .chip-list {
    display: grid;
    gap: 9px;
  }

  .chip-list div {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .mini-chip {
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 0.82rem;
    font-weight: 780;
  }

  .mini-chip.green {
    background: ${theme.mint};
    color: ${theme.green};
  }

  .mini-chip.amber {
    background: ${theme.sand};
    color: ${theme.amber};
  }

  .coverage-map {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .coverage-map span {
    padding: 8px 10px;
    border-radius: 8px;
    font-weight: 760;
  }

  .coverage-map .recalled {
    background: ${theme.mint};
    color: ${theme.green};
  }

  .coverage-map .revise {
    background: ${theme.sand};
    color: ${theme.amber};
  }

  .attempt-list {
    display: grid;
    gap: 8px;
  }

  .attempt-list h4 {
    margin: 0;
  }

  .attempt-list > div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid ${theme.line};
    padding-top: 8px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(17, 31, 39, 0.42);
    display: grid;
    place-items: center;
    padding: 20px;
    z-index: 30;
  }

  .report-modal {
    width: min(720px, 100%);
    background: white;
    border-radius: 8px;
    border: 1px solid ${theme.line};
    box-shadow: 0 24px 80px rgba(15, 44, 59, 0.25);
    padding: 22px;
    display: grid;
    gap: 16px;
  }

  .modal-title {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .modal-title svg {
    color: ${theme.amber};
  }

  .modal-title h3,
  .modal-title p {
    margin: 0;
  }

  .modal-title p {
    color: ${theme.slate};
  }

  .report-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  @media (max-width: 980px) {
    .v3-shell {
      padding: 14px;
    }

    .v3-hero,
    .learning-layout,
    .content-grid,
    .india-grid,
    .timeline,
    .flow-strip,
    .recall-topic-list,
    .report-metrics {
      grid-template-columns: 1fr;
    }

    .section-rail {
      position: static;
      max-height: none;
    }

    .boundary-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .section-card,
    .hero-main,
    .analytics-panel {
      padding: 16px;
    }

    .concept-cards,
    .option-grid,
    .explain-grid,
    .recall-columns {
      grid-template-columns: 1fr;
    }

    .quiz-controls,
    .section-controls,
    .modal-actions,
    .hero-actions {
      justify-content: stretch;
    }

    .quiz-controls button,
    .section-controls button,
    .modal-actions button,
    .hero-actions button {
      width: 100%;
    }
  }
`;

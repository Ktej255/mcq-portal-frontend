export type GeographyModuleSectionKind =
  | "basic"
  | "ncert"
  | "advanced"
  | "trap"
  | "current"
  | "pyq"
  | "mcq"
  | "quick-recall"
  | "handoff";

export type GeographyModuleImage = {
  url?: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export type GeographyExpectedRecallPoint = {
  id: string;
  label: string;
  detail: string;
  keywords: string[];
  sectionId: string;
};

export type GeographyContentModuleSection = {
  id: string;
  order: number;
  kind: GeographyModuleSectionKind;
  title: string;
  eyebrow: string;
  estimatedMinutes: number;
  body: string;
  bullets: string[];
  expectedRecallPoints: GeographyExpectedRecallPoint[];
  image?: GeographyModuleImage;
  sourceNote?: string;
};

export type GeographyContentModule = {
  id: string;
  subjectSlug: "geography";
  day: number;
  cluster: string;
  title: string;
  subtitle: string;
  status: "sample-layout" | "draft" | "approved";
  topicIds: number[];
  sourceLabel: string;
  sections: GeographyContentModuleSection[];
};

export type GeographyKnownConcept = {
  id: string;
  label: string;
  detail: string;
  sectionId: string;
  evidence: string;
};

export type GeographyMissingConcept = {
  id: string;
  label: string;
  detail: string;
  sectionId: string;
  repairPrompt: string;
};

export type GeographyModuleRecallAssessment = {
  moduleId: string;
  sectionId: string;
  cumulativeSectionIds: string[];
  knownConcepts: GeographyKnownConcept[];
  missingConcepts: GeographyMissingConcept[];
  initialKnownPercent: number;
  currentMasteryPercent: number;
  gapFilledPercent: number;
  remainingGapPercent: number;
  nextUnlockedSectionId?: string;
  allSectionsCleared: boolean;
  summary: string;
  repairPrompt: string;
};

export type GeographyModuleReadinessStatus = "complete" | "partial" | "missing";

export type GeographyModuleReadinessChecklistItem = {
  id: "approval" | "media" | "pyq" | "mcq" | "recall-points";
  label: string;
  status: GeographyModuleReadinessStatus;
  detail: string;
  nextAction: string;
};

export type GeographyModuleReadinessSummary = {
  moduleId: string;
  day: number;
  title: string;
  status: GeographyModuleReadinessStatus;
  score: number;
  complete: number;
  partial: number;
  missing: number;
  sectionCount: number;
  checklist: GeographyModuleReadinessChecklistItem[];
  missingActions: string[];
};

function point(
  sectionId: string,
  id: string,
  label: string,
  detail: string,
  keywords: string[]
): GeographyExpectedRecallPoint {
  return { id, label, detail, keywords, sectionId };
}

export const geographyContentModules: GeographyContentModule[] = [
  {
    id: "universe-cluster-1",
    subjectSlug: "geography",
    day: 2,
    cluster: "Cluster 1",
    title: "Universe and Solar System",
    subtitle: "Origin of Universe, evidence, traps, PYQ logic, and UPSC-ready recall.",
    status: "sample-layout",
    topicIds: [1],
    sourceLabel: "Universe_Cluster1_SaritClasses.pdf sample layout",
    sections: [
      {
        id: "why-it-matters",
        order: 1,
        kind: "basic",
        title: "Why This Topic Matters",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Universe questions look simple, but UPSC tests evidence, terms, chronology, and statement traps. The student must connect Big Bang, expanding space, CMB, redshift, galaxies, solar system formation, and Earth evolution as one chain.",
        bullets: [
          "Static NCERT basics often become statement-based prelims traps.",
          "Current space missions make old Universe concepts newly testable.",
          "The exam punishes isolated facts such as age, discoverer, or object name when the mechanism is missing.",
        ],
        expectedRecallPoints: [
          point(
            "why-it-matters",
            "upsc-universe-relevance",
            "UPSC relevance",
            "Universe is a static topic that can be tested through evidence, terms, current missions, and statement traps.",
            ["upsc", "evidence", "statement", "trap", "current", "mission"]
          ),
          point(
            "why-it-matters",
            "connected-chain",
            "Connected chain",
            "The answer should connect Universe origin with solar-system and Earth evolution, not list disconnected facts.",
            ["connect", "chain", "solar", "earth", "origin", "evolution"]
          ),
        ],
        image: {
          alt: "Cosmic microwave background map representing early-universe evidence",
          credit: "NASA/WMAP Science Team",
          license: "NASA imagery generally available for educational use with attribution",
          sourceUrl: "https://map.gsfc.nasa.gov/media/121238/index.html",
          url: "https://map.gsfc.nasa.gov/media/121238/ilc_9yr_moll4096.png",
        },
      },
      {
        id: "basic-core",
        order: 2,
        kind: "basic",
        title: "Basic Core Concept",
        eyebrow: "Big Bang and evidence",
        estimatedMinutes: 4,
        body:
          "The Big Bang means the expansion of space from an extremely hot and dense early state. It was not an explosion into already empty space. As the Universe expanded and cooled, particles and light elements formed. CMB and redshift are the two evidence anchors students must remember.",
        bullets: [
          "Big Bang is expansion of space, not a blast inside space.",
          "Hydrogen and helium formed early as the Universe cooled.",
          "Redshift shows most galaxies are moving away from us.",
          "CMB is leftover heat from the early Universe.",
        ],
        expectedRecallPoints: [
          point(
            "basic-core",
            "big-bang-expansion",
            "Big Bang as expansion",
            "Big Bang should be described as expansion of space from a hot dense state.",
            ["big bang", "expansion", "space", "hot", "dense"]
          ),
          point(
            "basic-core",
            "not-explosion",
            "Not explosion into empty space",
            "The trap is saying Big Bang exploded into already existing empty space.",
            ["not", "explosion", "empty space", "trap"]
          ),
          point(
            "basic-core",
            "cmb-redshift",
            "CMB and redshift evidence",
            "CMB and redshift are core evidence anchors for an expanding Universe.",
            ["cmb", "cosmic microwave", "redshift", "evidence"]
          ),
        ],
      },
      {
        id: "ncert-reference",
        order: 3,
        kind: "ncert",
        title: "NCERT Reference Path",
        eyebrow: "What to read",
        estimatedMinutes: 3,
        body:
          "Use NCERT Class XI Fundamentals of Physical Geography, Chapter 2, for the Universe, solar system, and Earth-origin foundation. The web module should not replace source reading; it should tell the student exactly what to read and how UPSC may twist it.",
        bullets: [
          "Read the Universe and solar-system formation section first.",
          "Mark age of Universe, age of Earth, CMB, redshift, galaxies, and solar nebula.",
          "Convert every fact into one statement-trap possibility.",
        ],
        expectedRecallPoints: [
          point(
            "ncert-reference",
            "ncert-source",
            "NCERT source path",
            "Class XI Fundamentals of Physical Geography Chapter 2 is the base source for Universe and Earth origin.",
            ["ncert", "class xi", "fundamentals", "physical geography", "chapter 2"]
          ),
          point(
            "ncert-reference",
            "source-to-trap",
            "Source to trap conversion",
            "Source reading should become statement-trap logic, not passive rereading.",
            ["source", "read", "statement", "trap", "upsc"]
          ),
        ],
      },
      {
        id: "advanced-depth",
        order: 4,
        kind: "advanced",
        title: "Advanced Depth",
        eyebrow: "Beyond basic recall",
        estimatedMinutes: 5,
        body:
          "Advanced recall should compare Big Bang with Steady State theory, explain redshift and blueshift, recognize that CMB weakened Steady State, and avoid overclaiming terms like singularity, event horizon, string theory, and standard model.",
        bullets: [
          "Steady State proposed continuous creation and an unchanging large-scale Universe.",
          "CMB strongly supports the hot early Universe model.",
          "Redshift is common for distant galaxies; blueshift is possible for some nearby motion.",
          "Do not confuse black-hole singularity with the early-Universe singularity.",
        ],
        expectedRecallPoints: [
          point(
            "advanced-depth",
            "steady-state-comparison",
            "Steady State comparison",
            "Steady State differs from Big Bang because it keeps large-scale density steady through continuous creation.",
            ["steady state", "continuous", "creation", "big bang"]
          ),
          point(
            "advanced-depth",
            "redshift-blueshift",
            "Redshift and blueshift",
            "Redshift means stretching of wavelength; blueshift can occur for approaching objects.",
            ["redshift", "blueshift", "wavelength", "approach"]
          ),
          point(
            "advanced-depth",
            "singularity-precision",
            "Singularity precision",
            "Singularity language needs precision and should not be reduced only to black holes.",
            ["singularity", "black hole", "early universe", "precision"]
          ),
        ],
      },
      {
        id: "examiner-traps",
        order: 5,
        kind: "trap",
        title: "Examiner Traps",
        eyebrow: "Statement correction",
        estimatedMinutes: 4,
        body:
          "This section trains the student to reject almost-correct statements. The safest recall pattern is: identify the wrong word, correct it, and explain why UPSC may use it as a trap.",
        bullets: [
          "Big Bang was not an explosion into empty space.",
          "CMB supports Big Bang and weakens Steady State.",
          "Universe age and Earth age are not the same.",
          "Not all galaxies show redshift from every observer context.",
          "Hubble popularized expansion evidence, but Lemaitre proposed the expanding Universe idea earlier.",
        ],
        expectedRecallPoints: [
          point(
            "examiner-traps",
            "age-trap",
            "Universe age vs Earth age",
            "The Universe is much older than Earth; mixing their ages is a common trap.",
            ["universe age", "earth age", "older", "trap"]
          ),
          point(
            "examiner-traps",
            "hubble-lemaitre",
            "Hubble and Lemaitre precision",
            "Recall should avoid giving all expansion-credit simplistically to Hubble.",
            ["hubble", "lemaitre", "expansion", "credit"]
          ),
          point(
            "examiner-traps",
            "cmb-steady-state",
            "CMB weakens Steady State",
            "CMB is a strong reason Steady State lost ground against Big Bang.",
            ["cmb", "steady state", "big bang", "evidence"]
          ),
        ],
      },
      {
        id: "current-affairs-bridge",
        order: 6,
        kind: "current",
        title: "Current Affairs Bridge",
        eyebrow: "Covered news only",
        estimatedMinutes: 4,
        body:
          "Current affairs should open only after static basics are covered. JWST, solar storms, coronal mass ejections, satellite risk, and Earth-axis type statements can all test whether the student understands evidence and physical mechanisms.",
        bullets: [
          "JWST is useful for early-galaxy and deep-space context.",
          "Solar storms and CME questions test Sun-Earth interaction, not only space news.",
          "Axis-shift or polar-ice statements require mechanism and scale checks.",
        ],
        expectedRecallPoints: [
          point(
            "current-affairs-bridge",
            "jwst-link",
            "JWST static-current link",
            "JWST news should connect to early galaxies, deep space, and evidence-based Universe study.",
            ["jwst", "galaxy", "deep space", "early"]
          ),
          point(
            "current-affairs-bridge",
            "cme-link",
            "CME and solar storms",
            "CME and solar-storm news should be tied to Sun-Earth interaction and satellite risk.",
            ["cme", "solar storm", "sun", "earth", "satellite"]
          ),
        ],
      },
      {
        id: "pyq-mcq-practice",
        order: 7,
        kind: "pyq",
        title: "PYQ and MCQ Practice Logic",
        eyebrow: "Question formats",
        estimatedMinutes: 5,
        body:
          "The student should identify how the same content appears across direct recall, multi-statement, how-many-correct, match-pair, assertion-reason, NOT/exception, and scenario questions.",
        bullets: [
          "Direct recall checks terms like CMB, redshift, galaxy, nebula, and light-year.",
          "Multi-statement questions test one wrong qualifier.",
          "Assertion-reason asks whether evidence really supports the explanation.",
          "Scenario questions connect space events with Earth systems and technology.",
        ],
        expectedRecallPoints: [
          point(
            "pyq-mcq-practice",
            "format-awareness",
            "MCQ format awareness",
            "The same Universe content must be recalled across direct, multi-statement, match, assertion, NOT, and scenario formats.",
            ["direct", "multi", "match", "assertion", "not", "scenario"]
          ),
          point(
            "pyq-mcq-practice",
            "qualifier-trap",
            "Qualifier trap",
            "Almost-correct statements usually fail because of one qualifier such as all, only, always, same, or never.",
            ["all", "only", "always", "same", "never", "qualifier"]
          ),
        ],
      },
      {
        id: "quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before the next module opens, the student should speak the whole Universe cluster in one connected answer: origin, evidence, comparison, traps, current bridge, and MCQ format.",
        bullets: [
          "Universe age is about 13.8 billion years; Earth age is about 4.5 billion years.",
          "CMB is about 2.7 K and is key evidence for the hot early Universe.",
          "Redshift supports expansion; Steady State is weakened by CMB evidence.",
          "Next handoff: connect solar-system formation with Earth differentiation.",
        ],
        expectedRecallPoints: [
          point(
            "quick-recall-handoff",
            "key-facts",
            "Key facts",
            "Recall the rough age contrast, CMB temperature, redshift, and Steady State contrast.",
            ["13.8", "4.5", "2.7", "redshift", "steady state"]
          ),
          point(
            "quick-recall-handoff",
            "next-handoff",
            "Next handoff",
            "The next link is solar-system formation and Earth differentiation.",
            ["solar system", "earth", "differentiation", "handoff"]
          ),
        ],
      },
    ],
  },
  {
    id: "landforms-cluster-day4",
    subjectSlug: "geography",
    day: 4,
    cluster: "Cluster 2",
    title: "Volcanoes, Rocks, and Landform Systems",
    subtitle: "Volcanoes, rock cycle, geomorphic process discipline, and agent-wise landforms.",
    status: "draft",
    topicIds: [5, 6, 7, 8, 9, 10, 11, 12],
    sourceLabel: "1. Geography topics.pdf Topics 5-12 draft web module",
    sections: [
      {
        id: "landforms-why-it-matters",
        order: 1,
        kind: "basic",
        title: "Why Landforms Matter",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Landform questions look like lists, but UPSC tests whether the student can connect agent, process, climate, rock type, slope, stage, and final feature. The safe pattern is process first, name later.",
        bullets: [
          "Volcano, rock, and landform facts become traps when process and product are mixed.",
          "The same agent can erode, transport, and deposit depending on energy.",
          "Map examples such as Deccan Traps, Narmada-Tapi rift, Himalayas, deserts, coasts, and caves make the concept exam-ready.",
        ],
        expectedRecallPoints: [
          point(
            "landforms-why-it-matters",
            "process-before-name",
            "Process before name",
            "Landforms should be explained through agent, process, condition, and result before naming examples.",
            ["process", "agent", "condition", "result", "landform"]
          ),
          point(
            "landforms-why-it-matters",
            "map-proof-landforms",
            "Map proof",
            "Recall should attach at least one landform idea to a real map cue or Indian example.",
            ["map", "india", "example", "deccan", "narmada", "coast", "desert"]
          ),
        ],
      },
      {
        id: "volcano-rock-core",
        order: 2,
        kind: "basic",
        title: "Volcanoes and Rock Cycle Core",
        eyebrow: "Internal forces",
        estimatedMinutes: 5,
        body:
          "Start with magma rising, lava cooling, and different eruption styles. Then connect igneous, sedimentary, and metamorphic rocks through the rock cycle. Indian examples are not decoration; they prove the concept spatially.",
        bullets: [
          "Magma is below the surface; lava is erupted at the surface.",
          "Shield, composite, cinder cone, and lava dome volcanoes differ by magma behavior and eruption style.",
          "Igneous, sedimentary, and metamorphic rocks transform through cooling, deposition, burial, heat, pressure, melting, and uplift.",
          "Use Deccan Traps basalt, Peninsular shield granites, Gondwana coal beds, Vindhyan sandstone, Delhi quartzite, and Rajasthan marble as proof examples.",
        ],
        expectedRecallPoints: [
          point(
            "volcano-rock-core",
            "magma-lava-volcano-types",
            "Magma, lava, and volcano types",
            "The answer should distinguish magma from lava and compare volcano types by formation or eruption style.",
            ["magma", "lava", "shield", "composite", "cinder", "dome"]
          ),
          point(
            "volcano-rock-core",
            "rock-cycle-transform",
            "Rock-cycle transformation",
            "Recall must explain how igneous, sedimentary, and metamorphic rocks transform into one another.",
            ["igneous", "sedimentary", "metamorphic", "rock cycle", "heat", "pressure"]
          ),
          point(
            "volcano-rock-core",
            "indian-rock-examples",
            "Indian rock examples",
            "Use at least two Indian examples such as Deccan basalt, Gondwana coal, Vindhyan sandstone, Delhi quartzite, or Rajasthan marble.",
            ["deccan", "gondwana", "vindhyan", "quartzite", "marble", "granite"]
          ),
        ],
      },
      {
        id: "geomorphic-process-discipline",
        order: 3,
        kind: "advanced",
        title: "Geomorphic Process Discipline",
        eyebrow: "Cause-process-result",
        estimatedMinutes: 5,
        body:
          "Geomorphology becomes manageable when the student separates endogenic relief creation from exogenic wearing down. Weathering is breakdown in place; erosion removes material; deposition builds new forms.",
        bullets: [
          "Endogenic forces include diastrophism and volcanism; exogenic forces include weathering, erosion, transport, and deposition.",
          "Physical, chemical, and biological weathering depend on climate, rock structure, water, and organisms.",
          "Mass movement is gravity-driven and includes creep, flow, slide, and fall.",
          "Peneplain, pediplain, pediment, mesa, butte, inselberg, scree, talus, horst, graben, anticline, and syncline are process-linked names, not isolated vocabulary.",
        ],
        expectedRecallPoints: [
          point(
            "geomorphic-process-discipline",
            "endogenic-exogenic",
            "Endogenic vs exogenic",
            "Recall should separate internal relief-building forces from external denudation forces.",
            ["endogenic", "exogenic", "diastrophism", "volcanism", "weathering", "erosion"]
          ),
          point(
            "geomorphic-process-discipline",
            "weathering-erosion-deposition",
            "Weathering, erosion, deposition",
            "The student must not confuse breakdown in place, removal, and deposition.",
            ["weathering", "erosion", "deposition", "transport", "breakdown"]
          ),
          point(
            "geomorphic-process-discipline",
            "structure-landform-links",
            "Structure-landform links",
            "Recall should link terms such as horst, graben, anticline, syncline, mesa, butte, or inselberg to their formation logic.",
            ["horst", "graben", "anticline", "syncline", "mesa", "butte", "inselberg"]
          ),
        ],
      },
      {
        id: "fluvial-landforms",
        order: 4,
        kind: "advanced",
        title: "Fluvial Landforms",
        eyebrow: "River energy",
        estimatedMinutes: 5,
        body:
          "A river changes its work from vertical erosion to lateral erosion to deposition as gradient and energy change downstream. Most traps come from mixing stage, process, and feature.",
        bullets: [
          "Upper course: V-shaped valley, gorge, canyon, waterfall, rapids, and interlocking spurs.",
          "Middle course: meander, ox-bow lake, flood plain, river cliff, and slip-off slope.",
          "Lower course: delta, estuary, levee, braided channel, backswamp, yazoo stream, and distributaries.",
          "Advanced traps include antecedent drainage, superimposed drainage, entrenched meanders, river terraces, rejuvenation, wind gap, water gap, misfit stream, and braided versus meandering rivers.",
        ],
        expectedRecallPoints: [
          point(
            "fluvial-landforms",
            "river-course-sequence",
            "River-course sequence",
            "Recall should connect upper, middle, and lower river courses with changing energy and landforms.",
            ["upper", "middle", "lower", "river", "course", "energy"]
          ),
          point(
            "fluvial-landforms",
            "delta-estuary-logic",
            "Delta and estuary logic",
            "The answer should explain delta versus estuary through sediment, tide, gradient, and river setting.",
            ["delta", "estuary", "sediment", "tide", "gradient"]
          ),
          point(
            "fluvial-landforms",
            "advanced-drainage-traps",
            "Advanced drainage traps",
            "Recall should mention one advanced trap such as antecedent drainage, superimposed drainage, rejuvenation, terraces, or misfit stream.",
            ["antecedent", "superimposed", "rejuvenation", "terrace", "misfit", "braided"]
          ),
        ],
      },
      {
        id: "glacial-aeolian-systems",
        order: 5,
        kind: "advanced",
        title: "Glacial and Aeolian Systems",
        eyebrow: "Ice and wind",
        estimatedMinutes: 5,
        body:
          "Ice and wind create very different landforms because their movement, load, and energy behavior differ. Glacial questions often link to Himalayan glaciers and GLOF, while aeolian questions link to deserts, loess, and flash-flood dry valleys.",
        bullets: [
          "Glacial erosional forms include cirque, arete, horn, U-shaped valley, hanging valley, fjord, and roche moutonnee.",
          "Glacial depositional forms include terminal, lateral, medial, and ground moraine, drumlin, esker, kame, and outwash plain.",
          "Aeolian erosional forms include deflation hollow, ventifact, yardang, pedestal rock, and zeugen.",
          "Aeolian depositional and desert forms include barchan, seif, transverse, parabolic, and star dunes, loess, desert pavement, bajada, playa, hamada, reg, erg, wadi, and oasis.",
        ],
        expectedRecallPoints: [
          point(
            "glacial-aeolian-systems",
            "glacial-erosion-deposition",
            "Glacial erosion and deposition",
            "Recall must separate glacial erosional forms from depositional forms.",
            ["glacial", "cirque", "arete", "moraine", "drumlin", "esker"]
          ),
          point(
            "glacial-aeolian-systems",
            "glof-current-bridge",
            "GLOF bridge",
            "The student should connect Himalayan glaciers and glacial lakes with GLOF risk and recent incidents.",
            ["glof", "glacial lake", "himalayan", "sikkim", "uttarakhand"]
          ),
          point(
            "glacial-aeolian-systems",
            "aeolian-desert-forms",
            "Aeolian and desert forms",
            "Recall should identify wind erosion, dune types, loess, desert surfaces, wadi, and oasis logic.",
            ["aeolian", "dune", "loess", "yardang", "wadi", "oasis", "erg"]
          ),
        ],
      },
      {
        id: "coastal-karst-systems",
        order: 6,
        kind: "advanced",
        title: "Coastal and Karst Systems",
        eyebrow: "Waves and solution",
        estimatedMinutes: 5,
        body:
          "Coastal landforms come from wave erosion, transport, and deposition. Karst landforms come from solution of limestone. Both topics are trap-heavy because terms look easy but formation conditions are specific.",
        bullets: [
          "Coastal erosion: cliff, wave-cut platform, cave, arch, stack, stump, headland, and bay.",
          "Coastal deposition: beach, spit, bar, tombolo, lagoon, dune, and barrier island.",
          "Coral reefs include fringing reef, barrier reef, and atoll; bleaching links the topic to current affairs and climate stress.",
          "Karst forms include sinkhole, doline, uvala, polje, limestone pavement, cave, stalactite, stalagmite, and pillar.",
        ],
        expectedRecallPoints: [
          point(
            "coastal-karst-systems",
            "coastal-erosion-deposition",
            "Coastal erosion and deposition",
            "Recall should separate erosional coastal landforms from depositional coastal landforms.",
            ["coastal", "cliff", "wave-cut", "spit", "tombolo", "lagoon"]
          ),
          point(
            "coastal-karst-systems",
            "reef-mangrove-bridge",
            "Reef and mangrove bridge",
            "The answer should include coral reefs, bleaching, mangroves, or Indian coastal ecology as a geography-environment bridge.",
            ["coral", "reef", "bleaching", "mangrove", "sundarbans", "lakshadweep"]
          ),
          point(
            "coastal-karst-systems",
            "karst-solution-forms",
            "Karst solution forms",
            "Recall should explain limestone solution and distinguish surface and underground karst forms.",
            ["karst", "limestone", "sinkhole", "doline", "cave", "stalactite", "stalagmite"]
          ),
        ],
      },
      {
        id: "landform-examiner-traps",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Statement correction",
        estimatedMinutes: 4,
        body:
          "Landform traps usually swap an agent, reverse a process, place a feature in the wrong stage, or pair a correct term with the wrong region. The student must identify the wrong word and correct it.",
        bullets: [
          "Weathering is not erosion; erosion is not deposition.",
          "A delta is not always formed by every river; estuary conditions matter.",
          "Not every volcano is at a plate boundary because hotspots exist.",
          "Glacial, aeolian, coastal, and karst forms cannot be interchanged simply because all are landforms.",
          "MCQs often use match-the-pair, how-many-correct, NOT/exception, process order, and location-example traps.",
        ],
        expectedRecallPoints: [
          point(
            "landform-examiner-traps",
            "agent-swap-trap",
            "Agent-swap trap",
            "The answer should warn against swapping river, ice, wind, wave, and solution landforms.",
            ["trap", "agent", "river", "ice", "wind", "wave", "solution"]
          ),
          point(
            "landform-examiner-traps",
            "process-order-trap",
            "Process-order trap",
            "Recall should flag wrong order or wrong pairing among weathering, erosion, transport, and deposition.",
            ["weathering", "erosion", "transport", "deposition", "wrong", "pair"]
          ),
          point(
            "landform-examiner-traps",
            "location-example-trap",
            "Location-example trap",
            "The student should verify examples such as Deccan Traps, Barren Island, Narmada-Tapi, Sambhar, or Indian reefs before accepting a statement.",
            ["deccan", "barren island", "narmada", "tapi", "sambhar", "reef"]
          ),
        ],
      },
      {
        id: "landform-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before MCQ practice, speak the full Day 4 chain: internal force, rock material, external process, agent-wise landforms, Indian examples, current bridge, and UPSC trap.",
        bullets: [
          "Start with volcano and rock material, then move to weathering, erosion, transport, and deposition.",
          "Explain river, glacier, wind, wave, and solution systems separately.",
          "Attach at least three examples: one Indian volcanic or rock example, one river or rift example, and one coast/desert/glacier/current example.",
          "Next handoff: connect landforms with atmosphere and ocean processes in Day 5 and Day 6.",
        ],
        expectedRecallPoints: [
          point(
            "landform-quick-recall-handoff",
            "full-day4-chain",
            "Full Day 4 chain",
            "Recall should connect volcanoes, rocks, geomorphic processes, agent-wise landforms, examples, and traps in one answer.",
            ["volcano", "rock", "geomorphic", "river", "glacier", "wind", "coast", "karst"]
          ),
          point(
            "landform-quick-recall-handoff",
            "three-examples",
            "Three examples",
            "The answer should include at least three examples from India or world map proof.",
            ["example", "india", "deccan", "barren", "narmada", "himalaya", "coast", "desert"]
          ),
          point(
            "landform-quick-recall-handoff",
            "next-handoff-atmosphere-ocean",
            "Next handoff",
            "The next link is atmosphere, climate, and ocean processes that influence landform development.",
            ["atmosphere", "climate", "ocean", "next", "handoff"]
          ),
        ],
      },
    ],
  },
  {
    id: "weather-ocean-systems-day6",
    subjectSlug: "geography",
    day: 6,
    cluster: "Cluster 3",
    title: "Weather Systems, Climate Types, and Ocean Dynamics",
    subtitle: "Humidity, fronts, cyclones, world climates, ocean floor, salinity, temperature, currents, and tides.",
    status: "draft",
    topicIds: [19, 20, 21, 24, 25, 26, 27, 28, 29],
    sourceLabel: "1. Geography topics.pdf Topics 19-21 and 24-29 draft web module",
    sections: [
      {
        id: "weather-ocean-system-frame",
        order: 1,
        kind: "basic",
        title: "Why Weather and Ocean Must Be Read Together",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Day 6 looks like many separate chapters, but UPSC often combines them: moisture creates precipitation, air masses create fronts, pressure creates cyclones, climate regions repeat those patterns, and oceans redistribute heat through currents and tides.",
        bullets: [
          "The safe recall chain is heat -> pressure -> wind -> moisture -> weather -> ocean feedback.",
          "A student should explain both atmospheric process and map location, not only definitions.",
          "Cyclones, floods, marine heatwaves, El Nino links, and coastal hazards make this cluster current-affairs ready.",
        ],
        expectedRecallPoints: [
          point(
            "weather-ocean-system-frame",
            "weather-ocean-chain",
            "Weather-ocean chain",
            "Recall should connect heat, pressure, wind, moisture, weather systems, and ocean feedback as one chain.",
            ["heat", "pressure", "wind", "moisture", "weather", "ocean"]
          ),
          point(
            "weather-ocean-system-frame",
            "process-plus-map",
            "Process plus map",
            "The answer should include both process explanation and a map or regional example.",
            ["process", "map", "region", "example", "location"]
          ),
        ],
      },
      {
        id: "humidity-precipitation-core",
        order: 2,
        kind: "basic",
        title: "Humidity and Precipitation Core",
        eyebrow: "Moisture logic",
        estimatedMinutes: 5,
        body:
          "Humidity is the amount of water vapour in air. Precipitation begins when moist air rises, cools, reaches saturation, condenses around nuclei, and droplets or ice crystals grow enough to fall. The student must separate convectional, orographic, and cyclonic rainfall.",
        bullets: [
          "Absolute humidity, relative humidity, and specific humidity are different measures.",
          "Relative humidity rises when temperature falls, even if actual water vapour does not increase.",
          "Convectional rainfall is intense and local; orographic rainfall depends on relief; cyclonic rainfall depends on convergence and fronts.",
          "Condensation forms dew, frost, fog, mist, cloud, and precipitation depending on cooling, surface, and height.",
        ],
        expectedRecallPoints: [
          point(
            "humidity-precipitation-core",
            "humidity-measures",
            "Humidity measures",
            "Recall should distinguish absolute, relative, and specific humidity.",
            ["absolute humidity", "relative humidity", "specific humidity", "water vapour"]
          ),
          point(
            "humidity-precipitation-core",
            "saturation-condensation",
            "Saturation and condensation",
            "The answer should explain rising, cooling, saturation, condensation nuclei, and droplet growth.",
            ["rising", "cooling", "saturation", "condensation", "nuclei", "droplet"]
          ),
          point(
            "humidity-precipitation-core",
            "rainfall-types",
            "Rainfall types",
            "Recall should separate convectional, orographic, and cyclonic rainfall by mechanism.",
            ["convectional", "orographic", "cyclonic", "rainfall", "mechanism"]
          ),
        ],
      },
      {
        id: "air-masses-fronts",
        order: 3,
        kind: "advanced",
        title: "Air Masses and Fronts",
        eyebrow: "Weather boundaries",
        estimatedMinutes: 5,
        body:
          "An air mass is a large body of air with relatively uniform temperature and moisture. A front is the boundary between two contrasting air masses. Fronts matter because lifting at the boundary produces clouds, precipitation, thunderstorms, or stable layered rain.",
        bullets: [
          "Air masses are classified by source region: maritime or continental, tropical or polar, and other variants.",
          "Cold fronts push warm air up steeply and can create intense showers or thunderstorms.",
          "Warm fronts lift air gently and usually create layered cloud and steady rain.",
          "Occluded and stationary fronts are trap-heavy because the movement and lifting pattern changes.",
        ],
        expectedRecallPoints: [
          point(
            "air-masses-fronts",
            "air-mass-source",
            "Air mass source region",
            "Recall should classify air masses by moisture and temperature source region.",
            ["air mass", "maritime", "continental", "tropical", "polar", "source"]
          ),
          point(
            "air-masses-fronts",
            "front-boundary",
            "Front as boundary",
            "A front should be defined as a boundary between contrasting air masses.",
            ["front", "boundary", "contrasting", "air masses"]
          ),
          point(
            "air-masses-fronts",
            "cold-warm-front-contrast",
            "Cold and warm front contrast",
            "The answer should contrast steep lifting at cold fronts with gentle lifting at warm fronts.",
            ["cold front", "warm front", "steep", "gentle", "lifting"]
          ),
        ],
      },
      {
        id: "cyclones-anticyclones",
        order: 4,
        kind: "current",
        title: "Cyclones and Anticyclones",
        eyebrow: "Pressure systems",
        estimatedMinutes: 5,
        body:
          "Cyclones are low-pressure systems with inward, rising air. Anticyclones are high-pressure systems with outward, sinking air. The UPSC trap is treating tropical cyclone, temperate cyclone, tornado, and anticyclone as the same kind of storm.",
        bullets: [
          "Tropical cyclones need warm ocean water, moisture, Coriolis force, low vertical wind shear, and an organized low-pressure system.",
          "Temperate cyclones form along fronts in mid-latitudes and move with westerlies.",
          "Anticyclones often bring stable, dry, clear conditions but can also trap pollution or create heat/cold waves.",
          "Cyclone naming, landfall, storm surge, rainfall, and disaster geography connect static climatology with current affairs.",
        ],
        expectedRecallPoints: [
          point(
            "cyclones-anticyclones",
            "cyclone-low-pressure",
            "Cyclone pressure logic",
            "Recall should explain cyclones as low-pressure systems with inward and rising air.",
            ["cyclone", "low pressure", "inward", "rising", "air"]
          ),
          point(
            "cyclones-anticyclones",
            "tropical-cyclone-conditions",
            "Tropical cyclone conditions",
            "The answer should include warm ocean, moisture, Coriolis force, low wind shear, and organized low pressure.",
            ["warm ocean", "moisture", "coriolis", "wind shear", "low pressure"]
          ),
          point(
            "cyclones-anticyclones",
            "anticyclone-sinking-air",
            "Anticyclone logic",
            "Anticyclones are high-pressure systems with outward and sinking air, often producing stable weather.",
            ["anticyclone", "high pressure", "outward", "sinking", "stable"]
          ),
        ],
      },
      {
        id: "world-climate-classification",
        order: 5,
        kind: "ncert",
        title: "World Climate Classification",
        eyebrow: "Koppen and patterns",
        estimatedMinutes: 5,
        body:
          "World climate classification is not a memory table alone. The student should connect latitude, pressure belts, winds, ocean currents, relief, and continentality with temperature and rainfall patterns before naming the climate type.",
        bullets: [
          "Koppen groups climate mainly through temperature and precipitation patterns.",
          "Equatorial, monsoon, savanna, desert, Mediterranean, humid subtropical, marine west coast, steppe, taiga, tundra, and ice-cap types need map memory.",
          "A climate type should be recalled through location, controlling factors, vegetation, and one UPSC trap.",
          "Mediterranean climate is a repeated trap because winter rainfall and dry summers reverse the common monsoon pattern.",
        ],
        expectedRecallPoints: [
          point(
            "world-climate-classification",
            "koppen-temperature-precipitation",
            "Koppen basis",
            "Recall should state that Koppen classification uses temperature and precipitation patterns.",
            ["koppen", "temperature", "precipitation", "climate"]
          ),
          point(
            "world-climate-classification",
            "climate-controls",
            "Climate controls",
            "The answer should link climate type to latitude, winds, pressure belts, currents, relief, or continentality.",
            ["latitude", "winds", "pressure belts", "currents", "relief", "continentality"]
          ),
          point(
            "world-climate-classification",
            "mediterranean-trap",
            "Mediterranean trap",
            "Recall should flag Mediterranean winter rain and dry summer as a common statement trap.",
            ["mediterranean", "winter rain", "dry summer", "trap"]
          ),
        ],
      },
      {
        id: "ocean-floor-topography",
        order: 6,
        kind: "basic",
        title: "Ocean Floor Topography",
        eyebrow: "Bathymetry",
        estimatedMinutes: 5,
        body:
          "Ocean floor topography should be read like relief on land: continental shelf, slope, rise, abyssal plain, mid-ocean ridge, trench, seamount, guyot, and submarine canyon. Each feature matters because it controls resources, hazards, currents, and maritime claims.",
        bullets: [
          "Continental shelf is shallow and resource-rich; continental slope drops toward the deep ocean.",
          "Abyssal plains are broad deep-ocean plains; mid-ocean ridges are linked with sea-floor spreading.",
          "Trenches are deepest zones and usually connect with subduction and earthquakes.",
          "Seamounts, guyots, canyons, banks, and ridges are useful for map-based prelims statements.",
        ],
        expectedRecallPoints: [
          point(
            "ocean-floor-topography",
            "shelf-slope-rise",
            "Shelf, slope, and rise",
            "Recall should distinguish continental shelf, slope, and rise.",
            ["continental shelf", "slope", "rise", "shallow", "deep"]
          ),
          point(
            "ocean-floor-topography",
            "ridge-trench-process",
            "Ridge and trench process",
            "The answer should connect mid-ocean ridges with spreading and trenches with subduction.",
            ["mid-ocean ridge", "spreading", "trench", "subduction"]
          ),
          point(
            "ocean-floor-topography",
            "bathymetry-map-features",
            "Bathymetry map features",
            "Recall should name seamount, guyot, abyssal plain, or submarine canyon as map features.",
            ["seamount", "guyot", "abyssal", "submarine canyon", "bathymetry"]
          ),
        ],
      },
      {
        id: "salinity-temperature",
        order: 7,
        kind: "advanced",
        title: "Ocean Salinity and Temperature",
        eyebrow: "Density controls",
        estimatedMinutes: 5,
        body:
          "Ocean salinity and temperature control density, stratification, currents, marine life, and climate feedback. The student should explain horizontal and vertical patterns, not only quote average salinity.",
        bullets: [
          "Average ocean salinity is about 35 parts per thousand, but evaporation, precipitation, river inflow, ice formation, and circulation change it.",
          "High salinity often occurs in subtropical dry belts; lower salinity occurs near equator, river mouths, and polar melt zones.",
          "Temperature decreases with depth, and the thermocline marks a rapid temperature change.",
          "Temperature and salinity together drive thermohaline circulation and water-mass formation.",
        ],
        expectedRecallPoints: [
          point(
            "salinity-temperature",
            "salinity-controls",
            "Salinity controls",
            "Recall should explain salinity through evaporation, rainfall, river inflow, ice, and circulation.",
            ["salinity", "evaporation", "rainfall", "river", "ice", "circulation"]
          ),
          point(
            "salinity-temperature",
            "thermocline",
            "Thermocline",
            "The answer should define thermocline as a layer of rapid temperature change with depth.",
            ["thermocline", "temperature", "depth", "rapid"]
          ),
          point(
            "salinity-temperature",
            "density-thermohaline",
            "Density and thermohaline circulation",
            "Recall should connect temperature and salinity to density and thermohaline circulation.",
            ["density", "thermohaline", "temperature", "salinity"]
          ),
        ],
      },
      {
        id: "currents-tides-traps",
        order: 8,
        kind: "trap",
        title: "Ocean Currents, Tides, and Examiner Traps",
        eyebrow: "Movement logic",
        estimatedMinutes: 6,
        body:
          "Ocean currents move heat horizontally; tides are periodic sea-level changes due mainly to Moon and Sun gravity. UPSC traps often mix current direction, warm/cold nature, coastal climate effect, and spring/neap tide logic.",
        bullets: [
          "Warm currents generally move poleward and warm nearby coasts; cold currents generally move equatorward and cool nearby coasts.",
          "Western boundary currents are usually fast and warm; eastern boundary currents are often cold and linked with upwelling.",
          "Spring tides occur near new moon and full moon; neap tides occur near first and third quarter phases.",
          "Currents affect fisheries, fog, deserts, navigation, marine pollution, and cyclone intensity.",
        ],
        expectedRecallPoints: [
          point(
            "currents-tides-traps",
            "warm-cold-current-effect",
            "Warm and cold current effect",
            "Recall should connect warm and cold currents with coastal temperature, fog, deserts, and fisheries.",
            ["warm current", "cold current", "coast", "fog", "desert", "fisheries"]
          ),
          point(
            "currents-tides-traps",
            "western-eastern-boundary",
            "Boundary current contrast",
            "The answer should contrast fast warm western boundary currents with cold eastern boundary currents.",
            ["western boundary", "eastern boundary", "warm", "cold", "upwelling"]
          ),
          point(
            "currents-tides-traps",
            "spring-neap-tides",
            "Spring and neap tides",
            "Recall should distinguish spring tides at new/full moon from neap tides at quarter phases.",
            ["spring tide", "neap tide", "new moon", "full moon", "quarter"]
          ),
        ],
      },
      {
        id: "weather-ocean-quick-recall",
        order: 9,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before the next day opens, speak the full Day 6 chain: moisture and rainfall, fronts, cyclones, climate classification, ocean-floor relief, salinity-temperature controls, currents, tides, current-affairs bridge, and one UPSC trap.",
        bullets: [
          "Start with humidity and precipitation, then show how fronts and cyclones organize weather.",
          "Use Koppen only after explaining climate controls.",
          "Move to ocean floor, salinity, temperature, currents, and tides as connected ocean systems.",
          "Next handoff: Indian monsoon and maritime zones require both atmosphere and ocean command.",
        ],
        expectedRecallPoints: [
          point(
            "weather-ocean-quick-recall",
            "full-day6-chain",
            "Full Day 6 chain",
            "Recall should connect weather systems, climate types, ocean-floor relief, salinity, temperature, currents, and tides.",
            ["humidity", "fronts", "cyclones", "koppen", "ocean floor", "salinity", "currents", "tides"]
          ),
          point(
            "weather-ocean-quick-recall",
            "current-affairs-bridge",
            "Current-affairs bridge",
            "The answer should attach one current link such as cyclone, flood, marine heatwave, coastal risk, or fisheries.",
            ["cyclone", "flood", "marine heatwave", "coastal", "fisheries", "current"]
          ),
          point(
            "weather-ocean-quick-recall",
            "monsoon-maritime-handoff",
            "Next handoff",
            "The next link is Indian monsoon plus maritime zones, both requiring atmosphere-ocean logic.",
            ["monsoon", "maritime", "atmosphere", "ocean", "handoff"]
          ),
        ],
      },
    ],
  },
  {
    id: "indian-physiography-day8",
    subjectSlug: "geography",
    day: 8,
    cluster: "Cluster 4",
    title: "Indian Physiography: Himalayas, Plains, Plateau, Coasts, and Islands",
    subtitle: "India's physical divisions, passes, plains, plateau systems, coastal plains, and island geography.",
    status: "draft",
    topicIds: [31, 32, 33, 34, 35, 36, 37],
    sourceLabel: "1. Geography topics.pdf Topics 31-37 draft web module",
    sections: [
      {
        id: "india-physiography-frame",
        order: 1,
        kind: "basic",
        title: "India Physiography as One Connected Map",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "India's physical geography should be recalled as a connected map: young fold mountains in the north, depositional plains below them, old peninsular blocks in the south, narrow and broad coastal plains on either side, and island arcs or coral islands offshore.",
        bullets: [
          "The safest recall order is Himalayas -> plains -> plateau -> coasts -> islands.",
          "Relief controls rivers, monsoon rainfall, soils, agriculture, settlement, disaster risk, and strategic passes.",
          "UPSC often tests location, sequence, formation, exception, and map-pair traps rather than only definitions.",
        ],
        expectedRecallPoints: [
          point(
            "india-physiography-frame",
            "india-physiography-sequence",
            "India physiography sequence",
            "Recall should sequence Himalayas, northern plains, peninsular plateau, coastal plains, and islands.",
            ["himalayas", "northern plains", "peninsular plateau", "coastal plains", "islands"]
          ),
          point(
            "india-physiography-frame",
            "relief-controls-systems",
            "Relief controls systems",
            "The answer should connect relief with rivers, monsoon, soils, agriculture, settlement, or disaster risk.",
            ["relief", "rivers", "monsoon", "soils", "agriculture", "settlement", "disaster"]
          ),
        ],
      },
      {
        id: "himalayan-structure",
        order: 2,
        kind: "basic",
        title: "The Himalayas: Structure and Logic",
        eyebrow: "Young fold mountains",
        estimatedMinutes: 5,
        body:
          "The Himalayas are young fold mountains formed by the India-Eurasia collision. Recall them through longitudinal divisions, regional divisions, syntaxial bends, glaciers, valleys, and the earthquake-landslide hazard chain.",
        bullets: [
          "Longitudinal divisions: Trans-Himalaya, Greater Himalaya or Himadri, Lesser Himalaya or Himachal, Shiwalik, and foothill zones.",
          "Regional divisions include Kashmir, Himachal-Uttarakhand, Nepal, and Assam or eastern Himalaya.",
          "Important associated features include Karewas, Dun valleys, glaciers, river gorges, and syntaxial bends near Nanga Parbat and Namcha Barwa.",
          "The Himalayas are still tectonically active, so earthquakes, landslides, avalanches, flash floods, and GLOFs are geography-current bridges.",
        ],
        expectedRecallPoints: [
          point(
            "himalayan-structure",
            "himalaya-collision-origin",
            "Himalaya collision origin",
            "Recall should explain the Himalayas as young fold mountains formed by India-Eurasia collision.",
            ["young fold", "india", "eurasia", "collision", "himalaya"]
          ),
          point(
            "himalayan-structure",
            "himalayan-divisions",
            "Himalayan divisions",
            "The answer should name major longitudinal or regional divisions of the Himalayas.",
            ["trans-himalaya", "himadri", "himachal", "shiwalik", "kashmir", "nepal", "assam"]
          ),
          point(
            "himalayan-structure",
            "himalayan-hazards",
            "Himalayan hazards",
            "Recall should connect active mountains with earthquakes, landslides, flash floods, avalanches, or GLOFs.",
            ["earthquake", "landslide", "flash flood", "avalanche", "glof", "active"]
          ),
        ],
      },
      {
        id: "himalayan-passes-map",
        order: 3,
        kind: "advanced",
        title: "Himalayan Passes as Map Memory",
        eyebrow: "Strategic corridors",
        estimatedMinutes: 5,
        body:
          "Passes should not be memorized as a loose list. Each pass must attach to state or union territory, range or corridor, border direction, and strategic or trade relevance.",
        bullets: [
          "Karakoram, Zoji La, Banihal, Rohtang, Baralacha La, Shipki La, Niti, Mana, Lipulekh, Nathu La, Jelep La, Bum La, Se La, and Diphu are common map-drill names.",
          "The student should group passes by western, central, and eastern Himalaya.",
          "Strategic passes connect physiography with border management, infrastructure, trade routes, pilgrimage routes, and defence geography.",
          "Trap pattern: correct pass name paired with wrong state, wrong border, wrong range, or wrong direction.",
        ],
        expectedRecallPoints: [
          point(
            "himalayan-passes-map",
            "passes-state-grouping",
            "Pass-state grouping",
            "Recall should attach passes to western, central, or eastern Himalaya and to the correct state or union territory.",
            ["karakoram", "zoji", "banihal", "shipki", "lipulekh", "nathu", "bum la", "se la"]
          ),
          point(
            "himalayan-passes-map",
            "passes-strategic-link",
            "Strategic pass link",
            "The answer should connect passes with border, trade, pilgrimage, infrastructure, or defence relevance.",
            ["border", "trade", "pilgrimage", "infrastructure", "defence", "strategic"]
          ),
          point(
            "himalayan-passes-map",
            "pass-pair-trap",
            "Pass pairing trap",
            "Recall should warn that pass questions often pair a correct pass with the wrong state, border, range, or direction.",
            ["wrong state", "wrong border", "wrong range", "direction", "trap"]
          ),
        ],
      },
      {
        id: "northern-plains-system",
        order: 4,
        kind: "basic",
        title: "Northern Plains: Depositional System",
        eyebrow: "Alluvial plains",
        estimatedMinutes: 5,
        body:
          "The Northern Plains are depositional plains formed mainly by the Indus, Ganga, and Brahmaputra river systems. They should be recalled through origin, regional divisions, alluvial belts, floodplain behavior, and agriculture-settlement importance.",
        bullets: [
          "Regional divisions include Punjab-Haryana plains, Ganga plains, and Brahmaputra or Assam plains.",
          "Bhabar, Terai, Bhangar, and Khadar are not random terms; they show particle size, water table, age, and flood relationship.",
          "The plains support dense population, agriculture, transport, urbanization, and recurring flood hazards.",
          "Brahmaputra plains need special attention because of braided channels, river islands, floods, and sediment load.",
        ],
        expectedRecallPoints: [
          point(
            "northern-plains-system",
            "alluvial-origin",
            "Alluvial origin",
            "Recall should explain the Northern Plains as alluvial depositional plains of Indus-Ganga-Brahmaputra systems.",
            ["alluvial", "depositional", "indus", "ganga", "brahmaputra"]
          ),
          point(
            "northern-plains-system",
            "bhabar-terai-bhangar-khadar",
            "Alluvial belts",
            "The answer should distinguish Bhabar, Terai, Bhangar, and Khadar.",
            ["bhabar", "terai", "bhangar", "khadar"]
          ),
          point(
            "northern-plains-system",
            "plain-human-hazard-link",
            "Human and hazard link",
            "Recall should connect plains with agriculture, dense settlement, transport, urbanization, or flood risk.",
            ["agriculture", "settlement", "transport", "urban", "flood"]
          ),
        ],
      },
      {
        id: "peninsular-plateau-system",
        order: 5,
        kind: "advanced",
        title: "Peninsular Plateau: Ancient Stable Block",
        eyebrow: "Plateau logic",
        estimatedMinutes: 5,
        body:
          "The Peninsular Plateau is an old, stable, hard-rock block. It should be recalled through central highlands, Deccan Plateau, Western Ghats, Eastern Ghats, rift valleys, mineral belts, black soil, and drainage divide logic.",
        bullets: [
          "Central Highlands include Malwa, Bundelkhand, Baghelkhand, Chotanagpur, Aravalli, Vindhyan, and Satpura associations.",
          "Deccan Plateau is linked with basaltic lava flows, black soil, and east-flowing river systems.",
          "Western Ghats are continuous and higher; Eastern Ghats are more discontinuous and cut by rivers.",
          "Narmada and Tapi flow through rift valleys toward the Arabian Sea, creating an important exception to east-flowing drainage.",
        ],
        expectedRecallPoints: [
          point(
            "peninsular-plateau-system",
            "old-stable-block",
            "Old stable plateau",
            "Recall should describe the Peninsular Plateau as an old stable hard-rock block.",
            ["old", "stable", "hard rock", "peninsular plateau", "block"]
          ),
          point(
            "peninsular-plateau-system",
            "ghats-contrast",
            "Western and Eastern Ghats contrast",
            "The answer should contrast continuous higher Western Ghats with discontinuous Eastern Ghats.",
            ["western ghats", "eastern ghats", "continuous", "discontinuous", "higher"]
          ),
          point(
            "peninsular-plateau-system",
            "rift-west-flowing-exception",
            "Rift valley exception",
            "Recall should explain Narmada and Tapi as west-flowing rift-valley exceptions.",
            ["narmada", "tapi", "rift", "west flowing", "exception"]
          ),
        ],
      },
      {
        id: "coasts-islands-system",
        order: 6,
        kind: "current",
        title: "Coastal Plains and Islands",
        eyebrow: "Maritime physiography",
        estimatedMinutes: 5,
        body:
          "India's coastal plains and islands connect landforms with monsoon, ports, fisheries, cyclones, erosion, coral reefs, mangroves, volcanoes, and strategic maritime geography.",
        bullets: [
          "Western Coastal Plain is generally narrower and includes Konkan, Kanara, and Malabar sections.",
          "Eastern Coastal Plain is generally broader and includes Northern Circars and Coromandel sections with major deltas.",
          "Andaman and Nicobar Islands are an island arc with volcanic and strategic significance; Barren Island is India's active volcano.",
          "Lakshadweep is coral in origin, low-lying, lagoon-linked, and climate-vulnerable.",
        ],
        expectedRecallPoints: [
          point(
            "coasts-islands-system",
            "western-eastern-coast-contrast",
            "Western and Eastern coastal contrast",
            "Recall should contrast the narrower western coast with the broader deltaic eastern coast.",
            ["western coast", "eastern coast", "narrow", "broad", "delta"]
          ),
          point(
            "coasts-islands-system",
            "andaman-nicobar-arc",
            "Andaman-Nicobar arc",
            "The answer should identify Andaman and Nicobar as an island arc with volcanic and strategic relevance.",
            ["andaman", "nicobar", "island arc", "volcanic", "barren island", "strategic"]
          ),
          point(
            "coasts-islands-system",
            "lakshadweep-coral",
            "Lakshadweep coral origin",
            "Recall should identify Lakshadweep as coral-origin, lagoon-linked, low-lying, and climate-vulnerable.",
            ["lakshadweep", "coral", "lagoon", "low lying", "climate"]
          ),
        ],
      },
      {
        id: "physiography-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Map-pair correction",
        estimatedMinutes: 4,
        body:
          "Indian physiography traps usually pair a true term with the wrong location, wrong sequence, wrong formation, or wrong river relationship. The student must correct the pairing, not just recognize the word.",
        bullets: [
          "Himalaya traps: division order, pass-state pairs, syntaxial bends, and active tectonics.",
          "Plain traps: Bhabar-Terai-Bhangar-Khadar sequence and floodplain age.",
          "Plateau traps: Aravalli direction, Western/Eastern Ghats contrast, Narmada-Tapi west-flowing exception.",
          "Coast and island traps: western/eastern coast width, delta location, coral versus volcanic origin, and active volcano location.",
        ],
        expectedRecallPoints: [
          point(
            "physiography-traps-pyq",
            "wrong-location-trap",
            "Wrong location trap",
            "Recall should flag that physiography MCQs often pair correct terms with wrong locations.",
            ["wrong location", "pair", "map", "state", "trap"]
          ),
          point(
            "physiography-traps-pyq",
            "formation-trap",
            "Formation trap",
            "The answer should distinguish fold mountain, depositional plain, old plateau, coral island, and volcanic island origins.",
            ["fold", "depositional", "old plateau", "coral", "volcanic", "origin"]
          ),
          point(
            "physiography-traps-pyq",
            "sequence-trap",
            "Sequence trap",
            "Recall should correct wrong sequences such as Himalayan divisions or Bhabar-Terai-Bhangar-Khadar.",
            ["sequence", "himalayan divisions", "bhabar", "terai", "bhangar", "khadar"]
          ),
        ],
      },
      {
        id: "physiography-quick-recall",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before moving to drainage, speak the full Day 8 chain: formation, sequence, map divisions, strategic passes, alluvial plains, plateau exceptions, coasts, islands, and one examiner trap.",
        bullets: [
          "Start with the north-to-south physical sequence and explain why each division formed.",
          "Attach at least five map anchors: one Himalayan pass, one plain belt, one plateau/range, one coastal section, and one island example.",
          "Keep the next handoff clear: drainage systems on Day 9 depend on the relief pattern built today.",
        ],
        expectedRecallPoints: [
          point(
            "physiography-quick-recall",
            "full-day8-chain",
            "Full Day 8 chain",
            "Recall should connect Himalayas, passes, plains, plateau, coasts, islands, examples, and traps in one answer.",
            ["himalayas", "passes", "plains", "plateau", "coasts", "islands", "traps"]
          ),
          point(
            "physiography-quick-recall",
            "five-map-anchors",
            "Five map anchors",
            "The answer should include at least five map anchors across mountain, plain, plateau, coast, and island examples.",
            ["map", "pass", "plain", "range", "coast", "island"]
          ),
          point(
            "physiography-quick-recall",
            "drainage-handoff",
            "Drainage handoff",
            "The next link is Day 9 drainage because river systems depend on relief.",
            ["drainage", "river", "relief", "day 9", "handoff"]
          ),
        ],
      },
    ],
  },
  {
    id: "drainage-lakes-wetlands-day9",
    subjectSlug: "geography",
    day: 9,
    cluster: "Cluster 5",
    title: "Indian Drainage: Rivers, Lakes, Wetlands, and Ramsar Sites",
    subtitle: "Drainage controls, Indus-Ganga-Brahmaputra systems, peninsular rivers, lakes, wetlands, and Ramsar logic.",
    status: "draft",
    topicIds: [38, 39, 40, 41, 42, 43, 44, 45],
    sourceLabel: "1. Geography topics.pdf Topics 38-45 draft web module",
    sections: [
      {
        id: "drainage-system-frame",
        order: 1,
        kind: "basic",
        title: "Drainage as Relief in Motion",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Drainage should be read as relief in motion. Rivers reveal slope, rock structure, rainfall, glaciers, tectonics, erosion, deposition, settlements, agriculture, hazards, interstate disputes, and ecology.",
        bullets: [
          "The safe recall chain is relief -> watershed -> river system -> landform -> human use -> hazard/ecology.",
          "Day 9 must connect Day 8 physiography with river behavior.",
          "UPSC often tests tributary order, origin, confluence, basin state, river direction, floodplain feature, lake type, and wetland status.",
        ],
        expectedRecallPoints: [
          point(
            "drainage-system-frame",
            "relief-to-drainage-chain",
            "Relief to drainage chain",
            "Recall should connect relief, watershed, river system, landform, human use, hazard, and ecology.",
            ["relief", "watershed", "river system", "landform", "human", "hazard", "ecology"]
          ),
          point(
            "drainage-system-frame",
            "physiography-handoff",
            "Physiography handoff",
            "The answer should state that Day 9 drainage depends on Day 8 relief and physiography.",
            ["day 8", "physiography", "relief", "drainage", "handoff"]
          ),
        ],
      },
      {
        id: "drainage-basics-patterns",
        order: 2,
        kind: "basic",
        title: "Drainage Basics, Basins, and Patterns",
        eyebrow: "System logic",
        estimatedMinutes: 5,
        body:
          "A drainage basin is the area drained by a river and its tributaries. A watershed or divide separates basins. Drainage pattern depends on slope, rock structure, faults, folds, joints, and river age.",
        bullets: [
          "Important patterns include dendritic, trellis, rectangular, radial, centripetal, annular, and deranged drainage.",
          "Himalayan rivers are often antecedent, perennial, and gorge-forming.",
          "Peninsular rivers are generally older, seasonal, and structurally controlled.",
          "Inland drainage occurs where water does not reach the sea, such as parts of arid Rajasthan.",
        ],
        expectedRecallPoints: [
          point(
            "drainage-basics-patterns",
            "basin-watershed",
            "Basin and watershed",
            "Recall should distinguish a drainage basin from a watershed or water divide.",
            ["drainage basin", "watershed", "water divide", "tributaries"]
          ),
          point(
            "drainage-basics-patterns",
            "drainage-patterns",
            "Drainage patterns",
            "The answer should name and connect drainage patterns with structure or slope.",
            ["dendritic", "trellis", "rectangular", "radial", "centripetal", "annular"]
          ),
          point(
            "drainage-basics-patterns",
            "himalayan-peninsular-contrast",
            "Himalayan and peninsular contrast",
            "Recall should contrast Himalayan perennial antecedent rivers with older seasonal peninsular rivers.",
            ["himalayan", "peninsular", "perennial", "antecedent", "seasonal", "older"]
          ),
        ],
      },
      {
        id: "indus-system",
        order: 3,
        kind: "advanced",
        title: "Indus River System",
        eyebrow: "Western Himalayan system",
        estimatedMinutes: 5,
        body:
          "The Indus system should be recalled through origin, Himalayan tributaries, Punjab tributaries, arid-zone importance, and transboundary water governance. Do not reduce it to only the five rivers of Punjab.",
        bullets: [
          "Indus rises near the Tibetan region around Mansarovar area and flows through Ladakh before entering Pakistan.",
          "Major tributaries include Jhelum, Chenab, Ravi, Beas, and Sutlej; the system also has important upper-basin tributaries.",
          "The Indus Water Treaty connects physical geography with international relations and irrigation geography.",
          "Trap pattern: wrong river-state pair, wrong tributary order, or forgetting that Sutlej has a Tibet-Himachal-Punjab path.",
        ],
        expectedRecallPoints: [
          point(
            "indus-system",
            "indus-origin-route",
            "Indus origin and route",
            "Recall should mention Indus origin region, Ladakh route, and Pakistan flow.",
            ["indus", "mansarovar", "tibet", "ladakh", "pakistan"]
          ),
          point(
            "indus-system",
            "punjab-tributaries",
            "Punjab tributaries",
            "The answer should name Jhelum, Chenab, Ravi, Beas, and Sutlej.",
            ["jhelum", "chenab", "ravi", "beas", "sutlej"]
          ),
          point(
            "indus-system",
            "indus-water-treaty-link",
            "Indus Water Treaty link",
            "Recall should connect the system with transboundary water governance or irrigation.",
            ["indus water treaty", "transboundary", "irrigation", "water governance"]
          ),
        ],
      },
      {
        id: "ganga-system",
        order: 4,
        kind: "advanced",
        title: "Ganga River System",
        eyebrow: "Northern plains spine",
        estimatedMinutes: 5,
        body:
          "The Ganga system is the spine of the northern plains. Recall it through Himalayan source streams, major left-bank and right-bank tributaries, plains deposition, delta formation, pollution, navigation, and flood management.",
        bullets: [
          "Bhagirathi and Alaknanda join at Devprayag; Ganga flows through Uttarakhand, Uttar Pradesh, Bihar, Jharkhand, and West Bengal before entering Bangladesh.",
          "Left-bank tributaries include Ramganga, Gomti, Ghaghara, Gandak, Kosi, and Mahananda.",
          "Right-bank tributaries include Yamuna, Son, Damodar, and other plateau-fed rivers.",
          "The system links to fertile alluvium, floods, river pollution, National Waterway-1, and the Sundarbans delta.",
        ],
        expectedRecallPoints: [
          point(
            "ganga-system",
            "ganga-source-streams",
            "Ganga source streams",
            "Recall should mention Bhagirathi and Alaknanda joining at Devprayag.",
            ["bhagirathi", "alaknanda", "devprayag", "ganga"]
          ),
          point(
            "ganga-system",
            "ganga-tributary-banks",
            "Ganga tributary banks",
            "The answer should distinguish major left-bank and right-bank tributaries.",
            ["left bank", "right bank", "yamuna", "ghaghara", "gandak", "kosi", "son"]
          ),
          point(
            "ganga-system",
            "ganga-human-ecology-link",
            "Human and ecology link",
            "Recall should connect Ganga with alluvium, flood, pollution, navigation, or delta ecology.",
            ["alluvium", "flood", "pollution", "navigation", "sundarbans", "delta"]
          ),
        ],
      },
      {
        id: "brahmaputra-system",
        order: 5,
        kind: "current",
        title: "Brahmaputra River System",
        eyebrow: "Braided flood system",
        estimatedMinutes: 5,
        body:
          "The Brahmaputra system is a high-energy transboundary river. It must be recalled through Tibet-Assam-Bangladesh route, huge sediment load, braided channels, river islands, floods, bank erosion, hydropower, and ecological sensitivity.",
        bullets: [
          "The river is known as Yarlung Tsangpo in Tibet, Siang or Dihang after entering Arunachal Pradesh, Brahmaputra in Assam, and Jamuna in Bangladesh.",
          "Major tributaries include Dibang, Lohit, Subansiri, Manas, Teesta, Dhansiri, and others depending on section.",
          "Majuli, braided channels, shifting course, and bank erosion are high-yield map and hazard cues.",
          "Current links include hydropower, China-India water concerns, floods, riverine biodiversity, and sediment management.",
        ],
        expectedRecallPoints: [
          point(
            "brahmaputra-system",
            "brahmaputra-name-route",
            "Brahmaputra name-route chain",
            "Recall should connect Yarlung Tsangpo, Siang/Dihang, Brahmaputra, and Jamuna names with route.",
            ["yarlung", "tsangpo", "siang", "dihang", "brahmaputra", "jamuna"]
          ),
          point(
            "brahmaputra-system",
            "braided-flood-erosion",
            "Braided flood system",
            "The answer should mention braided channels, floods, bank erosion, or river islands.",
            ["braided", "flood", "bank erosion", "river island", "majuli"]
          ),
          point(
            "brahmaputra-system",
            "brahmaputra-current-link",
            "Current bridge",
            "Recall should connect Brahmaputra with hydropower, transboundary water, biodiversity, or sediment management.",
            ["hydropower", "transboundary", "biodiversity", "sediment", "china"]
          ),
        ],
      },
      {
        id: "peninsular-rivers",
        order: 6,
        kind: "basic",
        title: "Peninsular Rivers: East and West Flowing",
        eyebrow: "Plateau drainage",
        estimatedMinutes: 5,
        body:
          "Peninsular rivers should be separated into east-flowing and west-flowing systems. Most major rivers flow east to the Bay of Bengal and form deltas; Narmada and Tapi are major west-flowing rift-valley exceptions.",
        bullets: [
          "East-flowing rivers include Mahanadi, Godavari, Krishna, and Kaveri, with many tributaries and delta systems.",
          "West-flowing rivers include Narmada, Tapi, Mahi, Sabarmati, Luni, and short Western Ghats rivers.",
          "Western Ghats act as a major water divide and create short, swift west-flowing streams.",
          "Trap pattern: estuary versus delta, west-flowing exception, tributary-state pair, and dam-river pair.",
        ],
        expectedRecallPoints: [
          point(
            "peninsular-rivers",
            "east-flowing-delta",
            "East-flowing delta rivers",
            "Recall should name major east-flowing rivers and connect them with Bay of Bengal deltas.",
            ["mahanadi", "godavari", "krishna", "kaveri", "east flowing", "delta"]
          ),
          point(
            "peninsular-rivers",
            "west-flowing-exceptions",
            "West-flowing exceptions",
            "The answer should explain Narmada and Tapi as west-flowing rift-valley exceptions.",
            ["narmada", "tapi", "west flowing", "rift", "exception"]
          ),
          point(
            "peninsular-rivers",
            "ghats-water-divide",
            "Western Ghats divide",
            "Recall should connect Western Ghats with water divide and short west-flowing streams.",
            ["western ghats", "water divide", "short", "swift", "streams"]
          ),
        ],
      },
      {
        id: "lakes-wetlands-ramsar",
        order: 7,
        kind: "ncert",
        title: "Lakes, Wetlands, and Ramsar Sites",
        eyebrow: "Hydrology and ecology",
        estimatedMinutes: 5,
        body:
          "Lakes and wetlands are not only static map lists. They must be read through origin, salinity, drainage, biodiversity, flood buffering, groundwater recharge, livelihoods, tourism, pollution, encroachment, and Ramsar conservation status.",
        bullets: [
          "Lake origins include tectonic, glacial, oxbow, lagoon, salt, volcanic, landslide, and man-made reservoirs.",
          "High-yield lake examples include Wular, Dal, Sambhar, Chilika, Pulicat, Loktak, Vembanad, Kolleru, Lonar, and Pangong Tso.",
          "Wetlands act as flood buffers, carbon sinks, water filters, groundwater recharge zones, and biodiversity habitats.",
          "Ramsar status marks wetlands of international importance; it does not mean the site is free from local stress.",
        ],
        expectedRecallPoints: [
          point(
            "lakes-wetlands-ramsar",
            "lake-origin-types",
            "Lake origin types",
            "Recall should classify lakes by origin such as tectonic, glacial, oxbow, lagoon, salt, volcanic, or man-made.",
            ["tectonic", "glacial", "oxbow", "lagoon", "salt", "volcanic", "reservoir"]
          ),
          point(
            "lakes-wetlands-ramsar",
            "major-lake-examples",
            "Major lake examples",
            "The answer should include map examples such as Wular, Sambhar, Chilika, Pulicat, Loktak, Vembanad, or Lonar.",
            ["wular", "sambhar", "chilika", "pulicat", "loktak", "vembanad", "lonar"]
          ),
          point(
            "lakes-wetlands-ramsar",
            "wetland-functions",
            "Wetland functions",
            "Recall should explain flood buffering, groundwater recharge, biodiversity, carbon, filtration, or livelihoods.",
            ["flood", "groundwater", "biodiversity", "carbon", "filter", "livelihood"]
          ),
          point(
            "lakes-wetlands-ramsar",
            "ramsar-status",
            "Ramsar status",
            "The answer should define Ramsar as international wetland importance, not stress-free condition.",
            ["ramsar", "international", "wetland", "importance", "stress"]
          ),
        ],
      },
      {
        id: "drainage-traps-pyq",
        order: 8,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Map-pair correction",
        estimatedMinutes: 4,
        body:
          "Drainage traps are usually wrong pairings: origin with wrong river, tributary on wrong bank, dam on wrong river, lake in wrong state, wetland with wrong type, or delta/estuary confusion.",
        bullets: [
          "Tributary-bank questions punish vague river memory.",
          "Delta versus estuary depends on sediment, tides, slope, and coastal conditions.",
          "Lake-origin and lake-state pairs need map memory, not only names.",
          "Ramsar questions often mix wetland type, state, bird sanctuary, lake, delta, or mangrove context.",
        ],
        expectedRecallPoints: [
          point(
            "drainage-traps-pyq",
            "tributary-bank-trap",
            "Tributary-bank trap",
            "Recall should warn against wrong tributary-bank or tributary-state pairings.",
            ["tributary", "bank", "wrong", "state", "pair"]
          ),
          point(
            "drainage-traps-pyq",
            "delta-estuary-trap",
            "Delta and estuary trap",
            "The answer should distinguish delta from estuary using sediment, tide, slope, or coastal condition.",
            ["delta", "estuary", "sediment", "tide", "slope", "coastal"]
          ),
          point(
            "drainage-traps-pyq",
            "lake-wetland-pair-trap",
            "Lake-wetland pair trap",
            "Recall should verify lake-state, wetland type, Ramsar status, and ecological context.",
            ["lake", "wetland", "state", "ramsar", "type", "ecology"]
          ),
        ],
      },
      {
        id: "drainage-quick-recall",
        order: 9,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before moving to soils and vegetation, speak the full Day 9 chain: basin and pattern basics, Himalayan river systems, peninsular rivers, lakes, wetlands, Ramsar, map examples, human use, hazards, and one examiner trap.",
        bullets: [
          "Start with drainage controls and Himalayan-versus-peninsular contrast.",
          "Speak Indus, Ganga, and Brahmaputra as separate systems with route, tributaries, and current links.",
          "Then speak peninsular east/west rivers, lakes, wetlands, and Ramsar conservation logic.",
          "Next handoff: Day 10 soils and forests depend on relief, drainage, moisture, and ecology.",
        ],
        expectedRecallPoints: [
          point(
            "drainage-quick-recall",
            "full-day9-chain",
            "Full Day 9 chain",
            "Recall should connect drainage basics, river systems, peninsular rivers, lakes, wetlands, Ramsar, hazards, and traps.",
            ["drainage", "indus", "ganga", "brahmaputra", "peninsular", "lakes", "wetlands", "ramsar"]
          ),
          point(
            "drainage-quick-recall",
            "map-examples",
            "Map examples",
            "The answer should include river, tributary, lake, wetland, and state or basin examples.",
            ["map", "tributary", "lake", "wetland", "state", "basin"]
          ),
          point(
            "drainage-quick-recall",
            "soils-forests-handoff",
            "Next handoff",
            "The next link is Day 10 soils and forests because moisture, relief, and drainage influence ecology.",
            ["soils", "forests", "moisture", "relief", "drainage", "ecology"]
          ),
        ],
      },
    ],
  },
  {
    id: "agriculture-food-security-day11",
    subjectSlug: "geography",
    day: 11,
    cluster: "Cluster 6",
    title: "Indian Agriculture: Crops, Irrigation, Food Security, and Farm Issues",
    subtitle: "Cropping seasons, crop-state mapping, agricultural revolutions, irrigation, food security, policy, and contemporary farm issues.",
    status: "draft",
    topicIds: [50, 51, 52, 53, 54, 55],
    sourceLabel: "1. Geography topics.pdf Topics 50-55 draft web module",
    sections: [
      {
        id: "agriculture-system-frame",
        order: 1,
        kind: "basic",
        title: "Agriculture as Climate, Soil, Water, Market, and Policy",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Agriculture questions are not only crop lists. UPSC tests whether the student can connect climate, soil, irrigation, cropping season, top producing states, markets, food security, technology, policy, and farmer distress in one chain.",
        bullets: [
          "The safe recall chain is climate -> soil -> water -> crop -> region -> policy -> issue.",
          "Static crop geography becomes current when linked with MSP, procurement, food inflation, exports, water stress, and climate risk.",
          "Map memory matters: the student should locate crop belts, irrigation regions, drought-prone areas, and revolution examples.",
        ],
        expectedRecallPoints: [
          point(
            "agriculture-system-frame",
            "agriculture-chain",
            "Agriculture system chain",
            "Recall should connect climate, soil, water, crop, region, policy, and issues.",
            ["climate", "soil", "water", "crop", "region", "policy", "issue"]
          ),
          point(
            "agriculture-system-frame",
            "static-current-link",
            "Static-current agriculture link",
            "The answer should connect crop geography with MSP, procurement, inflation, exports, water stress, or climate risk.",
            ["msp", "procurement", "inflation", "exports", "water stress", "climate"]
          ),
        ],
      },
      {
        id: "cropping-seasons",
        order: 2,
        kind: "basic",
        title: "Cropping Seasons",
        eyebrow: "Kharif, rabi, zaid",
        estimatedMinutes: 4,
        body:
          "Cropping seasons are controlled by monsoon timing, temperature, water availability, and regional practice. The student should explain Kharif, Rabi, and Zaid through sowing-harvest windows and example crops.",
        bullets: [
          "Kharif crops are generally sown with the southwest monsoon and harvested after the monsoon.",
          "Rabi crops are generally sown in winter and harvested in spring, relying on residual moisture and irrigation.",
          "Zaid crops are short-duration summer crops grown between Rabi and Kharif.",
          "Trap pattern: pairing the right crop with the wrong season, water condition, or region.",
        ],
        expectedRecallPoints: [
          point(
            "cropping-seasons",
            "kharif-season",
            "Kharif season",
            "Recall should define Kharif through monsoon sowing and examples such as rice, cotton, maize, or pulses.",
            ["kharif", "monsoon", "rice", "cotton", "maize", "pulses"]
          ),
          point(
            "cropping-seasons",
            "rabi-season",
            "Rabi season",
            "The answer should define Rabi through winter sowing, spring harvest, and examples such as wheat, gram, mustard, or barley.",
            ["rabi", "winter", "spring", "wheat", "gram", "mustard", "barley"]
          ),
          point(
            "cropping-seasons",
            "zaid-season",
            "Zaid season",
            "Recall should identify Zaid as short-duration summer cropping between Rabi and Kharif.",
            ["zaid", "summer", "short duration", "between", "rabi", "kharif"]
          ),
        ],
      },
      {
        id: "major-crops-state-mapping",
        order: 3,
        kind: "advanced",
        title: "Major Crops and Producing States",
        eyebrow: "Crop map memory",
        estimatedMinutes: 6,
        body:
          "Crop geography must be remembered through conditions and regions, not only rankings. For each crop, ask: what climate, what soil, how much water, what season, and which state cluster?",
        bullets: [
          "Rice needs high moisture and is concentrated in eastern, coastal, deltaic, and irrigated regions.",
          "Wheat prefers cool growing season and is concentrated in northwestern and central irrigated belts.",
          "Cotton links with black soil, warm climate, and western-central India; jute links with humid alluvial delta conditions.",
          "Sugarcane, tea, coffee, millets, pulses, oilseeds, spices, rubber, and horticulture need crop-condition-state mapping.",
        ],
        expectedRecallPoints: [
          point(
            "major-crops-state-mapping",
            "crop-condition-method",
            "Crop-condition method",
            "Recall should explain crops through climate, soil, water, season, and region.",
            ["climate", "soil", "water", "season", "region", "crop"]
          ),
          point(
            "major-crops-state-mapping",
            "rice-wheat-belts",
            "Rice and wheat belts",
            "The answer should contrast rice moisture regions with wheat cool irrigated belts.",
            ["rice", "moisture", "eastern", "delta", "wheat", "cool", "irrigated"]
          ),
          point(
            "major-crops-state-mapping",
            "cash-crop-mapping",
            "Cash crop mapping",
            "Recall should map cotton, jute, sugarcane, tea, coffee, millets, pulses, oilseeds, or spices to conditions and states.",
            ["cotton", "jute", "sugarcane", "tea", "coffee", "millets", "pulses", "oilseeds"]
          ),
        ],
      },
      {
        id: "agricultural-revolutions",
        order: 4,
        kind: "ncert",
        title: "Agricultural Revolutions",
        eyebrow: "Technology and output shifts",
        estimatedMinutes: 5,
        body:
          "Agricultural revolutions are shorthand for production changes, technology, institutions, and regional impact. The student should know the sector, key idea, benefit, and limitation rather than memorizing only colours.",
        bullets: [
          "Green Revolution links HYV seeds, irrigation, fertilizers, pesticides, mechanization, wheat-rice gains, and regional inequality.",
          "White Revolution links Operation Flood, dairy cooperatives, milk procurement, and rural income.",
          "Blue, Yellow, Golden, Silver, Pink, Grey, and other revolution labels should be attached to sector and policy logic.",
          "Trap pattern: correct colour with wrong commodity, wrong region, or exaggerated all-India impact.",
        ],
        expectedRecallPoints: [
          point(
            "agricultural-revolutions",
            "green-revolution-logic",
            "Green Revolution logic",
            "Recall should connect Green Revolution with HYV seeds, irrigation, fertilizers, wheat-rice output, and regional inequality.",
            ["green revolution", "hyv", "irrigation", "fertilizer", "wheat", "rice", "inequality"]
          ),
          point(
            "agricultural-revolutions",
            "white-revolution",
            "White Revolution",
            "The answer should connect White Revolution with Operation Flood, dairy cooperatives, and milk production.",
            ["white revolution", "operation flood", "dairy", "cooperative", "milk"]
          ),
          point(
            "agricultural-revolutions",
            "revolution-color-trap",
            "Revolution colour trap",
            "Recall should warn against pairing a revolution colour with the wrong commodity or inflated effect.",
            ["blue", "yellow", "golden", "silver", "pink", "commodity", "trap"]
          ),
        ],
      },
      {
        id: "irrigation-water-stress",
        order: 5,
        kind: "current",
        title: "Irrigation and Water Stress",
        eyebrow: "Water geography",
        estimatedMinutes: 5,
        body:
          "Irrigation is both a productivity tool and a sustainability risk. The student should compare canal, well, tube well, tank, drip, sprinkler, watershed, and micro-irrigation systems with regional suitability.",
        bullets: [
          "Canal irrigation is important in plains and command areas but may cause waterlogging and salinity if poorly managed.",
          "Tube wells expanded groundwater irrigation, especially in alluvial and Green Revolution belts, but created depletion stress.",
          "Tank irrigation is important in peninsular and semi-arid regions where surface storage matters.",
          "Drip and sprinkler systems save water and support precision agriculture but need cost, crop, and maintenance context.",
        ],
        expectedRecallPoints: [
          point(
            "irrigation-water-stress",
            "irrigation-types",
            "Irrigation types",
            "Recall should compare canal, well, tube well, tank, drip, sprinkler, watershed, or micro-irrigation.",
            ["canal", "well", "tube well", "tank", "drip", "sprinkler", "micro irrigation"]
          ),
          point(
            "irrigation-water-stress",
            "groundwater-stress",
            "Groundwater stress",
            "The answer should connect tube wells and intensive agriculture with groundwater depletion.",
            ["tube well", "groundwater", "depletion", "green revolution", "stress"]
          ),
          point(
            "irrigation-water-stress",
            "waterlogging-salinity",
            "Waterlogging and salinity",
            "Recall should include waterlogging and salinity risks in canal or poorly drained command areas.",
            ["waterlogging", "salinity", "canal", "command", "drainage"]
          ),
        ],
      },
      {
        id: "food-security-policy",
        order: 6,
        kind: "advanced",
        title: "Food Security and Agricultural Policy",
        eyebrow: "Procurement and welfare",
        estimatedMinutes: 5,
        body:
          "Food security means availability, access, utilization, and stability. In India it connects production, buffer stock, procurement, MSP, PDS, NFSA, nutrition, storage, transport, and regional crop choices.",
        bullets: [
          "MSP and procurement shape cropping decisions, especially rice-wheat systems in major procurement states.",
          "PDS and NFSA connect farm output with household access to food grains.",
          "Buffer stock supports price stability and emergency response but also raises storage and fiscal questions.",
          "Nutrition security goes beyond cereals and includes pulses, millets, oilseeds, horticulture, dairy, and dietary diversity.",
        ],
        expectedRecallPoints: [
          point(
            "food-security-policy",
            "food-security-pillars",
            "Food security pillars",
            "Recall should define food security through availability, access, utilization, and stability.",
            ["availability", "access", "utilization", "stability", "food security"]
          ),
          point(
            "food-security-policy",
            "msp-procurement-pds",
            "MSP, procurement, and PDS",
            "The answer should connect MSP, procurement, buffer stock, PDS, or NFSA.",
            ["msp", "procurement", "buffer stock", "pds", "nfsa"]
          ),
          point(
            "food-security-policy",
            "nutrition-diversity",
            "Nutrition diversity",
            "Recall should go beyond cereals to pulses, millets, oilseeds, horticulture, dairy, or dietary diversity.",
            ["nutrition", "pulses", "millets", "oilseeds", "horticulture", "dairy", "diversity"]
          ),
        ],
      },
      {
        id: "agricultural-issues",
        order: 7,
        kind: "trap",
        title: "Agricultural Issues and Examiner Traps",
        eyebrow: "Problem-solution logic",
        estimatedMinutes: 5,
        body:
          "Agricultural issues should be remembered as linked problems, not isolated headlines: small holdings, low productivity, input cost, price risk, market access, storage loss, crop diversification, groundwater stress, climate risk, and farmer income.",
        bullets: [
          "Fragmented landholdings affect mechanization, credit, irrigation investment, and productivity.",
          "Price risk connects MSP, mandi access, procurement geography, storage, exports, and private markets.",
          "Climate risk includes heat stress, erratic monsoon, drought, flood, pest outbreaks, and crop insurance challenges.",
          "Trap pattern: one policy presented as a universal solution without region, crop, water, market, or implementation limits.",
        ],
        expectedRecallPoints: [
          point(
            "agricultural-issues",
            "small-holdings-productivity",
            "Small holdings and productivity",
            "Recall should connect fragmented holdings with mechanization, credit, irrigation, and productivity limits.",
            ["small holdings", "fragmented", "mechanization", "credit", "irrigation", "productivity"]
          ),
          point(
            "agricultural-issues",
            "price-market-risk",
            "Price and market risk",
            "The answer should connect price risk with MSP, mandi, procurement, storage, exports, or market access.",
            ["price", "msp", "mandi", "procurement", "storage", "exports", "market"]
          ),
          point(
            "agricultural-issues",
            "climate-risk",
            "Climate risk",
            "Recall should include heat, erratic monsoon, drought, flood, pest, or crop insurance challenges.",
            ["heat", "monsoon", "drought", "flood", "pest", "insurance", "climate"]
          ),
        ],
      },
      {
        id: "agriculture-quick-recall",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before moving to minerals and industry, speak the full Day 11 chain: cropping seasons, crop-state logic, revolutions, irrigation, food security, policy instruments, current issues, map examples, and one examiner trap.",
        bullets: [
          "Start with Kharif-Rabi-Zaid and crop conditions.",
          "Add at least five crop-state or crop-condition examples.",
          "Connect irrigation and food security to policy, farmer income, and sustainability.",
          "Next handoff: Day 12 resources and industry depend on land, water, raw material, energy, transport, and markets.",
        ],
        expectedRecallPoints: [
          point(
            "agriculture-quick-recall",
            "full-day11-chain",
            "Full Day 11 chain",
            "Recall should connect seasons, crops, revolutions, irrigation, food security, policy, issues, and traps.",
            ["kharif", "rabi", "crops", "revolutions", "irrigation", "food security", "policy", "issues"]
          ),
          point(
            "agriculture-quick-recall",
            "crop-map-examples",
            "Crop map examples",
            "The answer should include at least five crop-state or crop-condition examples.",
            ["map", "state", "rice", "wheat", "cotton", "sugarcane", "tea", "millets"]
          ),
          point(
            "agriculture-quick-recall",
            "resources-industry-handoff",
            "Next handoff",
            "The next link is resources and industry because agriculture depends on land, water, energy, transport, and markets.",
            ["resources", "industry", "land", "water", "energy", "transport", "markets"]
          ),
        ],
      },
    ],
  },
  {
    id: "minerals-energy-industry-day12",
    subjectSlug: "geography",
    day: 12,
    cluster: "Cluster 7",
    title: "Minerals, Energy, Industry, and Industrial Corridors",
    subtitle: "Ferrous, non-ferrous, critical minerals, energy geography, iron and steel, textiles, and corridor-led industrial location.",
    status: "draft",
    topicIds: [56, 57, 58, 59, 60, 61, 62],
    sourceLabel: "1. Geography topics.pdf Topics 56-62 draft web module",
    sections: [
      {
        id: "resources-industry-frame",
        order: 1,
        kind: "basic",
        title: "Resources to Industry as One Chain",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Day 12 should be recalled as one chain: mineral location, energy supply, water, labour, transport, market, policy, environmental cost, and industrial corridor. UPSC rarely tests a mine or industry in isolation.",
        bullets: [
          "The safe recall chain is resource -> energy -> transport -> industry -> market -> corridor -> impact.",
          "Mineral belts, power regions, ports, freight corridors, and manufacturing clusters must be mapped together.",
          "Current links include critical minerals, energy transition, semiconductor supply chains, green hydrogen, logistics, and industrial pollution.",
        ],
        expectedRecallPoints: [
          point(
            "resources-industry-frame",
            "resource-industry-chain",
            "Resource-industry chain",
            "Recall should connect resource, energy, transport, industry, market, corridor, and impact.",
            ["resource", "energy", "transport", "industry", "market", "corridor", "impact"]
          ),
          point(
            "resources-industry-frame",
            "map-cluster-thinking",
            "Map cluster thinking",
            "The answer should map mineral belts, power regions, ports, freight corridors, and manufacturing clusters together.",
            ["mineral belt", "power", "port", "freight", "manufacturing", "cluster"]
          ),
        ],
      },
      {
        id: "ferrous-minerals",
        order: 2,
        kind: "basic",
        title: "Ferrous Minerals",
        eyebrow: "Iron, manganese, chromite",
        estimatedMinutes: 5,
        body:
          "Ferrous minerals support iron and steel, alloy industries, and heavy manufacturing. Recall them through ore type, major belts, state clusters, transport links, and industry proximity.",
        bullets: [
          "Iron ore belts include Odisha-Jharkhand, Durg-Bastar-Chandrapur, Bellary-Chitradurga-Chikmagalur-Tumakuru, and Maharashtra-Goa associations.",
          "Manganese is important for steel alloys and is associated with states such as Odisha, Madhya Pradesh, Maharashtra, Karnataka, and Andhra Pradesh.",
          "Chromite is concentrated heavily in Odisha and links with stainless steel, alloys, and strategic industrial use.",
          "Trap pattern: correct mineral paired with wrong belt, wrong state, wrong use, or wrong nearby industry.",
        ],
        expectedRecallPoints: [
          point(
            "ferrous-minerals",
            "iron-ore-belts",
            "Iron ore belts",
            "Recall should name major iron ore belts or state clusters.",
            ["iron ore", "odisha", "jharkhand", "durg", "bastar", "bellary", "goa"]
          ),
          point(
            "ferrous-minerals",
            "manganese-chromite-use",
            "Manganese and chromite use",
            "The answer should connect manganese and chromite with alloys, steel, stainless steel, or strategic use.",
            ["manganese", "chromite", "alloy", "steel", "stainless", "strategic"]
          ),
          point(
            "ferrous-minerals",
            "ferrous-location-trap",
            "Ferrous map trap",
            "Recall should warn against pairing a mineral with the wrong belt, state, use, or industry.",
            ["wrong belt", "wrong state", "wrong use", "industry", "trap"]
          ),
        ],
      },
      {
        id: "non-ferrous-critical-minerals",
        order: 3,
        kind: "current",
        title: "Non-Ferrous and Critical Minerals",
        eyebrow: "Strategic minerals",
        estimatedMinutes: 5,
        body:
          "Non-ferrous and critical minerals connect economic geography with supply-chain security. The student should recall aluminium, copper, lead-zinc, bauxite, mica, limestone, rare earths, lithium, cobalt, nickel, graphite, and other energy-transition minerals through location and use.",
        bullets: [
          "Bauxite links with aluminium and is associated with Odisha, Gujarat, Jharkhand, Maharashtra, Chhattisgarh, and other plateau regions.",
          "Copper, lead-zinc, mica, limestone, and other minerals require state-use pairing.",
          "Critical minerals matter for batteries, electric vehicles, renewable energy, electronics, defence, and clean technology.",
          "Trap pattern: treating all rare earth or critical minerals as available domestically in sufficient quantity.",
        ],
        expectedRecallPoints: [
          point(
            "non-ferrous-critical-minerals",
            "bauxite-aluminium",
            "Bauxite and aluminium",
            "Recall should connect bauxite with aluminium and major plateau/state locations.",
            ["bauxite", "aluminium", "odisha", "gujarat", "jharkhand", "maharashtra", "plateau"]
          ),
          point(
            "non-ferrous-critical-minerals",
            "critical-mineral-use",
            "Critical mineral use",
            "The answer should connect lithium, cobalt, nickel, rare earths, or graphite with batteries, EVs, renewables, electronics, or defence.",
            ["lithium", "cobalt", "nickel", "rare earth", "graphite", "battery", "ev", "renewable"]
          ),
          point(
            "non-ferrous-critical-minerals",
            "supply-chain-risk",
            "Supply-chain risk",
            "Recall should flag import dependence, domestic availability limits, and supply-chain security.",
            ["import", "dependence", "domestic", "supply chain", "security"]
          ),
        ],
      },
      {
        id: "energy-resources",
        order: 4,
        kind: "advanced",
        title: "Energy Resources",
        eyebrow: "Power geography",
        estimatedMinutes: 5,
        body:
          "Energy resources should be read through location, technology, grid, seasonality, cost, environmental impact, and transition strategy. Fossil, hydro, nuclear, solar, wind, biomass, and green hydrogen all have different geography.",
        bullets: [
          "Coal remains tied to eastern and central mineral belts, thermal power, rail freight, and pollution questions.",
          "Petroleum and natural gas connect with offshore and onshore basins, refineries, pipelines, ports, and import dependence.",
          "Solar and wind geography depends on insolation, wind corridors, land, grid evacuation, storage, and intermittency.",
          "Hydro and nuclear power raise location, water, safety, displacement, and ecological questions.",
        ],
        expectedRecallPoints: [
          point(
            "energy-resources",
            "coal-thermal-belt",
            "Coal and thermal belt",
            "Recall should connect coal belts with thermal power, rail freight, and pollution.",
            ["coal", "thermal", "rail", "freight", "pollution", "eastern", "central"]
          ),
          point(
            "energy-resources",
            "oil-gas-location",
            "Oil and gas geography",
            "The answer should connect oil and gas with basins, refineries, pipelines, ports, and import dependence.",
            ["oil", "gas", "basin", "refinery", "pipeline", "port", "import"]
          ),
          point(
            "energy-resources",
            "renewable-transition",
            "Renewable transition",
            "Recall should connect solar, wind, grid, storage, intermittency, and green hydrogen.",
            ["solar", "wind", "grid", "storage", "intermittency", "green hydrogen"]
          ),
        ],
      },
      {
        id: "iron-steel-industry",
        order: 5,
        kind: "basic",
        title: "Iron and Steel Industry",
        eyebrow: "Location factors",
        estimatedMinutes: 5,
        body:
          "Iron and steel location depends on iron ore, coking coal, limestone, water, power, labour, transport, market, technology, and policy. Older plants clustered near raw materials; newer plants may follow ports, markets, and corridors.",
        bullets: [
          "Classic clusters include Jamshedpur, Bokaro, Rourkela, Bhilai, Durgapur, Burnpur, Visakhapatnam, Salem, Vijayanagar, and other public/private plants.",
          "Chotanagpur and nearby belts became important because of proximity to iron ore, coal, limestone, water, and transport.",
          "Coastal plants can use imported coking coal and port logistics.",
          "Trap pattern: plant-state pair, raw material logic, public/private plant, or port versus inland location.",
        ],
        expectedRecallPoints: [
          point(
            "iron-steel-industry",
            "steel-location-factors",
            "Steel location factors",
            "Recall should include iron ore, coking coal, limestone, water, power, labour, transport, market, and policy.",
            ["iron ore", "coking coal", "limestone", "water", "power", "transport", "market"]
          ),
          point(
            "iron-steel-industry",
            "steel-plant-map",
            "Steel plant map",
            "The answer should name major steel plant clusters or locations.",
            ["jamshedpur", "bokaro", "rourkela", "bhilai", "durgapur", "visakhapatnam", "salem"]
          ),
          point(
            "iron-steel-industry",
            "inland-coastal-contrast",
            "Inland and coastal contrast",
            "Recall should contrast raw-material-based inland plants with port-linked or market-linked newer plants.",
            ["inland", "coastal", "port", "raw material", "market", "newer"]
          ),
        ],
      },
      {
        id: "textile-industry",
        order: 6,
        kind: "advanced",
        title: "Textile Industry",
        eyebrow: "Cotton, jute, silk, wool, synthetics",
        estimatedMinutes: 5,
        body:
          "Textiles are location-sensitive because raw material, humidity, labour, power, ports, markets, technology, and export networks matter. The student should compare cotton, jute, silk, woollen, handloom, and synthetic textile geography.",
        bullets: [
          "Cotton textile geography historically links with Mumbai-Ahmedabad belt, black cotton soil region, ports, labour, capital, and markets.",
          "Jute industry clusters around the Hugli belt due to raw jute, water, port access, labour, and historical factors.",
          "Silk, woollen, handloom, powerloom, and synthetic textiles each have different raw material and labour geography.",
          "Trap pattern: confusing raw cotton region with textile mill location, or jute crop location with jute mill cluster.",
        ],
        expectedRecallPoints: [
          point(
            "textile-industry",
            "cotton-textile-belt",
            "Cotton textile belt",
            "Recall should connect cotton textiles with Mumbai-Ahmedabad, black soil, ports, labour, capital, and market.",
            ["cotton", "mumbai", "ahmedabad", "black soil", "port", "labour", "market"]
          ),
          point(
            "textile-industry",
            "jute-hugli-belt",
            "Jute Hugli belt",
            "The answer should connect jute industry with the Hugli belt, raw jute, water, port, labour, and history.",
            ["jute", "hugli", "raw jute", "water", "port", "labour"]
          ),
          point(
            "textile-industry",
            "textile-location-trap",
            "Textile location trap",
            "Recall should separate crop-growing regions from textile mill or processing clusters.",
            ["raw cotton", "mill", "crop", "cluster", "jute", "trap"]
          ),
        ],
      },
      {
        id: "industrial-corridors",
        order: 7,
        kind: "current",
        title: "Industrial Corridors and Logistics",
        eyebrow: "Manufacturing geography",
        estimatedMinutes: 5,
        body:
          "Industrial corridors are not only highways. They combine freight routes, nodes, ports, power, land, cities, investment regions, logistics, manufacturing clusters, and policy incentives.",
        bullets: [
          "Important corridors include Delhi-Mumbai, Chennai-Bengaluru, Bengaluru-Mumbai, Amritsar-Kolkata, East Coast, Hyderabad-Nagpur, Hyderabad-Bengaluru, and Hyderabad-Warangal links.",
          "Dedicated freight corridors, expressways, ports, airports, logistics parks, and industrial nodes shape corridor success.",
          "Corridors connect with urbanization, labour migration, land acquisition, environmental clearance, and regional imbalance.",
          "Trap pattern: corridor route, state coverage, anchor city, or confusing industrial corridor with only a road corridor.",
        ],
        expectedRecallPoints: [
          point(
            "industrial-corridors",
            "corridor-components",
            "Corridor components",
            "Recall should define industrial corridors through freight, nodes, ports, land, cities, logistics, and policy incentives.",
            ["freight", "nodes", "ports", "land", "cities", "logistics", "policy"]
          ),
          point(
            "industrial-corridors",
            "major-corridors",
            "Major corridors",
            "The answer should name major industrial corridors or anchor-city pairs.",
            ["delhi-mumbai", "chennai-bengaluru", "amritsar-kolkata", "east coast", "hyderabad"]
          ),
          point(
            "industrial-corridors",
            "corridor-impact",
            "Corridor impact",
            "Recall should connect corridors with urbanization, jobs, migration, land, environment, or regional imbalance.",
            ["urbanization", "jobs", "migration", "land", "environment", "regional imbalance"]
          ),
        ],
      },
      {
        id: "resources-industry-traps-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Examiner Traps and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 4,
        body:
          "Before moving to transport and ports, speak the full Day 12 chain: minerals, energy, industry location, textiles, corridors, map examples, current links, and one examiner trap.",
        bullets: [
          "Start with mineral belts and energy geography, then connect them to steel, textiles, and corridors.",
          "Include at least five map anchors: one ferrous belt, one non-ferrous mineral state, one energy basin or power region, one steel plant, and one corridor.",
          "Correct one trap: wrong mineral-state pair, wrong plant-state pair, wrong corridor route, or treating corridors as only roads.",
          "Next handoff: Day 13 transport and ports depend on the industrial location logic built today.",
        ],
        expectedRecallPoints: [
          point(
            "resources-industry-traps-handoff",
            "full-day12-chain",
            "Full Day 12 chain",
            "Recall should connect minerals, energy, steel, textiles, corridors, map examples, current links, and traps.",
            ["minerals", "energy", "steel", "textiles", "corridors", "map", "current", "traps"]
          ),
          point(
            "resources-industry-traps-handoff",
            "five-industrial-map-anchors",
            "Five industrial map anchors",
            "The answer should include at least five map anchors across mineral, energy, plant, and corridor geography.",
            ["map", "mineral", "energy", "plant", "corridor", "belt"]
          ),
          point(
            "resources-industry-traps-handoff",
            "transport-handoff",
            "Transport handoff",
            "The next link is Day 13 transport and ports because industry depends on logistics.",
            ["transport", "ports", "logistics", "day 13", "handoff"]
          ),
        ],
      },
    ],
  },
  {
    id: "soils-forests-day10",
    subjectSlug: "geography",
    day: 10,
    cluster: "Cluster 8",
    title: "Indian Soils, Degradation, Forest Types, and Forest Policy",
    subtitle: "Soil classification, erosion, degradation, Indian forest types, forest cover, and conservation policy.",
    status: "draft",
    topicIds: [46, 47, 48, 49],
    sourceLabel: "1. Geography topics.pdf Topics 46-49 draft web module",
    sections: [
      {
        id: "soil-forest-system-frame",
        order: 1,
        kind: "basic",
        title: "Soil and Forest as One Ecology Chain",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Soils and forests should be read together because climate, parent rock, relief, drainage, organisms, time, land use, agriculture, biodiversity, and policy all interact. UPSC tests this chain through maps, statements, and conservation examples.",
        bullets: [
          "The safe recall chain is climate -> rock -> relief -> soil -> vegetation -> land use -> degradation -> policy.",
          "Soil and forest questions often mix physical geography with agriculture, environment, economy, and current affairs.",
          "Map memory matters: soil regions, forest belts, degraded zones, and conservation landscapes must be placed spatially.",
        ],
        expectedRecallPoints: [
          point(
            "soil-forest-system-frame",
            "soil-forest-chain",
            "Soil-forest chain",
            "Recall should connect climate, rock, relief, soil, vegetation, land use, degradation, and policy.",
            ["climate", "rock", "relief", "soil", "vegetation", "land use", "degradation", "policy"]
          ),
          point(
            "soil-forest-system-frame",
            "map-memory-soil-forest",
            "Soil and forest map memory",
            "The answer should include spatial examples for soil regions, forest belts, degraded zones, or conservation landscapes.",
            ["map", "soil region", "forest belt", "degraded", "conservation", "landscape"]
          ),
        ],
      },
      {
        id: "soil-classification-types",
        order: 2,
        kind: "basic",
        title: "Soil Classification and Types",
        eyebrow: "Indian soil map",
        estimatedMinutes: 6,
        body:
          "Indian soil types should be recalled through formation, location, properties, crops, limitations, and trap words. The student should not memorize soil names without climate-rock-relief logic.",
        bullets: [
          "Alluvial soil dominates northern plains and river valleys; Khadar and Bhangar need separate recall.",
          "Black soil is linked with basaltic Deccan Trap region, clayey texture, moisture retention, and cotton but can crack in dry season.",
          "Red and yellow soils are linked with crystalline rocks, iron content, leaching, and peninsular uplands.",
          "Laterite, arid, saline-alkaline, peaty, forest/mountain, and other soils need location-property-crop pairing.",
        ],
        expectedRecallPoints: [
          point(
            "soil-classification-types",
            "alluvial-soil",
            "Alluvial soil",
            "Recall should connect alluvial soil with river deposition, northern plains, Khadar, Bhangar, and fertility.",
            ["alluvial", "river", "northern plains", "khadar", "bhangar", "fertile"]
          ),
          point(
            "soil-classification-types",
            "black-soil",
            "Black soil",
            "The answer should connect black soil with Deccan basalt, clayey texture, moisture retention, cracks, and cotton.",
            ["black soil", "deccan", "basalt", "clayey", "moisture", "cotton", "crack"]
          ),
          point(
            "soil-classification-types",
            "laterite-red-arid-soils",
            "Other soil map pairs",
            "Recall should map red/yellow, laterite, arid, saline, peaty, or forest soils to location and properties.",
            ["red soil", "laterite", "arid", "saline", "peaty", "forest soil", "property"]
          ),
        ],
      },
      {
        id: "soil-erosion-degradation",
        order: 3,
        kind: "current",
        title: "Soil Erosion and Degradation",
        eyebrow: "Land degradation",
        estimatedMinutes: 5,
        body:
          "Soil degradation is a process chain: erosion, nutrient loss, salinization, waterlogging, desertification, compaction, acidification, and pollution. The student should connect causes, regions, impacts, and conservation measures.",
        bullets: [
          "Erosion types include sheet, rill, gully, ravine, wind, stream-bank, and coastal erosion depending on agent and setting.",
          "Major causes include deforestation, overgrazing, faulty irrigation, shifting cultivation, mining, urbanization, and intensive farming.",
          "Conservation methods include contour bunding, terracing, shelterbelts, afforestation, check dams, mulching, crop rotation, and watershed management.",
          "Current links include desertification, land degradation neutrality, ravines, groundwater stress, and climate-resilient agriculture.",
        ],
        expectedRecallPoints: [
          point(
            "soil-erosion-degradation",
            "erosion-types",
            "Erosion types",
            "Recall should distinguish sheet, rill, gully, ravine, wind, bank, or coastal erosion.",
            ["sheet", "rill", "gully", "ravine", "wind erosion", "bank", "coastal"]
          ),
          point(
            "soil-erosion-degradation",
            "degradation-causes",
            "Degradation causes",
            "The answer should connect degradation with deforestation, overgrazing, faulty irrigation, mining, urbanization, or intensive farming.",
            ["deforestation", "overgrazing", "irrigation", "mining", "urbanization", "intensive farming"]
          ),
          point(
            "soil-erosion-degradation",
            "conservation-measures",
            "Soil conservation measures",
            "Recall should include contouring, terracing, shelterbelts, afforestation, check dams, mulching, rotation, or watershed management.",
            ["contour", "terracing", "shelterbelt", "afforestation", "check dam", "mulching", "watershed"]
          ),
        ],
      },
      {
        id: "forest-types-india",
        order: 4,
        kind: "basic",
        title: "Forest Types of India",
        eyebrow: "Vegetation-climate match",
        estimatedMinutes: 5,
        body:
          "Forest types must be recalled through rainfall, temperature, altitude, soil, species, and region. The key is to explain why a forest type occurs there, not simply list trees.",
        bullets: [
          "Tropical evergreen and semi-evergreen forests are linked with high rainfall, Western Ghats, Northeast, and island regions.",
          "Tropical moist and dry deciduous forests occupy large monsoonal belts and include species such as sal and teak.",
          "Thorn, montane, alpine, littoral, swamp, and mangrove forests need climate-altitude-water-salinity logic.",
          "Forest-type questions often become species-region or rainfall-vegetation traps.",
        ],
        expectedRecallPoints: [
          point(
            "forest-types-india",
            "evergreen-deciduous",
            "Evergreen and deciduous contrast",
            "Recall should contrast high-rainfall evergreen forests with monsoonal deciduous forests.",
            ["evergreen", "semi-evergreen", "deciduous", "rainfall", "monsoon", "western ghats", "northeast"]
          ),
          point(
            "forest-types-india",
            "thorn-montane-mangrove",
            "Special forest types",
            "The answer should include thorn, montane, alpine, littoral, swamp, or mangrove forest logic.",
            ["thorn", "montane", "alpine", "littoral", "swamp", "mangrove"]
          ),
          point(
            "forest-types-india",
            "species-region-trap",
            "Species-region trap",
            "Recall should warn that species-region and rainfall-vegetation pairings are common traps.",
            ["species", "region", "rainfall", "vegetation", "trap"]
          ),
        ],
      },
      {
        id: "forest-cover-policy",
        order: 5,
        kind: "advanced",
        title: "Forest Cover and Policy",
        eyebrow: "Conservation governance",
        estimatedMinutes: 5,
        body:
          "Forest cover questions connect satellite assessment, legal categories, biodiversity, tribal rights, climate commitments, plantations, degradation, and conservation policy. Forest cover and forest area are not always the same idea.",
        bullets: [
          "Forest cover is measured using remote sensing classes such as very dense, moderately dense, open forest, and scrub.",
          "Forest area is legally recorded area, while tree cover and forest cover can differ from legal categories.",
          "Policies and institutions include National Forest Policy, Forest Conservation Act, FRA, CAMPA, JFM, protected areas, and biodiversity governance.",
          "Current links include carbon sinks, compensatory afforestation, forest fires, invasive species, human-wildlife conflict, and ecological restoration.",
        ],
        expectedRecallPoints: [
          point(
            "forest-cover-policy",
            "forest-cover-classes",
            "Forest cover classes",
            "Recall should mention very dense, moderately dense, open forest, and scrub or remote sensing classes.",
            ["very dense", "moderately dense", "open forest", "scrub", "remote sensing"]
          ),
          point(
            "forest-cover-policy",
            "forest-area-cover-tree-cover",
            "Forest area, forest cover, tree cover",
            "The answer should distinguish legal forest area, forest cover, and tree cover.",
            ["forest area", "forest cover", "tree cover", "legal", "recorded"]
          ),
          point(
            "forest-cover-policy",
            "forest-policy-instruments",
            "Forest policy instruments",
            "Recall should include National Forest Policy, Forest Conservation Act, FRA, CAMPA, JFM, or protected areas.",
            ["national forest policy", "forest conservation", "fra", "campa", "jfm", "protected area"]
          ),
        ],
      },
      {
        id: "soil-forest-traps",
        order: 6,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Statement correction",
        estimatedMinutes: 4,
        body:
          "Soil and forest traps usually mix process, location, category, and policy. A strong answer identifies the wrong word, corrects it, and adds a map example.",
        bullets: [
          "Soil traps: alluvial versus black soil, laterite versus red soil, saline versus arid soil, Khadar versus Bhangar.",
          "Forest traps: evergreen versus deciduous rainfall, mangrove versus littoral, legal forest area versus forest cover.",
          "Policy traps: plantation as forest quality, compensatory afforestation as automatic ecological equivalence, or FRA as only a forest-loss issue.",
          "PYQ style: map-pair, statement correction, match-the-following, how-many-correct, and NOT/exception.",
        ],
        expectedRecallPoints: [
          point(
            "soil-forest-traps",
            "soil-pair-traps",
            "Soil pair traps",
            "Recall should flag alluvial/black, laterite/red, saline/arid, or Khadar/Bhangar confusion.",
            ["alluvial", "black soil", "laterite", "red soil", "saline", "arid", "khadar", "bhangar"]
          ),
          point(
            "soil-forest-traps",
            "forest-category-traps",
            "Forest category traps",
            "The answer should flag evergreen/deciduous, mangrove/littoral, or forest area/forest cover confusion.",
            ["evergreen", "deciduous", "mangrove", "littoral", "forest area", "forest cover"]
          ),
          point(
            "soil-forest-traps",
            "policy-quality-trap",
            "Policy quality trap",
            "Recall should avoid treating plantation, compensatory afforestation, or legal category as automatic ecological quality.",
            ["plantation", "compensatory afforestation", "legal", "ecological", "quality"]
          ),
        ],
      },
      {
        id: "soil-forest-quick-recall",
        order: 7,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before moving to agriculture or resources, speak the full Day 10 chain: soil formation, soil types, degradation, conservation, forest types, forest cover, policy, current links, and one examiner trap.",
        bullets: [
          "Start with soil-forming factors and Indian soil type map examples.",
          "Add degradation causes and conservation methods.",
          "Then connect forest types, forest cover classes, legal/policy tools, and conservation issues.",
          "Next handoff: agriculture and resources depend on soil fertility, water, forests, land degradation, and policy.",
        ],
        expectedRecallPoints: [
          point(
            "soil-forest-quick-recall",
            "full-day10-chain",
            "Full Day 10 chain",
            "Recall should connect soil types, degradation, conservation, forest types, forest cover, policy, current links, and traps.",
            ["soil types", "degradation", "conservation", "forest types", "forest cover", "policy", "current", "traps"]
          ),
          point(
            "soil-forest-quick-recall",
            "soil-forest-map-examples",
            "Soil and forest map examples",
            "The answer should include soil region and forest belt examples.",
            ["map", "soil", "forest", "region", "belt", "example"]
          ),
          point(
            "soil-forest-quick-recall",
            "agriculture-resources-handoff",
            "Next handoff",
            "The next link is agriculture and resources because they depend on soil, water, forests, and land quality.",
            ["agriculture", "resources", "soil", "water", "forests", "land quality"]
          ),
        ],
      },
    ],
  },
  {
    id: "world-geography-day14",
    subjectSlug: "geography",
    day: 14,
    cluster: "Cluster 9",
    title: "World Geography: Physiography, Rivers, Lakes, Straits, and Biomes",
    subtitle: "World relief, river systems, lakes, maritime chokepoints, and biome-region logic for map-based recall.",
    status: "draft",
    topicIds: [67, 68, 69, 70, 71],
    sourceLabel: "1. Geography topics.pdf Topics 67-71 draft web module",
    sections: [
      {
        id: "world-map-frame",
        order: 1,
        kind: "basic",
        title: "World Geography as Map Relationships",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "World geography should be recalled through map relationships: relief controls rivers, rivers build plains and deltas, lakes record tectonic or glacial history, straits connect seas and trade, and biomes show climate-vegetation logic.",
        bullets: [
          "The safe recall chain is continent -> relief -> drainage -> water body -> route/chokepoint -> biome -> current link.",
          "World map questions punish isolated names because the trap is usually wrong continent, wrong sea, wrong border, or wrong climate zone.",
          "Every answer should include at least one location cue and one reason why the feature matters.",
        ],
        expectedRecallPoints: [
          point(
            "world-map-frame",
            "world-map-chain",
            "World map chain",
            "Recall should connect continent, relief, drainage, water body, route, chokepoint, biome, and current link.",
            ["continent", "relief", "drainage", "water body", "route", "chokepoint", "biome", "current"]
          ),
          point(
            "world-map-frame",
            "location-plus-importance",
            "Location plus importance",
            "The answer should include a location cue and explain why the feature matters.",
            ["location", "map", "why", "matters", "importance", "cue"]
          ),
        ],
      },
      {
        id: "world-physiography",
        order: 2,
        kind: "basic",
        title: "World Physiography",
        eyebrow: "Continental relief",
        estimatedMinutes: 5,
        body:
          "World physiography should be organized by continents and major relief belts: mountains, plateaus, plains, basins, deserts, rift valleys, and coastal margins. The student should connect each feature to plate tectonics, climate, drainage, or resources.",
        bullets: [
          "Major mountain systems include Rockies, Andes, Alps, Himalayas, Atlas, Urals, Caucasus, Great Dividing Range, and East African highlands.",
          "Important plateaus and basins include Tibetan Plateau, Brazilian Highlands, Patagonian Plateau, Colorado Plateau, Congo Basin, Amazon Basin, and Murray-Darling Basin.",
          "Rift valleys, deserts, plains, and highlands should be tied to tectonics, rainfall, rain shadow, or drainage.",
          "Trap pattern: correct landform paired with wrong continent, wrong plate setting, or wrong river basin.",
        ],
        expectedRecallPoints: [
          point(
            "world-physiography",
            "major-relief-belts",
            "Major relief belts",
            "Recall should name major world mountains, plateaus, plains, basins, deserts, or rift valleys.",
            ["rockies", "andes", "alps", "atlas", "urals", "plateau", "basin", "rift", "desert"]
          ),
          point(
            "world-physiography",
            "relief-process-link",
            "Relief-process link",
            "The answer should connect relief with tectonics, climate, drainage, or resources.",
            ["tectonics", "climate", "drainage", "resources", "rain shadow", "plate"]
          ),
          point(
            "world-physiography",
            "continent-pair-trap",
            "Continent pair trap",
            "Recall should warn against placing a landform in the wrong continent, plate setting, or basin.",
            ["wrong continent", "wrong plate", "wrong basin", "trap"]
          ),
        ],
      },
      {
        id: "world-rivers",
        order: 3,
        kind: "advanced",
        title: "World Rivers",
        eyebrow: "Drainage systems",
        estimatedMinutes: 5,
        body:
          "World river systems should be remembered by continent, source region, flow direction, basin, mouth, delta or estuary, and current relevance. The student should not memorize river names without basin logic.",
        bullets: [
          "High-yield rivers include Nile, Congo, Niger, Zambezi, Amazon, Orinoco, Mississippi-Missouri, St. Lawrence, Danube, Rhine, Volga, Mekong, Yangtze, Huang He, Tigris-Euphrates, Murray-Darling, and Amur.",
          "Connect rivers with deserts, rainforests, plains, deltas, hydropower, navigation, floods, water conflict, and biodiversity.",
          "Delta/estuary, source/mouth, tributary, and country-pair questions are common map traps.",
          "Current links include Nile dam politics, Mekong hydropower, Amazon rainforest, Mississippi navigation, and European river transport.",
        ],
        expectedRecallPoints: [
          point(
            "world-rivers",
            "major-world-rivers",
            "Major world rivers",
            "Recall should name major rivers across Africa, Americas, Europe, Asia, and Australia.",
            ["nile", "congo", "amazon", "mississippi", "danube", "rhine", "mekong", "yangtze", "murray"]
          ),
          point(
            "world-rivers",
            "river-basin-logic",
            "River basin logic",
            "The answer should connect rivers with basin, source, mouth, delta, estuary, navigation, hydropower, or conflict.",
            ["basin", "source", "mouth", "delta", "estuary", "navigation", "hydropower", "conflict"]
          ),
          point(
            "world-rivers",
            "river-current-link",
            "Current bridge",
            "Recall should attach one river to a current link such as dams, hydropower, rainforest, trade, flood, or conflict.",
            ["dam", "hydropower", "rainforest", "trade", "flood", "conflict", "current"]
          ),
        ],
      },
      {
        id: "world-lakes",
        order: 4,
        kind: "basic",
        title: "World Lakes",
        eyebrow: "Lake origin and location",
        estimatedMinutes: 5,
        body:
          "World lakes should be recalled through origin, location, drainage, salinity, depth, and ecological or geopolitical relevance. Lake-origin logic prevents the student from treating every lake as the same map fact.",
        bullets: [
          "High-yield lakes include Superior, Michigan, Huron, Erie, Ontario, Baikal, Victoria, Tanganyika, Malawi, Chad, Titicaca, Caspian Sea, Aral Sea, Dead Sea, Great Salt Lake, and Lake Eyre.",
          "Lake origins include tectonic, glacial, volcanic, salt, rift, remnant sea, and endorheic basin conditions.",
          "Deep lakes such as Baikal and Tanganyika should be connected with rift/tectonic origin.",
          "Current links include Aral Sea shrinkage, Lake Chad decline, Great Lakes freshwater, Dead Sea salinity, and Caspian geopolitics.",
        ],
        expectedRecallPoints: [
          point(
            "world-lakes",
            "major-world-lakes",
            "Major world lakes",
            "Recall should name major lakes and place them by region or continent.",
            ["superior", "baikal", "victoria", "tanganyika", "chad", "titicaca", "caspian", "aral", "dead sea"]
          ),
          point(
            "world-lakes",
            "lake-origin-logic",
            "Lake origin logic",
            "The answer should classify lakes by tectonic, glacial, volcanic, salt, rift, remnant sea, or endorheic origin.",
            ["tectonic", "glacial", "volcanic", "salt", "rift", "remnant", "endorheic"]
          ),
          point(
            "world-lakes",
            "lake-current-link",
            "Lake current bridge",
            "Recall should attach one lake to freshwater, salinity, shrinkage, geopolitics, or ecology.",
            ["freshwater", "salinity", "shrinkage", "geopolitics", "ecology", "current"]
          ),
        ],
      },
      {
        id: "straits-channels",
        order: 5,
        kind: "current",
        title: "Straits and Channels",
        eyebrow: "Maritime chokepoints",
        estimatedMinutes: 6,
        body:
          "Straits and channels are tested because they connect seas, oceans, trade routes, naval geography, energy flows, and conflict zones. The student must know what each strait connects and what it separates.",
        bullets: [
          "High-yield examples include Malacca, Hormuz, Bab el-Mandeb, Bosporus, Dardanelles, Gibraltar, Dover, Bering, Magellan, Torres, Palk, Sunda, Lombok, and Mozambique Channel.",
          "Every strait should be recalled with connects-separates logic: two water bodies and two landmasses or political regions.",
          "Current links include oil trade, Red Sea security, Black Sea access, Indo-Pacific sea lanes, and naval chokepoints.",
          "Trap pattern: correct strait with wrong sea, wrong country pair, wrong ocean, or wrong direction.",
        ],
        expectedRecallPoints: [
          point(
            "straits-channels",
            "major-straits",
            "Major straits and channels",
            "Recall should name major straits and channels across world maritime geography.",
            ["malacca", "hormuz", "bab el-mandeb", "bosporus", "gibraltar", "bering", "magellan", "palk"]
          ),
          point(
            "straits-channels",
            "connects-separates-logic",
            "Connects-separates logic",
            "The answer should state what a strait connects and what it separates.",
            ["connects", "separates", "sea", "ocean", "landmass", "country"]
          ),
          point(
            "straits-channels",
            "maritime-current-link",
            "Maritime current bridge",
            "Recall should connect straits with oil, trade, naval access, sea lanes, security, or chokepoints.",
            ["oil", "trade", "naval", "sea lanes", "security", "chokepoint"]
          ),
        ],
      },
      {
        id: "world-biomes",
        order: 6,
        kind: "advanced",
        title: "World Biomes",
        eyebrow: "Climate-vegetation regions",
        estimatedMinutes: 5,
        body:
          "Biomes are climate-vegetation-animal adaptations across space. The student should connect temperature, rainfall, seasonality, soil, vegetation structure, latitude, and human pressure.",
        bullets: [
          "Major biomes include tropical rainforest, savanna, desert, Mediterranean, temperate grassland, temperate deciduous forest, taiga, tundra, alpine, and polar regions.",
          "Each biome needs location examples, climate conditions, dominant vegetation, soil tendency, and one current threat.",
          "Biomes link climatology, ecology, agriculture, biodiversity, and climate change.",
          "Trap pattern: correct biome paired with wrong rainfall season, wrong vegetation, wrong latitude, or wrong continent.",
        ],
        expectedRecallPoints: [
          point(
            "world-biomes",
            "major-biomes",
            "Major biomes",
            "Recall should name major world biomes from tropical rainforest to tundra and polar regions.",
            ["rainforest", "savanna", "desert", "mediterranean", "grassland", "taiga", "tundra", "polar"]
          ),
          point(
            "world-biomes",
            "biome-climate-vegetation",
            "Biome climate-vegetation link",
            "The answer should connect biome with temperature, rainfall, seasonality, soil, vegetation, and latitude.",
            ["temperature", "rainfall", "seasonality", "soil", "vegetation", "latitude"]
          ),
          point(
            "world-biomes",
            "biome-threat-link",
            "Biome threat link",
            "Recall should attach one biome to human pressure, biodiversity loss, agriculture, fire, desertification, or climate change.",
            ["human pressure", "biodiversity", "agriculture", "fire", "desertification", "climate change"]
          ),
        ],
      },
      {
        id: "world-geography-traps",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Map-pair correction",
        estimatedMinutes: 4,
        body:
          "World geography traps usually use familiar names with one wrong map relationship. The correction method is simple: locate the feature, state its neighbors, explain its process, and then reject the wrong pair.",
        bullets: [
          "Physiography traps: wrong continent, wrong plate boundary, wrong desert-rain shadow, wrong basin.",
          "River and lake traps: wrong source, mouth, tributary, drainage basin, lake origin, or sea connection.",
          "Strait traps: wrong water bodies, wrong countries, wrong sea lane, or wrong strategic role.",
          "Biome traps: wrong climate, rainfall season, vegetation, latitude, or continent.",
        ],
        expectedRecallPoints: [
          point(
            "world-geography-traps",
            "map-pair-correction",
            "Map-pair correction",
            "Recall should use location, neighbors, process, and wrong-pair rejection.",
            ["location", "neighbors", "process", "wrong pair", "reject", "map"]
          ),
          point(
            "world-geography-traps",
            "world-feature-traps",
            "World feature traps",
            "The answer should flag traps across physiography, rivers, lakes, straits, and biomes.",
            ["physiography", "river", "lake", "strait", "biome", "trap"]
          ),
        ],
      },
      {
        id: "world-geography-quick-recall",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before moving to human geography, speak the full Day 14 chain: continents, relief, river systems, lakes, straits, biomes, current links, and one map-pair trap.",
        bullets: [
          "Start with continent and relief, then connect rivers and lakes to basins and climate.",
          "Add at least five map anchors: one mountain or plateau, one river, one lake, one strait, and one biome.",
          "Correct one trap by stating what is wrong and the correct map relationship.",
          "Next handoff: Day 15 human geography depends on how population, migration, urbanization, and culture interact with physical regions.",
        ],
        expectedRecallPoints: [
          point(
            "world-geography-quick-recall",
            "full-day14-chain",
            "Full Day 14 chain",
            "Recall should connect relief, rivers, lakes, straits, biomes, current links, and map traps.",
            ["relief", "rivers", "lakes", "straits", "biomes", "current", "map traps"]
          ),
          point(
            "world-geography-quick-recall",
            "five-world-map-anchors",
            "Five world map anchors",
            "The answer should include one relief, river, lake, strait, and biome example.",
            ["mountain", "plateau", "river", "lake", "strait", "biome", "example"]
          ),
          point(
            "world-geography-quick-recall",
            "human-geography-handoff",
            "Human geography handoff",
            "The next link is human geography because population, migration, cities, and culture interact with physical regions.",
            ["human geography", "population", "migration", "urbanization", "culture", "physical regions"]
          ),
        ],
      },
    ],
  },
  {
    id: "climatology-basics-day5",
    subjectSlug: "geography",
    day: 5,
    cluster: "Cluster 10",
    title: "Climatology Basics: Atmosphere, Insolation, Temperature, Winds, and Jet Streams",
    subtitle: "Atmospheric structure, heat budget, temperature distribution, pressure belts, global winds, jet streams, and local winds.",
    status: "draft",
    topicIds: [13, 14, 15, 16, 17, 18],
    sourceLabel: "1. Geography topics.pdf Topics 13-18 draft web module",
    sections: [
      {
        id: "climatology-system-frame",
        order: 1,
        kind: "basic",
        title: "Climatology as Energy Movement",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Climatology basics should be recalled as energy movement through the atmosphere. Insolation creates unequal heating, unequal heating creates pressure differences, pressure differences create winds, and winds redistribute heat and moisture.",
        bullets: [
          "The safe recall chain is Sun -> insolation -> heat budget -> temperature -> pressure -> winds -> circulation.",
          "Atmosphere questions often become statement traps because one wrong layer, gas, altitude, or wind direction changes the answer.",
          "This day prepares the student for Day 6 weather systems and Day 7 monsoon-ocean links.",
        ],
        expectedRecallPoints: [
          point(
            "climatology-system-frame",
            "energy-movement-chain",
            "Energy movement chain",
            "Recall should connect Sun, insolation, heat budget, temperature, pressure, winds, and circulation.",
            ["sun", "insolation", "heat budget", "temperature", "pressure", "winds", "circulation"]
          ),
          point(
            "climatology-system-frame",
            "weather-monsoon-handoff",
            "Weather and monsoon handoff",
            "The answer should connect Day 5 basics with weather systems and monsoon-ocean links.",
            ["weather", "monsoon", "ocean", "day 6", "day 7", "handoff"]
          ),
        ],
      },
      {
        id: "atmosphere-composition-structure",
        order: 2,
        kind: "basic",
        title: "Atmosphere: Composition and Structure",
        eyebrow: "Layers and gases",
        estimatedMinutes: 5,
        body:
          "Atmosphere composition and structure should be recalled through gases, aerosols, water vapour, ozone, and vertical layers. The student must connect layer properties with weather, ozone absorption, meteors, radio waves, and satellites.",
        bullets: [
          "Major gases include nitrogen, oxygen, argon, carbon dioxide, water vapour, ozone, and trace gases.",
          "Troposphere contains most weather; stratosphere contains the ozone layer and temperature inversion.",
          "Mesosphere burns meteors; thermosphere includes ionosphere behavior; exosphere fades into space.",
          "Trap pattern: correct layer with wrong temperature trend, wrong phenomenon, or wrong gas role.",
        ],
        expectedRecallPoints: [
          point(
            "atmosphere-composition-structure",
            "atmosphere-gases",
            "Atmospheric gases",
            "Recall should name major atmospheric gases and the role of water vapour, ozone, or carbon dioxide.",
            ["nitrogen", "oxygen", "argon", "carbon dioxide", "water vapour", "ozone"]
          ),
          point(
            "atmosphere-composition-structure",
            "atmosphere-layers",
            "Atmospheric layers",
            "The answer should distinguish troposphere, stratosphere, mesosphere, thermosphere, ionosphere, and exosphere.",
            ["troposphere", "stratosphere", "mesosphere", "thermosphere", "ionosphere", "exosphere"]
          ),
          point(
            "atmosphere-composition-structure",
            "layer-function-trap",
            "Layer-function trap",
            "Recall should warn against pairing a layer with the wrong phenomenon or temperature trend.",
            ["weather", "ozone", "meteors", "radio", "temperature", "trap"]
          ),
        ],
      },
      {
        id: "insolation-heat-budget",
        order: 3,
        kind: "advanced",
        title: "Insolation and Heat Budget",
        eyebrow: "Earth energy balance",
        estimatedMinutes: 5,
        body:
          "Insolation is incoming solar radiation received by Earth. Heat budget is the balance between incoming solar radiation and outgoing terrestrial radiation. The student should explain angle of incidence, day length, cloud cover, albedo, latitude, and greenhouse effect.",
        bullets: [
          "Insolation varies with latitude, season, angle, duration, transparency, clouds, and land-water contrast.",
          "Albedo is reflectivity; high albedo surfaces reflect more and absorb less.",
          "Earth emits longwave radiation, while the atmosphere absorbs and re-emits part of it through greenhouse gases.",
          "Trap pattern: confusing insolation with temperature or treating greenhouse effect as only harmful.",
        ],
        expectedRecallPoints: [
          point(
            "insolation-heat-budget",
            "insolation-controls",
            "Insolation controls",
            "Recall should explain insolation through latitude, angle, duration, season, cloud, transparency, and land-water contrast.",
            ["latitude", "angle", "duration", "season", "cloud", "transparency", "land-water"]
          ),
          point(
            "insolation-heat-budget",
            "albedo",
            "Albedo",
            "The answer should define albedo as reflectivity and connect it with absorption.",
            ["albedo", "reflectivity", "reflect", "absorb"]
          ),
          point(
            "insolation-heat-budget",
            "heat-budget-greenhouse",
            "Heat budget and greenhouse effect",
            "Recall should connect incoming solar radiation, outgoing terrestrial radiation, and greenhouse gases.",
            ["incoming", "outgoing", "terrestrial radiation", "greenhouse", "longwave"]
          ),
        ],
      },
      {
        id: "temperature-distribution",
        order: 4,
        kind: "basic",
        title: "Temperature Distribution",
        eyebrow: "Horizontal and vertical patterns",
        estimatedMinutes: 5,
        body:
          "Temperature distribution depends on latitude, altitude, distance from sea, ocean currents, winds, clouds, slope, aspect, and land-water contrast. Isotherms reveal how these controls shift temperature on maps.",
        bullets: [
          "Temperature generally decreases from equator to poles, but land-water contrast and currents distort isotherms.",
          "Continental interiors show higher annual range; maritime regions show moderated temperatures.",
          "Temperature normally falls with altitude, but inversion can reverse this near the ground.",
          "Trap pattern: treating latitude as the only control or ignoring ocean-current and continentality effects.",
        ],
        expectedRecallPoints: [
          point(
            "temperature-distribution",
            "temperature-controls",
            "Temperature controls",
            "Recall should include latitude, altitude, distance from sea, currents, winds, clouds, slope, aspect, and land-water contrast.",
            ["latitude", "altitude", "distance from sea", "currents", "winds", "clouds", "slope", "land-water"]
          ),
          point(
            "temperature-distribution",
            "continentality-maritime",
            "Continentality and maritime effect",
            "The answer should contrast continental annual range with moderated maritime temperature.",
            ["continental", "maritime", "annual range", "moderated", "temperature"]
          ),
          point(
            "temperature-distribution",
            "inversion-isotherm",
            "Inversion and isotherms",
            "Recall should mention temperature inversion or isotherm distortion as map logic.",
            ["inversion", "isotherm", "distortion", "map"]
          ),
        ],
      },
      {
        id: "pressure-belts-winds",
        order: 5,
        kind: "advanced",
        title: "Pressure Belts and Planetary Winds",
        eyebrow: "Global circulation",
        estimatedMinutes: 5,
        body:
          "Pressure belts and planetary winds are the backbone of global circulation. Unequal heating creates equatorial low pressure, subtropical highs, subpolar lows, and polar highs; Coriolis force and pressure-gradient force shape wind direction.",
        bullets: [
          "Major pressure belts include equatorial low, subtropical highs, subpolar lows, and polar highs.",
          "Planetary winds include trade winds, westerlies, and polar easterlies.",
          "Pressure belts shift seasonally with apparent movement of the Sun, affecting ITCZ and monsoon behavior.",
          "Trap pattern: wrong hemisphere deflection, wrong wind direction, or treating pressure belts as fixed lines.",
        ],
        expectedRecallPoints: [
          point(
            "pressure-belts-winds",
            "pressure-belts",
            "Pressure belts",
            "Recall should name equatorial low, subtropical highs, subpolar lows, and polar highs.",
            ["equatorial low", "subtropical high", "subpolar low", "polar high", "pressure belt"]
          ),
          point(
            "pressure-belts-winds",
            "planetary-winds",
            "Planetary winds",
            "The answer should name trade winds, westerlies, and polar easterlies with direction logic.",
            ["trade winds", "westerlies", "polar easterlies", "direction", "coriolis"]
          ),
          point(
            "pressure-belts-winds",
            "itcz-seasonal-shift",
            "ITCZ seasonal shift",
            "Recall should connect pressure-belt shift with apparent Sun movement, ITCZ, and monsoon behavior.",
            ["itcz", "seasonal shift", "sun", "monsoon", "pressure"]
          ),
        ],
      },
      {
        id: "jet-streams",
        order: 6,
        kind: "current",
        title: "Jet Streams",
        eyebrow: "Upper-air winds",
        estimatedMinutes: 5,
        body:
          "Jet streams are narrow bands of strong upper-air westerly winds near the tropopause. They matter because they guide weather systems, western disturbances, monsoon onset/withdrawal, aviation, and Rossby wave patterns.",
        bullets: [
          "Polar front jet and subtropical westerly jet are high-yield for UPSC climatology.",
          "The tropical easterly jet is important in the Indian monsoon context.",
          "Jet streams meander as Rossby waves and can influence cold waves, heatwaves, and blocking patterns.",
          "Trap pattern: treating jet streams as surface winds or ignoring seasonal position changes.",
        ],
        expectedRecallPoints: [
          point(
            "jet-streams",
            "jet-stream-definition",
            "Jet stream definition",
            "Recall should define jet streams as narrow strong upper-air winds near the tropopause.",
            ["jet stream", "upper-air", "westerly", "tropopause", "strong"]
          ),
          point(
            "jet-streams",
            "monsoon-western-disturbance-link",
            "Monsoon and western disturbance link",
            "The answer should connect jet streams with western disturbances, monsoon, or tropical easterly jet.",
            ["western disturbance", "monsoon", "tropical easterly", "subtropical", "polar front"]
          ),
          point(
            "jet-streams",
            "rossby-wave-link",
            "Rossby wave link",
            "Recall should mention Rossby waves, meanders, blocking, cold waves, or heatwaves.",
            ["rossby", "meander", "blocking", "cold wave", "heatwave"]
          ),
        ],
      },
      {
        id: "local-winds",
        order: 7,
        kind: "ncert",
        title: "Local Winds",
        eyebrow: "Regional wind examples",
        estimatedMinutes: 5,
        body:
          "Local winds are regional winds shaped by pressure, temperature, relief, deserts, seas, mountains, valleys, and local seasonal conditions. They are high-yield because names look easy but location and nature are often swapped.",
        bullets: [
          "Hot local winds include Loo, Sirocco, Khamsin, Harmattan, Foehn/Chinook warming, and Santa Ana-type winds depending on region.",
          "Cold local winds include Mistral, Bora, Blizzard-type cold winds, and drainage winds in mountain regions.",
          "Land breeze, sea breeze, valley breeze, and mountain breeze are daily circulation examples.",
          "Trap pattern: correct wind name with wrong region, wrong hot/cold nature, or wrong cause.",
        ],
        expectedRecallPoints: [
          point(
            "local-winds",
            "hot-local-winds",
            "Hot local winds",
            "Recall should name hot local winds with region or nature.",
            ["loo", "sirocco", "khamsin", "harmattan", "foehn", "chinook", "santa ana"]
          ),
          point(
            "local-winds",
            "cold-local-winds",
            "Cold local winds",
            "The answer should name cold local winds or drainage winds with region or cause.",
            ["mistral", "bora", "blizzard", "drainage", "cold"]
          ),
          point(
            "local-winds",
            "breeze-circulation",
            "Local breeze circulation",
            "Recall should explain land/sea breeze or valley/mountain breeze through differential heating.",
            ["land breeze", "sea breeze", "valley breeze", "mountain breeze", "differential heating"]
          ),
        ],
      },
      {
        id: "climatology-traps-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Examiner Traps and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 4,
        body:
          "Before moving to weather systems, speak the full Day 5 chain: atmospheric layers, gases, insolation, heat budget, temperature controls, pressure belts, winds, jet streams, local winds, and one examiner trap.",
        bullets: [
          "Start with atmosphere composition and vertical structure.",
          "Move through insolation, heat budget, temperature controls, and pressure-wind circulation.",
          "Add jet stream and local wind examples with location and seasonal logic.",
          "Next handoff: Day 6 weather systems depend on moisture, air masses, fronts, cyclones, and ocean feedback.",
        ],
        expectedRecallPoints: [
          point(
            "climatology-traps-handoff",
            "full-day5-chain",
            "Full Day 5 chain",
            "Recall should connect layers, gases, insolation, heat budget, temperature, pressure, winds, jet streams, local winds, and traps.",
            ["layers", "gases", "insolation", "heat budget", "temperature", "pressure", "jet streams", "local winds"]
          ),
          point(
            "climatology-traps-handoff",
            "climatology-trap",
            "Climatology trap",
            "The answer should correct one trap about layer, gas, wind, pressure belt, jet stream, or local wind.",
            ["trap", "layer", "gas", "wind", "pressure belt", "jet stream", "local wind"]
          ),
          point(
            "climatology-traps-handoff",
            "weather-system-handoff",
            "Weather system handoff",
            "The next link is Day 6 weather systems: moisture, air masses, fronts, cyclones, and ocean feedback.",
            ["weather systems", "moisture", "air masses", "fronts", "cyclones", "ocean"]
          ),
        ],
      },
    ],
  },
  {
    id: "transport-communications-day13",
    subjectSlug: "geography",
    day: 13,
    cluster: "Cluster 18",
    title: "Transport and Communications: Ports, Roads, Railways, and Inland Waterways",
    subtitle:
      "Connectivity geography, maritime trade, highways, rail networks, freight corridors, inland waterways, and map-linked transport traps.",
    status: "draft",
    topicIds: [63, 64, 65, 66],
    sourceLabel: "1. Geography topics.pdf Topics 63-66 draft web module",
    sections: [
      {
        id: "transport-network-frame",
        order: 1,
        kind: "basic",
        title: "Connectivity as a Geography System",
        eyebrow: "Network logic",
        estimatedMinutes: 4,
        body:
          "Transport geography should be recalled as a network system: nodes, routes, corridors, hinterlands, cost, terrain, demand, and regional impact. UPSC rarely asks transport as a list; it tests why one mode suits one region better than another.",
        bullets: [
          "Nodes are ports, junctions, terminals, cities, industrial centers, and logistics hubs.",
          "Routes connect nodes, but terrain, distance, security, cost, and demand decide the actual network strength.",
          "Hinterland is the economic area served by a port, road, railway, or waterway.",
          "The safe answer frame is location -> mode advantage -> hinterland -> economic effect -> ecological or regional risk.",
        ],
        expectedRecallPoints: [
          point(
            "transport-network-frame",
            "network-chain",
            "Network chain",
            "Recall should connect nodes, routes, corridors, hinterland, cost, terrain, demand, and regional impact.",
            ["nodes", "routes", "corridors", "hinterland", "cost", "terrain", "demand", "regional impact"]
          ),
          point(
            "transport-network-frame",
            "mode-suitability",
            "Mode suitability",
            "The answer should compare transport modes by terrain, bulk, speed, cost, security, and last-mile reach.",
            ["terrain", "bulk", "speed", "cost", "security", "last mile", "mode"]
          ),
        ],
      },
      {
        id: "ports-maritime-trade",
        order: 2,
        kind: "advanced",
        title: "Ports and Maritime Trade",
        eyebrow: "Coast to hinterland",
        estimatedMinutes: 6,
        body:
          "Ports must be read through location, natural conditions, hinterland, cargo specialization, connectivity, and strategic value. A port is not only a coastal point; it is the sea-facing end of an inland economic network.",
        bullets: [
          "Western and eastern coast ports differ by hinterland, industrial links, natural harbor conditions, sedimentation, and cyclone exposure.",
          "Major port recall should include coast/state, nearby hinterland, cargo logic, and one transport link.",
          "Maritime trade connects ports with shipping lanes, chokepoints, containerization, coastal shipping, and logistics policy.",
          "Trap pattern: correct port name with wrong state, wrong coast, wrong hinterland, or wrong cargo/strategic role.",
        ],
        expectedRecallPoints: [
          point(
            "ports-maritime-trade",
            "port-hinterland-link",
            "Port-hinterland link",
            "Recall should explain a port through coast, state, hinterland, cargo, and inland connectivity.",
            ["port", "coast", "state", "hinterland", "cargo", "connectivity"]
          ),
          point(
            "ports-maritime-trade",
            "maritime-trade-logic",
            "Maritime trade logic",
            "The answer should connect ports with shipping lanes, chokepoints, containerization, coastal shipping, and logistics policy.",
            ["shipping lanes", "chokepoints", "container", "coastal shipping", "logistics", "maritime trade"]
          ),
          point(
            "ports-maritime-trade",
            "port-map-trap",
            "Port map trap",
            "Recall should warn against mixing port, coast, state, hinterland, cargo, and strategic role.",
            ["trap", "wrong coast", "wrong state", "wrong hinterland", "cargo", "strategic"]
          ),
        ],
      },
      {
        id: "road-transport",
        order: 3,
        kind: "basic",
        title: "Road Transport",
        eyebrow: "Last-mile geography",
        estimatedMinutes: 5,
        body:
          "Roads give last-mile access and flexible movement. In UPSC, road transport should be linked with settlement access, border areas, hill terrain, expressways, industrial corridors, agriculture markets, and disaster response.",
        bullets: [
          "National highways, expressways, state highways, district roads, rural roads, and border roads serve different spatial functions.",
          "Road density and quality vary with relief, population density, rainfall, soil, forest cover, investment, and security needs.",
          "Highways improve market access but can also produce land-use change, accident risk, ecological fragmentation, and corridor inequality.",
          "Trap pattern: treating road length as road quality, or ignoring terrain and maintenance constraints.",
        ],
        expectedRecallPoints: [
          point(
            "road-transport",
            "road-hierarchy",
            "Road hierarchy",
            "Recall should separate national highways, expressways, state highways, district roads, rural roads, and border roads.",
            ["national highways", "expressways", "state highways", "district roads", "rural roads", "border roads"]
          ),
          point(
            "road-transport",
            "road-geography-controls",
            "Road geography controls",
            "The answer should link road density and quality with relief, population, rainfall, investment, forest cover, and security.",
            ["relief", "population", "rainfall", "investment", "forest", "security", "road density"]
          ),
          point(
            "road-transport",
            "road-impact-trap",
            "Road impact trap",
            "Recall should balance market access with land-use change, ecological fragmentation, accident risk, and corridor inequality.",
            ["market access", "land use", "ecological", "accident", "corridor inequality", "trap"]
          ),
        ],
      },
      {
        id: "railway-transport",
        order: 4,
        kind: "advanced",
        title: "Railway Transport",
        eyebrow: "Bulk and corridor movement",
        estimatedMinutes: 5,
        body:
          "Railways are best recalled through bulk movement, long-distance passenger flow, freight corridors, mineral-industrial belts, ports, urban systems, and regional integration. The map question usually tests route-region logic rather than train-name memory.",
        bullets: [
          "Railway density is shaped by plains, population, industry, minerals, ports, capital investment, and terrain barriers.",
          "Dedicated freight corridors separate heavy freight logic from passenger network pressure.",
          "Rail connectivity supports mineral movement, foodgrain movement, port evacuation, metro regions, and strategic mobility.",
          "Trap pattern: confusing railway zone names, corridor end points, port links, or terrain constraints.",
        ],
        expectedRecallPoints: [
          point(
            "railway-transport",
            "rail-density-controls",
            "Rail density controls",
            "Recall should link railway density with plains, population, industry, minerals, ports, investment, and terrain barriers.",
            ["railway density", "plains", "population", "industry", "minerals", "ports", "terrain"]
          ),
          point(
            "railway-transport",
            "freight-corridor-logic",
            "Freight corridor logic",
            "The answer should explain freight corridors through bulk cargo, port evacuation, industrial belts, and passenger decongestion.",
            ["freight corridor", "bulk cargo", "port evacuation", "industrial belts", "decongestion"]
          ),
          point(
            "railway-transport",
            "railway-map-trap",
            "Railway map trap",
            "Recall should warn against mixing zones, corridor end points, port links, and terrain constraints.",
            ["trap", "zones", "end points", "port links", "terrain constraints"]
          ),
        ],
      },
      {
        id: "inland-waterways",
        order: 5,
        kind: "advanced",
        title: "Inland Waterways",
        eyebrow: "River navigation",
        estimatedMinutes: 5,
        body:
          "Inland waterways should be studied through navigability, river depth, flow seasonality, sedimentation, terminals, multimodal links, cargo suitability, and ecological limits. Waterways are low-cost for bulk cargo but are not automatically suitable everywhere.",
        bullets: [
          "National Waterway logic needs river route, origin-destination, states, cargo, terminals, and multimodal links.",
          "Navigability depends on channel depth, flow, dredging, siltation, bridges, barrages, seasonal variation, and bank infrastructure.",
          "Waterways can reduce logistics cost and emissions for bulk cargo, but they can affect river ecology and local livelihoods.",
          "Trap pattern: assuming any large river is navigable in all seasons or ignoring upstream-downstream constraints.",
        ],
        expectedRecallPoints: [
          point(
            "inland-waterways",
            "waterway-navigability",
            "Waterway navigability",
            "Recall should explain navigability through depth, flow, siltation, dredging, seasonality, terminals, and bank infrastructure.",
            ["navigability", "depth", "flow", "siltation", "dredging", "seasonality", "terminals"]
          ),
          point(
            "inland-waterways",
            "national-waterway-map",
            "National waterway map",
            "The answer should connect a national waterway with river route, states, cargo, terminals, and multimodal links.",
            ["national waterway", "river route", "states", "cargo", "terminals", "multimodal"]
          ),
          point(
            "inland-waterways",
            "waterway-limits",
            "Waterway limits",
            "Recall should balance low-cost bulk movement with ecology, livelihoods, bridges, barrages, and seasonal limits.",
            ["low cost", "bulk", "ecology", "livelihoods", "bridges", "barrages", "seasonal"]
          ),
        ],
      },
      {
        id: "corridors-communications",
        order: 6,
        kind: "current",
        title: "Corridors, Logistics, and Communications",
        eyebrow: "Current-affairs bridge",
        estimatedMinutes: 5,
        body:
          "Transport and communications now overlap through logistics parks, multimodal corridors, digital tracking, telecom networks, border infrastructure, disaster communication, and supply-chain resilience. This section is the bridge from static transport to current affairs.",
        bullets: [
          "Economic corridors combine roads, railways, ports, industrial nodes, warehousing, power, digital systems, and policy incentives.",
          "Communications geography matters for border regions, islands, disaster warning, e-governance, markets, and service delivery.",
          "Multimodal logistics reduces cost only when first-mile, middle-mile, last-mile, and data systems connect.",
          "Trap pattern: memorizing corridor names without mapping nodes, states, ports, hinterland, or intended cargo/service flow.",
        ],
        expectedRecallPoints: [
          point(
            "corridors-communications",
            "corridor-system",
            "Corridor system",
            "Recall should connect corridors with roads, railways, ports, industrial nodes, warehousing, power, digital systems, and policy.",
            ["corridors", "roads", "railways", "ports", "industrial nodes", "warehousing", "digital", "policy"]
          ),
          point(
            "corridors-communications",
            "communications-geography",
            "Communications geography",
            "The answer should connect communications with border regions, islands, disaster warning, e-governance, markets, and services.",
            ["communications", "border", "islands", "disaster warning", "e-governance", "markets", "services"]
          ),
          point(
            "corridors-communications",
            "multimodal-link",
            "Multimodal link",
            "Recall should explain first-mile, middle-mile, last-mile, logistics cost, and data tracking as one system.",
            ["first mile", "middle mile", "last mile", "logistics cost", "data tracking", "multimodal"]
          ),
        ],
      },
      {
        id: "transport-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Statement discipline",
        estimatedMinutes: 4,
        body:
          "Transport questions often look factual but test location accuracy, mode suitability, route logic, and cause-effect validity. The student must reject statements that combine correct transport facts in the wrong relationship.",
        bullets: [
          "A correct port and a correct hinterland can still form a false pair if they belong to different coastal systems.",
          "A corridor can pass through a state without that state being the main beneficiary or cargo source.",
          "A waterway can be declared nationally important without being uniformly navigable through the year.",
          "A road or railway project can improve connectivity while increasing ecological or social costs.",
        ],
        expectedRecallPoints: [
          point(
            "transport-traps-pyq",
            "false-pair-discipline",
            "False-pair discipline",
            "Recall should detect wrong pairings among port, coast, hinterland, state, corridor, and cargo.",
            ["false pair", "port", "coast", "hinterland", "state", "corridor", "cargo"]
          ),
          point(
            "transport-traps-pyq",
            "cause-effect-validity",
            "Cause-effect validity",
            "The answer should check whether the stated transport cause actually produces the claimed regional effect.",
            ["cause", "effect", "regional", "transport", "claimed", "validity"]
          ),
        ],
      },
      {
        id: "transport-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 4,
        body:
          "Before moving to world geography, speak one connected transport answer: network frame, one port, one road example, one railway/freight example, one inland waterway, one communications or corridor bridge, and one examiner trap.",
        bullets: [
          "Start with network vocabulary: node, route, corridor, hinterland, mode advantage.",
          "Add one India map example each for port, road, rail, and waterway.",
          "Finish with a current-affairs bridge: logistics, border infrastructure, disaster communication, or supply-chain resilience.",
          "Next handoff: Day 14 world map systems use the same location-relationship discipline.",
        ],
        expectedRecallPoints: [
          point(
            "transport-quick-recall-handoff",
            "full-transport-chain",
            "Full transport chain",
            "Recall should connect network frame, port, road, rail, waterway, corridor or communications, and one trap.",
            ["network", "port", "road", "rail", "waterway", "corridor", "communications", "trap"]
          ),
          point(
            "transport-quick-recall-handoff",
            "world-map-handoff",
            "World map handoff",
            "The next link is Day 14 world map systems, using the same location-relationship discipline.",
            ["world map", "day 14", "location", "relationship", "discipline"]
          ),
        ],
      },
    ],
  },
  {
    id: "human-geography-day15",
    subjectSlug: "geography",
    day: 15,
    cluster: "Cluster 20",
    title: "Human Geography: Population, Migration, Urbanization, and Culture",
    subtitle:
      "Population distribution, demographic transition, migration flows, urban systems, cultural regions, and UPSC statement traps.",
    status: "draft",
    topicIds: [72, 73, 74, 75],
    sourceLabel: "1. Geography topics.pdf Topics 72-75 draft web module",
    sections: [
      {
        id: "human-geography-frame",
        order: 1,
        kind: "basic",
        title: "Human Geography as People-Place Interaction",
        eyebrow: "Core frame",
        estimatedMinutes: 4,
        body:
          "Human geography should be recalled as people-place interaction. Population, migration, urbanization, and culture are linked by resources, jobs, risk, services, identity, infrastructure, and policy.",
        bullets: [
          "Population distribution shows where people are concentrated or sparse.",
          "Migration explains movement between places and the reasons behind that movement.",
          "Urban geography explains how settlements grow, specialize, and stress their environment.",
          "Cultural geography explains language, religion, ethnicity, identity, and region as spatial patterns.",
        ],
        expectedRecallPoints: [
          point(
            "human-geography-frame",
            "people-place-chain",
            "People-place chain",
            "Recall should connect population, migration, urbanization, culture, resources, jobs, services, identity, and policy.",
            ["population", "migration", "urbanization", "culture", "resources", "jobs", "services", "identity", "policy"]
          ),
          point(
            "human-geography-frame",
            "human-geography-not-silos",
            "Not isolated silos",
            "The answer should explain that human geography topics interact instead of being memorized as separate lists.",
            ["interact", "connected", "not isolated", "not separate", "silos", "linked"]
          ),
        ],
      },
      {
        id: "population-geography",
        order: 2,
        kind: "advanced",
        title: "Population Geography",
        eyebrow: "Distribution and transition",
        estimatedMinutes: 6,
        body:
          "Population geography must separate distribution, density, growth, age structure, sex ratio, dependency, fertility, mortality, and demographic transition. UPSC often checks whether the student can explain why population patterns differ across regions.",
        bullets: [
          "Distribution is spatial pattern; density is population per unit area.",
          "Population growth depends on birth rate, death rate, migration, age structure, and development stage.",
          "Demographic transition links high/low birth and death rates with economic and social change.",
          "Trap pattern: treating density, distribution, growth rate, fertility, and migration as interchangeable.",
        ],
        expectedRecallPoints: [
          point(
            "population-geography",
            "density-distribution",
            "Density vs distribution",
            "Recall should distinguish density as ratio and distribution as spatial pattern.",
            ["density", "distribution", "ratio", "spatial pattern"]
          ),
          point(
            "population-geography",
            "demographic-transition",
            "Demographic transition",
            "The answer should connect birth rate, death rate, fertility, mortality, growth, age structure, and development.",
            ["birth rate", "death rate", "fertility", "mortality", "growth", "age structure", "development"]
          ),
          point(
            "population-geography",
            "population-factor-chain",
            "Population factor chain",
            "Recall should explain population pattern through relief, climate, water, soil, jobs, security, services, or infrastructure.",
            ["relief", "climate", "water", "soil", "jobs", "security", "services", "infrastructure"]
          ),
        ],
      },
      {
        id: "migration-geography",
        order: 3,
        kind: "advanced",
        title: "Migration Geography",
        eyebrow: "Movement and push-pull",
        estimatedMinutes: 5,
        body:
          "Migration geography explains movement across space by push factors, pull factors, distance, networks, policy, conflict, climate risk, livelihood, and identity. The student should classify migration before using examples.",
        bullets: [
          "Migration can be rural-urban, urban-urban, inter-state, international, seasonal, circular, forced, voluntary, or distress-led.",
          "Push factors include unemployment, low wages, conflict, disasters, climate stress, social exclusion, and land pressure.",
          "Pull factors include jobs, education, services, safety, networks, higher wages, and urban opportunities.",
          "Trap pattern: calling all migration permanent or ignoring remittance, demographic, and urban-service impacts.",
        ],
        expectedRecallPoints: [
          point(
            "migration-geography",
            "migration-classification",
            "Migration classification",
            "Recall should classify migration as rural-urban, inter-state, international, seasonal, circular, forced, voluntary, or distress-led.",
            ["rural urban", "inter state", "international", "seasonal", "circular", "forced", "voluntary", "distress"]
          ),
          point(
            "migration-geography",
            "push-pull-network",
            "Push-pull network",
            "The answer should connect push factors, pull factors, distance, networks, policy, conflict, climate, livelihood, and identity.",
            ["push", "pull", "distance", "networks", "policy", "conflict", "climate", "livelihood", "identity"]
          ),
          point(
            "migration-geography",
            "migration-impact",
            "Migration impact",
            "Recall should mention remittance, labour markets, demographic change, urban services, social change, or regional imbalance.",
            ["remittance", "labour", "demographic", "urban services", "social change", "regional imbalance"]
          ),
        ],
      },
      {
        id: "urban-geography",
        order: 4,
        kind: "advanced",
        title: "Urban Geography",
        eyebrow: "City systems",
        estimatedMinutes: 6,
        body:
          "Urban geography studies settlement hierarchy, site, situation, functions, land use, metropolitan growth, peri-urban expansion, slums, transport, water, waste, housing, and governance. UPSC expects cause-effect reasoning, not only city names.",
        bullets: [
          "Site is the actual physical location; situation is the location relative to routes, markets, resources, and other places.",
          "Urban hierarchy includes hamlets, villages, towns, cities, metropolitan regions, and megacities.",
          "Urbanization creates agglomeration benefits but also congestion, pollution, housing stress, water stress, waste, and inequality.",
          "Trap pattern: confusing urban growth, urbanization, metropolitan expansion, and city function.",
        ],
        expectedRecallPoints: [
          point(
            "urban-geography",
            "site-situation",
            "Site and situation",
            "Recall should distinguish site from situation and connect both with routes, markets, resources, and location advantage.",
            ["site", "situation", "routes", "markets", "resources", "location advantage"]
          ),
          point(
            "urban-geography",
            "urban-hierarchy-function",
            "Urban hierarchy and function",
            "The answer should connect hierarchy, function, land use, metropolitan growth, and peri-urban expansion.",
            ["hierarchy", "function", "land use", "metropolitan", "peri urban", "megacity"]
          ),
          point(
            "urban-geography",
            "urbanization-costs",
            "Urbanization costs",
            "Recall should balance agglomeration benefits with congestion, pollution, housing, water, waste, inequality, and governance.",
            ["agglomeration", "congestion", "pollution", "housing", "water", "waste", "inequality", "governance"]
          ),
        ],
      },
      {
        id: "cultural-geography",
        order: 5,
        kind: "advanced",
        title: "Cultural Geography",
        eyebrow: "Identity and region",
        estimatedMinutes: 5,
        body:
          "Cultural geography maps language, religion, ethnicity, tribe, customs, food, architecture, sacred landscapes, cultural regions, and identity. Culture changes through migration, trade, urbanization, media, and policy.",
        bullets: [
          "Cultural regions are not always identical to political boundaries.",
          "Language, religion, ethnicity, tribe, and livelihood can overlap but should not be treated as the same thing.",
          "Cultural diffusion happens through migration, trade, education, media, tourism, and urban networks.",
          "Trap pattern: overgeneralizing one cultural feature to an entire region or community.",
        ],
        expectedRecallPoints: [
          point(
            "cultural-geography",
            "cultural-region",
            "Cultural region",
            "Recall should explain cultural regions through language, religion, ethnicity, tribe, customs, food, architecture, or sacred landscapes.",
            ["language", "religion", "ethnicity", "tribe", "customs", "food", "architecture", "sacred"]
          ),
          point(
            "cultural-geography",
            "culture-not-boundary",
            "Culture not equal to boundary",
            "The answer should warn that cultural regions do not always match political boundaries.",
            ["cultural regions", "political boundaries", "boundary", "not match", "not identical"]
          ),
          point(
            "cultural-geography",
            "cultural-diffusion",
            "Cultural diffusion",
            "Recall should connect cultural change with migration, trade, education, media, tourism, urbanization, or policy.",
            ["migration", "trade", "education", "media", "tourism", "urbanization", "policy", "diffusion"]
          ),
        ],
      },
      {
        id: "human-geography-current-bridge",
        order: 6,
        kind: "current",
        title: "Current-Affairs Bridge",
        eyebrow: "Static to dynamic",
        estimatedMinutes: 5,
        body:
          "Human geography becomes current affairs when demographic change, migration, urban floods, heat stress, informal labour, digital services, cultural identity, and regional inequality appear in news. The static concept should decide which news item is relevant.",
        bullets: [
          "Population ageing, youth bulge, fertility decline, and demographic dividend connect demography with policy.",
          "Migration connects with labour codes, urban rental housing, remittances, climate migration, and internal security.",
          "Urban geography connects with heat islands, flooding, transit, waste, pollution, housing, and smart-city governance.",
          "Cultural geography connects with identity, regional autonomy, tourism, heritage, tribal rights, and social cohesion.",
        ],
        expectedRecallPoints: [
          point(
            "human-geography-current-bridge",
            "demographic-policy-link",
            "Demographic policy link",
            "Recall should connect ageing, youth bulge, fertility decline, demographic dividend, and policy.",
            ["ageing", "youth bulge", "fertility decline", "demographic dividend", "policy"]
          ),
          point(
            "human-geography-current-bridge",
            "urban-current-link",
            "Urban current link",
            "The answer should connect cities with heat islands, flooding, transit, waste, pollution, housing, or governance.",
            ["heat island", "flooding", "transit", "waste", "pollution", "housing", "governance"]
          ),
          point(
            "human-geography-current-bridge",
            "culture-current-link",
            "Culture current link",
            "Recall should connect culture with identity, autonomy, tourism, heritage, tribal rights, or social cohesion.",
            ["identity", "autonomy", "tourism", "heritage", "tribal rights", "social cohesion"]
          ),
        ],
      },
      {
        id: "human-geography-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Statement discipline",
        estimatedMinutes: 4,
        body:
          "Human geography traps usually mix similar terms: density vs distribution, growth vs fertility, migration vs mobility, urban growth vs urbanization, site vs situation, culture vs political boundary. The student must define the term before accepting the statement.",
        bullets: [
          "A statement can be wrong if it uses a correct indicator for the wrong process.",
          "A migration answer is weak if it ignores both origin and destination effects.",
          "An urban answer is weak if it lists problems without explaining city growth or governance cause.",
          "A cultural answer is weak if it uses stereotypes instead of spatial evidence and change over time.",
        ],
        expectedRecallPoints: [
          point(
            "human-geography-traps-pyq",
            "term-separation",
            "Term separation",
            "Recall should separate density/distribution, growth/fertility, migration/mobility, urban growth/urbanization, site/situation, and culture/boundary.",
            ["density", "distribution", "growth", "fertility", "migration", "mobility", "urbanization", "site", "situation"]
          ),
          point(
            "human-geography-traps-pyq",
            "origin-destination-effect",
            "Origin-destination effect",
            "The answer should check both origin and destination effects in migration questions.",
            ["origin", "destination", "effects", "migration"]
          ),
          point(
            "human-geography-traps-pyq",
            "stereotype-warning",
            "Stereotype warning",
            "Recall should avoid cultural stereotypes and use spatial evidence plus change over time.",
            ["stereotype", "spatial evidence", "change over time", "culture"]
          ),
        ],
      },
      {
        id: "human-geography-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 4,
        body:
          "Before moving to political geography, speak one connected answer: population pattern, migration cause, urban process, cultural region, one current-affairs bridge, and one examiner trap.",
        bullets: [
          "Start with population distribution and demographic transition.",
          "Add migration push-pull and origin-destination effects.",
          "Add urban site/situation, hierarchy, function, and stress.",
          "Close with cultural region, diffusion, current link, and one trap.",
        ],
        expectedRecallPoints: [
          point(
            "human-geography-quick-recall-handoff",
            "full-human-geography-chain",
            "Full human geography chain",
            "Recall should connect population, migration, urban geography, cultural geography, current bridge, and one examiner trap.",
            ["population", "migration", "urban", "cultural", "current", "trap"]
          ),
          point(
            "human-geography-quick-recall-handoff",
            "political-geography-handoff",
            "Political geography handoff",
            "The next link is Day 16 political geography: borders, Northeast India, tribal geography, identity, terrain, and security.",
            ["day 16", "political geography", "borders", "northeast", "tribal", "identity", "terrain", "security"]
          ),
        ],
      },
    ],
  },
  {
    id: "political-geography-day16",
    subjectSlug: "geography",
    day: 16,
    cluster: "Cluster 21",
    title: "Political Geography: Borders, Northeast India, and Tribal Regions",
    subtitle:
      "India's borders, borderland terrain, Northeast connectivity, tribal geography, identity, security, and map-linked political traps.",
    status: "draft",
    topicIds: [76, 77, 78],
    sourceLabel: "1. Geography topics.pdf Topics 76-78 draft web module",
    sections: [
      {
        id: "political-geography-frame",
        order: 1,
        kind: "basic",
        title: "Political Geography as Territory, Identity, and Access",
        eyebrow: "Core frame",
        estimatedMinutes: 4,
        body:
          "Political geography should be recalled through territory, boundary, terrain, identity, connectivity, administration, security, and resource access. UPSC border questions are rarely pure map memory; they test why a place is politically sensitive.",
        bullets: [
          "Territory is controlled space; boundaries define jurisdiction but rarely erase social, ethnic, ecological, or economic connections.",
          "Borderlands must be read through terrain, passes, rivers, settlements, trade routes, migration, and security.",
          "Identity and access decide whether a region feels integrated, peripheral, contested, or underserved.",
          "The safe answer frame is location -> terrain/access -> people/identity -> governance/security -> development issue.",
        ],
        expectedRecallPoints: [
          point(
            "political-geography-frame",
            "territory-boundary-chain",
            "Territory-boundary chain",
            "Recall should connect territory, boundary, terrain, identity, access, administration, security, and resources.",
            ["territory", "boundary", "terrain", "identity", "access", "administration", "security", "resources"]
          ),
          point(
            "political-geography-frame",
            "borderland-not-line",
            "Borderland not just line",
            "The answer should explain that borderlands include people, routes, rivers, passes, trade, migration, and security.",
            ["borderland", "people", "routes", "rivers", "passes", "trade", "migration", "security"]
          ),
        ],
      },
      {
        id: "india-borders-map",
        order: 2,
        kind: "advanced",
        title: "India's Borders: Map and Terrain Logic",
        eyebrow: "Neighbor discipline",
        estimatedMinutes: 6,
        body:
          "India's borders must be recalled neighbor-wise and terrain-wise. The student should connect each border with mountains, plains, deserts, rivers, coastal/maritime spaces, passes, enclaves, corridors, and strategic vulnerabilities.",
        bullets: [
          "Northern and northeastern borders are shaped by high relief, passes, river valleys, and disputed boundary perceptions.",
          "Western borders include desert, plains, marshes, coastal access, and security infrastructure.",
          "Eastern borders include riverine plains, migration routes, enclaves/history, and connectivity stress.",
          "Maritime boundaries connect islands, EEZ, straits, naval access, coastal security, and trade routes.",
        ],
        expectedRecallPoints: [
          point(
            "india-borders-map",
            "neighbor-terrain-pairing",
            "Neighbor-terrain pairing",
            "Recall should pair India's borders with neighbors, terrain, rivers, passes, deserts, plains, coast, or maritime zones.",
            ["neighbors", "terrain", "rivers", "passes", "desert", "plains", "coast", "maritime"]
          ),
          point(
            "india-borders-map",
            "border-region-contrast",
            "Border region contrast",
            "The answer should contrast northern, western, eastern, and maritime border problems.",
            ["northern", "western", "eastern", "maritime", "border", "contrast"]
          ),
          point(
            "india-borders-map",
            "border-map-trap",
            "Border map trap",
            "Recall should warn against mixing neighbor, state, river, pass, corridor, and boundary dispute.",
            ["trap", "neighbor", "state", "river", "pass", "corridor", "dispute"]
          ),
        ],
      },
      {
        id: "border-management-strategy",
        order: 3,
        kind: "current",
        title: "Border Management and Strategic Geography",
        eyebrow: "Security-development bridge",
        estimatedMinutes: 5,
        body:
          "Border management links geography with infrastructure, surveillance, trade, migration, disaster response, local livelihood, and diplomacy. A strong answer balances security with development and community confidence.",
        bullets: [
          "Terrain decides road building, fencing, surveillance, logistics, and response time.",
          "Border infrastructure can improve security and trade but also affects ecology, land, and local communities.",
          "Integrated check posts, border haats, road corridors, and digital surveillance are geography plus governance topics.",
          "Trap pattern: treating all borders as the same security problem without terrain and local society.",
        ],
        expectedRecallPoints: [
          point(
            "border-management-strategy",
            "terrain-security-link",
            "Terrain-security link",
            "Recall should connect terrain with roads, fencing, surveillance, logistics, response time, and local livelihood.",
            ["terrain", "roads", "fencing", "surveillance", "logistics", "response time", "livelihood"]
          ),
          point(
            "border-management-strategy",
            "security-development-balance",
            "Security-development balance",
            "The answer should balance security, trade, migration, ecology, local communities, and diplomacy.",
            ["security", "trade", "migration", "ecology", "communities", "diplomacy"]
          ),
          point(
            "border-management-strategy",
            "governance-instruments",
            "Governance instruments",
            "Recall should mention integrated check posts, border haats, roads, corridors, or digital surveillance.",
            ["integrated check posts", "border haats", "roads", "corridors", "digital surveillance"]
          ),
        ],
      },
      {
        id: "northeast-india",
        order: 4,
        kind: "advanced",
        title: "Northeast India: Terrain, Connectivity, and Identity",
        eyebrow: "Regional system",
        estimatedMinutes: 6,
        body:
          "Northeast India must be studied as a terrain-connectivity-identity system. Relief, rainfall, rivers, forests, ethnic diversity, border proximity, the Siliguri Corridor, and external links shape development and security.",
        bullets: [
          "The region combines Himalayan foothills, hills, valleys, plateaus, floodplains, forests, and high rainfall.",
          "Connectivity constraints include terrain, landslides, floods, narrow corridors, border location, and infrastructure gaps.",
          "The Siliguri Corridor is a strategic access link and a recurring map trap.",
          "Development must be read with identity, autonomy, ecological fragility, disaster risk, and cross-border linkages.",
        ],
        expectedRecallPoints: [
          point(
            "northeast-india",
            "northeast-terrain-system",
            "Northeast terrain system",
            "Recall should connect hills, valleys, plateaus, floodplains, forests, rainfall, and rivers.",
            ["hills", "valleys", "plateaus", "floodplains", "forests", "rainfall", "rivers"]
          ),
          point(
            "northeast-india",
            "connectivity-constraint",
            "Connectivity constraint",
            "The answer should connect terrain, landslides, floods, Siliguri Corridor, borders, and infrastructure gaps.",
            ["terrain", "landslides", "floods", "siliguri", "borders", "infrastructure"]
          ),
          point(
            "northeast-india",
            "identity-autonomy-link",
            "Identity and autonomy link",
            "Recall should connect ethnic diversity, identity, autonomy, development, ecology, and security.",
            ["ethnic", "identity", "autonomy", "development", "ecology", "security"]
          ),
        ],
      },
      {
        id: "tribal-geography",
        order: 5,
        kind: "advanced",
        title: "Tribal Geography",
        eyebrow: "Place, livelihood, rights",
        estimatedMinutes: 6,
        body:
          "Tribal geography should be recalled through spatial distribution, ecology, livelihood, language, culture, land rights, forest rights, displacement, development, and vulnerability. Avoid treating tribal communities as a single uniform category.",
        bullets: [
          "Tribal regions often overlap with forests, hills, mineral belts, borderlands, and ecologically sensitive areas.",
          "Livelihoods may include shifting cultivation, forest produce, pastoralism, agriculture, craft, wage labour, and mixed economies.",
          "Development issues include displacement, mining, forest governance, education, health, connectivity, and cultural rights.",
          "Trap pattern: confusing tribe names, states, habitat, livelihood, constitutional safeguards, and current policy debates.",
        ],
        expectedRecallPoints: [
          point(
            "tribal-geography",
            "tribal-spatial-distribution",
            "Tribal spatial distribution",
            "Recall should connect tribal regions with forests, hills, minerals, borderlands, ecology, and state examples.",
            ["tribal", "forests", "hills", "minerals", "borderlands", "ecology", "states"]
          ),
          point(
            "tribal-geography",
            "livelihood-rights-link",
            "Livelihood and rights link",
            "The answer should connect livelihood, forest produce, shifting cultivation, land rights, forest rights, and culture.",
            ["livelihood", "forest produce", "shifting cultivation", "land rights", "forest rights", "culture"]
          ),
          point(
            "tribal-geography",
            "development-vulnerability",
            "Development and vulnerability",
            "Recall should connect displacement, mining, education, health, connectivity, governance, and cultural rights.",
            ["displacement", "mining", "education", "health", "connectivity", "governance", "cultural rights"]
          ),
        ],
      },
      {
        id: "identity-terrain-security",
        order: 6,
        kind: "current",
        title: "Identity, Terrain, Security, and Development",
        eyebrow: "Integrated current bridge",
        estimatedMinutes: 5,
        body:
          "Political geography becomes current affairs when identity, terrain, connectivity, borders, tribes, resources, disasters, and security appear together. The student should connect the static map with one present-day governance question.",
        bullets: [
          "Border roads, tunnels, bridges, and digital networks change access, defence logistics, market access, and local opportunity.",
          "Terrain influences disaster vulnerability, insurgency response, trade corridors, and service delivery.",
          "Identity questions need spatial evidence: homeland, autonomy, language, livelihood, resource use, and administrative boundaries.",
          "A good answer names both integration benefits and local risks.",
        ],
        expectedRecallPoints: [
          point(
            "identity-terrain-security",
            "infrastructure-access-security",
            "Infrastructure-access-security link",
            "Recall should connect roads, tunnels, bridges, digital networks, defence logistics, market access, and local opportunity.",
            ["roads", "tunnels", "bridges", "digital", "defence", "market access", "local opportunity"]
          ),
          point(
            "identity-terrain-security",
            "terrain-governance-risk",
            "Terrain-governance risk",
            "The answer should connect terrain with disaster vulnerability, security response, trade corridors, and service delivery.",
            ["terrain", "disaster", "security", "trade corridors", "service delivery"]
          ),
          point(
            "identity-terrain-security",
            "identity-spatial-evidence",
            "Identity spatial evidence",
            "Recall should use homeland, autonomy, language, livelihood, resource use, or administrative boundaries as spatial evidence.",
            ["homeland", "autonomy", "language", "livelihood", "resources", "administrative boundaries"]
          ),
        ],
      },
      {
        id: "political-geography-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Map-pair discipline",
        estimatedMinutes: 4,
        body:
          "Political geography traps mix correct facts from different regions: a pass with the wrong state, a tribe with the wrong habitat, a corridor with the wrong function, or a border issue with the wrong terrain.",
        bullets: [
          "Always pair border issue with state, neighbor, terrain, and route.",
          "Always pair Northeast facts with river, hill range, state, corridor, or border context.",
          "Always pair tribal geography with ecology, livelihood, rights, and state-region evidence.",
          "Reject statements that use a correct political fact in the wrong spatial relationship.",
        ],
        expectedRecallPoints: [
          point(
            "political-geography-traps-pyq",
            "wrong-region-pairing",
            "Wrong-region pairing",
            "Recall should reject mixing a pass, state, tribe, corridor, border issue, or terrain from different regions.",
            ["pass", "state", "tribe", "corridor", "border", "terrain", "wrong"]
          ),
          point(
            "political-geography-traps-pyq",
            "northeast-map-proof",
            "Northeast map proof",
            "The answer should pair Northeast facts with river, hill range, state, corridor, or border context.",
            ["northeast", "river", "hill range", "state", "corridor", "border"]
          ),
          point(
            "political-geography-traps-pyq",
            "tribal-evidence-discipline",
            "Tribal evidence discipline",
            "Recall should pair tribal facts with ecology, livelihood, rights, state, and region.",
            ["tribal", "ecology", "livelihood", "rights", "state", "region"]
          ),
        ],
      },
      {
        id: "political-geography-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 4,
        body:
          "Before moving to Day 17 current geography, speak one connected answer: border map logic, Northeast terrain-connectivity, tribal geography, identity-security-development bridge, and one map-pair trap.",
        bullets: [
          "Start with territory, borderland, terrain, identity, access, and security.",
          "Add one India border example with neighbor, state, terrain, and route.",
          "Add one Northeast or tribal example with livelihood, identity, rights, and governance.",
          "Next handoff: Day 17 uses current affairs geography, so every news item must be tied to a static map concept.",
        ],
        expectedRecallPoints: [
          point(
            "political-geography-quick-recall-handoff",
            "full-political-geography-chain",
            "Full political geography chain",
            "Recall should connect borders, Northeast, tribal geography, identity, terrain, security, development, and one trap.",
            ["borders", "northeast", "tribal", "identity", "terrain", "security", "development", "trap"]
          ),
          point(
            "political-geography-quick-recall-handoff",
            "current-geography-handoff",
            "Current geography handoff",
            "The next link is Day 17 current geography: geopolitics, infrastructure, climate change, disasters, and static-current map links.",
            ["day 17", "current geography", "geopolitics", "infrastructure", "climate change", "disasters", "map"]
          ),
        ],
      },
    ],
  },
  {
    id: "current-geography-day17",
    subjectSlug: "geography",
    day: 17,
    cluster: "Cluster 22",
    title: "Current Geography: Geopolitics, Infrastructure, Climate, and Disasters",
    subtitle: "Turn news into map-linked static geography, examiner traps, and answer-ready recall.",
    status: "draft",
    topicIds: [79, 80, 81, 82],
    sourceLabel: "1. Geography topics.pdf topic groups 79-82, draft web module",
    sections: [
      {
        id: "current-geography-frame",
        order: 1,
        kind: "basic",
        title: "How to Read Current Geography",
        eyebrow: "Static map plus news",
        estimatedMinutes: 4,
        body:
          "Current geography should not be read as isolated news. Every event needs a static anchor: location, terrain, climate zone, resource, route, hazard, border, river basin, coast, island, or urban system. The answer becomes strong when the student can move from news headline to map reason.",
        bullets: [
          "Start every current event with where it is and why that place matters.",
          "Attach the event to one static geography concept: terrain, route, resource, climate, disaster, coast, river, or settlement.",
          "Separate map fact, process, impact, and governance response.",
          "The goal is not memorising headlines; it is converting headlines into spatial reasoning.",
        ],
        expectedRecallPoints: [
          point(
            "current-geography-frame",
            "static-anchor-news",
            "Static anchor for news",
            "Recall should say that every current geography item needs a location and one static map anchor.",
            ["current", "news", "location", "static", "map", "anchor"]
          ),
          point(
            "current-geography-frame",
            "headline-to-spatial-reasoning",
            "Headline to spatial reasoning",
            "The student should convert a headline into terrain, route, resource, climate, disaster, river, coast, or settlement logic.",
            ["headline", "terrain", "route", "resource", "climate", "disaster", "river", "coast", "settlement"]
          ),
        ],
      },
      {
        id: "geopolitical-map-logic",
        order: 2,
        kind: "advanced",
        title: "Geopolitical Geography in News",
        eyebrow: "Routes, borders, chokepoints",
        estimatedMinutes: 6,
        body:
          "Geopolitical geography is the study of how location, territory, borders, resources, sea lanes, chokepoints, islands, mountains, deserts, and corridors affect power and policy. Recall should connect a news event to route control, access, vulnerability, or strategic depth.",
        bullets: [
          "Borders are not just lines; they are terrain, access, settlement, trade, security, and diplomacy zones.",
          "Chokepoints matter because they concentrate shipping, energy movement, naval presence, and risk.",
          "Islands and ports matter because they shape surveillance, logistics, disaster response, and maritime influence.",
          "Resource geography links minerals, energy, water, fisheries, and supply chains to policy choices.",
        ],
        expectedRecallPoints: [
          point(
            "geopolitical-map-logic",
            "geopolitical-location-power",
            "Location and power",
            "Recall should connect location, territory, borders, routes, resources, and chokepoints with power and policy.",
            ["location", "territory", "border", "route", "resource", "chokepoint", "power", "policy"]
          ),
          point(
            "geopolitical-map-logic",
            "chokepoint-strategy",
            "Chokepoint strategy",
            "The answer should mention shipping, energy movement, naval presence, and risk when discussing chokepoints.",
            ["chokepoint", "shipping", "energy", "naval", "risk"]
          ),
          point(
            "geopolitical-map-logic",
            "island-port-role",
            "Island and port role",
            "Recall should link islands and ports with surveillance, logistics, disaster response, and maritime influence.",
            ["island", "port", "surveillance", "logistics", "disaster response", "maritime influence"]
          ),
        ],
      },
      {
        id: "connectivity-infrastructure-geography",
        order: 3,
        kind: "current",
        title: "Connectivity and Infrastructure Geography",
        eyebrow: "Corridors and networks",
        estimatedMinutes: 6,
        body:
          "Infrastructure geography asks why a road, rail line, port, tunnel, bridge, airport, inland waterway, pipeline, or digital corridor is placed where it is. The student should connect terrain constraints, hinterland, market access, border security, logistics cost, disaster resilience, and environmental cost.",
        bullets: [
          "A corridor links origin, destination, intermediate nodes, terrain, cost, and strategic purpose.",
          "Ports and roads should be tied to hinterland, cargo, industrial belts, and evacuation routes.",
          "Border infrastructure must be evaluated through security, local livelihood, ecology, and disaster access.",
          "Digital and energy networks also have geography: route, redundancy, risk, and regional inclusion.",
        ],
        expectedRecallPoints: [
          point(
            "connectivity-infrastructure-geography",
            "corridor-chain",
            "Corridor chain",
            "Recall should connect origin, destination, nodes, terrain, cost, and strategic purpose.",
            ["corridor", "origin", "destination", "nodes", "terrain", "cost", "strategic"]
          ),
          point(
            "connectivity-infrastructure-geography",
            "hinterland-cargo-link",
            "Hinterland and cargo link",
            "Ports and roads should be recalled through hinterland, cargo, industrial belts, and evacuation routes.",
            ["hinterland", "cargo", "industrial", "evacuation", "port", "road"]
          ),
          point(
            "connectivity-infrastructure-geography",
            "infrastructure-tradeoff",
            "Infrastructure tradeoff",
            "The answer should include security, livelihood, ecology, disaster access, and inclusion tradeoffs.",
            ["security", "livelihood", "ecology", "disaster access", "inclusion"]
          ),
        ],
      },
      {
        id: "climate-change-geography",
        order: 4,
        kind: "current",
        title: "Climate Change Geography",
        eyebrow: "Risk by place",
        estimatedMinutes: 6,
        body:
          "Climate change geography is not only global warming. UPSC can test spatial variation: glaciers, coasts, islands, cities, forests, drylands, river basins, mountains, agriculture zones, fisheries, and vulnerable communities. The recall must connect driver, location, exposure, impact, and adaptation.",
        bullets: [
          "Glaciers link warming, snowline shift, GLOF risk, river seasonality, and downstream water security.",
          "Coasts link sea-level rise, erosion, cyclones, salinity ingress, mangroves, ports, and settlements.",
          "Cities link heat islands, flooding, drainage, land use, air quality, and vulnerable workers.",
          "Agriculture links rainfall variability, heat stress, irrigation demand, crop shift, and food security.",
        ],
        expectedRecallPoints: [
          point(
            "climate-change-geography",
            "climate-risk-chain",
            "Climate risk chain",
            "Recall should connect climate driver, location, exposure, impact, and adaptation.",
            ["climate", "driver", "location", "exposure", "impact", "adaptation"]
          ),
          point(
            "climate-change-geography",
            "glacier-coast-city-agri",
            "Place-specific climate risks",
            "The answer should include at least glacier, coast, city, or agriculture examples with spatial impacts.",
            ["glacier", "coast", "city", "agriculture", "spatial", "risk"]
          ),
          point(
            "climate-change-geography",
            "coastal-climate-chain",
            "Coastal climate chain",
            "Coasts should be linked with sea-level rise, erosion, cyclones, salinity ingress, mangroves, ports, and settlements.",
            ["sea level", "erosion", "cyclone", "salinity", "mangrove", "port", "settlement"]
          ),
        ],
      },
      {
        id: "disaster-geography-recent-events",
        order: 5,
        kind: "current",
        title: "Disaster Geography Recent Events",
        eyebrow: "Hazard, exposure, capacity",
        estimatedMinutes: 6,
        body:
          "Disaster geography connects hazard type with physical setting and human exposure. Floods, landslides, earthquakes, cyclones, heatwaves, droughts, forest fires, avalanches, cloudbursts, and GLOFs should be recalled through hazard, vulnerability, exposure, capacity, and mitigation.",
        bullets: [
          "A disaster answer must identify the hazard and the geography that makes it worse or better.",
          "Mountain disasters often combine slope, geology, rainfall, glacier lakes, roads, tunnels, and settlement pressure.",
          "Urban disasters often combine drainage, encroachment, land use, heat, waste, and governance capacity.",
          "Mitigation should be location-specific, not a generic checklist.",
        ],
        expectedRecallPoints: [
          point(
            "disaster-geography-recent-events",
            "hazard-exposure-capacity",
            "Hazard, exposure, capacity",
            "Recall should connect hazard, vulnerability, exposure, capacity, and mitigation.",
            ["hazard", "vulnerability", "exposure", "capacity", "mitigation"]
          ),
          point(
            "disaster-geography-recent-events",
            "mountain-disaster-chain",
            "Mountain disaster chain",
            "Mountain disasters should connect slope, geology, rainfall, glacier lakes, roads, tunnels, and settlement pressure.",
            ["slope", "geology", "rainfall", "glacier lake", "road", "tunnel", "settlement"]
          ),
          point(
            "disaster-geography-recent-events",
            "urban-disaster-chain",
            "Urban disaster chain",
            "Urban disasters should connect drainage, encroachment, land use, heat, waste, and governance capacity.",
            ["drainage", "encroachment", "land use", "heat", "waste", "governance"]
          ),
        ],
      },
      {
        id: "static-current-bridge",
        order: 6,
        kind: "advanced",
        title: "Static to Current Bridge",
        eyebrow: "Answer structure",
        estimatedMinutes: 5,
        body:
          "The clean answer structure is: locate the place, name the static concept, explain the current trigger, show impact, and add a location-specific response. This works for geopolitics, infrastructure, climate change, and disasters.",
        bullets: [
          "Locate: country, state, river basin, mountain range, coast, strait, port, city, or corridor.",
          "Concept: border, route, resource, climate zone, hazard, landform, settlement, or network.",
          "Trigger: conflict, project, extreme event, policy, technology, resource demand, or ecological stress.",
          "Response: map-specific adaptation, risk reduction, logistics, conservation, or governance.",
        ],
        expectedRecallPoints: [
          point(
            "static-current-bridge",
            "locate-concept-trigger-impact-response",
            "Five-part answer frame",
            "Recall should use locate, concept, trigger, impact, and response as the current geography answer frame.",
            ["locate", "concept", "trigger", "impact", "response"]
          ),
          point(
            "static-current-bridge",
            "current-bridge-works-all",
            "Bridge works across current themes",
            "The same static-current bridge should work for geopolitics, infrastructure, climate change, and disasters.",
            ["geopolitics", "infrastructure", "climate change", "disaster", "bridge"]
          ),
        ],
      },
      {
        id: "current-geography-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "News trap discipline",
        estimatedMinutes: 4,
        body:
          "Current geography traps use fresh words to test old geography. A project may be in the wrong state, a climate impact may be assigned to the wrong region, a disaster may ignore human exposure, or a strait may be paired with the wrong sea.",
        bullets: [
          "Reject news-only answers that do not prove the map relationship.",
          "Check every corridor for start point, end point, nodes, terrain, and purpose.",
          "Check every disaster for hazard plus exposure, not hazard alone.",
          "Check every climate statement for regional variation rather than global generalisation.",
        ],
        expectedRecallPoints: [
          point(
            "current-geography-traps-pyq",
            "fresh-word-old-geography",
            "Fresh word, old geography",
            "Recall should say that current traps use fresh news to test old static geography.",
            ["fresh", "news", "old", "static", "geography", "trap"]
          ),
          point(
            "current-geography-traps-pyq",
            "corridor-disaster-climate-check",
            "Corridor, disaster, climate checks",
            "The student should check corridors, disasters, and climate statements for map accuracy and regional variation.",
            ["corridor", "disaster", "climate", "map", "regional variation"]
          ),
        ],
      },
      {
        id: "current-geography-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Final Integration Handoff",
        eyebrow: "Before Day 18",
        estimatedMinutes: 4,
        body:
          "Before moving to Day 18 integrated recall, speak one connected answer covering geopolitical map logic, infrastructure networks, climate risk by place, disaster geography, and the five-part static-current frame.",
        bullets: [
          "Start with one news item and locate it exactly.",
          "Attach the static geography concept and explain the process.",
          "Add impact and one place-specific response.",
          "Next handoff: Day 18 begins integrated recall and weak-area repair across the full Geography chain.",
        ],
        expectedRecallPoints: [
          point(
            "current-geography-quick-recall-handoff",
            "full-current-geography-chain",
            "Full current geography chain",
            "Recall should connect geopolitics, infrastructure, climate change, disasters, and the static-current bridge.",
            ["geopolitics", "infrastructure", "climate change", "disasters", "static", "current"]
          ),
          point(
            "current-geography-quick-recall-handoff",
            "day18-integration-handoff",
            "Day 18 integration handoff",
            "The next step is integrated recall and weak-area repair across all Geography modules.",
            ["day 18", "integrated recall", "weak area", "repair", "geography modules"]
          ),
        ],
      },
    ],
  },
  {
    id: "earth-interior-tectonics-day3",
    subjectSlug: "geography",
    day: 3,
    cluster: "Cluster 2",
    title: "Earth Interior, Seismology, and Plate Tectonics",
    subtitle: "Use seismic evidence to explain layers, earthquakes, plate boundaries, and Himalaya formation.",
    status: "draft",
    topicIds: [2, 3, 4],
    sourceLabel: "1. Geography topics.pdf topic groups 2-4, draft web module",
    sections: [
      {
        id: "earth-interior-frame",
        order: 1,
        kind: "basic",
        title: "Why Earth Interior Matters",
        eyebrow: "Evidence before theory",
        estimatedMinutes: 4,
        body:
          "Earth interior is not directly visible, so UPSC asks how we know. The student should begin with indirect evidence: seismic waves, gravity, magnetism, density, meteorites, volcanoes, and drilling limits. This evidence then explains layers, earthquakes, volcanoes, plate boundaries, and mountain building.",
        bullets: [
          "Interior questions are evidence questions first.",
          "Seismic waves are the main evidence for layer boundaries and material state.",
          "Density, gravity, magnetism, meteorites, volcanoes, and drilling provide supporting clues.",
          "Earth interior is the foundation for seismology, plate tectonics, volcanoes, and landforms.",
        ],
        expectedRecallPoints: [
          point(
            "earth-interior-frame",
            "indirect-evidence-core",
            "Indirect evidence core",
            "Recall should say Earth interior is understood through indirect evidence, especially seismic waves.",
            ["indirect", "evidence", "seismic waves", "earth interior"]
          ),
          point(
            "earth-interior-frame",
            "supporting-evidence-list",
            "Supporting evidence list",
            "The answer should include density, gravity, magnetism, meteorites, volcanoes, or drilling limits.",
            ["density", "gravity", "magnetism", "meteorites", "volcanoes", "drilling"]
          ),
        ],
      },
      {
        id: "earth-layers-composition",
        order: 2,
        kind: "ncert",
        title: "Layers and Composition",
        eyebrow: "Crust, mantle, core",
        estimatedMinutes: 6,
        body:
          "The basic layer chain is crust, mantle, outer core, and inner core. The crust is thin and divided into continental and oceanic types. The mantle is solid but can flow over geological time. The outer core is liquid and helps generate Earth's magnetic field, while the inner core is solid because of pressure.",
        bullets: [
          "Continental crust is thicker and generally less dense than oceanic crust.",
          "Lithosphere includes crust plus uppermost mantle and is broken into plates.",
          "Asthenosphere is weak or ductile enough to permit plate movement.",
          "Outer core is liquid; inner core is solid because pressure is very high.",
        ],
        expectedRecallPoints: [
          point(
            "earth-layers-composition",
            "layer-sequence",
            "Layer sequence",
            "Recall should name crust, mantle, outer core, and inner core in correct order.",
            ["crust", "mantle", "outer core", "inner core"]
          ),
          point(
            "earth-layers-composition",
            "lithosphere-asthenosphere",
            "Lithosphere and asthenosphere",
            "The answer should link lithosphere to plates and asthenosphere to ductile movement.",
            ["lithosphere", "plates", "asthenosphere", "ductile", "movement"]
          ),
          point(
            "earth-layers-composition",
            "outer-inner-core-state",
            "Core state contrast",
            "Recall should distinguish liquid outer core and solid inner core due to pressure.",
            ["liquid outer core", "solid inner core", "pressure"]
          ),
        ],
      },
      {
        id: "seismic-waves-shadow-zones",
        order: 3,
        kind: "advanced",
        title: "Seismic Waves and Shadow Zones",
        eyebrow: "How waves prove layers",
        estimatedMinutes: 6,
        body:
          "P waves travel through solids, liquids, and gases, while S waves travel only through solids. Their speed and path change at layer boundaries. S-wave absence and P-wave refraction create shadow zones, proving a liquid outer core and changing material properties inside Earth.",
        bullets: [
          "P waves are faster and can pass through solids and liquids.",
          "S waves cannot pass through liquids, so their absence indicates liquid material.",
          "Wave refraction and reflection reveal boundaries such as Moho and core-mantle boundary.",
          "Shadow zones are not random gaps; they are evidence of internal structure.",
        ],
        expectedRecallPoints: [
          point(
            "seismic-waves-shadow-zones",
            "p-s-wave-contrast",
            "P and S wave contrast",
            "Recall should say P waves pass through solids and liquids, while S waves pass only through solids.",
            ["p waves", "s waves", "solids", "liquids"]
          ),
          point(
            "seismic-waves-shadow-zones",
            "shadow-zone-proof",
            "Shadow zone proof",
            "The answer should connect shadow zones with S-wave absence, P-wave refraction, and liquid outer core evidence.",
            ["shadow zone", "s wave", "p wave", "refraction", "liquid outer core"]
          ),
          point(
            "seismic-waves-shadow-zones",
            "wave-boundaries",
            "Wave boundary evidence",
            "Recall should mention wave speed, reflection, or refraction at internal boundaries.",
            ["wave speed", "reflection", "refraction", "boundary", "moho"]
          ),
        ],
      },
      {
        id: "earthquakes-belts-india",
        order: 4,
        kind: "current",
        title: "Earthquakes, Belts, and India",
        eyebrow: "Seismology to hazard",
        estimatedMinutes: 6,
        body:
          "Earthquakes occur due to sudden energy release along faults, plate boundaries, or crustal weaknesses. Recall must cover focus, epicentre, magnitude, intensity, seismic waves, global belts, and India's seismic zones. Himalayan collision makes northern and northeastern India highly significant.",
        bullets: [
          "Focus is the underground origin point; epicentre is the surface point above it.",
          "Magnitude measures released energy; intensity measures observed effects at a place.",
          "Major earthquake belts follow plate margins, especially circum-Pacific and Alpine-Himalayan belts.",
          "Indian seismic risk is high in the Himalayas, Northeast, Kachchh, and other active fault zones.",
        ],
        expectedRecallPoints: [
          point(
            "earthquakes-belts-india",
            "focus-epicentre-magnitude-intensity",
            "Earthquake terms",
            "Recall should distinguish focus, epicentre, magnitude, and intensity.",
            ["focus", "epicentre", "magnitude", "intensity"]
          ),
          point(
            "earthquakes-belts-india",
            "global-earthquake-belts",
            "Global earthquake belts",
            "The answer should mention plate-margin belts, especially circum-Pacific and Alpine-Himalayan belts.",
            ["plate margin", "circum pacific", "alpine himalayan", "earthquake belt"]
          ),
          point(
            "earthquakes-belts-india",
            "india-seismic-risk",
            "India seismic risk",
            "Recall should connect Indian seismic risk with Himalayas, Northeast, Kachchh, and active faults.",
            ["himalayas", "northeast", "kachchh", "active fault", "seismic risk"]
          ),
        ],
      },
      {
        id: "plate-boundaries-movement",
        order: 5,
        kind: "advanced",
        title: "Plate Tectonic Boundaries",
        eyebrow: "Divergent, convergent, transform",
        estimatedMinutes: 6,
        body:
          "Plate tectonics explains continental drift, ocean-floor creation, subduction, earthquakes, volcanoes, trenches, ridges, island arcs, fold mountains, and transform faults. The three boundary types are divergent, convergent, and transform, and each has a different landform and hazard signature.",
        bullets: [
          "Divergent boundaries create rifts, mid-ocean ridges, new crust, and shallow earthquakes.",
          "Convergent boundaries create subduction zones, trenches, volcanic arcs, earthquakes, and fold mountains.",
          "Transform boundaries slide laterally and commonly generate earthquakes.",
          "Plate movement evidence includes seafloor spreading, paleomagnetism, fossil fit, jigsaw fit, and earthquake-volcano belts.",
        ],
        expectedRecallPoints: [
          point(
            "plate-boundaries-movement",
            "three-boundary-types",
            "Three boundary types",
            "Recall should name divergent, convergent, and transform boundaries.",
            ["divergent", "convergent", "transform"]
          ),
          point(
            "plate-boundaries-movement",
            "boundary-landform-hazard",
            "Boundary-landform-hazard link",
            "The answer should connect each boundary type with its landforms and hazards.",
            ["rift", "ridge", "subduction", "trench", "volcanic arc", "earthquake", "fold mountain"]
          ),
          point(
            "plate-boundaries-movement",
            "plate-evidence",
            "Evidence for plate movement",
            "Recall should mention seafloor spreading, paleomagnetism, fossil fit, jigsaw fit, or earthquake-volcano belts.",
            ["seafloor spreading", "paleomagnetism", "fossil", "jigsaw", "earthquake", "volcano"]
          ),
        ],
      },
      {
        id: "indian-plate-himalaya",
        order: 6,
        kind: "advanced",
        title: "Indian Plate and Himalaya Formation",
        eyebrow: "Collision geography",
        estimatedMinutes: 5,
        body:
          "The Himalayas formed due to collision between the Indian Plate and Eurasian Plate after the closing of the Tethys Sea. This explains young fold mountains, high relief, active seismicity, landslides, river incision, glaciers, and continuing uplift.",
        bullets: [
          "Indian Plate moved northward and collided with the Eurasian Plate.",
          "Tethys sediments were compressed into young fold mountains.",
          "The Himalayas are still tectonically active, so earthquakes and landslides remain important.",
          "Plate tectonics links physical geography with disaster geography and Indian physiography.",
        ],
        expectedRecallPoints: [
          point(
            "indian-plate-himalaya",
            "indian-eurasian-collision",
            "Indian-Eurasian collision",
            "Recall should connect Himalaya formation with Indian Plate and Eurasian Plate collision.",
            ["indian plate", "eurasian plate", "collision", "himalaya"]
          ),
          point(
            "indian-plate-himalaya",
            "tethys-fold-mountains",
            "Tethys and fold mountains",
            "The answer should mention Tethys sediments compressed into young fold mountains.",
            ["tethys", "sediments", "young fold mountains"]
          ),
          point(
            "indian-plate-himalaya",
            "active-himalaya-hazards",
            "Active Himalaya hazards",
            "Recall should link ongoing tectonics with earthquakes, landslides, river incision, glaciers, and uplift.",
            ["tectonic", "earthquake", "landslide", "river incision", "glacier", "uplift"]
          ),
        ],
      },
      {
        id: "interior-tectonics-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Evidence traps",
        estimatedMinutes: 4,
        body:
          "Common traps confuse crust with lithosphere, asthenosphere with liquid magma, intensity with magnitude, focus with epicentre, and continental drift with the full plate-tectonic mechanism. UPSC also tests whether the student can connect evidence to conclusion.",
        bullets: [
          "Lithosphere is not only crust; it includes crust plus uppermost mantle.",
          "Asthenosphere is weak or ductile, not a global liquid ocean.",
          "Magnitude and intensity are different measurements.",
          "Do not describe plate tectonics without boundary type, evidence, and landform result.",
        ],
        expectedRecallPoints: [
          point(
            "interior-tectonics-traps-pyq",
            "lithosphere-trap",
            "Lithosphere trap",
            "Recall should avoid saying lithosphere means crust only.",
            ["lithosphere", "crust", "uppermost mantle", "trap"]
          ),
          point(
            "interior-tectonics-traps-pyq",
            "magnitude-intensity-trap",
            "Magnitude-intensity trap",
            "The answer should reject confusing magnitude with intensity.",
            ["magnitude", "intensity", "different"]
          ),
          point(
            "interior-tectonics-traps-pyq",
            "evidence-conclusion-discipline",
            "Evidence-conclusion discipline",
            "Recall should connect evidence, boundary type, process, and landform result.",
            ["evidence", "boundary", "process", "landform", "result"]
          ),
        ],
      },
      {
        id: "interior-tectonics-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Day 4 Handoff",
        eyebrow: "Speak before landforms",
        estimatedMinutes: 4,
        body:
          "Before moving to volcanoes, rocks, and landforms, speak one connected chain: indirect evidence, layers, P and S waves, shadow zones, earthquake terms, plate boundaries, Indian Plate collision, and Himalaya hazards.",
        bullets: [
          "Start with indirect evidence and Earth layers.",
          "Explain P waves, S waves, and shadow zones.",
          "Add earthquake belts and Indian seismic risk.",
          "End with plate boundaries and the Indian-Eurasian collision handoff to landforms.",
        ],
        expectedRecallPoints: [
          point(
            "interior-tectonics-quick-recall-handoff",
            "full-day3-chain",
            "Full Day 3 chain",
            "Recall should connect evidence, layers, seismic waves, earthquakes, plate boundaries, and Himalaya formation.",
            ["evidence", "layers", "seismic waves", "earthquake", "plate boundaries", "himalaya"]
          ),
          point(
            "interior-tectonics-quick-recall-handoff",
            "day4-landform-handoff",
            "Day 4 landform handoff",
            "The next module uses tectonics to explain volcanoes, rocks, and landform development.",
            ["day 4", "volcanoes", "rocks", "landforms", "tectonics"]
          ),
        ],
      },
    ],
  },
  {
    id: "monsoon-maritime-day7",
    subjectSlug: "geography",
    day: 7,
    cluster: "Cluster 8",
    title: "Indian Monsoon, ENSO-IOD-MJO, and Maritime Zones",
    subtitle: "Connect monsoon mechanisms, variability, Indian impacts, and ocean governance.",
    status: "draft",
    topicIds: [22, 23, 30],
    sourceLabel: "1. Geography topics.pdf topic groups 22-23 and 30, draft web module",
    sections: [
      {
        id: "monsoon-maritime-frame",
        order: 1,
        kind: "basic",
        title: "Why Day 7 Is a Link Day",
        eyebrow: "Atmosphere plus ocean",
        estimatedMinutes: 4,
        body:
          "Day 7 connects atmosphere and ocean. Indian monsoon cannot be recalled only as seasonal rain; it depends on land-sea thermal contrast, pressure shift, ITCZ movement, cross-equatorial flow, jet streams, moisture, mountains, ocean variability, and regional distribution. Maritime zones then turn ocean geography into law, resources, and security.",
        bullets: [
          "Monsoon is a seasonal reversal system, not simply rainfall.",
          "Mechanism needs land, sea, pressure, ITCZ, winds, jets, ocean, and relief.",
          "Variability comes from ENSO, IOD, MJO, snow cover, local systems, and intra-seasonal breaks.",
          "Maritime zones connect ocean space with rights, resources, shipping, fisheries, and security.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-maritime-frame",
            "monsoon-seasonal-reversal",
            "Monsoon as seasonal reversal",
            "Recall should describe monsoon as a seasonal reversal system, not just rain.",
            ["monsoon", "seasonal reversal", "rain"]
          ),
          point(
            "monsoon-maritime-frame",
            "atmosphere-ocean-link",
            "Atmosphere-ocean link",
            "The answer should connect land, sea, pressure, ITCZ, winds, jets, ocean, and relief.",
            ["land", "sea", "pressure", "itcz", "winds", "jets", "ocean", "relief"]
          ),
          point(
            "monsoon-maritime-frame",
            "maritime-zones-link",
            "Maritime zones link",
            "Recall should connect maritime zones with rights, resources, shipping, fisheries, and security.",
            ["maritime zones", "rights", "resources", "shipping", "fisheries", "security"]
          ),
        ],
      },
      {
        id: "monsoon-mechanism",
        order: 2,
        kind: "advanced",
        title: "Indian Monsoon Mechanism",
        eyebrow: "Thermal contrast and circulation",
        estimatedMinutes: 6,
        body:
          "The monsoon develops from differential heating of land and ocean, seasonal pressure shift, northward ITCZ movement, cross-equatorial flow, Somali jet, Tibetan Plateau heating, subtropical westerly jet withdrawal, tropical easterly jet, and orographic lifting over the Western Ghats and Himalayas.",
        bullets: [
          "Summer heating creates low pressure over the Indian landmass and pulls moist winds from the ocean.",
          "ITCZ shifts northward and helps organise monsoon circulation.",
          "The Somali jet strengthens moisture transport toward India.",
          "Western Ghats and Himalayas shape rainfall distribution through orographic lifting and blocking.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-mechanism",
            "land-sea-pressure-itcz",
            "Land-sea pressure and ITCZ",
            "Recall should connect land-sea heating, low pressure, and northward ITCZ shift.",
            ["land sea", "low pressure", "itcz", "northward"]
          ),
          point(
            "monsoon-mechanism",
            "somali-jet-moisture",
            "Somali jet moisture transport",
            "The answer should mention Somali jet or cross-equatorial flow bringing moisture.",
            ["somali jet", "cross equatorial", "moisture"]
          ),
          point(
            "monsoon-mechanism",
            "relief-rainfall-distribution",
            "Relief and rainfall distribution",
            "Recall should link Western Ghats and Himalayas with orographic rainfall and blocking.",
            ["western ghats", "himalayas", "orographic", "blocking", "rainfall"]
          ),
        ],
      },
      {
        id: "monsoon-variability-enso-iod-mjo",
        order: 3,
        kind: "current",
        title: "ENSO, IOD, MJO, and Monsoon Variability",
        eyebrow: "Why rainfall changes",
        estimatedMinutes: 6,
        body:
          "Monsoon variability needs multiple drivers. El Nino often weakens Indian monsoon rainfall, La Nina often supports it, but the relationship is not automatic. Indian Ocean Dipole can offset or amplify ENSO influence. Madden-Julian Oscillation affects intra-seasonal active and break spells.",
        bullets: [
          "El Nino and La Nina are Pacific Ocean-atmosphere events that influence global circulation.",
          "Positive IOD can support Indian monsoon rainfall by changing Indian Ocean temperature contrast.",
          "MJO is a moving pulse of cloud and rainfall that affects active and break monsoon phases.",
          "UPSC traps use one driver as if it always decides the monsoon alone.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-variability-enso-iod-mjo",
            "enso-monsoon-link",
            "ENSO-monsoon link",
            "Recall should connect El Nino and La Nina with Indian monsoon variability without making it automatic.",
            ["el nino", "la nina", "monsoon", "variability", "not automatic"]
          ),
          point(
            "monsoon-variability-enso-iod-mjo",
            "iod-offset-amplify",
            "IOD offset or amplify",
            "The answer should mention that IOD can offset or amplify ENSO influence.",
            ["iod", "offset", "amplify", "enso"]
          ),
          point(
            "monsoon-variability-enso-iod-mjo",
            "mjo-active-break",
            "MJO active and break spells",
            "Recall should link MJO with active and break monsoon phases.",
            ["mjo", "active", "break", "monsoon"]
          ),
        ],
      },
      {
        id: "monsoon-regional-impacts",
        order: 4,
        kind: "current",
        title: "Regional Rainfall and Indian Impacts",
        eyebrow: "Distribution, agriculture, hazards",
        estimatedMinutes: 6,
        body:
          "The Indian monsoon must be recalled regionally. Western Ghats, northeast India, Indo-Gangetic plains, Rajasthan, rain-shadow interiors, coastal belts, Himalayas, and urban regions receive different rainfall patterns and risks. Impacts include agriculture, reservoirs, groundwater, floods, droughts, landslides, health, and prices.",
        bullets: [
          "Distribution is controlled by relief, distance from sea, wind direction, depressions, and regional circulation.",
          "Rain-shadow regions show why high rainfall on one slope can mean dryness nearby.",
          "Weak or delayed monsoon affects sowing, reservoirs, hydropower, groundwater, and food prices.",
          "Extreme rain links monsoon with floods, landslides, urban drainage, and disaster governance.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-regional-impacts",
            "regional-rainfall-controls",
            "Regional rainfall controls",
            "Recall should mention relief, distance from sea, wind direction, depressions, and regional circulation.",
            ["relief", "distance from sea", "wind direction", "depressions", "regional circulation"]
          ),
          point(
            "monsoon-regional-impacts",
            "monsoon-economy-impacts",
            "Monsoon economy impacts",
            "The answer should connect monsoon with sowing, reservoirs, hydropower, groundwater, and food prices.",
            ["sowing", "reservoirs", "hydropower", "groundwater", "food prices"]
          ),
          point(
            "monsoon-regional-impacts",
            "extreme-rain-disaster",
            "Extreme rain disaster link",
            "Recall should connect extreme rain with floods, landslides, urban drainage, and disaster governance.",
            ["extreme rain", "floods", "landslides", "urban drainage", "disaster governance"]
          ),
        ],
      },
      {
        id: "maritime-zones-law",
        order: 5,
        kind: "ncert",
        title: "EEZ, Continental Shelf, and Maritime Zones",
        eyebrow: "Ocean space as rights",
        estimatedMinutes: 6,
        body:
          "Maritime zones convert distance from baseline into rights and responsibilities. Territorial sea, contiguous zone, Exclusive Economic Zone, continental shelf, high seas, and seabed areas have different legal meanings. The student must pair each zone with sovereignty, control, resources, navigation, and enforcement limits.",
        bullets: [
          "Territorial sea has sovereignty subject to innocent passage.",
          "Contiguous zone allows limited control for customs, fiscal, immigration, and sanitary laws.",
          "EEZ gives sovereign rights for resources, not full sovereignty over the water like land territory.",
          "Continental shelf rights concern seabed and subsoil resources and may extend beyond the EEZ in legal terms.",
        ],
        expectedRecallPoints: [
          point(
            "maritime-zones-law",
            "territorial-contiguous-eez",
            "Territorial sea, contiguous zone, EEZ",
            "Recall should distinguish territorial sea, contiguous zone, and EEZ by rights and control.",
            ["territorial sea", "contiguous zone", "eez", "rights", "control"]
          ),
          point(
            "maritime-zones-law",
            "eez-not-full-sovereignty",
            "EEZ is not full sovereignty",
            "The answer should say EEZ gives sovereign rights for resources, not full sovereignty like land territory.",
            ["eez", "sovereign rights", "resources", "not full sovereignty"]
          ),
          point(
            "maritime-zones-law",
            "continental-shelf-seabed",
            "Continental shelf seabed rights",
            "Recall should connect continental shelf with seabed and subsoil resource rights.",
            ["continental shelf", "seabed", "subsoil", "resources"]
          ),
        ],
      },
      {
        id: "maritime-economy-security",
        order: 6,
        kind: "advanced",
        title: "Maritime Economy and Security",
        eyebrow: "Blue economy",
        estimatedMinutes: 5,
        body:
          "India's maritime geography links ports, islands, fisheries, offshore energy, sea lanes, naval security, marine biodiversity, coastal communities, and disaster response. The exam may connect EEZ with blue economy, illegal fishing, deep sea mining, piracy, chokepoints, and coastal regulation.",
        bullets: [
          "EEZ matters for fisheries, hydrocarbons, renewable energy, biodiversity, and seabed resources.",
          "Islands extend strategic reach, surveillance, disaster response, and maritime domain awareness.",
          "Shipping lanes and chokepoints affect trade, energy security, and naval planning.",
          "Blue economy answers need ecology and livelihood, not only extraction.",
        ],
        expectedRecallPoints: [
          point(
            "maritime-economy-security",
            "eez-blue-economy",
            "EEZ and blue economy",
            "Recall should connect EEZ with fisheries, energy, biodiversity, seabed resources, and blue economy.",
            ["eez", "fisheries", "energy", "biodiversity", "seabed", "blue economy"]
          ),
          point(
            "maritime-economy-security",
            "island-strategic-reach",
            "Island strategic reach",
            "The answer should link islands with surveillance, disaster response, maritime domain awareness, and reach.",
            ["islands", "surveillance", "disaster response", "maritime domain awareness", "reach"]
          ),
          point(
            "maritime-economy-security",
            "shipping-chokepoint-security",
            "Shipping chokepoint security",
            "Recall should connect shipping lanes and chokepoints with trade, energy security, and naval planning.",
            ["shipping lanes", "chokepoints", "trade", "energy security", "naval"]
          ),
        ],
      },
      {
        id: "monsoon-maritime-traps-pyq",
        order: 7,
        kind: "trap",
        title: "Examiner Traps and PYQ Logic",
        eyebrow: "Mechanism and legal traps",
        estimatedMinutes: 4,
        body:
          "Monsoon traps reduce the system to one cause, treat El Nino as a guaranteed drought, ignore IOD and MJO, or forget relief. Maritime traps confuse EEZ with territorial sea, continental shelf with water-column rights, and high seas with no law.",
        bullets: [
          "Do not explain monsoon only through land-sea heating; include circulation and relief.",
          "Do not say El Nino always means drought in India.",
          "Do not treat EEZ as complete sovereignty.",
          "Do not confuse continental shelf seabed rights with EEZ water-column resource rights.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-maritime-traps-pyq",
            "single-cause-monsoon-trap",
            "Single-cause monsoon trap",
            "Recall should reject explaining monsoon with only one cause.",
            ["single cause", "monsoon", "land sea", "circulation", "relief"]
          ),
          point(
            "monsoon-maritime-traps-pyq",
            "el-nino-guarantee-trap",
            "El Nino guarantee trap",
            "The answer should reject saying El Nino always guarantees drought in India.",
            ["el nino", "always", "drought", "india", "trap"]
          ),
          point(
            "monsoon-maritime-traps-pyq",
            "eez-territorial-sea-trap",
            "EEZ-territorial sea trap",
            "Recall should distinguish EEZ resource rights from territorial sea sovereignty.",
            ["eez", "territorial sea", "resource rights", "sovereignty"]
          ),
        ],
      },
      {
        id: "monsoon-maritime-quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Day 8 Handoff",
        eyebrow: "Speak before India physiography",
        estimatedMinutes: 4,
        body:
          "Before moving to Indian physiography, speak one connected answer: monsoon mechanism, ENSO-IOD-MJO variability, regional rainfall impacts, maritime zones, EEZ rights, continental shelf, blue economy, and legal traps.",
        bullets: [
          "Start with monsoon as seasonal reversal driven by land-sea-pressure circulation.",
          "Add ENSO, IOD, MJO, active-break spells, and regional rainfall distribution.",
          "Explain maritime zones through rights, resources, navigation, and enforcement limits.",
          "Next handoff: Day 8 uses relief and location to explain India's physiographic regions.",
        ],
        expectedRecallPoints: [
          point(
            "monsoon-maritime-quick-recall-handoff",
            "full-day7-chain",
            "Full Day 7 chain",
            "Recall should connect monsoon mechanism, ENSO-IOD-MJO, regional impacts, maritime zones, and blue economy.",
            ["monsoon", "enso", "iod", "mjo", "regional impacts", "maritime zones", "blue economy"]
          ),
          point(
            "monsoon-maritime-quick-recall-handoff",
            "day8-physiography-handoff",
            "Day 8 physiography handoff",
            "The next module uses relief and location to explain India's physiographic regions.",
            ["day 8", "relief", "location", "india", "physiography"]
          ),
        ],
      },
    ],
  },
  {
    id: "geographic-thinking-day1",
    subjectSlug: "geography",
    day: 1,
    cluster: "Foundation",
    title: "Geographic Thinking and Map Relationships",
    subtitle: "Train the UPSC geography lens before starting the numbered PDF topic groups.",
    status: "draft",
    topicIds: [],
    sourceLabel: "20-day plan foundation day, draft web module",
    sections: [
      {
        id: "geography-lens",
        order: 1,
        kind: "basic",
        title: "The Geography Lens",
        eyebrow: "What, where, why",
        estimatedMinutes: 4,
        body:
          "Geography starts by asking what exists, where it is located, why it is there, and what relationship it has with nearby physical and human features. This lens prevents the student from memorising disconnected places.",
        bullets: [
          "What: the feature, pattern, resource, settlement, hazard, route, or region.",
          "Where: exact location plus neighbouring regions, rivers, coasts, mountains, borders, or routes.",
          "Why: the physical, human, economic, political, or historical reason behind the pattern.",
          "Relationship: how one map layer changes another layer.",
        ],
        expectedRecallPoints: [
          point(
            "geography-lens",
            "what-where-why",
            "What, where, why",
            "Recall should define geography through what exists, where it is, and why it is there.",
            ["what", "where", "why", "geography", "location"]
          ),
          point(
            "geography-lens",
            "map-layer-relationship",
            "Map layer relationship",
            "The answer should say one map layer affects another, such as relief, river, climate, crop, route, or settlement.",
            ["map layer", "relief", "river", "climate", "crop", "route", "settlement"]
          ),
        ],
      },
      {
        id: "absolute-relative-location",
        order: 2,
        kind: "basic",
        title: "Absolute and Relative Location",
        eyebrow: "Coordinates plus context",
        estimatedMinutes: 4,
        body:
          "Absolute location fixes a place using coordinates or a precise position. Relative location explains a place through its surroundings, access, distance, route, border, coast, river, pass, or region. UPSC often tests relative location through map-pair traps.",
        bullets: [
          "Absolute location answers exactly where a place is.",
          "Relative location answers where it sits in relation to other places.",
          "Relative location is usually more useful for routes, trade, climate, risk, and strategy.",
          "A correct place name can still be wrong if its relative map relation is false.",
        ],
        expectedRecallPoints: [
          point(
            "absolute-relative-location",
            "absolute-location",
            "Absolute location",
            "Recall should connect absolute location with exact position or coordinates.",
            ["absolute location", "coordinates", "exact position"]
          ),
          point(
            "absolute-relative-location",
            "relative-location",
            "Relative location",
            "Recall should explain relative location through surroundings, route, border, coast, river, pass, or region.",
            ["relative location", "surroundings", "route", "border", "coast", "river", "pass", "region"]
          ),
        ],
      },
      {
        id: "site-situation-scale",
        order: 3,
        kind: "advanced",
        title: "Site, Situation, and Scale",
        eyebrow: "Place reasoning",
        estimatedMinutes: 5,
        body:
          "Site means the internal physical character of a place. Situation means its external relationship with other places and networks. Scale means whether the answer is local, regional, national, continental, or global. Weak geography answers usually mix these without naming the level.",
        bullets: [
          "Site: relief, drainage, soil, climate, water, land, and local conditions.",
          "Situation: access to markets, ports, passes, borders, rivers, roads, and regions.",
          "Scale: local example, regional pattern, national policy, or global process.",
          "Good answers state the correct scale before giving evidence.",
        ],
        expectedRecallPoints: [
          point(
            "site-situation-scale",
            "site-situation-contrast",
            "Site-situation contrast",
            "Recall should distinguish internal site conditions from external situation relationships.",
            ["site", "situation", "internal", "external", "relationship"]
          ),
          point(
            "site-situation-scale",
            "scale-discipline",
            "Scale discipline",
            "The answer should mention local, regional, national, continental, or global scale.",
            ["scale", "local", "regional", "national", "continental", "global"]
          ),
        ],
      },
      {
        id: "india-map-relationship-drill",
        order: 4,
        kind: "advanced",
        title: "India Map Relationship Drill",
        eyebrow: "One map, many layers",
        estimatedMinutes: 5,
        body:
          "India map reading becomes powerful when the student links relief with rivers, monsoon, soils, crops, minerals, industries, transport, hazards, borders, and settlements. The goal is to explain why a pattern is located there, not simply point to it.",
        bullets: [
          "Relief controls slope, drainage, rainfall, passes, and hazard exposure.",
          "Climate and soil shape crops, vegetation, water stress, and settlement density.",
          "Minerals, energy, industry, ports, and corridors create economic geography.",
          "Borders and islands add strategic and political geography.",
        ],
        expectedRecallPoints: [
          point(
            "india-map-relationship-drill",
            "relief-link-chain",
            "Relief link chain",
            "Recall should connect relief with rivers, monsoon, soils, crops, hazards, or settlement patterns.",
            ["relief", "rivers", "monsoon", "soils", "crops", "hazards", "settlement"]
          ),
          point(
            "india-map-relationship-drill",
            "economic-political-layers",
            "Economic and political layers",
            "The answer should add minerals, energy, industry, ports, corridors, borders, or islands.",
            ["minerals", "energy", "industry", "ports", "corridors", "borders", "islands"]
          ),
        ],
      },
      {
        id: "foundation-traps",
        order: 5,
        kind: "trap",
        title: "Foundation Traps",
        eyebrow: "Why students lose marks",
        estimatedMinutes: 4,
        body:
          "The most common early geography trap is memorising a place without proving its relationship. UPSC can pair a correct river with the wrong direction, a correct crop with the wrong soil-rainfall condition, or a correct corridor with the wrong region.",
        bullets: [
          "Never accept a map pair without checking direction and relative position.",
          "Never accept a crop-state pair without soil, rainfall, irrigation, or season logic.",
          "Never accept a route or border statement without terrain and neighbouring regions.",
          "Every fact needs one reason or one map proof.",
        ],
        expectedRecallPoints: [
          point(
            "foundation-traps",
            "place-without-relationship-trap",
            "Place without relationship trap",
            "Recall should reject memorising a place without proving direction, relation, or process.",
            ["place", "relationship", "direction", "process", "trap"]
          ),
          point(
            "foundation-traps",
            "fact-needs-proof",
            "Fact needs proof",
            "The answer should say every geography fact needs one reason or map proof.",
            ["fact", "reason", "map proof", "geography"]
          ),
        ],
      },
      {
        id: "foundation-handoff",
        order: 6,
        kind: "quick-recall",
        title: "Quick Recall and Universe Handoff",
        eyebrow: "Before Day 2",
        estimatedMinutes: 4,
        body:
          "Before starting the Universe module, speak one connected answer: what-where-why, absolute and relative location, site-situation-scale, one India map relationship, and one UPSC trap.",
        bullets: [
          "Define geography as relationship-based spatial reasoning.",
          "Contrast absolute and relative location.",
          "Contrast site and situation, then name the scale.",
          "Use one India example before starting the physical geography chain.",
        ],
        expectedRecallPoints: [
          point(
            "foundation-handoff",
            "full-foundation-chain",
            "Full foundation chain",
            "Recall should connect what-where-why, location, site, situation, scale, map relationship, and trap.",
            ["what", "where", "why", "location", "site", "situation", "scale", "trap"]
          ),
          point(
            "foundation-handoff",
            "day2-universe-handoff",
            "Day 2 Universe handoff",
            "The next step is using the same relationship lens for Universe, solar system, and Earth-origin concepts.",
            ["day 2", "universe", "solar system", "earth origin", "relationship lens"]
          ),
        ],
      },
    ],
  },
  {
    id: "integrated-map-recall-day18",
    subjectSlug: "geography",
    day: 18,
    cluster: "Integration",
    title: "Integrated Physical and India Map Recall",
    subtitle: "Connect Days 1-17 into one physical, India, world, human, and current geography chain.",
    status: "draft",
    topicIds: [],
    sourceLabel: "20-day plan integration day, draft web module",
    sections: [
      {
        id: "integration-map",
        order: 1,
        kind: "basic",
        title: "The Integrated Map",
        eyebrow: "No isolated facts",
        estimatedMinutes: 4,
        body:
          "Day 18 is a cumulative recall day. The student must connect physical geography with India map evidence, world map systems, human geography, political geography, and current affairs. The target is connected memory instead of silo memory.",
        bullets: [
          "Start with location, relief, climate, water, soil, resource, settlement, route, risk, and policy.",
          "Every answer should cross at least two geography layers.",
          "Weak-area repair begins with the layer that breaks the chain.",
          "The day is successful only if the learner can explain links without notes.",
        ],
        expectedRecallPoints: [
          point(
            "integration-map",
            "connected-memory",
            "Connected memory",
            "Recall should say Day 18 links physical, India, world, human, political, and current geography.",
            ["physical", "india", "world", "human", "political", "current", "connected"]
          ),
          point(
            "integration-map",
            "two-layer-answer",
            "Two-layer answer",
            "The answer should cross at least two geography layers, such as relief plus climate or resource plus route.",
            ["two layers", "relief", "climate", "resource", "route", "settlement", "policy"]
          ),
        ],
      },
      {
        id: "physical-india-chain",
        order: 2,
        kind: "advanced",
        title: "Physical to India Chain",
        eyebrow: "Process to map",
        estimatedMinutes: 5,
        body:
          "The learner should speak one chain from Earth structure and relief to monsoon, rivers, soils, vegetation, agriculture, minerals, energy, industries, and transport. This is the core spine of Geography command.",
        bullets: [
          "Earth structure and tectonics explain relief, hazards, minerals, and drainage direction.",
          "Relief and pressure systems shape monsoon distribution and rainfall variability.",
          "Water, soil, climate, and relief shape crops, vegetation, and settlement patterns.",
          "Minerals, power, ports, roads, rails, and corridors shape economic geography.",
        ],
        expectedRecallPoints: [
          point(
            "physical-india-chain",
            "tectonics-to-relief-chain",
            "Tectonics to relief chain",
            "Recall should connect Earth structure or tectonics with relief, hazards, minerals, and drainage.",
            ["tectonics", "relief", "hazards", "minerals", "drainage"]
          ),
          point(
            "physical-india-chain",
            "monsoon-soil-crop-chain",
            "Monsoon-soil-crop chain",
            "The answer should connect monsoon, water, soil, crops, vegetation, and settlement.",
            ["monsoon", "water", "soil", "crops", "vegetation", "settlement"]
          ),
          point(
            "physical-india-chain",
            "economic-geography-chain",
            "Economic geography chain",
            "Recall should connect minerals, energy, industry, ports, roads, railways, and corridors.",
            ["minerals", "energy", "industry", "ports", "roads", "railways", "corridors"]
          ),
        ],
      },
      {
        id: "world-human-current-chain",
        order: 3,
        kind: "advanced",
        title: "World, Human, and Current Chain",
        eyebrow: "Map fact to living system",
        estimatedMinutes: 5,
        body:
          "World geography, human geography, political geography, and current geography must be recalled together. A strait can become a trade issue, a biome can become a climate question, a border can become a development issue, and a disaster can become a governance answer.",
        bullets: [
          "World map facts need connects-separates, climate, resource, route, and risk logic.",
          "Human geography explains population, migration, urbanisation, culture, and vulnerability.",
          "Political geography adds borders, identity, terrain, security, and development.",
          "Current affairs should be anchored to a static map concept.",
        ],
        expectedRecallPoints: [
          point(
            "world-human-current-chain",
            "world-map-logic",
            "World map logic",
            "Recall should convert world map facts into connects-separates, climate, resource, route, or risk logic.",
            ["world map", "connects", "separates", "climate", "resource", "route", "risk"]
          ),
          point(
            "world-human-current-chain",
            "human-political-current-link",
            "Human-political-current link",
            "The answer should connect population, migration, urbanisation, culture, borders, identity, security, development, and current affairs.",
            ["population", "migration", "urbanisation", "culture", "borders", "identity", "security", "development", "current"]
          ),
        ],
      },
      {
        id: "weak-link-diagnosis",
        order: 4,
        kind: "current",
        title: "Weak-Link Diagnosis",
        eyebrow: "Find the broken layer",
        estimatedMinutes: 5,
        body:
          "A weak answer usually fails at one of five places: concept, mechanism, map location, example, or UPSC trap. The student should name the broken link before opening repair content.",
        bullets: [
          "Concept gap: the term is unclear.",
          "Mechanism gap: cause-effect is missing.",
          "Map gap: location, direction, neighbour, or scale is wrong.",
          "Trap gap: statement logic or exception is missed.",
        ],
        expectedRecallPoints: [
          point(
            "weak-link-diagnosis",
            "five-gap-types",
            "Five gap types",
            "Recall should name concept, mechanism, map, example, and trap as possible weak links.",
            ["concept", "mechanism", "map", "example", "trap"]
          ),
          point(
            "weak-link-diagnosis",
            "diagnose-before-repair",
            "Diagnose before repair",
            "The answer should say repair starts by naming the broken link.",
            ["diagnose", "repair", "broken link", "weak"]
          ),
        ],
      },
      {
        id: "day18-traps",
        order: 5,
        kind: "trap",
        title: "Integrated Traps",
        eyebrow: "Mixed true facts",
        estimatedMinutes: 4,
        body:
          "The hardest integrated traps mix individually true facts into a false relationship. The learner must check whether the river, relief, rainfall, soil, crop, industry, route, border, and current event actually belong together.",
        bullets: [
          "Check direction before accepting river or route statements.",
          "Check relief and rainfall before accepting crop or vegetation statements.",
          "Check raw material, power, market, and transport before accepting industry statements.",
          "Check state, neighbour, terrain, and identity before accepting political geography statements.",
        ],
        expectedRecallPoints: [
          point(
            "day18-traps",
            "mixed-true-fact-trap",
            "Mixed true fact trap",
            "Recall should reject statements that mix true facts into a false relationship.",
            ["mixed", "true facts", "false relationship", "trap"]
          ),
          point(
            "day18-traps",
            "relationship-checklist",
            "Relationship checklist",
            "The answer should check river, relief, rainfall, soil, crop, industry, route, border, and current event relationships.",
            ["river", "relief", "rainfall", "soil", "crop", "industry", "route", "border", "current"]
          ),
        ],
      },
      {
        id: "day18-handoff",
        order: 6,
        kind: "quick-recall",
        title: "Quick Recall and Day 19 Handoff",
        eyebrow: "Repair queue",
        estimatedMinutes: 4,
        body:
          "Before Day 19, speak one system answer and list the three weakest links. Day 19 will use that evidence to run weak-area repair and PYQ-style practice.",
        bullets: [
          "Speak the physical-to-India chain.",
          "Speak the world-human-current chain.",
          "Name the three weakest links.",
          "Carry those weak links into Day 19 repair.",
        ],
        expectedRecallPoints: [
          point(
            "day18-handoff",
            "day18-system-answer",
            "Day 18 system answer",
            "Recall should include the physical-to-India chain, world-human-current chain, and three weak links.",
            ["physical", "india", "world", "human", "current", "three weak links"]
          ),
          point(
            "day18-handoff",
            "day19-repair-handoff",
            "Day 19 repair handoff",
            "The next step is weak-area repair and PYQ-style practice.",
            ["day 19", "weak-area repair", "pyq", "practice"]
          ),
        ],
      },
    ],
  },
  {
    id: "weak-area-pyq-mock-day19",
    subjectSlug: "geography",
    day: 19,
    cluster: "Integration",
    title: "Weak-Area Repair and PYQ Mock",
    subtitle: "Convert tracked Geography gaps into repair prompts, PYQ traps, and mixed practice.",
    status: "draft",
    topicIds: [],
    sourceLabel: "20-day plan weak-area repair day, draft web module",
    sections: [
      {
        id: "repair-dashboard",
        order: 1,
        kind: "basic",
        title: "Repair Dashboard",
        eyebrow: "Evidence before practice",
        estimatedMinutes: 4,
        body:
          "Day 19 starts with evidence from earlier recall attempts. The student should not reread the whole subject. The repair set is built from missing concepts, low recall score, repeated MCQ traps, map confusion, and weak examples.",
        bullets: [
          "Use known/missing ledgers from module recall.",
          "Use MCQ errors to identify statement traps.",
          "Use map mistakes to identify location and direction gaps.",
          "Use teacher prompts to pick the smallest repair that can unlock practice.",
        ],
        expectedRecallPoints: [
          point(
            "repair-dashboard",
            "evidence-before-practice",
            "Evidence before practice",
            "Recall should say Day 19 repair uses missing concepts, MCQ errors, map mistakes, and teacher prompts.",
            ["missing concepts", "mcq errors", "map mistakes", "teacher prompts", "repair"]
          ),
          point(
            "repair-dashboard",
            "do-not-reread-all",
            "Do not reread all",
            "The answer should say weak-area repair avoids rereading the whole subject.",
            ["do not reread", "whole subject", "weak-area repair"]
          ),
        ],
      },
      {
        id: "root-cause-classification",
        order: 2,
        kind: "advanced",
        title: "Root-Cause Classification",
        eyebrow: "Why the mistake repeated",
        estimatedMinutes: 5,
        body:
          "Every weak area must be classified before practice: knowledge gap, mechanism gap, map confusion, statement-trap error, careless reading, time pressure, or confidence error. Without the root cause, the student keeps repeating the same mistake.",
        bullets: [
          "Knowledge gap: the fact or term is not known.",
          "Mechanism gap: cause-effect is incomplete.",
          "Map confusion: location, neighbour, direction, or scale is wrong.",
          "Trap error: an exception, qualifier, or mixed-region statement is missed.",
        ],
        expectedRecallPoints: [
          point(
            "root-cause-classification",
            "root-cause-types",
            "Root-cause types",
            "Recall should classify weak areas as knowledge, mechanism, map, trap, careless, time, or confidence errors.",
            ["knowledge", "mechanism", "map", "trap", "careless", "time", "confidence"]
          ),
          point(
            "root-cause-classification",
            "root-cause-before-retest",
            "Root cause before retest",
            "The answer should say retesting comes after naming the root cause.",
            ["root cause", "retest", "mistake", "practice"]
          ),
        ],
      },
      {
        id: "pyq-pattern-reading",
        order: 3,
        kind: "pyq",
        title: "PYQ Pattern Reading",
        eyebrow: "Examiner logic",
        estimatedMinutes: 5,
        body:
          "PYQs should be read as pattern evidence. The learner must notice how UPSC frames statement pairs, map locations, exceptions, terms, current links, and mixed true-fact traps. The goal is not to memorise the answer, but to understand how the examiner thinks.",
        bullets: [
          "Mark whether the PYQ tests concept, map, mechanism, current link, or exception.",
          "Rewrite every wrong option as the trap it represents.",
          "Find whether the question punishes overgeneralisation, wrong region, wrong process, or wrong pair.",
          "Build one repair rule from each mistake.",
        ],
        expectedRecallPoints: [
          point(
            "pyq-pattern-reading",
            "pyq-as-pattern",
            "PYQ as pattern",
            "Recall should describe PYQs as evidence of examiner patterns, not just answer memory.",
            ["pyq", "pattern", "examiner", "answer memory"]
          ),
          point(
            "pyq-pattern-reading",
            "wrong-option-trap",
            "Wrong option trap",
            "The answer should rewrite wrong options as traps or repair rules.",
            ["wrong option", "trap", "repair rule"]
          ),
        ],
      },
      {
        id: "mixed-mock-strategy",
        order: 4,
        kind: "mcq",
        title: "Mixed Mock Strategy",
        eyebrow: "Timed practice",
        estimatedMinutes: 5,
        body:
          "The mixed mock should combine physical, India, world, human, political, current, and integration questions. After the mock, the student classifies every wrong answer by root cause and sends only those weak points into final command-day revision.",
        bullets: [
          "Mix topics so the student cannot rely on chapter memory.",
          "Use time pressure but keep post-test analysis slower and precise.",
          "Classify every error by root cause.",
          "Only repeated or high-risk gaps go into Day 20.",
        ],
        expectedRecallPoints: [
          point(
            "mixed-mock-strategy",
            "mixed-topic-mock",
            "Mixed-topic mock",
            "Recall should say the mock mixes physical, India, world, human, political, current, and integration questions.",
            ["physical", "india", "world", "human", "political", "current", "integration", "mock"]
          ),
          point(
            "mixed-mock-strategy",
            "post-test-classification",
            "Post-test classification",
            "The answer should classify every wrong answer by root cause after the mock.",
            ["post-test", "wrong answer", "root cause", "classification"]
          ),
        ],
      },
      {
        id: "day19-traps",
        order: 5,
        kind: "trap",
        title: "Repair-Day Traps",
        eyebrow: "False progress",
        estimatedMinutes: 4,
        body:
          "Day 19 can create false progress if the student practises many questions without repairing the reason for mistakes. Another trap is repairing easy visible gaps while ignoring repeated map or qualifier errors.",
        bullets: [
          "More questions are not useful if the same root cause remains.",
          "Do not confuse familiarity with mastery.",
          "Do not repair only the easiest gap.",
          "Do not move to Day 20 without a short final weak-area list.",
        ],
        expectedRecallPoints: [
          point(
            "day19-traps",
            "false-progress-trap",
            "False progress trap",
            "Recall should reject doing more questions without repairing the root cause.",
            ["false progress", "more questions", "root cause", "repair"]
          ),
          point(
            "day19-traps",
            "familiarity-not-mastery",
            "Familiarity is not mastery",
            "The answer should distinguish familiarity from mastery.",
            ["familiarity", "mastery", "trap"]
          ),
        ],
      },
      {
        id: "day19-handoff",
        order: 6,
        kind: "quick-recall",
        title: "Quick Recall and Command-Day Handoff",
        eyebrow: "Final list",
        estimatedMinutes: 4,
        body:
          "Before Day 20, speak the repair evidence: top weak concepts, root causes, one PYQ pattern, one map repair, and the final revision queue. Day 20 should close the subject, not reopen the whole syllabus.",
        bullets: [
          "Name top weak concepts and root causes.",
          "Name one PYQ pattern and one map repair.",
          "Build the final revision queue.",
          "Carry only high-risk gaps into Day 20.",
        ],
        expectedRecallPoints: [
          point(
            "day19-handoff",
            "final-repair-evidence",
            "Final repair evidence",
            "Recall should include weak concepts, root causes, PYQ pattern, map repair, and final revision queue.",
            ["weak concepts", "root causes", "pyq pattern", "map repair", "revision queue"]
          ),
          point(
            "day19-handoff",
            "day20-close-not-reopen",
            "Day 20 closes the subject",
            "The answer should say Day 20 closes Geography instead of reopening the whole syllabus.",
            ["day 20", "close", "not reopen", "whole syllabus"]
          ),
        ],
      },
    ],
  },
  {
    id: "geography-command-day20",
    subjectSlug: "geography",
    day: 20,
    cluster: "Integration",
    title: "Geography Command Day",
    subtitle: "Close the subject with final recall, map proof, PYQ traps, and revision lock.",
    status: "draft",
    topicIds: [],
    sourceLabel: "20-day plan command day, draft web module",
    sections: [
      {
        id: "command-day-purpose",
        order: 1,
        kind: "basic",
        title: "Command-Day Purpose",
        eyebrow: "Close, don't restart",
        estimatedMinutes: 4,
        body:
          "Day 20 is not a new lesson day. It is the closing command day: final recall, map confidence, PYQ trap awareness, weak-area lock, and future revision schedule. The learner should leave with a compact revision system.",
        bullets: [
          "Close the subject instead of reopening the full syllabus.",
          "Use final recall to identify only high-risk gaps.",
          "Confirm map confidence and PYQ trap awareness.",
          "Lock the next revision dates.",
        ],
        expectedRecallPoints: [
          point(
            "command-day-purpose",
            "close-not-restart",
            "Close, don't restart",
            "Recall should say Day 20 closes Geography rather than restarting the syllabus.",
            ["day 20", "close", "not restart", "syllabus"]
          ),
          point(
            "command-day-purpose",
            "revision-lock-purpose",
            "Revision lock purpose",
            "The answer should mention final recall, map confidence, PYQ traps, weak-area lock, and revision dates.",
            ["final recall", "map confidence", "pyq traps", "weak-area", "revision dates"]
          ),
        ],
      },
      {
        id: "full-syllabus-spoken-recall",
        order: 2,
        kind: "quick-recall",
        title: "Full-Syllabus Spoken Recall",
        eyebrow: "One connected answer",
        estimatedMinutes: 6,
        body:
          "The student should speak Geography as one connected answer: foundation lens, physical systems, India map, economy, transport, world geography, human geography, political geography, current geography, weak areas, and revision plan.",
        bullets: [
          "Start with what-where-why and map relationships.",
          "Move through physical systems and India map systems.",
          "Add economy, transport, world, human, political, and current geography.",
          "End with weak areas and revision plan.",
        ],
        expectedRecallPoints: [
          point(
            "full-syllabus-spoken-recall",
            "full-syllabus-chain",
            "Full syllabus chain",
            "Recall should cover foundation, physical, India, economy, transport, world, human, political, current, weak areas, and revision.",
            ["foundation", "physical", "india", "economy", "transport", "world", "human", "political", "current", "weak", "revision"]
          ),
          point(
            "full-syllabus-spoken-recall",
            "one-connected-answer",
            "One connected answer",
            "The answer should be connected, not a list of separate chapter names.",
            ["connected", "not list", "chapter", "answer"]
          ),
        ],
      },
      {
        id: "map-confidence-audit",
        order: 3,
        kind: "advanced",
        title: "Map Confidence Audit",
        eyebrow: "Can you place it?",
        estimatedMinutes: 5,
        body:
          "The final map audit checks whether the learner can locate and relate major relief units, rivers, coasts, islands, mineral belts, crop belts, corridors, world straits, biomes, borders, disaster regions, and current-affairs locations.",
        bullets: [
          "Place the feature accurately.",
          "Name neighbouring features and direction.",
          "Explain the process or reason.",
          "State one UPSC trap or exception.",
        ],
        expectedRecallPoints: [
          point(
            "map-confidence-audit",
            "map-audit-scope",
            "Map audit scope",
            "Recall should include relief, rivers, coasts, islands, minerals, crops, corridors, straits, biomes, borders, disasters, and current locations.",
            ["relief", "rivers", "coasts", "islands", "minerals", "crops", "corridors", "straits", "biomes", "borders", "disasters", "current"]
          ),
          point(
            "map-confidence-audit",
            "place-relate-explain-trap",
            "Place-relate-explain-trap",
            "The answer should place the feature, name neighbours, explain the process, and state one trap.",
            ["place", "neighbours", "process", "trap"]
          ),
        ],
      },
      {
        id: "pyq-trap-lock",
        order: 4,
        kind: "pyq",
        title: "PYQ Trap Lock",
        eyebrow: "Final examiner check",
        estimatedMinutes: 5,
        body:
          "Command day locks the most common Geography trap types: wrong map pair, wrong cause-effect, overgeneralisation, wrong scale, mixed-region statement, current-affairs without static anchor, and exception ignored.",
        bullets: [
          "Wrong pair: correct terms, false relationship.",
          "Wrong cause-effect: result is right but mechanism is wrong.",
          "Overgeneralisation: a regional pattern is treated as universal.",
          "Current trap: news is recalled without static geography.",
        ],
        expectedRecallPoints: [
          point(
            "pyq-trap-lock",
            "trap-types",
            "Trap types",
            "Recall should name wrong pair, wrong cause-effect, overgeneralisation, wrong scale, mixed-region, current-without-static, and exception traps.",
            ["wrong pair", "cause-effect", "overgeneralisation", "scale", "mixed-region", "current", "static", "exception"]
          ),
          point(
            "pyq-trap-lock",
            "trap-lock-rule",
            "Trap lock rule",
            "The answer should say every final trap needs a repair rule.",
            ["trap", "repair rule", "final"]
          ),
        ],
      },
      {
        id: "revision-lock",
        order: 5,
        kind: "handoff",
        title: "Revision Lock",
        eyebrow: "Future schedule",
        estimatedMinutes: 4,
        body:
          "The final output is a revision lock: what to revisit, when to revisit it, what evidence will prove repair, and which topics are already safe. The student should not leave Day 20 with vague advice.",
        bullets: [
          "Safe concepts are marked as command-ready.",
          "Weak concepts are scheduled with a specific repair prompt.",
          "Each revision has a proof condition.",
          "The next subject should start only after the Geography revision queue is visible.",
        ],
        expectedRecallPoints: [
          point(
            "revision-lock",
            "revision-lock-components",
            "Revision lock components",
            "Recall should include safe concepts, weak concepts, repair prompt, schedule, and proof condition.",
            ["safe concepts", "weak concepts", "repair prompt", "schedule", "proof condition"]
          ),
          point(
            "revision-lock",
            "visible-revision-queue",
            "Visible revision queue",
            "The answer should say the Geography revision queue must be visible before moving to the next subject.",
            ["revision queue", "visible", "next subject"]
          ),
        ],
      },
      {
        id: "day20-final-handoff",
        order: 6,
        kind: "quick-recall",
        title: "Final Geography Handoff",
        eyebrow: "Subject complete",
        estimatedMinutes: 4,
        body:
          "Close Geography by speaking the final command statement: I can explain geography through cause, location, map proof, example, trap, and revision evidence. Then move to the next subject with Geography revision locked.",
        bullets: [
          "Cause: why the pattern exists.",
          "Location: where it is and what surrounds it.",
          "Map proof: the spatial relationship.",
          "Trap and revision evidence: why the answer is exam-ready.",
        ],
        expectedRecallPoints: [
          point(
            "day20-final-handoff",
            "final-command-statement",
            "Final command statement",
            "Recall should include cause, location, map proof, example, trap, and revision evidence.",
            ["cause", "location", "map proof", "example", "trap", "revision evidence"]
          ),
          point(
            "day20-final-handoff",
            "next-subject-handoff",
            "Next subject handoff",
            "The next subject starts with Geography revision locked, not abandoned.",
            ["next subject", "geography revision", "locked"]
          ),
        ],
      },
    ],
  },
];

export function getGeographyContentModule(moduleId?: string | null) {
  if (!moduleId) return null;
  return geographyContentModules.find((module) => module.id === moduleId) ?? null;
}

export function getPrimaryGeographyContentModuleForDay(day: number) {
  return geographyContentModules.find((module) => module.day === day) ?? null;
}

const moduleReadinessWeight: Record<GeographyModuleReadinessStatus, number> = {
  complete: 1,
  partial: 0.5,
  missing: 0,
};

function hasCompleteImageMetadata(section: GeographyContentModuleSection) {
  return Boolean(section.image?.alt && section.image.credit && section.image.license && section.image.sourceUrl);
}

export function getGeographyModuleReadiness(module: GeographyContentModule): GeographyModuleReadinessSummary {
  const sectionsWithRecallPoints = module.sections.filter((section) => section.expectedRecallPoints.length > 0).length;
  const hasImageMetadata = module.sections.some(hasCompleteImageMetadata);
  const hasPyqSection = module.sections.some((section) => section.kind === "pyq");
  const hasMcqSection = module.sections.some((section) => section.kind === "mcq");
  const recallStatus: GeographyModuleReadinessStatus =
    sectionsWithRecallPoints === module.sections.length
      ? "complete"
      : sectionsWithRecallPoints > 0
        ? "partial"
        : "missing";
  const checklist: GeographyModuleReadinessChecklistItem[] = [
    {
      id: "approval",
      label: "Teacher approval",
      status:
        module.status === "approved"
          ? "complete"
          : module.status === "draft"
            ? "partial"
            : "missing",
      detail:
        module.status === "approved"
          ? "Marked approved for classroom use."
          : module.status === "draft"
            ? "Draft exists but still needs teacher sign-off."
            : "Sample layout exists but cannot be treated as final content.",
      nextAction: "Review copy, examples, traps, handoff, and recall points before approval.",
    },
    {
      id: "media",
      label: "Licensed media",
      status: hasImageMetadata ? "complete" : "missing",
      detail: hasImageMetadata
        ? "At least one section has alt text, credit, license, and source URL."
        : "No credited image or diagram metadata is attached yet.",
      nextAction: "Add a public-domain or properly licensed image/diagram with full metadata.",
    },
    {
      id: "pyq",
      label: "PYQ pattern",
      status: hasPyqSection ? "complete" : "missing",
      detail: hasPyqSection
        ? "A PYQ-style pattern section is present."
        : "No dedicated PYQ pattern section is present.",
      nextAction: "Add a PYQ card that explains examiner pattern, trap type, and repair rule.",
    },
    {
      id: "mcq",
      label: "MCQ repair",
      status: hasMcqSection ? "complete" : "missing",
      detail: hasMcqSection
        ? "A module-specific MCQ repair section is present."
        : "No module-specific MCQ repair section is present.",
      nextAction: "Add a short MCQ drill tied to the module's expected recall points.",
    },
    {
      id: "recall-points",
      label: "Recall points",
      status: recallStatus,
      detail: `${sectionsWithRecallPoints}/${module.sections.length} sections have expected recall points.`,
      nextAction: "Every slide needs at least one expected recall point before final approval.",
    },
  ];
  const complete = checklist.filter((item) => item.status === "complete").length;
  const partial = checklist.filter((item) => item.status === "partial").length;
  const missing = checklist.filter((item) => item.status === "missing").length;
  const score = Math.round(
    (checklist.reduce((sum, item) => sum + moduleReadinessWeight[item.status], 0) / checklist.length) * 100
  );

  return {
    moduleId: module.id,
    day: module.day,
    title: module.title,
    status: missing === 0 && partial === 0 ? "complete" : complete > 0 || partial > 0 ? "partial" : "missing",
    score,
    complete,
    partial,
    missing,
    sectionCount: module.sections.length,
    checklist,
    missingActions: checklist.filter((item) => item.status !== "complete").map((item) => item.nextAction),
  };
}

export const geographyModuleReadinessSummaries = geographyContentModules.map(getGeographyModuleReadiness);

export function getGeographyModuleSection(module: GeographyContentModule, sectionId?: string | null) {
  if (!sectionId) return module.sections[0];
  return module.sections.find((section) => section.id === sectionId) ?? module.sections[0];
}

export function getCumulativeGeographyModuleSections(module: GeographyContentModule, sectionId: string) {
  const targetIndex = Math.max(
    0,
    module.sections.findIndex((section) => section.id === sectionId)
  );
  return module.sections.slice(0, targetIndex + 1);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function keywordMatches(answer: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;
  return answer.includes(normalizedKeyword);
}

function evidenceFor(answer: string, point: GeographyExpectedRecallPoint) {
  const normalizedAnswer = normalizeText(answer);
  const keyword = point.keywords.find((item) => keywordMatches(normalizedAnswer, item));
  if (!keyword) return "Matched from the submitted recall.";
  return `Student mentioned "${keyword}".`;
}

export function assessGeographyModuleRecall(
  module: GeographyContentModule,
  sectionId: string,
  answer: string,
  previousInitialKnownPercent?: number
): GeographyModuleRecallAssessment {
  const cumulativeSections = getCumulativeGeographyModuleSections(module, sectionId);
  const cumulativeSectionIds = cumulativeSections.map((section) => section.id);
  const expectedPoints = cumulativeSections.flatMap((section) => section.expectedRecallPoints);
  const normalizedAnswer = normalizeText(answer);
  const knownConcepts = expectedPoints
    .filter((point) => point.keywords.some((keyword) => keywordMatches(normalizedAnswer, keyword)))
    .map<GeographyKnownConcept>((point) => ({
      id: point.id,
      label: point.label,
      detail: point.detail,
      sectionId: point.sectionId,
      evidence: evidenceFor(answer, point),
    }));
  const missingConcepts = expectedPoints
    .filter((point) => !knownConcepts.some((known) => known.id === point.id))
    .map<GeographyMissingConcept>((point) => ({
      id: point.id,
      label: point.label,
      detail: point.detail,
      sectionId: point.sectionId,
      repairPrompt: `Reopen ${module.sections.find((section) => section.id === point.sectionId)?.title ?? "this section"} and speak: ${point.detail}`,
    }));
  const currentMasteryPercent = expectedPoints.length
    ? Math.round((knownConcepts.length / expectedPoints.length) * 100)
    : 0;
  const initialKnownPercent =
    typeof previousInitialKnownPercent === "number"
      ? previousInitialKnownPercent
      : currentMasteryPercent;
  const remainingGapPercent = Math.max(0, 100 - currentMasteryPercent);
  const fillableGap = Math.max(100 - initialKnownPercent, 1);
  const gapFilledPercent = Math.max(
    0,
    Math.min(100, Math.round(((currentMasteryPercent - initialKnownPercent) / fillableGap) * 100))
  );
  const targetIndex = module.sections.findIndex((section) => section.id === sectionId);
  const nextSection = module.sections[targetIndex + 1];
  const cleared = currentMasteryPercent >= 95;

  return {
    moduleId: module.id,
    sectionId,
    cumulativeSectionIds,
    knownConcepts,
    missingConcepts,
    initialKnownPercent,
    currentMasteryPercent,
    gapFilledPercent,
    remainingGapPercent,
    nextUnlockedSectionId: cleared ? nextSection?.id : sectionId,
    allSectionsCleared: cleared && !nextSection,
    summary: cleared
      ? `Cumulative recall cleared for ${cumulativeSections.length} section${cumulativeSections.length === 1 ? "" : "s"}.`
      : `${missingConcepts.length} concept${missingConcepts.length === 1 ? "" : "s"} still missing across the cumulative section set.`,
    repairPrompt:
      missingConcepts[0]?.repairPrompt ??
      (nextSection
        ? `Open ${nextSection.title} and keep recalling all previous sections.`
        : "Move to fresh MCQs and keep the full cluster connected."),
  };
}

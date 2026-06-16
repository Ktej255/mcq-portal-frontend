import type { OptionalTopic } from "./geographyOptionalTypes";

/**
 * UPSC Geography Optional — Paper I, Section A (Physical Geography)
 * Topic 1: GEOMORPHOLOGY
 *
 * Content is written in a personal-notes register: an aspirant reading this
 * once should be able to reconstruct the concept and write an answer in the
 * vocabulary UPSC rewards. Diagrams are rendered as hand-drawn SVG.
 *
 * Syllabus mapping and PYQ trends grounded in the official UPSC Geography
 * Optional Paper I syllabus and 25-year question patterns.
 */
export const geomorphology: OptionalTopic = {
  slug: "geomorphology",
  title: "Geomorphology",
  paper: "Paper I",
  section: "Section A — Physical Geography",
  order: 1,
  status: "ready",
  summary:
    "How endogenetic and exogenetic forces sculpt the crust — from plate tectonics and isostasy to slope, cycle and channel theories, ending in applied geomorphology.",
  readMinutes: 38,
  syllabus: {
    official: [
      "Factors controlling landform development; endogenetic and exogenetic forces.",
      "Origin and evolution of the earth's crust.",
      "Fundamentals of geomagnetism; physical conditions of the earth's interior.",
      "Geosynclines; continental drift; isostasy; plate tectonics.",
      "Recent views on mountain building; vulcanicity; earthquakes and tsunamis.",
      "Concepts of geomorphic cycles and landscape development; denudation chronology.",
      "Channel morphology; erosion surfaces; slope development.",
      "Applied geomorphology: geohydrology, economic geology and environment.",
    ],
    trendSays: [
      {
        theme: "Plate tectonics & recent views on mountain building",
        insight:
          "The single most-asked head. Questions demand that you link plate theory to a real orogen (esp. the Himalaya) and critique it against older geosyncline/continental-drift ideas.",
        frequency: "Very High",
      },
      {
        theme: "Applied geomorphology",
        insight:
          "Fastest-rising area. Geohydrology, landslides, watershed and morphometric analysis, geomorphology in hazard and resource management — usually a 15/20-marker.",
        frequency: "High",
      },
      {
        theme: "Slope & cycle theories (Davis–Penck–King)",
        insight:
          "Recurring comparative/critique question. Examiner wants the model, its climatic assumption, and a named critic — not just description.",
        frequency: "High",
      },
      {
        theme: "Isostasy (Airy vs Pratt) & earth's interior",
        insight:
          "Stable short-note / diagram question. Reward comes from the column diagram plus a modern qualifier (isostatic rebound, gravity anomalies).",
        frequency: "Medium",
      },
      {
        theme: "Channel morphology & denudation chronology",
        insight:
          "Increasingly asked through quantitative geomorphology — hydraulic geometry, drainage morphometry, polycyclic erosion surfaces.",
        frequency: "Medium",
      },
      {
        theme: "Vulcanicity, earthquakes & tsunamis",
        insight:
          "Reliable, often current-affairs linked (a recent quake/eruption). Tie distribution to plate boundaries and add a mitigation line.",
        frequency: "Medium",
      },
    ],
    hiddenTopics: [
      {
        topic: "Drainage morphometry & Horton–Strahler laws",
        why: "Never named in the syllabus, but 'channel morphology' and 'applied geomorphology' answers collapse without bifurcation ratio, stream order, drainage density and the hypsometric integral.",
      },
      {
        topic: "Fluvial process mechanics — Hjulström & Sundborg curves",
        why: "Required to explain erosion–transport–deposition thresholds behind channel form and graded profiles.",
      },
      {
        topic: "Etchplanation & pediplanation (King, Büdel)",
        why: "Tropical/semi-arid landscape evolution is repeatedly asked under 'landscape development' but the model names are assumed knowledge.",
      },
      {
        topic: "Tectonic geomorphology / neotectonics",
        why: "Mountain-building and active-margin answers now expect terraces, knickpoints and uplift evidence — modern field geomorphology not in the printed line.",
      },
      {
        topic: "Mantle plumes & hotspots",
        why: "Needed to explain intra-plate vulcanicity (Hawaii, Deccan) that simple plate-boundary logic cannot.",
      },
      {
        topic: "Geomorphic hazards & GIS/remote sensing",
        why: "The 'environment' tail of applied geomorphology is graded higher when you bring landslide-susceptibility mapping, DEM and watershed tools.",
      },
    ],
  },
  subtopics: [
    {
      id: "factors-endo-exo",
      title: "Factors controlling landform development — endogenetic & exogenetic forces",
      syllabusTag: "Factors controlling landform development",
      hook: "Master this and every later topic slots in: a landform is always the net result of forces from inside vs forces from outside.",
      blocks: [
        {
          type: "para",
          text: "A landform is the visible balance-sheet of two opposing budgets. Endogenetic (internal) forces, powered by the earth's internal heat and rotation, build relief — they uplift, fold, fault and erupt. Exogenetic (external) forces, powered by solar energy and gravity through the agents of weathering, rivers, glaciers, wind and waves, wear that relief down. The actual surface is the instantaneous resultant of this construction-versus-destruction.",
        },
        {
          type: "points",
          heading: "Endogenetic (constructive) forces",
          items: [
            "Diastrophism — slow movements: epeirogeny (continent-scale upwarp/downwarp) and orogeny (mountain-building folding & faulting).",
            "Sudden movements — earthquakes and volcanism that displace the surface abruptly.",
            "Source of energy: geothermal heat (radioactive decay, primordial heat), mantle convection and plate motion.",
          ],
        },
        {
          type: "points",
          heading: "Exogenetic (destructive / gradational) forces",
          items: [
            "Weathering — in-situ breakdown (physical, chemical, biological) that prepares material.",
            "Mass wasting — gravity-driven downslope transfer (creep, slide, flow, fall).",
            "Erosion–transport–deposition by running water, glaciers, wind, groundwater and waves.",
            "Net effect: gradation = degradation (wearing down highs) + aggradation (filling up lows).",
          ],
        },
        {
          type: "diagram",
          id: "endo-exo-balance",
          caption: "The relief see-saw: internal forces build up, external forces wear down; the surface is their balance.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Concepts that win marks",
          items: [
            "Magnitude–frequency concept: a few high-magnitude events (a great flood) can do more geomorphic work than countless small ones.",
            "Dynamic equilibrium (Hack): slope and form adjust so that erosion is roughly uniform — the landscape is in balance, not marching to a single end-form.",
            "Polygenetic landforms: most real landscapes carry the imprint of more than one process/climate over time.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "endogenetic / exogenetic, diastrophism, epeirogeny, orogeny",
            "gradation, degradation, aggradation, denudation",
            "magnitude–frequency, dynamic equilibrium, polygenetic, geomorphic agent",
          ],
        },
        {
          type: "callout",
          tone: "trap",
          title: "Common traps",
          items: [
            "Do not equate 'weathering' with 'erosion' — weathering is in-situ; erosion involves removal/transport.",
            "Orogeny ≠ epeirogeny: localized & deforming vs broad & vertical.",
          ],
        },
      ],
      examKeywords: [
        "endogenetic forces",
        "exogenetic forces",
        "diastrophism",
        "gradation",
        "dynamic equilibrium",
        "magnitude and frequency",
      ],
      answerLanguage: [
        "\"A landform is the resultant of the antagonistic interplay between endogenetic and exogenetic processes.\"",
        "\"Gradational agents operate to attain a state of dynamic equilibrium rather than a fixed end-form.\"",
      ],
      pyq: [
        { q: "Examine the role of endogenetic and exogenetic forces in shaping the earth's surface." },
        { q: "Discuss the concept of magnitude and frequency of geomorphic events with examples." },
      ],
    },
    {
      id: "plate-tectonics-mountain-building",
      title: "Plate tectonics, continental drift & recent views on mountain building",
      syllabusTag: "Geosynclines; continental drift; plate tectonics; recent views on mountain building",
      hook: "This is the highest-yield head in the paper. If you can narrate the journey from geosyncline → drift → plate tectonics and apply it to the Himalaya, you can attempt 20–25 marks confidently.",
      blocks: [
        {
          type: "para",
          text: "The theory of mountain-building evolved in three stages. The classical GEOSYNCLINE model (Hall, Dana; later Kober's orogen, Holmes' convection) saw mountains rising from sediment-filled elongated troughs squeezed between rigid forelands. Wegener's CONTINENTAL DRIFT (1912) added horizontal mobility — one supercontinent, Pangaea, fragmenting — but failed for want of a force. PLATE TECTONICS (1960s) supplied that force and unified everything.",
        },
        {
          type: "points",
          heading: "Plate tectonics — the core logic",
          items: [
            "The lithosphere is broken into rigid plates riding on the plastic asthenosphere.",
            "Driving mechanism: mantle convection, ridge-push and slab-pull; sea-floor spreading (Hess) creates new crust at mid-ocean ridges.",
            "Evidence: palaeomagnetism & magnetic stripe symmetry (Vine–Matthews), age of ocean floor increasing away from ridges, distribution of earthquakes & volcanoes along boundaries.",
          ],
        },
        {
          type: "diagram",
          id: "plate-boundaries",
          caption: "Three plate boundaries — divergent (ridge), convergent (subduction/collision) and transform (conservative).",
        },
        {
          type: "points",
          heading: "Three boundary types → three landform families",
          items: [
            "Divergent (constructive): mid-ocean ridges, rift valleys, basaltic vulcanicity (E. African Rift, Mid-Atlantic Ridge).",
            "Convergent (destructive): ocean–continent → fold mountains + volcanic arc + trench (Andes); ocean–ocean → island arcs (Japan); continent–continent → collision orogen (Himalaya).",
            "Transform (conservative): crust neither made nor destroyed; shallow but severe earthquakes (San Andreas).",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Apply it: the Himalaya (the examiner's favourite)",
          items: [
            "Indian plate drifted north, the intervening Tethys Sea closed, its sediments were compressed.",
            "Continent–continent collision with the Eurasian plate (~50 Ma) crumpled the sediments into the nappe-and-thrust Himalaya.",
            "Ongoing convergence (~5 cm/yr) → continued uplift, frequent earthquakes (MBT, MCT thrusts), and youthful relief.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Why plate tectonics is superior (write this as critique)",
          items: [
            "Explains the global distribution of mountains, volcanoes and quakes in one framework.",
            "Supplies the force (mantle convection) that drift lacked and that geosyncline ignored.",
            "Limitations: weaker on intra-plate features — needs mantle plumes/hotspots (Deccan, Hawaii) and neotectonics to complete the picture.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "lithosphere / asthenosphere, sea-floor spreading, palaeomagnetism, Vine–Matthews",
            "ridge-push, slab-pull, mantle convection, subduction, obduction",
            "orogen, nappe, thrust (MCT, MBT), suture zone, Tethys",
          ],
        },
      ],
      examKeywords: [
        "plate tectonics",
        "sea-floor spreading",
        "palaeomagnetism",
        "subduction",
        "geosyncline",
        "continental drift",
        "Tethys",
        "orogeny",
      ],
      answerLanguage: [
        "\"Plate tectonics is the grand unifying theory of geomorphology, subsuming continental drift and sea-floor spreading.\"",
        "\"The Himalaya is a textbook continent–continent collision orogen formed by the closure of the Tethys.\"",
      ],
      pyq: [
        { year: "2019", q: "Bring out the role of plate tectonics in the evolution of present-day continents and ocean basins." },
        { q: "Critically examine the geosynclinal theory of mountain building in the light of plate tectonics." },
        { q: "Explain the origin of the Himalaya with reference to plate tectonics." },
      ],
    },
    {
      id: "isostasy",
      title: "Isostasy — Airy vs Pratt and the modern view",
      syllabusTag: "Isostasy",
      hook: "A clean diagram + one modern qualifier (rebound/anomaly) is a guaranteed short-note score.",
      blocks: [
        {
          type: "para",
          text: "Isostasy (Greek: 'equal standing') is the gravitational balance by which the lighter crust 'floats' on the denser, plastic mantle — like blocks of wood on water. It explains why high mountains have deep, low-density roots and why the crust rises (rebounds) when a load such as an ice sheet is removed.",
        },
        {
          type: "diagram",
          id: "isostasy-airy-pratt",
          caption: "Airy: same density, different root depth. Pratt: same base, different density.",
        },
        {
          type: "points",
          heading: "Two classical models",
          items: [
            "Airy: uniform crustal density; higher mountains are supported by deeper roots (root-and-antiroot). Like icebergs of equal ice but different heights.",
            "Pratt: a common level of compensation; columns differ in density (higher = less dense). No deep roots.",
            "Modern synthesis: reality is a mix — broad regional compensation (flexural isostasy) where the rigid lithosphere bends under loads, revealed by gravity anomalies.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Evidence & application",
          items: [
            "Post-glacial isostatic rebound: Scandinavia and Hudson Bay are still rising after ice melt.",
            "Negative gravity anomaly over the Himalaya → confirms a deep low-density root (Airy-type).",
            "Reservoir loading and delta sediment loading cause local subsidence — a geohydrology link.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "isostatic equilibrium, root–antiroot, level/depth of compensation",
            "isostatic rebound, flexural isostasy, gravity anomaly (Bouguer)",
          ],
        },
      ],
      examKeywords: ["isostasy", "Airy", "Pratt", "isostatic rebound", "gravity anomaly", "compensation"],
      answerLanguage: [
        "\"Isostasy is the state of buoyant equilibrium between the crust and the denser substratum.\"",
        "\"The negative gravity anomaly beneath the Himalaya validates Airy's root concept.\"",
      ],
      pyq: [
        { q: "Compare and contrast the views of Airy and Pratt on isostasy." },
        { q: "Discuss isostatic adjustment with suitable examples." },
      ],
    },
    {
      id: "geomorphic-cycle-slope",
      title: "Geomorphic cycles, landscape development & slope theories",
      syllabusTag: "Concepts of geomorphic cycles and landscape development; slope development",
      hook: "The comparative theory question (Davis vs Penck vs King) is a recurring 15-marker — own the assumptions and the named critics.",
      blocks: [
        {
          type: "para",
          text: "How does a landscape evolve through time? Three schools answer differently, and the difference lies in their assumptions about uplift and slope retreat.",
        },
        {
          type: "points",
          heading: "Davis — the 'Geographical Cycle' (1899)",
          items: [
            "Triad: Structure, Process and Stage (Time). 'Landscape is a function of structure, process and time.'",
            "Sequence: rapid uplift → then long stillstand → river valleys deepen (youth), widen (maturity), and finally a near-level peneplain (old age) with monadnocks.",
            "Slopes decline (flatten) over time. Climatic assumption: humid temperate.",
          ],
        },
        {
          type: "points",
          heading: "Penck — slope replacement (1924)",
          items: [
            "Rejected Davis' 'uplift-then-stillstand'; argued uplift and erosion go together.",
            "Form reflects the ratio of uplift rate to erosion rate (waxing, uniform, waning development).",
            "Slopes retreat parallel to themselves, leaving a debris-covered piedmontflache.",
          ],
        },
        {
          type: "points",
          heading: "King — pediplanation (1953)",
          items: [
            "For semi-arid/savanna climates: slopes retreat parallel, leaving coalescing pediments → a pediplain.",
            "Backwearing (not Davisian downwearing) is the dominant mode.",
            "Büdel's etchplanation adds the tropical double-surface (deep weathering + stripping) model.",
          ],
        },
        {
          type: "diagram",
          id: "davis-penck-cycle",
          caption: "Davis (slope decline → peneplain) vs King (parallel retreat → pediplain).",
        },
        {
          type: "diagram",
          id: "slope-elements",
          caption: "The four-element hillslope: waxing crest, free face, debris (constant) slope, waning pediment.",
        },
        {
          type: "callout",
          tone: "key",
          title: "How to frame the critique",
          items: [
            "Davis is teleological (assumes a fixed end-point) and climate-bound; criticised by Hack's dynamic-equilibrium model.",
            "Penck was long misread (the German 'Aufsteigende Entwicklung'); but parallel retreat is well-supported in arid lands.",
            "No single model is universal — landscape development is polygenetic and polycyclic.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "peneplain, monadnock, pediplain, pediment, inselberg",
            "downwearing vs backwearing, slope decline vs parallel retreat",
            "etchplanation, denudation chronology, polycyclic relief, erosion surface",
          ],
        },
      ],
      examKeywords: [
        "Davisian cycle",
        "peneplain",
        "Penck",
        "pediplanation",
        "King",
        "slope retreat",
        "etchplanation",
        "denudation chronology",
      ],
      answerLanguage: [
        "\"Davis conceived landscape evolution as a time-bound cycle culminating in a peneplain.\"",
        "\"King's pediplanation, driven by parallel scarp retreat, better explains tropical and semi-arid landscapes.\"",
      ],
      pyq: [
        { q: "Critically examine the Davisian concept of the geographical cycle of erosion." },
        { q: "Compare the models of slope development proposed by Davis and Penck." },
        { q: "Explain the process of pediplanation in semi-arid regions." },
      ],
    },
    {
      id: "channel-morphology",
      title: "Channel morphology & denudation chronology",
      syllabusTag: "Channel morphology; erosion surfaces",
      hook: "The quantitative-geomorphology entry point — bring morphometry and the graded profile and you stand out from textbook-only answers.",
      blocks: [
        {
          type: "para",
          text: "Channel morphology studies the form of river channels — their cross-section, long profile and planform — and how they self-adjust toward a graded condition where slope is just sufficient to transport the imposed load (Mackin's 'graded river').",
        },
        {
          type: "points",
          heading: "Channel planforms",
          items: [
            "Straight — rare and short; controlled by structure.",
            "Meandering — single sinuous channel; alternating pools and riffles, point bars and cut banks.",
            "Braided — multiple shifting channels separated by bars; high, variable sediment load (Himalayan rivers).",
            "Anastomosing — stable multiple channels on low-gradient floodplains.",
          ],
        },
        {
          type: "diagram",
          id: "channel-patterns",
          caption: "Straight, meandering, braided and anastomosing channels along a sediment/energy gradient.",
        },
        {
          type: "callout",
          tone: "key",
          title: "The hidden quantitative layer (write this to top the answer)",
          items: [
            "Hydraulic geometry (Leopold & Maddock): width, depth and velocity vary as power functions of discharge.",
            "Drainage morphometry (Horton–Strahler): stream order, bifurcation ratio, drainage density, hypsometric integral.",
            "Hjulström curve: thresholds of erosion–transport–deposition by velocity and grain size.",
          ],
        },
        {
          type: "para",
          text: "Denudation chronology reconstructs a region's erosional history by reading erosion surfaces — remnants of former base-levels preserved as accordant summits, terraces and planation surfaces. Multiple surfaces at different heights signal a polycyclic relief produced by repeated rejuvenation (uplift or base-level fall), shown by knickpoints, incised meanders and paired river terraces.",
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "graded profile, base level, knickpoint, rejuvenation",
            "hydraulic geometry, bifurcation ratio, drainage density, sinuosity",
            "erosion surface, polycyclic relief, river terrace, incised meander",
          ],
        },
      ],
      examKeywords: [
        "channel morphology",
        "graded profile",
        "meandering",
        "braided",
        "drainage morphometry",
        "knickpoint",
        "denudation chronology",
        "erosion surface",
      ],
      answerLanguage: [
        "\"A graded river adjusts its slope to just transport the load supplied to it (Mackin).\"",
        "\"Multiple accordant erosion surfaces indicate a polycyclic relief shaped by repeated rejuvenation.\"",
      ],
      pyq: [
        { q: "Discuss the concept of channel morphology and the factors controlling channel patterns." },
        { q: "What do you understand by denudation chronology? Explain with reference to erosion surfaces." },
      ],
    },
    {
      id: "applied-geomorphology",
      title: "Applied Geomorphology — geohydrology, economic geology & environment",
      syllabusTag: "Applied geomorphology: geohydrology, economic geology and environment",
      hook: "The fastest-rising, most under-prepared head — strong here and you separate yourself in the merit list.",
      blocks: [
        {
          type: "para",
          text: "Applied geomorphology puts landform knowledge to work for human use — water, minerals, hazards and the environment. UPSC increasingly frames questions here because it tests whether you can convert physical theory into management.",
        },
        {
          type: "points",
          heading: "Geohydrology (groundwater & landform)",
          items: [
            "Aquifer geometry follows landform: alluvial fans and buried channels are prime aquifers; hard-rock terrain stores water only in weathered/fractured zones.",
            "Watershed & morphometric analysis guides recharge, check-dams and drainage planning.",
            "Springs, base-flow and the water table are governed by slope, lithology and structure.",
          ],
        },
        {
          type: "points",
          heading: "Economic geology (geomorphology of resources)",
          items: [
            "Placer deposits (gold, tin, monazite) concentrate in river bars and beach terraces.",
            "Laterite/bauxite forms on tropical planation surfaces; weathering profiles host secondary enrichment of ores.",
            "Landform mapping aids exploration, quarry siting and reservoir/dam foundations.",
          ],
        },
        {
          type: "points",
          heading: "Environment & hazards",
          items: [
            "Landslide susceptibility mapping in young fold mountains (Himalaya, Western Ghats).",
            "Coastal geomorphology for erosion, sea-level rise and shoreline management.",
            "Fluvial geomorphology for flood-plain zoning, river training and sediment management.",
            "GIS, DEM and remote sensing make all of the above operational.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Indian examples to deploy",
          items: [
            "Kerala/Uttarakhand landslides — slope instability on weathered, deforested terrain.",
            "Kosi 'sorrow of Bihar' — channel shifting on a megafan; an applied channel-morphology case.",
            "Rajasthan/Deccan watershed programmes — morphometry-guided recharge.",
          ],
        },
        {
          type: "callout",
          tone: "link",
          title: "Links to grab extra marks",
          items: [
            "Tie to Disaster Management (GS-III) and Environment for cross-paper synergy.",
            "Close with sustainability: geomorphology as the base layer of land-use and watershed planning.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "geohydrology, aquifer, watershed, morphometric analysis",
            "placer deposit, laterite, weathering profile",
            "landslide susceptibility, DEM, terrain analysis, geomorphic hazard",
          ],
        },
      ],
      examKeywords: [
        "applied geomorphology",
        "geohydrology",
        "watershed",
        "morphometric analysis",
        "landslide susceptibility",
        "economic geology",
        "placer deposit",
      ],
      answerLanguage: [
        "\"Applied geomorphology operationalises landform science for water, mineral and hazard management.\"",
        "\"Morphometric watershed analysis converts drainage form into actionable recharge and conservation planning.\"",
      ],
      pyq: [
        { year: "2018", q: "Discuss the relevance of applied geomorphology in watershed management." },
        { q: "Explain the role of geomorphology in groundwater exploration and economic geology." },
      ],
    },
  ],
  trendAnalysis: {
    overview:
      "Geomorphology is the opening and single most heavily-weighted unit of Paper I, Section A. In a typical Paper I it yields 35–55 marks: at least one short note (~10 marks) in the compulsory Section A question, plus one analytical 15- or 20-mark question — and in many years two long questions. It is effectively un-skippable.",
    marksPattern:
      "Two predictable slots: (1) a 10-mark short note testing a single concept (isostasy, denudation chronology, graded profile, dynamic equilibrium); and (2) a 15–20 mark analytical/comparative question demanding a model, a critique, a diagram and an applied or Indian example. Diagram-bearing answers consistently out-score prose-only ones.",
    evolution: [
      {
        period: "Up to ~2012 (descriptive era)",
        shift:
          "Largely definitional — 'describe the cycle of erosion', 'explain isostasy', 'describe karst landforms'. Reproduction of standard models sufficed.",
      },
      {
        period: "2013–2018 (analytical/comparative turn)",
        shift:
          "Shift to 'critically examine' and 'compare' — Davis vs Penck, geosyncline vs plate tectonics, Airy vs Pratt. Examiner began rewarding a named critic and a reasoned judgement, not just the model.",
      },
      {
        period: "2019–2025 (applied, quantitative & contemporary)",
        shift:
          "Decisive move to applied geomorphology (geohydrology, hazards, watershed), quantitative/tectonic geomorphology (morphometry, neotectonics) and human-induced change. Plate tectonics is now expected to be applied to a real orogen, and answers must close with management/relevance.",
      },
    ],
    questionFormats: [
      "Critically examine / Critically evaluate (a model or theory — expects a verdict)",
      "Compare and contrast (Davis–Penck–King; Airy–Pratt; geosyncline–plate tectonics)",
      "Bring out / Account for (cause-and-process explanation)",
      "Discuss the relevance/application of (applied geomorphology, geohydrology)",
      "Short notes (~10 marks, single concept, diagram expected)",
      "Diagram-based / sketch-and-explain (profiles, boundaries, column diagrams)",
    ],
    themeTable: [
      {
        theme: "Plate tectonics, continental drift & mountain building",
        frequency: "Very High",
        marksBand: "15–20",
        years: ["2013", "2015", "2017", "2019", "2022"],
        note: "Almost every cycle. Increasingly applied to the Himalaya/an orogen and set against geosyncline & drift as critique.",
      },
      {
        theme: "Cycle of erosion & slope development (Davis/Penck/King)",
        frequency: "High",
        marksBand: "15–20",
        years: ["2014", "2016", "2018", "2021"],
        note: "Comparative/critique format. A named critic (Hack) and the climatic assumption lift the answer.",
      },
      {
        theme: "Applied geomorphology (geohydrology, hazards, watershed)",
        frequency: "High",
        marksBand: "15–20",
        years: ["2018", "2020", "2021", "2023"],
        note: "The fastest-rising head; most under-prepared, so a strong differentiator.",
      },
      {
        theme: "Isostasy (Airy vs Pratt) & earth's interior",
        frequency: "Medium",
        marksBand: "10–15",
        years: ["2015", "2019", "2022"],
        note: "Stable short note. Column diagram + a modern qualifier (rebound, gravity anomaly) is enough.",
      },
      {
        theme: "Channel morphology, fluvial & denudation chronology",
        frequency: "Medium",
        marksBand: "10–20",
        years: ["2016", "2020", "2023"],
        note: "Now asked through quantitative/fluvial geomorphology — morphometry, graded profile, erosion surfaces.",
      },
      {
        theme: "Geomorphic processes, magnitude–frequency, dynamic equilibrium",
        frequency: "Medium",
        marksBand: "10–15",
        years: ["2017", "2020"],
        note: "Conceptual short notes; Hack's dynamic equilibrium and the magnitude–frequency idea recur.",
      },
      {
        theme: "Vulcanicity, earthquakes & tsunamis",
        frequency: "Medium",
        marksBand: "10–15",
        years: ["2014", "2018", "2021"],
        note: "Often current-affairs linked; tie distribution to plate boundaries and add a mitigation line.",
      },
    ],
    examinerExpectations: [
      "A clean, labelled diagram for any process/landform/model question.",
      "Named theorists and their critics (Davis–Hack, Penck, King, Wegener, Holmes, Hess, Airy, Pratt).",
      "A real, preferably Indian, example (Himalaya, Kosi megafan, Western Ghats landslides).",
      "Analysis and a verdict in 'critically examine' answers — not pure description.",
      "A closing applied/relevance line (management, hazard, resource) in higher-mark answers.",
    ],
    commonPitfalls: [
      "Describing a model without critiquing it or naming a critic.",
      "Omitting the diagram on a process/landform question.",
      "Treating plate tectonics theoretically without applying it to an actual orogen.",
      "Ignoring the applied dimension that newer papers explicitly reward.",
      "Confusing orogeny with epeirogeny, or weathering with erosion.",
    ],
    predictedFocus: [
      "Applied geomorphology & geohydrology (watershed, groundwater, landslide-susceptibility).",
      "Tectonic geomorphology / neotectonics and plate tectonics applied to the Himalaya.",
      "Channel morphology & drainage morphometry (quantitative geomorphology).",
      "Comparative slope/landscape-evolution models with a critique.",
      "Human-induced geomorphic change and geomorphic hazards (climate-linked).",
    ],
  },
  pyqBank: [
    // Plate tectonics, drift & mountain building
    { year: "2019", marks: 20, theme: "Plate tectonics & mountain building", q: "Bring out the role of plate tectonics in the evolution of the present-day continents and ocean basins." },
    { theme: "Plate tectonics & mountain building", q: "Examine the relevance of the geosynclinal theory of mountain building in the light of plate tectonics." },
    { theme: "Plate tectonics & mountain building", q: "Discuss the salient features of plate tectonics and explain the origin of the Himalaya in its light." },
    { theme: "Plate tectonics & mountain building", q: "Explain how plate tectonics accounts for the global distribution of earthquakes and volcanoes." },
    { theme: "Plate tectonics & mountain building", q: "Critically evaluate the theory of continental drift and the evidences advanced in its support." },
    // Isostasy & interior
    { theme: "Isostasy & earth's interior", q: "Compare and contrast the views of Airy and Pratt on isostasy." },
    { theme: "Isostasy & earth's interior", q: "Discuss the concept of isostasy and the idea of isostatic adjustment with examples." },
    // Cycle of erosion & slope
    { theme: "Geomorphic cycle & slope development", q: "Critically examine the Davisian concept of the geographical cycle of erosion." },
    { theme: "Geomorphic cycle & slope development", q: "Compare the models of landscape development proposed by Davis and Penck." },
    { theme: "Geomorphic cycle & slope development", q: "Explain the process of pediplanation as proposed by L. C. King in semi-arid regions." },
    { theme: "Geomorphic cycle & slope development", q: "Discuss the elements of a hillslope and the processes of slope development." },
    // Channel morphology, fluvial, denudation chronology
    { theme: "Channel morphology & denudation chronology", q: "Discuss the concept of channel morphology and the factors controlling channel patterns." },
    { theme: "Channel morphology & denudation chronology", q: "What do you understand by denudation chronology? Explain with reference to erosion surfaces." },
    { theme: "Channel morphology & denudation chronology", q: "Explain the concept of the graded river and the development of a graded profile." },
    // Processes & concepts
    { theme: "Geomorphic processes & concepts", q: "Discuss the role of magnitude and frequency of geomorphic events in landform development." },
    { theme: "Geomorphic processes & concepts", q: "Examine the concept of dynamic equilibrium in landform development (Hack)." },
    { theme: "Geomorphic processes & concepts", q: "Distinguish between endogenetic and exogenetic forces in shaping the earth's surface." },
    // Vulcanicity & earthquakes
    { theme: "Vulcanicity, earthquakes & tsunamis", q: "Account for the global distribution of volcanoes in relation to plate boundaries." },
    { theme: "Vulcanicity, earthquakes & tsunamis", q: "Examine the causes and distribution of earthquakes and their relationship with plate margins." },
    // Applied geomorphology
    { year: "2018", marks: 15, theme: "Applied geomorphology", q: "Discuss the relevance of applied geomorphology in watershed management." },
    { theme: "Applied geomorphology", q: "Explain the role of geomorphology in groundwater exploration (geohydrology) and economic geology." },
    { theme: "Applied geomorphology", q: "Bring out the significance of geomorphology in landslide-hazard and environmental management." },
  ],
};

import type { OptionalTopic } from "./geographyOptionalTypes";

/**
 * UPSC Geography Optional — Paper I, Section A (Physical Geography)
 * Topic 5: ENVIRONMENTAL GEOGRAPHY
 *
 * Personal-notes register, exam-grade depth. Syllabus mapping grounded in the
 * official UPSC Geography Optional Paper I syllabus and 25-year PYQ patterns.
 */
export const environmentalGeography: OptionalTopic = {
  slug: "environmental-geography",
  title: "Environmental Geography",
  paper: "Paper I",
  section: "Section A — Physical Geography",
  order: 5,
  status: "ready",
  summary:
    "Ecology & ecosystems, human ecological adaptation, ecological imbalances, environmental degradation & management, biodiversity, sustainable development, hazards, policy and legislation.",
  readMinutes: 38,
  syllabus: {
    official: [
      "Principle of ecology.",
      "Human ecological adaptations.",
      "Influence of man on ecology and environment.",
      "Global and regional ecological changes and imbalances.",
      "Ecosystem: their management and conservation.",
      "Environmental degradation, management and conservation.",
      "Biodiversity and sustainable development.",
      "Environmental policy; environmental hazards and remedial measures; environmental education and legislation.",
    ],
    trendSays: [
      {
        theme: "Sustainable development & biodiversity",
        insight:
          "Very high and current. SDGs, the three pillars, biodiversity loss and conservation, and the development-vs-environment balance — a reliable 15/20-marker.",
        frequency: "Very High",
      },
      {
        theme: "Global ecological change & imbalances",
        insight:
          "Very high. Global warming, ozone depletion, acid rain, eutrophication and their feedbacks — link mechanism to remedy and to international agreements.",
        frequency: "Very High",
      },
      {
        theme: "Influence of man on environment & degradation",
        insight:
          "High. Anthropogenic pressures (land-use change, pollution, resource over-use) and management/conservation responses.",
        frequency: "High",
      },
      {
        theme: "Principles of ecology / ecosystem",
        insight:
          "Foundational and frequent. Ecosystem structure & function, energy flow, the 10% law, ecological balance and resilience.",
        frequency: "High",
      },
      {
        theme: "Environmental hazards & remedial measures",
        insight:
          "Rising, current-affairs linked. Natural & anthropogenic hazards, vulnerability/risk and disaster-risk reduction.",
        frequency: "High",
      },
      {
        theme: "Environmental policy, legislation & education",
        insight:
          "Medium. International conventions and national laws, EIA, and the role of awareness/education — strong for the 'remedy' part of answers.",
        frequency: "Medium",
      },
    ],
    hiddenTopics: [
      {
        topic: "Ecosystem energy flow, the 10% law & biogeochemical cycles",
        why: "'Principle of ecology' assumes trophic levels, the ten-percent energy law, food webs and the carbon/nitrogen cycles.",
      },
      {
        topic: "Ecological balance, resilience & carrying capacity",
        why: "'Ecological changes and imbalances' needs the equilibrium/resilience and carrying-capacity concepts to be explained, not just listed.",
      },
      {
        topic: "Ozone depletion, acid rain, eutrophication mechanisms",
        why: "Specific global problems are implied under 'imbalances' and must be explained with their chemistry and remedies.",
      },
      {
        topic: "International conventions & SDGs (Stockholm, Rio, Montreal, Kyoto, Paris, CBD)",
        why: "'Environmental policy' expects the milestone agreements and the Sustainable Development Goals as the governance frame.",
      },
      {
        topic: "Environmental Impact Assessment (EIA) & Indian environmental laws",
        why: "'Legislation' needs EIA plus the core Indian Acts (Environment Protection, Water, Air, Forest Conservation, Wildlife Protection).",
      },
      {
        topic: "Risk = hazard × vulnerability × exposure",
        why: "'Environmental hazards and remedial measures' is graded higher with the disaster-risk equation and mitigation/adaptation framing.",
      },
    ],
  },
  subtopics: [
    {
      id: "principles-of-ecology",
      title: "Principle of ecology & the ecosystem",
      syllabusTag: "Principle of ecology; ecosystem",
      hook: "The conceptual base of the whole topic — energy flows one way, nutrients cycle, and balance is dynamic.",
      blocks: [
        {
          type: "para",
          text: "ECOLOGY is the study of interactions between organisms and their environment. Its functional unit is the ECOSYSTEM — a community of organisms (biotic) interacting with their physical surroundings (abiotic) through two master processes: a one-way FLOW OF ENERGY and a cyclic FLOW OF NUTRIENTS.",
        },
        {
          type: "diagram",
          id: "ecosystem-structure",
          caption: "Ecosystem: energy flows one way from the sun; nutrients are recycled by decomposers.",
        },
        {
          type: "points",
          heading: "Structure & function",
          items: [
            "Abiotic components (climate, water, soil, nutrients) and biotic components (producers, consumers, decomposers).",
            "Energy flow: producers → herbivores → carnivores, with only ~10% passing to each higher trophic level (the ten-percent law) — why food chains are short and top predators few.",
            "Biogeochemical cycles (carbon, nitrogen, phosphorus, water) recycle matter between the living and non-living world.",
          ],
        },
        {
          type: "diagram",
          id: "biogeochemical-cycle",
          caption: "Matter recycles through a biogeochemical (e.g., carbon) cycle, unlike one-way energy.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Balance, resilience & carrying capacity",
          items: [
            "Ecological balance is a DYNAMIC equilibrium maintained by feedbacks, not a static state.",
            "Resilience is an ecosystem's capacity to absorb disturbance and recover.",
            "Carrying capacity is the maximum population an environment can sustain — central to development debates.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "ecosystem, biotic/abiotic, trophic level, food web",
            "ten-percent law, biomass pyramid, primary productivity",
            "biogeochemical cycle, ecological balance, resilience, carrying capacity",
          ],
        },
      ],
      examKeywords: ["ecosystem", "trophic level", "ten-percent law", "biogeochemical cycle", "ecological balance", "carrying capacity"],
      answerLanguage: [
        "\"In an ecosystem energy flows unidirectionally while matter is cycled — the twin laws of ecology.\"",
        "\"Ecological balance is a dynamic equilibrium sustained by feedback, not a fixed condition.\"",
      ],
      pyq: [
        { q: "Explain the structure and functioning of an ecosystem with reference to energy flow." },
        { q: "Discuss the concept of ecological balance and ecosystem resilience." },
      ],
    },
    {
      id: "human-adaptation-influence",
      title: "Human ecological adaptations & influence of man on environment",
      syllabusTag: "Human ecological adaptations; influence of man on ecology and environment",
      hook: "The man–environment relationship — from adaptation to determinism/possibilism to today's heavy human footprint.",
      blocks: [
        {
          type: "para",
          text: "Humans both ADAPT to environments (physiological, cultural and technological adjustments — e.g., high-altitude, desert and Arctic adaptations) and increasingly TRANSFORM them. The intellectual frame moved from environmental DETERMINISM (nature controls humans) to POSSIBILISM (humans choose among nature's options) and on to NEO-DETERMINISM / 'stop-and-go determinism' (Taylor) — a middle path stressing limits.",
        },
        {
          type: "points",
          heading: "Influence of man (the anthropogenic footprint)",
          items: [
            "Land-use & land-cover change: deforestation, agriculture, urbanisation.",
            "Pollution of air, water and soil; waste generation.",
            "Over-exploitation of resources; biodiversity loss; climate change.",
            "Net effect: humans are now a dominant geomorphic and ecological agent (the 'Anthropocene').",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Frame the man–nature debate",
          items: [
            "Determinism (Ratzel, Huntington) — environment dictates human activity.",
            "Possibilism (Vidal de la Blache, Febvre) — humans are active agents within natural limits.",
            "Neo-determinism (Griffith Taylor) — humans may go fast or slow but cannot ignore nature's 'stop signals'.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "ecological adaptation, acclimatization, cultural adaptation",
            "environmental determinism, possibilism, neo-determinism, stop-and-go determinism",
            "anthropogenic, Anthropocene, ecological footprint, land-use change",
          ],
        },
      ],
      examKeywords: ["human adaptation", "determinism", "possibilism", "neo-determinism", "anthropogenic", "Anthropocene"],
      answerLanguage: [
        "\"Neo-determinism reconciles determinism and possibilism by stressing that human freedom operates within ecological limits.\"",
        "\"Humanity has become a dominant ecological force, marking the onset of the Anthropocene.\"",
      ],
      pyq: [
        { q: "Discuss the changing nature of the man–environment relationship from determinism to neo-determinism." },
        { q: "Examine the influence of human activity on the natural environment." },
      ],
    },
    {
      id: "global-regional-imbalances",
      title: "Global & regional ecological changes and imbalances",
      syllabusTag: "Global and regional ecological changes and imbalances",
      hook: "The big global problems — explain each mechanism precisely and pair it with its remedy/treaty.",
      blocks: [
        {
          type: "para",
          text: "Human pressure has produced ecological imbalances at every scale. The major GLOBAL problems each have a distinct mechanism, and the examiner rewards precise cause → effect → remedy chains.",
        },
        {
          type: "points",
          heading: "Major imbalances (mechanism → remedy)",
          items: [
            "Global warming: enhanced greenhouse effect → temperature rise, sea-level rise, extreme events → mitigation (emission cuts) & adaptation (UNFCCC/Paris).",
            "Ozone depletion: CFCs destroy stratospheric ozone → higher UV → phase-out of CFCs (Montreal Protocol).",
            "Acid rain: SOx/NOx emissions → acidified rain → ecosystem & monument damage → emission controls/scrubbers.",
            "Eutrophication: nutrient run-off → algal blooms → oxygen depletion (dead zones) → controlling fertiliser/sewage run-off.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Regional imbalances",
          items: [
            "Desertification in semi-arid margins (Sahel, Thar fringe).",
            "Himalayan ecological stress — landslides, glacier retreat, biodiversity pressure.",
            "Wetland loss and urban air pollution in fast-growing regions.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "greenhouse effect, ozone depletion, CFCs, acid rain (SOx/NOx)",
            "eutrophication, algal bloom, dead zone, desertification",
            "Montreal Protocol, UNFCCC, Paris Agreement",
          ],
        },
      ],
      examKeywords: ["global warming", "ozone depletion", "acid rain", "eutrophication", "desertification", "Montreal Protocol"],
      answerLanguage: [
        "\"Each global ecological imbalance is best answered as a precise cause–effect–remedy chain tied to its governing treaty.\"",
        "\"Ozone depletion is the clearest success story of international environmental action via the Montreal Protocol.\"",
      ],
      pyq: [
        { q: "Discuss the major global ecological imbalances and the international response to them." },
        { q: "Explain the causes, consequences and remedies of acid rain and eutrophication." },
      ],
    },
    {
      id: "degradation-management-conservation",
      title: "Environmental degradation, management & conservation",
      syllabusTag: "Ecosystem management; environmental degradation, management and conservation",
      hook: "The 'what do we do about it' head — convert problems into management and conservation strategy.",
      blocks: [
        {
          type: "para",
          text: "ENVIRONMENTAL DEGRADATION is the deterioration of the environment through resource depletion and pollution. ENVIRONMENTAL MANAGEMENT is the systematic, integrated approach to using and protecting environmental resources so that ecological functions are sustained while needs are met.",
        },
        {
          type: "points",
          heading: "Management & conservation tools",
          items: [
            "Ecosystem-based management (watershed, coastal-zone, forest, wetland management).",
            "Pollution control: standards, scrubbers, effluent treatment, the polluter-pays principle.",
            "Protected areas, ecological restoration and the precautionary principle.",
            "Environmental Impact Assessment (EIA) to screen projects before approval.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Guiding principles to cite",
          items: [
            "Polluter-pays principle and the precautionary principle.",
            "Sustainable yield — use renewable resources within their regeneration rate.",
            "Common-but-differentiated responsibilities (equity in global action).",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "environmental degradation, environmental management, ecological restoration",
            "EIA, polluter-pays, precautionary principle, sustainable yield",
            "watershed / coastal-zone management, protected area",
          ],
        },
      ],
      examKeywords: ["environmental degradation", "environmental management", "EIA", "polluter-pays principle", "ecological restoration"],
      answerLanguage: [
        "\"Environmental management integrates resource use with ecological protection under the polluter-pays and precautionary principles.\"",
        "\"Ecosystem-based, watershed-scale management treats the environment as an interconnected system rather than isolated sectors.\"",
      ],
      pyq: [
        { q: "Discuss the principles and tools of environmental management for sustainable resource use." },
        { q: "Examine the role of Environmental Impact Assessment in conservation." },
      ],
    },
    {
      id: "biodiversity-sustainable-development",
      title: "Biodiversity & sustainable development",
      syllabusTag: "Biodiversity and sustainable development",
      hook: "The flagship contemporary head — balance the three pillars and anchor to the SDGs.",
      blocks: [
        {
          type: "para",
          text: "BIODIVERSITY — the variety of life at genetic, species and ecosystem levels — underpins ecosystem services (provisioning, regulating, cultural, supporting) on which human welfare depends. SUSTAINABLE DEVELOPMENT, defined by the Brundtland Commission as meeting present needs without compromising future generations, seeks to balance three pillars: economy, society and environment.",
        },
        {
          type: "diagram",
          id: "sustainable-development",
          caption: "Sustainable development balances the economic, social and environmental pillars.",
        },
        {
          type: "points",
          heading: "From concept to agenda",
          items: [
            "Threats to biodiversity: habitat loss, over-exploitation, invasive species, pollution, climate change.",
            "Conservation: in-situ (parks, reserves, biosphere reserves) and ex-situ (gene banks, botanical gardens).",
            "The 2030 Agenda and 17 Sustainable Development Goals (SDGs) operationalise sustainability globally.",
            "Frameworks: Convention on Biological Diversity (CBD), Ramsar (wetlands), CITES (trade).",
          ],
        },
        {
          type: "callout",
          tone: "link",
          title: "How to balance the answer",
          items: [
            "Avoid framing it as environment-vs-development; argue for integration via green technology, circular economy and inclusive growth.",
            "Bring an Indian angle: hotspots (Western Ghats, Himalaya), national missions, and SDG localisation.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "genetic/species/ecosystem diversity, ecosystem services",
            "Brundtland, sustainable development, three pillars, SDGs, circular economy",
            "in-situ / ex-situ conservation, CBD, Ramsar, CITES",
          ],
        },
      ],
      examKeywords: ["biodiversity", "ecosystem services", "sustainable development", "Brundtland", "SDGs", "Convention on Biological Diversity"],
      answerLanguage: [
        "\"Sustainable development integrates the economic, social and environmental pillars rather than trading one against another.\"",
        "\"Biodiversity sustains the ecosystem services on which all economic activity ultimately rests.\"",
      ],
      pyq: [
        { year: "2022", q: "Examine the relationship between biodiversity conservation and sustainable development." },
        { q: "Discuss the concept of sustainable development and the role of the SDGs." },
      ],
    },
    {
      id: "policy-hazards-legislation",
      title: "Environmental policy, hazards & legislation",
      syllabusTag: "Environmental policy; environmental hazards and remedial measures; environmental education and legislation",
      hook: "The governance-and-risk tail — milestone treaties, the risk equation, Indian laws and the role of awareness.",
      blocks: [
        {
          type: "para",
          text: "ENVIRONMENTAL POLICY has evolved through milestone international conferences and conventions, mirrored by national legislation. ENVIRONMENTAL HAZARDS — natural (earthquakes, floods, cyclones, droughts) and anthropogenic (industrial accidents, chemical spills) — translate into disasters through vulnerability and exposure.",
        },
        {
          type: "points",
          heading: "Policy milestones to cite",
          items: [
            "Stockholm Conference (1972) → Rio Earth Summit (1992, Agenda 21, CBD, UNFCCC) → Johannesburg (2002) → Rio+20 (2012) → 2030 Agenda/SDGs.",
            "Montreal Protocol (ozone), Kyoto Protocol & Paris Agreement (climate).",
            "India: Environment (Protection) Act 1986, Water Act 1974, Air Act 1981, Forest Conservation Act 1980, Wildlife Protection Act 1972; EIA notification; National Green Tribunal.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "The hazard–risk frame (write this)",
          items: [
            "Risk = Hazard × Vulnerability × Exposure — disasters are not 'natural' alone.",
            "Remedial measures: hazard zonation, early-warning systems, building codes, insurance, and community preparedness.",
            "Shift from response to disaster-risk reduction (Sendai Framework) — mitigation + adaptation.",
          ],
        },
        {
          type: "callout",
          tone: "link",
          title: "Environmental education & awareness",
          items: [
            "Education builds the public support and behavioural change that policy depends on.",
            "Links to GS-III (disaster management, environment) for cross-paper synergy.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "Stockholm, Rio, Agenda 21, Montreal, Kyoto, Paris, Sendai Framework",
            "Environment Protection Act, EIA, National Green Tribunal",
            "hazard, vulnerability, exposure, risk, disaster-risk reduction, mitigation, adaptation",
          ],
        },
      ],
      examKeywords: ["environmental policy", "Stockholm", "Rio Earth Summit", "EIA", "environmental hazards", "risk", "disaster-risk reduction"],
      answerLanguage: [
        "\"Disasters arise where a hazard meets vulnerability and exposure, so remedy must reduce all three.\"",
        "\"From Stockholm to the SDGs, environmental policy has moved from awareness to binding, goal-based action.\"",
      ],
      pyq: [
        { q: "Trace the evolution of international environmental policy from Stockholm to the SDGs." },
        { q: "Distinguish between hazard and disaster, and discuss remedial measures for environmental hazards." },
      ],
    },
  ],
};

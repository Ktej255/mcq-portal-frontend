import type { OptionalTopic } from "./geographyOptionalTypes";

/**
 * UPSC Geography Optional — Paper I, Section A (Physical Geography)
 * Topic 3: OCEANOGRAPHY
 *
 * Personal-notes register, exam-grade depth. Syllabus mapping grounded in the
 * official UPSC Geography Optional Paper I syllabus and 25-year PYQ patterns.
 */
export const oceanography: OptionalTopic = {
  slug: "oceanography",
  title: "Oceanography",
  paper: "Paper I",
  section: "Section A — Physical Geography",
  order: 3,
  status: "ready",
  summary:
    "Ocean-floor relief, temperature & salinity, the heat & salt budgets, waves–currents–tides, marine resources, coral reefs & bleaching, and the law of the sea.",
  readMinutes: 38,
  syllabus: {
    official: [
      "Bottom topography of the Atlantic, Indian and Pacific Oceans.",
      "Temperature and salinity of the oceans.",
      "Heat and salt budgets; ocean deposits.",
      "Waves, currents and tides.",
      "Marine resources: biotic, mineral and energy resources.",
      "Coral reefs, coral bleaching.",
      "Sea-level changes.",
      "Law of the sea and marine pollution.",
    ],
    trendSays: [
      {
        theme: "Ocean currents & their mechanism",
        insight:
          "Very high frequency. Examiner wants the forces (wind, Coriolis, density), the gyre pattern, and a consequence — climate, fisheries (upwelling) or El Niño.",
        frequency: "Very High",
      },
      {
        theme: "Coral reefs & coral bleaching",
        insight:
          "Top current-affairs head. Conditions for coral growth, reef types & theories, and the causes/consequences of bleaching (warming, acidification) — almost always a 15-marker.",
        frequency: "Very High",
      },
      {
        theme: "Marine resources, Law of the Sea & Blue Economy",
        insight:
          "Rising fast. UNCLOS maritime zones, EEZ, polymetallic nodules, gas hydrates and the Blue Economy frame answers on resources and governance.",
        frequency: "High",
      },
      {
        theme: "Temperature & salinity distribution",
        insight:
          "Reliable. Controls of horizontal/vertical distribution, the thermocline/halocline, and the link to density and circulation.",
        frequency: "High",
      },
      {
        theme: "Sea-level change & marine pollution",
        insight:
          "Climate-linked and current. Eustatic vs isostatic change, causes of rise, and pollution (plastics, oil, eutrophication, acidification).",
        frequency: "High",
      },
      {
        theme: "Ocean-floor relief & deposits",
        insight:
          "Foundational short note; often a diagram of the Atlantic/Pacific/Indian basins plus a line on deposits.",
        frequency: "Medium",
      },
    ],
    hiddenTopics: [
      {
        topic: "Thermohaline circulation (the global conveyor belt)",
        why: "Never named beyond 'currents', but deep-ocean circulation driven by temperature–salinity density is essential for climate and heat-transfer answers.",
      },
      {
        topic: "Ekman transport, geostrophic flow & upwelling",
        why: "The physics behind surface currents and the link to coastal fisheries (Peru/Benguela) is assumed, not printed.",
      },
      {
        topic: "El Niño / La Niña & the Walker circulation (ocean side)",
        why: "Implicit in 'currents' and 'sea-level changes'; ENSO is a favourite cross-link to the monsoon and fisheries.",
      },
      {
        topic: "Ocean acidification",
        why: "Sits behind 'coral bleaching' and 'marine pollution' — the CO2–carbonate chemistry that weakens reefs and shellfish.",
      },
      {
        topic: "UNCLOS maritime zones & Blue Economy",
        why: "'Law of the sea' needs the territorial sea, contiguous zone, EEZ, continental shelf limits and the sustainable-use framing.",
      },
      {
        topic: "Continental margins — active vs passive",
        why: "Bottom-topography answers improve when shelf/slope/rise are tied to plate-tectonic margin type.",
      },
    ],
  },
  subtopics: [
    {
      id: "ocean-relief-deposits",
      title: "Ocean bottom relief & deposits",
      syllabusTag: "Bottom topography of the Atlantic, Indian and Pacific Oceans; ocean deposits",
      hook: "The stage on which everything else acts — learn the standard profile once and you can sketch any ocean basin.",
      blocks: [
        {
          type: "para",
          text: "The ocean floor is not a featureless plain. Moving seaward from the coast it passes through the gently-sloping CONTINENTAL SHELF, the steeper CONTINENTAL SLOPE, the sediment-built CONTINENTAL RISE, the vast ABYSSAL PLAIN, and then either a MID-OCEAN RIDGE (constructive plate boundary) or a deep-sea TRENCH (subduction). These divisions are products of plate tectonics, so margin type matters.",
        },
        {
          type: "diagram",
          id: "ocean-relief",
          caption: "Shelf → slope → rise → abyssal plain, with a trench and a mid-ocean ridge.",
        },
        {
          type: "points",
          heading: "The three oceans (signatures to quote)",
          items: [
            "Atlantic: a near-perfect 'S' Mid-Atlantic Ridge (divergent boundary), broad shelves, relatively few trenches — a youthful, widening ocean.",
            "Pacific: the largest and deepest, ringed by trenches and volcanic/seismic activity (the 'Ring of Fire'); the Mariana Trench is the deepest point.",
            "Indian: the youngest major ocean, with the inverted-Y mid-oceanic ridge system and a strong imprint of the Indian plate's drift.",
          ],
        },
        {
          type: "points",
          heading: "Ocean deposits",
          items: [
            "Terrigenous (land-derived) sediments on shelves and slopes.",
            "Pelagic oozes — calcareous (foraminifera/pteropod) and siliceous (radiolarian/diatom) — on the deep floor.",
            "Red clay in the deepest, sediment-starved basins.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "continental shelf / slope / rise, abyssal plain, mid-ocean ridge, trench, seamount, guyot",
            "active vs passive margin, Ring of Fire",
            "terrigenous sediment, calcareous/siliceous ooze, red clay, pelagic deposit",
          ],
        },
      ],
      examKeywords: ["continental shelf", "abyssal plain", "mid-ocean ridge", "trench", "pelagic ooze", "continental margin"],
      answerLanguage: [
        "\"The relief of the ocean floor is fundamentally a product of plate tectonics, hence margin type governs its form.\"",
        "\"The continental shelf, though only a fringe, holds the bulk of marine biological and mineral wealth.\"",
      ],
      pyq: [
        { q: "Describe the bottom relief of the Atlantic Ocean with a labelled diagram." },
        { q: "Discuss the classification and distribution of ocean deposits." },
      ],
    },
    {
      id: "temperature-salinity-budgets",
      title: "Temperature, salinity, and the heat & salt budgets",
      syllabusTag: "Temperature and salinity of the oceans; heat and salt budgets",
      hook: "Temperature + salinity together set density — and density quietly drives the deep global circulation.",
      blocks: [
        {
          type: "para",
          text: "Sea-surface temperature falls from the equator to the poles and decreases with depth, but not uniformly: a warm, wind-mixed surface layer sits above the THERMOCLINE, a zone of rapid temperature decline, below which lies cold, sluggish deep water. SALINITY (average ~35‰) is governed by the balance of evaporation/precipitation, river inflow, and mixing; it peaks in the sub-tropics (high evaporation) and falls near the equator (rain) and poles (ice-melt/inflow).",
        },
        {
          type: "diagram",
          id: "salinity-profile",
          caption: "Warm mixed layer → thermocline → cold deep water (a parallel halocline exists for salinity).",
        },
        {
          type: "points",
          heading: "Heat & salt budgets",
          items: [
            "Heat budget: oceans gain heat by insolation and lose it by evaporation, radiation and conduction; the balance varies by latitude and drives currents.",
            "Salt budget: salt added by rivers/volcanism is balanced by removal (sea spray, evaporite deposition), keeping mean salinity roughly steady.",
            "Together, temperature and salinity fix sea-water DENSITY — the trigger of thermohaline (deep) circulation.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "The hidden engine — thermohaline circulation",
          items: [
            "Cold, salty (dense) water sinks in the North Atlantic and around Antarctica, flows along the deep floor, and slowly upwells elsewhere.",
            "This 'global conveyor belt' redistributes heat over centuries and stabilises climate.",
            "A favourite cross-link: a slowdown (e.g., AMOC weakening) would have large climatic consequences.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "thermocline, halocline, pycnocline, mixed layer",
            "salinity (‰, psu), evaporation–precipitation balance",
            "thermohaline circulation, global conveyor belt, density-driven flow",
          ],
        },
      ],
      examKeywords: ["thermocline", "salinity", "halocline", "thermohaline circulation", "density", "heat budget"],
      answerLanguage: [
        "\"Temperature and salinity jointly determine sea-water density, which powers the thermohaline conveyor.\"",
        "\"Sub-tropical seas record peak salinity owing to high evaporation and subsiding dry air.\"",
      ],
      pyq: [
        { q: "Discuss the factors controlling the horizontal and vertical distribution of salinity in the oceans." },
        { q: "Explain thermohaline circulation and its significance for global climate." },
      ],
    },
    {
      id: "waves-currents-tides",
      title: "Waves, currents & tides",
      syllabusTag: "Waves, currents and tides",
      hook: "The most-asked head — nail the mechanism of currents and the spring/neap logic of tides.",
      blocks: [
        {
          type: "para",
          text: "WAVES are the transfer of energy (not water) through the sea surface, generated by wind; their size depends on wind speed, duration and fetch. CURRENTS are large-scale movements of water driven by prevailing winds, the Coriolis force and density differences, organised into great subtropical GYRES (clockwise in the north, anticlockwise in the south). TIDES are the periodic rise and fall of the sea caused by the gravitational pull of the Moon and Sun plus the earth's rotation.",
        },
        {
          type: "diagram",
          id: "ocean-gyres",
          caption: "A wind-driven subtropical gyre: warm western-boundary and cool eastern-boundary currents.",
        },
        {
          type: "points",
          heading: "Currents — the logic to write",
          items: [
            "Warm currents (e.g., Gulf Stream, Kuroshio) move poleward along western basin margins and warm adjacent coasts.",
            "Cool currents (e.g., Peru/Humboldt, Benguela, California) move equatorward along eastern margins; coastal upwelling here feeds rich fisheries.",
            "Ekman transport (net 90° to the wind) and geostrophic balance explain the gyre's shape and the 'piled-up' western boundary.",
          ],
        },
        {
          type: "diagram",
          id: "tides-spring-neap",
          caption: "Spring tides at new/full moon (alignment); neap tides at quadrature (right angles).",
        },
        {
          type: "callout",
          tone: "example",
          title: "Why it matters",
          items: [
            "Currents redistribute heat (Gulf Stream warms NW Europe) and moisture, and steer marine life.",
            "Upwelling cool currents = world's great fishing grounds; their collapse during El Niño devastates fisheries.",
            "Tidal range governs ports, tidal energy potential and estuarine ecology.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "fetch, swell, gyre, western/eastern boundary current",
            "Coriolis force, Ekman transport, geostrophic current, upwelling",
            "spring & neap tide, tidal range, flood/ebb, tidal bore",
          ],
        },
      ],
      examKeywords: ["ocean currents", "gyre", "upwelling", "Ekman transport", "spring tide", "neap tide", "Gulf Stream"],
      answerLanguage: [
        "\"Ocean currents are organised into subtropical gyres by the interplay of winds and the Coriolis force.\"",
        "\"Coastal upwelling along cool eastern-boundary currents sustains the world's most productive fisheries.\"",
      ],
      pyq: [
        { year: "2018", q: "Account for the origin of ocean currents and examine their influence on coastal climates." },
        { q: "Distinguish between spring and neap tides with the help of diagrams." },
      ],
    },
    {
      id: "marine-resources",
      title: "Marine resources — biotic, mineral & energy",
      syllabusTag: "Marine resources: biotic, mineral and energy resources",
      hook: "Connect resources to UNCLOS and the Blue Economy and you lift a descriptive answer into a governance one.",
      blocks: [
        {
          type: "para",
          text: "The oceans are a vast and increasingly contested storehouse. BIOTIC resources include fisheries and aquaculture, concentrated on shelves and upwelling zones. MINERAL resources span placer deposits, polymetallic (manganese) nodules of the deep floor, and offshore oil & gas. ENERGY resources include offshore hydrocarbons, gas hydrates, and renewables — tidal, wave and Ocean Thermal Energy Conversion (OTEC).",
        },
        {
          type: "points",
          heading: "Governance frame — what UPSC rewards",
          items: [
            "UNCLOS maritime zones: territorial sea (12 nm), contiguous zone (24 nm), Exclusive Economic Zone (200 nm), and the continental-shelf claim beyond.",
            "The 'Area' (deep seabed beyond national jurisdiction) is the common heritage of mankind, managed by the ISA.",
            "Blue Economy: sustainable use of ocean resources for growth while preserving ecosystem health (India's Deep Ocean Mission, Sagarmala).",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Indian angle",
          items: [
            "Polymetallic-nodule exploration rights in the Central Indian Ocean Basin.",
            "Offshore oil & gas (Mumbai High); large EEZ resource potential.",
            "Deep Ocean Mission and the Blue Economy policy push.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "fishery, upwelling zone, aquaculture",
            "polymetallic nodules, placer deposit, gas hydrate, OTEC",
            "UNCLOS, EEZ, continental shelf, ISA, Blue Economy, common heritage of mankind",
          ],
        },
      ],
      examKeywords: ["marine resources", "polymetallic nodules", "EEZ", "UNCLOS", "Blue Economy", "OTEC", "gas hydrates"],
      answerLanguage: [
        "\"Marine resource use is increasingly framed by UNCLOS and the sustainability logic of the Blue Economy.\"",
        "\"Deep-sea polymetallic nodules represent a strategic mineral frontier for resource-hungry economies.\"",
      ],
      pyq: [
        { q: "Examine the potential of marine mineral and energy resources and the regime governing their use." },
        { q: "What is the Blue Economy? Discuss its relevance for India." },
      ],
    },
    {
      id: "coral-reefs-bleaching",
      title: "Coral reefs & coral bleaching",
      syllabusTag: "Coral reefs, coral bleaching",
      hook: "The flagship current-affairs head — own the growth conditions, reef types/theory, and the bleaching mechanism.",
      blocks: [
        {
          type: "para",
          text: "Corals are tiny colonial animals (polyps) living in symbiosis with photosynthetic algae called ZOOXANTHELLAE, which give them colour and nutrition. Reef-building (hermatypic) corals need narrow conditions: warm water (≈23–27°C), clear and shallow (sunlit), normal salinity, and clean, sediment-free seas — which is why reefs cluster in the tropics.",
        },
        {
          type: "points",
          heading: "Reef types & the classic theory",
          items: [
            "Fringing reef — attached to the shore.",
            "Barrier reef — separated from the coast by a lagoon (e.g., Great Barrier Reef).",
            "Atoll — a ring of reef around a lagoon, often over a subsided volcanic island.",
            "Darwin's subsidence theory explains the fringing → barrier → atoll sequence as the island subsides while the reef grows upward.",
          ],
        },
        {
          type: "diagram",
          id: "coral-reef-types",
          caption: "Fringing → barrier (with lagoon) → atoll, per Darwin's subsidence theory.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Coral bleaching — the mechanism (write this precisely)",
          items: [
            "Stress (mainly marine heatwaves; also acidification, pollution, sedimentation) makes corals expel their zooxanthellae.",
            "Losing the algae, corals turn white ('bleach') and, deprived of nutrition, may starve and die if stress persists.",
            "Ocean acidification (from absorbed CO2) lowers carbonate availability, weakening reef-building.",
            "Consequences: collapse of reef biodiversity, fisheries and coastal protection; cross-link to climate change and the Blue Economy.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "polyp, zooxanthellae, symbiosis, hermatypic coral",
            "fringing / barrier reef, atoll, lagoon, Darwin's subsidence theory",
            "coral bleaching, marine heatwave, ocean acidification, carbonate saturation",
          ],
        },
      ],
      examKeywords: ["coral reef", "zooxanthellae", "atoll", "Darwin's subsidence theory", "coral bleaching", "ocean acidification"],
      answerLanguage: [
        "\"Coral bleaching is the stress-induced expulsion of symbiotic zooxanthellae, driven chiefly by marine heatwaves.\"",
        "\"Darwin's subsidence theory elegantly links fringing reefs, barrier reefs and atolls in a single evolutionary sequence.\"",
      ],
      pyq: [
        { year: "2021", q: "Discuss the conditions necessary for coral growth and explain the causes and consequences of coral bleaching." },
        { q: "Critically examine the theories of coral reef formation." },
      ],
    },
    {
      id: "sealevel-law-pollution",
      title: "Sea-level changes, law of the sea & marine pollution",
      syllabusTag: "Sea-level changes; law of the sea and marine pollution",
      hook: "The contemporary governance-and-environment tail — connect mechanism, law and impact.",
      blocks: [
        {
          type: "para",
          text: "SEA LEVEL changes on many timescales. EUSTATIC change alters the actual volume of ocean water (ice growth/melt, thermal expansion); ISOSTATIC change reflects vertical movement of the land (post-glacial rebound, subsidence). Present-day rise is dominated by thermal expansion and land-ice melt under global warming, threatening deltas, small islands and coastal cities.",
        },
        {
          type: "points",
          heading: "Law of the sea (UNCLOS, 1982)",
          items: [
            "Defines the territorial sea, contiguous zone, EEZ and continental shelf, and freedoms of the high seas.",
            "Establishes the deep seabed 'Area' as the common heritage of mankind under the ISA.",
            "Provides dispute-settlement mechanisms — central to maritime boundary and resource questions.",
          ],
        },
        {
          type: "points",
          heading: "Marine pollution",
          items: [
            "Plastics & microplastics, oil spills, untreated sewage, industrial effluents and agricultural run-off (eutrophication, dead zones).",
            "Ocean acidification from absorbed CO2 — a chemical pollution of global scale.",
            "Responses: MARPOL, regional seas programmes, marine protected areas, and circular-economy/plastic bans.",
          ],
        },
        {
          type: "diagram",
          id: "tides-spring-neap",
          caption: "Tidal forcing also modulates coastal flooding risk as sea level rises.",
        },
        {
          type: "callout",
          tone: "link",
          title: "Links for extra marks",
          items: [
            "Tie sea-level rise to Disaster Management and coastal-zone planning (GS-III).",
            "Connect pollution & acidification to the coral-bleaching and Blue-Economy threads above.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "eustatic vs isostatic change, thermal expansion, isostatic rebound",
            "UNCLOS, territorial sea, EEZ, high seas, common heritage of mankind",
            "eutrophication, dead zone, microplastics, MARPOL, marine protected area",
          ],
        },
      ],
      examKeywords: ["eustatic", "isostatic", "sea-level rise", "UNCLOS", "EEZ", "marine pollution", "eutrophication"],
      answerLanguage: [
        "\"Eustatic change alters water volume, whereas isostatic change reflects movement of the land itself.\"",
        "\"UNCLOS supplies the legal architecture for maritime zones, resources and dispute settlement.\"",
      ],
      pyq: [
        { q: "Distinguish between eustatic and isostatic sea-level changes with examples." },
        { q: "Discuss the major sources of marine pollution and the international response to them." },
      ],
    },
  ],
};

import type { OptionalTopic } from "./geographyOptionalTypes";

/**
 * UPSC Geography Optional — Paper I, Section A (Physical Geography)
 * Topic 2: CLIMATOLOGY
 *
 * Personal-notes register, exam-grade depth. Syllabus mapping grounded in the
 * official UPSC Geography Optional Paper I syllabus and 25-year PYQ patterns.
 */
export const climatology: OptionalTopic = {
  slug: "climatology",
  title: "Climatology",
  paper: "Paper I",
  section: "Section A — Physical Geography",
  order: 2,
  status: "ready",
  summary:
    "From the heat budget and global circulation to monsoons, jet streams, cyclones, climate classification, and the modern climate-change agenda.",
  readMinutes: 40,
  syllabus: {
    official: [
      "Temperature and pressure belts of the world; heat budget of the earth.",
      "Atmospheric circulation; atmospheric stability and instability.",
      "Planetary and local winds; monsoons and jet streams.",
      "Air masses and fronto-genesis; temperate and tropical cyclones.",
      "Types and distribution of precipitation; weather and climate.",
      "Köppen's, Thornthwaite's and Trewartha's classification of world climates.",
      "Hydrological cycle; global climatic change.",
      "Role and response of man in climatic changes; applied climatology and urban climate.",
    ],
    trendSays: [
      {
        theme: "Atmospheric circulation, jet streams & monsoon",
        insight:
          "The core, repeatedly-asked block. Examiner wants the tri-cellular model linked to jet streams and the Indian monsoon mechanism (incl. the Jet-stream / Tibetan-plateau theories).",
        frequency: "Very High",
      },
      {
        theme: "Climate change & man's role/response",
        insight:
          "Fastest-rising. Global warming mechanisms, IPCC-style evidence, feedbacks, and mitigation/adaptation — usually a 15/20-marker with a current-affairs hook.",
        frequency: "High",
      },
      {
        theme: "Climate classification (Köppen / Thornthwaite / Trewartha)",
        insight:
          "Stable comparative question. Reward comes from the basis of each scheme (empirical vs genetic) and a reasoned critique, not just the letter codes.",
        frequency: "High",
      },
      {
        theme: "Air masses, fronts & cyclones (temperate vs tropical)",
        insight:
          "Reliable diagram-driven question; often paired with a recent cyclone. Contrast origin, structure, energy source and tracks.",
        frequency: "High",
      },
      {
        theme: "Heat budget & temperature/pressure belts",
        insight:
          "Foundational short note. Albedo, latitudinal energy imbalance and the resulting transfer underpin everything else.",
        frequency: "Medium",
      },
      {
        theme: "Applied & urban climatology",
        insight:
          "Newer head — urban heat island, air pollution domes, bioclimatology, climate in planning. Strong differentiator.",
        frequency: "Medium",
      },
    ],
    hiddenTopics: [
      {
        topic: "Lapse rates & atmospheric stability (ELR, DALR, SALR)",
        why: "Never spelt out beyond 'stability and instability', but you cannot explain cloud/precipitation or inversions without environmental and adiabatic lapse rates.",
      },
      {
        topic: "ENSO, Walker circulation, IOD & teleconnections",
        why: "Implicit in 'global climatic change' and monsoon variability; UPSC expects El Niño/La Niña and the Indian Ocean Dipole as monsoon controls.",
      },
      {
        topic: "Jet-stream & Tibetan-plateau theories of the monsoon",
        why: "'Monsoons and jet streams' assumes the modern dynamic theory (sub-tropical & tropical easterly jets, Tibetan heating) over the old thermal theory.",
      },
      {
        topic: "Condensation forms & precipitation mechanisms (Bergeron, coalescence)",
        why: "'Types of precipitation' silently needs the physics of how raindrops form, plus convectional/orographic/cyclonic types.",
      },
      {
        topic: "Radiation laws & the greenhouse mechanism",
        why: "Heat budget and climate change both rest on short-wave vs long-wave radiation and selective absorption by greenhouse gases.",
      },
      {
        topic: "Milankovitch cycles & palaeoclimatic evidence",
        why: "Natural climate change (orbital forcing, ice-core/dendro evidence) is required to separate natural from anthropogenic signals.",
      },
    ],
  },
  subtopics: [
    {
      id: "heat-budget-temperature",
      title: "Heat budget & temperature / pressure belts",
      syllabusTag: "Temperature and pressure belts; heat budget of the earth",
      hook: "The energy foundation: once you see why the tropics gain and the poles lose, every wind, current and climate belt follows.",
      blocks: [
        {
          type: "para",
          text: "The earth, taken as a whole, neither warms nor cools over the long run — incoming short-wave solar radiation is balanced by outgoing terrestrial long-wave radiation. This is the HEAT BUDGET. Of 100 units of insolation reaching the top of the atmosphere, about 35 are reflected back (the planetary albedo), ~14 are absorbed by the atmosphere, and ~51 are absorbed at the surface; the surface and atmosphere then radiate this back to space so the books balance.",
        },
        {
          type: "diagram",
          id: "heat-budget",
          caption: "Incoming 100 units balanced by reflected (albedo) + outgoing terrestrial radiation.",
        },
        {
          type: "callout",
          tone: "key",
          title: "The crucial twist — latitudinal imbalance",
          items: [
            "Between roughly 40°N and 40°S there is an energy surplus; poleward of 40° there is a deficit.",
            "This imbalance is the engine of the climate system: it drives the poleward transfer of heat by winds (atmosphere) and ocean currents.",
            "Without this transfer the tropics would keep heating and the poles keep cooling.",
          ],
        },
        {
          type: "points",
          heading: "Temperature & pressure belts",
          items: [
            "Temperature falls broadly from equator to poles; modified by altitude, continentality, ocean currents and cloud cover.",
            "Four pressure belts per hemisphere: equatorial low (ITCZ), sub-tropical high (~30°), sub-polar low (~60°), polar high.",
            "Thermally-induced (equatorial low, polar high) vs dynamically-induced (sub-tropical high, sub-polar low) belts.",
            "These belts shift seasonally with the overhead sun — the basis of seasonal wind reversal and monsoons.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "insolation, albedo, short-wave / long-wave radiation, terrestrial radiation",
            "heat budget, latitudinal energy balance, isotherm",
            "ITCZ, sub-tropical high, sub-polar low, thermally vs dynamically induced",
          ],
        },
        {
          type: "callout",
          tone: "trap",
          title: "Common traps",
          items: [
            "Albedo ≠ absorption — albedo is reflected energy that does no heating.",
            "Sub-tropical highs are dynamic (subsidence), not simply 'cold-air' highs.",
          ],
        },
      ],
      examKeywords: ["heat budget", "albedo", "insolation", "latitudinal energy balance", "pressure belts", "ITCZ"],
      answerLanguage: [
        "\"The latitudinal imbalance of net radiation is the prime mover of atmospheric and oceanic circulation.\"",
        "\"Pressure belts are partly thermally and partly dynamically induced, and migrate with the apparent movement of the sun.\"",
      ],
      pyq: [
        { q: "Explain the heat budget of the earth and its significance for atmospheric circulation." },
        { q: "Account for the origin of the world's pressure belts." },
      ],
    },
    {
      id: "circulation-winds-stability",
      title: "Atmospheric circulation, winds & stability",
      syllabusTag: "Atmospheric circulation; planetary and local winds; stability and instability",
      hook: "The tri-cellular model is the spine of the paper — anchor jet streams, winds and rainfall belts to it.",
      blocks: [
        {
          type: "para",
          text: "Because of the latitudinal heat imbalance and the earth's rotation (Coriolis force), each hemisphere organises its circulation into THREE cells: the thermally-direct Hadley cell (0–30°), the indirect Ferrel cell (30–60°) and the Polar cell (60–90°). Rising air at the equatorial low and sub-polar low brings rain; sinking air at the sub-tropical high and polar high brings aridity (hence the great hot deserts near 30°).",
        },
        {
          type: "diagram",
          id: "tricellular-circulation",
          caption: "Three circulation cells per hemisphere with alternating low (rain) and high (dry) belts.",
        },
        {
          type: "points",
          heading: "Planetary (prevailing) winds",
          items: [
            "Trade winds: sub-tropical high → equatorial low (NE in N hemisphere, SE in S).",
            "Westerlies: sub-tropical high → sub-polar low; strong and persistent (the 'roaring forties').",
            "Polar easterlies: polar high → sub-polar low.",
            "Ferrel's law / Coriolis deflects winds right (N) and left (S).",
          ],
        },
        {
          type: "points",
          heading: "Local & seasonal winds",
          items: [
            "Land–sea breeze, mountain–valley breeze (diurnal, thermal).",
            "Warm: Chinook, Foehn (leeward, snow-eaters); Cold: Mistral, Bora.",
            "Loo (N India) — hot, dry summer wind, a heat-stress hazard.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Stability vs instability (the hidden lapse-rate layer)",
          items: [
            "Environmental Lapse Rate (ELR) ≈ 6.5°C/km; Dry Adiabatic (DALR) ≈ 10°C/km; Saturated (SALR) ≈ 5–6°C/km.",
            "If ELR < DALR a lifted parcel is colder/denser → sinks back → STABLE (fair weather, inversions).",
            "If ELR > DALR the parcel stays warmer → keeps rising → UNSTABLE (towering clouds, thunderstorms).",
            "Temperature inversions trap pollutants — a bridge to urban/applied climatology.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "Hadley / Ferrel / Polar cell, Coriolis force, geostrophic wind",
            "trade winds, westerlies, polar easterlies",
            "lapse rate (ELR, DALR, SALR), adiabatic, inversion, stability/instability",
          ],
        },
      ],
      examKeywords: ["tri-cellular circulation", "Hadley cell", "Coriolis", "trade winds", "westerlies", "lapse rate", "adiabatic"],
      answerLanguage: [
        "\"The tri-cellular meridional circulation reconciles the energy imbalance with the constraint of earth's rotation.\"",
        "\"Atmospheric stability is decided by the relation between the environmental and adiabatic lapse rates.\"",
      ],
      pyq: [
        { q: "Describe the tri-cellular model of atmospheric circulation and its bearing on the world's climatic belts." },
        { q: "Distinguish between atmospheric stability and instability with reference to lapse rates." },
      ],
    },
    {
      id: "monsoon-jet-streams",
      title: "Monsoons & jet streams",
      syllabusTag: "Monsoons and jet streams",
      hook: "India-centric and almost guaranteed — the dynamic (jet-stream) theory is what UPSC wants over the old thermal one.",
      blocks: [
        {
          type: "para",
          text: "A monsoon is a seasonal reversal of wind direction, with a wet summer and dry winter phase. The CLASSICAL (thermal) THEORY explained it as a giant land–sea breeze driven by differential heating of the Asian landmass and the ocean. The MODERN (dynamic) THEORY enriches this with upper-air controls.",
        },
        {
          type: "points",
          heading: "Modern dynamic theory — the controls UPSC expects",
          items: [
            "Sub-Tropical Jet Stream (STJ): its withdrawal north of the Himalaya/Tibet allows the monsoon to 'burst'.",
            "Tibetan Plateau heating creates an upper-air anticyclone and the Tropical Easterly Jet (TEJ), aiding the rains.",
            "ITCZ migration: the monsoon trough shifts north in summer, drawing in moist maritime air.",
            "Somali (low-level) jet and cross-equatorial flow feed moisture to the south-west monsoon.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Variability — bring these to top the answer",
          items: [
            "ENSO: El Niño tends to weaken the Indian monsoon; La Niña tends to strengthen it.",
            "Indian Ocean Dipole (IOD): a positive IOD can offset an El Niño year.",
            "Break and active spells, monsoon onset/withdrawal dates, and their agrarian impact.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Jet streams in brief",
          items: [
            "Fast, narrow, upper-tropospheric westerly currents at the tropopause.",
            "Polar-front jet & sub-tropical jet steer surface weather, cyclone tracks and the monsoon.",
            "Western Disturbances steered by the STJ bring winter rain to NW India.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "seasonal reversal, monsoon burst/onset/withdrawal, monsoon trough",
            "sub-tropical jet (STJ), tropical easterly jet (TEJ), Somali jet, Tibetan heating",
            "ENSO, El Niño, La Niña, Indian Ocean Dipole, Western Disturbance",
          ],
        },
      ],
      examKeywords: ["monsoon", "jet stream", "tropical easterly jet", "Tibetan plateau", "ENSO", "Indian Ocean Dipole", "ITCZ"],
      answerLanguage: [
        "\"The dynamic theory explains the monsoon through upper-air jet streams and Tibetan heating, not thermal contrast alone.\"",
        "\"Inter-annual monsoon variability is strongly modulated by ENSO and the Indian Ocean Dipole.\"",
      ],
      pyq: [
        { q: "Examine the jet-stream theory of the Indian monsoon and contrast it with the thermal concept." },
        { q: "Discuss the role of ENSO and the Indian Ocean Dipole in monsoon variability." },
      ],
    },
    {
      id: "airmasses-fronts-cyclones",
      title: "Air masses, fronts & cyclones",
      syllabusTag: "Air masses and fronto-genesis; temperate and tropical cyclones",
      hook: "A diagram question waiting to happen — the temperate-vs-tropical cyclone contrast is the classic 15-marker.",
      blocks: [
        {
          type: "para",
          text: "An AIR MASS is a large body of air with fairly uniform temperature and humidity, acquired over a source region (e.g. maritime tropical mT, continental polar cP). When contrasting air masses meet, they do not mix readily; they form a sloping boundary — a FRONT (fronto-genesis). Fronts are zones of cloud and precipitation and the breeding ground of temperate cyclones.",
        },
        {
          type: "diagram",
          id: "air-mass-fronts",
          caption: "A mid-latitude cyclone: warm sector between an advancing cold front and a warm front.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Temperate vs tropical cyclone — the core contrast",
          items: [
            "Origin: temperate along the polar front (frontal); tropical over warm (>26.5°C) oceans (non-frontal, convective).",
            "Energy: temperate from horizontal temperature contrast; tropical from latent heat of condensation.",
            "Structure: temperate large, fronts present, no calm eye; tropical compact, no fronts, distinct eye + eyewall.",
            "Season/region: temperate in winter mid-latitudes; tropical in late summer/autumn tropics (e.g. Bay of Bengal).",
          ],
        },
        {
          type: "points",
          heading: "Life cycle & hazards",
          items: [
            "Temperate cyclone: incipient → mature (warm sector) → occlusion → dissipation.",
            "Tropical cyclone: formation, intensification, landfall; hazards are wind, storm surge and flooding.",
            "Storm surge is the chief killer in delta coasts (e.g. Bay of Bengal).",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "air mass (mT, cP, mP, cT), source region, fronto-genesis, occlusion",
            "warm/cold/occluded front, warm sector, polar front",
            "eye, eyewall, latent heat, storm surge, landfall",
          ],
        },
      ],
      examKeywords: ["air mass", "front", "fronto-genesis", "temperate cyclone", "tropical cyclone", "occlusion", "storm surge"],
      answerLanguage: [
        "\"Tropical cyclones derive energy from latent heat over warm seas, whereas temperate cyclones feed on frontal temperature contrasts.\"",
        "\"Fronto-genesis along the polar front is the seedbed of mid-latitude depressions.\"",
      ],
      pyq: [
        { q: "Compare and contrast temperate and tropical cyclones with suitable diagrams." },
        { q: "What are air masses? Explain fronto-genesis and the types of fronts." },
      ],
    },
    {
      id: "precipitation-classification",
      title: "Precipitation & climate classification",
      syllabusTag: "Types and distribution of precipitation; Köppen, Thornthwaite, Trewartha",
      hook: "Get the basis of each classification right and the comparative question writes itself.",
      blocks: [
        {
          type: "para",
          text: "Precipitation requires saturation, condensation nuclei, and uplift/cooling. By the mechanism of uplift we get CONVECTIONAL (equatorial, summer afternoons), OROGRAPHIC (windward of mountains, with rain-shadow leeward) and CYCLONIC/frontal rainfall. The micro-physics works through the Bergeron–Findeisen (ice-crystal) process in cool clouds and the collision–coalescence process in warm clouds.",
        },
        {
          type: "points",
          heading: "The three classic schemes",
          items: [
            "Köppen — EMPIRICAL & quantitative: uses monthly temperature and precipitation thresholds to define groups A (tropical), B (dry), C (warm temperate), D (cold), E (polar), with letter sub-codes (e.g. Aw, BWh, Cfb).",
            "Thornthwaite — based on a rational water balance: precipitation effectiveness (P/E) and thermal efficiency, giving moisture and temperature provinces.",
            "Trewartha — a modified, simplified Köppen with a clearer treatment of the mid-latitudes and a separate highland (H) type.",
          ],
        },
        {
          type: "diagram",
          id: "koppen-climate",
          caption: "Köppen's five major climate groups (A–E) by temperature/precipitation thresholds.",
        },
        {
          type: "callout",
          tone: "key",
          title: "How to critique (this earns the marks)",
          items: [
            "Köppen: simple, mappable, vegetation-linked — but empirical, ignores air masses/genesis, fixed boundaries.",
            "Thornthwaite: physically sound (water balance) — but complex and data-hungry.",
            "Trewartha: pragmatic improvement — yet still essentially descriptive.",
            "All are descriptive (empirical) rather than genetic (cause-based) — the key line of criticism.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "convectional / orographic / cyclonic rainfall, rain shadow",
            "Bergeron process, collision–coalescence, condensation nuclei",
            "empirical vs genetic classification, precipitation effectiveness, thermal efficiency",
          ],
        },
      ],
      examKeywords: ["orographic rainfall", "rain shadow", "Köppen", "Thornthwaite", "Trewartha", "empirical classification", "Bergeron process"],
      answerLanguage: [
        "\"Köppen's scheme is empirical and vegetation-anchored, whereas Thornthwaite's rests on a rational water balance.\"",
        "\"The chief limitation of all three is that they are descriptive rather than genetic.\"",
      ],
      pyq: [
        { q: "Critically evaluate Köppen's classification of world climates." },
        { q: "Compare the climatic classifications of Köppen and Thornthwaite." },
      ],
    },
    {
      id: "climate-change-applied",
      title: "Climate change & applied / urban climatology",
      syllabusTag: "Hydrological cycle; global climatic change; man's role; applied & urban climate",
      hook: "The contemporary, high-scoring frontier — connect mechanism, evidence, response, and the city.",
      blocks: [
        {
          type: "para",
          text: "Climate changes on every timescale. NATURAL forcings include orbital variations (Milankovitch cycles), solar output, and volcanic aerosols; evidence comes from ice cores, tree rings and ocean sediments. The ANTHROPOGENIC signal — an enhanced greenhouse effect from CO2, CH4, N2O and halocarbons — has dominated the recent warming, amplified by feedbacks (ice-albedo, water vapour).",
        },
        {
          type: "points",
          heading: "Mechanism, impacts, response",
          items: [
            "Greenhouse mechanism: greenhouse gases absorb outgoing long-wave radiation and re-emit it, warming the lower atmosphere.",
            "Impacts: sea-level rise, glacier retreat, monsoon variability, extreme events, shifting climate zones.",
            "Response — Mitigation (cut emissions, renewables, carbon sinks) and Adaptation (resilient agriculture, coastal defence).",
            "Governance: UNFCCC, Kyoto, Paris Agreement, IPCC assessments.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Applied & urban climatology",
          items: [
            "Urban Heat Island (UHI): cities are warmer than surroundings due to concrete/asphalt heat storage, waste heat and reduced evapotranspiration.",
            "Pollution dome and reduced visibility, intensified by temperature inversions.",
            "Applications: bioclimatic building design, agro-climatology, climate in town planning and disaster risk.",
          ],
        },
        {
          type: "diagram",
          id: "urban-heat-island",
          caption: "Temperature profile peaks over the dense city core — the urban heat island.",
        },
        {
          type: "callout",
          tone: "link",
          title: "Links for extra marks",
          items: [
            "Tie to Environment and GS-III (disaster management, sustainable development).",
            "Bring an Indian angle: Himalayan glacier retreat, monsoon shifts, coastal vulnerability of deltas/cities.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "greenhouse effect, radiative forcing, feedback, Milankovitch cycles",
            "mitigation, adaptation, UNFCCC, IPCC, carbon sink",
            "urban heat island, pollution dome, bioclimatology, hydrological cycle",
          ],
        },
      ],
      examKeywords: ["greenhouse effect", "global warming", "Milankovitch cycles", "mitigation", "adaptation", "urban heat island", "hydrological cycle"],
      answerLanguage: [
        "\"The recent warming reflects an enhanced greenhouse effect amplified by positive feedbacks such as the ice-albedo loop.\"",
        "\"The urban heat island is the clearest signature of human modification of local climate.\"",
      ],
      pyq: [
        { year: "2019", q: "Examine the role of man in global climatic change and suggest response strategies." },
        { q: "Describe the causes and consequences of the urban heat island effect." },
      ],
    },
  ],
};

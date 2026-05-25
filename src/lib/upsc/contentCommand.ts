export type ContentAssetStatus = "Planned" | "Drafted" | "Ready";
export type ContentSourceType = "Local" | "Demo" | "Recorded" | "Live" | "External";

export type ContentState = {
  videoStatus: ContentAssetStatus;
  notesStatus: ContentAssetStatus;
  transcriptStatus: ContentAssetStatus;
  sourceType: ContentSourceType;
  contentNote?: string;
  lessonTitle?: string;
  lessonPromise?: string;
  notesPreview?: string[];
  transcriptSummary?: string;
  studentHandoff?: string;
  updatedAt?: string;
};

export const UPSC_CONTENT_COMMAND_STORAGE_KEY = "sarit-upsc-content-command-v1";

export const defaultContentState: ContentState = {
  videoStatus: "Planned",
  notesStatus: "Planned",
  transcriptStatus: "Planned",
  sourceType: "Local",
  contentNote: "Planned placeholder: content is not broken, but the real class pack is not yet staged for this day.",
};

const geographyClassPacks: Record<number, ContentState> = {
  1: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Earth as a System: Origin, Structure, Coordinates, and Time",
    lessonPromise: "By the end, the student can explain Earth as interacting spheres and use latitude, longitude, time, scale, and direction without treating them as isolated facts.",
    notesPreview: [
      "Earth system = lithosphere, atmosphere, hydrosphere, and biosphere exchanging energy and matter.",
      "Latitude controls insolation pattern; longitude anchors local time and standard time logic.",
      "Rotation creates day-night rhythm; revolution and axial tilt create seasonal variation.",
      "Map scale and direction turn conceptual geography into location proof for UPSC statements.",
      "UPSC trap: one factor rarely explains the whole outcome; always test interaction and exception.",
    ],
    transcriptSummary:
      "Start with Earth as interacting spheres. Move into location logic: latitude, longitude, rotation, revolution, time zones, map scale, and direction. Close with India/world examples and the common UPSC trap of overgeneralizing one location factor.",
    studentHandoff:
      "Explain Earth as a system through spheres, energy flow, coordinates, time, map scale, one India/world example, and one UPSC trap. Do not list terms without mechanism.",
    contentNote:
      "Day 1 local class pack is staged: 75-minute lesson structure, notes preview, transcript summary, and Talk handoff are ready for controlled testing.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  2: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Interior of the Earth: Layers, Density, and Seismic Evidence",
    lessonPromise: "The student can infer crust, mantle, core, discontinuities, and material states from seismic wave behavior instead of memorizing layer names.",
    notesPreview: [
      "Earth interior is inferred mainly from seismic waves, density, meteorites, gravity, and magnetic evidence.",
      "S-waves do not pass through liquids; P-wave speed and bending reveal material changes.",
      "Moho, Gutenberg, and Lehmann discontinuities mark changes in composition or state.",
      "Crust is thin and variable; mantle drives convection; outer core is liquid and inner core is solid.",
      "UPSC trap: layer depth, material state, and wave behavior are often mixed in statement questions.",
    ],
    transcriptSummary:
      "Move from evidence to inference: why direct drilling is limited, how P and S waves behave, how discontinuities are detected, and why density/state changes explain the layered Earth model.",
    studentHandoff:
      "Explain Earth interior through evidence first, then layers, discontinuities, wave behavior, and one UPSC trap about S-waves or core state.",
    contentNote:
      "Day 2 class pack is staged with seismic evidence logic, layer notes, transcript summary, and Talk handoff for Interior of the Earth.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  3: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Plate Tectonics: Drift, Boundaries, Ridges, Trenches, and Hazards",
    lessonPromise: "The student can explain why earthquakes, volcanoes, mountains, trenches, and ridges cluster along plate margins.",
    notesPreview: [
      "Continental drift proposed movement; sea-floor spreading supplied ocean-floor evidence.",
      "Divergent boundaries create ridges and new crust; convergent boundaries create trenches, arcs, and mountains.",
      "Transform boundaries generate earthquakes without major crust creation or destruction.",
      "Distribution of earthquakes and volcanoes is map evidence for plate margins.",
      "UPSC trap: not every plate boundary creates volcanoes, and boundary type decides hazard pattern.",
    ],
    transcriptSummary:
      "Build tectonics as a map pattern: drift evidence, spreading, subduction, boundary types, and the hazard logic behind earthquakes, volcanoes, ridges, trenches, and mountains.",
    studentHandoff:
      "Explain plate tectonics with one boundary type, one landform, one hazard map cue, and one trap about volcano distribution or transform margins.",
    contentNote:
      "Day 3 class pack is staged for tectonic mechanism, boundary map logic, and hazard distribution proof.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  4: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Geomorphic Processes: Weathering, Mass Wasting, Erosion, and Deposition",
    lessonPromise: "The student can separate process, agent, landform, climate control, and slope control in physical geography questions.",
    notesPreview: [
      "Endogenic forces create relief; exogenic forces wear, transport, and deposit material.",
      "Weathering breaks rock in place, erosion removes material, deposition builds landforms.",
      "Mass wasting depends on slope, gravity, water, vegetation, and triggers.",
      "Climate decides whether chemical or mechanical weathering dominates.",
      "UPSC trap: process and landform are often swapped; agent and result must match.",
    ],
    transcriptSummary:
      "Organize landform study through cause-process-result: weathering, mass movement, erosion, transportation, deposition, and how climate or slope changes the dominant process.",
    studentHandoff:
      "Explain one geomorphic process through agent, mechanism, landform, climate control, and a trap that confuses erosion with weathering.",
    contentNote:
      "Day 4 class pack is staged for geomorphic process discipline and Disaster Link lab handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  5: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Climatology Base: Insolation, Heat Budget, Pressure Belts, and Winds",
    lessonPromise: "The student can derive pressure and wind systems from unequal heating, pressure gradient, Coriolis force, and seasonal belt shifts.",
    notesPreview: [
      "Insolation varies with latitude, angle of incidence, duration, cloud cover, and surface character.",
      "Heat budget explains why atmosphere-ocean circulation redistributes energy.",
      "Pressure gradient moves air from high to low pressure; Coriolis deflects moving air.",
      "Pressure belts shift with apparent movement of the sun and control major wind systems.",
      "UPSC trap: wind direction, pressure belts, and Coriolis deflection are often reversed.",
    ],
    transcriptSummary:
      "Start with unequal heating, then connect heat budget, pressure gradient, Coriolis force, pressure belts, planetary winds, and why seasonal shifts matter for monsoon logic.",
    studentHandoff:
      "Explain air movement through pressure gradient and Coriolis, then connect belts and winds to one UPSC trap about direction or seasonal shift.",
    contentNote:
      "Day 5 class pack is staged for climatology base and Monsoon Simulator preparation.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  6: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Ocean System: Relief, Salinity, Temperature, and Currents",
    lessonPromise: "The student can connect ocean currents with climate, deserts, rainfall, fog, fisheries, and coastal map patterns.",
    notesPreview: [
      "Ocean relief includes continental shelf, slope, abyssal plains, ridges, and trenches.",
      "Temperature and salinity vary with latitude, evaporation, precipitation, ice, rivers, and circulation.",
      "Warm currents usually add heat and moisture; cold currents can support deserts, fog, and upwelling.",
      "Current-location pairs matter more than isolated current names.",
      "UPSC trap: salinity alone does not explain fisheries, and warm/cold current effects can be reversed in statements.",
    ],
    transcriptSummary:
      "Build ocean logic from relief to water properties to circulation, then map current effects on climate, fog, deserts, rainfall, and fisheries using location-specific examples.",
    studentHandoff:
      "Explain one current-location pair through temperature, salinity/upwelling, climate effect, and one trap about deserts or fisheries.",
    contentNote:
      "Day 6 class pack is staged for ocean-current map logic and MCQ readiness handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  7: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Physical Geography Consolidation: Earth, Tectonics, Landforms, Climate, and Ocean Integration",
    lessonPromise: "The student can connect the first six physical geography days into one UPSC-style cause-map-trap framework.",
    notesPreview: [
      "Earth system and coordinates provide the location language for all later physical geography.",
      "Earth interior and plates explain relief, hazards, mountains, volcanoes, and ocean-floor patterns.",
      "Geomorphic processes modify relief through weathering, erosion, transport, and deposition.",
      "Climate and ocean systems redistribute heat, moisture, pressure, and currents across the map.",
      "UPSC trap: integrated questions combine two systems, so isolated memorized facts are not enough.",
    ],
    transcriptSummary:
      "Review Days 1-6 as a connected system: location, Earth structure, tectonics, landforms, climate, and ocean. Close with integrated examples and a first weak-topic list.",
    studentHandoff:
      "Explain one integrated physical geography chain using location, tectonics or landform, climate/ocean effect, and one UPSC trap.",
    contentNote:
      "Day 7 consolidation pack is staged with integrated recap, weak-topic generation, and mixed physical geography drill handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  8: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "India Physiography: Himalayas, Plains, Plateau, Desert, Coasts, and Islands",
    lessonPromise: "The student can read India relief as the base layer behind rivers, monsoon, soils, agriculture, resources, and disaster risk.",
    notesPreview: [
      "India physiography is best learned as connected relief zones, not as isolated regions.",
      "Himalayas influence drainage, monsoon uplift, earthquakes, landslides, and frontier passes.",
      "Northern plains are depositional, fertile, flood-prone, and shaped by Himalayan river systems.",
      "Peninsular plateau, desert, coasts, and islands each create different resource, climate, and hazard patterns.",
      "UPSC trap: physiographic boundaries and state examples are often mixed with climate, river, or soil statements.",
    ],
    transcriptSummary:
      "Start with India relief as a map framework. Move through Himalayas, northern plains, peninsular plateau, desert, coastal plains, and islands. Close by connecting relief with rivers, monsoon, soils, agriculture, resources, and hazard risk.",
    studentHandoff:
      "Explain India physiography through one relief division, its map location, river or climate impact, economic use, and one UPSC trap about boundary or state-location confusion.",
    contentNote:
      "Day 8 India Physiography class pack is staged for India Map Command with relief-to-risk logic and Talk handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  9: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Indian Drainage: Himalayan Rivers, Peninsular Rivers, Basins, and Tributaries",
    lessonPromise: "The student can explain river behavior through origin, slope, basin, rainfall, sediment, and seasonal flow instead of memorizing tributary lists.",
    notesPreview: [
      "Himalayan rivers are mostly perennial, snow-rain fed, young, and sediment-rich.",
      "Peninsular rivers are older, rainfall-fed, seasonal in many stretches, and controlled by plateau slope.",
      "River basin questions require origin, flow direction, tributaries, states, and outlet logic together.",
      "Flood, erosion, delta, estuary, and irrigation patterns come from drainage behavior.",
      "UPSC trap: tributaries, left/right bank, source states, and east/west flowing rivers are commonly swapped.",
    ],
    transcriptSummary:
      "Build drainage from river origin and slope. Compare Himalayan and peninsular systems, then map major basins, tributary logic, deltas, estuaries, floods, and irrigation implications.",
    studentHandoff:
      "Explain one Indian river system through source, slope, basin, tributary, state path, outlet, and one trap about tributary or flow direction.",
    contentNote:
      "Day 9 Indian Drainage class pack is staged with basin behavior, tributary traps, and map drill handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  10: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Indian Monsoon: ITCZ, Jet Streams, Onset, Break, Retreat, and Variability",
    lessonPromise: "The student can explain monsoon as a moving pressure-wind-rainfall system with regional variation and uncertainty.",
    notesPreview: [
      "Monsoon begins with land-sea thermal contrast, pressure gradient, ITCZ movement, and moisture-laden winds.",
      "Southwest monsoon branches, relief barriers, and rain-shadow zones explain uneven rainfall.",
      "Jet streams, western disturbances, ENSO/IOD signals, and local factors influence variability.",
      "Onset, active-break phases, and retreat must be read as sequence, not one static event.",
      "UPSC trap: monsoon mechanism questions often reverse wind direction, branch behavior, or rainfall region.",
    ],
    transcriptSummary:
      "Teach monsoon as sequence: heating and pressure, ITCZ shift, wind reversal, Arabian Sea and Bay of Bengal branches, relief rainfall, rain shadow, active-break rhythm, retreat, and variability drivers.",
    studentHandoff:
      "Explain monsoon in five steps with one branch, one rainfall contrast, one variability factor, and one UPSC trap about direction or region.",
    contentNote:
      "Day 10 Indian Monsoon class pack is staged for Monsoon Simulator, mechanism recall, and regional rainfall proof.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  11: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Climate Regions of India: Rainfall, Temperature, Western Disturbances, and Local Controls",
    lessonPromise: "The student can explain why Indian climate varies sharply across nearby regions using relief, winds, distance from sea, latitude, and disturbances.",
    notesPreview: [
      "India climate is controlled by latitude, altitude, relief, distance from sea, pressure systems, and winds.",
      "Rainfall distribution depends on monsoon branches, Western Ghats, Himalayas, and rain-shadow zones.",
      "Western disturbances bring winter precipitation to northwest India and snow to Himalayan regions.",
      "Temperature range differs between coastal, interior, desert, mountain, and plateau regions.",
      "UPSC trap: rainfall amount, season, wind source, and regional examples are often mismatched.",
    ],
    transcriptSummary:
      "Move from climate controls to regional outcomes: rainfall zones, temperature contrasts, western disturbances, local winds, and why neighboring places can show different climate signatures.",
    studentHandoff:
      "Explain one Indian climate region through control factors, rainfall season, temperature pattern, map example, and one trap about western disturbances or rain shadow.",
    contentNote:
      "Day 11 Climate Regions of India class pack is staged with regional climate proof and rainfall-map handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  12: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Soils and Vegetation: Soil Types, Forest Types, Distribution, and Conservation",
    lessonPromise: "The student can connect soil and vegetation with parent rock, climate, relief, drainage, crops, degradation, and conservation.",
    notesPreview: [
      "Soil distribution depends on parent material, climate, relief, drainage, organisms, and time.",
      "Alluvial, black, red-yellow, laterite, desert, mountain, and saline soils each carry region-crop limits.",
      "Vegetation types follow rainfall, temperature, altitude, soil, and human pressure.",
      "Soil erosion, salinity, desertification, and forest degradation create geography-environment overlap.",
      "UPSC trap: soil color, crop suitability, rainfall zone, and state examples are commonly cross-matched incorrectly.",
    ],
    transcriptSummary:
      "Build soils from formation factors, then map major Indian soil types, crop suitability, constraints, forest distribution, conservation concerns, and the bridge into Environment topics.",
    studentHandoff:
      "Explain one soil or vegetation type through formation factor, region, crop or species link, limitation, conservation issue, and one UPSC trap.",
    contentNote:
      "Day 12 Soils and Vegetation class pack is staged with Environment Bridge handoff and soil-location-crop discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  13: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Resources and Agriculture: Minerals, Energy, Irrigation, Crops, and Agro-Climatic Logic",
    lessonPromise: "The student can explain resource and crop location through geology, relief, water, climate, transport, market, and policy constraints.",
    notesPreview: [
      "Mineral belts follow geology; energy geography adds location, transport, demand, and environmental cost.",
      "Agriculture depends on soil, rainfall, temperature, irrigation, market access, and technology.",
      "Crop belts must be linked with agro-climatic conditions and changing policy or water stress.",
      "Irrigation and groundwater create productivity gains as well as salinity, depletion, and equity issues.",
      "UPSC trap: crop-region pairs, mineral-state belts, and irrigation impacts are often overgeneralized.",
    ],
    transcriptSummary:
      "Connect resources and agriculture to location logic: mineral belts, energy zones, irrigation systems, crop suitability, agro-climatic regions, constraints, and contemporary sustainability traps.",
    studentHandoff:
      "Explain one crop, mineral, or energy resource through location factor, state/region, economic use, sustainability issue, and one UPSC trap.",
    contentNote:
      "Day 13 Resources and Agriculture class pack is staged for map-resource-crop integration and mixed MCQ readiness.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  14: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "India Map Drill: Relief, Rivers, Climate, Soils, Resources, and Agriculture Integration",
    lessonPromise: "The student can convert two weeks of Geography into blank-map recall, cause chains, and UPSC-style integrated explanation.",
    notesPreview: [
      "Start every India map drill with relief because it explains drainage, climate, soil, settlement, and risk.",
      "Add river basins, rainfall zones, soil belts, mineral belts, crop belts, and hazard-prone regions layer by layer.",
      "Integrated recall is stronger than state-wise lists because UPSC often combines two map layers.",
      "Weak locations should become revisit cards with cause, map cue, and one statement trap.",
      "UPSC trap: mixed map questions can combine correct facts from different regions into one false statement.",
    ],
    transcriptSummary:
      "Run a Week 2 consolidation: India relief, drainage, monsoon, climate regions, soils, vegetation, resources, and agriculture as layered map proof. Close with weak-area tagging and mixed MCQ readiness.",
    studentHandoff:
      "Explain one India map chain across relief, river or climate, soil or crop, resource or hazard, and one trap that mixes facts from different regions.",
    contentNote:
      "Day 14 India Map Drill consolidation pack is staged with blank-map recall, weak-area generation, and mixed drill handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  15: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Population Geography: Density, Distribution, Migration, and Demographic Transition",
    lessonPromise: "The student can explain population patterns through physical base, resources, economy, services, risk, and migration instead of only memorizing census terms.",
    notesPreview: [
      "Population density is not the same as distribution; density is ratio, distribution is spatial pattern.",
      "Relief, climate, soil, water, transport, jobs, safety, and services explain why people cluster or avoid regions.",
      "Migration can be push-pull, seasonal, forced, voluntary, rural-urban, inter-state, or international.",
      "Demographic transition links birth rate, death rate, growth, age structure, and development stage.",
      "UPSC trap: density, growth rate, fertility, migration, and distribution are often treated as interchangeable.",
    ],
    transcriptSummary:
      "Start with the difference between density and distribution. Build causes of population concentration, migration logic, demographic transition, age structure, urban pull, regional examples, and exam traps around population indicators.",
    studentHandoff:
      "Explain one population pattern through physical factor, economic factor, migration factor, demographic indicator, map example, and one UPSC trap.",
    contentNote:
      "Day 15 Population Geography class pack is staged for human geography launch and India map linkage.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  16: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Settlements: Rural, Urban, Hierarchy, Morphology, and Function",
    lessonPromise: "The student can classify settlements by site, situation, function, pattern, hierarchy, and urban growth pressure.",
    notesPreview: [
      "Settlement site is the exact location; situation is the wider relation to routes, rivers, markets, or resources.",
      "Rural settlement patterns depend on relief, water, landholding, safety, caste/community, and agriculture.",
      "Urban hierarchy moves from small towns to metropolitan regions through function, services, and connectivity.",
      "Morphology explains compact, linear, dispersed, radial, grid, and planned settlement forms.",
      "UPSC trap: settlement pattern, function, hierarchy, and site-situation terms are often cross-matched.",
    ],
    transcriptSummary:
      "Teach settlements through site and situation, rural morphology, urban hierarchy, functional classification, growth drivers, Indian examples, and traps around confusing shape, function, and scale.",
    studentHandoff:
      "Explain one settlement type through site, situation, morphology, function, hierarchy, Indian example, and one UPSC trap.",
    contentNote:
      "Day 16 Settlements class pack is staged with site-situation discipline and map-based examples.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  17: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Economic Activities: Primary, Secondary, Tertiary, Quaternary, and Quinary Sectors",
    lessonPromise: "The student can explain how economic activities shift with resources, technology, markets, services, and development.",
    notesPreview: [
      "Primary activities extract or use natural resources; secondary activities transform raw material into goods.",
      "Tertiary activities provide services; quaternary and quinary activities involve knowledge, research, decision, and high-order services.",
      "Economic structure changes as productivity, urbanization, education, infrastructure, and technology change.",
      "Location still matters even in service economies through skilled labor, networks, data, markets, and policy.",
      "UPSC trap: activity sectors are often confused when one activity includes extraction, processing, and service links together.",
    ],
    transcriptSummary:
      "Move from sector classification to transition logic: primary, secondary, tertiary, quaternary, quinary, structural change, examples from India, and why sector categories overlap in real economies.",
    studentHandoff:
      "Explain one economic activity through sector, input, location factor, technology or market link, development change, and one UPSC trap.",
    contentNote:
      "Day 17 Economic Activities class pack is staged with sector classification and development-shift handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  18: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Transport and Trade: Networks, Ports, Corridors, Connectivity, and Regional Change",
    lessonPromise: "The student can explain connectivity as a force that changes settlement, industry, agriculture, trade, and regional development.",
    notesPreview: [
      "Transport networks reduce friction of distance and reshape market access, specialization, and regional growth.",
      "Ports, corridors, railways, highways, waterways, and pipelines each carry different spatial advantages.",
      "Connectivity can integrate regions but also create corridor-led inequality and ecological pressure.",
      "Trade routes are shaped by geography, cost, security, infrastructure, policy, and demand.",
      "UPSC trap: corridor names, port locations, hinterland links, and transport-mode advantages are often mismatched.",
    ],
    transcriptSummary:
      "Build transport geography from network logic: nodes, routes, corridors, ports, hinterland, trade flow, regional change, and the risks of memorizing corridor names without map orientation.",
    studentHandoff:
      "Explain one corridor, port, or network through location, hinterland, economic effect, regional risk, and one UPSC trap.",
    contentNote:
      "Day 18 Transport and Trade class pack is staged with corridor-port-network map discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  19: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Industry Location: Input, Labor, Power, Market, Transport, Policy, and Industrial Regions",
    lessonPromise: "The student can compare old and new industrial regions through changing input, market, technology, labor, and policy logic.",
    notesPreview: [
      "Traditional industry location depends on raw material, power, labor, water, transport, market, and capital.",
      "Modern industry adds skilled labor, innovation, data, logistics, policy support, and global value chains.",
      "Old industrial regions often reflect coal, iron ore, ports, rail, and colonial-market links.",
      "New industrial regions can form around services, electronics, automobiles, petrochemicals, or IT clusters.",
      "UPSC trap: factor-example questions often mix an old industrial factor with a new industrial region.",
    ],
    transcriptSummary:
      "Teach industrial location as changing logic: Weber-style input-market thinking, traditional resource-based regions, port-based industries, policy-led clusters, IT/electronics logic, and trap pairs.",
    studentHandoff:
      "Explain one industry through raw material or market factor, transport, labor or technology, region, policy/environment issue, and one UPSC trap.",
    contentNote:
      "Day 19 Industry Location class pack is staged with factor-example comparison and regional industry map handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  20: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Regional Development: Planning Regions, Disparities, Urbanization, and Sustainability",
    lessonPromise: "The student can explain regional inequality through geography, infrastructure, governance, resources, urbanization, and sustainability constraints.",
    notesPreview: [
      "Regional development differs because resource base, location, connectivity, human capital, and institutions differ.",
      "Planning regions can be functional, administrative, resource-based, river-basin based, or problem-region based.",
      "Urbanization can drive growth while creating housing, transport, waste, water, and pollution stress.",
      "Backwardness and growth poles must be read through both geography and governance.",
      "UPSC trap: disparity questions often confuse cause, indicator, planning unit, and policy solution.",
    ],
    transcriptSummary:
      "Connect geography with development: regional disparity, planning regions, growth centers, urbanization pressure, sustainability, governance linkages, and how to frame prelims plus mains-ready examples.",
    studentHandoff:
      "Explain one regional development issue through location factor, infrastructure or governance factor, indicator, policy response, sustainability risk, and one UPSC trap.",
    contentNote:
      "Day 20 Regional Development class pack is staged with governance-geography bridge and sustainability framing.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  21: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Human Geography Consolidation: Population, Settlements, Economy, Transport, Industry, and Regions",
    lessonPromise: "The student can integrate human and economic geography into one map-cause-development framework for prelims and mains.",
    notesPreview: [
      "Population distribution, settlements, and economic activity are connected by resources, jobs, safety, and services.",
      "Transport and trade networks restructure settlements, industry, markets, and regional inequality.",
      "Industrial and regional development questions require both physical base and human decision logic.",
      "Week 3 consolidation should produce weak-topic cards for indicators, examples, and map links.",
      "UPSC trap: integrated human geography statements can combine correct sector, location, and policy facts in the wrong relationship.",
    ],
    transcriptSummary:
      "Review Days 15-20 as one system: population, settlement, economic sectors, connectivity, industry, regional development, and how human geography connects physical location with policy and economy.",
    studentHandoff:
      "Explain one integrated human geography chain through population or settlement, economic activity, transport or industry, regional outcome, and one UPSC trap.",
    contentNote:
      "Day 21 Human Geography Consolidation pack is staged with weak-topic generation and mixed human geography drill handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  22: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Atlas Mastery: World and India Orientation, Recurring Locations, and Map Recall",
    lessonPromise: "The student can turn atlas reading into exam-relevant recall by attaching each location to cause, feature, region, and current relevance.",
    notesPreview: [
      "Atlas mastery is not memorizing all maps; it is knowing recurring UPSC locations with context.",
      "Every map location should carry direction, neighboring regions, physical feature, and human or current-affairs link.",
      "India and world maps must be revised through layers: relief, rivers, climate, resources, biodiversity, ports, and borders.",
      "Speed improves when map recall is tied to cause and region rather than plain labels.",
      "UPSC trap: correct map facts from nearby regions are often mixed to create a false location statement.",
    ],
    transcriptSummary:
      "Convert atlas reading into exam logic: orientation, recurring locations, neighboring regions, physical features, resource and biodiversity layers, current-affairs locations, and quick recall drills.",
    studentHandoff:
      "Explain one atlas location through direction, neighboring area, physical feature, human or current link, and one UPSC trap about wrong regional pairing.",
    contentNote:
      "Day 22 Atlas Mastery class pack is staged with map recall, location context, and recurring UPSC location discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  23: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "PYQ Pattern Reading: Statement Traps, Pair Matching, Exceptions, and Recurring Themes",
    lessonPromise: "The student can read Geography PYQs by identifying what UPSC is actually testing: concept, map, exception, pair, or current-static link.",
    notesPreview: [
      "PYQ pattern reading separates difficulty from trap design.",
      "Geography statements commonly test process order, map location, exception, pair matching, and cause-effect validity.",
      "A correct fact can become wrong when attached to the wrong region, season, current, soil, crop, or hazard.",
      "PYQs should be tagged by trap type so revision repairs the thinking error, not only the fact.",
      "UPSC trap: two true statements can still form a false explanation if cause and effect are not linked.",
    ],
    transcriptSummary:
      "Study PYQs through trap architecture: statement logic, pair matching, exception handling, recurring themes, elimination cues, and how to turn wrong options into revision cards.",
    studentHandoff:
      "Explain one PYQ-style trap through tested concept, location or process, why the statement is tempting, why it fails, and how to avoid it.",
    contentNote:
      "Day 23 PYQ Pattern Reading class pack is staged with MCQ Engine handoff and trap-tagging discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  24: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Disaster Geography Bridge: Cyclones, Floods, Droughts, Landslides, and Earthquakes",
    lessonPromise: "The student can connect physical geography with disaster risk by separating hazard, exposure, vulnerability, capacity, and response.",
    notesPreview: [
      "A hazard becomes a disaster when exposure, vulnerability, and low capacity combine.",
      "Cyclones depend on warm seas, pressure, wind, coast shape, storm surge, and preparedness.",
      "Floods, droughts, landslides, and earthquakes each require location-specific cause and vulnerability analysis.",
      "Disaster geography links physical process with governance, land use, infrastructure, and early warning.",
      "UPSC trap: hazard cause, vulnerable region, mitigation tool, and responsible institution are often mismatched.",
    ],
    transcriptSummary:
      "Bridge physical geography and disaster management: hazard types, location logic, exposure, vulnerability, mitigation, early warning, land-use choices, and how to frame answer-ready examples.",
    studentHandoff:
      "Explain one disaster through hazard mechanism, vulnerable region, exposure, mitigation, institution or policy link, and one UPSC trap.",
    contentNote:
      "Day 24 Disaster Geography Bridge class pack is staged with disaster-link lab handoff and risk framework discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  25: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Environment Geography Bridge: Biomes, Climate Change, Biodiversity, and Conservation Regions",
    lessonPromise: "The student can see how Environment questions begin with geography: climate, biome, habitat, species range, and conservation location.",
    notesPreview: [
      "Biomes are controlled by temperature, rainfall, latitude, altitude, soil, and seasonality.",
      "Biodiversity patterns depend on habitat, corridors, endemism, climate gradients, and human pressure.",
      "Climate change questions require geographic exposure: coasts, mountains, drylands, forests, islands, and urban zones.",
      "Conservation regions should be read with species, habitat, state, river basin, mountain range, or coast.",
      "UPSC trap: species, habitat, protected area, state, and climate zone are often cross-matched incorrectly.",
    ],
    transcriptSummary:
      "Connect geography to Environment: biomes, ecological gradients, biodiversity hotspots, protected areas, climate-risk regions, conservation geography, and map-linked species/habitat traps.",
    studentHandoff:
      "Explain one environment-geography link through biome or habitat, climate factor, species or conservation region, map cue, and one UPSC trap.",
    contentNote:
      "Day 25 Environment Geography Bridge class pack is staged with Environment Bridge handoff and conservation-location discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  26: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Mains Geography Application: Concepts, Diagrams, Maps, Examples, and 10-Marker Structure",
    lessonPromise: "The student can convert geography knowledge into answer-writing structure with map support, diagrams, examples, and balanced conclusion.",
    notesPreview: [
      "A strong Geography mains answer begins with definition or context, then mechanism, map/diagram, example, and conclusion.",
      "Maps and diagrams must clarify the answer, not decorate it.",
      "Physical, India, human, environment, and disaster geography can all support answer examples.",
      "Examples should include location, cause, impact, and policy or way-forward where relevant.",
      "UPSC trap: answers often list facts without causal flow, spatial evidence, or conclusion discipline.",
    ],
    transcriptSummary:
      "Teach answer conversion: intro, concept mechanism, map or diagram, India/world examples, data or case support, balanced conclusion, and how to avoid fact-dump answers.",
    studentHandoff:
      "Explain one Geography mains answer structure through intro, mechanism, map or diagram, example, conclusion, and one trap that weakens the answer.",
    contentNote:
      "Day 26 Mains Geography Application class pack is staged with answer-writing and diagram discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  27: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Full Geography Drill: Physical, India, Human, Atlas, Environment, and Disaster Integration",
    lessonPromise: "The student can run a full subject recap and connect chapters through cause, location, process, impact, and trap logic.",
    notesPreview: [
      "Full Geography revision must move across physical base, India map, human geography, environment bridge, and disaster bridge.",
      "Integrated questions often combine one process with one location and one impact.",
      "Final drills should expose weak areas by chapter, map zone, concept type, and question-trap type.",
      "Every wrong answer should become a repair card with cause, map cue, and trap.",
      "UPSC trap: integrated questions can make students use the right fact in the wrong chapter context.",
    ],
    transcriptSummary:
      "Run the full subject drill across all Geography blocks, generate weak-area heatmap, classify mistakes, and prepare the student for final mixed MCQ and revision routing.",
    studentHandoff:
      "Explain one integrated Geography chain through concept, location, impact, related chapter, weak area, and one UPSC trap.",
    contentNote:
      "Day 27 Full Geography Drill class pack is staged with subject-wide integration and heatmap handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  28: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Weak Area Repair: Personalized Recovery, Retest Logic, and Revision Scheduling",
    lessonPromise: "The student can diagnose repeated Geography mistakes and repair them through targeted revisit, map proof, and fresh retest.",
    notesPreview: [
      "Weak area repair begins by separating knowledge gap, map recall gap, concept confusion, and reading error.",
      "Repeated mistakes need root-cause repair, not more random practice.",
      "A good revisit card includes concept, map cue, example, trap, and retest question type.",
      "Retest should use fresh questions after the repair proof is saved.",
      "UPSC trap: students often revise the whole chapter when only one process, location, or trap type is weak.",
    ],
    transcriptSummary:
      "Build a personalized repair workflow: mistake classification, weak-topic cards, revisit proof, map correction, retest planning, and final revision scheduling.",
    studentHandoff:
      "Explain one weak area through mistake type, root cause, repair action, map or concept proof, retest plan, and one trap to avoid.",
    contentNote:
      "Day 28 Weak Area Repair class pack is staged with recovery workflow, retest logic, and revision queue handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  29: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Final Mock and Review: Error Analysis, Map Repair, and 24-Hour Revision Queue",
    lessonPromise: "The student can convert final mock mistakes into a clean repair list instead of only seeing a score.",
    notesPreview: [
      "Final mock review should classify mistakes as knowledge gap, map error, statement-reading error, overconfidence, or time pressure.",
      "Map repair should target wrong locations, neighboring regions, direction, feature, and cause link.",
      "Every wrong question needs a short correction and a retest cue.",
      "The 24-hour revision queue should prioritize repeated and high-value mistakes.",
      "UPSC trap: mock score can hide whether the real issue is content, attention, map recall, or confidence.",
    ],
    transcriptSummary:
      "Guide final mock review through score interpretation, mistake classification, map repair, high-yield revision queue, retest priorities, and confidence control before command day.",
    studentHandoff:
      "Explain one mock mistake through category, correct concept, map or process repair, retest cue, priority, and one trap that caused the error.",
    contentNote:
      "Day 29 Final Mock and Review class pack is staged with mock analysis and final revision queue discipline.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
  30: {
    videoStatus: "Ready",
    notesStatus: "Ready",
    transcriptStatus: "Ready",
    sourceType: "Local",
    lessonTitle: "Geography Command Day: Final Recall, Maps, Examples, Confidence, and Revision Lock",
    lessonPromise: "The student can close Geography with full-syllabus recall, final map confidence, and a clean next revision plan.",
    notesPreview: [
      "Command Day checks whether every major Geography theme can be explained through cause and location.",
      "Final recall should cover physical systems, India map, human geography, atlas, environment bridge, and disaster bridge.",
      "Confidence should be based on proof: Watch completion, Talk score, Lab proof, MCQ practice, and revisit closure.",
      "Revision lock means scheduling the next review dates before moving to the next subject.",
      "UPSC trap: feeling familiar with topics is not the same as being able to explain and apply them under exam pressure.",
    ],
    transcriptSummary:
      "Close the 30-day Geography sprint with full recall, final map checks, example bank, confidence audit, revision scheduling, and criteria for command-ready versus retest-needed.",
    studentHandoff:
      "Explain Geography command status through strongest area, weakest area, map confidence, retest need, revision date, and one final UPSC trap.",
    contentNote:
      "Day 30 Geography Command Day class pack is staged with final recall, confidence audit, and revision-lock handoff.",
    updatedAt: "2026-05-24T00:00:00.000Z",
  },
};

export function contentKey(subjectSlug: string, day: number) {
  return `${subjectSlug}:D${String(day).padStart(2, "0")}`;
}

export function getDefaultContentState(subjectSlug: string, day: number): ContentState {
  if (subjectSlug === "geography" && geographyClassPacks[day]) return geographyClassPacks[day];
  return defaultContentState;
}

export function readContentStates() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(UPSC_CONTENT_COMMAND_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, ContentState>) : {};
  } catch {
    return {};
  }
}

export function writeContentStates(states: Record<string, ContentState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UPSC_CONTENT_COMMAND_STORAGE_KEY, JSON.stringify(states));
}

export function getContentState(states: Record<string, ContentState>, subjectSlug: string, day: number) {
  return {
    ...getDefaultContentState(subjectSlug, day),
    ...states[contentKey(subjectSlug, day)],
  };
}

export function readContentState(subjectSlug: string, day: number) {
  return getContentState(readContentStates(), subjectSlug, day);
}

export function isContentReady(state: ContentState) {
  return state.videoStatus === "Ready" && state.notesStatus === "Ready" && state.transcriptStatus === "Ready";
}

export function sourceTypeLabel(sourceType?: ContentSourceType) {
  if (sourceType === "Demo" || sourceType === "Local") return "Local class pack";
  return sourceType ?? "Local class pack";
}

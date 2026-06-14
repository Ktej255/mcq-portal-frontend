export type GeographyTopicPart =
  | "Physical Geography"
  | "Climatology"
  | "Oceanography"
  | "Indian Physiography and Drainage"
  | "Indian Economic Geography"
  | "World Geography"
  | "Human Geography"
  | "Political and Current Geography";

export type GeographyCoverageMode = "direct-day" | "compressed-day";

export type GeographyModuleReadiness = "pilot-module" | "draft-module" | "legacy-watch-only" | "module-needed";

export type GeographyTopicGroup = {
  id: number;
  title: string;
  part: GeographyTopicPart;
  plannedDay: number;
  coverageMode: GeographyCoverageMode;
  moduleReadiness: GeographyModuleReadiness;
  subtopicCount: number;
  auditNote: string;
};

function topic(
  id: number,
  title: string,
  part: GeographyTopicPart,
  plannedDay: number,
  coverageMode: GeographyCoverageMode,
  subtopicCount: number,
  auditNote: string,
  moduleReadiness: GeographyModuleReadiness = "module-needed"
): GeographyTopicGroup {
  return { id, title, part, plannedDay, coverageMode, moduleReadiness, subtopicCount, auditNote };
}

export const geographyTopicGroups: GeographyTopicGroup[] = [
  topic(1, "Earth and Its Origin", "Physical Geography", 2, "direct-day", 4, "Universe pilot module covers the recall layout, but the Earth-origin PDF bullets still need final approved section depth.", "pilot-module"),
  topic(2, "Interior of the Earth", "Physical Geography", 3, "direct-day", 6, "Day 3 draft module now covers interior evidence, layers, lithosphere, asthenosphere, and core state traps.", "draft-module"),
  topic(3, "Seismology", "Physical Geography", 3, "direct-day", 9, "Day 3 draft module now covers seismic waves, shadow zones, earthquake terms, belts, and Indian seismic risk.", "draft-module"),
  topic(4, "Plate Tectonics", "Physical Geography", 3, "direct-day", 12, "Day 3 draft module now covers plate boundaries, movement evidence, Indian Plate collision, and Himalaya formation.", "draft-module"),
  topic(5, "Volcanoes", "Physical Geography", 4, "direct-day", 8, "Day 4 draft module now covers volcano formation, types, features, distribution, India examples, and news bridge.", "draft-module"),
  topic(6, "Rocks and Rock Cycle", "Physical Geography", 4, "direct-day", 12, "Day 4 draft module now covers rock type logic, Indian examples, and rock-cycle transformation.", "draft-module"),
  topic(7, "Geomorphology - Landform Development", "Physical Geography", 4, "direct-day", 18, "Day 4 draft module now splits process discipline from agent-specific landforms.", "draft-module"),
  topic(8, "Fluvial Landforms", "Physical Geography", 4, "compressed-day", 18, "Day 4 draft module now gives fluvial landforms a visible slide and cumulative recall points.", "draft-module"),
  topic(9, "Glacial Landforms", "Physical Geography", 4, "compressed-day", 7, "Day 4 draft module now covers glacial landforms and GLOF as a current-affairs bridge.", "draft-module"),
  topic(10, "Aeolian Landforms", "Physical Geography", 4, "compressed-day", 11, "Day 4 draft module now covers dunes, loess, desert surfaces, wadis, and oasis logic.", "draft-module"),
  topic(11, "Coastal Landforms", "Physical Geography", 4, "compressed-day", 7, "Day 4 draft module now covers coastal erosion/deposition, reefs, bleaching, and mangroves.", "draft-module"),
  topic(12, "Karst Landforms", "Physical Geography", 4, "compressed-day", 5, "Day 4 draft module now covers limestone solution, caves, surface forms, and Indian karst cues.", "draft-module"),
  topic(13, "Atmosphere - Composition and Structure", "Climatology", 5, "direct-day", 8, "Day 5 draft module now covers atmospheric gases, layers, layer functions, and statement traps.", "draft-module"),
  topic(14, "Insolation and Heat Budget", "Climatology", 5, "direct-day", 7, "Day 5 draft module now covers insolation controls, albedo, heat budget, terrestrial radiation, and greenhouse effect.", "draft-module"),
  topic(15, "Temperature Distribution", "Climatology", 5, "compressed-day", 7, "Day 5 draft module now gives temperature distribution explicit slide visibility with controls, isotherms, continentality, and inversion.", "draft-module"),
  topic(16, "Pressure Belts and Winds", "Climatology", 5, "direct-day", 10, "Day 5 draft module now covers pressure belts, planetary winds, Coriolis logic, ITCZ shift, and monsoon handoff.", "draft-module"),
  topic(17, "Jet Streams", "Climatology", 5, "compressed-day", 7, "Day 5 draft module now gives jet streams explicit slide visibility with western disturbance, monsoon, and Rossby-wave links.", "draft-module"),
  topic(18, "Local Winds", "Climatology", 5, "compressed-day", 7, "Day 5 draft module now gives local winds explicit drill-card visibility with hot/cold winds and breeze circulation.", "draft-module"),
  topic(19, "Humidity and Precipitation", "Climatology", 6, "direct-day", 10, "Day 6 draft module now covers humidity measures, saturation, condensation, and rainfall types.", "draft-module"),
  topic(20, "Air Masses and Fronts", "Climatology", 6, "compressed-day", 5, "Day 6 draft module now gives air masses and front types an explicit slide with cumulative recall points.", "draft-module"),
  topic(21, "Cyclones and Anticyclones", "Climatology", 6, "direct-day", 11, "Day 6 draft module now covers low/high pressure logic, tropical cyclone conditions, anticyclones, and current links.", "draft-module"),
  topic(22, "Indian Monsoon", "Climatology", 7, "direct-day", 16, "Day 7 draft module now covers monsoon mechanism, circulation, relief controls, distribution, and impacts.", "draft-module"),
  topic(23, "El Nino, La Nina, IOD, MJO", "Climatology", 7, "direct-day", 6, "Day 7 draft module now covers ENSO, IOD, MJO, active-break spells, and monsoon variability traps.", "draft-module"),
  topic(24, "World Climate Classification", "Climatology", 6, "compressed-day", 11, "Day 6 draft module now gives Koppen/world climate classification its own indexed section.", "draft-module"),
  topic(25, "Ocean Floor Topography", "Oceanography", 6, "direct-day", 9, "Day 6 draft module now covers shelf, slope, rise, abyssal plain, ridges, trenches, seamounts, guyots, and canyons.", "draft-module"),
  topic(26, "Ocean Salinity", "Oceanography", 6, "direct-day", 5, "Day 6 draft module now covers salinity controls and distribution traps.", "draft-module"),
  topic(27, "Ocean Temperature", "Oceanography", 6, "direct-day", 3, "Day 6 draft module now covers thermocline, vertical temperature logic, and density links.", "draft-module"),
  topic(28, "Ocean Currents", "Oceanography", 6, "direct-day", 11, "Day 6 draft module now covers warm/cold currents, boundary currents, upwelling, and climate effects.", "draft-module"),
  topic(29, "Tides", "Oceanography", 6, "direct-day", 6, "Day 6 draft module now covers spring/neap tide logic and tide-current trap separation.", "draft-module"),
  topic(30, "EEZ, Continental Shelf, Maritime Zones", "Oceanography", 7, "direct-day", 9, "Day 7 draft module now covers territorial sea, contiguous zone, EEZ, continental shelf, blue economy, and legal traps.", "draft-module"),
  topic(31, "Overview of Indian Physiography", "Indian Physiography and Drainage", 8, "direct-day", 2, "Day 8 draft module now frames India physiography as one connected relief map.", "draft-module"),
  topic(32, "The Himalayas", "Indian Physiography and Drainage", 8, "direct-day", 10, "Day 8 draft module now covers Himalayan origin, divisions, features, and hazard-current links.", "draft-module"),
  topic(33, "Himalayan Passes", "Indian Physiography and Drainage", 8, "compressed-day", 13, "Day 8 draft module now gives Himalayan passes explicit map-drill visibility and strategic linkage.", "draft-module"),
  topic(34, "Northern Plains", "Indian Physiography and Drainage", 8, "direct-day", 9, "Day 8 draft module now covers alluvial origin, regional divisions, Bhabar-Terai-Bhangar-Khadar, and flood/agriculture links.", "draft-module"),
  topic(35, "Peninsular Plateau", "Indian Physiography and Drainage", 8, "direct-day", 10, "Day 8 draft module now covers plateau blocks, Ghats contrast, rift valleys, black soil, and drainage exceptions.", "draft-module"),
  topic(36, "Coastal Plains", "Indian Physiography and Drainage", 8, "direct-day", 6, "Day 8 draft module now covers western/eastern coastal contrast, deltas, ports, cyclone, and erosion links.", "draft-module"),
  topic(37, "Islands", "Indian Physiography and Drainage", 8, "direct-day", 10, "Day 8 draft module now covers Andaman-Nicobar island arc, Barren Island, Lakshadweep coral origin, and maritime strategy.", "draft-module"),
  topic(38, "Drainage System Overview", "Indian Physiography and Drainage", 9, "direct-day", 12, "Day 9 draft module now covers drainage controls, basins, watersheds, and drainage patterns.", "draft-module"),
  topic(39, "Indus River System", "Indian Physiography and Drainage", 9, "direct-day", 6, "Day 9 draft module now covers Indus route, Punjab tributaries, treaty links, and map traps.", "draft-module"),
  topic(40, "Ganga River System", "Indian Physiography and Drainage", 9, "direct-day", 8, "Day 9 draft module now covers Ganga source streams, tributary banks, plains, delta, pollution, and navigation links.", "draft-module"),
  topic(41, "Brahmaputra River System", "Indian Physiography and Drainage", 9, "direct-day", 7, "Day 9 draft module now covers Brahmaputra route names, braided channels, floods, erosion, and current links.", "draft-module"),
  topic(42, "Peninsular Rivers - East Flowing", "Indian Physiography and Drainage", 9, "direct-day", 6, "Day 9 draft module now covers Mahanadi-Godavari-Krishna-Kaveri east-flowing delta systems.", "draft-module"),
  topic(43, "Peninsular Rivers - West Flowing", "Indian Physiography and Drainage", 9, "direct-day", 6, "Day 9 draft module now covers Narmada-Tapi rift exceptions and other west-flowing rivers.", "draft-module"),
  topic(44, "Lakes of India", "Indian Physiography and Drainage", 9, "direct-day", 12, "Day 9 draft module now covers lake origin types and major Indian lake map examples.", "draft-module"),
  topic(45, "Wetlands and Ramsar Sites", "Indian Physiography and Drainage", 9, "direct-day", 5, "Day 9 draft module now covers wetland functions, Ramsar logic, and ecological trap patterns.", "draft-module"),
  topic(46, "Soil Classification and Types", "Indian Economic Geography", 10, "direct-day", 20, "Day 10 draft module now covers Indian soil types, formation logic, location-property-crop pairing, and soil map traps.", "draft-module"),
  topic(47, "Soil Erosion and Degradation", "Indian Economic Geography", 10, "direct-day", 9, "Day 10 draft module now covers erosion types, degradation causes, conservation methods, and land-degradation current links.", "draft-module"),
  topic(48, "Forest Types of India", "Indian Economic Geography", 10, "direct-day", 11, "Day 10 draft module now covers evergreen, deciduous, thorn, montane, alpine, littoral, swamp, and mangrove forest logic.", "draft-module"),
  topic(49, "Forest Cover and Policy", "Indian Economic Geography", 10, "direct-day", 9, "Day 10 draft module now covers forest cover classes, forest area/tree cover distinction, policy instruments, and conservation issues.", "draft-module"),
  topic(50, "Cropping Seasons", "Indian Economic Geography", 11, "direct-day", 6, "Day 11 draft module now covers Kharif, Rabi, Zaid, crop examples, and season-condition traps.", "draft-module"),
  topic(51, "Major Crops and Top Producing States", "Indian Economic Geography", 11, "direct-day", 20, "Day 11 draft module now covers crop-condition-state mapping for major food, cash, plantation, millet, pulse, oilseed, and horticulture crops.", "draft-module"),
  topic(52, "Agricultural Revolutions", "Indian Economic Geography", 11, "direct-day", 10, "Day 11 draft module now covers Green, White, Blue, Yellow, Golden, Silver, Pink, and commodity-colour traps.", "draft-module"),
  topic(53, "Irrigation in India", "Indian Economic Geography", 11, "direct-day", 8, "Day 11 draft module now covers canal, well, tube well, tank, drip, sprinkler, micro-irrigation, and water stress.", "draft-module"),
  topic(54, "Food Security and Agricultural Policy", "Indian Economic Geography", 11, "direct-day", 14, "Day 11 draft module now covers food security pillars, MSP, procurement, buffer stock, PDS, NFSA, and nutrition diversity.", "draft-module"),
  topic(55, "Agricultural Issues", "Indian Economic Geography", 11, "direct-day", 9, "Day 11 draft module now covers small holdings, price/market risk, storage, crop diversification, water stress, climate risk, and farmer income.", "draft-module"),
  topic(56, "Ferrous Minerals", "Indian Economic Geography", 12, "direct-day", 5, "Day 12 draft module now covers iron ore belts, manganese, chromite, uses, and map traps.", "draft-module"),
  topic(57, "Non-Ferrous Minerals", "Indian Economic Geography", 12, "direct-day", 10, "Day 12 draft module now covers bauxite, aluminium, copper, lead-zinc, mica, limestone, and state-use pairing.", "draft-module"),
  topic(58, "Critical Minerals", "Indian Economic Geography", 12, "direct-day", 7, "Day 12 draft module now covers lithium, cobalt, nickel, rare earths, graphite, clean tech, and supply-chain security.", "draft-module"),
  topic(59, "Energy Resources", "Indian Economic Geography", 12, "direct-day", 6, "Day 12 draft module now covers coal, oil, gas, hydro, nuclear, solar, wind, green hydrogen, and transition geography.", "draft-module"),
  topic(60, "Iron and Steel Industry", "Indian Economic Geography", 12, "direct-day", 4, "Day 12 draft module now covers steel location factors, major plants, inland/coastal contrast, and plant-state traps.", "draft-module"),
  topic(61, "Textile Industry", "Indian Economic Geography", 12, "direct-day", 4, "Day 12 draft module now covers cotton, jute, silk, woollen, handloom, powerloom, synthetic textile geography, and cluster traps.", "draft-module"),
  topic(62, "Industrial Corridors", "Indian Economic Geography", 12, "direct-day", 8, "Day 12 draft module now covers corridor components, major corridors, freight/logistics, industrial nodes, and impact traps.", "draft-module"),
  topic(63, "Ports and Maritime Trade", "Indian Economic Geography", 13, "direct-day", 12, "Day 13 draft module now covers ports, maritime trade, hinterlands, cargo logic, shipping lanes, and port-map traps.", "draft-module"),
  topic(64, "Road Transport", "Indian Economic Geography", 13, "direct-day", 7, "Day 13 draft module now covers road hierarchy, terrain controls, border roads, market access, and impact traps.", "draft-module"),
  topic(65, "Railway Transport", "Indian Economic Geography", 13, "direct-day", 5, "Day 13 draft module now covers railway density, freight corridors, port evacuation, mineral-industrial belts, and rail-map traps.", "draft-module"),
  topic(66, "Inland Waterways", "Indian Economic Geography", 13, "direct-day", 7, "Day 13 draft module now covers navigability, national waterways, cargo suitability, multimodal links, and river-ecology limits.", "draft-module"),
  topic(67, "World Physiography", "World Geography", 14, "direct-day", 8, "Day 14 draft module now covers continental relief, mountains, plateaus, basins, deserts, rifts, and map-pair traps.", "draft-module"),
  topic(68, "World Rivers", "World Geography", 14, "direct-day", 10, "Day 14 draft module now covers major world rivers, basin logic, source-mouth patterns, deltas/estuaries, and current links.", "draft-module"),
  topic(69, "World Lakes", "World Geography", 14, "direct-day", 9, "Day 14 draft module now covers major world lakes, origin types, salinity/depth logic, and ecological/geopolitical links.", "draft-module"),
  topic(70, "Straits and Channels", "World Geography", 14, "direct-day", 15, "Day 14 draft module now covers major straits/channels, connects-separates logic, maritime chokepoints, and strategic traps.", "draft-module"),
  topic(71, "World Biomes", "World Geography", 14, "direct-day", 10, "Day 14 draft module now covers biome climate-vegetation logic, location examples, threats, and latitude/rainfall traps.", "draft-module"),
  topic(72, "Population Geography", "Human Geography", 15, "direct-day", 10, "Day 15 draft module now covers population distribution, density, demographic transition, age structure, fertility, and regional factors.", "draft-module"),
  topic(73, "Migration Geography", "Human Geography", 15, "direct-day", 6, "Day 15 draft module now covers migration classification, push-pull factors, networks, climate/conflict links, and origin-destination effects.", "draft-module"),
  topic(74, "Urban Geography", "Human Geography", 15, "direct-day", 10, "Day 15 draft module now covers site-situation, urban hierarchy, functions, land use, metropolitan growth, and urban stress.", "draft-module"),
  topic(75, "Cultural Geography", "Human Geography", 15, "direct-day", 7, "Day 15 draft module now covers cultural regions, language, religion, ethnicity, tribe, diffusion, identity, and stereotype traps.", "draft-module"),
  topic(76, "India's Borders", "Political and Current Geography", 16, "direct-day", 10, "Day 16 draft module now covers India's borders, terrain, neighbors, border management, strategic geography, and map traps.", "draft-module"),
  topic(77, "Northeast India", "Political and Current Geography", 16, "direct-day", 6, "Day 16 draft module now covers Northeast terrain, connectivity, Siliguri Corridor, identity, autonomy, ecology, and security.", "draft-module"),
  topic(78, "Tribal Geography", "Political and Current Geography", 16, "direct-day", 8, "Day 16 draft module now covers tribal regions, livelihood, forest/land rights, displacement, development, and stereotype traps.", "draft-module"),
  topic(79, "Geopolitical Geography in News 2023-2025", "Political and Current Geography", 17, "direct-day", 6, "Day 17 draft module now converts geopolitical news into borders, routes, chokepoints, resources, and static map logic.", "draft-module"),
  topic(80, "Connectivity and Infrastructure Geography", "Political and Current Geography", 17, "direct-day", 5, "Day 17 draft module now covers corridors, ports, roads, tunnels, digital networks, hinterlands, and tradeoffs.", "draft-module"),
  topic(81, "Climate Change Geography", "Political and Current Geography", 17, "direct-day", 6, "Day 17 draft module now covers place-specific climate risks across glaciers, coasts, cities, agriculture, and adaptation.", "draft-module"),
  topic(82, "Disaster Geography Recent Events", "Political and Current Geography", 17, "direct-day", 7, "Day 17 draft module now covers hazard, exposure, vulnerability, capacity, mitigation, and recent-event answer framing.", "draft-module"),
];

export function getGeographyTopicGroupsForDay(day: number) {
  return geographyTopicGroups.filter((group) => group.plannedDay === day);
}

export function getGeographyTopicCoverageSummary() {
  const total = geographyTopicGroups.length;
  const direct = geographyTopicGroups.filter((group) => group.coverageMode === "direct-day").length;
  const compressed = geographyTopicGroups.filter((group) => group.coverageMode === "compressed-day").length;
  const pilotModules = geographyTopicGroups.filter((group) => group.moduleReadiness === "pilot-module").length;
  const draftModules = geographyTopicGroups.filter((group) => group.moduleReadiness === "draft-module").length;
  const moduleNeeded = geographyTopicGroups.filter((group) => group.moduleReadiness === "module-needed").length;
  const legacyOnly = geographyTopicGroups.filter((group) => group.moduleReadiness === "legacy-watch-only").length;

  return {
    total,
    direct,
    compressed,
    pilotModules,
    draftModules,
    moduleNeeded,
    legacyOnly,
    mappedPercent: Math.round(((direct + compressed) / Math.max(total, 1)) * 100),
    moduleReadyPercent: Math.round(((pilotModules + draftModules) / Math.max(total, 1)) * 100),
  };
}

export function getGeographyCompressedCoverageGroups() {
  return geographyTopicGroups.filter((group) => group.coverageMode === "compressed-day");
}

export function getGeographyModuleGapGroups() {
  return geographyTopicGroups.filter((group) => group.moduleReadiness === "module-needed");
}

import { geographySessions } from "@/lib/upsc/plan";
import { subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";

export type CurrentAffairsBridgeSubject = {
  slug: string;
  title: string;
  window: string;
  sessions: SubjectSession[];
};

export type CurrentAffairsBridgeItem = {
  id: string;
  subjectSlug: string;
  subjectTitle: string;
  linkedDay: number;
  linkedTopic: string;
  issueHook: string;
  staticBridge: string;
  prelimsUse: string;
  mainsUse: string;
  revisionPrompt: string;
  sourceStatus: "daily-source-pending" | "ready-for-class";
};

export const currentAffairsSubjects: CurrentAffairsBridgeSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    sessions: geographySessions,
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    sessions: plan.sessions,
  })),
];

export const geographyCurrentAffairsBridge: CurrentAffairsBridgeItem[] = [
  {
    id: "geo-day-02-space-earth-observation",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 2,
    linkedTopic: "Earth, Universe, and Location",
    issueHook: "Earth-observation satellites, mapping data, and disaster-monitoring updates.",
    staticBridge: "Connect latitude, longitude, orbit, sensor coverage, and spatial resolution before reading the news item.",
    prelimsUse: "Location, instrument, and application traps around remote sensing and GIS.",
    mainsUse: "Use as evidence for governance, disaster preparedness, agriculture, and climate monitoring answers.",
    revisionPrompt: "Explain why satellite imagery is useful only when location, scale, and time-series logic are understood.",
    sourceStatus: "daily-source-pending",
  },
  {
    id: "geo-day-05-monsoon-forecast",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 5,
    linkedTopic: "Climatology",
    issueHook: "Monsoon variability, heat waves, western disturbances, El Nino/La Nina, and seasonal forecasts.",
    staticBridge: "Attach every update to pressure belts, jet streams, ITCZ movement, and local relief controls.",
    prelimsUse: "Terminology traps around monsoon onset, withdrawal, rainfall distribution, and climate drivers.",
    mainsUse: "Use for agriculture, water stress, urban heat, food inflation, and disaster-management answers.",
    revisionPrompt: "State the static climate mechanism first, then add the current update as a consequence.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-06-ocean-warming",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 6,
    linkedTopic: "Oceanography",
    issueHook: "Marine heatwaves, cyclones, sea-level rise, coral bleaching, and coastal erosion updates.",
    staticBridge: "Link the issue to currents, temperature, salinity, pressure, and coastal morphology.",
    prelimsUse: "Map-based traps around seas, currents, coral locations, and cyclone basins.",
    mainsUse: "Use for coastal governance, blue economy, climate adaptation, and disaster risk reduction.",
    revisionPrompt: "Explain one ocean process and one human consequence without using notes.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-08-himalayan-risk",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 8,
    linkedTopic: "India Relief and Physiography",
    issueHook: "Himalayan infrastructure, landslides, subsidence, glacial hazards, and seismic vulnerability.",
    staticBridge: "Read the update through young fold mountains, slope instability, drainage, and tectonic activity.",
    prelimsUse: "Himalayan ranges, passes, river origins, and state-wise hazard-location traps.",
    mainsUse: "Use for sustainable mountain development, carrying capacity, and disaster-management case studies.",
    revisionPrompt: "Give one physical cause and one planning failure behind a Himalayan risk story.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-09-river-basin",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 9,
    linkedTopic: "Drainage and River Systems",
    issueHook: "Floods, river pollution, groundwater stress, dam operations, and inter-basin transfer debates.",
    staticBridge: "Connect basin shape, slope, tributaries, rainfall regime, sediment, and human intervention.",
    prelimsUse: "River-origin, tributary, state, wetland, and project-location traps.",
    mainsUse: "Use for water governance, federalism, agriculture, urban flooding, and ecological flow arguments.",
    revisionPrompt: "Describe how one river-basin feature changes flood or drought risk.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-12-soil-degradation",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 12,
    linkedTopic: "Soils and Vegetation",
    issueHook: "Soil degradation, desertification, forest-fire alerts, invasive species, and restoration programs.",
    staticBridge: "Tie the update to soil type, rainfall, temperature, vegetation cover, slope, and land use.",
    prelimsUse: "Soil-distribution, vegetation-zone, protected-area, and convention traps.",
    mainsUse: "Use for agriculture productivity, ecosystem services, climate resilience, and land restoration.",
    revisionPrompt: "Name the soil or vegetation base first, then explain the current pressure.",
    sourceStatus: "daily-source-pending",
  },
  {
    id: "geo-day-13-resource-location",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 13,
    linkedTopic: "Resources and Agriculture",
    issueHook: "Critical minerals, renewable-energy siting, crop-pattern shifts, irrigation stress, and food security.",
    staticBridge: "Read every update through resource distribution, climate suitability, soil, market, and transport logic.",
    prelimsUse: "Mineral belts, crop regions, scheme-location, and resource-map traps.",
    mainsUse: "Use for agriculture reforms, energy transition, regional development, and climate adaptation.",
    revisionPrompt: "Explain why a crop or mineral is concentrated in one region before adding the news angle.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-14-map-governance",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 14,
    linkedTopic: "India Map Drill",
    issueHook: "Places in news, border regions, strategic corridors, geospatial policy, and map-based governance.",
    staticBridge: "Do not read the update without placing the site on the India map first.",
    prelimsUse: "State, district, river, pass, coastline, island, and neighboring-country traps.",
    mainsUse: "Use for security, infrastructure, regional planning, and disaster-response location proof.",
    revisionPrompt: "Point to the location, name the neighboring physical feature, and then explain why it matters.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-18-transport-corridor",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 18,
    linkedTopic: "Transport and Trade",
    issueHook: "Ports, freight corridors, logistics parks, inland waterways, and regional trade routes.",
    staticBridge: "Connect the update to hinterland, terrain, resource base, market access, and network effects.",
    prelimsUse: "Port, corridor, waterway, state, and route-location traps.",
    mainsUse: "Use for regional development, logistics efficiency, export competitiveness, and environment trade-offs.",
    revisionPrompt: "Explain how terrain and market decide whether a corridor succeeds.",
    sourceStatus: "daily-source-pending",
  },
  {
    id: "geo-day-24-disaster-geography",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 24,
    linkedTopic: "Disaster Geography Bridge",
    issueHook: "Cyclones, floods, landslides, earthquakes, GLOFs, droughts, and early-warning updates.",
    staticBridge: "Begin with hazard location, physical trigger, exposure, vulnerability, and capacity.",
    prelimsUse: "Hazard-prone state, river, mountain, coastline, and warning-agency traps.",
    mainsUse: "Use for risk reduction, preparedness, governance coordination, and climate adaptation.",
    revisionPrompt: "Convert one disaster event into hazard, exposure, vulnerability, and response points.",
    sourceStatus: "ready-for-class",
  },
  {
    id: "geo-day-25-environment-bridge",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    linkedDay: 25,
    linkedTopic: "Environment Geography Bridge",
    issueHook: "Protected areas, biodiversity hotspots, EIA debates, climate agreements, and conservation corridors.",
    staticBridge: "Attach the update to ecosystem location, climate, relief, human pressure, and governance instrument.",
    prelimsUse: "National park, sanctuary, convention, species, biome, and location traps.",
    mainsUse: "Use for conservation, livelihood, ecological security, and sustainable-development answers.",
    revisionPrompt: "Name the ecosystem first, then the governance instrument, then the current issue.",
    sourceStatus: "ready-for-class",
  },
];

const subjectIssueProfiles: Record<
  string,
  {
    issueFrame: string;
    prelimsFrame: string;
    mainsFrame: string;
  }
> = {
  environment: {
    issueFrame: "environment reports, protected-area updates, pollution events, climate negotiations, and conservation programs",
    prelimsFrame: "institution, species, convention, pollutant, ecosystem, and location traps",
    mainsFrame: "sustainable development, environmental governance, climate adaptation, and livelihood balance",
  },
  "disaster-management": {
    issueFrame: "hazard alerts, disaster reports, early-warning systems, relief operations, and resilience policies",
    prelimsFrame: "hazard type, agency, map location, vulnerability, and mitigation terminology traps",
    mainsFrame: "risk reduction, preparedness, response capacity, rehabilitation, and governance coordination",
  },
  economy: {
    issueFrame: "budget updates, RBI signals, inflation data, employment reports, trade shifts, and sectoral policy changes",
    prelimsFrame: "indicator, institution, scheme, data source, monetary-fiscal, and sector-classification traps",
    mainsFrame: "growth, inclusion, productivity, fiscal choices, markets, and welfare delivery",
  },
  "science-tech": {
    issueFrame: "space missions, AI regulation, biotechnology updates, defence technology, energy innovation, and cybersecurity events",
    prelimsFrame: "application, institution, technology principle, mission objective, and terminology traps",
    mainsFrame: "innovation governance, ethical risk, strategic capability, service delivery, and regulation",
  },
  "polity-governance": {
    issueFrame: "court judgments, bills, constitutional debates, welfare delivery, federal disputes, and institutional reforms",
    prelimsFrame: "article, body, procedure, power, limitation, and landmark-case traps",
    mainsFrame: "constitutional morality, accountability, federalism, rights, service delivery, and reform arguments",
  },
  "internal-security-society": {
    issueFrame: "security incidents, migration patterns, social indicators, cyber threats, border management, and welfare debates",
    prelimsFrame: "agency, threat type, legal tool, community, region, and demographic indicator traps",
    mainsFrame: "security-development balance, social justice, rights protection, resilience, and institutional response",
  },
  history: {
    issueFrame: "heritage sites, museum discoveries, culture schemes, anniversaries, GI tags, excavations, and archival debates",
    prelimsFrame: "site, period, school, text, personality, movement, and chronology traps",
    mainsFrame: "cultural continuity, historical interpretation, nationalism, social reform, and heritage governance",
  },
};

function profileFor(subjectSlug: string) {
  return (
    subjectIssueProfiles[subjectSlug] ?? {
      issueFrame: "official updates, policy debates, reports, data releases, and topic-linked news",
      prelimsFrame: "syllabus keyword, institution, data, map, and terminology traps",
      mainsFrame: "governance, society, economy, ethics, and implementation arguments",
    }
  );
}

function buildGeneratedCurrentAffairsBridge(subject: CurrentAffairsBridgeSubject): CurrentAffairsBridgeItem[] {
  if (subject.slug === "geography") return [];
  const profile = profileFor(subject.slug);

  return subject.sessions.map((session) => ({
    id: `${subject.slug}-day-${String(session.day).padStart(2, "0")}-current-bridge`,
    subjectSlug: subject.slug,
    subjectTitle: subject.title,
    linkedDay: session.day,
    linkedTopic: session.title,
    issueHook: `${session.title}: watch for ${profile.issueFrame}.`,
    staticBridge: `First connect the update to ${session.chapter}: ${session.anchor}. Only then attach the daily source.`,
    prelimsUse: `Use for ${profile.prelimsFrame} around ${session.title}.`,
    mainsUse: `Use for ${profile.mainsFrame}, anchored in ${session.chapter}.`,
    revisionPrompt: `Explain the static base of ${session.title}, then add one current example and one UPSC trap.`,
    sourceStatus: "ready-for-class",
  }));
}

export const allCurrentAffairsBridgeItems: CurrentAffairsBridgeItem[] = [
  ...geographyCurrentAffairsBridge,
  ...currentAffairsSubjects.flatMap(buildGeneratedCurrentAffairsBridge),
];

export function getCurrentAffairsSubject(slug: string) {
  return currentAffairsSubjects.find((subject) => subject.slug === slug) ?? currentAffairsSubjects[0];
}

export function getCurrentAffairsForSubject(subjectSlug: string) {
  return allCurrentAffairsBridgeItems.filter((item) => item.subjectSlug === subjectSlug);
}

export const currentAffairsBridgeSummary = {
  subjectCount: currentAffairsSubjects.length,
  totalItems: allCurrentAffairsBridgeItems.length,
  geographyItems: geographyCurrentAffairsBridge.length,
  readyForClass: allCurrentAffairsBridgeItems.filter((item) => item.sourceStatus === "ready-for-class").length,
  bySubject: currentAffairsSubjects.map((subject) => ({
    subjectSlug: subject.slug,
    subjectTitle: subject.title,
    items: getCurrentAffairsForSubject(subject.slug).length,
  })),
};

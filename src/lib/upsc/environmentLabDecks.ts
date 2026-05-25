import type { SubjectSession } from "@/lib/upsc/subjectPlans";

export type EnvironmentLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const environmentDecks: Record<string, Omit<EnvironmentLabDeckCard, "id">[]> = {
  "ecosystem-board": [
    {
      title: "Wetland Food Web",
      category: "Ecosystem",
      anchor: "Keoladeo-type wetland logic",
      detail: "Link producer biomass, aquatic insects, fish, migratory birds, water depth, and nutrient load.",
      examTrap: "Do not treat wetlands only as bird habitats; nutrient cycling and hydrology matter.",
      proofHint: "Explain one trophic transfer and one human disturbance in the same answer.",
    },
    {
      title: "Grassland Is Not Wasteland",
      category: "Habitat",
      anchor: "Dryland ecology",
      detail: "Grasslands support specialist species, pastoral livelihoods, carbon storage, and fire-grazing cycles.",
      examTrap: "Avoid assuming only forests are high-value ecosystems.",
      proofHint: "Use one grassland species or livelihood example to prove ecosystem value.",
    },
    {
      title: "Nutrient Cycle Break",
      category: "Cycle",
      anchor: "Nitrogen and phosphorus pressure",
      detail: "Fertilizer runoff changes nutrient balance, oxygen demand, algal growth, and aquatic biodiversity.",
      examTrap: "Nutrient enrichment can begin as productivity but end as ecosystem stress.",
      proofHint: "Trace nutrient source to ecological impact in five steps.",
    },
  ],
  "biodiversity-map": [
    {
      title: "Western Ghats Hotspot",
      category: "Hotspot",
      anchor: "Endemism plus pressure",
      detail: "Connect evergreen forests, amphibians, endemic plants, plantations, dams, roads, and fragmentation.",
      examTrap: "Hotspot status is about high endemism and high threat, not only species richness.",
      proofHint: "Attach one threat and one conservation response to the hotspot.",
    },
    {
      title: "Kaziranga Floodplain",
      category: "Protected Area",
      anchor: "River, grassland, corridor",
      detail: "Read the park through Brahmaputra floods, tall grasslands, rhino habitat, corridors, and human-wildlife conflict.",
      examTrap: "Flood is not only a disaster here; it also renews floodplain ecology.",
      proofHint: "Explain why corridor protection matters beyond the park boundary.",
    },
    {
      title: "Great Indian Bustard Landscape",
      category: "Species",
      anchor: "Grassland and power-line risk",
      detail: "Link dry grasslands, low reproductive rate, habitat conversion, power lines, and conservation breeding.",
      examTrap: "Do not classify grassland species protection as only forest management.",
      proofHint: "Use the species to prove why habitat category matters.",
    },
    {
      title: "Sundarbans Mangrove System",
      category: "Coast",
      anchor: "Delta, salinity, cyclone buffer",
      detail: "Connect tidal ecology, mangroves, tiger habitat, sea-level stress, embankments, and cyclone protection.",
      examTrap: "Mangroves are biodiversity, climate adaptation, and disaster-risk infrastructure together.",
      proofHint: "Build one answer line that links ecology with disaster management.",
    },
  ],
  "pollution-control": [
    {
      title: "Delhi Winter Smog Chain",
      category: "Air",
      anchor: "Source, inversion, PM load",
      detail: "Trace vehicles, dust, biomass burning, industrial emissions, low wind, inversion, PM2.5, and health impact.",
      examTrap: "Avoid one-cause answers; winter smog is source plus meteorology plus governance.",
      proofHint: "Separate source control from weather-driven accumulation.",
    },
    {
      title: "Eutrophication Sequence",
      category: "Water",
      anchor: "Nutrient to oxygen crash",
      detail: "Link sewage/fertilizer inflow, algal bloom, decomposition, dissolved oxygen fall, fish kill, and restoration.",
      examTrap: "More nutrients can reduce biodiversity after the oxygen crash.",
      proofHint: "Write BOD, DO, nutrient load, and algal bloom in correct sequence.",
    },
    {
      title: "Plastic Waste Leakage",
      category: "Waste",
      anchor: "Consumption to microplastic",
      detail: "Connect packaging, segregation failure, drains, rivers, coasts, microplastics, and producer responsibility.",
      examTrap: "Ban alone is not the full control chain; collection and market design matter.",
      proofHint: "Prove the chain through source, pathway, impact, and control.",
    },
  ],
  "climate-link": [
    {
      title: "Heat Action Plan",
      category: "Adaptation",
      anchor: "Warning to public-health response",
      detail: "Connect forecast, alert threshold, vulnerable groups, work-hour changes, cool shelters, and health systems.",
      examTrap: "Adaptation is not emission reduction; it reduces vulnerability to impact.",
      proofHint: "Use one city heat example to separate adaptation from mitigation.",
    },
    {
      title: "Himalayan Glacier Risk",
      category: "Cryosphere",
      anchor: "Warming, meltwater, GLOF",
      detail: "Link temperature rise, glacial retreat, unstable lakes, downstream hydropower, settlements, and early warning.",
      examTrap: "Glacier melt is climate science, disaster risk, and water security together.",
      proofHint: "Connect climate mechanism with one governance response.",
    },
    {
      title: "Mangrove Carbon And Buffer",
      category: "Nature-based solution",
      anchor: "Blue carbon plus cyclone protection",
      detail: "Mangroves store carbon, reduce storm surge impact, protect nursery habitats, and support livelihoods.",
      examTrap: "Nature-based solutions are not only biodiversity policies; they can serve climate and disaster goals.",
      proofHint: "Write one line linking mitigation, adaptation, and biodiversity.",
    },
  ],
  "convention-tracker": [
    {
      title: "Paris Agreement",
      category: "Climate",
      anchor: "NDC, transparency, stocktake",
      detail: "Map temperature goal, nationally determined contributions, transparency framework, finance, and global stocktake.",
      examTrap: "NDCs are nationally determined; do not read them as identical legally imposed targets.",
      proofHint: "Separate principle, pledge, review mechanism, and finance.",
    },
    {
      title: "CITES Appendix Logic",
      category: "Wildlife Trade",
      anchor: "Trade control, not habitat law",
      detail: "Use appendices to understand how international trade restrictions vary by threat and permitted conditions.",
      examTrap: "CITES regulates international trade; it is not the same as domestic protected-area notification.",
      proofHint: "Build a pair-matching trap between CITES and national parks.",
    },
    {
      title: "Ramsar Wise Use",
      category: "Wetlands",
      anchor: "Conservation with sustainable use",
      detail: "Connect wetland listing, ecological character, wise use, local livelihood, hydrology, and monitoring.",
      examTrap: "Ramsar listing does not automatically mean all human use is banned.",
      proofHint: "Explain wise use through one wetland service.",
    },
    {
      title: "Montreal Protocol",
      category: "Ozone",
      anchor: "Targeted substance phase-down",
      detail: "Read ozone protection through controlled substances, phase-out schedules, alternatives, and industry transition.",
      examTrap: "Do not mix ozone depletion with greenhouse effect as the same mechanism.",
      proofHint: "Write one contrast line between ozone protection and climate mitigation.",
    },
  ],
  "current-affairs": [
    {
      title: "Report-To-Static Bridge",
      category: "Reports",
      anchor: "Publisher, theme, indicator",
      detail: "Convert any environment report into publisher, core indicator, India relevance, static topic, and MCQ trap.",
      examTrap: "Do not memorize a report name without the institution and indicator logic.",
      proofHint: "Use a report as a source tag, then attach the static concept it tests.",
    },
    {
      title: "Species News Filter",
      category: "Species",
      anchor: "Habitat, threat, status, project",
      detail: "Turn species news into habitat, state/region, threat, conservation project, and legal/treaty hook.",
      examTrap: "Species questions often mix habitat, IUCN status, and project location.",
      proofHint: "Create one species-location-threat triangle.",
    },
    {
      title: "Policy Update Filter",
      category: "Policy",
      anchor: "Ministry, rule, instrument",
      detail: "Read policy news through responsible ministry, legal basis, target group, compliance instrument, and outcome.",
      examTrap: "Policy names matter less than objective, instrument, and institution.",
      proofHint: "Attach one policy tool to a source-pathway-impact-control chain.",
    },
  ],
};

function fallbackDeck(session: SubjectSession): EnvironmentLabDeckCard[] {
  return [
    {
      id: `${session.day}-fallback-case`,
      title: `${session.title} Case Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail: "Attach one place, institution, report, policy, species, or current-affairs example to the topic.",
      examTrap: "Avoid moving to MCQs without one applied proof.",
      proofHint: "Convert the selected topic into concept, example, trap, and revision hook.",
    },
  ];
}

export function getEnvironmentLabDeck(labSlug: string, session: SubjectSession): EnvironmentLabDeckCard[] {
  const deck = environmentDecks[labSlug];
  if (!deck) return fallbackDeck(session);

  return deck.map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug}-${index + 1}`,
  }));
}

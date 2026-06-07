export type GeographyDay24DisasterGeographyBridgeStage = {
  id: "hazard" | "exposure" | "vulnerability" | "capacity" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay24DisasterGeographyBridgeStages: GeographyDay24DisasterGeographyBridgeStage[] = [
  {
    id: "hazard",
    label: "Name the physical hazard",
    eyebrow: "Start with mechanism",
    explanation:
      "A cyclone, flood, drought, landslide, or earthquake begins as a physical hazard. First explain the process and locate the region where that process is plausible.",
    proof: "Hazard is the physical event. Disaster is the human outcome.",
  },
  {
    id: "exposure",
    label: "Locate what is exposed",
    eyebrow: "People and assets",
    explanation:
      "The same hazard produces different consequences when settlements, farms, roads, ports, power lines, or critical services occupy the affected area.",
    proof: "Exposure check: what lies in the path of the hazard?",
  },
  {
    id: "vulnerability",
    label: "Explain unequal vulnerability",
    eyebrow: "Why damage differs",
    explanation:
      "Housing quality, slope cutting, drainage, land use, poverty, ecosystem loss, and fragile infrastructure change how severely an exposed region is affected.",
    proof: "Do not treat two exposed regions as equally vulnerable.",
  },
  {
    id: "capacity",
    label: "Add capacity and response",
    eyebrow: "Risk can be reduced",
    explanation:
      "Early warning, evacuation, resilient infrastructure, land-use planning, ecosystem protection, relief coordination, and local preparedness reduce disaster risk.",
    proof: "Capacity check: identify one mitigation tool and one responsible institution.",
  },
  {
    id: "trap",
    label: "Reject the mismatch",
    eyebrow: "UPSC statement discipline",
    explanation:
      "A statement can contain real terms while pairing the wrong hazard cause, vulnerable region, mitigation tool, or institution. Verify every relationship.",
    proof: "Recall chain: hazard -> exposure -> vulnerability -> capacity -> verify.",
  },
];

export const geographyDay24PortalLesson = {
  title: "Disaster Geography Bridge",
  promise:
    "Connect physical geography with disaster management through hazard, exposure, vulnerability, capacity, response, and UPSC mismatch discipline.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native hazard-to-risk visual.",
  scenes: [
    {
      id: "24-briefing",
      kind: "briefing" as const,
      title: "Separate hazard from disaster",
      objective: "Begin with physical mechanism before discussing damage.",
      narration:
        "A cyclone, flood, drought, landslide, or earthquake is a physical hazard. It becomes a disaster when exposure, vulnerability, and weak capacity combine.",
      checkpoint:
        "Student can separate one hazard mechanism from its disaster outcome.",
      durationMinutes: 2,
    },
    {
      id: "24-mechanism",
      kind: "mechanism" as const,
      title: "Locate exposure and vulnerability",
      objective: "Explain why the same hazard produces unequal damage.",
      narration:
        "Trace people, infrastructure, land use, housing, slopes, drainage, ecosystems, and livelihoods inside the affected region before comparing outcomes.",
      checkpoint:
        "Student can identify one exposed asset and one vulnerability factor.",
      durationMinutes: 3,
    },
    {
      id: "24-map",
      kind: "map" as const,
      title: "Add mitigation and institutions",
      objective: "Connect geography with preparedness and governance.",
      narration:
        "Use early warning, evacuation, resilient infrastructure, land-use planning, ecosystem protection, relief coordination, and local preparedness as risk-reduction tools.",
      checkpoint:
        "Student can pair one mitigation tool with a responsible institution or policy link.",
      durationMinutes: 3,
    },
    {
      id: "24-trap",
      kind: "trap" as const,
      title: "Reject the cross-matched option",
      objective: "Prepare for near-correct disaster-geography statements.",
      narration:
        "Verify hazard cause, vulnerable region, mitigation tool, and institution independently. Reject the statement when one relationship is cross-matched.",
      checkpoint:
        "Student can identify the precise mismatch inside one tempting option.",
      durationMinutes: 2,
    },
    {
      id: "24-recap",
      kind: "recap" as const,
      title: "Explain one regional disaster",
      objective: "Move into discussion with one complete hazard-to-risk chain.",
      narration:
        "Choose one disaster. State the hazard mechanism, vulnerable region, exposure, vulnerability, mitigation tool, institution or policy link, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one disaster through a complete regional risk chain.",
      durationMinutes: 2,
    },
  ],
};

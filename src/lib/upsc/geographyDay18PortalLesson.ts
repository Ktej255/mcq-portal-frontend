export type GeographyDay18TransportTradeStage = {
  id: "network" | "modes" | "ports" | "change" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay18TransportTradeStages: GeographyDay18TransportTradeStage[] = [
  {
    id: "network",
    label: "Begin with network logic",
    eyebrow: "Nodes and routes",
    explanation:
      "Transport networks reduce friction of distance. Nodes, routes, junctions, corridors, and terminals reorganize access, specialization, and regional growth.",
    proof: "Start with the map: node -> route -> corridor -> market access -> regional effect.",
  },
  {
    id: "modes",
    label: "Compare transport modes",
    eyebrow: "Spatial advantage",
    explanation:
      "Railways, highways, waterways, air routes, and pipelines carry different cost, terrain, speed, volume, flexibility, and infrastructure advantages.",
    proof: "Trap: the best mode depends on cargo, distance, terrain, urgency, and network connection.",
  },
  {
    id: "ports",
    label: "Connect ports and hinterland",
    eyebrow: "Trade gateway",
    explanation:
      "A port is meaningful through its location, harbor conditions, hinterland, corridor links, cargo profile, security, and relation with domestic and global trade routes.",
    proof: "Map chain: port -> hinterland -> corridor -> cargo flow -> regional transformation.",
  },
  {
    id: "change",
    label: "Add regional change",
    eyebrow: "Growth and pressure",
    explanation:
      "Connectivity can integrate markets, attract industry, shift settlement, and widen opportunity while also creating corridor-led inequality and ecological pressure.",
    proof: "UPSC balance: connectivity can generate growth and uneven regional consequences together.",
  },
  {
    id: "trap",
    label: "Reject map mismatches",
    eyebrow: "Applied recall",
    explanation:
      "A strong answer links one corridor, port, or network with location, mode advantage, hinterland, economic effect, regional pressure, and one swapped-pair trap.",
    proof: "Recall chain: node -> route -> mode -> hinterland -> effect -> reject the mismatch.",
  },
];

export const geographyDay18PortalLesson = {
  title: "Transport and Trade",
  promise:
    "Explain connectivity through networks, transport modes, ports, hinterland, corridors, trade flow, regional change, and map discipline.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native connectivity visual.",
  scenes: [
    {
      id: "18-briefing",
      kind: "briefing" as const,
      title: "Begin with network logic",
      objective: "Explain how nodes and routes reduce friction of distance.",
      narration:
        "Nodes, routes, junctions, corridors, and terminals reorganize access, specialization, trade flow, and regional growth.",
      checkpoint:
        "Student can explain one network as a node-route-corridor chain.",
      durationMinutes: 2,
    },
    {
      id: "18-mechanism",
      kind: "mechanism" as const,
      title: "Compare modes and gateways",
      objective: "Connect transport-mode advantage with port and hinterland geography.",
      narration:
        "Railways, highways, waterways, air routes, and pipelines offer different advantages. Ports become gateways through harbor conditions, hinterland, corridor links, cargo, and security.",
      checkpoint:
        "Student can explain one mode advantage and one port-hinterland relationship.",
      durationMinutes: 3,
    },
    {
      id: "18-map",
      kind: "map" as const,
      title: "Trace regional transformation",
      objective: "Connect connectivity with markets, settlement, industry, and pressure.",
      narration:
        "Connectivity changes specialization, market access, settlement, industry, and agriculture. It can integrate regions while also creating corridor-led inequality and ecological pressure.",
      checkpoint:
        "Student can connect one corridor or port with one gain and one regional pressure.",
      durationMinutes: 3,
    },
    {
      id: "18-trap",
      kind: "trap" as const,
      title: "Reject corridor and port mismatches",
      objective: "Prepare for route, location, hinterland, and mode-advantage traps.",
      narration:
        "A statement may use a real port, corridor, cargo, or transport advantage with the wrong hinterland, location, or route. Verify the complete map chain.",
      checkpoint:
        "Student can reject one near-correct corridor-port or mode-advantage statement.",
      durationMinutes: 2,
    },
    {
      id: "18-recap",
      kind: "recap" as const,
      title: "Explain one connectivity chain",
      objective: "Move into discussion with one corridor, port, or network explanation.",
      narration:
        "Choose one corridor, port, or network. State location, transport mode, hinterland, economic effect, regional pressure, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one connectivity chain and reject one map mismatch.",
      durationMinutes: 2,
    },
  ],
};

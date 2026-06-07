export const geographyDay1PortalLesson = {
  title: "Geographic Thinking and Map Relationships",
  promise:
    "Learn one geographic habit: move from what and where to why, then prove the answer through a map relationship.",
  sourceSummary:
    "Adapted from the local Geography Foundation architecture, NCERT Geography as a Discipline, and the Day 1 India Map Intelligence relationship drills.",
  scenes: [
    {
      id: "1-briefing",
      kind: "briefing" as const,
      title: "Ask the geographic question",
      objective: "Start with what, where, and why before collecting facts.",
      narration:
        "Geography studies spatial distribution. Identify what exists, locate where it appears, and then ask why it is here rather than somewhere else.",
      checkpoint:
        "Student can ask what, where, and why for one real place instead of listing isolated facts.",
      durationMinutes: 2,
    },
    {
      id: "1-mechanism",
      kind: "mechanism" as const,
      title: "Read location as a relationship",
      objective: "Separate absolute location from relative location.",
      narration:
        "Coordinates give absolute location. Relative location explains a place through its relationships with rivers, coasts, passes, markets, routes, and neighbouring regions.",
      checkpoint:
        "Student can explain why coordinates locate a place but relationships help explain its importance.",
      durationMinutes: 3,
    },
    {
      id: "1-map",
      kind: "map" as const,
      title: "Use site, situation, and scale",
      objective: "Connect a place's physical site with its wider situation.",
      narration:
        "Site describes what a place is like. Situation describes where it sits in relation to other places. Scale changes the answer: a local pattern may look different at the regional or national level.",
      checkpoint:
        "Student can distinguish site from situation and name one case where scale changes the answer.",
      durationMinutes: 3,
    },
    {
      id: "1-trap",
      kind: "trap" as const,
      title: "Practice India map relationships",
      objective: "Train the pair-matching habit used in UPSC map questions.",
      narration:
        "Do not memorize names alone. Practice relationships: river to sea, pass to state, strait to water bodies, lake to type, and national park to location.",
      checkpoint:
        "Student can give one correct India relationship and explain the common near-correct trap.",
      durationMinutes: 2,
    },
    {
      id: "1-recap",
      kind: "recap" as const,
      title: "Explain why here, not there",
      objective: "Compress the lesson into a short spoken answer.",
      narration:
        "Explain one place through what it is, where it is, why the location matters, one relationship visible on a map, and one UPSC statement trap.",
      checkpoint:
        "Student is ready to explain one map relationship to the AI teacher in their own words.",
      durationMinutes: 2,
    },
  ],
};

export const geographyDay1MapRelationshipDrills = [
  {
    id: "ganga-sea",
    label: "Ganga -> Bay of Bengal",
    category: "River to sea",
    cue: "Follow the river relationship, not only the river name.",
    proofPrompt:
      "Map relationship: the Ganga drains into the Bay of Bengal. This is useful because UPSC often tests river-to-sea pairs. Trap: do not reverse the outlet or confuse a tributary with the main river.",
  },
  {
    id: "shipki-sutlej",
    label: "Shipki La -> Himachal Pradesh -> Sutlej enters India",
    category: "Pass to state to river",
    cue: "Connect the pass, its state, and the linked river fact.",
    proofPrompt:
      "Map relationship: Shipki La is in Himachal Pradesh, and the Sutlej enters India through this pass. This is stronger than memorizing either name alone. Trap: do not confuse Shipki La with a Sikkim pass.",
  },
  {
    id: "nathu-sikkim",
    label: "Nathu La -> Sikkim -> India-Tibet trade route",
    category: "Pass to state",
    cue: "Attach a map location to its strategic role.",
    proofPrompt:
      "Map relationship: Nathu La is in Sikkim and links India with Tibet through a trade route. The situation matters because border geography gives the location strategic value. Trap: do not assign Nathu La to Arunachal Pradesh.",
  },
  {
    id: "chilika-lagoon",
    label: "Chilika -> Odisha -> brackish lagoon",
    category: "Lake to state to type",
    cue: "Separate famous water bodies by type, not familiarity.",
    proofPrompt:
      "Map relationship: Chilika is in Odisha and is a brackish lagoon. The type matters for UPSC statements. Trap: do not describe Chilika as a freshwater lake or confuse it with India's largest saline lake.",
  },
  {
    id: "bab-el-mandeb",
    label: "Bab-el-Mandeb -> Red Sea and Gulf of Aden",
    category: "Strait to water bodies",
    cue: "Name the two connected water bodies before marking the pair.",
    proofPrompt:
      "Map relationship: Bab-el-Mandeb connects the Red Sea with the Gulf of Aden. It is a strategic strait on the Suez route. Trap: do not say that it directly connects the Red Sea with the Mediterranean Sea.",
  },
];

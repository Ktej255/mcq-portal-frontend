export type GeographyDay2UniverseStage = {
  id: "expansion" | "structure" | "accretion" | "differentiation" | "surface";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay2UniverseStages: GeographyDay2UniverseStage[] = [
  {
    id: "expansion",
    label: "Space expands",
    eyebrow: "Hot dense state",
    explanation: "The early universe expands and cools. Treat the Big Bang as expansion of space, not an explosion into empty space.",
    proof: "Trap: do not imagine a central blast moving through pre-existing empty space.",
  },
  {
    id: "structure",
    label: "Gravity builds structure",
    eyebrow: "Matter to galaxies",
    explanation: "As the universe cools, matter stabilizes. Gravity amplifies density differences and organizes matter into clouds, stars, and galaxies.",
    proof: "Cause chain: cooling allows matter; gravity organizes uneven density.",
  },
  {
    id: "accretion",
    label: "A solar disk forms",
    eyebrow: "Nebula to planets",
    explanation: "A rotating cloud collapses into a disk. Most mass forms the Sun; remaining material collides and accretes into planets.",
    proof: "Trap: planets do not appear as finished bodies in one step.",
  },
  {
    id: "differentiation",
    label: "Young Earth separates",
    eyebrow: "Density sorting",
    explanation: "Heating and density differences sort Earth internally: heavier material sinks, lighter material rises, and layers emerge.",
    proof: "Bridge: differentiation prepares the next lesson on Earth interior and plate movement.",
  },
  {
    id: "surface",
    label: "Earth becomes habitable",
    eyebrow: "Atmosphere and water",
    explanation: "Cooling, outgassing, condensation, and later biological change build the atmosphere, hydrosphere, and conditions for life.",
    proof: "Recall chain: expansion -> gravity -> accretion -> differentiation -> atmosphere and hydrosphere.",
  },
];

export const geographyDay2PortalLesson = {
  title: "Origin and Evolution of Earth",
  promise:
    "Follow one causal chain from expansion of space to a layered Earth with an atmosphere and hydrosphere.",
  sourceSummary:
    "Adapted from the local NCERT Origin and Evolution of Earth source and the portal's Universe-to-Earth animation blueprints.",
  scenes: [
    {
      id: "2-briefing",
      kind: "briefing" as const,
      title: "Begin with expansion, not explosion",
      objective: "Correct the first universe misconception before building the sequence.",
      narration:
        "Start with a hot dense state. Space itself expands and the universe cools. Do not imagine a bomb exploding from one central point into pre-existing empty space.",
      checkpoint:
        "Student can explain why expansion of space is more accurate than explosion into empty space.",
      durationMinutes: 2,
    },
    {
      id: "2-mechanism",
      kind: "mechanism" as const,
      title: "Let gravity organize matter",
      objective: "Connect cooling with matter formation, stars, galaxies, and a solar nebula.",
      narration:
        "Cooling allows matter to stabilize. Gravity amplifies uneven density, builds clouds and stars, and collapses a rotating solar nebula into a disk.",
      checkpoint:
        "Student can connect cooling, gravity, clouds, stars, and the solar disk in the correct order.",
      durationMinutes: 3,
    },
    {
      id: "2-map",
      kind: "map" as const,
      title: "Build planets through accretion",
      objective: "Explain how the solar disk becomes planets and a young Earth.",
      narration:
        "Most mass concentrates in the Sun. Remaining dust and rocky material collide and accrete. Inner rocky planets form in the hotter zone; outer planets retain more gas and ice.",
      checkpoint:
        "Student can define accretion and explain why inner and outer planets differ.",
      durationMinutes: 3,
    },
    {
      id: "2-trap",
      kind: "trap" as const,
      title: "Differentiate the young Earth",
      objective: "Bridge Earth origin with the next lesson on Earth interior.",
      narration:
        "Heating and density differences sort Earth internally. Heavier material sinks and lighter material rises. Cooling, outgassing, and condensation help form the atmosphere and hydrosphere.",
      checkpoint:
        "Student can explain differentiation and one atmosphere-hydrosphere sequence without listing disconnected facts.",
      durationMinutes: 2,
    },
    {
      id: "2-recap",
      kind: "recap" as const,
      title: "Speak the five-step chain",
      objective: "Compress the lesson into an oral explanation for the AI teacher.",
      narration:
        "Explain the causal chain: expansion, cooling and gravity, solar-disk accretion, Earth differentiation, then atmosphere and hydrosphere. End with the explosion misconception.",
      checkpoint:
        "Student is ready to reproduce the full chain and one UPSC trap in their own words.",
      durationMinutes: 2,
    },
  ],
};

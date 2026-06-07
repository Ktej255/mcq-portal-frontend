import type { GeographySession } from "@/lib/upsc/plan";
import { GEOGRAPHY_RECALL_TARGET } from "@/lib/upsc/guidedStudy";
import { geographyDay1PortalLesson } from "@/lib/upsc/geographyDay1PortalLesson";
import { geographyDay2PortalLesson } from "@/lib/upsc/geographyDay2PortalLesson";
import { geographyDay3PortalLesson } from "@/lib/upsc/geographyDay3PortalLesson";
import { geographyDay4PortalLesson } from "@/lib/upsc/geographyDay4PortalLesson";
import { geographyDay5PortalLesson } from "@/lib/upsc/geographyDay5PortalLesson";
import { geographyDay6PortalLesson } from "@/lib/upsc/geographyDay6PortalLesson";
import { geographyDay7PortalLesson } from "@/lib/upsc/geographyDay7PortalLesson";
import { geographyDay8PortalLesson } from "@/lib/upsc/geographyDay8PortalLesson";
import { geographyDay9PortalLesson } from "@/lib/upsc/geographyDay9PortalLesson";
import { geographyDay10PortalLesson } from "@/lib/upsc/geographyDay10PortalLesson";
import { geographyDay11PortalLesson } from "@/lib/upsc/geographyDay11PortalLesson";
import { geographyDay12PortalLesson } from "@/lib/upsc/geographyDay12PortalLesson";
import { geographyDay13PortalLesson } from "@/lib/upsc/geographyDay13PortalLesson";
import { geographyDay14PortalLesson } from "@/lib/upsc/geographyDay14PortalLesson";
import { geographyDay15PortalLesson } from "@/lib/upsc/geographyDay15PortalLesson";
import { geographyDay16PortalLesson } from "@/lib/upsc/geographyDay16PortalLesson";
import { geographyDay17PortalLesson } from "@/lib/upsc/geographyDay17PortalLesson";
import { geographyDay18PortalLesson } from "@/lib/upsc/geographyDay18PortalLesson";
import { geographyDay19PortalLesson } from "@/lib/upsc/geographyDay19PortalLesson";
import { geographyDay20PortalLesson } from "@/lib/upsc/geographyDay20PortalLesson";
import { geographyDay21PortalLesson } from "@/lib/upsc/geographyDay21PortalLesson";
import { geographyDay22PortalLesson } from "@/lib/upsc/geographyDay22PortalLesson";
import { geographyDay23PortalLesson } from "@/lib/upsc/geographyDay23PortalLesson";
import { geographyDay24PortalLesson } from "@/lib/upsc/geographyDay24PortalLesson";
import { geographyDay25PortalLesson } from "@/lib/upsc/geographyDay25PortalLesson";
import { geographyDay26PortalLesson } from "@/lib/upsc/geographyDay26PortalLesson";
import { geographyDay27PortalLesson } from "@/lib/upsc/geographyDay27PortalLesson";
import { geographyDay28PortalLesson } from "@/lib/upsc/geographyDay28PortalLesson";
import { geographyDay29PortalLesson } from "@/lib/upsc/geographyDay29PortalLesson";
import { geographyDay30PortalLesson } from "@/lib/upsc/geographyDay30PortalLesson";

export type GeographyAssessmentBand = "Revisit" | "Practice" | "Command";

export type GeographyAssessmentRubricItem = {
  label: "Recall" | "Mechanism" | "Map proof" | "UPSC trap" | "Expression";
  score: number;
  max: number;
  status: "Weak" | "Forming" | "Ready";
  evidence: string;
};

export type GeographyAssessment = {
  score: number;
  band: GeographyAssessmentBand;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  nextAction: string;
  rubric: GeographyAssessmentRubricItem[];
  repairHints: string[];
};

export type GeographyTalkUnlockStage = "revisit" | "retry" | "lab" | "mcq";

export type GeographyMaicRole = "AI Teacher" | "Peer Challenger" | "UPSC Examiner" | "Learning Summarizer";

export type GeographyMaicTurn = {
  role: GeographyMaicRole;
  title: string;
  message: string;
  tone: "teacher" | "peer" | "examiner" | "summarizer";
};

export type GeographyMaicDiscussion = {
  turns: GeographyMaicTurn[];
  verdict: string;
  unlockStage: GeographyTalkUnlockStage;
  score: number;
};

export type GeographyWatchSceneKind = "briefing" | "mechanism" | "map" | "trap" | "recap";

export type GeographyWatchScene = {
  id: string;
  kind: GeographyWatchSceneKind;
  title: string;
  objective: string;
  narration: string;
  checkpoint: string;
  durationMinutes: number;
};

const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "into",
  "this",
  "that",
  "why",
  "how",
  "are",
  "does",
  "can",
  "day",
  "base",
  "basics",
  "study",
  "understand",
]);

export function labSlugForGeographySession(labTitle: string) {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Universe Foundation Visual") return "universe";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

export function getGeographySubtopics(session: GeographySession) {
  if (session.subtopics?.length) return session.subtopics;

  return session.anchor
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function getGeographyGsCompatibility(session: GeographySession) {
  return (
    session.gsCompatibility ??
    `GS Paper I Geography: ${session.chapter}. This class maps the day topic to concepts, maps, examples, and prelims-style statement logic.`
  );
}

export function getCompressedGeographyRecap(session: GeographySession) {
  if (session.day === 1) {
    return [
      `Start with ${geographyDay1PortalLesson.title}: ask what exists, where it appears, and why it is there.`,
      "Explain how absolute location uses coordinates while relative location reveals a place through nearby rivers, routes, coasts, passes, and regions.",
      "Prove the idea with one India map relationship, then distinguish site from situation and state the scale of your answer.",
      "End by predicting one near-correct UPSC pair-matching trap and the hidden exception.",
    ];
  }
  if (session.day === 2) {
    return [
      `Start with ${geographyDay2PortalLesson.title}: expansion of space creates the cooling sequence.`,
      "Connect cooling with matter, gravity-led structure, stars, and the rotating solar nebula.",
      "Explain accretion and Earth differentiation before adding atmosphere and hydrosphere.",
      "End with the UPSC trap: expansion of space is not an explosion into pre-existing empty space.",
    ];
  }
  if (session.day === 3) {
    return [
      `Start with ${geographyDay3PortalLesson.title}: seismic behavior reveals the layered Earth.`,
      "Separate crust, mantle, outer core, and inner core from rigid lithosphere and weaker asthenosphere.",
      "Connect internal heat and mantle behavior with divergent, convergent, and transform plate boundaries.",
      "End with the UPSC trap: the mantle is not a fully liquid magma ocean, and not every boundary creates volcanoes.",
    ];
  }
  if (session.day === 4) {
    return [
      `Start with ${geographyDay4PortalLesson.title}: uplift exposes rock to external processes.`,
      "Separate weathering in place from erosion as removal and transport by water, wind, ice, or waves.",
      "Connect falling energy with deposition, then add gravity-driven mass wasting and slope failure.",
      "End with the UPSC trap: weathering and erosion are not interchangeable terms.",
    ];
  }
  if (session.day === 5) {
    return [
      `Start with ${geographyDay5PortalLesson.title}: unequal solar heating creates the atmospheric energy imbalance.`,
      "Connect warm rising air and cool sinking air with pressure gradient and large-scale circulation.",
      "Add Coriolis deflection, then organize trade winds, westerlies, and polar easterlies through global pressure belts.",
      "End with the UPSC trap: pressure gradient starts wind, while Coriolis changes the path of moving air.",
    ];
  }
  if (session.day === 6) {
    return [
      `Start with ${geographyDay6PortalLesson.title}: connect shelf, slope, abyssal plain, ridge, and trench before naming current effects.`,
      "Add temperature, salinity, and density, then explain how winds, rotation, basin shape, and water properties organize circulation.",
      "Use one warm-current pair and one cold-current pair to connect climate, fog, deserts, upwelling, and fisheries.",
      "End with the UPSC trap: salinity alone does not explain productive fisheries.",
    ];
  }
  if (session.day === 7) {
    return [
      `Start with ${geographyDay7PortalLesson.title}: locate the pattern before joining the physical systems.`,
      "Connect Earth structure and plate movement with relief, then separate relief creation from weathering, erosion, transport, and deposition.",
      "Add pressure belts, winds, and ocean currents to map heat, moisture, deserts, fog, rainfall, and fisheries.",
      "End with the UPSC trap: integrated questions punish isolated memorization and reversed cause-effect chains.",
    ];
  }
  if (session.day === 8) {
    return [
      `Start with ${geographyDay8PortalLesson.title}: read India relief as the base layer behind connected map patterns.`,
      "Contrast the young Himalayan arc, depositional northern plains, and older peninsular plateau through process, slope, and hazard logic.",
      "Add the Thar desert, western and eastern coastal plains, and island groups before connecting relief with rivers, monsoon, soils, resources, and risk.",
      "End with the UPSC trap: a correct relief idea can still be paired with the wrong state, boundary, river behavior, or climate consequence.",
    ];
  }
  if (session.day === 9) {
    return [
      `Start with ${geographyDay9PortalLesson.title}: trace every river through source, slope, basin, tributaries, state path, and outlet.`,
      "Contrast largely perennial, sediment-rich Himalayan systems with older plateau-controlled peninsular systems that depend more strongly on rainfall and slope.",
      "Connect outlet logic with delta, estuary, irrigation, erosion, flood, and settlement consequences before memorizing tributary names.",
      "End with the UPSC trap: face downstream before judging left-bank and right-bank tributaries, then trace direction before accepting delta or estuary pairs.",
    ];
  }
  if (session.day === 10) {
    return [
      `Start with ${geographyDay10PortalLesson.title}: build seasonal pressure contrast before memorizing rainfall dates.`,
      "Connect northward ITCZ movement and cross-equatorial flow with the southwest monsoon, then split the Arabian Sea and Bay of Bengal branches through relief barriers.",
      "Read onset, active spells, breaks, and retreat as a moving sequence before adding jet streams, western disturbances, ENSO, IOD, and local controls.",
      "End with the UPSC trap: one variability signal can influence rainfall without becoming a complete one-factor explanation.",
    ];
  }
  if (session.day === 11) {
    return [
      `Start with ${geographyDay11PortalLesson.title}: read latitude, altitude, relief, distance from sea, pressure systems, and winds as interacting controls.`,
      "Trace monsoon pathways into windward uplift and leeward rain shadow, then add western disturbances as a separate winter precipitation route.",
      "Compare coastal, interior, desert, plateau, mountain, and rain-shadow regions through rainfall season, temperature range, and one map example.",
      "End with the UPSC trap: a correct climate mechanism can still be paired with the wrong region, season, wind source, or relief relationship.",
    ];
  }
  if (session.day === 12) {
    return [
      `Start with ${geographyDay12PortalLesson.title}: build soil from parent material, climate, relief, drainage, organisms, and time.`,
      "Map alluvial, black, red-yellow, laterite, desert, mountain, and saline soils through property, crop advantage, and limitation before adding vegetation response.",
      "Connect rainfall, temperature, altitude, soil, and human pressure with vegetation distribution, then add erosion, salinity, desertification, and forest degradation.",
      "End with the UPSC trap: a correct soil or forest feature can still be paired with the wrong crop, state, rainfall zone, or limitation.",
    ];
  }
  if (session.day === 13) {
    return [
      `Start with ${geographyDay13PortalLesson.title}: explain why resources and crops cluster before memorizing belts.`,
      "Trace mineral and energy belts through geology, transport, demand, and environmental cost, then build crop suitability through soil, rainfall, temperature, water, market access, and technology.",
      "Connect irrigation and groundwater with productivity, depletion, salinity, waterlogging, energy stress, and unequal access before naming one regional example.",
      "End with the UPSC trap: a correct crop, mineral, state, or irrigation effect can still be placed inside the wrong regional belt.",
    ];
  }
  if (session.day === 14) {
    return [
      `Start with ${geographyDay14PortalLesson.title}: lay down relief before adding the connected India map layers.`,
      "Trace drainage through source, slope, basin, direction, and outlet, then overlay monsoon branches, relief effects, climate-region contrasts, and seasonality.",
      "Add soil and vegetation patterns, mineral and energy belts, crop suitability, irrigation gains, and sustainability pressure before generating the weakest five repair cards.",
      "End with the UPSC trap: individually correct river, rainfall, soil, crop, mineral, and state facts can still form a false mixed-region statement.",
    ];
  }
  if (session.day === 15) {
    return [
      `Start with ${geographyDay15PortalLesson.title}: separate density as a ratio from distribution as a spatial pattern.`,
      "Explain concentration through relief, climate, soil, water, transport, jobs, safety, and services before tracing one origin-push-to-destination-pull migration chain.",
      "Connect birth rate, death rate, natural increase, age structure, health, education, urbanization, and development through demographic transition.",
      "End with the UPSC trap: density, distribution, growth, fertility, migration, and age structure are related but not interchangeable indicators.",
    ];
  }
  if (session.day === 16) {
    return [
      `Start with ${geographyDay16PortalLesson.title}: separate the exact settlement site from its wider spatial situation.`,
      "Explain rural patterns through relief, water, agriculture, landholding, safety, and community structure, then build urban hierarchy through services, markets, administration, industry, transport, and connectivity.",
      "Separate visible morphology such as compact, linear, dispersed, radial, grid, and planned form from settlement function and hierarchy.",
      "End with the UPSC trap: site, situation, morphology, function, hierarchy, and scale describe related but different settlement properties.",
    ];
  }
  if (session.day === 17) {
    return [
      `Start with ${geographyDay17PortalLesson.title}: classify resource use, transformation, services, knowledge, and high-order decisions separately.`,
      "Trace one activity chain from resource input through processing, transport, trade, finance, information, and decision systems before adding location factors.",
      "Explain structural change through productivity, urbanization, education, infrastructure, technology, skills, networks, data, markets, and policy.",
      "End with the UPSC trap: one real economic chain can contain several sectors, so classify the specific activity being described.",
    ];
  }
  if (session.day === 18) {
    return [
      `Start with ${geographyDay18PortalLesson.title}: trace nodes, routes, corridors, and terminals as one connectivity system.`,
      "Compare railways, highways, waterways, air routes, and pipelines through cargo, distance, terrain, urgency, and network connection before adding port-hinterland logic.",
      "Connect market access, specialization, settlement, industry, agriculture, regional growth, inequality, and ecological pressure through one corridor or port example.",
      "End with the UPSC trap: a real corridor, port, cargo, or transport advantage can still be paired with the wrong hinterland, route, or location.",
    ];
  }
  if (session.day === 19) {
    return [
      `Start with ${geographyDay19PortalLesson.title}: compare classical input-market factors with newer skill, data, innovation, logistics, policy, and value-chain logic.`,
      "Explain why older industrial regions often reflect coal, ore, railway, port, water, and colonial-market geography while newer clusters can follow skills, suppliers, finance, highways, airports, and agglomeration.",
      "Compare one old industrial region with one newer cluster before naming the dominant factor, support factors, network, and changing context.",
      "End with the UPSC trap: a real industry and a real location factor can still be paired with the wrong region, network, or period logic.",
    ];
  }
  if (session.day === 20) {
    return [
      `Start with ${geographyDay20PortalLesson.title}: identify one spatial development gap, the indicator that reveals it, and the geography or governance factor that creates it.`,
      "Match the issue with a functional, administrative, resource-based, river-basin based, or problem-region planning unit before choosing a policy response.",
      "Balance growth-pole and urbanization gains with housing, transport, waste, water, pollution, participation, and ecological pressure.",
      "End with the UPSC trap: a useful policy can still be mismatched with the cause, indicator, planning unit, governance capacity, or sustainability risk.",
    ];
  }
  if (session.day === 21) {
    return [
      `Start with ${geographyDay21PortalLesson.title}: trace one people-to-region chain through population, settlement, activity, connectivity, industry, and development outcome.`,
      "Connect relief, water, climate, safety, jobs, services, resources, sectors, corridors, ports, markets, clusters, policy, and governance without turning the review into isolated facts.",
      "Generate one repair card for the weakest indicator, example, map link, or mismatch trap before moving into mixed MCQs.",
      "End with the UPSC trap: correct human-geography facts can still be combined in the wrong relationship.",
    ];
  }
  if (session.day === 22) {
    return [
      `Start with ${geographyDay22PortalLesson.title}: locate one recurring place through direction, region, and neighboring areas before adding detail.`,
      "Attach one relief, river, climate, resource, biodiversity, port, border, or current-affairs layer so the place carries exam context rather than a plain label.",
      "Run the quick drill: locate, connect, explain, and compare one nearby place that could become a distractor.",
      "End with the UPSC trap: correct features from nearby regions can still be swapped into a false location statement.",
    ];
  }
  if (session.day === 23) {
    return [
      `Start with ${geographyDay23PortalLesson.title}: classify whether UPSC is testing a concept, map location, process order, exception, pair match, or current-static link.`,
      "Verify the relationship that can turn a familiar fact into a false option: order, region, season, soil, crop, current, hazard, pair, or exception.",
      "Test whether a claimed cause actually produces the stated effect before accepting an explanation.",
      "End with the repair loop: classify, verify, reject, rewrite, and retest the precise thinking error.",
    ];
  }
  if (session.day === 24) {
    return [
      `Start with ${geographyDay24PortalLesson.title}: separate hazard from disaster by tracing exposure, vulnerability, and capacity in one region.`,
      "Compare cyclones, floods, droughts, landslides, and earthquakes through location-specific physical mechanism before adding governance, land use, infrastructure, and early warning.",
      "Explain why the same hazard produces different disaster outcomes across regions.",
      "End with the UPSC trap: a real hazard cause, vulnerable region, mitigation tool, or institution can still be cross-matched incorrectly.",
    ];
  }
  if (session.day === 25) {
    return [
      `Start with ${geographyDay25PortalLesson.title}: read biome controls through temperature, rainfall, seasonality, latitude, altitude, and soil before naming an ecological pattern.`,
      "Connect habitat, corridors, endemism, climate gradients, and human pressure with plausible biodiversity distribution.",
      "Locate climate exposure across coasts, mountains, drylands, forests, islands, and urban zones before attaching conservation response.",
      "End with the UPSC trap: real species, habitat, protected area, state, and climate-zone terms can still be cross-matched incorrectly.",
    ];
  }
  if (session.day === 26) {
    return [
      `Start with ${geographyDay26PortalLesson.title}: frame the 10-marker through context, mechanism, spatial proof, example, and balanced conclusion.`,
      "Convert the concept into a causal flow through cause, process, and consequence before adding facts.",
      "Use a locator map, flow diagram, cross-section, or compact comparison only when it clarifies the explanation, then attach one location-specific example.",
      "End with the UPSC trap: a long list of correct facts still produces a weak answer when flow, spatial evidence, examples, or conclusion discipline are missing.",
    ];
  }
  if (session.day === 27) {
    return [
      `Start with ${geographyDay27PortalLesson.title}: recall the physical base through process, location, and consequence.`,
      "Overlay India map layers and human-geography outcomes through relief, rivers, monsoon, resources, settlements, sectors, networks, industry, and regions.",
      "Add environment and disaster bridges through habitat, climate exposure, hazard, vulnerability, and capacity.",
      "End with the repair loop: tag chapter, map zone, concept type, and trap type before creating one correction and fresh retest.",
    ];
  }
  if (session.day === 28) {
    return [
      `Start with ${geographyDay28PortalLesson.title}: classify the weak signal as knowledge, map recall, concept confusion, or statement-reading error.`,
      "Name the smallest root cause, then write one narrow repair card with concept, map cue, example, trap, and correction.",
      "Use a fresh retest against the same repaired idea and compare original confidence with retest confidence.",
      "End with the UPSC trap: do not revise an entire chapter when one process, location, or question pattern remains weak.",
    ];
  }
  if (session.day === 29) {
    return [
      `Start with ${geographyDay29PortalLesson.title}: treat the mock score as a signal, not the diagnosis.`,
      "Classify each mistake as knowledge gap, map error, statement-reading error, overconfidence, or time pressure before selecting the repair.",
      "Move repeated and high-value mistakes into the 24-hour queue with one correction and one retest cue.",
      "End with the UPSC trap: familiarity is not confidence until the corrected idea survives a fresh retest.",
    ];
  }
  if (session.day === 30) {
    return [
      `Start with ${geographyDay30PortalLesson.title}: explain every major theme through cause and location before marking the subject complete.`,
      "Check map confidence through recurring places, directions, neighboring regions, relief, rivers, climate, resources, biodiversity, and hazards.",
      "Audit proof through Watch, Talk, MCQ, and Revisit closure, then lock the next revision dates.",
      "End with the UPSC trap: feeling familiar with a topic is not the same as applying it under exam pressure.",
    ];
  }

  const subtopics = getGeographySubtopics(session);

  return [
    `Start with ${session.title}: ${session.anchor}.`,
    `Explain the core mechanism in your own words, then attach it to one map or Indian example.`,
    `Do not memorize isolated facts. Connect ${subtopics.slice(0, 3).join(", ")} through cause, location, and exception.`,
    `End by predicting one UPSC statement trap and one MCQ angle.`,
  ];
}

export function buildGeographyWatchScenes(session: GeographySession): GeographyWatchScene[] {
  if (session.day === 1) return geographyDay1PortalLesson.scenes;
  if (session.day === 2) return geographyDay2PortalLesson.scenes;
  if (session.day === 3) return geographyDay3PortalLesson.scenes;
  if (session.day === 4) return geographyDay4PortalLesson.scenes;
  if (session.day === 5) return geographyDay5PortalLesson.scenes;
  if (session.day === 6) return geographyDay6PortalLesson.scenes;
  if (session.day === 7) return geographyDay7PortalLesson.scenes;
  if (session.day === 8) return geographyDay8PortalLesson.scenes;
  if (session.day === 9) return geographyDay9PortalLesson.scenes;
  if (session.day === 10) return geographyDay10PortalLesson.scenes;
  if (session.day === 11) return geographyDay11PortalLesson.scenes;
  if (session.day === 12) return geographyDay12PortalLesson.scenes;
  if (session.day === 13) return geographyDay13PortalLesson.scenes;
  if (session.day === 14) return geographyDay14PortalLesson.scenes;
  if (session.day === 15) return geographyDay15PortalLesson.scenes;
  if (session.day === 16) return geographyDay16PortalLesson.scenes;
  if (session.day === 17) return geographyDay17PortalLesson.scenes;
  if (session.day === 18) return geographyDay18PortalLesson.scenes;
  if (session.day === 19) return geographyDay19PortalLesson.scenes;
  if (session.day === 20) return geographyDay20PortalLesson.scenes;
  if (session.day === 21) return geographyDay21PortalLesson.scenes;
  if (session.day === 22) return geographyDay22PortalLesson.scenes;
  if (session.day === 23) return geographyDay23PortalLesson.scenes;
  if (session.day === 24) return geographyDay24PortalLesson.scenes;
  if (session.day === 25) return geographyDay25PortalLesson.scenes;
  if (session.day === 26) return geographyDay26PortalLesson.scenes;
  if (session.day === 27) return geographyDay27PortalLesson.scenes;
  if (session.day === 28) return geographyDay28PortalLesson.scenes;
  if (session.day === 29) return geographyDay29PortalLesson.scenes;
  if (session.day === 30) return geographyDay30PortalLesson.scenes;

  const subtopics = getGeographySubtopics(session);
  const firstTopics = subtopics.slice(0, 3).join(", ");

  return [
    {
      id: `${session.day}-briefing`,
      kind: "briefing",
      title: "Class briefing",
      objective: "Set the topic boundary before details begin.",
      narration: session.watch,
      checkpoint: `By the end of this scene, the student should state why ${session.title} matters for GS Geography.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-mechanism`,
      kind: "mechanism",
      title: "Core mechanism",
      objective: "Convert the topic into cause, process, and consequence.",
      narration: `Build the mechanism through ${firstTopics || session.anchor}. Avoid isolated facts; explain how one variable changes another.`,
      checkpoint: "Student can explain the mechanism without reading the slide.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-map`,
      kind: "map",
      title: "Map or example proof",
      objective: "Attach the idea to a place, pattern, region, or Indian example.",
      narration: `Place ${session.title} on a map using ${session.anchor}. The example must make the concept visible spatially.`,
      checkpoint: "Student can name one location or map cue that proves the concept.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-trap`,
      kind: "trap",
      title: "UPSC statement trap",
      objective: "Prepare the student for wrong-generalization and pair-matching traps.",
      narration: session.test,
      checkpoint: "Student can predict one almost-correct statement and the hidden exception.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-recap`,
      kind: "recap",
      title: "Talk room handoff",
      objective: "Compress the class into an oral answer.",
      narration: session.talk,
      checkpoint: "Student is ready to explain the topic to the AI teacher in their own words.",
      durationMinutes: 2,
    },
  ];
}

export function getGeographyTalkUnlockStage(assessment?: GeographyAssessment | null): GeographyTalkUnlockStage {
  const score = assessment?.score ?? 0;
  if (score < 40) return "revisit";
  if (score < GEOGRAPHY_RECALL_TARGET) return "retry";
  return "mcq";
}

function extractKeywords(session: GeographySession) {
  const source = [
    session.title,
    session.chapter,
    session.anchor,
    session.watch,
    session.talk,
    session.test,
    ...getGeographySubtopics(session),
  ].join(" ");

  const words = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 14);
}

function rubricStatus(score: number, max: number): GeographyAssessmentRubricItem["status"] {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.72) return "Ready";
  if (ratio >= 0.42) return "Forming";
  return "Weak";
}

function buildRubricItem(
  label: GeographyAssessmentRubricItem["label"],
  score: number,
  max: number,
  evidence: string
): GeographyAssessmentRubricItem {
  return {
    label,
    score,
    max,
    status: rubricStatus(score, max),
    evidence,
  };
}

export function assessGeographyExplanation(session: GeographySession, answer: string): GeographyAssessment {
  const keywords = extractKeywords(session);
  const normalizedAnswer = answer.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 5);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const keywordScore = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 30) : 0;
  const mechanismScore = Math.min(
    20,
    (/(cause|because|mechanism|process|leads|results|creates|drives|controls|forms|explains|due to|shift|gradient|convection|collision|subduction|upwelling|orograph)/i.test(answer) ? 12 : 0) +
      (/(effect|impact|consequence|therefore|so that|connects|link|affect|redistribute|variation|exception)/i.test(answer) ? 8 : 0)
  );
  const mapScore = Math.min(
    20,
    (/(map|region|river|coast|relief|climate|location|india|example|himalaya|plateau|plain|ghat|bay|arabian|western|eastern|delta|desert|floodplain|margin)/i.test(answer) ? 12 : 0) +
      (/(case|such as|for example|instance|corbett|kaziranga|sundarbans|monsoon|ganga|brahmaputra|deccan|thar|kerala|tamil nadu|andaman)/i.test(answer) ? 8 : 0)
  );
  const trapScore = Math.min(
    15,
    (/(upsc|trap|statement|pair|match|incorrect|almost-correct|wrong|reverse|confuse|exception|not all|however|but|avoid)/i.test(answer) ? 10 : 0) +
      (/(salinity alone|always|never|uniform|identical|only|all|every|not simply|not the same)/i.test(answer) ? 5 : 0)
  );
  const expressionScore = Math.min(
    15,
    (wordCount >= 45 ? 8 : wordCount >= 25 ? 5 : wordCount >= 15 ? 3 : 0) +
      (/(first|then|finally|start|end|core|map|trap|concept|mechanism)/i.test(answer) ? 4 : 0) +
      (answer.trim().length > 0 && !/(confused|cannot explain|don't know|do not know)/i.test(answer) ? 3 : 0)
  );
  const score = Math.min(100, Math.round(keywordScore + mechanismScore + mapScore + trapScore + expressionScore));
  const rubric: GeographyAssessmentRubricItem[] = [
    buildRubricItem(
      "Recall",
      keywordScore,
      30,
      matchedKeywords.length > 0 ? `Matched ${matchedKeywords.slice(0, 4).join(", ")}.` : "Core topic vocabulary is missing."
    ),
    buildRubricItem(
      "Mechanism",
      mechanismScore,
      20,
      mechanismScore >= 15 ? "Cause-effect chain is visible." : "Needs clearer cause, process, and consequence."
    ),
    buildRubricItem(
      "Map proof",
      mapScore,
      20,
      mapScore >= 15 ? "Location/example proof is visible." : "Needs one map cue, Indian example, or region anchor."
    ),
    buildRubricItem(
      "UPSC trap",
      trapScore,
      15,
      trapScore >= 11 ? "Statement trap or exception is visible." : "Needs one almost-correct UPSC statement and exception."
    ),
    buildRubricItem(
      "Expression",
      expressionScore,
      15,
      expressionScore >= 11 ? "Answer has enough length and structure." : "Needs a cleaner spoken structure."
    ),
  ];
  const repairHints = rubric
    .filter((item) => item.status !== "Ready")
    .map((item) => {
      if (item.label === "Recall") return `Use these missing terms: ${missingKeywords.join(", ") || session.title}.`;
      if (item.label === "Mechanism") return "Add a because-chain: cause -> process -> effect -> exception.";
      if (item.label === "Map proof") return "Add one map proof: region, river, coast, relief, climate belt, or Indian example.";
      if (item.label === "UPSC trap") return "Add one UPSC trap: an almost-correct statement and the exception.";
      return "Speak in a compact order: concept -> mechanism -> map/example -> trap.";
    });

  if (score < 40) {
    return {
      score,
      band: "Revisit",
      matchedKeywords,
      missingKeywords,
      summary: "The explanation is still thin. The student should revisit a compressed recap before attempting MCQs.",
      nextAction: "Rewatch compressed recap",
      rubric,
      repairHints,
    };
  }

  if (score < GEOGRAPHY_RECALL_TARGET) {
    return {
      score,
      band: "Practice",
      matchedKeywords,
      missingKeywords,
      summary: `The core idea is forming, but recall has not reached the ${GEOGRAPHY_RECALL_TARGET}% target. Repair the missing concepts, then explain again.`,
      nextAction: "Retry oral check",
      rubric,
      repairHints,
    };
  }

  return {
    score,
    band: "Command",
    matchedKeywords,
    missingKeywords,
    summary: `Recall reached the ${GEOGRAPHY_RECALL_TARGET}% target. Proceed to topic MCQs and the next topic.`,
    nextAction: "Proceed to MCQs",
    rubric,
    repairHints,
  };
}

export function buildGeographyChallengeScaffold(session: GeographySession, assessment: GeographyAssessment) {
  const weakLabels = assessment.rubric
    .filter((item) => item.status !== "Ready")
    .map((item) => item.label.toLowerCase())
    .join(", ");
  const repairHint = assessment.repairHints[0] ?? "Add a stronger mechanism, map example, and UPSC trap.";
  const missing = assessment.missingKeywords.length ? assessment.missingKeywords.slice(0, 3).join(", ") : session.title;

  return [
    `I will repair the weak area: ${weakLabels || "final polish"}.`,
    `Core concept: ${session.title} is linked with ${session.anchor}.`,
    `Mechanism: ${repairHint}`,
    `Map/example: I will attach it to one region, river, coast, relief feature, climate belt, or Indian example using ${missing}.`,
    "UPSC trap: the statement becomes risky when it overgeneralizes location, cause, or exception.",
  ].join(" ");
}

export function buildGeographyMaicDiscussion(
  session: GeographySession,
  answer: string,
  assessment: GeographyAssessment
): GeographyMaicDiscussion {
  const stage = getGeographyTalkUnlockStage(assessment);
  const subtopics = getGeographySubtopics(session);
  const conciseAnswer = answer.trim().replace(/\s+/g, " ").slice(0, 220);
  const missing = assessment.missingKeywords.length
    ? assessment.missingKeywords.join(", ")
    : "no major keyword gap";
  const matched = assessment.matchedKeywords.length
    ? assessment.matchedKeywords.slice(0, 5).join(", ")
    : "not enough mapped concepts yet";
  const weakestRubric = [...assessment.rubric].sort((first, second) => first.score / first.max - second.score / second.max)[0];
  const repairHint = assessment.repairHints[0] ?? "tighten concept, mechanism, map proof, and trap.";

  const verdictByStage: Record<GeographyTalkUnlockStage, string> = {
    revisit: "Revisit required: the explanation is too thin for forward movement.",
    retry: `Retry required: the student has some logic, but recall must reach ${GEOGRAPHY_RECALL_TARGET}% before MCQ.`,
    lab: "Visual Lab is available as optional support when map or mechanism proof needs reinforcement.",
    mcq: `MCQ route unlocked: the ${GEOGRAPHY_RECALL_TARGET}% recall target is cleared.`,
  };

  return {
    score: assessment.score,
    unlockStage: stage,
    verdict: verdictByStage[stage],
    turns: [
      {
        role: "AI Teacher",
        title: "Recall and mechanism",
        tone: "teacher",
        message: `Explain ${session.title} through concept, mechanism, map proof, and trap. Your current response starts: "${conciseAnswer || "No student response yet."}"`,
      },
      {
        role: "Peer Challenger",
        title: `Counter-question: ${weakestRubric?.label ?? "Map proof"}`,
        tone: "peer",
        message: `I will challenge the weak point: ${repairHint} Connect ${subtopics.slice(0, 3).join(", ")} with a real map or Indian example. Avoid only listing terms.`,
      },
      {
        role: "UPSC Examiner",
        title: "Score gate",
        tone: "examiner",
        message: `Score ${assessment.score}/100. Matched: ${matched}. Repair: ${missing}. The weakest classroom skill is ${weakestRubric?.label ?? "unknown"}. This decides whether the route is Revisit, repair Talk, or MCQ readiness.`,
      },
      {
        role: "Learning Summarizer",
        title: "Compressed memory",
        tone: "summarizer",
        message: `${assessment.summary} End the answer with one UPSC trap and one map cue before moving ahead.`,
      },
    ],
  };
}

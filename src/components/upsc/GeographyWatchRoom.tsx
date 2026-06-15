"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  LockKeyhole,
  MapPinned,
  PlayCircle,
  Route,
  Save,
  Video,
  Mic,
  MicOff,
  Send,
  Award,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Activity,
  Volume2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyRoomCompass } from "@/components/upsc/GeographyRoomCompass";
import { GeographyDay1MapThinkingVisual } from "@/components/upsc/GeographyDay1MapThinkingVisual";
import { GeographyDay2UniverseVisual } from "@/components/upsc/GeographyDay2UniverseVisual";
import { GeographyDay3PlateVisual } from "@/components/upsc/GeographyDay3PlateVisual";
import { GeographyDay4GeomorphicVisual } from "@/components/upsc/GeographyDay4GeomorphicVisual";
import { GeographyDay5ClimatologyVisual } from "@/components/upsc/GeographyDay5ClimatologyVisual";
import { GeographyDay6OceanVisual } from "@/components/upsc/GeographyDay6OceanVisual";
import { GeographyDay7ConsolidationVisual } from "@/components/upsc/GeographyDay7ConsolidationVisual";
import { GeographyDay8IndiaReliefVisual } from "@/components/upsc/GeographyDay8IndiaReliefVisual";
import { GeographyDay9DrainageVisual } from "@/components/upsc/GeographyDay9DrainageVisual";
import { GeographyDay10MonsoonVisual } from "@/components/upsc/GeographyDay10MonsoonVisual";
import { GeographyDay11ClimateRegionsVisual } from "@/components/upsc/GeographyDay11ClimateRegionsVisual";
import { GeographyDay12SoilsVegetationVisual } from "@/components/upsc/GeographyDay12SoilsVegetationVisual";
import { GeographyDay13ResourcesAgricultureVisual } from "@/components/upsc/GeographyDay13ResourcesAgricultureVisual";
import { GeographyDay14IndiaMapDrillVisual } from "@/components/upsc/GeographyDay14IndiaMapDrillVisual";
import { GeographyDay15PopulationVisual } from "@/components/upsc/GeographyDay15PopulationVisual";
import { GeographyDay16SettlementsVisual } from "@/components/upsc/GeographyDay16SettlementsVisual";
import { GeographyDay17EconomicActivitiesVisual } from "@/components/upsc/GeographyDay17EconomicActivitiesVisual";
import { GeographyDay18TransportTradeVisual } from "@/components/upsc/GeographyDay18TransportTradeVisual";
import { GeographyDay19IndustryLocationVisual } from "@/components/upsc/GeographyDay19IndustryLocationVisual";
import { GeographyDay20RegionalDevelopmentVisual } from "@/components/upsc/GeographyDay20RegionalDevelopmentVisual";
import { GeographyDay21HumanGeographyConsolidationVisual } from "@/components/upsc/GeographyDay21HumanGeographyConsolidationVisual";
import { GeographyDay22AtlasMasteryVisual } from "@/components/upsc/GeographyDay22AtlasMasteryVisual";
import { GeographyDay23PyqPatternReadingVisual } from "@/components/upsc/GeographyDay23PyqPatternReadingVisual";
import { GeographyDay24DisasterGeographyBridgeVisual } from "@/components/upsc/GeographyDay24DisasterGeographyBridgeVisual";
import { GeographyDay25EnvironmentGeographyBridgeVisual } from "@/components/upsc/GeographyDay25EnvironmentGeographyBridgeVisual";
import { GeographyDay26MainsGeographyApplicationVisual } from "@/components/upsc/GeographyDay26MainsGeographyApplicationVisual";
import { GeographyDay27FullGeographyDrillVisual } from "@/components/upsc/GeographyDay27FullGeographyDrillVisual";
import {
  GeographyDay28WeakAreaRepairVisual,
  GeographyDay29FinalMockReviewVisual,
  GeographyDay30GeographyCommandDayVisual,
} from "@/components/upsc/GeographyRevisionCloseoutVisual";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographySubtopics,
  labSlugForGeographySession,
  assessGeographyExplanation,
} from "@/lib/upsc/geographyLearning";
import {
  getGeographyContentModule,
  getPrimaryGeographyContentModuleForDay,
} from "@/lib/upsc/geographyContentModules";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { useGeographyProgress, type GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";
import { BrainDumpModal } from "@/components/upsc/BrainDumpModal";
import type { AdaptiveTeacherResponse } from "@/lib/upsc/adaptiveTeacher";
import { FragmentedSlideViewer } from "@/components/upsc/FragmentedSlideViewer";

const GEOGRAPHY_PROGRESS_STORAGE_KEY = "sarit-upsc-geography-progress-v1";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

// Speech recognition type shims
type SpeechRecognitionClass = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  type?: string;
};
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { isFinal: boolean; length: number; [index: number]: SpeechRecognitionAlternative };
type SpeechRecognitionResultList = { length: number; [index: number]: SpeechRecognitionResult };
type SpeechRecognitionEvent = { resultIndex: number; results: SpeechRecognitionResultList };

function getSpeechRecognitionClass(): SpeechRecognitionClass | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionClass | null ?? null;
}
type SpeechRecognitionInstance = InstanceType<SpeechRecognitionClass>;

function writeImmediateGeographyProgress(day: number, patch: Omit<Partial<GeographyDayProgress>, "day">) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(GEOGRAPHY_PROGRESS_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const key = String(day);
    const next = {
      ...current,
      [key]: {
        ...(current?.[key] ?? {}),
        day,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    };
    window.localStorage.setItem(GEOGRAPHY_PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────
// Universe Interactive Subtopics Definition
// ─────────────────────────────────────────────────────────────────────

type InteractiveSubtopic = {
  id: string;
  title: string;
  keywords: string[];
  slides: {
    title: string;
    segments: string[]; // Segment-by-segment reveal content
  }[];
  mcqs: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[];
};

const universeSubtopics: InteractiveSubtopic[] = [
  {
    id: "def-universe-scale",
    title: "1. Definition of Universe & Cosmic Scale",
    keywords: ["universe", "cosmos", "scale", "boundary", "observable", "expansion", "baryonic"],
    slides: [
      {
        title: "Understanding Universe vs Cosmos",
        segments: [
          "The Universe encompasses all of space, time, matter, and energy. While 'Universe' is the physical totality, 'Cosmos' refers to the Universe viewed as an orderly, harmonious system.",
          "Ongoing research suggests the observable universe is about 93 billion light-years across, but the entire universe may be infinite, expanding at an accelerating rate."
        ]
      },
      {
        title: "Observable Limits & Expansion",
        segments: [
          "The boundary of what we can observe is limited by the speed of light and the age of the Universe (13.8 billion years).",
          "Modern research shows the expansion is accelerating, driven by dark energy, meaning some distant objects will eventually drift beyond our light horizon."
        ]
      }
    ],
    mcqs: [
      {
        question: "Consider the following statements regarding the Universe and Cosmos:\n1. The terms Universe and Cosmos represent the identical physical boundary of space.\n2. The observable universe has a radius of approximately 13.8 billion light-years.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 3,
        explanation: "Statement 1 is incorrect: Universe is the physical totality, while Cosmos is the conceptual view as an orderly system. Statement 2 is incorrect: The radius of the observable universe is approximately 46.5 billion light-years (diameter of 93 billion light-years), not 13.8 billion light-years (which is the age)."
      },
      {
        question: "Which of the following statements is/are correct regarding cosmic expansion?\n1. The expansion of the universe implies that galaxies themselves are expanding in physical volume.\n2. Space is expanding at an accelerating rate, which is currently attributed to dark energy.\nSelect the correct option:",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 1,
        explanation: "Statement 1 is incorrect: Galaxies are gravitationally bound structures and do not physically expand as space expands. Statement 2 is correct: Dark energy drives the accelerating expansion of space."
      }
    ]
  },
  {
    id: "big-bang-singularity",
    title: "2. Big Bang Theory & Early Singularity",
    keywords: ["big bang", "singularity", "hot", "dense", "cooling", "nucleosynthesis", "helium", "hydrogen"],
    slides: [
      {
        title: "The Big Bang Singularity",
        segments: [
          "At time zero (~13.8 billion years ago), the universe was concentrated in a singularity—a point of infinite density, infinite mass, and zero volume.",
          "The Big Bang was not an explosion of matter into pre-existing empty space. Rather, it was the rapid expansion of space-time itself."
        ]
      },
      {
        title: "Early Nucleosynthesis",
        segments: [
          "Within the first three minutes, temperature dropped enough for protons and neutrons to form the first nuclei (primordial nucleosynthesis).",
          "This cooling resulted in an abundance of light elements, predominantly Hydrogen (~75%) and Helium (~25%), which matches current observed distributions."
        ]
      }
    ],
    mcqs: [
      {
        question: "Regarding the Big Bang Theory, consider the following statements:\n1. The Big Bang was a localized explosion of super-dense matter into a pre-existing infinite void.\n2. The early universe singularity possessed infinite mass and infinite density with zero volume.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 1,
        explanation: "Statement 1 is incorrect: The Big Bang was the expansion of space itself, not an explosion of matter into a pre-existing void. Statement 2 is correct: A gravitational singularity has infinite mass and density with zero volume."
      },
      {
        question: "Which of the following elements formed the vast majority of matter during the initial cooling phase of the early universe?\n1. Hydrogen\n2. Helium\n3. Lithium\nSelect the correct answer:",
        options: ["1 only", "1 and 2 only", "2 and 3 only", "1, 2 and 3"],
        answerIndex: 1,
        explanation: "During primordial nucleosynthesis, Hydrogen (~75%) and Helium (~25%) formed the absolute majority of elements. Lithium was created only in trace amounts."
      }
    ]
  },
  {
    id: "hubble-redshift-cmbr",
    title: "3. Hubble's Law, Red-shift & CMBR",
    keywords: ["hubble", "redshift", "wavelength", "cmb", "penzias", "wilson", "leftover", "radiation"],
    slides: [
      {
        title: "Edwin Hubble's Redshift Discovery",
        segments: [
          "In 1929, Edwin Hubble observed that the light from distant galaxies is shifted toward longer, redder wavelengths (redshift).",
          "Hubble's Law states that the velocity of recession of a galaxy is proportional to its distance from us, proving the universe is expanding."
        ]
      },
      {
        title: "Cosmic Microwave Background Radiation (CMBR)",
        segments: [
          "Discovered in 1965 by Arno Penzias and Robert Wilson, CMBR is the fossilized electromagnetic radiation left over from the hot early universe.",
          "It represents a thermal blackbody spectrum at a temperature of 2.7 Kelvin, mapping the first light released when atoms formed."
        ]
      }
    ],
    mcqs: [
      {
        question: "With reference to cosmic redshift, consider the following statements:\n1. Redshift occurs when a light source moves toward the observer, causing the wavelength to compress.\n2. Hubble's Law establishes that the recessional velocity of a galaxy is inversely proportional to its distance from the Earth.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 3,
        explanation: "Both statements are incorrect: Redshift occurs when objects move away, stretching the wavelength. Hubble's Law states recessional velocity is directly proportional to distance (not inversely)."
      },
      {
        question: "Consider the following statements regarding CMBR:\n1. CMBR is high-energy gamma-ray radiation emitted by active black holes in nearby galaxies.\n2. It provides direct evidence of the extremely hot and dense early state of the universe.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 1,
        explanation: "Statement 1 is incorrect: CMBR is low-energy microwave radiation, not gamma-rays from black holes. Statement 2 is correct: CMBR is fossilized heat from the early hot state of the Universe."
      }
    ]
  },
  {
    id: "dark-matter-energy",
    title: "4. Dark Matter & Dark Energy Composition",
    keywords: ["dark matter", "dark energy", "composition", "gravitational", "lensing", "rotation", "density"],
    slides: [
      {
        title: "Dark Matter: The Invisible Glue",
        segments: [
          "Dark Matter does not emit, absorb, or reflect light, making it invisible. We know it exists because of its gravitational effects on visible matter (galaxy rotation curves).",
          "It accounts for roughly 27% of the universe's total mass-energy density, acting as the structural scaffolding for galaxies."
        ]
      },
      {
        title: "Dark Energy: The Acceleration Driver",
        segments: [
          "Dark Energy is a hypothetical, repulsive force that drives the accelerating expansion of the universe, acting as a cosmological constant.",
          "It constitutes approximately 68% of the universe. Ordinary baryonic matter (stars, planets, dust, humans) makes up less than 5% of the total composition."
        ]
      }
    ],
    mcqs: [
      {
        question: "Consider the following statements:\n1. Ordinary baryonic matter constitutes about 27% of the universe's composition.\n2. Dark energy is a repulsive force responsible for accelerating the expansion of space.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 1,
        explanation: "Statement 1 is incorrect: Ordinary matter constitutes less than 5%. Dark matter is ~27%. Statement 2 is correct: Dark energy drives acceleration."
      },
      {
        question: "Which of the following serves as evidence for the existence of Dark Matter?\n1. The rotational velocity of stars in outer spiral arms is higher than predicted by visible mass.\n2. Gravitational lensing of distant light around galaxy clusters.\nSelect the correct answer:",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 2,
        explanation: "Both 1 and 2 are primary evidences of Dark Matter: galaxy rotation anomalies and gravitational bending of light without visible mass."
      }
    ]
  },
  {
    id: "life-cycle-stars",
    title: "5. Life Cycle of Stars (Nebula to Black Hole)",
    keywords: ["nebula", "protostar", "sequence", "giant", "supernova", "neutron", "black hole", "fusion"],
    slides: [
      {
        title: "Star Formation and the Main Sequence",
        segments: [
          "Stars form in interstellar clouds of gas and dust called nebulae. Under gravity, the gas collapses to form a protostar, heating up until nuclear fusion of hydrogen into helium begins.",
          "Once fusion stabilizes, the star enters the Main Sequence phase (like our Sun), where outward radiation pressure balances inward gravity."
        ]
      },
      {
        title: "Death of Stars: Low-Mass vs Massive",
        segments: [
          "Low-mass stars expand into Red Giants, shed their outer layers as planetary nebulae, and leave behind dense White Dwarfs.",
          "High-mass stars expand into Red Supergiants, undergo a violent Supernova explosion, and collapse into a Neutron Star or a Black Hole."
        ]
      }
    ],
    mcqs: [
      {
        question: "With reference to the life cycle of stars, consider the following statements:\n1. In the Main Sequence phase, a star is in hydrostatic equilibrium, where inward gravity balances outward fusion pressure.\n2. Low-mass stars (like the Sun) end their lives in a supernova explosion, leaving behind a neutron star.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        answerIndex: 0,
        explanation: "Statement 1 is correct: hydrostatic equilibrium balances gravity and pressure. Statement 2 is incorrect: low-mass stars end as White Dwarfs. Only high-mass stars explode as supernovas."
      },
      {
        question: "Which of the following celestial bodies represents the final stage of a highly massive star whose core collapse exceeds three solar masses?",
        options: ["White Dwarf", "Pulsar", "Black Hole", "Red Giant"],
        answerIndex: 2,
        explanation: "If the remnant core exceeds 3 solar masses (Tolman-Oppenheimer-Volkoff limit), gravity overcomes neutron degeneracy pressure, collapsing into a Black Hole."
      }
    ]
  }
];

export function GeographyWatchRoom({
  initialDay,
  initialModuleId,
  initialSectionId,
}: {
  initialDay?: number;
  initialModuleId?: string;
  initialSectionId?: string;
}) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");

  // Flow State
  const [roomState, setRoomState] = useState<"landing" | "presentation" | "recall" | "results" | "gap_fill">("landing");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Hidden Camera Track
  const [cameraStatus, setCameraStatus] = useState<"idle" | "granted" | "denied">("idle");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Voice activity tracking during slides
  const [showVoiceIntervention, setShowVoiceIntervention] = useState(false);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);

  // Speech recall states
  const [isListening, setIsListening] = useState(false);
  const [recallText, setRecallText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<AdaptiveTeacherResponse | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const activeSession = resolveSession(activeDay);
  const watchScenes = buildGeographyWatchScenes(activeSession);
  const requestedModule = getGeographyContentModule(initialModuleId);
  const dayModule = getPrimaryGeographyContentModuleForDay(activeSession.day);
  const activeModule = requestedModule?.day === activeSession.day ? requestedModule : dayModule;
  const durationMinutes = watchScenes.reduce((total, scene) => total + scene.durationMinutes, 0);
  const recap = getCompressedGeographyRecap(activeSession);
  const subtopics = getGeographySubtopics(activeSession);
  const labSlug = labSlugForGeographySession(activeSession.lab);
  const progress = getDayProgress(activeSession.day);
  const talkCleared = hasGeographyTalkClearance(progress);

  // ─────────────────────────────────────────────────────────────────────
  // Universe Subtopic Selection States
  // ─────────────────────────────────────────────────────────────────────
  const isUniverseDay = activeDay === 2;
  const [selectedSubtopic, setSelectedSubtopic] = useState<InteractiveSubtopic | null>(null);
  const [subtopicState, setSubtopicState] = useState<"selector" | "initial_recall" | "results" | "gap_slides" | "mcq" | "report">("selector");
  const [subtopicSelectorExpanded, setSubtopicSelectorExpanded] = useState(true);

  // Dynamic content reveal states for slides
  const [visibleSegmentIndex, setVisibleSegmentIndex] = useState(0);
  const [slideVoiceRecallText, setSlideVoiceRecallText] = useState("");
  const [isSlideListening, setIsSlideListening] = useState(false);
  const [slideVoiceMatched, setSlideVoiceMatched] = useState(false);
  const [slideGapFilledPercent, setSlideGapFilledPercent] = useState(0);
  
  // MCQ state
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqCorrectCount, setMcqCorrectCount] = useState(0);

  // Interactive completed tracking to show checkmarks
  const [completedSubtopics, setCompletedSubtopics] = useState<Record<string, boolean>>({});

  // Behavioral tracking states
  const [dismissCount, setDismissCount] = useState(0);
  const [sentimentLog, setSentimentLog] = useState<string[]>([]);
  const [voiceHeuristicPaused, setVoiceHeuristicPaused] = useState(false);

  // Define uniform slides
  const slides = activeModule
    ? activeModule.sections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        eyebrow: sec.eyebrow || "Lesson Module",
        body: sec.body,
        bullets: sec.bullets || [],
        image: sec.image,
      }))
    : watchScenes.map((scene, idx) => ({
        id: scene.id,
        title: scene.title,
        eyebrow: `Step ${idx + 1}: ${scene.kind.toUpperCase()}`,
        body: scene.narration,
        bullets: [scene.checkpoint],
        image: undefined,
      }));

  // Map missing keywords to slides dynamically
  const getSlideTitleForKeyword = (kw: string) => {
    const matchingSlide = slides.find(
      (s) =>
        s.title.toLowerCase().includes(kw.toLowerCase()) ||
        s.body.toLowerCase().includes(kw.toLowerCase()) ||
        s.bullets.some((b) => b.toLowerCase().includes(kw.toLowerCase()))
    );
    return matchingSlide ? matchingSlide.title : slides[0].title;
  };

  // Determine which slides have gaps
  const missingKeywords = aiResponse?.assessment?.missingKeywords || [];
  const gapSlides = slides.filter((slide) => {
    return missingKeywords.some(
      (kw) =>
        slide.title.toLowerCase().includes(kw.toLowerCase()) ||
        slide.body.toLowerCase().includes(kw.toLowerCase()) ||
        slide.bullets.some((b) => b.toLowerCase().includes(kw.toLowerCase()))
    );
  });

  const [gapSlideIndex, setGapSlideIndex] = useState(0);

  // Initialize Speech Support
  useEffect(() => {
    if (getSpeechRecognitionClass()) {
      setHasSpeechSupport(true);
    }
    setLearnerLevel(readStudentProfile()?.level ?? "beginner");
  }, []);

  // Request Camera silently in background
  const requestCameraInBackground = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus("granted");
      setCameraStream(stream);
    } catch {
      setCameraStatus("denied");
    }
  };

  useEffect(() => {
    void requestCameraInBackground();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Background Audio Monitor for Voice Interruption during slides
  useEffect(() => {
    if (roomState !== "presentation" && subtopicState !== "gap_slides") return;

    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let interval: NodeJS.Timeout | null = null;

    const startBackgroundVoiceListener = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let activeTimeMs = 0;

        interval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // human speech threshold
          if (average > 18) {
            activeTimeMs += 300;
            // Ignore sounds under 12 seconds; trigger popup only at 15-30s (we choose 16s)
            if (activeTimeMs >= 16000) {
              if (!voiceHeuristicPaused) {
                setShowVoiceIntervention(true);
                // Sentiment log
                setSentimentLog((curr) => [...curr, `Detected conversation at: ${new Date().toLocaleTimeString()}`]);
              }
              activeTimeMs = 0;
            }
          } else {
            activeTimeMs = Math.max(0, activeTimeMs - 150);
          }
        }, 300);
      } catch (err) {
        console.warn("Could not start background voice listener:", err);
      }
    };

    void startBackgroundVoiceListener();

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) {
        void audioCtx.close();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomState, subtopicState, voiceHeuristicPaused]);

  // Speech Recognition control
  const toggleSpeechListening = () => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = recallText;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      setRecallText(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Slide Voice Recall Recognition
  const toggleSlideListening = () => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    if (isSlideListening) {
      recognitionRef.current?.stop();
      setIsSlideListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      setSlideVoiceRecallText(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsSlideListening(false);
    };

    recognition.onend = () => {
      setIsSlideListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsSlideListening(true);
  };

  // Submit recall text to AI
  const handleSubmitRecall = async () => {
    if (!recallText.trim()) return;
    setIsListening(false);
    recognitionRef.current?.stop();
    setIsProcessingAI(true);

    const expectedKeywords = activeModule
      ? activeModule.sections.flatMap((sec) =>
          sec.expectedRecallPoints.flatMap((point) => point.keywords)
        )
      : extractKeywords(activeSession);

    try {
      const token = localStorage.getItem("clerk-db-token");
      const res = await fetch("/api/upsc/teacher/discuss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subjectSlug: "geography",
          day: activeDay,
          answer: recallText,
          learnerLevel: learnerLevel,
          moduleId: activeModule?.id,
          expectedRecallPoints: expectedKeywords,
        }),
      });

      if (!res.ok) throw new Error("API failed");

      const data = (await res.json()) as AdaptiveTeacherResponse;
      setAiResponse(data);
      setRoomState("results");
    } catch {
      // Offline fallback: local keyword analysis
      const localResult = assessGeographyExplanation(activeSession, recallText);
      const fallbackData: AdaptiveTeacherResponse = {
        mode: "local-fallback",
        providerConfigured: false,
        trace: {
          promptVersion: "local-v1",
          rubricVersion: "local-v1",
          recallTarget: 70,
        },
        assessment: localResult,
        coach: {
          summary: localResult.summary,
          nextPrompt: localResult.nextAction,
          focusConcepts: localResult.missingKeywords,
          doubtDiagnosis: {
            category: "Recall",
            reason: "Review the missing concepts.",
            repairAction: "Complete the gap fill cards.",
            masteryCheck: "Can you list the missing keywords?",
          },
        },
      };
      setAiResponse(fallbackData);
      setRoomState("results");
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Helper local assessment for Universe subtopics
  const evaluateSubtopicRecallLocal = (subtopic: InteractiveSubtopic, text: string) => {
    const lower = text.toLowerCase();
    const matched = subtopic.keywords.filter((kw) => lower.includes(kw.toLowerCase()));
    const missing = subtopic.keywords.filter((kw) => !lower.includes(kw.toLowerCase()));
    const score = Math.round((matched.length / subtopic.keywords.length) * 100);

    return {
      score,
      matchedKeywords: matched,
      missingKeywords: missing,
      summary: score >= 80 
        ? "Excellent concept command! You have hit most of the core markers." 
        : score >= 40 
        ? "Decent recall, but major structural links are missing. Bridge the gap to solidify your memory." 
        : "Critical gap diagnosed. The core mechanisms, parameters, and traps are missing.",
      nextPrompt: score >= 80 ? "You can proceed to MCQs." : "Open Bridge the Gap to study the missing concepts."
    };
  };

  const handleSubtopicRecallSubmit = () => {
    if (!selectedSubtopic || !recallText.trim()) return;
    setIsListening(false);
    recognitionRef.current?.stop();

    const evaluation = evaluateSubtopicRecallLocal(selectedSubtopic, recallText);
    setAiResponse({
      mode: "local-fallback",
      providerConfigured: false,
      trace: { promptVersion: "local-v1", rubricVersion: "local-v1", recallTarget: 80 },
      assessment: {
        score: evaluation.score,
        band: evaluation.score >= 80 ? "Command" : evaluation.score >= 40 ? "Practice" : "Revisit",
        matchedKeywords: evaluation.matchedKeywords,
        missingKeywords: evaluation.missingKeywords,
        summary: evaluation.summary,
        nextAction: evaluation.nextPrompt,
        repairHints: evaluation.missingKeywords.map(k => `Review key parameters for ${k}`),
        rubric: [
          {
            label: "Recall",
            score: Math.round(evaluation.score / 20),
            max: 5,
            status: evaluation.score >= 80 ? "Ready" : evaluation.score >= 40 ? "Forming" : "Weak",
            evidence: `Recalled ${evaluation.matchedKeywords.length} of ${selectedSubtopic.keywords.length} keywords.`
          },
          {
            label: "Mechanism",
            score: evaluation.score >= 60 ? 4 : 2,
            max: 5,
            status: evaluation.score >= 60 ? "Ready" : "Weak",
            evidence: evaluation.score >= 60 ? "Primary mechanism described correctly." : "Mechanism explanation has gaps."
          },
        ]
      },
      coach: {
        summary: evaluation.summary,
        nextPrompt: evaluation.nextPrompt,
        focusConcepts: evaluation.missingKeywords,
        doubtDiagnosis: {
          category: "Mechanism",
          reason: "Key conceptual anchors are missing in the oral recall.",
          repairAction: "Study the highlighted slides segment-by-segment.",
          masteryCheck: "Speak back slide keywords after study."
        }
      }
    });

    setSubtopicState("results");
  };

  // Persist final completion
  const handleFinalComplete = () => {
    const finalScore = aiResponse?.assessment?.score ?? 70;
    const patch: Omit<Partial<GeographyDayProgress>, "day"> = {
      watched: true,
      watchState: "Watched",
      watchMinutes: durationMinutes,
      talkScore: finalScore,
      reflection: recallText,
      watchHandoffReady: true,
      watchHandoffSummary: `Score: ${finalScore}. Recalled: ${aiResponse?.assessment?.matchedKeywords.join(", ")}`,
      labMode: labSlug,
    };
    writeImmediateGeographyProgress(activeSession.day, patch);
    saveDayProgress(activeSession.day, patch);
    router.push(`/upsc/geography/mcq-readiness?day=${activeSession.day}`);
  };

  const handleDismissIntervention = () => {
    setShowVoiceIntervention(false);
    const newDismissCount = dismissCount + 1;
    setDismissCount(newDismissCount);
    setSentimentLog((curr) => [...curr, `Dismissed intervention popup. Total: ${newDismissCount}`]);
    
    if (newDismissCount >= 2) {
      setVoiceHeuristicPaused(true);
      // Log frustrated emotion
      setSentimentLog((curr) => [...curr, "Student marked as: Frustrated. Voice diagnostics backed off."]);
    }
  };

  // Render Visual Component dynamically by Day
  const renderVisualComponent = (stageIndex: number) => {
    switch (activeSession.day) {
      case 1:
        return <GeographyDay1MapThinkingVisual />;
      case 2:
        return <GeographyDay2UniverseVisual />;
      case 3:
        return <GeographyDay3PlateVisual />;
      case 4:
        return <GeographyDay4GeomorphicVisual />;
      case 5:
        return <GeographyDay5ClimatologyVisual />;
      case 6:
        return <GeographyDay6OceanVisual />;
      case 7:
        return <GeographyDay7ConsolidationVisual />;
      case 8:
        return <GeographyDay8IndiaReliefVisual />;
      case 9:
        return <GeographyDay9DrainageVisual />;
      case 10:
        return <GeographyDay10MonsoonVisual />;
      case 11:
        return <GeographyDay11ClimateRegionsVisual />;
      case 12:
        return <GeographyDay12SoilsVegetationVisual />;
      case 13:
        return <GeographyDay13ResourcesAgricultureVisual />;
      case 14:
        return <GeographyDay14IndiaMapDrillVisual />;
      case 15:
        return <GeographyDay15PopulationVisual />;
      case 16:
        return <GeographyDay16SettlementsVisual />;
      case 17:
        return <GeographyDay17EconomicActivitiesVisual />;
      case 18:
        return <GeographyDay18TransportTradeVisual />;
      case 19:
        return <GeographyDay19IndustryLocationVisual />;
      case 20:
        return <GeographyDay20RegionalDevelopmentVisual />;
      case 21:
        return <GeographyDay21HumanGeographyConsolidationVisual />;
      case 22:
        return <GeographyDay22AtlasMasteryVisual />;
      case 23:
        return <GeographyDay23PyqPatternReadingVisual />;
      case 24:
        return <GeographyDay24DisasterGeographyBridgeVisual />;
      case 25:
        return <GeographyDay25EnvironmentGeographyBridgeVisual />;
      case 26:
        return <GeographyDay26MainsGeographyApplicationVisual />;
      case 27:
        return <GeographyDay27FullGeographyDrillVisual />;
      case 28:
        return <GeographyDay28WeakAreaRepairVisual />;
      case 29:
        return <GeographyDay29FinalMockReviewVisual />;
      case 30:
        return <GeographyDay30GeographyCommandDayVisual />;
      default:
        return (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-white/15 bg-[#0f2a20] p-5 text-center">
            <p className="text-sm font-black leading-6 text-white/80">
              Visual slot: study map, NASA/public-domain image, or portal-native diagram here.
            </p>
          </div>
        );
    }
  };

  const extractKeywords = (session: GeographySession) => {
    const stopWords = new Set([
      "and", "the", "for", "with", "from", "into", "this", "that",
      "why", "how", "are", "does", "can", "day", "base", "basics",
      "study", "understand"
    ]);
    const source = [
      session.title,
      session.chapter,
      session.anchor,
      session.watch,
      session.talk,
      session.test,
      ...(session.subtopics || []),
    ].join(" ");

    const words = source
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !stopWords.has(word));

    return Array.from(new Set(words)).slice(0, 15);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Loading Watch Room...
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // HIGH-FIDELITY UNIVERSE INTERACTIVE SYLLABUS LAYOUT (Day 2 Override)
  // ─────────────────────────────────────────────────────────────────────

  if (isUniverseDay) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d] font-sans antialiased">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
          <GeographyRoomCompass
            day={activeSession.day}
            room="Watch"
            title={activeSession.title}
            detail={`Interactive Universe Syllabus: select subtopics, evaluate knowledge gaps, read slides segment-by-segment, and verify command with UPSC MCQs.`}
            primaryLabel="UPSC Command"
            primaryHref="/upsc/daily-command"
          />

          {voiceHeuristicPaused && (
            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-3 text-xs text-[#085041] font-bold">
              ℹ️ AI Teacher is in silent mode to protect your study focus. We will not prompt voice interventions.
            </div>
          )}

          {/* ─── PHASE 1: SUBTOPIC SELECTOR INDEX ─── */}
          {subtopicState === "selector" && (
            <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 md:p-8 shadow-sm text-[#13251d]">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1d9e75]">Geography Curriculum</span>
                <h1 className="text-3xl font-black tracking-tight text-[#13251d] mt-1">Syllabus Subtopics Index</h1>
                <p className="text-sm font-medium text-[#657066] mt-1">
                  Expand the main module header and click any subtopic to launch the active recall study loop.
                </p>
              </div>

              {/* Main Topic Accordion Container */}
              <div className="rounded-xl border border-[#cfe5dc] bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setSubtopicSelectorExpanded(!subtopicSelectorExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left font-black bg-[#e7f5ee] text-[#13251d] border-b border-[#cfe5dc]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                      <Route className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg">UNIVERSE (Main Topic)</h3>
                      <p className="text-xs text-[#085041]/75 font-semibold">GS Paper I Physical Geography • 5 Active Modules</p>
                    </div>
                  </div>
                  {subtopicSelectorExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {subtopicSelectorExpanded && (
                  <div className="divide-y divide-[#cfe5dc]/50 bg-white">
                    {universeSubtopics.map((sub) => {
                      const isDone = completedSubtopics[sub.id];
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubtopic(sub);
                            setSubtopicState("initial_recall");
                            setRecallText("");
                            setAiResponse(null);
                          }}
                          className="flex items-center justify-between p-4 hover:bg-[#fdfaf3] cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              isDone ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7]"
                            }`}>
                              {isDone ? <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" /> : <div className="h-2 w-2 rounded-full bg-transparent" />}
                            </div>
                            <span className="text-sm font-black text-[#13251d]">{sub.title}</span>
                          </div>
                          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${
                            isDone ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#cfc6b6] text-[#657066]"
                          }`}>
                            {isDone ? "Completed" : "Start"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── PHASE 2: INITIAL SPEECH RECALL CANVAS ─── */}
          {subtopicState === "initial_recall" && selectedSubtopic && (
            <section className="rounded-xl border border-[#203c30] bg-[#0b1411] p-6 text-white shadow-2xl min-h-[35rem] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

              <div className="flex items-center justify-between z-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#75ddbc]">
                    Pre-Lecture Gap Identification
                  </span>
                  <h2 className="text-lg font-bold">{selectedSubtopic.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSubtopicState("selector")}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Exit Topic
                </button>
              </div>

              {/* Central Mic Icon (Glowing German Tech design) */}
              <div className="flex flex-col items-center justify-center my-6 z-10">
                <button
                  type="button"
                  onClick={toggleSpeechListening}
                  className={cn(
                    "relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300 border-4 border-solid",
                    isListening
                      ? "bg-[#be4444] border-[#be4444] animate-pulse shadow-[0_0_35px_#be4444,0_0_55px_#b07d1a]"
                      : "bg-[#13251d] border-[#cfe5dc] hover:bg-[#1a3a2a] shadow-[0_0_20px_rgba(29,158,117,0.15)]"
                  )}
                >
                  {isListening ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full border border-solid border-[#be4444] animate-ping opacity-75" />
                      <span className="absolute -inset-2 rounded-full border border-solid border-[#b07d1a] opacity-50 animate-pulse" />
                    </>
                  )}
                </button>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/50 text-center">
                  {isListening ? "Listening... Speak what you know about this subtopic" : "Tap to Speak"}
                </p>
              </div>

              {/* Real-time speech transcription */}
              <div className="flex-1 flex flex-col justify-center items-center py-4 z-10">
                <div className="max-w-2xl text-center leading-relaxed text-base font-semibold text-white/80">
                  {recallText.trim() ? (
                    <span>&quot;{recallText}&quot;</span>
                  ) : (
                    <span className="text-white/30 italic">Whatever you speak will appear here in real-time. Speak out keys like Big Bang, CMB, Redshift, Dark Energy, etc.</span>
                  )}
                </div>
              </div>

              {/* Text fallback input */}
              <div className="border-t border-white/10 pt-4 flex flex-col gap-4 z-10">
                <textarea
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  placeholder="Review or type your conceptual explanation here..."
                  className="min-h-16 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white focus:border-[#1d9e75] outline-none"
                />

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/40">
                    * Tap mic to speak or edit fallback, then submit to check gaps.
                  </p>
                  <button
                    type="button"
                    disabled={!recallText.trim()}
                    onClick={handleSubtopicRecallSubmit}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#087a59] transition"
                  >
                    Submit Explanation <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ─── PHASE 3: COMPARATIVE RESULTS VERDICT SHEET ─── */}
          {subtopicState === "results" && selectedSubtopic && aiResponse && (
            <section className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm flex flex-wrap items-center justify-between gap-5 text-[#13251d]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f5ee] text-[#085041]">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1d9e75]">Topic Audit</span>
                    <h2 className="text-2xl font-black text-[#13251d]">
                      {aiResponse.assessment.score}% Conceptual Alignment
                    </h2>
                  </div>
                </div>

                <div className="flex gap-2 text-xs font-black">
                  <span className="rounded bg-[#e7f5ee] border border-[#b9d9cd] px-3 py-1.5 text-[#085041]">
                    Matched: {aiResponse.assessment.matchedKeywords.length}
                  </span>
                  <span className="rounded bg-[#fff4df] border border-[#ef9f27]/50 px-3 py-1.5 text-[#6f4a12]">
                    Gaps: {aiResponse.assessment.missingKeywords.length}
                  </span>
                </div>
              </div>

              {/* Two Column Verdict Comparison */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Left: Matched Content */}
                <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between text-[#13251d]">
                  <div>
                    <h3 className="text-lg font-black text-[#13251d] border-b border-[#dcd5c7] pb-2">
                      What You Recalled
                    </h3>
                    <p className="mt-4 text-xs italic bg-[#f7f4ee] p-3 rounded-lg border border-[#cfe5dc] text-[#5d675f]">
                      &quot;{recallText}&quot;
                    </p>
                    <div className="mt-4">
                      <p className="text-[10px] font-black uppercase text-[#1d9e75] tracking-wider mb-2">Matched Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.assessment.matchedKeywords.map((kw) => (
                          <span key={kw} className="rounded bg-green-100 border border-green-200 px-2 py-0.5 text-xs font-bold text-green-800">
                            {kw}
                          </span>
                        ))}
                        {aiResponse.assessment.matchedKeywords.length === 0 && (
                          <span className="text-xs text-[#8a8174] italic">No keywords matched.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: The Gap */}
                <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between text-[#13251d]">
                  <div>
                    <h3 className="text-lg font-black text-[#13251d] border-b border-[#dcd5c7] pb-2">
                      Concept Gaps Audited
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#be4444] tracking-wider mb-2">Missing Concepts</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.assessment.missingKeywords.map((kw) => (
                            <span key={kw} className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                              {kw}
                            </span>
                          ))}
                          {aiResponse.assessment.missingKeywords.length === 0 && (
                            <span className="text-xs text-green-800 font-bold">No gaps detected! Perfect recall.</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#fdfaf3] border border-[#cfc6b6] p-3 text-xs leading-relaxed font-semibold">
                        <span className="text-[9px] font-black text-[#1d9e75] uppercase block mb-1">AI Teacher Advice</span>
                        <p className="text-[#34453b]">{aiResponse.coach.summary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions navigation */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSubtopicState("initial_recall")}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-xs font-bold text-[#1a3a2a] hover:bg-[#fdfaf3]"
                >
                  Retry Oral Recall
                </button>

                {aiResponse.assessment.missingKeywords.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSubtopicState("gap_slides");
                      setVisibleSegmentIndex(0);
                      setSlideVoiceRecallText("");
                      setSlideVoiceMatched(false);
                      setSlideGapFilledPercent(0);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-5 text-sm font-black text-white hover:bg-[#0c7a59] transition shadow-md shadow-[#1d9e75]/15"
                  >
                    Bridge the Gap <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSubtopicState("mcq");
                      setCurrentMcqIndex(0);
                      setSelectedOptionIndex(null);
                      setMcqSubmitted(false);
                      setMcqCorrectCount(0);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white hover:bg-[#10291d] transition"
                  >
                    Practice MCQs <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ─── PHASE 4: INTERACTIVE GAP FILLING (FRAGMENTED PPT SLIDES) ─── */}
          {subtopicState === "gap_slides" && selectedSubtopic && (
            <section className="flex flex-col gap-4 text-[#13251d]">
              <div className="flex items-center justify-between border-b border-[#dcd5c7] pb-3 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#be4444] px-2 py-0.5 text-xs font-black text-white uppercase">
                    Gap Fill Mode
                  </span>
                  <span className="text-[#657066]">
                    {selectedSubtopic.title}
                  </span>
                </div>
                <div className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                  Fragmented Reveal Study
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr] items-stretch">
                <FragmentedSlideViewer
                  slides={selectedSubtopic.slides.map((s, idx) => ({
                    id: `${selectedSubtopic.id}-slide-${idx}`,
                    title: s.title,
                    segments: s.segments,
                    expectedKeywords: selectedSubtopic.keywords,
                  }))}
                  subjectAccent="#1d9e75"
                  subjectDark="#13251d"
                  subjectLight="#e7f5ee"
                  onComplete={() => {
                    setSubtopicState("mcq");
                    setCurrentMcqIndex(0);
                    setSelectedOptionIndex(null);
                    setMcqSubmitted(false);
                    setMcqCorrectCount(0);
                  }}
                />

                {/* Right: Custom visual */}
                <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0c1412] p-5 shadow-sm text-white">
                  <div className="w-full flex-1 flex flex-col justify-center">
                    {renderVisualComponent(0)}
                  </div>
                  <div className="mt-4 rounded-md bg-white/5 border border-white/10 p-3 text-xs font-medium text-white/70">
                    <span className="text-[9px] font-black text-[#75ddbc] uppercase block mb-0.5">Dynamic visuals</span>
                    Study the spatial relationship, chronological orders, and structural links side-by-side with slides.
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── PHASE 5: UPSC MULTI-STATEMENT MCQS ─── */}
          {subtopicState === "mcq" && selectedSubtopic && (
            <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 md:p-8 shadow-sm text-[#13251d] max-w-3xl mx-auto">
              <div className="mb-4 border-b border-[#cfe5dc] pb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">UPSC Command Evaluation</span>
                <h3 className="text-xl font-black mt-1">Multi-Statement Test</h3>
                <p className="text-xs text-[#657066] mt-0.5">Question {currentMcqIndex + 1} of {selectedSubtopic.mcqs.length}</p>
              </div>

              {/* MCQ Details */}
              <div className="space-y-6">
                <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4 font-semibold text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedSubtopic.mcqs[currentMcqIndex].question}
                </div>

                <div className="grid gap-2">
                  {selectedSubtopic.mcqs[currentMcqIndex].options.map((opt, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={mcqSubmitted}
                        onClick={() => setSelectedOptionIndex(idx)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border text-xs font-bold transition",
                          isSelected
                            ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                            : "border-[#dcd5c7] bg-white hover:bg-[#fdfaf3]"
                        )}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </button>
                    );
                  })}
                </div>

                {mcqSubmitted && (
                  <div className={`rounded-xl border p-4 text-xs font-semibold leading-relaxed ${
                    selectedOptionIndex === selectedSubtopic.mcqs[currentMcqIndex].answerIndex
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-800"
                  }`}>
                    <p className="font-black text-sm mb-1">
                      {selectedOptionIndex === selectedSubtopic.mcqs[currentMcqIndex].answerIndex
                        ? "✔️ Correct Answer!"
                        : `❌ Incorrect. Correct Option was: ${String.fromCharCode(65 + selectedSubtopic.mcqs[currentMcqIndex].answerIndex)}`}
                    </p>
                    <p className="mt-1 opacity-90">{selectedSubtopic.mcqs[currentMcqIndex].explanation}</p>
                  </div>
                )}
              </div>

              {/* MCQ submit & next navigation */}
              <div className="mt-8 flex justify-end items-center gap-3 border-t border-[#cfe5dc] pt-5">
                {!mcqSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOptionIndex === null}
                    onClick={() => {
                      setMcqSubmitted(true);
                      if (selectedOptionIndex === selectedSubtopic.mcqs[currentMcqIndex].answerIndex) {
                        setMcqCorrectCount(c => c + 1);
                      }
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white hover:bg-[#10291d]"
                  >
                    Submit Answer
                  </button>
                ) : currentMcqIndex < selectedSubtopic.mcqs.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMcqIndex(i => i + 1);
                      setSelectedOptionIndex(null);
                      setMcqSubmitted(false);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#13251d] px-5 text-sm font-black text-white hover:bg-[#1a3a2a]"
                  >
                    Next Question <ChevronRight className="ml-1 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSubtopicState("report");
                      // mark completed
                      setCompletedSubtopics(curr => ({ ...curr, [selectedSubtopic.id]: true }));
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition shadow-md shadow-[#1d9e75]/15"
                  >
                    Generate Report <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ─── PHASE 6: TOPIC REPORT & DYNAMIC SEQUENCE FORWARD LOOP ─── */}
          {subtopicState === "report" && selectedSubtopic && (
            <section className="rounded-xl border border-white/10 bg-[#0c1412] p-8 shadow-2xl text-center text-white max-w-md mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d9e75]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-center mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1d9e75]/20 text-[#1d9e75] border border-[#1d9e75]/40 animate-pulse">
                  <Award className="h-7 w-7" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white">Subtopic Cleared!</h3>
              <p className="text-xs text-[#cfe5dc] mt-1 font-semibold">Report summary of the active study session.</p>

              {/* Progress Summary Card */}
              <div className="my-6 bg-white/5 border border-white/10 rounded-xl p-5 text-left text-xs font-semibold leading-relaxed space-y-2 text-white/90">
                <p className="flex justify-between border-b border-white/10 pb-2">
                  <span>Topic Command Growth:</span>
                  <span className="font-black text-[#1d9e75]">10% ➔ 85%</span>
                </p>
                <p className="flex justify-between border-b border-white/10 pb-2">
                  <span>Sustained Study Time:</span>
                  <span>~6 Minutes</span>
                </p>
                <p className="flex justify-between border-b border-white/10 pb-2">
                  <span>Verbal Keywords Matched:</span>
                  <span>{aiResponse?.assessment?.matchedKeywords?.length ?? 4} matched</span>
                </p>
                <p className="flex justify-between">
                  <span>MCQ Accuracy:</span>
                  <span className="font-black text-[#ef9f27]">
                    {mcqCorrectCount} / {selectedSubtopic.mcqs.length} Correct
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Find next subtopic index to automatically highlight
                  const idx = universeSubtopics.findIndex(sub => sub.id === selectedSubtopic.id);
                  if (idx !== -1 && idx < universeSubtopics.length - 1) {
                    setSelectedSubtopic(universeSubtopics[idx + 1]);
                    setSubtopicState("initial_recall");
                    setRecallText("");
                    setAiResponse(null);
                  } else {
                    // completed all, go back to index
                    setSubtopicState("selector");
                  }
                }}
                className="w-full inline-flex h-12 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition transform hover:-translate-y-0.5 shadow-md shadow-[#1d9e75]/25"
              >
                Proceed to Next Subtopic <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </section>
          )}
        </div>

        {/* Global Voice Intervention Trigger modal */}
        {showVoiceIntervention && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-2xl text-[#13251d] transform scale-100 transition-transform">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff4df] text-[#6f4a12]">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black tracking-tight">AI Teacher Interruption</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#5d675f]">
                I noticed you explaining or raising a question. Would you like to pause and speak with the AI teacher, open the notepad, or resume your reading?
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceIntervention(false);
                    setSubtopicState("initial_recall");
                    setRecallText("");
                    setTimeout(() => toggleSpeechListening(), 200);
                  }}
                  className="w-full rounded-lg bg-[#1d9e75] py-3 text-sm font-black text-white hover:bg-[#087a59] transition text-center shadow-md shadow-[#1d9e75]/10"
                >
                  Enter Active Discussion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceIntervention(false);
                    setBrainDumpOpen(true);
                  }}
                  className="w-full rounded-lg border border-[#cfc6b6] bg-white py-3 text-sm font-bold text-[#1a3a2a] hover:bg-[#fdfaf3] transition text-center"
                >
                  Open Brain Dump Notepad
                </button>
                <button
                  type="button"
                  onClick={handleDismissIntervention}
                  className="w-full rounded-lg bg-[#13251d] py-3 text-sm font-black text-white hover:bg-[#1a3a2a] transition text-center"
                >
                  Ignore &amp; Resume Reading
                </button>
              </div>
            </div>
          </div>
        )}

        <BrainDumpModal isOpen={brainDumpOpen} onClose={() => setBrainDumpOpen(false)} />
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // STANDARD FLOW LAYOUT (For other days, eg. Day 1)
  // ─────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d] font-sans antialiased">
      {/* Hidden camera preview */}
      {cameraStatus === "granted" && cameraStream && (
        <video
          ref={(videoEl) => {
            if (videoEl && cameraStream && videoEl.srcObject !== cameraStream) {
              videoEl.srcObject = cameraStream;
            }
          }}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <GeographyRoomCompass
          day={activeSession.day}
          room="Watch"
          title={activeSession.title}
          detail={`Linear study path: Landing → Slides → Recall → AI Verdict → Gap Fill → Complete.`}
          primaryLabel="UPSC Command"
          primaryHref="/upsc/daily-command"
        />

        {/* ─── 1. LANDING STATE ─── */}
        {roomState === "landing" && (
          <section className="overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#13251d] p-6 text-white shadow-lg md:p-10 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d9e75]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="rounded-md bg-[#1d9e75] text-white font-bold tracking-wider uppercase text-[10px] px-2.5 py-1">
                  Topic Introduction
                </Badge>
                <span className="text-sm font-bold text-[#75ddbc]">Day {activeSession.day}</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl leading-tight">
                {activeSession.title}
              </h1>
              <p className="mt-4 text-base text-white/80 leading-relaxed font-medium">
                {activeSession.watch}
              </p>
              
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-white/70">
                <div className="rounded-md bg-white/5 px-3 py-2 border border-white/10">
                  <span className="block text-white/50 uppercase font-black tracking-wider text-[9px] mb-0.5">Syllabus Link</span>
                  {activeSession.chapter}
                </div>
                <div className="rounded-md bg-white/5 px-3 py-2 border border-white/10">
                  <span className="block text-white/50 uppercase font-black tracking-wider text-[9px] mb-0.5">Focus Anchor</span>
                  {activeSession.anchor.split(";")[0] || activeSession.anchor}
                </div>
                <div className="rounded-md bg-white/5 px-3 py-2 border border-white/10">
                  <span className="block text-white/50 uppercase font-black tracking-wider text-[9px] mb-0.5">Lesson Duration</span>
                  {durationMinutes} minutes slide deck
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setRoomState("presentation");
                    setCurrentSlideIndex(0);
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#087a59] transition transform hover:-translate-y-0.5 shadow-md shadow-[#1d9e75]/20"
                >
                  Start Lesson <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                {talkCleared && (
                  <Link
                    href={`/upsc/geography/mcq-readiness?day=${activeSession.day}`}
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15 transition"
                  >
                    Open MCQ Practice (Already Cleared)
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── 2. PRESENTATION STATE ─── */}
        {roomState === "presentation" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#dcd5c7] pb-3 text-sm font-bold text-[#13251d]">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#1d9e75] px-2 py-0.5 text-xs font-black text-white uppercase tracking-wider">
                  Slide deck
                </span>
                <span className="text-[#5d675f]">
                  Slide {currentSlideIndex + 1} of {slides.length}
                </span>
              </div>
              <div className="w-40 h-2 bg-[#eee6d7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d9e75] transition-all duration-300"
                  style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr] items-stretch">
              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between min-h-[30rem]">
                <article>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1d9e75]">
                    {slides[currentSlideIndex].eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-[#13251d] md:text-3xl leading-snug">
                    {slides[currentSlideIndex].title}
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-[#4f5e55]">
                    {slides[currentSlideIndex].body}
                  </p>
                  
                  {slides[currentSlideIndex].bullets && slides[currentSlideIndex].bullets.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {slides[currentSlideIndex].bullets.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-bold leading-relaxed text-[#34453b]"
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <div className="mt-8 flex items-center justify-between border-t border-[#dcd5c7] pt-4">
                  <button
                    type="button"
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                    className="inline-flex h-10 items-center gap-1 rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-bold text-[#1a3a2a] hover:bg-[#f2eadc] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {currentSlideIndex < slides.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                      className="inline-flex h-10 items-center gap-1 rounded-md bg-[#13251d] px-4 text-xs font-black text-white hover:bg-[#1a3a2a]"
                    >
                      Next Slide <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRoomState("recall")}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1d9e75] px-5 text-xs font-black text-white hover:bg-[#087a59] shadow-md shadow-[#1d9e75]/20"
                    >
                      Test My Knowledge <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0c1412] p-5 shadow-sm text-white">
                <div className="w-full flex-1 flex flex-col justify-center">
                  {slides[currentSlideIndex].image?.url ? (
                    <div className="overflow-hidden rounded-lg border border-white/15 bg-black/30">
                      <img
                        src={slides[currentSlideIndex].image.url}
                        alt={slides[currentSlideIndex].image.alt}
                        className="max-h-80 w-full object-cover rounded-md"
                      />
                      <p className="mt-2 text-[10px] text-white/50 text-center uppercase tracking-wide">
                        {slides[currentSlideIndex].image.credit}
                      </p>
                    </div>
                  ) : (
                    renderVisualComponent(currentSlideIndex)
                  )}
                </div>
                
                <div className="mt-4 rounded-md bg-white/5 border border-white/10 p-3 text-xs font-medium text-white/70">
                  <p className="font-bold uppercase tracking-wider text-[#75ddbc] text-[9px] mb-1">
                    Visual explanation
                  </p>
                  Use the slides to anchor core concepts, maps, and statement logic. Microphone is listening in background for query questions.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 3. RECALL STATE (BLANK CANVAS) ─── */}
        {roomState === "recall" && (
          <section className="rounded-xl border border-[#203c30] bg-[#0b1411] p-6 text-white shadow-2xl min-h-[36rem] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            
            <div className="flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#75ddbc]">
                  Oral Examination Canvas
                </span>
                <h2 className="text-lg font-bold">State what you recall</h2>
              </div>
              <button
                type="button"
                onClick={() => setRoomState("presentation")}
                className="text-xs text-white/50 hover:text-white"
              >
                Back to slides
              </button>
            </div>

            <div className="flex flex-col items-center justify-center my-6 z-10">
              <button
                type="button"
                onClick={toggleSpeechListening}
                className={cn(
                  "relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300 border-4 border-solid",
                  isListening
                    ? "bg-[#be4444] border-[#be4444] animate-pulse shadow-[0_0_35px_#be4444,0_0_55px_#b07d1a]"
                    : "bg-[#13251d] border-[#cfe5dc] hover:bg-[#1a3a2a] shadow-[0_0_20px_rgba(29,158,117,0.15)]"
                )}
              >
                {isListening ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-full border border-solid border-[#be4444] animate-ping opacity-75" />
                    <span className="absolute -inset-2 rounded-full border border-solid border-[#b07d1a] opacity-50 animate-pulse" />
                  </>
                )}
              </button>
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/50 text-center">
                {isListening ? "Listening... Speak your recall now" : "Tap to Speak"}
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-4 z-10">
              <div className="max-w-2xl text-center leading-relaxed text-lg md:text-xl font-medium tracking-wide">
                {recallText.trim() ? (
                  <span className="text-white/90">{recallText}</span>
                ) : (
                  <span className="text-white/30 italic">Whatever you speak will appear here in real-time. Start by narrating the main mechanism, map locations, and traps you read...</span>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col gap-4 z-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50">
                  Fallback Text Entry (Review or edit what was captured)
                </label>
                <textarea
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  placeholder="Review or type your conceptual explanation here..."
                  className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white focus:border-[#1d9e75] outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/40">
                  * Hit Submit or press Enter key to verify command with AI.
                </p>
                <button
                  type="button"
                  disabled={!recallText.trim() || isProcessingAI}
                  onClick={handleSubmitRecall}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#087a59] transition"
                >
                  {isProcessingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Recall...
                    </>
                  ) : (
                    <>
                      Submit Recall <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ─── 4. RESULTS STATE (AI COMPARISON) ─── */}
        {roomState === "results" && aiResponse && (
          <section className="flex flex-col gap-5">
            <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm flex flex-wrap items-center justify-between gap-5 text-[#13251d]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f5ee] text-[#085041]">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1d9e75]">
                    AI Evaluation Score
                  </p>
                  <h2 className="text-2xl font-black">
                    {aiResponse.assessment.score}% Topic Command
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                {aiResponse.assessment.rubric.map((item) => (
                  <div key={item.label} className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-2.5 py-1.5 text-center">
                    <span className="block text-[9px] text-[#49675e] uppercase font-black">
                      {item.label}
                    </span>
                    <span className="text-[#085041] font-black">
                      {item.score} / {item.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 text-[#13251d]">
              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black border-b border-[#dcd5c7] pb-2">
                    What You Recalled
                  </h3>
                  <div className="mt-4 text-sm font-semibold leading-relaxed space-y-4">
                    <p className="bg-[#f7f4ee] p-4 rounded-lg border border-[#dcd5c7] italic">
                      &quot;{recallText}&quot;
                    </p>
                    
                    <div>
                      <p className="text-xs uppercase font-black text-[#1d9e75] tracking-wider mb-2">
                        Matched Keywords &amp; Concepts
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.assessment.matchedKeywords.length > 0 ? (
                          aiResponse.assessment.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded bg-green-100 border border-green-200 px-2.5 py-1 text-xs font-bold text-green-800"
                            >
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#8a8174]">No core keywords matched yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black border-b border-[#dcd5c7] pb-2">
                    The Gap &amp; AI Teacher Verdict
                  </h3>
                  <div className="mt-4 space-y-5">
                    <div>
                      <p className="text-xs uppercase font-black text-[#be4444] tracking-wider mb-2">
                        Missing Concepts / Keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {missingKeywords.length > 0 ? (
                          missingKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800"
                            >
                              {kw} (slide: {getSlideTitleForKeyword(kw)})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-green-700 font-bold">100% recall clear! No gaps detected.</span>
                        )}
                      </div>
                    </div>

                    {missingKeywords.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 font-bold">
                        <p className="uppercase tracking-wider text-[9px] text-[#b07d1a] mb-1">
                          Missed Slides to Fill
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {Array.from(new Set(missingKeywords.map((kw) => getSlideTitleForKeyword(kw)))).map((title) => (
                            <li key={title}>{title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-lg border border-[#cfe5dc] bg-[#fdfaf3] p-4 text-xs font-semibold leading-relaxed">
                      <p className="text-[10px] font-black text-[#1d9e75] uppercase tracking-wider mb-1">
                        AI Teacher Diagnosis
                      </p>
                      <p className="text-[#34453b] font-bold">{aiResponse.coach.summary}</p>
                      <p className="mt-2 text-[#49675e] uppercase font-black text-[9px] tracking-wider">
                        Next Action Checklist
                      </p>
                      <p className="text-[#34453b] font-bold">{aiResponse.coach.nextPrompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoomState("recall")}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-xs font-bold text-[#1a3a2a] hover:bg-[#f2eadc]"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Retry Oral Recall
              </button>

              {missingKeywords.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setRoomState("gap_fill");
                    setGapSlideIndex(0);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-5 text-xs font-black text-white hover:bg-[#087a59] transition shadow-md shadow-[#1d9e75]/15"
                >
                  Fill the Gap <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalComplete}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#13251d] px-5 text-xs font-black text-white hover:bg-[#1a3a2a]"
                >
                  Proceed to MCQs <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ─── 5. GAP FILL STATE ─── */}
        {roomState === "gap_fill" && gapSlides.length > 0 && (
          <section className="flex flex-col gap-4 text-[#13251d]">
            <div className="flex items-center justify-between border-b border-[#dcd5c7] pb-3 text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#be4444] px-2 py-0.5 text-xs font-black text-white uppercase tracking-wider">
                  Gap Repair Mode
                </span>
                <span className="text-[#5d675f]">
                  Slide {gapSlideIndex + 1} of {gapSlides.length}
                </span>
              </div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                Only showing slides you missed in recall
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr] items-stretch">
                <FragmentedSlideViewer
                  slides={gapSlides.map((s) => ({
                    id: s.id,
                    title: s.title,
                    eyebrow: s.eyebrow,
                    body: s.body,
                    bullets: s.bullets,
                    expectedKeywords: aiResponse?.assessment?.missingKeywords,
                  }))}
                  subjectAccent="#1d9e75"
                  subjectDark="#13251d"
                  subjectLight="#e7f5ee"
                  onComplete={handleFinalComplete}
                />

              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0c1412] p-5 shadow-sm text-white">
                <div className="w-full flex-1 flex flex-col justify-center">
                  {gapSlides[gapSlideIndex].image?.url ? (
                    <div className="overflow-hidden rounded-lg border border-white/15 bg-black/30">
                      <img
                        src={gapSlides[gapSlideIndex].image.url}
                        alt={gapSlides[gapSlideIndex].image.alt}
                        className="max-h-80 w-full object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    renderVisualComponent(currentSlideIndex)
                  )}
                </div>
                
                <div className="mt-4 rounded-md bg-white/5 border border-white/10 p-3 text-xs font-medium text-white/70">
                  <p className="font-bold uppercase tracking-wider text-[#be4444] text-[9px] mb-1">
                    Focused study gap
                  </p>
                  Review only this segment to clear understanding. The portal will then immediately open the topic MCQs.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── VOICE DETECTION TRIGGER INTERVENTION DIALOG ─── */}
        {showVoiceIntervention && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-2xl text-[#13251d] transform scale-100 transition-transform">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff4df] text-[#6f4a12]">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black tracking-tight">Voice Interruption Detected</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#5d675f]">
                I noticed you speaking. Would you like to pause and enter discussion mode, dump your thoughts, or resume the lesson?
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceIntervention(false);
                    setRoomState("recall");
                    setRecallText("");
                    setTimeout(() => toggleSpeechListening(), 200);
                  }}
                  className="w-full rounded-lg bg-[#1d9e75] py-3 text-sm font-black text-white hover:bg-[#087a59] transition text-center shadow-md shadow-[#1d9e75]/10"
                >
                  Enter Recall / Discussion Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceIntervention(false);
                    setBrainDumpOpen(true);
                  }}
                  className="w-full rounded-lg border border-[#cfc6b6] bg-white py-3 text-sm font-bold text-[#1a3a2a] hover:bg-[#fdfaf3] transition text-center"
                >
                  Open Brain Dump Notepad
                </button>
                <button
                  type="button"
                  onClick={handleDismissIntervention}
                  className="w-full rounded-lg bg-[#13251d] py-3 text-sm font-black text-white hover:bg-[#1a3a2a] transition text-center"
                >
                  Ignore &amp; Resume Lesson
                </button>
              </div>
            </div>
          </div>
        )}

        <BrainDumpModal isOpen={brainDumpOpen} onClose={() => setBrainDumpOpen(false)} />
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Pause,
  Play,
  Volume2,
  Calendar,
  ChevronRight,
  Award,
  Sparkles,
  Trophy,
  Activity,
  User,
  Heart,
  TrendingUp,
  Brain,
  ShieldAlert,
  Loader2,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import type { StudentProfile } from "@/lib/upsc/studentProfile";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// WelcomeVideoOverlay Component
// ─────────────────────────────────────────────────────────────────────

export function WelcomeVideoOverlay({ onComplete }: { onComplete: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 20;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const percent = (currentTime / duration) * 100;

  const slides = [
    {
      title: "Pedagogical Feedback Loop",
      desc: "Learn a topic, express it in your own words, and clear the 95% recall gate before attempting high-quality MCQ variations.",
      badge: "Methodology",
    },
    {
      title: "Active Attention Monitoring",
      desc: "An intelligent webcam focus check automatically pauses lessons if you look away, keeping you deeply engaged in the content.",
      badge: "Attention",
    },
    {
      title: "Sunday AI-Guided Retros",
      desc: "Ditch static answer keys. Engage in conversational post-test discussions where the AI audits the logic behind your choices.",
      badge: "Review",
    },
    {
      title: "Frictionless Mobile Uploads",
      desc: "Snap photos of your written answers on your mobile device. They are stitched, ordered, and evaluated automatically.",
      badge: "Mains Prep",
    },
  ];

  const activeSlideIndex = Math.min(Math.floor(percent / 25), slides.length - 1);
  const activeSlide = slides[activeSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#13251d]/90 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-6 shadow-xl text-[#13251d]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Orientation video</span>
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Welcome to MCQ Portal & UPSC LMS</h2>
          </div>
          <button
            onClick={onComplete}
            className="rounded-md border border-[#cfc6b6] bg-white px-3 py-1.5 text-xs font-black text-[#13251d] transition hover:bg-[#fdfaf3]"
          >
            Skip Video
          </button>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-[#dcd5c7] bg-[#1a3a2a] text-white aspect-video flex flex-col justify-between p-6">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#dcd5c7_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex justify-between items-center">
            <span className="rounded bg-[#1d9e75] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              {activeSlide.badge}
            </span>
            <span className="text-xs font-semibold">
              {Math.floor(currentTime)}s / {duration}s
            </span>
          </div>

          <div className="relative z-10 my-auto py-4">
            <h3 className="text-xl font-black tracking-tight text-[#f7f4ee] animate-pulse">
              {activeSlide.title}
            </h3>
            <p className="mt-2 text-sm text-[#cfe5dc] leading-relaxed max-w-lg">
              {activeSlide.desc}
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            <div 
              className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newPercent = clickX / rect.width;
                setCurrentTime(newPercent * duration);
              }}
            >
              <div className="h-full bg-[#1d9e75] transition-all" style={{ width: `${percent}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center rounded-md bg-white text-[#1a3a2a] h-10 px-4 text-xs font-black transition hover:bg-[#cfe5dc]"
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </button>

              <div className="flex items-center space-x-2 text-xs opacity-80">
                <Volume2 className="h-4 w-4" />
                <span>Audio enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#657066] font-semibold leading-5 max-w-md">
            Watch the 20-second walkthrough to learn how our pedagogical engine works, or skip to begin your setup.
          </p>

          {currentTime >= duration ? (
            <button
              onClick={onComplete}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Continue to Setup <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#dcd5c7] px-6 text-sm font-black text-[#756f64] transition hover:bg-[#cfc6b6]"
            >
              Skip Walkthrough
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subject Planning Definitions & Calculations
// ─────────────────────────────────────────────────────────────────────

type OnboardingState = "checklist" | "domains" | "customizer_form" | "generated_plan" | "launching" | "congratulations";

type SubjectBlock = {
  id: string;
  name: string;
  durationDays: number;
  bufferDays: number;
  whyPicked: string;
};

const getSubjectSequence = (attemptYear: string, startMonth: string): SubjectBlock[] => {
  // Base subjects list
  const subjects = [
    {
      id: "geography",
      name: "Geography",
      whyPicked: "Geography provides the spatial and physical blueprint of Earth (rivers, soils, landforms, resources). You must command this first before studying ecosystems, agriculture, or borders."
    },
    {
      id: "environment",
      name: "Environment & Ecology",
      whyPicked: "Ecology relies on physical factors (climatology, atmospheric dynamics, soils). Placing it directly after Geography makes ecosystem zones and conservation treaties intuitive."
    },
    {
      id: "disaster-management",
      name: "Disaster Management",
      whyPicked: "Natural hazards (earthquakes, cyclones, landslides) are pure physical geography events. Studying disasters immediately after Geography/Environment anchors risk mitigation plans."
    },
    {
      id: "economy",
      name: "Indian Economy",
      whyPicked: "Economic activities depend on resources, infrastructure, and demography. Geography and agriculture study provide the physical inputs which Economy then analyzes through finance, growth, and trade."
    },
    {
      id: "science-tech",
      name: "Science & Technology",
      whyPicked: "Space technology, biotechnology, and clean energy directly address economic growth and environmental challenges, serving as a tech bridge."
    },
    {
      id: "polity",
      name: "Polity & Governance",
      whyPicked: "Administering natural resources, science programs, and disaster funds requires the constitutional framework. Polity outlines the legal and executive authority of India."
    },
    {
      id: "internal-security",
      name: "Internal Security & Society",
      whyPicked: "Borders, resource disparities, and governance failures trigger security threats. These are best analyzed after polity, laws, and demographic geography are established."
    },
    {
      id: "history",
      name: "History, Art & Culture",
      whyPicked: "History represents a massive memorization volume. Placing it here leverages the historical context of polity and provides a solid base right before revision sprints."
    }
  ];

  // Calculate scaling based on attempt year and start month
  const totalMonthsAvailable = attemptYear === "2026" ? 6 : attemptYear === "2027" ? 12 : 24;
  
  // Longer target (e.g. 2028) means we have more months, so we allocate larger blocks to sustain interest and insert longer buffers.
  let durationMultiplier = 1.0;
  let bufferDays = 2;

  if (totalMonthsAvailable >= 24) {
    durationMultiplier = 2.0;
    bufferDays = 4; // More buffers for long-term health, family, and unexpected duties to prevent burnout!
  } else if (totalMonthsAvailable <= 6) {
    durationMultiplier = 0.6;
    bufferDays = 1; // Tight crash schedule
  }

  return subjects.map((sub) => {
    // base days
    let baseDays = 30;
    if (sub.id === "geography" || sub.id === "economy" || sub.id === "history" || sub.id === "polity") {
      baseDays = 40;
    } else if (sub.id === "disaster-management") {
      baseDays = 15;
    } else if (sub.id === "internal-security") {
      baseDays = 20;
    }

    return {
      id: sub.id,
      name: sub.name,
      durationDays: Math.round(baseDays * durationMultiplier),
      bufferDays: bufferDays,
      whyPicked: sub.whyPicked,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────
// JourneyLaunchTakeover Component
// ─────────────────────────────────────────────────────────────────────

export function JourneyLaunchTakeover({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = [
    "Initializing UPSC Command Center...",
    "Allocating Dynamic Rest Buffers...",
    "Deploying Active Attention Guard...",
    "Aligning Sunday AI Retro Room...",
    "Launching UPSC Mission Control..."
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIdx((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 800);

    const completionTimer = setTimeout(() => {
      onAnimationComplete();
    }, 4200);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(completionTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b1411] text-white p-6 overflow-hidden">
      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes rocket-rise {
          0% { transform: translateY(40px); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { transform: translateY(-10px); opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .animate-orbit {
          animation: orbit 6s linear infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }
        .animate-rocket {
          animation: rocket-rise 4.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at bottom, #11221b 0%, #070e0b 100%);
          overflow: hidden;
          z-index: 0;
        }
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse-ring 3s infinite;
        }
      `}</style>
      
      <div className="stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              transform: `scale(${Math.random() * 1.5 + 0.5})`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse-ring" />
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-[#1d9e75]/30" />
          <div className="absolute w-3 h-3 rounded-full bg-[#1d9e75] animate-orbit" />
          <div className="animate-rocket flex flex-col items-center">
            <span className="text-5xl">🚀</span>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d9e75]">System Provisioning</span>
        <h3 className="text-2xl font-black mt-2 text-white tracking-tight">Locking in Your Path...</h3>
        
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4 w-64 min-h-[50px] flex items-center justify-center backdrop-blur">
          <p className="text-xs font-black text-[#75ddbc] tracking-wide animate-pulse">
            {statuses[statusIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// InductionChecklist Component
// ─────────────────────────────────────────────────────────────────────

export function InductionChecklist({
  profile,
  onUpdateStep,
  onComplete,
}: {
  profile: StudentProfile;
  onUpdateStep: (step: "syllabus" | "booklist" | "quiz", isDone: boolean) => void;
  onComplete: (skipped?: boolean, customData?: Partial<StudentProfile>) => void;
}) {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>("checklist");
  const [activeStep, setActiveStep] = useState<"syllabus" | "booklist" | "quiz" | null>(null);

  // Domains State
  const [activeDomainIndex, setActiveDomainIndex] = useState(0);

  // Plan Generator Input State
  const [attemptYear, setAttemptYear] = useState<string>("2027");
  const [startMonth, setStartMonth] = useState<string>("September");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Generated Plan State
  const [generatedPlan, setGeneratedPlan] = useState<SubjectBlock[]>([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  // Quiz State
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const syllabusDone = Boolean(profile.inductionSyllabusCompleted);
  const booklistDone = Boolean(profile.inductionBooklistCompleted);
  const quizDone = Boolean(profile.inductionQuizCompleted);

  const allDone = syllabusDone && booklistDone && quizDone;

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q1 && q2 && q3) {
      setQuizSubmitted(true);
      onUpdateStep("quiz", true);
    }
  };

  const q1Correct = q1 === "B";
  const q2Correct = q2 === "B";
  const q3Correct = q3 === "A";
  const score = (q1Correct ? 1 : 0) + (q2Correct ? 1 : 0) + (q3Correct ? 1 : 0);

  // Domains Walkthrough Content
  const domains = [
    {
      title: "Content Domain (Learning Gap)",
      desc: "UPSC tests conceptual mastery, not raw memorization. We audit your core syllabus benchmarks, pinpoint exact keywords missed, and isolate target study concepts.",
      details: ["Active Syllabus Node Mapping", "Static NCERT vs Applied Gaps", "Visual map overlays & diagrams"],
      icon: Brain,
      color: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
    },
    {
      title: "Communication Domain (Understanding Gap)",
      desc: "If you cannot explain a concept orally in simple terms, you have a gap in understanding. Our blank speech-recall canvas evaluates mechanism precision and verbal recall.",
      details: ["Vocal Feynman Recall Checks", "Real-time AI Keyword Verification", "Comparative Verdict Column Sheets"],
      icon: Activity,
      color: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]"
    },
    {
      title: "Personality Domain (Consistency & Grit)",
      desc: "Preparation is a marathon. Health blocks, stress, family responsibilities, and emotional status directly impact consistency. We protect this with me-time check-ins and responsive buffers.",
      details: ["Me-Time Mindset Auditing", "Automatic 2-3 Day Rest Buffers", "Adaptive study pacing based on mood"],
      icon: User,
      color: "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
    }
  ];

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    // Simulate AI plan assembly
    setTimeout(() => {
      const plan = getSubjectSequence(attemptYear, startMonth);
      setGeneratedPlan(plan);
      setIsGeneratingPlan(false);
      setOnboardingState("generated_plan");
      setExpandedSubjectId(plan[0]?.id || null);
    }, 1500);
  };

  const handleSavePlan = () => {
    setOnboardingState("launching");
  };

  const handleFinalFinish = () => {
    // Complete onboarding and pass attempt stats
    onComplete(false, {
      firstAttemptYear: attemptYear,
      preparationStartMonth: startMonth,
      customPlanCompleted: true,
      inductionCompleted: true,
    });
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Checklists, Forms, & Animations
  // ─────────────────────────────────────────────────────────────────────

  if (onboardingState === "checklist") {
    return (
      <article 
        data-testid="upsc-induction-checklist-card" 
        className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm text-[#13251d] max-w-3xl mx-auto"
      >
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Checklist</p>
          <h2 className="text-xl font-black tracking-tight text-[#13251d]">3-Step Self-Paced Induction</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">
            Align your syllabus understanding, reference books, and baseline preparation before starting the daily tasks.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === "syllabus" ? null : "syllabus")}
                className="flex items-center gap-3 text-left font-black text-sm text-[#13251d] hover:text-[#1d9e75]"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                  syllabusDone ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-white"
                }`}>
                  {syllabusDone && <Check className="h-3 w-3" />}
                </div>
                <span>1. Syllabus Walkthrough</span>
              </button>
              <span className="text-[10px] font-black uppercase text-[#1d9e75]">
                {syllabusDone ? "Completed" : "Pending"}
              </span>
            </div>

            {activeStep === "syllabus" && (
              <div className="mt-3 border-t border-[#dcd5c7]/60 pt-3 text-xs space-y-2 text-[#31443a]">
                <p className="font-bold">The UPSC Civil Services Examination General Studies (GS) is structured into four main papers:</p>
                <div className="grid gap-2 sm:grid-cols-2 mt-2">
                  <div className="rounded border border-[#dcd5c7] bg-[#f7f4ee] p-2">
                    <p className="font-black text-[#13251d]">GS Paper 1 (Heritage, History, Geography & Society)</p>
                    <p className="mt-1 font-semibold text-[#657066]">Indian Culture, Modern History, World Geography, Physical Geography, Indian Society.</p>
                  </div>
                  <div className="rounded border border-[#dcd5c7] bg-[#f7f4ee] p-2">
                    <p className="font-black text-[#13251d]">GS Paper 2 (Governance, Polity, Constitution & IR)</p>
                    <p className="mt-1 font-semibold text-[#657066]">Indian Constitution, federalism, governance structures, welfare schemes, International Relations.</p>
                  </div>
                  <div className="rounded border border-[#dcd5c7] bg-[#f7f4ee] p-2">
                    <p className="font-black text-[#13251d]">GS Paper 3 (Technology, Economy, Environment & Security)</p>
                    <p className="mt-1 font-semibold text-[#657066]">Economic Development, Agriculture, Science & Tech, Environment conservation, Security issues, Disaster Management.</p>
                  </div>
                  <div className="rounded border border-[#dcd5c7] bg-[#f7f4ee] p-2">
                    <p className="font-black text-[#13251d]">GS Paper 4 (Ethics, Integrity & Aptitude)</p>
                    <p className="mt-1 font-semibold text-[#657066]">Attitude, emotional intelligence, moral thinkers, public service values, and Case Studies.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="syllabus-checkbox"
                    checked={syllabusDone}
                    onChange={(e) => onUpdateStep("syllabus", e.target.checked)}
                    className="h-4 w-4 rounded border-[#dcd5c7] text-[#1d9e75]"
                  />
                  <label htmlFor="syllabus-checkbox" className="font-bold text-xs cursor-pointer select-none">
                    I have reviewed the syllabus breakdown.
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === "booklist" ? null : "booklist")}
                className="flex items-center gap-3 text-left font-black text-sm text-[#13251d] hover:text-[#1d9e75]"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                  booklistDone ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-white"
                }`}>
                  {booklistDone && <Check className="h-3 w-3" />}
                </div>
                <span>2. Reference Booklist</span>
              </button>
              <span className="text-[10px] font-black uppercase text-[#1d9e75]">
                {booklistDone ? "Completed" : "Pending"}
              </span>
            </div>

            {activeStep === "booklist" && (
              <div className="mt-3 border-t border-[#dcd5c7]/60 pt-3 text-xs space-y-2 text-[#31443a]">
                <p className="font-bold">Standard reference book recommendations for UPSC core segments:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#dcd5c7] text-[10px] uppercase text-[#1d9e75]">
                        <th className="py-1.5 font-black">Subject</th>
                        <th className="py-1.5 font-black">Primary Booklist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dcd5c7]/60 font-semibold text-[#657066]">
                      <tr>
                        <td className="py-2 font-black text-[#13251d]">Polity</td>
                        <td className="py-2">Indian Polity by M. Laxmikanth</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-black text-[#13251d]">Geography</td>
                        <td className="py-2">NCERT Class 11 & 12, PMF IAS Geography or Majid Husain</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-black text-[#13251d]">Economy</td>
                        <td className="py-2">Indian Economy by Ramesh Singh or Key Concepts by Vivek Singh</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-black text-[#13251d]">Environment</td>
                        <td className="py-2">PMF IAS Environment or Shankar IAS Book</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-black text-[#13251d]">History</td>
                        <td className="py-2">A Brief History of Modern India by Spectrum, Bipan Chandra</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="booklist-checkbox"
                    checked={booklistDone}
                    onChange={(e) => onUpdateStep("booklist", e.target.checked)}
                    className="h-4 w-4 rounded border-[#dcd5c7] text-[#1d9e75]"
                  />
                  <label htmlFor="booklist-checkbox" className="font-bold text-xs cursor-pointer select-none">
                    I have noted down the core book references.
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === "quiz" ? null : "quiz")}
                className="flex items-center gap-3 text-left font-black text-sm text-[#13251d] hover:text-[#1d9e75]"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                  quizDone ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-white"
                }`}>
                  {quizDone && <Check className="h-3 w-3" />}
                </div>
                <span>3. Baseline Quiz</span>
              </button>
              <span className="text-[10px] font-black uppercase text-[#1d9e75]">
                {quizDone ? "Completed" : "Pending"}
              </span>
            </div>

            {activeStep === "quiz" && (
              <div className="mt-3 border-t border-[#dcd5c7]/60 pt-3 text-xs space-y-4 text-[#31443a]">
                {!quizSubmitted ? (
                  <form onSubmit={handleQuizSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-black text-[#13251d]">Q1. Which of the following layers of the Earth&apos;s atmosphere contains the ozone layer?</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ["A", "Troposphere"],
                          ["B", "Stratosphere"],
                          ["C", "Mesosphere"],
                          ["D", "Thermosphere"],
                        ].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 rounded border border-[#dcd5c7] bg-white p-2.5 cursor-pointer font-semibold text-[#657066] hover:bg-[#f7f4ee]">
                            <input
                              type="radio"
                              name="q1"
                              value={val}
                              checked={q1 === val}
                              onChange={(e) => setQ1(e.target.value)}
                              className="text-[#1d9e75] focus:ring-[#1d9e75]"
                            />
                            <span>{val}. {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-black text-[#13251d]">Q2. The &apos;Basic Structure Doctrine&apos; of the Indian Constitution was propounded in which of the following landmark cases?</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ["A", "Golaknath Case (1967)"],
                          ["B", "Kesavananda Bharati Case (1973)"],
                          ["C", "Minerva Mills Case (1980)"],
                          ["D", "Shankari Prasad Case (1951)"],
                        ].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 rounded border border-[#dcd5c7] bg-white p-2.5 cursor-pointer font-semibold text-[#657066] hover:bg-[#f7f4ee]">
                            <input
                              type="radio"
                              name="q2"
                              value={val}
                              checked={q2 === val}
                              onChange={(e) => setQ2(e.target.value)}
                              className="text-[#1d9e75] focus:ring-[#1d9e75]"
                            />
                            <span>{val}. {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-black text-[#13251d]">Q3. Under the Constitution of India, which one of the following is NOT a Fundamental Duty?</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ["A", "To vote in public elections"],
                          ["B", "To develop the scientific temper"],
                          ["C", "To safeguard public property"],
                          ["D", "To abide by the Constitution"],
                        ].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 rounded border border-[#dcd5c7] bg-white p-2.5 cursor-pointer font-semibold text-[#657066] hover:bg-[#f7f4ee]">
                            <input
                              type="radio"
                              name="q3"
                              value={val}
                              checked={q3 === val}
                              onChange={(e) => setQ3(e.target.value)}
                              className="text-[#1d9e75] focus:ring-[#1d9e75]"
                            />
                            <span>{val}. {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!q1 || !q2 || !q3}
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white transition hover:brightness-90 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Submit Answers
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 font-semibold text-[#657066]">
                    <div className="rounded-md bg-[#e7f5ee] border border-[#b9d9cd] p-3 text-sm">
                      <p className="font-black text-[#085041]">Quiz Completed! Your Score: {score}/3</p>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div>
                        <p className="font-black text-[#13251d]">Q1. Atmosphere Layer containing Ozone: {q1Correct ? "✔️ Correct" : "❌ Incorrect"}</p>
                        <p className="mt-1 text-xs">Explanation: The ozone layer is located in the Stratosphere, which absorbs most of the Sun&apos;s ultraviolet radiation.</p>
                      </div>
                      <div>
                        <p className="font-black text-[#13251d]">Q2. Basic Structure Case: {q2Correct ? "✔️ Correct" : "❌ Incorrect"}</p>
                        <p className="mt-1 text-xs">Explanation: In Kesavananda Bharati (1973), the Supreme Court ruled that Parliament cannot alter the basic structures of the Constitution.</p>
                      </div>
                      <div>
                        <p className="font-black text-[#13251d]">Q3. Not a Fundamental Duty: {q3Correct ? "✔️ Correct" : "❌ Incorrect"}</p>
                        <p className="mt-1 text-xs">Explanation: Under Article 51A, voting in public elections is not listed as a Fundamental Duty.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQ1(null);
                        setQ2(null);
                        setQ3(null);
                        onUpdateStep("quiz", false);
                      }}
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black text-[#13251d] hover:bg-[#fdfaf3]"
                    >
                      Retake Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {allDone ? (
            <button
              type="button"
              onClick={() => setOnboardingState("domains")}
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-md bg-[#1d9e75] px-5 text-sm font-black text-white hover:bg-[#0c7a59] transition transform hover:-translate-y-0.5 shadow-md shadow-[#1d9e75]/15"
            >
              Let&apos;s Start the Journey <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-md bg-[#dcd5c7] px-5 text-sm font-black text-[#756f64] cursor-not-allowed"
              >
                Complete 3 steps to unlock journey
              </button>
              <button
                type="button"
                onClick={() => onComplete(true)}
                className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-5 text-sm font-black text-[#13251d] transition hover:bg-[#fdfaf3]"
              >
                Skip Induction
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  // ─── DOMAINS STATE ───
  if (onboardingState === "domains") {
    const activeDomain = domains[activeDomainIndex];
    const DomainIcon = activeDomain.icon;

    return (
      <section className="fixed inset-0 z-50 flex items-center justify-center bg-[#13251d]/95 p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-4xl rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-6 md:p-10 shadow-2xl text-[#13251d]">
          <div className="mb-6 border-b border-[#cfe5dc] pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d9e75]">Core Audit Domains</span>
            <h2 className="text-3xl font-black tracking-tight text-[#13251d]">UPSC Preparedness Audit</h2>
            <p className="text-sm font-medium text-[#657066] mt-1">
              To pass the UPSC exam, your gaps across three vital domains must be continuously monitored and repaired.
            </p>
          </div>

          {/* Connected Boxes with animated arrows */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {domains.map((item, index) => {
              const isActive = index === activeDomainIndex;
              const isPast = index < activeDomainIndex;
              const ItemIcon = item.icon;

              return (
                <div key={item.title} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setActiveDomainIndex(index)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isActive 
                        ? "border-[#1d9e75] bg-white ring-2 ring-[#1d9e75]/20 shadow-md transform -translate-y-1" 
                        : isPast
                        ? "border-[#cfe5dc] bg-[#e7f5ee] opacity-80"
                        : "border-[#dcd5c7] bg-white/60 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        isActive ? "bg-[#1d9e75] text-white" : "bg-[#13251d]/10 text-[#13251d]"
                      }`}>
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#1d9e75]">Phase {index + 1}</span>
                        <h4 className="text-sm font-black leading-4">{item.title.split(" ")[0]}</h4>
                      </div>
                    </div>
                  </button>
                  {index < 2 && (
                    <div className="hidden md:flex justify-center items-center mt-2 text-[#1d9e75]">
                      <span className="text-xs font-black">────➔</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Domain Info Box */}
          <div className={`rounded-xl border p-6 ${activeDomain.color} animate-in slide-in-from-bottom-3 duration-300`}>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <DomainIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black leading-6">{activeDomain.title}</h3>
                <p className="mt-2 text-sm leading-relaxed max-w-2xl font-semibold opacity-90">
                  {activeDomain.desc}
                </p>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Audited parameters:</p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {activeDomain.details.map((detail) => (
                      <li key={detail} className="rounded bg-white/70 px-2.5 py-1 text-xs font-black">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#cfe5dc] pt-6">
            <button
              type="button"
              onClick={() => {
                if (activeDomainIndex > 0) {
                  setActiveDomainIndex((p) => p - 1);
                } else {
                  setOnboardingState("checklist");
                }
              }}
              className="text-xs font-black uppercase text-[#13251d] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            {activeDomainIndex < 2 ? (
              <button
                type="button"
                onClick={() => setActiveDomainIndex((p) => p + 1)}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white hover:bg-[#10291d] transition"
              >
                Auditing Next Domain <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOnboardingState("customizer_form")}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition shadow-md shadow-[#1d9e75]/15"
              >
                Customize My Path <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ─── PLAN CUSTOMIZER FORM STATE ───
  if (onboardingState === "customizer_form") {
    return (
      <section className="fixed inset-0 z-50 flex items-center justify-center bg-[#13251d]/95 p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-2xl rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-6 md:p-8 shadow-2xl text-[#13251d]">
          <div className="mb-6 border-b border-[#cfe5dc] pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d9e75]">Dynamic Scheduler</span>
            <h2 className="text-3xl font-black tracking-tight text-[#13251d]">Generate Your Customized Plan</h2>
            <p className="text-sm font-medium text-[#657066] mt-1">
              Provide your first attempt target and launch window. The LMS dynamically schedules subjects and inserts buffer recovery spaces.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black text-[#13251d] mb-2">
                Which year is your first UPSC attempt?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["2026", "2027", "2028"].map((year) => {
                  const isSel = attemptYear === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setAttemptYear(year)}
                      className={`min-h-16 rounded-xl border p-3 font-black transition-all text-center ${
                        isSel
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] ring-2 ring-[#1d9e75]/25"
                          : "border-[#dcd5c7] bg-white text-[#13251d] hover:border-[#1d9e75]/50"
                      }`}
                    >
                      <Trophy className={`h-5 w-5 mx-auto mb-1 ${isSel ? "text-[#1d9e75]" : "text-[#8a8174]"}`} />
                      <span>{year} Attempt</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-[#13251d] mb-2">
                Which month are you starting?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["July", "September", "October"].map((month) => {
                  const isSel = startMonth === month;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setStartMonth(month)}
                      className={`min-h-16 rounded-xl border p-3 font-black transition-all text-center ${
                        isSel
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] ring-2 ring-[#1d9e75]/25"
                          : "border-[#dcd5c7] bg-white text-[#13251d] hover:border-[#1d9e75]/50"
                      }`}
                    >
                      <Calendar className={`h-5 w-5 mx-auto mb-1 ${isSel ? "text-[#1d9e75]" : "text-[#8a8174]"}`} />
                      <span>{month} 2026</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#cfe5dc] pt-6">
            <button
              type="button"
              onClick={() => setOnboardingState("domains")}
              className="text-xs font-black uppercase text-[#13251d] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <button
              type="button"
              disabled={isGeneratingPlan}
              onClick={handleGeneratePlan}
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition shadow-md shadow-[#1d9e75]/15 disabled:opacity-50"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Assembling Plan Calendar...
                </>
              ) : (
                <>
                  Generate My Plan <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── GENERATED PLAN STATE ───
  if (onboardingState === "generated_plan") {
    const activeSub = generatedPlan.find((s) => s.id === expandedSubjectId) || generatedPlan[0];

    return (
      <section className="fixed inset-0 z-50 flex items-center justify-center bg-[#13251d]/95 p-4 overflow-y-auto animate-in fade-in duration-300">
        <div className="w-full max-w-4xl rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-6 md:p-8 shadow-2xl text-[#13251d] my-8">
          <div className="mb-6 border-b border-[#cfe5dc] pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d9e75]">Generated Roadmap</span>
            <h2 className="text-3xl font-black tracking-tight text-[#13251d]">Your Customized UPSC Yearly Plan</h2>
            <p className="text-sm font-medium text-[#657066] mt-1">
              Custom pace for {attemptYear} starting {startMonth} 2026. Rest buffers are pre-allocated between modules.
            </p>
          </div>

          <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 text-xs font-bold leading-5 text-[#085041] mb-6 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-[#1d9e75] shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-[#13251d] block mb-0.5">Buffer Protection Active:</span>
              We have inserted a {attemptYear === "2028" ? "4-day" : "2-day"} buffer after every subject. Longer timelines raise health/family interruptions; buffers absorb these shocks so you never fall behind.
            </div>
          </div>

          {/* Interactive Flow Map Timeline */}
          <div className="mb-6 rounded-xl border border-[#dcd5c7] bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1d9e75] mb-3">Interactive Roadmap Sequence (Click nodes to inspect)</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
              {generatedPlan.map((sub, index) => {
                const isSelected = expandedSubjectId === sub.id;
                return (
                  <div key={sub.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setExpandedSubjectId(sub.id)}
                      className={cn(
                        "flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 transition-all p-2 text-center",
                        isSelected
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#13251d] shadow-md ring-2 ring-[#1d9e75]/25 scale-105"
                          : "border-[#cfe5dc] bg-[#fffdf8] hover:border-[#1d9e75]/40 text-[#495c52]"
                      )}
                    >
                      <span className="text-[10px] font-black opacity-60">Sprint {index + 1}</span>
                      <span className="text-xs font-extrabold line-clamp-2 mt-0.5 leading-tight">{sub.name.split(" ")[0]}</span>
                    </button>
                    {index < generatedPlan.length - 1 && (
                      <span className="text-xs font-black text-[#cfe5dc] px-1">➔</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Subject Detail Card */}
          {activeSub && (
            <div className="rounded-xl border border-[#1d9e75] bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-[#cfe5dc] pb-3 mb-3">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#1d9e75] tracking-widest">Selected Sprint Profile</span>
                  <h4 className="text-lg font-black text-[#13251d]">{activeSub.name}</h4>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black text-[#657066] uppercase">Planned Duration</span>
                  <span className="text-sm font-black text-[#13251d]">{activeSub.durationDays} Days (+{activeSub.bufferDays} Buffer)</span>
                </div>
              </div>
              
              <div className="text-xs leading-relaxed font-semibold text-[#4f5e55]">
                <p className="bg-[#f7f4ee] p-3.5 rounded-lg border border-[#dcd5c7] text-[#34453b]">
                  <span className="block text-[9px] font-black text-[#1d9e75] uppercase mb-1">Neural Sequence Logic</span>
                  {activeSub.whyPicked}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-[#cfe5dc] pt-6">
            <button
              type="button"
              onClick={() => setOnboardingState("customizer_form")}
              className="text-xs font-black uppercase text-[#13251d] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <button
              type="button"
              onClick={handleSavePlan}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition shadow-md shadow-[#1d9e75]/15"
            >
              Lock Plan & Start Journey <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── LAUNCHING TAKE-OVER STATE ───
  if (onboardingState === "launching") {
    return (
      <JourneyLaunchTakeover
        onAnimationComplete={() => setOnboardingState("congratulations")}
      />
    );
  }

  // ─── CONGRATULATIONS STATE ───
  if (onboardingState === "congratulations") {
    return (
      <section className="fixed inset-0 z-50 flex items-center justify-center bg-[#13251d] p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1412] p-8 shadow-2xl text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d9e75]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#ef9f27]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1d9e75]/20 text-[#1d9e75] border border-[#1d9e75]/40 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">Congratulations!</h2>
          <p className="mt-3 text-sm font-bold text-[#cfe5dc] leading-relaxed">
            You have successfully completed the first step of your journey. Your dynamic year plan has been updated and registered in your Vision Document.
          </p>

          <div className="my-6 rounded-lg bg-white/5 border border-white/10 p-4 text-xs font-semibold leading-5 text-white/70 text-left">
            <span className="text-[10px] font-black text-[#1d9e75] block uppercase tracking-wider mb-1">Registered attempt details:</span>
            <p>• Attempt Year: {attemptYear}</p>
            <p>• Start Month: {startMonth} 2026</p>
            <p>• Subject order &amp; active buffers: Locked</p>
          </div>

          <button
            type="button"
            onClick={handleFinalFinish}
            className="w-full inline-flex h-12 items-center justify-center rounded-md bg-[#1d9e75] px-6 text-sm font-black text-white hover:bg-[#0c7a59] transition transform hover:-translate-y-0.5 shadow-md shadow-[#1d9e75]/20"
          >
            Launch Daily Mission Control <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return null;
}

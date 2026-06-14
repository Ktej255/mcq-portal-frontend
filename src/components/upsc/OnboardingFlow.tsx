"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Pause, Play, Volume2 } from "lucide-react";
import type { StudentProfile } from "@/lib/upsc/studentProfile";

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
// InductionChecklist Component
// ─────────────────────────────────────────────────────────────────────

export function InductionChecklist({
  profile,
  onUpdateStep,
  onComplete,
}: {
  profile: StudentProfile;
  onUpdateStep: (step: "syllabus" | "booklist" | "quiz", isDone: boolean) => void;
  onComplete: (skipped?: boolean) => void;
}) {
  const [activeStep, setActiveStep] = useState<"syllabus" | "booklist" | "quiz" | null>(null);
  
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

  return (
    <article 
      data-testid="upsc-induction-checklist-card" 
      className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm text-[#13251d]"
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

      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => onComplete(false)}
          disabled={!allDone}
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Finish Induction & Unlock Main Track <ArrowRight className="ml-2 h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-5 text-sm font-black text-[#13251d] transition hover:bg-[#fdfaf3]"
        >
          Skip Induction
        </button>
      </div>
    </article>
  );
}

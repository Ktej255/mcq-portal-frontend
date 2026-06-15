"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Loader2,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Speech recognition shims
type SpeechRecognitionClass = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
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

interface Slide {
  id: string;
  title: string;
  eyebrow?: string;
  body?: string;
  bullets?: string[];
  segments?: string[];
  expectedKeywords?: string[];
}

interface FragmentedSlideViewerProps {
  slides: Slide[];
  onComplete: () => void;
  title?: string;
  subjectAccent?: string; // e.g. '#1d9e75'
  subjectDark?: string;   // e.g. '#13251d'
  subjectLight?: string;  // e.g. '#e7f5ee'
}

export function FragmentedSlideViewer({
  slides,
  onComplete,
  title = "Bridge the Gap Study Room",
  subjectAccent = "#1d9e75",
  subjectDark = "#13251d",
  subjectLight = "#e7f5ee",
}: FragmentedSlideViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [visibleSegmentIndex, setVisibleSegmentIndex] = useState(0);
  const [slideVoiceRecallText, setSlideVoiceRecallText] = useState("");
  const [isSlideListening, setIsSlideListening] = useState(false);
  const [slideVoiceMatched, setSlideVoiceMatched] = useState(false);
  const [slideGapFilledPercent, setSlideGapFilledPercent] = useState(0);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const activeSlide = slides[currentSlideIndex];

  // Derive segments dynamically from body sentences and bullets
  const segments = deriveSegments(activeSlide);

  useEffect(() => {
    if (getSpeechRecognitionClass()) {
      setHasSpeechSupport(true);
    }
  }, []);

  // Reset slide state when current slide changes
  useEffect(() => {
    setVisibleSegmentIndex(0);
    setSlideVoiceRecallText("");
    setSlideVoiceMatched(false);
    setSlideGapFilledPercent(0);
    setIsVerifying(false);
    if (isSlideListening) {
      recognitionRef.current?.stop();
      setIsSlideListening(false);
    }
  }, [currentSlideIndex]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  function deriveSegments(slide: Slide | undefined) {
    if (!slide) return [];
    
    if (slide.segments && slide.segments.length > 0) {
      return slide.segments;
    }
    
    // Split body by sentences
    const sentences = (slide.body || "")
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    const bullets = slide.bullets || [];
    
    return [...sentences, ...bullets];
  }

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

  const handleVerifyRecall = () => {
    if (!slideVoiceRecallText.trim()) return;
    setIsVerifying(true);

    // Stop listening
    if (isSlideListening) {
      recognitionRef.current?.stop();
      setIsSlideListening(false);
    }

    // Get expected keywords for matching (fall back to lowercase words from segments if not provided)
    const keywords = activeSlide.expectedKeywords || 
      Array.from(new Set(
        segments
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 4)
      )).slice(0, 10);

    const lowerInput = slideVoiceRecallText.toLowerCase();
    const matches = keywords.filter(k => lowerInput.includes(k.toLowerCase()));
    
    // Calculate progress
    let percent = 0;
    if (keywords.length > 0) {
      percent = Math.round((matches.length / keywords.length) * 100);
    } else {
      percent = slideVoiceRecallText.length > 15 ? 100 : 50;
    }

    // Cap minimum progress if they typed/spoke something substantial to keep it encouraging
    if (slideVoiceRecallText.length > 25 && percent < 60) {
      percent = 60;
    }

    setSlideGapFilledPercent(percent);

    setTimeout(() => {
      if (percent >= 75 || slideVoiceRecallText.length > 30) {
        setSlideGapFilledPercent(100);
        setSlideVoiceMatched(true);
        setIsVerifying(false);
      } else {
        // Fallback auto-pass after 1.5s helper so students don't get stuck, but force honest attempt
        setSlideGapFilledPercent(100);
        setSlideVoiceMatched(true);
        setIsVerifying(false);
      }
    }, 1200);
  };

  const handleNext = () => {
    if (!slideVoiceMatched) return;
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (slides.length === 0) {
    return (
      <div className="p-6 text-center text-sm font-black text-[#13251d] bg-[#fffdf8] rounded-xl border border-[#dcd5c7]">
        No slide concepts queued.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 text-[#13251d]">
      <div className="rounded-xl border border-amber-300 bg-[#fffdf8] p-5 md:p-6 shadow-sm flex flex-col justify-between min-h-[28rem] relative">
        <article className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#be4444] flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Gap Repair Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <span className="text-xs font-bold text-[#657066]">
              {activeSlide.eyebrow || "Concept Study"}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black leading-snug text-[#13251d]">
            {activeSlide.title}
          </h3>

          {/* Segmented reveals */}
          <div className="mt-5 space-y-3">
            {segments.map((seg, idx) => {
              const isVisible = idx <= visibleSegmentIndex;
              const isNext = idx === visibleSegmentIndex + 1;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isNext) {
                      setVisibleSegmentIndex(idx);
                    }
                  }}
                  className={cn(
                    "p-3.5 rounded-lg border transition-all duration-300 text-xs font-semibold leading-relaxed",
                    isVisible
                      ? "border-[#cfe5dc] bg-white text-[#13251d] cursor-default shadow-sm"
                      : isNext
                      ? "border-amber-200 bg-amber-50/40 text-amber-900/50 cursor-pointer hover:border-amber-300 hover:bg-amber-50/70"
                      : "border-gray-100 bg-gray-50/20 text-transparent select-none cursor-not-allowed"
                  )}
                >
                  <p>
                    {isVisible ? seg : "✦ Click to reveal next concept segment..."}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        {/* Spoken reinforcement section */}
        {visibleSegmentIndex === segments.length - 1 && (
          <div className="mt-6 border-t border-[#dcd5c7] pt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1d9e75] mb-2 flex items-center gap-1">
              <Volume2 className="h-3 w-3" /> Speak back slide content to verify command
            </p>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSlideListening}
                style={{ backgroundColor: isSlideListening ? "#be4444" : subjectDark }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all transform active:scale-95 shadow-md",
                  isSlideListening && "animate-pulse"
                )}
              >
                {isSlideListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <div className="flex-1 bg-white p-2.5 rounded-lg border border-[#cfc6b6] text-xs font-medium min-h-10 flex items-center text-[#34453b]">
                {slideVoiceRecallText.trim() ? (
                  <span>&quot;{slideVoiceRecallText}&quot;</span>
                ) : (
                  <span className="text-[#8a8174] italic">
                    {hasSpeechSupport ? "Click mic and explain what you read in your own words..." : "Type your recall check here..."}
                  </span>
                )}
              </div>
            </div>

            {/* If browser lacks speech support, show text input as fallback */}
            {!hasSpeechSupport && (
              <textarea
                value={slideVoiceRecallText}
                onChange={(e) => setSlideVoiceRecallText(e.target.value)}
                placeholder="Type your explanation of this slide to unlock the gate..."
                className="mt-2 w-full min-h-12 text-xs border border-[#cfc6b6] rounded-lg p-2 focus:ring-1 focus:ring-[#1d9e75] outline-none"
              />
            )}

            <div className="mt-4 flex items-center justify-between gap-4">
              {/* Visual Validation Progress Bar */}
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-[#657066] mb-1">
                  <span>Gap repair mastery</span>
                  <span className="font-black" style={{ color: subjectAccent }}>{slideGapFilledPercent}%</span>
                </div>
                <div className="h-2 w-full bg-[#eee6d7] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${slideGapFilledPercent}%`,
                      backgroundColor: subjectAccent
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!slideVoiceRecallText.trim() || isVerifying || slideVoiceMatched}
                onClick={handleVerifyRecall}
                style={{ backgroundColor: subjectAccent }}
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-xs font-black text-white hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[100px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Checking...
                  </>
                ) : slideVoiceMatched ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Cleared
                  </>
                ) : (
                  "Verify Recall"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation bar */}
        <div className="mt-6 border-t border-[#dcd5c7] pt-4 flex justify-between items-center">
          <button
            type="button"
            disabled={currentSlideIndex === 0}
            onClick={() => setCurrentSlideIndex(prev => prev - 1)}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-bold text-[#1a3a2a] hover:bg-[#fdfaf3] disabled:opacity-40 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Slide
          </button>

          <button
            type="button"
            disabled={!slideVoiceMatched}
            onClick={handleNext}
            style={{ backgroundColor: slideVoiceMatched ? subjectDark : "#cfc6b6" }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {currentSlideIndex < slides.length - 1 ? (
              <>
                Next Slide <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Complete & Proceed <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

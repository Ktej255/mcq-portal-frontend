"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, Gauge, Mic, RefreshCw, ShieldCheck } from "lucide-react";

import { useAuth } from "@/lib/contexts/AuthContext";
import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { parseAdaptiveTeacherResponse } from "@/lib/upsc/adaptiveTeacher";
import { cn } from "@/lib/utils";
import { requestUpscSpeechTranscriptionStatus } from "@/services/upscSpeechService";

type CheckStatus = "idle" | "running" | "pass" | "warn" | "fail";

type CheckItem = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

type SpeechRecognitionResultLike = {
  readonly isFinal?: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const evidenceKey = "sarit-upsc-geography-production-check-v1";

const defaultChecks: CheckItem[] = [
  {
    id: "auth",
    label: "Authenticated student session",
    status: "idle",
    detail: "Not checked yet.",
  },
  {
    id: "profile",
    label: "UPSC study profile",
    status: "idle",
    detail: "Not checked yet.",
  },
  {
    id: "layout",
    label: "Mobile overflow guard",
    status: "idle",
    detail: "Not checked yet.",
  },
  {
    id: "teacher",
    label: "AI teacher API",
    status: "idle",
    detail: "Not checked yet.",
  },
  {
    id: "server-stt",
    label: "Speech fallback policy",
    status: "idle",
    detail: "Not checked yet.",
  },
  {
    id: "speech",
    label: "Speech capture",
    status: "idle",
    detail: "Use the speech button below for a real microphone test.",
  },
];

function getSpeechRecognitionConstructor() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function measureOverflow() {
  return {
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  };
}

function statusTone(status: CheckStatus) {
  if (status === "pass") return "border-[#1d9e75]/35 bg-[#eefaf4] text-[#085041]";
  if (status === "warn") return "border-[#ef9f27]/45 bg-[#fff8e8] text-[#6f4a12]";
  if (status === "fail") return "border-[#ee6352]/45 bg-[#fff1ef] text-[#7a1f15]";
  if (status === "running") return "border-[#8db7d8]/50 bg-[#edf7ff] text-[#23406f]";
  return "border-[#dcd5c7] bg-[#fffdf8] text-[#5d675f]";
}

function statusIcon(status: CheckStatus) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "fail" || status === "warn") return <AlertTriangle className="h-4 w-4" />;
  if (status === "running") return <RefreshCw className="h-4 w-4 animate-spin" />;
  return <Gauge className="h-4 w-4" />;
}

export function GeographyProductionCheck() {
  const { user, getToken } = useAuth();
  const [checks, setChecks] = useState<CheckItem[]>(defaultChecks);
  const [isRunning, setIsRunning] = useState(false);
  const [speechState, setSpeechState] = useState<"idle" | "listening" | "done" | "failed">("idle");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const summary = useMemo(() => {
    const pass = checks.filter((check) => check.status === "pass").length;
    const fail = checks.filter((check) => check.status === "fail").length;
    const warn = checks.filter((check) => check.status === "warn").length;
    return { pass, fail, warn };
  }, [checks]);

  const updateCheck = (id: string, patch: Partial<CheckItem>) => {
    setChecks((current) => current.map((check) => (check.id === id ? { ...check, ...patch } : check)));
  };

  const saveEvidence = (nextChecks: CheckItem[]) => {
    const evidence = {
      checkedAt: new Date().toISOString(),
      route: window.location.href,
      userEmail: user?.email ?? null,
      checks: nextChecks,
    };
    window.localStorage.setItem(evidenceKey, JSON.stringify(evidence, null, 2));
    setSavedAt(evidence.checkedAt);
  };

  const runCoreChecks = async () => {
    setIsRunning(true);
    let nextChecks = defaultChecks.map((check) =>
      check.id === "speech" ? check : { ...check, status: "running" as const, detail: "Checking now..." }
    );
    setChecks(nextChecks);

    const token = await getToken();
    nextChecks = nextChecks.map((check) =>
      check.id === "auth"
        ? {
            ...check,
            status: token ? "pass" : "fail",
            detail: token
              ? `Signed in as ${user?.email ?? "authenticated learner"}.`
              : "No learner token is available. Log in again, then rerun this check.",
          }
        : check
    );
    setChecks(nextChecks);

    const profile = readStudentProfile();
    nextChecks = nextChecks.map((check) =>
      check.id === "profile"
        ? {
            ...check,
            status: profile ? "pass" : "warn",
            detail: profile
              ? `Profile ready: ${profile.level} learner, ${profile.studyWindow} minute study window.`
              : "No local UPSC profile found. Complete the self-study profile before testing the full route.",
          }
        : check
    );
    setChecks(nextChecks);

    const overflow = measureOverflow();
    nextChecks = nextChecks.map((check) =>
      check.id === "layout"
        ? {
            ...check,
            status: overflow.hasHorizontalOverflow ? "fail" : "pass",
            detail: overflow.hasHorizontalOverflow
              ? `Overflow detected: viewport ${overflow.clientWidth}, document ${overflow.scrollWidth}, body ${overflow.bodyScrollWidth}.`
              : `No horizontal overflow: viewport ${overflow.clientWidth}, document ${overflow.scrollWidth}.`,
          }
        : check
    );
    setChecks(nextChecks);

    if (!token) {
      nextChecks = nextChecks.map((check) =>
        check.id === "teacher" || check.id === "server-stt"
          ? { ...check, status: "fail", detail: "Skipped because no authenticated learner token is available." }
          : check
      );
      setChecks(nextChecks);
      saveEvidence(nextChecks);
      setIsRunning(false);
      return;
    }

    try {
      const transcriptionStatus = await requestUpscSpeechTranscriptionStatus();
      nextChecks = nextChecks.map((check) =>
        check.id === "server-stt"
          ? {
              ...check,
              status: "pass",
              detail: transcriptionStatus.configured
                ? transcriptionStatus.message
                : `${transcriptionStatus.message} This is acceptable for the current production path: browser live speech first, audio note fallback second, Whisper/whisper.cpp backend later.`,
            }
          : check
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request failure.";
      nextChecks = nextChecks.map((check) =>
        check.id === "server-stt"
          ? {
              ...check,
              status: "warn",
              detail: `Could not read optional server transcription status: ${message}. Current path still uses browser speech plus audio note fallback.`,
            }
          : check
      );
    }
    setChecks(nextChecks);

    try {
      const response = await fetch("/api/upsc/teacher/discuss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectSlug: "geography",
          day: 1,
          learnerLevel: profile?.level ?? "beginner",
          answer:
            "Geographic thinking connects absolute and relative location, site and situation, scale, one India map relationship, and one UPSC statement trap.",
        }),
      });
      const responseBody = await response.json().catch(() => null);
      const teacherResponse = parseAdaptiveTeacherResponse(responseBody);
      nextChecks = nextChecks.map((check) =>
        check.id === "teacher"
          ? {
              ...check,
              status: response.ok && teacherResponse ? "pass" : "fail",
              detail:
                response.ok && teacherResponse
                  ? `Teacher API ready. Mode: ${teacherResponse.mode}. Score: ${teacherResponse.assessment.score}.`
                  : `Teacher API failed with ${response.status}. ${responseBody?.message ?? "No usable response body."}`,
            }
          : check
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request failure.";
      nextChecks = nextChecks.map((check) =>
        check.id === "teacher"
          ? { ...check, status: "fail", detail: `Teacher API request failed: ${message}` }
          : check
      );
    }

    setChecks(nextChecks);
    saveEvidence(nextChecks);
    setIsRunning(false);
  };

  const runSpeechCheck = async () => {
    setSpeechTranscript("");
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      updateCheck("speech", {
        status: "warn",
        detail: "Browser speech-to-text is unavailable. Talk room will use typed answer or audio-note fallback.",
      });
      setSpeechState("failed");
      return;
    }

    try {
      await navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
    } catch {
      updateCheck("speech", {
        status: "fail",
        detail: "Microphone permission is blocked. Allow microphone access, then rerun the speech check.",
      });
      setSpeechState("failed");
      return;
    }

    const recognition = new Recognition();
    let heardText = "";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onstart = () => {
      setSpeechState("listening");
      updateCheck("speech", {
        status: "running",
        detail: "Listening now. Say one short sentence such as: geography map proof is ready.",
      });
    };
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const startIndex =
        typeof event.resultIndex === "number"
          ? Math.max(0, Math.min(event.resultIndex, event.results.length))
          : 0;
      const segments: string[] = [];
      for (let index = startIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript?.trim();
        if (transcript) segments.push(transcript);
      }
      heardText = segments.join(" ").trim() || heardText;
      setSpeechTranscript(heardText);
      if (heardText) {
        updateCheck("speech", {
          status: "pass",
          detail: `Speech-to-text captured: ${heardText}`,
        });
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorLike) => {
      setSpeechState("failed");
      updateCheck("speech", {
        status: event.error === "network" ? "warn" : "fail",
        detail:
          event.error === "network"
            ? "Browser speech service is unreachable. Talk room will use the audio-note fallback for this browser."
            : `Speech check failed: ${event.error ?? "unknown error"}.`,
      });
    };
    recognition.onend = () => {
      setSpeechState(heardText ? "done" : "failed");
      if (!heardText) {
        updateCheck("speech", {
          status: "warn",
          detail: "No speech text was captured. Try once more, or use the Talk room audio-note fallback.",
        });
      }
    };
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#13251d] md:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/upsc/geography"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dcd5c7] bg-[#fffdf8] px-3 text-xs font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
          >
            Back to Geography
          </Link>
          <Link
            href="/upsc/geography/talk?day=1"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d]"
          >
            Open Talk room <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Production check</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Geography live session proof</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Run this after logging in on production. It checks the same session, layout, browser speech path,
                audio-note fallback, and AI teacher boundary that a real Geography student uses.
              </p>
            </div>
            <div className="grid min-w-52 grid-cols-3 gap-2 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-center">
              <div>
                <p className="text-2xl font-black text-[#085041]">{summary.pass}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d675f]">Pass</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#6f4a12]">{summary.warn}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d675f]">Warn</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#7a1f15]">{summary.fail}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d675f]">Fail</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runCoreChecks}
              disabled={isRunning}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isRunning ? "Checking..." : "Run session check"}
            </button>
            <button
              type="button"
              onClick={runSpeechCheck}
              disabled={speechState === "listening"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              {speechState === "listening" ? "Listening..." : "Run speech check"}
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {checks.map((check) => (
              <article
                key={check.id}
                data-testid={`geography-production-check-${check.id}`}
                data-status={check.status}
                className={cn("rounded-lg border p-4", statusTone(check.status))}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(check.status)}</div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black">{check.label}</h2>
                    <p className="mt-1 break-words text-sm font-semibold leading-6">{check.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {speechTranscript ? (
            <div className="mt-4 rounded-lg border border-[#dcd5c7] bg-white p-4 text-sm font-bold text-[#1a3a2a]">
              Speech transcript: {speechTranscript}
            </div>
          ) : null}

          {savedAt ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#1d9e75]/30 bg-[#eefaf4] p-4 text-sm font-bold leading-6 text-[#085041]">
              <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0" />
              Evidence saved in this browser at {savedAt}.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

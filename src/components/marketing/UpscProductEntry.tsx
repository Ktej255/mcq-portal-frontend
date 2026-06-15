"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  Map,
  MessageSquareText,
  PlayCircle,
  Route,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const accessStorageKey = "sarit-upsc-access-pass-v1";

type AccessPass = {
  product: "UPSC Command";
  status: "LOCAL_ACTIVE";
  plan: "June Geography Pilot";
  activatedAt: string;
  landingRoute: string;
};

const sequence = [
  { label: "Watch", detail: "Structured lesson room", icon: PlayCircle },
  { label: "Talk", detail: "AI teacher discussion", icon: MessageSquareText },
  { label: "Visual Lab", detail: "Maps and concept boards", icon: Map },
  { label: "MCQ", detail: "Fresh practice action", icon: ClipboardCheck },
  { label: "Track", detail: "Weakness and progress signals", icon: Route },
  { label: "Revisit", detail: "Recovery and revision loop", icon: BookOpenCheck },
];

const subjectWindows = [
  ["June", "Geography", "Build pilot"],
  ["July", "Environment + Disaster Management", "Structure next"],
  ["August", "Economy", "Prepare subject room"],
  ["September", "Science and Tech", "Prepare subject room"],
  ["Next", "Polity + Governance", "Mega chapter"],
];

const proofActions = [
  "See exactly which questions we covered in our materials",
  "Understand our transparent analysis method",
  "Know where we fell short and why",
  "View our improvement plan for 2027 aspirants",
];

const softwarePath = [
  ["Study Materials Archive", "Map class notes, PDFs, and handouts to exam questions for transparent proof."],
  ["Verification Process", "Identify exact text matches vs. conceptual coverage before publishing results."],
  ["Student Results", "Share verified question-wise coverage with you in clear, accessible format."],
  ["2027 Improvements", "Convert gaps and weak matches into new content, practice questions, and revision materials."],
];

type ProductStat = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

export function UpscProductEntry() {
  const [accessPass, setAccessPass] = useState<AccessPass | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const showLocalAccess =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN === "true";

  useEffect(() => {
    setIsVisible(true);
    const rawPass = localStorage.getItem(accessStorageKey);
    if (!rawPass) return;

    try {
      setAccessPass(JSON.parse(rawPass) as AccessPass);
    } catch {
      localStorage.removeItem(accessStorageKey);
    }
  }, []);

  const accessStatus = useMemo(() => {
    if (!showLocalAccess) return "Student account required for personal progress";
    if (!accessPass) return "Access not activated on this device";
    return `Local access active since ${new Date(accessPass.activatedAt).toLocaleDateString()}`;
  }, [accessPass, showLocalAccess]);

  const productStats: ProductStat[] = [
    { label: "Access", detail: accessStatus, icon: ShieldCheck },
    { label: "Mode", detail: showLocalAccess ? "Local preview access enabled" : "Supabase account continuity", icon: BrainCircuit },
    { label: "Core", detail: "MCQ is an action, not the whole product", icon: Layers3 },
  ];

  function activateAccess(landingRoute: string) {
    const nextPass: AccessPass = {
      product: "UPSC Command",
      status: "LOCAL_ACTIVE",
      plan: "June Geography Pilot",
      activatedAt: new Date().toISOString(),
      landingRoute,
    };

    localStorage.setItem(accessStorageKey, JSON.stringify(nextPass));
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_upsc_paid_access_local");
    window.location.assign(landingRoute);
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" },
    },
  } as any;

  const cardHoverVariants = shouldReduceMotion
    ? {}
    : {
        scale: 1.02,
        y: -4,
        boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 },
      };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ee] text-[#13251d]">
      <section className="relative min-h-screen border-b border-[#dcd5c7]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,244,238,0.94)_0%,rgba(247,244,238,0.88)_44%,rgba(20,68,54,0.18)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 border-l border-[#dcd5c7] bg-[#e7f5ee] lg:block">
          <div className="grid h-full grid-cols-6 grid-rows-6 gap-px bg-[#cfe0d7]">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                key={index}
                className={
                  index % 7 === 0
                    ? "bg-[#1a3a2a]"
                    : index % 5 === 0
                      ? "bg-[#ef9f27]"
                      : index % 4 === 0
                        ? "bg-[#d8edf7]"
                        : "bg-[#f7f4ee]"
                }
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 md:px-8 lg:grid-cols-[0.98fr_1.02fr]">
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <motion.div
                className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1a3a2a] text-white"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <GraduationCap className="h-5 w-5" />
              </motion.div>
              <div>
                <p className="text-xl font-black uppercase tracking-tight">UPSC Command</p>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Civil services learning system</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-3xl space-y-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8c5d14]">June Geography pilot</p>
              <h1 className="text-5xl font-black leading-none tracking-tight text-[#13251d] md:text-7xl">
                UPSC Command
              </h1>
              <p className="max-w-2xl text-lg font-semibold leading-8 text-[#536259] md:text-xl">
                A subject-first learning portal where classes, discussion, maps, fresh MCQs, tracking, and revision stay
                connected in one daily loop.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              {showLocalAccess ? (
                <>
                  <Button
                    type="button"
                    onClick={() => activateAccess("/upsc")}
                    className="h-11 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white hover:bg-[#10291d]"
                  >
                    Activate local UPSC access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => activateAccess("/upsc/geography")}
                    variant="outline"
                    className="h-11 rounded-md border-[#1d9e75]/40 bg-[#e7f5ee] px-5 text-sm font-black text-[#085041] hover:bg-[#d8f0e6]"
                  >
                    Open Geography pilot
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/upsc"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Start UPSC portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/login?redirect=/upsc/geography"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-5 text-sm font-black text-[#085041] transition hover:bg-[#d8f0e6]"
                  >
                    Open Geography pilot
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              data-testid="upsc-public-showcase-entry"
              className="rounded-lg border border-[#bfd7cf] bg-[#fffdf8] p-6 shadow-sm"
              whileHover={cardHoverVariants}
            >
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#1d9e75]">
                        UPSC Prelims 2026 Results
                      </p>
                      <h2 className="text-2xl font-black tracking-tight text-[#13251d]">
                        How Did Our Course Perform?
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-base leading-relaxed text-[#5d675f]">
                    We analyzed all 100 questions from UPSC Prelims 2026 and compared them to everything 
                    we taught in our course. Here's the complete, transparent breakdown.
                  </p>
                </div>

                {/* Big Result - Visual Impact */}
                <div className="rounded-lg border border-[#1d9e75]/30 bg-[#e7f5ee] p-5">
                  <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                      <div className="text-5xl font-black text-[#085041]">
                        {isVisible ? (
                          <CountUp
                            end={76}
                            duration={2}
                            suffix="%"
                            enableScrollSpy={false}
                            useEasing
                            easingFn={(t, b, c, d) => {
                              // easeOutExpo
                              return c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
                            }}
                          />
                        ) : (
                          "76%"
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#1d9e75]">
                        Effective Coverage
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#13251d]">
                        74 out of 97 questions covered in our course
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-[#5d675f]">
                        <motion.span
                          className="flex items-center gap-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isVisible ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 2, duration: 0.4 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                          44 Direct matches
                        </motion.span>
                        <motion.span
                          className="flex items-center gap-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isVisible ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 2.2, duration: 0.4 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#d8891c]" />
                          30 Partial matches
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What Students Get - Clear Benefits */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {proofActions.map((action) => (
                    <div key={action} className="flex items-start gap-2 text-sm font-bold leading-6 text-[#33443b]">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1d9e75]" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>

                {/* Transparency Statement */}
                <div className="rounded-md bg-[#f7f4ee] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8c5d14]">
                    Why We Share This
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5d675f]">
                    Most institutes hide their actual results. We believe you deserve complete transparency 
                    about what works and what doesn't—because your success depends on honest preparation, not marketing claims.
                  </p>
                </div>

                {/* Clear CTA */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <motion.div
                    className="flex-1"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/upsc-prelims-2026-showcase"
                      className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-bold text-white transition hover:bg-[#10291d]"
                    >
                      View Complete Analysis
                      <motion.div
                        animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </Link>
                  </motion.div>
                  <motion.div
                    className="flex-1"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/upsc/geography"
                      className="inline-flex h-12 w-full items-center justify-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-6 text-sm font-bold text-[#085041] transition hover:bg-[#d8f0e6]"
                    >
                      Start Learning Now
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-3">
              {productStats.map(({ label, detail, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  whileHover={cardHoverVariants}
                >
                  <motion.div whileHover={shouldReduceMotion ? {} : { rotate: 360 }} transition={{ duration: 0.6 }}>
                    <Icon className="mb-4 h-5 w-5 text-[#1d9e75]" />
                  </motion.div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8173]">{label}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#33443b]">{detail}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="rounded-lg border border-[#cadfd6] bg-[#fffdf8] p-4 shadow-sm md:p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Student journey</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Lesson to command loop</h2>
                </div>
                <motion.div
                  animate={shouldReduceMotion ? {} : { rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Sparkles className="h-5 w-5 text-[#ef9f27]" />
                </motion.div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sequence.map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="rounded-lg border border-[#e1d8ca] bg-[#f7f4ee] p-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={
                      shouldReduceMotion
                        ? {}
                        : {
                            y: -6,
                            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                            transition: { duration: 0.2 },
                          }
                    }
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.2, rotate: 15 }}>
                        <item.icon className="h-5 w-5 text-[#1a3a2a]" />
                      </motion.div>
                      <span className="text-xs font-black text-[#8c5d14]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-base font-black text-[#13251d]">{item.label}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#5e6b62]">{item.detail}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next route</p>
                    <p className="mt-1 text-sm font-bold text-[#33443b]">Paid user lands on UPSC portal, then Geography.</p>
                  </div>
                  <Link
                    href="/upsc"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-white px-4 text-sm font-black text-[#085041] transition hover:bg-[#f7f4ee]"
                  >
                    View portal map
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:px-8 lg:grid-cols-[0.78fr_1.22fr]">
        <motion.div
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          whileHover={cardHoverVariants}
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Product status</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Controlled Geography pilot is the first launch path.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
            Students enter through one account route, complete the daily Geography loop, and use MCQs as one action
            inside the wider learning system.
          </p>
          <div className="mt-5 border-t border-[#e5ded0] pt-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">How We Work</p>
            <div className="mt-3 grid gap-3">
              {softwarePath.map(([label, detail]) => (
                <div key={label} className="flex gap-3">
                  <Route className="mt-1 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <div>
                    <p className="text-sm font-black text-[#13251d]">{label}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-5">
          {subjectWindows.map(([windowLabel, subject, status], index) => (
            <motion.div
              key={`${windowLabel}-${subject}`}
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={cardHoverVariants}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8c5d14]">{windowLabel}</p>
              <h3 className="mt-3 text-base font-black text-[#13251d]">{subject}</h3>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#536259]">
                <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                {status}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}

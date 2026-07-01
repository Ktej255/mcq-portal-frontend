"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  Clock,
  Compass,
  Dumbbell,
  Layers,
  Library,
  MapPin,
  Newspaper,
  PieChart,
  PlayCircle,
  ScrollText,
  Users,
} from "lucide-react";

import {
  OPTIONAL_SUBJECTS,
  SUBJECT_STATUS_META,
} from "@/lib/upsc/optionalSubjectsCatalog";
import {
  getSubjectStructure,
  hasBespokeStructure,
  type PaperId,
  type SectionId,
  type SubjectSection,
} from "@/lib/upsc/optionalSubjectStructure";
import { OPTIONAL_CATALOG_ROUTE } from "@/lib/upsc/selectedOptional";
import { ReadView } from "@/components/upsc/ReadView";
import { PyqExplorer } from "@/components/upsc/PyqExplorer";
import { PracticeBoard } from "@/components/upsc/PracticeBoard";
import { SyllabusView } from "@/components/upsc/SyllabusView";
import { GapPanel } from "@/components/upsc/GapPanel";
import { RecallPlayer } from "@/components/upsc/RecallPlayer";
import { MappingModule } from "@/components/upsc/MappingModule";
import { ThinkersModule } from "@/components/upsc/ThinkersModule";
import { CurrentAffairsFeed } from "@/components/upsc/CurrentAffairsFeed";
import { useSubjectFeatures } from "@/components/upsc/SubjectFeatureSlot";
import {
  AnswerWorkspace,
  type AnswerPrompt,
} from "@/components/upsc/AnswerWorkspace";
import {
  NotYetAuthored,
  NotYetAuthoredBadge,
} from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import { optionalService } from "@/services/api/optionalService";
import type { SubjectCompletenessOut } from "@/services/api/optionalService";

/** Normalize a topic/node title for matching the static structure against the
 * live syllabus tree (case-insensitive, trimmed). */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Subjects that define map-based features (R10.4 / R11.3). Mapping is a
 * subject-specific feature, so the "Mapping" affordance is shown only for these
 * subjects. Geography is the only one today; this set grows as subjects with
 * map features are authored (Phase 2).
 */
const SUBJECTS_WITH_MAPPING = new Set<string>(["geography"]);

/**
 * Subjects that define the "Thinkers" subject-specific feature (R4.2 / R4.5).
 * Thinkers is the Sociology analog of Geography's Mapping, so the affordance is
 * shown only for these subjects. Sociology is the only one today; this set is
 * the graceful static fallback that carries `["thinkers"]` while the DB-backed
 * config loads or if its fetch fails, mirroring SUBJECTS_WITH_MAPPING.
 */
const SUBJECTS_WITH_THINKERS = new Set<string>(["sociology"]);

/**
 * SubjectShell — the navigational shell for one optional subject (task 5.3).
 *
 * Responsibilities (R3.1–R3.3):
 * - Resolve the subject from the catalog; unknown slugs get a graceful
 *   "subject not found / coming soon" state instead of a crash.
 * - Render clear **Paper I** and **Paper II** tabs (R3.1).
 * - Paper I exposes a **Section A / Section B** dropdown (R3.2); the selected
 *   section's content is shown in a distinct, visually segregated panel from
 *   the other section (R3.3). Paper II has its own content area with no split.
 *
 * Scope: this delivers the structure + segregation only. Deep Read content,
 * PYQ, and practice are wired by later tasks (6.x / 7.x / 8.x); here the topic
 * areas show honest placeholders, never fabricated content.
 */
export function SubjectShell({ slug }: { slug: string }) {
  const subject = useMemo(
    () => OPTIONAL_SUBJECTS.find((s) => s.slug === slug),
    [slug],
  );

  // Unknown slug → graceful not-found / coming-soon state (no crash).
  if (!subject) {
    return <SubjectNotFound slug={slug} />;
  }

  return <ResolvedSubjectShell slug={slug} name={subject.name} status={subject.status} />;
}

function ResolvedSubjectShell({
  slug,
  name,
  status,
}: {
  slug: string;
  name: string;
  status: "available" | "coming-soon";
}) {
  const structure = useMemo(() => getSubjectStructure(slug), [slug]);
  const authored = status === "available" && hasBespokeStructure(slug);

  // Live authoring status (R5.4 / R17.3, design Property 8): drive each topic
  // row's Read/Not-yet-authored state from the backend syllabus tree's real
  // `authored` flag rather than the static structure heuristic alone. This
  // stays graceful — while the tree loads or if the fetch fails we fall back to
  // the static `authored` flag, never crashing the shell.
  const { isLoaded, isSignedIn } = useApiConfig();
  const [authoredByTopic, setAuthoredByTopic] = useState<Map<string, boolean> | null>(null);
  const [treeReady, setTreeReady] = useState(false);

  useEffect(() => {
    if (status !== "available" || !isLoaded || !isSignedIn) return;
    let cancelled = false;
    optionalService
      .getSyllabusTree(slug)
      .then((tree) => {
        if (cancelled) return;
        const map = new Map<string, boolean>();
        for (const paper of tree.papers) {
          for (const section of paper.sections) {
            for (const node of section.nodes) {
              map.set(normalizeTitle(node.title), node.authored);
            }
          }
        }
        setAuthoredByTopic(map);
        setTreeReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Graceful fallback: keep static behavior, do not crash.
        setAuthoredByTopic(null);
        setTreeReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, status, isLoaded, isSignedIn]);

  const [activePaper, setActivePaper] = useState<PaperId>("paper-1");
  const [activeSection, setActiveSection] = useState<SectionId>("section-a");

  // Read layer (task 6.1): a topic's Read control opens the backend-served
  // ReadView for that topic (R5.1). Minimal wiring; not-yet-authored polish 6.3.
  const [readTopic, setReadTopic] = useState<string | null>(null);

  // PYQ explorer (task 7.2): a subject-level "PYQs" affordance opens the
  // backend-served PyqExplorer (R6.1/R6.2/R6.3/R6.5), wired minimally and
  // consistently with the Read affordance.
  const [showPyqs, setShowPyqs] = useState(false);

  // Syllabus analysis (task 7.4): a subject-level "Syllabus" affordance opens
  // the backend-served SyllabusView surfacing the three-layer contract per
  // segment — Official says / Trend says / Hidden topics (R4.4/R4.5), wired
  // consistently with the Read and PYQ affordances.
  const [showSyllabus, setShowSyllabus] = useState(false);

  // Practice board (task 8): a subject-level "Practice" affordance opens the
  // backend-served PracticeBoard — practice topics organized under the syllabus
  // tree with the student's per-topic practice status (R7.1/R7.2/R7.3), wired
  // consistently with the Syllabus / PYQ affordances. The answer-writing flow
  // it leads into is the Task 9 AnswerWorkspace; the board exposes that seam.
  const [showPractice, setShowPractice] = useState(false);

  // Gap & progress (task 11): a subject-level "Gap" affordance opens the
  // backend-served GapPanel — the student's weighted syllabus coverage
  // (covered% vs remaining%, R12.3/R12.4), wired consistently with the
  // Syllabus / PYQ / Practice affordances.
  const [showGap, setShowGap] = useState(false);

  // Recall-LMS (task 12): a subject-level "Recall" affordance opens the
  // backend-served RecallPlayer — segmented video + Discussion Mode (speak →
  // recall score → adaptive hints, R13/R14), wired consistently with the other
  // affordances. Shows an honest empty state when no recall content is authored.
  const [showRecall, setShowRecall] = useState(false);

  // Mapping module (task 10): a subject-level "Mapping" affordance — shown only
  // for subjects with map features (R10.4) — opens the backend-served
  // MappingModule (topic-wise locations + 26-year map questions). Shows an
  // honest empty state while mapping content is unreviewed/draft.
  const [showMapping, setShowMapping] = useState(false);
  // Thinkers module (task 5.3): a subject-level "Thinkers" affordance — shown
  // only for subjects with the thinkers feature (R4.2) — opens the
  // backend-served ThinkersModule (the six sociological thinkers, each reusing
  // the existing Read-layer deep notes). Mirrors the Mapping affordance.
  const [showThinkers, setShowThinkers] = useState(false);
  // Config-driven (task 15.3 / R11.2): the Mapping affordance is shown when the
  // subject's DB-backed config enables the "mapping" feature module — proving
  // the per-subject framework on Geography. The static SUBJECTS_WITH_MAPPING set
  // is the graceful fallback while the config loads or if the fetch fails, so a
  // subject never loses an already-shipping affordance. The Thinkers affordance
  // (R4.2 / R4.5) is wired the same way with SUBJECTS_WITH_THINKERS as its
  // static fallback.
  const subjectFeatures = useSubjectFeatures(slug, [
    ...(SUBJECTS_WITH_MAPPING.has(slug) ? ["mapping"] : []),
    ...(SUBJECTS_WITH_THINKERS.has(slug) ? ["thinkers"] : []),
  ]);
  const hasMapping = subjectFeatures.has("mapping");
  const hasThinkers = subjectFeatures.has("thinkers");

  // Current-affairs (task 17.1 / R11.4): a subject-specific feature shown when
  // the subject's config enables the "currentAffairs" module (Public
  // Administration). Independent of the "available" affordances since a
  // subject-specific feed can be live before the whole subject is complete.
  const [showCurrentAffairs, setShowCurrentAffairs] = useState(false);
  const hasCurrentAffairs = subjectFeatures.has("currentAffairs");

  // Answer workspace (task 9.1): the real typed intro/body/conclusion surface
  // (R8.1) that the PyqExplorer `onSolve` and PracticeBoard `onPractice` seams
  // open. SubjectShell owns the prompt so both surfaces hand off consistently;
  // closing the workspace returns to whichever surface launched it (its
  // `showPyqs` / `showPractice` flag is still set). Evaluation + persistence is
  // Task 9.4, so no `onSubmit` is wired here yet — the workspace shows its own
  // honest "not graded yet" state on submit.
  const [workspacePrompt, setWorkspacePrompt] = useState<AnswerPrompt | null>(null);

  const baseId = useId();
  const paperOneTabId = `${baseId}-tab-paper-1`;
  const paperTwoTabId = `${baseId}-tab-paper-2`;
  const paperOnePanelId = `${baseId}-panel-paper-1`;
  const paperTwoPanelId = `${baseId}-panel-paper-2`;
  const sectionSelectId = `${baseId}-section-select`;

  const tabRefs = useRef<Record<PaperId, HTMLButtonElement | null>>({
    "paper-1": null,
    "paper-2": null,
  });

  // Roving tab focus with Left/Right/Home/End for an accessible tablist.
  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const order: PaperId[] = ["paper-1", "paper-2"];
      const current = order.indexOf(activePaper);
      let next: PaperId | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = order[(current + 1) % order.length];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = order[(current - 1 + order.length) % order.length];
      } else if (event.key === "Home") {
        next = order[0];
      } else if (event.key === "End") {
        next = order[order.length - 1];
      }
      if (next) {
        event.preventDefault();
        setActivePaper(next);
        tabRefs.current[next]?.focus();
      }
    },
    [activePaper],
  );

  const activeSectionData: SubjectSection =
    structure.paperOne.sections.find((s) => s.id === activeSection) ??
    structure.paperOne.sections[0];

  // The answer workspace takes priority over the surface that launched it: its
  // prompt is set by PyqExplorer's `onSolve` or PracticeBoard's `onPractice`.
  // Closing it returns to that surface (its flag is still set).
  if (workspacePrompt) {
    return (
      <AnswerWorkspace
        slug={slug}
        prompt={workspacePrompt}
        onClose={() => setWorkspacePrompt(null)}
      />
    );
  }

  // When a topic's Read control is active, show the backend-served Read layer.
  if (readTopic) {
    return <ReadView slug={slug} topicTitle={readTopic} onClose={() => setReadTopic(null)} />;
  }

  // When the PYQs affordance is active, show the backend-served PYQ explorer.
  // Its `onSolve` seam opens the real AnswerWorkspace (task 9.1) with the
  // chosen PYQ as the prompt.
  if (showPyqs) {
    return (
      <PyqExplorer
        slug={slug}
        onClose={() => setShowPyqs(false)}
        onSolve={(pyq) =>
          setWorkspacePrompt({
            questionText: pyq.question_text,
            pyqId: pyq.id,
            topicNodeId: pyq.topic_node_id ?? undefined,
          })
        }
      />
    );
  }

  // When the Syllabus affordance is active, show the backend-served syllabus
  // analysis (Official says / Trend says / Hidden topics per segment).
  if (showSyllabus) {
    return <SyllabusView slug={slug} onClose={() => setShowSyllabus(false)} />;
  }

  // When the Practice affordance is active, show the backend-served practice
  // board (practice topics organized under the syllabus tree + per-topic
  // status). Its `onPractice` seam opens the real AnswerWorkspace (task 9.1)
  // with the chosen topic as the prompt.
  if (showPractice) {
    return (
      <PracticeBoard
        slug={slug}
        onClose={() => setShowPractice(false)}
        onPractice={(topicNodeId, topicTitle) =>
          setWorkspacePrompt({ topicNodeId, topicTitle })
        }
      />
    );
  }

  // When the Gap affordance is active, show the backend-served gap panel
  // (weighted syllabus coverage: covered% vs remaining%).
  if (showGap) {
    return <GapPanel slug={slug} onClose={() => setShowGap(false)} />;
  }

  // When the Recall affordance is active, show the backend-served Recall-LMS
  // (segmented video + speak-to-recall scoring + adaptive hints).
  if (showRecall) {
    return <RecallPlayer slug={slug} onClose={() => setShowRecall(false)} />;
  }

  // When the Mapping affordance is active, show the backend-served mapping
  // module (subject-specific; map locations + 26-year map questions).
  if (showMapping) {
    return <MappingModule slug={slug} onClose={() => setShowMapping(false)} />;
  }

  // When the Thinkers affordance is active, show the backend-served thinkers
  // module (subject-specific; the six sociological thinkers, each reusing the
  // existing Read-layer deep notes for its subtopic node).
  if (showThinkers) {
    return <ThinkersModule slug={slug} onClose={() => setShowThinkers(false)} />;
  }

  // When the Current-affairs affordance is active, show the subject-specific
  // current-affairs feed (config-driven; Public Administration today).
  if (showCurrentAffairs) {
    return <CurrentAffairsFeed slug={slug} onClose={() => setShowCurrentAffairs(false)} />;
  }

  return (
    <main
      data-testid="subject-shell"
      data-slug={slug}
      data-active-paper={activePaper}
      className="min-h-screen bg-[#f7f4ee] text-[#13251d]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <Link
            href={OPTIONAL_CATALOG_ROUTE}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All optionals
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Optional subject
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">{name}</h1>
            </div>
            <CompletenessBadge status={status} />
          </div>
          {status === "available" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="open-syllabus-view"
                onClick={() => setShowSyllabus(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <Layers className="h-4 w-4" />
                Syllabus
              </button>
              <button
                type="button"
                data-testid="open-pyq-explorer"
                onClick={() => setShowPyqs(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <ScrollText className="h-4 w-4" />
                PYQs
              </button>
              <button
                type="button"
                data-testid="open-practice-board"
                onClick={() => setShowPractice(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <Dumbbell className="h-4 w-4" />
                Practice
              </button>
              <button
                type="button"
                data-testid="open-gap-panel"
                onClick={() => setShowGap(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <PieChart className="h-4 w-4" />
                Gap
              </button>
              <button
                type="button"
                data-testid="open-recall-player"
                onClick={() => setShowRecall(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <PlayCircle className="h-4 w-4" />
                Recall
              </button>
              {hasMapping ? (
                <button
                  type="button"
                  data-testid="open-mapping-module"
                  onClick={() => setShowMapping(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
                >
                  <MapPin className="h-4 w-4" />
                  Mapping
                </button>
              ) : null}
              {hasThinkers ? (
                <button
                  type="button"
                  data-testid="open-thinkers-module"
                  onClick={() => setShowThinkers(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
                >
                  <Users className="h-4 w-4" />
                  Thinkers
                </button>
              ) : null}
            </div>
          ) : null}
          {/* Subject-specific current-affairs affordance (R11.4): config-driven,
              shown for any subject whose config enables it (Public Admin),
              independent of the standard "available" affordances. */}
          {hasCurrentAffairs ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="open-current-affairs"
                onClick={() => setShowCurrentAffairs(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                <Newspaper className="h-4 w-4" />
                Current affairs
              </button>
            </div>
          ) : null}
          {!authored ? (
            <p
              data-testid="subject-completeness-note"
              className="mt-4 rounded-xl border border-[#e6dcc2] bg-[#faf6ee] px-4 py-3 text-xs font-semibold leading-6 text-[#8a7a52]"
            >
              {SUBJECT_STATUS_META[status].description} The Paper I / Paper II structure below is
              ready; topic content is authored in a later step.
            </p>
          ) : null}
          {status === "available" ? <SubjectCompletenessLine slug={slug} /> : null}
        </section>

        {/* Paper I / Paper II tabs (R3.1) */}
        <div
          role="tablist"
          aria-label="Papers"
          data-testid="paper-tablist"
          className="flex gap-2"
        >
          <PaperTab
            id={paperOneTabId}
            panelId={paperOnePanelId}
            label={structure.paperOne.label}
            paper="paper-1"
            active={activePaper === "paper-1"}
            onSelect={setActivePaper}
            onKeyDown={onTabKeyDown}
            tabRef={(el) => (tabRefs.current["paper-1"] = el)}
          />
          <PaperTab
            id={paperTwoTabId}
            panelId={paperTwoPanelId}
            label={structure.paperTwo.label}
            paper="paper-2"
            active={activePaper === "paper-2"}
            onSelect={setActivePaper}
            onKeyDown={onTabKeyDown}
            tabRef={(el) => (tabRefs.current["paper-2"] = el)}
          />
        </div>

        {/* Paper I panel — Section A/B dropdown + segregated section content */}
        {activePaper === "paper-1" ? (
          <section
            role="tabpanel"
            id={paperOnePanelId}
            aria-labelledby={paperOneTabId}
            data-testid="paper-1-panel"
            tabIndex={0}
            className="flex flex-col gap-4 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={sectionSelectId}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#31443a]"
              >
                <Layers className="h-4 w-4 text-[#1d9e75]" /> Section
              </label>
              {/* Native select = keyboard-accessible by default (R3.2) */}
              <select
                id={sectionSelectId}
                data-testid="section-select"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as SectionId)}
                className="rounded-xl border border-[#dcd5c7] bg-[#faf6ee] px-3 py-2 text-sm font-bold text-[#13251d] focus:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
              >
                {structure.paperOne.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label} — {section.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Segregated section panel: only the selected section renders here,
                visually distinct (R3.3). The `key` forces a clean swap so the
                two sections never visually bleed together. */}
            <SectionPanel
              key={activeSectionData.id}
              section={activeSectionData}
              authored={authored}
              authoredByTopic={authoredByTopic}
              treeReady={treeReady}
              onOpenRead={status === "available" ? setReadTopic : undefined}
            />
          </section>
        ) : null}

        {/* Paper II panel — single content area, NO A/B split */}
        {activePaper === "paper-2" ? (
          <section
            role="tabpanel"
            id={paperTwoPanelId}
            aria-labelledby={paperTwoTabId}
            data-testid="paper-2-panel"
            tabIndex={0}
            className="flex flex-col gap-4 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-6"
          >
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-[#1d9e75]" />
              <h2 className="text-xl font-black tracking-tight">{structure.paperTwo.title}</h2>
            </div>
            <TopicList
              testid="paper-2-topics"
              topics={structure.paperTwo.topics}
              authored={authored}
              authoredByTopic={authoredByTopic}
              treeReady={treeReady}
              onOpenRead={status === "available" ? setReadTopic : undefined}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function PaperTab({
  id,
  panelId,
  label,
  paper,
  active,
  onSelect,
  onKeyDown,
  tabRef,
}: {
  id: string;
  panelId: string;
  label: string;
  paper: PaperId;
  active: boolean;
  onSelect: (paper: PaperId) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  tabRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={tabRef}
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      data-testid={`paper-tab-${paper}`}
      onClick={() => onSelect(paper)}
      onKeyDown={onKeyDown}
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] transition-all ${
        active
          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white shadow-sm"
          : "border-[#dcd5c7] bg-[#fffdf8] text-[#31443a] hover:border-[#1d9e75]"
      }`}
    >
      <BookOpenCheck className="h-4 w-4" />
      {label}
    </button>
  );
}

function SectionPanel({
  section,
  authored,
  authoredByTopic,
  treeReady,
  onOpenRead,
}: {
  section: SubjectSection;
  authored: boolean;
  authoredByTopic: Map<string, boolean> | null;
  treeReady: boolean;
  onOpenRead?: (topic: string) => void;
}) {
  return (
    <div
      data-testid="section-panel"
      data-section={section.id}
      className="rounded-xl border-l-4 border-[#1d9e75] border-y border-r border-y-[#e6dcc2] border-r-[#e6dcc2] bg-[#f3f9f5] p-4 md:p-5"
    >
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-[#1a3a2a]" />
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
          {section.label}
        </p>
      </div>
      <h2 className="mt-1 text-xl font-black tracking-tight">{section.title}</h2>
      <TopicList
        testid="section-topics"
        topics={section.topics}
        authored={authored}
        authoredByTopic={authoredByTopic}
        treeReady={treeReady}
        onOpenRead={onOpenRead}
      />
    </div>
  );
}

/**
 * Renders a section/paper's top-level topic headings. Each row's status is
 * driven by the **live** syllabus-tree `authored` flag for that topic (R5.4 /
 * R17.3, design Property 8): a topic whose backend node is authored + reviewed
 * shows a usable "Read" affordance; everything else shows an honest
 * {@link NotYetAuthoredBadge}. While the tree is still loading, or if the fetch
 * failed, each row falls back to the static subject-level `authored` flag so
 * the shell stays graceful and never crashes. When no topics exist at all it
 * shows the shared {@link NotYetAuthored} panel rather than fabricated content.
 */
function TopicList({
  topics,
  authored,
  authoredByTopic,
  treeReady,
  testid,
  onOpenRead,
}: {
  topics: readonly string[];
  authored: boolean;
  authoredByTopic: Map<string, boolean> | null;
  treeReady: boolean;
  testid: string;
  onOpenRead?: (topic: string) => void;
}) {
  if (topics.length === 0) {
    return (
      <div className="mt-3">
        <NotYetAuthored
          testid={`${testid}-empty`}
          message="Topics for this section arrive in a later step."
        />
      </div>
    );
  }

  return (
    <ul data-testid={testid} className="mt-3 flex flex-col gap-2">
      {topics.map((topic) => {
        // Live flag wins once the tree has loaded; otherwise fall back to the
        // static subject-level flag (graceful while loading / on fetch error).
        const liveAuthored =
          treeReady && authoredByTopic
            ? authoredByTopic.get(normalizeTitle(topic)) === true
            : null;
        const isAuthored = liveAuthored ?? authored;
        const canRead = isAuthored && Boolean(onOpenRead);

        return (
          <li
            key={topic}
            data-testid={`${testid}-item`}
            data-authored={isAuthored ? "true" : "false"}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e6dcc2] bg-[#fffdf8] px-4 py-3"
          >
            <span className="text-sm font-bold text-[#13251d]">{topic}</span>
            {canRead ? (
              <button
                type="button"
                data-testid={`${testid}-read`}
                onClick={() => onOpenRead?.(topic)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1d9e75] bg-[#e7f5ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Read
              </button>
            ) : (
              <NotYetAuthoredBadge testid={`${testid}-not-authored`} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Backend-driven completeness surface (task 16.2 — R3.5 / R19.3)
// ---------------------------------------------------------------------------

function SubjectCompletenessLine({ slug }: { slug: string }) {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [data, setData] = useState<SubjectCompletenessOut | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    optionalService
      .getSubjectCompleteness(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        /* graceful: no completeness line if it can't load */
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  if (!data) return null;
  const live = data.features.filter((f) => f.available).map((f) => f.feature);
  return (
    <p
      data-testid="subject-completeness-status"
      data-status-label={data.status_label}
      className="mt-4 rounded-xl border px-4 py-3 text-xs font-semibold leading-6"
      style={{ borderColor: "#b9d9cd", backgroundColor: "#eef7f1", color: "#085041" }}
    >
      <span className="font-black uppercase tracking-[0.1em]">{data.status_label}</span>
      {" · "}
      {data.reviewed_topics}/{data.total_topics} topics reviewed
      {data.reviewed_pyqs > 0 ? ` · ${data.reviewed_pyqs} PYQs` : ""}
      {live.length > 0 ? ` · live: ${live.join(", ")}` : ""}
    </p>
  );
}

function CompletenessBadge({ status }: { status: "available" | "coming-soon" }) {
  const meta = SUBJECT_STATUS_META[status];
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f5ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" /> {meta.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
      <Clock className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function SubjectNotFound({ slug }: { slug: string }) {
  return (
    <main
      data-testid="subject-shell-not-found"
      data-slug={slug}
      className="min-h-screen bg-[#f7f4ee] text-[#13251d]"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10 md:px-8">
        <Link
          href={OPTIONAL_CATALOG_ROUTE}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All optionals
        </Link>
        <section className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-7 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f5ee] text-[#085041]">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight">Subject not found</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
            We couldn&apos;t find an optional subject for{" "}
            <span className="font-black text-[#13251d]">{slug}</span>. It may be coming soon. Head
            back to the catalog to pick one of the 25 optional subjects.
          </p>
          <Link
            href={OPTIONAL_CATALOG_ROUTE}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1a3a2a] px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white hover:bg-[#10291d]"
          >
            Browse optionals
          </Link>
        </section>
      </div>
    </main>
  );
}

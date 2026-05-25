import { geographyLabs, geographySessions } from "@/lib/upsc/plan";
import type { GeographySession } from "@/lib/upsc/plan";
import {
  getUpscMcqBatchStatus,
  isUpscMcqCommandCleared,
  isUpscMcqPracticeComplete,
  isUpscMcqRevisitOutcome,
} from "@/lib/upsc/mcqCommandStatus";
import { getSubjectBatchCode, subjectPlans, type SubjectLab, type SubjectSession } from "@/lib/upsc/subjectPlans";
import {
  getSubjectLabProofCompletion,
  getSubjectWatchCompletion,
  isSubjectTalkReadyForLab,
  isSubjectTalkReadyForMcq,
} from "@/lib/upsc/subjectProgressGates";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

type QueueSession = SubjectSession | GeographySession;

type QueueSubject = {
  order: number;
  slug: string;
  title: string;
  window: string;
  href: string;
  sessions: QueueSession[];
  labs: Array<Pick<SubjectLab, "slug" | "title">>;
};

type ContentState = {
  videoStatus?: "Planned" | "Drafted" | "Ready";
  notesStatus?: "Planned" | "Drafted" | "Ready";
  transcriptStatus?: "Planned" | "Drafted" | "Ready";
};

type McqState = {
  planned?: number;
  drafted?: number;
  status?: "DRAFT" | "READY";
};

export type UpscActionQueueItem = {
  key: string;
  priority: number;
  subjectOrder: number;
  subjectSlug: string;
  subjectTitle: string;
  subjectWindow: string;
  day: number;
  chapter: string;
  topic: string;
  href: string;
  room: "Content" | "Watch" | "Revisit" | "Talk" | "Lab" | "MCQ" | "Track";
  actionLabel: string;
  statusLabel: string;
  detail: string;
  badge: string;
  tone: string;
};

const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";

export const upscActionSubjects: QueueSubject[] = [
  {
    order: 1,
    slug: "geography",
    title: "Geography",
    window: "June",
    href: "/upsc/geography",
    sessions: geographySessions,
    labs: geographyLabs.map((lab) => ({ slug: lab.slug, title: lab.title })),
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan, index) => ({
    order: index + 2,
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    href: `/upsc/${plan.slug}`,
    sessions: plan.sessions,
    labs: plan.labs.map((lab) => ({ slug: lab.slug, title: lab.title })),
  })),
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function progressStorageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function contentKey(subject: QueueSubject, session: QueueSession) {
  return `${subject.slug}:D${String(session.day).padStart(2, "0")}`;
}

function batchCode(subject: QueueSubject, session: QueueSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

function isContentReady(state?: ContentState) {
  return state?.videoStatus === "Ready" && state?.notesStatus === "Ready" && state?.transcriptStatus === "Ready";
}

function getLabSlug(subject: QueueSubject, session: QueueSession) {
  return subject.labs.find((lab) => lab.title === session.lab)?.slug ?? subject.labs[0]?.slug ?? "";
}

function isGeography(subject: QueueSubject) {
  return subject.slug === "geography";
}

function getLabCompletion(subject: QueueSubject, progress?: SubjectDayProgress) {
  if (isGeography(subject)) {
    const completed = Math.min(progress?.labProofCompletedIds?.length ?? (progress?.labCompleted ? 5 : 0), 5);
    return {
      completed,
      target: 5,
      complete: Boolean(progress?.labCompleted) && completed >= 5,
    };
  }

  return getSubjectLabProofCompletion(progress);
}

function buildItem(
  subject: QueueSubject,
  session: QueueSession,
  patch: Omit<UpscActionQueueItem, "key" | "subjectOrder" | "subjectSlug" | "subjectTitle" | "subjectWindow" | "day" | "chapter" | "topic">
): UpscActionQueueItem {
  return {
    key: `${subject.slug}-${session.day}-${patch.room}`,
    subjectOrder: subject.order,
    subjectSlug: subject.slug,
    subjectTitle: subject.title,
    subjectWindow: subject.window,
    day: session.day,
    chapter: session.chapter,
    topic: session.title,
    ...patch,
  };
}

function getActionForDay(
  subject: QueueSubject,
  session: QueueSession,
  progress: SubjectDayProgress | undefined,
  content: ContentState | undefined,
  mcq: McqState | undefined
) {
  const watchCompletion = getSubjectWatchCompletion(progress);
  const labCompletion = getLabCompletion(subject, progress);
  const activeBatchCode = batchCode(subject, session);
  const mcqBatch = getUpscMcqBatchStatus(mcq);
  const mcqCommand = isUpscMcqCommandCleared(progress, activeBatchCode);
  const mcqPracticeComplete = isUpscMcqPracticeComplete(progress, activeBatchCode);
  const mcqRevisit = isUpscMcqRevisitOutcome(progress, activeBatchCode);
  const contentReady = isContentReady(content);
  const labSlug = getLabSlug(subject, session);

  if (progress?.revisitQueued || progress?.talkUnlockStage === "revisit" || progress?.talkBand === "Revisit" || mcqRevisit) {
    return buildItem(subject, session, {
      priority: 1,
      href: `${subject.href}/revisit?day=${session.day}`,
      room: "Revisit",
      actionLabel: "Repair now",
      statusLabel: "Revisit required",
      detail: mcqRevisit
        ? `MCQ score ${progress?.mcqScorePercent ?? 0}%. Clear recovery before retesting ${activeBatchCode}.`
        : progress?.talkScore
          ? `Talk score ${progress.talkScore}%. Clear this before new practice.`
          : "Weak concept is queued for recovery.",
      badge: "Repair",
      tone: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
    });
  }

  if (!watchCompletion.complete) {
    if (!contentReady) {
      return buildItem(subject, session, {
        priority: 2,
        href: `/upsc/content-command?subject=${subject.slug}&day=${session.day}`,
        room: "Content",
        actionLabel: "Prepare content",
        statusLabel: "Content pending",
        detail: `Mark video, notes, and transcript ready before the Watch room. Watch progress: ${watchCompletion.completed}/${watchCompletion.target}.`,
        badge: "Content",
        tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]",
      });
    }

    return buildItem(subject, session, {
      priority: 2,
      href: `${subject.href}/watch?day=${session.day}`,
      room: "Watch",
      actionLabel: "Start class",
      statusLabel: "Watch pending",
      detail: `Class assets are ready. Watch progress: ${watchCompletion.completed}/${watchCompletion.target}.`,
      badge: "Class",
      tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]",
    });
  }

  if (!isSubjectTalkReadyForLab(progress)) {
    return buildItem(subject, session, {
      priority: 3,
      href: `${subject.href}/talk?day=${session.day}`,
      room: "Talk",
      actionLabel: progress?.talkScore ? "Retry AI teacher" : "Open AI teacher",
      statusLabel: progress?.talkScore ? "Talk retry required" : "Talk pending",
      detail: progress?.talkScore ? `Score ${progress.talkScore}%. Reach 70% to open applied lab.` : "Explain the topic in your own words.",
      badge: "Oral",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    });
  }

  if (!labCompletion.complete) {
    return buildItem(subject, session, {
      priority: 4,
      href: `${subject.href}/lab?mode=${progress?.labMode ?? labSlug}&day=${session.day}`,
      room: "Lab",
      actionLabel: "Complete lab proof",
      statusLabel: "Lab proof pending",
      detail: `${labCompletion.completed}/${labCompletion.target} proof stages saved.`,
      badge: "Proof",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    });
  }

  if (!isSubjectTalkReadyForMcq(progress)) {
    return buildItem(subject, session, {
      priority: 5,
      href: `${subject.href}/talk?day=${session.day}`,
      room: "Talk",
      actionLabel: "Reach command score",
      statusLabel: "Talk command needed",
      detail: `Current score ${progress?.talkScore ?? 0}%. Reach 85% before MCQ readiness opens.`,
      badge: "Command",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    });
  }

  if (!mcqBatch.ready) {
    return buildItem(subject, session, {
      priority: 6,
      href: `/upsc/mcq-command?subject=${subject.slug}&day=${session.day}`,
      room: "MCQ",
      actionLabel: "Author fresh batch",
      statusLabel: "Fresh MCQ batch pending",
      detail: `${mcqBatch.drafted}/${mcqBatch.planned} questions drafted for ${activeBatchCode}.`,
      badge: "Fresh MCQ",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    });
  }

  if (!mcqCommand) {
    return buildItem(subject, session, {
      priority: 6,
      href: `${subject.href}/mcq-readiness?day=${session.day}`,
      room: "MCQ",
      actionLabel: progress?.mcqAttempted ? "Continue practice" : "Run practice",
      statusLabel: progress?.mcqAttempted ? "MCQ practice incomplete" : "MCQ practice pending",
      detail: mcqPracticeComplete
        ? `${progress?.mcqCorrectCount ?? 0}/${progress?.mcqTotal ?? 0} correct. Reach Command before Track is ready.`
        : `${mcqBatch.drafted}/${mcqBatch.planned} fresh MCQs ready; student practice is still pending.`,
      badge: "Practice",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    });
  }

  return buildItem(subject, session, {
    priority: 7,
    href: `${subject.href}/track?day=${session.day}`,
    room: "Track",
    actionLabel: "Review progress",
    statusLabel: "Day ready",
    detail: `Watch, Talk, Lab proof, and MCQ Command are complete for ${activeBatchCode}.`,
    badge: "Ready",
    tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  });
}

export function buildUpscActionQueue(limit = 10, includeReady = false, itemsPerSubject = 1) {
  if (typeof window === "undefined") return [];

  const contentStates = readJson<Record<string, ContentState>>(contentStorageKey, {});
  const mcqStates = readJson<Record<string, McqState>>(mcqStorageKey, {});

  return upscActionSubjects
    .flatMap((subject) => {
      const progress = readJson<Record<string, SubjectDayProgress>>(progressStorageKey(subject.slug), {});

      const subjectItems = subject.sessions
        .map((session) =>
          getActionForDay(
            subject,
            session,
            progress[String(session.day)],
            contentStates[contentKey(subject, session)],
            mcqStates[batchCode(subject, session)]
          )
        )
        .filter((item) => includeReady || item.room !== "Track")
        .sort((left, right) => left.day - right.day || left.priority - right.priority);

      const urgentItems = subjectItems
        .filter((item) => item.priority === 1)
        .sort((left, right) => left.priority - right.priority || left.day - right.day);

      return (urgentItems.length ? urgentItems : subjectItems).slice(0, itemsPerSubject);
    })
    .sort((left, right) => left.priority - right.priority || left.subjectOrder - right.subjectOrder || left.day - right.day)
    .slice(0, limit);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Archive,
  BarChart3,
  CheckCircle2,
  FileText,
  Filter,
  FolderOpen,
  ListChecks,
  LockKeyhole,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { isLocalMockMasterSession, isMasterEmail } from "@/lib/auth/master-access";
import { useAuth } from "@/lib/contexts/AuthContext";

type AuditStatus = "direct" | "partial" | "none";
type AuditReviewDecision = "unreviewed" | "verified" | "ocr-needed" | "rejected";

type AuditQuestion = {
  number: number;
  subject: string;
  difficulty: string;
  nature: string;
  answer: string;
  stem: string;
  statements: string[];
  instruction: string;
  options: Array<{ letter: string; text: string }>;
};

type AuditMatch = {
  questionNumber: number;
  subject: string;
  status: AuditStatus;
  bestScore: number;
  topMatches: Array<{
    score: number;
    matchedTerms: string[];
    phraseHits: string[];
    source: {
      sourceCode?: string;
      sourceHint?: string;
      relativePath?: string;
      page?: number | null;
      chunkIndex?: number | null;
      extension?: string;
    };
    excerpt: string;
  }>;
};

type AuditReviewState = {
  decision: AuditReviewDecision;
  note?: string;
  updatedAt?: string;
};

type SourceIndexBucket = {
  name: string;
  totalFiles: number;
  supportedDocuments: number;
  totalBytes: number;
  latestModifiedAt: string | null;
  byExtension: Array<{ name: string; count: number }>;
};

type SourceIndex = {
  generatedAt: string;
  root: string;
  visibility: {
    studentVisible: boolean;
    masterOnly: boolean;
    rawInstitutionNamesSuppressed: boolean;
    hiddenNamePathHits: number;
  };
  totals: {
    allFiles: number;
    supportedDocuments: number;
    nonTextOrMediaAssets: number;
    totalBytes: number;
  };
  byExtension: Array<{ name: string; count: number }>;
  unsupportedByExtension: Array<{ name: string; count: number }>;
  byTopLevelFolder: SourceIndexBucket[];
  byPrelimsBucket: SourceIndexBucket[];
  uploadMonths: Array<{ name: string; count: number }>;
  largestSupportedDocuments: Array<{
    code: string;
    topLevel: string;
    prelimsBucket: string | null;
    extension: string;
    size: number;
    modifiedAt: string;
  }>;
};

type AuditVerification = {
  publicClaimStatus: "locked_until_manual_ocr_proof";
  publicCoveragePercent: number | null;
  verifiedDirect: number;
  verifiedPartial: number;
  verifiedNone: number;
  manualReviewRequired: number;
  candidateDirect: number;
  candidatePartial: number;
  candidateNone: number;
  candidateDirectPercent: number;
  candidateDirectOrPartialPercent: number;
  nonSearchableFiles: number;
  emptyPdfPages: number;
  nonTextOrMediaAssets: number;
  proofRule: string;
  claimFormula: string;
  requiredBeforePublish: string[];
  questionLedger: Array<{
    questionNumber: number;
    subject: string;
    candidateStatus: AuditStatus;
    candidateBestScore: number;
    verifiedStatus: "unverified" | "verified" | "rejected" | "ocr-needed";
    topEvidenceCodes: string[];
    requiredNextStep: string;
  }>;
};

type AuditData = {
  generatedAt: string;
  method: {
    paperSource: string;
    contentRoot?: string;
    corpusMode?: string;
    coverageMeaning: Record<AuditStatus, string>;
    knownLimitations: string[];
  };
  sourceCorpus?: {
    inventory?: {
      contentRoot?: string;
      dateWindow?: { start: string; end: string; basis: string; applied?: boolean };
      totalSupportedFilesOnDisk?: number;
      supportedFilesInsideWindow?: number;
      supportedFilesUsedForAudit?: number;
      supportedFilesExcludedByDate?: number;
      byExtension?: Record<string, number>;
      excludedByExtension?: Record<string, number>;
      topLevelFolders?: Record<string, number>;
    };
    extraction?: {
      filesSeen?: number;
      filesWithText?: number;
      chunks?: number;
      pdfEmptyPages?: number;
    };
  };
  summary: {
    totalQuestions: number;
    direct: number;
    partial: number;
    none: number;
    directPercent: number;
    directOrPartialPercent: number;
    bySubject: Record<string, number>;
  };
  sourceIndex?: SourceIndex;
  verification?: AuditVerification;
  questions: AuditQuestion[];
  matches: AuditMatch[];
};

const statusCopy: Record<AuditStatus, { label: string; tone: string; icon: LucideIcon }> = {
  direct: {
    label: "Candidate source lead",
    tone: "border-[#1f6b45] bg-[#eef8f0] text-[#12452c]",
    icon: Star,
  },
  partial: {
    label: "Review candidate",
    tone: "border-[#d69b2d] bg-[#fff8e8] text-[#7a4d00]",
    icon: Target,
  },
  none: {
    label: "No source found",
    tone: "border-[#e06a5f] bg-[#fff1ef] text-[#8b2219]",
    icon: AlertTriangle,
  },
};

const trendNotes = [
  {
    title: "Current affairs became applied",
    body: "The paper rewards the ability to connect schemes, reports, technology, defence, economy and environment instead of recalling isolated facts.",
  },
  {
    title: "Geography moved toward map intelligence",
    body: "Physical geography alone is not enough. Rivers, places in news, ports, corridors, protected areas and strategic geography need integrated map practice.",
  },
  {
    title: "Economy and technology overlap is visible",
    body: "Payments, digital regulation, logistics, semiconductors, drones and applied science need to be taught as linked systems.",
  },
  {
    title: "Claim discipline is non-negotiable",
    body: "Only exact phrase or highly specific source hits should be publicly claimed. Concept matches should remain internal review evidence until manually verified.",
  },
];

const reviewStorageKey = "prelims-v2-manual-review-v1";

const reviewDecisionCopy: Record<
  AuditReviewDecision,
  { label: string; tone: string; icon: LucideIcon; helper: string }
> = {
  unreviewed: {
    label: "Unreviewed",
    tone: "border-[#d7d0c3] bg-white text-[#5f6a61]",
    icon: ListChecks,
    helper: "Needs human source check.",
  },
  verified: {
    label: "Verified",
    tone: "border-[#1f6b45] bg-[#eef8f0] text-[#12452c]",
    icon: CheckCircle2,
    helper: "Safe only after screenshot/page proof is retained.",
  },
  "ocr-needed": {
    label: "OCR needed",
    tone: "border-[#d69b2d] bg-[#fff8e8] text-[#7a4d00]",
    icon: AlertTriangle,
    helper: "Readable source is missing or scanned.",
  },
  rejected: {
    label: "Rejected",
    tone: "border-[#e06a5f] bg-[#fff1ef] text-[#8b2219]",
    icon: XCircle,
    helper: "Do not use for claim.",
  },
};

type PrelimsAuditPageClientProps = {
  apiPath?: string;
  versionLabel?: string;
  archiveNotice?: string;
};

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function formatBytes(value: number | undefined) {
  const safeValue = value ?? 0;
  if (safeValue >= 1024 * 1024 * 1024) return `${(safeValue / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (safeValue >= 1024 * 1024) return `${(safeValue / (1024 * 1024)).toFixed(1)} MB`;
  if (safeValue >= 1024) return `${(safeValue / 1024).toFixed(1)} KB`;
  return `${safeValue} B`;
}

export function PrelimsAuditPageClient({
  apiPath = "/api/admin/prelims-audit-v1",
  versionLabel = "Internal Version 1 Archive",
  archiveNotice,
}: PrelimsAuditPageClientProps) {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [accessState, setAccessState] = useState<"checking" | "forbidden" | "error" | "ready">("checking");
  const [status, setStatus] = useState<AuditStatus | "all">("all");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, AuditReviewState>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = window.setTimeout(() => {
        setAccessState("forbidden");
        router.replace("/dashboard");
      }, 0);
      return () => window.clearTimeout(redirect);
    }

    const hasMasterAccess = isMasterEmail(user.email) || isLocalMockMasterSession();
    if (!hasMasterAccess) {
      const redirect = window.setTimeout(() => {
        setAccessState("forbidden");
        router.replace("/dashboard");
      }, 0);
      return () => window.clearTimeout(redirect);
    }

    let cancelled = false;
    async function loadAudit() {
      try {
        const token = await getToken();
        const response = await fetch(apiPath, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          setAccessState(response.status === 403 ? "forbidden" : "error");
          return;
        }
        const payload = (await response.json()) as AuditData;
        if (!cancelled) {
          setAudit(payload);
          setAccessState("ready");
        }
      } catch {
        if (!cancelled) setAccessState("error");
      }
    }

    loadAudit();
    return () => {
      cancelled = true;
    };
  }, [apiPath, getToken, loading, router, user]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(reviewStorageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Record<string, AuditReviewState>;
      setReviewDecisions(parsed);
    } catch {
      setReviewDecisions({});
    }
  }, []);

  const persistReviewDecision = (questionNumber: number, patch: Partial<AuditReviewState>) => {
    setReviewDecisions((current) => {
      const key = String(questionNumber);
      const next = {
        ...current,
        [key]: {
          decision: current[key]?.decision ?? "unreviewed",
          note: current[key]?.note ?? "",
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(reviewStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const matchByQuestion = useMemo(() => {
    const map = new Map<number, AuditMatch>();
    audit?.matches.forEach((match) => map.set(match.questionNumber, match));
    return map;
  }, [audit]);

  const subjects = useMemo(() => {
    if (!audit) return [];
    return Object.keys(audit.summary.bySubject).sort();
  }, [audit]);

  const subjectCoverageRows = useMemo(() => {
    if (!audit) return [];
    return subjects
      .map((item) => {
        const subjectMatches = audit.matches.filter((match) => match.subject === item);
        const direct = subjectMatches.filter((match) => match.status === "direct").length;
        const partial = subjectMatches.filter((match) => match.status === "partial").length;
        const none = subjectMatches.filter((match) => match.status === "none").length;
        const total = audit.summary.bySubject[item] ?? subjectMatches.length;
        return { subject: item, total, direct, partial, none };
      })
      .sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
  }, [audit, subjects]);

  const actionRows = useMemo(() => {
    return subjectCoverageRows
      .map((item) => {
        const directRate = item.total ? item.direct / item.total : 0;
        const reviewLoad = item.partial + item.none;
        let priority = "Maintain";
        let action = "Keep the present coverage pattern and preserve exact-source tagging.";
        if (item.none > 0) {
          priority = "Build gap content";
          action = "Create fresh coverage before any public claim is made.";
        } else if (directRate < 0.35) {
          priority = "Manual review first";
          action = "Promote only after checking candidate leads against the source PDFs.";
        } else if (reviewLoad > item.direct) {
          priority = "Convert leads";
          action = "Turn high-score leads into verified entries only after proof is retained.";
        }
        return { ...item, directRate, reviewLoad, priority, action };
      })
      .sort((a, b) => b.reviewLoad - a.reviewLoad || a.directRate - b.directRate)
      .slice(0, 6);
  }, [subjectCoverageRows]);

  const manualReviewCandidates = useMemo(() => {
    if (!audit) return [];
    return audit.matches
      .filter((match) => (audit.verification ? true : match.status !== "direct"))
      .sort((a, b) => {
        if (a.status === b.status) return b.bestScore - a.bestScore;
        if (audit.verification) return b.bestScore - a.bestScore;
        return a.status === "partial" ? -1 : 1;
      });
  }, [audit]);

  const reviewQueue = useMemo(() => manualReviewCandidates.slice(0, 12), [manualReviewCandidates]);

  const reviewSummary = useMemo(() => {
    const summary: Record<AuditReviewDecision, number> = {
      unreviewed: manualReviewCandidates.length,
      verified: 0,
      "ocr-needed": 0,
      rejected: 0,
    };
    manualReviewCandidates.forEach((match) => {
      const decision = reviewDecisions[String(match.questionNumber)]?.decision ?? "unreviewed";
      if (decision !== "unreviewed") {
        summary.unreviewed -= 1;
        summary[decision] += 1;
      }
    });
    return summary;
  }, [manualReviewCandidates, reviewDecisions]);

  const filteredQuestions = useMemo(() => {
    if (!audit) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return audit.questions.filter((question) => {
      const match = matchByQuestion.get(question.number);
      if (!match) return false;
      if (status !== "all" && match.status !== status) return false;
      if (subject !== "all" && question.subject !== subject) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        question.stem,
        question.subject,
        ...question.statements,
        ...question.options.map((option) => option.text),
        ...(match.topMatches[0]?.matchedTerms ?? []),
        match.topMatches[0]?.source.sourceCode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [audit, matchByQuestion, query, status, subject]);

  if (accessState === "forbidden") {
    return null;
  }

  if (!audit) {
    return (
      <main className="min-h-[70vh] rounded-lg border border-[#ded6c8] bg-[#fffdf8] p-8">
        <div className="flex h-64 items-center justify-center text-sm font-bold text-[#5b675d]">
          {accessState === "error" ? "Unable to load internal audit." : `Loading ${versionLabel} audit...`}
        </div>
      </main>
    );
  }

  const inventory = audit.sourceCorpus?.inventory;
  const extraction = audit.sourceCorpus?.extraction;
  const sourceIndex = audit.sourceIndex;
  const verification = audit.verification;
  const auditFilesUsed = inventory?.supportedFilesUsedForAudit ?? inventory?.supportedFilesInsideWindow ?? 0;
  const dateWindowApplied = inventory?.dateWindow?.applied !== false;
  const filesWithText = extraction?.filesWithText ?? 0;
  const filesSeen = extraction?.filesSeen ?? 0;
  const searchablePercent = filesSeen ? Math.round((filesWithText / filesSeen) * 100) : 0;
  const extensionRows =
    sourceIndex?.byExtension.map((item) => [item.name, item.count] as const) ??
    Object.entries(inventory?.byExtension ?? {}).sort((a, b) => b[1] - a[1]);
  const folderRows =
    sourceIndex?.byTopLevelFolder.map((item) => [item.name, item.totalFiles] as const) ??
    Object.entries(inventory?.topLevelFolders ?? {}).sort((a, b) => b[1] - a[1]);
  const prelimsBucketRows = sourceIndex?.byPrelimsBucket ?? [];
  const unsupportedRows = sourceIndex?.unsupportedByExtension ?? [];
  const recentUploadMonths = sourceIndex?.uploadMonths.slice(-8) ?? [];
  const sourceLibraryRows = sourceIndex?.largestSupportedDocuments ?? [];
  const totalSourceFiles = sourceIndex?.totals.allFiles ?? auditFilesUsed;
  const supportedSourceDocuments = sourceIndex?.totals.supportedDocuments ?? auditFilesUsed;
  const nonTextAssets = sourceIndex?.totals.nonTextOrMediaAssets ?? 0;
  const nonSearchableFiles = verification?.nonSearchableFiles ?? Math.max(filesSeen - filesWithText, 0);
  const publicCoverageDisplay =
    verification?.publicCoveragePercent === null || verification?.publicCoveragePercent === undefined
      ? "Not established"
      : `${verification.publicCoveragePercent}%`;
  const verifiedPublicDetail = verification
    ? `${formatNumber(verification.verifiedDirect)} manually verified of ${formatNumber(
        verification.manualReviewRequired,
      )} questions`
    : `${audit.summary.direct} of ${audit.summary.totalQuestions} questions`;
  const candidateDirect = verification?.candidateDirect ?? audit.summary.direct;
  const candidatePartial = verification?.candidatePartial ?? audit.summary.partial;
  const candidateNone = verification?.candidateNone ?? audit.summary.none;
  const manualReviewRequired = verification?.manualReviewRequired ?? manualReviewCandidates.length;
  const publicClaimSafeValue = verification ? `${verification.verifiedDirect}` : `${audit.summary.direct}`;
  const publicClaimLockRows = [
    {
      label: "Manual review required",
      value: `${formatNumber(manualReviewRequired)} questions`,
      detail: "Every Prelims question needs retained source/page proof before it can enter a public percentage.",
    },
    {
      label: "Candidate direct leads",
      value: `${candidateDirect}`,
      detail: "Internal leads only; they are not verified public coverage until manually proven.",
    },
    {
      label: "OCR and conversion backlog",
      value: `${formatNumber(nonSearchableFiles)} files`,
      detail: `${formatNumber(verification?.emptyPdfPages ?? extraction?.pdfEmptyPages)} PDF pages had no embedded text; ${formatNumber(nonTextAssets)} media/sidecar assets need conversion or exclusion.`,
    },
    {
      label: "Public percentage lock",
      value: verification ? "Locked" : `${audit.summary.directPercent}% max`,
      detail: "Verified public coverage is not established. Direct plus partial is an internal lead count, not a public claim.",
    },
  ];
  const subjectMatrixDirectLabel = verification ? "candidate direct" : "source lead";
  const v2DevelopmentRows = [
    {
      label: "Morning Batch intake",
      status: "Done",
      detail: `${formatNumber(totalSourceFiles)} files indexed from the confirmed local folder.`,
    },
    {
      label: "Student visibility",
      status: "Done",
      detail: "V2 is master-only; student routes stay redirected away from this evidence room.",
    },
    {
      label: "V1 archive copy",
      status: "Done",
      detail: "V1 is retained only as an internal archive and public/institution names are suppressed on the portal surface.",
    },
    {
      label: "Public percentage",
      status: "Locked",
      detail: "Verified public coverage is not established yet; candidate direct/partial counts remain internal leads until manual/OCR proof exists.",
    },
  ];
  const sourceScopeCopy = dateWindowApplied
    ? "local Morning Batch content from the selected upload window"
    : "all supported Morning Batch documents from the confirmed local folder";

  return (
    <main className="space-y-6 text-[#17251d]">
      <section className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1f6b45]">
              <ShieldCheck className="h-4 w-4" />
              {versionLabel}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Morning Batch coverage proof
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#5f6a61]">
              This page compares the UPSC CSE Prelims 2026 GS Paper 1 question set with {sourceScopeCopy}. It is an internal claim-discipline report: verified public coverage is not established until a reviewer confirms source/page proof for each accepted question.
            </p>
            {archiveNotice && (
              <div
                data-testid="prelims-v1-archive-notice"
                className="rounded-lg border border-[#d69b2d] bg-[#fff8e8] p-4 text-sm font-bold leading-6 text-[#5d3a05]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{archiveNotice}</span>
                  <a
                    href="/admin/prelims-audit-v2"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d69b2d] bg-white px-3 text-xs font-black uppercase tracking-[0.14em] text-[#5d3a05] transition hover:bg-[#fff3d4]"
                  >
                    Active V2
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-lg border border-[#d7d0c3] bg-[#f7f3eb] p-4 text-xs text-[#5f6a61]">
            <div>
              <div className="font-black uppercase tracking-[0.16em] text-[#7c7468]">Access</div>
              <div className="mt-1 font-bold text-[#173a2a]">Master-only internal report</div>
              <div className="mt-1 text-[11px]">Hidden from student navigation and student accounts</div>
            </div>
            <div className="border-t border-[#d7d0c3] pt-3">
              <div className="font-black uppercase tracking-[0.16em] text-[#7c7468]">
                {dateWindowApplied ? "Local source window" : "Local source corpus"}
              </div>
              <div className="mt-1 font-bold text-[#173a2a]">
                {dateWindowApplied
                  ? `${inventory?.dateWindow?.start} to ${inventory?.dateWindow?.end}`
                  : "All supported documents"}
              </div>
              <div className="mt-1 text-[11px]">
                {dateWindowApplied ? inventory?.dateWindow?.basis : `${auditFilesUsed} files scanned for V2`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Star}
          label={verification ? "Verified public coverage" : "Public-claim safe"}
          value={verification ? publicCoverageDisplay : `${audit.summary.directPercent}%`}
          detail={verifiedPublicDetail}
        />
        <MetricCard
          icon={Target}
          label={verification ? "Candidate direct leads" : "Internal leads"}
          value={`${verification ? candidateDirect : audit.summary.partial}`}
          detail={
            verification
              ? "Internal leads only; not public coverage until manually proven"
              : "Review candidates only; not public coverage until manually proven"
          }
        />
        <MetricCard
          icon={FileText}
          label={verification ? "Manual review required" : "All source files"}
          value={verification ? `${formatNumber(manualReviewRequired)}` : `${formatNumber(totalSourceFiles)}`}
          detail={
            verification
              ? "Every question remains unverified until source/page proof is retained"
              : `${formatNumber(supportedSourceDocuments)} supported docs; ${formatNumber(nonTextAssets)} media/sidecar assets`
          }
        />
        <MetricCard
          icon={AlertTriangle}
          label="Search/OCR gap"
          value={`${searchablePercent}%`}
          detail={`${formatNumber(filesWithText)} searchable files; ${formatNumber(extraction?.pdfEmptyPages)} PDF pages had no embedded text`}
        />
      </section>

      {verification && (
        <section
          data-testid="prelims-v2-evidence-ledger"
          className="rounded-lg border border-[#d69b2d] bg-[#fff8e8] p-5 text-[#5d3a05]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <LockKeyhole className="h-4 w-4" />
                V2 evidence ledger
              </div>
              <p className="text-sm font-semibold leading-6">
                Verified public coverage is not established. The {candidateDirect} candidate direct leads and{" "}
                {candidatePartial} candidate partial leads are internal leads only until every accepted question has
                source/page proof retained.
              </p>
            </div>
            <span
              data-testid="prelims-v2-verified-claim-zero"
              className="inline-flex rounded-md border border-[#d69b2d] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em]"
            >
              Verified public coverage: not established
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Candidate direct" value={`${verification.candidateDirect} internal leads only`} />
            <MiniStat label="Candidate partial" value={`${verification.candidatePartial} internal leads only`} />
            <MiniStat label="Manual review required" value={`${verification.manualReviewRequired} questions`} />
            <MiniStat
              label="OCR pending"
              value={`${formatNumber(verification.nonSearchableFiles)} files / ${formatNumber(
                verification.emptyPdfPages,
              )} pages`}
            />
          </div>
          <div className="mt-4 rounded-lg border border-[#edc46a] bg-white p-4 text-xs font-bold leading-5">
            <p>{verification.proofRule}</p>
            <p className="mt-2">{verification.claimFormula}</p>
          </div>
        </section>
      )}

      <section
        className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5 shadow-sm"
        data-testid="prelims-v2-development-tracker"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-black">
              <ListChecks className="h-4 w-4 text-[#1f6b45]" />
              V2 development status
            </div>
            <p className="max-w-3xl text-xs font-semibold leading-5 text-[#5f6a61]">
              This tracker separates what has already been built from what must remain locked before any student-facing
              or marketing claim is made.
            </p>
          </div>
          <span className="rounded-md border border-[#d7d0c3] bg-[#fbf7ef] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#173a2a]">
            Master control
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {v2DevelopmentRows.map((row) => {
            const isDone = row.status === "Done";
            return (
              <div
                key={row.label}
                className={`rounded-lg border p-4 ${
                  isDone
                    ? "border-[#1f6b45] bg-[#eef8f0] text-[#12452c]"
                    : "border-[#d69b2d] bg-[#fff8e8] text-[#7a4d00]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">{row.label}</p>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                </div>
                <p className="mt-2 text-lg font-black">{row.status}</p>
                <p className="mt-2 text-xs font-bold leading-5">{row.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]" data-testid="prelims-v2-source-lock">
        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <FolderOpen className="h-4 w-4 text-[#1f6b45]" />
            Source folder used for V2
          </div>
          <div className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c7468]">
              Confirmed local corpus
            </div>
            <div className="mt-2 break-words font-mono text-xs font-bold leading-5 text-[#173a2a]">
              {sourceIndex?.root ?? inventory?.contentRoot ?? audit.method.contentRoot ?? "Morning Batch"}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="All files" value={formatNumber(totalSourceFiles)} />
            <MiniStat label="Text docs" value={formatNumber(supportedSourceDocuments)} />
            <MiniStat label="Text chunks" value={formatNumber(extraction?.chunks)} />
          </div>
          <div className="mt-4 rounded-lg border border-[#d69b2d] bg-[#fff8e8] p-4 text-xs font-bold leading-5 text-[#5d3a05]">
            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b5a00]">
              Paper source status
            </div>
            {audit.method.paperSource}
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5" data-testid="prelims-v2-claim-discipline">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <LockKeyhole className="h-4 w-4 text-[#1f6b45]" />
            Honest claim rule
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <ClaimRule
              title={verification ? "Can be claimed now" : "Can be claimed"}
              value={publicClaimSafeValue}
              tone="border-[#1f6b45] bg-[#eef8f0] text-[#12452c]"
              body={
                verification
                  ? "No public claim until manual source/page proof is retained."
                  : "Evidence phrase or high-specificity overlap found in local content."
              }
            />
            <ClaimRule
              title={verification ? "Candidate direct" : "Internal review only"}
              value={`${verification ? candidateDirect : audit.summary.partial}`}
              tone="border-[#d69b2d] bg-[#fff8e8] text-[#7a4d00]"
              body="Internal leads only; useful for review, but not safe for public marketing until checked by a human."
            />
            <ClaimRule
              title={verification ? "Candidate partial or gap" : "No source found"}
              value={`${verification ? candidatePartial + candidateNone : audit.summary.none}`}
              tone="border-[#e06a5f] bg-[#fff1ef] text-[#8b2219]"
              body="Do not claim coverage. Verify through manual/OCR review, then build fresh content where needed."
            />
          </div>
        </div>
      </section>

      <section
        data-testid="prelims-v2-verification-backlog"
        className="rounded-lg border border-[#d69b2d] bg-[#fff8e8] p-5 text-[#5d3a05]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-black">
              <AlertTriangle className="h-4 w-4" />
              Public claim locked until manual/OCR pass
            </div>
            <p className="text-sm font-semibold leading-6">
              V2 is useful for internal diagnosis, but the public number must stay locked until candidate matches are
              manually verified and non-searchable source material is processed or explicitly excluded.
            </p>
          </div>
          <span
            data-testid="prelims-v2-public-claim-lock"
            className="inline-flex rounded-md border border-[#d69b2d] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em]"
          >
            Do not publish direct + partial
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {publicClaimLockRows.map((row) => (
            <div key={row.label} className="rounded-lg border border-[#edc46a] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b5a00]">{row.label}</p>
              <p className="mt-2 text-2xl font-black text-[#5d3a05]">{row.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-[#74500e]">{row.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {sourceIndex && (
        <section className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5" data-testid="prelims-v2-source-index">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <Archive className="h-4 w-4 text-[#1f6b45]" />
                Version 2 all-document intake
              </div>
              <p className="max-w-3xl text-xs font-semibold leading-5 text-[#5f6a61]">
                This snapshot was generated from every file inside the Morning Batch folder. Supported documents feed the
                text audit; media and sidecar files are retained as source assets but not counted as text evidence until
                they are converted or OCR-processed.
              </p>
            </div>
            <div className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-4 py-3 text-xs font-bold text-[#173a2a]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c7468]">Visibility rule</div>
              <div className="mt-1">
                Student visible: {sourceIndex.visibility.studentVisible ? "Yes" : "No"} | raw institution names suppressed
              </div>
              <div className="mt-1 text-[#5f6a61]">
                {sourceIndex.visibility.hiddenNamePathHits} sensitive path references hidden from the portal surface
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.85fr_0.85fr]">
            <div>
              <div className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#7c7468]">
                Prelims subject buckets
              </div>
              <div className="space-y-2">
                {prelimsBucketRows.map((bucket) => (
                  <div key={bucket.name} className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-3">
                    <div className="flex items-center justify-between gap-3 text-sm font-black">
                      <span>{bucket.name}</span>
                      <span>{formatNumber(bucket.totalFiles)} files</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[#5f6a61]">
                      <span>{formatNumber(bucket.supportedDocuments)} audit-ready docs</span>
                      <span>{formatBytes(bucket.totalBytes)}</span>
                      {bucket.latestModifiedAt && <span>latest {new Date(bucket.latestModifiedAt).toLocaleDateString("en-IN")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#7c7468]">
                Recent upload shape
              </div>
              <div className="space-y-2">
                {recentUploadMonths.map((month) => (
                  <div key={month.name} className="flex items-center justify-between rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-3 py-2 text-xs font-bold">
                    <span>{month.name}</span>
                    <span>{formatNumber(month.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#7c7468]">
                Non-text assets to process
              </div>
              <div className="space-y-2">
                {unsupportedRows.slice(0, 8).map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-3 py-2 text-xs font-bold">
                    <span>{item.name}</span>
                    <span>{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sourceLibraryRows.length > 0 && (
            <div
              data-testid="prelims-v2-source-library"
              className="mt-5 rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7c7468]">
                    Source library priority
                  </div>
                  <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[#5f6a61]">
                    These are the largest searchable documents inside the confirmed Morning Batch corpus. They are shown
                    as sanitized source buckets, not as public institution names.
                  </p>
                </div>
                <span className="rounded-md border border-[#d7d0c3] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#173a2a]">
                  Master intake only
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sourceLibraryRows.map((document) => (
                  <div key={document.code} className="rounded-lg border border-[#d7d0c3] bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] font-black text-[#1f6b45]">{document.code}</p>
                        <p className="mt-1 text-sm font-black text-[#173a2a]">
                          {document.prelimsBucket ?? document.topLevel}
                        </p>
                      </div>
                      <span className="rounded-md border border-[#d7d0c3] px-2 py-1 text-[10px] font-black uppercase text-[#5f6a61]">
                        {document.extension}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-[#5f6a61]">
                      <span>{formatBytes(document.size)}</span>
                      <span>{document.topLevel}</span>
                      <span>{new Date(document.modifiedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <TrendingUp className="h-4 w-4 text-[#1f6b45]" />
            Trend reading
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {trendNotes.map((note) => (
              <div key={note.title} className="rounded-lg border border-[#e3dbcd] bg-[#fbf7ef] p-4">
                <h2 className="text-sm font-black">{note.title}</h2>
                <p className="mt-2 text-xs leading-5 text-[#5f6a61]">{note.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <BarChart3 className="h-4 w-4 text-[#1f6b45]" />
            Subject evidence matrix
          </div>
          <div className="space-y-4">
            {subjectCoverageRows.map((item) => {
              const directWidth = `${item.total ? (item.direct / item.total) * 100 : 0}%`;
              const partialWidth = `${item.total ? (item.partial / item.total) * 100 : 0}%`;
              const noneWidth = `${item.total ? (item.none / item.total) * 100 : 0}%`;
              return (
                <div key={item.subject}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span>{item.subject}</span>
                    <span>{item.direct}/{item.total} {subjectMatrixDirectLabel}</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-[#eee6d8]">
                    <div className="h-full bg-[#1f6b45]" style={{ width: directWidth }} />
                    <div className="h-full bg-[#d69b2d]" style={{ width: partialWidth }} />
                    <div className="h-full bg-[#e06a5f]" style={{ width: noneWidth }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]" data-testid="prelims-v2-action-board">
        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <Target className="h-4 w-4 text-[#1f6b45]" />
            Version 2 action board
          </div>
          <div className="space-y-3">
            {actionRows.map((item) => (
              <div key={item.subject} className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-black">{item.subject}</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#5f6a61]">{item.action}</p>
                  </div>
                  <span className="rounded-md border border-[#d7d0c3] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#173a2a]">
                    {item.priority}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-[#5f6a61] sm:grid-cols-3">
                  <span>{item.direct} {verification ? "candidate direct" : "verified"}</span>
                  <span>{item.partial} review leads</span>
                  <span>{item.none} gaps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5"
          data-testid="prelims-v2-manual-queue"
        >
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-black">
              <FileText className="h-4 w-4 text-[#1f6b45]" />
              Manual verification queue
            </div>
            <div
              data-testid="prelims-v2-review-workbench"
              className="grid gap-2 sm:grid-cols-4"
            >
              {(Object.keys(reviewDecisionCopy) as AuditReviewDecision[]).map((decision) => {
                const copy = reviewDecisionCopy[decision];
                return (
                  <div key={decision} className={`rounded-lg border p-3 ${copy.tone}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">{copy.label}</span>
                      <copy.icon className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-black">{reviewSummary[decision]}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs font-semibold leading-5 text-[#5f6a61]">
              These marks are local master-review notes. They help process V2, but the public percentage remains locked
              until proof screenshots/page references are retained.
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7c7468]">
              Showing top {reviewQueue.length} of {manualReviewCandidates.length} candidates by match score
            </p>
          </div>
          <div className="space-y-3">
            {reviewQueue.map((match) => {
              const best = match.topMatches[0];
              const statusStyle = statusCopy[match.status];
              const savedReview = reviewDecisions[String(match.questionNumber)] ?? { decision: "unreviewed" as const };
              const decisionStyle = reviewDecisionCopy[savedReview.decision];
              return (
                <div
                  key={match.questionNumber}
                  className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-3"
                  data-testid={`prelims-v2-review-row-${match.questionNumber}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#173a2a] px-2 py-1 text-xs font-black text-white">
                      Q{match.questionNumber}
                    </span>
                    <span className="rounded-md border border-[#d7d0c3] bg-white px-2 py-1 text-xs font-bold text-[#5f6a61]">
                      {match.subject}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-black ${statusStyle.tone}`}>
                      {statusStyle.label}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-black ${decisionStyle.tone}`}>
                      {decisionStyle.label}
                    </span>
                    <span className="ml-auto text-xs font-black text-[#173a2a]">
                      {match.bestScore.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5f6a61]">
                    Check {best?.source.sourceCode ?? "Morning Batch evidence"}
                    {best?.source.page ? `, page ${best.source.page}` : ""} before converting this into a claim.
                  </p>
                  {best?.source.sourceHint && (
                    <p
                      data-testid={`prelims-v2-source-hint-${match.questionNumber}`}
                      className="mt-2 break-words rounded-md border border-[#e2dacd] bg-white p-2 text-[11px] font-bold leading-5 text-[#173a2a]"
                    >
                      Source lookup hint: {best.source.sourceHint}
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(["verified", "ocr-needed", "rejected"] as AuditReviewDecision[]).map((decision) => {
                      const copy = reviewDecisionCopy[decision];
                      return (
                        <button
                          key={decision}
                          type="button"
                          data-review-decision={decision}
                          data-testid={`prelims-v2-review-decision-${decision}-${match.questionNumber}`}
                          onClick={() => persistReviewDecision(match.questionNumber, { decision })}
                          className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-black transition hover:brightness-95 ${copy.tone}`}
                        >
                          <copy.icon className="h-4 w-4" />
                          {copy.label}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-3 block">
                    <span className="sr-only">Reviewer note for question {match.questionNumber}</span>
                    <input
                      value={savedReview.note ?? ""}
                      onChange={(event) => persistReviewDecision(match.questionNumber, { note: event.target.value })}
                      placeholder={decisionStyle.helper}
                      className="min-h-10 w-full rounded-md border border-[#d7d0c3] bg-white px-3 text-xs font-semibold text-[#173a2a] outline-none placeholder:text-[#9b9387] focus:border-[#1f6b45]"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {verification && (
        <section
          data-testid="prelims-v2-question-ledger"
          className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <ListChecks className="h-4 w-4 text-[#1f6b45]" />
                Question evidence ledger
              </div>
              <p className="max-w-3xl text-xs font-semibold leading-5 text-[#5f6a61]">
                All {verification.questionLedger.length} questions are unverified until a master reviewer confirms the
                source/page and keeps proof. The list below shows the first twelve review rows by question number.
              </p>
            </div>
            <span className="rounded-md border border-[#d7d0c3] bg-[#fbf7ef] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#173a2a]">
              Public claim locked
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {verification.questionLedger.slice(0, 12).map((item) => (
              <div key={item.questionNumber} className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-[#173a2a] px-2 py-1 text-xs font-black text-white">
                    Q{item.questionNumber}
                  </span>
                  <span className="rounded-md border border-[#d7d0c3] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#5f6a61]">
                    {item.verifiedStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs font-black text-[#173a2a]">{item.subject}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#5f6a61]">
                  Candidate: {item.candidateStatus} ({item.candidateBestScore.toFixed(2)})
                </p>
                <p className="mt-2 break-words text-[11px] font-bold leading-5 text-[#5f6a61]">
                  Evidence leads: {item.topEvidenceCodes.join(", ") || "None yet"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <Archive className="h-4 w-4 text-[#1f6b45]" />
            Corpus shape
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {folderRows.map(([folder, count]) => (
              <div key={folder} className="flex items-center justify-between rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-3 py-2 text-xs font-bold">
                <span>{folder}</span>
                <span>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <FileText className="h-4 w-4 text-[#1f6b45]" />
            File types scanned
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {extensionRows.map(([extension, count]) => (
              <div key={extension} className="flex items-center justify-between rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-3 py-2 text-xs font-bold">
                <span>{extension || "no extension"}</span>
                <span>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="flex items-center gap-2 rounded-lg border border-[#d7d0c3] bg-white px-3 py-2">
            <Search className="h-4 w-4 text-[#697369]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search question, topic, evidence code"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#9b9387]"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[#d7d0c3] bg-white px-3 py-2">
            <Filter className="h-4 w-4 text-[#697369]" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AuditStatus | "all")}
              className="w-full bg-transparent text-sm font-bold outline-none"
            >
              <option value="all">All statuses</option>
              <option value="direct">Candidate direct</option>
              <option value="partial">Review only</option>
              <option value="none">No source</option>
            </select>
          </label>
          <label className="rounded-lg border border-[#d7d0c3] bg-white px-3 py-2">
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full bg-transparent text-sm font-bold outline-none"
            >
              <option value="all">All subjects</option>
              {subjects.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {filteredQuestions.map((question) => {
          const match = matchByQuestion.get(question.number);
          if (!match) return null;
          const statusStyle = statusCopy[match.status];
          const StatusIcon = statusStyle.icon;
          const best = match.topMatches[0];
          return (
            <article key={question.number} className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#173a2a] px-2 py-1 text-xs font-black text-white">
                      Q{question.number}
                    </span>
                    <span className="rounded-md border border-[#d7d0c3] px-2 py-1 text-xs font-bold text-[#5f6a61]">
                      {question.subject}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-black ${statusStyle.tone}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusStyle.label}
                    </span>
                  </div>
                  <p className="max-w-4xl text-sm font-bold leading-6">{question.stem}</p>
                </div>
                <div className="rounded-lg border border-[#e2dacd] bg-[#fbf7ef] px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c7468]">Best score</div>
                  <div className="text-lg font-black">{match.bestScore.toFixed(2)}</div>
                </div>
              </div>

              <details className="mt-3 rounded-lg border border-[#eee6d8] bg-white p-3">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-[#1f6b45]">
                  View paper statement and options
                </summary>
                <div className="mt-3 space-y-3 text-sm text-[#425047]">
                  {question.statements.length > 0 && (
                    <ol className="list-decimal space-y-1 pl-5">
                      {question.statements.map((statement, index) => (
                        <li key={`${question.number}-statement-${index}`}>{statement}</li>
                      ))}
                    </ol>
                  )}
                  {question.instruction && <p className="font-semibold">{question.instruction}</p>}
                  <div className="grid gap-2 md:grid-cols-2">
                    {question.options.map((option) => (
                      <div key={`${question.number}-${option.letter}`} className="rounded-md border border-[#e2dacd] px-3 py-2">
                        <span className="font-black">{option.letter}.</span> {option.text}
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              {best ? (
                <div className="mt-3 rounded-lg border border-[#d7d0c3] bg-[#f7f3eb] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c7468]">Matched local source</div>
                      <div className="mt-1 break-words text-sm font-black text-[#173a2a]">
                        {best.source.sourceCode ?? "Morning Batch evidence"}
                        {best.source.page ? `, page ${best.source.page}` : ""}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#5f6a61]">
                      {best.phraseHits.length > 0 ? "Phrase evidence" : "Concept evidence"}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#425047]">{best.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {best.phraseHits.slice(0, 4).map((phrase) => (
                      <span key={phrase} className="rounded-md bg-[#dcefe3] px-2 py-1 text-xs font-bold text-[#12452c]">
                        {phrase}
                      </span>
                    ))}
                    {best.matchedTerms.slice(0, 8).map((term) => (
                      <span key={term} className="rounded-md border border-[#d7d0c3] bg-white px-2 py-1 text-xs font-bold text-[#5f6a61]">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-[#f0c7c0] bg-[#fff5f3] p-4 text-sm font-bold text-[#8b2219]">
                  No reliable source candidate found in the searchable corpus.
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default function Prelims2026AuditPage() {
  return (
    <PrelimsAuditPageClient
      versionLabel="Internal Version 1 Archive"
      archiveNotice="Version 1 is retained only for master comparison. Student access stays blocked, and Version 2 is the active Morning Batch evidence view."
    />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#d7d0c3] bg-[#fffdf8] p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#173a2a] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7c7468]">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-xs font-semibold leading-5 text-[#5f6a61]">{detail}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2dacd] bg-white p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c7468]">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function ClaimRule({
  title,
  value,
  tone,
  body,
}: {
  title: string;
  value: string;
  tone: string;
  body: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.16em]">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <p className="mt-2 text-xs font-semibold leading-5">{body}</p>
    </div>
  );
}

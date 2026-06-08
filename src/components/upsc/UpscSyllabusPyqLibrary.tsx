"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSearch,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  officialPaperIndexRows,
  officialPaperIndexSummary,
  officialSourceAnchors,
  optionalSourcePacks,
  sourceReadinessMatrix,
  subjectSourcePacks,
  syllabusPyqPreloadAudit,
  syllabusPyqRegistrySummary,
  type ImportStatus,
  type SourceReadinessStatus,
} from "@/lib/upsc/syllabusPyqRegistry";
import {
  buildExactPyqImportReadiness,
  readLocalPyqImportRecords,
  type PyqImportRecord,
} from "@/lib/upsc/pyqImportLedger";

function statusLabel(status: ImportStatus) {
  if (status === "source-indexed") return "Source indexed";
  if (status === "topic-mapped") return "Topic mapped";
  return "Text import pending";
}

function statusTone(status: ImportStatus) {
  if (status === "source-indexed") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "topic-mapped") return "border-[#8ab6ff] bg-[#eef5ff] text-[#12366c]";
  return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
}

function readinessStatusLabel(status: SourceReadinessStatus) {
  if (status === "student-route-ready") return "Student route ready";
  if (status === "source-index-ready") return "Source index ready";
  if (status === "partial-mapping") return "Partial mapping";
  return "Import pending";
}

function readinessStatusTone(status: SourceReadinessStatus) {
  if (status === "student-route-ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "source-index-ready") return "border-[#8ab6ff] bg-[#eef5ff] text-[#12366c]";
  if (status === "partial-mapping") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#ffb6b6] bg-[#fff0f0] text-[#8a1111]";
}

function exactStageTone(status: string) {
  if (status === "complete") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "active") return "border-[#8ab6ff] bg-[#eef5ff] text-[#12366c]";
  return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
}

export function UpscSyllabusPyqLibrary() {
  const [pyqRecords, setPyqRecords] = useState<PyqImportRecord[]>([]);

  useEffect(() => {
    setPyqRecords(readLocalPyqImportRecords());
  }, []);

  const [firstSubject] = subjectSourcePacks;
  const [firstOptional] = optionalSourcePacks;
  const exactPyqReadiness = useMemo(() => buildExactPyqImportReadiness(pyqRecords), [pyqRecords]);
  const directPaperPreviewRows = officialPaperIndexRows
    .filter((row) => row.status === "direct-paper-page-linked")
    .slice(0, 6);
  const exactVerifiedRows = pyqRecords.filter((record) => record.textStatus === "EXACT_VERIFIED");
  const recentExactRows = exactVerifiedRows.slice(0, 6);
  const sourceReadinessRows = useMemo(
    () =>
      sourceReadinessMatrix.map((row) => {
        if (row.id !== "exact-pyq-question-text") return row;
        if (exactPyqReadiness.exactQuestionTextRows === 0) return row;

        return {
          ...row,
          status: exactPyqReadiness.studentReady ? ("student-route-ready" as const) : ("partial-mapping" as const),
          studentReady: exactPyqReadiness.studentReady,
          countValue: exactPyqReadiness.exactQuestionTextRows,
          proof: `${exactPyqReadiness.exactQuestionTextRows} exact verified PYQ row${
            exactPyqReadiness.exactQuestionTextRows === 1 ? "" : "s"
          } are staged in the import ledger; ${exactPyqReadiness.mappedExactQuestionRows} are mapped.`,
          productUse:
            "Imported exact PYQs are visible as admin-staged evidence and can feed planner, revision, reports, and question-bank wiring after review.",
          remainingWork: exactPyqReadiness.studentReady
            ? "Connect the verified bank to student-facing drills with route-level review receipts."
            : "Continue official-paper extraction until the queue is substantially mapped; unreviewed rows remain admin-staged.",
        };
      }),
    [exactPyqReadiness]
  );
  const studentReadyRows = sourceReadinessRows.filter((row) => row.studentReady).length;
  const importPendingRows = sourceReadinessRows.filter((row) => row.status === "import-pending").length;
  const totalLoopStages = subjectSourcePacks.reduce((sum, subject) => sum + subject.dailyLoop.stageCount, 0);
  const averageRecallTarget = Math.round(
    subjectSourcePacks.reduce((sum, subject) => sum + subject.dailyLoop.targetRecallPercent, 0) /
      subjectSourcePacks.length
  );

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section data-testid="upsc-source-library-hero" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Syllabus and PYQ source library</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">The preload ledger is now visible.</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This page is the operating checklist for subject-wise syllabus demand, prelims PYQs, mains PYQs,
                optional Paper I/II sources, trend mapping, NCERT basics, reference depth, and current-affairs hooks.
                Use trend signals to choose watch areas, not to claim exact question prediction.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["GS subjects", syllabusPyqRegistrySummary.coreSubjectCount],
                ["Optional subjects", syllabusPyqRegistrySummary.optionalSubjectCount],
                ["GS source rows", syllabusPyqRegistrySummary.gsPyqRows],
                ["Trend boards", syllabusPyqRegistrySummary.trendInsightCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-syllabus-pyq-preload-proof"
          data-proof-rule={syllabusPyqPreloadAudit.proofRule}
          data-year-window={syllabusPyqPreloadAudit.yearWindow}
          data-core-subject-count={syllabusPyqPreloadAudit.coreSubjectCount}
          data-optional-subject-count={syllabusPyqPreloadAudit.optionalSubjectCount}
          data-gs-pyq-rows={syllabusPyqPreloadAudit.gsPyqRows}
          data-optional-pyq-rows={syllabusPyqPreloadAudit.optionalPyqRows}
          data-total-pyq-rows={syllabusPyqPreloadAudit.totalPyqRows}
          data-source-indexed-rows={syllabusPyqPreloadAudit.sourceIndexedRows}
          data-text-import-pending-rows={syllabusPyqPreloadAudit.textImportPendingRows}
          data-official-anchor-count={syllabusPyqPreloadAudit.officialAnchorCount}
          data-trend-insight-count={syllabusPyqPreloadAudit.trendInsightCount}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                Preload audit proof
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                GS and optional source rows are counted from one registry.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#49675e]">
                {syllabusPyqPreloadAudit.statusRule}
              </p>
            </div>
            <Database className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AuditMetric label="Year window" value={syllabusPyqPreloadAudit.yearWindow} />
            <AuditMetric label="GS PYQ rows" value={syllabusPyqPreloadAudit.gsPyqRows} />
            <AuditMetric label="Optional rows" value={syllabusPyqPreloadAudit.optionalPyqRows} />
            <AuditMetric label="Total rows" value={syllabusPyqPreloadAudit.totalPyqRows} />
            <AuditMetric label="Source indexed" value={syllabusPyqPreloadAudit.sourceIndexedRows} />
            <AuditMetric label="Text pending" value={syllabusPyqPreloadAudit.textImportPendingRows} />
            <AuditMetric label="Official anchors" value={syllabusPyqPreloadAudit.officialAnchorCount} />
            <AuditMetric label="Trend insights" value={syllabusPyqPreloadAudit.trendInsightCount} />
          </div>
        </section>

        <section
          data-testid="upsc-source-readiness-matrix"
          data-total-rows={sourceReadinessRows.length}
          data-student-ready-rows={studentReadyRows}
          data-import-pending-rows={importPendingRows}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Student readiness matrix
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Source coverage is separated from exact PYQ import.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This matrix keeps the portal honest: route coverage and official paper links can be student-visible,
                while exact question text and question-level tagging remain gated until verified import is complete.
              </p>
            </div>
            <FileSearch className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {sourceReadinessRows.map((row) => (
              <article
                key={row.id}
                data-testid="upsc-source-readiness-row"
                data-readiness-id={row.id}
                data-status={row.status}
                data-student-ready={String(row.studentReady)}
                data-count-label={row.countLabel}
                data-count-value={String(row.countValue)}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {row.countLabel}: {row.countValue}
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight">{row.title}</h3>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${readinessStatusTone(row.status)}`}>
                    {readinessStatusLabel(row.status)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-[#4f5e55]">
                  <p className="rounded-md bg-white p-2 font-bold text-[#31443a]">Proof: {row.proof}</p>
                  <p className="rounded-md bg-[#e7f5ee] p-2 font-bold text-[#085041]">Use: {row.productUse}</p>
                  <p className="rounded-md bg-[#fff4df] p-2 font-bold text-[#6f4a12]">Remaining: {row.remainingWork}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-daily-loop-contract-summary"
          data-proof-rule="source-path-to-daily-loop-bridge"
          data-subject-count={subjectSourcePacks.length}
          data-total-loop-stages={totalLoopStages}
          data-average-recall-target={averageRecallTarget}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                Source path to daily loop
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                Every source pack now declares the learner flow.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Syllabus, PYQ trend, current affairs, gap analysis, revision, and reports are connected through one
                simple sequence: recall, learn, discuss, MCQ, then repair or report.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <AuditMetric label="Subjects" value={subjectSourcePacks.length} />
              <AuditMetric label="Loop stages" value={totalLoopStages} />
              <AuditMetric label="Recall target" value={`${averageRecallTarget}%`} />
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-official-paper-index-proof"
          data-proof-rule={officialPaperIndexSummary.proofRule}
          data-year-window={officialPaperIndexSummary.yearWindow}
          data-prelims-paper-rows={officialPaperIndexSummary.prelimsPaperRows}
          data-gs-mains-paper-rows={officialPaperIndexSummary.gsMainsPaperRows}
          data-optional-paper-index-rows={officialPaperIndexSummary.optionalPaperIndexRows}
          data-total-paper-index-rows={officialPaperIndexSummary.totalPaperIndexRows}
          data-direct-linked-paper-rows={officialPaperIndexSummary.directLinkedPaperRows}
          data-index-page-paper-rows={officialPaperIndexSummary.indexPagePaperRows}
          data-exact-question-text-rows={exactPyqReadiness.exactQuestionTextRows}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Official paper index
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Paper sources are loaded before exact question import.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                {exactPyqReadiness.exactQuestionTextRows > 0
                  ? `${exactPyqReadiness.exactQuestionTextRows} exact verified question row${
                      exactPyqReadiness.exactQuestionTextRows === 1 ? "" : "s"
                    } are staged from the admin import ledger. ${exactPyqReadiness.nextQueueRule}`
                  : `${officialPaperIndexSummary.exactImportRule} ${officialPaperIndexSummary.nextAction}`}
              </p>
            </div>
            <ClipboardList className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AuditMetric label="Prelims papers" value={officialPaperIndexSummary.prelimsPaperRows} />
            <AuditMetric label="Mains GS papers" value={officialPaperIndexSummary.gsMainsPaperRows} />
            <AuditMetric label="Optional papers" value={officialPaperIndexSummary.optionalPaperIndexRows} />
            <AuditMetric label="Total papers" value={officialPaperIndexSummary.totalPaperIndexRows} />
            <AuditMetric label="Direct linked" value={officialPaperIndexSummary.directLinkedPaperRows} />
            <AuditMetric label="Index linked" value={officialPaperIndexSummary.indexPagePaperRows} />
            <AuditMetric label="Exact text rows" value={exactPyqReadiness.exactQuestionTextRows} />
            <AuditMetric label="Window" value={officialPaperIndexSummary.yearWindow} />
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {directPaperPreviewRows.map((row) => (
              <a
                key={row.id}
                href={row.sourceHref}
                data-testid="upsc-official-paper-index-row"
                data-stage={row.stage}
                data-year={row.year}
                data-status={row.status}
                className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 transition hover:border-[#1d9e75]"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  {row.year} / {row.stage} / {row.status.replaceAll("-", " ")}
                </p>
                <h3 className="mt-1 text-sm font-black">{row.paper}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{row.nextAction}</p>
              </a>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-exact-pyq-readiness-gate"
          data-proof-rule={exactPyqReadiness.proofRule}
          data-local-record-mode="static-source-library-baseline"
          data-official-paper-index-rows={exactPyqReadiness.officialPaperIndexRows}
          data-direct-linked-official-papers={exactPyqReadiness.directLinkedOfficialPapers}
          data-index-linked-official-papers={exactPyqReadiness.indexLinkedOfficialPapers}
          data-high-priority-paper-rows={exactPyqReadiness.highPriorityPaperRows}
          data-exact-question-text-rows={exactPyqReadiness.exactQuestionTextRows}
          data-mapped-exact-question-rows={exactPyqReadiness.mappedExactQuestionRows}
          data-needs-review-rows={exactPyqReadiness.needsReviewRows}
          data-strict-coverage-percent={exactPyqReadiness.strictCoveragePercent}
          data-student-ready={String(exactPyqReadiness.studentReady)}
          className="rounded-lg border border-[#ef9f27] bg-[#fff4df] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6f4a12]">
                Exact PYQ student gate
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                Official index is ready; exact question drills stay gated.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d3a05]">
                {exactPyqReadiness.studentReadyLabel} {exactPyqReadiness.nextQueueRule}
              </p>
              <Link
                href="/admin/pyq-import"
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                Open exact import room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <AuditMetric label="Official queue" value={exactPyqReadiness.officialPaperIndexRows} />
              <AuditMetric label="Direct links" value={exactPyqReadiness.directLinkedOfficialPapers} />
              <AuditMetric label="High priority" value={exactPyqReadiness.highPriorityPaperRows} />
              <AuditMetric label="Exact imported" value={exactPyqReadiness.exactQuestionTextRows} />
              <AuditMetric label="Mapped exact" value={exactPyqReadiness.mappedExactQuestionRows} />
              <AuditMetric label="Strict coverage" value={`${exactPyqReadiness.strictCoveragePercent}%`} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {exactPyqReadiness.stages.map((stage) => (
              <article
                key={stage.id}
                data-testid="upsc-exact-pyq-pipeline-stage"
                data-stage-id={stage.id}
                data-stage-status={stage.status}
                data-row-count={stage.rowCount}
                className={`rounded-lg border p-4 ${exactStageTone(stage.status)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md border border-current/20 bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]">
                    {stage.status}
                  </span>
                  <span className="font-mono text-sm font-black">{stage.rowCount}</span>
                </div>
                <h3 className="mt-3 text-sm font-black tracking-tight">{stage.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5">{stage.proof}</p>
                <p className="mt-2 text-xs font-bold leading-5 opacity-80">{stage.studentImpact}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-testid="upsc-official-source-anchors" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#1a3a2a]" />
            <h2 className="text-xl font-black tracking-tight">Official source anchors</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {officialSourceAnchors.map((source) => (
              <a key={source.id} href={source.href} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  {source.stage}{source.year ? ` / ${source.year}` : ""}
                </p>
                <h3 className="mt-1 text-base font-black">{source.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{source.note}</p>
              </a>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-exact-pyq-import-preview"
          data-proof-rule="local-exact-pyq-ledger-to-source-library"
          data-imported-record-count={pyqRecords.length}
          data-exact-record-count={exactPyqReadiness.exactQuestionTextRows}
          data-mapped-record-count={exactPyqReadiness.mappedExactQuestionRows}
          data-needs-review-count={exactPyqReadiness.needsReviewRows}
          data-student-ready={String(exactPyqReadiness.studentReady)}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Imported exact PYQ preview
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Verified rows now travel from import room to source library.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The source page no longer stays blind after admin import. It shows staged exact rows, while still
                keeping student drills gated until the official queue is mapped enough for release.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-[#1a3a2a]" />
          </div>

          {recentExactRows.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {recentExactRows.map((record) => (
                <article
                  key={record.id}
                  data-testid="upsc-exact-pyq-preview-row"
                  data-record-id={record.id}
                  data-subject-slug={record.subjectSlug}
                  data-stage={record.stage}
                  data-kind={record.kind}
                  data-text-status={record.textStatus}
                  data-import-status={record.importStatus}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md border border-[#b9d9cd] bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">
                      {record.textStatus.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#34453b]">
                      {record.year} / {record.questionNumber}
                    </span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                    {record.subjectTitle} / {record.stage} / {record.paper}
                  </p>
                  <h3 className="mt-2 text-sm font-black leading-6 text-[#13251d]">{record.questionText}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">
                    {record.syllabusArea} · {record.topicTags.join(", ")}
                  </p>
                  <a
                    href={record.sourceHref}
                    className="mt-3 inline-flex text-xs font-black text-[#085041] underline underline-offset-4"
                  >
                    Official source
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#ef9f27]/50 bg-[#fff4df] p-4 text-sm font-bold leading-6 text-[#6f4a12]">
              No exact verified question rows are staged yet. Use the admin PYQ import room to paste official
              question text with source URL, paper, question number, syllabus area, and topic tags.
            </div>
          )}
        </section>

        <section data-testid="upsc-subject-source-packs" className="grid gap-3 xl:grid-cols-2">
          {subjectSourcePacks.map((subject) => {
            const indexedRows = subject.pyqRows.filter((row) => row.status !== "text-import-pending").length;
            const pendingRows = subject.pyqRows.length - indexedRows;

            return (
              <article
                key={subject.slug}
                data-testid="upsc-subject-source-pack"
                data-subject-slug={subject.slug}
                data-syllabus-node-count={subject.syllabusNodes.length}
                data-pyq-row-count={subject.pyqRows.length}
                data-indexed-row-count={indexedRows}
                data-pending-row-count={pendingRows}
                data-trend-insight-count={subject.trendInsights.length}
                data-readiness-score={subject.readinessScore}
                className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">GS source pack</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight">{subject.title}</h2>
                  </div>
                  <Link href={subject.route} className="inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white">
                    Subject <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Metric label="Nodes" value={subject.syllabusNodes.length} />
                  <Metric label="Indexed" value={indexedRows} />
                  <Metric label="Pending" value={pendingRows} />
                </div>
                <div className="mt-3 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-3" data-testid="upsc-systematic-path">
                  <div className="mb-2 flex items-center gap-2">
                    <Route className="h-4 w-4 text-[#085041]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Systematic path rule</p>
                  </div>
                  <div className="grid gap-2">
                    <PathRow label="Basics" value={subject.systematicPath.basicsStart} />
                    <PathRow label="Advanced" value={subject.systematicPath.advancedBridge} />
                    <PathRow label="PYQ trend" value={subject.systematicPath.pyqTrendRule} />
                    <PathRow label="Next-year focus" value={subject.systematicPath.nextYearFocusRule} />
                    <PathRow label="Current affairs" value={subject.systematicPath.currentAffairsRule} />
                    <PathRow label="Gap" value={subject.systematicPath.gapRule} />
                    <PathRow label="Revision" value={subject.systematicPath.revisionRule} />
                  </div>
                </div>
                <div
                  className="mt-3 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                  data-testid="upsc-subject-loop-contract"
                  data-subject-slug={subject.slug}
                  data-proof-rule={subject.dailyLoop.proofRule}
                  data-stage-count={subject.dailyLoop.stageCount}
                  data-target-recall={subject.dailyLoop.targetRecallPercent}
                  data-command-score={subject.dailyLoop.commandScorePercent}
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                        Daily learner loop
                      </p>
                      <h3 className="mt-1 text-base font-black tracking-tight">
                        Recall to report handoff
                      </h3>
                    </div>
                    <span className="rounded-md border border-[#b9d9cd] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">
                      {subject.dailyLoop.targetRecallPercent}% recall
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-5">
                    {subject.dailyLoop.stages.map((stage, index) => (
                      <Link
                        key={stage.id}
                        href={`${subject.route}/${stage.routeSuffix}`}
                        data-testid="upsc-subject-loop-stage"
                        data-stage-id={stage.id}
                        data-stage-index={index + 1}
                        className="rounded-md border border-[#dcd5c7] bg-white p-3 transition hover:border-[#1d9e75]"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                          {String(index + 1).padStart(2, "0")} / {stage.label}
                        </p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-[#31443a]">{stage.studentAction}</p>
                        <p className="mt-2 rounded-md bg-[#e7f5ee] p-2 text-[11px] font-bold leading-4 text-[#085041]">
                          Evidence: {stage.evidence}
                        </p>
                        <p className="mt-2 text-[11px] font-bold leading-4 text-[#6f4a12]">{stage.unlockRule}</p>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-[#31443a] md:grid-cols-3">
                    <p className="rounded-md bg-white p-2">Beginner: {subject.dailyLoop.beginnerEntry}</p>
                    <p className="rounded-md bg-white p-2">Experienced: {subject.dailyLoop.experiencedEntry}</p>
                    <p className="rounded-md bg-white p-2">Handoff: {subject.dailyLoop.automaticHandoffRule}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2" data-testid="upsc-pyq-trend-board">
                  {subject.trendInsights.map((trend) => (
                    <details
                      key={trend.id}
                      data-testid="upsc-pyq-trend-insight"
                      data-evidence-level={trend.evidenceLevel}
                      className="rounded-md border border-[#cfe5dc] bg-white p-3"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                              {trend.trendWindow} / {trend.syllabusArea}
                            </p>
                            <h3 className="mt-1 text-sm font-black">{trend.label}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <TrendBadge label="Prelims" value={trend.prelimsWeight} />
                            <TrendBadge label="Mains" value={trend.mainsWeight} />
                          </div>
                        </div>
                      </summary>
                      <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-[#4f5e55]">
                        <p>{trend.pyqSignal}</p>
                        <p className="rounded-md bg-[#f7f4ee] p-2 font-bold text-[#31443a]">Next watch: {trend.nextYearWatch}</p>
                        <p className="rounded-md bg-[#e7f5ee] p-2 font-bold text-[#085041]">{trend.contentDesign}</p>
                        <p className="rounded-md bg-[#fff4df] p-2 font-bold text-[#6f4a12]">{trend.dailyPlannerUse}</p>
                      </div>
                    </details>
                  ))}
                </div>
                <div className="mt-3 grid gap-2">
                  {subject.syllabusNodes.map((node) => (
                    <details key={node.id} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                      <summary className="cursor-pointer list-none text-sm font-black">{node.title}</summary>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <p className="text-xs font-semibold leading-5 text-[#5d675f]">{node.demand}</p>
                        <p className="text-xs font-semibold leading-5 text-[#31443a]">{node.trendSignal}</p>
                        <p className="rounded-md bg-white p-2 text-xs font-bold leading-5 text-[#085041]">{node.basicsLayer}</p>
                        <p className="rounded-md bg-white p-2 text-xs font-bold leading-5 text-[#6f4a12]">{node.currentAffairsHook}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section data-testid="upsc-pyq-import-sample" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-[#1a3a2a]" />
            <h2 className="text-xl font-black tracking-tight">PYQ import rows</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <ImportPreview title={`${firstSubject.title} GS rows`} rows={firstSubject.pyqRows.slice(0, 8)} />
            <ImportPreview title={`${firstOptional.title} optional rows`} rows={firstOptional.paperRows.slice(0, 8)} />
          </div>
        </section>

        <section data-testid="upsc-optional-source-packs" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional paper preload</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">All optional subjects have Paper I/II source rows</h2>
            </div>
            <BookMarked className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {optionalSourcePacks.map((subject) => (
              <Link
                key={subject.slug}
                href={subject.route}
                data-testid="upsc-optional-source-pack-link"
                data-optional-slug={subject.slug}
                data-paper-row-count={subject.paperRows.length}
                data-year-count={subject.yearRows.length}
                data-readiness-score={subject.readinessScore}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-3 transition hover:border-[#1d9e75]"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{subject.group}</p>
                <h3 className="mt-1 text-sm font-black">{subject.title}</h3>
                <p className="mt-1 text-xs font-semibold text-[#5d675f]">
                  {subject.paperRows.length} Paper I/II rows / {subject.readinessScore}% source indexed
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function AuditMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-[#b9d9cd] bg-white/75 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#13251d]">{value}</p>
    </div>
  );
}

function ImportPreview({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    year: number;
    stage: string;
    paper: string;
    sourceHref: string;
    status: ImportStatus;
  }>;
}) {
  return (
    <article className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-[#1a3a2a]" />
        <h3 className="text-base font-black">{title}</h3>
      </div>
      <div className="grid gap-2">
        {rows.map((row) => (
          <a key={`${row.year}-${row.stage}-${row.paper}`} href={row.sourceHref} className="grid gap-2 rounded-md border border-[#dcd5c7] bg-white p-3 sm:grid-cols-[0.4fr_1fr_0.7fr] sm:items-center">
            <span className="text-xs font-black">{row.year}</span>
            <span className="text-xs font-semibold leading-5 text-[#31443a]">{row.paper}</span>
            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusTone(row.status)}`}>
              {statusLabel(row.status)}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-bold leading-5 text-[#5d675f]">
        <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
        Source rows exist; trend boards are operational; full PDF text extraction and exact topic tagging continue next.
      </p>
    </article>
  );
}

function PathRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-md bg-white/80 p-2 text-xs font-semibold leading-5 text-[#31443a]">
      <span className="font-black text-[#085041]">{label}:</span> {value}
    </p>
  );
}

function TrendBadge({ label, value }: { label: string; value: string }) {
  const tone =
    value === "High"
      ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
      : value === "Medium"
        ? "border-[#8ab6ff] bg-[#eef5ff] text-[#12366c]"
        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b]";

  return (
    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${tone}`}>
      {label}: {value}
    </span>
  );
}

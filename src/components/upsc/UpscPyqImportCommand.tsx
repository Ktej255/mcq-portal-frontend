"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileInput,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  appendLocalPyqImportRecords,
  buildPyqImportCoverage,
  buildPyqImportCsvTemplate,
  buildPyqImportRecordsFromCsvRows,
  clearLocalPyqImportRecords,
  pyqImportCsvColumns,
  readLocalPyqImportRecords,
  summarizePyqImportLedger,
  type PyqImportCsvRow,
  type PyqImportParseResult,
  type PyqImportRecord,
} from "@/lib/upsc/pyqImportLedger";

function downloadTemplate() {
  const blob = new Blob([buildPyqImportCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "upsc-pyq-exact-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsv(input: string): PyqImportCsvRow[] {
  const parsed = Papa.parse<PyqImportCsvRow>(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return parsed.data.filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
}

export function UpscPyqImportCommand() {
  const [records, setRecords] = useState<PyqImportRecord[]>([]);
  const [csvInput, setCsvInput] = useState("");
  const [lastResult, setLastResult] = useState<PyqImportParseResult | null>(null);

  useEffect(() => {
    setRecords(readLocalPyqImportRecords());
  }, []);

  const summary = useMemo(() => summarizePyqImportLedger(records), [records]);
  const coverage = useMemo(() => buildPyqImportCoverage(records), [records]);
  const recentRecords = records.slice(0, 8);

  function handleTemplateInsert() {
    setCsvInput(buildPyqImportCsvTemplate());
  }

  function handleImport() {
    const parsedRows = parseCsv(csvInput);
    const result = buildPyqImportRecordsFromCsvRows(parsedRows);
    setLastResult(result);
    if (result.accepted.length > 0) {
      setRecords(appendLocalPyqImportRecords(result.accepted));
    }
  }

  function handleClear() {
    clearLocalPyqImportRecords();
    setRecords([]);
    setLastResult(null);
  }

  return (
    <div className="space-y-6" data-testid="admin-pyq-import-command">
      <header className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Operator-only exact PYQ staging
            </div>
            <h1 className="text-3xl font-black text-zinc-950">PYQ Import Command</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Paste verified official UPSC question rows here. Each row is validated against the GS and optional
              catalog, then staged with syllabus area, topic tags, trend board, and official source URL.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
            >
              <Download className="h-4 w-4" /> Template
            </button>
            <Link
              href="/upsc/source-library"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              Source Library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-testid="admin-pyq-import-summary">
        <Metric label="Imported" value={summary.importedQuestions} />
        <Metric label="Mapped" value={summary.mappedQuestions} />
        <Metric label="Needs review" value={summary.needsReview} />
        <Metric label="Subjects touched" value={summary.subjectsTouched} />
        <Metric label="Optional rows" value={summary.optionalQuestions} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
                <FileInput className="h-5 w-5 text-emerald-700" />
                Exact question CSV
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Local staging is deliberate. Public student claims should wait until rows are mapped and reviewed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTemplateInsert}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs font-black text-zinc-900 transition hover:bg-zinc-50"
            >
              Insert template
            </button>
          </div>

          <textarea
            data-testid="admin-pyq-import-textarea"
            value={csvInput}
            onChange={(event) => setCsvInput(event.target.value)}
            rows={14}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs leading-5 text-zinc-900 outline-none transition focus:border-emerald-600 focus:bg-white"
            placeholder="Paste CSV rows with year, stage, subject_slug, paper, question_number, question_text, syllabus_area, topic_tags, source_href..."
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="admin-pyq-import-run"
              onClick={handleImport}
              disabled={!csvInput.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <Database className="h-4 w-4" /> Validate and stage
            </button>
            <button
              type="button"
              data-testid="admin-pyq-import-clear"
              onClick={handleClear}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-800 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" /> Clear local staging
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-pyq-import-contract">
          <h2 className="text-xl font-black text-zinc-950">Import contract</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Required fields are enforced before a row can become part of the exact PYQ ledger.
          </p>
          <div className="mt-4 grid gap-2">
            {pyqImportCsvColumns.map((column) => (
              <div key={column.key} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs font-black text-zinc-950">{column.key}</p>
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                      column.required
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 bg-white text-zinc-500"
                    }`}
                  >
                    {column.required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-600">{column.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lastResult ? (
        <section className="grid gap-4 lg:grid-cols-2" data-testid="admin-pyq-import-result">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
              <CheckCircle2 className="h-5 w-5" />
              Accepted rows: {lastResult.accepted.length}
            </h2>
            <div className="mt-3 grid gap-2">
              {lastResult.accepted.slice(0, 5).map((record) => (
                <p key={record.id} className="rounded-md bg-white/80 p-2 text-xs font-semibold leading-5 text-emerald-900">
                  {record.year} / {record.subjectTitle} / {record.paper} / {record.questionNumber}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-amber-950">
              <XCircle className="h-5 w-5" />
              Rejected rows: {lastResult.rejected.length}
            </h2>
            <div className="mt-3 grid gap-2">
              {lastResult.rejected.length ? (
                lastResult.rejected.slice(0, 5).map((issue) => (
                  <p key={`${issue.rowNumber}-${issue.reason}`} className="rounded-md bg-white/80 p-2 text-xs font-semibold leading-5 text-amber-900">
                    Row {issue.rowNumber}: {issue.reason}
                  </p>
                ))
              ) : (
                <p className="rounded-md bg-white/80 p-2 text-xs font-semibold leading-5 text-amber-900">
                  No rejected rows in the last import.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-pyq-coverage-table">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-950">GS PYQ coverage</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Coverage compares mapped exact questions against the source-row ledger. It is intentionally strict.
            </p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-700">
            {coverage.length} GS subjects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Subject</th>
                <th className="py-3 pr-4">Source rows</th>
                <th className="py-3 pr-4">Imported</th>
                <th className="py-3 pr-4">Mapped</th>
                <th className="py-3 pr-4">Review</th>
                <th className="py-3 pr-4">Trend boards</th>
                <th className="py-3 pr-4">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coverage.map((row) => (
                <tr key={row.slug} data-testid="admin-pyq-coverage-row" data-subject-slug={row.slug}>
                  <td className="py-3 pr-4 font-black text-zinc-950">{row.title}</td>
                  <td className="py-3 pr-4 text-zinc-600">{row.sourceRows}</td>
                  <td className="py-3 pr-4 text-zinc-600">{row.importedQuestions}</td>
                  <td className="py-3 pr-4 text-emerald-700">{row.mappedQuestions}</td>
                  <td className="py-3 pr-4 text-amber-700">{row.needsReview}</td>
                  <td className="py-3 pr-4 text-zinc-600">{row.trendBoards}</td>
                  <td className="py-3 pr-4 font-black text-zinc-950">{row.coveragePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-pyq-recent-records">
        <h2 className="text-xl font-black text-zinc-950">Recent exact PYQ rows</h2>
        <div className="mt-4 grid gap-3">
          {recentRecords.length ? (
            recentRecords.map((record) => (
              <article key={record.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                  <span>{record.year}</span>
                  <span>{record.stage}</span>
                  <span>{record.subjectTitle}</span>
                  <span>{record.questionNumber}</span>
                  <span
                    className={`rounded-md border px-2 py-1 ${
                      record.importStatus === "MAPPED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {record.importStatus.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-6 text-zinc-700">{record.questionText}</p>
                <p className="mt-2 text-xs font-bold leading-5 text-zinc-500">
                  {record.syllabusArea} / {record.topicTags.join(", ")}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
              No exact PYQ rows have been staged yet. Paste verified official paper rows above to begin.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowRight,
  CheckCircle2,
  CloudOff,
  Database,
  Download,
  FileInput,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { readLocalMockToken } from "@/lib/auth/local-testing";
import { supabase } from "@/lib/supabase/client";
import {
  appendLocalPyqImportRecords,
  buildPyqImportCoverage,
  buildPyqImportCsvTemplate,
  buildPyqImportRecordsFromCsvRows,
  clearLocalPyqImportRecords,
  dedupePyqImportRecords,
  pyqImportCsvColumns,
  readLocalPyqImportRecords,
  seededPyqPatternRecords,
  summarizePyqImportLedger,
  type PyqImportCsvRow,
  type PyqImportParseResult,
  type PyqImportRecord,
  writeLocalPyqImportRecords,
} from "@/lib/upsc/pyqImportLedger";

type PyqPersistenceMode = "checking" | "supabase" | "local-only" | "unavailable";

type PyqPersistenceState = {
  mode: PyqPersistenceMode;
  message: string;
  table?: string;
  savedCount: number;
  checkedAt?: string;
};

type PyqPersistencePayload = {
  mode?: "supabase" | "local-only" | "unavailable";
  message?: string;
  table?: string;
  savedCount?: number;
  records?: PyqImportRecord[];
};

const defaultPersistenceState: PyqPersistenceState = {
  mode: "checking",
  message: "Checking exact PYQ persistence...",
  savedCount: 0,
};

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

async function buildInternalApiHeaders() {
  const headers: Record<string, string> = {};
  const mockToken = readLocalMockToken();
  if (mockToken) {
    headers.Authorization = `Bearer ${mockToken}`;
    return headers;
  }

  if (!supabase) return headers;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    return headers;
  }

  return headers;
}

async function requestPyqPersistence(records?: PyqImportRecord[]): Promise<PyqPersistencePayload> {
  const headers = await buildInternalApiHeaders();
  const response = await fetch("/api/admin/pyq-import", {
    method: records ? "POST" : "GET",
    headers: records
      ? {
          ...headers,
          "Content-Type": "application/json",
        }
      : headers,
    body: records ? JSON.stringify({ records }) : undefined,
    cache: "no-store",
  });

  if (response.status === 403) {
    return {
      mode: "unavailable",
      message: "Master access is required before exact PYQ rows can sync to the server.",
      savedCount: 0,
    };
  }

  const payload = (await response.json().catch(() => null)) as PyqPersistencePayload | null;
  if (!payload || !payload.mode) {
    return {
      mode: "unavailable",
      message: "PYQ persistence returned an invalid response. Browser-local staging remains available.",
      savedCount: 0,
    };
  }

  return payload;
}

function stateFromPersistencePayload(payload: PyqPersistencePayload): PyqPersistenceState {
  const mode = payload.mode === "supabase" || payload.mode === "local-only" ? payload.mode : "unavailable";
  return {
    mode,
    message:
      payload.message ??
      (mode === "supabase"
        ? "Supabase persistence is active for exact PYQ import rows."
        : "Browser-local staging remains available."),
    table: payload.table,
    savedCount: payload.savedCount ?? payload.records?.length ?? 0,
    checkedAt: new Date().toISOString(),
  };
}

export function UpscPyqImportCommand() {
  const [records, setRecords] = useState<PyqImportRecord[]>([]);
  const [csvInput, setCsvInput] = useState("");
  const [lastResult, setLastResult] = useState<PyqImportParseResult | null>(null);
  const [persistence, setPersistence] = useState<PyqPersistenceState>(defaultPersistenceState);
  const [isSyncing, setIsSyncing] = useState(false);

  const hydratePersistence = useCallback(async () => {
    const localRecords = readLocalPyqImportRecords();
    setRecords(localRecords);
    setPersistence(defaultPersistenceState);

    try {
      const payload = await requestPyqPersistence();
      const nextPersistence = stateFromPersistencePayload(payload);

      if (payload.mode === "supabase" && Array.isArray(payload.records)) {
        let nextRecords = dedupePyqImportRecords([...payload.records, ...localRecords]);
        let nextState = {
          ...nextPersistence,
          savedCount: nextRecords.length,
        };

        if (localRecords.length > 0) {
          const syncPayload = await requestPyqPersistence(nextRecords);
          nextState = stateFromPersistencePayload(syncPayload);
          if (syncPayload.mode === "supabase" && Array.isArray(syncPayload.records)) {
            nextRecords = dedupePyqImportRecords(syncPayload.records);
          }
        }

        writeLocalPyqImportRecords(nextRecords);
        setRecords(nextRecords);
        setPersistence({
          ...nextState,
          savedCount: nextRecords.length,
        });
        return;
      }

      setPersistence({
        ...nextPersistence,
        savedCount: localRecords.length,
      });
    } catch (error) {
      setPersistence({
        mode: "unavailable",
        message:
          error instanceof Error
            ? `PYQ persistence check failed: ${error.message}. Browser-local staging remains available.`
            : "PYQ persistence check failed. Browser-local staging remains available.",
        savedCount: localRecords.length,
        checkedAt: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    void hydratePersistence();
  }, [hydratePersistence]);

  const summary = useMemo(() => summarizePyqImportLedger(records), [records]);
  const coverage = useMemo(() => buildPyqImportCoverage(records), [records]);
  const recentRecords = records.slice(0, 8);
  const seedPreview = seededPyqPatternRecords.slice(0, 6);

  function handleTemplateInsert() {
    setCsvInput(buildPyqImportCsvTemplate());
  }

  async function handleImport() {
    const parsedRows = parseCsv(csvInput);
    const result = buildPyqImportRecordsFromCsvRows(parsedRows);
    setLastResult(result);
    if (result.accepted.length > 0) {
      const nextLocalRecords = appendLocalPyqImportRecords(result.accepted);
      setRecords(nextLocalRecords);
      setIsSyncing(true);

      try {
        const payload = await requestPyqPersistence(nextLocalRecords);
        const nextPersistence = stateFromPersistencePayload(payload);
        if (payload.mode === "supabase" && Array.isArray(payload.records)) {
          const nextRecords = dedupePyqImportRecords(payload.records);
          writeLocalPyqImportRecords(nextRecords);
          setRecords(nextRecords);
          setPersistence({
            ...nextPersistence,
            savedCount: nextRecords.length,
          });
        } else {
          setPersistence({
            ...nextPersistence,
            savedCount: nextLocalRecords.length,
          });
        }
      } catch (error) {
        setPersistence({
          mode: "unavailable",
          message:
            error instanceof Error
              ? `PYQ server sync failed: ${error.message}. Accepted rows are still saved in this browser.`
              : "PYQ server sync failed. Accepted rows are still saved in this browser.",
          savedCount: nextLocalRecords.length,
          checkedAt: new Date().toISOString(),
        });
      } finally {
        setIsSyncing(false);
      }
    }
  }

  function handleClear() {
    clearLocalPyqImportRecords();
    setRecords([]);
    setLastResult(null);
    setPersistence((current) => ({
      ...current,
      savedCount: 0,
      message:
        current.mode === "supabase"
          ? "Browser staging was cleared. Supabase rows are retained; refresh sync to reload them."
          : current.message,
    }));
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

      <PersistencePanel
        persistence={persistence}
        isSyncing={isSyncing}
        onRefresh={() => {
          void hydratePersistence();
        }}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" data-testid="admin-pyq-import-summary">
        <Metric label="Exact rows" value={summary.importedQuestions} />
        <Metric label="Exact mapped" value={summary.mappedQuestions} />
        <Metric label="Needs review" value={summary.needsReview} />
        <Metric label="Seed patterns" value={summary.seededPatterns} />
        <Metric label="Seed subjects" value={summary.seededSubjects} />
        <Metric label="Optional rows" value={summary.optionalQuestions} />
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm" data-testid="admin-pyq-seed-pack">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl font-black text-emerald-950">Built-in PYQ pattern seed pack</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              These rows are mapped 2024 UPSC pattern scaffolds, not exact question text. They keep the source library
              useful while exact verified papers are imported separately.
            </p>
          </div>
          <div className="rounded-md border border-emerald-300 bg-white px-4 py-3 text-right">
            <p className="text-3xl font-black text-emerald-950">{summary.seededPatterns}</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Pattern seeds</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {seedPreview.map((record) => (
            <article key={record.id} className="rounded-md border border-emerald-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                <span>{record.year}</span>
                <span>{record.stage}</span>
                <span>{record.subjectTitle}</span>
                <span>Pattern seed</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{record.syllabusArea}</p>
            </article>
          ))}
        </div>
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
              disabled={!csvInput.trim() || isSyncing}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <Database className="h-4 w-4" /> {isSyncing ? "Syncing..." : "Validate and stage"}
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
              Strict coverage counts exact imported questions only. Pattern seeds are shown separately for planning.
            </p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-700">
            {coverage.length} GS subjects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Subject</th>
                <th className="py-3 pr-4">Source rows</th>
                <th className="py-3 pr-4">Exact rows</th>
                <th className="py-3 pr-4">Pattern seeds</th>
                <th className="py-3 pr-4">Mapped exact</th>
                <th className="py-3 pr-4">Review</th>
                <th className="py-3 pr-4">Trend boards</th>
                <th className="py-3 pr-4">Strict coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coverage.map((row) => (
                <tr key={row.slug} data-testid="admin-pyq-coverage-row" data-subject-slug={row.slug}>
                  <td className="py-3 pr-4 font-black text-zinc-950">{row.title}</td>
                  <td className="py-3 pr-4 text-zinc-600">{row.sourceRows}</td>
                  <td className="py-3 pr-4 text-zinc-600">{row.exactVerifiedQuestions}</td>
                  <td className="py-3 pr-4 text-emerald-700">{row.seededPatterns}</td>
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
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                    {record.textStatus.replace("_", " ")}
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

function PersistencePanel({
  persistence,
  isSyncing,
  onRefresh,
}: {
  persistence: PyqPersistenceState;
  isSyncing: boolean;
  onRefresh: () => void;
}) {
  const isSupabase = persistence.mode === "supabase";
  const isLocalOnly = persistence.mode === "local-only";
  const Icon = isSupabase ? Server : isLocalOnly ? CloudOff : RefreshCw;
  const title = isSupabase
    ? "Supabase persistence active"
    : isLocalOnly
      ? "Local staging active"
      : persistence.mode === "checking"
        ? "Checking persistence"
        : "Persistence needs attention";

  return (
    <section
      data-testid="admin-pyq-import-persistence"
      data-sync-mode={persistence.mode}
      className={`rounded-lg border p-5 shadow-sm ${
        isSupabase
          ? "border-emerald-200 bg-emerald-50"
          : isLocalOnly
            ? "border-amber-200 bg-amber-50"
            : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
              isSupabase
                ? "border-emerald-300 bg-white text-emerald-800"
                : isLocalOnly
                  ? "border-amber-300 bg-white text-amber-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
            }`}
          >
            <Icon className={`h-5 w-5 ${isSyncing || persistence.mode === "checking" ? "animate-spin" : ""}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-zinc-950">{title}</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-600">{persistence.message}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
              <span>{persistence.savedCount} exact rows visible</span>
              {persistence.table ? <span>{persistence.table}</span> : null}
              {persistence.checkedAt ? <span>checked {new Date(persistence.checkedAt).toLocaleTimeString()}</span> : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-black text-zinc-900 transition hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh sync
        </button>
      </div>
    </section>
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { CheckCircle2, CircleAlert, FileUp, ListChecks, Plus } from "lucide-react";

import { apiClient } from "@/services/api/client";
import { adminService, type Subject, type Test, type Topic } from "@/services/api/adminService";

type ImportRow = {
  row: number;
  outcome: "ready" | "created" | "duplicate" | "invalid";
  problems: string[];
  question_number: number | null;
  text: string;
};

type ImportReport = {
  dry_run: boolean;
  saved: boolean;
  total: number;
  ready: number;
  created: number;
  duplicates: number;
  invalid: number;
  topics_created: string[];
  rows: ImportRow[];
};

type Notice = { kind: "ok" | "error"; text: string };

const MAX_ROWS = 500;
const NEW_SUBJECT = "__new__";

const fieldClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none";
const labelClass = "block text-xs font-bold text-zinc-600";
const primaryButton =
  "inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

const outcomeLabel: Record<ImportRow["outcome"], string> = {
  ready: "Ready",
  created: "Saved",
  duplicate: "Already there",
  invalid: "Needs fixing",
};

const outcomeClass: Record<ImportRow["outcome"], string> = {
  ready: "bg-emerald-50 text-emerald-800 border-emerald-200",
  created: "bg-emerald-50 text-emerald-800 border-emerald-200",
  duplicate: "bg-amber-50 text-amber-800 border-amber-200",
  invalid: "bg-rose-50 text-rose-800 border-rose-200",
};

function NoticeLine({ notice }: { notice: Notice }) {
  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${
        notice.kind === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {notice.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
      {notice.text}
    </p>
  );
}

/**
 * Where an operator makes a test students can sit: create the test, upload its
 * questions from a spreadsheet, check the file, then save. The server checks
 * every row and skips questions the test already has, so uploading the same
 * file twice adds nothing.
 */
export function TestBuilder() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unreachable">("loading");

  const [subjectChoice, setSubjectChoice] = useState<string>("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [creating, setCreating] = useState(false);
  const [createNotice, setCreateNotice] = useState<Notice | null>(null);

  const [testId, setTestId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [topicChoice, setTopicChoice] = useState<string>("");
  const [createTopics, setCreateTopics] = useState(true);
  const [publish, setPublish] = useState(true);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [working, setWorking] = useState<"" | "checking" | "saving">("");
  const [uploadNotice, setUploadNotice] = useState<Notice | null>(null);

  const refresh = useCallback(
    () =>
      Promise.all([adminService.getSubjects(), adminService.getTopics(), adminService.getTests()])
        .then(([subjectList, topicList, testList]) => {
          setSubjects(subjectList);
          setTopics(topicList);
          setTests(testList);
          setLoadState("ready");
        })
        .catch(() => setLoadState("unreachable")),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedTest = useMemo(() => tests.find((test) => String(test.id) === testId) ?? null, [tests, testId]);
  const topicsForTest = useMemo(
    () => (selectedTest ? topics.filter((topic) => topic.subject_id === selectedTest.subject_id) : []),
    [selectedTest, topics],
  );
  const subjectName = (id: number) => subjects.find((subject) => subject.id === id)?.name ?? "Unknown subject";

  const createTest = async () => {
    const minutes = Number(duration);
    const cleanTitle = title.trim();
    const wantsNewSubject = subjectChoice === NEW_SUBJECT || subjects.length === 0;
    if (cleanTitle.length < 3) {
      setCreateNotice({ kind: "error", text: "Give the test a title of at least three letters." });
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1) {
      setCreateNotice({ kind: "error", text: "Duration must be a whole number of minutes." });
      return;
    }
    if (wantsNewSubject ? newSubjectName.trim().length < 2 : !subjectChoice) {
      setCreateNotice({ kind: "error", text: "Choose a subject, or name a new one." });
      return;
    }

    setCreating(true);
    setCreateNotice(null);
    try {
      let subjectId = Number(subjectChoice);
      if (wantsNewSubject) {
        const subject = await adminService.createSubject(newSubjectName.trim());
        subjectId = subject.id;
      }
      const created = await adminService.createTest({
        title: cleanTitle,
        description: "",
        subject_id: subjectId,
        duration_minutes: minutes,
      });
      await refresh();
      setTestId(String(created.id));
      setSubjectChoice(String(subjectId));
      setNewSubjectName("");
      setTitle("");
      setCreateNotice({ kind: "ok", text: `"${created.title}" is created. Add its questions below.` });
    } catch {
      setCreateNotice({ kind: "error", text: "The test could not be created. Nothing was saved." });
    } finally {
      setCreating(false);
    }
  };

  const readFile = (file: File | undefined) => {
    setReport(null);
    setUploadNotice(null);
    setRows([]);
    setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadNotice({ kind: "error", text: "Choose a CSV file. In Excel or Google Sheets, use Save as CSV." });
      return;
    }
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const parsed = result.data.filter((row) => row && typeof row === "object");
        if (parsed.length === 0) {
          setUploadNotice({ kind: "error", text: "That file has no question rows." });
          return;
        }
        if (parsed.length > MAX_ROWS) {
          setUploadNotice({
            kind: "error",
            text: `That file has ${parsed.length} questions. Upload at most ${MAX_ROWS} at a time.`,
          });
          return;
        }
        setRows(parsed);
        setFileName(file.name);
      },
      error: () => setUploadNotice({ kind: "error", text: "That file could not be read as CSV." }),
    });
  };

  const send = async (dryRun: boolean) => {
    if (!selectedTest || rows.length === 0) return;
    setWorking(dryRun ? "checking" : "saving");
    setUploadNotice(null);
    try {
      const response = await apiClient.post(
        "admin/questions/import",
        {
          test_id: selectedTest.id,
          questions: rows,
          dry_run: dryRun,
          default_topic_id: topicChoice ? Number(topicChoice) : null,
          publish,
          create_missing_topics: createTopics,
        },
        { timeout: 60_000 },
      );
      const data = response.data?.data as ImportReport;
      setReport(data);
      if (data.saved) {
        setUploadNotice({
          kind: "ok",
          text: publish
            ? `${data.created} questions saved. Students can take "${selectedTest.title}" now.`
            : `${data.created} questions saved as drafts. Students will not see them until they are published.`,
        });
        setRows([]);
        setFileName("");
        void refresh();
      } else if (!dryRun && data.invalid > 0) {
        setUploadNotice({ kind: "error", text: "Nothing was saved. Fix the rows marked below and upload again." });
      } else if (!dryRun) {
        setUploadNotice({ kind: "ok", text: "Nothing to save: every question in the file is already in this test." });
      }
    } catch {
      setUploadNotice({ kind: "error", text: "The upload could not be checked. Nothing was saved. Please try again." });
    } finally {
      setWorking("");
    }
  };

  const checked = report !== null && report.dry_run && rows.length > 0;
  const canSave = checked && report.invalid === 0 && report.ready > 0;
  const shownRows = report
    ? [...report.rows].sort((a, b) => Number(b.outcome === "invalid") - Number(a.outcome === "invalid")).slice(0, 200)
    : [];

  if (loadState === "loading") {
    return <p className="text-sm text-zinc-600">Loading tests…</p>;
  }
  if (loadState === "unreachable") {
    return (
      <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
        The server could not be reached, so tests cannot be shown or changed right now.
      </p>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-test-builder">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" aria-label="Create a test">
        <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
          <Plus className="h-5 w-5 text-emerald-700" />
          1. Create a test
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className={labelClass}>
            Subject
            <select
              className={`${fieldClass} mt-1`}
              value={subjects.length === 0 ? NEW_SUBJECT : subjectChoice}
              onChange={(event) => setSubjectChoice(event.target.value)}
            >
              {subjects.length > 0 && <option value="">Choose…</option>}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
              <option value={NEW_SUBJECT}>New subject…</option>
            </select>
          </label>
          {(subjectChoice === NEW_SUBJECT || subjects.length === 0) && (
            <label className={labelClass}>
              New subject name
              <input
                className={`${fieldClass} mt-1`}
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
                placeholder="Polity"
              />
            </label>
          )}
          <label className={labelClass}>
            Test title
            <input
              className={`${fieldClass} mt-1`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Polity sectional test 1"
            />
          </label>
          <label className={labelClass}>
            Duration in minutes
            <input
              className={`${fieldClass} mt-1`}
              inputMode="numeric"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Marking follows the UPSC pattern: 2 marks for a correct answer, 0.66 off for a wrong one.</p>
        <button type="button" className={`${primaryButton} mt-4`} onClick={createTest} disabled={creating}>
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "Create test"}
        </button>
        {createNotice && <NoticeLine notice={createNotice} />}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" aria-label="Add questions to a test">
        <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
          <FileUp className="h-5 w-5 text-emerald-700" />
          2. Add questions
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
          Upload a CSV with one question per row. Columns: text_en, A, B, C, D, correct, and optionally explanation_en,
          difficulty and topic. The file is checked first and nothing is saved until you press Save.{" "}
          <a className="font-bold underline" href="/templates/question_import_template.csv" download>
            Download the template
          </a>
          .
        </p>

        {tests.length === 0 ? (
          <p className="mt-4 text-sm font-bold text-zinc-700">Create a test above first.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className={labelClass}>
                Test
                <select
                  className={`${fieldClass} mt-1`}
                  value={testId}
                  onChange={(event) => {
                    setTestId(event.target.value);
                    setTopicChoice("");
                    setReport(null);
                  }}
                >
                  <option value="">Choose…</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title} ({subjectName(test.subject_id)})
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Topic for rows that name none
                <select
                  className={`${fieldClass} mt-1`}
                  value={topicChoice}
                  onChange={(event) => {
                    setTopicChoice(event.target.value);
                    setReport(null);
                  }}
                  disabled={!selectedTest}
                >
                  <option value="">None</option>
                  {topicsForTest.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Questions file (CSV)
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:h-10 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:text-sm file:font-bold"
                  onChange={(event) => readFile(event.target.files?.[0])}
                  disabled={!selectedTest}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-800">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createTopics}
                  onChange={(event) => {
                    setCreateTopics(event.target.checked);
                    setReport(null);
                  }}
                />
                Create topics named in the file if they do not exist
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
                Publish so students can take the test
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => send(true)}
                disabled={!selectedTest || rows.length === 0 || working !== ""}
              >
                <ListChecks className="h-4 w-4" />
                {working === "checking" ? "Checking…" : "Check file"}
              </button>
              <button type="button" className={primaryButton} onClick={() => send(false)} disabled={!canSave || working !== ""}>
                <CheckCircle2 className="h-4 w-4" />
                {working === "saving" ? "Saving…" : canSave ? `Save ${report.ready} questions` : "Save questions"}
              </button>
              {fileName && <span className="text-sm text-zinc-600">{fileName}: {rows.length} rows</span>}
            </div>
          </>
        )}

        {uploadNotice && <NoticeLine notice={uploadNotice} />}

        {report && (
          <div className="mt-5" data-testid="admin-import-report">
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [report.saved ? "Saved" : "Ready to save", report.saved ? report.created : report.ready],
                ["Already in the test", report.duplicates],
                ["Need fixing", report.invalid],
                ["Rows in the file", report.total],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <dt className="text-xs font-bold text-zinc-500">{label}</dt>
                  <dd className="mt-1 text-xl font-black text-zinc-950">{value}</dd>
                </div>
              ))}
            </dl>
            {report.topics_created.length > 0 && (
              <p className="mt-3 text-sm text-zinc-700">
                {report.saved ? "New topics created: " : "New topics that will be created: "}
                {report.topics_created.join(", ")}
              </p>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs font-bold text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3">Row</th>
                    <th className="py-2 pr-3">Result</th>
                    <th className="py-2 pr-3">Question</th>
                    <th className="py-2">What to fix</th>
                  </tr>
                </thead>
                <tbody>
                  {shownRows.map((row) => (
                    <tr key={row.row} className="border-t border-zinc-200 align-top">
                      <td className="py-2 pr-3 font-bold text-zinc-950">{row.row}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-block rounded border px-2 py-0.5 text-xs font-bold ${outcomeClass[row.outcome]}`}>
                          {outcomeLabel[row.outcome]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-700">{row.text || "(no text)"}</td>
                      <td className="py-2 text-zinc-700">{row.problems.join(" ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.rows.length > shownRows.length && (
                <p className="mt-2 text-xs text-zinc-500">Showing the first {shownRows.length} rows, with rows that need fixing first.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" aria-label="Existing tests">
        <h2 className="text-xl font-black text-zinc-950">Tests</h2>
        {tests.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No tests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200">
            {tests.map((test) => (
              <li key={test.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-bold text-zinc-950">{test.title}</span>
                <span className="text-zinc-600">
                  {subjectName(test.subject_id)} · {test.duration_minutes} minutes
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

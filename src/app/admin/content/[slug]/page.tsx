"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, RefreshCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  gsLmsService,
  type ContentCheckResult,
  type ContentImportLog,
  type ContentSubjectDetail,
  type ContentTopicReadiness,
} from "@/services/api/gsLmsService";

const SECTION_NAMES: Record<string, string> = {
  BASIC: "Basic",
  NCERT_LEVEL: "NCERT level",
  ADVANCED: "Advanced",
  CURRENT_AFFAIRS: "Current affairs",
  EXAMINER_TRAPS: "Examiner traps",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/** Plain-words message from a failed API call. */
function errorText(err: unknown, fallback: string): { message: string; details: string[] } {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string") return { message: detail, details: [] };
  if (detail && typeof detail === "object") {
    const d = detail as { message?: string; errors?: string[] };
    return { message: d.message || fallback, details: d.errors ?? [] };
  }
  return { message: fallback, details: [] };
}

function Chip({ approved }: { approved: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        approved
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      }`}
    >
      {approved ? "Approved" : "Draft"}
    </span>
  );
}

export default function AdminContentSubjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<ContentSubjectDetail | null>(null);
  const [imports, setImports] = useState<ContentImportLog[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | "download" | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<ContentCheckResult | null>(null);
  const [derive, setDerive] = useState(false);
  const [uploadBusy, setUploadBusy] = useState<"check" | "import" | null>(null);
  const [uploadError, setUploadError] = useState<{ message: string; details: string[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [d, i] = await Promise.all([gsLmsService.getContentSubject(slug), gsLmsService.listContentImports(slug)]);
      setDetail(d);
      setImports(i);
      setError("");
    } catch {
      setError("Couldn't load this subject. Check that you're signed in as an admin.");
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const out: { key: string; parentId: number | null; label: string; topics: ContentTopicReadiness[] }[] = [];
    for (const t of detail?.topics ?? []) {
      const key = String(t.parent_id);
      let g = out.find((x) => x.key === key);
      if (!g) {
        g = {
          key,
          parentId: t.parent_id,
          label: [t.mega_title, t.sub_title].filter(Boolean).join(" › ") || "Topics",
          topics: [],
        };
        out.push(g);
      }
      g.topics.push(t);
    }
    return out;
  }, [detail]);

  const review = async (
    nodeId: number,
    status: "REVIEWED" | "UNREVIEWED",
    kind: "topic" | "group",
    question: string,
  ) => {
    if (!window.confirm(question)) return;
    setBusy(nodeId);
    setError("");
    setNotice("");
    try {
      const res = await gsLmsService.reviewContent(nodeId, status, kind);
      const skipped = res.skipped_not_ready.length;
      setNotice(
        `${status === "REVIEWED" ? "Approved" : "Moved back to draft:"} ${res.topics} topic${res.topics === 1 ? "" : "s"}.` +
          (skipped ? ` ${skipped} not approved because they still have things to write.` : ""),
      );
      await load();
    } catch (err) {
      setError(errorText(err, "Couldn't save that change. Please try again.").message);
    } finally {
      setBusy(null);
    }
  };

  const downloadWorklist = async () => {
    setBusy("download");
    setError("");
    try {
      const blob = await gsLmsService.downloadContentWorklist(slug);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-worklist.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download the worklist. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const chooseFile = (f: File | null) => {
    setFile(f);
    setCheck(null);
    setUploadError(null);
    setNotice("");
  };

  const runCheck = async () => {
    if (!file) return;
    setUploadBusy("check");
    setUploadError(null);
    setCheck(null);
    try {
      setCheck(await gsLmsService.checkContentFile(file));
    } catch (err) {
      setUploadError(errorText(err, "Couldn't check that file."));
    } finally {
      setUploadBusy(null);
    }
  };

  const runImport = async () => {
    if (!file || !check?.ok_to_import) return;
    if (
      check.approved_topics_now > 0 &&
      !window.confirm(
        `${check.approved_topics_now} topic(s) are approved now. Anything you changed in this file goes back to draft and needs approving again; unchanged content stays approved. Continue?`,
      )
    ) {
      return;
    }
    setUploadBusy("import");
    setUploadError(null);
    try {
      const res = await gsLmsService.importContentFile(file, derive);
      chooseFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice(
        `Imported as draft (${res.result.mcqs_created ?? 0} new MCQs, ${res.result.mcqs_updated ?? 0} updated). ` +
          "Approve the topics below when you are happy with them.",
      );
      await load();
    } catch (err) {
      setUploadError(errorText(err, "The import failed. Nothing was changed."));
    } finally {
      setUploadBusy(null);
    }
  };

  const subject = detail?.subject;

  return (
    <div data-testid="admin-content-subject-page" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/admin/content" className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            <ArrowLeft className="h-4 w-4" /> All subjects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{subject?.name ?? slug}</h1>
          {subject ? (
            <p className="text-muted-foreground">
              {subject.topics_ready} of {subject.topics} topics fully written · {subject.topics_reviewed} approved ·{" "}
              {subject.mcqs_reviewed} of {subject.mcqs} MCQs approved · {subject.concepts} concepts · {subject.pyqs} PYQs
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={downloadWorklist} disabled={busy === "download"}>
            <Download className="mr-2 h-4 w-4" /> Download worklist (CSV)
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </p>
      ) : null}

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-lg font-bold">Upload a content file</h2>
          <p className="text-sm text-muted-foreground">
            Choose the subject&apos;s .json file and check it first. Nothing is saved until you import, and imported
            content stays a draft until you approve it below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Content file"
            onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Button onClick={runCheck} disabled={!file || uploadBusy !== null}>
            {uploadBusy === "check" ? "Checking…" : "Check file"}
          </Button>
        </div>

        {uploadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">{uploadError.message}</p>
            {uploadError.details.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {uploadError.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {check ? (
          <div data-testid="content-check-result" className="space-y-3 text-sm">
            <p className="font-semibold">
              {check.errors.length
                ? `${check.errors.length} problem${check.errors.length === 1 ? "" : "s"} to fix before this file can be imported.`
                : check.ready
                  ? "The file is complete and can be imported."
                  : `The file can be imported. ${check.gaps.length} thing${check.gaps.length === 1 ? " is" : "s are"} still missing, so some topics will not be ready yet.`}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {String(check.summary.topics_ready)} of {String(check.summary.topics)} topics ready ·{" "}
              {String(check.summary.mcqs)} MCQs · {String(check.summary.concepts)} concepts ·{" "}
              {String(check.summary.pyqs)} PYQs
            </p>
            {check.errors.length ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
                <p className="font-semibold">Fix these (the file cannot be imported):</p>
                <ul className="mt-1 max-h-64 list-disc space-y-1 overflow-y-auto pl-5">
                  {check.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {check.gaps.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-semibold">Still to write (does not stop the import):</p>
                <ul className="mt-1 max-h-64 list-disc space-y-1 overflow-y-auto pl-5">
                  {check.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {check.approved_topics_now > 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                {check.approved_topics_now} topic(s) are approved now. Anything changed in this file goes back
                to draft; unchanged content stays approved.
              </p>
            ) : null}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={derive} onChange={(e) => setDerive(e.target.checked)} />
              <span>Create concepts from the topic checklist where a topic has none</span>
            </label>
            <Button onClick={runImport} disabled={!check.ok_to_import || uploadBusy !== null}>
              <Upload className="mr-2 h-4 w-4" /> {uploadBusy === "import" ? "Importing…" : "Import as draft"}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Topics</h2>
        {groups.map((g) => (
          <div
            key={g.key}
            className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold">{g.label}</p>
              {g.parentId !== null ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === g.parentId}
                    onClick={() =>
                      review(
                        g.parentId as number,
                        "REVIEWED",
                        "group",
                        `Approve every topic under "${g.label}" that is fully written? Students will be able to see them.`,
                      )
                    }
                  >
                    Approve all ready
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === g.parentId}
                    onClick={() =>
                      review(
                        g.parentId as number,
                        "UNREVIEWED",
                        "group",
                        `Move every topic under "${g.label}" back to draft? Students will stop seeing them.`,
                      )
                    }
                  >
                    Unapprove all
                  </Button>
                </div>
              ) : null}
            </div>
            <table className="w-full min-w-[960px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3">Topic</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Missing sections</th>
                  <th className="p-3">MCQs</th>
                  <th className="p-3">PYQs</th>
                  <th className="p-3">Concepts</th>
                  <th className="p-3">Next to write</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {g.topics.map((t) => {
                  const approved = t.review_status === "REVIEWED";
                  return (
                    <tr key={t.node_id} data-testid="content-topic-row" className="border-t border-zinc-100 align-top dark:border-zinc-800">
                      <td className="p-3 font-semibold">{t.title}</td>
                      <td className="p-3">
                        <Chip approved={approved} />
                      </td>
                      <td className="p-3">
                        {t.sections_missing.length ? t.sections_missing.map((s) => SECTION_NAMES[s] ?? s).join(", ") : "None"}
                      </td>
                      <td className="p-3 tabular-nums">
                        {t.mcqs}/{t.mcqs_needed}
                        <span className="block text-xs text-zinc-500">{t.mcqs_reviewed} approved</span>
                      </td>
                      <td className="p-3 tabular-nums">{t.pyqs}</td>
                      <td className="p-3 tabular-nums">
                        {t.concepts}
                        <span className="block text-xs text-zinc-500">
                          {t.versions} version{t.versions === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="p-3">
                        {t.next_to_write.length ? (
                          <ul className="list-disc space-y-0.5 pl-4">
                            {t.next_to_write.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">Nothing, ready to approve</span>
                        )}
                      </td>
                      <td className="p-3">
                        {approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === t.node_id}
                            onClick={() =>
                              review(t.node_id, "UNREVIEWED", "topic", `Unapprove "${t.title}"? Students will stop seeing it.`)
                            }
                          >
                            Unapprove
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busy === t.node_id}
                            onClick={() =>
                              review(
                                t.node_id,
                                "REVIEWED",
                                "topic",
                                t.content_ready
                                  ? `Approve "${t.title}"? Students will be able to see it.`
                                  : `"${t.title}" still has things to write:\n\n${t.next_to_write.join("\n")}\n\nApprove it anyway?`,
                              )
                            }
                          >
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {detail && detail.topics.length === 0 && !error ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            No topics yet. Upload this subject&apos;s content file above to get started.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Recent uploads</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">File</th>
                <th className="p-3">By</th>
                <th className="p-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((row) => (
                <tr key={row.id} data-testid="content-import-row" className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatDate(row.created_at)}</td>
                  <td className="p-3">{row.filename}</td>
                  <td className="p-3">{row.uploaded_by_name ?? "—"}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {row.summary
                      ? `${String(row.summary.topics_ready)} of ${String(row.summary.topics)} topics ready, ${String(row.summary.mcqs)} MCQs`
                      : "—"}
                  </td>
                </tr>
              ))}
              {imports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-zinc-500">
                    No uploads yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

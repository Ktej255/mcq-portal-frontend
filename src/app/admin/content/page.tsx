"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gsLmsService, type ContentSubjectReadiness } from "@/services/api/gsLmsService";

function Bar({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="min-w-[140px]">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs tabular-nums text-zinc-500">
        {value} of {total}
      </p>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContentStudioPage() {
  const [rows, setRows] = useState<ContentSubjectReadiness[]>([]);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const loading = loadedKey !== reloadKey;

  useEffect(() => {
    let cancelled = false;
    gsLmsService
      .getContentSubjects()
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the subjects. Check that you're signed in as an admin.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(reloadKey);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div data-testid="admin-content-studio-page" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
            Content
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Content studio</h1>
          <p className="text-muted-foreground">
            What is live for each subject, what is still to write, and what is waiting for your approval.
            Open a subject to upload a file and approve topics.
          </p>
        </div>
        <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Topics written</th>
              <th className="p-3">Topics approved</th>
              <th className="p-3">MCQs approved</th>
              <th className="p-3">Concepts</th>
              <th className="p-3">Versions</th>
              <th className="p-3">PYQs</th>
              <th className="p-3">Last upload</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} data-testid="content-subject-row" className="border-t border-zinc-100 align-top dark:border-zinc-800">
                <td className="p-3">
                  <Link href={`/admin/content/${row.slug}`} className="font-semibold underline-offset-2 hover:underline">
                    {row.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{row.slug}</p>
                  {row.exam_name ? (
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px] font-bold uppercase tracking-widest"
                      title={row.rules ? `A topic needs ${row.rules.required_sections.length} sections, ${row.rules.mcqs_per_topic} MCQs and a PYQ (${row.rules.pyq_exam_types.join(" or ")})` : undefined}
                    >
                      {row.exam_name}
                    </Badge>
                  ) : null}
                </td>
                <td className="p-3">
                  <Bar value={row.topics_ready} total={row.topics} label={`${row.name} topics fully written`} />
                </td>
                <td className="p-3">
                  <Bar value={row.topics_reviewed} total={row.topics} label={`${row.name} topics approved`} />
                </td>
                <td className="p-3">
                  <Bar value={row.mcqs_reviewed} total={row.mcqs} label={`${row.name} MCQs approved`} />
                </td>
                <td className="p-3 tabular-nums">{row.concepts}</td>
                <td className="p-3 tabular-nums">{row.versions}</td>
                <td className="p-3 tabular-nums">{row.pyqs}</td>
                <td className="p-3 text-xs text-zinc-600 dark:text-zinc-400">
                  {row.last_import
                    ? [formatDate(row.last_import.at), row.last_import.filename, row.last_import.source === "command_line" ? "command line" : ""]
                        .filter(Boolean)
                        .join(" · ") || "Imported"
                    : "Nothing uploaded yet"}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && !error ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No subjects are set up yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

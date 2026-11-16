"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  gsLmsService,
  type ContentRequest,
  type ContentRequestStatus,
} from "@/services/api/gsLmsService";

const STATUSES: ContentRequestStatus[] = ["OPEN", "PLANNED", "ADDRESSED"];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContentRequestsPage() {
  const [filter, setFilter] = useState<ContentRequestStatus | "">("");
  const [rows, setRows] = useState<ContentRequest[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // Note drafts by request id, so typing does not rewrite the saved rows.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const requestKey = `${filter}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    gsLmsService
      .listContentRequests(filter || undefined)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setDrafts({});
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load content requests. Check that you're signed in as an admin.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, requestKey]);

  const patch = async (row: ContentRequest, change: { status?: ContentRequestStatus; note?: string | null }) => {
    setSaving(row.id);
    setError("");
    try {
      const updated = await gsLmsService.updateContentRequest(row.id, change);
      setRows((current) => current.map((r) => (r.id === updated.id ? updated : r)));
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
    } catch {
      setError("Couldn't save that change. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div data-testid="admin-content-requests-page" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
            Content
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Content requests</h1>
          <p className="text-muted-foreground">
            What students searched for that the study screen could not answer, most-asked first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Status</span>
            <select
              aria-label="Filter by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as ContentRequestStatus | "")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="p-3">Query</th>
              <th className="p-3">Students</th>
              <th className="p-3">Requests</th>
              <th className="p-3">Subject</th>
              <th className="p-3">First</th>
              <th className="p-3">Last</th>
              <th className="p-3">Status</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draft = drafts[row.id];
              const noteValue = draft ?? row.note ?? "";
              const dirty = draft !== undefined && draft !== (row.note ?? "");
              return (
                <tr key={row.id} data-testid="content-request-row" className="border-t border-zinc-100 align-top dark:border-zinc-800">
                  <td className="p-3 font-semibold">{row.sample_query}</td>
                  <td className="p-3 tabular-nums">{row.distinct_students}</td>
                  <td className="p-3 tabular-nums">{row.request_count}</td>
                  <td className="p-3">{row.subject_slug || "—"}</td>
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatDate(row.first_requested_at)}</td>
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatDate(row.last_requested_at)}</td>
                  <td className="p-3">
                    <select
                      aria-label={`Status for ${row.sample_query}`}
                      value={row.status}
                      disabled={saving === row.id}
                      onChange={(e) => patch(row, { status: e.target.value as ContentRequestStatus })}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <textarea
                        aria-label={`Note for ${row.sample_query}`}
                        rows={2}
                        value={noteValue}
                        onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                        className="min-w-[200px] flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!dirty || saving === row.id}
                        onClick={() => patch(row, { note: noteValue.trim() || null })}
                      >
                        Save
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && !error ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  {filter ? `No ${filter.toLowerCase()} requests.` : "No requests yet. They appear when a student searches for something we don't have."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

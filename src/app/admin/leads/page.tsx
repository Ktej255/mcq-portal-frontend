"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { apiClient } from "@/services/api/client";

type Lead = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  source: string;
  answers: Record<string, unknown> | null;
  created_at: string;
};

const PAGE_SIZE = 50;

function answer(lead: Lead, key: string) {
  const value = lead.answers?.[key];
  if (Array.isArray(value)) return value.join(", ");
  return value ? String(value) : "—";
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`leads?page=${page}&page_size=${PAGE_SIZE}`)
      .then((res) => {
        if (cancelled) return;
        setLeads(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load leads. Check that you're signed in as an admin and the backend is reachable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const goTo = (target: number) => {
    setLoading(true);
    setPage(target);
  };

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div data-testid="admin-leads-page" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
            Marketing
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            People who finished the free diagnostic. {total} saved, newest first.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3">Attempt</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Hours/day</th>
              <th className="p-3">Optional</th>
              <th className="p-3">Focus</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                <td className="whitespace-nowrap p-3 tabular-nums">
                  {new Date(lead.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="p-3 font-semibold">{lead.name || "—"}</td>
                <td className="p-3">{lead.email}</td>
                <td className="p-3 tabular-nums">{lead.phone || "—"}</td>
                <td className="p-3">{answer(lead, "year")}</td>
                <td className="p-3">{answer(lead, "stage")}</td>
                <td className="p-3">{answer(lead, "hours")}</td>
                <td className="p-3">{answer(lead, "optional")}</td>
                <td className="p-3">{answer(lead, "subjects")}</td>
              </tr>
            ))}
            {!loading && leads.length === 0 && !error ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500">
                  No leads yet. They appear here when someone finishes the diagnostic on the home page.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {pages > 1 ? (
        <div className="flex items-center justify-end gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => goTo(page - 1)}>
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => goTo(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

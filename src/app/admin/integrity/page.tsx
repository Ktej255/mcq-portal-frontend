"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Fingerprint, ShieldCheck } from "lucide-react";

const integrityEvents = [
  {
    label: "Local auth bypass",
    detail: "Admin console allows localhost mock sessions for offline verification.",
    status: "EXPECTED",
  },
  {
    label: "MCQ draft bank",
    detail: "Bulk upload can save UPSC imports to browser storage when API is unavailable.",
    status: "ACTIVE",
  },
  {
    label: "Backend sync",
    detail: "Cloud API is currently offline for this local testing pass.",
    status: "OFFLINE",
  },
];

export default function AdminIntegrityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
            Governance
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Integrity Logs</h1>
          <p className="text-muted-foreground">Local audit trail for access, imports, and offline fallback behavior.</p>
        </div>
        <Button className="h-11 rounded-xl font-bold">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Local Audit Healthy
        </Button>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-50">
          <Fingerprint className="mb-4 h-6 w-6" />
          <p className="text-sm font-bold uppercase tracking-widest opacity-70">Verified Sessions</p>
          <p className="mt-2 text-3xl font-black">Local</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-50">
          <AlertTriangle className="mb-4 h-6 w-6" />
          <p className="text-sm font-bold uppercase tracking-widest opacity-70">Cloud Dependency</p>
          <p className="mt-2 text-3xl font-black">Offline</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-50">
          <Eye className="mb-4 h-6 w-6" />
          <p className="text-sm font-bold uppercase tracking-widest opacity-70">Import Watch</p>
          <p className="mt-2 text-3xl font-black">Enabled</p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-black">Recent Integrity Events</h2>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {integrityEvents.map((event) => (
            <div key={event.label} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold">{event.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
              </div>
              <Badge variant={event.status === "OFFLINE" ? "outline" : "secondary"} className="w-fit font-bold">
                {event.status}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Database, Lock, Shield, SlidersHorizontal } from "lucide-react";

const settingGroups = [
  {
    title: "Local Access",
    description: "Testing mode keeps the portal usable while Firebase and backend services are offline.",
    icon: Lock,
    status: "Local bypass active",
  },
  {
    title: "UPSC Workspace",
    description: "Daily launcher, subject rooms, MCQ command, and readiness audit share local progress state.",
    icon: SlidersHorizontal,
    status: "Connected",
  },
  {
    title: "Draft Storage",
    description: "Offline MCQ imports are preserved in the browser draft bank until the backend is available.",
    icon: Database,
    status: "Browser local",
  },
  {
    title: "Notifications",
    description: "Local reminders and progress nudges are staged for the classroom workflow.",
    icon: Bell,
    status: "Planned",
  },
];

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:p-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
                Portal Settings
              </Badge>
              <h1 className="text-3xl font-black tracking-tight">Institutional Preferences</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Local controls for the UPSC portal while the cloud stack is offline.
              </p>
            </div>
            <Button className="h-11 rounded-xl font-bold">
              <Shield className="mr-2 h-4 w-4" />
              Local Safe Mode
            </Button>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {settingGroups.map((item) => (
              <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-black">{item.title}</h2>
                      <Badge variant="secondary" className="mt-1 text-[10px] font-bold uppercase tracking-wider">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

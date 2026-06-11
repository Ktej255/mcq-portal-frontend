import { SignUp } from "@clerk/nextjs";

import { clerkConfigReady, missingClerkEnvVars } from "@/env";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 md:grid-cols-[1fr_0.9fr] md:px-8">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
              <span className="text-sm font-black">U</span>
            </div>
            <p className="text-xl font-black uppercase italic tracking-tight">UPSC Command</p>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Student access</p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
              Create your learning workspace.
            </h1>
            <p className="max-w-xl text-base font-semibold leading-7 text-[#5d675f]">
              Clerk creates the account. UPSC Command then keeps the learning path simple: today&apos;s task, gap,
              revision timing, and progress.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {["One account", "Recoverable sessions", "Cleaner auth", "Student-first dashboard"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1d9e75]" />
                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Sign up</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Start UPSC Command</h2>
          <div className="mt-6">
            {clerkConfigReady ? (
              <div className="[&_.cl-card]:w-full [&_.cl-card]:shadow-none">
                <SignUp routing="hash" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
              </div>
            ) : (
              <div className="rounded-lg border border-[#ef9f27]/50 bg-[#fff8e8] p-4 text-[#6f4a12]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">Clerk needs configuration</p>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      Missing {missingClerkEnvVars.join(", ")}. Add the Clerk publishable key locally and in Vercel.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

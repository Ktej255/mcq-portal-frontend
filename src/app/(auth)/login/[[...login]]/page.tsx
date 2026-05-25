"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenCheck, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { env } from "@/env";

const authDebug = env.NEXT_PUBLIC_DEBUG_API === "true";
const previewLoginEnabled = env.NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN !== "false";
const studentPreviewRoutes = ["/dashboard", "/upsc", "/reports", "/revision", "/history", "/tests"];

const isStudentPreviewRoute = (path: string) => {
  return studentPreviewRoutes.some((route) => path === route || path.startsWith(`${route}/`));
};

export default function LoginPage() {
  const { signInWithGoogle, devLogin, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocalTestingHost = ["localhost", "127.0.0.1"].includes(hostname);
    const isVercelStudentHost =
      hostname === "upsc-command.vercel.app" ||
      hostname.endsWith("-ktej255-gmailcoms-projects.vercel.app");

    setPreviewMode(
      (isLocalTestingHost || (previewLoginEnabled && isVercelStudentHost)) &&
        isStudentPreviewRoute(redirectPath)
    );
  }, [redirectPath]);

  useEffect(() => {
    if (previewMode && !authLoading && !user) {
      devLogin("student-preview@upsc.local", "student-preview", redirectPath);
    }
  }, [previewMode, authLoading, user, devLogin, redirectPath]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && token.startsWith("MOCK_TOKEN") && !authLoading && !user) {
      if (authDebug) console.info("AUTH | AUTO_LOGIN | MOCK_TOKEN detected");

      let email = "student-preview@upsc.local";
      let uid = "student-preview";

      if (token.includes("_sim_")) {
        const persona = token.split("_sim_")[1];
        email = `${persona.replace(/_/g, "")}@upsc.local`;
        uid = `mock-uid-${persona}`;
      }

      localStorage.setItem("MOCK_TOKEN", token);
      devLogin(email, uid, redirectPath);
    }
  }, [searchParams, devLogin, authLoading, user, redirectPath]);

  if (previewMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] px-4 text-[#13251d]">
        <div className="w-full max-w-md rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Student Preview</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Opening your study cockpit</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
            For this testing phase, Google login is bypassed and the student dashboard opens directly.
          </p>
        </div>
      </main>
    );
  }

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
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">June Geography Batch</p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
              Study one clear task at a time.
            </h1>
            <p className="max-w-xl text-base font-semibold leading-7 text-[#5d675f]">
              Your dashboard focuses on today&apos;s task, learning gaps, revision timing, and progress. Everything else
              stays behind the scenes until it is useful.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {["Today's task first", "Gap after practice", "Revision at the right time", "Progress without noise"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <span className="text-sm font-bold">{item}</span>
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Login</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Continue to UPSC Command</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
            Google login will be used for real student accounts. During beta preview, public study routes can open
            directly for testing.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="h-12 w-full rounded-md bg-[#1a3a2a] text-sm font-black text-white hover:bg-[#10291d]"
            >
              Connect with Google <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => devLogin("student-preview@upsc.local", "student-preview", redirectPath)}
              className="h-12 w-full rounded-md border-[#cfc6b6] bg-white text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
            >
              Continue as Student Preview
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

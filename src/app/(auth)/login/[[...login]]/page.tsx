"use client";

import { type FormEvent, useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/AuthContext";
import { activeAuthProvider, clerkConfigReady, env, missingClerkEnvVars } from "@/env";
import { canUsePreviewAuth, isLocalTestingHost, unlockAuthFallback } from "@/lib/auth/local-testing";
import { PRIMARY_MASTER_EMAIL } from "@/lib/auth/master-access";

const authDebug = env.NEXT_PUBLIC_DEBUG_API === "true";
const studentPreviewRoutes = ["/dashboard", "/upsc", "/reports", "/revision", "/history", "/tests"];

const isStudentPreviewRoute = (path: string) => {
  return studentPreviewRoutes.some((route) => path === route || path.startsWith(`${route}/`));
};

function safeRedirectPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export default function LoginPage() {
  const { signInWithGoogle, sendEmailOtp, verifyEmailOtp, devLogin, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get("redirect") || "/dashboard");
  const masterPreviewRequested = searchParams.get("master") === "1";
  const [previewMode, setPreviewMode] = useState(false);
  const [localTestingHost, setLocalTestingHost] = useState(false);
  const [googleChecking, setGoogleChecking] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [authIssue, setAuthIssue] = useState("");
  const [fallbackAvailable, setFallbackAvailable] = useState(false);

  useEffect(() => {
    const isLocalHost = isLocalTestingHost();
    setLocalTestingHost(isLocalHost);
    setPreviewMode(isLocalHost && !masterPreviewRequested && isStudentPreviewRoute(redirectPath));
    setFallbackAvailable(canUsePreviewAuth());
  }, [masterPreviewRequested, redirectPath]);

  useEffect(() => {
    if (masterPreviewRequested && isLocalTestingHost() && !user) {
      unlockAuthFallback();
      setFallbackAvailable(true);
      devLogin(PRIMARY_MASTER_EMAIL, "local-master-ktej255", redirectPath);
    }
  }, [masterPreviewRequested, user, devLogin, redirectPath]);

  useEffect(() => {
    if (previewMode && !user) {
      devLogin("student-preview@upsc.local", "student-preview", redirectPath);
    }
  }, [previewMode, user, devLogin, redirectPath]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (isLocalTestingHost() && token && token.startsWith("MOCK_TOKEN") && !authLoading && !user) {
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

  const handlePreviewLogin = () => {
    unlockAuthFallback();
    setFallbackAvailable(true);
    devLogin("student-preview@upsc.local", "student-preview", redirectPath);
  };

  const handleMasterPreviewLogin = () => {
    unlockAuthFallback();
    setFallbackAvailable(true);
    devLogin(PRIMARY_MASTER_EMAIL, "local-master-ktej255", redirectPath);
  };

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthIssue("");
    setEmailNotice("");
    setEmailSending(true);

    try {
      await sendEmailOtp(email.trim(), redirectPath);
      setEmailNotice("Check your email for the login link. If you received a code, enter it below.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email login could not start right now.";
      setAuthIssue(message);
    } finally {
      setEmailSending(false);
    }
  };

  const handleOtpVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthIssue("");
    setOtpVerifying(true);

    try {
      await verifyEmailOtp(email.trim(), otpCode.trim(), redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "This code could not be verified.";
      setAuthIssue(message);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthIssue("");
    setGoogleChecking(true);

    try {
      await signInWithGoogle(redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google login could not start right now.";
      unlockAuthFallback();
      setFallbackAvailable(true);
      setAuthIssue(message);
    } finally {
      setGoogleChecking(false);
    }
  };

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

  if (activeAuthProvider === "clerk") {
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
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Clerk secure login</p>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
                Open your study workspace cleanly.
              </h1>
              <p className="max-w-xl text-base font-semibold leading-7 text-[#5d675f]">
                Clerk now handles student identity, email login, Google login, and session recovery. The learning
                dashboard stays focused on today&apos;s task, gaps, revision timing, and progress.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {["Stable session", "Email and Google login", "Cleaner recovery", "No Supabase auth dependency"].map(
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
              Use the Clerk sign-in box below. It can be configured for email code, magic link, Google, or both from
              the Clerk dashboard.
            </p>

            <div className="mt-6">
              {clerkConfigReady ? (
                <div className="[&_.cl-card]:w-full [&_.cl-card]:shadow-none">
                  <SignIn
                    routing="hash"
                    fallbackRedirectUrl={redirectPath}
                    forceRedirectUrl={redirectPath}
                    signUpFallbackRedirectUrl={redirectPath}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-[#ef9f27]/50 bg-[#fff8e8] p-4 text-[#6f4a12]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Clerk needs configuration</p>
                      <p className="mt-1 text-sm font-semibold leading-6">
                        Missing {missingClerkEnvVars.join(", ")}. Add the Clerk publishable key locally and in Vercel,
                        then set NEXT_PUBLIC_AUTH_PROVIDER=clerk.
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
            {localTestingHost
              ? "Email login is the primary student path. Local study routes can still open directly for testing."
              : "Enter your email to receive a secure login link and open your personal study workspace."}
          </p>

          <div className="mt-6 space-y-3">
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]" htmlFor="login-email">
                Email login
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d675f]" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="student@example.com"
                  className="h-12 rounded-md border-[#cfc6b6] bg-white pl-10 text-sm font-bold text-[#13251d]"
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                disabled={authLoading || emailSending || !email.trim()}
                className="h-12 w-full rounded-md bg-[#1a3a2a] text-sm font-black text-white hover:bg-[#10291d]"
              >
                {emailSending ? "Sending login link..." : "Send email login link"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {emailNotice ? (
              <div className="rounded-lg border border-[#1d9e75]/30 bg-[#eefaf4] p-4 text-sm font-bold leading-6 text-[#164633]">
                {emailNotice}
              </div>
            ) : null}

            {emailNotice ? (
              <form onSubmit={handleOtpVerify} className="space-y-3 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#5d675f]" htmlFor="login-code">
                  Optional OTP code
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d675f]" />
                  <Input
                    id="login-code"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    placeholder="6-digit code"
                    className="h-12 rounded-md border-[#cfc6b6] bg-white pl-10 text-sm font-bold text-[#13251d]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={authLoading || otpVerifying || !email.trim() || !otpCode.trim()}
                  className="h-11 w-full rounded-md border-[#cfc6b6] bg-white text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
                >
                  {otpVerifying ? "Verifying code..." : "Verify code"}
                </Button>
              </form>
            ) : null}

            {authIssue ? (
              <div className="rounded-lg border border-[#ef9f27]/50 bg-[#fff8e8] p-4 text-[#6f4a12]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">Login needs attention</p>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      {authIssue} Use Student Preview to continue testing if the live auth service is being restored.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading || googleChecking}
              variant="outline"
              className="h-12 w-full rounded-md border-[#cfc6b6] bg-white text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
            >
              {googleChecking ? "Checking Google login..." : "Connect with Google"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {localTestingHost || fallbackAvailable || authIssue ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviewLogin}
                className="h-12 w-full rounded-md border-[#cfc6b6] bg-white text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
              >
                Continue as Student Preview
              </Button>
            ) : null}
            {localTestingHost ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleMasterPreviewLogin}
                data-testid="login-master-preview"
                className="h-12 w-full rounded-md border-[#1d9e75]/40 bg-[#eefaf4] text-sm font-black text-[#1a3a2a] hover:bg-[#dff4ea]"
              >
                Continue as Master Preview
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Globe, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, devLogin, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && token.startsWith("MOCK_TOKEN") && !authLoading && !user) {
      console.warn("FORENSIC | AUTO_LOGIN | TOKEN DETECTED:", token);
      
      let email = "validator@antigravity.os";
      let uid = "dev-validator-id";
      
      if (token.includes("_sim_")) {
        const persona = token.split("_sim_")[1];
        email = `${persona.replace(/_/g, '')}@antigravity.dev`;
        uid = `mock-uid-${persona}`;
      }
      
      // Update localStorage so AuthContext can restore it
      localStorage.setItem("MOCK_TOKEN", token);
      devLogin(email, uid);
    }
  }, [searchParams, devLogin, authLoading, user]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-zinc-100 selection:text-zinc-900">
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full grid lg:grid-cols-2">
        {/* LEFT PANEL — BRAND & VALUE PROP */}
        <div className="hidden lg:flex flex-col justify-between p-16 xl:p-24 bg-zinc-900/40 backdrop-blur-3xl border-r border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-zinc-950 font-black text-xl">A</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Antigravity OS</span>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <h1 className="text-6xl xl:text-7xl font-black tracking-tighter leading-none">
                The New Standard <br />
                <span className="text-zinc-500">for UPSC Excellence.</span>
              </h1>
              <p className="text-xl text-zinc-400 font-medium max-w-md leading-relaxed">
                Institutional-grade intelligence designed to accelerate your cognitive peak for the Civil Services.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {[
                { icon: <Shield className="w-5 h-5" />, label: "Institutional Safety" },
                { icon: <Zap className="w-5 h-5" />, label: "Real-time Analytics" },
                { icon: <Globe className="w-5 h-5" />, label: "Bilingual Engine" },
                { icon: <CheckCircle2 className="w-5 h-5" />, label: "Verified Content" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-bold tracking-tight text-zinc-300">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-600">
            <span>Production v2.4.0</span>
            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
            <span>Sovereign Data</span>
          </div>
        </div>

        {/* RIGHT PANEL — LOGIN CARD */}
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="max-w-md w-full space-y-10">
            <div className="lg:hidden flex flex-col items-center mb-12">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-white/10">
                <span className="text-zinc-950 font-black text-3xl">A</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">Antigravity</h1>
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-black tracking-tighter">Authorized Entry</h2>
              <p className="text-zinc-500 font-medium italic">Synchronize your cognitive profile to continue.</p>
            </div>

            <div className="p-10 bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-8">
              <div className="space-y-6">
                <Button 
                  onClick={signInWithGoogle} 
                  disabled={authLoading}
                  className="w-full h-16 rounded-[1.5rem] bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-500 flex items-center justify-center gap-4 font-black text-lg group active:scale-95"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connect with Google
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">End-to-End Encryption Active</p>
                </div>
                <p className="text-[10px] text-zinc-600 text-center font-medium leading-relaxed italic px-4">
                  By continuing, you verify compliance with the institutional governance framework and data sovereignty policies.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    onClick={() => devLogin("validator@antigravity.os", "dev-validator-id")}
                    variant="ghost"
                    className="w-full text-[10px] text-zinc-700 hover:text-zinc-500 font-bold uppercase tracking-widest mt-4"
                  >
                    Dev: Institutional Bypass
                  </Button>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-zinc-600 text-xs font-bold">
                Need administrative assistance? <a href="#" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">Contact Governance</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

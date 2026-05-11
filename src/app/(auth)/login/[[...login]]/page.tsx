"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border text-center">
        <h1 className="text-2xl font-bold mb-2 tracking-tight">MCQ Portal</h1>
        <p className="text-muted-foreground mb-8">Sign in to access your dashboard</p>
        
        <Button onClick={signInWithGoogle} className="w-full font-medium" size="lg">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

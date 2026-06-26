import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { QueryProvider } from "@/lib/contexts/QueryProvider";
import { activeAuthProvider, clerkConfigReady, env } from "@/env";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/marketing/JsonLd";
import { SITE_URL, organizationSchema, websiteSchema } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sarit Classes — UPSC Command",
  description:
    "Integrated UPSC learning command center for classes, discussion, labs, practice, tracking, and revision.",
  alternates: { canonical: "/", types: { "text/plain": "/llms.txt" } },
};

export const viewport: Viewport = {
  themeColor: "#1a3a2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appShell = (
    <AuthProvider>
      <QueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryProvider>
      <Toaster position="bottom-right" theme="system" />
    </AuthProvider>
  );

  const content =
    activeAuthProvider === "clerk" && clerkConfigReady ? (
      <ClerkProvider
        publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login"}
        signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
        signInFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/upsc"}
        signUpFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/upsc"}
      >
        {appShell}
      </ClerkProvider>
    ) : (
      appShell
    );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        {content}
      </body>
    </html>
  );
}

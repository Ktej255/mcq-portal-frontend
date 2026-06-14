"use client";

import React, { useState } from "react";
import { FunnelStepRow } from "@/lib/funnels/routing";

interface FunnelStepRendererProps {
  step: FunnelStepRow;
  onComplete: (fieldData: any) => void;
}

export default function FunnelStepRenderer({
  step,
  onComplete
}: FunnelStepRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extract page copy from Puck content or settings or fallbacks
  const puckProps = step.content?.props || {};
  const headline = step.content?.headline || puckProps.headline || step.title || "Welcome";
  const subheadline = step.content?.subheadline || puckProps.subheadline || "Please enter your details to continue.";
  const bodyCopy = step.content?.body_copy || puckProps.body_copy || "";
  const ctaText = step.content?.cta_text || puckProps.cta_text || "Continue";

  // Smart detection of form fields in step content or fallback to defaults based on step_type
  const getRequiredFields = (): string[] => {
    // 1. Check if fields are explicitly listed in Puck content/props
    if (Array.isArray(step.content?.form_fields)) {
      return step.content.form_fields;
    }
    if (Array.isArray(puckProps.form_fields)) {
      return puckProps.form_fields;
    }

    // 2. Scan Puck JSON string for keywords
    const contentString = JSON.stringify(step.content).toLowerCase();
    const detected = [];
    if (contentString.includes("email")) detected.push("email");
    if (contentString.includes("name")) detected.push("name");
    if (contentString.includes("phone")) detected.push("phone");

    if (detected.length > 0) {
      return detected;
    }

    // 3. Fallback based on step_type
    switch (step.step_type) {
      case "optin":
      case "webinar_reg":
      case "bridge":
        return ["name", "email"];
      case "application":
        return ["name", "email", "phone"];
      case "sales":
      case "upsell":
      case "downsell":
      case "countdown":
        return []; // Usually CTA clicks only
      case "thankyou":
        return [];
      default:
        return ["email"];
    }
  };

  const fields = getRequiredFields();
  const isThankYou = step.step_type === "thankyou";

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isThankYou) return;

    setErrorMsg(null);

    // Validate fields
    for (const field of fields) {
      if (!formData[field]?.trim()) {
        setErrorMsg(`Please fill out the ${field} field.`);
        return;
      }
      if (field === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field])) {
          setErrorMsg("Please enter a valid email address.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      onComplete(formData);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during submission.");
      setLoading(false);
    }
  };

  // Render a custom styling wrapper depending on the step type
  const getStepBadge = () => {
    switch (step.step_type) {
      case "optin": return "Opt-In Offer";
      case "webinar_reg": return "Webinar Registration";
      case "application": return "Qualification Form";
      case "sales": return "Special Offer";
      case "upsell": return "Exclusive Upgrade";
      case "downsell": return "Special Discount";
      case "countdown": return "Limited Time Offer";
      case "thankyou": return "Order Confirmed";
      default: return "Portal";
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/50">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Badge */}
      <div className="flex justify-center mb-6">
        <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-indigo-400">
          {getStepBadge()}
        </span>
      </div>

      {/* Copy */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent mb-4 leading-tight">
          {headline}
        </h1>
        {subheadline && (
          <p className="text-slate-400 font-medium text-sm md:text-base max-w-lg mx-auto">
            {subheadline}
          </p>
        )}
        {bodyCopy && (
          <p className="text-slate-500 text-xs md:text-sm mt-4 max-w-md mx-auto leading-relaxed">
            {bodyCopy}
          </p>
        )}
      </div>

      {/* Form or Thank You State */}
      {isThankYou ? (
        <div className="text-center mt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">You're All Set!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            We have registered your details and sent confirmation to your email. Check your inbox to get started.
          </p>
          {ctaText && step.settings?.redirect_url_on_skip && (
            <div className="mt-8">
              <a
                href={step.settings.redirect_url_on_skip}
                className="inline-block px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {field === "email" ? "Email Address" : field === "phone" ? "Phone Number" : "Full Name"}
              </label>
              <input
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={formData[field] || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={
                  field === "email"
                    ? "e.g. you@example.com"
                    : field === "phone"
                    ? "e.g. +91 99999 99999"
                    : "e.g. Sarit Kumar"
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                required
              />
            </div>
          ))}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold text-center animate-shake">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 text-sm font-bold transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-100" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{ctaText}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

import type { CSSProperties } from "react";

import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";

type SubjectThemeVars = {
  "--subject-accent": string;
  "--subject-dark": string;
  "--subject-light": string;
  "--subject-ring": string;
  "--subject-bg": string;
  "--subject-card": string;
  "--subject-soft": string;
  "--subject-accent-soft": string;
  "--subject-accent-glow": string;
  "--subject-panel": string;
  "--subject-panel-strong": string;
  "--subject-border": string;
  "--subject-text": string;
  "--subject-heading": string;
  "--subject-muted": string;
};

export type SubjectThemeStyle = CSSProperties & SubjectThemeVars;

function addAlpha(hex: string, alpha: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function getSubjectThemeStyle(plan: SubjectSprintPlan): SubjectThemeStyle {
  return {
    "--subject-accent": plan.accent,
    "--subject-dark": plan.dark,
    "--subject-light": plan.light,
    "--subject-ring": addAlpha(plan.accent, "33"),
    "--subject-bg": "#f7f4ee",
    "--subject-card": "#fffdf8",
    "--subject-soft": "#fdfaf3",
    "--subject-accent-soft": addAlpha(plan.accent, "18"),
    "--subject-accent-glow": addAlpha(plan.accent, "55"),
    "--subject-panel": addAlpha(plan.dark, "f2"),
    "--subject-panel-strong": addAlpha(plan.dark, "cc"),
    "--subject-border": "#dcd5c7",
    "--subject-text": "#1b2f27",
    "--subject-heading": "#13251d",
    "--subject-muted": "#657066",
  };
}

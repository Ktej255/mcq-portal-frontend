export interface QuestionnaireAnswers {
  product_name: string;
  target_customer: string;
  main_problem: string;
  price_point: string;
  cta_type: string;
  niche_keywords: string;
  tone: string;
  [key: string]: string;
}

export interface HermesResearchSummary {
  buzzwords: string[];
  top_objections: string[];
  proof_types: string[];
  market_insight: string;
}

export interface HermesVSLScript {
  hook: string;
  problem: string;
  agitation: string;
  solution: string;
  proof: string;
  offer: string;
  cta: string;
  total_seconds: number;
}

export interface HermesPageCopy {
  headline: string;
  subheadline: string;
  cta_variants: string[];
}

export interface HermesFollowupItem {
  subject?: string;
  message?: string;
  body?: string;
  send_after_hours: number;
}

export interface HermesOutput {
  research_summary: HermesResearchSummary;
  vsl_script: HermesVSLScript;
  page_copy: HermesPageCopy;
  ai_starters: string[];
  followup_sequences: {
    email: HermesFollowupItem[];
    whatsapp: HermesFollowupItem[];
    sms: HermesFollowupItem[];
  };
}

export interface FunnelQuestionnaireAnswers {
  funnel_goal: string;
  product_name: string;
  target_audience: string;
  core_offer: string;
  price_point: string;
  steps_needed: string;
  tone: string;
  niche_keywords: string;
  [key: string]: string;
}

export interface FunnelStep {
  step_order: number;
  step_type: string;
  title: string;
  headline: string;
  subheadline: string;
  body_copy: string;
  cta_text: string;
  form_fields?: string[];
}

export interface FunnelHermesOutput {
  research_summary: {
    buzzwords: string[];
    top_objections: string[];
    proof_types: string[];
    market_insight: string;
  };
  funnel_structure: {
    recommended_type: string;
    step_count: number;
    steps: FunnelStep[];
  };
  page_copy: {
    headline: string;
    subheadline: string;
    cta_variants: string[];
  };
  followup_sequences: {
    email: Array<{
      subject: string;
      body: string;
      send_after_hours: number;
    }>;
    whatsapp: Array<{
      message: string;
      send_after_hours: number;
    }>;
    sms: Array<{
      message: string;
      send_after_hours: number;
    }>;
  };
  template_recommendation: {
    template_name: string;
    reason: string;
  };
}

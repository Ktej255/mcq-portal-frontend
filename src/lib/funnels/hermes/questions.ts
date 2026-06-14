export interface FunnelQuestion {
  id: string;
  text: string;
  type: 'text' | 'single_select';
  placeholder?: string;
  options?: string[];
}

export const FUNNEL_QUESTIONNAIRE: FunnelQuestion[] = [
  {
    id: 'funnel_goal',
    text: 'What is the main goal of this funnel?',
    type: 'single_select',
    options: [
      'Collect leads',
      'Sell a product or service',
      'Book a discovery call',
      'Register for a webinar',
      'Build a waitlist',
      'Offer a free download'
    ]
  },
  {
    id: 'product_name',
    text: 'What is the name of your product, service, or offer?',
    type: 'text',
    placeholder: 'e.g. My 30-Day UPSC Study System'
  },
  {
    id: 'target_audience',
    text: 'Who is this funnel for? Describe them in one sentence.',
    type: 'text',
    placeholder: 'e.g. Working professionals preparing for UPSC'
  },
  {
    id: 'core_offer',
    text: 'What exactly are you giving them or offering?',
    type: 'text',
    placeholder: 'e.g. A free PDF guide + 3-day email course'
  },
  {
    id: 'price_point',
    text: 'Is this free or paid? If paid, what is the price?',
    type: 'text',
    placeholder: 'e.g. Free / ₹999 / ₹2,500/month'
  },
  {
    id: 'steps_needed',
    text: 'How many pages should this funnel have?',
    type: 'single_select',
    options: [
      '1 page (just opt-in)',
      '2 pages (opt-in + thank you)',
      '3 pages (opt-in + sales + thank you)',
      '4+ pages (full funnel with upsell)'
    ]
  },
  {
    id: 'tone',
    text: 'What tone should the funnel copy have?',
    type: 'single_select',
    options: [
      'Professional and credible',
      'Warm and personal',
      'Urgent and results-focused',
      'Educational and calm'
    ]
  },
  {
    id: 'niche_keywords',
    text: 'List 3-5 words that describe your field or industry.',
    type: 'text',
    placeholder: 'e.g. UPSC coaching, IAS preparation, competitive exams'
  }
];

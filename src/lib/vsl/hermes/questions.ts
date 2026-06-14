export interface QuestionnaireQuestion {
  id: string;
  text: string;
  type: 'text' | 'single_select';
  placeholder?: string;
  options?: string[];
}

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'product_name',
    text: 'What is the name of your product or service?',
    type: 'text',
    placeholder: 'e.g. My UPSC Coaching',
  },
  {
    id: 'target_customer',
    text: 'Describe your ideal customer in one sentence.',
    type: 'text',
    placeholder: 'e.g. Working professionals preparing for UPSC',
  },
  {
    id: 'main_problem',
    text: 'What is the #1 problem your product solves?',
    type: 'text',
    placeholder: 'e.g. No structured guidance for UPSC Geography',
  },
  {
    id: 'price_point',
    text: 'What is your price point?',
    type: 'text',
    placeholder: 'e.g. ₹2,500 one-time or ₹499/month',
  },
  {
    id: 'cta_type',
    text: 'What should the viewer do at the end?',
    type: 'single_select',
    options: [
      'Book a free call',
      'Buy directly',
      'Join waitlist',
      'Download free resource',
    ],
  },
  {
    id: 'niche_keywords',
    text: 'List 3-5 words that describe your field or industry.',
    type: 'text',
    placeholder: 'e.g. UPSC geography polity current affairs',
  },
  {
    id: 'tone',
    text: 'How should the video feel?',
    type: 'single_select',
    options: [
      'Professional and credible',
      'Warm and personal',
      'Urgent and direct',
      'Educational and calm',
    ],
  },
];

"use client";

import type { AnswerFormat, MarkingSchemeOut, McqAnswerIn } from '@/services/api/funnelService';

/**
 * Answer input for one topic MCQ, shared by the MCQ lab and the review test.
 *
 * - single: one option (the original UPSC look)
 * - multi: checkboxes, "Select all that apply"
 * - numerical: a number input (decimals and negatives allowed)
 *
 * The answer state is a string for single and numerical (the raw text, so
 * "-" or "2." can be typed) and a list of labels for multi.
 */

export type AnswerValue = string | string[] | undefined;

interface QuestionLike {
  question_id: number;
  answer_format?: AnswerFormat;
  options: Array<{ label: string; text: string }>;
}

export function formatOf(q: { answer_format?: AnswerFormat }): AnswerFormat {
  return q.answer_format ?? 'single';
}

/** Parse the text of a numerical answer; null when it is not a finite number. */
export function parseNumeric(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function isAnswered(q: { answer_format?: AnswerFormat }, value: AnswerValue): boolean {
  switch (formatOf(q)) {
    case 'multi':
      return Array.isArray(value) && value.length > 0;
    case 'numerical':
      return typeof value === 'string' && parseNumeric(value) !== null;
    default:
      return typeof value === 'string' && value !== '';
  }
}

/** The submission fields for one question, following the API contract. */
export function toAnswerPayload(q: QuestionLike, value: AnswerValue): McqAnswerIn {
  const base: McqAnswerIn = { question_id: q.question_id };
  if (!isAnswered(q, value)) return base;
  switch (formatOf(q)) {
    case 'multi':
      return { ...base, selected_options: [...(value as string[])].sort() };
    case 'numerical':
      return { ...base, numeric_answer: parseNumeric(value as string) as number };
    default:
      return { ...base, chosen_answer: value as string };
  }
}

/** A stored answer ("B", "A,C", "12.5", "") as text for the result screen. */
export function showAnswer(format: AnswerFormat | undefined, text: string): string {
  if (!text) return 'Not answered';
  return format === 'multi' ? text.split(',').join(', ') : text;
}

function fmtMarks(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** "+4" / "-1" / "0" for a question's marks. */
export function signedMarks(n: number): string {
  return n > 0 ? `+${fmtMarks(n)}` : fmtMarks(n);
}

/** "Marks: 11 / 20 (negative marking: -1 per wrong)" */
export function describeMarks(
  total: number,
  max: number,
  scheme?: Partial<Record<AnswerFormat, MarkingSchemeOut>>,
): string {
  const wrongs = Object.values(scheme ?? {}).map((s) => (s ? s.wrong : 0));
  let note = '';
  if (wrongs.length > 0) {
    const distinct = Array.from(new Set(wrongs));
    if (distinct.length === 1) {
      note = distinct[0] < 0 ? `negative marking: ${fmtMarks(distinct[0])} per wrong` : 'no negative marking';
    } else {
      const parts = Object.entries(scheme ?? {})
        .filter(([, s]) => s && s.wrong < 0)
        .map(([format, s]) => `${format} ${fmtMarks((s as MarkingSchemeOut).wrong)}`);
      note = parts.length > 0 ? `negative marking per wrong: ${parts.join(', ')}` : 'no negative marking';
    }
  }
  return `Marks: ${fmtMarks(total)} / ${fmtMarks(max)}${note ? ` (${note})` : ''}`;
}

const optionClass = (selected: boolean) =>
  `w-full text-left rounded-lg border p-3 text-xs transition-all ${
    selected ? 'border-[#1a3a2a] bg-[#e7f5ee] shadow-sm' : 'border-[#dcd5c7] bg-white hover:border-[#b9d9cd]'
  }`;

interface Props {
  question: QuestionLike;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

export function QuestionAnswerInput({ question, value, onChange }: Props) {
  const format = formatOf(question);

  if (format === 'numerical') {
    return (
      <div className="space-y-1">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          aria-label="Your numerical answer"
          data-testid={`numeric-answer-${question.question_id}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
          placeholder="Type a number"
          className="w-full rounded-lg border border-[#dcd5c7] bg-white p-3 text-sm text-[#1f2e26] focus:border-[#1a3a2a] focus:outline-none"
        />
        <p className="text-[10px] text-[#49675e]">Enter a number. Decimals and negative values are allowed.</p>
      </div>
    );
  }

  if (format === 'multi') {
    const chosen = Array.isArray(value) ? value : [];
    const toggle = (label: string) => {
      const next = chosen.includes(label) ? chosen.filter((l) => l !== label) : [...chosen, label];
      onChange(next.length > 0 ? next : undefined);
    };
    return (
      <div className="space-y-2" role="group" aria-label="Select all that apply">
        <p className="text-[10px] font-bold text-[#49675e]">Select all that apply</p>
        {question.options.map((opt) => {
          const selected = chosen.includes(opt.label);
          return (
            <label key={opt.label} className={`flex cursor-pointer items-start gap-2 ${optionClass(selected)}`}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(opt.label)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#1a3a2a]"
              />
              <span>
                <span className="font-black text-[#1a3a2a]">{opt.label}.</span>{' '}
                <span className="text-[#1f2e26]">{opt.text}</span>
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {question.options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.label)}
          className={optionClass(value === opt.label)}
        >
          <span className="font-black text-[#1a3a2a]">{opt.label}.</span>{' '}
          <span className="text-[#1f2e26]">{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

export default QuestionAnswerInput;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Clock, RefreshCcw, XCircle } from "lucide-react";

import { ExamPicker } from "@/components/gs-lms/ExamPicker";
import {
  getGateError,
  gsLmsService,
  type BookOut,
  type BookProgress,
  type ChapterProgress,
  type ChapterStatus,
  type DueReview,
  type LearnerProfile,
  type RetentionResult,
  type RetentionStart,
  type StudyPath,
} from "@/services/api/gsLmsService";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcd5c7] bg-white px-4 py-2 text-sm font-bold text-[#13251d] hover:bg-[#f7f4ee] disabled:cursor-not-allowed disabled:opacity-50";
const CARD = "rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 md:p-5";

const STUDY_PATHS: { value: StudyPath; label: string; hint: string }[] = [
  { value: "NCERT_ONLY", label: "NCERT only", hint: "School textbooks are my main source" },
  { value: "REFERENCE_BOOKS", label: "Reference books", hint: "Standard books like Laxmikanth" },
  { value: "COACHING", label: "Coaching notes", hint: "I follow a coaching institute" },
  { value: "MIXED", label: "A mix of these", hint: "Books, notes and NCERTs together" },
];

const STATUS_OPTIONS: { value: ChapterStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Done" },
];

const MIN_QUESTIONS = 3;

function parseDate(iso: string): Date {
  // The server sends UTC timestamps, sometimes without a zone suffix.
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** "due today", "tomorrow", "in 3 days", "overdue". */
function friendlyDue(iso: string | null, now: number): string | null {
  if (!iso) return null;
  const t = parseDate(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.ceil((t - now) / 86_400_000);
  if (days <= -2) return "overdue";
  if (days <= 0) return "due today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function prettySlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pct(n: number | null): string {
  return n == null ? "–" : `${Math.round(n)}%`;
}

type Check = {
  chapterId: number;
  label: string;
  phase: "loading" | "questions" | "submitting" | "result" | "error";
  start?: RetentionStart;
  answers: Record<number, string>;
  result?: RetentionResult;
  notice?: string;
};

export default function BooksPage() {
  const [books, setBooks] = useState<BookOut[] | null>(null);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [progress, setProgress] = useState<Record<number, BookProgress>>({});
  const [due, setDue] = useState<DueReview[]>([]);
  const [check, setCheck] = useState<Check | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const checkRef = useRef<HTMLDivElement>(null);

  // Initial load: catalogue, profile, subject names, due reviews.
  useEffect(() => {
    let cancelled = false;
    Promise.all([gsLmsService.getBooks(), gsLmsService.getLearnerProfile(), gsLmsService.getDueReviews()])
      .then(([b, p, d]) => {
        if (cancelled) return;
        setBooks(b);
        setProfile(p);
        setDue(d);
      })
      .catch(() => !cancelled && setLoadError(true));
    gsLmsService
      .getSubjects()
      .then((all) => !cancelled && setSubjectNames(Object.fromEntries(all.map((s) => [s.slug, s.name]))))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedKey = (profile?.book_ids ?? []).join(",");
  const selectedBooks = useMemo(
    () => (books ?? []).filter((b) => (profile?.book_ids ?? []).includes(b.id)),
    [books, profile],
  );

  const loadProgress = useCallback(async (ids: number[]) => {
    const results = await Promise.allSettled(ids.map((id) => gsLmsService.getBookProgress(id)));
    setProgress((prev) => {
      const next = { ...prev };
      results.forEach((r, i) => {
        if (r.status === "fulfilled") next[ids[i]] = r.value;
      });
      return next;
    });
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after the await
    void loadProgress(selectedKey.split(",").map(Number));
  }, [selectedKey, loadProgress]);

  const refreshAll = useCallback(async () => {
    const ids = selectedKey ? selectedKey.split(",").map(Number) : [];
    const [, d] = await Promise.all([loadProgress(ids), gsLmsService.getDueReviews().catch(() => null)]);
    if (d) setDue(d);
  }, [selectedKey, loadProgress]);

  const saveProfile = async (patch: Partial<Pick<LearnerProfile, "study_path" | "book_ids">>) => {
    if (!profile) return;
    const previous = profile;
    const next: LearnerProfile = { ...profile, ...patch };
    setProfile(next);
    setSaveState("saving");
    try {
      // PUT replaces the whole profile, so keep the style and level as they are.
      const saved = await gsLmsService.saveLearnerProfile({
        preferred_style: next.preferred_style,
        preferred_level: next.preferred_level,
        study_path: next.study_path,
        book_ids: next.book_ids,
      });
      setProfile(saved);
      setSaveState("saved");
    } catch {
      setProfile(previous);
      setSaveState("error");
    }
  };

  const toggleBook = (id: number) => {
    if (!profile) return;
    const ids = profile.book_ids.includes(id) ? profile.book_ids.filter((b) => b !== id) : [...profile.book_ids, id];
    void saveProfile({ book_ids: ids });
  };

  const changeStatus = async (chapter: ChapterProgress, bookId: number, status: ChapterStatus) => {
    // Show the change straight away; reload to get the server's view.
    setProgress((prev) => {
      const book = prev[bookId];
      if (!book) return prev;
      return {
        ...prev,
        [bookId]: {
          ...book,
          chapters: book.chapters.map((c) => (c.chapter_id === chapter.chapter_id ? { ...c, status } : c)),
        },
      };
    });
    try {
      await gsLmsService.setChapterStatus(chapter.chapter_id, status);
    } catch {
      // fall through to the reload below, which restores the real status
    }
    await loadProgress([bookId]);
  };

  const beginCheck = useCallback(async (chapterId: number, label: string, notice?: string) => {
    setCheck({ chapterId, label, phase: "loading", answers: {}, notice });
    window.setTimeout(() => checkRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 50);
    try {
      const start = await gsLmsService.startRetention(chapterId);
      setCheck({ chapterId, label, phase: "questions", start, answers: {}, notice });
    } catch (err) {
      const gate = getGateError(err);
      setCheck({
        chapterId,
        label,
        phase: "error",
        answers: {},
        notice: gate ? gate.detail : "We couldn't start the check just now. Please try again.",
      });
    }
  }, []);

  const submitCheck = async () => {
    if (!check?.start) return;
    const { chapterId, label, start, answers } = check;
    setCheck({ ...check, phase: "submitting" });
    try {
      const result = await gsLmsService.submitRetention(
        chapterId,
        start.questions.map((q) => ({ question_id: q.question_id, selected_option: answers[q.question_id] })),
      );
      setCheck({ chapterId, label, phase: "result", start, answers, result });
      void refreshAll();
    } catch (err) {
      const gate = getGateError(err);
      if (gate?.status === 409) {
        // Stale or not started: fetch a fresh set and say so.
        await beginCheck(chapterId, label, "That set of questions had expired, so here is a fresh one. Please answer again.");
      } else {
        // 402 shows the upgrade prompt globally; keep the answers so nothing is lost.
        setCheck({ chapterId, label, phase: "questions", start, answers, notice: "We couldn't submit your answers. Please try again." });
      }
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          We couldn&apos;t load your books. Please refresh the page.
        </p>
      </div>
    );
  }
  if (!books || !profile) {
    return <div className="p-6 text-sm text-[#5d675f]">Loading…</div>;
  }

  const grouped = new Map<string, BookOut[]>();
  for (const b of books) {
    const key = b.subject_slug ?? "other";
    grouped.set(key, [...(grouped.get(key) ?? []), b]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" data-testid="books-page">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Study</p>
        <h1 className="text-2xl font-black tracking-tight text-[#1a3a2a] md:text-3xl">My books</h1>
        <p className="mt-1 text-sm text-[#5d675f]">Track the chapters you read and test what stuck.</p>
      </header>

      {due.length > 0 ? (
        <section aria-label="Due for review" data-testid="books-due" className="rounded-2xl border border-[#e6c97a] bg-[#fff8e6] p-4">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#7a5a00]">
            <Clock className="h-4 w-4" aria-hidden /> Due for review
          </h2>
          <ul className="mt-3 space-y-2">
            {due.map((d) => (
              <li key={d.chapter_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#13251d]">
                    Ch. {d.number} {d.title}
                  </p>
                  <p className="text-xs text-[#5d675f]">
                    {d.book_title} ({d.book_edition} ed.)
                    {d.last_score != null ? ` · last score ${pct(d.last_score)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="books-review-now"
                  className={PRIMARY_BUTTON}
                  onClick={() => void beginCheck(d.chapter_id, `Ch. ${d.number} ${d.title}`)}
                >
                  Review now
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {check ? (
        <div ref={checkRef} className="scroll-mt-4">
          <CheckCard
            check={check}
            onAnswer={(qid, label) => setCheck((c) => (c ? { ...c, answers: { ...c.answers, [qid]: label } } : c))}
            onSubmit={() => void submitCheck()}
            onAgain={() => void beginCheck(check.chapterId, check.label)}
            onClose={() => setCheck(null)}
          />
        </div>
      ) : null}

      <ExamPicker />

      <section className={CARD} aria-label="Set up your books" data-testid="books-setup">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-[#1a3a2a]">How do you study?</h2>
          <span className="text-xs text-[#7b7469]" role="status" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
            {saveState === "error" ? <span className="text-red-700">Couldn&apos;t save. Try again.</span> : null}
          </span>
        </div>
        <div role="radiogroup" aria-label="How do you study?" className="mt-3 grid gap-2 sm:grid-cols-2">
          {STUDY_PATHS.map((p) => {
            const checked = profile.study_path === p.value;
            return (
              <label
                key={p.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                  checked ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-white hover:bg-[#f7f4ee]"
                }`}
              >
                <input
                  type="radio"
                  name="study-path"
                  value={p.value}
                  checked={checked}
                  onChange={() => void saveProfile({ study_path: p.value })}
                  className="mt-1 accent-[#1d9e75]"
                />
                <span>
                  <span className="block text-sm font-bold text-[#13251d]">{p.label}</span>
                  <span className="block text-xs text-[#5d675f]">{p.hint}</span>
                </span>
              </label>
            );
          })}
        </div>

        <h2 className="mt-6 text-lg font-black text-[#1a3a2a]">Which books do you use?</h2>
        {books.length === 0 ? <p className="mt-2 text-sm text-[#5d675f]">No books are available yet.</p> : null}
        <div className="mt-2 space-y-4">
          {Array.from(grouped.entries()).map(([slug, list]) => (
            <fieldset key={slug}>
              <legend className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7b7469]">
                {subjectNames[slug] ?? prettySlug(slug)}
              </legend>
              <div className="mt-1 space-y-2">
                {list.map((b) => {
                  const on = profile.book_ids.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                        on ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-white hover:bg-[#f7f4ee]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleBook(b.id)}
                        data-testid={`book-option-${b.slug}`}
                        className="mt-1 accent-[#1d9e75]"
                      />
                      <span>
                        <span className="block text-sm font-bold text-[#13251d]">{b.title}</span>
                        <span className="block text-xs text-[#5d675f]">
                          {b.author} · {b.edition} edition
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      {selectedBooks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#dcd5c7] p-5 text-center text-sm text-[#5d675f]">
          Pick the books you use above to see their chapters here.
        </p>
      ) : null}

      {selectedBooks.map((b) => (
        <BookSection
          key={b.id}
          book={b}
          progress={progress[b.id]}
          now={now}
          busyChapterId={check && (check.phase === "loading" || check.phase === "submitting") ? check.chapterId : null}
          onStatus={(c, s) => void changeStatus(c, b.id, s)}
          onTest={(c) => void beginCheck(c.chapter_id, `Ch. ${c.number} ${c.title}`)}
        />
      ))}
    </div>
  );
}

function BookSection({
  book,
  progress,
  now,
  busyChapterId,
  onStatus,
  onTest,
}: {
  book: BookOut;
  progress: BookProgress | undefined;
  now: number;
  busyChapterId: number | null;
  onStatus: (c: ChapterProgress, s: ChapterStatus) => void;
  onTest: (c: ChapterProgress) => void;
}) {
  const chapters = progress?.chapters ?? [];
  const done = chapters.filter((c) => c.status === "COMPLETED").length;
  const total = chapters.length || book.chapters.length;
  return (
    <section className={CARD} aria-label={book.title} data-testid={`book-${book.slug}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#1a3a2a]">
            <BookOpen className="h-5 w-5 text-[#1d9e75]" aria-hidden /> {book.title}
          </h2>
          <p className="text-xs text-[#5d675f]">
            {book.author} · {book.edition} edition
          </p>
        </div>
        <p className="text-sm font-bold text-[#1a3a2a]" data-testid="book-progress-summary">
          {done} of {total} chapters done
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e3d6]" aria-hidden>
        <div className="h-full bg-[#1d9e75]" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      {!progress ? <p className="mt-4 text-sm text-[#5d675f]">Loading chapters…</p> : null}
      <ul className="mt-4 space-y-3">
        {chapters.map((c) => {
          const next = friendlyDue(c.next_review_at, now);
          const ready = c.question_count >= MIN_QUESTIONS;
          return (
            <li key={c.chapter_id} data-testid="chapter-row" className="rounded-xl border border-[#e9e3d6] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#13251d]">
                  {c.number}. {c.title}
                </p>
                {ready ? (
                  <button
                    type="button"
                    data-testid="chapter-test-me"
                    disabled={busyChapterId != null}
                    onClick={() => onTest(c)}
                    className={PRIMARY_BUTTON}
                  >
                    Test me
                  </button>
                ) : (
                  <span className="text-xs italic text-[#7b7469]">Questions coming soon</span>
                )}
              </div>
              <div role="group" aria-label={`Status of chapter ${c.number}`} className="mt-2 inline-flex overflow-hidden rounded-lg border border-[#dcd5c7]">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={c.status === o.value}
                    onClick={() => c.status !== o.value && onStatus(c, o.value)}
                    className={`px-3 py-1.5 text-xs font-bold ${
                      c.status === o.value ? "bg-[#1a3a2a] text-white" : "bg-white text-[#13251d] hover:bg-[#f7f4ee]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {c.checks_taken > 0 ? (
                <p className="mt-2 text-xs text-[#5d675f]">
                  Last score {pct(c.last_score)} · Best {pct(c.best_score)}
                  {next ? ` · Next review ${next}` : ""}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CheckCard({
  check,
  onAnswer,
  onSubmit,
  onAgain,
  onClose,
}: {
  check: Check;
  onAnswer: (questionId: number, label: string) => void;
  onSubmit: () => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  const { phase, start, result, answers } = check;
  const answered = start ? start.questions.filter((q) => answers[q.question_id]).length : 0;
  const questionById = new Map((start?.questions ?? []).map((q) => [q.question_id, q]));

  return (
    <section className="rounded-2xl border-2 border-[#1d9e75] bg-[#fffdf8] p-4 md:p-5" aria-label="Retention check" data-testid="retention-check">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Retention check</p>
          <h2 className="text-lg font-black text-[#1a3a2a]">{check.label}</h2>
        </div>
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Close
        </button>
      </div>

      {check.notice ? (
        <p role="status" data-testid="retention-notice" className="mt-3 rounded-xl border border-[#e6c97a] bg-[#fff8e6] p-3 text-sm text-[#7a5a00]">
          {check.notice}
        </p>
      ) : null}

      {phase === "loading" ? <p className="mt-4 text-sm text-[#5d675f]">Getting your questions…</p> : null}

      {phase === "error" ? (
        <div className="mt-4">
          <button type="button" onClick={onAgain} className={SECONDARY_BUTTON}>
            Try again
          </button>
        </div>
      ) : null}

      {(phase === "questions" || phase === "submitting") && start ? (
        <div className="mt-4 space-y-5">
          {start.questions.map((q, i) => (
            <fieldset key={q.question_id} data-testid="retention-question" disabled={phase === "submitting"}>
              <legend className="text-sm font-bold text-[#13251d]">
                {i + 1}. {q.question_text}
              </legend>
              <div className="mt-2 space-y-2">
                {q.options.map((o) => {
                  const on = answers[q.question_id] === o.label;
                  return (
                    <label
                      key={o.label}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
                        on ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-white hover:bg-[#f7f4ee]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.question_id}`}
                        checked={on}
                        onChange={() => onAnswer(q.question_id, o.label)}
                        className="mt-0.5 accent-[#1d9e75]"
                      />
                      <span>
                        <span className="font-bold">{o.label}.</span> {o.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="retention-submit"
              disabled={answered < start.questions.length || phase === "submitting"}
              onClick={onSubmit}
              className={PRIMARY_BUTTON}
            >
              {phase === "submitting" ? "Checking…" : "Submit answers"}
            </button>
            <span className="text-xs text-[#5d675f]">
              {answered} of {start.questions.length} answered
            </span>
          </div>
        </div>
      ) : null}

      {phase === "result" && result ? (
        <div className="mt-4 space-y-4" data-testid="retention-result">
          <div className={`rounded-xl p-4 ${result.passed ? "bg-[#e7f5ee]" : "bg-[#fdf0ec]"}`}>
            <p className="text-3xl font-black text-[#1a3a2a]" data-testid="retention-score">
              {Math.round(result.score)}%
            </p>
            <p className="text-sm font-bold text-[#13251d]">
              {result.correct_count} of {result.total_questions} correct ·{" "}
              {result.passed ? "Passed" : "Not passed yet"} (pass mark {Math.round(result.pass_score)}%)
            </p>
            <p className="mt-1 text-sm text-[#5d675f]" data-testid="retention-next-review">
              We&apos;ll remind you in {result.next_review_in_days} {result.next_review_in_days === 1 ? "day" : "days"}.
            </p>
          </div>
          <ul className="space-y-3">
            {result.attempts.map((a, i) => {
              const q = questionById.get(a.question_id);
              const text = (label: string) => q?.options.find((o) => o.label === label)?.text;
              return (
                <li key={a.question_id} data-testid="retention-attempt" className="rounded-xl border border-[#e9e3d6] bg-white p-3 text-sm">
                  <p className="flex items-start gap-2 font-bold text-[#13251d]">
                    {a.is_correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" aria-label="Correct" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c0392b]" aria-label="Incorrect" />
                    )}
                    <span>
                      {i + 1}. {q?.question_text ?? "Question"}
                    </span>
                  </p>
                  {!a.is_correct ? (
                    <p className="mt-1 text-[#5d675f]">
                      You chose {a.selected_option}
                      {text(a.selected_option) ? `: ${text(a.selected_option)}` : ""}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[#13251d]">
                    Correct answer: <span className="font-bold">{a.correct_option}</span>
                    {text(a.correct_option) ? `. ${text(a.correct_option)}` : ""}
                  </p>
                  {a.explanation ? <p className="mt-1 text-[#5d675f]">{a.explanation}</p> : null}
                </li>
              );
            })}
          </ul>
          <button type="button" data-testid="retention-again" onClick={onAgain} className={PRIMARY_BUTTON}>
            <RefreshCcw className="h-4 w-4" aria-hidden /> Test again
          </button>
        </div>
      ) : null}
    </section>
  );
}

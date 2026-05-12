"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useExamStore, ConfidenceLevel } from '@/lib/store/useExamStore';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionPalette } from '@/components/exam/QuestionPalette';
import { ConfidenceSelector } from '@/components/exam/ConfidenceSelector';
import { BilingualText } from '@/components/shared/BilingualText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Bookmark, RotateCcw, Target, Cloud, CloudOff, AlertTriangle, CheckCircle2, Menu } from 'lucide-react';

import { useExamIntegrity } from '@/lib/hooks/useExamIntegrity';
import { useSearchParams } from 'next/navigation';
import { examService, QuestionData } from '@/services/api/examService';
import { toast } from 'sonner';

export default function ExamInterface() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { testId } = params;
  const attemptId = searchParams.get('attemptId');

  const { testId: storeTestId, initializeTest, currentQuestionIndex, setCurrentQuestion, visitQuestion, answers, setAnswer, markForReview, clearResponse } = useExamStore();
  const { timeLeft } = useTimerStore();

  const { isSaving, saveError } = useAutoSave(attemptId);
  const { warningsCount, isWarningVisible, lastViolation, dismissWarning, requestFullscreen } = useExamIntegrity();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const data = await examService.getQuestions(testId as string);
        setQuestions(data);
        
        if (storeTestId !== testId) {
          initializeTest(testId as string, data.map(q => q.id));
        }
      } catch (err) {
        console.error("Failed to fetch exam data:", err);
        setError("Failed to load exam questions.");
      } finally {
        setLoading(false);
      }
    };

    if (testId) fetchExamData();
  }, [testId, storeTestId, initializeTest]);

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground animate-pulse">Initializing secure exam environment...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center text-center p-4">
      <p className="text-red-500 mb-4">{error}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  const question = questions[currentQuestionIndex];
  const currentAnswer = question ? answers[question.id] : null;

  useEffect(() => {
    if (question?.id) {
      visitQuestion(question.id);
    }
  }, [question?.id, visitQuestion]);

  if (!question) return null;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (attemptId) {
        await examService.submitTest(attemptId);
        toast.success("Test submitted successfully!");
        router.push(`/reports?attemptId=${attemptId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Failed to submit test. Please check your connection and try again.");
    }
  };

  const handleOptionChange = (optionId: string) => {
    const conf = currentAnswer?.confidence || 'EDUCATED_GUESS';
    setAnswer(question.id, optionId, conf);
  };

  const handleConfidenceSelect = (level: ConfidenceLevel) => {
    setAnswer(question.id, currentAnswer?.selectedOptionId || null, level);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-50 flex flex-col">
        {isWarningVisible && (
          <div className="bg-destructive text-destructive-foreground p-3 flex justify-between items-center z-[100] animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <span className="font-semibold text-xs sm:text-sm">
                Integrity Warning: {lastViolation || "Suspicious activity detected"}. ({warningsCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={dismissWarning} className="hover:bg-white/10 h-8 px-2 text-xs">
                Acknowledge
              </Button>
            </div>
          </div>
        )}

        <ExamHeader 
          testId={testId as string}
          testName="Exam in Progress" 
          totalQuestions={questions.length} 
          durationSeconds={10800} 
        onSubmit={() => setShowReview(true)}
          onRequestFullscreen={requestFullscreen}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          
          {/* Mobile Palette Toggle */}
          <div className="xl:hidden fixed bottom-24 right-6 z-40">
            <Button
              size="icon"
              onClick={() => setMobilePaletteOpen(true)}
              className="w-14 h-14 rounded-full shadow-2xl bg-primary text-primary-foreground border-4 border-white dark:border-zinc-900"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {mobilePaletteOpen && (
            <div className="fixed inset-0 z-[180] xl:hidden">
              <button
                type="button"
                aria-label="Close question navigator"
                className="absolute inset-0 bg-black/45"
                onClick={() => setMobilePaletteOpen(false)}
              />
              <aside className="absolute right-0 top-0 h-full w-[min(88vw,380px)] bg-background shadow-2xl border-l">
                <div className="flex items-center justify-between border-b p-4">
                  <h2 className="text-lg font-bold">Question Navigator</h2>
                  <Button variant="ghost" size="sm" onClick={() => setMobilePaletteOpen(false)}>Close</Button>
                </div>
                <div className="h-[calc(100%-65px)] overflow-y-auto p-3">
                  <QuestionPalette
                    questionIds={questions.map(q => q.id)}
                    onQuestionSelect={(idx) => {
                      setCurrentQuestion(idx);
                      setMobilePaletteOpen(false);
                    }}
                  />
                </div>
              </aside>
            </div>
          )}

          {/* Auto Save Status */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {saveError ? (
              <span className="text-xs text-red-500 flex items-center gap-1 bg-white dark:bg-black px-2 py-1 rounded shadow-sm">
                <CloudOff className="w-3 h-3" /> Sync Failed
              </span>
            ) : isSaving ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-white dark:bg-black px-2 py-1 rounded shadow-sm">
                <Cloud className="w-3 h-3 animate-pulse" /> Saving...
              </span>
            ) : (
              <span className="text-xs text-green-600 flex items-center gap-1 bg-white dark:bg-black px-2 py-1 rounded shadow-sm">
                <Cloud className="w-3 h-3" /> Saved
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Question Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mt-6">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20">
                    Q {currentQuestionIndex + 1}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">{question.subject}{question.topic ? ` • ${question.topic}` : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    +{question.positiveMarks} / -{question.negativeMarks}
                  </Badge>
                  <Badge variant={question.difficulty === 'Hard' ? 'destructive' : question.difficulty === 'Medium' ? 'default' : 'secondary'}>
                    {question.difficulty}
                  </Badge>
                </div>
              </div>

              {/* Question Body */}
              <div className="text-lg md:text-xl font-medium leading-relaxed">
                <BilingualText 
                  textEn={question.textEn} 
                  textHi={question.textHi} 
                  hybridContainerClassName="space-y-4"
                  className="block"
                />
              </div>

              {/* Options */}
              <div className="pt-4">
                <RadioGroup 
                  value={currentAnswer?.selectedOptionId || ''} 
                  onValueChange={handleOptionChange}
                  className="space-y-3"
                >
                  {question.options.map((opt, idx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = currentAnswer?.selectedOptionId === opt.id;
                    return (
                      <Label
                        key={opt.id}
                        htmlFor={opt.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-muted hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        <RadioGroupItem value={opt.id} id={opt.id} className="mt-1" />
                        <div className="flex gap-4 flex-1">
                          <span className="font-bold text-muted-foreground w-6 text-center">{letters[idx]}.</span>
                          <div className="flex-1">
                            <BilingualText 
                              textEn={opt.textEn} 
                              textHi={opt.textHi} 
                              className="font-medium"
                            />
                          </div>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Confidence Engine */}
              {currentAnswer?.selectedOptionId && (
                <div className="pt-8 border-t mt-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-muted/30 rounded-xl p-6 border border-primary/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Cognitive Confidence</h3>
                    </div>
                    <ConfidenceSelector 
                      selected={currentAnswer.confidence} 
                      onSelect={handleConfidenceSelect} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="sticky bottom-0 border-t bg-background p-3 md:p-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] z-30">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clearResponse(question.id)}
                  disabled={!currentAnswer?.selectedOptionId && currentAnswer?.status !== 'MARKED_FOR_REVIEW'}
                  className="h-11 px-3 sm:px-4"
                >
                  <RotateCcw className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    markForReview(question.id);
                    if (currentQuestionIndex < questions.length - 1) {
                      handleNext();
                    } else {
                      setShowReview(true);
                    }
                  }}
                  className="h-11 px-3 sm:px-4 bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                >
                  <Bookmark className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Review & Next</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="h-11 px-3 sm:px-4"
                >
                  <ChevronLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowReview(true)}
                    className="h-11 px-5 sm:px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Review & Submit
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleNext}
                    className="h-11 px-5 sm:px-8 shadow-md"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Palette) */}
        <div className="w-80 border-l hidden xl:block bg-muted/10">
          <QuestionPalette 
            questionIds={questions.map(q => q.id)} 
            onQuestionSelect={(idx) => setCurrentQuestion(idx)}
          />
        </div>
      </div>

      {/* Full Screen Review Overlay */}
      {showReview && (
        <ExamReviewOverlay 
          questions={questions}
          answers={answers}
          onBack={() => setShowReview(false)}
          timeLeft={timeLeft}
          onNavigate={(idx) => {
            setCurrentQuestion(idx);
            setShowReview(false);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ExamReviewOverlay({ 
  questions, 
  answers, 
  onBack, 
  timeLeft,
  onNavigate, 
  onSubmit 
}: { 
  questions: QuestionData[], 
  answers: Record<string, any>, 
  onBack: () => void, 
  timeLeft: number,
  onNavigate: (idx: number) => void, 
  onSubmit: () => Promise<void> 
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answerValues = Object.values(answers);
  const visited = answerValues.filter(a => a.status !== 'NOT_VISITED').length;
  const attempted = answerValues.filter(a => a.status === 'ANSWERED' || a.status === 'ANSWERED_AND_MARKED').length;
  const unattempted = answerValues.filter(a => a.status === 'UNANSWERED' || a.status === 'MARKED_FOR_REVIEW').length;
  const notVisited = questions.length - visited;
  const stats = {
    total: questions.length,
    attempted,
    unattempted,
    notVisited,
    progress: questions.length ? Math.round((visited / questions.length) * 100) : 0,
    marked: answerValues.filter(a => a.status === 'MARKED_FOR_REVIEW' || a.status === 'ANSWERED_AND_MARKED').length,
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="border-b p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
        <h2 className="text-xl font-bold">Exam Final Review</h2>
        <Button variant="ghost" onClick={onBack}>Back to Exam</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time Remaining</p>
              <p className="mt-2 font-mono text-3xl font-black">{formatTime(timeLeft)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visited Progress</p>
              <p className="mt-2 text-3xl font-black">{stats.progress}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${stats.progress}%` }} />
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Not Visited</p>
              <p className="mt-2 text-3xl font-black">{stats.notVisited}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Attempted</p>
              <p className="text-3xl font-bold">{stats.attempted}</p>
            </div>
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
              <p className="text-sm text-muted-foreground font-medium">Unattempted</p>
              <p className="text-3xl font-bold">{stats.unattempted}</p>
            </div>
            <div className="p-6 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Review</p>
              <p className="text-3xl font-bold">{stats.marked}</p>
            </div>
          </div>

          {/* Detailed Palette */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Question Response Status
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const status = ans?.status || 'NOT_VISITED';
                
                let bgColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400";
                let borderColor = "border-zinc-200 dark:border-zinc-700";
                
                if (status === 'ANSWERED') {
                  bgColor = "bg-green-600 text-white";
                  borderColor = "border-green-700";
                } else if (status === 'MARKED_FOR_REVIEW') {
                  bgColor = "bg-purple-600 text-white";
                  borderColor = "border-purple-700";
                } else if (status === 'ANSWERED_AND_MARKED') {
                  bgColor = "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-zinc-900";
                  borderColor = "border-purple-700";
                } else if (status === 'UNANSWERED') {
                  bgColor = "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300";
                  borderColor = "border-rose-200 dark:border-rose-800";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => onNavigate(idx)}
                    className={`w-10 h-10 rounded-lg border text-sm font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${bgColor} ${borderColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legends */}
          <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-xl text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-50 border border-rose-200"></div>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-600 ring-1 ring-purple-400 ring-offset-1"></div>
              <span>Answered & Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-zinc-100 border border-zinc-200"></div>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Submission Final Actions */}
          <div className="pt-12 border-t flex flex-col items-center space-y-6 text-center">
            <div className="max-w-md space-y-3">
              <h3 className="text-2xl font-bold text-destructive">Ready to submit?</h3>
              <p className="text-muted-foreground">
                Once you submit the test, you will not be able to change your answers. 
                Please ensure you have reviewed all marked questions.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl">
                <input 
                  type="checkbox" 
                  id="confirm-submit" 
                  checked={confirmed} 
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-5 h-5 accent-destructive"
                />
                <label htmlFor="confirm-submit" className="text-sm font-medium cursor-pointer">
                  I understand that I cannot resume this test after submission.
                </label>
              </div>

              <Button 
                onClick={handleFinalSubmit} 
                disabled={!confirmed || submitting}
                className="h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {submitting ? "Submitting Exam..." : "Submit Final Test"}
              </Button>
              <Button variant="ghost" onClick={onBack}>Return to Question Paper</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

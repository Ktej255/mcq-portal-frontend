"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useExamStore, ConfidenceLevel } from '@/lib/store/useExamStore';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionPalette } from '@/components/exam/QuestionPalette';
import { ConfidenceSelector } from '@/components/exam/ConfidenceSelector';
import { BilingualText } from '@/components/shared/BilingualText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Bookmark, RotateCcw, Target, Cloud, CloudOff } from 'lucide-react';

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

  const { testId: storeTestId, initializeTest, currentQuestionIndex, setCurrentQuestion, answers, setAnswer, markForReview, clearResponse } = useExamStore();

  const { isSaving, saveError } = useAutoSave(attemptId);
  const { warningsCount, isWarningVisible, dismissWarning } = useExamIntegrity();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (confirm("Are you sure you want to submit the test?")) {
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
      {isWarningVisible && (
        <div className="bg-destructive text-destructive-foreground p-3 flex justify-between items-center z-[100]">
          <span className="font-semibold text-sm">
            Warning: Suspicious activity detected. Tab switching or minimizing is tracked. ({warningsCount} occurrences)
          </span>
          <Button variant="outline" size="sm" onClick={dismissWarning} className="text-destructive hover:text-destructive">
            Acknowledge
          </Button>
        </div>
      )}

      <ExamHeader 
        testId={testId as string}
        testName="Exam in Progress" 
        totalQuestions={questions.length} 
        durationSeconds={10800} // 3 hours
        onSubmit={handleSubmit}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
          
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
          <div className="border-t bg-background p-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)] z-10">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => clearResponse(question.id)}
                  disabled={!currentAnswer?.selectedOptionId && currentAnswer?.status !== 'MARKED_FOR_REVIEW'}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline-block">Clear</span>
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    markForReview(question.id);
                    handleNext();
                  }}
                  className="gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline-block">Review & Next</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="gap-2 px-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Palette) */}
        <div className="w-80 border-l hidden xl:block bg-muted/10">
          <QuestionPalette questionIds={questions.map(q => q.id)} />
        </div>
      </div>
    </div>
  );
}

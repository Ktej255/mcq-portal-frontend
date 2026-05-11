"use client";

import { useEffect, useState } from "react";
import { examService, TestMetadata } from "@/services/api/examService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await examService.getAvailableTests();
        setTests(data);
      } catch (err) {
        console.error("Failed to fetch tests:", err);
        setError("Failed to load available tests.");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleStartTest = async (testId: string) => {
    try {
      const attempt = await examService.startAttempt(testId);
      // Pass the attemptId via query param for the exam page to use
      router.push(`/exam/${testId}?attemptId=${attempt.attemptId}`);
    } catch (err) {
      console.error("Failed to start attempt:", err);
      alert("Failed to start the test. Please try again.");
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Available Tests</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tests.map(test => (
          <div key={test.id} className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg mb-2">{test.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{test.description}</p>
            
            <div className="flex gap-2 mb-6">
              {test.subjects.map(s => (
                <span key={s} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs rounded-md">{s}</span>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-medium mb-6">
              <span>{test.totalQuestions} Questions</span>
              <span>{test.durationMinutes} mins</span>
            </div>

            <Button onClick={() => handleStartTest(test.id)} className="w-full">
              Start Test
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

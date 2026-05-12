"use client";

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { adminService, Test, Topic } from '@/services/api/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  UploadCloud, FileType, CheckCircle2, AlertCircle, 
  Trash2, Database, ArrowRight, Loader2, Info
} from 'lucide-react';

interface RawQuestion {
  text_en: string;
  text_hi?: string;
  A: string;
  B: string;
  C: string;
  D: string;
  correct: string;
  explanation_en?: string;
  explanation_hi?: string;
  difficulty?: string;
  topic_id?: string;
  test_id?: string;
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RawQuestion[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [testsData, topicsData] = await Promise.all([
          adminService.getTests(),
          adminService.getTopics()
        ]);
        setTests(testsData);
        setTopics(topicsData);
      } catch (err) {
        toast.error("Failed to load tests/topics metadata.");
      }
    };
    loadMetadata();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file.");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data as RawQuestion[]);
        setIsProcessing(false);
        toast.success(`Loaded ${results.data.length} questions from CSV.`);
      },
      error: (err) => {
        toast.error("Error parsing CSV: " + err.message);
        setIsProcessing(false);
      }
    });
  };

  const handleImport = async () => {
    if (!selectedTestId || !selectedTopicId) {
      toast.error("Please select a target Test and Topic first.");
      return;
    }

    if (data.length === 0) {
      toast.error("No data to import.");
      return;
    }

    setIsUploading(true);
    try {
      const formattedQuestions = data.map(q => ({
        test_id: selectedTestId,
        topic_id: selectedTopicId,
        text_en: q.text_en,
        text_hi: q.text_hi || "",
        options_en: {
          A: q.A,
          B: q.B,
          C: q.C,
          D: q.D
        },
        correct_option: q.correct,
        explanation_en: q.explanation_en || "",
        explanation_hi: q.explanation_hi || "",
        difficulty: q.difficulty || "MEDIUM",
        source: "BULK_UPLOAD"
      }));

      await adminService.bulkCreateQuestions(formattedQuestions);
      toast.success(`Successfully imported ${formattedQuestions.length} questions!`);
      setData([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Import failed. Please check your data format.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Question Ingestion</h1>
          <p className="text-muted-foreground">Import large question banks via CSV for scaling subjects.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.open('/templates/question_import_template.csv')}>
            Download Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              1. Upload Data
            </h2>
            
            <div className="relative group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center group-hover:border-primary transition-colors bg-zinc-50/50 dark:bg-zinc-950/50">
                <FileType className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium">{file ? file.name : "Drag & drop CSV or click to browse"}</p>
                <p className="text-xs text-muted-foreground mt-2">Maximum file size: 5MB</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 pt-4">
                <Database className="w-5 h-5 text-primary" />
                2. Target Mapping
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select Target Test</label>
                <select 
                  className="w-full p-2 rounded-lg border bg-background"
                  value={selectedTestId || ''}
                  onChange={(e) => setSelectedTestId(Number(e.target.value))}
                >
                  <option value="">-- Choose Test --</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Select Default Topic</label>
                <select 
                  className="w-full p-2 rounded-lg border bg-background"
                  value={selectedTopicId || ''}
                  onChange={(e) => setSelectedTopicId(Number(e.target.value))}
                >
                  <option value="">-- Choose Topic --</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg font-bold" 
              disabled={data.length === 0 || isUploading || !selectedTestId || !selectedTopicId}
              onClick={handleImport}
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Ingesting...</>
              ) : (
                <><ArrowRight className="w-5 h-5 mr-2" /> Start Ingestion</>
              )}
            </Button>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" /> Import Validation Rules
            </h3>
            <ul className="text-xs space-y-2 text-blue-700 dark:text-blue-300">
              <li>• Column names must match template exactly.</li>
              <li>• 'correct' column should contain A, B, C, or D.</li>
              <li>• Bilingual text (Hindi) is optional but recommended.</li>
              <li>• Topic/Test mapping here overrides CSV if provided.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Data Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Data Preview</h2>
              {data.length > 0 && (
                <Badge variant="outline" className="px-3 py-1 font-bold">
                  {data.length} Records Found
                </Badge>
              )}
            </div>

            <div className="border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold">Question Text</th>
                    <th className="px-4 py-3 text-left font-bold">Correct</th>
                    <th className="px-4 py-3 text-left font-bold">Topic</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-20 text-center text-muted-foreground italic">
                        No data loaded. Upload a CSV to see preview.
                      </td>
                    </tr>
                  ) : (
                    data.slice(0, 50).map((q, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium max-w-xs truncate">{q.text_en}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="font-bold">{q.correct}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {q.topic_id || "Default"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => setData(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {data.length > 50 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-muted-foreground">
                        Showing first 50 of {data.length} records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

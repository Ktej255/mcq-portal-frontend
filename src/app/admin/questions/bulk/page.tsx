"use client";

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { adminService, QuestionPayload, Test, Topic } from '@/services/api/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  UploadCloud, FileType, 
  Trash2, Database, ArrowRight, Loader2, Info, ShieldCheck, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { appendLocalBulkQuestionDraft } from '@/lib/upsc/mcqDraftBank';
import { environmentPlan } from '@/lib/upsc/subjectPlans';
import { auditEnvironmentMcqBatch, type EnvironmentMcqQualityAudit } from '@/lib/upsc/environmentMcqQuality';
import { geographySessions } from '@/lib/upsc/plan';
import { getGeographyBatchCode } from '@/lib/upsc/mcqContract';
import { auditGeographyMcqBatch, type GeographyMcqQualityAudit } from '@/lib/upsc/geographyMcqQuality';

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
  subject?: string;
  day?: string;
  week?: string;
  chapter?: string;
  topic?: string;
  batch_code?: string;
  test_title?: string;
  source?: string;
  map_or_case_tag?: string;
  pyq_linked?: string;
  status?: string;
}

type CsvQuestionRow = Partial<RawQuestion> & {
  question_text_en?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
};

type ImportMode = "EMPTY" | "LEGACY" | "UPSC_MCQ_COMMAND" | "MIXED";

type EnvironmentBulkAudit = {
  batchCode: string;
  day: number | null;
  audit: EnvironmentMcqQualityAudit | null;
  warnings: string[];
};

type GeographyBulkAudit = {
  batchCode: string;
  day: number | null;
  audit: GeographyMcqQualityAudit | null;
  warnings: string[];
};

type UpscBulkContext = {
  hasContext: boolean;
  mode: string;
  subject: string;
  day: string;
  batch: string;
  returnPath: string;
};

const EMPTY_UPSC_BULK_CONTEXT: UpscBulkContext = {
  hasContext: false,
  mode: "",
  subject: "",
  day: "",
  batch: "",
  returnPath: "",
};

const LOCAL_TESTS_FALLBACK: Test[] = [
  {
    id: 9001,
    title: "Local UPSC Geography Readiness",
    description: "Offline test mapping for local UPSC MCQ authoring.",
    subject_id: 1,
    duration_minutes: 60,
  },
];
const LOCAL_TOPICS_FALLBACK: Topic[] = [
  {
    id: 9001,
    name: "Geography GS Compatibility",
    subject_id: 1,
  },
];

function normalizeCorrectOption(value?: string) {
  const normalized = (value ?? "A").trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(normalized) ? normalized : "A";
}

function detectRowMode(row: CsvQuestionRow): Exclude<ImportMode, "EMPTY" | "MIXED"> {
  return row.question_text_en || row.option_a || row.batch_code ? "UPSC_MCQ_COMMAND" : "LEGACY";
}

function normalizeQuestionRow(row: CsvQuestionRow): RawQuestion {
  const rowMode = detectRowMode(row);

  if (rowMode === "UPSC_MCQ_COMMAND") {
    return {
      text_en: row.question_text_en || row.text_en || "",
      text_hi: row.text_hi || "",
      A: row.option_a || row.A || "",
      B: row.option_b || row.B || "",
      C: row.option_c || row.C || "",
      D: row.option_d || row.D || "",
      correct: normalizeCorrectOption(row.correct_option || row.correct),
      explanation_en: row.explanation_en || "",
      explanation_hi: row.explanation_hi || "",
      difficulty: row.difficulty || "MEDIUM",
      topic_id: row.topic_id,
      test_id: row.test_id,
      subject: row.subject,
      day: row.day ? String(row.day) : undefined,
      week: row.week ? String(row.week) : undefined,
      chapter: row.chapter,
      topic: row.topic,
      batch_code: row.batch_code,
      test_title: row.test_title,
      source: row.source || "UPSC_MCQ_COMMAND",
      map_or_case_tag: row.map_or_case_tag,
      pyq_linked: row.pyq_linked,
      status: row.status,
    };
  }

  return {
    text_en: row.text_en || "",
    text_hi: row.text_hi || "",
    A: row.A || "",
    B: row.B || "",
    C: row.C || "",
    D: row.D || "",
    correct: normalizeCorrectOption(row.correct || row.correct_option),
    explanation_en: row.explanation_en || "",
    explanation_hi: row.explanation_hi || "",
    difficulty: row.difficulty || "MEDIUM",
    topic_id: row.topic_id,
    test_id: row.test_id,
    source: row.source || "BULK_UPLOAD",
    status: row.status,
  };
}

function detectImportMode(rows: CsvQuestionRow[]): ImportMode {
  if (rows.length === 0) return "EMPTY";

  const modes = new Set(rows.map(detectRowMode));
  if (modes.size > 1) return "MIXED";

  const [mode] = Array.from(modes);
  return mode ?? "LEGACY";
}

function buildQuestionPayloads(
  rows: RawQuestion[],
  selectedTestId: number | null,
  selectedTopicId: number | null,
  importMode: ImportMode
): QuestionPayload[] {
  return rows.map(q => ({
    test_id: selectedTestId ?? 0,
    topic_id: selectedTopicId ?? 0,
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
    source: q.source || (importMode === "UPSC_MCQ_COMMAND" ? "UPSC_MCQ_COMMAND" : "BULK_UPLOAD"),
    status: q.status || "DRAFT",
    quality_notes: {
      subject: q.subject,
      day: q.day,
      week: q.week,
      chapter: q.chapter,
      topic: q.topic,
      batch_code: q.batch_code,
      test_title: q.test_title,
      map_or_case_tag: q.map_or_case_tag,
      pyq_linked: q.pyq_linked,
    }
  }));
}

function qualityNotes(question: QuestionPayload) {
  const notes = question.quality_notes;
  return notes && typeof notes === "object" && !Array.isArray(notes) ? (notes as Record<string, unknown>) : {};
}

function textValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function titleCase(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function readUpscBulkContext(): UpscBulkContext {
  if (typeof window === "undefined") return EMPTY_UPSC_BULK_CONTEXT;

  const params = new URLSearchParams(window.location.search);
  const mode = (params.get("mode") ?? "").trim().toUpperCase();
  const subject = (params.get("subject") ?? "").trim();
  const day = (params.get("day") ?? "").trim();
  const batch = (params.get("batch") ?? "").trim().toUpperCase();
  const rawReturnPath = (params.get("return") ?? "").trim();
  const returnPath = rawReturnPath.startsWith("/") && !rawReturnPath.startsWith("//") ? rawReturnPath : "";
  const hasContext = mode === "UPSC_MCQ_COMMAND" || Boolean(subject || day || batch);

  return {
    hasContext,
    mode,
    subject,
    day,
    batch,
    returnPath,
  };
}

function buildUpscContextWarnings(context: UpscBulkContext, rows: RawQuestion[], importMode: ImportMode) {
  if (!context.hasContext || rows.length === 0) return [];

  const warnings: string[] = [];
  if (importMode !== "UPSC_MCQ_COMMAND") {
    warnings.push("Upload a UPSC MCQ Command CSV for this Geography route.");
  }

  if (context.subject) {
    const expectedSubject = context.subject.toLowerCase();
    const hasMissingSubject = rows.some((row) => !textValue(row.subject));
    const hasSubjectMismatch = rows.some(
      (row) => textValue(row.subject) && textValue(row.subject).toLowerCase() !== expectedSubject
    );
    if (hasMissingSubject) warnings.push(`Every row must include subject ${titleCase(context.subject)}.`);
    if (hasSubjectMismatch) warnings.push(`CSV subject must match ${titleCase(context.subject)}.`);
  }

  if (context.day) {
    const expectedDay = Number(context.day);
    const hasMissingDay = rows.some((row) => !textValue(row.day));
    const hasDayMismatch = rows.some((row) => {
      const day = Number(textValue(row.day));
      return Number.isFinite(day) && Number.isFinite(expectedDay) && day !== expectedDay;
    });
    if (hasMissingDay) warnings.push(`Every row must include day ${context.day}.`);
    if (hasDayMismatch) warnings.push(`CSV day must match day ${context.day}.`);
  }

  if (context.batch) {
    const hasMissingBatch = rows.some((row) => !textValue(row.batch_code));
    const hasBatchMismatch = rows.some(
      (row) => textValue(row.batch_code) && textValue(row.batch_code).toUpperCase() !== context.batch
    );
    if (hasMissingBatch) warnings.push(`Every row must include batch code ${context.batch}.`);
    if (hasBatchMismatch) warnings.push(`CSV batch_code must match ${context.batch}.`);
  }

  return Array.from(new Set(warnings));
}

function batchCodeFrom(question: QuestionPayload) {
  return textValue(qualityNotes(question).batch_code).toUpperCase();
}

function isEnvironmentQuestion(question: QuestionPayload) {
  const notes = qualityNotes(question);
  const subject = textValue(notes.subject).toLowerCase();
  return subject.includes("environment") || batchCodeFrom(question).startsWith("ENV-D");
}

function isGeographyQuestion(question: QuestionPayload) {
  const notes = qualityNotes(question);
  const subject = textValue(notes.subject).toLowerCase();
  return subject.includes("geography") || batchCodeFrom(question).startsWith("GEO-D");
}

function buildEnvironmentBulkAudits(questions: QuestionPayload[]): EnvironmentBulkAudit[] {
  const grouped = questions.filter(isEnvironmentQuestion).reduce<Record<string, QuestionPayload[]>>((acc, question) => {
    const batchCode = batchCodeFrom(question) || "ENV-MISSING-BATCH";
    acc[batchCode] = [...(acc[batchCode] ?? []), question];
    return acc;
  }, {});

  return Object.entries(grouped).map(([batchCode, batchQuestions]) => {
    if (batchCode === "ENV-MISSING-BATCH") {
      return {
        batchCode,
        day: null,
        audit: null,
        warnings: ["Environment rows must include a stable batch_code such as ENV-D05."],
      };
    }

    const dayFromCode = /^ENV-D(\d+)$/i.exec(batchCode)?.[1];
    const dayFromQuestion = textValue(qualityNotes(batchQuestions[0]).day);
    const day = Number(dayFromCode || dayFromQuestion);
    const session = environmentPlan.sessions.find((item) => item.day === day);
    if (!session) {
      return {
        batchCode,
        day: Number.isFinite(day) ? day : null,
        audit: null,
        warnings: ["No Environment day mapping found for this batch code."],
      };
    }

    return {
      batchCode,
      day,
      audit: auditEnvironmentMcqBatch(environmentPlan, session, batchCode, batchQuestions, batchQuestions.length),
      warnings: [],
    };
  });
}

function buildGeographyBulkAudits(questions: QuestionPayload[]): GeographyBulkAudit[] {
  const grouped = questions.filter(isGeographyQuestion).reduce<Record<string, QuestionPayload[]>>((acc, question) => {
    const batchCode = batchCodeFrom(question) || "GEO-MISSING-BATCH";
    acc[batchCode] = [...(acc[batchCode] ?? []), question];
    return acc;
  }, {});

  return Object.entries(grouped).map(([batchCode, batchQuestions]) => {
    if (batchCode === "GEO-MISSING-BATCH") {
      return {
        batchCode,
        day: null,
        audit: null,
        warnings: ["Geography rows must include a stable batch_code such as GEO-D03."],
      };
    }

    const dayFromCode = /^GEO-D(\d+)$/i.exec(batchCode)?.[1];
    const dayFromQuestion = textValue(qualityNotes(batchQuestions[0]).day);
    const day = Number(dayFromCode || dayFromQuestion);
    const session = geographySessions.find((item) => item.day === day);
    if (!session) {
      return {
        batchCode,
        day: Number.isFinite(day) ? day : null,
        audit: null,
        warnings: ["No Geography day mapping found for this batch code."],
      };
    }

    const expectedBatchCode = getGeographyBatchCode(session);
    if (batchCode !== expectedBatchCode) {
      return {
        batchCode,
        day,
        audit: null,
        warnings: [`Batch code should be ${expectedBatchCode} for Geography day ${session.day}.`],
      };
    }

    const plannedCount = batchCode === "GEO-D01" ? 25 : batchQuestions.length;

    return {
      batchCode,
      day,
      audit: auditGeographyMcqBatch(session, expectedBatchCode, batchQuestions, plannedCount),
      warnings: [],
    };
  });
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RawQuestion[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("EMPTY");
  const [upscContext, setUpscContext] = useState<UpscBulkContext>(EMPTY_UPSC_BULK_CONTEXT);
  
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const formattedQuestions = useMemo(
    () => buildQuestionPayloads(data, selectedTestId, selectedTopicId, importMode),
    [data, importMode, selectedTestId, selectedTopicId]
  );
  const environmentAudits = useMemo(() => buildEnvironmentBulkAudits(formattedQuestions), [formattedQuestions]);
  const hasBlockingEnvironmentQualityIssues = environmentAudits.some((item) => !item.audit?.passed);
  const geographyAudits = useMemo(() => buildGeographyBulkAudits(formattedQuestions), [formattedQuestions]);
  const hasBlockingGeographyQualityIssues = geographyAudits.some((item) => !item.audit?.passed);
  const upscContextWarnings = useMemo(
    () => buildUpscContextWarnings(upscContext, data, importMode),
    [data, importMode, upscContext]
  );
  const hasBlockingUpscContextIssues = upscContextWarnings.length > 0;

  useEffect(() => {
    setUpscContext(readUpscBulkContext());

    const loadMetadata = async () => {
      try {
        const [testsData, topicsData] = await Promise.all([
          adminService.getTests(),
          adminService.getTopics()
        ]);
        setTests(testsData);
        setTopics(topicsData);
      } catch {
        setTests(LOCAL_TESTS_FALLBACK);
        setTopics(LOCAL_TOPICS_FALLBACK);
        setSelectedTestId(LOCAL_TESTS_FALLBACK[0].id);
        setSelectedTopicId(LOCAL_TOPICS_FALLBACK[0].id);
        toast.info("Using local UPSC metadata fallback.");
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
        const parsedRows = results.data as CsvQuestionRow[];
        const normalizedRows = parsedRows.map(normalizeQuestionRow);
        const nextMode = detectImportMode(parsedRows);
        setData(normalizedRows);
        setImportMode(nextMode);
        setIsProcessing(false);
        toast.success(
          nextMode === "UPSC_MCQ_COMMAND"
            ? `Loaded ${normalizedRows.length} UPSC MCQ Command questions from CSV.`
            : `Loaded ${normalizedRows.length} questions from CSV.`
        );
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

    if (hasBlockingEnvironmentQualityIssues) {
      toast.error("Environment MCQ quality gate failed. Fix the highlighted batch before importing.");
      return;
    }

    if (hasBlockingGeographyQualityIssues) {
      toast.error("Geography MCQ quality gate failed. Fix the highlighted batch before importing.");
      return;
    }

    if (hasBlockingUpscContextIssues) {
      toast.error("CSV does not match the selected UPSC day/batch context.");
      return;
    }

    setIsUploading(true);
    try {
      await adminService.bulkCreateQuestions(formattedQuestions);
      toast.success(`Successfully imported ${formattedQuestions.length} questions!`);
      setData([]);
      setFile(null);
      setImportMode("EMPTY");
    } catch {
      if (typeof window !== "undefined") {
        appendLocalBulkQuestionDraft({
          importMode,
          questions: formattedQuestions,
        });
        toast.success(`Backend offline. Saved ${formattedQuestions.length} questions to local draft bank.`);
        setData([]);
        setFile(null);
        setImportMode("EMPTY");
        return;
      }

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
            Legacy Template
          </Button>
          <Button variant="outline" onClick={() => window.open('/templates/upsc_mcq_command_template.csv')}>
            UPSC Template
          </Button>
        </div>
      </div>

      {upscContext.hasContext && (
        <div
          data-testid="bulk-upsc-context-panel"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/15"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                UPSC MCQ command context
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {titleCase(upscContext.subject) || "Selected subject"} day {upscContext.day || "-"} / {upscContext.batch || "Batch pending"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This import is locked to the selected Geography MCQ readiness room, so a wrong day or batch cannot enter the local draft bank.
              </p>
            </div>
            {upscContext.returnPath && (
              <Link
                data-testid="bulk-return-to-mcq"
                href={upscContext.returnPath}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100"
              >
                Return to MCQ readiness
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-emerald-300 bg-white px-3 py-1 font-bold text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100">
              {upscContext.mode || "UPSC_MCQ_COMMAND"}
            </Badge>
            {upscContext.subject && (
              <Badge variant="outline" className="border-emerald-300 bg-white px-3 py-1 font-bold text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100">
                {titleCase(upscContext.subject)}
              </Badge>
            )}
            {upscContext.day && (
              <Badge variant="outline" className="border-emerald-300 bg-white px-3 py-1 font-bold text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100">
                Day {upscContext.day}
              </Badge>
            )}
            {upscContext.batch && (
              <Badge variant="outline" className="border-emerald-300 bg-white px-3 py-1 font-bold text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100">
                {upscContext.batch}
              </Badge>
            )}
          </div>
          {upscContextWarnings.length > 0 && (
            <div
              data-testid="bulk-upsc-context-warnings"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100"
            >
              {upscContextWarnings.join(" ")}
            </div>
          )}
        </div>
      )}

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
                <p className="text-sm font-medium">{isProcessing ? "Parsing CSV..." : file ? file.name : "Drag & drop CSV or click to browse"}</p>
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
              disabled={data.length === 0 || isUploading || !selectedTestId || !selectedTopicId || hasBlockingEnvironmentQualityIssues || hasBlockingGeographyQualityIssues || hasBlockingUpscContextIssues}
              onClick={handleImport}
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Ingesting...</>
              ) : (
                <><ArrowRight className="w-5 h-5 mr-2" /> Start Ingestion</>
              )}
            </Button>
            {hasBlockingEnvironmentQualityIssues && (
              <p className="text-xs font-semibold leading-5 text-amber-700">
                Environment import is paused until the MCQ quality gate passes.
              </p>
            )}
            {hasBlockingGeographyQualityIssues && (
              <p className="text-xs font-semibold leading-5 text-amber-700">
                Geography import is paused until stems, explanations, map anchors, and day metadata pass.
              </p>
            )}
            {hasBlockingUpscContextIssues && (
              <p className="text-xs font-semibold leading-5 text-amber-700">
                UPSC import is paused until the CSV matches the selected day and batch.
              </p>
            )}
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" /> Import Validation Rules
            </h3>
            <ul className="text-xs space-y-2 text-blue-700 dark:text-blue-300">
              <li>Legacy columns text_en, A, B, C, D, correct still work.</li>
              <li>UPSC MCQ Command columns question_text_en, option_a-d, correct_option are auto-mapped.</li>
              <li>correct or correct_option should contain A, B, C, or D.</li>
              <li>Topic/Test mapping here overrides CSV if provided.</li>
              <li>Contextual Geography uploads must match the selected day and batch code.</li>
              <li>Geography GEO-D batches must pass stem, explanation, map-anchor, and syllabus checks.</li>
              <li>Environment ENV-D batches must pass the fresh MCQ quality gate before local save.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Data Preview */}
        <div className="lg:col-span-2 space-y-6">
          {geographyAudits.length > 0 && (
            <div
              data-testid="bulk-geography-quality-panel"
              className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    Geography quality preflight
                  </p>
                  <h2 className="text-xl font-bold mt-1">Fresh MCQ gate before import</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    GEO-D batches are checked for day mapping, meaningful options, UPSC-style stems, mechanism explanations, and map or atlas anchors before local save. GEO-D01 is the launch bank and needs 25 fresh questions before import.
                  </p>
                </div>
                <Badge
                  data-testid="bulk-geography-quality-status"
                  variant="outline"
                  className={
                    hasBlockingGeographyQualityIssues
                      ? "border-amber-300 bg-amber-50 px-3 py-1 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-emerald-300 bg-emerald-50 px-3 py-1 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  }
                >
                  {hasBlockingGeographyQualityIssues ? "Review required" : "Ready to import"}
                </Badge>
              </div>

              <div className="grid gap-3">
                {geographyAudits.map((item) => {
                  const audit = item.audit;
                  return (
                    <div
                      key={item.batchCode}
                      data-testid={`bulk-geography-quality-${item.batchCode.toLowerCase()}`}
                      className={
                        audit?.passed
                          ? "rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/15"
                          : "rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/60 dark:bg-amber-950/15"
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={
                              audit?.passed
                                ? "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white"
                                : "flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white"
                            }
                          >
                            {audit?.passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-black">{item.batchCode}</p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {item.day ? `Geography day ${item.day}` : "Geography day not mapped"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          <span
                            data-testid={`bulk-geography-quality-score-${item.batchCode.toLowerCase()}`}
                            className="text-sm font-black"
                          >
                            {audit ? `${audit.score}%` : "0%"}
                          </span>
                        </div>
                      </div>

                      {audit ? (
                        <>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {audit.items.map((check) => (
                              <div key={check.id} className="rounded-lg border bg-white/80 p-3 text-xs dark:bg-zinc-950/30">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="font-bold">{check.label}</span>
                                  {check.passed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                  ) : (
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                                  )}
                                </div>
                                <p className="line-clamp-2 text-muted-foreground">{check.detail}</p>
                              </div>
                            ))}
                          </div>
                          {!audit.passed && (
                            <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                              Fix these first: {audit.warnings.join(", ")}.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                          {item.warnings.join(" ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {environmentAudits.length > 0 && (
            <div
              data-testid="bulk-environment-quality-panel"
              className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    Environment quality preflight
                  </p>
                  <h2 className="text-xl font-bold mt-1">Fresh MCQ gate before import</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ENV-D batches are checked for mapping, explanation depth, UPSC trap language, and case/map anchors before they enter the local draft bank.
                  </p>
                </div>
                <Badge
                  data-testid="bulk-environment-quality-status"
                  variant="outline"
                  className={
                    hasBlockingEnvironmentQualityIssues
                      ? "border-amber-300 bg-amber-50 px-3 py-1 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-emerald-300 bg-emerald-50 px-3 py-1 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  }
                >
                  {hasBlockingEnvironmentQualityIssues ? "Review required" : "Ready to import"}
                </Badge>
              </div>

              <div className="grid gap-3">
                {environmentAudits.map((item) => {
                  const audit = item.audit;
                  return (
                    <div
                      key={item.batchCode}
                      data-testid={`bulk-environment-quality-${item.batchCode.toLowerCase()}`}
                      className={
                        audit?.passed
                          ? "rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/15"
                          : "rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/60 dark:bg-amber-950/15"
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={
                              audit?.passed
                                ? "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white"
                                : "flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white"
                            }
                          >
                            {audit?.passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-black">{item.batchCode}</p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {item.day ? `Environment day ${item.day}` : "Environment day not mapped"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          <span
                            data-testid={`bulk-environment-quality-score-${item.batchCode.toLowerCase()}`}
                            className="text-sm font-black"
                          >
                            {audit ? `${audit.score}%` : "0%"}
                          </span>
                        </div>
                      </div>

                      {audit ? (
                        <>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {audit.items.map((check) => (
                              <div key={check.id} className="rounded-lg border bg-white/80 p-3 text-xs dark:bg-zinc-950/30">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="font-bold">{check.label}</span>
                                  {check.passed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                  ) : (
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                                  )}
                                </div>
                                <p className="line-clamp-2 text-muted-foreground">{check.detail}</p>
                              </div>
                            ))}
                          </div>
                          {!audit.passed && (
                            <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                              Fix these first: {audit.warnings.join(", ")}.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                          {item.warnings.join(" ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Data Preview</h2>
              {data.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-bold">
                    {data.length} Records Found
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 font-bold">
                    {importMode === "UPSC_MCQ_COMMAND"
                      ? "UPSC MCQ Command"
                      : importMode === "MIXED"
                        ? "Mixed CSV"
                        : "Legacy CSV"}
                  </Badge>
                </div>
              )}
            </div>

            <div className="border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold">Question Text</th>
                    <th className="px-4 py-3 text-left font-bold">Correct</th>
                    <th className="px-4 py-3 text-left font-bold">Batch / Topic</th>
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
                          {q.batch_code || q.topic || q.topic_id || "Default"}
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

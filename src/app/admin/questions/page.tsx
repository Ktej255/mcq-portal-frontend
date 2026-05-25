"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Question } from '@/services/api/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Database,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  readLocalBulkQuestionDrafts,
  writeLocalBulkQuestionDrafts,
  type LocalBulkQuestionDraft,
} from '@/lib/upsc/mcqDraftBank';

function getQualityNotes(question?: LocalBulkQuestionDraft["questions"][number]) {
  const notes = question?.quality_notes;
  return notes && typeof notes === "object" && !Array.isArray(notes) ? (notes as Record<string, unknown>) : {};
}

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

const subjectSlugByName: Record<string, string> = {
  geography: "geography",
  environment: "environment",
  "disaster management": "disaster-management",
  economy: "economy",
  "science and tech": "science-tech",
  "science & tech": "science-tech",
  "polity and governance": "polity-governance",
  "internal security and indian society": "internal-security-society",
  history: "history",
};

const subjectSlugByPrefix: Record<string, string> = {
  GEO: "geography",
  ENV: "environment",
  DIS: "disaster-management",
  ECO: "economy",
  SCI: "science-tech",
  POL: "polity-governance",
  INT: "internal-security-society",
  HIS: "history",
};

function getDraftRoute(draft: LocalBulkQuestionDraft) {
  const firstQuestion = draft.questions[0];
  const notes = getQualityNotes(firstQuestion);
  const subject = asText(notes.subject)?.toLowerCase();
  const batchCode = asText(notes.batch_code);
  const prefix = batchCode?.split("-")[0] ?? "";
  const slug = (subject && subjectSlugByName[subject]) || subjectSlugByPrefix[prefix] || "geography";
  const day = asText(notes.day) ?? "1";
  return `/upsc/${slug}/mcq-readiness?day=${day}`;
}

function getDraftSummary(draft: LocalBulkQuestionDraft) {
  const firstQuestion = draft.questions[0];
  const notes = getQualityNotes(firstQuestion);
  return {
    batchCode: asText(notes.batch_code) || "UNMAPPED",
    subject: asText(notes.subject) || "UPSC",
    topic: asText(notes.topic) || asText(notes.test_title) || "Local MCQ batch",
    day: asText(notes.day) || "1",
    difficulty: firstQuestion?.difficulty || "MEDIUM",
  };
}

export default function QuestionsControlRoom() {
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [localDrafts, setLocalDrafts] = useState<LocalBulkQuestionDraft[]>([]);
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-questions', page, limit],
    queryFn: () => adminService.getQuestions(undefined, page * limit, limit),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      adminService.updateQuestion(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success("Question status updated");
    },
    onError: () => toast.error("Failed to update status")
  });

  const questions = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const localDraftQuestionCount = localDrafts.reduce((sum, draft) => sum + draft.questions.length, 0);

  useEffect(() => {
    setLocalDrafts(readLocalBulkQuestionDrafts());
  }, []);

  const removeLocalDraft = (draftId: string) => {
    const nextDrafts = localDrafts.filter((draft) => draft.id !== draftId);
    setLocalDrafts(nextDrafts);
    writeLocalBulkQuestionDrafts(nextDrafts);
    toast.success("Local draft removed.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200">DRAFT</Badge>;
      case 'REVIEW': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">REVIEW</Badge>;
      case 'VERIFIED': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">VERIFIED</Badge>;
      case 'PUBLISHED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">PUBLISHED</Badge>;
      case 'ARCHIVED': return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">ARCHIVED</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editorial Control Room</h1>
          <p className="text-muted-foreground mt-1">Manage content governance and authoring workflow.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" /> New Question
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-700 p-3 text-white">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Local Draft Bank
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-50">
                Offline UPSC imports ready for review
              </h2>
              <p className="mt-2 text-sm font-medium text-emerald-900/70 dark:text-emerald-100/70">
                These are MCQs saved locally while the backend is offline. They stay attached to subject, day, topic, and batch code.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-700 text-white">{localDraftQuestionCount} local questions</Badge>
            <Link href="/admin/questions/bulk">
              <Button variant="outline" className="gap-2 bg-white/80">
                <UploadCloud className="h-4 w-4" />
                Upload more
              </Button>
            </Link>
          </div>
        </div>

        {localDrafts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-emerald-200 bg-white/70 p-6 text-sm font-semibold text-emerald-900/70 dark:border-emerald-900/60 dark:bg-zinc-950/30 dark:text-emerald-100/70">
            No local drafts yet. Use Bulk Upload with the UPSC template to create the first local batch.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {localDrafts.slice().reverse().map((draft) => {
              const summary = getDraftSummary(draft);
              return (
                <article key={draft.id} className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-zinc-950/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-emerald-300 font-black text-emerald-800 dark:text-emerald-200">
                          {summary.batchCode}
                        </Badge>
                        <Badge variant="secondary" className="font-bold">
                          {draft.importMode}
                        </Badge>
                        <Badge variant="outline" className="font-bold">
                          {draft.questions.length} questions
                        </Badge>
                      </div>
                      <h3 className="truncate text-lg font-black text-zinc-950 dark:text-zinc-50">{summary.topic}</h3>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {summary.subject} Day {summary.day} · {summary.difficulty} · {new Date(draft.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={getDraftRoute(draft)}>
                        <Button size="sm" className="gap-2 bg-emerald-800 hover:bg-emerald-900">
                          <Eye className="h-4 w-4" />
                          Day room
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeLocalDraft(draft.id)}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:bg-zinc-950 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions by text or ID..." 
              className="pl-10 h-10 bg-white dark:bg-zinc-950"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Institutional Governance Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">ID</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Question Content</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32">Status</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Quality</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Freshness</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32">Last Updated</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading questions...</td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No questions found.
                  </td>
                </tr>
              ) : (
                questions.map((q: Question) => (
                  <tr key={q.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 align-top">
                      <span className="text-xs font-mono text-muted-foreground">#{q.id}</span>
                    </td>
                    <td className="p-4 align-top max-w-md">
                      <p className="font-medium line-clamp-2 text-sm leading-relaxed">{q.text_en}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase font-bold text-[9px] tracking-tight">Test {q.test_id}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            (q.explanation_quality_score || 0) > 0.8 ? 'bg-emerald-500' : 
                            (q.explanation_quality_score || 0) > 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span className="text-xs font-medium">{(q.explanation_quality_score || 0) * 100}%</span>
                        </div>
                        {q.bilingual_alignment_score !== undefined && (
                          <span className="text-[10px] text-muted-foreground">Alignment: {Math.round(q.bilingual_alignment_score * 100)}%</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {q.is_current_affairs ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] h-4">CURRENT AFFAIRS</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Static</span>
                      )}
                      {q.content_date && (
                        <p className="text-[9px] mt-1 text-muted-foreground">{new Date(q.content_date).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-[11px] space-y-1">
                        <p className="text-muted-foreground">Updated by System</p>
                        <p className="font-medium">2 mins ago</p>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Workflow Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'REVIEW' })}>
                            <Clock className="w-4 h-4 mr-2 text-amber-500" /> Send to Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'VERIFIED' })}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" /> Verify Content
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'PUBLISHED' })}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Publish Now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" /> Full Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600">
                            Archive Question
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-zinc-50/30 dark:bg-zinc-900/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page * limit) + 1}</span> to <span className="font-medium">{Math.min((page + 1) * limit, total)}</span> of <span className="font-medium">{total}</span> questions
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                <Button 
                  key={i} 
                  variant={page === i ? "default" : "outline"} 
                  size="sm" 
                  className="w-8"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

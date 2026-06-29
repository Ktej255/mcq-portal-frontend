"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2 } from 'lucide-react';
import { adminCmsService, CAItemFormData } from '@/services/api/adminCmsService';

/**
 * Admin CA Item Editor — create new CA item with full structured fields.
 * Route: /admin/cms/new
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 10.2, 10.3, 11.1, 11.2
 */

const SUBJECTS = ['geography', 'economy', 'polity', 'environment', 'science-tech', 'history', 'disaster-mgmt', 'internal-security'];
const GS_PAPERS = ['GS1', 'GS2', 'GS3', 'GS4'];
const EXAM_TYPES = ['prelims', 'mains', 'both'];
const SOURCES = ['official', 'standard', 'secondary'];
const QUESTION_TYPES = ['MULTI_STATEMENT', 'HOW_MANY_CORRECT', 'ASSERTION_REASON', 'NOT_EXCEPTION', 'SCENARIO_APPLIED', 'MATCH_THE_PAIRS', 'DIRECT_RECALL'];

export default function AdminNewItemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('geography');
  const [gsPaper, setGsPaper] = useState('GS1');
  const [examRelevance, setExamRelevance] = useState('both');
  const [videoUrl, setVideoUrl] = useState('');
  const [sourceAuthority, setSourceAuthority] = useState('standard');
  const [relevanceScore, setRelevanceScore] = useState(3);
  const [contentText, setContentText] = useState('');

  // UPSC Statement Frames
  const [prelimsStatements, setPrelimsStatements] = useState(['', '', '']);
  const [mainsAngle, setMainsAngle] = useState('');

  // So-What Analysis
  const [whoBenefits, setWhoBenefits] = useState('');
  const [whoLoses, setWhoLoses] = useState('');
  const [whatChanges, setWhatChanges] = useState('');
  const [upscAngle, setUpscAngle] = useState('');
  const [connectedTopic, setConnectedTopic] = useState('');

  // MCQs
  const [mcqs, setMcqs] = useState<Array<{ question_text: string; question_type: string; options: Array<{ label: string; text: string }>; correct_answer: string; explanation: string }>>([]);

  const addMcq = () => {
    if (mcqs.length >= 10) return;
    setMcqs([...mcqs, {
      question_text: '', question_type: 'MULTI_STATEMENT',
      options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
      correct_answer: 'A', explanation: ''
    }]);
  };

  const removeMcq = (idx: number) => setMcqs(mcqs.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);

    const payload: CAItemFormData = {
      title,
      publish_date: publishDate,
      subject,
      secondary_subjects: [],
      gs_paper: gsPaper,
      exam_relevance: examRelevance,
      video_url: videoUrl || '',
      content_blocks: contentText ? [{ type: 'paragraph', content: contentText }] : [],
      source_authority: sourceAuthority,
      relevance_score: relevanceScore,
      upsc_statement_frames: (prelimsStatements.some(s => s.trim()) || mainsAngle.trim())
        ? { prelims_statements: prelimsStatements.filter(s => s.trim()), mains_angle: mainsAngle }
        : null,
      so_what_analysis: (whoBenefits || whoLoses || whatChanges || upscAngle || connectedTopic)
        ? { who_benefits: whoBenefits, who_loses: whoLoses, what_changes_next: whatChanges, upsc_angle: upscAngle, connected_static_topic: connectedTopic }
        : null,
      mcqs,
      mains_questions: [],
    };

    try {
      const result = await adminCmsService.createItem(payload);
      router.push('/admin/cms');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-[#13251d]">New Current Affairs Item</h1>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        {/* Basic Info */}
        <section className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-4">
          <h2 className="text-sm font-black text-[#13251d]">Basic Information</h2>

          <div>
            <label className="text-[10px] font-black text-[#49675e] uppercase">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-sm" placeholder="Item title..." />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">Date</label>
              <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">GS Paper</label>
              <select value={gsPaper} onChange={e => setGsPaper(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs">
                {GS_PAPERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">Exam Type</label>
              <select value={examRelevance} onChange={e => setExamRelevance(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs">
                {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">Source Authority</label>
              <select value={sourceAuthority} onChange={e => setSourceAuthority(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#49675e] uppercase">Relevance (1-5)</label>
              <input type="number" min={1} max={5} value={relevanceScore} onChange={e => setRelevanceScore(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#49675e] uppercase">Video URL (optional)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs" placeholder="https://..." />
          </div>
        </section>

        {/* Content */}
        <section className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-3">
          <h2 className="text-sm font-black text-[#13251d]">Content</h2>
          <textarea value={contentText} onChange={e => setContentText(e.target.value)} rows={8} className="w-full rounded-lg border border-[#dcd5c7] px-3 py-2 text-sm resize-none" placeholder="Write the news content..." />
        </section>

        {/* UPSC Statement Frames */}
        <section className="rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-5 space-y-3">
          <h2 className="text-sm font-black text-[#7c3aed]">UPSC Statement Frames</h2>
          {prelimsStatements.map((s, i) => (
            <input key={i} value={s} onChange={e => { const arr = [...prelimsStatements]; arr[i] = e.target.value; setPrelimsStatements(arr); }}
              className="w-full rounded-lg border border-[#7c3aed]/20 px-3 py-2 text-xs bg-white" placeholder={`Prelims statement ${i + 1}...`} />
          ))}
          <input value={mainsAngle} onChange={e => setMainsAngle(e.target.value)} className="w-full rounded-lg border border-[#7c3aed]/20 px-3 py-2 text-xs bg-white" placeholder="Mains question angle..." />
        </section>

        {/* So-What Analysis */}
        <section className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-5 space-y-3">
          <h2 className="text-sm font-black text-[#085041]">So-What Analysis</h2>
          <input value={whoBenefits} onChange={e => setWhoBenefits(e.target.value)} className="w-full rounded-lg border border-[#b9d9cd] px-3 py-2 text-xs bg-white" placeholder="Who benefits..." />
          <input value={whoLoses} onChange={e => setWhoLoses(e.target.value)} className="w-full rounded-lg border border-[#b9d9cd] px-3 py-2 text-xs bg-white" placeholder="Who loses..." />
          <input value={whatChanges} onChange={e => setWhatChanges(e.target.value)} className="w-full rounded-lg border border-[#b9d9cd] px-3 py-2 text-xs bg-white" placeholder="What changes next..." />
          <input value={upscAngle} onChange={e => setUpscAngle(e.target.value)} className="w-full rounded-lg border border-[#b9d9cd] px-3 py-2 text-xs bg-white" placeholder="UPSC angle..." />
          <input value={connectedTopic} onChange={e => setConnectedTopic(e.target.value)} className="w-full rounded-lg border border-[#b9d9cd] px-3 py-2 text-xs bg-white" placeholder="Connected static topic..." />
        </section>

        {/* MCQs */}
        <section className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#13251d]">MCQs ({mcqs.length}/10)</h2>
            <button onClick={addMcq} disabled={mcqs.length >= 10} className="flex items-center gap-1 text-xs font-black text-[#1d9e75] disabled:opacity-50">
              <Plus className="h-3 w-3" /> Add MCQ
            </button>
          </div>
          {mcqs.map((mcq, idx) => (
            <div key={idx} className="rounded-lg border border-[#dcd5c7] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#49675e]">MCQ {idx + 1}</span>
                <button onClick={() => removeMcq(idx)} className="text-red-500"><Trash2 className="h-3 w-3" /></button>
              </div>
              <input value={mcq.question_text} onChange={e => { const arr = [...mcqs]; arr[idx].question_text = e.target.value; setMcqs(arr); }}
                className="w-full rounded border border-[#dcd5c7] px-2 py-1.5 text-xs" placeholder="Question text..." />
              <select value={mcq.question_type} onChange={e => { const arr = [...mcqs]; arr[idx].question_type = e.target.value; setMcqs(arr); }}
                className="rounded border border-[#dcd5c7] px-2 py-1 text-[10px]">
                {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {mcq.options.map((opt, oi) => (
                <input key={oi} value={opt.text} onChange={e => { const arr = [...mcqs]; arr[idx].options[oi].text = e.target.value; setMcqs(arr); }}
                  className="w-full rounded border border-[#dcd5c7] px-2 py-1 text-[10px]" placeholder={`Option ${opt.label}...`} />
              ))}
              <div className="flex gap-2">
                <select value={mcq.correct_answer} onChange={e => { const arr = [...mcqs]; arr[idx].correct_answer = e.target.value; setMcqs(arr); }}
                  className="rounded border border-[#dcd5c7] px-2 py-1 text-[10px]">
                  {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input value={mcq.explanation} onChange={e => { const arr = [...mcqs]; arr[idx].explanation = e.target.value; setMcqs(arr); }}
                  className="flex-1 rounded border border-[#dcd5c7] px-2 py-1 text-[10px]" placeholder="Explanation..." />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

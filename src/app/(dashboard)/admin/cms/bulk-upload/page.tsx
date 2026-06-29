"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, FileJson, CheckCircle2, XCircle, ArrowLeft, Download } from 'lucide-react';
import { adminCmsService, BulkImportResult } from '@/services/api/adminCmsService';

/**
 * Admin Bulk Upload — JSON import for multiple CA items at once.
 * Route: /admin/cms/bulk-upload
 *
 * Requirements: 1.7, 10.4
 */

const SAMPLE_JSON = `[
  {
    "title": "India-Japan Semiconductor Pact Signed",
    "publish_date": "2026-06-25",
    "subject": "economy",
    "secondary_subjects": ["science-tech"],
    "gs_paper": "GS3",
    "exam_relevance": "both",
    "video_url": "",
    "content_blocks": [{"type": "paragraph", "content": "India and Japan signed a bilateral agreement..."}],
    "source_authority": "official",
    "relevance_score": 4,
    "upsc_statement_frames": {
      "prelims_statements": ["Statement about semiconductor policy"],
      "mains_angle": "Discuss India's semiconductor strategy"
    },
    "so_what_analysis": {
      "who_benefits": "Indian chip fabrication companies",
      "who_loses": "Chinese suppliers",
      "what_changes_next": "More FDI in semiconductor sector",
      "upsc_angle": "Self-reliance + technology transfer",
      "connected_static_topic": "Make in India, Industrial Policy"
    },
    "mcqs": [
      {
        "question_text": "Which country signed a semiconductor pact with India in 2026?",
        "question_type": "DIRECT_RECALL",
        "options": [{"label": "A", "text": "Japan"}, {"label": "B", "text": "Taiwan"}, {"label": "C", "text": "South Korea"}, {"label": "D", "text": "USA"}],
        "correct_answer": "A",
        "explanation": "India and Japan signed the pact in June 2026."
      }
    ],
    "mains_questions": []
  }
]`;

export default function AdminBulkUploadPage() {
  const [jsonContent, setJsonContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonContent(ev.target?.result as string || '');
      setValidationErrors([]);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    try {
      const items = JSON.parse(jsonContent);
      if (!Array.isArray(items)) { errors.push('JSON must be an array of items'); return false; }
      items.forEach((item: any, idx: number) => {
        if (!item.title) errors.push(`Item ${idx + 1}: missing title`);
        if (!item.publish_date) errors.push(`Item ${idx + 1}: missing publish_date`);
        if (!item.subject) errors.push(`Item ${idx + 1}: missing subject`);
        if (!item.gs_paper) errors.push(`Item ${idx + 1}: missing gs_paper`);
        if (item.mcqs?.length > 10) errors.push(`Item ${idx + 1}: max 10 MCQs`);
        if (item.mains_questions?.length > 3) errors.push(`Item ${idx + 1}: max 3 Mains questions`);
      });
    } catch {
      errors.push('Invalid JSON format');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) return;
    setUploading(true);
    try {
      const items = JSON.parse(jsonContent);
      const res = await adminCmsService.bulkImport(items);
      setResult(res);
    } catch (err: any) {
      setValidationErrors([err?.message || 'Upload failed']);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_JSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ca-bulk-template.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <Link href="/admin/cms" className="flex items-center gap-1.5 text-xs font-semibold text-[#5d675f] hover:text-[#1d9e75]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to CMS
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-[#13251d]">Bulk Upload</h1>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dcd5c7] text-xs font-black text-[#5d675f]">
            <Download className="h-3.5 w-3.5" /> Download Template
          </button>
        </div>

        {/* File drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-[#dcd5c7] bg-white p-10 text-center cursor-pointer hover:border-[#1d9e75] transition-colors"
        >
          <FileJson className="h-10 w-10 text-[#dcd5c7] mx-auto" />
          <p className="mt-3 text-sm font-black text-[#5d675f]">Drop a .json file or click to browse</p>
          <p className="text-[10px] text-[#5d675f] mt-1">Array of CA items with MCQs and Mains questions</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>

        {/* JSON preview */}
        {jsonContent && (
          <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-[#49675e]">JSON Preview</span>
              <span className="text-[10px] text-[#5d675f]">{jsonContent.length} chars</span>
            </div>
            <pre className="text-[10px] text-[#1f2e26] bg-[#f7f4ee] rounded-lg p-3 max-h-[200px] overflow-auto whitespace-pre-wrap">
              {jsonContent.slice(0, 2000)}{jsonContent.length > 2000 ? '...' : ''}
            </pre>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1">
            {validationErrors.map((err, i) => (
              <p key={i} className="text-xs text-red-700 flex items-center gap-1.5">
                <XCircle className="h-3 w-3 flex-shrink-0" /> {err}
              </p>
            ))}
          </div>
        )}

        {/* Upload button */}
        {jsonContent && !result && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Validate & Import'}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-5 space-y-3">
            <h3 className="text-sm font-black text-[#085041]">Import Complete</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                <span className="text-sm font-black text-[#1d9e75]">{result.created} created</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-black text-red-600">{result.failed} failed</span>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1 mt-2">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">Item {err.index + 1}: {err.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

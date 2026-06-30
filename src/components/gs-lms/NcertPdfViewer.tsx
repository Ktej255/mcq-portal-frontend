"use client";

import { useState } from 'react';
import { X, ExternalLink, BookOpen } from 'lucide-react';

/**
 * NcertPdfViewer — Modal overlay that shows NCERT PDF inline on the page.
 * Falls back to Google Docs Viewer if NCERT blocks iframe embedding.
 */

interface NcertPdfViewerProps {
  url: string;
  pageStart?: number;
  bookTitle: string;
  chapter?: string;
  onClose: () => void;
}

export function NcertPdfViewer({ url, pageStart, bookTitle, chapter, onClose }: NcertPdfViewerProps) {
  const [iframeError, setIframeError] = useState(false);

  // Try direct URL first, with page anchor
  const directUrl = pageStart ? `${url}#page=${pageStart}` : url;
  // Fallback: Google Docs Viewer (works when NCERT blocks iframe)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const displayUrl = iframeError ? googleViewerUrl : directUrl;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div
        className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#dcd5c7] bg-[#fef9ec]">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-[#8c5d14] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-black text-[#8c5d14] truncate">{bookTitle}</p>
              {chapter && <p className="text-[10px] text-[#8c5d14]/70">Chapter {chapter}{pageStart ? `, Page ${pageStart}` : ''}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-[#e8d5a8] text-[9px] font-black text-[#8c5d14] hover:bg-[#fef9ec]"
            >
              <ExternalLink className="h-3 w-3" /> Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1a3a2a] text-white text-xs font-black hover:bg-[#085041]"
            >
              <X className="h-3 w-3" /> Close
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative">
          <iframe
            src={displayUrl}
            className="w-full h-full border-0"
            title={`NCERT - ${bookTitle}`}
            onError={() => setIframeError(true)}
          />
          {/* If iframe fails silently (no onError for X-Frame-Options), show fallback after 3s */}
          {!iframeError && (
            <div className="absolute bottom-3 right-3">
              <button
                onClick={() => setIframeError(true)}
                className="px-2 py-1 rounded-md bg-white/90 border border-[#dcd5c7] text-[9px] text-[#5d675f] hover:text-[#1d9e75]"
              >
                PDF not loading? Click here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NcertPdfViewer;

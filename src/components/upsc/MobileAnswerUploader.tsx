"use client";

/**
 * MobileAnswerUploader.tsx
 * Phase 4 — Frictionless Mobile Mains Answer Upload
 *
 * Steps implemented:
 *  4.1  Mobile-optimised camera capture (HTML5 input[capture=environment])
 *  4.2  Auto-stitching: timestamp-ordered thumbnail ribbon, arrow/drag reorder
 *  4.3  POST ordered images to /api/v1/mains-upload/assemble-pdf
 *
 * Design: Organic Warm Academic Theme (#f7f4ee, #13251d, #dcd5c7)
 * No glassmorphism. No external heavy dependencies.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CapturedPage {
  id: string;
  file: File;
  objectUrl: string;
  capturedAt: number; // timestamp ms
  label: string; // "Page 1", "Page 2" …
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; filename: string; pageCount: number; pdfUrl?: string }
  | { status: "error"; message: string };

const SUBJECT_OPTIONS = [
  { value: "gs1", label: "GS-1 (History / Geography / Society)" },
  { value: "gs2", label: "GS-2 (Polity / Governance / IR)" },
  { value: "gs3", label: "GS-3 (Economy / Environment / S&T)" },
  { value: "gs4", label: "GS-4 (Ethics / Integrity / Aptitude)" },
  { value: "essay", label: "Essay Paper" },
  { value: "optional", label: "Optional Subject" },
  { value: "general", label: "General / Practice" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function relabelPages(pages: CapturedPage[]): CapturedPage[] {
  return pages.map((p, i) => ({ ...p, label: `Page ${i + 1}` }));
}

function createThumbnailDataUrl(
  file: File,
  maxW = 300,
  maxH = 400
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(url);
    };
    img.src = url;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ThumbnailCardProps {
  page: CapturedPage;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
  thumbnailUrl: string | null;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function ThumbnailCard({
  page,
  index,
  total,
  isSelected,
  onSelect,
  onMoveLeft,
  onMoveRight,
  onRemove,
  thumbnailUrl,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ThumbnailCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className="thumbnail-card"
      data-selected={isSelected}
      data-dragging={dragging}
      style={{
        flexShrink: 0,
        width: "5.5rem",
        cursor: "grab",
        border: isSelected
          ? "2px solid #13251d"
          : "2px solid #dcd5c7",
        borderRadius: "0.5rem",
        background: "#fffdf8",
        overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s, opacity 0.15s",
        opacity: dragging ? 0.4 : 1,
        boxShadow: isSelected ? "0 0 0 3px rgba(19,37,29,0.12)" : "none",
        userSelect: "none",
      }}
    >
      {/* Image area */}
      <div
        style={{
          height: "5.5rem",
          background: "#f0ece3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={page.label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            draggable={false}
          />
        ) : (
          <Loader2
            style={{ width: "1.25rem", height: "1.25rem", color: "#8a8174", animation: "spin 1s linear infinite" }}
          />
        )}
        {/* Grip handle overlay */}
        <div
          style={{
            position: "absolute",
            top: "0.25rem",
            right: "0.25rem",
            background: "rgba(255,253,248,0.85)",
            borderRadius: "0.25rem",
            padding: "0.1rem",
          }}
        >
          <GripVertical style={{ width: "0.75rem", height: "0.75rem", color: "#8a8174" }} />
        </div>
      </div>

      {/* Label + controls */}
      <div style={{ padding: "0.35rem 0.35rem 0.4rem" }}>
        <p
          style={{
            fontSize: "0.6rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "#13251d",
            textAlign: "center",
            marginBottom: "0.3rem",
          }}
        >
          {page.label}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.2rem" }}>
          <button
            type="button"
            title="Move left"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
            style={{
              flex: 1,
              border: "1px solid #dcd5c7",
              background: "#f7f4ee",
              borderRadius: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem",
              cursor: index === 0 ? "not-allowed" : "pointer",
              opacity: index === 0 ? 0.35 : 1,
            }}
          >
            <ChevronLeft style={{ width: "0.7rem", height: "0.7rem", color: "#13251d" }} />
          </button>
          <button
            type="button"
            title="Move right"
            disabled={index === total - 1}
            onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
            style={{
              flex: 1,
              border: "1px solid #dcd5c7",
              background: "#f7f4ee",
              borderRadius: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem",
              cursor: index === total - 1 ? "not-allowed" : "pointer",
              opacity: index === total - 1 ? 0.35 : 1,
            }}
          >
            <ChevronRight style={{ width: "0.7rem", height: "0.7rem", color: "#13251d" }} />
          </button>
          <button
            type="button"
            title="Remove page"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              flex: 1,
              border: "1px solid #dcd5c7",
              background: "#fff4f4",
              borderRadius: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem",
              cursor: "pointer",
            }}
          >
            <X style={{ width: "0.7rem", height: "0.7rem", color: "#be4444" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MobileAnswerUploaderProps {
  /** If provided, shown as a back link in the header. */
  backHref?: string;
  /** Called after successful upload with the PDF blob URL (may be used by parent). */
  onUploadComplete?: (pdfUrl: string, pageCount: number) => void;
}

export function MobileAnswerUploader({
  backHref,
  onUploadComplete,
}: MobileAnswerUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("general");
  const [questionHint, setQuestionHint] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ── File ingestion ──────────────────────────────────────────────────────────

  const ingestFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // Sort by lastModified then filename for deterministic order
    const sorted = Array.from(fileList).sort((a, b) => {
      const tDiff = (a.lastModified || 0) - (b.lastModified || 0);
      return tDiff !== 0 ? tDiff : a.name.localeCompare(b.name);
    });

    const newPages: CapturedPage[] = sorted.map((file) => ({
      id: generateId(),
      file,
      objectUrl: URL.createObjectURL(file),
      capturedAt: file.lastModified || Date.now(),
      label: "", // will be relabeled
    }));

    setPages((prev) => {
      const combined = relabelPages([...prev, ...newPages]);
      return combined;
    });

    // Generate thumbnails asynchronously
    for (const page of newPages) {
      createThumbnailDataUrl(page.file).then((url) => {
        setThumbnails((prev) => ({ ...prev, [page.id]: url }));
      });
    }

    if (newPages.length > 0) {
      setSelectedId(newPages[newPages.length - 1].id);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ingestFiles(e.target.files);
    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Reorder helpers ─────────────────────────────────────────────────────────

  const movePageLeft = useCallback((index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return relabelPages(next);
    });
  }, []);

  const movePageRight = useCallback((index: number) => {
    setPages((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return relabelPages(next);
    });
  }, []);

  const removePage = useCallback((id: string) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      return relabelPages(next);
    });
    setThumbnails((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  // ── Drag & drop reorder ─────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null);
      setDraggingId(null);
      return;
    }
    setPages((prev) => {
      const srcIdx = prev.findIndex((p) => p.id === sourceId);
      const tgtIdx = prev.findIndex((p) => p.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, removed);
      return relabelPages(next);
    });
    setDragOverId(null);
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDraggingId(null);
  };

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (pages.length === 0) return;
    setUploadState({ status: "uploading", progress: 0 });

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    const url = `${apiBase}/mains-upload/assemble-pdf`;

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("question_hint", questionHint);
    pages.forEach((page) => {
      formData.append("files", page.file, page.file.name);
    });

    // XHR for progress tracking (fetch doesn't give upload progress)
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      // Supabase auth token if available
      const tokenKey = Object.keys(localStorage).find((k) =>
        k.startsWith("sb-") && k.endsWith("-auth-token")
      );
      if (tokenKey) {
        try {
          const parsed = JSON.parse(localStorage.getItem(tokenKey) ?? "{}");
          const token = parsed?.access_token;
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        } catch {
          // ignore parse errors
        }
      }

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 90); // cap at 90 while server processes
          setUploadState({ status: "uploading", progress: pct });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadState({ status: "uploading", progress: 100 });

          // Build a blob URL for in-browser preview/download
          const blob = new Blob([xhr.response], { type: "application/pdf" });
          const pdfUrl = URL.createObjectURL(blob);
          const pageCount = parseInt(xhr.getResponseHeader("X-Page-Count") ?? "0", 10) || pages.length;
          const rawDisp = xhr.getResponseHeader("Content-Disposition") ?? "";
          const fnMatch = rawDisp.match(/filename="([^"]+)"/);
          const filename = fnMatch?.[1] ?? `mains_${subject}.pdf`;

          setUploadState({ status: "success", filename, pageCount, pdfUrl });
          onUploadComplete?.(pdfUrl, pageCount);
          resolve();
        } else {
          let errMsg = `Server error ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText);
            errMsg = body?.detail ?? errMsg;
          } catch {
            // ignore
          }
          setUploadState({ status: "error", message: errMsg });
          resolve();
        }
      };

      xhr.onerror = () => {
        setUploadState({
          status: "error",
          message: "Network error — make sure the backend server is running.",
        });
        resolve();
      };

      xhr.responseType = "arraybuffer";
      xhr.send(formData);
    });
  };

  const handleReset = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    setPages([]);
    setThumbnails({});
    setSelectedId(null);
    setUploadState({ status: "idle" });
    setQuestionHint("");
  };

  // ── Preview of selected page ────────────────────────────────────────────────
  const selectedPage = pages.find((p) => p.id === selectedId) ?? pages[pages.length - 1] ?? null;

  // ── Cleanup object URLs on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Styles (inline, following the Organic Warm Academic Theme) ─────────────

  const shell: React.CSSProperties = {
    minHeight: "100dvh",
    background: "#f7f4ee",
    color: "#13251d",
    fontFamily:
      "'Inter', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const card: React.CSSProperties = {
    background: "#fffdf8",
    border: "1px solid #dcd5c7",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    minHeight: "2.75rem",
    padding: "0 1.25rem",
    background: "#13251d",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "background 0.15s",
  };

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    background: "#f7f4ee",
    color: "#13251d",
    border: "1px solid #dcd5c7",
  };

  const btnCapture: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    minHeight: "7rem",
    width: "100%",
    border: "2px dashed #b8b0a2",
    borderRadius: "0.75rem",
    background: "#fdfaf3",
    color: "#5d6b60",
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    padding: "1rem",
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isUploading = uploadState.status === "uploading";
  const isSuccess = uploadState.status === "success";

  return (
    <div style={shell}>
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: "1px solid #dcd5c7",
          background: "#fffdf8",
          padding: "0.875rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {backHref && (
          <a
            href={backHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
              fontWeight: 900,
              color: "#13251d",
              textDecoration: "none",
              opacity: 0.75,
            }}
          >
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Back
          </a>
        )}
        <div>
          <p
            style={{
              fontSize: "0.6rem",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#1d9e75",
              textTransform: "uppercase",
              marginBottom: "0.1rem",
            }}
          >
            Phase 4 · Mains Upload
          </p>
          <h1
            style={{
              fontSize: "1rem",
              fontWeight: 900,
              color: "#13251d",
              margin: 0,
            }}
          >
            Mains Answer Upload
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "1.25rem 1rem 4rem" }}>

        {/* ── Step 4.1 — Camera capture card ── */}
        <section style={{ ...card, padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Camera style={{ width: "1rem", height: "1rem", color: "#1d9e75" }} />
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                color: "#1d9e75",
                textTransform: "uppercase",
              }}
            >
              Step 1 · Capture Pages
            </p>
          </div>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#13251d",
              marginBottom: "0.5rem",
            }}
          >
            Photograph your answer sheets
          </h2>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#5d675f",
              marginBottom: "1rem",
              lineHeight: 1.6,
            }}
          >
            On mobile, this opens your camera directly. On desktop, it opens a
            file picker. Capture each page in order — or capture all at once and
            reorder below.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="mains-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileChange}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
            aria-label="Capture or select answer sheet images"
          />

          <button
            type="button"
            style={btnCapture}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSuccess}
            onMouseOver={(e) => {
              if (!isUploading && !isSuccess) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#13251d";
                (e.currentTarget as HTMLButtonElement).style.background = "#f0ece3";
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#b8b0a2";
              (e.currentTarget as HTMLButtonElement).style.background = "#fdfaf3";
            }}
          >
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "50%",
                background: "#13251d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera style={{ width: "1.25rem", height: "1.25rem", color: "#fff" }} />
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: 900, color: "#13251d" }}>
              {pages.length === 0 ? "Open Camera / Select Photos" : "Add More Pages"}
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8a8174" }}>
              JPEG · Max 20 MB per image · Up to 30 pages
            </span>
          </button>

          {pages.length > 0 && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#1d9e75",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} />
              {pages.length} page{pages.length !== 1 ? "s" : ""} captured
            </p>
          )}
        </section>

        {/* ── Step 4.2 — Thumbnail ribbon + reorder ── */}
        {pages.length > 0 && (
          <section style={{ ...card, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FileText style={{ width: "1rem", height: "1rem", color: "#1d9e75" }} />
              <p
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  color: "#1d9e75",
                  textTransform: "uppercase",
                }}
              >
                Step 2 · Order Pages
              </p>
            </div>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                color: "#13251d",
                marginBottom: "0.25rem",
              }}
            >
              Arrange your pages
            </h2>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#5d675f",
                marginBottom: "1rem",
                lineHeight: 1.6,
              }}
            >
              Pages are auto-sorted by capture time. Drag to reorder or use the arrows.
              Tap a page to preview it.
            </p>

            {/* Horizontal thumbnail ribbon */}
            <div
              ref={ribbonRef}
              style={{
                display: "flex",
                gap: "0.6rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                paddingTop: "0.25rem",
                scrollbarWidth: "thin",
              }}
            >
              {pages.map((page, idx) => (
                <ThumbnailCard
                  key={page.id}
                  page={page}
                  index={idx}
                  total={pages.length}
                  isSelected={selectedId === page.id || (selectedId === null && idx === pages.length - 1)}
                  onSelect={() => setSelectedId(page.id)}
                  onMoveLeft={() => movePageLeft(idx)}
                  onMoveRight={() => movePageRight(idx)}
                  onRemove={() => removePage(page.id)}
                  thumbnailUrl={thumbnails[page.id] ?? null}
                  dragging={draggingId === page.id}
                  onDragStart={(e) => handleDragStart(e, page.id)}
                  onDragOver={(e) => handleDragOver(e, page.id)}
                  onDrop={(e) => handleDrop(e, page.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}

              {/* Add more button in ribbon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSuccess}
                style={{
                  flexShrink: 0,
                  width: "5.5rem",
                  height: "8.9rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  border: "2px dashed #b8b0a2",
                  borderRadius: "0.5rem",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#8a8174",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                }}
                title="Add more pages"
              >
                <Plus style={{ width: "1.25rem", height: "1.25rem" }} />
                Add page
              </button>
            </div>

            {/* Full-size preview of selected page */}
            {selectedPage && (
              <div
                style={{
                  marginTop: "1rem",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  border: "1px solid #dcd5c7",
                  background: "#f0ece3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "12rem",
                  maxHeight: "26rem",
                }}
              >
                <img
                  src={thumbnails[selectedPage.id] ?? selectedPage.objectUrl}
                  alt={`Preview of ${selectedPage.label}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "26rem",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}
            {selectedPage && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#8a8174",
                  marginTop: "0.5rem",
                }}
              >
                Previewing {selectedPage.label} of {pages.length}
              </p>
            )}
          </section>
        )}

        {/* ── Step 4.3 — Subject + Upload ── */}
        {pages.length > 0 && !isSuccess && (
          <section style={{ ...card, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Upload style={{ width: "1rem", height: "1rem", color: "#1d9e75" }} />
              <p
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  color: "#1d9e75",
                  textTransform: "uppercase",
                }}
              >
                Step 3 · Upload
              </p>
            </div>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                color: "#13251d",
                marginBottom: "0.75rem",
              }}
            >
              Label & submit
            </h2>

            {/* Subject selector */}
            <label
              htmlFor="mains-subject"
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 900,
                letterSpacing: "0.14em",
                color: "#13251d",
                textTransform: "uppercase",
                marginBottom: "0.35rem",
              }}
            >
              Subject
            </label>
            <select
              id="mains-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isUploading}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #dcd5c7",
                borderRadius: "0.5rem",
                background: "#fdfaf3",
                color: "#13251d",
                fontSize: "0.875rem",
                fontWeight: 700,
                marginBottom: "0.875rem",
                outline: "none",
              }}
            >
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Question hint */}
            <label
              htmlFor="mains-question-hint"
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 900,
                letterSpacing: "0.14em",
                color: "#13251d",
                textTransform: "uppercase",
                marginBottom: "0.35rem",
              }}
            >
              Question hint <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
            </label>
            <input
              id="mains-question-hint"
              type="text"
              value={questionHint}
              onChange={(e) => setQuestionHint(e.target.value)}
              disabled={isUploading}
              placeholder="e.g. Q3 — Discuss the role of judiciary …"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #dcd5c7",
                borderRadius: "0.5rem",
                background: "#fdfaf3",
                color: "#13251d",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1.25rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Upload summary */}
            <div
              style={{
                background: "#f0ece3",
                border: "1px solid #dcd5c7",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <BookOpen style={{ width: "1.25rem", height: "1.25rem", color: "#13251d", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 900, color: "#13251d", marginBottom: "0.15rem" }}>
                  Ready to assemble PDF
                </p>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#5d675f" }}>
                  {pages.length} page{pages.length !== 1 ? "s" : ""} ·{" "}
                  {SUBJECT_OPTIONS.find((o) => o.value === subject)?.label}
                  {questionHint ? ` · ${questionHint}` : ""}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#5d675f",
                    marginBottom: "0.35rem",
                  }}
                >
                  <span>Uploading & assembling PDF…</span>
                  <span>{uploadState.progress}%</span>
                </div>
                <div
                  style={{
                    height: "0.5rem",
                    background: "#e8e2d8",
                    borderRadius: "1rem",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadState.progress}%`,
                      background: "#13251d",
                      borderRadius: "1rem",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {uploadState.status === "error" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#fff4f4",
                  border: "1px solid #f5c6c6",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <AlertCircle
                  style={{ width: "1rem", height: "1rem", color: "#be4444", flexShrink: 0, marginTop: "0.1rem" }}
                />
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#7a2020", margin: 0 }}>
                  {uploadState.message}
                </p>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                id="mains-upload-submit"
                type="button"
                onClick={handleUpload}
                disabled={isUploading || pages.length === 0}
                style={{
                  ...btnPrimary,
                  flex: 1,
                  minWidth: "12rem",
                  opacity: isUploading || pages.length === 0 ? 0.6 : 1,
                  cursor: isUploading || pages.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2
                      style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }}
                    />
                    Assembling…
                  </>
                ) : (
                  <>
                    <Upload style={{ width: "1rem", height: "1rem" }} />
                    Upload All ({pages.length} page{pages.length !== 1 ? "s" : ""})
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                style={{
                  ...btnSecondary,
                  opacity: isUploading ? 0.5 : 1,
                  cursor: isUploading ? "not-allowed" : "pointer",
                }}
              >
                <Trash2 style={{ width: "0.9rem", height: "0.9rem" }} />
                Clear
              </button>
            </div>
          </section>
        )}

        {/* ── Success screen ── */}
        {isSuccess && uploadState.status === "success" && (
          <section
            style={{
              ...card,
              padding: "1.75rem 1.25rem",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                background: "#e7f5ee",
                border: "2px solid #1d9e75",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <CheckCircle2 style={{ width: "1.5rem", height: "1.5rem", color: "#1d9e75" }} />
            </div>
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                color: "#1d9e75",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Upload complete
            </p>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 900,
                color: "#13251d",
                marginBottom: "0.5rem",
              }}
            >
              PDF assembled successfully
            </h2>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#5d675f", marginBottom: "1.5rem" }}>
              {uploadState.pageCount} page{uploadState.pageCount !== 1 ? "s" : ""} assembled into{" "}
              <strong style={{ color: "#13251d" }}>{uploadState.filename}</strong>. Your answer is
              ready for AI evaluation.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              {uploadState.pdfUrl && (
                <a
                  href={uploadState.pdfUrl}
                  download={uploadState.filename}
                  style={{ ...btnPrimary, textDecoration: "none" }}
                >
                  <FileText style={{ width: "1rem", height: "1rem" }} />
                  Download PDF
                </a>
              )}
              <button
                id="mains-upload-again"
                type="button"
                onClick={handleReset}
                style={btnSecondary}
              >
                <Camera style={{ width: "1rem", height: "1rem" }} />
                Upload Another Answer
              </button>
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {pages.length === 0 && uploadState.status === "idle" && (
          <div
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              color: "#8a8174",
            }}
          >
            <BookOpen
              style={{
                width: "2.5rem",
                height: "2.5rem",
                margin: "0 auto 1rem",
                color: "#c5bfb5",
              }}
            />
            <p style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.35rem", color: "#5d675f" }}>
              No pages captured yet
            </p>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.6 }}>
              Tap <strong>"Open Camera"</strong> above to start photographing your
              answer sheet pages.
            </p>
          </div>
        )}
      </div>

      {/* ── Global keyframe for spinner ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .thumbnail-card:active { cursor: grabbing; }
      `}</style>
    </div>
  );
}

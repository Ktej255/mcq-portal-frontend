/**
 * /upsc/answer-upload
 * Phase 4 — Frictionless Mobile Mains Answer Upload page
 */

import type { Metadata } from "next";
import { MobileAnswerUploader } from "@/components/upsc/MobileAnswerUploader";

export const metadata: Metadata = {
  title: "Mains Answer Upload | UPSC Command",
  description:
    "Photograph your UPSC mains answer sheets, order the pages, and upload them in a single tap for AI evaluation.",
};

export default function AnswerUploadPage() {
  return (
    <MobileAnswerUploader backHref="/upsc/daily-command" />
  );
}

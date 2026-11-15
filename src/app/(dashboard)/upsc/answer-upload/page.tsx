/**
 * /upsc/answer-upload
 * Phase 4 — Frictionless Mobile Mains Answer Upload page
 */

import type { Metadata } from "next";
import { MobileAnswerUploader } from "@/components/upsc/MobileAnswerUploader";

export const metadata: Metadata = {
  title: "Mains Answer Upload | UPSC Command",
  description:
    "Photograph your UPSC mains answer sheets, order the pages, and assemble them into a single downloadable PDF to review or share. Scored typed practice lives in each topic's Mains step.",
};

export default function AnswerUploadPage() {
  return (
    <MobileAnswerUploader backHref="/upsc/daily-command" />
  );
}

"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import { BrainDumpModal } from "@/components/upsc/BrainDumpModal";

/**
 * Floating Brain Dump button — sits in the bottom-right corner
 * of the student dashboard. Opens the BrainDumpModal on click.
 */
export function BrainDumpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Brain Dump — speak your mind"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1d9e75]/30 bg-[#1a3a2a] text-white shadow-lg shadow-[#1a3a2a]/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#1a3a2a]/30 active:scale-95"
      >
        <BrainCircuit className="h-6 w-6" />
      </button>
      <BrainDumpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

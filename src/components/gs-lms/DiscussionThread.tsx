"use client";

import type { DiscussionTurnOut } from "@/services/api/gsLmsService";

interface DiscussionThreadProps {
  turns: DiscussionTurnOut[];
}

export function DiscussionThread({ turns }: DiscussionThreadProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {turns.map((turn) => {
        const isStudent = turn.role === "student";
        return (
          <div
            key={turn.turn_order}
            className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm leading-relaxed ${
                isStudent
                  ? "bg-[#1d9e75] text-white rounded-br-md"
                  : "bg-[#f7f4ee] text-[#13251d] rounded-bl-md border border-[#dcd5c7]"
              }`}
            >
              {turn.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

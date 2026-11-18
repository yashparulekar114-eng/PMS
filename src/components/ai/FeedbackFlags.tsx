"use client";

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { checkFeedback, type FlagKind } from "@/lib/ai/feedback-checker";

const KIND_LABEL: Record<FlagKind, string> = {
  gendered_language: "Wording",
  personal_reference: "Personal",
  vague_feedback: "Vague",
  rating_mismatch: "Rating",
};

// Inline wording flags for a manager's comment. Advisory only: it does not block typing or submitting.
export function FeedbackFlags({ text, rating }: { text: string; rating: number | null }) {
  const flags = checkFeedback(text, rating);
  if (flags.length === 0) return null;

  return (
    <ul className="space-y-1">
      {flags.map((flag, index) => {
        const tone =
          flag.severity === "high"
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : flag.severity === "medium"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-slate-50 text-slate-700";
        const Icon = flag.severity === "low" ? Info : AlertTriangle;
        return (
          <li key={`${flag.kind}-${index}`} className={`flex gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${tone}`}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="uppercase tracking-wide">{KIND_LABEL[flag.kind]}:</strong> {flag.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

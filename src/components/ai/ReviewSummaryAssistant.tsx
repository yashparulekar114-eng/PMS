"use client";

import React, { useState } from "react";
import { CheckCircle2, Link2, Loader2, Sparkles } from "lucide-react";
import { joinSummaryPoints, type SummaryGoal, type SummaryPoint } from "@/lib/ai/review-summary";

interface ReviewSummaryAssistantProps {
  employeeName: string;
  cycleName: string;
  overallManagerRating: number | null;
  goals: SummaryGoal[];
  hasExistingText: boolean;
  onInsert: (text: string) => void;
}

// Drafts the certificate summary. Every point is linked to the goal(s) it is based on, and the manager picks which points to keep.
export function ReviewSummaryAssistant({
  employeeName,
  cycleName,
  overallManagerRating,
  goals,
  hasExistingText,
  onInsert,
}: ReviewSummaryAssistantProps) {
  const [points, setPoints] = useState<SummaryPoint[] | null>(null);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [source, setSource] = useState<"llm" | "template" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const titleOf = (id: string) => goals.find((g) => g.id === id)?.title ?? "Unknown goal";

  const generate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/review-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName, cycleName, overallManagerRating, goals }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.points)) {
        setMessage(data.error || "The assistant could not draft a summary right now.");
        return;
      }
      setPoints(data.points as SummaryPoint[]);
      setIncluded((data.points as SummaryPoint[]).map(() => true));
      setSource(data.source === "llm" ? "llm" : "template");
      setMessage(data.message ?? null);
    } catch {
      setMessage("The assistant could not be reached. Write the summary manually.");
    } finally {
      setLoading(false);
    }
  };

  const insert = () => {
    if (!points) return;
    const chosen = points.filter((_, i) => included[i]);
    if (chosen.length === 0) return;
    if (hasExistingText && !confirm("Replace the current summary text with this draft?")) return;
    onInsert(joinSummaryPoints(chosen));
    setPoints(null);
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Sparkles className="w-3.5 h-3.5" />
            Review Summary Assistant
          </p>
          <p className="text-[11px] text-slate-500">
            Drafts the paragraph printed on the certificate. Each point is linked to its goal. Nothing is inserted until you choose.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Drafting..." : points ? "Redraft" : "Draft summary"}
        </button>
      </div>

      {message && <p className="text-[11px] text-slate-600">{message}</p>}

      {points && (
        <div className="space-y-2">
          {points.map((point, index) => (
            <label
              key={`${index}-${point.text.slice(0, 20)}`}
              className="flex gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={included[index] ?? false}
                onChange={(e) => setIncluded(included.map((v, i) => (i === index ? e.target.checked : v)))}
                className="mt-0.5"
              />
              <span className="flex-1 space-y-1.5">
                <span className="block leading-relaxed">{point.text}</span>
                <span className="flex flex-wrap gap-1.5">
                  {point.goalIds.length === 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">Overall</span>
                  ) : (
                    point.goalIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                      >
                        <Link2 className="w-3 h-3" />
                        {titleOf(id)}
                      </span>
                    ))
                  )}
                </span>
              </span>
            </label>
          ))}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[10px] text-slate-500">
              {source === "llm" ? "Drafted by Claude." : "Rule-based draft."} You can edit the text after inserting.
            </span>
            <button
              type="button"
              onClick={insert}
              disabled={!included.some(Boolean)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Insert selected points
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

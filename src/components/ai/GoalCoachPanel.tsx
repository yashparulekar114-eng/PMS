"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { analyzeGoal, type ExistingGoal, type GoalSuggestion } from "@/lib/ai/goal-coach";

interface GoalCoachPanelProps {
  title: string;
  description: string;
  targetDate: string;
  existingGoals: ExistingGoal[];
  excludeGoalId?: string;
  onAccept: (suggestion: { title: string; description: string }) => void;
}

// Checks run instantly in the browser. The AI rewrite is requested only on click, and the employee accepts or ignores it.
export function GoalCoachPanel({
  title,
  description,
  targetDate,
  existingGoals,
  excludeGoalId,
  onAccept,
}: GoalCoachPanelProps) {
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!title.trim()) return null;

  const analysis = analyzeGoal({ title, description, targetDate }, existingGoals, excludeGoalId);
  const looksSmart = analysis.issues.length === 0 && analysis.duplicates.length === 0;
  const hasPlaceholder = suggestion ? /\[[^\]]+\]/.test(`${suggestion.title} ${suggestion.description}`) : false;

  const requestRewrite = async () => {
    setLoading(true);
    setNotice(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/ai/goal-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          targetDate,
          issues: analysis.issues,
          existingTitles: existingGoals.map((g) => g.title).slice(0, 50),
        }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion as GoalSuggestion);
      } else {
        setNotice(data.message || "No rewrite is available right now.");
      }
    } catch {
      setNotice("The coach could not be reached. Your goal is unchanged.");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!suggestion) return;
    onAccept({ title: suggestion.title, description: suggestion.description });
    setSuggestion(null);
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-indigo-900">
          <Sparkles className="w-3.5 h-3.5" />
          SMART Goal Coach
        </span>
        {looksSmart && (
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Looks SMART
          </span>
        )}
      </div>

      {analysis.duplicates.map((d) => (
        <div key={d.goalId} className="flex gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Similar to &quot;{d.title}&quot; ({Math.round(d.similarity * 100)}% match). Change the wording if this goal
            measures something different.
          </span>
        </div>
      ))}

      {analysis.issues.length > 0 && (
        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
          {analysis.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={requestRewrite}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Thinking..." : "Suggest SMART rewrite"}
        </button>
        <span className="text-[10px] text-slate-500">Suggestions are never saved automatically.</span>
      </div>

      {notice && <p className="text-slate-600">{notice}</p>}

      {suggestion && (
        <div className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2">
          <p className="font-semibold text-slate-900">{suggestion.title}</p>
          <p className="text-slate-700 leading-relaxed">{suggestion.description}</p>
          {suggestion.rationale && <p className="italic text-slate-500">{suggestion.rationale}</p>}
          {hasPlaceholder && (
            <p className="text-amber-700">Replace the [bracketed] placeholders before you save the goal.</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Ignore
            </button>
            <button
              type="button"
              onClick={accept}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

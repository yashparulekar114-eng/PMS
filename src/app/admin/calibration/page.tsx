"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import {
  analyzeCalibration,
  toPromptSafeStats,
  type AgendaSection,
  type CalibrationAnalysis,
  type CalibrationLabel,
  type CalibrationRow,
} from "@/lib/ai/calibration";
import { Loader2, Scale, ShieldAlert, Sparkles } from "lucide-react";

const LABEL_TEXT: Record<CalibrationLabel, string> = {
  lenient: "Lenient",
  harsh: "Harsh",
  central_tendency: "Central tendency",
  typical: "Typical",
  insufficient_data: "Too few ratings",
};

const LABEL_STYLE: Record<CalibrationLabel, string> = {
  lenient: "bg-amber-100 text-amber-800",
  harsh: "bg-sky-100 text-sky-800",
  central_tendency: "bg-violet-100 text-violet-800",
  typical: "bg-emerald-100 text-emerald-800",
  insufficient_data: "bg-slate-100 text-slate-600",
};

export default function CalibrationPage() {
  const { role } = useAuth();
  const [analysis, setAnalysis] = useState<CalibrationAnalysis | null>(null);
  const [cycleName, setCycleName] = useState<string>("");
  const [agenda, setAgenda] = useState<AgendaSection[] | null>(null);
  const [agendaNote, setAgendaNote] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [drafting, setDrafting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Read-only load: reviews are listed without creating rows, and nothing is written back.
  useEffect(() => {
    if (role !== "hr_admin") {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const cycle = await dataStore.getActiveCycle();
        if (!cycle) {
          setError("No active review cycle.");
          return;
        }
        const employees = await dataStore.getEmployees();
        const byId = new Map(employees.map((e) => [e.id, e]));
        const reviews = await dataStore.getReviewsForCycle(cycle.id);

        const rows: CalibrationRow[] = [];
        for (const review of reviews) {
          if (review.status !== "manager_reviewed" && review.status !== "completed") continue;
          if (review.overall_manager_rating === null || review.overall_manager_rating === undefined) continue;
          const managerId = review.manager_id || byId.get(review.employee_id)?.manager_id || null;
          if (!managerId) continue;
          rows.push({
            employeeId: review.employee_id,
            managerId,
            managerName: byId.get(managerId)?.full_name ?? "Unknown manager",
            managerRating: Number(review.overall_manager_rating),
          });
        }

        setCycleName(cycle.name);
        setAnalysis(analyzeCalibration(rows));
        setAgenda(null);
      } catch {
        setError("Calibration data could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  // Maps M1, M2... back to names in the browser. The server only ever sees the references.
  const refNames = useMemo(() => {
    if (!analysis) return {} as Record<string, string>;
    const { refToManagerId } = toPromptSafeStats(analysis, cycleName);
    const names: Record<string, string> = {};
    for (const [ref, managerId] of Object.entries(refToManagerId)) {
      names[ref] = analysis.managers.find((m) => m.managerId === managerId)?.managerName ?? ref;
    }
    return names;
  }, [analysis, cycleName]);

  const displayName = (text: string) => text.replace(/\bM\d+\b/g, (ref) => refNames[ref] ?? ref);

  const draftAgenda = async () => {
    if (!analysis) return;
    setDrafting(true);
    setAgendaNote(null);
    try {
      const { stats } = toPromptSafeStats(analysis, cycleName);
      const res = await fetch("/api/ai/calibration-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.sections)) {
        setError(data.error || "The agenda could not be drafted.");
        return;
      }
      setAgenda(data.sections as AgendaSection[]);
      setAgendaNote(data.message ?? (data.source === "llm" ? "Drafted by Claude from anonymised figures." : null));
    } catch {
      setError("The agenda service could not be reached.");
    } finally {
      setDrafting(false);
    }
  };

  if (role !== "hr_admin") {
    return (
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">Access restricted</h1>
        <p className="text-sm text-slate-600">Calibration analysis is available to HR administrators only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        Loading calibration data...
      </div>
    );
  }

  const flagged = analysis?.managers.filter((m) => m.label === "lenient" || m.label === "harsh" || m.label === "central_tendency") ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Calibration Analyst</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Read-only</span>
        </div>
        <p className="text-xs text-slate-500">
          Compares managers&apos; overall ratings in {cycleName || "the active cycle"}. It shows patterns to discuss. It does not change any rating.
          Managers with fewer than 3 ratings are not flagged.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

      {analysis && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Manager ratings analysed" value={String(analysis.reviewsWithRatings)} />
            <Stat label="Company average" value={analysis.companyMean === null ? "—" : analysis.companyMean.toFixed(2)} />
            <Stat label="Spread (std. dev.)" value={analysis.companyStdev === null ? "—" : analysis.companyStdev.toFixed(2)} />
            <Stat label="Managers flagged" value={String(flagged.length)} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Manager</th>
                  <th className="px-4 py-3 text-right">Ratings</th>
                  <th className="px-4 py-3 text-right">Average</th>
                  <th className="px-4 py-3 text-right">Spread</th>
                  <th className="px-4 py-3 text-right">Share 4★+</th>
                  <th className="px-4 py-3 text-right">Share 2★ or less</th>
                  <th className="px-4 py-3 text-right">vs company</th>
                  <th className="px-4 py-3 text-left">Reading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.managers.map((m) => (
                  <tr key={m.managerId}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.managerName}</td>
                    <td className="px-4 py-3 text-right">{m.n}</td>
                    <td className="px-4 py-3 text-right">{m.mean ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{m.stdev ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{m.share4plus === null ? "—" : `${Math.round(m.share4plus * 100)}%`}</td>
                    <td className="px-4 py-3 text-right">{m.share2orLess === null ? "—" : `${Math.round(m.share2orLess * 100)}%`}</td>
                    <td className="px-4 py-3 text-right">{m.deltaVsCompany === null ? "—" : (m.deltaVsCompany > 0 ? `+${m.deltaVsCompany}` : `${m.deltaVsCompany}`)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${LABEL_STYLE[m.label]}`}>
                        {LABEL_TEXT[m.label]}
                      </span>
                    </td>
                  </tr>
                ))}
                {analysis.managers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No manager ratings have been submitted for this cycle yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Calibration meeting agenda</h2>
                <p className="text-xs text-slate-500">
                  Drafted from anonymised figures only. Items are questions to discuss, not conclusions.
                </p>
              </div>
              <button
                type="button"
                onClick={draftAgenda}
                disabled={drafting || analysis.managers.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {drafting ? "Drafting..." : agenda ? "Redraft agenda" : "Draft agenda"}
              </button>
            </div>

            {agendaNote && <p className="text-[11px] text-slate-500">{agendaNote}</p>}

            {agenda && (
              <div className="space-y-4">
                {agenda.map((section) => (
                  <div key={section.title} className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {section.items.map((item, i) => (
                        <li key={`${section.title}-${i}`}>{displayName(item)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

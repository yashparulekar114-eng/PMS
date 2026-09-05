"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { Employee, ReviewCycle, Review, Goal, GoalRating } from "@/types";
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Star,
  Sparkles,
  Send,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.employeeId as string;
  const { user } = useAuth();

  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalRatings, setGoalRatings] = useState<GoalRating[]>([]);
  const [loading, setLoading] = useState(true);

  // Manager Form State
  const [managerRatingsState, setManagerRatingsState] = useState<{
    [goalId: string]: { manager_comment: string; manager_rating: number };
  }>({});
  const [overallManagerRating, setOverallManagerRating] = useState<number>(4.5);
  const [managerSummary, setManagerSummary] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReviewDetails = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const cycle = await dataStore.getActiveCycle();
      setActiveCycle(cycle);

      const emp = await dataStore.getEmployeeById(employeeId);
      setEmployee(emp);

      if (cycle && emp) {
        const rev = await dataStore.getOrCreateReview(emp.id, cycle.id, user?.id);
        setReview(rev);

        const allGoals = await dataStore.getGoals(emp.id, cycle.id);
        setGoals(allGoals);

        const ratings = await dataStore.getGoalRatings(rev.id);
        setGoalRatings(ratings);

        // Prepopulate manager form
        const initialForm: { [goalId: string]: { manager_comment: string; manager_rating: number } } = {};
        allGoals.forEach((g) => {
          const match = ratings.find((r) => r.goal_id === g.id);
          initialForm[g.id] = {
            manager_comment: match?.manager_comment || "",
            manager_rating: match?.manager_rating ? Number(match.manager_rating) : 4,
          };
        });
        setManagerRatingsState(initialForm);

        if (rev.overall_manager_rating) {
          setOverallManagerRating(Number(rev.overall_manager_rating));
        }
        if (rev.manager_summary) {
          setManagerSummary(rev.manager_summary);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewDetails();
  }, [employeeId, user]);

  const handleSubmitManagerEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review || !managerSummary.trim()) {
      alert("Please provide an overall manager summary evaluation.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = goals.map((g) => ({
        goal_id: g.id,
        manager_comment: managerRatingsState[g.id]?.manager_comment || "Evaluated by manager.",
        manager_rating: managerRatingsState[g.id]?.manager_rating || 4,
      }));

      await dataStore.submitManagerReview(
        review.id,
        payload,
        overallManagerRating,
        managerSummary
      );

      setSuccessMsg("Manager review completed and finalized successfully!");
      await fetchReviewDetails();
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = review?.status === "completed";

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team Overview
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Appraisal Review: {employee?.full_name || "Employee"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Side-by-Side Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {employee?.designation} • {employee?.department} • Cycle: <span className="font-semibold text-slate-700">{activeCycle?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Review Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                review?.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : review?.status === "self_appraisal_submitted"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {review?.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Main Side-by-Side Review Workspace */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          Loading appraisal data...
        </div>
      ) : (
        <form onSubmit={handleSubmitManagerEvaluation} className="space-y-6">
          {/* Dual-Column Header Banner */}
          <div className="hidden md:grid grid-cols-2 gap-6 bg-slate-900 text-white p-4 rounded-2xl text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Employee Self-Appraisal (Left View)
            </div>
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Manager Review & Ratings (Right View)
            </div>
          </div>

          {/* Goal by Goal Side-by-Side Cards */}
          <div className="space-y-6">
            {goals.map((goal, idx) => {
              const rating = goalRatings.find((r) => r.goal_id === goal.id);
              return (
                <div
                  key={goal.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
                >
                  {/* Goal Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{goal.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                      Weightage: {goal.weightage}%
                    </span>
                  </div>

                  {/* Dual Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* LEFT COLUMN: Employee Self-Appraisal */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Employee Self-Evaluation
                        </span>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Self-Rating: {rating?.self_rating || "—"} / 5.0
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200/80 min-h-[90px]">
                        {rating?.self_comment || (
                          <span className="text-slate-400 italic">No self-reflection submitted yet.</span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Manager Input */}
                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                          Manager Evaluation
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-indigo-900">Rating:</label>
                          <select
                            disabled={isCompleted}
                            value={managerRatingsState[goal.id]?.manager_rating || 4}
                            onChange={(e) =>
                              setManagerRatingsState({
                                ...managerRatingsState,
                                [goal.id]: {
                                  ...managerRatingsState[goal.id],
                                  manager_rating: Number(e.target.value),
                                },
                              })
                            }
                            className="text-xs font-bold px-2 py-1 border border-indigo-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                          >
                            <option value="1">1 — Unsatisfactory</option>
                            <option value="2">2 — Developing</option>
                            <option value="3">3 — Meets Expectations</option>
                            <option value="4">4 — Exceeds Expectations</option>
                            <option value="5">5 — Exceptional</option>
                          </select>
                        </div>
                      </div>

                      <textarea
                        required
                        disabled={isCompleted}
                        rows={3}
                        value={managerRatingsState[goal.id]?.manager_comment || ""}
                        onChange={(e) =>
                          setManagerRatingsState({
                            ...managerRatingsState,
                            [goal.id]: {
                              ...managerRatingsState[goal.id],
                              manager_comment: e.target.value,
                            },
                          })
                        }
                        placeholder="Provide manager appraisal feedback for this goal..."
                        className="w-full text-xs px-3.5 py-2.5 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Manager Summary & Rating Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Final Manager Summary & Overall Score</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800">Overall Manager Rating (1–5 Scale)</div>
                <p className="text-xs text-slate-500">Holistic performance evaluation for the annual cycle</p>
              </div>
              <div className="flex items-center justify-start md:justify-end">
                <select
                  disabled={isCompleted}
                  value={overallManagerRating}
                  onChange={(e) => setOverallManagerRating(Number(e.target.value))}
                  className="px-4 py-2 text-sm font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                >
                  <option value="1">1.0 — Unsatisfactory</option>
                  <option value="2">2.0 — Developing</option>
                  <option value="3">3.0 — Meets Expectations</option>
                  <option value="4">4.0 — Exceeds Expectations</option>
                  <option value="4.5">4.5 — High Performer</option>
                  <option value="5">5.0 — Exceptional Performer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Executive Manager Summary & Promotion / Growth Recommendations *
              </label>
              <textarea
                required
                disabled={isCompleted}
                rows={4}
                value={managerSummary}
                onChange={(e) => setManagerSummary(e.target.value)}
                placeholder="Summarize key achievements, strengths, areas for development, and promotion readiness..."
                className="w-full text-xs px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>

            {!isCompleted && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? "Finalizing Review..." : "Complete & Finalize Review"}
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

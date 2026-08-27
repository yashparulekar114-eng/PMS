"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { Goal, Employee, ReviewCycle } from "@/types";
import {
  Target,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function TeamGoalsApprovalPage() {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [reportsGoals, setReportsGoals] = useState<
    Array<{
      employee: Employee;
      goals: Goal[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [feedbackInputs, setFeedbackInputs] = useState<{ [goalId: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cycle = await dataStore.getActiveCycle();
      setActiveCycle(cycle);

      if (cycle) {
        const directReports = await dataStore.getDirectReports(user.id);
        const list = [];

        for (const rep of directReports) {
          const goals = await dataStore.getGoals(rep.id, cycle.id);
          list.push({
            employee: rep,
            goals,
          });
        }

        setReportsGoals(list);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleApprove = async (goalId: string) => {
    const comment = feedbackInputs[goalId] || "Approved by manager.";
    setProcessingId(goalId);
    try {
      await dataStore.approveGoal(goalId, comment);
      await fetchGoals();
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendBack = async (goalId: string) => {
    const comment = feedbackInputs[goalId];
    if (!comment) {
      alert("Please enter a feedback comment explaining why the goal is being sent back.");
      return;
    }

    setProcessingId(goalId);
    try {
      await dataStore.sendBackGoal(goalId, comment);
      await fetchGoals();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
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
              <h1 className="text-2xl font-bold text-slate-900">Direct Reports' Goal Approvals</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Manager Review
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Approve submitted goals or send them back with actionable feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Goals List */}
      <div className="space-y-8">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading direct report goals...
          </div>
        ) : reportsGoals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Target className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No Direct Reports Found</h3>
          </div>
        ) : (
          reportsGoals.map(({ employee, goals }) => {
            const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
            return (
              <div key={employee.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Employee Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{employee.full_name}</h2>
                    <p className="text-xs text-slate-500">{employee.designation} • {employee.department}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600">Total Goal Weightage:</span>
                    <span
                      className={`text-sm font-extrabold px-2.5 py-0.5 rounded-md ${
                        totalWeightage === 100
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {totalWeightage}% / 100%
                    </span>
                  </div>
                </div>

                {/* Goals Breakdown */}
                {goals.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                    This employee has not added any goals for this cycle yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal, idx) => (
                      <div
                        key={goal.id}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{goal.title}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                              Weightage: {goal.weightage}%
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                goal.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : goal.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : goal.status === "sent_back"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {goal.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/60">
                            {goal.description}
                          </p>
                        )}

                        {/* Feedback & Actions */}
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                          <div className="w-full sm:w-2/3">
                            <input
                              type="text"
                              placeholder="Manager comment or revision feedback..."
                              value={feedbackInputs[goal.id] !== undefined ? feedbackInputs[goal.id] : goal.manager_comment || ""}
                              onChange={(e) =>
                                setFeedbackInputs({ ...feedbackInputs, [goal.id]: e.target.value })
                              }
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleSendBack(goal.id)}
                              disabled={processingId === goal.id}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Send Back
                            </button>
                            <button
                              onClick={() => handleApprove(goal.id)}
                              disabled={processingId === goal.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Goal
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

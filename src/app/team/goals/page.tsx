"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  Plus,
  X,
  RefreshCw,
  AlertCircle,
  Check,
  Send,
  UserCheck,
  Bell,
} from "lucide-react";

export default function TeamGoalsApprovalPage() {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [reportsGoals, setReportsGoals] = useState<
    Array<{
      employee: Employee;
      goals: Goal[];
    }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackInputs, setFeedbackInputs] = useState<{ [goalId: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Assign Goal to Subordinate Modal State
  const [assignModalEmployee, setAssignModalEmployee] = useState<Employee | null>(null);
  const [assignTitle, setAssignTitle] = useState<string>("");
  const [assignDesc, setAssignDesc] = useState<string>("");
  const [assignWeightage, setAssignWeightage] = useState<string>("25");
  const [assignTargetDate, setAssignTargetDate] = useState<string>("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<boolean>(false);

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

  // Open Goal Assignment Modal
  const handleOpenAssignModal = (employee: Employee, currentGoals: Goal[]) => {
    const totalAllocated = currentGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
    const remaining = Math.max(0, 100 - totalAllocated);

    setAssignModalEmployee(employee);
    setAssignTitle("");
    setAssignDesc("");
    setAssignWeightage(remaining > 0 ? String(Math.min(remaining, 25)) : "0");
    setAssignTargetDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setAssignError(null);
  };

  // Submit Goal for Subordinate
  const handleCreateSubordinateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignModalEmployee) return;

    if (!assignTitle.trim()) {
      setAssignError("Please enter a goal title.");
      return;
    }

    const weightNum = Number(assignWeightage);
    if (isNaN(weightNum) || weightNum <= 0) {
      setAssignError("Weightage must be a positive number.");
      return;
    }

    const currentEmpData = reportsGoals.find((r) => r.employee.id === assignModalEmployee.id);
    const existingWeight = (currentEmpData?.goals || []).reduce((sum, g) => sum + Number(g.weightage), 0);

    if (existingWeight + weightNum > 100) {
      setAssignError(`Goal weightage (${weightNum}%) exceeds available capacity (${100 - existingWeight}%). Total cannot exceed 100%.`);
      return;
    }

    setAssigning(true);
    setAssignError(null);

    try {
      const cycleId = activeCycle?.id || "10000000-0000-0000-0000-000000000001";
      await dataStore.createGoalForSubordinate(user.id, assignModalEmployee.id, {
        cycle_id: cycleId,
        title: assignTitle.trim(),
        description: assignDesc.trim() || undefined,
        weightage: weightNum,
        target_date: assignTargetDate || undefined,
      });

      setSuccessBanner(`Successfully assigned goal "${assignTitle.trim()}" to ${assignModalEmployee.full_name}. Notifications sent to both.`);
      setAssignModalEmployee(null);
      await fetchGoals();
    } catch (err: any) {
      setAssignError(err.message || "Failed to assign goal.");
    } finally {
      setAssigning(false);
    }
  };

  // Single Goal Approval
  const handleApprove = async (goalId: string, employeeName: string) => {
    const comment = feedbackInputs[goalId] || "Approved by reporting manager.";
    setProcessingId(goalId);
    try {
      await dataStore.approveGoal(goalId, comment);
      setSuccessBanner(`Goal approved for ${employeeName}. Notification dispatched to employee.`);
      await fetchGoals();
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk Approve All Goals for an Employee
  const handleApproveAll = async (employee: Employee, goals: Goal[]) => {
    setProcessingId(`all-${employee.id}`);
    try {
      for (const g of goals) {
        if (g.status !== "approved") {
          await dataStore.approveGoal(g.id, "Bulk approved by manager.");
        }
      }
      setSuccessBanner(`All goals approved for ${employee.full_name}. Notification dispatched.`);
      await fetchGoals();
    } finally {
      setProcessingId(null);
    }
  };

  // Send Back Goal for Revision
  const handleSendBack = async (goalId: string, employeeName: string) => {
    const comment = feedbackInputs[goalId];
    if (!comment) {
      alert("Please enter a feedback comment explaining why the goal is being sent back.");
      return;
    }

    setProcessingId(goalId);
    try {
      await dataStore.sendBackGoal(goalId, comment);
      setSuccessBanner(`Goal revision requested for ${employeeName}. Feedback notification sent.`);
      await fetchGoals();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
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
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Direct Reports' Goal Approvals & Setup</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                Reporting Manager Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              As the reporting manager, you can assign goals to subordinates, validate employee-submitted deliverables, and approve weightages.
            </p>
          </div>

          <button
            onClick={fetchGoals}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <h3 className="text-sm font-semibold text-slate-700">No Direct Reports Assigned</h3>
            <p className="text-xs text-slate-400">Employees reporting to you will appear here for goal setup and approvals.</p>
          </div>
        ) : (
          reportsGoals.map(({ employee, goals }) => {
            const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
            const pendingApprovalCount = goals.filter((g) => g.status === "submitted" || g.status === "draft").length;
            const isFullyApproved = goals.length > 0 && pendingApprovalCount === 0;

            return (
              <div key={employee.id} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
                {/* Employee Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{employee.full_name}</h2>
                      <span className="text-xs text-slate-400 font-mono">({employee.email})</span>
                      {isFullyApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" /> All Approved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {employee.designation} • {employee.department}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Weightage Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="text-slate-500 font-medium">Weightage:</span>
                      <span
                        className={`font-black ${
                          totalWeightage >= 85
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {totalWeightage}% / 100%
                      </span>
                    </div>

                    {/* Add Goal for Subordinate Button */}
                    <button
                      onClick={() => handleOpenAssignModal(employee, goals)}
                      disabled={totalWeightage >= 100}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      title="Reporting manager can configure and assign a goal to this subordinate"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Goal</span>
                    </button>

                    {/* Bulk Approve All */}
                    {pendingApprovalCount > 0 && (
                      <button
                        onClick={() => handleApproveAll(employee, goals)}
                        disabled={processingId === `all-${employee.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve All ({pendingApprovalCount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Goals Breakdown */}
                {goals.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl text-center space-y-2 border border-dashed border-slate-200">
                    <Target className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No Goals Created Yet</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Neither the employee nor manager has set goals yet. Click <strong className="text-indigo-600">"Assign Goal"</strong> to define this subordinate's first SMART deliverable.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => handleOpenAssignModal(employee, goals)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Assign First Goal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal, idx) => (
                      <div
                        key={goal.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{goal.title}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                              {goal.weightage}% Weight
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                goal.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : goal.status === "submitted"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                                  : goal.status === "sent_back"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {goal.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                            {goal.description}
                          </p>
                        )}

                        {/* Feedback & Actions */}
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                          <div className="w-full sm:w-2/3">
                            <input
                              type="text"
                              placeholder="Manager revision note or sign-off comment..."
                              value={feedbackInputs[goal.id] !== undefined ? feedbackInputs[goal.id] : goal.manager_comment || ""}
                              onChange={(e) =>
                                setFeedbackInputs({ ...feedbackInputs, [goal.id]: e.target.value })
                              }
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                            />
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {goal.status !== "sent_back" && (
                              <button
                                onClick={() => handleSendBack(goal.id, employee.full_name)}
                                disabled={processingId === goal.id}
                                className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Send Back
                              </button>
                            )}

                            {goal.status !== "approved" ? (
                              <button
                                onClick={() => handleApprove(goal.id, employee.full_name)}
                                disabled={processingId === goal.id}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Goal
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check className="w-3.5 h-3.5" /> Approved
                              </span>
                            )}
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

      {/* ========================================================================= */}
      {/* ASSIGN GOAL MODAL (FOR REPORTING MANAGERS TO SET GOALS FOR SUBORDINATES) */}
      {/* ========================================================================= */}
      {assignModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Assign Goal to Subordinate</h3>
                  <p className="text-xs text-slate-500">
                    Assigning to: <strong className="text-indigo-600">{assignModalEmployee.full_name}</strong> ({assignModalEmployee.designation})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubordinateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Lead Kubernetes migration and zero-downtime deployment"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description & SMART Deliverables
                </label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Specific metrics, success criteria, and targets..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Weightage (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={assignWeightage}
                    onChange={(e) => setAssignWeightage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={assignTargetDate}
                    onChange={(e) => setAssignTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
                <Bell className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Notification Dispatch:</strong> Saving this goal will automatically notify <strong>{assignModalEmployee.full_name}</strong> and approve the deliverable on their profile.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalEmployee(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {assigning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign & Approve Goal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

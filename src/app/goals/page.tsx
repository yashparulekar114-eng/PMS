"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import { GoalStatus } from "@/types";
import {
  Target,
  Plus,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Percent,
  FileCheck2,
  ArrowRight,
  Sparkles,
  Edit3,
  Trash2,
  MessageSquare,
  Send,
  UserCheck,
  ShieldCheck,
  Bell,
  Check,
  MessageCircle,
  CornerDownRight,
} from "lucide-react";

export interface GoalRow {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description?: string | null;
  weightage: number;
  target_date?: string | null;
  status: GoalStatus | string;
  manager_comment?: string | null;
  employee_comment?: string | null;
  created_at?: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [managerName, setManagerName] = useState<string>("Assigned Manager");

  // Employee Feedback Inputs state per goal
  const [employeeComments, setEmployeeComments] = useState<{ [goalId: string]: string }>({});
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [commentSavedStatus, setCommentSavedStatus] = useState<{ [goalId: string]: boolean }>({});

  // Add Goal Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [weightage, setWeightage] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Edit Goal Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editWeightage, setEditWeightage] = useState<string>("");
  const [editTargetDate, setEditTargetDate] = useState<string>("");
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  // Delete Goal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Submission to Manager State
  const [submittingApproval, setSubmittingApproval] = useState<boolean>(false);
  const [approvalBanner, setApprovalBanner] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        const cycle = await dataStore.getActiveCycle();
        if (cycle) {
          setCycleId(cycle.id);
          const allGoals = await dataStore.getGoals(user.id, cycle.id);
          const formatted = allGoals.map((g) => ({
            ...g,
            weightage: Number(g.weightage),
          }));
          setGoals(formatted);

          // Populate initial comments
          const initialMap: { [id: string]: string } = {};
          formatted.forEach((g) => {
            initialMap[g.id] = g.employee_comment || "";
          });
          setEmployeeComments(initialMap);
        }
        if (user.manager_name) setManagerName(user.manager_name);
        return;
      }

      // Fetch employee manager
      const { data: empData } = await supabase
        .from("employees")
        .select("manager_name, manager:manager_id(full_name)")
        .eq("id", user.id)
        .single();

      if (empData) {
        setManagerName((empData as any).manager?.full_name || empData.manager_name || "Assigned Manager");
      }

      const { data: cycleData } = await supabase
        .from("review_cycles")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      const activeCycleId = cycleData && cycleData.length > 0 ? cycleData[0].id : null;
      setCycleId(activeCycleId);

      const { data, error: supabaseError } = await supabase
        .from("goals")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: true });

      if (supabaseError) throw supabaseError;

      let loadedGoals = (data || []).map((g) => ({
        ...g,
        weightage: Number(g.weightage),
      }));

      if (loadedGoals.length === 0) {
        const fallbackGoals = await dataStore.getGoals(user.id, activeCycleId || "10000000-0000-0000-0000-000000000001");
        loadedGoals = fallbackGoals.map((g) => ({ ...g, weightage: Number(g.weightage) }));
      }

      setGoals(loadedGoals);

      const initialMap: { [id: string]: string } = {};
      loadedGoals.forEach((g) => {
        initialMap[g.id] = g.employee_comment || "";
      });
      setEmployeeComments(initialMap);
    } catch (err: any) {
      console.error("Error fetching goals:", err);
      setError(err.message || "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  // Capacity calculations
  const TOTAL_CAPACITY = 100;
  const VALID_THRESHOLD = 85;
  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  const remainingToMax = Math.max(0, TOTAL_CAPACITY - totalWeightage);
  const neededForValid = Math.max(0, VALID_THRESHOLD - totalWeightage);
  const isValidAllocation = totalWeightage >= VALID_THRESHOLD && totalWeightage <= TOTAL_CAPACITY;

  const hasDraftOrPendingGoals = goals.some((g) => g.status === "draft" || g.status === "sent_back");
  const isAllApproved = goals.length > 0 && goals.every((g) => g.status === "approved");
  const isSubmittedToManager = goals.length > 0 && goals.some((g) => g.status === "submitted") && !hasDraftOrPendingGoals;

  const getEditCapacity = (currentGoal: GoalRow | null) => {
    if (!currentGoal) return remainingToMax;
    const weightageOfOtherGoals = totalWeightage - currentGoal.weightage;
    return Math.max(0, TOTAL_CAPACITY - weightageOfOtherGoals);
  };

  const handleOpenAddModal = () => {
    setTitle("");
    setDescription("");
    setWeightage(neededForValid > 0 ? String(neededForValid) : remainingToMax > 0 ? String(Math.min(remainingToMax, 25)) : "0");
    setTargetDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (goal: GoalRow) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description || "");
    setEditWeightage(String(goal.weightage));
    setEditTargetDate(goal.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setEditFormError(null);
    setShowEditModal(true);
  };

  // Add Goal Handler
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setFormError("User not logged in.");
      return;
    }

    if (!title.trim()) {
      setFormError("Please enter a goal title.");
      return;
    }

    const numericWeightage = Number(weightage);
    if (isNaN(numericWeightage) || numericWeightage <= 0) {
      setFormError("Weightage must be a positive number greater than 0.");
      return;
    }

    if (totalWeightage + numericWeightage > TOTAL_CAPACITY) {
      setFormError(
        `Goal weightage (${numericWeightage}%) exceeds the remaining available capacity (${remainingToMax}%). Total cannot exceed ${TOTAL_CAPACITY}%.`
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const targetCycleId = cycleId || "10000000-0000-0000-0000-000000000001";
      await dataStore.createGoal({
        employee_id: user.id,
        cycle_id: targetCycleId,
        title: title.trim(),
        description: description.trim() || undefined,
        weightage: numericWeightage,
        target_date: targetDate || undefined,
        status: "draft",
      });

      setShowAddModal(false);
      await fetchGoals();
    } catch (err: any) {
      console.error("Error creating goal:", err);
      setFormError(err.message || "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Goal Handler
  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingGoal) return;

    if (!editTitle.trim()) {
      setEditFormError("Please enter a goal title.");
      return;
    }

    const numericWeightage = Number(editWeightage);
    if (isNaN(numericWeightage) || numericWeightage <= 0) {
      setEditFormError("Weightage must be a positive number greater than 0.");
      return;
    }

    const maxAllowedForThisGoal = getEditCapacity(editingGoal);
    if (numericWeightage > maxAllowedForThisGoal) {
      setEditFormError(
        `Goal weightage (${numericWeightage}%) exceeds max allowable capacity (${maxAllowedForThisGoal}%).`
      );
      return;
    }

    setEditSubmitting(true);
    setEditFormError(null);

    try {
      await dataStore.updateGoal(editingGoal.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        weightage: numericWeightage,
        target_date: editTargetDate || undefined,
        status: (editingGoal.status === "sent_back" ? "draft" : editingGoal.status) as any,
      });

      setShowEditModal(false);
      setEditingGoal(null);
      await fetchGoals();
    } catch (err: any) {
      console.error("Error updating goal:", err);
      setEditFormError(err.message || "Failed to update goal.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Save Employee Goal Feedback / Comment
  const handleSaveEmployeeFeedback = async (goalId: string) => {
    const comment = (employeeComments[goalId] || "").trim();
    if (!comment) {
      alert("Please enter a comment or feedback note before saving.");
      return;
    }

    setSavingCommentId(goalId);
    try {
      await dataStore.saveEmployeeGoalComment(goalId, comment);
      setCommentSavedStatus((prev) => ({ ...prev, [goalId]: true }));
      setTimeout(() => {
        setCommentSavedStatus((prev) => ({ ...prev, [goalId]: false }));
      }, 3500);
      await fetchGoals();
    } catch (err: any) {
      alert(err.message || "Failed to save comment.");
    } finally {
      setSavingCommentId(null);
    }
  };

  // Delete Goal Handler
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal? This will free up its allocated weightage.")) return;

    setDeletingId(goalId);
    try {
      await dataStore.deleteGoal(goalId);
      await fetchGoals();
    } catch (err: any) {
      console.error("Error deleting goal:", err);
      alert(err.message || "Failed to delete goal.");
    } finally {
      setDeletingId(null);
    }
  };

  // Submit Goals for Manager Approval
  const handleSubmitGoalsToManager = async () => {
    if (!user) return;
    if (totalWeightage < VALID_THRESHOLD) {
      alert(`Please allocate at least ${VALID_THRESHOLD}% total weightage across your goals before submitting (Current: ${totalWeightage}%).`);
      return;
    }

    setSubmittingApproval(true);
    try {
      const targetCycleId = cycleId || "10000000-0000-0000-0000-000000000001";
      await dataStore.submitGoalsForApproval(user.id, targetCycleId);
      setApprovalBanner(`Your ${goals.length} goals (${totalWeightage}%) have been submitted to ${managerName} for approval! Both you and your manager received notifications.`);
      await fetchGoals();
    } catch (err: any) {
      alert(err.message || "Failed to submit goals.");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Pending Approval
          </span>
        );
      case "sent_back":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Revision Requested
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Performance Goals</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Employee Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user ? (
              <>
                Logged in as: <strong className="text-slate-800">{user.full_name}</strong> • Reporting to:{" "}
                <strong className="text-indigo-600">{managerName}</strong>
              </>
            ) : (
              "Please sign in to view and manage your goals."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGoals}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenAddModal}
            disabled={!user || totalWeightage >= TOTAL_CAPACITY}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Submission Success Alert */}
      {approvalBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{approvalBanner}</span>
          </div>
          <button onClick={() => setApprovalBanner(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Weightage & Manager Submission Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isValidAllocation ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Goal Weightage Allocation</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isValidAllocation ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {isValidAllocation ? "Valid (≥85%)" : "Pending Target (85%)"}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Allocated: <strong className="text-slate-900">{totalWeightage}%</strong> / 100% Max
                {neededForValid > 0 ? (
                  <span className="text-amber-700 font-semibold ml-1.5">
                    ({neededForValid}% more needed to reach 85% approval threshold)
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold ml-1.5">
                    (Ready for manager validation • {remainingToMax}% unallocated buffer)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-56 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Progress: {totalWeightage}%</span>
              <span>Scale: 100%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isValidAllocation ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, totalWeightage)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Manager Approval Action Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              {isAllApproved ? (
                <span className="text-emerald-700 font-semibold">
                  All goals approved by {managerName}. Self-appraisal is unlocked!
                </span>
              ) : isSubmittedToManager ? (
                <span className="text-blue-700 font-semibold">
                  Awaiting review from {managerName}. You will receive a notification once signed off.
                </span>
              ) : (
                <span>
                  Goals set by employees must be submitted to <strong>{managerName}</strong> for sign-off.
                </span>
              )}
            </span>
          </div>

          {hasDraftOrPendingGoals && (
            <button
              onClick={handleSubmitGoalsToManager}
              disabled={!isValidAllocation || submittingApproval}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {submittingApproval ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Manager Approval</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Goals Cards with Employee Feedback Box */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
            <p className="text-sm font-medium text-slate-700">Loading your goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Goals Created Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You haven't defined any performance goals yet. You can add goals for yourself (requiring manager approval) or your manager can assign goals to you.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenAddModal}
                disabled={!user}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Goal
              </button>
            </div>
          </div>
        ) : (
          goals.map((goal, idx) => (
            <div
              key={goal.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Goal Title & Badges Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-100">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>Weightage: <strong className="text-indigo-600">{goal.weightage}%</strong></span>
                      <span>•</span>
                      <span>Target: {goal.target_date || "Cycle End"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div>{getStatusBadge(goal.status)}</div>
                  <button
                    onClick={() => handleOpenEditModal(goal)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    title="Edit goal"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    disabled={deletingId === goal.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-xl transition-colors disabled:opacity-50 shadow-2xs"
                    title="Delete goal"
                  >
                    {deletingId === goal.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Goal SMART Description */}
              {goal.description && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700 block mb-0.5">SMART Deliverables & Milestones:</span>
                  {goal.description}
                </div>
              )}

              {/* Manager Note (if assigned or commented by manager) */}
              {goal.manager_comment && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-amber-950 font-bold">Reporting Manager Note ({managerName}):</strong>
                    <p className="mt-0.5">{goal.manager_comment}</p>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* EMPLOYEE FEEDBACK / COMMENT BOX */}
              {/* ================================================================= */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Your Employee Feedback / Comments on this Goal</span>
                  </label>

                  {commentSavedStatus[goal.id] && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 text-emerald-600" /> Feedback Saved & Notified to {managerName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Share feedback, resource requests, or notes for ${managerName}...`}
                      value={employeeComments[goal.id] !== undefined ? employeeComments[goal.id] : goal.employee_comment || ""}
                      onChange={(e) =>
                        setEmployeeComments({ ...employeeComments, [goal.id]: e.target.value })
                      }
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveEmployeeFeedback(goal.id)}
                    disabled={savingCommentId === goal.id}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-2xs"
                  >
                    {savingCommentId === goal.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Save Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation to Self-Appraisal */}
      {isAllApproved && (
        <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-xs border border-emerald-100">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Goals Approved by Manager!</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                All performance deliverables are approved. You can now complete your self-appraisal rating.
              </p>
            </div>
          </div>

          <Link
            href="/reviews/self"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
          >
            <span>Proceed to My Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Performance Goal</h3>
                  <p className="text-xs text-slate-500">Will be submitted to {managerName} for approval</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Optimize platform microservices latency by 20%"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description & SMART Deliverables
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific metrics, milestones, and deliverables..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Weightage (%) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      Max: {remainingToMax}%
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={remainingToMax}
                    value={weightage}
                    onChange={(e) => {
                      setWeightage(e.target.value);
                      if (Number(e.target.value) > remainingToMax) {
                        setFormError(`Weightage cannot exceed ${remainingToMax}%.`);
                      } else {
                        setFormError(null);
                      }
                    }}
                    placeholder={`Max ${remainingToMax}`}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Goal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {showEditModal && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Performance Goal</h3>
                  <p className="text-xs text-slate-500">Update deliverables or weightage allocation</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGoal(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleEditGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description & SMART Deliverables
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Weightage (%) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      Max: {getEditCapacity(editingGoal)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={getEditCapacity(editingGoal)}
                    value={editWeightage}
                    onChange={(e) => setEditWeightage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    handleDeleteGoal(editingGoal.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Goal</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingGoal(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {editSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

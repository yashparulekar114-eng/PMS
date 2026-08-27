"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import Link from "next/link";
import {
  Users,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Star,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  MessageSquare,
  Building2,
  Printer,
  Download,
} from "lucide-react";

// TypeScript interfaces
export interface EmployeeRow {
  id: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id: string | null;
  role: string;
  is_active: boolean;
}

export interface GoalRow {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description?: string | null;
  weightage: number;
  target_date?: string | null;
  status: string;
}

export interface ReviewRow {
  id: string;
  employee_id: string;
  manager_id: string | null;
  cycle_id: string;
  status: "not_started" | "self_appraisal_submitted" | "manager_reviewed" | "completed" | string;
  overall_self_rating: number | null;
  overall_manager_rating: number | null;
  manager_summary: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface GoalRatingRow {
  id?: string;
  review_id: string;
  goal_id: string;
  self_comment?: string | null;
  self_rating?: number | null;
  manager_comment?: string | null;
  manager_rating?: number | null;
}

export interface TeamMemberItem {
  employee: EmployeeRow;
  review: ReviewRow | null;
  goalsCount: number;
  reviewStatus: string;
  overallSelfRating: number | null;
  overallManagerRating: number | null;
}

export default function TeamPage() {
  const { user, role } = useAuth();
  const [activeCycle, setActiveCycle] = useState<{ id: string; name: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "completed">("all");

  // Review Modal State
  const [selectedMember, setSelectedMember] = useState<EmployeeRow | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewRow | null>(null);
  const [modalGoals, setModalGoals] = useState<GoalRow[]>([]);
  const [modalGoalRatings, setModalGoalRatings] = useState<GoalRatingRow[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Manager Form State inside Modal
  const [managerRatingsState, setManagerRatingsState] = useState<{
    [goalId: string]: { manager_comment: string; manager_rating: number };
  }>({});
  const [overallManagerRating, setOverallManagerRating] = useState<number>(4.5);
  const [managerSummary, setManagerSummary] = useState<string>("");

  const fetchTeamData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        // Fallback to local dataStore
        const cycle = await dataStore.getActiveCycle();
        if (cycle) {
          setActiveCycle({ id: cycle.id, name: cycle.name });
          const reports =
            role === "hr_admin"
              ? await dataStore.getEmployees()
              : await dataStore.getDirectReports(user.id);

          const members: TeamMemberItem[] = [];
          for (const rep of reports) {
            if (rep.id === user.id && role !== "hr_admin") continue;
            const goals = await dataStore.getGoals(rep.id, cycle.id);
            const rev = await dataStore.getOrCreateReview(rep.id, cycle.id, user.id);
            members.push({
              employee: rep as unknown as EmployeeRow,
              review: rev as unknown as ReviewRow,
              goalsCount: goals.length,
              reviewStatus: rev.status,
              overallSelfRating: rev.overall_self_rating ? Number(rev.overall_self_rating) : null,
              overallManagerRating: rev.overall_manager_rating
                ? Number(rev.overall_manager_rating)
                : null,
            });
          }
          setTeamMembers(members);
        }
        return;
      }

      // 1. Fetch active review cycle
      const { data: cycleData } = await supabase
        .from("review_cycles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const cycle = cycleData && cycleData.length > 0 ? cycleData[0] : null;
      if (!cycle) {
        setTeamMembers([]);
        return;
      }
      setActiveCycle({ id: cycle.id, name: cycle.name });

      // 2. Fetch Direct Reports (or all employees if HR admin)
      let employeesQuery = supabase.from("employees").select("*").eq("is_active", true);

      if (role === "hr_admin") {
        // HR Admin can view all employees in organization
        employeesQuery = employeesQuery.neq("id", user.id);
      } else {
        // Manager fetches where manager_id = user.id
        employeesQuery = employeesQuery.eq("manager_id", user.id);
      }

      const { data: employeesData, error: empError } = await employeesQuery.order("full_name");
      if (empError) throw empError;

      const members: TeamMemberItem[] = [];

      // 3. For each employee, load their review record and goals count for active cycle
      for (const emp of employeesData || []) {
        const { data: revData } = await supabase
          .from("reviews")
          .select("*")
          .eq("employee_id", emp.id)
          .eq("cycle_id", cycle.id)
          .maybeSingle();

        const { count: goalsCount } = await supabase
          .from("goals")
          .select("*", { count: "exact", head: true })
          .eq("employee_id", emp.id)
          .eq("cycle_id", cycle.id);

        let rev = revData as ReviewRow | null;
        let finalGoalsCount = goalsCount || 0;

        if (!rev || finalGoalsCount === 0) {
          const fallbackGoals = await dataStore.getGoals(emp.id, cycle.id);
          const fallbackRev = await dataStore.getOrCreateReview(emp.id, cycle.id, user.id);
          if (finalGoalsCount === 0) finalGoalsCount = fallbackGoals.length;
          if (!rev) rev = fallbackRev as unknown as ReviewRow;
        }

        members.push({
          employee: emp as EmployeeRow,
          review: rev,
          goalsCount: finalGoalsCount,
          reviewStatus: rev?.status || "not_started",
          overallSelfRating: rev?.overall_self_rating ? Number(rev.overall_self_rating) : null,
          overallManagerRating: rev?.overall_manager_rating
            ? Number(rev.overall_manager_rating)
            : null,
        });
      }

      setTeamMembers(members);
    } catch (err: any) {
      console.error("Error loading team roster:", err);
      setError(err.message || "Failed to load team appraisal roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user, role]);

  const handleOpenReviewModal = async (member: TeamMemberItem) => {
    if (!activeCycle) return;
    setSelectedMember(member.employee);
    setModalLoading(true);
    setModalError(null);

    try {
      if (!isSupabaseConfigured()) {
        const goals = await dataStore.getGoals(member.employee.id, activeCycle.id);
        const rev = await dataStore.getOrCreateReview(
          member.employee.id,
          activeCycle.id,
          user?.id || null
        );
        const ratings = await dataStore.getGoalRatings(rev.id);

        setModalGoals(goals.map((g) => ({ ...g, weightage: Number(g.weightage) })));
        setSelectedReview(rev as unknown as ReviewRow);
        setModalGoalRatings(ratings);

        const initialForm: {
          [goalId: string]: { manager_comment: string; manager_rating: number };
        } = {};
        goals.forEach((g) => {
          const match = ratings.find((r) => r.goal_id === g.id);
          initialForm[g.id] = {
            manager_comment: match?.manager_comment || "",
            manager_rating: match?.manager_rating ? Number(match.manager_rating) : 4,
          };
        });
        setManagerRatingsState(initialForm);
        setOverallManagerRating(
          rev.overall_manager_rating ? Number(rev.overall_manager_rating) : 4.5
        );
        setManagerSummary(rev.manager_summary || "");
        return;
      }

      // 1. Fetch employee's goals from Supabase
      const { data: goalsData, error: gErr } = await supabase
        .from("goals")
        .select("*")
        .eq("employee_id", member.employee.id)
        .order("created_at", { ascending: true });

      if (gErr) throw gErr;
      let loadedGoals: GoalRow[] = (goalsData || []).map((g) => ({
        ...g,
        weightage: Number(g.weightage),
      }));
      if (loadedGoals.length === 0) {
        const fallbackGoals = await dataStore.getGoals(member.employee.id, activeCycle.id);
        loadedGoals = fallbackGoals.map((g) => ({ ...g, weightage: Number(g.weightage) }));
      }
      setModalGoals(loadedGoals);

      // 2. Fetch or create review record in Supabase
      let rev = member.review;
      if (!rev) {
        const { data: newRev, error: rErr } = await supabase
          .from("reviews")
          .insert([
            {
              employee_id: member.employee.id,
              manager_id: user?.id || null,
              cycle_id: activeCycle.id,
              status: "not_started",
            },
          ])
          .select()
          .single();

        if (rErr) {
          const fallbackRev = await dataStore.getOrCreateReview(member.employee.id, activeCycle.id, user?.id || null);
          rev = fallbackRev as unknown as ReviewRow;
        } else {
          rev = newRev as ReviewRow;
        }
      }
      setSelectedReview(rev);

      // 3. Fetch goal ratings from Supabase
      let loadedRatings: GoalRatingRow[] = [];
      const { data: ratingsData } = await supabase
        .from("goal_ratings")
        .select("*")
        .eq("review_id", rev.id);

      loadedRatings = (ratingsData || []) as GoalRatingRow[];
      if (loadedRatings.length === 0) {
        loadedRatings = await dataStore.getGoalRatings(rev.id);
      }
      setModalGoalRatings(loadedRatings);

      // Prepopulate form state
      const initialForm: {
        [goalId: string]: { manager_comment: string; manager_rating: number };
      } = {};
      loadedGoals.forEach((g) => {
        const match = loadedRatings.find((r) => r.goal_id === g.id);
        initialForm[g.id] = {
          manager_comment: match?.manager_comment || "",
          manager_rating: match?.manager_rating ? Number(match.manager_rating) : 4,
        };
      });
      setManagerRatingsState(initialForm);
      setOverallManagerRating(
        rev.overall_manager_rating ? Number(rev.overall_manager_rating) : 4.5
      );
      setManagerSummary(rev.manager_summary || "");
    } catch (err: any) {
      console.error("Error opening review modal:", err);
      setModalError(err.message || "Failed to load employee appraisal details.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleRatingChange = (goalId: string, rating: number) => {
    setManagerRatingsState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        manager_rating: rating,
      },
    }));
  };

  const handleCommentChange = (goalId: string, comment: string) => {
    setManagerRatingsState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        manager_comment: comment,
      },
    }));
  };

  const handleSubmitManagerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !selectedMember || !activeCycle) return;

    if (!managerSummary.trim()) {
      setModalError("Please provide an overall manager review summary evaluation.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      if (isSupabaseConfigured()) {
        // 1. Update review record status to 'manager_reviewed'
        const { error: revUpdateErr } = await supabase
          .from("reviews")
          .update({
            status: "manager_reviewed",
            overall_manager_rating: overallManagerRating,
            manager_summary: managerSummary.trim(),
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", selectedReview.id);

        if (revUpdateErr) throw revUpdateErr;

        // 2. Save line-item ratings and feedback in goal_ratings table
        for (const goal of modalGoals) {
          const state = managerRatingsState[goal.id];
          const existingRating = modalGoalRatings.find((r) => r.goal_id === goal.id);

          const { error: ratingErr } = await supabase.from("goal_ratings").upsert(
            {
              review_id: selectedReview.id,
              goal_id: goal.id,
              self_rating: existingRating?.self_rating || null,
              self_comment: existingRating?.self_comment || null,
              manager_rating: state?.manager_rating || 4,
              manager_comment: state?.manager_comment?.trim() || "",
            },
            { onConflict: "review_id,goal_id" }
          );

          if (ratingErr) throw ratingErr;
        }
      } else {
        // Fallback to dataStore
        const payload = modalGoals.map((g) => ({
          goal_id: g.id,
          manager_comment: managerRatingsState[g.id]?.manager_comment || "",
          manager_rating: managerRatingsState[g.id]?.manager_rating || 4,
        }));
        await dataStore.submitManagerReview(
          selectedReview.id,
          payload,
          overallManagerRating,
          managerSummary.trim()
        );
      }

      // Close modal and refresh roster
      setSelectedMember(null);
      await fetchTeamData();
    } catch (err: any) {
      console.error("Error submitting manager review:", err);
      setModalError(err.message || "Failed to submit manager evaluation to Supabase.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case "manager_reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Manager Reviewed
          </span>
        );
      case "self_appraisal_submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Self-Appraisal Submitted
          </span>
        );
      case "not_started":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Not Started
          </span>
        );
    }
  };

  const renderRatingButtons = (
    currentRating: number,
    onChange: (r: number) => void,
    disabled = false
  ) => {
    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentRating === num
                ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:hover:bg-slate-100"
            }`}
          >
            <Star
              className={`w-3 h-3 ${
                currentRating === num ? "fill-amber-300 text-amber-300" : "text-slate-400"
              }`}
            />
            <span>{num}.0</span>
          </button>
        ))}
      </div>
    );
  };

  // Filtered members list
  const filteredMembers = teamMembers.filter((m) => {
    if (filterTab === "pending") {
      return m.reviewStatus === "self_appraisal_submitted";
    }
    if (filterTab === "completed") {
      return m.reviewStatus === "manager_reviewed" || m.reviewStatus === "completed";
    }
    return true;
  });

  const pendingCount = teamMembers.filter(
    (m) => m.reviewStatus === "self_appraisal_submitted"
  ).length;
  const completedCount = teamMembers.filter(
    (m) => m.reviewStatus === "manager_reviewed" || m.reviewStatus === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {role === "hr_admin" ? "Organization Appraisal Reviews" : "Direct Reports Reviews"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {role === "hr_admin" ? "HR Admin Portal" : "Manager Portal"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate submitted self-appraisals for:{" "}
            <strong className="text-slate-800">{activeCycle?.name || "Active Review Cycle"}</strong>
          </p>
        </div>

        <button
          onClick={fetchTeamData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Roster
        </button>
      </div>

      {/* Metrics & Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Roster
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {teamMembers.length}
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
              Awaiting Manager Review
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
              Reviews Completed
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {completedCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            filterTab === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Direct Reports ({teamMembers.length})
        </button>
        <button
          onClick={() => setFilterTab("pending")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            filterTab === "pending"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilterTab("completed")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            filterTab === "completed"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Main Roster List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
            <p className="text-sm font-medium text-slate-700">Loading team appraisal roster...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving direct report profiles and review status</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Employees Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {filterTab === "pending"
                ? "There are no pending self-appraisals awaiting your review in this filter."
                : "No direct reports are currently assigned under your employee ID."}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const emp = member.employee;
            const isPendingAction = member.reviewStatus === "self_appraisal_submitted";

            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Employee Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                      {emp.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{emp.full_name}</h3>
                        <span className="text-xs text-slate-400">({emp.email})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {emp.designation} • <span className="font-semibold text-slate-700">{emp.department}</span> • Joined {emp.date_of_joining}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pl-1">
                    <span>
                      Assigned Goals: <strong className="text-slate-900">{member.goalsCount}</strong>
                    </span>
                    {member.overallSelfRating && (
                      <span className="flex items-center gap-1 text-slate-700">
                        Self-Score:{" "}
                        <strong className="text-indigo-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {member.overallSelfRating} / 5.0
                        </strong>
                      </span>
                    )}
                    {member.overallManagerRating && (
                      <span className="flex items-center gap-1 text-slate-700">
                        Manager Score:{" "}
                        <strong className="text-emerald-700 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {member.overallManagerRating} / 5.0
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Review Action Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-500 font-medium mb-1">Appraisal Stage</div>
                    {getStatusBadge(member.reviewStatus)}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/reports/${emp.id}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                      title="View & print official PDF appraisal document"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      PDF Report
                    </Link>

                    <button
                      onClick={() => handleOpenReviewModal(member)}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap ${
                        isPendingAction
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <FileCheck2 className="w-4 h-4" />
                      {isPendingAction
                        ? "Conduct Manager Review"
                        : member.reviewStatus === "manager_reviewed" || member.reviewStatus === "completed"
                        ? "View / Edit Evaluation"
                        : "Review Appraisal"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAILED MANAGER REVIEW MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Manager Appraisal: {selectedMember.full_name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedMember.designation} • {selectedMember.department} • Cycle: {activeCycle?.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {modalLoading ? (
              <div className="p-16 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
                <p className="text-sm font-medium text-slate-700">Loading appraisal details...</p>
              </div>
            ) : modalGoals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Goals Assigned</h4>
                <p className="text-xs text-slate-500">
                  This employee does not have any goals registered for this appraisal cycle.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitManagerReview} className="space-y-6">
                {/* Employee Self-Appraisal Summary Pill */}
                {selectedReview?.overall_self_rating && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-950">Employee's Overall Self-Score</div>
                      <div className="text-indigo-700 mt-0.5">
                        Submitted on{" "}
                        {selectedReview.submitted_at
                          ? new Date(selectedReview.submitted_at).toLocaleDateString()
                          : "Active Cycle"}
                      </div>
                    </div>
                    <div className="px-3.5 py-1.5 bg-white rounded-xl font-black text-indigo-600 border border-indigo-200 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {selectedReview.overall_self_rating} / 5.0
                    </div>
                  </div>
                )}

                {/* Per-Goal Evaluation Cards */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Goal-by-Goal Evaluation ({modalGoals.length} Goals)
                  </h3>

                  {modalGoals.map((goal, idx) => {
                    const match = modalGoalRatings.find((r) => r.goal_id === goal.id);
                    const state = managerRatingsState[goal.id] || {
                      manager_comment: "",
                      manager_rating: 4,
                    };

                    return (
                      <div
                        key={goal.id}
                        className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5 space-y-4"
                      >
                        {/* Goal Info */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{goal.title}</h4>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                            Weight: {goal.weightage}%
                          </span>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                            {goal.description}
                          </p>
                        )}

                        {/* Employee Self-Submission Box */}
                        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-amber-900 font-bold">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              Employee's Self-Reflection:
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white text-amber-800 border border-amber-200 font-bold text-[11px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              Self-Score: {match?.self_rating || "N/A"} / 5.0
                            </span>
                          </div>
                          <p className="text-amber-950 whitespace-pre-line leading-relaxed">
                            {match?.self_comment || "No reflection comment provided by employee."}
                          </p>
                        </div>

                        {/* Manager Rating & Comment Inputs */}
                        <div className="space-y-3 pt-1 border-t border-slate-200/60">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Manager Rating (1–5) <span className="text-rose-500">*</span>
                            </label>
                            {renderRatingButtons(state.manager_rating, (r) =>
                              handleRatingChange(goal.id, r)
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Manager Feedback & Calibration Comment
                            </label>
                            <textarea
                              rows={2}
                              value={state.manager_comment}
                              onChange={(e) => handleCommentChange(goal.id, e.target.value)}
                              placeholder="Add specific manager observations, constructive feedback, or commendations..."
                              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Manager Summary & Rating */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Overall Manager Evaluation & Executive Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign the final performance rating and provide executive summary comments.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Overall Manager Rating (1–5) <span className="text-rose-500">*</span>
                    </label>
                    {renderRatingButtons(overallManagerRating, setOverallManagerRating)}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Final Executive Summary & Recommendations <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={managerSummary}
                      onChange={(e) => setManagerSummary(e.target.value)}
                      placeholder="Write your comprehensive performance summary, rating justification, and career development recommendations..."
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                  >
                    {modalSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Review...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Manager Evaluation
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

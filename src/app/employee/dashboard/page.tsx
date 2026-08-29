"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  Target,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  Printer,
  ShieldCheck,
  UserCheck,
  Send,
  AlertCircle,
  RefreshCw,
  Calendar,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Check,
} from "lucide-react";

// Types
export type AppraisalStageKey =
  | "goal_drafting"
  | "pending_manager_approval"
  | "goals_approved"
  | "self_assessment_pending"
  | "manager_reviewing"
  | "finalized";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  actor: string;
  actor_role: string;
  timestamp: string;
  type: "goal" | "approval" | "self_appraisal" | "manager_review" | "finalized";
}

export interface StageDefinition {
  key: AppraisalStageKey;
  stepNumber: number;
  label: string;
  shortDesc: string;
  owner: string;
  actionHref: string;
  actionText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    key: "goal_drafting",
    stepNumber: 1,
    label: "Goal Drafting",
    shortDesc: "Define SMART performance goals with ≥85% weightage capacity.",
    owner: "Employee",
    actionHref: "/goals",
    actionText: "Set / Edit Goals",
    icon: Target,
  },
  {
    key: "pending_manager_approval",
    stepNumber: 2,
    label: "Pending Manager Approval",
    shortDesc: "Goals submitted. Manager is validating alignment and weightages.",
    owner: "Manager",
    actionHref: "/goals",
    actionText: "View Goals",
    icon: Send,
  },
  {
    key: "goals_approved",
    stepNumber: 3,
    label: "Goals Approved",
    shortDesc: "Manager signed off on deliverables. Self-appraisal is unlocked.",
    owner: "Employee",
    actionHref: "/reviews/self",
    actionText: "Start Self-Assessment",
    icon: UserCheck,
  },
  {
    key: "self_assessment_pending",
    stepNumber: 4,
    label: "Self-Assessment Submitted",
    shortDesc: "Self-rating scores & achievements submitted to your supervisor.",
    owner: "Employee",
    actionHref: "/reviews/self",
    actionText: "Review My Rating",
    icon: FileCheck2,
  },
  {
    key: "manager_reviewing",
    stepNumber: 5,
    label: "Manager Reviewing",
    shortDesc: "Manager is conducting 1-on-1 evaluation and calibration feedback.",
    owner: "Manager",
    actionHref: "/reviews/self",
    actionText: "Check Evaluation Status",
    icon: Award,
  },
  {
    key: "finalized",
    stepNumber: 6,
    label: "Finalized",
    shortDesc: "Cycle complete! Calibrated score locked and official certificate published.",
    owner: "HR Admin",
    actionHref: "/reports",
    actionText: "Download Certificate",
    icon: Printer,
  },
];

export default function EmployeeStatusTrackerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status data
  const [currentStageKey, setCurrentStageKey] = useState<AppraisalStageKey>("goal_drafting");
  const [goalsCount, setGoalsCount] = useState<number>(0);
  const [totalWeightage, setTotalWeightage] = useState<number>(0);
  const [approvedGoalsCount, setApprovedGoalsCount] = useState<number>(0);
  const [selfRating, setSelfRating] = useState<number | null>(null);
  const [managerRating, setManagerRating] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeCycleName, setActiveCycleName] = useState<string>("Annual Review Cycle");
  const [managerName, setManagerName] = useState<string>("Assigned Manager");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchEmployeeStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        // Local DataStore Fallback
        const cycle = await dataStore.getActiveCycle();
        if (cycle) setActiveCycleName(cycle.name);

        const myGoals = cycle ? await dataStore.getGoals(user.id, cycle.id) : [];
        const myReview = cycle ? await dataStore.getOrCreateReview(user.id, cycle.id, user.manager_id) : null;

        const weightSum = myGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
        const approvedCount = myGoals.filter((g) => g.status === "approved").length;

        setGoalsCount(myGoals.length);
        setTotalWeightage(weightSum);
        setApprovedGoalsCount(approvedCount);
        setSelfRating(myReview?.overall_self_rating || null);
        setManagerRating(myReview?.overall_manager_rating || null);
        setManagerName(user.manager_name || "Assigned Manager");

        // Calculate Stage
        let stage: AppraisalStageKey = "goal_drafting";
        if (myReview?.status === "completed") {
          stage = "finalized";
        } else if (myReview?.status === "manager_reviewed") {
          stage = "manager_reviewing";
        } else if (myReview?.status === "self_appraisal_submitted") {
          stage = "self_assessment_pending";
        } else if (myGoals.length > 0 && approvedCount === myGoals.length) {
          stage = "goals_approved";
        } else if (myGoals.length > 0 && weightSum >= 85) {
          stage = "pending_manager_approval";
        }

        setCurrentStageKey(stage);

        // Derive recent activities
        const now = new Date();
        const demoActivities: ActivityItem[] = [];

        if (stage === "finalized") {
          demoActivities.push({
            id: "act-final",
            title: "Performance Appraisal Finalized & Certified",
            description: `Final rating of ${myReview?.overall_manager_rating || 4.2}/5.0 signed and official PDF generated.`,
            actor: "HR System",
            actor_role: "HR Admin",
            timestamp: "Today, 10:15 AM",
            type: "finalized",
          });
        }
        if (stage === "manager_reviewing" || stage === "finalized") {
          demoActivities.push({
            id: "act-mgr",
            title: "Manager Evaluation Completed",
            description: `${user.manager_name || "Manager"} submitted calibrated goal ratings and qualitative feedback.`,
            actor: user.manager_name || "Manager",
            actor_role: "Direct Manager",
            timestamp: "Yesterday, 3:30 PM",
            type: "manager_review",
          });
        }
        if (stage === "self_assessment_pending" || stage === "manager_reviewing" || stage === "finalized") {
          demoActivities.push({
            id: "act-self",
            title: "Self-Appraisal Submitted",
            description: `Submitted self-evaluation scores across ${myGoals.length} approved performance goals.`,
            actor: user.full_name,
            actor_role: "Employee",
            timestamp: "3 days ago",
            type: "self_appraisal",
          });
        }
        if (approvedCount > 0) {
          demoActivities.push({
            id: "act-approved",
            title: `SMART Goals Approved (${approvedCount}/${myGoals.length})`,
            description: `${user.manager_name || "Manager"} validated and locked your goal deliverables.`,
            actor: user.manager_name || "Manager",
            actor_role: "Direct Manager",
            timestamp: "1 week ago",
            type: "approval",
          });
        }
        demoActivities.push({
          id: "act-draft",
          title: `Goal Setting Initialized (${weightSum}% allocated)`,
          description: `Created and drafted SMART goals for ${cycle?.name || "Active Cycle"}.`,
          actor: user.full_name,
          actor_role: "Employee",
          timestamp: "2 weeks ago",
          type: "goal",
        });

        setActivities(demoActivities);
        return;
      }

      // Supabase Query with Clerk User Match
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select(`
          id,
          full_name,
          manager_name,
          designation,
          department
        `)
        .eq("id", user.id)
        .single();

      if (empError) throw empError;
      if (empData?.manager_name) setManagerName(empData.manager_name);

      const { data: cycleData } = await supabase
        .from("review_cycles")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (cycleData) setActiveCycleName(cycleData.name);

      const currentCycleId = cycleData?.id || "10000000-0000-0000-0000-000000000001";

      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("employee_id", user.id)
        .eq("cycle_id", currentCycleId);

      const loadedGoals = goalsData || [];
      const weightSum = loadedGoals.reduce((sum: number, g: any) => sum + (Number(g.weightage) || 0), 0);
      const approvedCount = loadedGoals.filter((g: any) => g.status === "approved").length;

      setGoalsCount(loadedGoals.length);
      setTotalWeightage(weightSum);
      setApprovedGoalsCount(approvedCount);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("employee_id", user.id)
        .eq("cycle_id", currentCycleId)
        .maybeSingle();

      setSelfRating(reviewData?.overall_self_rating || null);
      setManagerRating(reviewData?.overall_manager_rating || null);

      // Determine stage
      let stage: AppraisalStageKey = "goal_drafting";
      if (reviewData?.status === "completed") {
        stage = "finalized";
      } else if (reviewData?.status === "manager_reviewed") {
        stage = "manager_reviewing";
      } else if (reviewData?.status === "self_appraisal_submitted") {
        stage = "self_assessment_pending";
      } else if (loadedGoals.length > 0 && approvedCount === loadedGoals.length) {
        stage = "goals_approved";
      } else if (loadedGoals.length > 0 && weightSum >= 85) {
        stage = "pending_manager_approval";
      }

      setCurrentStageKey(stage);

      // Fetch Recent Activity Logs
      const { data: logData } = await supabase
        .from("appraisal_activity_logs")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (logData && logData.length > 0) {
        setActivities(
          logData.map((l: any) => ({
            id: l.id,
            title: l.title,
            description: l.description || "",
            actor: l.actor_name,
            actor_role: l.actor_role,
            timestamp: new Date(l.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: l.action_type || "goal",
          }))
        );
      } else {
        // Fallback default timeline
        setActivities([
          {
            id: "act-1",
            title: "Review Cycle Active",
            description: `Participating in ${cycleData?.name || "Active Cycle"}.`,
            actor: "System",
            actor_role: "HR Admin",
            timestamp: "Recently",
            type: "goal",
          },
        ]);
      }
    } catch (err: any) {
      console.error("Error fetching employee status tracker:", err);
      setError(err.message || "Failed to load status tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStatus();
  }, [user]);

  const currentStageIndex = useMemo(() => {
    return STAGES.findIndex((s) => s.key === currentStageKey);
  }, [currentStageKey]);

  const currentStage = STAGES[currentStageIndex] || STAGES[0];
  const progressPercent = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sign In Required</h3>
        <p className="text-xs text-slate-500">Please sign in to view your real-time appraisal status tracker.</p>
        <Link
          href="/sign-in"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Appraisal Status Tracker</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tracking appraisal lifecycle for: <strong className="text-slate-800">{user.full_name}</strong> •{" "}
            {user.designation} ({user.department})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployeeStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <span>My Main Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISUAL "PACKAGE / PIZZA DELIVERY" STYLE TIMELINE TRACKER */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {activeCycleName}
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Current Stage: {currentStage.label}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentStage.shortDesc}</p>
          </div>

          {/* Progress Bar and Indicator */}
          <div className="w-full md:w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Overall Progress</span>
              <span className="font-black text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              Step {currentStageIndex + 1} of {STAGES.length} Completed
            </div>
          </div>
        </div>

        {/* Horizontal Timeline Bar (Delivery Style) */}
        <div className="relative py-4 overflow-x-auto">
          {/* Connecting Track Line */}
          <div className="hidden lg:block absolute top-[46px] left-12 right-12 h-1.5 bg-slate-100 -z-0 rounded-full">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{
                width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isUpcoming = idx > currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md transform -translate-y-1"
                      : isCompleted
                      ? "bg-emerald-50/30 border-emerald-200 shadow-2xs"
                      : "bg-slate-50/60 border-slate-200 opacity-60"
                  }`}
                >
                  {/* Step Beacon Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all mb-3 ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-emerald-200 shadow-md"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-indigo-200 shadow-md animate-pulse"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 stroke-[3]" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className="font-black text-xs text-slate-900 leading-tight">
                    {stage.label}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : isCurrent
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? "Done" : isCurrent ? "Active" : `Step ${stage.stepNumber}`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight">
                    {stage.shortDesc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spotlight Active Stage Action Box */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500 text-white">
                Next Immediate Action
              </span>
              <span className="text-xs text-slate-300">
                Assigned to: <strong className="text-white">{currentStage.owner}</strong> ({managerName})
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {currentStage.key === "finalized"
                ? "Official Appraisal Certificate is Ready!"
                : `Action Needed: ${currentStage.label}`}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {currentStage.shortDesc}
            </p>
          </div>

          <Link
            href={
              currentStage.key === "finalized"
                ? `/reports/${user.id}`
                : currentStage.actionHref
            }
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg transition-all flex-shrink-0"
          >
            <span>{currentStage.actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY METRICS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMART Goals</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{goalsCount} Defined</div>
            <div className="text-xs text-emerald-600 font-semibold">{approvedGoalsCount} Approved</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weightage Total</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalWeightage}%</div>
            <div className="text-xs text-slate-400">Scale: 100% Capacity</div>
          </div>
          <div className={`p-3 rounded-2xl ${totalWeightage >= 85 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Self Rating</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {selfRating ? `${selfRating.toFixed(1)} ★` : "Pending"}
            </div>
            <div className="text-xs text-slate-400">Scale: 1.0 to 5.0</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Manager Rating</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {managerRating ? `${managerRating.toFixed(1)} ★` : "In Evaluation"}
            </div>
            <div className="text-xs text-slate-400">Calibrated Outcome</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT ACTIVITY FEED CARD */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Appraisal Activity</h3>
              <p className="text-xs text-slate-500">Chronological audit trail of milestone actions and approvals.</p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {activities.length} Recorded Events
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl mt-0.5 flex-shrink-0">
                    {act.type === "finalized" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : act.type === "manager_review" ? (
                      <Award className="w-4 h-4 text-purple-600" />
                    ) : act.type === "self_appraisal" ? (
                      <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    ) : act.type === "approval" ? (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Target className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900">{act.title}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>By: <strong className="text-slate-600">{act.actor}</strong> ({act.actor_role})</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  {act.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { ReviewCycle, Goal, Review, Employee } from "@/types";
import {
  Target,
  FileCheck2,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Award,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Printer,
  TrendingUp,
  UserCheck,
  Layers,
  Search,
} from "lucide-react";

// FAQ Item Interface
interface FAQItem {
  id: string;
  category: "Workflow & Goals" | "Ratings & Calibration" | "Manager & HR Admin";
  question: string;
  answer: string;
  highlight?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "Workflow & Goals",
    question: "What are the 5 sequential stages in the PMS Appraisal Workflow?",
    answer:
      "The appraisal lifecycle progresses through 5 transparent stages: (1) SMART Goal Definition & Weightage Allocation, (2) Manager Goal Review & Approval, (3) Employee Self-Appraisal Submission with Star Ratings, (4) Manager Evaluation & 1-on-1 Calibration, and (5) Cycle Completion with Official Signed PDF Report generation.",
    highlight: "100% transparent audit trail from goal creation to PDF certification.",
  },
  {
    id: "faq-2",
    category: "Workflow & Goals",
    question: "What is the 85% Minimum Goal Weightage rule?",
    answer:
      "To ensure comprehensive performance evaluations without over-committing staff, the system requires each employee to allocate a total goal weightage of at least 85% (up to a strict 100% capacity). The system prevents self-appraisal submissions if total weightage is below 85%.",
    highlight: "Weightage threshold: Minimum 85%, Maximum 100%.",
  },
  {
    id: "faq-3",
    category: "Ratings & Calibration",
    question: "How are Self and Manager Overall Ratings calculated?",
    answer:
      "Both Self and Manager scores are evaluated on a 1.0 to 5.0 scale for each individual goal. The overall score is automatically computed as the weighted average across all approved goals (Rating × Weightage ÷ Total Weightage). Managers also provide a qualitative calibration summary.",
    highlight: "Scale: 1.0 (Needs Improvement) to 5.0 (Outstanding).",
  },
  {
    id: "faq-4",
    category: "Ratings & Calibration",
    question: "How does the Forced Distribution (Bell Curve) Normalization work?",
    answer:
      "The system benchmarks employee scores against a Gaussian distribution across 5 buckets: Needs Improvement (10%), Meets Expectations (20%), Good (40%), Very Good (20%), and Outstanding (10%). The HR Analytics hub flags grade inflation if top tiers exceed 45% or the average exceeds 4.1.",
    highlight: "Target distribution: 10% - 20% - 40% - 20% - 10%.",
  },
  {
    id: "faq-5",
    category: "Manager & HR Admin",
    question: "How do People Managers review direct reports' goals and submissions?",
    answer:
      "Managers can navigate to the 'Team' tab to see direct reports assigned to their hierarchy. They can approve or request revisions on goals in the Goal Approval Workspace, and submit official ratings with qualitative feedback on the Review screen.",
    highlight: "Instant 1-click approvals and transparent feedback logs.",
  },
  {
    id: "faq-6",
    category: "Manager & HR Admin",
    question: "Where can HR Admins view the interactive Organization Structure?",
    answer:
      "The Organization Structure is integrated seamlessly inside the 'Employees' tab (/admin/employees). HR Admins can switch between the Compact 2-scroll Org Tree View (with zoom controls) and the Employee Directory Table with a single click.",
    highlight: "Located in Employees tab with max 2 scrolls.",
  },
  {
    id: "faq-7",
    category: "Workflow & Goals",
    question: "How do I view and print my official appraisal certificate?",
    answer:
      "Once the appraisal reaches the 'Completed' stage, both employees and managers can access the official PDF Summary Report via the 'PDF Certificate' button or navigating to /reports/[employeeId]. The certificate is styled for high-resolution clean printing.",
    highlight: "Includes verified QR badge, digital signature line, and goal breakdown.",
  },
];

export default function DashboardPage() {
  const { user, role, isLoading, isAccountNotSetUp } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [directReports, setDirectReports] = useState<Employee[]>([]);
  const [companyStats, setCompanyStats] = useState<{ total: number; completed: number; inProgress: number }>({
    total: 0,
    completed: 0,
    inProgress: 0,
  });

  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");
  const [faqSearch, setFaqSearch] = useState<string>("");
  const [faqCategory, setFaqCategory] = useState<string>("All");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      const cycle = await dataStore.getActiveCycle();
      setActiveCycle(cycle);

      if (cycle) {
        // Load employee's own goals & review
        const myGoals = await dataStore.getGoals(user.id, cycle.id);
        setGoals(myGoals);
        const myReview = await dataStore.getOrCreateReview(user.id, cycle.id, user.manager_id);
        setReview(myReview);

        // If manager or admin, load direct reports with review details
        if (user.role === "manager" || user.role === "hr_admin") {
          const reports =
            user.role === "hr_admin"
              ? (await dataStore.getEmployees()).filter((e) => e.id !== user.id)
              : await dataStore.getDirectReports(user.id);

          const reportsWithData = await Promise.all(
            reports.map(async (r) => {
              const rGoals = await dataStore.getGoals(r.id, cycle.id);
              const rReview = await dataStore.getOrCreateReview(r.id, cycle.id, user.id);
              return {
                ...r,
                goalsCount: rGoals.length,
                reviewStatus: rReview.status,
                overallSelfRating: rReview.overall_self_rating,
                overallManagerRating: rReview.overall_manager_rating,
              };
            })
          );
          setDirectReports(reportsWithData as any);
        }

        // If HR admin, load company completion stats
        if (user.role === "hr_admin") {
          const rep = await dataStore.getCompletionReport(cycle.id);
          const completed = rep.filter((r) => r.status === "completed").length;
          const inProgress = rep.filter((r) => r.status !== "not_started" && r.status !== "completed").length;
          setCompanyStats({
            total: rep.length,
            completed,
            inProgress,
          });
        }
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Derived Calculations
  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  const approvedGoals = goals.filter((g) => g.status === "approved").length;
  const hasGoals = goals.length > 0;
  const isWeightageValid = totalWeightage >= 85;
  const areGoalsApproved = hasGoals && approvedGoals === goals.length;
  const isSelfSubmitted =
    review?.status === "self_appraisal_submitted" ||
    review?.status === "manager_reviewed" ||
    review?.status === "completed";
  const isManagerReviewed = review?.status === "manager_reviewed" || review?.status === "completed";
  const isCycleCompleted = review?.status === "completed";

  // Calculate current stage index (1 to 5)
  const currentWorkflowStep = useMemo(() => {
    if (isCycleCompleted) return 5;
    if (isManagerReviewed) return 4;
    if (isSelfSubmitted) return 3;
    if (areGoalsApproved) return 3;
    if (isWeightageValid && hasGoals) return 2;
    return 1;
  }, [isCycleCompleted, isManagerReviewed, isSelfSubmitted, areGoalsApproved, isWeightageValid, hasGoals]);

  const workflowProgressPercent = useMemo(() => {
    if (isCycleCompleted) return 100;
    if (isManagerReviewed) return 80;
    if (isSelfSubmitted) return 60;
    if (areGoalsApproved) return 40;
    if (hasGoals && isWeightageValid) return 25;
    return 10;
  }, [isCycleCompleted, isManagerReviewed, isSelfSubmitted, areGoalsApproved, hasGoals, isWeightageValid]);

  // Workflow Stages Definition
  const workflowStages = [
    {
      step: 1,
      title: "Goal Setting & Weightage",
      shortDesc: "Define SMART goals with ≥85% weightage",
      isCompleted: hasGoals && isWeightageValid,
      isCurrent: currentWorkflowStep === 1,
      actionHref: "/goals",
      actionText: hasGoals ? "Adjust Goals" : "Set Goals",
      statusText: isWeightageValid ? `${totalWeightage}% Allocated` : `${totalWeightage}% / 85% req.`,
      icon: Target,
    },
    {
      step: 2,
      title: "Manager Goal Approval",
      shortDesc: "Manager validates and approves goal alignment",
      isCompleted: areGoalsApproved,
      isCurrent: currentWorkflowStep === 2,
      actionHref: user?.role === "manager" ? "/team/goals" : "/goals",
      actionText: user?.role === "manager" ? "Review Team Goals" : "View Goals Status",
      statusText: areGoalsApproved
        ? "All Goals Approved"
        : approvedGoals > 0
        ? `${approvedGoals}/${goals.length} Approved`
        : "Pending Approval",
      icon: UserCheck,
    },
    {
      step: 3,
      title: "Self-Appraisal Submission",
      shortDesc: "Self-evaluation with 1-5 star ratings & commentary",
      isCompleted: isSelfSubmitted,
      isCurrent: currentWorkflowStep === 3,
      actionHref: "/reviews/self",
      actionText: isSelfSubmitted ? "View Self-Rating" : "Fill Self-Appraisal",
      statusText: isSelfSubmitted
        ? `Submitted (${review?.overall_self_rating || "Rated"}★)`
        : "Awaiting Submission",
      icon: FileCheck2,
    },
    {
      step: 4,
      title: "Manager Evaluation & 1-on-1",
      shortDesc: "Manager scores goals & provides qualitative feedback",
      isCompleted: isManagerReviewed,
      isCurrent: currentWorkflowStep === 4,
      actionHref: user?.role === "manager" ? "/team" : "/reviews/self",
      actionText: user?.role === "manager" ? "Evaluate Direct Reports" : "Check Review Status",
      statusText: isManagerReviewed
        ? `Reviewed (${review?.overall_manager_rating || "Rated"}★)`
        : "In Review",
      icon: Award,
    },
    {
      step: 5,
      title: "Cycle Complete & PDF Certificate",
      shortDesc: "Final calibrated score locked and certificate generated",
      isCompleted: isCycleCompleted,
      isCurrent: currentWorkflowStep === 5,
      actionHref: `/reports/${user?.id}`,
      actionText: "View Official PDF",
      statusText: isCycleCompleted ? "Cycle Finalized" : "Pending Finalization",
      icon: Printer,
    },
  ];

  // Filtered FAQ Items
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesSearch =
        faqSearch === "" ||
        item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        item.answer.toLowerCase().includes(faqSearch.toLowerCase());
      const matchesCat = faqCategory === "All" || item.category === faqCategory;
      return matchesSearch && matchesCat;
    });
  }, [faqSearch, faqCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Account Not Set Up Screen
  if (isAccountNotSetUp || !user) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-amber-200 rounded-2xl shadow-sm text-center space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Account Not Found</h2>
        <div className="p-4 bg-amber-50 rounded-xl text-amber-900 font-medium text-sm border border-amber-200/60">
          "Your account is not yet set up. Please contact HR."
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your Clerk authentication succeeded, but no matching employee record was found in the database. Please request an HR administrator to add you to the employee directory.
        </p>
        <Link
          href="/sign-in"
          className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Return to Sign In & Switch User
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.full_name}!</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === "hr_admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : user.role === "manager"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {user.role.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user.designation} • {user.department} {user.manager_name && `• Reports to ${user.manager_name}`}
          </p>
        </div>

        {activeCycle ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-right shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Active Review Cycle</div>
            <div className="text-sm font-bold text-indigo-950">{activeCycle.name}</div>
            <div className="text-xs text-indigo-700">
              {activeCycle.start_date} to {activeCycle.end_date}
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-600">
            No active review cycle currently open
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🚀 WORKFLOW STATUS TRACKER (END-TO-END STEPPER) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Appraisal Workflow Status</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Step {currentWorkflowStep} of 5
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live lifecycle tracker guiding your progression through the active appraisal cycle.
            </p>
          </div>

          {/* Overall Stepper Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-700">{workflowProgressPercent}% Complete</div>
              <div className="text-[10px] text-slate-400">
                {isCycleCompleted ? "Cycle Finalized" : "In Progress"}
              </div>
            </div>
            <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCycleCompleted ? "bg-emerald-500" : "bg-indigo-600"
                }`}
                style={{ width: `${workflowProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 5-Step Horizontal Interactive Stepper Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {workflowStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  stage.isCompleted
                    ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
                    : stage.isCurrent
                    ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-slate-50/50 border-slate-200 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        stage.isCompleted
                          ? "bg-emerald-600 text-white"
                          : stage.isCurrent
                          ? "bg-indigo-600 text-white animate-pulse"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {stage.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.step}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        stage.isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : stage.isCurrent
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-200/70 text-slate-500"
                      }`}
                    >
                      {stage.isCompleted ? "Completed" : stage.isCurrent ? "Active Step" : "Upcoming"}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 mt-1">{stage.title}</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{stage.shortDesc}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={
                        stage.isCompleted
                          ? "text-emerald-700 font-bold"
                          : stage.isCurrent
                          ? "text-indigo-700 font-bold"
                          : "text-slate-500"
                      }
                    >
                      {stage.statusText}
                    </span>
                  </div>

                  <Link
                    href={stage.actionHref}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      stage.isCurrent
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                        : stage.isCompleted
                        ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-slate-100 text-slate-400 pointer-events-none"
                    }`}
                  >
                    <span>{stage.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EMPLOYEE PERSONAL KPI CARDS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          My Appraisal Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Goals count */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-medium text-slate-500">Goals Set</div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{goals.length}</span>
              <span className="text-xs text-slate-500">{approvedGoals} Approved</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (approvedGoals / Math.max(1, goals.length)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Weightage Total */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-medium text-slate-500">Goal Weightage (Scale: 100%)</div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {totalWeightage}% <span className="text-xs text-slate-400 font-normal">/ 100%</span>
              </span>
              <span
                className={`text-xs font-semibold ${
                  totalWeightage >= 85 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {totalWeightage >= 85 ? "Valid (≥85%)" : `${85 - totalWeightage}% needed`}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalWeightage >= 85 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, (totalWeightage / 100) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Appraisal Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-medium text-slate-500">Review Status</div>
            <div className="text-base font-bold capitalize text-slate-900">
              {review ? review.status.replace(/_/g, " ") : "Not Started"}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {review?.status === "completed"
                  ? "Cycle Complete"
                  : review?.status === "self_appraisal_submitted"
                  ? "Awaiting Manager"
                  : "Draft Stage"}
              </span>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-medium text-slate-500">Final Outcome</div>
            <div className="text-2xl font-bold text-slate-900">
              {review?.overall_manager_rating ? `${review.overall_manager_rating} / 5.0` : "Pending"}
            </div>
            <div className="text-xs text-slate-500">
              {review?.overall_self_rating ? `Self: ${review.overall_self_rating} / 5.0` : "Self-rating pending"}
            </div>
          </div>
        </div>

        {/* Quick actions for employee */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/goals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            <Target className="w-4 h-4" />
            Manage My Goals
          </Link>
          <Link
            href="/reviews/self"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Complete Self-Appraisal
          </Link>
          {isCycleCompleted && (
            <Link
              href={`/reports/${user?.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              Download Appraisal PDF Certificate
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MANAGER TEAM COMPLETION SECTION */}
      {/* ========================================================================= */}
      {(user.role === "manager" || user.role === "hr_admin") && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              My Direct Reports ({directReports.length})
            </h2>
            <Link
              href="/team"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View Team Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {directReports.length === 0 ? (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
              No direct reports assigned to your profile yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directReports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                        {report.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{report.full_name}</div>
                        <div className="text-xs text-slate-500">{report.designation} • {report.department}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">
                      Goals: <strong className="text-slate-800">{report.goalsCount || 0} Defined</strong>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] tracking-wider ${
                        report.reviewStatus === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : report.reviewStatus === "manager_reviewed"
                          ? "bg-purple-100 text-purple-800"
                          : report.reviewStatus === "self_appraisal_submitted"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {(report.reviewStatus || "not_started").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <Link
                      href="/team"
                      className="flex-1 text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                      Conduct / View Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HR ADMIN COMPANY-WIDE SUMMARY */}
      {/* ========================================================================= */}
      {user.role === "hr_admin" && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Company-Wide Appraisal Analytics
            </h2>
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Open Analytics & Audit Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-purple-100 rounded-xl p-5 shadow-sm space-y-1">
              <div className="text-xs font-medium text-slate-500">Total Company Employees</div>
              <div className="text-3xl font-extrabold text-purple-900">{companyStats.total}</div>
              <div className="text-xs text-purple-600">Active personnel directory</div>
            </div>

            <div className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm space-y-1">
              <div className="text-xs font-medium text-slate-500">In Progress / Submitted</div>
              <div className="text-3xl font-extrabold text-amber-600">{companyStats.inProgress}</div>
              <div className="text-xs text-amber-700">Under self or manager review</div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm space-y-1">
              <div className="text-xs font-medium text-slate-500">Completed Reviews</div>
              <div className="text-3xl font-extrabold text-emerald-600">{companyStats.completed}</div>
              <div className="text-xs text-emerald-700">Fully rated & approved</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 INTERACTIVE FAQ & KNOWLEDGE BASE SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Performance Management System FAQ</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Help & Guidelines
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Answers to common questions about appraisal workflows, goal weightages, 5-bucket bell curves, and PDF certifications.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {["All", "Workflow & Goals", "Ratings & Calibration", "Manager & HR Admin"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    faqCategory === cat
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No FAQ topics matched your search query.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isExpanded
                      ? "bg-slate-50/70 border-indigo-200 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 space-y-2.5 border-t border-slate-100 animate-in fade-in">
                      <p className="leading-relaxed">{faq.answer}</p>
                      {faq.highlight && (
                        <div className="flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{faq.highlight}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { ReviewCycle, Goal, Review, Employee } from "@/types";
import {
  Target,
  FileCheck2,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  Send,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Mandatory Lab Requirement: Unregistered account fallback screen
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
          Your Clerk authentication succeeded, but no matching employee record was found in the Supabase database. Please request an HR administrator to add you to the employee directory.
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

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  const approvedGoals = goals.filter((g) => g.status === "approved").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.full_name}!</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === "hr_admin"
                  ? "bg-purple-100 text-purple-800"
                  : user.role === "manager"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
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
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-right">
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
      {/* 1. EMPLOYEE PERSONAL PROGRESS CARD (VISIBLE TO ALL) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          My Appraisal Progress
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

          {/* Overall Rating (if completed) */}
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MANAGER TEAM COMPLETION SECTION (FOR MANAGERS & HR ADMINS) */}
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
      {/* 3. HR ADMIN COMPANY-WIDE SUMMARY (FOR HR ADMIN ONLY) */}
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
    </div>
  );
}

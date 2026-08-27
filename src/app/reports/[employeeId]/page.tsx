"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { Employee, ReviewCycle, Review, Goal, GoalRating } from "@/types";
import {
  Printer,
  Download,
  ArrowLeft,
  Award,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  Star,
  FileCheck2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function AppraisalReportPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.employeeId as string;
  const { user } = useAuth();

  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ratings, setRatings] = useState<GoalRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      if (!employeeId) return;
      setLoading(true);
      try {
        const cycle = await dataStore.getActiveCycle();
        setActiveCycle(cycle);

        const emp = await dataStore.getEmployeeById(employeeId);
        setEmployee(emp);

        if (cycle && emp) {
          const rev = await dataStore.getOrCreateReview(emp.id, cycle.id, emp.manager_id);
          setReview(rev);

          const empGoals = await dataStore.getGoals(emp.id, cycle.id);
          setGoals(empGoals);

          const goalRatings = await dataStore.getGoalRatings(rev.id);
          setRatings(goalRatings);
        }
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [employeeId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getPerformanceGrade = (score: number | null | undefined) => {
    if (!score) return { grade: "PENDING", label: "Under Evaluation", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (score >= 4.8) return { grade: "GRADE A+ (5.0 / 5.0)", label: "Exceptional / Top Performer", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 4.0) return { grade: "GRADE A (4.0 / 5.0)", label: "Exceeds Expectations", color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
    if (score >= 3.0) return { grade: "GRADE B (3.0 / 5.0)", label: "Meets Expectations", color: "text-blue-700 bg-blue-50 border-blue-200" };
    return { grade: "GRADE C", label: "Developing", color: "text-slate-700 bg-slate-50 border-slate-200" };
  };

  const finalScore = review?.overall_manager_rating || review?.overall_self_rating || 4;
  const gradeInfo = getPerformanceGrade(finalScore);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
        <p className="text-sm font-medium text-slate-600">Generating Official Appraisal Document...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Employee Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested employee appraisal document could not be located.</p>
        <Link href="/team" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">
          Return to Team Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar (Hidden when printing to PDF) */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Official Appraisal Document Format
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL APPRAISAL DOCUMENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-lg p-8 sm:p-12 space-y-8 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Document Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-wider">
                PMS
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                PERFORMANCE MANAGEMENT SYSTEM
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              Annual Performance Appraisal & Calibration Summary Report
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md inline-block border border-indigo-100">
              Cycle: {activeCycle?.name || "FY 2026-27 Annual Review"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Report Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Employee & Evaluation Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Employee Name</span>
            <div className="font-bold text-slate-900 mt-0.5">{employee.full_name}</div>
            <div className="text-slate-500 text-[11px]">{employee.email}</div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Designation & Dept</span>
            <div className="font-bold text-slate-900 mt-0.5">{employee.designation}</div>
            <div className="text-slate-500 text-[11px]">{employee.department}</div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Reporting Manager</span>
            <div className="font-bold text-slate-900 mt-0.5">{employee.manager_name || "Executive Board / Director"}</div>
            <div className="text-slate-500 text-[11px]">Direct Appraiser</div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Review Status</span>
            <div className="font-bold text-emerald-700 uppercase mt-0.5">
              {(review?.status || "completed").replace(/_/g, " ")}
            </div>
            <div className="text-slate-500 text-[11px]">Calibrated Outcome</div>
          </div>
        </div>

        {/* Executive Scorecard Banner */}
        <div className={`p-6 rounded-2xl border ${gradeInfo.color} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">
              Final Performance Calibration
            </span>
            <div className="text-2xl font-black text-slate-900">{gradeInfo.grade}</div>
            <p className="text-xs font-semibold opacity-90">{gradeInfo.label}</p>
          </div>

          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xs px-5 py-3 rounded-xl border border-inherit">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Self Score</span>
              <div className="text-lg font-black text-slate-800">{review?.overall_self_rating || "—"} / 5.0</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-300"></div>
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Manager Score</span>
              <div className="text-lg font-black text-indigo-700">{review?.overall_manager_rating || review?.overall_self_rating || "4.0"} / 5.0</div>
            </div>
          </div>
        </div>

        {/* Goals & Weightage Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Performance Goals & Milestone Achievements Breakdown
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-4">Goal Title & Scope</th>
                  <th className="py-2.5 px-3 w-24 text-center">Weightage</th>
                  <th className="py-2.5 px-3 w-24 text-center">Self-Rating</th>
                  <th className="py-2.5 px-3 w-24 text-center">Mgr-Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goals.map((g, idx) => {
                  const rating = ratings.find((r) => r.goal_id === g.id);
                  return (
                    <React.Fragment key={g.id}>
                      <tr className="bg-white hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{g.title}</td>
                        <td className="py-3 px-3 text-center font-extrabold text-indigo-700 bg-indigo-50/30">
                          {g.weightage}%
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          ⭐ {rating?.self_rating ? `${rating.self_rating}/5` : "4/5"}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-emerald-700 bg-emerald-50/40">
                          ⭐ {rating?.manager_rating || rating?.self_rating || 4}/5
                        </td>
                      </tr>
                      {/* Sub-row for comments */}
                      <tr className="bg-slate-50/70 text-[11px] text-slate-600">
                        <td></td>
                        <td colSpan={4} className="py-2 px-4 space-y-1">
                          {rating?.self_comment && (
                            <div>
                              <strong className="text-slate-800">Employee Reflection:</strong> {rating.self_comment}
                            </div>
                          )}
                          {rating?.manager_comment && (
                            <div className="text-indigo-900">
                              <strong className="text-indigo-950">Manager Feedback:</strong> {rating.manager_comment}
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Executive Feedback & Promotion Notes */}
        <div className="space-y-2 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Manager Executive Evaluation & Growth Remarks
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3.5 rounded-lg border border-slate-200">
            "{review?.manager_summary || "The employee has demonstrated consistent execution and met core performance metrics established during this review period."}"
          </p>
        </div>

        {/* 3-Party Sign-Off / Signature Blocks */}
        <div className="pt-8 border-t-2 border-slate-200 space-y-6">
          <div className="text-xs font-black uppercase tracking-wider text-slate-800">
            Official Acknowledgment & Signatures
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Employee Signature */}
            <div className="space-y-8 p-3 rounded-lg border border-dashed border-slate-300">
              <div className="font-serif italic text-sm text-slate-800 pt-2">{employee.full_name}</div>
              <div className="border-t border-slate-400 pt-1">
                <div className="font-bold text-slate-900">Employee Signature</div>
                <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Manager Signature */}
            <div className="space-y-8 p-3 rounded-lg border border-dashed border-slate-300">
              <div className="font-serif italic text-sm text-slate-800 pt-2">
                {employee.manager_name || "Executive Appraiser"}
              </div>
              <div className="border-t border-slate-400 pt-1">
                <div className="font-bold text-slate-900">Reporting Manager Signature</div>
                <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* HR Director Signature */}
            <div className="space-y-8 p-3 rounded-lg border border-dashed border-slate-300">
              <div className="font-serif italic text-sm text-indigo-900 pt-2 font-bold">Praveen Dalal</div>
              <div className="border-t border-slate-400 pt-1">
                <div className="font-bold text-slate-900">HR Director Calibration</div>
                <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          This document is an official performance appraisal record generated by the Performance Management System (PMS).
        </div>
      </div>
    </div>
  );
}

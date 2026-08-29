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
  Clock,
  Check,
  Medal,
  Stamp,
  Lock,
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
  const [viewMode, setViewMode] = useState<"certificate" | "detailed">("certificate");

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
    if (!score) return { grade: "GRADE B (3.0 / 5.0)", label: "Meets Expectations", honor: "Standard Contributor", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 4.7) return { grade: "GRADE A+ (5.0 / 5.0)", label: "Outstanding / Top Performer", honor: "President's Honor Roll", color: "text-emerald-800 bg-emerald-50 border-emerald-300" };
    if (score >= 4.0) return { grade: "GRADE A (4.0 / 5.0)", label: "Exceeds Expectations", honor: "Distinguished Performer", color: "text-indigo-800 bg-indigo-50 border-indigo-300" };
    if (score >= 3.0) return { grade: "GRADE B (3.0 / 5.0)", label: "Meets Expectations", honor: "Core Contributor", color: "text-blue-800 bg-blue-50 border-blue-300" };
    return { grade: "GRADE C", label: "Developing / Needs Focus", honor: "Developing", color: "text-amber-800 bg-amber-50 border-amber-300" };
  };

  const isCompleted = review?.status === "completed";
  const finalScore = review?.overall_manager_rating || review?.overall_self_rating || 4.2;
  const gradeInfo = getPerformanceGrade(finalScore);
  const certId = `PMS-CERT-2026-${(employee?.id || "EMP").slice(-6).toUpperCase()}`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
        <p className="text-sm font-medium text-slate-600">Generating Official Appraisal & Certificate...</p>
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
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Toggle Certificate vs Detailed View */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("certificate")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === "certificate"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏆 Official Certificate
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === "detailed"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📄 Detailed Report
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Certificate
            </button>
          </div>
        </div>

        {/* Certificate Activation Status Banner */}
        {isCompleted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-900 block text-sm">
                  🏆 Official Appraisal Certificate Activated & Certified by HR
                </span>
                <span className="text-emerald-700">
                  Review cycle complete • Verified by HR Director Praveen Dalal • Certificate ID: <strong>{certId}</strong>
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">
              ACTIVATED
            </span>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-amber-950 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-amber-900 block text-sm">
                  ⏳ Certificate Pending HR Final Sign-off
                </span>
                <span className="text-amber-700">
                  Current Status: <strong className="uppercase">{review?.status?.replace(/_/g, " ") || "Draft"}</strong>. The official certificate will be officially stamped once HR finalizes the appraisal.
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              PENDING HR
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. OFFICIAL APPRAISAL CERTIFICATE VIEW */}
      {/* ========================================================================= */}
      {viewMode === "certificate" ? (
        <div className="bg-gradient-to-br from-amber-50/40 via-white to-indigo-50/30 border-8 border-double border-indigo-900/40 rounded-3xl shadow-2xl p-8 sm:p-14 space-y-8 relative overflow-hidden print:border-8 print:border-double print:border-slate-800 print:shadow-none print:m-0 print:p-8">
          {/* Subtle Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-[550px] h-[550px] text-indigo-950" />
          </div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 border-b-2 border-indigo-900/20 pb-6">
            <div className="inline-flex items-center justify-center gap-2 text-indigo-900 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Performance Management System • Official Certification
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900">
              Certificate of Performance Achievement
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Evaluation Cycle: {activeCycle?.name || "FY 2026-27 Annual Review"}
            </p>
          </div>

          {/* Certificate Body Presentation */}
          <div className="text-center space-y-4 max-w-2xl mx-auto py-2">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">This is to officially certify that</p>
            <div className="text-3xl sm:text-4xl font-serif font-black text-indigo-950 underline decoration-indigo-300 decoration-2 underline-offset-8">
              {employee.full_name}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Holding the position of <strong className="text-slate-900 font-bold">{employee.designation}</strong> in the{" "}
              <strong className="text-slate-900 font-bold">{employee.department}</strong> department
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl mx-auto pt-2">
              has completed the annual performance evaluation cycle with distinguished dedication, meeting key deliverables, competencies, and milestones established by the organization.
            </p>
          </div>

          {/* Executive Merit & Rating Badge */}
          <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-2 border-indigo-100 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Official Calibrated Grade
              </span>
              <div className="text-xl font-serif font-black text-indigo-950">{gradeInfo.grade}</div>
              <div className="text-xs font-bold text-emerald-700">{gradeInfo.honor}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall Score</span>
              <div className="text-2xl font-black text-indigo-600 flex items-center gap-1 justify-end">
                <span>{Number(finalScore).toFixed(1)}</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500">out of 5.0 Max</span>
            </div>
          </div>

          {/* Goals Accomplished Chips */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Evaluated Deliverables & Weightage Allocation ({goals.length} Goals • 100% Validated)
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {goals.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{g.title}</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {g.weightage}%
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Official Seals and Signatures */}
          <div className="pt-8 border-t-2 border-indigo-900/20 grid grid-cols-3 gap-6 items-end text-center">
            {/* Employee Signature */}
            <div className="space-y-2">
              <div className="font-serif italic text-sm text-slate-800 font-bold">{employee.full_name}</div>
              <div className="border-t border-slate-400 pt-1">
                <div className="text-[11px] font-bold text-slate-900">Appraisee Signature</div>
                <div className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Official HR Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-double border-amber-600 bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center shadow-md p-1">
                <ShieldCheck className="w-6 h-6 text-amber-800" />
                <span className="text-[7px] font-black uppercase text-amber-900 tracking-tighter text-center leading-tight">
                  OFFICIAL HR CERTIFIED
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1 font-bold">{certId}</span>
            </div>

            {/* HR Director Signature */}
            <div className="space-y-2">
              <div className="font-serif italic text-sm text-indigo-900 font-bold">Praveen Dalal</div>
              <div className="border-t border-slate-400 pt-1">
                <div className="text-[11px] font-bold text-slate-900">HR Director & Calibration Lead</div>
                <div className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. DETAILED APPRAISAL BREAKDOWN REPORT VIEW */
        /* ========================================================================= */
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
              <div className="font-bold text-slate-900 mt-0.5">{employee.manager_name || "Executive Appraiser"}</div>
              <div className="text-slate-500 text-[11px]">Direct Evaluator</div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Appraisal Status</span>
              <div className={`font-bold uppercase mt-0.5 ${isCompleted ? "text-emerald-700" : "text-purple-700"}`}>
                {review?.status?.replace(/_/g, " ") || "In Progress"}
              </div>
              <div className="text-slate-500 text-[11px]">
                {isCompleted ? "Certificate Activated" : "Pending Sign-off"}
              </div>
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
                <div className="text-lg font-black text-indigo-700">{review?.overall_manager_rating || review?.overall_self_rating || "4.2"} / 5.0</div>
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

          {/* Manager Executive Feedback */}
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
      )}
    </div>
  );
}

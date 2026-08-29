"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { ReviewCycle } from "@/types";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Filter,
  Users,
  Search,
  ArrowUpRight,
  Award,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FileCheck2,
  X,
  Printer,
  ChevronRight,
  Zap,
} from "lucide-react";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Finalization state
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [finalizingAll, setFinalizingAll] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const cycle = await dataStore.getActiveCycle();
      setActiveCycle(cycle);
      if (cycle) {
        const data = await dataStore.getCompletionReport(cycle.id);
        setReportData(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFinalizeByHR = async (reviewId: string, employeeName: string) => {
    setFinalizingId(reviewId);
    try {
      await dataStore.finalizeReviewByHR(reviewId);
      setSuccessBanner(
        `🏆 Appraisal officially finalized for ${employeeName}! Cycle marked complete & PDF Certificate activated.`
      );
      await fetchReport();
    } catch (err: any) {
      alert(err.message || "Failed to finalize appraisal.");
    } finally {
      setFinalizingId(null);
    }
  };

  const handleFinalizeAll = async () => {
    if (!confirm("Are you sure you want to finalize all manager-reviewed appraisals and activate their official PDF certificates?")) {
      return;
    }

    setFinalizingAll(true);
    try {
      const count = await dataStore.finalizeAllReviewedByHR(activeCycle?.id);
      setSuccessBanner(`🚀 Successfully finalized ${count} appraisals! All PDF certificates are now activated and employees notified.`);
      await fetchReport();
    } catch (err: any) {
      alert(err.message || "Failed to finalize appraisals.");
    } finally {
      setFinalizingAll(false);
    }
  };

  const filteredRows = reportData.filter((row) => {
    const deptMatch = filterDepartment === "All" || row.employee.department === filterDepartment;
    const statusMatch = filterStatus === "All" || row.status === filterStatus;
    const searchMatch =
      !searchQuery.trim() ||
      row.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.employee.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return deptMatch && statusMatch && searchMatch;
  });

  const totalEmployees = reportData.length;
  const completedCount = reportData.filter((r) => r.status === "completed").length;
  const readyForHRCount = reportData.filter((r) => r.status === "manager_reviewed").length;
  const selfSubmittedCount = reportData.filter((r) => r.status === "self_appraisal_submitted").length;
  const notStartedCount = reportData.filter((r) => r.status === "not_started" || r.status === "draft").length;
  const completionPercentage = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

  const exportCSV = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Manager",
      "Status",
      "Goals Count",
      "Total Weightage",
      "Self Rating",
      "Manager Rating",
      "Certificate Status",
    ];
    const rows = filteredRows.map((r) => [
      `"${r.employee.full_name}"`,
      `"${r.employee.email}"`,
      `"${r.employee.department}"`,
      `"${r.employee.designation}"`,
      `"${r.employee.manager_name || "None"}"`,
      `"${r.status}"`,
      r.goalsCount,
      `${r.totalWeightage}%`,
      r.overallSelfRating || "N/A",
      r.overallManagerRating || "N/A",
      r.status === "completed" ? "Activated" : "Pending",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PMS_HR_Completion_Report_${activeCycle?.name || "Active"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">HR Appraisal Finalization & Certificate Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              HR Administration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Perform final HR sign-off on manager evaluations, mark review cycles complete, and activate official employee PDF certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {readyForHRCount > 0 && (
            <button
              onClick={handleFinalizeAll}
              disabled={finalizingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {finalizingAll ? "Finalizing All..." : `Finalize All (${readyForHRCount})`}
            </button>
          )}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Overall Cycle Progress</div>
          <div className="text-3xl font-extrabold text-indigo-600">{completionPercentage}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-1 bg-purple-50/30">
          <div className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Ready for HR Sign-off</span>
          </div>
          <div className="text-3xl font-black text-purple-900">{readyForHRCount}</div>
          <div className="text-xs text-purple-600 font-medium">Evaluations completed by manager</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Certificates Activated</span>
          </div>
          <div className="text-3xl font-black text-emerald-700">{completedCount}</div>
          <div className="text-xs text-emerald-600 font-medium">of {totalEmployees} total staff</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">In Progress / Draft</div>
          <div className="text-3xl font-extrabold text-slate-400">{selfSubmittedCount + notStartedCount}</div>
          <div className="text-xs text-slate-500">Goals or self-appraisal stages</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filters:</span>
          </div>

          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Appraisal Statuses</option>
              <option value="manager_reviewed">Ready for HR Finalization</option>
              <option value="completed">Completed & Certificate Active</option>
              <option value="self_appraisal_submitted">Self-Appraisal Submitted</option>
              <option value="not_started">Not Started / Draft</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Compliance & Finalization Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            Compiling HR audit records...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No employee appraisals match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department & Mgr</th>
                  <th className="px-6 py-4">Goals / Weight</th>
                  <th className="px-6 py-4">Ratings (Self / Mgr)</th>
                  <th className="px-6 py-4">Status & Certificate</th>
                  <th className="px-6 py-4 text-right">HR Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r) => (
                  <tr key={r.employee.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{r.employee.full_name}</div>
                      <div className="text-xs text-slate-500">{r.employee.designation}</div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-slate-800">{r.employee.department}</div>
                      <div className="text-slate-500 mt-0.5">Mgr: {r.employee.manager_name || "None"}</div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="font-bold text-slate-900">{r.goalsCount} goals</span>
                      <span className="text-slate-500 block">({r.totalWeightage}% weightage)</span>
                    </td>

                    <td className="px-6 py-4">
                      {r.status === "completed" ? (
                        <div className="text-xs font-semibold text-slate-900 space-y-0.5">
                          <div>Self: <span className="text-indigo-600 font-bold">{r.overallSelfRating ? `${r.overallSelfRating}★` : "—"}</span></div>
                          <div>Mgr: <span className="text-emerald-600 font-bold">{r.overallManagerRating ? `${r.overallManagerRating}★` : "—"}</span></div>
                        </div>
                      ) : r.status === "manager_reviewed" ? (
                        <div className="text-xs font-semibold space-y-0.5">
                          <div className="text-indigo-600">Self: {r.overallSelfRating ? `${r.overallSelfRating}★` : "—"}</div>
                          <div className="text-purple-700 font-bold">Mgr: {r.overallManagerRating ? `${r.overallManagerRating}★` : "—"}</div>
                        </div>
                      ) : r.status === "self_appraisal_submitted" ? (
                        <div className="text-xs text-amber-700 font-medium">
                          Self: {r.overallSelfRating ? `${r.overallSelfRating}★` : "—"} | Mgr: Pending
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not rated</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            r.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : r.status === "manager_reviewed"
                              ? "bg-purple-100 text-purple-800 border border-purple-200 animate-pulse"
                              : r.status === "self_appraisal_submitted"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.status === "completed" ? (
                            <>
                              <Award className="w-3 h-3 text-emerald-600" />
                              Certificate Active
                            </>
                          ) : r.status === "manager_reviewed" ? (
                            <>
                              <Clock className="w-3 h-3 text-purple-600" />
                              Ready for HR
                            </>
                          ) : (
                            r.status.replace(/_/g, " ")
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {r.status === "manager_reviewed" ? (
                        <button
                          onClick={() => handleFinalizeByHR(r.id, r.employee.full_name)}
                          disabled={finalizingId === r.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-all disabled:opacity-50"
                          title="Finalize appraisal, mark cycle complete, and activate employee certificate"
                        >
                          {finalizingId === r.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Finalizing...
                            </>
                          ) : (
                            <>
                              <Award className="w-3.5 h-3.5" />
                              Finalize & Activate Certificate
                            </>
                          )}
                        </button>
                      ) : r.status === "completed" ? (
                        <Link
                          href={`/reports/${r.employee.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Certificate</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 italic">In progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

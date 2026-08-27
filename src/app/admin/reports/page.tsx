"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export default function AdminReportsPage() {
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
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

    fetchReport();
  }, []);

  const filteredRows = reportData.filter((row) => {
    const deptMatch = filterDepartment === "All" || row.employee.department === filterDepartment;
    const statusMatch = filterStatus === "All" || row.status === filterStatus;
    return deptMatch && statusMatch;
  });

  const totalEmployees = reportData.length;
  const completedCount = reportData.filter((r) => r.status === "completed" || r.status === "manager_reviewed").length;
  const submittedCount = reportData.filter((r) => r.status === "self_appraisal_submitted").length;
  const notStartedCount = reportData.filter((r) => r.status === "not_started" || r.status === "draft").length;
  const completionPercentage = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

  const exportCSV = () => {
    const headers = ["Employee Name", "Email", "Department", "Designation", "Manager", "Status", "Goals Count", "Total Weightage", "Self Rating", "Manager Rating"];
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
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PMS_Completion_Report_${activeCycle?.name || "Active"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Appraisal Completion Report</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              HR Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking cycle compliance for: <span className="font-semibold text-slate-700">{activeCycle?.name || "No Active Cycle"}</span>
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Overall Completion</div>
          <div className="text-3xl font-extrabold text-indigo-600">{completionPercentage}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Completed Reviews</div>
          <div className="text-3xl font-extrabold text-emerald-600">{completedCount}</div>
          <div className="text-xs text-slate-500">of {totalEmployees} total staff</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Awaiting Manager Review</div>
          <div className="text-3xl font-extrabold text-amber-600">{submittedCount}</div>
          <div className="text-xs text-slate-500">Self-appraisals submitted</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Not Started</div>
          <div className="text-3xl font-extrabold text-slate-400">{notStartedCount}</div>
          <div className="text-xs text-slate-500">No goals or draft only</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filters:</span>
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
            <option value="All">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="self_appraisal_submitted">Self-Appraisal Submitted</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Compiling audit report...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No employees match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4">Goals / Weight</th>
                  <th className="px-6 py-4">Appraisal Status</th>
                  <th className="px-6 py-4">Ratings (Self / Mgr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r) => (
                  <tr key={r.employee.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{r.employee.full_name}</div>
                      <div className="text-xs text-slate-500">{r.employee.designation}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{r.employee.department}</td>
                    <td className="px-6 py-4 text-slate-700">{r.employee.manager_name || "None"}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{r.goalsCount} goals</span>
                      <span className="text-xs text-slate-500 block">({r.totalWeightage}% weightage)</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          r.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "self_appraisal_submitted"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === "completed" ? (
                        <div className="text-xs font-semibold text-slate-900">
                          Self: <span className="text-indigo-600">{r.overallSelfRating || "—"}</span> | Mgr: <span className="text-emerald-600">{r.overallManagerRating || "—"}</span>
                        </div>
                      ) : r.status === "self_appraisal_submitted" ? (
                        <div className="text-xs text-amber-700">
                          Self: {r.overallSelfRating || "—"} | Mgr: Pending
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not rated</span>
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

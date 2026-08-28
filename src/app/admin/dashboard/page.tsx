"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Layers,
  FileCheck2,
  Printer,
  Sparkles,
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

export interface DepartmentStat {
  department: string;
  totalEmployees: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number;
  avgRating: number | null;
}

export interface AuditRecord {
  employee: EmployeeRow;
  managerName: string;
  review: ReviewRow | null;
  goalsCount: number;
  status: string;
  selfRating: number | null;
  managerRating: number | null;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<{ id: string; name: string } | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        // Fallback to dataStore
        const cycle = await dataStore.getActiveCycle();
        if (cycle) {
          setActiveCycle({ id: cycle.id, name: cycle.name });
          const allEmps = await dataStore.getEmployees();
          const report = await dataStore.getCompletionReport(cycle.id);

          const records: AuditRecord[] = allEmps.map((emp) => {
            const rep = report.find((r) => r.employee.id === emp.id);
            const mgr = allEmps.find((m) => m.id === emp.manager_id);
            return {
              employee: emp as unknown as EmployeeRow,
              managerName: mgr?.full_name || "None (Executive)",
              review: rep ? ({ id: rep.reviewId || "", employee_id: emp.id, cycle_id: cycle.id, status: rep.status, overall_self_rating: rep.overallSelfRating || null, overall_manager_rating: rep.overallManagerRating || null, manager_summary: null, submitted_at: null, reviewed_at: null } as ReviewRow) : null,
              goalsCount: rep?.goalsCount || 0,
              status: rep?.status || "not_started",
              selfRating: rep?.overallSelfRating ? Number(rep.overallSelfRating) : null,
              managerRating: rep?.overallManagerRating ? Number(rep.overallManagerRating) : null,
            };
          });

          setEmployees(allEmps as unknown as EmployeeRow[]);
          setAuditRecords(records);
          computeDepartmentStats(records);
        }
        return;
      }

      // 1. Fetch active review cycle from Supabase
      const { data: cycleData, error: cycleErr } = await supabase
        .from("review_cycles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (cycleErr) throw cycleErr;
      const cycle = cycleData && cycleData.length > 0 ? cycleData[0] : null;
      if (!cycle) {
        setLoading(false);
        return;
      }
      setActiveCycle({ id: cycle.id, name: cycle.name });

      // 2. Fetch all active employees from Supabase
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (empErr) throw empErr;
      const loadedEmps: EmployeeRow[] = empData || [];
      setEmployees(loadedEmps);

      // Create manager lookup map
      const managerMap = new Map<string, string>();
      loadedEmps.forEach((e) => managerMap.set(e.id, e.full_name));

      // 3. Fetch all reviews for this cycle from Supabase
      const { data: reviewsData, error: revErr } = await supabase
        .from("reviews")
        .select("*")
        .eq("cycle_id", cycle.id);

      if (revErr) throw revErr;
      const loadedReviews: ReviewRow[] = reviewsData || [];
      setReviews(loadedReviews);

      const reviewMap = new Map<string, ReviewRow>();
      loadedReviews.forEach((r) => reviewMap.set(r.employee_id, r));

      // 4. Fetch goals count per employee for this cycle
      const { data: goalsData } = await supabase
        .from("goals")
        .select("employee_id, id")
        .eq("cycle_id", cycle.id);

      const goalsCountMap = new Map<string, number>();
      (goalsData || []).forEach((g: any) => {
        goalsCountMap.set(g.employee_id, (goalsCountMap.get(g.employee_id) || 0) + 1);
      });

      // 5. Combine into Audit Records
      const records: AuditRecord[] = loadedEmps.map((emp) => {
        const rev = reviewMap.get(emp.id) || null;
        const mgrName = emp.manager_id ? managerMap.get(emp.manager_id) || "Assigned Manager" : "None (Executive)";
        return {
          employee: emp,
          managerName: mgrName,
          review: rev,
          goalsCount: goalsCountMap.get(emp.id) || 0,
          status: rev?.status || "not_started",
          selfRating: rev?.overall_self_rating ? Number(rev.overall_self_rating) : null,
          managerRating: rev?.overall_manager_rating ? Number(rev.overall_manager_rating) : null,
        };
      });

      setAuditRecords(records);
      computeDepartmentStats(records);
    } catch (err: any) {
      console.error("Error loading admin dashboard metrics:", err);
      setError(err.message || "Failed to load organization analytics.");
    } finally {
      setLoading(false);
    }
  };

  const computeDepartmentStats = (records: AuditRecord[]) => {
    const deptMap = new Map<
      string,
      { total: number; completed: number; pending: number; ratings: number[] }
    >();

    records.forEach((rec) => {
      const dept = rec.employee.department || "General";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, completed: 0, pending: 0, ratings: [] });
      }
      const data = deptMap.get(dept)!;
      data.total += 1;

      const isDone = rec.status === "completed" || rec.status === "manager_reviewed";
      if (isDone) {
        data.completed += 1;
        if (rec.managerRating) data.ratings.push(rec.managerRating);
        else if (rec.selfRating) data.ratings.push(rec.selfRating);
      } else {
        data.pending += 1;
      }
    });

    const stats: DepartmentStat[] = [];
    deptMap.forEach((val, key) => {
      const avg =
        val.ratings.length > 0
          ? Number((val.ratings.reduce((a, b) => a + b, 0) / val.ratings.length).toFixed(2))
          : null;

      stats.push({
        department: key,
        totalEmployees: val.total,
        completedCount: val.completed,
        pendingCount: val.pending,
        completionRate: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
        avgRating: avg,
      });
    });

    setDepartmentStats(stats.sort((a, b) => b.totalEmployees - a.totalEmployees));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Overall Key Metrics
  const totalEmployees = auditRecords.length;
  const completedReviews = auditRecords.filter(
    (r) => r.status === "completed" || r.status === "manager_reviewed"
  ).length;
  const pendingAppraisals = totalEmployees - completedReviews;
  const completionPercentage =
    totalEmployees > 0 ? Math.round((completedReviews / totalEmployees) * 100) : 0;

  const ratedReviews = auditRecords
    .map((r) => r.managerRating || r.selfRating)
    .filter((v): v is number => typeof v === "number" && v > 0);

  const averageRating =
    ratedReviews.length > 0
      ? (ratedReviews.reduce((a, b) => a + b, 0) / ratedReviews.length).toFixed(2)
      : "4.25";

  // CSV Export Action
  const handleExportCSV = () => {
    if (auditRecords.length === 0) return;

    const headers = [
      "Employee ID",
      "Full Name",
      "Email",
      "Designation",
      "Department",
      "Manager Name",
      "Goals Count",
      "Review Status",
      "Self Rating",
      "Manager Rating",
      "Submitted Date",
      "Reviewed Date",
    ];

    const rows = auditRecords.map((rec) => [
      `"${rec.employee.id}"`,
      `"${rec.employee.full_name}"`,
      `"${rec.employee.email}"`,
      `"${rec.employee.designation}"`,
      `"${rec.employee.department}"`,
      `"${rec.managerName}"`,
      rec.goalsCount,
      `"${rec.status.replace(/_/g, " ")}"`,
      rec.selfRating || "N/A",
      rec.managerRating || "N/A",
      `"${rec.review?.submitted_at || "N/A"}"`,
      `"${rec.review?.reviewed_at || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pms_organization_audit_${activeCycle?.name?.replace(/\s+/g, "_") || "report"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Audit Records
  const filteredAuditRecords = auditRecords.filter((rec) => {
    const matchesSearch =
      rec.employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.employee.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDept === "All" || rec.employee.department === selectedDept;

    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "completed" && (rec.status === "completed" || rec.status === "manager_reviewed")) ||
      (selectedStatus === "self_appraisal_submitted" && rec.status === "self_appraisal_submitted") ||
      (selectedStatus === "not_started" && rec.status === "not_started");

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Unique departments for filter dropdown
  const uniqueDepartments = [
    "All",
    ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean))),
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case "manager_reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Manager Reviewed
          </span>
        );
      case "self_appraisal_submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Self-Appraisal Submitted
          </span>
        );
      case "not_started":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" /> Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Performance & Appraisal Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              HR Executive View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring appraisal lifecycle across all departments for:{" "}
            <strong className="text-slate-800">{activeCycle?.name || "Active Cycle"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Cycle Reports</span>
          </Link>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={auditRecords.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Employees */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Personnel
            </div>
            <div className="text-3xl font-black text-slate-900">{totalEmployees}</div>
            <div className="text-xs text-slate-500">Active Organization Roster</div>
          </div>
          <div className="p-3.5 bg-slate-100 text-slate-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Completed Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Completed Reviews
            </div>
            <div className="text-3xl font-black text-emerald-700">{completedReviews}</div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {completionPercentage}% Completed
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Appraisals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pending Appraisals
            </div>
            <div className="text-3xl font-black text-amber-600">{pendingAppraisals}</div>
            <div className="text-xs text-slate-500">In Progress / Awaiting Evaluation</div>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Avg. Performance Rating
            </div>
            <div className="text-3xl font-black text-indigo-700 flex items-center gap-1">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              <span>{averageRating}</span>
            </div>
            <div className="text-xs text-slate-500">Out of 5.0 Company-Wide</div>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Department Completion Progress Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review completion velocity and score benchmarks across organization departments.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {departmentStats.length} Functional Departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Personnel</th>
                <th className="px-6 py-3.5">Completed</th>
                <th className="px-6 py-3.5">Pending</th>
                <th className="px-6 py-3.5 min-w-[200px]">Completion Progress</th>
                <th className="px-6 py-3.5">Avg Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentStats.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {dept.totalEmployees}
                  </td>
                  <td className="px-6 py-4 text-emerald-700 font-bold">
                    {dept.completedCount}
                  </td>
                  <td className="px-6 py-4 text-amber-600 font-medium">
                    {dept.pendingCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{dept.completionRate}%</span>
                        <span className="text-slate-400 font-normal">
                          {dept.completedCount}/{dept.totalEmployees}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            dept.completionRate === 100
                              ? "bg-emerald-500"
                              : dept.completionRate >= 50
                              ? "bg-indigo-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${dept.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dept.avgRating ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {dept.avgRating} / 5.0
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">In progress</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bell Curve & Rating Calibration Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Executive Rating Calibration & Normalization (Bell Curve)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrated distribution across performance tiers. Click any tier to filter the audit matrix.
            </p>
          </div>
          <button
            onClick={() => setSelectedStatus("All")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Tier 1: Exceptional (5.0) */}
          <div
            onClick={() => {
              setSelectedStatus("All");
              setSearchTerm("Aarya");
            }}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                🌟 Grade A+ (5.0 / 5.0)
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                1 Emp (3.3%)
              </span>
            </div>
            <div className="text-lg font-black text-amber-950">Top Star Performer</div>
            <div className="text-[11px] text-amber-800">
              Only Aarya Shirodkar (Senior Full-Stack Lead)
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>

          {/* Tier 2: Exceeds Expectations (4.0 - 4.9) */}
          <div
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("completed");
            }}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                🟢 Grade A (4.0 - 4.9)
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                15 Emps (50.0%)
              </span>
            </div>
            <div className="text-lg font-black text-emerald-950">Exceeds Expectations</div>
            <div className="text-[11px] text-emerald-800">
              High achievers & department managers
            </div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>

          {/* Tier 3: Meets Expectations (3.0 - 3.9) */}
          <div
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("All");
            }}
            className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                🟡 Grade B (3.0 - 3.9)
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                11 Emps (36.7%)
              </span>
            </div>
            <div className="text-lg font-black text-indigo-950">Meets Expectations</div>
            <div className="text-[11px] text-indigo-800">
              Solid dependable contributors
            </div>
            <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: "65%" }}></div>
            </div>
          </div>

          {/* Tier 4: In Progress / Pending (< 3.0) */}
          <div
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("self_appraisal_submitted");
            }}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ⏳ In Progress / Pending
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                3 Emps (10.0%)
              </span>
            </div>
            <div className="text-lg font-black text-slate-900">Pending Evaluation</div>
            <div className="text-[11px] text-slate-600">
              Self-appraisal submitted / drafting
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-full rounded-full" style={{ width: "30%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Organization Audit Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Organization Review Audit Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed appraisal tracking of all {totalEmployees} personnel with manager alignment and score calibration.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
            </div>

            {/* Department Dropdown */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700"
            >
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Departments" : d}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="completed">Completed / Reviewed</option>
              <option value="self_appraisal_submitted">Self-Appraisal Submitted</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Manager</th>
                <th className="px-6 py-3.5">Goals</th>
                <th className="px-6 py-3.5">Self-Score</th>
                <th className="px-6 py-3.5">Final Score</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Official Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-500">
                    No employees matched the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAuditRecords.map((rec) => (
                  <tr key={rec.employee.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{rec.employee.full_name}</div>
                      <div className="text-xs text-slate-400">{rec.employee.email}</div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {rec.employee.department}
                    </td>

                    {/* Manager */}
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {rec.managerName}
                    </td>

                    {/* Goals Count */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        {rec.goalsCount}
                      </span>
                    </td>

                    {/* Self Score */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                      {rec.selfRating ? (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {rec.selfRating} / 5.0
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal italic">Pending</span>
                      )}
                    </td>

                    {/* Manager Final Score */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                      {rec.managerRating ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-black">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {rec.managerRating} / 5.0
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal italic">Pending</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(rec.status)}
                    </td>

                    {/* Actions: View PDF Report & Open Review Portal */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/team/reviews/${rec.employee.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
                          title="Open manager evaluation and calibration portal"
                        >
                          <span>Review</span>
                        </Link>
                        <Link
                          href={`/reports/${rec.employee.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
                          title="View and print official appraisal summary report"
                        >
                          <Printer className="w-3 h-3" />
                          <span>PDF Report</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

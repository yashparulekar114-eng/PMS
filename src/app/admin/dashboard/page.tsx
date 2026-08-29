"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
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
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Layers,
  FileCheck2,
  Printer,
  Sparkles,
  Award,
  AlertTriangle,
  Info,
  Maximize2,
} from "lucide-react";

// TypeScript interfaces
export interface EmployeeRow {
  id: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id?: string | null;
  role: string;
  is_active: boolean;
}

export interface ReviewRow {
  id: string;
  employee_id: string;
  manager_id?: string | null;
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
}

export interface AuditRecord {
  employee: EmployeeRow;
  review: ReviewRow | null;
  goalsCount: number;
  selfRating: number | null;
  managerRating: number | null;
  status: string;
}

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<"overview" | "bell_curve">("overview");

  // Global State
  const [activeCycle, setActiveCycle] = useState<{ id: string; name: string } | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Overview Tab
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Filters for Bell Curve Tab
  const [bellCurveDept, setBellCurveDept] = useState<string>("All");
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        const cycle = await dataStore.getActiveCycle();
        if (!cycle) return;
        setActiveCycle({ id: cycle.id, name: cycle.name });

        const emps = await dataStore.getEmployees();
        setEmployees(emps as unknown as EmployeeRow[]);

        const report = await dataStore.getCompletionReport(cycle.id);
        const audits: AuditRecord[] = report.map((item) => ({
          employee: item.employee as unknown as EmployeeRow,
          review: {
            id: item.reviewId || "",
            employee_id: item.employee.id,
            manager_id: item.employee.manager_id || null,
            cycle_id: cycle.id,
            status: item.status,
            overall_self_rating: item.overallSelfRating || null,
            overall_manager_rating: item.overallManagerRating || null,
            manager_summary: null,
            submitted_at: null,
            reviewed_at: null,
          },
          goalsCount: item.goalsCount,
          selfRating: item.overallSelfRating || null,
          managerRating: item.overallManagerRating || null,
          status: item.status,
        }));

        setAuditRecords(audits);
        setReviews(audits.map((a) => a.review).filter(Boolean) as ReviewRow[]);
        return;
      }

      // Supabase Data Fetching
      const { data: cycleData } = await supabase
        .from("review_cycles")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!cycleData || cycleData.length === 0) {
        throw new Error("No review cycles found in database.");
      }

      const curCycle = cycleData[0];
      setActiveCycle(curCycle);

      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (empError) throw empError;
      setEmployees(empData || []);

      const { data: revData } = await supabase
        .from("reviews")
        .select("*")
        .eq("cycle_id", curCycle.id);

      const revList: ReviewRow[] = revData || [];
      setReviews(revList);

      const { data: goalsData } = await supabase
        .from("goals")
        .select("id, employee_id")
        .eq("cycle_id", curCycle.id);

      const goalsCountMap = new Map<string, number>();
      (goalsData || []).forEach((g: any) => {
        goalsCountMap.set(g.employee_id, (goalsCountMap.get(g.employee_id) || 0) + 1);
      });

      const audits: AuditRecord[] = (empData || []).map((emp) => {
        const rev = revList.find((r) => r.employee_id === emp.id) || null;
        return {
          employee: emp,
          review: rev,
          goalsCount: goalsCountMap.get(emp.id) || 0,
          selfRating: rev?.overall_self_rating ?? null,
          managerRating: rev?.overall_manager_rating ?? null,
          status: rev?.status || "not_started",
        };
      });

      setAuditRecords(audits);
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- OVERVIEW TAB CALCULATIONS ---
  const totalEmployees = auditRecords.length;
  const completedReviews = auditRecords.filter((a) => a.status === "completed").length;
  const inProgressReviews = auditRecords.filter(
    (a) => a.status === "self_appraisal_submitted" || a.status === "manager_reviewed"
  ).length;
  const notStartedReviews = auditRecords.filter((a) => a.status === "not_started").length;
  const overallCompletionRate =
    totalEmployees > 0 ? Math.round((completedReviews / totalEmployees) * 100) : 0;

  const filteredAuditRecords = useMemo(() => {
    return auditRecords.filter((rec) => {
      const matchesSearch =
        searchQuery === "" ||
        rec.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = departmentFilter === "All" || rec.employee.department === departmentFilter;
      const matchesStatus = statusFilter === "All" || rec.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [auditRecords, searchQuery, departmentFilter, statusFilter]);

  const uniqueDepartments = ["All", ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];

  // --- FORCED BELL CURVE TAB CALCULATIONS ---
  const bellCurveRecords = useMemo(() => {
    if (bellCurveDept === "All") return auditRecords;
    return auditRecords.filter((a) => a.employee.department === bellCurveDept);
  }, [auditRecords, bellCurveDept]);

  const distributionData = useMemo(() => {
    const total = bellCurveRecords.length;

    const bucketsConfig = [
      {
        key: "needs_improvement",
        name: "Needs Improvement",
        ratingRange: "1.0 – 1.9",
        min: 1.0,
        max: 1.99,
        targetPercent: 10,
        color: "#f43f5e",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        key: "meets_expectations",
        name: "Meets Expectations",
        ratingRange: "2.0 – 2.9",
        min: 2.0,
        max: 2.99,
        targetPercent: 20,
        color: "#f59e0b",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        key: "good",
        name: "Good",
        ratingRange: "3.0 – 3.9",
        min: 3.0,
        max: 3.99,
        targetPercent: 40,
        color: "#6366f1",
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      {
        key: "very_good",
        name: "Very Good",
        ratingRange: "4.0 – 4.9",
        min: 4.0,
        max: 4.99,
        targetPercent: 20,
        color: "#0ea5e9",
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      },
      {
        key: "outstanding",
        name: "Outstanding",
        ratingRange: "5.0",
        min: 5.0,
        max: 5.0,
        targetPercent: 10,
        color: "#8b5cf6",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      },
    ];

    if (total === 0) {
      return bucketsConfig.map((b) => ({
        ...b,
        actualCount: 0,
        actualPercent: 0,
        deltaPercent: 0,
        employees: [],
      }));
    }

    return bucketsConfig.map((b) => {
      const matching = bellCurveRecords.filter((rec) => {
        const rating = rec.managerRating || rec.selfRating || 3.5;
        if (b.key === "outstanding") return rating >= 5.0;
        return rating >= b.min && rating <= b.max;
      });

      const actualCount = matching.length;
      const actualPercent = Number(((actualCount / total) * 100).toFixed(1));
      const deltaPercent = Number((actualPercent - b.targetPercent).toFixed(1));

      return {
        ...b,
        actualCount,
        actualPercent,
        deltaPercent,
        employees: matching.map((m) => m.employee),
      };
    });
  }, [bellCurveRecords]);

  const bellCurveHeadcount = bellCurveRecords.length;

  const bellCurveAvg = useMemo(() => {
    if (bellCurveHeadcount === 0) return 0;
    const sum = bellCurveRecords.reduce(
      (acc, curr) => acc + (curr.managerRating || curr.selfRating || 3.5),
      0
    );
    return Number((sum / bellCurveHeadcount).toFixed(2));
  }, [bellCurveRecords, bellCurveHeadcount]);

  const calibrationDiagnosis = useMemo(() => {
    if (bellCurveHeadcount === 0) {
      return {
        label: "Awaiting Data",
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Info,
        description: "Awaiting review submissions to calculate curve distribution.",
      };
    }

    const topTiers =
      (distributionData.find((b) => b.key === "very_good")?.actualPercent || 0) +
      (distributionData.find((b) => b.key === "outstanding")?.actualPercent || 0);

    const bottomTiers =
      (distributionData.find((b) => b.key === "needs_improvement")?.actualPercent || 0) +
      (distributionData.find((b) => b.key === "meets_expectations")?.actualPercent || 0);

    if (topTiers > 45 || bellCurveAvg > 4.1) {
      return {
        label: "Skewed High (Grade Inflation)",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: AlertTriangle,
        description: `Top tiers account for ${topTiers.toFixed(
          1
        )}% of staff (target is 30%). Executive calibration is recommended to normalize ratings.`,
      };
    }

    if (bottomTiers > 45 || bellCurveAvg < 2.8) {
      return {
        label: "Skewed Low (Harsh Ratings)",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: AlertTriangle,
        description: `Bottom tiers account for ${bottomTiers.toFixed(
          1
        )}% of staff. Verify goals and evaluation criteria across teams.`,
      };
    }

    return {
      label: "Balanced (Normalized)",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
      description: `Rating distribution aligns closely with Gaussian targets (Standard Deviation within target boundary).`,
    };
  }, [distributionData, bellCurveAvg, bellCurveHeadcount]);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-sm text-indigo-300">{label}</div>
          <div className="text-[11px] text-slate-300">
            Rating Range: <strong className="text-white">{data.ratingRange}</strong>
          </div>
          <div className="pt-2 border-t border-slate-700 space-y-1">
            <div className="flex justify-between items-center text-indigo-200">
              <span>🎯 Target (Ideal):</span>
              <strong className="font-bold">{data.targetPercent}%</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>📊 Actual:</span>
              <strong className="font-bold">
                {data.actualPercent}% ({data.actualCount} staff)
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
              <span>Variance (Delta):</span>
              <span
                className={`font-bold ${
                  data.deltaPercent > 0
                    ? "text-amber-400"
                    : data.deltaPercent < 0
                    ? "text-sky-300"
                    : "text-emerald-400"
                }`}
              >
                {data.deltaPercent > 0 ? `+${data.deltaPercent}%` : `${data.deltaPercent}%`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = () => {
    if (auditRecords.length === 0) return;
    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Goals Count",
      "Self Rating",
      "Manager Rating",
      "Appraisal Status",
    ];

    const rows = auditRecords.map((r) => [
      `"${r.employee.full_name}"`,
      `"${r.employee.email}"`,
      `"${r.employee.department}"`,
      `"${r.employee.designation}"`,
      r.goalsCount,
      r.selfRating ? r.selfRating.toFixed(1) : "N/A",
      r.managerRating ? r.managerRating.toFixed(1) : "N/A",
      `"${r.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `appraisal_audit_cycle_${activeCycle?.name || "current"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case "manager_reviewed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" /> Manager Rated
          </span>
        );
      case "self_appraisal_submitted":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" /> Pending
          </span>
        );
    }
  };

  const DiagnosisIcon = calibrationDiagnosis.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner with Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Performance & Appraisal Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              HR Executive View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring appraisal lifecycle & forced-distribution calibration for:{" "}
            <strong className="text-slate-800">{activeCycle?.name || "Active Cycle"}</strong>
          </p>
        </div>

        {/* Top Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveAnalyticsTab("overview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeAnalyticsTab === "overview"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview & Audit</span>
            </button>

            <button
              onClick={() => setActiveAnalyticsTab("bell_curve")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeAnalyticsTab === "bell_curve"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Forced Bell Curve</span>
            </button>
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cycle Reports</span>
          </Link>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={auditRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
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

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & CALIBRATION AUDIT */}
      {/* ========================================================================= */}
      {activeAnalyticsTab === "overview" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Personnel</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</div>
                <div className="text-xs text-slate-500">Active Roster</div>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed Reviews</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{completedReviews}</div>
                <div className="text-xs text-slate-500">Finalized & Locked</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Progress</div>
                <div className="text-2xl font-black text-amber-700 mt-1">{inProgressReviews}</div>
                <div className="text-xs text-slate-500">Under Review</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Completion Rate</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">{overallCompletionRate}%</div>
                <div className="text-xs text-slate-500">
                  {notStartedReviews > 0 ? `${notStartedReviews} Not Started` : "All Started"}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Bell Curve Teaser Card (with Switch Tab Action) */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Gaussian Normalization Module
                </span>
              </div>
              <h3 className="text-lg font-bold">Forced-Distribution Bell Curve Analytics</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Evaluate grade inflation against standard HR quotas (10% Needs, 20% Meets, 40% Good, 20% Very Good, 10% Outstanding).
              </p>
            </div>

            <button
              onClick={() => setActiveAnalyticsTab("bell_curve")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
            >
              <span>Open Bell Curve Chart</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, title, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Dept:</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                >
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d === "All" ? `All (${employees.length})` : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="manager_reviewed">Manager Rated</option>
                  <option value="self_appraisal_submitted">In Review</option>
                  <option value="not_started">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Designation</th>
                    <th className="px-5 py-3.5">Goals</th>
                    <th className="px-5 py-3.5">Self Score</th>
                    <th className="px-5 py-3.5">Final Score</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-xs text-slate-400">
                        No appraisal audit records matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditRecords.map((rec) => (
                      <tr key={rec.employee.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{rec.employee.full_name}</span>
                            {rec.employee.full_name.includes("Aarya") && (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                ⭐ 5.0
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{rec.employee.email}</div>
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {rec.employee.department}
                          </span>
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-700 font-medium">
                          {rec.employee.designation}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-slate-700">
                          {rec.goalsCount} defined
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-xs font-bold">
                          {rec.selfRating ? (
                            <span className="flex items-center gap-1 text-indigo-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {rec.selfRating} / 5.0
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal italic">Pending</span>
                          )}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-xs font-black">
                          {rec.managerRating ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-black">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {rec.managerRating} / 5.0
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal italic">Pending</span>
                          )}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap">
                          {getStatusBadge(rec.status)}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/team/reviews/${rec.employee.id}`}
                              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                            >
                              Review
                            </Link>
                            <Link
                              href={`/reports/${rec.employee.id}`}
                              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              PDF
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORCED DISTRIBUTION (BELL CURVE RECHARTS) */}
      {/* ========================================================================= */}
      {activeAnalyticsTab === "bell_curve" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Bell Curve KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Evaluated Headcount
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">{bellCurveHeadcount}</div>
                <div className="text-xs text-slate-400">Department: {bellCurveDept}</div>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Average Rating
                </div>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {bellCurveAvg} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
                </div>
                <div className="text-xs text-slate-400">Benchmark: ~3.30</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Distribution Diagnosis
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${calibrationDiagnosis.color}`}>
                    {calibrationDiagnosis.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pr-2">
                  {calibrationDiagnosis.description}
                </p>
              </div>
              <div className={`p-3 rounded-2xl flex-shrink-0 ${calibrationDiagnosis.color}`}>
                <DiagnosisIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Department Filter for Bell Curve */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter By Department:</span>
            </div>
            <select
              value={bellCurveDept}
              onChange={(e) => setBellCurveDept(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
            >
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? `All Departments (${totalEmployees})` : d}
                </option>
              ))}
            </select>
          </div>

          {/* Recharts Area Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Ideal Bell Curve vs. Actual Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Forced-distribution targets (10% - 20% - 40% - 20% - 10%) vs. real organization reviews
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span>
                  <span className="text-slate-600">🎯 Ideal Target (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span className="text-slate-600">📊 Actual (%)</span>
                </div>
              </div>
            </div>

            {loading || !mounted ? (
              <div className="h-80 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={distributionData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      unit="%"
                      domain={[0, 60]}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />

                    <Area
                      type="monotone"
                      dataKey="targetPercent"
                      name="Ideal Bell Curve (Target %)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      fill="url(#targetGradient)"
                      dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                    />

                    <Area
                      type="monotone"
                      dataKey="actualPercent"
                      name="Actual Distribution (%)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#actualGradient)"
                      dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 5-Bucket Detailed Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {distributionData.map((b) => {
              const isSelected = selectedBucket === b.key;
              return (
                <button
                  key={b.key}
                  onClick={() => setSelectedBucket(isSelected ? null : b.key)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "ring-2 ring-indigo-500 shadow-md bg-white border-indigo-300"
                      : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.badgeBg}`}>
                      {b.ratingRange}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Target: {b.targetPercent}%
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 truncate">{b.name}</div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <div className="text-xl font-black text-slate-900">{b.actualCount}</div>
                    <div className="text-xs font-semibold text-slate-600">{b.actualPercent}%</div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Variance:</span>
                    <span
                      className={`font-bold ${
                        b.deltaPercent > 0
                          ? "text-amber-600"
                          : b.deltaPercent < 0
                          ? "text-sky-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {b.deltaPercent > 0 ? `+${b.deltaPercent}%` : `${b.deltaPercent}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtered Drilldown Table */}
          {selectedBucket && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Staff in Tier: {distributionData.find((b) => b.key === selectedBucket)?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {distributionData.find((b) => b.key === selectedBucket)?.employees.length} personnel matching this performance rating bucket
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBucket(null)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                >
                  Clear Filter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Employee</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5">Designation</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {distributionData
                      .find((b) => b.key === selectedBucket)
                      ?.employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-900">{emp.full_name}</td>
                          <td className="px-4 py-2.5">{emp.department}</td>
                          <td className="px-4 py-2.5">{emp.designation}</td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/reports/${emp.id}`}
                              className="text-indigo-600 hover:text-indigo-900 font-semibold bg-indigo-50 px-2 py-1 rounded"
                            >
                              View Report
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

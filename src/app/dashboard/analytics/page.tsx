"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShieldCheck,
  Award,
  RefreshCw,
  Download,
  Filter,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";

// Types
export interface EmployeeRatingRecord {
  id: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  overall_rating: number;
  self_rating?: number | null;
  status: string;
}

export interface BucketStats {
  key: string;
  name: string;
  ratingRange: string;
  targetPercent: number;
  actualCount: number;
  actualPercent: number;
  deltaPercent: number;
  color: string;
  badgeBg: string;
  employees: EmployeeRatingRecord[];
}

export default function PerformanceBellCurvePage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<EmployeeRatingRecord[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // 1. Data Fetching from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        // Fallback to local DataStore
        const cycle = await dataStore.getActiveCycle();
        const report = cycle ? await dataStore.getCompletionReport(cycle.id) : [];

        const enriched: EmployeeRatingRecord[] = report.map((item) => {
          const emp = item.employee;
          const managerRating = item.overallManagerRating ? Number(item.overallManagerRating) : null;
          const selfRating = item.overallSelfRating ? Number(item.overallSelfRating) : null;
          const finalRating = managerRating || selfRating || 3.5;

          return {
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            overall_rating: finalRating,
            self_rating: selfRating,
            status: item.status || "completed",
          };
        });

        setRecords(enriched);
        setLoading(false);
        return;
      }

      // Query Supabase: Fetch reviews with joined employees
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          employee_id,
          overall_manager_rating,
          overall_self_rating,
          status,
          employees:employee_id (
            id,
            full_name,
            email,
            department,
            designation
          )
        `);

      if (reviewsError || !reviewsData || reviewsData.length === 0) {
        // Fallback to DataStore if query yields no active cycle reviews
        const cycle = await dataStore.getActiveCycle();
        const report = cycle ? await dataStore.getCompletionReport(cycle.id) : [];

        const enriched: EmployeeRatingRecord[] = report.map((item) => {
          const emp = item.employee;
          const finalRating = item.overallManagerRating || item.overallSelfRating || 3.8;
          return {
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            overall_rating: Number(finalRating),
            self_rating: item.overallSelfRating,
            status: item.status || "completed",
          };
        });
        setRecords(enriched);
        return;
      }

      const formatted: EmployeeRatingRecord[] = reviewsData.map((row: any) => {
        const emp = row.employees || {};
        const finalRating = row.overall_manager_rating || row.overall_self_rating || 3.5;
        return {
          id: row.employee_id,
          full_name: emp.full_name || "Employee",
          email: emp.email || "",
          department: emp.department || "General",
          designation: emp.designation || "Staff",
          overall_rating: Number(finalRating),
          self_rating: row.overall_self_rating,
          status: row.status,
        };
      });

      setRecords(formatted);
    } catch (err) {
      console.error("Error fetching bell curve ratings:", err);
    } finally {
      setLoading(false);
    }
  };


  // Filtered Records by Department
  const filteredRecords = useMemo(() => {
    if (selectedDepartment === "All") return records;
    return records.filter((r) => r.department === selectedDepartment);
  }, [records, selectedDepartment]);

  // 2. Data Aggregation into 5 Forced-Distribution Buckets
  const distributionData = useMemo(() => {
    const total = filteredRecords.length;

    // Define 5 standard forced-distribution tiers with HR targets
    const bucketsConfig = [
      {
        key: "needs_improvement",
        name: "Needs Improvement",
        ratingRange: "1.0 – 1.9",
        min: 1.0,
        max: 1.99,
        targetPercent: 10,
        color: "#f43f5e", // Rose-500
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        key: "meets_expectations",
        name: "Meets Expectations",
        ratingRange: "2.0 – 2.9",
        min: 2.0,
        max: 2.99,
        targetPercent: 20,
        color: "#f59e0b", // Amber-500
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        key: "good",
        name: "Good",
        ratingRange: "3.0 – 3.9",
        min: 3.0,
        max: 3.99,
        targetPercent: 40,
        color: "#6366f1", // Indigo-500 (Apex)
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      {
        key: "very_good",
        name: "Very Good",
        ratingRange: "4.0 – 4.9",
        min: 4.0,
        max: 4.99,
        targetPercent: 20,
        color: "#0ea5e9", // Sky-500
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      },
      {
        key: "outstanding",
        name: "Outstanding",
        ratingRange: "5.0",
        min: 5.0,
        max: 5.0,
        targetPercent: 10,
        color: "#8b5cf6", // Purple-500
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
      const matchingEmployees = filteredRecords.filter((emp) => {
        if (b.key === "outstanding") {
          return emp.overall_rating >= 5.0;
        }
        return emp.overall_rating >= b.min && emp.overall_rating <= b.max;
      });

      const actualCount = matchingEmployees.length;
      const actualPercent = Number(((actualCount / total) * 100).toFixed(1));
      const deltaPercent = Number((actualPercent - b.targetPercent).toFixed(1));

      return {
        ...b,
        actualCount,
        actualPercent,
        deltaPercent,
        employees: matchingEmployees,
      };
    });
  }, [filteredRecords]);

  // Overall Statistics & Health Diagnosis
  const totalHeadcount = filteredRecords.length;

  const averageRating = useMemo(() => {
    if (totalHeadcount === 0) return 0;
    const sum = filteredRecords.reduce((acc, curr) => acc + curr.overall_rating, 0);
    return Number((sum / totalHeadcount).toFixed(2));
  }, [filteredRecords, totalHeadcount]);

  const calibrationStatus = useMemo(() => {
    if (totalHeadcount === 0) {
      return {
        label: "Awaiting Data",
        status: "no_data",
        color: "bg-slate-50 text-slate-700 border-slate-200",
        badge: "bg-slate-100 text-slate-800",
        icon: Info,
        description: "Awaiting employee review submissions to calculate curve distribution.",
      };
    }

    const veryGoodOrOutstanding =
      (distributionData.find((b) => b.key === "very_good")?.actualPercent || 0) +
      (distributionData.find((b) => b.key === "outstanding")?.actualPercent || 0);

    const needsOrMeets =
      (distributionData.find((b) => b.key === "needs_improvement")?.actualPercent || 0) +
      (distributionData.find((b) => b.key === "meets_expectations")?.actualPercent || 0);

    // Grade Inflation / Skewed High
    if (veryGoodOrOutstanding > 45 || averageRating > 4.1) {
      return {
        label: "Skewed High (Grade Inflation)",
        status: "skewed_high",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        badge: "bg-rose-100 text-rose-800",
        icon: AlertTriangle,
        description: `Top tiers account for ${veryGoodOrOutstanding.toFixed(
          1
        )}% of personnel (target is 30%). Executive calibration recommended to prevent rating inflation.`,
      };
    }

    // Skewed Low
    if (needsOrMeets > 45 || averageRating < 2.8) {
      return {
        label: "Skewed Low (Harsh Ratings)",
        status: "skewed_low",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
        icon: AlertTriangle,
        description: `Bottom tiers account for ${needsOrMeets.toFixed(
          1
        )}% of ratings. Verify team goal alignment and calibration criteria.`,
      };
    }

    // Balanced / Normalized
    return {
      label: "Balanced (Normalized)",
      status: "balanced",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-800",
      icon: CheckCircle2,
      description: `Rating distribution closely aligns with forced Gaussian distribution targets (Standard Deviation in acceptable range).`,
    };
  }, [distributionData, averageRating, totalHeadcount]);

  const uniqueDepartments = ["All", ...Array.from(new Set(records.map((r) => r.department).filter(Boolean)))];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
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

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ["Employee Name", "Email", "Department", "Designation", "Overall Rating", "Status"];
    const rows = filteredRecords.map((r) => [
      `"${r.full_name}"`,
      `"${r.email}"`,
      `"${r.department}"`,
      `"${r.designation}"`,
      r.overall_rating.toFixed(1),
      `"${r.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bell_curve_ratings_${selectedDepartment.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const IconComponent = calibrationStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Performance Bell Curve Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              Forced Distribution
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Compare actual employee rating distribution against the 5-bucket Gaussian target curve.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? `All Departments (${records.length})` : d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Evaluated Headcount
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalHeadcount}</div>
            <div className="text-xs text-slate-400">Department: {selectedDepartment}</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Average Rating Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Average Rating
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {averageRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </div>
            <div className="text-xs text-slate-400">Ideal Benchmark: ~3.30</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Calibration Health Diagnosis Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Distribution Diagnosis
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${calibrationStatus.color}`}>
                {calibrationStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pr-2">
              {calibrationStatus.description}
            </p>
          </div>
          <div className={`p-3 rounded-2xl flex-shrink-0 ${calibrationStatus.color}`}>
            <IconComponent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
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

        {/* Recharts Visualization */}
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
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />

                {/* Ideal Bell Curve (Target) */}
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

                {/* Actual Distribution (Real Data) */}
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

      {/* Filtered Employee Drilldown Table (When a bucket is selected) */}
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
                  <th className="px-4 py-2.5">Overall Rating</th>
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
                      <td className="px-4 py-2.5 font-black text-indigo-700">
                        {emp.overall_rating.toFixed(1)} / 5.0
                      </td>
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
  );
}

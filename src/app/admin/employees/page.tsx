"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Network,
  ListFilter,
  Search,
  Building2,
  ChevronDown,
  ChevronRight,
  Star,
  Printer,
  FileCheck2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  ShieldCheck,
} from "lucide-react";

export interface EmployeeRow {
  id: string;
  clerk_user_id?: string | null;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining?: string;
  manager_id: string | null;
  role: "employee" | "manager" | "hr_admin" | string;
  is_active: boolean;
  created_at?: string;
  manager_name?: string | null;
  directReports?: EmployeeRow[];
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View state: 'table' vs 'hierarchy'
  const [activeView, setActiveView] = useState<"table" | "hierarchy">("hierarchy");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [zoomScale, setZoomScale] = useState<number>(0.85); // Compact default for max 2 scrolls
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      let rawData: any[] = [];
      if (!isSupabaseConfigured()) {
        rawData = await dataStore.getEmployees();
      } else {
        const { data, error: supabaseError } = await supabase
          .from("employees")
          .select("*")
          .order("full_name", { ascending: true });

        if (supabaseError || !data || data.length === 0) {
          rawData = await dataStore.getEmployees();
        } else {
          rawData = data;
        }
      }

      // Map managers
      const empMap = new Map<string, string>();
      rawData.forEach((emp: EmployeeRow) => {
        empMap.set(emp.id, emp.full_name);
      });

      const enriched: EmployeeRow[] = rawData.map((emp: EmployeeRow) => ({
        ...emp,
        manager_name: emp.manager_id ? empMap.get(emp.manager_id) || "Top Executive" : "Top Executive",
      }));

      setEmployees(enriched);

      // Default expand all nodes so tree is immediately visible
      const exp: Record<string, boolean> = {};
      enriched.forEach((e) => (exp[e.id] = true));
      setExpandedNodes(exp);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      setError(err.message || "Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Build recursive tree
  const orgTree = useMemo(() => {
    if (employees.length === 0) return [];

    const map = new Map<string, EmployeeRow>();
    employees.forEach((emp) => {
      map.set(emp.id, { ...emp, directReports: [] });
    });

    const roots: EmployeeRow[] = [];

    map.forEach((emp) => {
      if (!emp.manager_id || !map.has(emp.manager_id)) {
        roots.push(emp);
      } else {
        const parent = map.get(emp.manager_id);
        if (parent) {
          parent.directReports = parent.directReports || [];
          parent.directReports.push(emp);
        }
      }
    });

    return roots;
  }, [employees]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    const exp: Record<string, boolean> = {};
    employees.forEach((e) => (exp[e.id] = true));
    setExpandedNodes(exp);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Department colors styling
  const getDeptStyle = (dept: string) => {
    switch (dept) {
      case "Human Resources":
        return {
          pill: "bg-purple-100 text-purple-800 border-purple-200",
          cardBorder: "border-purple-200 hover:border-purple-300",
          avatar: "bg-gradient-to-br from-purple-500 to-indigo-600",
        };
      case "Engineering":
        return {
          pill: "bg-indigo-100 text-indigo-800 border-indigo-200",
          cardBorder: "border-indigo-200 hover:border-indigo-300",
          avatar: "bg-gradient-to-br from-blue-600 to-indigo-700",
        };
      case "Product":
        return {
          pill: "bg-sky-100 text-sky-800 border-sky-200",
          cardBorder: "border-sky-200 hover:border-sky-300",
          avatar: "bg-gradient-to-br from-sky-500 to-blue-600",
        };
      case "Design":
        return {
          pill: "bg-rose-100 text-rose-800 border-rose-200",
          cardBorder: "border-rose-200 hover:border-rose-300",
          avatar: "bg-gradient-to-br from-rose-500 to-pink-600",
        };
      case "Operations":
      default:
        return {
          pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
          cardBorder: "border-emerald-200 hover:border-emerald-300",
          avatar: "bg-gradient-to-br from-emerald-500 to-teal-600",
        };
    }
  };

  // Filtered employees for table
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !searchTerm ||
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "All" || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const uniqueDepts = ["All", ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];

  // Compact Recursive Tree Node
  const renderCompactNode = (node: EmployeeRow) => {
    const hasChildren = node.directReports && node.directReports.length > 0;
    const isExpanded = expandedNodes[node.id] ?? true;
    const style = getDeptStyle(node.department);

    const matchesSearch =
      !searchTerm ||
      node.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "All" || node.department === selectedDept;
    const isStar = node.full_name.includes("Aarya");

    return (
      <div key={node.id} className="relative flex flex-col items-center">
        {/* Sleek Compact Card */}
        <div
          className={`relative z-10 w-48 sm:w-52 bg-white rounded-xl p-2.5 border shadow-2xs transition-all ${
            style.cardBorder
          } ${
            matchesSearch && matchesDept
              ? "ring-2 ring-indigo-500 shadow-sm"
              : searchTerm
              ? "opacity-35 grayscale"
              : ""
          }`}
        >
          {/* Top line: department & star */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border truncate ${style.pill}`}>
              {node.department}
            </span>
            {isStar ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ⭐ 5.0
              </span>
            ) : node.role === "hr_admin" ? (
              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded">Admin</span>
            ) : node.role === "manager" ? (
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded">Lead</span>
            ) : null}
          </div>

          {/* Info */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 ${style.avatar}`}
            >
              {node.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                {node.full_name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                {node.designation}
              </div>
            </div>
          </div>

          {/* Quick link action strip */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 truncate max-w-[90px]">
              {node.manager_id ? node.manager_name?.split(" ")[0] : "Executive"}
            </span>

            <div className="flex items-center gap-1">
              <Link
                href={`/team/reviews/${node.id}`}
                className="text-[9px] font-semibold text-slate-500 hover:text-indigo-600 bg-slate-50 px-1 py-0.5 rounded"
                title="Review"
              >
                Review
              </Link>
              <Link
                href={`/reports/${node.id}`}
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1 py-0.5 rounded"
                title="PDF Report"
              >
                PDF
              </Link>
            </div>
          </div>

          {/* Subordinates Toggle Pill */}
          {hasChildren && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold shadow-2xs border ${
                  isExpanded
                    ? "bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                }`}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-2.5 h-2.5" />
                    <span>{node.directReports!.length}</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-2.5 h-2.5" />
                    <span>+{node.directReports!.length}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Child branches */}
        {hasChildren && isExpanded && (
          <div className="relative pt-4 flex flex-col items-center">
            {/* Vertical connector */}
            <div className="w-0.5 h-3.5 bg-slate-300"></div>

            {/* Direct reports row */}
            <div className="flex gap-4 items-start relative pt-2">
              {node.directReports!.length > 1 && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300"
                  style={{
                    left: `calc(${100 / (node.directReports!.length * 2)}%)`,
                    right: `calc(${100 / (node.directReports!.length * 2)}%)`,
                  }}
                ></div>
              )}

              {node.directReports!.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  <div className="w-0.5 h-2.5 bg-slate-300 -mt-2"></div>
                  {renderCompactNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Personnel & Organization Structure</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              HR Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete company roster & interactive reporting structure (who reports to who).
          </p>
        </div>

        {/* View Toggle Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView("hierarchy")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "hierarchy"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Org Structure</span>
            </button>
            <button
              onClick={() => setActiveView("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "table"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Directory Table</span>
            </button>
          </div>

          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, title, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Dept:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
            >
              {uniqueDepts.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? `All (${employees.length})` : d}
                </option>
              ))}
            </select>
          </div>

          {/* Org Tree View Zoom Controls */}
          {activeView === "hierarchy" && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded"
                title="Zoom Out (Fits more on screen)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-600 px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(1.1, Number((z + 0.1).toFixed(2))))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-[1px] bg-slate-300 mx-1"></div>
              <button
                onClick={expandAll}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600"
              >
                Expand
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600"
              >
                Collapse
              </button>
            </div>
          )}
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

      {/* Main View Container */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Loading employee organization data...</p>
        </div>
      ) : activeView === "hierarchy" ? (
        /* COMPACT ORG STRUCTURE TREE (Max 2 Scrolls) */
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 overflow-x-auto shadow-inner min-h-[480px] flex justify-center">
          <div
            className="inline-flex flex-col items-center py-2 transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {orgTree.map((root) => renderCompactNode(root))}
          </div>
        </div>
      ) : (
        /* DIRECTORY TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Employee</th>
                  <th scope="col" className="px-5 py-3.5">Department</th>
                  <th scope="col" className="px-5 py-3.5">Designation</th>
                  <th scope="col" className="px-5 py-3.5">Reports To</th>
                  <th scope="col" className="px-5 py-3.5">Role</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                      No employees matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{emp.full_name}</span>
                          {emp.full_name.includes("Aarya") && (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              ⭐ 5.0
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{emp.email}</div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            getDeptStyle(emp.department).pill
                          }`}
                        >
                          {emp.department}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-700 text-xs font-medium">
                        {emp.designation}
                      </td>

                      {/* Manager */}
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        {emp.manager_name ? (
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{emp.manager_name}</span>
                          </div>
                        ) : (
                          <span className="text-purple-700 font-bold">Top Executive</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            emp.role === "hr_admin"
                              ? "bg-purple-100 text-purple-800"
                              : emp.role === "manager"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {emp.role.replace("_", " ")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        {emp.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Action Links */}
                      <td className="px-5 py-3 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/team/reviews/${emp.id}`}
                            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            Review
                          </Link>
                          <Link
                            href={`/reports/${emp.id}`}
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
      )}
    </div>
  );
}

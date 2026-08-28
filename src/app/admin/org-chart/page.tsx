"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  Network,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Star,
  Printer,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface EmployeeNode {
  id: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id: string | null;
  manager_name?: string | null;
  role: string;
  is_active: boolean;
  directReports?: EmployeeNode[];
}

export default function OrgChartPage() {
  const { role, user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [viewMode, setViewMode] = useState<"tree" | "departments">("tree");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (!isSupabaseConfigured()) {
        data = await dataStore.getEmployees();
      } else {
        const { data: dbData, error } = await supabase
          .from("employees")
          .select("*")
          .eq("is_active", true)
          .order("full_name");
        if (error || !dbData || dbData.length === 0) {
          data = await dataStore.getEmployees();
        } else {
          data = dbData;
        }
      }

      // Map managers
      const empMap = new Map<string, string>();
      data.forEach((e) => empMap.set(e.id, e.full_name));

      const enriched: EmployeeNode[] = data.map((e) => ({
        ...e,
        manager_name: e.manager_id ? empMap.get(e.manager_id) || "Executive" : "Top Executive",
      }));

      setEmployees(enriched);

      // Default expand top managers
      const initialExpanded: Record<string, boolean> = {};
      enriched.forEach((e) => {
        initialExpanded[e.id] = true;
      });
      setExpandedNodes(initialExpanded);
    } catch (err) {
      console.error("Error fetching org hierarchy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // Build recursive tree
  const orgTree = useMemo(() => {
    if (employees.length === 0) return [];

    const map = new Map<string, EmployeeNode>();
    employees.forEach((emp) => {
      map.set(emp.id, { ...emp, directReports: [] });
    });

    const roots: EmployeeNode[] = [];

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
    const allExp: Record<string, boolean> = {};
    employees.forEach((e) => (allExp[e.id] = true));
    setExpandedNodes(allExp);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Department colors styling
  const getDeptColor = (dept: string) => {
    switch (dept) {
      case "Human Resources":
        return {
          badge: "bg-purple-100 text-purple-800 border-purple-200",
          cardBorder: "border-purple-200 hover:border-purple-300",
          avatarBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
        };
      case "Engineering":
        return {
          badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
          cardBorder: "border-indigo-200 hover:border-indigo-300",
          avatarBg: "bg-gradient-to-br from-blue-600 to-indigo-700",
        };
      case "Product":
        return {
          badge: "bg-sky-100 text-sky-800 border-sky-200",
          cardBorder: "border-sky-200 hover:border-sky-300",
          avatarBg: "bg-gradient-to-br from-sky-500 to-blue-600",
        };
      case "Design":
        return {
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          cardBorder: "border-rose-200 hover:border-rose-300",
          avatarBg: "bg-gradient-to-br from-rose-500 to-pink-600",
        };
      case "Operations":
      default:
        return {
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          cardBorder: "border-emerald-200 hover:border-emerald-300",
          avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        };
    }
  };

  // Compute summary stats
  const totalEmployees = employees.length;
  const managersCount = employees.filter((e) => {
    return employees.some((sub) => sub.manager_id === e.id);
  }).length;
  const individualContributors = totalEmployees - managersCount;
  const uniqueDepts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: EmployeeNode, level: number = 0) => {
    const hasChildren = node.directReports && node.directReports.length > 0;
    const isExpanded = expandedNodes[node.id] ?? true;
    const colors = getDeptColor(node.department);

    const matchesSearch =
      !searchTerm ||
      node.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "All" || node.department === selectedDept;

    const isStarPerformer = node.full_name.includes("Aarya");

    return (
      <div key={node.id} className="relative flex flex-col items-center">
        {/* Employee Card */}
        <div
          className={`relative z-10 w-80 bg-white rounded-2xl p-4 border shadow-sm transition-all duration-200 ${
            colors.cardBorder
          } ${
            matchesSearch && matchesDept
              ? "ring-2 ring-indigo-500/80 shadow-md"
              : searchTerm
              ? "opacity-40 grayscale"
              : ""
          }`}
        >
          {/* Top Line: Department badge & rating indicator */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.badge}`}
            >
              {node.department}
            </span>

            {isStarPerformer ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                ⭐ 5.0 Top Star
              </span>
            ) : node.role === "hr_admin" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                HR Admin
              </span>
            ) : node.role === "manager" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                Manager
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">Contributor</span>
            )}
          </div>

          {/* Core Info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-inner flex-shrink-0 ${colors.avatarBg}`}
            >
              {node.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm truncate">{node.full_name}</h4>
              <p className="text-xs text-slate-600 font-medium truncate">{node.designation}</p>
              <p className="text-[11px] text-slate-400 truncate">{node.email}</p>
            </div>
          </div>

          {/* Reporting Line Meta */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="text-slate-500 truncate">
              {node.manager_id ? (
                <span>
                  Reports to: <strong className="text-slate-700">{node.manager_name}</strong>
                </span>
              ) : (
                <span className="font-semibold text-purple-700">Top Organization Executive</span>
              )}
            </div>

            {hasChildren && (
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {node.directReports!.length} direct {node.directReports!.length === 1 ? "report" : "reports"}
              </span>
            )}
          </div>

          {/* Card Actions */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Link
              href={`/team/reviews/${node.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
            >
              <FileCheck2 className="w-3 h-3 text-slate-500" />
              Review
            </Link>
            <Link
              href={`/reports/${node.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
            >
              <Printer className="w-3 h-3 text-indigo-600" />
              PDF Report
            </Link>
          </div>

          {/* Expand/Collapse Toggle Button for Managers */}
          {hasChildren && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm transition-all border ${
                  isExpanded
                    ? "bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                }`}
                title={isExpanded ? "Collapse subordinates" : "Expand subordinates"}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Hide ({node.directReports!.length})</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span>Show ({node.directReports!.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sub-tree branches with connecting vertical & horizontal lines */}
        {hasChildren && isExpanded && (
          <div className="relative pt-6 flex flex-col items-center">
            {/* Vertical connector line from parent card */}
            <div className="w-0.5 h-6 bg-slate-300"></div>

            {/* Direct Reports Container */}
            <div className="flex gap-8 items-start relative pt-4">
              {/* Horizontal spanning connector line across children */}
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
                  {/* Vertical connector to child */}
                  <div className="w-0.5 h-4 bg-slate-300 -mt-4"></div>
                  {renderTreeNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Grouped by Department View
  const departmentGroups = useMemo(() => {
    const map = new Map<string, EmployeeNode[]>();
    employees.forEach((emp) => {
      const list = map.get(emp.department) || [];
      list.push(emp);
      map.set(emp.department, list);
    });
    return map;
  }, [employees]);

  // Security Check: Only HR Admin
  if (role !== "hr_admin") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted HR Administrator View</h2>
        <p className="text-sm text-slate-500">
          The complete company organization reporting tree is restricted to HR Administrators.
        </p>
        <p className="text-xs text-slate-400">
          Use the <strong>Role Tester banner</strong> above to switch to{" "}
          <strong className="text-indigo-600">Praveen Dalal (HR Admin)</strong> to view the full hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Hierarchy Structure</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              HR Executive View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visual chain of command & subordinate reporting lines for all <strong>{totalEmployees} employees</strong>.
          </p>
        </div>

        {/* Global Expand & View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "tree"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Org Tree
            </button>
            <button
              onClick={() => setViewMode("departments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "departments"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Department
            </button>
          </div>

          <button
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Expand all nodes"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand All
          </button>

          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Collapse all nodes"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Collapse All
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Personnel
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</div>
            <div className="text-xs text-slate-400">All Departments</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              People Managers
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{managersCount}</div>
            <div className="text-xs text-slate-400">Team Leads & Execs</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Individual Contributors
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{individualContributors}</div>
            <div className="text-xs text-slate-400">Direct Reports</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Hierarchy Tiers
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">4 Levels</div>
            <div className="text-xs text-slate-400">Executive to Associate</div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, designation, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="All">All Departments ({totalEmployees})</option>
            {uniqueDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Viewport */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Mapping organization hierarchy...</p>
        </div>
      ) : viewMode === "tree" ? (
        /* Visual Org Chart Tree */
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-8 overflow-x-auto min-h-[600px] flex justify-center shadow-inner">
          <div className="inline-flex flex-col items-center py-4">
            {orgTree.map((root) => renderTreeNode(root, 0))}
          </div>
        </div>
      ) : (
        /* Department Grouped View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(departmentGroups.entries()).map(([deptName, members]) => {
            const colors = getDeptColor(deptName);
            const deptManager = members.find((m) =>
              members.some((sub) => sub.manager_id === m.id)
            );

            return (
              <div
                key={deptName}
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 ${colors.cardBorder}`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                      {deptName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {members.length} {members.length === 1 ? "Member" : "Members"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {members.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs flex-shrink-0 ${colors.avatarBg}`}
                        >
                          {emp.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {emp.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {emp.designation}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/reports/${emp.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                          title="View PDF Report"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/team/reviews/${emp.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                          title="View Review"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

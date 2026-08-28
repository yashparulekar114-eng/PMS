"use client";

import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import Link from "next/link";
import {
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Network,
} from "lucide-react";

// TypeScript interface for the Supabase employees table row
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
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        const data = await dataStore.getEmployees();
        setEmployees(data as unknown as EmployeeRow[]);
        return;
      }

      // 1. Fetch all rows from the Supabase "employees" table
      const { data, error: supabaseError } = await supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        const fallback = await dataStore.getEmployees();
        setEmployees(fallback as unknown as EmployeeRow[]);
        return;
      }

      // 2. Resolve manager_id into the manager's full_name using an in-memory lookup map
      const employeeMap: Map<string, string> = new Map();
      data.forEach((emp: EmployeeRow) => {
        employeeMap.set(emp.id, emp.full_name);
      });

      const employeesWithManager: EmployeeRow[] = data.map((emp: EmployeeRow) => ({
        ...emp,
        manager_name: emp.manager_id ? employeeMap.get(emp.manager_id) || "Unknown Manager" : null,
      }));

      setEmployees(employeesWithManager);
    } catch (err: any) {
      console.error("Error fetching employees from Supabase:", err);
      setError(err.message || "Failed to fetch employees from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              Admin View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Personnel records, reporting lines, and access roles synced directly from Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/org-chart"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold border border-indigo-200 transition-colors shadow-2xs"
          >
            <Network className="w-4 h-4 text-indigo-600" />
            <span>View Org Tree</span>
          </Link>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
            <p className="text-sm font-medium text-slate-700">Loading employees from Supabase...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching table records and resolving reporting hierarchy</p>
          </div>
        ) : employees.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Employees Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are currently no records in the Supabase <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-700">employees</code> table. Run the seed script in your Supabase SQL Editor to populate data.
            </p>
          </div>
        ) : (
          /* Tailwind Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Designation</th>
                  <th scope="col" className="px-6 py-4">Department</th>
                  <th scope="col" className="px-6 py-4">Manager</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{emp.full_name}</div>
                      <div className="text-xs text-slate-400">{emp.email}</div>
                    </td>

                    {/* Designation */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                      {emp.designation}
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {emp.department}
                      </span>
                    </td>

                    {/* Manager (Resolved full_name) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp.manager_name ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{emp.manager_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">None (Top-Level)</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive
                        </span>
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

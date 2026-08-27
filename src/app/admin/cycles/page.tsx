"use client";

import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  CalendarDays,
  Plus,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  Play,
  Lock,
} from "lucide-react";

// TypeScript interface for Supabase review_cycles table row
export interface ReviewCycleRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "draft" | "open" | "closed" | string;
  created_by?: string | null;
  created_at?: string;
}

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<ReviewCycleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCycles = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        const data = await dataStore.getCycles();
        setCycles(data as unknown as ReviewCycleRow[]);
        return;
      }

      // Fetch all rows from the Supabase "review_cycles" table
      const { data, error: supabaseError } = await supabase
        .from("review_cycles")
        .select("*")
        .order("start_date", { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        const fallback = await dataStore.getCycles();
        setCycles(fallback as unknown as ReviewCycleRow[]);
        return;
      }

      setCycles(data || []);
    } catch (err: any) {
      console.error("Error fetching review cycles from Supabase:", err);
      setError(err.message || "Failed to fetch review cycles from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setFormError("Please fill out all required fields.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (!isSupabaseConfigured()) {
        await dataStore.createCycle({
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          status: "draft",
        });
        setName("");
        setStartDate("");
        setEndDate("");
        setShowCreateModal(false);
        await fetchCycles();
        return;
      }

      // Insert new cycle into Supabase review_cycles table with default status 'draft'
      const { error: insertError } = await supabase
        .from("review_cycles")
        .insert([
          {
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            status: "draft",
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // Reset form and close modal
      setName("");
      setStartDate("");
      setEndDate("");
      setShowCreateModal(false);

      // Refresh list
      await fetchCycles();
    } catch (err: any) {
      console.error("Error creating review cycle:", err);
      setFormError(err.message || "Failed to create review cycle.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Open
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-3 h-3 text-slate-500" /> Closed
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Review Cycles</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              Admin View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage performance appraisal timelines and evaluation windows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCycles}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Cycle
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
            <p className="text-sm font-medium text-slate-700">Loading review cycles from Supabase...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching cycle records</p>
          </div>
        ) : cycles.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Review Cycles Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are currently no review cycles configured. Click <span className="font-semibold text-indigo-600">"Create Cycle"</span> to set up your first evaluation timeline.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setFormError(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Cycle
              </button>
            </div>
          </div>
        ) : (
          /* Tailwind Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Start Date</th>
                  <th scope="col" className="px-6 py-4">End Date</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{cycle.name}</div>
                    </td>

                    {/* Start Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{cycle.start_date}</span>
                      </div>
                    </td>

                    {/* End Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{cycle.end_date}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cycle.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Create Review Cycle</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cycle Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FY 2026–27 Annual Appraisal"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Default Initial Status:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 text-[11px]">
                  <Clock className="w-3 h-3 text-amber-600" /> Draft
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Cycle"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
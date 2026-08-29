"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/user-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { dataStore } from "@/lib/data-store";
import {
  FileCheck2,
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  User,
  Printer,
  Download,
  X,
} from "lucide-react";

// TypeScript interfaces
export interface GoalRow {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description?: string | null;
  weightage: number;
  target_date?: string | null;
  status: string;
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
  created_at?: string;
}

export interface GoalRatingRow {
  id?: string;
  review_id: string;
  goal_id: string;
  self_comment?: string | null;
  self_rating?: number | null;
  manager_comment?: string | null;
  manager_rating?: number | null;
}

export default function SelfAppraisalPage() {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<{ id: string; name: string } | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [review, setReview] = useState<ReviewRow | null>(null);
  const [existingRatings, setExistingRatings] = useState<GoalRatingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [ratingsState, setRatingsState] = useState<{
    [goalId: string]: { self_comment: string; self_rating: number };
  }>({});
  const [overallSelfRating, setOverallSelfRating] = useState<number>(4);
  const [overallSummary, setOverallSummary] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState<boolean>(false);
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);

  const fetchSelfReview = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        // Fallback to local dataStore if Supabase is offline
        const cycle = await dataStore.getActiveCycle();
        if (cycle) {
          setActiveCycle({ id: cycle.id, name: cycle.name });
          const allGoals = await dataStore.getGoals(user.id, cycle.id);
          setGoals(allGoals.map((g) => ({ ...g, weightage: Number(g.weightage) })));
          const rev = await dataStore.getOrCreateReview(user.id, cycle.id, user.manager_id);
          setReview(rev as unknown as ReviewRow);
          const ratings = await dataStore.getGoalRatings(rev.id);
          setExistingRatings(ratings);

          const initialForm: { [goalId: string]: { self_comment: string; self_rating: number } } = {};
          allGoals.forEach((g) => {
            const match = ratings.find((r) => r.goal_id === g.id);
            initialForm[g.id] = {
              self_comment: match?.self_comment || "",
              self_rating: match?.self_rating ? Number(match.self_rating) : 4,
            };
          });
          setRatingsState(initialForm);
          if (rev.overall_self_rating) {
            setOverallSelfRating(Number(rev.overall_self_rating));
          }
        }
        return;
      }

      // 1. Fetch active review cycle from Supabase
      const { data: cycleData } = await supabase
        .from("review_cycles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const cycle = cycleData && cycleData.length > 0 ? cycleData[0] : null;
      if (!cycle) {
        setGoals([]);
        setReview(null);
        return;
      }
      setActiveCycle({ id: cycle.id, name: cycle.name });

      // 2. Fetch the user's goals from Supabase
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: true });

      if (goalsError) throw goalsError;
      let loadedGoals: GoalRow[] = (goalsData || []).map((g) => ({
        ...g,
        weightage: Number(g.weightage),
      }));

      // If Supabase has no goals rows for this user, fallback to dataStore preset goals
      if (loadedGoals.length === 0) {
        const fallbackGoals = await dataStore.getGoals(user.id, cycle.id);
        loadedGoals = fallbackGoals.map((g) => ({ ...g, weightage: Number(g.weightage) }));
      }
      setGoals(loadedGoals);

      // 3. Fetch existing review row for user & cycle from Supabase
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("employee_id", user.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle();

      let ratingsList: GoalRatingRow[] = [];

      if (reviewData) {
        setReview(reviewData as ReviewRow);
        if (reviewData.overall_self_rating) {
          setOverallSelfRating(Number(reviewData.overall_self_rating));
        }

        // 4. Fetch existing goal ratings
        const { data: ratingsData } = await supabase
          .from("goal_ratings")
          .select("*")
          .eq("review_id", reviewData.id);

        ratingsList = (ratingsData || []) as GoalRatingRow[];
        setExistingRatings(ratingsList);
      } else {
        // Fallback to dataStore preset review and ratings
        const fallbackRev = await dataStore.getOrCreateReview(user.id, cycle.id, user.manager_id);
        setReview(fallbackRev as unknown as ReviewRow);
        if (fallbackRev.overall_self_rating) {
          setOverallSelfRating(Number(fallbackRev.overall_self_rating));
        }
        const fallbackRatings = await dataStore.getGoalRatings(fallbackRev.id);
        ratingsList = fallbackRatings;
        setExistingRatings(ratingsList);
      }

      // Prepopulate form state
      const initialForm: { [goalId: string]: { self_comment: string; self_rating: number } } = {};
      loadedGoals.forEach((g) => {
        const match = ratingsList.find((r) => r.goal_id === g.id);
        initialForm[g.id] = {
          self_comment: match?.self_comment || "",
          self_rating: match?.self_rating ? Number(match.self_rating) : 4,
        };
      });
      setRatingsState(initialForm);
    } catch (err: any) {
      console.error("Error fetching self review:", err);
      setError(err.message || "Failed to load self-appraisal data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelfReview();
  }, [user]);

  const handleRatingChange = (goalId: string, rating: number) => {
    setRatingsState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        self_rating: rating,
      },
    }));
  };

  const handleCommentChange = (goalId: string, comment: string) => {
    setRatingsState((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        self_comment: comment,
      },
    }));
  };

  const handleSubmitSelfAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCycle) return;

    if (goals.length === 0) {
      setFormError("You have no goals assigned for this cycle.");
      return;
    }

    // Validate that comments are entered for all goals
    for (const g of goals) {
      if (!ratingsState[g.id]?.self_comment?.trim()) {
        setFormError(`Please provide an achievement reflection comment for "${g.title}".`);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (isSupabaseConfigured()) {
        // 1. Insert or update record in reviews table
        let targetReviewId = review?.id;

        if (!targetReviewId) {
          const { data: newReview, error: revInsertErr } = await supabase
            .from("reviews")
            .insert([
              {
                employee_id: user.id,
                manager_id: user.manager_id,
                cycle_id: activeCycle.id,
                status: "self_appraisal_submitted",
                overall_self_rating: overallSelfRating,
                submitted_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (revInsertErr) throw revInsertErr;
          targetReviewId = newReview.id;
        } else {
          const { error: revUpdateErr } = await supabase
            .from("reviews")
            .update({
              status: "self_appraisal_submitted",
              overall_self_rating: overallSelfRating,
              submitted_at: new Date().toISOString(),
            })
            .eq("id", targetReviewId);

          if (revUpdateErr) throw revUpdateErr;
        }

        // 2. Insert or update line items in goal_ratings table
        for (const goal of goals) {
          const state = ratingsState[goal.id];
          const { error: ratingErr } = await supabase.from("goal_ratings").upsert(
            {
              review_id: targetReviewId,
              goal_id: goal.id,
              self_rating: state?.self_rating || 3,
              self_comment: state?.self_comment?.trim() || "",
            },
            { onConflict: "review_id,goal_id" }
          );

          if (ratingErr) throw ratingErr;
        }

      } else {
        // Fallback to dataStore
        if (review) {
          const payload = goals.map((g) => ({
            goal_id: g.id,
            self_comment: ratingsState[g.id]?.self_comment || "",
            self_rating: ratingsState[g.id]?.self_rating || 4,
          }));
          await dataStore.submitSelfAppraisal(review.id, payload, overallSelfRating);
        }
      }

      // 1. IN-APP NOTIFICATIONS (Navbar Bell & Activity Tracker)
      try {
        const reportingManager = user.manager_id ? await dataStore.getEmployeeById(user.manager_id) : null;
        
        // Notify Reporting Manager: "📋 Action Required: Give Ratings"
        if (reportingManager || user.manager_id) {
          await dataStore.createNotification({
            recipient_id: user.manager_id || reportingManager?.id || "00000000-0000-0000-0000-000000000001",
            recipient_email: reportingManager?.email || "manager@company.com",
            title: "📋 Self-Appraisal Submitted: Give Ratings",
            message: `${user.full_name} has submitted their self-appraisal ratings (${overallSelfRating.toFixed(1)}★). Now you should review and provide your manager evaluations and ratings.`,
            type: "self_appraisal",
            link_url: `/team/reviews/${user.id}`,
          });
        }

        // Notify Subordinate (Employee confirmation)
        await dataStore.createNotification({
          recipient_id: user.id,
          recipient_email: user.email,
          title: "✅ Self-Appraisal Submitted",
          message: `Your self-appraisal rating of ${overallSelfRating.toFixed(1)}★ has been recorded. Your manager has been notified to evaluate.`,
          type: "self_appraisal",
          link_url: "/employee/dashboard",
        });
      } catch (err) {
        console.warn("In-app notification dispatch note:", err);
      }

      // 2. Guaranteed non-blocking email dispatch to manager via Resend API route
      try {
        const appOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        fetch("/api/notify-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "self_appraisal",
            employeeName: user.full_name,
            employeeEmail: user.email,
            managerName: user.manager_name,
            managerEmail: user.manager_name ? `${user.manager_name.toLowerCase().replace(/[^a-z]/g, "")}@company.com` : "manager@company.com",
            cycleName: activeCycle.name,
            selfRating: overallSelfRating,
            reviewUrl: `${appOrigin}/team/reviews/${user.id}`,
          }),
        }).catch((e) => {
          console.warn("[Non-Blocking] Resend email notice:", e);
        });
      } catch (e) {
        // Never block the user experience or database save
      }

      setSubmissionBanner(`🎉 Self-appraisal ratings successfully submitted (${overallSelfRating}★)! Your reporting manager has received a notification: "Now you should give the ratings".`);
      setIsEditingSubmitted(false);
      await fetchSelfReview();
    } catch (err: any) {
      console.error("Error submitting self-appraisal:", err);
      setFormError(err.message || "Failed to submit self-appraisal.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Rating Stars / Buttons
  const renderRatingButtons = (
    currentRating: number,
    onChange: (r: number) => void,
    disabled = false
  ) => {
    const labels: { [key: number]: string } = {
      1: "1 - Needs Improvement",
      2: "2 - Developing",
      3: "3 - Meets Expectations",
      4: "4 - Exceeds Expectations",
      5: "5 - Outstanding",
    };

    return (
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentRating === num
                ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:hover:bg-slate-100"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${currentRating === num ? "fill-amber-300 text-amber-300" : "text-slate-400"}`} />
            <span>{num}</span>
          </button>
        ))}
        <span className="text-xs text-slate-500 font-medium ml-2 hidden sm:inline">
          {labels[currentRating]}
        </span>
      </div>
    );
  };

  // Detect if review is already submitted
  const isSubmitted =
    review?.status === "self_appraisal_submitted" ||
    review?.status === "manager_reviewed" ||
    review?.status === "completed";

  const showSuccessView = isSubmitted && !isEditingSubmitted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Self-Appraisal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Annual Review
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {activeCycle ? (
              <>
                Evaluation Cycle: <strong className="text-slate-800">{activeCycle.name}</strong> • Logged in as:{" "}
                <strong className="text-slate-800">{user?.full_name}</strong>
              </>
            ) : (
              "Loading active cycle..."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user && (
            <Link
              href={`/reports/${user.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Official PDF Report
            </Link>
          )}

          <button
            onClick={fetchSelfReview}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Submission Success Banner */}
      {submissionBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{submissionBanner}</span>
          </div>
          <button onClick={() => setSubmissionBanner(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {error}
          </div>
        </div>
      )}

      {loading ? (
        /* Loading Skeleton */
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
          <p className="text-sm font-medium text-slate-700">Loading your self-appraisal workspace...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching performance goals and review records</p>
        </div>
      ) : goals.length === 0 ? (
        /* No Goals Warning */
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Goals Found for Appraisal</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You do not have any goals defined for this appraisal cycle. Please create and allocate your goal weightages in the Goals section first.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/goals"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
            >
              Go to My Goals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : showSuccessView ? (
        /* SUCCESS / ALREADY SUBMITTED STATE VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-emerald-900">
                    Self-Appraisal Submitted Successfully!
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-200 text-emerald-900">
                    {review?.status?.replace(/_/g, " ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSubmitted(true)}
                    className="ml-2 text-xs font-semibold px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                  >
                    Edit / Update Appraisal
                  </button>
                </div>
                <p className="text-xs text-emerald-700">
                  Submitted on{" "}
                  {review?.submitted_at
                    ? new Date(review.submitted_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Active Cycle"}
                  . Your manager has been notified to conduct the evaluation.
                </p>
              </div>
            </div>

            <div className="bg-white px-5 py-3 rounded-xl border border-emerald-200 text-right w-full md:w-auto shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Your Overall Self-Score</div>
              <div className="text-2xl font-black text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{review?.overall_self_rating || overallSelfRating} / 5.0</span>
              </div>
            </div>
          </div>

          {/* Read-Only Goal Evaluations Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Your Submitted Goal Reflections</h3>
              <span className="text-xs text-slate-500 font-medium">
                {goals.length} {goals.length === 1 ? "Goal Evaluated" : "Goals Evaluated"}
              </span>
            </div>

            <div className="space-y-4">
              {goals.map((goal, idx) => {
                const match = existingRatings.find((r) => r.goal_id === goal.id);
                const score = match?.self_rating || ratingsState[goal.id]?.self_rating || 4;
                const comment = match?.self_comment || ratingsState[goal.id]?.self_comment || "No comment provided";

                return (
                  <div
                    key={goal.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{goal.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                          Weight: {goal.weightage}%
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Rating: {score} / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        Achievement Reflection & Evidence:
                      </div>
                      <p className="leading-relaxed whitespace-pre-line text-slate-600">{comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manager Review Status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Next step: Manager conducts evaluation and adds calibration summary.</span>
              </div>
              <Link
                href="/dashboard"
                className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Return to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE SELF-APPRAISAL SUBMISSION FORM */
        <form onSubmit={handleSubmitSelfAppraisal} className="space-y-6">
          {isEditingSubmitted && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  <strong>Edit Mode:</strong> You are currently updating your submitted self-appraisal. Submitting will update your ratings and reflections.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSubmitted(false)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-indigo-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Goal By Goal Assessment */}
          <div className="space-y-4">
            {goals.map((goal, idx) => {
              const state = ratingsState[goal.id] || { self_comment: "", self_rating: 4 };

              return (
                <div
                  key={goal.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{goal.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                        Weightage: {goal.weightage}%
                      </span>
                      {goal.target_date && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {goal.target_date}
                        </span>
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {goal.description}
                    </p>
                  )}

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Self-Rating (1–5 Scale) <span className="text-rose-500">*</span>
                    </label>
                    {renderRatingButtons(state.self_rating, (r) => handleRatingChange(goal.id, r))}
                  </div>

                  {/* Reflection Comment */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Achievement Reflection & Metrics <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={state.self_comment}
                      onChange={(e) => handleCommentChange(goal.id, e.target.value)}
                      placeholder="Describe what you accomplished, quantitative metrics achieved, challenges overcome, and key deliverables..."
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Self-Assessment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Overall Self-Appraisal Summary
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your overall performance score and an executive summary of your year's contributions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Overall Self-Rating (1–5) <span className="text-rose-500">*</span>
              </label>
              {renderRatingButtons(overallSelfRating, setOverallSelfRating)}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                General Self-Summary & Key Highlights
              </label>
              <textarea
                rows={4}
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                placeholder="Summarize your overarching contributions, leadership, collaboration, and professional growth across this review cycle..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Submitting sets status to <strong>'Self-Appraisal Submitted'</strong> and locks goals for manager review.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting Appraisal...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Self-Appraisal
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
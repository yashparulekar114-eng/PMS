import React from "react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Target,
  FileCheck2,
  Users2,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          Enterprise Performance Management System
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Performance Management System
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
          A structured, calibrated performance appraisal platform built to replace spreadsheet chaos across your 200-person organization.
        </p>

        {/* Call to Action Section */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all hover:scale-[1.01]">
                Sign In to Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all hover:scale-[1.01]"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>

          <Link
            href="/admin/employees"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm transition-all"
          >
            View Directory
          </Link>
        </div>
      </section>

      {/* Feature Grid: 3 Clean Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {/* 1. Goal Tracking */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Goal Tracking</h3>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              100% Weightage Validation
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Set and align SMART performance goals tied directly to open review cycles. Strict validation ensures all goal weightages sum to exactly 100% before submission.
          </p>
        </div>

        {/* 2. Self-Appraisals */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Self-Appraisals</h3>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Objective Reflection
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Empower team members to evaluate their accomplishments with 1–5 performance ratings, quantitative evidence, and reflective summary feedback.
          </p>
        </div>

        {/* 3. Manager Reviews */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Manager Reviews</h3>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Dual-Perspective Calibration
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Conduct side-by-side appraisals with full visibility into direct reports' self-evaluations, manager scoring, and automated notifications.
          </p>
        </div>
      </section>

      {/* Trust & Architecture Banner */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Role-Based Access Control
            </div>
            <h3 className="text-xl font-bold text-white">Built for High-Growth Services Teams</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Strictly enforces hierarchy between Employees, Managers, and HR Administrators with Supabase PostgreSQL and Clerk authentication.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors whitespace-nowrap">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors whitespace-nowrap"
              >
                Open App
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>
    </div>
  );
}
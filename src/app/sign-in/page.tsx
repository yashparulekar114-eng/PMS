"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/user-context";
import { Shield, KeyRound, ArrowRight, UserCheck, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { switchUser, simulateUnregisteredUser } = useAuth();
  const [customEmail, setCustomEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    await switchUser(customEmail);
    router.push("/dashboard");
  };

  const handleRoleSelect = async (email: string) => {
    await switchUser(email);
    router.push("/dashboard");
  };

  const handleUnregistered = () => {
    simulateUnregisteredUser();
    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign In to AI PMS</h1>
        <p className="text-xs text-slate-500">
          Clerk Authentication & Role-Aware Identity Bridge
        </p>
      </div>

      {/* Quick Role Selection for Grading / Demo */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
          Quick Sign In by Role
        </label>

        <button
          onClick={() => handleRoleSelect("admin@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-300 bg-purple-100/70 hover:bg-purple-100 text-left transition-all ring-1 ring-purple-400/30"
        >
          <div>
            <div className="text-sm font-bold text-purple-950">Praveen Dalal (👑 HR Admin)</div>
            <div className="text-xs text-purple-700 font-medium">HR Director • Full Administration & Calibration Access</div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600" />
        </button>

        <button
          onClick={() => handleRoleSelect("yash@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-300 bg-indigo-100/70 hover:bg-indigo-100 text-left transition-all ring-1 ring-indigo-400/30"
        >
          <div>
            <div className="text-sm font-bold text-indigo-950">Yash Parulekar (👑 HR Admin)</div>
            <div className="text-xs text-indigo-700 font-medium">HR Director & Technology Lead • Full Access</div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </button>

        <button
          onClick={() => handleRoleSelect("aarya@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-sky-300 bg-sky-100/70 hover:bg-sky-100 text-left transition-all ring-1 ring-sky-400/30"
        >
          <div>
            <div className="text-sm font-bold text-sky-950">Aarya Shirodkar (Manager)</div>
            <div className="text-xs text-sky-700 font-medium">Senior Full-Stack Engineer • Direct Manager to Aditya</div>
          </div>
          <ArrowRight className="w-4 h-4 text-sky-600" />
        </button>

        <button
          onClick={() => handleRoleSelect("aditya@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-left transition-all"
        >
          <div>
            <div className="text-sm font-semibold text-teal-900">Aditya Kamat (Aarya's Subordinate)</div>
            <div className="text-xs text-teal-700">Associate Full-Stack Developer • Reports to Aarya</div>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-500" />
        </button>

        <button
          onClick={() => handleRoleSelect("ananya@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all"
        >
          <div>
            <div className="text-sm font-semibold text-emerald-900">Ananya Sharma</div>
            <div className="text-xs text-emerald-700">Senior HR Partner • Reports to Yash</div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500" />
        </button>

        <button
          onClick={() => handleRoleSelect("rohan@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all"
        >
          <div>
            <div className="text-sm font-semibold text-indigo-900">Rohan Mehta</div>
            <div className="text-xs text-indigo-700">People Analytics Specialist • Reports to Yash</div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-500" />
        </button>

        <button
          onClick={() => handleRoleSelect("kunal@company.com")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all"
        >
          <div>
            <div className="text-sm font-semibold text-blue-900">Kunal Varma</div>
            <div className="text-xs text-blue-700">Talent Acquisition Lead • Reports to Yash</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-500" />
        </button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Or sign in with custom email</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={handleCustomLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            placeholder="e.g. employee@company.com"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </form>

      {/* Unregistered user test */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <button
          onClick={handleUnregistered}
          className="text-xs text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Test unregistered account fallback screen
        </button>
      </div>
    </div>
  );
}

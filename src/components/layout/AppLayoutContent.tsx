"use client";

import React from "react";
import { useAuth } from "@/lib/auth/user-context";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { UserX, HelpCircle, LogOut } from "lucide-react";

export const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isAccountNotSetUp } = useAuth();
  const { user: clerkUser } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAccountNotSetUp ? (
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <UserX className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Your account is not yet set up. Please contact HR.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We checked our employee records for{" "}
                  <strong className="text-slate-900 font-semibold">
                    {clerkUser?.primaryEmailAddress?.emailAddress || "your account email"}
                  </strong>
                  , but no corresponding employee profile was found in the database.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 text-left space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  What should I do?
                </div>
                <p>
                  1. Contact your HR administrator to add your profile to the company directory with your corporate email address.
                </p>
                <p>
                  2. Once added, refresh this page or sign in again to access your dashboard.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <SignOutButton>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>Performance Management System | Built with Next.js, Supabase, Clerk & Resend</p>
      </footer>
    </div>
  );
};
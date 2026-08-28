"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth/user-context";
import {
  LayoutDashboard,
  Target,
  FileCheck2,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  Menu,
  X,
  Sparkles,
  AlertCircle,
  Network,
} from "lucide-react";

export const AppNavbar = () => {
  const pathname = usePathname();
  const { user, role, switchUser, simulateUnregisteredUser, isAccountNotSetUp, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation Items with explicit Role Permissions
  // - Everyone (employee, manager, hr_admin): Dashboard, My Goals, My Review
  // - Manager: My Team
  // - HR Admin: Employees, Cycles
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["employee", "manager", "hr_admin"],
    },
    {
      label: "My Goals",
      href: "/goals",
      icon: Target,
      roles: ["employee", "manager", "hr_admin"],
    },
    {
      label: "My Review",
      href: "/reviews/self",
      icon: FileCheck2,
      roles: ["employee", "manager", "hr_admin"],
    },
    {
      label: "My Team",
      href: "/team",
      icon: Users,
      roles: ["manager", "hr_admin"],
    },
    {
      label: "Org Structure",
      href: "/admin/org-chart",
      icon: Network,
      roles: ["hr_admin"],
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: Building2,
      roles: ["hr_admin"],
    },
    {
      label: "Cycles",
      href: "/admin/cycles",
      icon: CalendarDays,
      roles: ["hr_admin"],
    },
    {
      label: "Analytics",
      href: "/admin/dashboard",
      icon: BarChart3,
      roles: ["hr_admin"],
    },
  ];

  // Filter items matching the authenticated employee role
  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const demoProfiles = [
    { name: "Praveen Dalal", email: "admin@company.com", roleLabel: "HR Admin", roleKey: "hr_admin" },
    { name: "Yash Parulekar", email: "yash@company.com", roleLabel: "VP Tech", roleKey: "manager" },
    { name: "Mehmood Sayed", email: "manager@company.com", roleLabel: "Eng Lead", roleKey: "manager" },
    { name: "Aarya Shirodkar", email: "aarya@company.com", roleLabel: "Senior Dev (⭐ 5.0)", roleKey: "manager" },
    { name: "Uraj Madkaikar", email: "uraj@company.com", roleLabel: "Frontend Dev", roleKey: "employee" },
    { name: "Rohit Deshmukh", email: "rohit@company.com", roleLabel: "Mobile Mgr", roleKey: "manager" },
    { name: "Natasha D'Souza", email: "natasha@company.com", roleLabel: "Product Mgr", roleKey: "manager" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Persona Quick Switcher Banner (For testing & demo) */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">Role Tester:</span>
          <span className="text-slate-300 hidden sm:inline">Simulate persona permissions:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {demoProfiles.map((p) => {
            const isActive = user?.email === p.email;
            return (
              <button
                key={p.email}
                onClick={() => switchUser(p.email)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm ring-1 ring-white/20"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {p.name.split(" ")[0]} ({p.roleLabel})
              </button>
            );
          })}
          <button
            onClick={simulateUnregisteredUser}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              isAccountNotSetUp
                ? "bg-amber-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-amber-300"
            }`}
            title="Simulate an unregistered Clerk account"
          >
            Unregistered User
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                P
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">PMS App</span>
                <span className="text-[10px] block text-indigo-600 font-semibold tracking-wider uppercase -mt-1">
                  Performance Hub
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links based on Role */}
            {!isAccountNotSetUp && user && (
              <nav className="hidden md:flex items-center space-x-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Area: User Role Badge & Clerk UserButton */}
          <div className="flex items-center gap-4">
            {isAccountNotSetUp ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Account Not Set Up</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-500 flex items-center justify-end gap-1.5">
                    <span>{user.designation}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === "hr_admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "manager"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Clerk User Button & Sign In Controls */}
            <div>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            {/* Mobile menu button */}
            {!isAccountNotSetUp && user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && !isAccountNotSetUp && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
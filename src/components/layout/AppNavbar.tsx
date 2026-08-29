"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { AppNotification } from "@/types";
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
  Bell,
  CheckCircle2,
  Award,
  ChevronRight,
  Clock,
  ExternalLink,
} from "lucide-react";

export const AppNavbar = () => {
  const pathname = usePathname();
  const { user, role, switchUser, simulateUnregisteredUser, isAccountNotSetUp } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const notifs = await dataStore.getNotifications(user.id);
    setNotifications(notifs);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await dataStore.markAllNotificationsAsRead(user.id);
    await fetchNotifications();
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    await dataStore.markNotificationAsRead(notif.id);
    await fetchNotifications();
    setShowNotifMenu(false);
  };

  // Navigation Items with explicit Role Permissions
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

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const demoProfiles = [
    { name: "Yash Parulekar", email: "yash@company.com", roleLabel: "👑 HR Admin (Yash)", roleKey: "hr_admin" },
    { name: "Ananya Sharma", email: "ananya@company.com", roleLabel: "Ananya (Yash Report)", roleKey: "employee" },
    { name: "Rohan Mehta", email: "rohan@company.com", roleLabel: "Rohan (Yash Report)", roleKey: "employee" },
    { name: "Kunal Varma", email: "kunal@company.com", roleLabel: "Kunal (Yash Report)", roleKey: "employee" },
    { name: "Deepika Joshi", email: "deepika@company.com", roleLabel: "Deepika (Yash Report)", roleKey: "manager" },
    { name: "Mehmood Sayed", email: "manager@company.com", roleLabel: "Mehmood (Yash Report)", roleKey: "manager" },
    { name: "Praveen Dalal", email: "admin@company.com", roleLabel: "Praveen (HR Admin)", roleKey: "hr_admin" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Persona Quick Switcher Banner */}
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

            {/* Desktop Navigation Links */}
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

          {/* Right Area: Notifications, Role Badge & User Button */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {!isAccountNotSetUp && user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[10px] font-bold items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                          <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.is_read ? "bg-indigo-50/40" : ""
                            }`}
                          >
                            <Link href={n.link_url || "/dashboard"} className="block space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-bold ${!n.is_read ? "text-indigo-950" : "text-slate-800"}`}>
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                              <div className="text-[10px] text-slate-400 pt-0.5">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-slate-100 text-center">
                      <Link
                        href="/employee/dashboard"
                        onClick={() => setShowNotifMenu(false)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
                      >
                        <span>View Full Activity Tracker</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Clerk User Button */}
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

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Employee, Role } from "@/types";
import { dataStore } from "../data-store";

interface AuthContextType {
  user: Employee | null;
  role: Role | null;
  isLoading: boolean;
  isAccountNotSetUp: boolean;
  switchUser: (email: string) => Promise<void>;
  simulateUnregisteredUser: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAccountNotSetUp: false,
  switchUser: async () => {},
  simulateUnregisteredUser: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState<Employee | null>(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("pms_active_user_email") || "admin@company.com";
      return (
        dataStore.getEmployeesDirect().find((e) => e.email === savedEmail) ||
        dataStore.getEmployeesDirect()[0] ||
        null
      );
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountNotSetUp, setIsAccountNotSetUp] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      // If Clerk is still loading, wait
      if (!isClerkLoaded) {
        return;
      }

      try {
        // If user is signed in via Clerk
        if (isSignedIn && clerkUser) {
          const email = clerkUser.primaryEmailAddress?.emailAddress;

          if (email) {
            // 1. Look up the "employees" table in Supabase by that email
            const employee = await dataStore.getEmployeeByEmail(email);

            if (employee) {
              // 2. If found and clerk_user_id is empty or mismatch, save Clerk user id onto that row
              if (!employee.clerk_user_id || employee.clerk_user_id !== clerkUser.id) {
                await dataStore.linkClerkUser(employee.email, clerkUser.id);
                employee.clerk_user_id = clerkUser.id;
              }

              setUser(employee);
              setIsAccountNotSetUp(false);
            } else {
              // 3. If no matching employee exists in Supabase
              setUser(null);
              setIsAccountNotSetUp(true);
            }
          } else {
            setUser(null);
            setIsAccountNotSetUp(true);
          }
        } else {
          // Fallback: If not signed in via Clerk, check for local demo persona selection
          const savedEmail = localStorage.getItem("pms_active_user_email") || "aarya@company.com";
          const fallbackEmp = await dataStore.getEmployeeByEmail(savedEmail);

          if (fallbackEmp) {
            setUser(fallbackEmp);
            setIsAccountNotSetUp(false);
          } else {
            setUser(null);
            setIsAccountNotSetUp(false);
          }
        }
      } catch (err) {
        console.error("Error syncing employee with Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isClerkLoaded, isSignedIn, clerkUser]);

  const switchUser = async (email: string) => {
    setIsLoading(true);
    try {
      const emp = await dataStore.getEmployeeByEmail(email);
      if (emp) {
        setUser(emp);
        setIsAccountNotSetUp(false);
        localStorage.setItem("pms_active_user_email", email);
      } else {
        setUser(null);
        setIsAccountNotSetUp(true);
        localStorage.setItem("pms_active_user_email", email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const simulateUnregisteredUser = () => {
    setUser(null);
    setIsAccountNotSetUp(true);
    localStorage.setItem("pms_active_user_email", "unregistered@external.com");
  };

  const refreshUser = async () => {
    if (!user) return;
    const emp = await dataStore.getEmployeeById(user.id);
    if (emp) setUser(emp);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        isAccountNotSetUp,
        switchUser,
        simulateUnregisteredUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
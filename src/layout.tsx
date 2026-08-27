import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/lib/auth/user-context";
import { AppLayoutContent } from "@/components/layout/AppLayoutContent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Performance Management System",
  description: "PMS App built with Next.js, Supabase, and Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
          <AuthProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { localDateString, planReminders } from "@/lib/ai/reminders";

// Daily Cycle Reminder Agent. Vercel Cron calls this route once a day (see vercel.json).
// It only reads from the database. Each planned reminder is sent through the existing /api/notify-manager route.

export const dynamic = "force-dynamic";

const SEND_GAP_MS = 600; // Resend allows roughly two requests per second; keep under that.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Without the database, this server would only see the in-memory demo roster. Sending from it could email the wrong people, so the job does nothing.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      skipped: true,
      reason: "Supabase is not configured (NEXT_PUBLIC_USE_REAL_SUPABASE is not true). No reminders were sent.",
    });
  }

  const today = localDateString("Asia/Kolkata");
  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";

  const { data: cycles, error: cycleError } = await supabase
    .from("review_cycles")
    .select("id, name, start_date, end_date, status")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);
  if (cycleError) {
    return NextResponse.json({ error: "Could not read review cycles." }, { status: 502 });
  }

  const cycle = cycles?.[0];
  if (!cycle) {
    return NextResponse.json({ today, planned: 0, sent: 0, reason: "No open review cycle." });
  }

  const [employees, goals, reviews] = await Promise.all([
    supabase.from("employees").select("id, full_name, email, manager_id, is_active"),
    supabase.from("goals").select("employee_id, status, weightage").eq("cycle_id", cycle.id),
    supabase.from("reviews").select("employee_id, status").eq("cycle_id", cycle.id),
  ]);
  if (employees.error || goals.error || reviews.error) {
    return NextResponse.json({ error: "Could not read employees, goals or reviews." }, { status: 502 });
  }

  const plan = planReminders({
    cycle: { name: cycle.name, end_date: cycle.end_date, status: cycle.status },
    today,
    employees: employees.data ?? [],
    goals: goals.data ?? [],
    reviews: reviews.data ?? [],
  });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      today,
      planned: plan.length,
      reminders: plan.map((r) => ({
        audience: r.audience,
        recipientEmail: r.recipientEmail,
        subject: r.subject,
        daysLeft: r.daysLeft,
        pendingItems: r.pendingItems,
      })),
    });
  }

  const origin = req.nextUrl.origin;
  let sent = 0;
  let simulated = 0;
  let failed = 0;

  for (let index = 0; index < plan.length; index++) {
    const reminder = plan[index];
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
    try {
      const res = await fetch(`${origin}/api/notify-manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          type: "deadline_reminder",
          recipientEmail: reminder.recipientEmail,
          recipientName: reminder.recipientName,
          subject: reminder.subject,
          bodyText: reminder.bodyText,
          reviewUrl: `${origin}${reminder.reviewPath}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) failed += 1;
      else if (data.simulated) simulated += 1;
      else if (data.emailSent) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ today, planned: plan.length, sent, simulated, failed });
}

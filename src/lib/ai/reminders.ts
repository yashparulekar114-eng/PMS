// Cycle Reminder Agent planning. Decides who gets a deadline reminder today and drafts the text.
// Pure and read-only: it returns a plan and sends nothing. The cron route performs the sending.
// Dependency-free on purpose so it can be unit-tested directly.

// Days before the cycle end date on which a reminder is sent (0 = the day it closes).
export const REMINDER_OFFSETS_DAYS: readonly number[] = [14, 7, 3, 1, 0];
const WEIGHTAGE_THRESHOLD = 85;

export interface ReminderCycle {
  name: string;
  end_date: string;
  status: string;
}

export interface ReminderEmployee {
  id: string;
  full_name: string;
  email: string;
  manager_id: string | null;
  is_active: boolean;
}

export interface ReminderGoal {
  employee_id: string;
  status: string;
  weightage: number;
}

export interface ReminderReview {
  employee_id: string;
  status: string;
}

export interface PlannedReminder {
  audience: "employee" | "manager";
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  daysLeft: number;
  pendingItems: string[];
  reviewPath: string;
}

// Calendar date (YYYY-MM-DD) in the given zone. Defaults to IST so the daily run matches the company's calendar.
export function localDateString(timeZone = "Asia/Kolkata", now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export function planReminders(input: {
  cycle: ReminderCycle | null;
  today: string;
  employees: ReminderEmployee[];
  goals: ReminderGoal[];
  reviews: ReminderReview[];
}): PlannedReminder[] {
  const { cycle, today } = input;
  if (!cycle || cycle.status !== "open") return [];

  const daysLeft = daysBetween(today, cycle.end_date);
  if (!REMINDER_OFFSETS_DAYS.includes(daysLeft)) return [];

  const active = input.employees.filter((e) => e.is_active);
  const reviewStatusByEmployee = new Map(input.reviews.map((r) => [r.employee_id, r.status]));
  const goalsByEmployee = new Map<string, ReminderGoal[]>();
  for (const goal of input.goals) {
    const list = goalsByEmployee.get(goal.employee_id) ?? [];
    list.push(goal);
    goalsByEmployee.set(goal.employee_id, list);
  }

  const closing = daysLeft === 0 ? "closes today" : `closes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  const reminders: PlannedReminder[] = [];

  for (const employee of active) {
    const pending: string[] = [];
    const goals = goalsByEmployee.get(employee.id) ?? [];
    if (goals.length === 0) {
      pending.push("Create your goals for this cycle.");
    } else {
      const total = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
      if (total < WEIGHTAGE_THRESHOLD) {
        pending.push(`Bring your goal weightage to at least ${WEIGHTAGE_THRESHOLD}% (currently ${total}%).`);
      }
      const unsubmitted = goals.filter((g) => g.status === "draft" || g.status === "sent_back").length;
      if (unsubmitted > 0) {
        pending.push(`Submit ${unsubmitted} goal${unsubmitted === 1 ? "" : "s"} for manager approval.`);
      }
    }
    if ((reviewStatusByEmployee.get(employee.id) ?? "not_started") === "not_started") {
      pending.push("Complete your self-appraisal.");
    }

    if (pending.length > 0) {
      const firstName = employee.full_name.split(" ")[0] || employee.full_name;
      reminders.push({
        audience: "employee",
        recipientId: employee.id,
        recipientEmail: employee.email,
        recipientName: employee.full_name,
        subject: `Reminder: ${cycle.name} ${closing}`,
        bodyText: [
          `Hello ${firstName},`,
          "",
          `The ${cycle.name} cycle ${closing} on ${cycle.end_date}. These items are still open for you:`,
          ...pending.map((p) => `- ${p}`),
          "",
          "Open the PMS to complete them.",
        ].join("\n"),
        daysLeft,
        pendingItems: pending,
        reviewPath: "/reviews/self",
      });
    }
  }

  const managerIds = new Set(active.map((e) => e.manager_id).filter((id): id is string => Boolean(id)));
  for (const manager of active.filter((e) => managerIds.has(e.id))) {
    const waiting = active.filter(
      (e) => e.manager_id === manager.id && reviewStatusByEmployee.get(e.id) === "self_appraisal_submitted"
    );
    if (waiting.length === 0) continue;

    const firstName = manager.full_name.split(" ")[0] || manager.full_name;
    reminders.push({
      audience: "manager",
      recipientId: manager.id,
      recipientEmail: manager.email,
      recipientName: manager.full_name,
      subject: `Reminder: ${waiting.length} manager review${waiting.length === 1 ? "" : "s"} due (${cycle.name})`,
      bodyText: [
        `Hello ${firstName},`,
        "",
        `The ${cycle.name} cycle ${closing} on ${cycle.end_date}. These direct reports have submitted self-appraisals and are waiting for your review:`,
        ...waiting.map((w) => `- ${w.full_name}`),
        "",
        "Open Team Reviews to complete them.",
      ].join("\n"),
      daysLeft,
      pendingItems: waiting.map((w) => `Manager review for ${w.full_name}`),
      reviewPath: "/team/reviews",
    });
  }

  return reminders;
}

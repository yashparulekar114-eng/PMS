import { supabase, isSupabaseConfigured } from "./supabase/client";
import { Employee, ReviewCycle, Goal, Review, GoalRating } from "@/types";

// Initial Demo Seed Data
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    clerk_user_id: null,
    full_name: "Praveen Dalal",
    email: "admin@company.com",
    designation: "HR Director",
    department: "Human Resources",
    date_of_joining: "2022-01-15",
    manager_id: null,
    manager_name: null,
    role: "hr_admin",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    clerk_user_id: null,
    full_name: "Praveen Dalal (HR)",
    email: "hr@company.com",
    designation: "HR Director",
    department: "Human Resources",
    date_of_joining: "2022-01-15",
    manager_id: null,
    manager_name: null,
    role: "hr_admin",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    clerk_user_id: null,
    full_name: "Mehmood Sayed",
    email: "manager@company.com",
    designation: "Engineering Lead",
    department: "Engineering",
    date_of_joining: "2022-03-01",
    manager_id: "00000000-0000-0000-0000-000000000001",
    manager_name: "Praveen Dalal",
    role: "manager",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    clerk_user_id: null,
    full_name: "Aarya Shirodkar",
    email: "aarya@company.com",
    designation: "Senior Full-Stack Engineer",
    department: "Engineering",
    date_of_joining: "2023-06-10",
    manager_id: "00000000-0000-0000-0000-000000000002",
    manager_name: "Mehmood Sayed",
    role: "employee",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    clerk_user_id: null,
    full_name: "Uraj Madkaikar",
    email: "uraj@company.com",
    designation: "Frontend Developer",
    department: "Engineering",
    date_of_joining: "2024-01-08",
    manager_id: "00000000-0000-0000-0000-000000000002",
    manager_name: "Mehmood Sayed",
    role: "employee",
    is_active: true,
  },
];

const INITIAL_CYCLES: ReviewCycle[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "FY 2026-27 Annual Review",
    start_date: "2026-04-01",
    end_date: "2027-03-31",
    status: "open",
    created_by: "00000000-0000-0000-0000-000000000001",
  },
];

const INITIAL_GOALS: Goal[] = [
  // Aarya Shirodkar's Goals (Total = 85%)
  {
    id: "20000000-0000-0000-0000-000000000001",
    employee_id: "00000000-0000-0000-0000-000000000003",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Migrate Core API Services to Microservices",
    description: "Decompose monolithic billing & notifications into scalable independent services.",
    weightage: 35,
    target_date: "2026-11-30",
    status: "approved",
    manager_comment: "Approved. Essential for platform reliability.",
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    employee_id: "00000000-0000-0000-0000-000000000003",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Automate CI/CD & Elevate Test Coverage to 85%",
    description: "Implement automated Playwright test suites and GitHub Actions deployment workflows.",
    weightage: 25,
    target_date: "2026-10-15",
    status: "approved",
    manager_comment: "Approved.",
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    employee_id: "00000000-0000-0000-0000-000000000003",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Technical Mentorship of Junior Engineers",
    description: "Lead weekly architectural sessions and conduct structured code reviews for 2 juniors.",
    weightage: 25,
    target_date: "2027-02-28",
    status: "approved",
    manager_comment: "Approved.",
  },
  // Uraj Madkaikar's Goals (Total = 85%)
  {
    id: "20000000-0000-0000-0000-000000000004",
    employee_id: "00000000-0000-0000-0000-000000000004",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Design & Deliver Modern Tailwind UI Component Library",
    description: "Build accessible, highly responsive design system with 25+ reusable dashboard widgets.",
    weightage: 45,
    target_date: "2026-11-15",
    status: "approved",
    manager_comment: "Great focus on frontend consistency and UX.",
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    employee_id: "00000000-0000-0000-0000-000000000004",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Optimize Frontend Web Performance & Core Web Vitals",
    description: "Achieve sub-1.2s Largest Contentful Paint and 95+ Google Lighthouse performance score.",
    weightage: 40,
    target_date: "2026-12-31",
    status: "approved",
    manager_comment: "Crucial for customer retention and responsiveness.",
  },
  // Mehmood Sayed's Goals (Manager - Total = 85%)
  {
    id: "20000000-0000-0000-0000-000000000006",
    employee_id: "00000000-0000-0000-0000-000000000002",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Engineering Delivery Velocity & Sprint Predictability",
    description: "Maintain 95%+ sprint commitment predictability and reduce average bug resolution turnaround by 30%.",
    weightage: 35,
    target_date: "2026-12-15",
    status: "approved",
    manager_comment: "Approved. Critical for product roadmaps.",
  },
  {
    id: "20000000-0000-0000-0000-000000000007",
    employee_id: "00000000-0000-0000-0000-000000000002",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Cloud Infrastructure Cost & Reliability Optimization",
    description: "Optimize AWS cloud architectures to reduce monthly infrastructure run rate by 20% while maintaining 99.99% uptime.",
    weightage: 25,
    target_date: "2027-01-31",
    status: "approved",
    manager_comment: "Approved. Key financial efficiency target.",
  },
  {
    id: "20000000-0000-0000-0000-000000000008",
    employee_id: "00000000-0000-0000-0000-000000000002",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Engineering Talent Hiring & Team Retention",
    description: "Hire 4 senior engineers, organize internal tech seminars, and maintain zero voluntary attrition across core squads.",
    weightage: 25,
    target_date: "2027-03-31",
    status: "approved",
    manager_comment: "Approved. Team scaling is top priority.",
  },
  // Praveen Dalal's Goals (HR Admin - Total = 85%)
  {
    id: "20000000-0000-0000-0000-000000000009",
    employee_id: "00000000-0000-0000-0000-000000000001",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Organization Performance Management Cycle Execution",
    description: "Orchestrate end-to-end performance appraisals with 100% completion across all 200 organization employees.",
    weightage: 45,
    target_date: "2026-11-30",
    status: "approved",
    manager_comment: "Approved.",
  },
  {
    id: "20000000-0000-0000-0000-000000000010",
    employee_id: "00000000-0000-0000-0000-000000000001",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Leadership Succession & Talent Calibration Framework",
    description: "Conduct leadership reviews, implement salary calibration bands, and create career ladders across departments.",
    weightage: 40,
    target_date: "2027-02-28",
    status: "approved",
    manager_comment: "Approved.",
  },
  {
    id: "20000000-0000-0000-0000-000000000011",
    employee_id: "00000000-0000-0000-0000-000000000005",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Organization Performance Management Cycle Execution",
    description: "Orchestrate end-to-end performance appraisals with 100% completion across all 200 organization employees.",
    weightage: 45,
    target_date: "2026-11-30",
    status: "approved",
    manager_comment: "Approved.",
  },
  {
    id: "20000000-0000-0000-0000-000000000012",
    employee_id: "00000000-0000-0000-0000-000000000005",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    title: "Leadership Succession & Talent Calibration Framework",
    description: "Conduct leadership reviews, implement salary calibration bands, and create career ladders across departments.",
    weightage: 40,
    target_date: "2027-02-28",
    status: "approved",
    manager_comment: "Approved.",
  },
];

const INITIAL_REVIEWS: Review[] = [
  // 1. Aarya Shirodkar: TOP PERFORMER (⭐ 5.0 / 5.0 Exceptional)
  {
    id: "30000000-0000-0000-0000-000000000001",
    employee_id: "00000000-0000-0000-0000-000000000003",
    manager_id: "00000000-0000-0000-0000-000000000002",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    status: "manager_reviewed",
    overall_self_rating: 5,
    overall_manager_rating: 5,
    manager_summary: "Aarya is the top engineering performer this cycle. Her leadership on the microservice migration project was technically rigorous and completed ahead of schedule with zero downtime. Recommended for Senior Staff promotion.",
    submitted_at: "2026-08-20T10:30:00Z",
    reviewed_at: "2026-08-24T15:45:00Z",
  },
  // 2. Uraj Madkaikar: Solid Frontend Contributor (⭐ 3.5 / 5.0 - Self 3, Manager 4)
  {
    id: "30000000-0000-0000-0000-000000000002",
    employee_id: "00000000-0000-0000-0000-000000000004",
    manager_id: "00000000-0000-0000-0000-000000000002",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    status: "manager_reviewed",
    overall_self_rating: 3,
    overall_manager_rating: 4,
    manager_summary: "Uraj made solid progress on frontend modules this cycle. With more focus on automated test coverage and documentation, he will reach the next senior level.",
    submitted_at: "2026-08-22T09:15:00Z",
    reviewed_at: "2026-08-26T14:30:00Z",
  },
  // 3. Mehmood Sayed: Engineering Lead (⭐ 4.0 / 5.0 - Self 4, Manager 4)
  {
    id: "30000000-0000-0000-0000-000000000003",
    employee_id: "00000000-0000-0000-0000-000000000002",
    manager_id: "00000000-0000-0000-0000-000000000001",
    cycle_id: "10000000-0000-0000-0000-000000000001",
    status: "manager_reviewed",
    overall_self_rating: 4,
    overall_manager_rating: 4,
    manager_summary: "Mehmood has maintained good team stability and consistent sprint delivery. Continuing to develop cross-functional alignment in Q3.",
    submitted_at: "2026-08-18T14:00:00Z",
    reviewed_at: "2026-08-22T11:20:00Z",
  },
  // 4. Praveen Dalal: HR Director (⭐ 4.0 / 5.0 - Self 4, Manager 4)
  {
    id: "30000000-0000-0000-0000-000000000004",
    employee_id: "00000000-0000-0000-0000-000000000001",
    manager_id: null,
    cycle_id: "10000000-0000-0000-0000-000000000001",
    status: "completed",
    overall_self_rating: 4,
    overall_manager_rating: 4,
    manager_summary: "Praveen led the execution of organization appraisal cycles and talent calibration frameworks effectively.",
    submitted_at: "2026-08-15T12:00:00Z",
    reviewed_at: "2026-08-20T16:00:00Z",
  },
];

const INITIAL_GOAL_RATINGS: GoalRating[] = [
  // Aarya Shirodkar Goal Ratings (⭐ 5 on all goals)
  {
    id: "40000000-0000-0000-0000-000000000001",
    review_id: "30000000-0000-0000-0000-000000000001",
    goal_id: "20000000-0000-0000-0000-000000000001",
    self_comment: "Successfully migrated 100% of monolithic billing and notifications into scalable containerized services with zero downtime and 40% higher peak throughput.",
    self_rating: 5,
    manager_comment: "Flawless technical execution. Cutover was seamless with zero client-reported issues.",
    manager_rating: 5,
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    review_id: "30000000-0000-0000-0000-000000000001",
    goal_id: "20000000-0000-0000-0000-000000000002",
    self_comment: "Established automated Playwright test pipelines and boosted coverage from 62% to 88% across core user journeys.",
    self_rating: 5,
    manager_comment: "Great impact on CI/CD build stability and eliminated regression escape rate.",
    manager_rating: 5,
  },
  {
    id: "40000000-0000-0000-0000-000000000003",
    review_id: "30000000-0000-0000-0000-000000000001",
    goal_id: "20000000-0000-0000-0000-000000000003",
    self_comment: "Mentored 2 junior engineers through weekly technical sessions and guided them to independent feature delivery.",
    self_rating: 5,
    manager_comment: "Aarya is a fantastic technical mentor and positive multiplier for the entire engineering organization.",
    manager_rating: 5,
  },
  // Uraj Madkaikar Goal Ratings (⭐ 3 and 4)
  {
    id: "40000000-0000-0000-0000-000000000004",
    review_id: "30000000-0000-0000-0000-000000000002",
    goal_id: "20000000-0000-0000-0000-000000000004",
    self_comment: "Shipped 28 reusable Tailwind UI widgets in Storybook with full keyboard navigation and WCAG AA accessibility compliance.",
    self_rating: 4,
    manager_comment: "Good component structure. Keep improving documentation.",
    manager_rating: 4,
  },
  {
    id: "40000000-0000-0000-0000-000000000005",
    review_id: "30000000-0000-0000-0000-000000000002",
    goal_id: "20000000-0000-0000-0000-000000000005",
    self_comment: "Reduced bundle footprint by 25% and improved Largest Contentful Paint metric towards target.",
    self_rating: 3,
    manager_comment: "LCP improved to 1.8s, still working towards 1.2s sub-target.",
    manager_rating: 3,
  },
  // Mehmood Sayed Goal Ratings (⭐ 4)
  {
    id: "40000000-0000-0000-0000-000000000006",
    review_id: "30000000-0000-0000-0000-000000000003",
    goal_id: "20000000-0000-0000-0000-000000000006",
    self_comment: "Maintained 91% sprint predictability across squads.",
    self_rating: 4,
    manager_comment: "Solid turnaround and consistent delivery rhythm.",
    manager_rating: 4,
  },
  {
    id: "40000000-0000-0000-0000-000000000007",
    review_id: "30000000-0000-0000-0000-000000000003",
    goal_id: "20000000-0000-0000-0000-000000000007",
    self_comment: "Optimized AWS compute instances, trimming monthly spend by 18%.",
    self_rating: 4,
    manager_comment: "Good infrastructure cost management.",
    manager_rating: 4,
  },
  {
    id: "40000000-0000-0000-0000-000000000008",
    review_id: "30000000-0000-0000-0000-000000000003",
    goal_id: "20000000-0000-0000-0000-000000000008",
    self_comment: "Successfully recruited 3 senior engineers for core squads.",
    self_rating: 4,
    manager_comment: "Good hiring traction; keep scaling squad leads.",
    manager_rating: 4,
  },
  // Praveen Dalal Goal Ratings (⭐ 4)
  {
    id: "40000000-0000-0000-0000-000000000009",
    review_id: "30000000-0000-0000-0000-000000000004",
    goal_id: "20000000-0000-0000-0000-000000000009",
    self_comment: "Executed performance cycle across personnel with 92% on-time completion.",
    self_rating: 4,
    manager_comment: "Good operational execution and timeline adherence.",
    manager_rating: 4,
  },
  {
    id: "40000000-0000-0000-0000-000000000010",
    review_id: "30000000-0000-0000-0000-000000000004",
    goal_id: "20000000-0000-0000-0000-000000000010",
    self_comment: "Established standardized career progression frameworks for Engineering and Product.",
    self_rating: 4,
    manager_comment: "Solid strategic framework and leveling rubrics.",
    manager_rating: 4,
  },
];

// In-Memory Global Storage (persists within node/browser session for seamless fallback)
class Store {
  employees: Employee[] = [...INITIAL_EMPLOYEES];
  cycles: ReviewCycle[] = [...INITIAL_CYCLES];
  goals: Goal[] = [...INITIAL_GOALS];
  reviews: Review[] = [...INITIAL_REVIEWS];
  goalRatings: GoalRating[] = [...INITIAL_GOAL_RATINGS];

  resolveManagerNames() {
    this.employees = this.employees.map((emp) => {
      if (emp.manager_id) {
        const mgr = this.employees.find((m) => m.id === emp.manager_id);
        return { ...emp, manager_name: mgr ? mgr.full_name : null };
      }
      return { ...emp, manager_name: null };
    });
  }
}

const memoryStore = new Store();
memoryStore.resolveManagerNames();

export const dataStore = {
  // ---------------- EMPLOYEES ----------------
  async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .order("full_name");
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            ...d,
            manager_name: d.manager?.full_name || null,
          }));
        }
      } catch (e) {
        console.warn("Supabase query failed, falling back to memory store", e);
      }
    }
    memoryStore.resolveManagerNames();
    return [...memoryStore.employees];
  },

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    const normalizedEmail =
      email.toLowerCase() === "alice@company.com"
        ? "aarya@company.com"
        : email.toLowerCase() === "bob@company.com" || email.toLowerCase() === "aditya@company.com"
        ? "uraj@company.com"
        : email.toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .ilike("email", normalizedEmail)
          .maybeSingle();
        if (!error && data) {
          return { ...data, manager_name: data.manager?.full_name || null };
        }
      } catch (e) {}
    }
    const found = memoryStore.employees.find(
      (e) => e.email.toLowerCase() === normalizedEmail
    );
    if (!found) return null;
    const mgr = found.manager_id
      ? memoryStore.employees.find((m) => m.id === found.manager_id)
      : null;
    return { ...found, manager_name: mgr ? mgr.full_name : null };
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .eq("id", id)
          .maybeSingle();
        if (!error && data) {
          return { ...data, manager_name: data.manager?.full_name || null };
        }
      } catch (e) {}
    }
    const found = memoryStore.employees.find((e) => e.id === id);
    if (!found) return null;
    const mgr = found.manager_id
      ? memoryStore.employees.find((m) => m.id === found.manager_id)
      : null;
    return { ...found, manager_name: mgr ? mgr.full_name : null };
  },

  async linkClerkUser(email: string, clerkUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("employees")
          .update({ clerk_user_id: clerkUserId })
          .ilike("email", email);
      } catch (e) {}
    }
    const emp = memoryStore.employees.find(
      (e) => e.email.toLowerCase() === email.toLowerCase()
    );
    if (emp) {
      emp.clerk_user_id = clerkUserId;
    }
  },

  async createEmployee(emp: Omit<Employee, "id">): Promise<Employee> {
    const id = crypto.randomUUID();
    const newEmp: Employee = { ...emp, id };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .insert([newEmp])
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }

    memoryStore.employees.push(newEmp);
    memoryStore.resolveManagerNames();
    return newEmp;
  },

  // ---------------- REVIEW CYCLES ----------------
  async getCycles(): Promise<ReviewCycle[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("review_cycles")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return [...memoryStore.cycles];
  },

  async getActiveCycle(): Promise<ReviewCycle | null> {
    const cycles = await this.getCycles();
    return cycles.find((c) => c.status === "open") || null;
  },

  async createCycle(cycle: Omit<ReviewCycle, "id">): Promise<ReviewCycle> {
    const id = crypto.randomUUID();
    const newCycle: ReviewCycle = { ...cycle, id };

    if (newCycle.status === "open") {
      memoryStore.cycles.forEach((c) => {
        if (c.status === "open") c.status = "closed";
      });
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("review_cycles").update({ status: "closed" }).eq("status", "open");
        } catch (e) {}
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("review_cycles")
          .insert([newCycle])
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }

    memoryStore.cycles.unshift(newCycle);
    return newCycle;
  },

  async updateCycleStatus(id: string, status: "draft" | "open" | "closed"): Promise<void> {
    if (status === "open") {
      memoryStore.cycles.forEach((c) => {
        if (c.status === "open") c.status = "closed";
      });
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("review_cycles").update({ status: "closed" }).eq("status", "open");
        } catch (e) {}
      }
    }

    const c = memoryStore.cycles.find((x) => x.id === id);
    if (c) c.status = status;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("review_cycles").update({ status }).eq("id", id);
      } catch (e) {}
    }
  },

  // ---------------- GOALS ----------------
  async getGoals(employeeId: string, cycleId: string): Promise<Goal[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("cycle_id", cycleId)
          .order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    const matching = memoryStore.goals.filter(
      (g) => g.employee_id === employeeId && g.cycle_id === cycleId
    );
    if (matching.length > 0) return matching;

    // If employee is Praveen Dalal (either admin or hr ID alias)
    if (employeeId === "00000000-0000-0000-0000-000000000001" || employeeId === "00000000-0000-0000-0000-000000000005") {
      const praveenGoals = memoryStore.goals.filter(
        (g) => (g.employee_id === "00000000-0000-0000-0000-000000000001" || g.employee_id === "00000000-0000-0000-0000-000000000005") && g.cycle_id === cycleId
      );
      if (praveenGoals.length > 0) return praveenGoals.slice(0, 2);
    }

    return matching;
  },

  async createGoal(goal: Omit<Goal, "id">): Promise<Goal> {
    const id = crypto.randomUUID();
    const newGoal: Goal = { ...goal, id };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("goals")
          .insert([newGoal])
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }

    memoryStore.goals.push(newGoal);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("goals")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }
    const idx = memoryStore.goals.findIndex((g) => g.id === id);
    if (idx !== -1) {
      memoryStore.goals[idx] = { ...memoryStore.goals[idx], ...updates };
      return memoryStore.goals[idx];
    }
    throw new Error("Goal not found");
  },

  async deleteGoal(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").delete().eq("id", id);
      } catch (e) {}
    }
    memoryStore.goals = memoryStore.goals.filter((g) => g.id !== id);
  },

  async submitGoalsForApproval(employeeId: string, cycleId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update({ status: "submitted" })
          .eq("employee_id", employeeId)
          .eq("cycle_id", cycleId);
      } catch (e) {}
    }
    memoryStore.goals.forEach((g) => {
      if (g.employee_id === employeeId && g.cycle_id === cycleId) {
        g.status = "submitted";
      }
    });
  },

  async approveGoal(id: string, managerComment?: string): Promise<void> {
    const updates = { status: "approved" as const, manager_comment: managerComment || null };
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").update(updates).eq("id", id);
      } catch (e) {}
    }
    const g = memoryStore.goals.find((x) => x.id === id);
    if (g) {
      g.status = "approved";
      g.manager_comment = managerComment || null;
    }
  },

  async sendBackGoal(id: string, managerComment: string): Promise<void> {
    const updates = { status: "sent_back" as const, manager_comment: managerComment };
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").update(updates).eq("id", id);
      } catch (e) {}
    }
    const g = memoryStore.goals.find((x) => x.id === id);
    if (g) {
      g.status = "sent_back";
      g.manager_comment = managerComment;
    }
  },

  // ---------------- REVIEWS & APPRAISALS ----------------
  async getOrCreateReview(employeeId: string, cycleId: string, managerId?: string | null): Promise<Review> {
    let review: Review | undefined;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("cycle_id", cycleId)
          .maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }

    review = memoryStore.reviews.find(
      (r) => r.employee_id === employeeId && r.cycle_id === cycleId
    );

    if (!review) {
      const newReview: Review = {
        id: crypto.randomUUID(),
        employee_id: employeeId,
        manager_id: managerId || null,
        cycle_id: cycleId,
        status: "not_started",
      };

      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from("reviews")
            .insert([newReview])
            .select()
            .single();
          if (data) return data;
        } catch (e) {}
      }

      memoryStore.reviews.push(newReview);
      return newReview;
    }

    return review;
  },

  async getGoalRatings(reviewId: string): Promise<GoalRating[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("goal_ratings")
          .select("*")
          .eq("review_id", reviewId);
        if (!error && data) return data;
      } catch (e) {}
    }
    return memoryStore.goalRatings.filter((r) => r.review_id === reviewId);
  },

  async submitSelfAppraisal(
    reviewId: string,
    ratings: Array<{ goal_id: string; self_comment: string; self_rating: number }>,
    overallSelfRating: number
  ): Promise<void> {
    // Save goal ratings
    for (const r of ratings) {
      const existingIdx = memoryStore.goalRatings.findIndex(
        (x) => x.review_id === reviewId && x.goal_id === r.goal_id
      );
      if (existingIdx !== -1) {
        memoryStore.goalRatings[existingIdx] = {
          ...memoryStore.goalRatings[existingIdx],
          self_comment: r.self_comment,
          self_rating: r.self_rating,
        };
      } else {
        memoryStore.goalRatings.push({
          id: crypto.randomUUID(),
          review_id: reviewId,
          goal_id: r.goal_id,
          self_comment: r.self_comment,
          self_rating: r.self_rating,
        });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase.from("goal_ratings").upsert(
            {
              review_id: reviewId,
              goal_id: r.goal_id,
              self_comment: r.self_comment,
              self_rating: r.self_rating,
            },
            { onConflict: "review_id,goal_id" }
          );
        } catch (e) {}
      }
    }

    // Update review status
    const rev = memoryStore.reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.status = "self_appraisal_submitted";
      rev.overall_self_rating = overallSelfRating;
      rev.submitted_at = new Date().toISOString();
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("reviews")
          .update({
            status: "self_appraisal_submitted",
            overall_self_rating: overallSelfRating,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", reviewId);
      } catch (e) {}
    }
  },

  async submitManagerReview(
    reviewId: string,
    ratings: Array<{ goal_id: string; manager_comment: string; manager_rating: number }>,
    overallManagerRating: number,
    managerSummary: string
  ): Promise<void> {
    for (const r of ratings) {
      const existing = memoryStore.goalRatings.find(
        (x) => x.review_id === reviewId && x.goal_id === r.goal_id
      );
      if (existing) {
        existing.manager_comment = r.manager_comment;
        existing.manager_rating = r.manager_rating;
      } else {
        memoryStore.goalRatings.push({
          id: crypto.randomUUID(),
          review_id: reviewId,
          goal_id: r.goal_id,
          manager_comment: r.manager_comment,
          manager_rating: r.manager_rating,
        });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase.from("goal_ratings").upsert(
            {
              review_id: reviewId,
              goal_id: r.goal_id,
              manager_comment: r.manager_comment,
              manager_rating: r.manager_rating,
            },
            { onConflict: "review_id,goal_id" }
          );
        } catch (e) {}
      }
    }

    const rev = memoryStore.reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.status = "completed";
      rev.overall_manager_rating = overallManagerRating;
      rev.manager_summary = managerSummary;
      rev.reviewed_at = new Date().toISOString();
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("reviews")
          .update({
            status: "completed",
            overall_manager_rating: overallManagerRating,
            manager_summary: managerSummary,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", reviewId);
      } catch (e) {}
    }
  },

  // ---------------- MANAGER & HR VIEWS ----------------
  async getDirectReports(managerId: string): Promise<Employee[]> {
    const all = await this.getEmployees();
    const targetId =
      managerId === "00000000-0000-0000-0000-000000000005"
        ? "00000000-0000-0000-0000-000000000001"
        : managerId;
    return all.filter(
      (e) =>
        (e.manager_id === targetId || e.manager_id === managerId) &&
        e.is_active
    );
  },

  async getCompletionReport(cycleId: string): Promise<
    Array<{
      employee: Employee;
      status: "not_started" | "self_appraisal_submitted" | "manager_reviewed" | "completed";
      goalsCount: number;
      totalWeightage: number;
      overallSelfRating?: number | null;
      overallManagerRating?: number | null;
      reviewId?: string;
    }>
  > {
    const employees = await this.getEmployees();
    const activeEmployees = employees.filter((e) => e.is_active);
    const report = [];

    for (const emp of activeEmployees) {
      const review = await this.getOrCreateReview(emp.id, cycleId, emp.manager_id);
      const goals = await this.getGoals(emp.id, cycleId);
      const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

      report.push({
        employee: emp,
        status: review.status,
        goalsCount: goals.length,
        totalWeightage,
        overallSelfRating: review.overall_self_rating,
        overallManagerRating: review.overall_manager_rating,
        reviewId: review.id,
      });
    }

    return report;
  },
};

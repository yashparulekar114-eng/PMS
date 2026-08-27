import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nklugnjixltpnkoebdeo.supabase.co";
const supabaseKey = "sb_publishable_HqNnrE5hE_2i7TQyOboYlQ_0xIzENT2";
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding Supabase...");

  // 1. Cycles
  const { error: cErr } = await supabase.from("review_cycles").upsert([
    {
      id: "10000000-0000-0000-0000-000000000001",
      name: "FY 2026-27 Annual Review",
      start_date: "2026-04-01",
      end_date: "2027-03-31",
      status: "open",
      created_by: "00000000-0000-0000-0000-000000000001",
    },
  ]);
  if (cErr) console.error("cErr:", cErr);

  // 2. Employees
  const { error: eErr } = await supabase.from("employees").upsert([
    {
      id: "00000000-0000-0000-0000-000000000001",
      full_name: "Praveen Dalal",
      email: "admin@company.com",
      designation: "HR Director",
      department: "Human Resources",
      role: "hr_admin",
      is_active: true,
      manager_id: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      full_name: "Mehmood Sayed",
      email: "manager@company.com",
      designation: "Engineering Lead",
      department: "Engineering",
      role: "manager",
      is_active: true,
      manager_id: "00000000-0000-0000-0000-000000000001",
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      full_name: "Aarya Shirodkar",
      email: "aarya@company.com",
      designation: "Senior Full-Stack Engineer",
      department: "Engineering",
      role: "employee",
      is_active: true,
      manager_id: "00000000-0000-0000-0000-000000000002",
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      full_name: "Uraj Madkaikar",
      email: "uraj@company.com",
      designation: "Frontend Developer",
      department: "Engineering",
      role: "employee",
      is_active: true,
      manager_id: "00000000-0000-0000-0000-000000000002",
    },
  ]);
  if (eErr) console.error("eErr:", eErr);

  // 3. Goals
  const { error: gErr } = await supabase.from("goals").upsert([
    {
      id: "20000000-0000-0000-0000-000000000001",
      employee_id: "00000000-0000-0000-0000-000000000003",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Migrate Core API Services to Microservices Architecture",
      description: "Decompose monolithic billing & notifications into scalable independent services.",
      weightage: 40,
      target_date: "2026-11-30",
      status: "approved",
      manager_comment: "Approved. Essential for platform reliability.",
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      employee_id: "00000000-0000-0000-0000-000000000003",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Automate CI/CD & Elevate Regression Test Coverage to 85%",
      description: "Implement automated Playwright test suites and GitHub Actions deployment workflows.",
      weightage: 30,
      target_date: "2026-10-15",
      status: "approved",
      manager_comment: "Approved.",
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      employee_id: "00000000-0000-0000-0000-000000000003",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Technical Mentorship & Onboarding of Junior Engineers",
      description: "Lead weekly architectural sessions and conduct structured code reviews for 2 juniors.",
      weightage: 30,
      target_date: "2027-02-28",
      status: "approved",
      manager_comment: "Approved.",
    },
    {
      id: "20000000-0000-0000-0000-000000000004",
      employee_id: "00000000-0000-0000-0000-000000000004",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Design & Deliver Modern Tailwind UI Component Library",
      description: "Build accessible, highly responsive design system with 25+ reusable dashboard widgets.",
      weightage: 50,
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
      weightage: 50,
      target_date: "2026-12-31",
      status: "approved",
      manager_comment: "Crucial for customer retention and responsiveness.",
    },
    {
      id: "20000000-0000-0000-0000-000000000006",
      employee_id: "00000000-0000-0000-0000-000000000002",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Engineering Delivery Velocity & Sprint Predictability",
      description: "Maintain 95%+ sprint commitment predictability and reduce average bug resolution turnaround by 30%.",
      weightage: 40,
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
      weightage: 30,
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
      weightage: 30,
      target_date: "2027-03-31",
      status: "approved",
      manager_comment: "Approved. Team scaling is top priority.",
    },
    {
      id: "20000000-0000-0000-0000-000000000009",
      employee_id: "00000000-0000-0000-0000-000000000001",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      title: "Organization Performance Management Cycle Execution",
      description: "Orchestrate end-to-end performance appraisals with 100% completion across all 200 organization employees.",
      weightage: 50,
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
      weightage: 50,
      target_date: "2027-02-28",
      status: "approved",
      manager_comment: "Approved.",
    },
  ]);
  if (gErr) console.error("gErr:", gErr);

  // 4. Reviews
  const { error: rErr } = await supabase.from("reviews").upsert([
    {
      id: "30000000-0000-0000-0000-000000000001",
      employee_id: "00000000-0000-0000-0000-000000000003",
      manager_id: "00000000-0000-0000-0000-000000000002",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      status: "manager_reviewed",
      overall_self_rating: 4.8,
      overall_manager_rating: 4.7,
      manager_summary: "Aarya has delivered an exceptional performance this cycle. Her leadership on the microservice migration project was technically rigorous and completed ahead of schedule with zero downtime. Recommended for Senior Staff promotion.",
      submitted_at: "2026-08-20T10:30:00Z",
      reviewed_at: "2026-08-24T15:45:00Z",
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      employee_id: "00000000-0000-0000-0000-000000000004",
      manager_id: "00000000-0000-0000-0000-000000000002",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      status: "self_appraisal_submitted",
      overall_self_rating: 4.5,
      overall_manager_rating: null,
      manager_summary: null,
      submitted_at: "2026-08-26T09:15:00Z",
      reviewed_at: null,
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      employee_id: "00000000-0000-0000-0000-000000000002",
      manager_id: "00000000-0000-0000-0000-000000000001",
      cycle_id: "10000000-0000-0000-0000-000000000001",
      status: "completed",
      overall_self_rating: 4.6,
      overall_manager_rating: 4.8,
      manager_summary: "Mehmood continues to lead the engineering department with exemplary discipline. Team velocity, infrastructure cost controls, and employee engagement scores are among the highest in the company.",
      submitted_at: "2026-08-18T14:00:00Z",
      reviewed_at: "2026-08-22T11:20:00Z",
    },
  ]);
  if (rErr) console.error("rErr:", rErr);

  // 5. Goal Ratings
  const { error: grErr } = await supabase.from("goal_ratings").upsert(
    [
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
        self_rating: 4.5,
        manager_comment: "Great impact on CI/CD build stability and reduced regression escape rate.",
        manager_rating: 4.5,
      },
      {
        id: "40000000-0000-0000-0000-000000000003",
        review_id: "30000000-0000-0000-0000-000000000001",
        goal_id: "20000000-0000-0000-0000-000000000003",
        self_comment: "Mentored 2 junior engineers through weekly technical sessions and guided them to independent feature delivery.",
        self_rating: 5,
        manager_comment: "Aarya is a fantastic technical mentor and positive multiplier for the entire engineering organization.",
        manager_rating: 4.8,
      },
      {
        id: "40000000-0000-0000-0000-000000000004",
        review_id: "30000000-0000-0000-0000-000000000002",
        goal_id: "20000000-0000-0000-0000-000000000004",
        self_comment: "Shipped 28 reusable Tailwind UI widgets in Storybook with full keyboard navigation and WCAG AA accessibility compliance.",
        self_rating: 4.5,
      },
      {
        id: "40000000-0000-0000-0000-000000000005",
        review_id: "30000000-0000-0000-0000-000000000002",
        goal_id: "20000000-0000-0000-0000-000000000005",
        self_comment: "Reduced bundle footprint by 35% and improved Largest Contentful Paint metric to 1.1 seconds on mobile and desktop.",
        self_rating: 4.5,
      },
      {
        id: "40000000-0000-0000-0000-000000000006",
        review_id: "30000000-0000-0000-0000-000000000003",
        goal_id: "20000000-0000-0000-0000-000000000006",
        self_comment: "Maintained 96% sprint predictability across 6 squads while accelerating critical feature releases.",
        self_rating: 4.7,
        manager_comment: "Outstanding project delivery rhythm and transparent status reporting.",
        manager_rating: 4.8,
      },
      {
        id: "40000000-0000-0000-0000-000000000007",
        review_id: "30000000-0000-0000-0000-000000000003",
        goal_id: "20000000-0000-0000-0000-000000000007",
        self_comment: "Optimized AWS compute instances and database reservation policies, trimming monthly AWS spend by 22%.",
        self_rating: 4.5,
        manager_comment: "Significant cost reduction without compromising platform reliability.",
        manager_rating: 4.7,
      },
      {
        id: "40000000-0000-0000-0000-000000000008",
        review_id: "30000000-0000-0000-0000-000000000003",
        goal_id: "20000000-0000-0000-0000-000000000008",
        self_comment: "Successfully recruited 4 senior engineers and achieved 100% employee retention across the team.",
        self_rating: 4.8,
        manager_comment: "Great engineering leadership and team morale builder.",
        manager_rating: 5,
      },
    ],
    { onConflict: "review_id,goal_id" }
  );
  if (grErr) console.error("grErr:", grErr);

  console.log("Supabase seed complete!");
}

seed().catch(console.error);

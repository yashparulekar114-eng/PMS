import { createClient } from "@supabase/supabase-js";
import fs from 'fs';

const supabaseUrl = "https://nklugnjixltpnkoebdeo.supabase.co";
const supabaseKey = "sb_publishable_HqNnrE5hE_2i7TQyOboYlQ_0xIzENT2";
const supabase = createClient(supabaseUrl, supabaseKey);

const rosterData = JSON.parse(fs.readFileSync('C:/Users/Yash/.gemini/antigravity/brain/3768a52c-8393-4ea3-a926-badc5d521ec4/scratch/roster_data.json', 'utf8'));
const { employees, goals, reviews, goalRatings } = rosterData;

async function seed() {
  console.log("Cleaning and seeding 30 employees into Supabase...");

  // 1. Wipe in cascade order
  console.log("Deleting old goal_ratings...");
  await supabase.from("goal_ratings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Deleting old reviews...");
  await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Deleting old goals...");
  await supabase.from("goals").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Cycles
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
  if (cErr) console.error("Cycle error:", cErr);

  // 3. Employees in batches
  for (let i = 0; i < employees.length; i += 10) {
    const chunk = employees.slice(i, i + 10).map(e => ({
      id: e.id,
      full_name: e.full_name,
      email: e.email,
      designation: e.designation,
      department: e.department,
      date_of_joining: e.date_of_joining,
      manager_id: e.manager_id,
      role: e.role,
      is_active: e.is_active
    }));
    const { error: eErr } = await supabase.from("employees").upsert(chunk);
    if (eErr) console.error(`Employee chunk error (${i}):`, eErr);
  }
  console.log(`✓ Seeded ${employees.length} employees`);

  // 4. Goals in batches
  for (let i = 0; i < goals.length; i += 15) {
    const chunk = goals.slice(i, i + 15).map(g => ({
      id: g.id,
      employee_id: g.employee_id,
      cycle_id: g.cycle_id,
      title: g.title,
      description: g.description,
      weightage: g.weightage,
      target_date: g.target_date,
      status: g.status,
      manager_comment: g.manager_comment
    }));
    const { error: gErr } = await supabase.from("goals").insert(chunk);
    if (gErr) console.error(`Goals chunk error (${i}):`, gErr);
  }
  console.log(`✓ Seeded ${goals.length} goals`);

  // 5. Reviews in batches
  for (let i = 0; i < reviews.length; i += 10) {
    const chunk = reviews.slice(i, i + 10).map(r => ({
      id: r.id,
      employee_id: r.employee_id,
      manager_id: r.manager_id,
      cycle_id: r.cycle_id,
      status: r.status,
      overall_self_rating: r.overall_self_rating,
      overall_manager_rating: r.overall_manager_rating,
      manager_summary: r.manager_summary,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at
    }));
    const { error: rErr } = await supabase.from("reviews").insert(chunk);
    if (rErr) console.error(`Reviews chunk error (${i}):`, rErr);
  }
  console.log(`✓ Seeded ${reviews.length} reviews`);

  // 6. Goal ratings in batches
  for (let i = 0; i < goalRatings.length; i += 20) {
    const chunk = goalRatings.slice(i, i + 20).map(gr => ({
      id: gr.id,
      review_id: gr.review_id,
      goal_id: gr.goal_id,
      self_comment: gr.self_comment,
      self_rating: gr.self_rating,
      manager_comment: gr.manager_comment,
      manager_rating: gr.manager_rating
    }));
    const { error: grErr } = await supabase.from("goal_ratings").insert(chunk);
    if (grErr) console.error(`Goal ratings chunk error (${i}):`, grErr);
  }
  console.log(`✓ Seeded ${goalRatings.length} goal ratings`);

  console.log("SUCCESS! All 30 employees, goals, reviews, and ratings seeded into Supabase!");
}

seed().catch(console.error);

export type Role = "employee" | "manager" | "hr_admin";
export type CycleStatus = "draft" | "open" | "closed";
export type GoalStatus = "draft" | "submitted" | "approved" | "sent_back";
export type ReviewStatus = "not_started" | "self_appraisal_submitted" | "manager_reviewed" | "completed";

export interface Employee {
  id: string;
  clerk_user_id?: string | null;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id?: string | null;
  manager_name?: string | null;
  role: Role;
  is_active: boolean;
  created_at?: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_by?: string | null;
  created_at?: string;
}

export interface Goal {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description?: string;
  weightage: number;
  target_date?: string;
  status: GoalStatus;
  manager_comment?: string | null;
  created_at?: string;
}

export interface Review {
  id: string;
  employee_id: string;
  manager_id?: string | null;
  cycle_id: string;
  status: ReviewStatus;
  overall_self_rating?: number | null;
  overall_manager_rating?: number | null;
  manager_summary?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  // Joined fields for UI convenience
  employee?: Employee;
  cycle?: ReviewCycle;
}

export interface GoalRating {
  id: string;
  review_id: string;
  goal_id: string;
  self_comment?: string | null;
  self_rating?: number | null;
  manager_comment?: string | null;
  manager_rating?: number | null;
  created_at?: string;
  goal?: Goal;
}

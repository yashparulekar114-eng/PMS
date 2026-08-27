-- =========================================================================
-- PERFORMANCE MANAGEMENT SYSTEM (PMS) - SUPABASE POSTGRESQL SCHEMA
-- Designed for 200-person Services Company
-- Stack: Next.js + Supabase + Clerk + Resend
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES TABLE
-- Stores all personnel. Notice `manager_id` is a self-reference to employees.id
-- Foreign Key: manager_id references employees(id) to represent the reporting line without separate tables.
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'hr_admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. REVIEW CYCLES TABLE
-- Time-bound review cycles (e.g., 'FY 2026-27 Annual').
-- Foreign Key: created_by references employees(id) to maintain audit trails for cycle creation.
CREATE TABLE IF NOT EXISTS review_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GOALS TABLE
-- Individual performance goals set by an employee for a specific cycle.
-- Foreign Key: employee_id references employees(id) to establish ownership of the goal.
-- Foreign Key: cycle_id references review_cycles(id) so goals are strictly scoped to a cycle.
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    weightage NUMERIC(5,2) NOT NULL CHECK (weightage >= 0 AND weightage <= 100),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'sent_back')),
    manager_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. REVIEWS TABLE
-- The main workflow record tracking an appraisal lifecycle for an employee in a cycle.
-- Foreign Key: employee_id references employees(id) identifying who is being evaluated.
-- Foreign Key: manager_id references employees(id) identifying who conducts the manager review.
-- Foreign Key: cycle_id references review_cycles(id) identifying the appraisal cycle.
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    cycle_id UUID NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'self_appraisal_submitted', 'manager_reviewed', 'completed')),
    overall_self_rating NUMERIC(3,2) CHECK (overall_self_rating >= 1 AND overall_self_rating <= 5),
    overall_manager_rating NUMERIC(3,2) CHECK (overall_manager_rating >= 1 AND overall_manager_rating <= 5),
    manager_summary TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_employee_cycle UNIQUE (employee_id, cycle_id)
);

-- 5. GOAL RATINGS TABLE
-- Line-item ratings & comments for each specific goal evaluated in a review.
-- Foreign Key: review_id references reviews(id) ON DELETE CASCADE to group ratings inside the review.
-- Foreign Key: goal_id references goals(id) ON DELETE CASCADE to bind the evaluation directly to the goal.
CREATE TABLE IF NOT EXISTS goal_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    self_comment TEXT,
    self_rating NUMERIC(3,2) CHECK (self_rating >= 1 AND self_rating <= 5),
    manager_comment TEXT,
    manager_rating NUMERIC(3,2) CHECK (manager_rating >= 1 AND manager_rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_review_goal UNIQUE (review_id, goal_id)
);

-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_clerk_id ON employees(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_goals_employee_cycle ON goals(employee_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_employee_cycle ON reviews(employee_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_manager ON reviews(manager_id);
CREATE INDEX IF NOT EXISTS idx_goal_ratings_review ON goal_ratings(review_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_ratings ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo/anon development with fallback policy
CREATE POLICY "Public Read Access employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update employees" ON employees FOR ALL USING (true);

CREATE POLICY "Public Read Access review_cycles" ON review_cycles FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update review_cycles" ON review_cycles FOR ALL USING (true);

CREATE POLICY "Public Read Access goals" ON goals FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update goals" ON goals FOR ALL USING (true);

CREATE POLICY "Public Read Access reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update reviews" ON reviews FOR ALL USING (true);

CREATE POLICY "Public Read Access goal_ratings" ON goal_ratings FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update goal_ratings" ON goal_ratings FOR ALL USING (true);

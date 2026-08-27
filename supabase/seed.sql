-- =========================================================================
-- PERFORMANCE MANAGEMENT SYSTEM (PMS) - SEED TEST DATA
-- Provides pre-populated demo hierarchy and initial active cycle
-- =========================================================================

-- Clean up existing data in reverse order of foreign key dependency
DELETE FROM goal_ratings;
DELETE FROM reviews;
DELETE FROM goals;
DELETE FROM review_cycles;
DELETE FROM employees;

-- 1. Insert HR Admin
INSERT INTO employees (id, clerk_user_id, full_name, email, designation, department, date_of_joining, manager_id, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Praveen Dalal',
    'admin@company.com',
    'HR Director',
    'Human Resources',
    '2022-01-15',
    NULL,
    'hr_admin',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'Praveen Dalal (HR)',
    'hr@company.com',
    'HR Director',
    'Human Resources',
    '2022-01-15',
    NULL,
    'hr_admin',
    TRUE
);

-- 2. Insert Engineering Manager (reports to Praveen)
INSERT INTO employees (id, clerk_user_id, full_name, email, designation, department, date_of_joining, manager_id, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Mehmood Sayed',
    'manager@company.com',
    'Engineering Lead',
    'Engineering',
    '2022-03-01',
    '00000000-0000-0000-0000-000000000001',
    'manager',
    TRUE
);

-- 3. Insert Employee: Aarya Shirodkar (reports to Mehmood Sayed)
INSERT INTO employees (id, clerk_user_id, full_name, email, designation, department, date_of_joining, manager_id, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Aarya Shirodkar',
    'aarya@company.com',
    'Senior Full-Stack Engineer',
    'Engineering',
    '2023-06-10',
    '00000000-0000-0000-0000-000000000002',
    'employee',
    TRUE
);

-- 4. Insert Employee: Uraj Madkaikar (reports to Mehmood Sayed)
INSERT INTO employees (id, clerk_user_id, full_name, email, designation, department, date_of_joining, manager_id, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Uraj Madkaikar',
    'uraj@company.com',
    'Frontend Developer',
    'Engineering',
    '2024-01-08',
    '00000000-0000-0000-0000-000000000002',
    'employee',
    TRUE
);

-- 5. Insert Review Cycle (Active Open Cycle)
INSERT INTO review_cycles (id, name, start_date, end_date, status, created_by)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'FY 2026-27 Annual Review',
    '2026-04-01',
    '2027-03-31',
    'open',
    '00000000-0000-0000-0000-000000000001'
);

-- -- 6. Insert Aarya's sample goals (Sum of weightages = 35 + 25 + 25 = 85%)
INSERT INTO goals (id, employee_id, cycle_id, title, description, weightage, target_date, status, manager_comment)
VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Migrate Core API Services to Microservices Architecture',
    'Decompose the monolithic billing & notification modules to independently deployable containerized services, improving peak throughput by 40%.',
    35.00,
    '2026-11-30',
    'approved',
    'Great focus on architecture scaling. Approved.'
),
(
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Automate CI/CD & Elevate Regression Test Coverage to 85%',
    'Implement end-to-end Playwright test suite and GitHub Actions workflow to eliminate manual deployment regressions.',
    25.00,
    '2026-10-15',
    'approved',
    'Crucial for our Q3 reliability targets.'
),
(
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Technical Mentorship & Onboarding of Junior Engineers',
    'Organize weekly architectural brown-bag sessions and conduct structured code reviews for 2 junior team members.',
    25.00,
    '2027-02-28',
    'approved',
    'Excellent initiative to scale team leadership.'
),
-- 7. Insert Uraj's sample goals (Sum of weightages = 45 + 40 = 85%)
(
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Design & Deliver Modern Tailwind UI Component Library',
    'Build accessible, highly responsive design system with 25+ reusable dashboard widgets.',
    45.00,
    '2026-11-15',
    'approved',
    'Great focus on frontend consistency and UX.'
),
(
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Optimize Frontend Web Performance & Core Web Vitals',
    'Achieve sub-1.2s Largest Contentful Paint and 95+ Google Lighthouse performance score.',
    40.00,
    '2026-12-31',
    'approved',
    'Crucial for customer retention and responsiveness.'
),
-- 8. Insert Mehmood's sample goals (Manager - Sum of weightages = 35 + 25 + 25 = 85%)
(
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Engineering Delivery Velocity & Sprint Predictability',
    'Maintain 95%+ sprint commitment predictability and reduce average bug resolution turnaround by 30%.',
    35.00,
    '2026-12-15',
    'approved',
    'Approved. Critical for product roadmaps.'
),
(
    '20000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Cloud Infrastructure Cost & Reliability Optimization',
    'Optimize AWS cloud architectures to reduce monthly infrastructure run rate by 20% while maintaining 99.99% uptime.',
    25.00,
    '2027-01-31',
    'approved',
    'Approved. Key financial efficiency target.'
),
(
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Engineering Talent Hiring & Team Retention',
    'Hire 4 senior engineers, organize internal tech seminars, and maintain zero voluntary attrition across core squads.',
    25.00,
    '2027-03-31',
    'approved',
    'Approved. Team scaling is top priority.'
),
-- 9. Insert Praveen Dalal's sample goals (HR Admin - Sum of weightages = 45 + 40 = 85%)
(
    '20000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Organization Performance Management Cycle Execution',
    'Orchestrate end-to-end performance appraisals with 100% completion across all 200 organization employees.',
    45.00,
    '2026-11-30',
    'approved',
    'Approved.'
),
(
    '20000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Leadership Succession & Talent Calibration Framework',
    'Conduct leadership reviews, implement salary calibration bands, and create career ladders across departments.',
    40.00,
    '2027-02-28',
    'approved',
    'Approved.'
);

-- 10. Insert Review Records (Appraisal Lifecycle)
INSERT INTO reviews (id, employee_id, manager_id, cycle_id, status, overall_self_rating, overall_manager_rating, manager_summary, submitted_at, reviewed_at)
VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'manager_reviewed',
    5.00,
    5.00,
    'Aarya is the top engineering performer this cycle. Her leadership on the microservice migration project was technically rigorous and completed ahead of schedule with zero downtime. Recommended for Senior Staff promotion.',
    '2026-08-20 10:30:00+00',
    '2026-08-24 15:45:00+00'
),
(
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'manager_reviewed',
    3.00,
    4.00,
    'Uraj made solid progress on frontend modules this cycle. With more focus on automated test coverage and documentation, he will reach the next senior level.',
    '2026-08-22 09:15:00+00',
    '2026-08-26 14:30:00+00'
),
(
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'manager_reviewed',
    4.00,
    4.00,
    'Mehmood has maintained good team stability and consistent sprint delivery. Continuing to develop cross-functional alignment in Q3.',
    '2026-08-18 14:00:00+00',
    '2026-08-22 11:20:00+00'
),
(
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '10000000-0000-0000-0000-000000000001',
    'completed',
    4.00,
    4.00,
    'Praveen led the execution of organization appraisal cycles and talent calibration frameworks effectively.',
    '2026-08-15 12:00:00+00',
    '2026-08-20 16:00:00+00'
);

-- 11. Insert Line-Item Goal Ratings & Evaluator Feedback
INSERT INTO goal_ratings (id, review_id, goal_id, self_comment, self_rating, manager_comment, manager_rating)
VALUES 
-- Aarya Shirodkar Evaluations (⭐ 5.0)
(
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Successfully migrated 100% of monolithic billing and notifications into scalable containerized services with zero downtime and 40% higher peak throughput.',
    5.00,
    'Flawless technical execution. Cutover was seamless with zero client-reported issues.',
    5.00
),
(
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Established automated Playwright test pipelines and boosted coverage from 62% to 88% across core user journeys.',
    5.00,
    'Great impact on CI/CD build stability and eliminated regression escape rate.',
    5.00
),
(
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Mentored 2 junior engineers through weekly technical sessions and guided them to independent feature delivery.',
    5.00,
    'Aarya is a fantastic technical mentor and positive multiplier for the entire engineering organization.',
    5.00
),
-- Uraj Madkaikar Evaluations (⭐ 3 and 4)
(
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    'Shipped 28 reusable Tailwind UI widgets in Storybook with full keyboard navigation and WCAG AA accessibility compliance.',
    4.00,
    'Good component structure. Keep improving documentation.',
    4.00
),
(
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000005',
    'Reduced bundle footprint by 25% and improved Largest Contentful Paint metric towards target.',
    3.00,
    'LCP improved to 1.8s, still working towards 1.2s sub-target.',
    3.00
),
-- Mehmood Sayed Evaluations (⭐ 4.0)
(
    '40000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000006',
    'Maintained 91% sprint predictability across squads.',
    4.00,
    'Solid turnaround and consistent delivery rhythm.',
    4.00
),
(
    '40000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000007',
    'Optimized AWS compute instances, trimming monthly spend by 18%.',
    4.00,
    'Good infrastructure cost management.',
    4.00
),
(
    '40000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000008',
    'Successfully recruited 3 senior engineers for core squads.',
    4.00,
    'Good hiring traction; keep scaling squad leads.',
    4.00
),
-- Praveen Dalal Evaluations (⭐ 4.0)
(
    '40000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000009',
    'Executed performance cycle across personnel with 92% on-time completion.',
    4.00,
    'Good operational execution and timeline adherence.',
    4.00
),
(
    '40000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000010',
    'Established standardized career progression frameworks for Engineering and Product.',
    4.00,
    'Solid strategic framework and leveling rubrics.',
    4.00
);

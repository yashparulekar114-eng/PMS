import { supabase, isSupabaseConfigured } from "./supabase/client";
import { Employee, ReviewCycle, Goal, Review, GoalRating, AppNotification, NotificationType } from "@/types";

// Initial Demo Seed Data - 30 Employees Roster
const INITIAL_EMPLOYEES: Employee[] = [
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "full_name": "Praveen Dalal",
    "email": "admin@company.com",
    "designation": "HR Director",
    "department": "Human Resources",
    "date_of_joining": "2021-04-15",
    "manager_id": null,
    "manager_name": null,
    "role": "hr_admin",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000006",
    "full_name": "Yash Parulekar",
    "email": "yash@company.com",
    "designation": "VP of Technology & Engineering",
    "department": "Engineering",
    "date_of_joining": "2021-06-01",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "manager_name": "Praveen Dalal",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000007",
    "full_name": "Ananya Sharma",
    "email": "ananya@company.com",
    "designation": "Senior HR Business Partner",
    "department": "Human Resources",
    "date_of_joining": "2022-02-10",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "manager_name": "Praveen Dalal",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000008",
    "full_name": "Kunal Varma",
    "email": "kunal@company.com",
    "designation": "Talent Acquisition Lead",
    "department": "Human Resources",
    "date_of_joining": "2022-05-15",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "manager_name": "Praveen Dalal",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000009",
    "full_name": "Deepika Joshi",
    "email": "deepika@company.com",
    "designation": "HR Operations Manager",
    "department": "Human Resources",
    "date_of_joining": "2022-08-01",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "manager_name": "Praveen Dalal",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000010",
    "full_name": "Rohan Mehta",
    "email": "rohan@company.com",
    "designation": "People Analytics Specialist",
    "department": "Human Resources",
    "date_of_joining": "2023-01-15",
    "manager_id": "00000000-0000-0000-0000-000000000009",
    "manager_name": "Deepika Joshi",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "full_name": "Mehmood Sayed",
    "email": "manager@company.com",
    "designation": "Engineering Lead",
    "department": "Engineering",
    "date_of_joining": "2022-03-01",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "manager_name": "Yash Parulekar",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000003",
    "full_name": "Aarya Shirodkar",
    "email": "aarya@company.com",
    "designation": "Senior Full-Stack Engineer",
    "department": "Engineering",
    "date_of_joining": "2023-06-10",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000004",
    "full_name": "Uraj Madkaikar",
    "email": "uraj@company.com",
    "designation": "Frontend Developer",
    "department": "Engineering",
    "date_of_joining": "2024-01-08",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000011",
    "full_name": "Sneha Patil",
    "email": "sneha@company.com",
    "designation": "Senior Backend Engineer",
    "department": "Engineering",
    "date_of_joining": "2022-11-20",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000012",
    "full_name": "Vikram Desai",
    "email": "vikram@company.com",
    "designation": "Lead DevOps & Cloud Architect",
    "department": "Engineering",
    "date_of_joining": "2022-07-15",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000013",
    "full_name": "Tanvi Sawant",
    "email": "tanvi@company.com",
    "designation": "Software Engineer II",
    "department": "Engineering",
    "date_of_joining": "2023-04-01",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000014",
    "full_name": "Aditya Kamat",
    "email": "aditya@company.com",
    "designation": "Associate Full-Stack Developer",
    "department": "Engineering",
    "date_of_joining": "2024-02-15",
    "manager_id": "00000000-0000-0000-0000-000000000003",
    "manager_name": "Aarya Shirodkar",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000015",
    "full_name": "Gauri Naik",
    "email": "gauri@company.com",
    "designation": "QA Automation Lead",
    "department": "Engineering",
    "date_of_joining": "2023-02-01",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "manager_name": "Mehmood Sayed",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000016",
    "full_name": "Rohit Deshmukh",
    "email": "rohit@company.com",
    "designation": "Mobile Engineering Manager",
    "department": "Engineering",
    "date_of_joining": "2022-04-10",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "manager_name": "Yash Parulekar",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000017",
    "full_name": "Pooja Kulkarni",
    "email": "pooja@company.com",
    "designation": "Lead iOS Engineer",
    "department": "Engineering",
    "date_of_joining": "2022-09-01",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "manager_name": "Rohit Deshmukh",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000018",
    "full_name": "Siddharth Rane",
    "email": "siddharth@company.com",
    "designation": "Senior Android Engineer",
    "department": "Engineering",
    "date_of_joining": "2023-03-15",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "manager_name": "Rohit Deshmukh",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000019",
    "full_name": "Neha Borkar",
    "email": "neha@company.com",
    "designation": "React Native Developer",
    "department": "Engineering",
    "date_of_joining": "2023-07-20",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "manager_name": "Rohit Deshmukh",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000020",
    "full_name": "Sanket Gaonkar",
    "email": "sanket@company.com",
    "designation": "Frontend UI Specialist",
    "department": "Engineering",
    "date_of_joining": "2023-11-01",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "manager_name": "Rohit Deshmukh",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000021",
    "full_name": "Rhea Fernandes",
    "email": "rhea@company.com",
    "designation": "Mobile QA Specialist",
    "department": "Engineering",
    "date_of_joining": "2024-03-01",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "manager_name": "Rohit Deshmukh",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000022",
    "full_name": "Natasha D'Souza",
    "email": "natasha@company.com",
    "designation": "Principal Product Manager",
    "department": "Product",
    "date_of_joining": "2022-01-10",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "manager_name": "Yash Parulekar",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000023",
    "full_name": "Varun Prabhu",
    "email": "varun@company.com",
    "designation": "Lead Product Designer",
    "department": "Design",
    "date_of_joining": "2022-06-15",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "manager_name": "Natasha D'Souza",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000024",
    "full_name": "Maitreyi Chari",
    "email": "maitreyi@company.com",
    "designation": "UI & Visual Designer",
    "department": "Design",
    "date_of_joining": "2023-05-10",
    "manager_id": "00000000-0000-0000-0000-000000000023",
    "manager_name": "Varun Prabhu",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000025",
    "full_name": "Amit Saraf",
    "email": "amit@company.com",
    "designation": "Senior Data & BI Analyst",
    "department": "Product",
    "date_of_joining": "2023-08-01",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "manager_name": "Natasha D'Souza",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000026",
    "full_name": "Shruti Hegde",
    "email": "shruti@company.com",
    "designation": "Associate Product Manager",
    "department": "Product",
    "date_of_joining": "2024-01-15",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "manager_name": "Natasha D'Souza",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000027",
    "full_name": "Sameer Merchant",
    "email": "sameer@company.com",
    "designation": "Head of Customer Success",
    "department": "Operations",
    "date_of_joining": "2022-05-01",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "manager_name": "Praveen Dalal",
    "role": "manager",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000028",
    "full_name": "Kavita Shenoy",
    "email": "kavita@company.com",
    "designation": "Senior Enterprise CSM",
    "department": "Operations",
    "date_of_joining": "2022-10-15",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "manager_name": "Sameer Merchant",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000029",
    "full_name": "Prathamesh Shinde",
    "email": "prathamesh@company.com",
    "designation": "Lead Solutions Architect",
    "department": "Operations",
    "date_of_joining": "2023-02-20",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "manager_name": "Sameer Merchant",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000030",
    "full_name": "Zoya Khan",
    "email": "zoya@company.com",
    "designation": "Customer Operations Specialist",
    "department": "Operations",
    "date_of_joining": "2023-09-01",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "manager_name": "Sameer Merchant",
    "role": "employee",
    "is_active": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000031",
    "full_name": "Rahul Gadekar",
    "email": "rahul@company.com",
    "designation": "Implementation Consultant",
    "department": "Operations",
    "date_of_joining": "2024-02-01",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "manager_name": "Sameer Merchant",
    "role": "employee",
    "is_active": true
  }
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
  {
    "id": "20000000-0000-0000-0000-000000000001",
    "employee_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Talent Acquisition & Retention",
    "description": "Optimize hiring pipelines to achieve under 30-day time-to-hire with 95% retention rate.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000002",
    "employee_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Standardize Global PMS Review Calibration",
    "description": "Implement normalized rating rubrics and complete 100% of executive calibrations on schedule.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000003",
    "employee_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Employee Learning & Leadership Development",
    "description": "Roll out modern engineering and management training workshops across all departments.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000007",
    "employee_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000008",
    "employee_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000009",
    "employee_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000013",
    "employee_id": "00000000-0000-0000-0000-000000000008",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Talent Acquisition & Retention",
    "description": "Optimize hiring pipelines to achieve under 30-day time-to-hire with 95% retention rate.",
    "weightage": 40,
    "target_date": "2026-11-30",
    "status": "draft",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000014",
    "employee_id": "00000000-0000-0000-0000-000000000008",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Standardize Global PMS Review Calibration",
    "description": "Implement normalized rating rubrics and complete 100% of executive calibrations on schedule.",
    "weightage": 40,
    "target_date": "2026-10-15",
    "status": "draft",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000015",
    "employee_id": "00000000-0000-0000-0000-000000000008",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Employee Learning & Leadership Development",
    "description": "Roll out modern engineering and management training workshops across all departments.",
    "weightage": 40,
    "target_date": "2027-02-28",
    "status": "draft",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000016",
    "employee_id": "00000000-0000-0000-0000-000000000009",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Talent Acquisition & Retention",
    "description": "Optimize hiring pipelines to achieve under 30-day time-to-hire with 95% retention rate.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000017",
    "employee_id": "00000000-0000-0000-0000-000000000009",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Standardize Global PMS Review Calibration",
    "description": "Implement normalized rating rubrics and complete 100% of executive calibrations on schedule.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000018",
    "employee_id": "00000000-0000-0000-0000-000000000009",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Employee Learning & Leadership Development",
    "description": "Roll out modern engineering and management training workshops across all departments.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000022",
    "employee_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000023",
    "employee_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000024",
    "employee_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000025",
    "employee_id": "00000000-0000-0000-0000-000000000003",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000026",
    "employee_id": "00000000-0000-0000-0000-000000000003",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000027",
    "employee_id": "00000000-0000-0000-0000-000000000003",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000028",
    "employee_id": "00000000-0000-0000-0000-000000000004",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000029",
    "employee_id": "00000000-0000-0000-0000-000000000004",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000030",
    "employee_id": "00000000-0000-0000-0000-000000000004",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000031",
    "employee_id": "00000000-0000-0000-0000-000000000011",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000032",
    "employee_id": "00000000-0000-0000-0000-000000000011",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000033",
    "employee_id": "00000000-0000-0000-0000-000000000011",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000034",
    "employee_id": "00000000-0000-0000-0000-000000000012",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000035",
    "employee_id": "00000000-0000-0000-0000-000000000012",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000036",
    "employee_id": "00000000-0000-0000-0000-000000000012",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000037",
    "employee_id": "00000000-0000-0000-0000-000000000013",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000038",
    "employee_id": "00000000-0000-0000-0000-000000000013",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000039",
    "employee_id": "00000000-0000-0000-0000-000000000013",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000040",
    "employee_id": "00000000-0000-0000-0000-000000000014",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000041",
    "employee_id": "00000000-0000-0000-0000-000000000014",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000042",
    "employee_id": "00000000-0000-0000-0000-000000000014",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000043",
    "employee_id": "00000000-0000-0000-0000-000000000015",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000044",
    "employee_id": "00000000-0000-0000-0000-000000000015",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000045",
    "employee_id": "00000000-0000-0000-0000-000000000015",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000046",
    "employee_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000047",
    "employee_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000048",
    "employee_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000049",
    "employee_id": "00000000-0000-0000-0000-000000000017",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000050",
    "employee_id": "00000000-0000-0000-0000-000000000017",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000051",
    "employee_id": "00000000-0000-0000-0000-000000000017",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000052",
    "employee_id": "00000000-0000-0000-0000-000000000018",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000053",
    "employee_id": "00000000-0000-0000-0000-000000000018",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000054",
    "employee_id": "00000000-0000-0000-0000-000000000018",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000055",
    "employee_id": "00000000-0000-0000-0000-000000000019",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000056",
    "employee_id": "00000000-0000-0000-0000-000000000019",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000057",
    "employee_id": "00000000-0000-0000-0000-000000000019",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000058",
    "employee_id": "00000000-0000-0000-0000-000000000020",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000059",
    "employee_id": "00000000-0000-0000-0000-000000000020",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000060",
    "employee_id": "00000000-0000-0000-0000-000000000020",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000061",
    "employee_id": "00000000-0000-0000-0000-000000000021",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Microservices Architecture & Platform Scalability",
    "description": "Modernize monolithic modules to high-throughput containerized microservices.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000062",
    "employee_id": "00000000-0000-0000-0000-000000000021",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "CI/CD Pipeline Automation & Quality Assurance",
    "description": "Enhance Playwright end-to-end automated testing to achieve 90%+ code coverage.",
    "weightage": 25,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000063",
    "employee_id": "00000000-0000-0000-0000-000000000021",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Technical Mentorship & Squad Onboarding",
    "description": "Lead brown-bag architectural sessions and mentor junior software engineers.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000064",
    "employee_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Product Roadmap Execution & Feature Velocity",
    "description": "Drive high-impact product releases with zero critical regressions.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000065",
    "employee_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "User Retention & Engagement Analytics",
    "description": "Analyze user interaction funnels and improve core product DAU/MAU by 15%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000066",
    "employee_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Cross-Functional Agile Alignment",
    "description": "Streamline sprint planning, user stories, and acceptance criteria across squads.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000067",
    "employee_id": "00000000-0000-0000-0000-000000000023",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Unified Design System & Component Library",
    "description": "Publish and maintain accessible Figma components and Tailwind UI patterns.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000068",
    "employee_id": "00000000-0000-0000-0000-000000000023",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "User Research & Usability Benchmarking",
    "description": "Conduct customer interviews and iterative usability test cycles for new flows.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000069",
    "employee_id": "00000000-0000-0000-0000-000000000023",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Accessibility (WCAG AA) Compliance",
    "description": "Audit all interfaces and ensure complete compliance with color contrast and keyboard navigation.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000070",
    "employee_id": "00000000-0000-0000-0000-000000000024",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Unified Design System & Component Library",
    "description": "Publish and maintain accessible Figma components and Tailwind UI patterns.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000071",
    "employee_id": "00000000-0000-0000-0000-000000000024",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "User Research & Usability Benchmarking",
    "description": "Conduct customer interviews and iterative usability test cycles for new flows.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000072",
    "employee_id": "00000000-0000-0000-0000-000000000024",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Accessibility (WCAG AA) Compliance",
    "description": "Audit all interfaces and ensure complete compliance with color contrast and keyboard navigation.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000073",
    "employee_id": "00000000-0000-0000-0000-000000000025",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Product Roadmap Execution & Feature Velocity",
    "description": "Drive high-impact product releases with zero critical regressions.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000074",
    "employee_id": "00000000-0000-0000-0000-000000000025",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "User Retention & Engagement Analytics",
    "description": "Analyze user interaction funnels and improve core product DAU/MAU by 15%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000075",
    "employee_id": "00000000-0000-0000-0000-000000000025",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Cross-Functional Agile Alignment",
    "description": "Streamline sprint planning, user stories, and acceptance criteria across squads.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000076",
    "employee_id": "00000000-0000-0000-0000-000000000026",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Product Roadmap Execution & Feature Velocity",
    "description": "Drive high-impact product releases with zero critical regressions.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000077",
    "employee_id": "00000000-0000-0000-0000-000000000026",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "User Retention & Engagement Analytics",
    "description": "Analyze user interaction funnels and improve core product DAU/MAU by 15%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000078",
    "employee_id": "00000000-0000-0000-0000-000000000026",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Cross-Functional Agile Alignment",
    "description": "Streamline sprint planning, user stories, and acceptance criteria across squads.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000079",
    "employee_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Customer Onboarding & Time-to-Value",
    "description": "Reduce onboarding setup time by 25% while maintaining 98%+ CSAT score.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000080",
    "employee_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Proactive Account Health & Retention Programs",
    "description": "Monitor customer health scores and maintain net revenue retention above 110%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000081",
    "employee_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Support Ticket Resolution SLA Optimization",
    "description": "Decrease first-response latency and resolve enterprise tier issues within 2 hours.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000082",
    "employee_id": "00000000-0000-0000-0000-000000000028",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Customer Onboarding & Time-to-Value",
    "description": "Reduce onboarding setup time by 25% while maintaining 98%+ CSAT score.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000083",
    "employee_id": "00000000-0000-0000-0000-000000000028",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Proactive Account Health & Retention Programs",
    "description": "Monitor customer health scores and maintain net revenue retention above 110%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000084",
    "employee_id": "00000000-0000-0000-0000-000000000028",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Support Ticket Resolution SLA Optimization",
    "description": "Decrease first-response latency and resolve enterprise tier issues within 2 hours.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000085",
    "employee_id": "00000000-0000-0000-0000-000000000029",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Customer Onboarding & Time-to-Value",
    "description": "Reduce onboarding setup time by 25% while maintaining 98%+ CSAT score.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000086",
    "employee_id": "00000000-0000-0000-0000-000000000029",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Proactive Account Health & Retention Programs",
    "description": "Monitor customer health scores and maintain net revenue retention above 110%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000087",
    "employee_id": "00000000-0000-0000-0000-000000000029",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Support Ticket Resolution SLA Optimization",
    "description": "Decrease first-response latency and resolve enterprise tier issues within 2 hours.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000088",
    "employee_id": "00000000-0000-0000-0000-000000000030",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Customer Onboarding & Time-to-Value",
    "description": "Reduce onboarding setup time by 25% while maintaining 98%+ CSAT score.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000089",
    "employee_id": "00000000-0000-0000-0000-000000000030",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Proactive Account Health & Retention Programs",
    "description": "Monitor customer health scores and maintain net revenue retention above 110%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000090",
    "employee_id": "00000000-0000-0000-0000-000000000030",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Support Ticket Resolution SLA Optimization",
    "description": "Decrease first-response latency and resolve enterprise tier issues within 2 hours.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000091",
    "employee_id": "00000000-0000-0000-0000-000000000031",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Enterprise Customer Onboarding & Time-to-Value",
    "description": "Reduce onboarding setup time by 25% while maintaining 98%+ CSAT score.",
    "weightage": 35,
    "target_date": "2026-11-30",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000092",
    "employee_id": "00000000-0000-0000-0000-000000000031",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Proactive Account Health & Retention Programs",
    "description": "Monitor customer health scores and maintain net revenue retention above 110%.",
    "weightage": 30,
    "target_date": "2026-10-15",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  },
  {
    "id": "20000000-0000-0000-0000-000000000093",
    "employee_id": "00000000-0000-0000-0000-000000000031",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "title": "Support Ticket Resolution SLA Optimization",
    "description": "Decrease first-response latency and resolve enterprise tier issues within 2 hours.",
    "weightage": 25,
    "target_date": "2027-02-28",
    "status": "approved",
    "manager_comment": "Approved. Strategic milestone for the annual review cycle."
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    "id": "30000000-0000-0000-0000-000000000001",
    "employee_id": "00000000-0000-0000-0000-000000000001",
    "manager_id": null,
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4,
    "overall_manager_rating": 4,
    "manager_summary": "Praveen has delivered outstanding leadership in standardizing the PMS appraisal workflow and driving organizational talent management initiatives.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000003",
    "employee_id": "00000000-0000-0000-0000-000000000006",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4.5,
    "overall_manager_rating": 4.5,
    "manager_summary": "Yash has provided stellar architectural direction and strategic vision across Engineering and Product squads.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000004",
    "employee_id": "00000000-0000-0000-0000-000000000007",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000005",
    "employee_id": "00000000-0000-0000-0000-000000000008",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000006",
    "employee_id": "00000000-0000-0000-0000-000000000009",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000007",
    "employee_id": "00000000-0000-0000-0000-000000000010",
    "manager_id": "00000000-0000-0000-0000-000000000009",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000008",
    "employee_id": "00000000-0000-0000-0000-000000000002",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4,
    "overall_manager_rating": 4,
    "manager_summary": "Mehmood has provided steady leadership to the Core Platform engineering squads, fostering high delivery standards and timely sprint executions.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000009",
    "employee_id": "00000000-0000-0000-0000-000000000003",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 5,
    "overall_manager_rating": 5,
    "manager_summary": "Exceptional performance across the board. Exemplary technical leadership and flawless execution on microservices modernization. Highly recommended for Senior Staff promotion.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000010",
    "employee_id": "00000000-0000-0000-0000-000000000004",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "manager_reviewed",
    "overall_self_rating": 3.5,
    "overall_manager_rating": 3.5,
    "manager_summary": "Solid progress on UI redesign and design system components. Encourage taking greater autonomy on complex state management tasks.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000011",
    "employee_id": "00000000-0000-0000-0000-000000000011",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000012",
    "employee_id": "00000000-0000-0000-0000-000000000012",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.4000000000000004,
    "overall_manager_rating": 3.2,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000013",
    "employee_id": "00000000-0000-0000-0000-000000000013",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000014",
    "employee_id": "00000000-0000-0000-0000-000000000014",
    "manager_id": "00000000-0000-0000-0000-000000000003",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.7,
    "overall_manager_rating": 3.5,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000015",
    "employee_id": "00000000-0000-0000-0000-000000000015",
    "manager_id": "00000000-0000-0000-0000-000000000002",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4.4,
    "overall_manager_rating": 4.2,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000016",
    "employee_id": "00000000-0000-0000-0000-000000000016",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000017",
    "employee_id": "00000000-0000-0000-0000-000000000017",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.6,
    "overall_manager_rating": 3.4,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000018",
    "employee_id": "00000000-0000-0000-0000-000000000018",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4.3,
    "overall_manager_rating": 4.1,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000019",
    "employee_id": "00000000-0000-0000-0000-000000000019",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000020",
    "employee_id": "00000000-0000-0000-0000-000000000020",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.5,
    "overall_manager_rating": 3.3,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000021",
    "employee_id": "00000000-0000-0000-0000-000000000021",
    "manager_id": "00000000-0000-0000-0000-000000000016",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000022",
    "employee_id": "00000000-0000-0000-0000-000000000022",
    "manager_id": "00000000-0000-0000-0000-000000000006",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.8000000000000003,
    "overall_manager_rating": 3.6,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000023",
    "employee_id": "00000000-0000-0000-0000-000000000023",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.4000000000000004,
    "overall_manager_rating": 3.2,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000024",
    "employee_id": "00000000-0000-0000-0000-000000000024",
    "manager_id": "00000000-0000-0000-0000-000000000023",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4.1,
    "overall_manager_rating": 3.9,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000025",
    "employee_id": "00000000-0000-0000-0000-000000000025",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "not_started",
    "overall_self_rating": null,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": null,
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000026",
    "employee_id": "00000000-0000-0000-0000-000000000026",
    "manager_id": "00000000-0000-0000-0000-000000000022",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  },
  {
    "id": "30000000-0000-0000-0000-000000000027",
    "employee_id": "00000000-0000-0000-0000-000000000027",
    "manager_id": "00000000-0000-0000-0000-000000000001",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4,
    "overall_manager_rating": 3.8,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000028",
    "employee_id": "00000000-0000-0000-0000-000000000028",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.6,
    "overall_manager_rating": 3.4,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000029",
    "employee_id": "00000000-0000-0000-0000-000000000029",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 4.3,
    "overall_manager_rating": 4.1,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000030",
    "employee_id": "00000000-0000-0000-0000-000000000030",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "completed",
    "overall_self_rating": 3.9000000000000004,
    "overall_manager_rating": 3.7,
    "manager_summary": "Demonstrated dependable execution on departmental deliverables. Solid team player who consistently meets high expectations.",
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": "2026-06-28T14:30:00Z"
  },
  {
    "id": "30000000-0000-0000-0000-000000000031",
    "employee_id": "00000000-0000-0000-0000-000000000031",
    "manager_id": "00000000-0000-0000-0000-000000000027",
    "cycle_id": "10000000-0000-0000-0000-000000000001",
    "status": "self_appraisal_submitted",
    "overall_self_rating": 3.8,
    "overall_manager_rating": null,
    "manager_summary": null,
    "submitted_at": "2026-06-25T10:00:00Z",
    "reviewed_at": null
  }
];

const INITIAL_GOAL_RATINGS: GoalRating[] = [
  {
    "id": "40000000-0000-0000-0000-000000000001",
    "review_id": "30000000-0000-0000-0000-000000000001",
    "goal_id": "20000000-0000-0000-0000-000000000001",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000002",
    "review_id": "30000000-0000-0000-0000-000000000001",
    "goal_id": "20000000-0000-0000-0000-000000000002",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000003",
    "review_id": "30000000-0000-0000-0000-000000000001",
    "goal_id": "20000000-0000-0000-0000-000000000003",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000007",
    "review_id": "30000000-0000-0000-0000-000000000003",
    "goal_id": "20000000-0000-0000-0000-000000000007",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000008",
    "review_id": "30000000-0000-0000-0000-000000000003",
    "goal_id": "20000000-0000-0000-0000-000000000008",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000009",
    "review_id": "30000000-0000-0000-0000-000000000003",
    "goal_id": "20000000-0000-0000-0000-000000000009",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000016",
    "review_id": "30000000-0000-0000-0000-000000000006",
    "goal_id": "20000000-0000-0000-0000-000000000016",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000017",
    "review_id": "30000000-0000-0000-0000-000000000006",
    "goal_id": "20000000-0000-0000-0000-000000000017",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000018",
    "review_id": "30000000-0000-0000-0000-000000000006",
    "goal_id": "20000000-0000-0000-0000-000000000018",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000022",
    "review_id": "30000000-0000-0000-0000-000000000008",
    "goal_id": "20000000-0000-0000-0000-000000000022",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000023",
    "review_id": "30000000-0000-0000-0000-000000000008",
    "goal_id": "20000000-0000-0000-0000-000000000023",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000024",
    "review_id": "30000000-0000-0000-0000-000000000008",
    "goal_id": "20000000-0000-0000-0000-000000000024",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4
  },
  {
    "id": "40000000-0000-0000-0000-000000000025",
    "review_id": "30000000-0000-0000-0000-000000000009",
    "goal_id": "20000000-0000-0000-0000-000000000025",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 5,
    "manager_comment": "Flawless execution with measurable impact on platform reliability.",
    "manager_rating": 5
  },
  {
    "id": "40000000-0000-0000-0000-000000000026",
    "review_id": "30000000-0000-0000-0000-000000000009",
    "goal_id": "20000000-0000-0000-0000-000000000026",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 5,
    "manager_comment": "Flawless execution with measurable impact on platform reliability.",
    "manager_rating": 5
  },
  {
    "id": "40000000-0000-0000-0000-000000000027",
    "review_id": "30000000-0000-0000-0000-000000000009",
    "goal_id": "20000000-0000-0000-0000-000000000027",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 5,
    "manager_comment": "Flawless execution with measurable impact on platform reliability.",
    "manager_rating": 5
  },
  {
    "id": "40000000-0000-0000-0000-000000000028",
    "review_id": "30000000-0000-0000-0000-000000000010",
    "goal_id": "20000000-0000-0000-0000-000000000028",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000029",
    "review_id": "30000000-0000-0000-0000-000000000010",
    "goal_id": "20000000-0000-0000-0000-000000000029",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000030",
    "review_id": "30000000-0000-0000-0000-000000000010",
    "goal_id": "20000000-0000-0000-0000-000000000030",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000031",
    "review_id": "30000000-0000-0000-0000-000000000011",
    "goal_id": "20000000-0000-0000-0000-000000000031",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000032",
    "review_id": "30000000-0000-0000-0000-000000000011",
    "goal_id": "20000000-0000-0000-0000-000000000032",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000033",
    "review_id": "30000000-0000-0000-0000-000000000011",
    "goal_id": "20000000-0000-0000-0000-000000000033",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000034",
    "review_id": "30000000-0000-0000-0000-000000000012",
    "goal_id": "20000000-0000-0000-0000-000000000034",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000035",
    "review_id": "30000000-0000-0000-0000-000000000012",
    "goal_id": "20000000-0000-0000-0000-000000000035",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000036",
    "review_id": "30000000-0000-0000-0000-000000000012",
    "goal_id": "20000000-0000-0000-0000-000000000036",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000037",
    "review_id": "30000000-0000-0000-0000-000000000013",
    "goal_id": "20000000-0000-0000-0000-000000000037",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000038",
    "review_id": "30000000-0000-0000-0000-000000000013",
    "goal_id": "20000000-0000-0000-0000-000000000038",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000039",
    "review_id": "30000000-0000-0000-0000-000000000013",
    "goal_id": "20000000-0000-0000-0000-000000000039",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000040",
    "review_id": "30000000-0000-0000-0000-000000000014",
    "goal_id": "20000000-0000-0000-0000-000000000040",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.7,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000041",
    "review_id": "30000000-0000-0000-0000-000000000014",
    "goal_id": "20000000-0000-0000-0000-000000000041",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.7,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000042",
    "review_id": "30000000-0000-0000-0000-000000000014",
    "goal_id": "20000000-0000-0000-0000-000000000042",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.7,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.5
  },
  {
    "id": "40000000-0000-0000-0000-000000000043",
    "review_id": "30000000-0000-0000-0000-000000000015",
    "goal_id": "20000000-0000-0000-0000-000000000043",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000044",
    "review_id": "30000000-0000-0000-0000-000000000015",
    "goal_id": "20000000-0000-0000-0000-000000000044",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000045",
    "review_id": "30000000-0000-0000-0000-000000000015",
    "goal_id": "20000000-0000-0000-0000-000000000045",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000046",
    "review_id": "30000000-0000-0000-0000-000000000016",
    "goal_id": "20000000-0000-0000-0000-000000000046",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000047",
    "review_id": "30000000-0000-0000-0000-000000000016",
    "goal_id": "20000000-0000-0000-0000-000000000047",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000048",
    "review_id": "30000000-0000-0000-0000-000000000016",
    "goal_id": "20000000-0000-0000-0000-000000000048",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000049",
    "review_id": "30000000-0000-0000-0000-000000000017",
    "goal_id": "20000000-0000-0000-0000-000000000049",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000050",
    "review_id": "30000000-0000-0000-0000-000000000017",
    "goal_id": "20000000-0000-0000-0000-000000000050",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000051",
    "review_id": "30000000-0000-0000-0000-000000000017",
    "goal_id": "20000000-0000-0000-0000-000000000051",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000052",
    "review_id": "30000000-0000-0000-0000-000000000018",
    "goal_id": "20000000-0000-0000-0000-000000000052",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000053",
    "review_id": "30000000-0000-0000-0000-000000000018",
    "goal_id": "20000000-0000-0000-0000-000000000053",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000054",
    "review_id": "30000000-0000-0000-0000-000000000018",
    "goal_id": "20000000-0000-0000-0000-000000000054",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000055",
    "review_id": "30000000-0000-0000-0000-000000000019",
    "goal_id": "20000000-0000-0000-0000-000000000055",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000056",
    "review_id": "30000000-0000-0000-0000-000000000019",
    "goal_id": "20000000-0000-0000-0000-000000000056",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000057",
    "review_id": "30000000-0000-0000-0000-000000000019",
    "goal_id": "20000000-0000-0000-0000-000000000057",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000058",
    "review_id": "30000000-0000-0000-0000-000000000020",
    "goal_id": "20000000-0000-0000-0000-000000000058",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.3
  },
  {
    "id": "40000000-0000-0000-0000-000000000059",
    "review_id": "30000000-0000-0000-0000-000000000020",
    "goal_id": "20000000-0000-0000-0000-000000000059",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.3
  },
  {
    "id": "40000000-0000-0000-0000-000000000060",
    "review_id": "30000000-0000-0000-0000-000000000020",
    "goal_id": "20000000-0000-0000-0000-000000000060",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.5,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.3
  },
  {
    "id": "40000000-0000-0000-0000-000000000061",
    "review_id": "30000000-0000-0000-0000-000000000021",
    "goal_id": "20000000-0000-0000-0000-000000000061",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000062",
    "review_id": "30000000-0000-0000-0000-000000000021",
    "goal_id": "20000000-0000-0000-0000-000000000062",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000063",
    "review_id": "30000000-0000-0000-0000-000000000021",
    "goal_id": "20000000-0000-0000-0000-000000000063",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000064",
    "review_id": "30000000-0000-0000-0000-000000000022",
    "goal_id": "20000000-0000-0000-0000-000000000064",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8000000000000003,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.6
  },
  {
    "id": "40000000-0000-0000-0000-000000000065",
    "review_id": "30000000-0000-0000-0000-000000000022",
    "goal_id": "20000000-0000-0000-0000-000000000065",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8000000000000003,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.6
  },
  {
    "id": "40000000-0000-0000-0000-000000000066",
    "review_id": "30000000-0000-0000-0000-000000000022",
    "goal_id": "20000000-0000-0000-0000-000000000066",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8000000000000003,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.6
  },
  {
    "id": "40000000-0000-0000-0000-000000000067",
    "review_id": "30000000-0000-0000-0000-000000000023",
    "goal_id": "20000000-0000-0000-0000-000000000067",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000068",
    "review_id": "30000000-0000-0000-0000-000000000023",
    "goal_id": "20000000-0000-0000-0000-000000000068",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000069",
    "review_id": "30000000-0000-0000-0000-000000000023",
    "goal_id": "20000000-0000-0000-0000-000000000069",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.4000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.2
  },
  {
    "id": "40000000-0000-0000-0000-000000000070",
    "review_id": "30000000-0000-0000-0000-000000000024",
    "goal_id": "20000000-0000-0000-0000-000000000070",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.1,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.9
  },
  {
    "id": "40000000-0000-0000-0000-000000000071",
    "review_id": "30000000-0000-0000-0000-000000000024",
    "goal_id": "20000000-0000-0000-0000-000000000071",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.1,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.9
  },
  {
    "id": "40000000-0000-0000-0000-000000000072",
    "review_id": "30000000-0000-0000-0000-000000000024",
    "goal_id": "20000000-0000-0000-0000-000000000072",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.1,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.9
  },
  {
    "id": "40000000-0000-0000-0000-000000000073",
    "review_id": "30000000-0000-0000-0000-000000000025",
    "goal_id": "20000000-0000-0000-0000-000000000073",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000074",
    "review_id": "30000000-0000-0000-0000-000000000025",
    "goal_id": "20000000-0000-0000-0000-000000000074",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000075",
    "review_id": "30000000-0000-0000-0000-000000000025",
    "goal_id": "20000000-0000-0000-0000-000000000075",
    "self_comment": null,
    "self_rating": null,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000076",
    "review_id": "30000000-0000-0000-0000-000000000026",
    "goal_id": "20000000-0000-0000-0000-000000000076",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000077",
    "review_id": "30000000-0000-0000-0000-000000000026",
    "goal_id": "20000000-0000-0000-0000-000000000077",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000078",
    "review_id": "30000000-0000-0000-0000-000000000026",
    "goal_id": "20000000-0000-0000-0000-000000000078",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000079",
    "review_id": "30000000-0000-0000-0000-000000000027",
    "goal_id": "20000000-0000-0000-0000-000000000079",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.8
  },
  {
    "id": "40000000-0000-0000-0000-000000000080",
    "review_id": "30000000-0000-0000-0000-000000000027",
    "goal_id": "20000000-0000-0000-0000-000000000080",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.8
  },
  {
    "id": "40000000-0000-0000-0000-000000000081",
    "review_id": "30000000-0000-0000-0000-000000000027",
    "goal_id": "20000000-0000-0000-0000-000000000081",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.8
  },
  {
    "id": "40000000-0000-0000-0000-000000000082",
    "review_id": "30000000-0000-0000-0000-000000000028",
    "goal_id": "20000000-0000-0000-0000-000000000082",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000083",
    "review_id": "30000000-0000-0000-0000-000000000028",
    "goal_id": "20000000-0000-0000-0000-000000000083",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000084",
    "review_id": "30000000-0000-0000-0000-000000000028",
    "goal_id": "20000000-0000-0000-0000-000000000084",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.6,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.4
  },
  {
    "id": "40000000-0000-0000-0000-000000000085",
    "review_id": "30000000-0000-0000-0000-000000000029",
    "goal_id": "20000000-0000-0000-0000-000000000085",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000086",
    "review_id": "30000000-0000-0000-0000-000000000029",
    "goal_id": "20000000-0000-0000-0000-000000000086",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000087",
    "review_id": "30000000-0000-0000-0000-000000000029",
    "goal_id": "20000000-0000-0000-0000-000000000087",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 4.3,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 4.1
  },
  {
    "id": "40000000-0000-0000-0000-000000000088",
    "review_id": "30000000-0000-0000-0000-000000000030",
    "goal_id": "20000000-0000-0000-0000-000000000088",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.9000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.7
  },
  {
    "id": "40000000-0000-0000-0000-000000000089",
    "review_id": "30000000-0000-0000-0000-000000000030",
    "goal_id": "20000000-0000-0000-0000-000000000089",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.9000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.7
  },
  {
    "id": "40000000-0000-0000-0000-000000000090",
    "review_id": "30000000-0000-0000-0000-000000000030",
    "goal_id": "20000000-0000-0000-0000-000000000090",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.9000000000000004,
    "manager_comment": "Meets high performance standards on this objective.",
    "manager_rating": 3.7
  },
  {
    "id": "40000000-0000-0000-0000-000000000091",
    "review_id": "30000000-0000-0000-0000-000000000031",
    "goal_id": "20000000-0000-0000-0000-000000000091",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000092",
    "review_id": "30000000-0000-0000-0000-000000000031",
    "goal_id": "20000000-0000-0000-0000-000000000092",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  },
  {
    "id": "40000000-0000-0000-0000-000000000093",
    "review_id": "30000000-0000-0000-0000-000000000031",
    "goal_id": "20000000-0000-0000-0000-000000000093",
    "self_comment": "Achieved target deliverables on schedule with high quality and adherence to core criteria.",
    "self_rating": 3.8,
    "manager_comment": null,
    "manager_rating": null
  }
];


// Initial Demo Notifications Seed Data
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-001",
    recipient_id: "00000000-0000-0000-0000-000000000001", // Praveen (HR / Mgr)
    recipient_email: "admin@company.com",
    title: "Review Cycle Active",
    message: "FY 2026-27 Annual Review cycle is currently open for submissions.",
    type: "cycle_complete",
    link_url: "/admin/cycles",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "notif-002",
    recipient_id: "00000000-0000-0000-0000-000000000006", // Yash (VP Tech)
    recipient_email: "yash@company.com",
    title: "Direct Reports Goal Setting Open",
    message: "You can assign goals to your direct reports or review their submissions.",
    type: "goal_approval_request",
    link_url: "/team/goals",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-003",
    recipient_id: "00000000-0000-0000-0000-000000000007", // Ananya (Employee)
    recipient_email: "ananya@company.com",
    title: "Goal Setting Initialized",
    message: "Please set your performance goals (≥85% weightage) for manager approval.",
    type: "goal_set",
    link_url: "/goals",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "notif-004",
    recipient_id: "00000000-0000-0000-0000-000000000010", // Rohan (Employee)
    recipient_email: "rohan@company.com",
    title: "Goal Setting Initialized",
    message: "Please define your SMART goals and submit to your reporting manager.",
    type: "goal_set",
    link_url: "/goals",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

class InMemoryDataStore {
  private employees: Employee[] = [];
  private cycles: ReviewCycle[] = [];
  private goals: Goal[] = [];
  private reviews: Review[] = [];
  private goalRatings: GoalRating[] = [];
  private notifications: AppNotification[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== "undefined") {
      const storedEmp = localStorage.getItem("pms_employees_v2");
      const storedCycles = localStorage.getItem("pms_cycles_v2");
      const storedGoals = localStorage.getItem("pms_goals_v2");
      const storedReviews = localStorage.getItem("pms_reviews_v2");
      const storedGR = localStorage.getItem("pms_goal_ratings_v2");
      const storedNotifs = localStorage.getItem("pms_notifications_v2");

      this.employees = storedEmp ? JSON.parse(storedEmp) : [...INITIAL_EMPLOYEES];
      this.cycles = storedCycles ? JSON.parse(storedCycles) : [...INITIAL_CYCLES];
      this.goals = storedGoals ? JSON.parse(storedGoals) : [...INITIAL_GOALS];
      this.reviews = storedReviews ? JSON.parse(storedReviews) : [...INITIAL_REVIEWS];
      this.goalRatings = storedGR ? JSON.parse(storedGR) : [...INITIAL_GOAL_RATINGS];
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [...INITIAL_NOTIFICATIONS];
    } else {
      this.employees = [...INITIAL_EMPLOYEES];
      this.cycles = [...INITIAL_CYCLES];
      this.goals = [...INITIAL_GOALS];
      this.reviews = [...INITIAL_REVIEWS];
      this.goalRatings = [...INITIAL_GOAL_RATINGS];
      this.notifications = [...INITIAL_NOTIFICATIONS];
    }
  }

  resetDataStore() {
    this.employees = [...INITIAL_EMPLOYEES];
    this.cycles = [...INITIAL_CYCLES];
    this.goals = [...INITIAL_GOALS];
    this.reviews = [...INITIAL_REVIEWS];
    this.goalRatings = [...INITIAL_GOAL_RATINGS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.persist();
  }

  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem("pms_employees_v2", JSON.stringify(this.employees));
      localStorage.setItem("pms_cycles_v2", JSON.stringify(this.cycles));
      localStorage.setItem("pms_goals_v2", JSON.stringify(this.goals));
      localStorage.setItem("pms_reviews_v2", JSON.stringify(this.reviews));
      localStorage.setItem("pms_goal_ratings_v2", JSON.stringify(this.goalRatings));
      localStorage.setItem("pms_notifications_v2", JSON.stringify(this.notifications));
    }
  }

  // ---------------- EMPLOYEES ----------------
  async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .order("full_name");
        if (!error && data && data.length > 0) {
          return data.map((e: any) => ({
            ...e,
            manager_name: e.manager?.full_name || null,
          }));
        }
      } catch (e) {}
    }
    return this.employees;
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .eq("id", id)
          .single();
        if (!error && data) {
          return {
            ...data,
            manager_name: data.manager?.full_name || null,
          };
        }
      } catch (e) {}
    }
    return this.employees.find((e) => e.id === id) || null;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, manager:manager_id(full_name)")
          .ilike("email", email)
          .single();
        if (!error && data) {
          return {
            ...data,
            manager_name: data.manager?.full_name || null,
          };
        }
      } catch (e) {}
    }
    return this.employees.find((e) => e.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async linkClerkUser(email: string, clerkUserId: string): Promise<void> {
    const emp = this.employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
    if (emp) {
      emp.clerk_user_id = clerkUserId;
      this.persist();
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("employees")
          .update({ clerk_user_id: clerkUserId })
          .ilike("email", email);
      } catch (e) {}
    }
  }

  // ---------------- CYCLES ----------------
  async getCycles(): Promise<ReviewCycle[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("review_cycles")
          .select("*")
          .order("start_date", { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return this.cycles;
  }

  async getActiveCycle(): Promise<ReviewCycle | null> {
    const cycles = await this.getCycles();
    return cycles.find((c) => c.status === "open") || cycles[0] || null;
  }

  async createCycle(cycle: Omit<ReviewCycle, "id">): Promise<ReviewCycle> {
    const newCycle: ReviewCycle = {
      ...cycle,
      id: `10000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
    };
    this.cycles.unshift(newCycle);
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("review_cycles").insert([newCycle]);
      } catch (e) {}
    }
    return newCycle;
  }

  async updateCycleStatus(id: string, status: ReviewCycle["status"]): Promise<ReviewCycle | null> {
    const c = this.cycles.find((item) => item.id === id);
    if (c) {
      c.status = status;
      this.persist();
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("review_cycles")
          .update({ status })
          .eq("id", id);
      } catch (e) {}
    }
    return c || null;
  }

  // ---------------- GOALS ----------------
  async getGoals(employeeId: string, cycleId?: string): Promise<Goal[]> {
    if (isSupabaseConfigured()) {
      try {
        let q = supabase
          .from("goals")
          .select("*")
          .eq("employee_id", employeeId);
        if (cycleId) q = q.eq("cycle_id", cycleId);
        const { data, error } = await q.order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return this.goals.filter(
      (g) =>
        g.employee_id === employeeId && (!cycleId || g.cycle_id === cycleId)
    );
  }

  async createGoal(goal: Omit<Goal, "id">): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: `20000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
    };
    this.goals.push(newGoal);
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").insert([newGoal]);
      } catch (e) {}
    }
    return newGoal;
  }

  async updateGoal(
    id: string,
    updates: Partial<Omit<Goal, "id" | "employee_id" | "cycle_id">>
  ): Promise<Goal | null> {
    const g = this.goals.find((item) => item.id === id);
    if (g) {
      if (updates.title !== undefined) g.title = updates.title;
      if (updates.description !== undefined) g.description = updates.description;
      if (updates.weightage !== undefined) g.weightage = Number(updates.weightage);
      if (updates.target_date !== undefined) g.target_date = updates.target_date;
      if (updates.status !== undefined) g.status = updates.status;
      if (updates.manager_comment !== undefined) g.manager_comment = updates.manager_comment;
      if (updates.employee_comment !== undefined) g.employee_comment = updates.employee_comment;
      this.persist();
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update(updates)
          .eq("id", id);
      } catch (e) {}
    }
    return g || null;
  }

  async saveEmployeeGoalComment(goalId: string, comment: string): Promise<Goal | null> {
    const g = this.goals.find((item) => item.id === goalId);
    if (g) {
      g.employee_comment = comment;
      this.persist();

      const employee = this.employees.find((e) => e.id === g.employee_id);
      const manager = employee?.manager_id ? this.employees.find((e) => e.id === employee.manager_id) : null;

      if (manager) {
        await this.createNotification({
          recipient_id: manager.id,
          recipient_email: manager.email,
          title: "💬 Subordinate Feedback on Goal",
          message: `${employee?.full_name || "Employee"} shared feedback on "${g.title}": "${comment}"`,
          type: "goal_set",
          link_url: "/team/goals",
        });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from("goals")
            .update({ employee_comment: comment })
            .eq("id", goalId);
        } catch (e) {}
      }
    }
    return g || null;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const idx = this.goals.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this.goals.splice(idx, 1);
      this.persist();
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").delete().eq("id", id);
      } catch (e) {}
    }
    return true;
  }

  async updateGoalStatus(
    id: string,
    status: Goal["status"],
    managerComment?: string
  ): Promise<Goal | null> {
    const g = this.goals.find((item) => item.id === id);
    if (g) {
      g.status = status;
      if (managerComment !== undefined) g.manager_comment = managerComment;
      this.persist();
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update({
            status,
            manager_comment: managerComment,
          })
          .eq("id", id);
      } catch (e) {}
    }
    return g || null;
  }

  
  async approveGoal(id: string, comment?: string): Promise<Goal | null> {
    const g = this.goals.find((item) => item.id === id);
    if (!g) return null;

    g.status = "approved";
    g.manager_comment = comment || "Approved by reporting manager.";
    this.persist();

    const employee = this.employees.find((e) => e.id === g.employee_id);
    const manager = employee?.manager_id ? this.employees.find((e) => e.id === employee.manager_id) : null;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update({
            status: "approved",
            manager_comment: g.manager_comment,
          })
          .eq("id", id);
      } catch (e) {}
    }

    // 1. Notify Subordinate (Employee)
    await this.createNotification({
      recipient_id: g.employee_id,
      recipient_email: employee?.email,
      title: "✅ Goal Approved by Manager",
      message: `${manager?.full_name || "Your manager"} approved your goal "${g.title}". Deliverables are locked.`,
      type: "goal_approved",
      link_url: "/goals",
    });

    // 2. Notify Manager
    if (manager) {
      await this.createNotification({
        recipient_id: manager.id,
        recipient_email: manager.email,
        title: "👍 Goal Approval Recorded",
        message: `You approved goal "${g.title}" for ${employee?.full_name || "subordinate"}.`,
        type: "goal_approved",
        link_url: "/team/goals",
      });
    }

    return g;
  }

  async sendBackGoal(id: string, comment?: string): Promise<Goal | null> {
    const g = this.goals.find((item) => item.id === id);
    if (!g) return null;

    g.status = "sent_back";
    g.manager_comment = comment || "Sent back for revision.";
    this.persist();

    const employee = this.employees.find((e) => e.id === g.employee_id);
    const manager = employee?.manager_id ? this.employees.find((e) => e.id === employee.manager_id) : null;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update({
            status: "sent_back",
            manager_comment: g.manager_comment,
          })
          .eq("id", id);
      } catch (e) {}
    }

    // 1. Notify Subordinate (Employee)
    await this.createNotification({
      recipient_id: g.employee_id,
      recipient_email: employee?.email,
      title: "⚠️ Goal Revision Requested",
      message: `${manager?.full_name || "Your manager"} requested revisions on "${g.title}": "${comment}"`,
      type: "goal_sent_back",
      link_url: "/goals",
    });

    return g;
  }


  // ---------------- REVIEWS ----------------
  async getOrCreateReview(
    employeeId: string,
    cycleId: string,
    managerId?: string | null
  ): Promise<Review> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("cycle_id", cycleId)
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }

    let rev = this.reviews.find(
      (r) => r.employee_id === employeeId && r.cycle_id === cycleId
    );
    if (!rev) {
      rev = {
        id: `30000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
        employee_id: employeeId,
        manager_id: managerId || null,
        cycle_id: cycleId,
        status: "not_started",
        overall_self_rating: null,
        overall_manager_rating: null,
        manager_summary: null,
      };
      this.reviews.push(rev);
      this.persist();
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("reviews").insert([rev]);
        } catch (e) {}
      }
    }
    return rev;
  }

  async getReviewById(id: string): Promise<Review | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return this.reviews.find((r) => r.id === id) || null;
  }

  async getGoalRatings(reviewId: string): Promise<GoalRating[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("goal_ratings")
          .select("*")
          .eq("review_id", reviewId);
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return this.goalRatings.filter((gr) => gr.review_id === reviewId);
  }

  async saveSelfAppraisal(
    reviewId: string,
    overallRating: number,
    ratings: Array<{
      goal_id: string;
      self_rating: number;
      self_comment: string;
    }>
  ): Promise<void> {
    const rev = this.reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.overall_self_rating = overallRating;
      rev.status = "self_appraisal_submitted";
      rev.submitted_at = new Date().toISOString();
      this.persist();
    }

    for (const r of ratings) {
      let gr = this.goalRatings.find(
        (item) => item.review_id === reviewId && item.goal_id === r.goal_id
      );
      if (gr) {
        gr.self_rating = r.self_rating;
        gr.self_comment = r.self_comment;
      } else {
        gr = {
          id: `40000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
          review_id: reviewId,
          goal_id: r.goal_id,
          self_rating: r.self_rating,
          self_comment: r.self_comment,
          manager_rating: null,
          manager_comment: null,
        };
        this.goalRatings.push(gr);
      }
    }
    this.persist();

    // 1. Dual Notification Dispatch on Self-Appraisal Submission
    if (rev) {
      const employee = this.employees.find((e) => e.id === rev.employee_id);
      const manager = rev.manager_id
        ? this.employees.find((e) => e.id === rev.manager_id)
        : employee?.manager_id
        ? this.employees.find((e) => e.id === employee.manager_id)
        : null;

      // Notify Reporting Manager: "Action Required: Now you should give the ratings"
      if (manager) {
        await this.createNotification({
          recipient_id: manager.id,
          recipient_email: manager.email,
          title: "📋 Self-Appraisal Submitted: Give Ratings",
          message: `${employee?.full_name || "Your direct report"} has submitted their self-appraisal rating (${overallRating.toFixed(1)}★). Now you should review and provide your manager evaluations and ratings.`,
          type: "self_appraisal",
          link_url: `/team/reviews/${rev.employee_id}`,
        });
      }

      // Notify Subordinate (Employee)
      if (employee) {
        await this.createNotification({
          recipient_id: employee.id,
          recipient_email: employee.email,
          title: "✅ Self-Appraisal Submitted Successfully",
          message: `Your self-appraisal rating of ${overallRating.toFixed(1)}★ has been submitted. Your reporting manager ${manager?.full_name || ""} has been notified to evaluate and provide ratings.`,
          type: "self_appraisal",
          link_url: "/employee/dashboard",
        });
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("reviews")
          .update({
            overall_self_rating: overallRating,
            status: "self_appraisal_submitted",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", reviewId);

        for (const r of ratings) {
          await supabase.from("goal_ratings").upsert(
            {
              review_id: reviewId,
              goal_id: r.goal_id,
              self_rating: r.self_rating,
              self_comment: r.self_comment,
            },
            { onConflict: "review_id,goal_id" }
          );
        }
      } catch (e) {}
    }
  }

  async saveManagerReview(
    reviewId: string,
    overallRating: number,
    managerSummary: string,
    ratings: Array<{
      goal_id: string;
      manager_rating: number;
      manager_comment: string;
    }>
  ): Promise<void> {
    const rev = this.reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.overall_manager_rating = overallRating;
      rev.manager_summary = managerSummary;
      rev.status = "manager_reviewed";
      rev.reviewed_at = new Date().toISOString();
      this.persist();
    }

    for (const r of ratings) {
      let gr = this.goalRatings.find(
        (item) => item.review_id === reviewId && item.goal_id === r.goal_id
      );
      if (gr) {
        gr.manager_rating = r.manager_rating;
        gr.manager_comment = r.manager_comment;
      } else {
        gr = {
          id: `40000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
          review_id: reviewId,
          goal_id: r.goal_id,
          self_rating: null,
          self_comment: null,
          manager_rating: r.manager_rating,
          manager_comment: r.manager_comment,
        };
        this.goalRatings.push(gr);
      }
    }
    this.persist();

    // Notify Employee that Manager completed their rating
    if (rev) {
      const employee = this.employees.find((e) => e.id === rev.employee_id);
      const manager = rev.manager_id ? this.employees.find((e) => e.id === rev.manager_id) : null;

      if (employee) {
        await this.createNotification({
          recipient_id: employee.id,
          recipient_email: employee.email,
          title: "⭐ Manager Ratings & Evaluation Completed",
          message: `${manager?.full_name || "Your manager"} completed your performance evaluation with a rating of ${overallRating.toFixed(1)}★.`,
          type: "manager_review",
          link_url: "/reviews/self",
        });
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("reviews")
          .update({
            overall_manager_rating: overallRating,
            manager_summary: managerSummary,
            status: "manager_reviewed",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", reviewId);

        for (const r of ratings) {
          await supabase.from("goal_ratings").upsert(
            {
              review_id: reviewId,
              goal_id: r.goal_id,
              manager_rating: r.manager_rating,
              manager_comment: r.manager_comment,
            },
            { onConflict: "review_id,goal_id" }
          );
        }
      } catch (e) {}
    }
  }

  async submitSelfAppraisal(
    reviewId: string,
    ratings: Array<{
      goal_id: string;
      self_rating: number;
      self_comment: string;
    }>,
    overallRating?: number
  ): Promise<void> {
    const calcOverall =
      overallRating !== undefined
        ? overallRating
        : ratings.reduce((acc, r) => acc + (r.self_rating || 0), 0) /
          Math.max(1, ratings.length);
    return this.saveSelfAppraisal(reviewId, calcOverall, ratings);
  }

  async submitManagerReview(
    reviewId: string,
    ratings: Array<{
      goal_id: string;
      manager_rating: number;
      manager_comment: string;
    }>,
    overallRating?: number,
    managerSummary?: string
  ): Promise<void> {
    const calcOverall =
      overallRating !== undefined
        ? overallRating
        : ratings.reduce((acc, r) => acc + (r.manager_rating || 0), 0) /
          Math.max(1, ratings.length);
    return this.saveManagerReview(
      reviewId,
      calcOverall,
      managerSummary || "Manager review completed.",
      ratings
    );
  }

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
  }


  // ---------------- NOTIFICATIONS ----------------
  async getNotifications(employeeId: string): Promise<AppNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("appraisal_activity_logs")
          .select("*")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            recipient_id: d.employee_id,
            title: d.title,
            message: d.description || "",
            type: d.action_type || "goal_set",
            link_url: "/dashboard",
            is_read: false,
            created_at: d.created_at,
          }));
        }
      } catch (e) {}
    }
    return this.notifications
      .filter((n) => n.recipient_id === employeeId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createNotification(
    notif: Omit<AppNotification, "id" | "created_at" | "is_read">
  ): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("appraisal_activity_logs").insert([
          {
            employee_id: notif.recipient_id,
            action_type: notif.type,
            title: notif.title,
            description: notif.message,
            actor_name: "PMS System",
            actor_role: "Notification",
          },
        ]);
      } catch (e) {}
    }
    return newNotif;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.is_read = true;
      this.persist();
    }
  }

  async markAllNotificationsAsRead(employeeId: string): Promise<void> {
    this.notifications.forEach((n) => {
      if (n.recipient_id === employeeId) {
        n.is_read = true;
      }
    });
    this.persist();
  }

  // ---------------- SUBORDINATE GOALS & APPROVAL WORKFLOW ----------------
  async createGoalForSubordinate(
    managerId: string,
    subordinateId: string,
    goalData: Omit<Goal, "id" | "employee_id" | "status">
  ): Promise<Goal> {
    const subordinate = this.employees.find((e) => e.id === subordinateId);
    const manager = this.employees.find((e) => e.id === managerId);

    const newGoal: Goal = {
      ...goalData,
      id: `20000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      employee_id: subordinateId,
      status: "approved", // Directly approved since configured by reporting manager
      manager_comment: `Assigned and approved by reporting manager ${manager?.full_name || ""}.`,
    };

    this.goals.push(newGoal);
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("goals").insert([newGoal]);
      } catch (e) {}
    }

    // 1. Notify Subordinate (Employee)
    await this.createNotification({
      recipient_id: subordinateId,
      recipient_email: subordinate?.email,
      title: "🎯 New Goal Assigned by Manager",
      message: `${manager?.full_name || "Your manager"} assigned a goal: "${newGoal.title}" (${newGoal.weightage}% weightage).`,
      type: "goal_set",
      link_url: "/goals",
    });

    // 2. Notify Manager (Confirmation)
    await this.createNotification({
      recipient_id: managerId,
      recipient_email: manager?.email,
      title: "✅ Goal Configured for Direct Report",
      message: `You configured and approved goal "${newGoal.title}" for ${subordinate?.full_name || "subordinate"}.`,
      type: "goal_set",
      link_url: "/team/goals",
    });

    return newGoal;
  }

  async submitGoalsForApproval(employeeId: string, cycleId: string): Promise<Goal[]> {
    const employee = this.employees.find((e) => e.id === employeeId);
    const managerId = employee?.manager_id;
    const manager = managerId ? this.employees.find((e) => e.id === managerId) : null;

    const empGoals = this.goals.filter(
      (g) => g.employee_id === employeeId && (!cycleId || g.cycle_id === cycleId)
    );

    empGoals.forEach((g) => {
      if (g.status === "draft" || g.status === "sent_back") {
        g.status = "submitted";
      }
    });

    this.persist();

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("goals")
          .update({ status: "submitted" })
          .eq("employee_id", employeeId)
          .eq("cycle_id", cycleId);
      } catch (e) {}
    }

    const totalWeight = empGoals.reduce((sum, g) => sum + Number(g.weightage), 0);

    // 1. Notify Manager of Goal Submission
    if (managerId) {
      await this.createNotification({
        recipient_id: managerId,
        recipient_email: manager?.email,
        title: "📋 Goals Awaiting Your Approval",
        message: `${employee?.full_name || "An employee"} submitted ${empGoals.length} goals (${totalWeight}% weightage) for your review.`,
        type: "goal_approval_request",
        link_url: "/team/goals",
      });
    }

    // 2. Notify Employee of Successful Submission
    await this.createNotification({
      recipient_id: employeeId,
      recipient_email: employee?.email,
      title: "🚀 Goals Submitted to Manager",
      message: `Your ${empGoals.length} performance goals have been submitted to ${manager?.full_name || "your reporting manager"} for approval.`,
      type: "goal_approval_request",
      link_url: "/employee/dashboard",
    });

    return empGoals;
  }

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
  }
}

export const dataStore = new InMemoryDataStore();

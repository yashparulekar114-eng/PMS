// Shared PMS FAQ. Single source for the dashboard FAQ and the Ask PMS assistant.

export interface FaqItem {
  id: string;
  category: "Workflow & Goals" | "Ratings & Calibration" | "Manager & HR Admin";
  question: string;
  answer: string;
  highlight?: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    category: "Workflow & Goals",
    question: "What are the 5 sequential stages in the PMS Appraisal Workflow?",
    answer:
      "The appraisal lifecycle progresses through 5 transparent stages: (1) SMART Goal Definition & Weightage Allocation, (2) Manager Goal Review & Approval, (3) Employee Self-Appraisal Submission with Star Ratings, (4) Manager Evaluation & 1-on-1 Calibration, and (5) Cycle Completion with Official Signed PDF Report generation.",
    highlight: "100% transparent audit trail from goal creation to PDF certification.",
  },
  {
    id: "faq-2",
    category: "Workflow & Goals",
    question: "What is the 85% Minimum Goal Weightage rule?",
    answer:
      "To ensure comprehensive performance evaluations without over-committing staff, the system requires each employee to allocate a total goal weightage of at least 85% (up to a strict 100% capacity). The system prevents self-appraisal submissions if total weightage is below 85%.",
    highlight: "Weightage threshold: Minimum 85%, Maximum 100%.",
  },
  {
    id: "faq-3",
    category: "Ratings & Calibration",
    question: "How are Self and Manager Overall Ratings calculated?",
    answer:
      "Both Self and Manager scores are evaluated on a 1.0 to 5.0 scale for each individual goal. The overall score is automatically computed as the weighted average across all approved goals (Rating × Weightage ÷ Total Weightage). Managers also provide a qualitative calibration summary.",
    highlight: "Scale: 1.0 (Needs Improvement) to 5.0 (Outstanding).",
  },
  {
    id: "faq-4",
    category: "Ratings & Calibration",
    question: "How does the Forced Distribution (Bell Curve) Normalization work?",
    answer:
      "The system benchmarks employee scores against a Gaussian distribution across 5 buckets: Needs Improvement (10%), Meets Expectations (20%), Good (40%), Very Good (20%), and Outstanding (10%). The HR Analytics hub flags grade inflation if top tiers exceed 45% or the average exceeds 4.1.",
    highlight: "Target distribution: 10% - 20% - 40% - 20% - 10%.",
  },
  {
    id: "faq-5",
    category: "Manager & HR Admin",
    question: "How do People Managers review direct reports' goals and submissions?",
    answer:
      "Managers can navigate to the 'Team' tab to see direct reports assigned to their hierarchy. They can approve or request revisions on goals in the Goal Approval Workspace, and submit official ratings with qualitative feedback on the Review screen.",
    highlight: "Instant 1-click approvals and transparent feedback logs.",
  },
  {
    id: "faq-6",
    category: "Manager & HR Admin",
    question: "Where can HR Admins view the interactive Organization Structure?",
    answer:
      "The Organization Structure is integrated seamlessly inside the 'Employees' tab (/admin/employees). HR Admins can switch between the Compact 2-scroll Org Tree View (with zoom controls) and the Employee Directory Table with a single click.",
    highlight: "Located in Employees tab with max 2 scrolls.",
  },
  {
    id: "faq-7",
    category: "Workflow & Goals",
    question: "How do I view and print my official appraisal certificate?",
    answer:
      "Once the appraisal reaches the 'Completed' stage, both employees and managers can access the official PDF Summary Report via the 'PDF Certificate' button or navigating to /reports/[employeeId]. The certificate is styled for high-resolution clean printing.",
    highlight: "Includes verified QR badge, digital signature line, and goal breakdown.",
  },
];

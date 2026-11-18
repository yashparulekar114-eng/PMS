import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * SERVER-SIDE RESEND EMAIL DISPATCH ROUTE
 * 
 * ARCHITECTURAL REQUIREMENTS:
 * 1. Security: Resend API calls MUST occur strictly on the server-side to prevent exposing
 *    the secret RESEND_API_KEY in client bundles or network inspectors.
 * 2. Fault-Tolerance / Non-Blocking: Email delivery must NEVER block or roll back database saves.
 *    All operations are wrapped in robust try-catch blocks and return safe 200 JSON statuses
 *    even when Resend is unconfigured, rate-limited, or encounters network errors.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));

/**
 * DEADLINE REMINDERS (sent by the daily cron job only)
 * Requires the shared CRON_SECRET as a bearer token, so this open route cannot be used to send arbitrary mail.
 * Subject and body come from the cron planner and are HTML-escaped before they are placed in the template.
 */
async function handleDeadlineReminder(req: NextRequest, body: Record<string, unknown>) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim() : "";
  const recipientName = typeof body.recipientName === "string" ? body.recipientName.slice(0, 120) : "";
  const subject = typeof body.subject === "string" ? body.subject.slice(0, 200) : "Performance cycle reminder";
  const bodyText = typeof body.bodyText === "string" ? body.bodyText.slice(0, 4000) : "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const reviewUrl =
    typeof body.reviewUrl === "string" && /^https?:\/\//.test(body.reviewUrl) ? body.reviewUrl : `${appUrl}/dashboard`;

  if (!EMAIL_PATTERN.test(recipientEmail) || !bodyText) {
    return NextResponse.json({ success: false, error: "Recipient and body are required." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
  if (!apiKey || apiKey === "re_your_resend_api_key" || apiKey === "re_123456789") {
    console.log(`[PMS Non-Blocking Email Simulation]
  Event Type: deadline_reminder
  Recipient: ${recipientEmail}
  Subject: ${subject}
  Status: Simulated successfully (Add valid RESEND_API_KEY in .env.local for live delivery).`);
    return NextResponse.json({ success: true, emailSent: false, simulated: true });
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: `PMS Performance System <${fromAddress}>`,
    to: [recipientEmail],
    subject,
    text: bodyText,
    html: `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1e293b;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        <p style="font-size:12px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;">Deadline Reminder</p>
        <p style="font-size:14px;margin:0 0 16px;">Hello ${escapeHtml(recipientName || "there")},</p>
        <pre style="font-family:inherit;font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(bodyText)}</pre>
        <div style="text-align:center;margin-top:24px;">
          <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:14px 28px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Open the PMS</a>
        </div>
        <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:28px;">Automated reminder from the Performance Management System. Replies are not monitored.</p>
      </div></body></html>`,
  });

  if (error) {
    console.warn("[Resend Warning] Deadline reminder not delivered:", error);
    return NextResponse.json({ success: false, emailSent: false }, { status: 502 });
  }
  return NextResponse.json({ success: true, emailSent: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.type === "deadline_reminder") {
      return handleDeadlineReminder(req, body);
    }
    const {
      type = "self_appraisal",
      employeeName,
      employeeEmail,
      managerName,
      managerEmail,
      cycleName = "Annual Review Cycle",
      selfRating,
      managerRating,
      managerSummary,
      reviewUrl,
    } = body;

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 1. Check if Resend API Key is configured
    if (!apiKey || apiKey === "re_your_resend_api_key" || apiKey === "re_123456789") {
      console.log(`[PMS Non-Blocking Email Simulation]
  Event Type: ${type}
  Recipient: ${managerEmail || "hr-admin@company.com"}
  Subject: ${type === "manager_evaluation_done" ? `HR Final Sign-off for ${employeeName}` : `Self-Appraisal Submitted by ${employeeName}`}
  Review Link: ${reviewUrl || `${appUrl}/team`}
  Status: Simulated successfully (Add valid RESEND_API_KEY in .env.local for live delivery).`);

      return NextResponse.json({
        success: true,
        emailSent: false,
        simulated: true,
        message: "Email dispatch simulated (RESEND_API_KEY not configured in environment).",
      });
    }

    const resend = new Resend(apiKey);

    // 2. Build email template according to event type
    if (type === "manager_evaluation_done") {
      // Manager completed evaluation -> Email HR Admin and Employee
      const targetEmail = managerEmail || "admin@company.com";
      const directReviewUrl = reviewUrl || `${appUrl}/admin/reports`;

      const { data, error } = await resend.emails.send({
        from: `PMS Performance System <${fromAddress}>`,
        to: [targetEmail],
        subject: `Action Required: Manager Evaluation Completed for ${employeeName} (${cycleName})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Manager Evaluation Completed</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .header { border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 24px; }
              .badge { display: inline-block; padding: 4px 12px; background: #f3e8ff; color: #6b21a8; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
              h1 { color: #0f172a; font-size: 22px; margin-top: 12px; margin-bottom: 4px; font-weight: 800; }
              .sub { font-size: 13px; color: #64748b; margin-top: 0; }
              .content { font-size: 14px; line-height: 1.6; color: #334155; }
              .rating-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
              .rating-grid { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; }
              .cta-btn { display: inline-block; padding: 14px 28px; background: #7c3aed; color: #ffffff !important; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
              .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="badge">HR Action Required</span>
                <h1>Manager Evaluation Completed</h1>
                <p class="sub">Evaluation Cycle: <strong>${cycleName}</strong></p>
              </div>

              <div class="content">
                <p>Hello HR Administrator,</p>
                <p>The reporting manager (<strong>${managerName || "Manager"}</strong>) has completed the 1-on-1 performance review and evaluation for <strong>${employeeName}</strong>.</p>

                <div class="rating-box">
                  <div style="margin-bottom: 8px;">
                    <strong>Calibrated Manager Score:</strong> <span style="font-size: 18px; font-weight: 800; color: #7c3aed;">${managerRating ? `${managerRating}★` : "4.0★"} / 5.0</span>
                  </div>
                  ${managerSummary ? `<div style="font-style: italic; color: #475569; font-size: 13px;">"${managerSummary}"</div>` : ""}
                </div>

                <p>Please perform the final HR sign-off to complete the review cycle and activate the employee's official PDF Performance Certificate.</p>

                <div style="text-align: center;">
                  <a href="${directReviewUrl}" class="cta-btn">Finalize Appraisal & Activate Certificate</a>
                </div>
              </div>

              <div class="footer">
                <p>This is an automated notification from the Performance Management System (PMS). Responses to this email address are not monitored.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.warn("[Resend Warning] Non-blocking email dispatch error:", error);
        return NextResponse.json({ success: true, emailSent: false, error }, { status: 200 });
      }

      return NextResponse.json({ success: true, emailSent: true, data });
    } else {
      // Default: Employee submitted self-appraisal -> Email Reporting Manager
      const targetEmail = managerEmail || "manager@company.com";
      const directReviewUrl = reviewUrl || `${appUrl}/team/reviews`;

      const { data, error } = await resend.emails.send({
        from: `PMS Performance System <${fromAddress}>`,
        to: [targetEmail],
        subject: `Action Required: ${employeeName} has submitted self-appraisal ratings (${cycleName})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Self-Appraisal Submitted</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px; }
              .badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
              h1 { color: #0f172a; font-size: 22px; margin-top: 12px; margin-bottom: 4px; font-weight: 800; }
              .sub { font-size: 13px; color: #64748b; margin-top: 0; }
              .content { font-size: 14px; line-height: 1.6; color: #334155; }
              .score-callout { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 18px 0; }
              .cta-btn { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff !important; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
              .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="badge">Action Required • Reporting Manager</span>
                <h1>Self-Appraisal Ratings Submitted</h1>
                <p class="sub">Cycle: <strong>${cycleName}</strong></p>
              </div>

              <div class="content">
                <p>Hello <strong>${managerName || "Reporting Manager"}</strong>,</p>
                <p>Your direct report <strong>${employeeName}</strong> has submitted their self-appraisal ratings and milestone reflections for the active review cycle.</p>

                <div class="score-callout">
                  <strong>Employee Self-Rating:</strong> <span style="font-size: 16px; font-weight: bold; color: #4f46e5;">${selfRating ? `${selfRating}★` : "Submitted"} / 5.0</span>
                </div>

                <p><strong>Now you should give your manager ratings:</strong> Please review their deliverables, achievement comments, and submit your manager evaluations and 1-on-1 summary.</p>

                <div style="text-align: center;">
                  <a href="${directReviewUrl}" class="cta-btn">Review & Provide Manager Ratings</a>
                </div>
              </div>

              <div class="footer">
                <p>This is an automated notification from the Performance Management System (PMS). Responses to this email address are not monitored.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.warn("[Resend Warning] Non-blocking email dispatch error:", error);
        return NextResponse.json({ success: true, emailSent: false, error }, { status: 200 });
      }

      return NextResponse.json({ success: true, emailSent: true, data });
    }
  } catch (err: any) {
    // Non-blocking catch-all
    console.error("[PMS Email API Error] Non-blocking failure handled:", err.message);
    return NextResponse.json(
      {
        success: true,
        emailSent: false,
        error: err.message || "Failed to send email notification.",
      },
      { status: 200 }
    );
  }
}

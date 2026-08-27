import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * ARCHITECTURAL EXPLANATION (Lab Manual Step 8 requirement):
 * Why this MUST be a server route and NEVER a client-side call:
 * 1. Security: Sending from the browser exposes the private `RESEND_API_KEY` in network inspect tools,
 *    allowing any user to steal credentials and send unauthorized emails.
 * 2. Fault Tolerance: The server route wraps the dispatch in a try-catch block. Even if Resend encounters
 *    a network failure or rate limit, it returns a graceful JSON response without breaking the database save.
 */

export async function POST(req: NextRequest) {
  try {
    const { employeeName, managerEmail, cycleName, reviewUrl } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";

    if (!apiKey || apiKey === "re_your_resend_api_key") {
      console.log(
        `[Demo Mode Email Notification] Email simulated to ${managerEmail}: "${employeeName} has submitted their self-appraisal for ${cycleName}". Review link: ${reviewUrl}`
      );
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Email simulated successfully (add RESEND_API_KEY in .env.local to send live emails).",
      });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: `AI PMS App <${fromAddress}>`,
      to: [managerEmail],
      subject: `Action Required: ${employeeName} has submitted their Self-Appraisal (${cycleName})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 999px; font-size: 11px; font-weight: bold; }
            h2 { color: #0f172a; margin-top: 12px; margin-bottom: 8px; }
            p { color: #475569; font-size: 14px; line-height: 1.6; }
            .cta-btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff !important; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
            .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">PERFORMANCE MANAGEMENT SYSTEM</span>
              <h2>Self-Appraisal Submitted</h2>
            </div>
            <p>Hello Manager,</p>
            <p><strong>${employeeName}</strong> has completed and submitted their self-appraisal for the active review cycle <strong>"${cycleName}"</strong>.</p>
            <p>Please review their self-ratings, achievement comments, and provide your manager evaluations and final summary ratings by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${reviewUrl}" class="cta-btn">Conduct Manager Review</a>
            </p>
            <div class="footer">
              <p>This is an automated notification from AI PMS. Do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.warn("Resend API error:", error);
      return NextResponse.json({ success: false, error }, { status: 200 }); // Graceful return
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Server email route error:", err);
    // Non-blocking response
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}

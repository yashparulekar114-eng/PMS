import { NextRequest, NextResponse } from "next/server";
import { completeWithClaude, isLlmConfigured, parseJsonObject } from "@/lib/ai/llm";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
  buildTemplateSummary,
  parseSummaryDraft,
  type SummaryGoal,
  type SummaryInput,
} from "@/lib/ai/review-summary";

// Stateless: drafts from the payload the manager's screen already holds. Nothing is saved here.
// The manager reviews every point and decides what goes onto the certificate.

function sanitizeGoals(value: unknown): SummaryGoal[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((raw): SummaryGoal[] => {
    if (!raw || typeof raw !== "object") return [];
    const g = raw as Record<string, unknown>;
    if (typeof g.id !== "string" || typeof g.title !== "string") return [];
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return [
      {
        id: g.id.slice(0, 80),
        title: g.title.slice(0, 200),
        weightage: num(g.weightage) ?? 0,
        managerRating: num(g.managerRating),
        managerComment: typeof g.managerComment === "string" ? g.managerComment.slice(0, 1000) : "",
        selfRating: num(g.selfRating),
      },
    ];
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.employeeName !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input: SummaryInput = {
    employeeName: body.employeeName.slice(0, 120),
    cycleName: typeof body.cycleName === "string" ? body.cycleName.slice(0, 120) : "appraisal",
    overallManagerRating: typeof body.overallManagerRating === "number" ? body.overallManagerRating : null,
    goals: sanitizeGoals(body.goals),
  };

  if (input.goals.length === 0) {
    return NextResponse.json({ error: "At least one goal is needed to draft a summary." }, { status: 400 });
  }

  if (!isLlmConfigured()) {
    return NextResponse.json({
      source: "template",
      points: buildTemplateSummary(input),
      message: "Drafted from the ratings and comments. Add ANTHROPIC_API_KEY on the server for a richer draft.",
    });
  }

  const raw = await completeWithClaude(SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt(input), 900);
  const points = parseSummaryDraft(parseJsonObject(raw), new Set(input.goals.map((g) => g.id)));

  if (!points) {
    return NextResponse.json({
      source: "template",
      points: buildTemplateSummary(input),
      message: "The AI draft was not usable, so a template draft is shown instead.",
    });
  }

  return NextResponse.json({ source: "llm", points });
}

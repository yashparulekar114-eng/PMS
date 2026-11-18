import { NextRequest, NextResponse } from "next/server";
import { completeWithClaude, isLlmConfigured, parseJsonObject } from "@/lib/ai/llm";
import {
  GOAL_COACH_SYSTEM_PROMPT,
  buildGoalCoachUserPrompt,
  parseGoalSuggestion,
} from "@/lib/ai/goal-coach";

// Stateless: the browser sends the goal text it already holds. Nothing is read from or written to the database.
// The suggestion is returned to the employee, who decides whether to accept it. Nothing is saved here.

const asStringArray = (value: unknown, max: number, maxLen: number): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").slice(0, max).map((v) => v.slice(0, maxLen))
    : [];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 300) : "";
  if (!title) {
    return NextResponse.json({ error: "A goal title is required." }, { status: 400 });
  }

  const description = typeof body?.description === "string" ? body.description.slice(0, 1000) : "";
  const targetDate = typeof body?.targetDate === "string" ? body.targetDate.slice(0, 10) : null;
  const issues = asStringArray(body?.issues, 10, 200);
  const existingTitles = asStringArray(body?.existingTitles, 50, 300);

  if (!isLlmConfigured()) {
    return NextResponse.json({
      source: "unavailable",
      suggestion: null,
      message:
        "The AI rewrite is not configured on this server (ANTHROPIC_API_KEY is missing). Use the checklist above to tighten the goal yourself.",
    });
  }

  const raw = await completeWithClaude(
    GOAL_COACH_SYSTEM_PROMPT,
    buildGoalCoachUserPrompt({ title, description, targetDate, issues, existingTitles }),
    500
  );
  const suggestion = parseGoalSuggestion(parseJsonObject(raw));

  if (!suggestion) {
    return NextResponse.json({
      source: "unavailable",
      suggestion: null,
      message: "The coach could not produce a rewrite this time. Try again, or edit the goal yourself.",
    });
  }

  return NextResponse.json({ source: "llm", suggestion });
}

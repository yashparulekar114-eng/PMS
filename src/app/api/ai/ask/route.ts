import { NextRequest, NextResponse } from "next/server";
import { completeWithClaude, isLlmConfigured, parseJsonObject } from "@/lib/ai/llm";
import { FAQ_ITEMS } from "@/lib/faq";
import {
  ASK_PMS_SYSTEM_PROMPT,
  answerQuestion,
  buildAskUserPrompt,
  parseAskReply,
  type StatusFacts,
} from "@/lib/ai/ask-pms";

// Stateless: the browser sends the question and the user's own status facts. Answers come only from the FAQ and those facts.

function sanitizeStatus(raw: unknown): StatusFacts | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const goalsByStatus: Record<string, number> = {};
  if (s.goalsByStatus && typeof s.goalsByStatus === "object") {
    for (const [key, value] of Object.entries(s.goalsByStatus as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) goalsByStatus[key.slice(0, 30)] = value;
    }
  }
  return {
    cycleName: typeof s.cycleName === "string" ? s.cycleName.slice(0, 120) : null,
    cycleEndDate: typeof s.cycleEndDate === "string" ? s.cycleEndDate.slice(0, 10) : null,
    daysLeft: typeof s.daysLeft === "number" && Number.isFinite(s.daysLeft) ? s.daysLeft : null,
    goalCount: typeof s.goalCount === "number" && Number.isFinite(s.goalCount) ? s.goalCount : 0,
    totalWeightage: typeof s.totalWeightage === "number" && Number.isFinite(s.totalWeightage) ? s.totalWeightage : 0,
    goalsByStatus,
    reviewStatus: typeof s.reviewStatus === "string" ? s.reviewStatus.slice(0, 40) : null,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }
  const status = sanitizeStatus(body?.status);

  // Rules answer first. Status and strong FAQ matches are exact, so the model is only asked when rules find nothing,
  // which is where paraphrased questions need it. Rules are also the fallback if the model is unavailable.
  const deterministic = answerQuestion(question, FAQ_ITEMS, status);

  if (!isLlmConfigured() || deterministic.mode !== "none") {
    return NextResponse.json({ ...deterministic, source: "rules" });
  }

  const raw = await completeWithClaude(
    ASK_PMS_SYSTEM_PROMPT,
    buildAskUserPrompt(question, FAQ_ITEMS, status),
    400
  );
  const reply = parseAskReply(parseJsonObject(raw), new Set(FAQ_ITEMS.map((f) => f.id)));

  if (!reply) {
    return NextResponse.json({ ...deterministic, source: "rules" });
  }

  const citesFaq = reply.citations.length > 0;
  return NextResponse.json({
    answer: reply.answer,
    citations: reply.citations,
    mode: citesFaq ? "faq" : deterministic.mode,
    source: "llm",
  });
}

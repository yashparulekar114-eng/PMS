import { NextRequest, NextResponse } from "next/server";
import { completeWithClaude, isLlmConfigured, parseJsonObject } from "@/lib/ai/llm";
import {
  CALIBRATION_SYSTEM_PROMPT,
  buildAgendaTemplate,
  buildCalibrationUserPrompt,
  parseAgenda,
  type PromptSafeManagerStat,
  type PromptSafeStats,
} from "@/lib/ai/calibration";

// Receives only anonymised aggregates (M1, M2... with numbers). No names, ids or comments reach this route or the model.
// The browser maps the references back to names for display.

const LABELS = ["lenient", "harsh", "central_tendency", "typical", "insufficient_data"] as const;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function sanitizeStats(raw: unknown): PromptSafeStats | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.managers)) return null;

  const managers: PromptSafeManagerStat[] = r.managers.slice(0, 200).flatMap((m): PromptSafeManagerStat[] => {
    if (!m || typeof m !== "object") return [];
    const x = m as Record<string, unknown>;
    if (typeof x.ref !== "string" || !/^M\d{1,3}$/.test(x.ref)) return [];
    const label = LABELS.find((l) => l === x.label) ?? "typical";
    return [
      {
        ref: x.ref,
        n: Math.max(0, Math.floor(num(x.n) ?? 0)),
        mean: num(x.mean),
        stdev: num(x.stdev),
        share4plus: num(x.share4plus),
        share2orLess: num(x.share2orLess),
        deltaVsCompany: num(x.deltaVsCompany),
        z: num(x.z),
        label,
      },
    ];
  });

  return {
    cycleName: typeof r.cycleName === "string" ? r.cycleName.slice(0, 120) : "appraisal cycle",
    reviewsWithRatings: Math.max(0, Math.floor(num(r.reviewsWithRatings) ?? 0)),
    companyMean: num(r.companyMean),
    companyStdev: num(r.companyStdev),
    managers,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const stats = sanitizeStats(body?.stats);
  if (!stats) {
    return NextResponse.json({ error: "Invalid calibration statistics." }, { status: 400 });
  }

  const validRefs = new Set(stats.managers.map((m) => m.ref));

  if (!isLlmConfigured()) {
    return NextResponse.json({
      source: "template",
      sections: buildAgendaTemplate(stats),
      message: "Template agenda. Add ANTHROPIC_API_KEY on the server for a drafted agenda.",
    });
  }

  const raw = await completeWithClaude(CALIBRATION_SYSTEM_PROMPT, buildCalibrationUserPrompt(stats), 900);
  const sections = parseAgenda(parseJsonObject(raw), validRefs);

  if (!sections) {
    return NextResponse.json({
      source: "template",
      sections: buildAgendaTemplate(stats),
      message: "The AI draft was not usable, so a template agenda is shown instead.",
    });
  }

  return NextResponse.json({ source: "llm", sections });
}

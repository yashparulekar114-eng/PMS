// Feedback Bias and Quality Checker. Deterministic rules, so the result is auditable and nothing is sent off the server.
// It flags wording for the manager to review. It never blocks a submit on its own.
// Dependency-free on purpose so it can be unit-tested directly.

export type FlagKind = "gendered_language" | "personal_reference" | "vague_feedback" | "rating_mismatch";
export type FlagSeverity = "high" | "medium" | "low";

export interface FeedbackFlag {
  kind: FlagKind;
  severity: FlagSeverity;
  message: string;
  evidence?: string;
}

// Words that research on gender-coded language links to stereotyped descriptions of women or men.
const GENDER_CODED: Array<{ word: string; severity: FlagSeverity }> = [
  { word: "bossy", severity: "medium" },
  { word: "emotional", severity: "medium" },
  { word: "hysterical", severity: "high" },
  { word: "shrill", severity: "medium" },
  { word: "abrasive", severity: "medium" },
  { word: "catty", severity: "medium" },
  { word: "bubbly", severity: "low" },
  { word: "nurturing", severity: "low" },
  { word: "sweet", severity: "low" },
  { word: "aggressive", severity: "low" },
  { word: "arrogant", severity: "low" },
  { word: "dominant", severity: "low" },
  { word: "girls", severity: "low" },
  { word: "ladies", severity: "low" },
  { word: "lady", severity: "low" },
];

const PERSONAL_PATTERN =
  /\b(pregnan\w*|maternity|paternity|marri\w*|wedding|divorc\w*|children|kids?|husband|wife|family|baby|childcare|parental)\b/i;
const APPEARANCE_PATTERN =
  /\b(pretty|attractive|beautiful|handsome|cute|outfit|dressed|appearance|overweight|too young|too old|looks? (good|great|tired))\b/i;

const VAGUE_PHRASES = [
  "good job", "great job", "nice job", "nice work", "good work", "great work", "keep it up",
  "hard worker", "works hard", "team player", "good attitude", "great attitude", "does well",
  "doing well", "as expected", "satisfactory", "good enough",
];
const ABSOLUTE_PATTERN = /\b(always|never|constantly|every single time)\b/i;

const POSITIVE_WORDS = [
  "excellent", "outstanding", "exceptional", "exceeded", "strong", "great", "impressive",
  "superb", "flawless", "exemplary", "consistently delivered",
];
const NEGATIVE_WORDS = [
  "poor", "poorly", "missed", "failed", "failing", "below", "behind", "struggled", "struggling",
  "weak", "inconsistent", "delayed", "lacking", "incomplete", "unable", "did not", "didn't", "not meet",
];

const SEVERITY_ORDER: Record<FlagSeverity, number> = { high: 0, medium: 1, low: 2 };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findPhrases(text: string, phrases: string[]): string[] {
  const hits: string[] = [];
  for (const phrase of phrases) {
    const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    if (pattern.test(text)) hits.push(phrase);
  }
  return hits;
}

export function checkFeedback(text: string, rating: number | null): FeedbackFlag[] {
  const body = text.trim();
  if (!body) return [];
  const flags: FeedbackFlag[] = [];

  // 1. Gender-coded wording
  for (const { word, severity } of GENDER_CODED) {
    if (new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(body)) {
      flags.push({
        kind: "gendered_language",
        severity,
        message: `Gender-coded wording ('${word}'). Describe the specific behaviour and its effect instead.`,
        evidence: word,
      });
    }
  }

  // 2. Personal-life or appearance references (not part of performance)
  const personal = body.match(PERSONAL_PATTERN);
  if (personal) {
    flags.push({
      kind: "personal_reference",
      severity: "high",
      message: "Refers to family or personal life. Keep feedback to work performance.",
      evidence: personal[0],
    });
  }
  const appearance = body.match(APPEARANCE_PATTERN);
  if (appearance) {
    flags.push({
      kind: "personal_reference",
      severity: "high",
      message: "Comments on appearance or age. Remove it; it is not a performance measure.",
      evidence: appearance[0],
    });
  }

  // 3. Vague or generic feedback
  const hasNumber = /\d/.test(body);
  const vague = findPhrases(body, VAGUE_PHRASES);
  if (vague.length > 0 && !hasNumber) {
    flags.push({
      kind: "vague_feedback",
      severity: "medium",
      message: "Generic praise with no example or metric. Add a specific deliverable or outcome.",
      evidence: vague[0],
    });
  }
  const wordCount = body.split(/\s+/).length;
  if (wordCount < 8) {
    flags.push({
      kind: "vague_feedback",
      severity: "low",
      message: "Very brief. Add one specific example.",
    });
  }
  const absolute = body.match(ABSOLUTE_PATTERN);
  if (absolute && !hasNumber) {
    flags.push({
      kind: "vague_feedback",
      severity: "low",
      message: "Absolute wording without evidence. Say how often and in what situations.",
      evidence: absolute[0],
    });
  }

  // 4. Comment tone contradicts the rating
  if (rating !== null && Number.isFinite(rating)) {
    const positives = findPhrases(body, POSITIVE_WORDS);
    const negatives = findPhrases(body, NEGATIVE_WORDS);
    if (rating >= 4 && negatives.length > 0 && negatives.length >= positives.length) {
      flags.push({
        kind: "rating_mismatch",
        severity: "medium",
        message: `Rating is ${rating.toFixed(1)} but the comment describes shortfalls. Check the rating matches the wording.`,
        evidence: negatives[0],
      });
    } else if (rating <= 2 && positives.length > 0 && positives.length >= negatives.length) {
      flags.push({
        kind: "rating_mismatch",
        severity: "medium",
        message: `Rating is ${rating.toFixed(1)} but the comment is mainly positive. Check the rating matches the wording.`,
        evidence: positives[0],
      });
    }
  }

  return flags.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

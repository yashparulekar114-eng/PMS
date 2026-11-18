// Server-side helper for Claude calls. It returns null when ANTHROPIC_API_KEY is not set
// or when the request fails, so every caller can fall back to deterministic logic.
// Only import this from API routes or other server code: the key must never reach the browser.

export const LLM_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export function isLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function completeWithClaude(
  system: string,
  user: string,
  maxTokens = 900
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.warn(`[AI] Claude request failed with status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.warn("[AI] Claude request error:", err instanceof Error ? err.message : err);
    return null;
  }
}

// Pulls the first JSON object out of a model reply. Returns null when none parses.
export function parseJsonObject(text: string | null): unknown {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

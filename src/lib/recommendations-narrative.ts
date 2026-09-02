import { generateText } from "@/lib/llm";
import type { RecommendationResult } from "@/lib/recommendations";

const SYSTEM_PROMPT = `You are an assistant inside EVALPRO, a system used by Philippine public school teachers (DepEd) to track their readiness for promotion under the PPST/RFTP framework.

You will receive a teacher's computed promotion gaps as structured data. Your job is ONLY to rewrite that data as clear, encouraging guidance.

Strict rules:
- Use ONLY the numbers and facts given. Never invent scores, requirements, deadlines, training names, or statistics.
- Never state or imply that age, gender, civil status, or which school someone graduated from affects promotion chances.
- Do not promise or predict approval. Promotion decisions are made by the HRMPSB, not by this system.
- If the data says the sample of approved teachers is small, say so plainly rather than presenting it as a strong pattern.
- Address the teacher directly as "you". Be warm and practical, never condescending.
- Lead with the single most important thing they should do next.
- Keep it under 180 words, in short paragraphs. No headings, no bullet lists, no markdown.`;

/** Strips everything identifying. Only scores, gaps and benchmarks go out. */
function buildUserPrompt(result: RecommendationResult, language: "en" | "fil"): string {
  const lines: string[] = [];

  lines.push(`Target position: ${result.targetPosition ?? "not yet chosen"}`);
  lines.push(`Teacher's current total score: ${result.currentScore} out of 100`);
  lines.push(
    `Median total score of approved teachers: ${result.cohortMedian} (based on ${result.cohortSize} approved application(s))`
  );
  lines.push(`Sample size note: ${result.reliabilityNote}`);
  lines.push("");
  lines.push("Gaps identified, highest priority first:");

  for (const r of result.recommendations) {
    lines.push(`- [${r.priority}] ${r.category}: ${r.title}. ${r.detail} (Basis: ${r.basis})`);
  }

  if (result.recommendations.length === 0) {
    lines.push("- None. No gaps were identified against the requirements or benchmarks.");
  }

  lines.push("");
  lines.push(
    language === "fil"
      ? "Write the guidance in conversational Filipino (Tagalog). Technical DepEd terms like COI, NCOI, IPCRF, MOV and PPST stay in English."
      : "Write the guidance in clear English."
  );

  return lines.join("\n");
}

export interface NarrativeResult {
  narrative: string | null;
  provider: string | null;
  /** True when the LLM was unavailable and the caller should show the list only */
  fellBack: boolean;
}

export async function getNarrative(
  result: RecommendationResult,
  language: "en" | "fil" = "en"
): Promise<NarrativeResult> {
  const out = await generateText(SYSTEM_PROMPT, buildUserPrompt(result, language));

  if (!out) {
    return { narrative: null, provider: null, fellBack: true };
  }

  return { narrative: out.text, provider: out.provider, fellBack: false };
}

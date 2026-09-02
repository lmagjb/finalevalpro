// ---------------------------------------------------------------------
// LLM client.
//
// Provider is chosen by whichever environment variable is set, so the
// same code runs against a hosted API in production and a local model in
// development:
//
//   GEMINI_API_KEY   -> Google Gemini (hosted)
//   GROQ_API_KEY     -> Groq (hosted, fallback)
//   OLLAMA_URL       -> local Ollama instance (dev / self-hosted)
//
// If none is set, callers fall back to the structured recommendation
// list. The LLM only ever rephrases data the app already computed — it
// never decides scores, rankings, or eligibility.
//
// PRIVACY: nothing identifying is sent. No names, emails, employee
// numbers, or schools — only scores, gaps and benchmarks. See
// buildPrompt() in recommendations-narrative.ts.
// ---------------------------------------------------------------------

export type LlmProvider = "gemini" | "groq" | "ollama" | "none";

export function activeProvider(): LlmProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OLLAMA_URL) return "ollama";
  return "none";
}

const TIMEOUT_MS = 12000;

async function withTimeout<T>(p: Promise<T>): Promise<T> {
  const controller = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("LLM request timed out")), TIMEOUT_MS)
  );
  return Promise.race([p, controller]);
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await withTimeout(
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
        }),
      }
    )
  );

  if (!res.ok) throw new Error(`Gemini responded ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no text");
  return text.trim();
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const res = await withTimeout(
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })
  );

  if (!res.ok) throw new Error(`Groq responded ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no text");
  return text.trim();
}

async function callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
  const base = process.env.OLLAMA_URL!.replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5";
  const res = await withTimeout(
    fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0.4 },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })
  );

  if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
  const data = await res.json();
  const text = data?.message?.content;
  if (!text) throw new Error("Ollama returned no text");
  return text.trim();
}

/** Returns null when no provider is configured or the call fails, so the
 * caller can fall back to the structured list rather than showing an error. */
export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; provider: LlmProvider } | null> {
  const provider = activeProvider();
  if (provider === "none") return null;

  try {
    const text =
      provider === "gemini"
        ? await callGemini(systemPrompt, userPrompt)
        : provider === "groq"
        ? await callGroq(systemPrompt, userPrompt)
        : await callOllama(systemPrompt, userPrompt);
    return { text, provider };
  } catch (err) {
    console.error("LLM call failed:", err);
    return null;
  }
}

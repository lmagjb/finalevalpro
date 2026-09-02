import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureDraftApplication } from "@/lib/teacher";
import { getRecommendations } from "@/lib/recommendations";
import { getNarrative } from "@/lib/recommendations-narrative";
import { activeProvider } from "@/lib/llm";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const language = searchParams.get("lang") === "fil" ? "fil" : "en";
  const wantNarrative = searchParams.get("narrative") !== "false";

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const [rows] = await pool.query(
    `SELECT target_position FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  const targetPosition =
    (rows as { target_position: string | null }[])[0]?.target_position ?? null;

  const result = await getRecommendations(applicationId, targetPosition);

  // The structured list is always returned. The narrative is additive —
  // if no LLM provider is configured or the call fails, the page still
  // renders the full recommendation list.
  let narrative = null;
  let provider = null;
  if (wantNarrative && activeProvider() !== "none") {
    const n = await getNarrative(result, language);
    narrative = n.narrative;
    provider = n.provider;
  }

  return NextResponse.json({ ...result, narrative, provider });
}

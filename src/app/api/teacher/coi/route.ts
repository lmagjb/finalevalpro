import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureDraftApplication } from "@/lib/teacher";
import { getIndicatorsForApplication, SCORE_MAX } from "@/lib/scoring";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const [indicators, appRows] = await Promise.all([
    getIndicatorsForApplication(applicationId),
    pool.query(
      `SELECT target_position, coi_numeric_score FROM promotion_applications WHERE id = ? LIMIT 1`,
      [applicationId]
    ),
  ]);

  const app = (appRows[0] as { target_position: string | null; coi_numeric_score: number | null }[])[0];
  const coi = indicators.filter((i) => i.is_coi);

  return NextResponse.json({
    targetPosition: app?.target_position ?? null,
    coiScore: app?.coi_numeric_score ?? null,
    coiMaxPoints: SCORE_MAX.coi,
    indicators: coi,
    counts: {
      outstanding: coi.filter((i) => i.rating === "O").length,
      verySatisfactory: coi.filter((i) => i.rating === "VS").length,
      notRated: coi.filter((i) => i.rating === "X").length,
      total: coi.length,
    },
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, getIndicatorsForApplication } from "@/lib/staff";
import { pool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !ROLE_STAGE[role]) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = Number(params.id);
  const [indicators, appRows] = await Promise.all([
    getIndicatorsForApplication(applicationId),
    pool.query(
      `SELECT target_position, coi_numeric_score, ncoi_numeric_score FROM promotion_applications WHERE id = ? LIMIT 1`,
      [applicationId]
    ),
  ]);

  const app = (appRows[0] as {
    target_position: string | null;
    coi_numeric_score: number | null;
    ncoi_numeric_score: number | null;
  }[])[0];

  return NextResponse.json({ indicators, application: app ?? null });
}

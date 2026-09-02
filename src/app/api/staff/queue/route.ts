import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, getQueueForStage, getQueueCounts } from "@/lib/staff";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !ROLE_STAGE[role]) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stage = ROLE_STAGE[role];
  const [items, counts] = await Promise.all([
    getQueueForStage(stage),
    getQueueCounts(stage),
  ]);

  return NextResponse.json({ items, counts });
}

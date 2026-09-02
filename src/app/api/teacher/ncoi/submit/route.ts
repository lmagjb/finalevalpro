import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication } from "@/lib/teacher";
import { submitNcoi } from "@/lib/ncoi";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const applicationId = await ensureDraftApplication(Number(session.user.id));
  await submitNcoi(applicationId);
  return NextResponse.json({ ok: true });
}

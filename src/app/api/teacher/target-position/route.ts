import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication, setTargetPosition } from "@/lib/teacher";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const targetPosition = String(body.targetPosition ?? "").trim();
  if (!targetPosition) {
    return NextResponse.json({ error: "Target position is required." }, { status: 400 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  await setTargetPosition(applicationId, targetPosition);

  return NextResponse.json({ ok: true });
}

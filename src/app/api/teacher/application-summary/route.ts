import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication } from "@/lib/teacher";
import { getRftpSummary } from "@/lib/rftp";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId = Number(session.user.id);
  const applicationId = await ensureDraftApplication(teacherId);
  const summary = await getRftpSummary(teacherId, applicationId);

  return NextResponse.json(summary);
}

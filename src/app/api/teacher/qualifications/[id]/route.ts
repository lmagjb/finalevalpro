import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication } from "@/lib/teacher";
import { deleteQualificationRecord } from "@/lib/scoring";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const applicationId = await ensureDraftApplication(Number(session.user.id));
  await deleteQualificationRecord(Number(params.id), applicationId);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, returnApplication } from "@/lib/staff";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !ROLE_STAGE[role]) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const remarks = String(body.remarks ?? "").trim();
  if (!remarks) {
    return NextResponse.json({ error: "Remarks are required when returning an application." }, { status: 400 });
  }

  await returnApplication({
    applicationId: Number(params.id),
    actorId: Number(session.user.id),
    fromStage: ROLE_STAGE[role],
    remarks,
  });

  return NextResponse.json({ ok: true });
}

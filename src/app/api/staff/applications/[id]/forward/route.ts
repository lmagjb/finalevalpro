import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, NEXT_STAGE, forwardApplication } from "@/lib/staff";

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
  const fromStage = ROLE_STAGE[role];
  const toStage = NEXT_STAGE[role];

  await forwardApplication({
    applicationId: Number(params.id),
    actorId: Number(session.user.id),
    fromStage,
    toStage,
    remarks: body.remarks,
  });

  return NextResponse.json({ ok: true });
}

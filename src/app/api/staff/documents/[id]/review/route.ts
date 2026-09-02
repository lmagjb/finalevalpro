import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, reviewDocument } from "@/lib/staff";

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
  const status = body.status as "verified" | "rejected";
  if (status !== "verified" && status !== "rejected") {
    return NextResponse.json({ error: "Status must be verified or rejected." }, { status: 400 });
  }

  await reviewDocument({
    documentId: Number(params.id),
    actorId: Number(session.user.id),
    status,
    remarks: body.remarks,
  });

  return NextResponse.json({ ok: true });
}

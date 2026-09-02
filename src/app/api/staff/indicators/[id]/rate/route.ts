import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, rateIndicator } from "@/lib/staff";

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
  const rating = body.rating as "O" | "VS" | "X";
  const applicationId = Number(body.applicationId);

  if (!["O", "VS", "X"].includes(rating) || !applicationId) {
    return NextResponse.json({ error: "applicationId and a valid rating are required." }, { status: 400 });
  }

  await rateIndicator({
    applicationId,
    indicatorId: Number(params.id),
    rating,
    actorId: Number(session.user.id),
  });

  return NextResponse.json({ ok: true });
}

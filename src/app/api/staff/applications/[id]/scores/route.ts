import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_STAGE, setNumericScores } from "@/lib/staff";

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
  const coiScore = body.coiScore !== undefined ? Number(body.coiScore) : undefined;
  const ncoiScore = body.ncoiScore !== undefined ? Number(body.ncoiScore) : undefined;

  await setNumericScores({
    applicationId: Number(params.id),
    coiScore,
    ncoiScore,
  });

  return NextResponse.json({ ok: true });
}

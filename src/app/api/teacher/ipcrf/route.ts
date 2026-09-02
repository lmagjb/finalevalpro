import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication } from "@/lib/teacher";
import { getLatestIpcrf, addIpcrfRecord } from "@/lib/scoring";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const latest = await getLatestIpcrf(applicationId);
  return NextResponse.json({ latest });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const schoolYear = String(body.schoolYear ?? "").trim();
  const numericRating = Number(body.numericRating);
  const adjectivalRating = String(body.adjectivalRating ?? "");

  if (!schoolYear || !Number.isFinite(numericRating) || !adjectivalRating) {
    return NextResponse.json({ error: "School year, rating, and adjectival rating are required." }, { status: 400 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  await addIpcrfRecord({ applicationId, schoolYear, numericRating, adjectivalRating });

  return NextResponse.json({ ok: true }, { status: 201 });
}

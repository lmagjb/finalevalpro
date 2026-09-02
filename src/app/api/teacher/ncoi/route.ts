import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication } from "@/lib/teacher";
import {
  PA_AREAS, BEI_QUESTIONS, PA_MAX_POINTS, BEI_MAX_POINTS,
  getNcoiEvidence, saveNcoiAnnotation, getNcoiSubmittedAt,
} from "@/lib/ncoi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const [evidence, submittedAt] = await Promise.all([
    getNcoiEvidence(applicationId),
    getNcoiSubmittedAt(applicationId),
  ]);

  const find = (section: "pa" | "bei", slot: string) =>
    evidence.find((e) => e.section === section && e.slot === slot) ?? null;

  return NextResponse.json({
    submittedAt,
    paMaxPoints: PA_MAX_POINTS,
    beiMaxPoints: BEI_MAX_POINTS,
    pa: PA_AREAS.map((a) => ({ ...a, evidence: find("pa", a.slot) })),
    bei: BEI_QUESTIONS.map((q) => ({ ...q, evidence: find("bei", q.slot) })),
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const entries = body.entries as { section: "pa" | "bei"; slot: string; annotation: string }[];
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "entries array is required." }, { status: 400 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  for (const e of entries) {
    if (e.section !== "pa" && e.section !== "bei") continue;
    await saveNcoiAnnotation({
      applicationId,
      section: e.section,
      slot: e.slot,
      annotation: e.annotation ?? "",
    });
  }

  return NextResponse.json({ ok: true });
}

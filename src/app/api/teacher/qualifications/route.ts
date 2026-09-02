import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication, insertDocument } from "@/lib/teacher";
import { getQualificationRecords, addQualificationRecord } from "@/lib/scoring";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const records = await getQualificationRecords(applicationId);
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const contentType = request.headers.get("content-type") ?? "";

  let category: string, title: string, detail: string | undefined;
  let institution: string | undefined, yearCompleted: number | undefined, hours: number | undefined;
  let points = 0;
  let documentId: number | undefined;

  if (contentType.includes("multipart/form-data")) {
    const fd = await request.formData();
    category = String(fd.get("category") ?? "");
    title = String(fd.get("title") ?? "").trim();
    detail = (fd.get("detail") as string) || undefined;
    institution = (fd.get("institution") as string) || undefined;
    const yr = fd.get("yearCompleted");
    yearCompleted = yr ? Number(yr) : undefined;
    const hr = fd.get("hours");
    hours = hr ? Number(hr) : undefined;
    points = Number(fd.get("points") ?? 0);

    const file = fd.get("file") as File | null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      documentId = await insertDocument({
        applicationId,
        domain: 7,
        indicatorType: "NCOI",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileData: buf,
      });
    }
  } else {
    const body = await request.json();
    category = String(body.category ?? "");
    title = String(body.title ?? "").trim();
    detail = body.detail;
    institution = body.institution;
    yearCompleted = body.yearCompleted ? Number(body.yearCompleted) : undefined;
    hours = body.hours ? Number(body.hours) : undefined;
    points = Number(body.points ?? 0);
  }

  if (!["education", "training", "experience", "eligibility"].includes(category) || !title) {
    return NextResponse.json({ error: "Category and title are required." }, { status: 400 });
  }

  const id = await addQualificationRecord({
    applicationId,
    category: category as "education" | "training" | "experience" | "eligibility",
    title,
    detail,
    institution,
    hours,
    yearCompleted,
    documentId,
    points: Number.isFinite(points) ? points : 0,
  });

  return NextResponse.json({ id }, { status: 201 });
}

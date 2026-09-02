import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ensureDraftApplication,
  getDocumentsForDomain,
  getDocumentStatsForApplication,
  insertDocument,
} from "@/lib/teacher";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domain = Number(searchParams.get("domain") ?? 1);

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const [documents, stats] = await Promise.all([
    getDocumentsForDomain(applicationId, domain),
    getDocumentStatsForApplication(applicationId),
  ]);

  return NextResponse.json({ documents, stats, applicationId });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const domain = Number(formData.get("domain"));
  // The real design doesn't ask teachers to classify COI/NCOI at upload
  // time — this is now just an organizational tag; actual COI/NCOI
  // scoring comes from the evaluator's numeric scores, not this field.
  const indicatorType: "COI" | "NCOI" = domain <= 4 ? "COI" : "NCOI";

  if (!file || !domain) {
    return NextResponse.json({ error: "A file and PPST domain are required." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const arrayBuffer = await file.arrayBuffer();

  const documentId = await insertDocument({
    applicationId,
    domain,
    indicatorType,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileData: Buffer.from(arrayBuffer),
  });

  return NextResponse.json({ id: documentId }, { status: 201 });
}

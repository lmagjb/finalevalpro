import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDraftApplication, insertDocument } from "@/lib/teacher";
import { attachNcoiDocument } from "@/lib/ncoi";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const section = String(formData.get("section") ?? "") as "pa" | "bei";
  const slot = String(formData.get("slot") ?? "");

  if (!file || !slot || (section !== "pa" && section !== "bei")) {
    return NextResponse.json({ error: "A file, section and slot are required." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
  }

  const applicationId = await ensureDraftApplication(Number(session.user.id));
  const arrayBuffer = await file.arrayBuffer();

  // NCOI evidence covers PPST domains 4-7; store against domain 4 so the
  // document still appears in the teacher's digital folder.
  const documentId = await insertDocument({
    applicationId,
    domain: 4,
    indicatorType: "NCOI",
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileData: Buffer.from(arrayBuffer),
  });

  await attachNcoiDocument({ applicationId, section, slot, documentId });

  return NextResponse.json({ id: documentId, fileName: file.name }, { status: 201 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentFile } from "@/lib/teacher";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await getDocumentFile(Number(params.id));
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(doc.file_data, {
    headers: {
      "Content-Type": doc.mime_type ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${doc.file_name}"`,
    },
  });
}

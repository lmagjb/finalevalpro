import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = Number(params.id);

  // Only allow deleting a document that belongs to the requesting
  // teacher's own application, and only while it hasn't been verified yet.
  const [rows] = await pool.query(
    `SELECT d.id, d.status, pa.teacher_id
     FROM documents d
     JOIN promotion_applications pa ON pa.id = d.application_id
     WHERE d.id = ? LIMIT 1`,
    [documentId]
  );
  const doc = (rows as { id: number; status: string; teacher_id: number }[])[0];

  if (!doc || doc.teacher_id !== Number(session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.status === "verified") {
    return NextResponse.json(
      { error: "This document is already verified and can't be removed. Contact your evaluator if it needs to change." },
      { status: 400 }
    );
  }

  await pool.query(`DELETE FROM documents WHERE id = ?`, [documentId]);
  return NextResponse.json({ ok: true });
}

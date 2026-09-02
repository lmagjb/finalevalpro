import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeacherProfile, updateTeacherProfile } from "@/lib/teacher";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getTeacherProfile(Number(session.user.id));
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await updateTeacherProfile(Number(session.user.id), {
    school: body.school,
    division: body.division,
    email: body.email,
    contactNumber: body.contactNumber,
    sex: body.sex,
    birthDate: body.birthDate,
    educationUnits: body.educationUnits !== undefined ? Number(body.educationUnits) : undefined,
    hasMastersDegree: body.hasMastersDegree,
    monthsOfService: body.monthsOfService !== undefined ? Number(body.monthsOfService) : undefined,
    salaryGrade: body.salaryGrade ? Number(body.salaryGrade) : undefined,
    schoolLevel: body.schoolLevel,
  });

  return NextResponse.json({ ok: true });
}

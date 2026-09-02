import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankedCandidates, getDemographicBreakdown } from "@/lib/staff";
import { getApprovedStatistics, getWorkflowStatistics } from "@/lib/statistics";

export async function GET() {
  const session = await getServerSession(authOptions);
  const staffRoles = ["principal", "ao_ii", "psds", "hr_ao_iv", "admin_officer"];
  if (!session?.user?.role || !staffRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [candidates, approved] = await Promise.all([
    getRankedCandidates(),
    getRankedCandidates({ approvedOnly: true }),
  ]);

  return NextResponse.json({
    candidates,
    demographics: getDemographicBreakdown(candidates),
    approvedStatistics: await getApprovedStatistics(approved),
    workflowStatistics: await getWorkflowStatistics(),
  });
}

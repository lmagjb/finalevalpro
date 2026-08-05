import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardNav from "@/components/DashboardNav";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <DashboardNav
        title="Teacher Dashboard"
        userName={session?.user?.name}
      />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-ink">
            Promotion readiness
          </h2>
          <p className="mt-2 text-sm text-slate">
            Your digital folder, COI/NCOI scoring, and application status. You're
            signed in as a <span className="font-medium">teacher</span>.
          </p>
        </div>
      </main>
    </div>
  );
}

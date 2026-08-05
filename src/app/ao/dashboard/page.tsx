import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardNav from "@/components/DashboardNav";

export default async function AdminOfficerDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <DashboardNav
        title="Administrative Officer Dashboard"
        userName={session?.user?.name}
      />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-ink">
            Promotion applications
          </h2>
          <p className="mt-2 text-sm text-slate">
            Submitted applications, document validation, and automated
            COI/NCOI computation will appear. You're signed in as an{" "}
            <span className="font-medium">admin officer</span>.
          </p>
        </div>
      </main>
    </div>
  );
}

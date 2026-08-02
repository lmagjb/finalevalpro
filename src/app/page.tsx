import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "teacher") {
    redirect("/teacher/dashboard");
  }
  if (session?.user?.role === "admin_officer") {
    redirect("/ao/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-teal">
          EVALPRO
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Teacher Promotion Readiness &amp; Scoring System
        </h1>
        <p className="mt-3 text-sm text-slate">
          A PPST-based platform that helps teachers track promotion
          readiness and helps administrative officers manage and score
          promotion applications.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-md bg-teal px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-teal/90"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-ink transition hover:bg-paper"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

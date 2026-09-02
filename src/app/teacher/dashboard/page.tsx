import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getTeacherProfile, getActiveApplication } from "@/lib/teacher";
import TeacherNav from "@/components/TeacherNav";
import RecentNotifications from "@/components/RecentNotifications";

// The stepper shown to teachers. HRMPSB board deliberation happens between
// HR and SDS but is not surfaced as its own step in this view.
const STEPS: { key: string; label: string; status: string }[] = [
  { key: "principal", label: "Observation", status: "Under Classroom Observation" },
  { key: "ao_ii", label: "AO II", status: "Under AO II Review" },
  { key: "psds", label: "PSDS", status: "Under District Validation" },
  { key: "hr_ao_iv", label: "HR", status: "Under HR Processing" },
  { key: "sds", label: "SDS", status: "Awaiting SDS Approval" },
];

function stepIndexFor(stage: string | undefined): number {
  if (!stage) return -1;
  // HRMPSB sits between HR and SDS; show it as HR complete, SDS pending.
  if (stage === "hrmpsb") return 4;
  if (stage === "approved") return STEPS.length;
  return STEPS.findIndex((s) => s.key === stage);
}

const QUICK_ACTIONS = [
  {
    href: "/teacher/ncoi",
    title: "NCOI Evaluation",
    description: "Annotate your MOVs and answer the interview questions",
  },
  {
    href: "/teacher/qualifications",
    title: "Qualification Standards",
    description: "Document your education, experience, and training",
  },
  {
    href: "/teacher/coi",
    title: "COI Summary",
    description: "See how your observers rated your classroom observation",
  },
];

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  const [profile, application] = await Promise.all([
    getTeacherProfile(userId),
    getActiveApplication(userId),
  ]);

  const currentIndex = stepIndexFor(application?.current_stage);
  const currentStatus =
    application?.current_stage === "hrmpsb"
      ? "Under HRMPSB Deliberation"
      : application?.current_stage === "approved"
      ? "Approved"
      : STEPS[currentIndex]?.status ?? null;

  return (
    <div className="bg-depedBg min-h-screen">
      <TeacherNav subtitle="Teacher Dashboard" />

      <main className="max-w-[1400px] mx-auto px-10 py-8">
        {/* welcome */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {profile?.full_name ?? "Teacher"}!
          </h2>
          <p className="text-lg text-textMuted mt-2">
            Position: {profile?.current_position ?? "--"}
            <span className="mx-2 text-gray-300">|</span>
            School: {profile?.school ?? "--"}
          </p>
        </section>

        {/* promotion status */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Your Promotion Status</h3>

          {!application ? (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-bold text-gray-500">No active promotion application.</p>
              <p className="text-base text-textMuted mt-1">
                Submit your application to see your status tracker here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                {STEPS.map((step, idx) => {
                  const done = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            done || isCurrent
                              ? "bg-depedBlue text-white shadow-md"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {done ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`mt-3 text-base font-bold text-center ${
                            isCurrent ? "text-depedBlue" : "text-gray-900"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 mb-8 ${done ? "bg-depedBlue" : "bg-gray-200"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {currentStatus && (
                <div className="mt-8 bg-gray-50 rounded-xl py-4 text-center">
                  <span className="text-base text-gray-700">Current Status: </span>
                  <span className="text-base font-bold text-depedBlue">{currentStatus}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 hover:shadow-lg hover:border-depedBlue/30 transition-all"
            >
              <h4 className="text-xl font-bold text-gray-900">{a.title}</h4>
              <p className="text-base text-textMuted mt-2">{a.description}</p>
            </Link>
          ))}
        </div>

        <RecentNotifications />
      </main>
    </div>
  );
}

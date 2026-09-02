import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeReadiness, getActiveApplication } from "@/lib/teacher";
import { SCORE_MAX } from "@/lib/scoring";
import TeacherNav from "@/components/TeacherNav";
import RecommendationsPanel from "@/components/RecommendationsPanel";

const ROWS: { key: "education" | "training" | "experience" | "performance" | "coi" | "ncoi"; label: string; max: number }[] = [
  { key: "education", label: "Education", max: SCORE_MAX.education },
  { key: "training", label: "Training", max: SCORE_MAX.training },
  { key: "experience", label: "Experience", max: SCORE_MAX.experience },
  { key: "performance", label: "Performance (IPCRF)", max: SCORE_MAX.performance },
  { key: "coi", label: "COI (Classroom Observation / Demo Teaching)", max: SCORE_MAX.coi },
  { key: "ncoi", label: "NCOI (Portfolio Annotation + BEI)", max: SCORE_MAX.ncoi },
];

export default async function TeacherReadinessPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const application = await getActiveApplication(userId);
  const readiness = await computeReadiness(userId, application?.id ?? null);

  return (
    <div className="bg-depedBg min-h-screen flex flex-col">
      <TeacherNav subtitle="Readiness Checker" backHref="/teacher/dashboard" />

      <main className="flex-1 px-10 py-8 max-w-3xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-textMuted text-sm font-semibold uppercase tracking-wide">
                CAReER Total Score
              </p>
              <p className="text-5xl font-extrabold text-depedBlue mt-1">
                {readiness.total}
                <span className="text-xl text-textMuted font-semibold"> / {SCORE_MAX.total}</span>
              </p>
            </div>
            <span
              className={`text-sm font-bold px-4 py-2 rounded-full ${
                readiness.requirementsMet ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {readiness.requirementsMet ? "Performance Requirements Met" : "Requirements Not Yet Met"}
            </span>
          </div>
          {readiness.targetPosition && (
            <p className="text-sm text-textMuted mt-3">
              Target position: <span className="font-semibold text-gray-700">{readiness.targetPosition}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Score Breakdown</h3>
          <div className="space-y-4">
            {ROWS.map((row) => {
              const value = readiness[row.key];
              const pct = Math.round((value / row.max) * 100);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">{row.label}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {value} / {row.max}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-depedBlue rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-textMuted mt-5">
            Education, Training, and Experience come from your Qualification Standards records.
            COI/NCOI and Performance are entered by your evaluator. Manage your records on the{" "}
            <a href="/teacher/qualifications" className="text-depedBlue font-semibold">
              Qualification Standards
            </a>{" "}
            page.
          </p>
        </div>

        <div
          className={`rounded-2xl p-8 border ${
            readiness.requirementsMet ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"
          }`}
        >
          <h3 className={`text-lg font-bold mb-3 ${readiness.requirementsMet ? "text-green-700" : "text-depedBlue"}`}>
            Performance Requirements
          </h3>
          {readiness.requirementDetails.length === 0 ? (
            <p className="text-sm text-gray-700">No target position set yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {readiness.requirementDetails.map((d, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {d}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-textMuted mt-4">
            Based on DBM-DepEd JC Form No. 2-A (RFTP) requirements for your target position, applied
            against your evaluator's Outstanding/Very Satisfactory ratings on the 37 PPST indicators.
          </p>
        </div>
        {/* auditable ETE breakdown, per DO 024 s.2025 Tables 2.a-2.c and Table 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            How your Education, Training and Experience points were computed
          </h3>
          <p className="text-xs text-textMuted mb-5">
            Points come from the increments rubric in DepEd Order No. 024, s. 2025 — the
            difference between your level and the minimum required for your target position.
          </p>
          <div className="space-y-3">
            {([
              ["Education", readiness.ete.education],
              ["Training", readiness.ete.training],
              ["Experience", readiness.ete.experience],
            ] as const).map(([label, b]) => (
              <div key={label} className="rounded-xl bg-[#F4F8FF] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{b.points} pts</span>
                </div>
                <p className="text-xs text-textMuted mt-1">
                  {b.basis} — level {b.level} vs. required level {b.baselineLevel} ={" "}
                  {b.increments} increment{b.increments === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
          {readiness.ete.incomplete && (
            <p className="text-xs text-yellow-700 mt-4">
              Set a target position on the Qualification Standards page — points cannot be
              computed without knowing the minimum requirements to compare against.
            </p>
          )}
        </div>

        <RecommendationsPanel />
      </main>
    </div>
  );
}

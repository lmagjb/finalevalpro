"use client";

import { useEffect, useState } from "react";
import StaffNav from "@/components/StaffNav";

interface RankedCandidate {
  application_id: number;
  teacher_name: string;
  school: string | null;
  target_position: string | null;
  current_stage: string;
  education_score: number;
  training_score: number;
  experience_score: number;
  performance_score: number;
  coi_score: number;
  ncoi_score: number;
  total_score: number;
  requirements_met: boolean;
  rank: number;
}

interface DemographicBucket {
  label: string;
  count: number;
  averageScore: number;
}

const STAGE_LABELS: Record<string, string> = {
  principal: "Classroom Observation",
  ao_ii: "AO II",
  psds: "PSDS",
  hr_ao_iv: "HR - AO IV",
  hrmpsb: "HRMPSB",
  sds: "SDS",
  approved: "Approved",
};

function DemographicChart({ title, buckets }: { title: string; buckets: DemographicBucket[] }) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">{title}</h3>
      {buckets.length === 0 && <p className="text-xs text-textMuted">No data yet.</p>}
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">{b.label}</span>
              <span className="text-textMuted">
                {b.count} candidate{b.count === 1 ? "" : "s"} · avg {b.averageScore}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-depedBlue rounded-full"
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AOEvaluationDashboard() {
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [demographics, setDemographics] = useState<{ bySex: DemographicBucket[]; byAgeGroup: DemographicBucket[] }>({
    bySex: [],
    byAgeGroup: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/rankings")
      .then((r) => r.json())
      .then((data) => {
        setCandidates(data.candidates ?? []);
        setDemographics(data.demographics ?? { bySex: [], byAgeGroup: [] });
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-depedBg min-h-screen flex flex-col">
      <StaffNav subtitle="AO Evaluation Dashboard" />
      <main className="flex-1 px-10 py-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Rank Recommendation</h2>
          <p className="text-textMuted text-sm mb-1">
            Candidates ranked by their CAReER total score (Education + Training + Experience +
            Performance + COI + NCOI, max 100).
          </p>
          <p className="text-xs text-textMuted">
            This is a deterministic formula against the real DBM-DepEd JC Form 2-A framework, not a
            trained model — ties are broken by Experience score.
          </p>
          </div>
          <a
            href="/ao/reports"
            className="rounded-xl bg-depedBlue px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-800 flex-shrink-0"
          >
            Reports &amp; Analytics
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && <p className="text-textMuted text-sm px-8 py-8">Loading…</p>}

          {!loading && candidates.length === 0 && (
            <div className="text-center py-16 px-8">
              <p className="text-textMuted font-medium">No submitted applications to rank yet.</p>
            </div>
          )}

          {!loading && candidates.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-textMuted">
                  <th className="px-6 py-3 font-semibold">Rank</th>
                  <th className="px-6 py-3 font-semibold">Teacher</th>
                  <th className="px-6 py-3 font-semibold">Target</th>
                  <th className="px-6 py-3 font-semibold">Stage</th>
                  <th className="px-6 py-3 font-semibold text-right">Edu</th>
                  <th className="px-6 py-3 font-semibold text-right">Train</th>
                  <th className="px-6 py-3 font-semibold text-right">Exp</th>
                  <th className="px-6 py-3 font-semibold text-right">Perf</th>
                  <th className="px-6 py-3 font-semibold text-right">COI</th>
                  <th className="px-6 py-3 font-semibold text-right">NCOI</th>
                  <th className="px-6 py-3 font-semibold text-right">Total</th>
                  <th className="px-6 py-3 font-semibold text-center">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr key={c.application_id}>
                    <td className="px-6 py-4 font-bold text-depedBlue">#{c.rank}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {c.teacher_name}
                      <div className="text-xs text-textMuted font-normal">{c.school ?? "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-textMuted">{c.target_position ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-depedBlue">
                        {STAGE_LABELS[c.current_stage] ?? c.current_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{c.education_score}</td>
                    <td className="px-6 py-4 text-right">{c.training_score}</td>
                    <td className="px-6 py-4 text-right">{c.experience_score}</td>
                    <td className="px-6 py-4 text-right">{c.performance_score}</td>
                    <td className="px-6 py-4 text-right">{c.coi_score}</td>
                    <td className="px-6 py-4 text-right">{c.ncoi_score}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{c.total_score}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          c.requirements_met ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.requirements_met ? "Met" : "Not Met"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && candidates.length > 0 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              Statistics by Demographic Profile
            </h2>
            <p className="text-textMuted text-sm mb-4">
              How ranked candidates and their average scores break down by sex and age group.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DemographicChart title="By Sex" buckets={demographics.bySex} />
              <DemographicChart title="By Age Group" buckets={demographics.byAgeGroup} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

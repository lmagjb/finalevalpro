"use client";

import { useEffect, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

interface Indicator {
  id: number;
  number: string;
  domain_number: number;
  domain_name: string;
  description: string;
  rating: "O" | "VS" | "X";
}

interface Data {
  targetPosition: string | null;
  coiScore: number | null;
  coiMaxPoints: number;
  indicators: Indicator[];
  counts: { outstanding: number; verySatisfactory: number; notRated: number; total: number };
}

const RATING_LABELS: Record<string, { label: string; style: string }> = {
  O: { label: "Outstanding", style: "bg-green-100 text-green-700" },
  VS: { label: "Very Satisfactory", style: "bg-blue-100 text-depedBlue" },
  X: { label: "Not yet rated", style: "bg-gray-100 text-gray-500" },
};

export default function TeacherCoiPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/coi")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-depedBg min-h-screen">
        <TeacherNav subtitle="COI Summary" backHref="/teacher/dashboard" />
        <main className="max-w-[1200px] mx-auto px-10 py-10">
          <p className="text-textMuted">Loading your COI summary…</p>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { counts } = data;
  const domains = Array.from(new Set(data.indicators.map((i) => i.domain_number))).sort(
    (a, b) => a - b
  );

  return (
    <div className="bg-depedBg min-h-screen">
      <TeacherNav subtitle="COI Summary" backHref="/teacher/dashboard" />

      <main className="max-w-[1200px] mx-auto px-10 py-10">
        {/* banner */}
        <div className="bg-depedBlue rounded-2xl px-8 py-7 mb-6">
          <h2 className="text-3xl font-extrabold text-white">COI Summary</h2>
          <p className="text-blue-100 text-base mt-1">
            Classroom Observable Indicators — rated by your observers
          </p>
        </div>

        <div className="rounded-2xl bg-[#F4F8FF] border border-depedBlue/10 p-6 mb-8 flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-depedBlue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold text-depedBlue">About this page</p>
            <p className="text-sm text-gray-700 mt-1">
              These ratings come from classroom observation and are recorded by your observers — you
              cannot edit them here. Where more than one observer rates you, the final rating is
              agreed at the Inter-Observer Agreement stage.
            </p>
          </div>
        </div>

        {/* counts */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Outstanding", value: counts.outstanding, color: "text-green-600" },
            { label: "Very Satisfactory", value: counts.verySatisfactory, color: "text-depedBlue" },
            { label: "Not yet rated", value: counts.notRated, color: "text-gray-400" },
            {
              label: "Total O and VS",
              value: `${counts.outstanding + counts.verySatisfactory} / ${counts.total}`,
              color: "text-gray-900",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-6"
            >
              <p className="text-sm text-textMuted font-medium">{s.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* numeric score */}
        <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-textMuted">
                COI Score
              </p>
              <p className="text-xs text-textMuted mt-1">
                From the Classroom Observation Tool, entered by your observer.
              </p>
            </div>
            <p className="text-4xl font-extrabold text-depedBlue">
              {data.coiScore ?? "—"}
              <span className="text-lg text-textMuted font-semibold"> / {data.coiMaxPoints}</span>
            </p>
          </div>
        </div>

        {/* indicators by domain */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Summary of the Achievement of PPST Indicators
        </h3>

        <div className="space-y-5">
          {domains.map((domainNum) => {
            const group = data.indicators.filter((i) => i.domain_number === domainNum);
            return (
              <div
                key={domainNum}
                className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-6"
              >
                <p className="text-sm font-bold text-depedBlue uppercase tracking-wide mb-3">
                  Domain {domainNum}: {group[0]?.domain_name}
                </p>
                <div className="divide-y divide-gray-100">
                  {group.map((ind) => (
                    <div key={ind.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-textMuted mr-2">
                          {ind.number}
                        </span>
                        <p className="text-sm text-gray-800 mt-1">{ind.description}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                          RATING_LABELS[ind.rating].style
                        }`}
                      >
                        {RATING_LABELS[ind.rating].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

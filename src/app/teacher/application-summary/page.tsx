"use client";

import { useEffect, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

interface QSItem {
  category: string;
  label: string;
  met: boolean;
  details: string;
}

interface Summary {
  applicant: {
    name: string;
    employeeNumber: string | null;
    currentRank: string | null;
    targetRank: string | null;
    school: string | null;
    division: string | null;
    level: string | null;
    salaryGrade: number | null;
    applicationDate: string | null;
  };
  qualificationStandards: { items: QSItem[]; allMet: boolean };
  performance: {
    totalO: number;
    totalVS: number;
    totalX: number;
    coiAtO: number;
    coiAtVS: number;
    coiMet: number;
    coiTotal: number;
    ncoiAtO: number;
    ncoiAtVS: number;
    ncoiMet: number;
    ncoiTotal: number;
    requirementsMet: boolean;
    requirementDetails: string[];
    ipcrf: { schoolYear: string; numericRating: number; adjectivalRating: string } | null;
  };
  career: {
    education: number;
    training: number;
    experience: number;
    performance: number;
    coi: number;
    ncoi: number;
    total: number;
    max: Record<string, number>;
  };
  readiness: { status: string; reason: string };
}

const READINESS_STYLES: Record<string, string> = {
  Qualified: "bg-green-50 border-green-200 text-green-700",
  "For Improvement": "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Not Qualified": "bg-red-50 border-red-200 text-red-700",
};

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</p>
      <p className="text-base font-semibold text-gray-900 mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

export default function ApplicationSummaryPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/application-summary")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function download() {
    if (!data) return;
    const c = data.career;
    const p = data.performance;
    const a = data.applicant;
    const text = `EVALPRO — RECLASSIFICATION FORM FOR TEACHING POSITIONS (RFTP) SUMMARY
DBM-DepEd JC Form No. 2-A
======================================================================

Name:              ${a.name}
Employee Number:   ${a.employeeNumber ?? "—"}
Current Position:  ${a.currentRank ?? "—"}${a.salaryGrade ? ` (SG ${a.salaryGrade})` : ""}
Position Applied:  ${a.targetRank ?? "—"}
Station/School:    ${a.school ?? "—"}
Division:          ${a.division ?? "—"}
Level:             ${a.level ?? "—"}

I. QUALIFICATION STANDARDS
--------------------------
${data.qualificationStandards.items
  .map((i) => `${i.label.padEnd(12)} ${i.met ? "Met" : "Not Met"} — ${i.details}`)
  .join("\n")}

II. PERFORMANCE REQUIREMENTS
-----------------------------
Total Outstanding (O):        ${p.totalO}
Total Very Satisfactory (VS): ${p.totalVS}
Not yet rated / Not met (X):  ${p.totalX}
COIs at VS or higher:         ${p.coiMet}/${p.coiTotal} (${p.coiAtO} O + ${p.coiAtVS} VS)
NCOIs at VS or higher:        ${p.ncoiMet}/${p.ncoiTotal} (${p.ncoiAtO} O + ${p.ncoiAtVS} VS)
IPCRF:                        ${p.ipcrf ? `${p.ipcrf.numericRating} (${p.ipcrf.adjectivalRating}), SY ${p.ipcrf.schoolYear}` : "No record"}
Requirements:                 ${p.requirementsMet ? "Met" : "Not Met"}
${p.requirementDetails.map((d) => `  - ${d}`).join("\n")}

III. COMPARATIVE ASSESSMENT RESULT (CAReER)
--------------------------------------------
Education:    ${c.education.toFixed(3)} / ${c.max.education}
Training:     ${c.training.toFixed(3)} / ${c.max.training}
Experience:   ${c.experience.toFixed(3)} / ${c.max.experience}
Performance:  ${c.performance.toFixed(3)} / ${c.max.performance}
COI Score:    ${c.coi.toFixed(3)} / ${c.max.coi}
NCOI Score:   ${c.ncoi.toFixed(3)} / ${c.max.ncoi}
-----------------------------------------
TOTAL SCORE:  ${c.total.toFixed(3)} / ${c.max.total}

Promotion Readiness: ${data.readiness.status}
${data.readiness.reason}

Generated: ${new Date().toLocaleString()}
This summary is generated from records on file and is not a decision.
Promotion decisions are made by the HRMPSB.
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RFTP-Summary-${a.name.replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="bg-depedBg min-h-screen">
        <TeacherNav subtitle="Application Summary" backHref="/teacher/dashboard" />
        <main className="max-w-[1000px] mx-auto px-10 py-10">
          <p className="text-textMuted">Loading your application summary…</p>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { applicant: a, qualificationStandards: qs, performance: p, career: c } = data;

  const careerRows = [
    { label: "Education", value: c.education, max: c.max.education },
    { label: "Training", value: c.training, max: c.max.training },
    { label: "Experience", value: c.experience, max: c.max.experience },
    { label: "Performance (IPCRF)", value: c.performance, max: c.max.performance },
    { label: "COI — Classroom Observation / Demo Teaching", value: c.coi, max: c.max.coi },
    { label: "NCOI — Portfolio Annotation + BEI", value: c.ncoi, max: c.max.ncoi },
  ];

  return (
    <div className="bg-depedBg min-h-screen">
      <TeacherNav subtitle="Application Summary" backHref="/teacher/dashboard" />

      <main className="max-w-[1000px] mx-auto px-10 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-depedBlue">
              DBM-DepEd JC Form No. 2-A
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              Application Summary (RFTP)
            </h2>
            <p className="text-base text-textMuted mt-1">
              Reclassification Form for Teaching Positions
            </p>
          </div>
          <button
            onClick={download}
            className="bg-depedBlue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-md flex-shrink-0"
          >
            Download summary
          </button>
        </header>

        {/* readiness */}
        <div className={`rounded-2xl border p-6 mb-8 ${READINESS_STYLES[data.readiness.status]}`}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">
            Promotion Readiness
          </p>
          <p className="text-2xl font-extrabold mt-1">{data.readiness.status}</p>
          <p className="text-sm mt-2 opacity-90">{data.readiness.reason}</p>
        </div>

        {/* applicant information */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-5">Applicant Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Field label="Name" value={a.name} />
            <Field label="Employee Number" value={a.employeeNumber} />
            <Field
              label="Current Position"
              value={a.currentRank ? `${a.currentRank}${a.salaryGrade ? ` (SG ${a.salaryGrade})` : ""}` : null}
            />
            <Field label="Position Applied For" value={a.targetRank} />
            <Field label="Station / School" value={a.school} />
            <Field label="Division" value={a.division} />
            <Field label="Level" value={a.level} />
            <Field
              label="Application Date"
              value={a.applicationDate ? new Date(a.applicationDate).toLocaleDateString() : null}
            />
          </div>
        </section>

        {/* I. Qualification Standards */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900">I. Qualification Standards</h3>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                qs.allMet ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {qs.allMet ? "All met" : "Incomplete"}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {qs.items.map((item) => (
              <div key={item.category} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">{item.label}</p>
                  <p className="text-sm text-textMuted mt-0.5">{item.details}</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                    item.met ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.met ? "Met" : "Not Met"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-textMuted mt-4">
            A standard counts as met once at least one submitted record has been verified by an
            evaluator.
          </p>
        </section>

        {/* II. Performance Requirements */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900">
              II. Performance Requirements (PPST Indicators)
            </h3>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                p.requirementsMet ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {p.requirementsMet ? "Met" : "Not Met"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-textMuted">Outstanding</p>
              <p className="text-3xl font-extrabold text-depedBlue mt-1">{p.totalO}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-textMuted">Very Satisfactory</p>
              <p className="text-3xl font-extrabold text-depedBlue mt-1">{p.totalVS}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-textMuted">Not yet rated</p>
              <p className="text-3xl font-extrabold text-gray-400 mt-1">{p.totalX}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#F4F8FF] px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">COIs at VS or higher</span>
              <span className="text-sm font-bold text-gray-900">
                {p.coiMet} / {p.coiTotal}
                <span className="font-normal text-textMuted ml-2">
                  ({p.coiAtO} O + {p.coiAtVS} VS)
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#F4F8FF] px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">NCOIs at VS or higher</span>
              <span className="text-sm font-bold text-gray-900">
                {p.ncoiMet} / {p.ncoiTotal}
                <span className="font-normal text-textMuted ml-2">
                  ({p.ncoiAtO} O + {p.ncoiAtVS} VS)
                </span>
              </span>
            </div>
            {p.ipcrf && (
              <div className="flex items-center justify-between rounded-xl bg-[#F4F8FF] px-4 py-3">
                <span className="text-sm font-semibold text-gray-800">IPCRF Rating</span>
                <span className="text-sm font-bold text-gray-900">
                  {p.ipcrf.numericRating} ({p.ipcrf.adjectivalRating})
                  <span className="font-normal text-textMuted ml-2">SY {p.ipcrf.schoolYear}</span>
                </span>
              </div>
            )}
          </div>

          {p.requirementDetails.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wide text-textMuted mb-2">
                Requirements for {a.targetRank ?? "the target position"}
              </p>
              <ul className="space-y-1">
                {p.requirementDetails.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* III. CAReER */}
        <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-5">
            III. Comparative Assessment Result (CAReER)
          </h3>
          <div className="space-y-4">
            {careerRows.map((row) => {
              const pct = row.max === 0 ? 0 : Math.round((row.value / row.max) * 100);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">{row.label}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {row.value.toFixed(3)} / {row.max}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-depedBlue rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-end justify-between">
            <span className="text-lg font-bold text-gray-900">Total Score</span>
            <span className="text-4xl font-extrabold text-depedBlue">
              {c.total.toFixed(3)}
              <span className="text-lg text-textMuted font-semibold"> / {c.max.total}</span>
            </span>
          </div>
        </section>

        <p className="text-xs text-textMuted">
          This summary is generated from the records currently on file. It is not a decision —
          promotion is determined by the HRMPSB.
        </p>
      </main>
    </div>
  );
}

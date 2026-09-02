"use client";

import { useEffect, useRef, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

type Category = "education" | "experience" | "training" | "eligibility";

interface QualificationRecord {
  id: number;
  category: Category;
  title: string;
  detail: string | null;
  institution: string | null;
  year_completed: number | null;
  document_id: number | null;
  file_name: string | null;
  points: number;
  verified: boolean;
}

const TABS: {
  key: Category;
  tab: string;
  title: string;
  subtitle: string;
  icon: JSX.Element;
}[] = [
  {
    key: "education",
    tab: "Education",
    title: "Educational Attainment",
    subtitle: "Add your degrees, units earned, and supporting documents.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    ),
  },
  {
    key: "experience",
    tab: "Experience",
    title: "Teaching Experience",
    subtitle: "Record your years of service and previous positions held.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    key: "training",
    tab: "Training",
    title: "Training & Seminars",
    subtitle: "Log the trainings you have completed and their hours.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
  },
  {
    key: "eligibility",
    tab: "Eligibility",
    title: "Professional Eligibility",
    subtitle: "Add your licences and civil service eligibilities.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

const TOTAL_QS_MAX = 100;

export default function QualificationStandardsPage() {
  const [records, setRecords] = useState<QualificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Category>("education");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [yearCompleted, setYearCompleted] = useState("");
  const [points, setPoints] = useState("");
  const [hours, setHours] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    const res = await fetch("/api/teacher/qualifications");
    const data = await res.json();
    setRecords(data.records ?? []);
    setLoading(false);
  }

  async function addRecord() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.append("category", active);
    fd.append("title", title);
    fd.append("institution", institution);
    if (yearCompleted) fd.append("yearCompleted", yearCompleted);
    fd.append("points", points || "0");
    if (active === "training" && hours) fd.append("hours", hours);
    if (file) fd.append("file", file);

    const res = await fetch("/api/teacher/qualifications", { method: "POST", body: fd });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save the record.");
      return;
    }

    setModalOpen(false);
    setTitle(""); setInstitution(""); setYearCompleted(""); setPoints(""); setHours(""); setFile(null);
    loadRecords();
  }

  async function removeRecord(id: number) {
    await fetch(`/api/teacher/qualifications/${id}`, { method: "DELETE" });
    loadRecords();
  }

  const current = TABS.find((t) => t.key === active)!;
  const visible = records.filter((r) => r.category === active);
  const totalPoints = records.reduce((s, r) => s + Number(r.points), 0);
  const verifiedPoints = records
    .filter((r) => r.verified)
    .reduce((s, r) => s + Number(r.points), 0);
  const pendingCount = visible.filter((r) => !r.verified).length;

  return (
    <div className="bg-depedBg min-h-screen">
      <TeacherNav subtitle="Qualification Standards" backHref="/teacher/dashboard" />

      <main className="max-w-[1200px] mx-auto px-10 py-8">
        {/* tabs + total */}
        <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 mb-8 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-base font-semibold border-b-2 transition-colors ${
                    isActive
                      ? "border-depedBlue text-depedBlue bg-blue-50/40"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {t.icon}
                  </svg>
                  {t.tab}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-base font-semibold text-gray-700">Total QS Points:</span>
            <span className="text-2xl font-extrabold text-depedBlue">
              {totalPoints} / {TOTAL_QS_MAX}
            </span>
          </div>
        </div>

        {/* category header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{current.title}</h2>
            <p className="text-base text-textMuted mt-1">{current.subtitle}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-depedBlue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </button>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: "Records Added",
              value: visible.length,
              bg: "bg-blue-50",
              fg: "text-depedBlue",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
            },
            {
              label: "Verified Points",
              value: verifiedPoints,
              bg: "bg-green-50",
              fg: "text-green-600",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
            {
              label: "Pending Review",
              value: pendingCount,
              bg: "bg-yellow-50",
              fg: "text-yellow-500",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${s.fg}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {s.icon}
                </svg>
              </div>
              <div>
                <p className="text-sm text-textMuted font-medium">{s.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* records */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Submitted Records</h3>

        {loading && <p className="text-textMuted text-sm">Loading…</p>}

        {!loading && visible.length === 0 && (
          <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xl font-bold text-gray-500">No records added yet.</p>
            <p className="text-base text-textMuted mt-2">
              Click &quot;Add Record&quot; to document your qualifications.
            </p>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="space-y-4">
            {visible.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <p className="text-sm text-textMuted mt-0.5">
                    {[r.institution, r.year_completed].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {r.file_name && (
                    <a
                      href={`/api/documents/${r.document_id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-semibold text-depedBlue hover:text-blue-800 mt-2"
                    >
                      {r.file_name}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      r.verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.points} pts · {r.verified ? "Verified" : "Pending"}
                  </span>
                  {!r.verified && (
                    <button
                      onClick={() => removeRecord(r.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* add record modal */}
      {modalOpen && (
        <div className="fixed w-full h-full top-0 left-0 flex items-center justify-center z-50 p-4">
          <div className="absolute w-full h-full bg-gray-900 opacity-50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Add Qualification Record</h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-textMuted mt-4">
                Adding to <span className="font-bold text-depedBlue">{current.title}</span>
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Title / Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master of Arts in Education (36 units)"
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Institution / School</label>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Philippine Normal University"
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Year Completed</label>
                    <input
                      type="number" min={1950} max={2100}
                      value={yearCompleted}
                      onChange={(e) => setYearCompleted(e.target.value)}
                      placeholder="2024"
                      className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {active === "training" ? "Training Hours" : "Claimed QS Points"}
                    </label>
                    <input
                      type="number" step={active === "training" ? "1" : "0.1"} min={0}
                      value={active === "training" ? hours : points}
                      onChange={(e) =>
                        active === "training" ? setHours(e.target.value) : setPoints(e.target.value)
                      }
                      placeholder="0"
                      className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Supporting Document (Optional)
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-depedBlue transition-colors"
                  >
                    <span className="block text-sm font-semibold text-gray-700">
                      {file ? file.name : "Click to upload"}
                    </span>
                    <span className="block text-xs text-textMuted mt-0.5">
                      PDF, JPG, or PNG (Max 10MB)
                    </span>
                  </button>
                </div>

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addRecord}
                    disabled={saving}
                    className="px-6 py-2.5 bg-depedBlue text-white rounded-xl font-semibold hover:bg-blue-800 shadow-md disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Record"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

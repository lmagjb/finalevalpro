"use client";

import { useEffect, useRef, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

interface Evidence {
  annotation: string | null;
  document_id: number | null;
  file_name: string | null;
  score: number | null;
  reviewed_at: string | null;
}

interface PaArea {
  slot: string;
  domain: string;
  description: string;
  evidence: Evidence | null;
}

interface BeiQuestion {
  slot: string;
  title: string;
  prompt: string;
  evidence: Evidence | null;
}

interface Data {
  submittedAt: string | null;
  paMaxPoints: number;
  beiMaxPoints: number;
  pa: PaArea[];
  bei: BeiQuestion[];
}

export default function NcoiEvaluationPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/teacher/ncoi");
    const d: Data = await res.json();
    setData(d);

    const a: Record<string, string> = {};
    const f: Record<string, string> = {};
    for (const item of d.pa ?? []) {
      a[`pa:${item.slot}`] = item.evidence?.annotation ?? "";
      if (item.evidence?.file_name) f[`pa:${item.slot}`] = item.evidence.file_name;
    }
    for (const item of d.bei ?? []) {
      a[`bei:${item.slot}`] = item.evidence?.annotation ?? "";
    }
    setAnswers(a);
    setFileNames(f);
    setLoading(false);
  }

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDraft() {
    setSaving(true);
    setMessage(null);
    const entries = Object.entries(answers).map(([key, annotation]) => {
      const [section, ...rest] = key.split(":");
      return { section: section as "pa" | "bei", slot: rest.join(":"), annotation };
    });
    await fetch("/api/teacher/ncoi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    setSaving(false);
    setMessage("Draft saved.");
  }

  async function upload(section: "pa" | "bei", slot: string, file: File) {
    const key = `${section}:${slot}`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("section", section);
    fd.append("slot", slot);
    const res = await fetch("/api/teacher/ncoi/document", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      setFileNames((prev) => ({ ...prev, [key]: d.fileName }));
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error ?? "Upload failed.");
    }
  }

  async function submitForReview() {
    setSubmitting(true);
    setMessage(null);
    await saveDraft();
    await fetch("/api/teacher/ncoi/submit", { method: "POST" });
    setSubmitting(false);
    setMessage("Submitted for review.");
    load();
  }

  if (loading) {
    return (
      <div className="bg-depedBg min-h-screen">
        <TeacherNav subtitle="NCOI Evaluation" backHref="/teacher/dashboard" />
        <main className="max-w-[1200px] mx-auto px-10 py-10">
          <p className="text-textMuted">Loading NCOI evaluation…</p>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const submitted = !!data.submittedAt;

  return (
    <div className="bg-depedBg min-h-screen">
      <TeacherNav subtitle="NCOI Evaluation" backHref="/teacher/dashboard" />

      <main className="max-w-[1200px] mx-auto px-10 py-10">
        {/* banner */}
        <div className="bg-depedBlue rounded-2xl px-8 py-7 mb-6 flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white">NCOI Evaluation</h2>
            <p className="text-blue-100 text-base mt-1">
              Portfolio Annotation (PA) + Behavioral Events Interview (BEI)
            </p>
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
              submitted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {submitted ? "Submitted" : "Pending Submission"}
          </span>
        </div>

        {/* instructions */}
        <div className="rounded-2xl bg-[#F4F8FF] border border-depedBlue/10 p-6 mb-8 flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-depedBlue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold text-depedBlue">Instructions</p>
            <p className="text-sm text-gray-700 mt-1">
              Annotate the Means of Verification (MOVs) from your PMES portfolio against each indicator
              below, then answer the interview questions. Assessors rate each NCOI from these
              annotations and your BEI responses. The NCOI score forms part of the Comparative
              Assessment Result (CAReER), out of 100 points.
            </p>
          </div>
        </div>

        {/* Portfolio Annotation */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900">Portfolio Annotation (PA)</h3>
          <p className="text-sm text-textMuted mt-1">
            Max {data.paMaxPoints} pts (to be scored by the observer)
          </p>
          <p className="text-sm text-textMuted mt-2 mb-5">
            Attach the MOV and write your annotation for each NCOI area. These cover PPST indicators
            from Domains 4, 5, 6 and 7 — the ones assessed from your portfolio rather than by
            classroom observation.
          </p>

          <div className="space-y-5">
            {data.pa.map((area) => {
              const key = `pa:${area.slot}`;
              const reviewed = !!area.evidence?.reviewed_at;
              return (
                <div
                  key={area.slot}
                  className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-7"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="bg-blue-100 text-depedBlue text-sm font-bold px-3 py-1 rounded-lg">
                      {area.slot}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 ${
                        reviewed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {reviewed
                        ? `Scored${area.evidence?.score !== null ? `: ${area.evidence?.score}` : ""}`
                        : "Pending Review"}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900">{area.domain}</h4>
                  <p className="text-sm text-textMuted mt-1 mb-4">{area.description}</p>

                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Evidence / Annotation
                  </label>
                  <textarea
                    value={answers[key] ?? ""}
                    onChange={(e) => setAnswer(key, e.target.value)}
                    disabled={submitted}
                    rows={4}
                    placeholder="Describe evidence or annotation for this indicator area..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none disabled:bg-gray-50"
                  />

                  <label className="block text-sm font-bold text-gray-700 mt-5 mb-2">
                    Attach MOV
                  </label>
                  <input
                    ref={(el) => {
                      fileInputs.current[key] = el;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload("pa", area.slot, f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => fileInputs.current[key]?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-4 hover:border-depedBlue transition-colors text-left disabled:opacity-60"
                  >
                    <span className="w-11 h-11 rounded-xl bg-depedBlue flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </span>
                    <span>
                      <span className="block font-bold text-gray-900">
                        {fileNames[key] ?? "Click to upload"}
                      </span>
                      <span className="block text-xs text-textMuted mt-0.5">
                        PDF, JPG, or PNG (Max 10MB)
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* BEI */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900">Behavioral Events Interview (BEI)</h3>
          <p className="text-sm text-textMuted mt-1 mb-5">
            Max {data.beiMaxPoints} pts (to be scored by the observer)
          </p>

          <div className="space-y-5">
            {data.bei.map((q) => {
              const key = `bei:${q.slot}`;
              return (
                <div
                  key={q.slot}
                  className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-7"
                >
                  <h4 className="text-lg font-bold text-gray-900">{q.title}</h4>
                  <p className="text-sm text-textMuted mt-1 mb-4">{q.prompt}</p>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Response / Notes
                  </label>
                  <textarea
                    value={answers[key] ?? ""}
                    onChange={(e) => setAnswer(key, e.target.value)}
                    disabled={submitted}
                    rows={4}
                    placeholder="Record interview response or key behavioral indicators demonstrated..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none disabled:bg-gray-50"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* actions */}
        <div className="flex items-center justify-end gap-4 pb-6">
          {message && <span className="text-sm font-semibold text-green-600">{message}</span>}
          <button
            onClick={saveDraft}
            disabled={saving || submitted}
            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={submitForReview}
            disabled={submitting || submitted}
            className="px-6 py-3 bg-depedBlue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-md disabled:opacity-60"
          >
            {submitted ? "Submitted" : submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </main>
    </div>
  );
}

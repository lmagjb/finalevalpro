"use client";

import { useEffect, useState } from "react";

interface Recommendation {
  priority: "critical" | "important" | "optional";
  category: string;
  title: string;
  detail: string;
  basis: string;
}

interface RecommendationData {
  targetPosition: string | null;
  currentScore: number;
  cohortMedian: number;
  cohortSize: number;
  reliabilityNote: string;
  recommendations: Recommendation[];
  narrative: string | null;
  provider: string | null;
}

const PRIORITY_STYLES: Record<string, { badge: string; label: string }> = {
  critical: { badge: "bg-red-100 text-red-700", label: "Must fix" },
  important: { badge: "bg-yellow-100 text-yellow-700", label: "Important" },
  optional: { badge: "bg-blue-50 text-depedBlue", label: "Optional" },
};

export default function RecommendationsPanel() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"en" | "fil">("en");

  useEffect(() => {
    load(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  async function load(lang: "en" | "fil") {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/recommendations?lang=${lang}`);
      setData(await res.json());
    } catch {
      setData(null);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
        <p className="text-textMuted">Analyzing your portfolio…</p>
      </section>
    );
  }

  if (!data) return null;

  const grouped = {
    critical: data.recommendations.filter((r) => r.priority === "critical"),
    important: data.recommendations.filter((r) => r.priority === "important"),
    optional: data.recommendations.filter((r) => r.priority === "optional"),
  };

  return (
    <section className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
      <div className="flex items-start justify-between mb-1 gap-4">
        <h3 className="text-2xl font-bold text-gray-900">What to work on next</h3>
        <div className="flex gap-1 flex-shrink-0">
          {(["en", "fil"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                language === l
                  ? "bg-depedBlue text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l === "en" ? "English" : "Filipino"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-textMuted mb-6">
        Your score: <span className="font-bold text-gray-900">{data.currentScore}</span> · Median of
        approved teachers: <span className="font-bold text-gray-900">{data.cohortMedian}</span>
        {data.targetPosition && (
          <>
            {" "}
            · Target: <span className="font-bold text-gray-900">{data.targetPosition}</span>
          </>
        )}
      </p>

      {data.narrative && (
        <div className="rounded-xl bg-[#F4F8FF] border border-depedBlue/10 p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-depedBlue mb-2">
            AI guidance
          </p>
          <div className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-line">
            {data.narrative}
          </div>
        </div>
      )}

      {data.recommendations.length === 0 ? (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-bold text-gray-500">No gaps identified.</p>
          <p className="text-sm text-textMuted mt-1">
            You meet the requirements and benchmarks currently on record.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["critical", "important", "optional"] as const).map((priority) => {
            const items = grouped[priority];
            if (items.length === 0) return null;
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_STYLES[priority].badge}`}
                  >
                    {PRIORITY_STYLES[priority].label}
                  </span>
                  <span className="text-xs text-textMuted">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((r, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-gray-900">{r.title}</p>
                        <span className="text-xs font-semibold text-textMuted flex-shrink-0">
                          {r.category}
                        </span>
                      </div>
                      {r.detail && <p className="text-sm text-textMuted mt-1.5">{r.detail}</p>}
                      <p className="text-xs text-gray-400 mt-2">{r.basis}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-textMuted mt-6 pt-5 border-t border-gray-100">
        {data.reliabilityNote} Guidance is generated from your recorded scores against DepEd
        promotion criteria — it is not a decision or a guarantee of approval.
      </p>
    </section>
  );
}

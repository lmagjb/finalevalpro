"use client";

import { useEffect, useState } from "react";

interface IndicatorItem {
  id: number;
  number: string;
  domain_number: number;
  domain_name: string;
  description: string;
  is_coi: boolean;
  rating: "O" | "VS" | "X";
}

const RATING_LABELS: Record<string, string> = { O: "Outstanding", VS: "Very Satisfactory", X: "Not Met" };
const RATING_STYLES: Record<string, string> = {
  O: "bg-green-600 text-white border-green-600",
  VS: "bg-blue-100 text-depedBlue border-depedBlue",
  X: "bg-gray-100 text-gray-500 border-gray-300",
};

export default function EvaluationPanel({ applicationId }: { applicationId: number }) {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [coiScore, setCoiScore] = useState("");
  const [ncoiScore, setNcoiScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingScores, setSavingScores] = useState(false);
  const [scoreMessage, setScoreMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/staff/applications/${applicationId}/indicators`);
    const data = await res.json();
    setIndicators(data.indicators ?? []);
    setCoiScore(data.application?.coi_numeric_score ?? "");
    setNcoiScore(data.application?.ncoi_numeric_score ?? "");
    setLoading(false);
  }

  async function setRating(indicatorId: number, rating: "O" | "VS" | "X") {
    setIndicators((prev) => prev.map((i) => (i.id === indicatorId ? { ...i, rating } : i)));
    await fetch(`/api/staff/indicators/${indicatorId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, rating }),
    });
  }

  async function saveScores() {
    setSavingScores(true);
    setScoreMessage(null);
    await fetch(`/api/staff/applications/${applicationId}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coiScore: coiScore === "" ? undefined : Number(coiScore),
        ncoiScore: ncoiScore === "" ? undefined : Number(ncoiScore),
      }),
    });
    setSavingScores(false);
    setScoreMessage("Saved.");
  }

  if (loading) {
    return <p className="text-sm text-textMuted py-3">Loading evaluation…</p>;
  }

  const domains = Array.from(new Set(indicators.map((i) => i.domain_number))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Numeric Scores</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              COI Score (Classroom Observation / Demo Teaching, max 25)
            </label>
            <input
              type="number"
              min={0}
              max={25}
              value={coiScore}
              onChange={(e) => setCoiScore(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              NCOI Score (Portfolio Annotation + BEI, max 15)
            </label>
            <input
              type="number"
              min={0}
              max={15}
              value={ncoiScore}
              onChange={(e) => setNcoiScore(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={saveScores}
            disabled={savingScores}
            className="bg-depedBlue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-60"
          >
            {savingScores ? "Saving…" : "Save Scores"}
          </button>
          {scoreMessage && <span className="text-xs font-semibold text-green-600">{scoreMessage}</span>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">
          PPST Proficient-Level Indicators (37) — rate each Outstanding / Very Satisfactory / Not Met
        </h4>
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
          {domains.map((domainNum) => {
            const group = indicators.filter((i) => i.domain_number === domainNum);
            return (
              <div key={domainNum} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-depedBlue uppercase tracking-wide mb-2">
                  Domain {domainNum}: {group[0]?.domain_name}
                </p>
                <div className="divide-y divide-gray-100">
                  {group.map((ind) => (
                    <div key={ind.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 mr-2">{ind.number}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 mr-2">
                          {ind.is_coi ? "COI" : "NCOI"}
                        </span>
                        <p className="text-sm text-gray-800 mt-1">{ind.description}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {(["X", "VS", "O"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setRating(ind.id, r)}
                            title={RATING_LABELS[r]}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition ${
                              ind.rating === r ? RATING_STYLES[r] : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

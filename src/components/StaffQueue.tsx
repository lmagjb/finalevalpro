"use client";

import { useEffect, useState } from "react";
import DocumentReviewPanel from "@/components/DocumentReviewPanel";
import EvaluationPanel from "@/components/EvaluationPanel";

interface QueueItem {
  id: number;
  teacher_name: string;
  school: string | null;
  division: string | null;
  status: string;
  division_record_no: string | null;
  target_position: string | null;
  created_at: string;
  document_count: number;
}

export default function StaffQueue({
  nextStageLabel,
  emptyMessage,
  showEvaluation = false,
}: {
  nextStageLabel: string;
  emptyMessage: string;
  showEvaluation?: boolean;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/staff/queue");
    const data = await res.json();
    setItems(data.items ?? []);
    setCounts(data.counts ?? { total: 0, pending: 0, returned: 0 });
    setLoading(false);
  }

  async function forward(id: number) {
    setBusyId(id);
    await fetch(`/api/staff/applications/${id}/forward`, { method: "POST" });
    setBusyId(null);
    load();
  }

  async function submitReturn(id: number) {
    if (!remarks.trim()) return;
    setBusyId(id);
    await fetch(`/api/staff/applications/${id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks }),
    });
    setBusyId(null);
    setReturningId(null);
    setRemarks("");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-textMuted text-sm font-semibold">In Queue</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-textMuted text-sm font-semibold">Pending Review</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-textMuted text-sm font-semibold">Returned (all time)</p>
          <p className="text-3xl font-extrabold text-red-600 mt-1">{counts.returned}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Applications</h3>
        </div>

        {loading && <p className="text-textMuted text-sm px-8 py-8">Loading…</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 px-8">
            <p className="text-textMuted font-medium">{emptyMessage}</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{item.teacher_name}</p>
                  <p className="text-sm text-textMuted mt-0.5">
                    {item.school ?? "School not set"} · {item.document_count} document
                    {item.document_count === 1 ? "" : "s"}
                    {item.division_record_no && ` · Record No. ${item.division_record_no}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {showEvaluation && (
                    <button
                      onClick={() => setEvaluatingId(evaluatingId === item.id ? null : item.id)}
                      className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50"
                    >
                      {evaluatingId === item.id ? "Hide Evaluation" : "Evaluate PPST Indicators"}
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50"
                  >
                    {expandedId === item.id ? "Hide Documents" : "Review Documents"}
                  </button>
                  <button
                    onClick={() => setReturningId(returningId === item.id ? null : item.id)}
                    disabled={busyId === item.id}
                    className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-60"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => forward(item.id)}
                    disabled={busyId === item.id}
                    className="bg-depedBlue text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 disabled:opacity-60"
                  >
                    {busyId === item.id ? "Working…" : `Forward to ${nextStageLabel}`}
                  </button>
                </div>
              </div>

              {evaluatingId === item.id && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <EvaluationPanel applicationId={item.id} />
                </div>
              )}

              {expandedId === item.id && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <DocumentReviewPanel applicationId={item.id} />
                </div>
              )}

              {returningId === item.id && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks (required)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    placeholder="Explain what needs to be corrected…"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setReturningId(null);
                        setRemarks("");
                      }}
                      className="text-sm font-semibold text-gray-600 px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReturn(item.id)}
                      disabled={!remarks.trim() || busyId === item.id}
                      className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-60"
                    >
                      Confirm Return
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

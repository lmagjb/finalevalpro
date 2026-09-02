"use client";

import { useEffect, useState } from "react";
import DocumentReviewPanel from "@/components/DocumentReviewPanel";
import EvaluationPanel from "@/components/EvaluationPanel";
import CoiChecklist from "@/components/CoiChecklist";

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

export interface BottomSection {
  title: string;
  subtitle?: string;
  empty: string;
  /** 'decision' renders the two-tile decision panel with action buttons (HR) */
  variant?: "report" | "decision";
}

export interface StaffDashboardConfig {
  eyebrow: string;
  title: string;
  actionLabel: string;
  statLabels: [string, string, string, string];
  statEmptyHints: [string, string, string, string];

  /** Tailwind grid template for the main queue / aside split */
  gridRatio: string;

  queueTitle: string;
  queueEmptyTitle: string;
  queueEmptyBody: string;

  sideTitle: string;
  sideSubtitle: string;
  checklistLabel: string;
  checklistLabel2?: string;
  remarksLabel: string;
  remarksEmpty: string;
  forwardLabel: string;
  returnLabel: string;

  /** Optional second aside panel (AO II's "Encode / log application") */
  asideExtra?: {
    title: string;
    rows: { label: string; fallback: string }[];
  };

  /** Tailwind grid template for the two lower panels */
  lowerGridRatio: string;
  lowerLeftTitle: string;
  lowerLeftSubtitle?: string;
  lowerLeftEmpty: string;
  lowerRightTitle: string;
  lowerRightSubtitle?: string;
  lowerRightEmpty: string;

  /** Zero or more full-width sections below the lower grid */
  bottomSections: BottomSection[];

  showEvaluation?: boolean;
}

const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6V7m-9 10h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function StaffDashboard({ config }: { config: StaffDashboardConfig }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showEval, setShowEval] = useState(false);

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

  async function forward() {
    if (!selectedId) return;
    setBusy(true);
    setMessage(null);
    await fetch(`/api/staff/applications/${selectedId}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks }),
    });
    setBusy(false);
    setSelectedId(null);
    setRemarks("");
    setMessage("Application forwarded.");
    load();
  }

  async function returnBack() {
    if (!selectedId) return;
    if (!remarks.trim()) {
      setMessage("Remarks are required when returning an application.");
      return;
    }
    setBusy(true);
    setMessage(null);
    await fetch(`/api/staff/applications/${selectedId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks }),
    });
    setBusy(false);
    setSelectedId(null);
    setRemarks("");
    setMessage("Application returned.");
    load();
  }

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const forwardedCount = Math.max(0, counts.total - counts.pending);
  const statValues = [counts.total, counts.pending, forwardedCount, counts.returned];

  const actionButtons = (size: "sm" | "lg" = "sm") => (
    <div className={`flex gap-${size === "lg" ? "3" : "2"}`}>
      <button
        onClick={forward}
        disabled={!selected || busy}
        className={`flex-1 rounded-xl bg-depedBlue ${
          size === "lg" ? "px-4 py-3" : "px-3 py-2.5"
        } text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50`}
      >
        {busy ? "Working…" : config.forwardLabel}
      </button>
      <button
        onClick={returnBack}
        disabled={!selected || busy}
        className={`flex-1 rounded-xl border border-slate-300 ${
          size === "lg" ? "px-4 py-3" : "px-3 py-2.5"
        } text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50`}
      >
        {config.returnLabel}
      </button>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-depedBlue">{config.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{config.title}</h2>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-depedBlue px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-800"
        >
          {config.actionLabel}
        </button>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        {config.statLabels.map((label, i) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{statValues[i]}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {statValues[i] === 0 ? config.statEmptyHints[i] : "\u00A0"}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6" style={{ gridTemplateColumns: undefined }}>
        <div className={`grid gap-6 ${config.gridRatio}`}>
          {/* queue */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">{config.queueTitle}</h3>
              <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-xs font-semibold text-depedBlue">
                {counts.pending} pending
              </span>
            </div>

            {loading && <p className="px-5 py-8 text-sm text-slate-500">Loading…</p>}

            {!loading && items.length === 0 && (
              <div className="flex min-h-[220px] items-center justify-center p-10 text-center">
                <div className="max-w-md">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF3FF] text-depedBlue shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-700">{config.queueEmptyTitle}</h4>
                  <p className="mt-2 text-sm text-slate-500">{config.queueEmptyBody}</p>
                </div>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const active = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedId(active ? null : item.id);
                        setShowDocs(false);
                        setShowEval(false);
                        setMessage(null);
                      }}
                      className={`w-full text-left px-5 py-4 transition-colors ${
                        active ? "bg-[#F4F8FF]" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{item.teacher_name}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {item.school ?? "School not set"} · {item.document_count} document
                            {item.document_count === 1 ? "" : "s"}
                            {item.target_position ? ` · ${item.target_position}` : ""}
                          </p>
                        </div>
                        {active && (
                          <span className="rounded-full bg-depedBlue px-2.5 py-1 text-xs font-semibold text-white">
                            Reviewing
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* aside */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{config.sideTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{config.sideSubtitle}</p>

              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                {selected ? (
                  <span className="font-semibold text-slate-800">{selected.teacher_name}</span>
                ) : (
                  "No applicant is being reviewed yet."
                )}
              </div>

              <div className="mt-4 space-y-3">
                {selected ? (
                  <>
                    <button
                      onClick={() => setShowDocs((v) => !v)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {showDocs ? "Hide documents" : `Review documents (${selected.document_count})`}
                    </button>
                    {config.showEvaluation && (
                      <button
                        onClick={() => setShowEval((v) => !v)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {showEval ? "Hide rating sheets" : "Rate COI / NCOI indicators"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <label className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                      <span>{config.checklistLabel}</span>
                    </label>
                    {config.checklistLabel2 && (
                      <label className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                        <span>{config.checklistLabel2}</span>
                      </label>
                    )}
                  </>
                )}
              </div>

              <div className="mt-5 rounded-xl bg-[#F4F8FF] p-3 text-sm text-slate-600">
                <p className="font-semibold text-depedBlue">{config.remarksLabel}</p>
                {selected ? (
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Write remarks (required when returning)…"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-depedBlue focus:ring-2 focus:ring-depedBlue/20"
                  />
                ) : (
                  <p className="mt-2">{config.remarksEmpty}</p>
                )}
              </div>

              {message && <p className="mt-3 text-sm font-semibold text-depedBlue">{message}</p>}

              {!config.asideExtra && <div className="mt-4">{actionButtons()}</div>}
            </section>

            {config.asideExtra && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{config.asideExtra.title}</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">{config.asideExtra.rows[0].label}</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selected?.division_record_no ?? config.asideExtra.rows[0].fallback}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">{config.asideExtra.rows[1].label}</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selected ? "Ready to forward" : config.asideExtra.rows[1].fallback}
                    </p>
                  </div>
                </div>
                <div className="mt-4">{actionButtons()}</div>
              </section>
            )}

            {selected && showDocs && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-slate-900">Documents</h3>
                <DocumentReviewPanel applicationId={selected.id} />
              </section>
            )}
          </aside>
        </div>
      </div>

      {selected && showEval && config.showEvaluation && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Rating sheets — {selected.teacher_name}
          </h3>
          <div className="mb-8">
            <CoiChecklist applicationId={selected.id} teacherName={selected.teacher_name} />
          </div>
          <div className="border-t border-slate-200 pt-6">
            <EvaluationPanel applicationId={selected.id} />
          </div>
        </section>
      )}

      <section className={`mt-8 grid gap-6 ${config.lowerGridRatio}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">{config.lowerLeftTitle}</h3>
          {config.lowerLeftSubtitle && (
            <p className="mt-1 text-sm text-slate-500">{config.lowerLeftSubtitle}</p>
          )}
          <div className="mt-4 flex min-h-[180px] items-center justify-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ClockIcon />
              </div>
              <p className="text-sm text-slate-500">
                {items.length === 0 ? config.lowerLeftEmpty : `${items.length} record(s) in this stage.`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">{config.lowerRightTitle}</h3>
          {config.lowerRightSubtitle && (
            <p className="mt-1 text-sm text-slate-500">{config.lowerRightSubtitle}</p>
          )}
          <div className="mt-4 flex min-h-[180px] items-center justify-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BarChartIcon />
              </div>
              <p className="text-sm text-slate-500">{config.lowerRightEmpty}</p>
            </div>
          </div>
        </div>
      </section>

      {config.bottomSections.map((sec) => (
        <section key={sec.title} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">{sec.title}</h3>
          {sec.subtitle && <p className="mt-1 text-sm text-slate-500">{sec.subtitle}</p>}

          {sec.variant === "decision" ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    {selected ? `Selected: ${selected.teacher_name}` : "No applicant selected for decision."}
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    {remarks.trim() ? "Remarks ready to issue." : "No deficiency remarks to issue yet."}
                  </p>
                </div>
              </div>
              <div className="mt-6">{actionButtons("lg")}</div>
            </>
          ) : (
            <div className="mt-5 flex min-h-[180px] items-center justify-center text-center">
              <div className="max-w-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <BarChartIcon />
                </div>
                <p className="text-sm text-slate-500">
                  {counts.total === 0
                    ? sec.empty
                    : `${counts.total} in queue · ${counts.returned} returned all-time.`}
                </p>
              </div>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}

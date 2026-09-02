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

type Rating = "O" | "VS" | "X";

/** Rating states carry their own colour throughout: the button, the row's
 * left rule, and the domain tally all read from this one place. */
const RATING: Record<Rating, {
  label: string;
  guide: string;
  chip: string;      // domain tally chip
  button: string;    // selected button
  rule: string;      // row left rule
  row: string;       // row background
}> = {
  O: {
    label: "Outstanding",
    guide: "Consistently exceeds what the indicator requires.",
    chip: "bg-emerald-600 text-white",
    button: "bg-emerald-600 text-white border-emerald-600",
    rule: "border-l-emerald-500",
    row: "bg-emerald-50/40",
  },
  VS: {
    label: "Very Satisfactory",
    guide: "Meets the indicator at the level expected for the position.",
    chip: "bg-depedBlue text-white",
    button: "bg-depedBlue text-white border-depedBlue",
    rule: "border-l-depedBlue",
    row: "bg-blue-50/40",
  },
  X: {
    label: "Not met / not yet observed",
    guide: "Not demonstrated, or the observation has not happened yet.",
    chip: "bg-rose-600 text-white",
    button: "bg-rose-600 text-white border-rose-600",
    rule: "border-l-rose-400",
    row: "bg-rose-50/30",
  },
};

export default function CoiChecklist({
  applicationId,
  teacherName,
}: {
  applicationId: number;
  teacherName?: string;
}) {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [coiScore, setCoiScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/staff/applications/${applicationId}/indicators`);
    const data = await res.json();
    setIndicators((data.indicators ?? []).filter((i: IndicatorItem) => i.is_coi));
    setCoiScore(data.application?.coi_numeric_score ?? "");
    setLoading(false);
  }

  async function setRating(indicatorId: number, rating: Rating) {
    setIndicators((prev) => prev.map((i) => (i.id === indicatorId ? { ...i, rating } : i)));
    await fetch(`/api/staff/indicators/${indicatorId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, rating }),
    });
  }

  async function saveScore() {
    setSavingScore(true);
    setSaved(false);
    await fetch(`/api/staff/applications/${applicationId}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coiScore: coiScore === "" ? undefined : Number(coiScore) }),
    });
    setSavingScore(false);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-slate-500 py-4">Loading the rating sheet…</p>;
  }

  const tally = (list: IndicatorItem[], r: Rating) => list.filter((i) => i.rating === r).length;
  const domains = Array.from(new Set(indicators.map((i) => i.domain_number))).sort((a, b) => a - b);
  const totalMet = tally(indicators, "O") + tally(indicators, "VS");

  return (
    <div>
      {/* header: the running total is the number observers actually care about */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h4 className="text-xl font-bold text-slate-900">
            Classroom observation rating sheet
          </h4>
          <p className="text-sm text-slate-500 mt-1">
            {teacherName ? `${teacherName} · ` : ""}
            {indicators.length} classroom observable indicators
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-slate-900 leading-none">
            {totalMet}
            <span className="text-lg text-slate-400 font-semibold"> / {indicators.length}</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">rated O or VS</p>
        </div>
      </div>

      {/* rating key — three lines, no decoration */}
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-3 py-5 border-b border-slate-200">
        {(Object.keys(RATING) as Rating[]).map((r) => (
          <div key={r} className="flex gap-2.5">
            <dt
              className={`h-6 w-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${RATING[r].chip}`}
            >
              {r}
            </dt>
            <dd className="text-sm">
              <span className="font-semibold text-slate-800">{RATING[r].label}</span>
              <span className="block text-slate-500 text-xs mt-0.5">{RATING[r].guide}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* indicators, grouped by domain */}
      <div className="divide-y divide-slate-200">
        {domains.map((domainNum) => {
          const group = indicators.filter((i) => i.domain_number === domainNum);
          const isCollapsed = collapsed[domainNum];
          return (
            <section key={domainNum}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [domainNum]: !c[domainNum] }))}
                className="w-full flex items-center justify-between gap-4 py-4 text-left group"
                aria-expanded={!isCollapsed}
              >
                <div>
                  <h5 className="font-bold text-slate-900">
                    Domain {domainNum}: {group[0]?.domain_name}
                  </h5>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {group.length} indicator{group.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(["O", "VS", "X"] as Rating[]).map((r) => {
                    const n = tally(group, r);
                    return (
                      <span
                        key={r}
                        className={`px-2 py-1 rounded text-xs font-bold tabular-nums ${
                          n > 0 ? RATING[r].chip : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {n} {r}
                      </span>
                    );
                  })}
                  <svg
                    className={`h-5 w-5 text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {!isCollapsed && (
                <ul className="pb-4 space-y-1.5">
                  {group.map((ind) => (
                    <li
                      key={ind.id}
                      className={`flex items-start gap-4 border-l-2 pl-4 pr-3 py-3 rounded-r ${RATING[ind.rating].rule} ${RATING[ind.rating].row}`}
                    >
                      <p className="text-sm text-slate-800 flex-1 leading-relaxed">
                        <span className="font-bold text-slate-900 tabular-nums">{ind.number}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        {ind.description}
                      </p>
                      <div
                        className="flex gap-1 flex-shrink-0"
                        role="group"
                        aria-label={`Rating for indicator ${ind.number}`}
                      >
                        {(["O", "VS", "X"] as Rating[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => setRating(ind.id, r)}
                            aria-pressed={ind.rating === r}
                            title={RATING[r].label}
                            className={`w-11 h-9 rounded border text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-depedBlue/40 ${
                              ind.rating === r
                                ? RATING[r].button
                                : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* COI score from the Classroom Observation Tool */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px]">
          <label htmlFor="coi-score" className="block text-sm font-bold text-slate-800">
            COI score from the Classroom Observation Tool
          </label>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">
            Out of 25. Separate from the ratings above, which decide whether the position&apos;s
            requirements are met.
          </p>
          <input
            id="coi-score"
            type="number" min={0} max={25} step="0.001"
            value={coiScore}
            onChange={(e) => { setCoiScore(e.target.value); setSaved(false); }}
            className="w-40 h-11 px-3 border border-slate-300 rounded-lg text-sm tabular-nums focus:border-depedBlue focus:ring-2 focus:ring-depedBlue/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-emerald-600">Saved</span>}
          <button
            onClick={saveScore}
            disabled={savingScore}
            className="h-11 bg-depedBlue text-white text-sm font-semibold px-6 rounded-lg hover:bg-blue-800 disabled:opacity-60"
          >
            {savingScore ? "Saving…" : "Save score"}
          </button>
        </div>
      </div>
    </div>
  );
}

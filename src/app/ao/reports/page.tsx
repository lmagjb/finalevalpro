"use client";

import { useEffect, useState } from "react";
import StaffNav from "@/components/StaffNav";

interface Bucket {
  label: string;
  count: number;
  percentage: number;
  averageScore: number;
}

interface Benchmark {
  label: string;
  max: number;
  average: number;
  median: number;
  p25: number;
  p75: number;
}

interface Pattern {
  label: string;
  count: number;
  percentage: number;
}

interface StageCount {
  stage: string;
  label: string;
  count: number;
}

interface Data {
  approvedStatistics: {
    cohortSize: number;
    isReliable: boolean;
    reliabilityNote: string;
    summary: {
      averageTotalScore: number;
      medianTotalScore: number;
      p25TotalScore: number;
      p75TotalScore: number;
      highestScore: number;
      lowestScore: number;
      requirementsMetCount: number;
      requirementsMetPercentage: number;
    };
    actionable: {
      componentBenchmarks: Benchmark[];
      byTargetPosition: Bucket[];
      byYearsOfService: Bucket[];
      commonEducation: Pattern[];
      commonTrainings: Pattern[];
      commonEligibilities: Pattern[];
      averageTrainingHours: number | null;
    };
    equity: {
      note: string;
      bySex: Bucket[];
      byAgeGroup: Bucket[];
      byHighestEducationInstitution: Bucket[];
      bySchool: Bucket[];
      byDivision: Bucket[];
    };
  };
  workflowStatistics: {
    byStage: StageCount[];
    totalInPipeline: number;
    approvedCount: number;
    returnedCount: number;
    approvalRate: number | null;
    averageDaysInStage: { stage: string; label: string; averageDays: number }[];
  };
}

function BucketBars({ buckets, empty }: { buckets: Bucket[]; empty: string }) {
  if (buckets.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="space-y-3">
      {buckets.map((b) => (
        <div key={b.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">{b.label}</span>
            <span className="text-slate-500">
              {b.count} ({b.percentage}%) · avg {b.averageScore}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-depedBlue rounded-full" style={{ width: `${(b.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500 mb-4">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/rankings")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-depedBg min-h-screen text-slate-800">
      <StaffNav subtitle="AO Evaluation Dashboard" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-depedBlue">
              Reports &amp; Analytics
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Promotion outcomes across the division
            </h2>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-depedBlue px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-800"
          >
            Export report
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading reports…</p>}

        {!loading && data && (
          <>
            {/* headline */}
            <section className="mb-8 grid gap-4 md:grid-cols-4">
              {[
                { label: "In pipeline", value: data.workflowStatistics.totalInPipeline },
                { label: "Approved", value: data.workflowStatistics.approvedCount },
                { label: "Returned", value: data.workflowStatistics.returnedCount },
                {
                  label: "Approval rate",
                  value:
                    data.workflowStatistics.approvalRate === null
                      ? "—"
                      : `${data.workflowStatistics.approvalRate}%`,
                },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">{s.value}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Applications by Status" subtitle="Where applications currently sit in the workflow.">
                {data.workflowStatistics.byStage.length === 0 ? (
                  <p className="text-sm text-slate-500">No applications submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.workflowStatistics.byStage.map((s) => {
                      const max = Math.max(1, ...data.workflowStatistics.byStage.map((x) => x.count));
                      return (
                        <div key={s.stage}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">{s.label}</span>
                            <span className="text-slate-500">{s.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-depedBlue rounded-full"
                              style={{ width: `${(s.count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <Panel
                title="Applications by Promotion Track"
                subtitle="Distribution of approved candidates across target positions."
              >
                <BucketBars
                  buckets={data.approvedStatistics.actionable.byTargetPosition}
                  empty="No approved applications yet."
                />
              </Panel>

              <Panel
                title="Average Performance vs Maximum"
                subtitle="Approved candidates' scores per CAReER component."
              >
                {data.approvedStatistics.cohortSize === 0 ? (
                  <p className="text-sm text-slate-500">No approved applications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.approvedStatistics.actionable.componentBenchmarks.map((b) => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span className="text-slate-500">
                            avg {b.average} · median {b.median} · upper {b.p75} / {b.max}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-depedBlue rounded-full"
                            style={{ width: `${(b.average / b.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Time in Stage" subtitle="Average days applications have spent at each stage.">
                {data.workflowStatistics.averageDaysInStage.length === 0 ? (
                  <p className="text-sm text-slate-500">No applications submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.workflowStatistics.averageDaysInStage.map((s) => (
                      <div
                        key={s.stage}
                        className="flex items-center justify-between rounded-xl bg-[#F4F8FF] px-4 py-2.5"
                      >
                        <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                        <span className="text-sm font-bold text-slate-900">
                          {s.averageDays} day{s.averageDays === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {/* qualifications of approved teachers */}
            <h3 className="mt-10 mb-4 text-xl font-extrabold text-slate-900">
              What approved teachers had in common
            </h3>
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Education">
                {data.approvedStatistics.actionable.commonEducation.length === 0 ? (
                  <p className="text-sm text-slate-500">No records yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.approvedStatistics.actionable.commonEducation.map((p) => (
                      <li key={p.label} className="flex justify-between text-sm">
                        <span className="text-slate-700">{p.label}</span>
                        <span className="font-bold text-slate-900">{p.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Trainings">
                {data.approvedStatistics.actionable.commonTrainings.length === 0 ? (
                  <p className="text-sm text-slate-500">No records yet.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {data.approvedStatistics.actionable.commonTrainings.map((p) => (
                        <li key={p.label} className="flex justify-between text-sm">
                          <span className="text-slate-700">{p.label}</span>
                          <span className="font-bold text-slate-900">{p.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                    {data.approvedStatistics.actionable.averageTrainingHours !== null && (
                      <p className="mt-3 text-xs text-slate-500">
                        Average total training hours:{" "}
                        <span className="font-bold text-slate-700">
                          {data.approvedStatistics.actionable.averageTrainingHours}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </Panel>

              <Panel title="Eligibilities">
                {data.approvedStatistics.actionable.commonEligibilities.length === 0 ? (
                  <p className="text-sm text-slate-500">No records yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.approvedStatistics.actionable.commonEligibilities.map((p) => (
                      <li key={p.label} className="flex justify-between text-sm">
                        <span className="text-slate-700">{p.label}</span>
                        <span className="font-bold text-slate-900">{p.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            {/* detailed statistics */}
            <h3 className="mt-10 mb-4 text-xl font-extrabold text-slate-900">Detailed Statistics</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Score distribution of approved candidates">
                {data.approvedStatistics.cohortSize === 0 ? (
                  <p className="text-sm text-slate-500">No approved applications yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Average", data.approvedStatistics.summary.averageTotalScore],
                      ["Median", data.approvedStatistics.summary.medianTotalScore],
                      ["Lower quartile", data.approvedStatistics.summary.p25TotalScore],
                      ["Upper quartile", data.approvedStatistics.summary.p75TotalScore],
                      ["Highest", data.approvedStatistics.summary.highestScore],
                      ["Lowest", data.approvedStatistics.summary.lowestScore],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl bg-[#F4F8FF] px-4 py-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-lg font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="By years of service">
                <BucketBars
                  buckets={data.approvedStatistics.actionable.byYearsOfService}
                  empty="No approved applications yet."
                />
              </Panel>
            </div>

            {/* equity monitoring */}
            <h3 className="mt-10 mb-2 text-xl font-extrabold text-slate-900">Equity Monitoring</h3>
            <p className="mb-4 max-w-3xl text-sm text-slate-500">
              {data.approvedStatistics.equity.note}
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="By sex">
                <BucketBars buckets={data.approvedStatistics.equity.bySex} empty="No data yet." />
              </Panel>
              <Panel title="By age group">
                <BucketBars buckets={data.approvedStatistics.equity.byAgeGroup} empty="No data yet." />
              </Panel>
              <Panel title="By division">
                <BucketBars buckets={data.approvedStatistics.equity.byDivision} empty="No data yet." />
              </Panel>
            </div>

            <p className="mt-8 text-xs text-slate-500">
              {data.approvedStatistics.reliabilityNote}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

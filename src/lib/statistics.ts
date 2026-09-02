import { pool } from "@/lib/db";
import { SCORE_MAX } from "@/lib/scoring";
import type { RankedCandidate } from "@/lib/staff";

// ---------------------------------------------------------------------
// Statistics on the approved cohort.
//
// Deliberately split into two halves:
//
//   actionable  — things a teacher can actually change (qualifications,
//                 score components, indicator ratings). Safe to surface to
//                 teachers and to drive recommendations from.
//
//   equity      — demographic distribution (sex, age, alma mater). For
//                 administrators to monitor fairness of outcomes. NOT used
//                 for teacher-facing advice: those attributes aren't
//                 actionable, and advising on them would be discriminatory.
// ---------------------------------------------------------------------

export interface Bucket {
  label: string;
  count: number;
  /** Share of the cohort, 0-100, rounded to 1dp */
  percentage: number;
  averageScore: number;
}

export interface Benchmark {
  label: string;
  max: number;
  average: number;
  median: number;
  p25: number;
  p75: number;
}

/** Small cohorts make percentages misleading. Anything under this is
 * reported with a caveat rather than presented as a reliable pattern. */
export const MIN_RELIABLE_COHORT = 10;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const val = lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  return Math.round(val * 10) / 10;
}

function buildBenchmark(
  label: string,
  max: number,
  values: number[]
): Benchmark {
  const sorted = [...values].sort((a, b) => a - b);
  const average =
    values.length === 0
      ? 0
      : Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
  return {
    label,
    max,
    average,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
  };
}

function bucketize(
  candidates: RankedCandidate[],
  keyFn: (c: RankedCandidate) => string | null,
  options: { includeUnspecified?: boolean } = {}
): Bucket[] {
  const total = candidates.length;
  const groups = new Map<string, RankedCandidate[]>();

  for (const c of candidates) {
    const key = keyFn(c);
    if (key === null && !options.includeUnspecified) continue;
    const label = key ?? "Not specified";
    const arr = groups.get(label) ?? [];
    arr.push(c);
    groups.set(label, arr);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => ({
      label,
      count: items.length,
      percentage: total === 0 ? 0 : Math.round((items.length / total) * 1000) / 10,
      averageScore:
        Math.round((items.reduce((s, c) => s + c.total_score, 0) / items.length) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

const AGE_BRACKETS = [
  { label: "Under 30", min: 0, max: 29 },
  { label: "30–39", min: 30, max: 39 },
  { label: "40–49", min: 40, max: 49 },
  { label: "50 and above", min: 50, max: 200 },
];

const SERVICE_BRACKETS = [
  { label: "Under 5 years", min: 0, max: 4 },
  { label: "5–9 years", min: 5, max: 9 },
  { label: "10–19 years", min: 10, max: 19 },
  { label: "20 years and above", min: 20, max: 200 },
];

function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const had =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!had) age -= 1;
  return age;
}

export interface QualificationPattern {
  label: string;
  /** How many approved teachers held this */
  count: number;
  /** Share of the cohort holding it, 0-100 */
  percentage: number;
}

/** Which qualification levels/titles the approved cohort actually held.
 * Grouped by normalized `level` where present, falling back to title. */
async function getQualificationPatterns(
  applicationIds: number[],
  cohortSize: number
): Promise<{
  education: QualificationPattern[];
  training: QualificationPattern[];
  eligibility: QualificationPattern[];
  averageTrainingHours: number | null;
}> {
  if (applicationIds.length === 0) {
    return { education: [], training: [], eligibility: [], averageTrainingHours: null };
  }

  const placeholders = applicationIds.map(() => "?").join(",");
  const [rows] = await pool.query(
    `SELECT category,
            COALESCE(NULLIF(level, ''), title) AS label,
            application_id,
            hours
     FROM qualification_records
     WHERE application_id IN (${placeholders})`,
    applicationIds
  );

  const records = rows as {
    category: string;
    label: string;
    application_id: number;
    hours: number | null;
  }[];

  function patternsFor(category: string): QualificationPattern[] {
    // Count distinct applications per label, so a teacher with three
    // records of the same level counts once.
    const byLabel = new Map<string, Set<number>>();
    for (const r of records) {
      if (r.category !== category || !r.label) continue;
      const set = byLabel.get(r.label) ?? new Set<number>();
      set.add(r.application_id);
      byLabel.set(r.label, set);
    }
    return Array.from(byLabel.entries())
      .map(([label, apps]) => ({
        label,
        count: apps.size,
        percentage: cohortSize === 0 ? 0 : Math.round((apps.size / cohortSize) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  const trainingHours = records
    .filter((r) => r.category === "training" && r.hours !== null)
    .map((r) => Number(r.hours));

  // Total hours per teacher, then averaged across teachers.
  const hoursByApp = new Map<number, number>();
  for (const r of records) {
    if (r.category !== "training" || r.hours === null) continue;
    hoursByApp.set(r.application_id, (hoursByApp.get(r.application_id) ?? 0) + Number(r.hours));
  }
  const perTeacher = Array.from(hoursByApp.values());
  const averageTrainingHours =
    perTeacher.length === 0
      ? null
      : Math.round(perTeacher.reduce((s, v) => s + v, 0) / perTeacher.length);

  return {
    education: patternsFor("education"),
    training: patternsFor("training"),
    eligibility: patternsFor("eligibility"),
    averageTrainingHours: trainingHours.length === 0 ? null : averageTrainingHours,
  };
}

export interface ApprovedStatistics {
  cohortSize: number;
  /** True when the cohort is large enough for percentages to mean much */
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

  /** Safe to surface to teachers and to drive recommendations */
  actionable: {
    componentBenchmarks: Benchmark[];
    byTargetPosition: Bucket[];
    byYearsOfService: Bucket[];
    commonEducation: QualificationPattern[];
    commonTrainings: QualificationPattern[];
    commonEligibilities: QualificationPattern[];
    averageTrainingHours: number | null;
  };

  /** Administrator-only equity monitoring. Not for teacher-facing advice. */
  equity: {
    note: string;
    bySex: Bucket[];
    byAgeGroup: Bucket[];
    byHighestEducationInstitution: Bucket[];
    bySchool: Bucket[];
    byDivision: Bucket[];
  };
}

export async function getApprovedStatistics(
  approved: RankedCandidate[]
): Promise<ApprovedStatistics> {
  const n = approved.length;
  const totals = approved.map((c) => c.total_score).sort((a, b) => a - b);

  const patterns = await getQualificationPatterns(
    approved.map((c) => c.application_id),
    n
  );

  const metCount = approved.filter((c) => c.requirements_met).length;

  return {
    cohortSize: n,
    isReliable: n >= MIN_RELIABLE_COHORT,
    reliabilityNote:
      n === 0
        ? "No approved applications yet, so there is nothing to compare against."
        : n < MIN_RELIABLE_COHORT
        ? `Based on only ${n} approved application${n === 1 ? "" : "s"}. Treat these figures as indicative, not representative — patterns are not reliable below ${MIN_RELIABLE_COHORT}.`
        : `Based on ${n} approved applications.`,

    summary: {
      averageTotalScore:
        n === 0 ? 0 : Math.round((totals.reduce((s, v) => s + v, 0) / n) * 10) / 10,
      medianTotalScore: percentile(totals, 0.5),
      p25TotalScore: percentile(totals, 0.25),
      p75TotalScore: percentile(totals, 0.75),
      highestScore: n === 0 ? 0 : totals[totals.length - 1],
      lowestScore: n === 0 ? 0 : totals[0],
      requirementsMetCount: metCount,
      requirementsMetPercentage: n === 0 ? 0 : Math.round((metCount / n) * 1000) / 10,
    },

    actionable: {
      componentBenchmarks: [
        buildBenchmark("Education", SCORE_MAX.education, approved.map((c) => c.education_score)),
        buildBenchmark("Training", SCORE_MAX.training, approved.map((c) => c.training_score)),
        buildBenchmark("Experience", SCORE_MAX.experience, approved.map((c) => c.experience_score)),
        buildBenchmark("Performance", SCORE_MAX.performance, approved.map((c) => c.performance_score)),
        buildBenchmark("COI", SCORE_MAX.coi, approved.map((c) => c.coi_score)),
        buildBenchmark("NCOI", SCORE_MAX.ncoi, approved.map((c) => c.ncoi_score)),
      ],
      byTargetPosition: bucketize(approved, (c) => c.target_position),
      byYearsOfService: bucketize(approved, (c) => {
        if (c.years_of_service === null || c.years_of_service === undefined) return null;
        const y = Number(c.years_of_service);
        return SERVICE_BRACKETS.find((b) => y >= b.min && y <= b.max)?.label ?? null;
      }),
      commonEducation: patterns.education,
      commonTrainings: patterns.training,
      commonEligibilities: patterns.eligibility,
      averageTrainingHours: patterns.averageTrainingHours,
    },

    equity: {
      note:
        "Distribution of approved candidates by demographic attribute. For monitoring fairness of outcomes only — these attributes are not actionable and are never used to generate teacher recommendations.",
      bySex: bucketize(approved, (c) => (c.sex ? c.sex.charAt(0).toUpperCase() + c.sex.slice(1) : null), { includeUnspecified: true }),
      byAgeGroup: bucketize(approved, (c) => {
        const age = ageFromBirthDate(c.birth_date);
        if (age === null) return null;
        return AGE_BRACKETS.find((b) => age >= b.min && age <= b.max)?.label ?? null;
      }, { includeUnspecified: true }),
      byHighestEducationInstitution: bucketize(approved, (c) => c.education_institution ?? null),
      bySchool: bucketize(approved, (c) => c.school),
      byDivision: bucketize(approved, (c) => c.division),
    },
  };
}

// ---------------------------------------------------------------------
// Workflow statistics: how applications move through the pipeline.
// Backs the evaluation-history and queue views, and gives administrators
// a view of where applications actually stall.
// ---------------------------------------------------------------------

export interface StageCount {
  stage: string;
  label: string;
  count: number;
}

export interface WorkflowStatistics {
  byStage: StageCount[];
  totalInPipeline: number;
  approvedCount: number;
  returnedCount: number;
  /** Approved / (approved + returned), as a percentage */
  approvalRate: number | null;
  /** Median days from submission to the latest action, per stage */
  averageDaysInStage: { stage: string; label: string; averageDays: number }[];
}

const STAGE_LABELS: Record<string, string> = {
  principal: "Classroom Observation",
  ao_ii: "AO II",
  psds: "PSDS",
  hr_ao_iv: "HR - AO IV",
  hrmpsb: "HRMPSB",
  sds: "SDS",
  approved: "Approved",
  returned: "Returned",
};

export async function getWorkflowStatistics(): Promise<WorkflowStatistics> {
  const [stageRows] = await pool.query(
    `SELECT current_stage AS stage, COUNT(*) AS count
     FROM promotion_applications
     WHERE status != 'draft'
     GROUP BY current_stage`
  );

  const byStage = (stageRows as { stage: string; count: number }[]).map((r) => ({
    stage: r.stage,
    label: STAGE_LABELS[r.stage] ?? r.stage,
    count: Number(r.count),
  }));

  const [returnedRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM application_history WHERE action = 'return'`
  );
  const returnedCount = Number((returnedRows as { count: number }[])[0]?.count ?? 0);

  const approvedCount = byStage
    .filter((s) => s.stage === "approved")
    .reduce((sum, s) => sum + s.count, 0);

  const totalInPipeline = byStage.reduce((sum, s) => sum + s.count, 0);

  // Average time an application has spent since arriving at its stage.
  const [ageRows] = await pool.query(
    `SELECT pa.current_stage AS stage,
            AVG(DATEDIFF(NOW(), COALESCE(latest.created_at, pa.created_at))) AS avg_days
     FROM promotion_applications pa
     LEFT JOIN (
       SELECT application_id, MAX(created_at) AS created_at
       FROM application_history GROUP BY application_id
     ) latest ON latest.application_id = pa.id
     WHERE pa.status != 'draft'
     GROUP BY pa.current_stage`
  );

  const averageDaysInStage = (ageRows as { stage: string; avg_days: number | null }[]).map((r) => ({
    stage: r.stage,
    label: STAGE_LABELS[r.stage] ?? r.stage,
    averageDays: r.avg_days === null ? 0 : Math.round(Number(r.avg_days) * 10) / 10,
  }));

  const decided = approvedCount + returnedCount;

  return {
    byStage,
    totalInPipeline,
    approvedCount,
    returnedCount,
    approvalRate: decided === 0 ? null : Math.round((approvedCount / decided) * 1000) / 10,
    averageDaysInStage,
  };
}

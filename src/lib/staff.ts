import { pool } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import type { UserRole } from "@/lib/db";
import { computeApplicationScore, SCORE_MAX } from "@/lib/scoring";

// Which stage each staff role's queue pulls from, and which stage their
// "forward" action sends an application to next.
export const ROLE_STAGE: Record<string, string> = {
  principal: "principal",
  ao_ii: "ao_ii",
  psds: "psds",
  hr_ao_iv: "hr_ao_iv",
};

export const NEXT_STAGE: Record<string, string> = {
  principal: "ao_ii",
  ao_ii: "psds",
  psds: "hr_ao_iv",
  hr_ao_iv: "hrmpsb",
};

const STAGE_LABEL: Record<string, string> = {
  principal: "Classroom Observation",
  ao_ii: "AO II",
  psds: "PSDS",
  hr_ao_iv: "HR - AO IV",
  hrmpsb: "HRMPSB",
  sds: "SDS",
  approved: "Approved",
  returned: "Returned",
};

export interface StaffProfileRow {
  user_id: number;
  full_name: string;
  email: string;
  role: UserRole;
  school: string | null;
  district: string | null;
  division: string | null;
  designation: string | null;
  contact_number: string | null;
}

export async function getStaffProfile(
  userId: number
): Promise<StaffProfileRow | null> {
  const [rows] = await pool.query(
    `SELECT u.id AS user_id, u.full_name, u.email, u.role,
            sp.school, sp.district, sp.division, sp.designation, sp.contact_number
     FROM users u
     LEFT JOIN staff_profiles sp ON sp.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  const list = rows as StaffProfileRow[];
  return list[0] ?? null;
}

export interface QueueItem {
  id: number;
  teacher_name: string;
  school: string | null;
  division: string | null;
  current_stage: string;
  status: string;
  division_record_no: string | null;
  target_position: string | null;
  created_at: string;
  document_count: number;
}

export async function getQueueForStage(stage: string): Promise<QueueItem[]> {
  const [rows] = await pool.query(
    `SELECT pa.id, u.full_name AS teacher_name, tp.school, tp.division,
            pa.current_stage, pa.status, pa.division_record_no, pa.target_position,
            pa.created_at,
            (SELECT COUNT(*) FROM documents d WHERE d.application_id = pa.id) AS document_count
     FROM promotion_applications pa
     JOIN users u ON u.id = pa.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE pa.current_stage = ?
     ORDER BY pa.created_at ASC`,
    [stage]
  );
  return rows as QueueItem[];
}

export async function getQueueCounts(stage: string) {
  const [[queueRow], [returnedRow]] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS cnt FROM promotion_applications WHERE current_stage = ?`,
      [stage]
    ),
    pool.query(
      `SELECT COUNT(*) AS cnt FROM application_history WHERE action = 'return' AND from_stage = ?`,
      [stage]
    ),
  ]);
  const total = (queueRow as { cnt: number }[])[0]?.cnt ?? 0;
  const returned = (returnedRow as { cnt: number }[])[0]?.cnt ?? 0;
  return { total, pending: total, returned };
}

export async function getApplicationHistory(applicationId: number) {
  const [rows] = await pool.query(
    `SELECT ah.id, ah.from_stage, ah.to_stage, ah.action, ah.remarks, ah.created_at,
            u.full_name AS actor_name
     FROM application_history ah
     LEFT JOIN users u ON u.id = ah.actor_id
     WHERE ah.application_id = ?
     ORDER BY ah.created_at DESC`,
    [applicationId]
  );
  return rows;
}

export async function forwardApplication(params: {
  applicationId: number;
  actorId: number;
  fromStage: string;
  toStage: string;
  remarks?: string;
}): Promise<void> {
  const { applicationId, actorId, fromStage, toStage, remarks } = params;

  const [appRows] = await pool.query(
    `SELECT teacher_id FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  const app = (appRows as { teacher_id: number }[])[0];

  const isFinal = toStage === "hrmpsb" || toStage === "sds" || toStage === "approved";
  const newStatus = isFinal ? "under_review" : "under_review";

  await pool.query(
    `UPDATE promotion_applications SET current_stage = ?, status = ? WHERE id = ?`,
    [toStage, newStatus, applicationId]
  );

  await pool.query(
    `INSERT INTO application_history (application_id, actor_id, from_stage, to_stage, action, remarks)
     VALUES (?, ?, ?, ?, 'forward', ?)`,
    [applicationId, actorId, fromStage, toStage, remarks ?? null]
  );

  if (app) {
    await createNotification({
      userId: app.teacher_id,
      title: "Application moved to the next stage",
      body: `Your promotion application advanced from ${STAGE_LABEL[fromStage] ?? fromStage} to ${STAGE_LABEL[toStage] ?? toStage}.`,
      type: "stage",
    });
  }
}

export async function returnApplication(params: {
  applicationId: number;
  actorId: number;
  fromStage: string;
  remarks: string;
}): Promise<void> {
  const { applicationId, actorId, fromStage, remarks } = params;

  const [appRows] = await pool.query(
    `SELECT teacher_id FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  const app = (appRows as { teacher_id: number }[])[0];

  await pool.query(
    `UPDATE promotion_applications SET current_stage = 'principal', status = 'draft' WHERE id = ?`,
    [applicationId]
  );

  await pool.query(
    `INSERT INTO application_history (application_id, actor_id, from_stage, to_stage, action, remarks)
     VALUES (?, ?, ?, 'principal', 'return', ?)`,
    [applicationId, actorId, fromStage, remarks]
  );

  if (app) {
    await createNotification({
      userId: app.teacher_id,
      title: "Application returned for revision",
      body: remarks || `Your application was returned from ${STAGE_LABEL[fromStage] ?? fromStage} for revision.`,
      type: "returned",
    });
  }
}

// ---------------------------------------------------------------------
// Document review (Observer + AO Evaluation dashboards)
// ---------------------------------------------------------------------

export interface ReviewDocumentRow {
  id: number;
  domain: number | null;
  indicator_type: "COI" | "NCOI";
  file_name: string;
  status: "pending" | "verified" | "rejected";
  remarks: string | null;
  uploaded_at: string;
}

export async function getDocumentsForApplicationReview(
  applicationId: number
): Promise<ReviewDocumentRow[]> {
  const [rows] = await pool.query(
    `SELECT id, domain, indicator_type, file_name, status, remarks, uploaded_at
     FROM documents WHERE application_id = ? ORDER BY domain ASC, uploaded_at DESC`,
    [applicationId]
  );
  return rows as ReviewDocumentRow[];
}

export async function reviewDocument(params: {
  documentId: number;
  actorId: number;
  status: "verified" | "rejected";
  remarks?: string;
}): Promise<void> {
  const { documentId, actorId, status, remarks } = params;
  await pool.query(
    `UPDATE documents SET status = ?, remarks = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [status, remarks ?? null, actorId, documentId]
  );
}

// Re-exported so API routes only need to import from @/lib/staff for the
// evaluation panel (indicator ratings + numeric COI/NCOI scores).
export {
  getIndicatorsForApplication,
  rateIndicator,
  setNumericScores,
  getQualificationRecords,
  reviewQualificationRecord,
} from "@/lib/scoring";

// ---------------------------------------------------------------------
// Rank Recommendation Engine
// Deterministic scoring: verified COI/NCOI points (capped) + capped
// years-of-service. Ranked by total score, ties broken by experience.
// ---------------------------------------------------------------------

export interface RankedCandidate {
  application_id: number;
  teacher_id: number;
  teacher_name: string;
  school: string | null;
  division: string | null;
  current_position: string | null;
  years_of_service: number | null;
  education_institution: string | null;
  target_position: string | null;
  current_stage: string;
  status: string;
  sex: "male" | "female" | null;
  birth_date: string | null;
  education_score: number;
  training_score: number;
  experience_score: number;
  performance_score: number;
  coi_score: number;
  ncoi_score: number;
  total_score: number;
  requirements_met: boolean;
  rank: number;
}

/** Pass approvedOnly to restrict to applications that have completed the
 * workflow, which is what the approved-ranking statistics report on. */
export async function getRankedCandidates(
  options: { approvedOnly?: boolean } = {}
): Promise<RankedCandidate[]> {
  const where = options.approvedOnly
    ? `pa.status = 'approved' OR pa.current_stage = 'approved'`
    : `pa.status != 'draft'`;

  const [rows] = await pool.query(
    `SELECT
       pa.id AS application_id,
       pa.teacher_id,
       u.full_name AS teacher_name,
       tp.school,
       tp.division,
       tp.current_position,
       tp.years_of_service,
       tp.education_institution,
       pa.target_position,
       pa.current_stage,
       pa.status,
       tp.sex,
       tp.birth_date
     FROM promotion_applications pa
     JOIN users u ON u.id = pa.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE ${where}`
  );

  const base = rows as Omit<
    RankedCandidate,
    | "education_score"
    | "training_score"
    | "experience_score"
    | "performance_score"
    | "coi_score"
    | "ncoi_score"
    | "total_score"
    | "requirements_met"
    | "rank"
  >[];

  const scored = await Promise.all(
    base.map(async (r) => {
      const score = await computeApplicationScore(r.application_id, r.target_position);
      return {
        ...r,
        education_score: score.education,
        training_score: score.training,
        experience_score: score.experience,
        performance_score: score.performance,
        coi_score: score.coi,
        ncoi_score: score.ncoi,
        total_score: score.total,
        requirements_met: score.requirementsMet,
      };
    })
  );

  scored.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    return b.experience_score - a.experience_score;
  });

  return scored.map((r, idx) => ({
    application_id: r.application_id,
    teacher_id: r.teacher_id,
    teacher_name: r.teacher_name,
    school: r.school,
    division: r.division,
    current_position: r.current_position,
    years_of_service: r.years_of_service,
    education_institution: r.education_institution,
    target_position: r.target_position,
    current_stage: r.current_stage,
    status: r.status,
    sex: r.sex,
    birth_date: r.birth_date,
    education_score: r.education_score,
    training_score: r.training_score,
    experience_score: r.experience_score,
    performance_score: r.performance_score,
    coi_score: r.coi_score,
    ncoi_score: r.ncoi_score,
    total_score: r.total_score,
    requirements_met: r.requirements_met,
    rank: idx + 1,
  }));
}

// ---------------------------------------------------------------------
// Demographic breakdown of ranking results (sex, age group).
// Computed from the same ranked list rather than a separate query, so
// the numbers always match what's shown in the table.
// ---------------------------------------------------------------------

export interface DemographicBucket {
  label: string;
  count: number;
  averageScore: number;
}

function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

const AGE_BRACKETS: { label: string; min: number; max: number }[] = [
  { label: "Under 30", min: 0, max: 29 },
  { label: "30–39", min: 30, max: 39 },
  { label: "40–49", min: 40, max: 49 },
  { label: "50 and above", min: 50, max: 200 },
];

function summarize(candidates: RankedCandidate[], keyFn: (c: RankedCandidate) => string | null): DemographicBucket[] {
  const groups = new Map<string, RankedCandidate[]>();
  for (const c of candidates) {
    const key = keyFn(c) ?? "Not specified";
    const bucket = groups.get(key) ?? [];
    bucket.push(c);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    count: items.length,
    averageScore: Math.round((items.reduce((sum, c) => sum + c.total_score, 0) / items.length) * 10) / 10,
  }));
}

export function getDemographicBreakdown(candidates: RankedCandidate[]) {
  const bySex = summarize(candidates, (c) =>
    c.sex ? c.sex.charAt(0).toUpperCase() + c.sex.slice(1) : null
  );

  const byAgeGroup = summarize(candidates, (c) => {
    const age = ageFromBirthDate(c.birth_date);
    if (age === null) return null;
    const bracket = AGE_BRACKETS.find((b) => age >= b.min && age <= b.max);
    return bracket?.label ?? null;
  });

  return { bySex, byAgeGroup };
}

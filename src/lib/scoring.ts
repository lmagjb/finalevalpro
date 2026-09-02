import { pool } from "@/lib/db";
import { computeEte, type EteResult } from "@/lib/ete-rubric";

// Performance requirements per target position, from DBM-DepEd JC Form
// No. 2-A (RFTP), Annex I-3. Used as a pass/fail gate, separate from the
// numeric CAReER score below.
export interface PerformanceRequirement {
  position: string;
  coiRequirement: string;
  ncoiRequirement: string;
  minCOIsAtO?: number;
  minCOIsAtVS?: number;
  minNCOIsAtO?: number;
  minNCOIsAtVS?: number;
}

export const PERFORMANCE_REQUIREMENTS: PerformanceRequirement[] = [
  { position: "Teacher II", coiRequirement: "At least 6 Proficient COIs at Very Satisfactory", ncoiRequirement: "At least 4 Proficient NCOIs at Very Satisfactory", minCOIsAtVS: 6, minNCOIsAtVS: 4 },
  { position: "Teacher III", coiRequirement: "At least 12 Proficient COIs at Very Satisfactory", ncoiRequirement: "At least 8 Proficient NCOIs at Very Satisfactory", minCOIsAtVS: 12, minNCOIsAtVS: 8 },
  { position: "Teacher IV", coiRequirement: "21 Proficient COIs at Very Satisfactory", ncoiRequirement: "16 Proficient NCOIs at Very Satisfactory", minCOIsAtVS: 21, minNCOIsAtVS: 16 },
  { position: "Teacher V", coiRequirement: "At least 6 Proficient COIs at Outstanding", ncoiRequirement: "At least 4 Proficient NCOIs at Outstanding", minCOIsAtO: 6, minNCOIsAtO: 4 },
  { position: "Teacher VI", coiRequirement: "At least 12 Proficient COIs at Outstanding", ncoiRequirement: "At least 4 NCOIs at VS and 4 NCOIs at Outstanding", minCOIsAtO: 12, minNCOIsAtVS: 4, minNCOIsAtO: 4 },
  { position: "Teacher VII", coiRequirement: "At least 18 Proficient COIs at Outstanding", ncoiRequirement: "At least 6 NCOIs at VS and 6 NCOIs at Outstanding", minCOIsAtO: 18, minNCOIsAtVS: 6, minNCOIsAtO: 6 },
  { position: "Master Teacher I", coiRequirement: "21 Proficient COIs at Outstanding; and 8 Proficient NCOIs at VS", ncoiRequirement: "8 Proficient NCOIs at Outstanding", minCOIsAtO: 21, minNCOIsAtVS: 8, minNCOIsAtO: 8 },
  { position: "Master Teacher II", coiRequirement: "At least 10 Highly Proficient COIs at Outstanding", ncoiRequirement: "At least 5 Highly Proficient NCOIs at VS", minCOIsAtO: 10, minNCOIsAtVS: 5 },
  { position: "Master Teacher III", coiRequirement: "21 Highly Proficient COIs at Outstanding", ncoiRequirement: "8 Highly Proficient NCOIs at VS and 8 at Outstanding", minCOIsAtO: 21, minNCOIsAtVS: 8, minNCOIsAtO: 8 },
];

export const SCORE_MAX = {
  education: 10,
  training: 10,
  experience: 10,
  performance: 30,
  coi: 25,
  ncoi: 15,
  total: 100,
};

export interface IndicatorWithRating {
  id: number;
  number: string;
  domain_number: number;
  domain_name: string;
  description: string;
  is_coi: boolean;
  rating: "O" | "VS" | "X";
}

export async function getIndicatorsForApplication(
  applicationId: number
): Promise<IndicatorWithRating[]> {
  const [rows] = await pool.query(
    `SELECT pi.id, pi.number, pi.domain_number, pi.domain_name, pi.description, pi.is_coi,
            COALESCE(ir.rating, 'X') AS rating
     FROM ppst_indicators pi
     LEFT JOIN indicator_ratings ir
       ON ir.indicator_id = pi.id AND ir.application_id = ?
     ORDER BY pi.id ASC`,
    [applicationId]
  );
  return (rows as { is_coi: number | boolean }[]).map((r) => ({
    ...(r as unknown as IndicatorWithRating),
    is_coi: !!r.is_coi,
  }));
}

export async function rateIndicator(params: {
  applicationId: number;
  indicatorId: number;
  rating: "O" | "VS" | "X";
  actorId: number;
}): Promise<void> {
  const { applicationId, indicatorId, rating, actorId } = params;
  await pool.query(
    `INSERT INTO indicator_ratings (application_id, indicator_id, rating, rated_by, rated_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), rated_by = VALUES(rated_by), rated_at = NOW()`,
    [applicationId, indicatorId, rating, actorId]
  );
}

export function checkPerformanceRequirements(
  targetPosition: string | null,
  indicators: IndicatorWithRating[]
): { met: boolean; details: string[] } {
  const req = PERFORMANCE_REQUIREMENTS.find((r) => r.position === targetPosition);
  if (!req) {
    return { met: false, details: ["No target position set yet."] };
  }

  const coi = indicators.filter((i) => i.is_coi);
  const ncoi = indicators.filter((i) => !i.is_coi);
  const coiAtO = coi.filter((i) => i.rating === "O").length;
  const coiAtVS = coi.filter((i) => i.rating === "VS").length;
  const ncoiAtO = ncoi.filter((i) => i.rating === "O").length;
  const ncoiAtVS = ncoi.filter((i) => i.rating === "VS").length;

  const details: string[] = [];
  let met = true;

  if (req.minCOIsAtO) {
    const ok = coiAtO >= req.minCOIsAtO;
    details.push(`COIs at Outstanding: ${coiAtO}/${req.minCOIsAtO} ${ok ? "(Met)" : "(Not Met)"}`);
    if (!ok) met = false;
  }
  if (req.minCOIsAtVS) {
    const total = coiAtO + coiAtVS;
    const ok = total >= req.minCOIsAtVS;
    details.push(`COIs at VS or higher: ${total}/${req.minCOIsAtVS} ${ok ? "(Met)" : "(Not Met)"}`);
    if (!ok) met = false;
  }
  if (req.minNCOIsAtO) {
    const ok = ncoiAtO >= req.minNCOIsAtO;
    details.push(`NCOIs at Outstanding: ${ncoiAtO}/${req.minNCOIsAtO} ${ok ? "(Met)" : "(Not Met)"}`);
    if (!ok) met = false;
  }
  if (req.minNCOIsAtVS) {
    const total = ncoiAtO + ncoiAtVS;
    const ok = total >= req.minNCOIsAtVS;
    details.push(`NCOIs at VS or higher: ${total}/${req.minNCOIsAtVS} ${ok ? "(Met)" : "(Not Met)"}`);
    if (!ok) met = false;
  }

  return { met, details };
}

export interface QualificationRecord {
  id: number;
  category: "education" | "training" | "experience" | "eligibility";
  title: string;
  detail: string | null;
  institution: string | null;
  hours: number | null;
  year_completed: number | null;
  document_id: number | null;
  file_name: string | null;
  points: number;
  verified: boolean;
}

export async function getQualificationRecords(applicationId: number): Promise<QualificationRecord[]> {
  const [rows] = await pool.query(
    `SELECT q.id, q.category, q.title, q.detail, q.institution, q.hours, q.year_completed,
            q.document_id, d.file_name, q.points, q.verified
     FROM qualification_records q
     LEFT JOIN documents d ON d.id = q.document_id
     WHERE q.application_id = ? ORDER BY q.category, q.created_at`,
    [applicationId]
  );
  return (rows as { verified: number | boolean }[]).map((r) => ({
    ...(r as unknown as QualificationRecord),
    verified: !!r.verified,
  }));
}

export async function addQualificationRecord(params: {
  applicationId: number;
  category: "education" | "training" | "experience" | "eligibility";
  title: string;
  detail?: string;
  institution?: string;
  hours?: number;
  yearCompleted?: number;
  documentId?: number;
  points: number;
}): Promise<number> {
  const { applicationId, category, title, detail, institution, hours, yearCompleted, documentId, points } = params;
  const [result] = await pool.query(
    `INSERT INTO qualification_records
       (application_id, category, title, detail, institution, hours, year_completed, document_id, points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [applicationId, category, title, detail ?? null, institution ?? null, hours ?? null,
     yearCompleted ?? null, documentId ?? null, points]
  );
  // @ts-expect-error mysql2 OkPacket typing
  return result.insertId as number;
}

export async function deleteQualificationRecord(id: number, applicationId: number): Promise<void> {
  await pool.query(`DELETE FROM qualification_records WHERE id = ? AND application_id = ?`, [
    id,
    applicationId,
  ]);
}

export async function reviewQualificationRecord(params: {
  id: number;
  points: number;
  verified: boolean;
}): Promise<void> {
  await pool.query(`UPDATE qualification_records SET points = ?, verified = ? WHERE id = ?`, [
    params.points,
    params.verified,
    params.id,
  ]);
}

export async function getLatestIpcrf(applicationId: number) {
  const [rows] = await pool.query(
    `SELECT school_year, numeric_rating, adjectival_rating
     FROM ipcrf_records WHERE application_id = ? ORDER BY school_year DESC LIMIT 1`,
    [applicationId]
  );
  const list = rows as { school_year: string; numeric_rating: number; adjectival_rating: string }[];
  return list[0] ?? null;
}

export async function addIpcrfRecord(params: {
  applicationId: number;
  schoolYear: string;
  numericRating: number;
  adjectivalRating: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO ipcrf_records (application_id, school_year, numeric_rating, adjectival_rating)
     VALUES (?, ?, ?, ?)`,
    [params.applicationId, params.schoolYear, params.numericRating, params.adjectivalRating]
  );
}

export async function setNumericScores(params: {
  applicationId: number;
  coiScore?: number;
  ncoiScore?: number;
}): Promise<void> {
  const updates: string[] = [];
  const values: (number | null)[] = [];
  if (params.coiScore !== undefined) {
    updates.push("coi_numeric_score = ?");
    values.push(Math.min(SCORE_MAX.coi, params.coiScore));
  }
  if (params.ncoiScore !== undefined) {
    updates.push("ncoi_numeric_score = ?");
    values.push(Math.min(SCORE_MAX.ncoi, params.ncoiScore));
  }
  if (updates.length === 0) return;
  values.push(params.applicationId);
  await pool.query(
    `UPDATE promotion_applications SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
}

export interface ApplicationScore {
  /** Auditable breakdown behind the Education/Training/Experience points */
  ete: EteResult;
  education: number;
  training: number;
  experience: number;
  performance: number;
  coi: number;
  ncoi: number;
  total: number;
  requirementsMet: boolean;
  requirementDetails: string[];
  targetPosition: string | null;
}

/** IPCRF is on a 1.000–5.000 scale where 5 = Outstanding; converted
 * linearly onto the 0–30 performance point range. This conversion curve
 * is a reasonable simplification, not an officially published formula —
 * only the 30-point ceiling itself is sourced. */
function ipcrfToPerformanceScore(numericRating: number | null): number {
  if (numericRating === null) return 0;
  const pct = Math.min(1, Math.max(0, numericRating / 5));
  return Math.round(pct * SCORE_MAX.performance * 10) / 10;
}

export async function computeApplicationScore(
  applicationId: number,
  targetPosition: string | null
): Promise<ApplicationScore> {
  const [qualRows, ipcrf, indicators, appRows] = await Promise.all([
    getQualificationRecords(applicationId),
    getLatestIpcrf(applicationId),
    getIndicatorsForApplication(applicationId),
    pool.query(
      `SELECT coi_numeric_score, ncoi_numeric_score FROM promotion_applications WHERE id = ? LIMIT 1`,
      [applicationId]
    ),
  ]);

  // Education, Training and Experience are computed from the official
  // increments rubric, not from self-declared points. Training hours come
  // from the teacher's logged training records; education and experience
  // come from the profile.
  const [profileRows] = await pool.query(
    `SELECT tp.education_units, tp.has_masters_degree, tp.months_of_service, tp.years_of_service
     FROM promotion_applications pa
     JOIN teacher_profiles tp ON tp.user_id = pa.teacher_id
     WHERE pa.id = ? LIMIT 1`,
    [applicationId]
  );
  const prof = (profileRows as {
    education_units: number | null;
    has_masters_degree: number | boolean | null;
    months_of_service: number | null;
    years_of_service: number | null;
  }[])[0];

  const trainingHours = qualRows
    .filter((r) => r.category === "training")
    .reduce((sum, r) => sum + Number(r.hours ?? 0), 0);

  const ete = computeEte({
    targetPosition,
    educationUnits: Number(prof?.education_units ?? 0),
    hasMastersDegree: !!prof?.has_masters_degree,
    trainingHours,
    experienceMonths: Number(
      prof?.months_of_service ?? (prof?.years_of_service ?? 0) * 12
    ),
  });

  const education = ete.education.points;
  const training = ete.training.points;
  const experience = ete.experience.points;
  const performance = ipcrfToPerformanceScore(ipcrf?.numeric_rating ?? null);

  const appRow = (appRows[0] as { coi_numeric_score: number | null; ncoi_numeric_score: number | null }[])[0];
  const coi = Math.min(SCORE_MAX.coi, appRow?.coi_numeric_score ?? 0);
  const ncoi = Math.min(SCORE_MAX.ncoi, appRow?.ncoi_numeric_score ?? 0);

  const total = education + training + experience + performance + coi + ncoi;
  const { met, details } = checkPerformanceRequirements(targetPosition, indicators);

  return {
    ete,
    education,
    training,
    experience,
    performance,
    coi,
    ncoi,
    total: Math.round(total * 10) / 10,
    requirementsMet: met,
    requirementDetails: details,
    targetPosition,
  };
}

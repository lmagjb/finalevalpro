import { pool } from "@/lib/db";
import { computeApplicationScore } from "@/lib/scoring";
import { computeEte } from "@/lib/ete-rubric";

export const PPST_DOMAINS: { id: number; title: string }[] = [
  { id: 1, title: "Content Knowledge and Pedagogy" },
  { id: 2, title: "Learning Environment" },
  { id: 3, title: "Diversity of Learners" },
  { id: 4, title: "Curriculum and Planning" },
  { id: 5, title: "Assessment and Reporting" },
  { id: 6, title: "Community Linkages and Professional Engagement" },
  { id: 7, title: "Personal Growth and Professional Development" },
];

export const STAGE_ORDER = [
  "principal",
  "ao_ii",
  "psds",
  "hr_ao_iv",
  "hrmpsb",
  "sds",
] as const;

export type Stage = (typeof STAGE_ORDER)[number] | "approved" | "returned";

export interface TeacherProfileRow {
  user_id: number;
  full_name: string;
  email: string;
  employee_number: string | null;
  school: string | null;
  division: string | null;
  contact_number: string | null;
  education_units: number | null;
  has_masters_degree: number | boolean | null;
  months_of_service: number | null;
  salary_grade: number | null;
  school_level: string | null;
  sex: "male" | "female" | null;
  birth_date: string | null;
  current_position: string | null;
  years_of_service: number;
}

export async function getTeacherProfile(
  userId: number
): Promise<TeacherProfileRow | null> {
  const [rows] = await pool.query(
    `SELECT u.id AS user_id, u.full_name, u.email,
            tp.employee_number, tp.school, tp.division, tp.contact_number,
            tp.sex, tp.birth_date, tp.education_units, tp.has_masters_degree, tp.months_of_service, tp.salary_grade, tp.school_level, tp.current_position, tp.years_of_service
     FROM users u
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  const list = rows as TeacherProfileRow[];
  return list[0] ?? null;
}

export async function updateTeacherProfile(
  userId: number,
  fields: {
    school?: string;
    division?: string;
    email?: string;
    contactNumber?: string;
    sex?: "male" | "female";
    birthDate?: string;
    educationUnits?: number;
    hasMastersDegree?: boolean;
    monthsOfService?: number;
    salaryGrade?: number;
    schoolLevel?: string;
  }
): Promise<void> {
  if (fields.email) {
    await pool.query("UPDATE users SET email = ? WHERE id = ?", [
      fields.email.toLowerCase(),
      userId,
    ]);
  }
  await pool.query(
    `INSERT INTO teacher_profiles (user_id, school, division, contact_number, sex, birth_date, education_units, has_masters_degree, months_of_service, salary_grade, school_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       school = COALESCE(VALUES(school), school),
       division = COALESCE(VALUES(division), division),
       contact_number = COALESCE(VALUES(contact_number), contact_number),
       sex = COALESCE(VALUES(sex), sex),
       birth_date = COALESCE(VALUES(birth_date), birth_date),
       education_units = COALESCE(VALUES(education_units), education_units),
       has_masters_degree = COALESCE(VALUES(has_masters_degree), has_masters_degree),
       months_of_service = COALESCE(VALUES(months_of_service), months_of_service),
       salary_grade = COALESCE(VALUES(salary_grade), salary_grade),
       school_level = COALESCE(VALUES(school_level), school_level)`,
    [
      userId,
      fields.school ?? null,
      fields.division ?? null,
      fields.contactNumber ?? null,
      fields.sex ?? null,
      fields.birthDate ?? null,
      fields.educationUnits ?? null,
      fields.hasMastersDegree ?? null,
      fields.monthsOfService ?? null,
      fields.salaryGrade ?? null,
      fields.schoolLevel ?? null,
    ]
  );
}

export interface ApplicationRow {
  id: number;
  status: string;
  current_stage: Stage;
  total_score: number | null;
  target_position: string | null;
  created_at: string;
}

export async function getActiveApplication(
  teacherId: number
): Promise<ApplicationRow | null> {
  const [rows] = await pool.query(
    `SELECT id, status, current_stage, total_score, target_position, created_at
     FROM promotion_applications
     WHERE teacher_id = ? AND status IN ('submitted','under_review')
     ORDER BY created_at DESC LIMIT 1`,
    [teacherId]
  );
  const list = rows as ApplicationRow[];
  return list[0] ?? null;
}

export interface DocumentRow {
  id: number;
  application_id: number;
  domain: number | null;
  indicator_type: "COI" | "NCOI";
  file_name: string;
  mime_type: string | null;
  status: "pending" | "verified" | "rejected";
  uploaded_at: string;
}

/** Ensures the teacher has a draft application to attach documents to,
 * creating one if they don't have any application yet. */
export async function ensureDraftApplication(teacherId: number): Promise<number> {
  const [rows] = await pool.query(
    `SELECT id FROM promotion_applications WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 1`,
    [teacherId]
  );
  const existing = rows as { id: number }[];
  if (existing[0]) return existing[0].id;

  const [result] = await pool.query(
    `INSERT INTO promotion_applications (teacher_id, status, current_stage) VALUES (?, 'draft', 'principal')`,
    [teacherId]
  );
  // @ts-expect-error mysql2 OkPacket typing
  return result.insertId as number;
}

/** Submits the teacher's draft application into the review workflow. */
export async function submitApplication(teacherId: number): Promise<void> {
  const applicationId = await ensureDraftApplication(teacherId);
  await pool.query(
    `UPDATE promotion_applications SET status = 'submitted', current_stage = 'principal' WHERE id = ?`,
    [applicationId]
  );
  await pool.query(
    `INSERT INTO application_history (application_id, actor_id, from_stage, to_stage, action, remarks)
     VALUES (?, ?, NULL, 'principal', 'forward', 'Submitted by teacher')`,
    [applicationId, teacherId]
  );
}

export async function getDocumentsForApplication(
  applicationId: number
): Promise<DocumentRow[]> {
  const [rows] = await pool.query(
    `SELECT id, application_id, domain, indicator_type, file_name, mime_type, status, uploaded_at
     FROM documents WHERE application_id = ? ORDER BY domain ASC, uploaded_at DESC`,
    [applicationId]
  );
  return rows as DocumentRow[];
}

export async function getDocumentsForDomain(
  applicationId: number,
  domain: number
): Promise<DocumentRow[]> {
  const [rows] = await pool.query(
    `SELECT id, application_id, domain, indicator_type, file_name, mime_type, status, uploaded_at
     FROM documents WHERE application_id = ? AND domain = ? ORDER BY uploaded_at DESC`,
    [applicationId, domain]
  );
  return rows as DocumentRow[];
}

export async function insertDocument(params: {
  applicationId: number;
  domain: number;
  indicatorType: "COI" | "NCOI";
  fileName: string;
  mimeType: string;
  fileData: Buffer;
}): Promise<number> {
  const { applicationId, domain, indicatorType, fileName, mimeType, fileData } = params;
  const [result] = await pool.query(
    `INSERT INTO documents (application_id, domain, indicator_type, file_name, mime_type, file_data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [applicationId, domain, indicatorType, fileName, mimeType, fileData]
  );
  // @ts-expect-error mysql2 OkPacket typing
  return result.insertId as number;
}

export async function getDocumentFile(
  documentId: number
): Promise<{ file_name: string; mime_type: string | null; file_data: Buffer } | null> {
  const [rows] = await pool.query(
    `SELECT file_name, mime_type, file_data FROM documents WHERE id = ? LIMIT 1`,
    [documentId]
  );
  const list = rows as { file_name: string; mime_type: string | null; file_data: Buffer }[];
  return list[0] ?? null;
}

export async function getDocumentStatsForApplication(
  applicationId: number
): Promise<{ total: number; verified: number; pending: number }> {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
     FROM documents WHERE application_id = ?`,
    [applicationId]
  );
  const list = rows as { total: number; verified: number; pending: number }[];
  return list[0] ?? { total: 0, verified: 0, pending: 0 };
}

export async function computeReadiness(teacherId: number, applicationId: number | null) {
  if (!applicationId) {
    const emptyEte = computeEte({
      targetPosition: null,
      educationUnits: 0,
      hasMastersDegree: false,
      trainingHours: 0,
      experienceMonths: 0,
    });
    return {
      ete: emptyEte,
      education: 0,
      training: 0,
      experience: 0,
      performance: 0,
      coi: 0,
      ncoi: 0,
      total: 0,
      requirementsMet: false,
      requirementDetails: ["No active application yet."],
      targetPosition: null as string | null,
    };
  }

  const [appRows] = await pool.query(
    `SELECT target_position FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  const targetPosition = (appRows as { target_position: string | null }[])[0]?.target_position ?? null;

  return computeApplicationScore(applicationId, targetPosition);
}

export async function setTargetPosition(applicationId: number, targetPosition: string): Promise<void> {
  await pool.query(`UPDATE promotion_applications SET target_position = ? WHERE id = ?`, [
    targetPosition,
    applicationId,
  ]);
}

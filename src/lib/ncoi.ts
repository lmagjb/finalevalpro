import { pool } from "@/lib/db";

// ---------------------------------------------------------------------
// NCOI Evaluation — Portfolio Annotation (PA) and Behavioural Events
// Interview (BEI).
//
// The PA areas and BEI questions are fixed by the RFTP process, so they
// are defined here rather than stored as rows. Teacher responses live in
// the ncoi_evidence table, keyed by slot.
// ---------------------------------------------------------------------

export interface PaArea {
  slot: string;
  domain: string;
  description: string;
}

export const PA_AREAS: PaArea[] = [
  {
    slot: "4.4.2",
    domain: "Domain 4: Curriculum and Planning",
    description: "Participation in collegial discussions using teacher and learner feedback",
  },
  {
    slot: "4.5.2",
    domain: "Domain 4: Curriculum and Planning",
    description:
      "Selection and use of appropriate teaching and learning resources including ICT",
  },
  {
    slot: "5.1.2 - 5.5.2",
    domain: "Domain 5: Assessment and Reporting",
    description:
      "Design, selection, organisation and use of assessment strategies, and communication of learner needs and progress",
  },
  {
    slot: "6.1.2 - 6.4.2",
    domain: "Domain 6: Community Linkages",
    description:
      "Engagement with parents and the wider school community, and adherence to school policies and procedures",
  },
  {
    slot: "7.1.2 - 7.5.2",
    domain: "Domain 7: Personal Growth",
    description:
      "Professional ethics, reflection on practice, and pursuit of professional development goals",
  },
];

export interface BeiQuestion {
  slot: string;
  title: string;
  prompt: string;
}

export const BEI_QUESTIONS: BeiQuestion[] = [
  {
    slot: "Q1",
    title: "BEI Q1: Professional Competence",
    prompt:
      "Describe a situation where you applied your content knowledge or pedagogy to improve learner outcomes.",
  },
  {
    slot: "Q2",
    title: "BEI Q2: Leadership & Initiative",
    prompt:
      "Describe an instance where you took the lead on a school initiative or supported colleagues without being asked.",
  },
  {
    slot: "Q3",
    title: "BEI Q3: Community Engagement",
    prompt:
      "Describe how you engaged parents or the wider community to support learning.",
  },
  {
    slot: "Q4",
    title: "BEI Q4: Professional Development",
    prompt:
      "Describe how you identified a development need and what you did to address it.",
  },
  {
    slot: "Q5",
    title: "BEI Q5: Problem Solving",
    prompt:
      "Describe a challenging situation in your practice and how you resolved it.",
  },
];

export const PA_MAX_POINTS = 10;
export const BEI_MAX_POINTS = 5;

export interface EvidenceRow {
  section: "pa" | "bei";
  slot: string;
  annotation: string | null;
  document_id: number | null;
  file_name: string | null;
  score: number | null;
  reviewed_at: string | null;
}

export async function getNcoiEvidence(applicationId: number): Promise<EvidenceRow[]> {
  const [rows] = await pool.query(
    `SELECT e.section, e.slot, e.annotation, e.document_id, d.file_name,
            e.score, e.reviewed_at
     FROM ncoi_evidence e
     LEFT JOIN documents d ON d.id = e.document_id
     WHERE e.application_id = ?`,
    [applicationId]
  );
  return rows as EvidenceRow[];
}

export async function saveNcoiAnnotation(params: {
  applicationId: number;
  section: "pa" | "bei";
  slot: string;
  annotation: string;
}): Promise<void> {
  const { applicationId, section, slot, annotation } = params;
  await pool.query(
    `INSERT INTO ncoi_evidence (application_id, section, slot, annotation)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE annotation = VALUES(annotation)`,
    [applicationId, section, slot, annotation]
  );
}

export async function attachNcoiDocument(params: {
  applicationId: number;
  section: "pa" | "bei";
  slot: string;
  documentId: number;
}): Promise<void> {
  const { applicationId, section, slot, documentId } = params;
  await pool.query(
    `INSERT INTO ncoi_evidence (application_id, section, slot, document_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE document_id = VALUES(document_id)`,
    [applicationId, section, slot, documentId]
  );
}

export async function getNcoiSubmittedAt(applicationId: number): Promise<string | null> {
  const [rows] = await pool.query(
    `SELECT ncoi_submitted_at FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  return (rows as { ncoi_submitted_at: string | null }[])[0]?.ncoi_submitted_at ?? null;
}

export async function submitNcoi(applicationId: number): Promise<void> {
  await pool.query(
    `UPDATE promotion_applications SET ncoi_submitted_at = NOW() WHERE id = ?`,
    [applicationId]
  );
}

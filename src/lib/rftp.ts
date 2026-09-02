import { pool } from "@/lib/db";
import {
  computeApplicationScore,
  getIndicatorsForApplication,
  getQualificationRecords,
  getLatestIpcrf,
  SCORE_MAX,
} from "@/lib/scoring";

// ---------------------------------------------------------------------
// RFTP application summary (DBM-DepEd JC Form No. 2-A).
//
// Assembles the three parts of the official form from records already in
// the database:
//   I.   Qualification Standards  — from qualification_records
//   II.  Performance Requirements — from indicator_ratings
//   III. Comparative Assessment   — from the scoring engine (CAReER)
// ---------------------------------------------------------------------

export interface QSItem {
  category: "education" | "training" | "experience" | "eligibility";
  label: string;
  met: boolean;
  details: string;
}

export interface RftpSummary {
  applicant: {
    name: string;
    employeeNumber: string | null;
    currentRank: string | null;
    targetRank: string | null;
    school: string | null;
    division: string | null;
    level: string | null;
    salaryGrade: number | null;
    applicationDate: string | null;
  };
  qualificationStandards: {
    items: QSItem[];
    allMet: boolean;
  };
  performance: {
    totalO: number;
    totalVS: number;
    totalX: number;
    coiAtO: number;
    coiAtVS: number;
    coiMet: number;
    coiTotal: number;
    ncoiAtO: number;
    ncoiAtVS: number;
    ncoiMet: number;
    ncoiTotal: number;
    requirementsMet: boolean;
    requirementDetails: string[];
    ipcrf: { schoolYear: string; numericRating: number; adjectivalRating: string } | null;
  };
  career: {
    education: number;
    training: number;
    experience: number;
    performance: number;
    coi: number;
    ncoi: number;
    total: number;
    max: typeof SCORE_MAX;
  };
  readiness: {
    status: "Qualified" | "For Improvement" | "Not Qualified";
    reason: string;
  };
}

const QS_LABELS: Record<string, string> = {
  education: "Education",
  training: "Training",
  experience: "Experience",
  eligibility: "Eligibility",
};

export async function getRftpSummary(
  teacherId: number,
  applicationId: number
): Promise<RftpSummary> {
  const [profileRows] = await pool.query(
    `SELECT u.full_name, tp.employee_number, tp.current_position, tp.school, tp.division,
            tp.salary_grade, tp.school_level
     FROM users u
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [teacherId]
  );
  const profile = (profileRows as {
    full_name: string;
    employee_number: string | null;
    current_position: string | null;
    school: string | null;
    division: string | null;
    salary_grade: number | null;
    school_level: string | null;
  }[])[0];

  const [appRows] = await pool.query(
    `SELECT target_position, created_at FROM promotion_applications WHERE id = ? LIMIT 1`,
    [applicationId]
  );
  const app = (appRows as { target_position: string | null; created_at: string }[])[0];
  const targetPosition = app?.target_position ?? null;

  const [score, indicators, qualRecords, ipcrfRow] = await Promise.all([
    computeApplicationScore(applicationId, targetPosition),
    getIndicatorsForApplication(applicationId),
    getQualificationRecords(applicationId),
    getLatestIpcrf(applicationId),
  ]);

  // --- I. Qualification Standards ---
  const items: QSItem[] = (
    ["education", "training", "experience", "eligibility"] as const
  ).map((category) => {
    const recs = qualRecords.filter((r) => r.category === category);
    const details =
      recs.length === 0
        ? "No record submitted"
        : recs
            .map((r) => (r.detail ? `${r.title} (${r.detail})` : r.title))
            .join("; ");
    return {
      category,
      label: QS_LABELS[category],
      // A standard counts as met once at least one record exists and has
      // been verified by an evaluator.
      met: recs.length > 0 && recs.some((r) => r.verified),
      details,
    };
  });
  const allMet = items.every((i) => i.met);

  // --- II. Performance Requirements ---
  const coi = indicators.filter((i) => i.is_coi);
  const ncoi = indicators.filter((i) => !i.is_coi);
  const coiAtO = coi.filter((i) => i.rating === "O").length;
  const coiAtVS = coi.filter((i) => i.rating === "VS").length;
  const ncoiAtO = ncoi.filter((i) => i.rating === "O").length;
  const ncoiAtVS = ncoi.filter((i) => i.rating === "VS").length;

  // --- Readiness ---
  let status: RftpSummary["readiness"]["status"];
  let reason: string;
  if (allMet && score.requirementsMet && score.total >= 80) {
    status = "Qualified";
    reason =
      "All qualification standards are met, the performance requirements for the target position are satisfied, and the comparative assessment score is 80 or above.";
  } else if (allMet && score.total >= 70) {
    status = "For Improvement";
    reason = score.requirementsMet
      ? "Qualification standards are met and the score is competitive, but it remains below the 80-point mark."
      : "Qualification standards are met, but the performance requirements for the target position are not yet satisfied.";
  } else {
    status = "Not Qualified";
    reason = !allMet
      ? "One or more qualification standards have no verified record on file."
      : "The comparative assessment score is below 70.";
  }

  return {
    applicant: {
      name: profile?.full_name ?? "",
      employeeNumber: profile?.employee_number ?? null,
      currentRank: profile?.current_position ?? null,
      targetRank: targetPosition,
      school: profile?.school ?? null,
      division: profile?.division ?? null,
      level: profile?.school_level ?? null,
      salaryGrade: profile?.salary_grade ?? null,
      applicationDate: app?.created_at ?? null,
    },
    qualificationStandards: { items, allMet },
    performance: {
      totalO: coiAtO + ncoiAtO,
      totalVS: coiAtVS + ncoiAtVS,
      totalX: indicators.filter((i) => i.rating === "X").length,
      coiAtO,
      coiAtVS,
      coiMet: coiAtO + coiAtVS,
      coiTotal: coi.length,
      ncoiAtO,
      ncoiAtVS,
      ncoiMet: ncoiAtO + ncoiAtVS,
      ncoiTotal: ncoi.length,
      requirementsMet: score.requirementsMet,
      requirementDetails: score.requirementDetails,
      ipcrf: ipcrfRow
        ? {
            schoolYear: ipcrfRow.school_year,
            numericRating: Number(ipcrfRow.numeric_rating),
            adjectivalRating: ipcrfRow.adjectival_rating,
          }
        : null,
    },
    career: {
      education: score.education,
      training: score.training,
      experience: score.experience,
      performance: score.performance,
      coi: score.coi,
      ncoi: score.ncoi,
      total: score.total,
      max: SCORE_MAX,
    },
    readiness: { status, reason },
  };
}

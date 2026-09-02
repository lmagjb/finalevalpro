// ---------------------------------------------------------------------
// Education, Training and Experience (ETE) point computation.
//
// Source: DepEd Order No. 024, s. 2025 — Enclosure 2, Items 33-35.
//   Table 2.a  Increments Table — Education
//   Table 2.b  Increments Table — Training
//   Table 2.c  Increments Table — Experience
//   Table 3    Rubric for Computation of Points for ETE
//
// Method: determine the applicant's level and the baseline level from the
// position's CSC-approved QS, take the difference (the "increment"), then
// convert increments to points. Each of E, T and E is worth max 10 points.
//
// Verified against DBM-DepEd JC Form No. 2-A submissions from Lucena East
// III ES: training 204h -> 10 pts, experience 3y -> 2 pts (Teacher III);
// training 308h -> 10 pts, experience 6y3m -> 6 pts, education
// Bachelor's-only -> 0 pts (Teacher IV). All match the filed forms.
// ---------------------------------------------------------------------

/** Table 2.a — Education. Level for a given attainment. */
export const EDUCATION_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "Can read and write" },
  { level: 2, label: "Elementary Graduate" },
  { level: 3, label: "Completed Junior High School / High School Level" },
  { level: 4, label: "Senior High School Graduate / High School Graduate" },
  { level: 5, label: "Completed 2 years in College" },
  { level: 6, label: "Bachelor's Degree" },
  { level: 7, label: "6 units toward a Master's Degree" },
  { level: 8, label: "9 units toward a Master's Degree" },
  { level: 9, label: "12 units toward a Master's Degree" },
  { level: 10, label: "15 units toward a Master's Degree" },
  { level: 11, label: "18 units toward a Master's Degree" },
  { level: 12, label: "21 units toward a Master's Degree" },
  { level: 13, label: "24 units toward a Master's Degree" },
  { level: 14, label: "27 units toward a Master's Degree" },
  { level: 15, label: "30 units toward a Master's Degree" },
  { level: 16, label: "33 units toward a Master's Degree" },
  { level: 17, label: "36 units toward a Master's Degree" },
  { level: 18, label: "39 units toward a Master's Degree" },
  { level: 19, label: "42 units toward a Master's Degree" },
  { level: 20, label: "Complete Academic Requirements (Master's)" },
  { level: 21, label: "Master's Degree" },
];

/** Units earned toward a Master's map to levels 7 upward in 3-unit steps. */
export function educationLevelFromUnits(units: number): number {
  if (units <= 0) return 6; // Bachelor's Degree
  if (units >= 42) return 19;
  const level = 6 + Math.floor(units / 3);
  return Math.min(19, Math.max(6, level));
}

/** Table 2.b — Training. Levels rise every 8 hours, capped at level 31. */
export function trainingLevel(hours: number): number {
  if (hours < 8) return 1;
  if (hours >= 240) return 31;
  return Math.min(31, 2 + Math.floor(hours / 8));
}

/** Table 2.c — Experience. Levels rise every 6 months, capped at level 31. */
export function experienceLevel(months: number): number {
  if (months < 6) return 1;
  if (months >= 180) return 31; // 15 years
  return Math.min(31, 2 + Math.floor(months / 6));
}

/** Table 3 — increments to points. Applies to each of E, T and E. */
export function pointsForIncrements(increments: number): number {
  if (increments >= 10) return 10;
  if (increments >= 8) return 8;
  if (increments >= 6) return 6;
  if (increments >= 4) return 4;
  if (increments >= 2) return 2;
  return 0;
}

export interface PositionQs {
  position: string;
  educationLabel: string;
  educationLevel: number;
  trainingHours: number;
  experienceMonths: number;
}

/**
 * Baseline QS per position, used to compute increments.
 *
 * Teacher III and Teacher IV are taken directly from filed Form 2-A
 * submissions. The remaining rows follow the same pattern and should be
 * confirmed against your division's CSC-approved QS before relying on
 * them for a live application.
 */
export const POSITION_QS: PositionQs[] = [
  { position: "Teacher II",        educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 8,  experienceMonths: 12 },
  { position: "Teacher III",       educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 16, experienceMonths: 24 },
  { position: "Teacher IV",        educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 16, experienceMonths: 36 },
  { position: "Teacher V",         educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 24, experienceMonths: 48 },
  { position: "Teacher VI",        educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 32, experienceMonths: 60 },
  { position: "Teacher VII",       educationLabel: "Bachelor's Degree", educationLevel: 6,  trainingHours: 40, experienceMonths: 72 },
  { position: "Master Teacher I",  educationLabel: "Master's Degree units", educationLevel: 11, trainingHours: 48, experienceMonths: 48 },
  { position: "Master Teacher II", educationLabel: "Master's Degree",  educationLevel: 21, trainingHours: 56, experienceMonths: 60 },
  { position: "Master Teacher III",educationLabel: "Master's Degree",  educationLevel: 21, trainingHours: 64, experienceMonths: 72 },
];

export function getPositionQs(position: string | null): PositionQs | null {
  if (!position) return null;
  return POSITION_QS.find((p) => p.position === position) ?? null;
}

export interface EteBreakdown {
  level: number;
  baselineLevel: number;
  increments: number;
  points: number;
  /** Human-readable basis, shown on the form so the score is auditable */
  basis: string;
}

export interface EteResult {
  education: EteBreakdown;
  training: EteBreakdown;
  experience: EteBreakdown;
  /** True when no target position is set, so baselines are unknown */
  incomplete: boolean;
}

export function computeEte(params: {
  targetPosition: string | null;
  educationUnits: number;
  hasMastersDegree: boolean;
  trainingHours: number;
  experienceMonths: number;
}): EteResult {
  const qs = getPositionQs(params.targetPosition);

  const eduLevel = params.hasMastersDegree
    ? 21
    : educationLevelFromUnits(params.educationUnits);
  const trnLevel = trainingLevel(params.trainingHours);
  const expLevel = experienceLevel(params.experienceMonths);

  const eduBase = qs?.educationLevel ?? eduLevel;
  const trnBase = qs ? trainingLevel(qs.trainingHours) : trnLevel;
  const expBase = qs ? experienceLevel(qs.experienceMonths) : expLevel;

  const build = (
    level: number,
    baselineLevel: number,
    basis: string
  ): EteBreakdown => {
    const increments = Math.max(0, level - baselineLevel);
    return {
      level,
      baselineLevel,
      increments,
      points: qs ? pointsForIncrements(increments) : 0,
      basis,
    };
  };

  const years = Math.floor(params.experienceMonths / 12);
  const remMonths = params.experienceMonths % 12;

  return {
    education: build(
      eduLevel,
      eduBase,
      params.hasMastersDegree
        ? "Master's Degree"
        : params.educationUnits > 0
        ? `${params.educationUnits} units toward a Master's Degree`
        : "Bachelor's Degree"
    ),
    training: build(trnLevel, trnBase, `${params.trainingHours} hours`),
    experience: build(
      expLevel,
      expBase,
      `${years} year${years === 1 ? "" : "s"}${remMonths ? ` and ${remMonths} months` : ""}`
    ),
    incomplete: !qs,
  };
}

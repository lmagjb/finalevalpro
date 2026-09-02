import { computeApplicationScore, getIndicatorsForApplication, SCORE_MAX } from "@/lib/scoring";
import { getApprovedStatistics } from "@/lib/statistics";
import { getRankedCandidates } from "@/lib/staff";

// ---------------------------------------------------------------------
// Recommendation engine.
//
// Two sources of advice, in priority order:
//
//   1. REQUIREMENT GAPS — hard rules from DBM-DepEd JC Form No. 2-A for
//      the teacher's target position. These are pass/fail, so they always
//      outrank benchmark advice.
//
//   2. BENCHMARK GAPS — where the teacher sits below the approved cohort
//      on a component they can still improve.
//
// Everything here is deterministic and explainable: each item states the
// number it came from. Nothing is derived from demographic attributes.
// ---------------------------------------------------------------------

export type Priority = "critical" | "important" | "optional";

export interface Recommendation {
  priority: Priority;
  category: string;
  title: string;
  detail: string;
  /** The figure this was derived from, so the advice can be audited */
  basis: string;
}

export interface RecommendationResult {
  targetPosition: string | null;
  currentScore: number;
  cohortMedian: number;
  cohortSize: number;
  reliabilityNote: string;
  recommendations: Recommendation[];
}

export async function getRecommendations(
  applicationId: number,
  targetPosition: string | null
): Promise<RecommendationResult> {
  const [score, indicators, approved] = await Promise.all([
    computeApplicationScore(applicationId, targetPosition),
    getIndicatorsForApplication(applicationId),
    getRankedCandidates({ approvedOnly: true }),
  ]);
  const stats = await getApprovedStatistics(approved);

  const recommendations: Recommendation[] = [];

  // ---- 1. Hard requirement gaps -------------------------------------
  if (!targetPosition) {
    recommendations.push({
      priority: "critical",
      category: "Setup",
      title: "Set your target position",
      detail:
        "Requirements differ per position, so nothing can be checked until you choose the position you're applying for.",
      basis: "No target position set on this application.",
    });
  } else {
    for (const line of score.requirementDetails) {
      if (line.includes("(Not Met)")) {
        recommendations.push({
          priority: "critical",
          category: "PPST Indicators",
          title: `Requirement not yet met for ${targetPosition}`,
          detail:
            "This is a pass/fail requirement — your application cannot be approved until it is satisfied. Work with your observers on the classroom observations and portfolio evidence behind these indicators.",
          basis: line,
        });
      }
    }

    const unrated = indicators.filter((i) => i.rating === "X").length;
    if (unrated > 0) {
      recommendations.push({
        priority: "important",
        category: "PPST Indicators",
        title: `${unrated} indicator${unrated === 1 ? "" : "s"} still unrated`,
        detail:
          "Unrated indicators count as Not Met. Ask your observer to complete the rating so your standing reflects your actual practice.",
        basis: `${unrated} of ${indicators.length} indicators are still marked X.`,
      });
    }
  }

  // ---- 2. Benchmark gaps --------------------------------------------
  const componentValues: Record<string, number> = {
    Education: score.education,
    Training: score.training,
    Experience: score.experience,
    Performance: score.performance,
    COI: score.coi,
    NCOI: score.ncoi,
  };

  const ACTION_HINTS: Record<string, string> = {
    Education:
      "Add completed degrees or earned academic units to your Qualification Standards records, or enrol to raise your attainment.",
    Training:
      "Log completed trainings with their hours in Qualification Standards, and target relevant training programs to close the gap.",
    Experience:
      "This grows with years of service; make sure your recorded years of service is accurate and up to date.",
    Performance:
      "This comes from your IPCRF rating. Record your latest rating, and discuss performance targets with your rater for the next cycle.",
    COI: "COI points come from classroom observation and demo teaching. Prepare for your next observation cycle with your evaluator.",
    NCOI: "NCOI points come from portfolio annotation and the behavioural interview. Strengthen your portfolio's annotated MOVs.",
  };

  if (stats.cohortSize > 0) {
    for (const bench of stats.actionable.componentBenchmarks) {
      const mine = componentValues[bench.label] ?? 0;
      if (mine < bench.median) {
        const gap = Math.round((bench.median - mine) * 10) / 10;
        recommendations.push({
          priority: gap >= bench.max * 0.25 ? "important" : "optional",
          category: bench.label,
          title: `${bench.label}: ${gap} point${gap === 1 ? "" : "s"} below the approved median`,
          detail: ACTION_HINTS[bench.label] ?? "",
          basis: `You: ${mine}/${bench.max} · Approved median: ${bench.median} · Upper quartile: ${bench.p75}`,
        });
      }
    }

    // Qualification patterns the teacher may be missing.
    const commonTraining = stats.actionable.commonTrainings.filter((p) => p.percentage >= 50);
    if (commonTraining.length > 0 && score.training < SCORE_MAX.training) {
      recommendations.push({
        priority: "optional",
        category: "Training",
        title: "Common trainings among approved teachers",
        detail: `Most approved candidates held: ${commonTraining
          .slice(0, 3)
          .map((p) => `${p.label} (${p.percentage}%)`)
          .join(", ")}.`,
        basis: `Across ${stats.cohortSize} approved application(s).`,
      });
    }

    if (stats.actionable.averageTrainingHours !== null) {
      recommendations.push({
        priority: "optional",
        category: "Training",
        title: "Training hours benchmark",
        detail: `Approved candidates logged an average of ${stats.actionable.averageTrainingHours} training hours in total.`,
        basis: `Average across ${stats.cohortSize} approved application(s).`,
      });
    }
  }

  const order: Record<Priority, number> = { critical: 0, important: 1, optional: 2 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return {
    targetPosition,
    currentScore: score.total,
    cohortMedian: stats.summary.medianTotalScore,
    cohortSize: stats.cohortSize,
    reliabilityNote: stats.reliabilityNote,
    recommendations,
  };
}

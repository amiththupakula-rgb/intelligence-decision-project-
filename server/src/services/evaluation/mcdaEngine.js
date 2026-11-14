/**
 * IntelliDecision AI – Multi-Criteria Decision Analysis (MCDA) Engine
 * Implements deterministic normalized weighted scoring, alternative ranking,
 * and sensitivity analysis.
 */

export function normalizeScore(rawValue, min, max, direction) {
  if (max === min) {
    // Equal values across all alternatives: assign full score or neutral
    return 100;
  }

  if (direction === 'benefit') {
    // Higher is better: (raw - min) / (max - min) * 100
    const score = ((rawValue - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  } else {
    // Cost: lower is better: (max - raw) / (max - min) * 100
    const score = ((max - rawValue) / (max - min)) * 100;
    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  }
}

export function evaluateAlternatives(alternatives, criteria, rawScores) {
  if (alternatives.length < 2) {
    throw new Error('MCDA evaluation requires at least two alternatives to compare.');
  }
  if (criteria.length === 0) {
    throw new Error('MCDA evaluation requires at least one evaluation criterion.');
  }

  // 1. Normalize Criteria Weights to sum to 1.0 (or 100%)
  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  if (totalWeight <= 0) {
    throw new Error('Total criteria weight must be greater than zero.');
  }

  const normalizedCriteria = criteria.map(c => ({
    ...c,
    normalizedWeight: (Number(c.weight) || 0) / totalWeight,
    displayWeightPercent: Number((((Number(c.weight) || 0) / totalWeight) * 100).toFixed(2)),
  }));

  // 2. Build Raw Score Lookup and find min/max per criterion
  // rawScores: Array of { alternative_id, criterion_id, raw_value }
  const scoreLookup = new Map();
  const criterionRanges = {};

  criteria.forEach(c => {
    criterionRanges[c.id] = { min: Infinity, max: -Infinity, values: [] };
  });

  rawScores.forEach(s => {
    const key = `${s.alternative_id}:${s.criterion_id}`;
    scoreLookup.set(key, Number(s.raw_value));
    if (criterionRanges[s.criterion_id]) {
      criterionRanges[s.criterion_id].values.push(Number(s.raw_value));
      criterionRanges[s.criterion_id].min = Math.min(criterionRanges[s.criterion_id].min, Number(s.raw_value));
      criterionRanges[s.criterion_id].max = Math.max(criterionRanges[s.criterion_id].max, Number(s.raw_value));
    }
  });

  // Verify missing scores
  const missingPairs = [];
  alternatives.forEach(alt => {
    criteria.forEach(crit => {
      const key = `${alt.id}:${crit.id}`;
      if (!scoreLookup.has(key)) {
        missingPairs.push(`Alternative "${alt.name}" is missing score for criterion "${crit.name}"`);
      }
    });
  });

  if (missingPairs.length > 0) {
    throw new Error(`Incomplete evaluation data: ${missingPairs.join('; ')}`);
  }

  // 3. Compute Normalized Scores and Weighted Totals
  const normalizedScoresByAlt = {};
  const alternativeResults = [];

  alternatives.forEach(alt => {
    let totalWeightedScore = 0;
    const criterionBreakdown = {};

    normalizedCriteria.forEach(crit => {
      const raw = scoreLookup.get(`${alt.id}:${crit.id}`);
      const range = criterionRanges[crit.id];
      const normScore = normalizeScore(raw, range.min, range.max, crit.direction);
      const contribution = normScore * crit.normalizedWeight;

      totalWeightedScore += contribution;

      criterionBreakdown[crit.id] = {
        criterionName: crit.name,
        direction: crit.direction,
        weight: crit.displayWeightPercent,
        rawValue: raw,
        normalizedScore: normScore,
        weightedContribution: Number(contribution.toFixed(2)),
      };
    });

    normalizedScoresByAlt[alt.id] = criterionBreakdown;

    alternativeResults.push({
      alternative_id: alt.id,
      name: alt.name,
      description: alt.description,
      weighted_score: Number(totalWeightedScore.toFixed(2)),
      breakdown: criterionBreakdown,
    });
  });

  // 4. Rank Alternatives
  alternativeResults.sort((a, b) => b.weighted_score - a.weighted_score);
  const rankedWithPositions = alternativeResults.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    leadOverNext: idx < alternativeResults.length - 1
      ? Number((item.weighted_score - alternativeResults[idx + 1].weighted_score).toFixed(2))
      : 0,
  }));

  // 5. Sensitivity Analysis
  // Perturb each criterion's weight by +20% and -20% and evaluate rank stability
  const sensitivityResults = {};
  const topAlternativeId = rankedWithPositions[0].alternative_id;

  normalizedCriteria.forEach(targetCrit => {
    const perturbations = [-0.2, 0.2]; // -20%, +20%
    let rank1Stable = true;

    perturbations.forEach(factor => {
      // Adjusted weights
      const adjustedWeights = normalizedCriteria.map(c => {
        if (c.id === targetCrit.id) {
          return { id: c.id, w: Math.max(0.01, c.normalizedWeight * (1 + factor)) };
        }
        return { id: c.id, w: c.normalizedWeight };
      });

      const sumW = adjustedWeights.reduce((s, a) => s + a.w, 0);
      const normalizedAdjusted = new Map(adjustedWeights.map(a => [a.id, a.w / sumW]));

      // Calculate re-weighted scores
      const perturbedScores = alternatives.map(alt => {
        let score = 0;
        normalizedCriteria.forEach(crit => {
          const normScore = normalizedScoresByAlt[alt.id][crit.id].normalizedScore;
          score += normScore * (normalizedAdjusted.get(crit.id) || 0);
        });
        return { id: alt.id, score };
      }).sort((a, b) => b.score - a.score);

      if (perturbedScores[0].id !== topAlternativeId) {
        rank1Stable = false;
      }
    });

    sensitivityResults[targetCrit.name] = {
      criterionId: targetCrit.id,
      weightPercent: targetCrit.displayWeightPercent,
      rank1Stable,
      sensitivityLevel: rank1Stable ? 'low' : 'high',
      comment: rank1Stable
        ? `Rank #1 remains stable under ±20% weight variation on "${targetCrit.name}".`
        : `Rank #1 is sensitive to weight changes in "${targetCrit.name}"! Altering this weight changes the winning choice.`,
    };
  });

  // 6. Traceable Evidence References
  const evidenceReferences = [
    {
      id: `EVID-EVAL-TOP`,
      type: 'mcda_ranking',
      topAlternative: rankedWithPositions[0].name,
      score: rankedWithPositions[0].weighted_score,
      description: `MCDA deterministic evaluation ranked "${rankedWithPositions[0].name}" as #1 with a composite score of ${rankedWithPositions[0].weighted_score} / 100.`,
    },
    {
      id: `EVID-EVAL-SPREAD`,
      type: 'mcda_spread',
      margin: rankedWithPositions[0].leadOverNext,
      description: `Margin between #1 "${rankedWithPositions[0].name}" and #2 "${rankedWithPositions[1]?.name || 'N/A'}" is ${rankedWithPositions[0].leadOverNext} points.`,
    }
  ];

  return {
    methodology: 'weighted_sum_model',
    rankings: rankedWithPositions,
    normalizedScores: normalizedScoresByAlt,
    criteriaWeights: normalizedCriteria.map(c => ({
      id: c.id,
      name: c.name,
      direction: c.direction,
      weightPercent: c.displayWeightPercent,
    })),
    sensitivityResults,
    evidenceReferences,
  };
}

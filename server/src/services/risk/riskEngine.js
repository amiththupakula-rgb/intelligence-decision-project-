/**
 * IntelliDecision AI – Predictive Risk Assessment Engine
 * Deterministic risk calculation: Score = Likelihood (1-5) * Impact (1-5)
 * Classifies risks into Low, Moderate, High, Critical.
 */

export function calculateRiskScore(likelihood, impact) {
  const l = Math.max(1, Math.min(5, Number(likelihood) || 1));
  const i = Math.max(1, Math.min(5, Number(impact) || 1));
  const score = l * i;

  let level = 'low';
  if (score >= 16) {
    level = 'critical';
  } else if (score >= 11) {
    level = 'high';
  } else if (score >= 6) {
    level = 'moderate';
  }

  return {
    likelihood: l,
    impact: i,
    score,
    level,
  };
}

export function compileRiskMatrix(risks) {
  // 5x5 grid: likelihood rows (5 down to 1), impact cols (1 to 5)
  const grid = Array.from({ length: 5 }, (_, rIdx) => {
    const l = 5 - rIdx;
    return Array.from({ length: 5 }, (_, cIdx) => {
      const i = cIdx + 1;
      const score = l * i;
      let level = 'low';
      if (score >= 16) level = 'critical';
      else if (score >= 11) level = 'high';
      else if (score >= 6) level = 'moderate';

      return {
        likelihood: l,
        impact: i,
        score,
        level,
        items: [],
      };
    });
  });

  risks.forEach(risk => {
    const l = Math.max(1, Math.min(5, Number(risk.likelihood) || 1));
    const i = Math.max(1, Math.min(5, Number(risk.impact) || 1));
    const rIdx = 5 - l;
    const cIdx = i - 1;
    if (grid[rIdx] && grid[rIdx][cIdx]) {
      grid[rIdx][cIdx].items.push(risk);
    }
  });

  return grid;
}

export function evaluateAlternativeRisks(risks, alternatives) {
  const profileByAlt = {};
  const evidenceReferences = [];
  let riskCounter = 1;

  alternatives.forEach(alt => {
    profileByAlt[alt.id] = {
      alternativeName: alt.name,
      totalRisks: 0,
      criticalCount: 0,
      highCount: 0,
      moderateCount: 0,
      lowCount: 0,
      maxScore: 0,
      averageScore: 0,
      risks: [],
    };
  });

  const crossCuttingRisks = [];

  risks.forEach(r => {
    const scoreData = calculateRiskScore(r.likelihood, r.impact);
    const enriched = {
      ...r,
      risk_score: scoreData.score,
      risk_level: scoreData.level,
      likelihood: scoreData.likelihood,
      impact: scoreData.impact,
    };

    const evidId = `EVID-RISK-${String(riskCounter++).padStart(3, '0')}`;
    evidenceReferences.push({
      id: evidId,
      type: 'risk',
      title: r.risk_title,
      score: scoreData.score,
      level: scoreData.level,
      description: `Risk "${r.risk_title}" rated ${scoreData.level.toUpperCase()} (Score: ${scoreData.score}/25, Likelihood: ${scoreData.likelihood}, Impact: ${scoreData.impact}). Mitigation: ${r.mitigation || 'N/A'}.`,
    });

    if (r.alternative_id && profileByAlt[r.alternative_id]) {
      const p = profileByAlt[r.alternative_id];
      p.totalRisks++;
      if (scoreData.level === 'critical') p.criticalCount++;
      if (scoreData.level === 'high') p.highCount++;
      if (scoreData.level === 'moderate') p.moderateCount++;
      if (scoreData.level === 'low') p.lowCount++;
      p.maxScore = Math.max(p.maxScore, scoreData.score);
      p.risks.push(enriched);
    } else {
      crossCuttingRisks.push(enriched);
    }
  });

  // Calculate averages
  Object.values(profileByAlt).forEach(p => {
    if (p.totalRisks > 0) {
      const sum = p.risks.reduce((s, r) => s + r.risk_score, 0);
      p.averageScore = Number((sum / p.totalRisks).toFixed(1));
    }
  });

  return {
    profiles: profileByAlt,
    crossCuttingRisks,
    matrix: compileRiskMatrix(risks),
    evidenceReferences,
  };
}

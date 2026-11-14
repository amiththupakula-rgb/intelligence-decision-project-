/**
 * IntelliDecision AI – Comprehensive Decision Reporting & Export Engine
 * Generates audit-ready reports covering every phase of the intelligence pipeline.
 */

export function generateComprehensiveReport(project, data) {
  const {
    datasets = [],
    analyses = [],
    alternatives = [],
    criteria = [],
    evaluation = null,
    risks = [],
    recommendation = null,
    finalDecision = null,
    monitoring = [],
    alerts = [],
  } = data;

  const generatedAt = new Date().toISOString();

  const report = {
    metadata: {
      reportTitle: `IntelliDecision AI Audit Report: ${project.title}`,
      projectId: project.id,
      domain: project.domain,
      generatedAt,
      version: '1.0',
    },
    projectOverview: {
      title: project.title,
      description: project.description,
      domain: project.domain,
      objective: project.objective,
      status: project.status,
      deadline: project.deadline,
      createdAt: project.created_at,
    },
    dataIntelligence: {
      datasetsUploaded: datasets.length,
      datasets: datasets.map(d => ({
        id: d.id,
        name: d.name,
        fileType: d.file_type,
        rowCount: d.row_count,
        qualityScore: d.data_quality_score,
      })),
      keyAnalyticalFindings: analyses.map(a => ({
        type: a.analysis_type,
        status: a.status,
        summary: a.analysis_results?.descriptiveStatistics
          ? `Analyzed ${Object.keys(a.analysis_results.descriptiveStatistics).length} quantitative parameters.`
          : 'Analysis completed.',
      })),
    },
    alternativeEvaluation: {
      methodology: evaluation?.methodology || 'Weighted Sum Model (MCDA)',
      totalAlternatives: alternatives.length,
      criteriaEvaluated: criteria.map(c => ({
        name: c.name,
        direction: c.direction,
        weight: c.weight,
      })),
      rankings: evaluation?.rankings || [],
      sensitivityAnalysis: evaluation?.sensitivity_results || {},
    },
    riskAssessment: {
      totalRisksIdentified: risks.length,
      criticalRisks: risks.filter(r => r.risk_level === 'critical'),
      highRisks: risks.filter(r => r.risk_level === 'high'),
      moderateRisks: risks.filter(r => r.risk_level === 'moderate'),
      lowRisks: risks.filter(r => r.risk_level === 'low'),
    },
    explainableRecommendation: recommendation ? {
      type: recommendation.recommendation_type,
      recommendedAlternativeId: recommendation.recommended_alternative_id,
      summary: recommendation.recommendation_summary,
      confidenceLevel: recommendation.confidence_level,
      supportingEvidence: recommendation.supporting_evidence,
      reasoning: recommendation.explanation?.reasoning || [],
      assumptions: recommendation.assumptions,
      uncertainties: recommendation.uncertainties,
      conditionsForReassessment: recommendation.explanation?.conditions_for_reassessment || [],
      modelUsed: recommendation.model_name,
    } : null,
    finalDecisionStatus: finalDecision ? {
      decisionStatus: finalDecision.decision_status,
      selectedAlternativeId: finalDecision.selected_alternative_id,
      rationale: finalDecision.decision_reason,
      approvedAt: finalDecision.approved_at,
    } : {
      decisionStatus: 'pending_human_approval',
      note: 'AI recommendations are advisory. Consequential decision requires explicit human authorization.',
    },
    continuousMonitoring: {
      totalMetrics: monitoring.length,
      activeAlertsCount: alerts.filter(a => !a.acknowledged).length,
      metrics: monitoring.map(m => ({
        name: m.metric_name,
        expected: m.expected_value,
        actual: m.actual_value,
        unit: m.unit,
        thresholdPercent: m.threshold,
        status: m.status,
      })),
      recentAlerts: alerts.slice(0, 5),
    },
  };

  return report;
}

export function generateCSVExport(data) {
  const { evaluation, alternatives, criteria } = data;
  if (!evaluation || !evaluation.rankings || evaluation.rankings.length === 0) {
    return 'Alternative,Rank,Score\nNo evaluation results available.';
  }

  const headers = ['Rank', 'Alternative', 'Weighted Score', ...criteria.map(c => `Criterion: ${c.name} (${c.direction})`)];
  const rows = evaluation.rankings.map(r => {
    const critScores = criteria.map(c => {
      const b = r.breakdown ? r.breakdown[c.id] : null;
      return b ? `${b.rawValue} (Norm: ${b.normalizedScore})` : 'N/A';
    });
    return [
      r.rank,
      `"${r.name.replace(/"/g, '""')}"`,
      r.weighted_score,
      ...critScores,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDescriptiveStats,
  calculatePearsonCorrelation,
  calculateTrend,
  performCompleteAnalysis,
} from '../../server/src/services/analytics/statsEngine.js';

import {
  normalizeScore,
  evaluateAlternatives,
} from '../../server/src/services/evaluation/mcdaEngine.js';

import {
  calculateRiskScore,
  compileRiskMatrix,
  evaluateAlternativeRisks,
} from '../../server/src/services/risk/riskEngine.js';

import {
  calculateDeviation,
  evaluateMetricStatus,
} from '../../server/src/services/monitoring/monitoringService.js';

import {
  generateComprehensiveReport,
  generateCSVExport,
} from '../../server/src/services/reports/reportService.js';

// ============================================================================
// 1. STATISTICAL & ANALYTICAL ENGINE TESTS
// ============================================================================
test('StatsEngine: calculates correct descriptive statistics', () => {
  const data = [10, 20, 30, 40, 50];
  const stats = calculateDescriptiveStats(data);

  assert.equal(stats.count, 5);
  assert.equal(stats.mean, 30);
  assert.equal(stats.median, 30);
  assert.equal(stats.min, 10);
  assert.equal(stats.max, 50);
  assert.equal(stats.range, 40);
  assert.equal(stats.variance, 250);
  assert.equal(Number(stats.standardDeviation.toFixed(2)), 15.81);
});

test('StatsEngine: calculates Pearson correlation coefficient', () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10]; // Perfect positive
  const r = calculatePearsonCorrelation(x, y);
  assert.equal(r, 1);

  const z = [10, 8, 6, 4, 2]; // Perfect negative
  const rNeg = calculatePearsonCorrelation(x, z);
  assert.equal(rNeg, -1);
});

test('StatsEngine: calculates linear trend regression', () => {
  const values = [10, 15, 20, 25, 30];
  const trend = calculateTrend(values);

  assert.equal(trend.slope, 5);
  assert.equal(trend.direction, 'upward');
  assert.equal(trend.rSquared, 1);
});

test('StatsEngine: complete analysis generates traceable evidence', () => {
  const records = [
    { sales: 100, profit: 20, cost: 80 },
    { sales: 150, profit: 35, cost: 115 },
    { sales: 200, profit: 50, cost: 150 },
    { sales: 250, profit: 60, cost: 190 },
  ];
  const columns = [
    { name: 'sales', type: 'numeric' },
    { name: 'profit', type: 'numeric' },
    { name: 'cost', type: 'numeric' },
  ];

  const analysis = performCompleteAnalysis(records, columns);
  assert.ok(analysis.descriptiveStatistics.sales);
  assert.ok(analysis.correlationMatrix.sales.profit > 0.9);
  assert.ok(analysis.evidenceReferences.length > 0);
  assert.ok(analysis.evidenceReferences[0].id.startsWith('EVID-'));
});

// ============================================================================
// 2. MCDA EVALUATION ENGINE TESTS
// ============================================================================
test('MCDA Engine: normalizes benefit criteria (higher is better)', () => {
  // raw values: min=10, max=50
  assert.equal(normalizeScore(50, 10, 50, 'benefit'), 100);
  assert.equal(normalizeScore(10, 10, 50, 'benefit'), 0);
  assert.equal(normalizeScore(30, 10, 50, 'benefit'), 50);
});

test('MCDA Engine: normalizes cost criteria (lower is better)', () => {
  // raw values: min=10, max=50
  assert.equal(normalizeScore(10, 10, 50, 'cost'), 100);
  assert.equal(normalizeScore(50, 10, 50, 'cost'), 0);
  assert.equal(normalizeScore(30, 10, 50, 'cost'), 50);
});

test('MCDA Engine: handles equal values without division by zero', () => {
  assert.equal(normalizeScore(50, 50, 50, 'benefit'), 100);
  assert.equal(normalizeScore(50, 50, 50, 'cost'), 100);
});

test('MCDA Engine: evaluates alternatives and ranks correctly', () => {
  const alternatives = [
    { id: 'alt-1', name: 'Option A (Conservative)' },
    { id: 'alt-2', name: 'Option B (Aggressive)' },
  ];

  const criteria = [
    { id: 'crit-roi', name: 'Expected ROI', direction: 'benefit', weight: 60 },
    { id: 'crit-cost', name: 'Initial Capital', direction: 'cost', weight: 40 },
  ];

  const rawScores = [
    { alternative_id: 'alt-1', criterion_id: 'crit-roi', raw_value: 12 },
    { alternative_id: 'alt-1', criterion_id: 'crit-cost', raw_value: 50 },
    { alternative_id: 'alt-2', criterion_id: 'crit-roi', raw_value: 28 },
    { alternative_id: 'alt-2', criterion_id: 'crit-cost', raw_value: 150 },
  ];

  const result = evaluateAlternatives(alternatives, criteria, rawScores);

  assert.equal(result.rankings.length, 2);
  assert.equal(result.rankings[0].rank, 1);
  assert.ok(result.rankings[0].weighted_score >= result.rankings[1].weighted_score);
  assert.ok(result.sensitivityResults['Expected ROI']);
});

// ============================================================================
// 3. PREDICTIVE RISK ENGINE TESTS
// ============================================================================
test('RiskEngine: calculates deterministic risk scores and levels', () => {
  // Score = Likelihood * Impact
  // 1-5 Low, 6-10 Moderate, 11-15 High, 16-25 Critical
  assert.deepEqual(calculateRiskScore(1, 4), { likelihood: 1, impact: 4, score: 4, level: 'low' });
  assert.deepEqual(calculateRiskScore(2, 4), { likelihood: 2, impact: 4, score: 8, level: 'moderate' });
  assert.deepEqual(calculateRiskScore(3, 4), { likelihood: 3, impact: 4, score: 12, level: 'high' });
  assert.deepEqual(calculateRiskScore(4, 5), { likelihood: 4, impact: 5, score: 20, level: 'critical' });
});

test('RiskEngine: builds 5x5 matrix and groups by alternative', () => {
  const alternatives = [
    { id: 'alt-1', name: 'Option A' },
  ];
  const risks = [
    {
      alternative_id: 'alt-1',
      risk_title: 'Supplier Delay',
      risk_category: 'operational',
      likelihood: 4,
      impact: 4,
      mitigation: 'Dual source suppliers',
    },
  ];

  const evalRisks = evaluateAlternativeRisks(risks, alternatives);
  assert.equal(evalRisks.matrix.length, 5);
  assert.equal(evalRisks.matrix[0].length, 5);
  assert.equal(evalRisks.profiles['alt-1'].criticalCount, 1);
  assert.equal(evalRisks.profiles['alt-1'].maxScore, 16);
});

// ============================================================================
// 4. CONTINUOUS MONITORING TESTS
// ============================================================================
test('MonitoringService: computes deviation and triggers breach alert', () => {
  const deviation = calculateDeviation(100, 115);
  assert.equal(deviation.deviationAbsolute, 15);
  assert.equal(deviation.deviationPercent, 15);

  const statusNormal = evaluateMetricStatus(100, 105, 10);
  assert.equal(statusNormal.status, 'normal');
  assert.equal(statusNormal.isBreached, false);

  const statusBreached = evaluateMetricStatus(100, 115, 10);
  assert.equal(statusBreached.status, 'breached');
  assert.equal(statusBreached.isBreached, true);
});

// ============================================================================
// 5. REPORT GENERATION TESTS
// ============================================================================
test('ReportService: generates comprehensive report and CSV export', () => {
  const project = {
    id: 'proj-1',
    title: 'Cloud Migration Strategy',
    domain: 'business',
    objective: 'Select optimal cloud infrastructure',
    status: 'evaluated',
  };

  const report = generateComprehensiveReport(project, {
    datasets: [{ id: 'd1', name: 'Cost_Data.csv', file_type: 'csv', row_count: 50, data_quality_score: 95 }],
    alternatives: [{ id: 'a1', name: 'AWS' }, { id: 'a2', name: 'GCP' }],
    criteria: [{ id: 'c1', name: 'Cost', direction: 'cost', weight: 50 }],
  });

  assert.equal(report.metadata.projectId, 'proj-1');
  assert.equal(report.projectOverview.title, 'Cloud Migration Strategy');
  assert.equal(report.dataIntelligence.datasetsUploaded, 1);

  const csv = generateCSVExport({
    evaluation: {
      rankings: [
        { rank: 1, name: 'GCP', weighted_score: 85.5, breakdown: { c1: { rawValue: 500, normalizedScore: 90 } } },
      ],
    },
    alternatives: [{ id: 'a2', name: 'GCP' }],
    criteria: [{ id: 'c1', name: 'Cost', direction: 'cost' }],
  });

  assert.ok(csv.includes('GCP'));
  assert.ok(csv.includes('85.5'));
});

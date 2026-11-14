/**
 * IntelliDecision AI – Deterministic Analytics & Statistical Engine
 * Computes descriptive statistics, correlation matrices, trends, and anomalies.
 */

export function calculateDescriptiveStats(numbers) {
  const valid = numbers.filter(n => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
  const n = valid.length;

  if (n === 0) {
    return null;
  }

  const min = valid[0];
  const max = valid[n - 1];
  const range = max - min;

  // Mean
  const sum = valid.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;

  // Mode
  const frequencyMap = new Map();
  let maxFreq = 0;
  let mode = valid[0];
  valid.forEach(v => {
    const f = (frequencyMap.get(v) || 0) + 1;
    frequencyMap.set(v, f);
    if (f > maxFreq) {
      maxFreq = f;
      mode = v;
    }
  });

  // Variance & Standard Deviation
  const sumSquaredDiff = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const variance = n > 1 ? sumSquaredDiff / (n - 1) : 0;
  const standardDeviation = Math.sqrt(variance);

  // Quartiles (Q1, Q3)
  const q1 = valid[Math.floor(n * 0.25)];
  const q3 = valid[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // Skewness (Fisher-Pearson coefficient)
  let skewness = 0;
  if (n > 2 && standardDeviation > 0) {
    const sumCubedDiff = valid.reduce((acc, v) => acc + Math.pow((v - mean) / standardDeviation, 3), 0);
    skewness = (n / ((n - 1) * (n - 2))) * sumCubedDiff;
  }

  // Outliers via IQR
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = valid.filter(v => v < lowerBound || v > upperBound);

  return {
    count: n,
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    range: Number(range.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    mode: Number(mode.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    standardDeviation: Number(standardDeviation.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
    skewness: Number(skewness.toFixed(4)),
    outlierCount: outliers.length,
    outliers: outliers.slice(0, 10), // sample
  };
}

/**
 * Computes Pearson correlation coefficient between two numeric arrays.
 */
export function calculatePearsonCorrelation(xArr, yArr) {
  if (xArr.length !== yArr.length || xArr.length < 2) return null;

  const n = xArr.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xArr[i];
    const y = yArr[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

/**
 * Computes linear regression trend over an ordered numeric series.
 */
export function calculateTrend(values) {
  const n = values.length;
  if (n < 2) return null;

  const x = values.map((_, idx) => idx);
  const y = values;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Correlation for R-squared
  const r = calculatePearsonCorrelation(x, y);
  const rSquared = r !== null ? Number(Math.pow(r, 2).toFixed(4)) : 0;

  let direction = 'stable';
  if (slope > 0.05) direction = 'upward';
  else if (slope < -0.05) direction = 'downward';

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    rSquared,
    direction,
    changePercent: Number((((values[n - 1] - values[0]) / (values[0] || 1)) * 100).toFixed(2)),
  };
}

/**
 * Runs full deterministic dataset analysis and creates traceable evidence references.
 */
export function performCompleteAnalysis(records, columnMetadata) {
  const numericColumns = columnMetadata.filter(c => c.type === 'numeric').map(c => c.name);
  const stats = {};
  const evidenceReferences = [];
  let evidenceCounter = 1;

  // 1. Column Descriptive Statistics
  numericColumns.forEach(col => {
    const values = records.map(r => Number(r[col])).filter(v => !isNaN(v));
    const colStats = calculateDescriptiveStats(values);
    if (colStats) {
      stats[col] = colStats;
      const evidId = `EVID-STAT-${String(evidenceCounter++).padStart(3, '0')}`;
      evidenceReferences.push({
        id: evidId,
        type: 'descriptive_statistic',
        field: col,
        metric: 'summary',
        values: {
          mean: colStats.mean,
          stdDev: colStats.standardDeviation,
          min: colStats.min,
          max: colStats.max,
          outlierCount: colStats.outlierCount,
        },
        description: `Statistical distribution for column "${col}": Mean=${colStats.mean}, StDev=${colStats.standardDeviation}, Range=[${colStats.min}, ${colStats.max}].`,
      });
    }
  });

  // 2. Correlation Matrix
  const correlationMatrix = {};
  const correlationPairs = [];

  for (let i = 0; i < numericColumns.length; i++) {
    const colA = numericColumns[i];
    correlationMatrix[colA] = {};
    for (let j = 0; j < numericColumns.length; j++) {
      const colB = numericColumns[j];
      if (i === j) {
        correlationMatrix[colA][colB] = 1;
      } else {
        const paired = records
          .map(r => ({ x: Number(r[colA]), y: Number(r[colB]) }))
          .filter(p => !isNaN(p.x) && !isNaN(p.y));

        const r = calculatePearsonCorrelation(
          paired.map(p => p.x),
          paired.map(p => p.y)
        );
        correlationMatrix[colA][colB] = r;

        if (i < j && r !== null && Math.abs(r) >= 0.3) {
          const strength = Math.abs(r) >= 0.7 ? 'strong' : 'moderate';
          const direction = r > 0 ? 'positive' : 'negative';
          const evidId = `EVID-CORR-${String(evidenceCounter++).padStart(3, '0')}`;
          
          correlationPairs.push({
            id: evidId,
            columnA: colA,
            columnB: colB,
            coefficient: r,
            strength,
            direction,
          });

          evidenceReferences.push({
            id: evidId,
            type: 'correlation',
            columns: [colA, colB],
            coefficient: r,
            description: `${strength.toUpperCase()} ${direction} correlation (r = ${r}) between "${colA}" and "${colB}". Note: Correlation does not imply causation.`,
          });
        }
      }
    }
  }

  // 3. Trends
  const trends = {};
  numericColumns.forEach(col => {
    const values = records.map(r => Number(r[col])).filter(v => !isNaN(v));
    const trend = calculateTrend(values);
    if (trend) {
      trends[col] = trend;
      const evidId = `EVID-TREND-${String(evidenceCounter++).padStart(3, '0')}`;
      evidenceReferences.push({
        id: evidId,
        type: 'trend',
        field: col,
        direction: trend.direction,
        slope: trend.slope,
        rSquared: trend.rSquared,
        description: `Sequential trend for "${col}": ${trend.direction} trajectory (slope: ${trend.slope}, R²: ${trend.rSquared}).`,
      });
    }
  });

  // 4. Anomaly Detection
  const anomalies = [];
  numericColumns.forEach(col => {
    const colStat = stats[col];
    if (colStat && colStat.outlierCount > 0) {
      const evidId = `EVID-ANOM-${String(evidenceCounter++).padStart(3, '0')}`;
      anomalies.push({
        id: evidId,
        column: col,
        outlierCount: colStat.outlierCount,
        sampleValues: colStat.outliers,
      });
      evidenceReferences.push({
        id: evidId,
        type: 'anomaly',
        field: col,
        count: colStat.outlierCount,
        description: `Detected ${colStat.outlierCount} anomalous outlier values in column "${col}" using IQR threshold.`,
      });
    }
  });

  // 5. Ranked Decision Factors (by variance / variability)
  const rankedFactors = numericColumns
    .map(col => ({
      column: col,
      stdev: stats[col]?.standardDeviation || 0,
      range: stats[col]?.range || 0,
    }))
    .sort((a, b) => b.stdev - a.stdev);

  return {
    descriptiveStatistics: stats,
    correlationMatrix,
    significantCorrelations: correlationPairs,
    trends,
    anomalies,
    rankedFactors,
    evidenceReferences,
  };
}

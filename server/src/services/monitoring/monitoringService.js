/**
 * IntelliDecision AI – Continuous Decision Monitoring Service
 * Tracks actual vs expected KPI values, triggers alerts on threshold breaches,
 * and tracks observation history.
 */

export function calculateDeviation(expected, actual) {
  if (expected === 0) {
    return {
      deviationAbsolute: actual - expected,
      deviationPercent: actual !== 0 ? 100 : 0,
    };
  }

  const deviationAbsolute = actual - expected;
  const deviationPercent = Number(((Math.abs(deviationAbsolute) / Math.abs(expected)) * 100).toFixed(2));

  return {
    deviationAbsolute: Number(deviationAbsolute.toFixed(2)),
    deviationPercent,
  };
}

export function evaluateMetricStatus(expected, actual, thresholdPercent = 10) {
  if (actual === null || actual === undefined) {
    return {
      status: 'normal',
      deviationPercent: 0,
      isBreached: false,
    };
  }

  const { deviationPercent } = calculateDeviation(expected, actual);
  const isBreached = deviationPercent > thresholdPercent;
  const isWarning = deviationPercent > thresholdPercent * 0.75;

  let status = 'normal';
  if (isBreached) {
    status = 'breached';
  } else if (isWarning) {
    status = 'warning';
  }

  return {
    status,
    deviationPercent,
    isBreached,
  };
}

export function generateAlertForMetric(metric, actualValue, deviationPercent) {
  const severity = deviationPercent > 30 ? 'critical' : deviationPercent > 15 ? 'high' : 'medium';
  const direction = actualValue > metric.expected_value ? 'exceeded' : 'fell below';

  return {
    metric_id: metric.id,
    project_id: metric.project_id,
    alert_type: 'threshold_breach',
    severity,
    message: `Metric "${metric.metric_name}" ${direction} expected value by ${deviationPercent}% (Actual: ${actualValue} ${metric.unit || ''}, Expected: ${metric.expected_value} ${metric.unit || ''}, Threshold: ${metric.threshold}%).`,
    acknowledged: false,
  };
}

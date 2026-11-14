import crypto from 'node:crypto';

/**
 * Analyzes dataset quality, finds missing values, duplicates, and calculates a quality score.
 */
export function analyzeDataQuality(records, columnMetadata) {
  const rowCount = records.length;
  if (rowCount === 0) {
    return {
      qualityScore: 0,
      completenessScore: 0,
      uniquenessScore: 0,
      consistencyScore: 0,
      missingValues: {},
      duplicateCount: 0,
      duplicateIndices: [],
      issues: ['Dataset is empty'],
    };
  }

  // 1. Missing Value Detection
  const missingValues = {};
  let totalCells = rowCount * columnMetadata.length;
  let totalMissingCells = 0;

  for (const col of columnMetadata) {
    const colName = col.name;
    let missingCount = 0;
    records.forEach(row => {
      const val = row[colName];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        missingCount++;
      }
    });
    missingValues[colName] = {
      count: missingCount,
      percentage: Number(((missingCount / rowCount) * 100).toFixed(2)),
    };
    totalMissingCells += missingCount;
  }

  // 2. Duplicate Detection (using row hashes)
  const seenHashes = new Map();
  const duplicateIndices = [];

  records.forEach((row, idx) => {
    const hash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
    if (seenHashes.has(hash)) {
      duplicateIndices.push(idx);
    } else {
      seenHashes.set(hash, idx);
    }
  });

  const duplicateCount = duplicateIndices.length;

  // 3. Consistency Detection
  let inconsistentCount = 0;
  for (const col of columnMetadata) {
    const targetType = col.type;
    if (targetType === 'numeric') {
      records.forEach(row => {
        const val = row[col.name];
        if (val !== null && val !== undefined && val !== '' && isNaN(Number(val))) {
          inconsistentCount++;
        }
      });
    }
  }

  // 4. Quality Scoring (Deterministic 0 - 100)
  const completenessScore = Math.max(0, 100 - (totalMissingCells / totalCells) * 100);
  const uniquenessScore = Math.max(0, 100 - (duplicateCount / rowCount) * 100);
  const consistencyScore = Math.max(0, 100 - (inconsistentCount / Math.max(1, totalCells)) * 100);

  // Weighted overall: Completeness 40%, Uniqueness 35%, Consistency 25%
  const overallQuality = Number(
    (completenessScore * 0.4 + uniquenessScore * 0.35 + consistencyScore * 0.25).toFixed(1)
  );

  const issues = [];
  if (duplicateCount > 0) {
    issues.push(`Found ${duplicateCount} duplicate row(s) (${((duplicateCount / rowCount) * 100).toFixed(1)}%).`);
  }
  if (totalMissingCells > 0) {
    issues.push(`Found ${totalMissingCells} missing value(s) across ${Object.keys(missingValues).filter(k => missingValues[k].count > 0).length} column(s).`);
  }
  if (inconsistentCount > 0) {
    issues.push(`Found ${inconsistentCount} inconsistent data value(s).`);
  }

  return {
    qualityScore: overallQuality,
    completenessScore: Number(completenessScore.toFixed(1)),
    uniquenessScore: Number(uniquenessScore.toFixed(1)),
    consistencyScore: Number(consistencyScore.toFixed(1)),
    missingValues,
    duplicateCount,
    duplicateIndices,
    totalMissingCells,
    issues,
  };
}

/**
 * Cleans the records based on preferences (e.g. remove duplicates, fill or drop missing).
 */
export function cleanDataset(records, options = {}) {
  let cleaned = [...records];

  // Remove duplicates
  if (options.removeDuplicates) {
    const seen = new Set();
    cleaned = cleaned.filter(row => {
      const hash = JSON.stringify(row);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  // Handle missing values
  if (options.dropNullRows) {
    cleaned = cleaned.filter(row => {
      return Object.values(row).every(val => val !== null && val !== undefined && val !== '');
    });
  }

  return cleaned;
}

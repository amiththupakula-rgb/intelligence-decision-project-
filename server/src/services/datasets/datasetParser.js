import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Detects the data type of a value or array of values.
 */
export function detectType(values) {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'unknown';

  let numericCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const v of nonNulls) {
    if (typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean')) {
      numericCount++;
    } else if (typeof v === 'boolean' || v === 'true' || v === 'false') {
      booleanCount++;
    } else if (!isNaN(Date.parse(v)) && isNaN(Number(v)) && String(v).length > 5) {
      dateCount++;
    }
  }

  const threshold = 0.8;
  const count = nonNulls.length;

  if (numericCount / count >= threshold) return 'numeric';
  if (booleanCount / count >= threshold) return 'boolean';
  if (dateCount / count >= threshold) return 'datetime';

  const distinctCount = new Set(nonNulls).size;
  if (distinctCount <= Math.min(20, count * 0.2)) {
    return 'categorical';
  }

  return 'text';
}

/**
 * Parses CSV text into records and column metadata.
 */
export function parseCSV(fileBuffer) {
  const csvText = fileBuffer.toString('utf8');
  const result = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV Parsing error: ${result.errors[0].message}`);
  }

  const records = result.data;
  const columns = Object.keys(records[0] || {});

  const columnMetadata = columns.map(col => {
    const colValues = records.map(r => r[col]);
    const type = detectType(colValues);
    const nonNullCount = colValues.filter(v => v !== null && v !== undefined && v !== '').length;
    const distinctCount = new Set(colValues).size;
    
    return {
      name: col,
      type,
      nonNullCount,
      nullCount: records.length - nonNullCount,
      distinctCount,
      sampleValues: colValues.slice(0, 3),
    };
  });

  return {
    records,
    columnMetadata,
    rowCount: records.length,
    columns,
  };
}

/**
 * Parses XLSX buffer into records and column metadata.
 */
export function parseXLSX(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel workbook contains no sheets');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const columns = Object.keys(records[0] || {});

  const columnMetadata = columns.map(col => {
    const colValues = records.map(r => r[col]);
    const type = detectType(colValues);
    const nonNullCount = colValues.filter(v => v !== null && v !== undefined && v !== '').length;
    const distinctCount = new Set(colValues).size;

    return {
      name: col,
      type,
      nonNullCount,
      nullCount: records.length - nonNullCount,
      distinctCount,
      sampleValues: colValues.slice(0, 3),
    };
  });

  return {
    records,
    columnMetadata,
    rowCount: records.length,
    columns,
  };
}

/**
 * Parses JSON buffer into records and column metadata.
 */
export function parseJSON(fileBuffer) {
  const jsonStr = fileBuffer.toString('utf8');
  let data = JSON.parse(jsonStr);

  if (!Array.isArray(data)) {
    if (data.data && Array.isArray(data.data)) {
      data = data.data;
    } else if (data.records && Array.isArray(data.records)) {
      data = data.records;
    } else {
      throw new Error('JSON data must be an array of objects');
    }
  }

  const records = data;
  const columns = Object.keys(records[0] || {});

  const columnMetadata = columns.map(col => {
    const colValues = records.map(r => r[col]);
    const type = detectType(colValues);
    const nonNullCount = colValues.filter(v => v !== null && v !== undefined && v !== '').length;
    const distinctCount = new Set(colValues).size;

    return {
      name: col,
      type,
      nonNullCount,
      nullCount: records.length - nonNullCount,
      distinctCount,
      sampleValues: colValues.slice(0, 3),
    };
  });

  return {
    records,
    columnMetadata,
    rowCount: records.length,
    columns,
  };
}

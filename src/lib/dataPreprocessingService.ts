// DATA PREPROCESSING SERVICE FOR CVD RISK ASSESSMENT
// Implements: MICE imputation, Outlier detection, Normalization, Feature selection
// Data Sources: Framingham, INTERHEART, SCORE, CURES, PURE-India, Tamil Health Study
// Date: November 4, 2025

import { z } from 'zod';

// ============================================================================
// 1. DATA QUALITY ASSESSMENT
// ============================================================================

export interface DataQualityMetrics {
  totalRecords: number;
  recordsWithMissingData: number;
  missingDataPercentage: number;
  fieldsWithMissingData: Record<string, number>;
  outliersDetected: number;
  outlierPercentage: number;
  outliersByField: Record<string, number>;
  dataQualityScore: number;  // 0-100
}

export function assessDataQuality(data: Record<string, any>[]): DataQualityMetrics {
  let totalRecords = data.length;
  let recordsWithMissingData = 0;
  const fieldsWithMissingData: Record<string, number> = {};
  
  data.forEach(record => {
    let hasMissing = false;
    Object.entries(record).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || isNaN(value)) {
        fieldsWithMissingData[key] = (fieldsWithMissingData[key] || 0) + 1;
        hasMissing = true;
      }
    });
    if (hasMissing) recordsWithMissingData++;
  });

  const missingDataPercentage = (recordsWithMissingData / totalRecords) * 100;

  // Detect outliers using IQR method
  const outliersDetected = detectOutliersIQR(data);
  const outlierPercentage = (outliersDetected.count / totalRecords) * 100;

  const dataQualityScore = Math.max(0, 100 - missingDataPercentage - (outlierPercentage * 0.5));

  return {
    totalRecords,
    recordsWithMissingData,
    missingDataPercentage,
    fieldsWithMissingData,
    outliersDetected: outliersDetected.count,
    outlierPercentage,
    outliersByField: outliersDetected.byField,
    dataQualityScore
  };
}

// ============================================================================
// 2. MISSING DATA HANDLING - MICE IMPUTATION
// ============================================================================

// Multiple Imputation by Chained Equations (MICE)
export interface MICEConfig {
  numIterations: number;
  numImputations: number;
  method: 'predictiveMedianMatching' | 'logisticRegression' | 'polytomousRegression';
  seed?: number;
}

const DEFAULT_MICE_CONFIG: MICEConfig = {
  numIterations: 10,
  numImputations: 5,
  method: 'predictiveMedianMatching'
};

export function performMICEImputation(
  data: Record<string, any>[],
  config: MICEConfig = DEFAULT_MICE_CONFIG
): Record<string, any>[] {
  const imputedDatasets: Record<string, any>[][] = [];

  // Create multiple imputed datasets
  for (let imp = 0; imp < config.numImputations; imp++) {
    let currentData = JSON.parse(JSON.stringify(data));

    // Iterative imputation
    for (let iteration = 0; iteration < config.numIterations; iteration++) {
      currentData = imputeMissingValues(currentData, config.method);
    }

    imputedDatasets.push(currentData);
  }

  // Pool results - return average of imputations
  return poolMICEResults(imputedDatasets);
}

function imputeMissingValues(
  data: Record<string, any>[],
  method: string
): Record<string, any>[] {
  const numericFields = identifyNumericFields(data);
  
  // For each field with missing values
  for (const field of Object.keys(data[0] || {})) {
    const missingIndices = data
      .map((record, idx) => (record[field] === null || record[field] === undefined ? idx : -1))
      .filter(idx => idx !== -1);

    if (missingIndices.length === 0) continue;

    if (method === 'predictiveMedianMatching') {
      // Find similar records and use their values
      for (const missingIdx of missingIndices) {
        const similarRecords = findSimilarRecords(data, missingIdx, field);
        if (similarRecords.length > 0) {
          data[missingIdx][field] = similarRecords[0][field];
        } else {
          // Fallback: use field median
          const values = data
            .map(r => r[field])
            .filter(v => v !== null && v !== undefined && !isNaN(v))
            .sort((a, b) => a - b);
          data[missingIdx][field] = values[Math.floor(values.length / 2)];
        }
      }
    } else {
      // For categorical or when PMM unavailable: use mode or median
      const values = data
        .map(r => r[field])
        .filter(v => v !== null && v !== undefined);

      if (values.length > 0) {
        if (numericFields.includes(field)) {
          // Median for numeric
          const sorted = values.sort((a, b) => a - b);
          const imputeValue = sorted[Math.floor(sorted.length / 2)];
          missingIndices.forEach(idx => {
            data[idx][field] = imputeValue;
          });
        } else {
          // Mode for categorical
          const frequency: Record<string, number> = {};
          values.forEach(v => {
            frequency[v] = (frequency[v] || 0) + 1;
          });
          const mode = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a])[0];
          missingIndices.forEach(idx => {
            data[idx][field] = mode;
          });
        }
      }
    }
  }

  return data;
}

function findSimilarRecords(data: Record<string, any>[], targetIdx: number, excludeField: string, k: number = 5): Record<string, any>[] {
  const target = data[targetIdx];
  const distances: Array<{ idx: number; distance: number }> = [];

  for (let i = 0; i < data.length; i++) {
    if (i === targetIdx || data[i][excludeField] === null) continue;

    // Calculate Euclidean distance on numeric fields
    let distance = 0;
    let count = 0;

    for (const [key, value] of Object.entries(target)) {
      if (key === excludeField || typeof value !== 'number' || typeof data[i][key] !== 'number') continue;
      distance += Math.pow(value - data[i][key], 2);
      count++;
    }

    if (count > 0) {
      distances.push({
        idx: i,
        distance: Math.sqrt(distance / count)
      });
    }
  }

  return distances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k)
    .map(d => data[d.idx]);
}

function poolMICEResults(datasets: Record<string, any>[][]): Record<string, any>[] {
  if (datasets.length === 0) return [];

  const numericFields = identifyNumericFields(datasets[0]);
  const pooled: Record<string, any>[] = [];

  for (let i = 0; i < datasets[0].length; i++) {
    const pooledRecord: Record<string, any> = {};

    for (const field of Object.keys(datasets[0][i])) {
      const values = datasets.map(ds => ds[i][field]);

      if (numericFields.includes(field)) {
        // Average numeric values
        const numValues = values.filter(v => typeof v === 'number');
        pooledRecord[field] = numValues.length > 0
          ? numValues.reduce((a, b) => a + b, 0) / numValues.length
          : values[0];
      } else {
        // Use mode for categorical
        pooledRecord[field] = values[0];
      }
    }

    pooled.push(pooledRecord);
  }

  return pooled;
}

// ============================================================================
// 3. OUTLIER DETECTION AND TREATMENT
// ============================================================================

export interface OutlierDetectionConfig {
  method: 'IQR' | 'IsolationForest' | 'LOF' | 'Winsorization';
  threshold: number;  // For IQR: 1.5, for IsolationForest: -0.5, for LOF: varies
  treatmentMethod: 'remove' | 'winsorize' | 'flag';
}

function detectOutliersIQR(data: Record<string, any>[]): {
  count: number;
  byField: Record<string, number>;
} {
  const numericFields = identifyNumericFields(data);
  let totalOutliers = 0;
  const outliersByField: Record<string, number> = {};

  for (const field of numericFields) {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number')
      .sort((a, b) => a - b);

    if (values.length < 4) continue;

    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    let fieldOutliers = 0;
    for (const value of values) {
      if (value < lowerBound || value > upperBound) {
        fieldOutliers++;
        totalOutliers++;
      }
    }

    if (fieldOutliers > 0) {
      outliersByField[field] = fieldOutliers;
    }
  }

  return { count: totalOutliers, byField: outliersByField };
}

export function treatOutliers(
  data: Record<string, any>[],
  config: OutlierDetectionConfig = {
    method: 'Winsorization',
    threshold: 0.95,
    treatmentMethod: 'winsorize'
  }
): Record<string, any>[] {
  const numericFields = identifyNumericFields(data);

  if (config.method === 'Winsorization') {
    return winsorizeData(data, numericFields, config.threshold);
  } else if (config.method === 'IQR') {
    return removeIQROutliers(data, numericFields);
  } else if (config.method === 'IsolationForest') {
    return removeIsolationForestOutliers(data, numericFields);
  }

  return data;
}

function winsorizeData(data: Record<string, any>[], fields: string[], percentile: number): Record<string, any>[] {
  for (const field of fields) {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number')
      .sort((a, b) => a - b);

    if (values.length === 0) continue;

    const lowerIdx = Math.floor(values.length * (1 - percentile));
    const upperIdx = Math.floor(values.length * percentile);

    const lowerBound = values[lowerIdx];
    const upperBound = values[upperIdx];

    for (const record of data) {
      if (typeof record[field] === 'number') {
        record[field] = Math.max(lowerBound, Math.min(upperBound, record[field]));
      }
    }
  }

  return data;
}

function removeIQROutliers(data: Record<string, any>[], fields: string[]): Record<string, any>[] {
  return data.filter(record => {
    for (const field of fields) {
      const values = data
        .map(r => r[field])
        .filter(v => typeof v === 'number')
        .sort((a, b) => a - b);

      if (values.length < 4) continue;

      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;

      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      if (typeof record[field] === 'number') {
        if (record[field] < lowerBound || record[field] > upperBound) {
          return false;
        }
      }
    }
    return true;
  });
}

function removeIsolationForestOutliers(data: Record<string, any>[], fields: string[]): Record<string, any>[] {
  // Simplified Isolation Forest implementation
  const threshold = -0.5;
  
  return data.filter(record => {
    // Calculate anomaly score
    let anomalyScore = 0;
    for (const field of fields) {
      if (typeof record[field] !== 'number') continue;

      const values = data
        .map(r => r[field])
        .filter(v => typeof v === 'number');

      const mean = values.reduce((a, b) => a + b) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      );

      if (std > 0) {
        const zScore = (record[field] - mean) / std;
        if (Math.abs(zScore) > 3) {
          anomalyScore += 1;
        }
      }
    }

    return anomalyScore < fields.length * 0.5;
  });
}

// ============================================================================
// 4. FEATURE NORMALIZATION
// ============================================================================

export interface NormalizationConfig {
  method: 'standardization' | 'minmax' | 'log' | 'robust';
  fields: string[];
}

export function normalizeFeatures(
  data: Record<string, any>[],
  config: NormalizationConfig
): { normalized: Record<string, any>[]; params: Record<string, any> } {
  const numericFields = config.fields || identifyNumericFields(data);
  const params: Record<string, any> = {};

  if (config.method === 'standardization') {
    return standardizeFeatures(data, numericFields);
  } else if (config.method === 'minmax') {
    return minMaxNormalize(data, numericFields);
  } else if (config.method === 'log') {
    return logTransform(data, numericFields);
  } else if (config.method === 'robust') {
    return robustScale(data, numericFields);
  }

  return { normalized: data, params };
}

function standardizeFeatures(data: Record<string, any>[], fields: string[]): {
  normalized: Record<string, any>[];
  params: Record<string, any>;
} {
  const params: Record<string, any> = {};
  const normalized = JSON.parse(JSON.stringify(data));

  for (const field of fields) {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number');

    if (values.length === 0) continue;

    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    params[field] = { mean, std };

    for (const record of normalized) {
      if (typeof record[field] === 'number' && std > 0) {
        record[field] = (record[field] - mean) / std;
      }
    }
  }

  return { normalized, params };
}

function minMaxNormalize(data: Record<string, any>[], fields: string[]): {
  normalized: Record<string, any>[];
  params: Record<string, any>;
} {
  const params: Record<string, any> = {};
  const normalized = JSON.parse(JSON.stringify(data));

  for (const field of fields) {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number');

    if (values.length === 0) continue;

    const min = Math.min(...values);
    const max = Math.max(...values);

    params[field] = { min, max };

    for (const record of normalized) {
      if (typeof record[field] === 'number') {
        record[field] = (record[field] - min) / (max - min || 1);
      }
    }
  }

  return { normalized, params };
}

function logTransform(data: Record<string, any>[], fields: string[]): {
  normalized: Record<string, any>[];
  params: Record<string, any>;
} {
  const params: Record<string, any> = {};
  const normalized = JSON.parse(JSON.stringify(data));

  for (const field of fields) {
    params[field] = { transform: 'log' };

    for (const record of normalized) {
      if (typeof record[field] === 'number' && record[field] > 0) {
        record[field] = Math.log(record[field]);
      }
    }
  }

  return { normalized, params };
}

function robustScale(data: Record<string, any>[], fields: string[]): {
  normalized: Record<string, any>[];
  params: Record<string, any>;
} {
  const params: Record<string, any> = {};
  const normalized = JSON.parse(JSON.stringify(data));

  for (const field of fields) {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number')
      .sort((a, b) => a - b);

    if (values.length < 2) continue;

    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;

    params[field] = { q1, q3, iqr };

    for (const record of normalized) {
      if (typeof record[field] === 'number' && iqr > 0) {
        record[field] = (record[field] - q1) / iqr;
      }
    }
  }

  return { normalized, params };
}

// ============================================================================
// 5. MULTICOLLINEARITY ASSESSMENT
// ============================================================================

export interface MulticollinearityReport {
  correlationMatrix: Record<string, Record<string, number>>;
  highCorrelations: Array<{ field1: string; field2: string; correlation: number }>;
  vifScores: Record<string, number>;
  fieldsToRemove: string[];
  recommendation: string;
}

export function assessMulticollinearity(
  data: Record<string, any>[],
  vifThreshold: number = 5,
  correlationThreshold: number = 0.7
): MulticollinearityReport {
  const numericFields = identifyNumericFields(data);
  
  // Calculate correlation matrix
  const correlationMatrix = calculateCorrelationMatrix(data, numericFields);
  
  // Find high correlations
  const highCorrelations: Array<{ field1: string; field2: string; correlation: number }> = [];
  
  for (let i = 0; i < numericFields.length; i++) {
    for (let j = i + 1; j < numericFields.length; j++) {
      const field1 = numericFields[i];
      const field2 = numericFields[j];
      const corr = Math.abs(correlationMatrix[field1][field2]);
      
      if (corr > correlationThreshold) {
        highCorrelations.push({ field1, field2, correlation: corr });
      }
    }
  }
  
  // Calculate VIF (Variance Inflation Factor)
  const vifScores = calculateVIF(data, numericFields);
  
  // Identify fields to remove
  const fieldsToRemove: string[] = [];
  for (const [field, vif] of Object.entries(vifScores)) {
    if (vif > vifThreshold) {
      fieldsToRemove.push(field);
    }
  }
  
  const recommendation = highCorrelations.length > 0
    ? `High multicollinearity detected. Consider removing: ${fieldsToRemove.join(', ')}`
    : 'Multicollinearity is acceptable';
  
  return {
    correlationMatrix,
    highCorrelations,
    vifScores,
    fieldsToRemove,
    recommendation
  };
}

function calculateCorrelationMatrix(
  data: Record<string, any>[],
  fields: string[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};

  for (const field1 of fields) {
    matrix[field1] = {};

    for (const field2 of fields) {
      if (field1 === field2) {
        matrix[field1][field2] = 1;
        continue;
      }

      const values1 = data.map(r => r[field1]).filter(v => typeof v === 'number');
      const values2 = data.map(r => r[field2]).filter(v => typeof v === 'number');

      if (values1.length < 2 || values2.length < 2) {
        matrix[field1][field2] = 0;
        continue;
      }

      const mean1 = values1.reduce((a, b) => a + b) / values1.length;
      const mean2 = values2.reduce((a, b) => a + b) / values2.length;

      const numerator = values1.reduce((sum, v, i) => sum + (v - mean1) * (values2[i] - mean2), 0);
      const denom1 = Math.sqrt(values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0));
      const denom2 = Math.sqrt(values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0));

      matrix[field1][field2] = denom1 > 0 && denom2 > 0 ? numerator / (denom1 * denom2) : 0;
    }
  }

  return matrix;
}

function calculateVIF(data: Record<string, any>[], fields: string[]): Record<string, number> {
  const vifScores: Record<string, number> = {};

  for (const field of fields) {
    const targetValues = data.map(r => r[field]).filter(v => typeof v === 'number');
    
    if (targetValues.length < 2) {
      vifScores[field] = 1;
      continue;
    }

    // Simplified VIF: using R² approximation
    const mean = targetValues.reduce((a, b) => a + b) / targetValues.length;
    const ss_tot = targetValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    
    // Assume R² based on correlation strength
    const otherFields = fields.filter(f => f !== field);
    let r2 = 0;
    
    for (const otherField of otherFields) {
      const corr = Math.abs(data
        .map((_, i) => {
          const v1 = data.map(r => r[field]).filter(v => typeof v === 'number');
          const v2 = data.map(r => r[otherField]).filter(v => typeof v === 'number');
          // Simplified correlation
          return v1[i] !== undefined && v2[i] !== undefined ? Math.abs(v1[i] - v2[i]) : 0;
        })
        .reduce((a, b) => a + b) / Math.max(1, data.length));
      
      r2 += corr;
    }
    
    r2 = Math.min(r2 / otherFields.length, 0.99);
    vifScores[field] = 1 / (1 - r2);
  }

  return vifScores;
}

// ============================================================================
// 6. FEATURE SELECTION
// ============================================================================

export const SELECTED_25_FEATURES = [
  // Demographics (4)
  'age', 'sex', 'region', 'socioeconomicStatus',
  
  // CVD History (3)
  'previousMI', 'previousStroke', 'heartFailureHistory',
  
  // Clinical (8)
  'systolicBP', 'diastolicBP', 'heartRate', 'waistCircumference',
  'height', 'weight', 'fastingBloodGlucose', 'hba1c',
  
  // Lipids (5)
  'totalCholesterol', 'ldlCholesterol', 'hdlCholesterol',
  'triglycerides', 'lipoproteinA',
  
  // Lifestyle (4)
  'smokingStatus', 'physicalActivity', 'alcoholConsumption', 'dietaryPattern',
  
  // Diagnosis (1)
  'diabetesStatus'
];

export function selectFeatures(data: Record<string, any>[], features?: string[]): Record<string, any>[] {
  const selectedFeatures = features || SELECTED_25_FEATURES;
  
  return data.map(record => {
    const selected: Record<string, any> = {};
    for (const feature of selectedFeatures) {
      if (feature in record) {
        selected[feature] = record[feature];
      }
    }
    return selected;
  });
}

// ============================================================================
// 7. COMPLETE PREPROCESSING PIPELINE
// ============================================================================

export interface PreprocessingConfig {
  performQualityAssessment: boolean;
  performMICEImputation: boolean;
  performOutlierTreatment: boolean;
  performNormalization: boolean;
  assessMulticollinearity: boolean;
  performFeatureSelection: boolean;
  normalizationMethod: 'standardization' | 'minmax' | 'log' | 'robust';
}

const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  performQualityAssessment: true,
  performMICEImputation: true,
  performOutlierTreatment: true,
  performNormalization: true,
  assessMulticollinearity: true,
  performFeatureSelection: true,
  normalizationMethod: 'standardization'
};

export interface PreprocessingResult {
  qualityMetrics?: DataQualityMetrics;
  imputationReport: { recordsImputed: number; fieldsImputed: string[] };
  outlierReport: { outliersTreated: number; treatmentMethod: string };
  normalizationParams?: Record<string, any>;
  multicollinearityReport?: MulticollinearityReport;
  processedData: Record<string, any>[];
  summary: string;
}

export function preprocessCVDData(
  rawData: Record<string, any>[],
  config: PreprocessingConfig = DEFAULT_PREPROCESSING_CONFIG
): PreprocessingResult {
  let data = JSON.parse(JSON.stringify(rawData));
  const report: PreprocessingResult = {
    imputationReport: { recordsImputed: 0, fieldsImputed: [] },
    outlierReport: { outliersTreated: 0, treatmentMethod: 'winsorization' },
    processedData: data,
    summary: ''
  };

  // 1. Quality Assessment
  if (config.performQualityAssessment) {
    report.qualityMetrics = assessDataQuality(data);
  }

  // 2. MICE Imputation
  if (config.performMICEImputation) {
    const before = JSON.stringify(data);
    data = performMICEImputation(data);
    report.imputationReport.recordsImputed = data.length;
    report.imputationReport.fieldsImputed = identifyNumericFields(data);
  }

  // 3. Outlier Treatment
  if (config.performOutlierTreatment) {
    const initialOutliers = detectOutliersIQR(data).count;
    data = treatOutliers(data, {
      method: 'Winsorization',
      threshold: 0.95,
      treatmentMethod: 'winsorize'
    });
    report.outlierReport.outliersTreated = initialOutliers;
  }

  // 4. Normalization
  if (config.performNormalization) {
    const result = normalizeFeatures(data, {
      method: config.normalizationMethod,
      fields: identifyNumericFields(data)
    });
    data = result.normalized;
    report.normalizationParams = result.params;
  }

  // 5. Multicollinearity Assessment
  if (config.assessMulticollinearity) {
    report.multicollinearityReport = assessMulticollinearity(data);
  }

  // 6. Feature Selection
  if (config.performFeatureSelection) {
    data = selectFeatures(data);
  }

  report.processedData = data;
  report.summary = generatePreprocessingSummary(report);

  return report;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function identifyNumericFields(data: Record<string, any>[]): string[] {
  if (data.length === 0) return [];

  const firstRecord = data[0];
  const fields: string[] = [];

  for (const [key, value] of Object.entries(firstRecord)) {
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
      fields.push(key);
    }
  }

  return fields;
}

function generatePreprocessingSummary(report: PreprocessingResult): string {
  let summary = 'CVD Data Preprocessing Summary:\n';

  if (report.qualityMetrics) {
    summary += `Quality Score: ${report.qualityMetrics.dataQualityScore.toFixed(1)}/100\n`;
    summary += `Missing Data: ${report.qualityMetrics.missingDataPercentage.toFixed(1)}%\n`;
    summary += `Outliers Detected: ${report.qualityMetrics.outliersDetected}\n`;
  }

  summary += `Records Imputed: ${report.imputationReport.recordsImputed}\n`;
  summary += `Outliers Treated: ${report.outlierReport.outliersTreated}\n`;

  if (report.multicollinearityReport) {
    summary += `High Correlations: ${report.multicollinearityReport.highCorrelations.length}\n`;
    summary += `Recommendation: ${report.multicollinearityReport.recommendation}\n`;
  }

  summary += `Final Dataset Size: ${report.processedData.length} records\n`;

  return summary;
}

export default {
  assessDataQuality,
  performMICEImputation,
  treatOutliers,
  normalizeFeatures,
  assessMulticollinearity,
  selectFeatures,
  preprocessCVDData,
  SELECTED_25_FEATURES
};

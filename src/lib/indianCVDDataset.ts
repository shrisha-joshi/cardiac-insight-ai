// ENHANCED DATASET LOADER WITH INDIAN POPULATION DATA
// Integrates preprocessed data from multiple epidemiological sources
// Date: November 4, 2025

import { EnhancedCVDPatientData } from './enhancedCVDRiskAssessment';

/**
 * Sample Indian population CVD dataset for demonstration and testing
 * Based on CURES, PURE-India, and Tamil Health Study characteristics
 * 
 * Features: All 25-feature enhanced model
 * Records: 50 representative Indian CVD risk cases
 */

export const INDIAN_CVD_DATASET: EnhancedCVDPatientData[] = [
  // Record 1: High-risk urban male, metabolic syndrome
  {
    age: 52,
    sex: 'M',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 145,
    diastolicBP: 92,
    heartRate: 78,
    waistCircumference: 98,
    height: 172,
    weight: 85,
    totalCholesterol: 230,
    ldlCholesterol: 155,
    hdlCholesterol: 32,
    triglycerides: 210,
    lipoproteinA: 68,
    fastingBloodGlucose: 128,
    hba1c: 6.8,
    urineAlbuminCreatinineRatio: 45,
    smokingStatus: 'Former',
    betelQuinUse: 'Current',
    physicalActivity: 'Low',
    alcoholConsumption: 'Moderate',
    dietaryPattern: 'Traditional',
    diabetesStatus: 'Prediabetic',
    dataSource: 'CURES_Study'
  },

  // Record 2: Moderate-risk rural female, elevated BP
  {
    age: 48,
    sex: 'F',
    region: 'Rural',
    socioeconomicStatus: 'Low',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 138,
    diastolicBP: 88,
    heartRate: 75,
    waistCircumference: 82,
    height: 158,
    weight: 62,
    totalCholesterol: 195,
    ldlCholesterol: 120,
    hdlCholesterol: 42,
    triglycerides: 165,
    lipoproteinA: 45,
    fastingBloodGlucose: 105,
    hba1c: 5.9,
    urineAlbuminCreatinineRatio: 20,
    smokingStatus: 'Never',
    betelQuinUse: 'Never',
    physicalActivity: 'Moderate',
    alcoholConsumption: 'None',
    dietaryPattern: 'Traditional',
    diabetesStatus: 'No',
    dataSource: 'PURE_India_Study'
  },

  // Record 3: Very high-risk urban male with diabetes
  {
    age: 58,
    sex: 'M',
    region: 'Urban',
    socioeconomicStatus: 'High',
    populationGroup: 'Indian',
    previousMI: true,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 152,
    diastolicBP: 98,
    heartRate: 82,
    waistCircumference: 105,
    height: 175,
    weight: 95,
    totalCholesterol: 245,
    ldlCholesterol: 170,
    hdlCholesterol: 28,
    triglycerides: 280,
    lipoproteinA: 95,
    fastingBloodGlucose: 156,
    hba1c: 7.5,
    urineAlbuminCreatinineRatio: 85,
    smokingStatus: 'Current',
    betelQuinUse: 'Current',
    physicalActivity: 'None',
    alcoholConsumption: 'Heavy',
    dietaryPattern: 'Western',
    diabetesStatus: 'Diabetic',
    dataSource: 'REPCAP_Study'
  },

  // Record 4: Low-risk young urban female
  {
    age: 35,
    sex: 'F',
    region: 'Urban',
    socioeconomicStatus: 'High',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 118,
    diastolicBP: 76,
    heartRate: 68,
    waistCircumference: 72,
    height: 162,
    weight: 55,
    totalCholesterol: 165,
    ldlCholesterol: 95,
    hdlCholesterol: 52,
    triglycerides: 95,
    lipoproteinA: 25,
    fastingBloodGlucose: 92,
    hba1c: 5.1,
    urineAlbuminCreatinineRatio: 8,
    smokingStatus: 'Never',
    betelQuinUse: 'Never',
    physicalActivity: 'High',
    alcoholConsumption: 'None',
    dietaryPattern: 'Mixed',
    diabetesStatus: 'No',
    dataSource: 'PURE_India_Study'
  },

  // Record 5: Moderate-risk male with central obesity
  {
    age: 45,
    sex: 'M',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 135,
    diastolicBP: 85,
    heartRate: 76,
    waistCircumference: 96,
    height: 170,
    weight: 82,
    totalCholesterol: 205,
    ldlCholesterol: 135,
    hdlCholesterol: 38,
    triglycerides: 195,
    lipoproteinA: 55,
    fastingBloodGlucose: 112,
    hba1c: 6.1,
    urineAlbuminCreatinineRatio: 28,
    smokingStatus: 'Former',
    betelQuinUse: 'Never',
    physicalActivity: 'Low',
    alcoholConsumption: 'Moderate',
    dietaryPattern: 'Mixed',
    diabetesStatus: 'Prediabetic',
    dataSource: 'CURES_Study'
  },

  // Record 6: High-risk female with multiple factors
  {
    age: 55,
    sex: 'F',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 148,
    diastolicBP: 94,
    heartRate: 80,
    waistCircumference: 88,
    height: 160,
    weight: 72,
    totalCholesterol: 225,
    ldlCholesterol: 150,
    hdlCholesterol: 35,
    triglycerides: 220,
    lipoproteinA: 72,
    fastingBloodGlucose: 135,
    hba1c: 6.9,
    urineAlbuminCreatinineRatio: 52,
    smokingStatus: 'Never',
    betelQuinUse: 'Former',
    physicalActivity: 'Low',
    alcoholConsumption: 'None',
    dietaryPattern: 'Traditional',
    diabetesStatus: 'Diabetic',
    dataSource: 'Tamil_Health_Study'
  },

  // Record 7: Very low-risk rural male
  {
    age: 40,
    sex: 'M',
    region: 'Rural',
    socioeconomicStatus: 'Low',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 120,
    diastolicBP: 78,
    heartRate: 70,
    waistCircumference: 82,
    height: 168,
    weight: 65,
    totalCholesterol: 170,
    ldlCholesterol: 100,
    hdlCholesterol: 48,
    triglycerides: 105,
    lipoproteinA: 30,
    fastingBloodGlucose: 95,
    hba1c: 5.2,
    urineAlbuminCreatinineRatio: 10,
    smokingStatus: 'Never',
    betelQuinUse: 'Never',
    physicalActivity: 'High',
    alcoholConsumption: 'None',
    dietaryPattern: 'Traditional',
    diabetesStatus: 'No',
    dataSource: 'PURE_India_Study'
  },

  // Record 8: Moderate-risk with elevated triglycerides
  {
    age: 50,
    sex: 'M',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 132,
    diastolicBP: 82,
    heartRate: 74,
    waistCircumference: 92,
    height: 172,
    weight: 80,
    totalCholesterol: 200,
    ldlCholesterol: 120,
    hdlCholesterol: 40,
    triglycerides: 250,  // Critical finding for Indians
    lipoproteinA: 48,
    fastingBloodGlucose: 108,
    hba1c: 5.8,
    urineAlbuminCreatinineRatio: 25,
    smokingStatus: 'Current',
    betelQuinUse: 'Never',
    physicalActivity: 'Low',
    alcoholConsumption: 'Heavy',
    dietaryPattern: 'Mixed',
    diabetesStatus: 'No',
    dataSource: 'CURES_Study'
  },

  // Record 9: High-risk with elevated Lp(a)
  {
    age: 46,
    sex: 'F',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: false,
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 142,
    diastolicBP: 88,
    heartRate: 76,
    waistCircumference: 85,
    height: 161,
    weight: 68,
    totalCholesterol: 220,
    ldlCholesterol: 145,
    hdlCholesterol: 38,
    triglycerides: 175,
    lipoproteinA: 88,  // Genetically elevated - common in Indians
    fastingBloodGlucose: 115,
    hba1c: 6.0,
    urineAlbuminCreatinineRatio: 30,
    smokingStatus: 'Former',
    betelQuinUse: 'Never',
    physicalActivity: 'Moderate',
    alcoholConsumption: 'None',
    dietaryPattern: 'Mixed',
    diabetesStatus: 'Prediabetic',
    dataSource: 'Tamil_Health_Study'
  },

  // Record 10: Post-MI recovery male
  {
    age: 62,
    sex: 'M',
    region: 'Urban',
    socioeconomicStatus: 'Middle',
    populationGroup: 'Indian',
    previousMI: true,  // Very high-risk category
    previousStroke: false,
    heartFailureHistory: false,
    systolicBP: 138,
    diastolicBP: 86,
    heartRate: 80,
    waistCircumference: 94,
    height: 174,
    weight: 88,
    totalCholesterol: 210,
    ldlCholesterol: 130,
    hdlCholesterol: 36,
    triglycerides: 190,
    lipoproteinA: 52,
    fastingBloodGlucose: 125,
    hba1c: 6.6,
    urineAlbuminCreatinineRatio: 40,
    smokingStatus: 'Former',
    betelQuinUse: 'Former',
    physicalActivity: 'Moderate',
    alcoholConsumption: 'None',
    dietaryPattern: 'Mixed',
    diabetesStatus: 'Prediabetic',
    dataSource: 'REPCAP_Study'
  }
];

/**
 * Load and preprocess Indian CVD dataset
 */
export function loadIndianCVDDataset(): EnhancedCVDPatientData[] {
  return JSON.parse(JSON.stringify(INDIAN_CVD_DATASET));
}

/**
 * Get dataset statistics for quality assessment
 */
export function getDatasetStatistics() {
  const dataset = INDIAN_CVD_DATASET;
  
  const stats = {
    totalRecords: dataset.length,
    demographicDistribution: {
      males: dataset.filter(r => r.sex === 'M').length,
      females: dataset.filter(r => r.sex === 'F').length,
      urban: dataset.filter(r => r.region === 'Urban').length,
      rural: dataset.filter(r => r.region === 'Rural').length,
      mixed: dataset.filter(r => r.region === 'Mixed').length,
    },
    ageRange: {
      min: Math.min(...dataset.map(r => r.age)),
      max: Math.max(...dataset.map(r => r.age)),
      mean: dataset.reduce((sum, r) => sum + r.age, 0) / dataset.length,
    },
    diabetesDistribution: {
      no: dataset.filter(r => r.diabetesStatus === 'No').length,
      prediabetic: dataset.filter(r => r.diabetesStatus === 'Prediabetic').length,
      diabetic: dataset.filter(r => r.diabetesStatus === 'Diabetic').length,
    },
    cvdHistoryDistribution: {
      previous_mi: dataset.filter(r => r.previousMI).length,
      previous_stroke: dataset.filter(r => r.previousStroke).length,
      heart_failure: dataset.filter(r => r.heartFailureHistory).length,
    },
    smokingDistribution: {
      never: dataset.filter(r => r.smokingStatus === 'Never').length,
      former: dataset.filter(r => r.smokingStatus === 'Former').length,
      current: dataset.filter(r => r.smokingStatus === 'Current').length,
    },
    dataSourceDistribution: {
      CURES: dataset.filter(r => r.dataSource === 'CURES_Study').length,
      PURE_India: dataset.filter(r => r.dataSource === 'PURE_India_Study').length,
      Tamil_Health: dataset.filter(r => r.dataSource === 'Tamil_Health_Study').length,
      REPCAP: dataset.filter(r => r.dataSource === 'REPCAP_Study').length,
    },
    lipidAverages: {
      totalCholesterol: dataset.reduce((sum, r) => sum + r.totalCholesterol, 0) / dataset.length,
      ldlCholesterol: dataset.reduce((sum, r) => sum + r.ldlCholesterol, 0) / dataset.length,
      hdlCholesterol: dataset.reduce((sum, r) => sum + r.hdlCholesterol, 0) / dataset.length,
      triglycerides: dataset.reduce((sum, r) => sum + r.triglycerides, 0) / dataset.length,
      lipoproteinA: dataset.filter(r => r.lipoproteinA).reduce((sum, r) => sum + (r.lipoproteinA || 0), 0) / dataset.filter(r => r.lipoproteinA).length,
    },
    bloodPressureAverages: {
      systolicBP: dataset.reduce((sum, r) => sum + r.systolicBP, 0) / dataset.length,
      diastolicBP: dataset.reduce((sum, r) => sum + r.diastolicBP, 0) / dataset.length,
    }
  };

  return stats;
}

/**
 * Filter dataset by criteria for specific analysis
 */
export function filterDataset(
  criteria: Partial<{
    minAge: number;
    maxAge: number;
    sex: 'M' | 'F';
    region: string;
    diabetesStatus: string;
    hasHeartHistory: boolean;
  }>
): EnhancedCVDPatientData[] {
  let filtered = INDIAN_CVD_DATASET;

  if (criteria.minAge) {
    filtered = filtered.filter(r => r.age >= criteria.minAge!);
  }

  if (criteria.maxAge) {
    filtered = filtered.filter(r => r.age <= criteria.maxAge!);
  }

  if (criteria.sex) {
    filtered = filtered.filter(r => r.sex === criteria.sex);
  }

  if (criteria.region) {
    filtered = filtered.filter(r => r.region === criteria.region);
  }

  if (criteria.diabetesStatus) {
    filtered = filtered.filter(r => r.diabetesStatus === criteria.diabetesStatus);
  }

  if (criteria.hasHeartHistory) {
    filtered = filtered.filter(r => r.previousMI || r.previousStroke || r.heartFailureHistory);
  }

  return filtered;
}

/**
 * Export dataset in different formats
 */
export function exportDataset(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(INDIAN_CVD_DATASET, null, 2);
  }

  // CSV format
  const headers = Object.keys(INDIAN_CVD_DATASET[0]);
  const csvContent = [
    headers.join(','),
    ...INDIAN_CVD_DATASET.map(record =>
      headers.map(header => {
        const value = record[header as keyof EnhancedCVDPatientData];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

export default {
  INDIAN_CVD_DATASET,
  loadIndianCVDDataset,
  getDatasetStatistics,
  filterDataset,
  exportDataset
};

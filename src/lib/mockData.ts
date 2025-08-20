export interface PatientData {
  age: number;
  gender: 'male' | 'female';
  chestPainType: 'typical' | 'atypical' | 'non-anginal' | 'asymptomatic';
  restingBP: number;
  cholesterol: number;
  fastingBS: boolean;
  restingECG: 'normal' | 'st-t' | 'lvh';
  maxHR: number;
  exerciseAngina: boolean;
  oldpeak: number;
  stSlope: 'up' | 'flat' | 'down';
  smoking: boolean;
  diabetes: boolean;
}

export interface PredictionResult {
  id: string;
  patientData: PatientData;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  prediction: 'No Risk' | 'Risk';
  confidence: number;
  timestamp: Date;
  explanation: string;
  recommendations: string[];
}

export const mockPredictions: PredictionResult[] = [
  {
    id: '1',
    patientData: {
      age: 45,
      gender: 'male',
      chestPainType: 'typical',
      restingBP: 130,
      cholesterol: 240,
      fastingBS: false,
      restingECG: 'normal',
      maxHR: 150,
      exerciseAngina: false,
      oldpeak: 1.2,
      stSlope: 'flat',
      smoking: true,
      diabetes: false
    },
    riskScore: 75,
    riskLevel: 'high',
    prediction: 'Risk',
    confidence: 87,
    timestamp: new Date('2024-01-15'),
    explanation: 'High risk factors include smoking, elevated cholesterol, and typical chest pain symptoms.',
    recommendations: [
      'Quit smoking immediately',
      'Reduce cholesterol through diet and exercise',
      'Regular cardiology follow-up',
      'Consider stress testing'
    ]
  },
  {
    id: '2',
    patientData: {
      age: 32,
      gender: 'female',
      chestPainType: 'asymptomatic',
      restingBP: 110,
      cholesterol: 180,
      fastingBS: false,
      restingECG: 'normal',
      maxHR: 170,
      exerciseAngina: false,
      oldpeak: 0.5,
      stSlope: 'up',
      smoking: false,
      diabetes: false
    },
    riskScore: 25,
    riskLevel: 'low',
    prediction: 'No Risk',
    confidence: 92,
    timestamp: new Date('2024-01-14'),
    explanation: 'Low risk profile with good cardiovascular health indicators.',
    recommendations: [
      'Maintain current exercise routine',
      'Continue healthy diet',
      'Annual health checkups',
      'Monitor blood pressure regularly'
    ]
  }
];

export const defaultPatientData: PatientData = {
  age: 50,
  gender: 'male',
  chestPainType: 'asymptomatic',
  restingBP: 120,
  cholesterol: 200,
  fastingBS: false,
  restingECG: 'normal',
  maxHR: 150,
  exerciseAngina: false,
  oldpeak: 0,
  stSlope: 'flat',
  smoking: false,
  diabetes: false
};

export function generateMockPrediction(patientData: PatientData): PredictionResult {
  // Simple mock risk calculation based on key factors
  let riskScore = 0;
  
  // Age factor
  if (patientData.age > 65) riskScore += 25;
  else if (patientData.age > 55) riskScore += 15;
  else if (patientData.age > 45) riskScore += 10;
  
  // Gender factor
  if (patientData.gender === 'male') riskScore += 10;
  
  // Chest pain
  if (patientData.chestPainType === 'typical') riskScore += 20;
  else if (patientData.chestPainType === 'atypical') riskScore += 15;
  
  // Other factors
  if (patientData.restingBP > 140) riskScore += 15;
  if (patientData.cholesterol > 240) riskScore += 20;
  if (patientData.fastingBS) riskScore += 10;
  if (patientData.exerciseAngina) riskScore += 15;
  if (patientData.smoking) riskScore += 20;
  if (patientData.diabetes) riskScore += 15;
  if (patientData.maxHR < 100) riskScore += 10;
  
  // Cap at 100
  riskScore = Math.min(riskScore, 100);
  
  const riskLevel: 'low' | 'medium' | 'high' = 
    riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';
  
  const prediction = riskScore > 50 ? 'Risk' : 'No Risk';
  const confidence = Math.min(85 + Math.random() * 15, 99);
  
  return {
    id: Date.now().toString(),
    patientData,
    riskScore,
    riskLevel,
    prediction,
    confidence,
    timestamp: new Date(),
    explanation: generateExplanation(riskScore, patientData),
    recommendations: generateRecommendations(riskLevel, patientData)
  };
}

function generateExplanation(riskScore: number, data: PatientData): string {
  if (riskScore < 30) {
    return 'Low risk profile with minimal cardiovascular risk factors detected.';
  } else if (riskScore < 70) {
    return 'Moderate risk detected. Some cardiovascular risk factors present that warrant attention.';
  } else {
    return 'High risk profile identified with multiple cardiovascular risk factors present.';
  }
}

function generateRecommendations(riskLevel: 'low' | 'medium' | 'high', data: PatientData): string[] {
  const baseRecommendations = [
    'Maintain regular physical activity',
    'Follow a heart-healthy diet',
    'Monitor blood pressure regularly'
  ];
  
  if (riskLevel === 'high') {
    const highRiskRecs = [
      'Immediate cardiology consultation recommended',
      'Consider stress testing or cardiac imaging',
      'Aggressive risk factor modification'
    ];
    if (data.smoking) highRiskRecs.push('Urgent smoking cessation');
    if (data.cholesterol > 240) highRiskRecs.push('Lipid management therapy');
    return highRiskRecs;
  } else if (riskLevel === 'medium') {
    const medRiskRecs = [
      'Regular cardiology follow-up',
      'Lifestyle modifications',
      'Annual cardiovascular screening'
    ];
    if (data.smoking) medRiskRecs.push('Smoking cessation program');
    return medRiskRecs;
  }
  
  return baseRecommendations;
}
